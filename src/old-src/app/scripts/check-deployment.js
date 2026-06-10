#!/usr/bin/env node

/**
 * HireVify Backend Deployment Checker
 * 
 * This script checks if the Supabase Edge Function is properly deployed
 * and accessible from the client.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bright}${colors.cyan}=== ${message} ===${colors.reset}`);
}

// Read environment variables
function loadEnvVars() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found', 'red');
    log('   Create .env.local with your Supabase credentials', 'yellow');
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });

  return env;
}

// Make HTTP request with better error handling
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    // Parse URL to get hostname and path
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (urlError) {
      reject({
        error: `Invalid URL: ${url}`,
        responseTime: 0
      });
      return;
    }

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'HireVify-Deployment-Checker/1.0',
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Cache-Control': 'no-cache',
        ...options.headers
      }
    };

    log(`   🔗 Request: ${requestOptions.method} ${urlObj.hostname}${requestOptions.path}`, 'cyan');
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data,
          responseTime,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      let errorMessage = error.message;
      
      // Provide more specific error messages
      if (error.code === 'ENOTFOUND') {
        errorMessage = `DNS resolution failed for ${urlObj.hostname}`;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = `Connection refused by ${urlObj.hostname}:${urlObj.port || 443}`;
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection timed out';
      } else if (error.code === 'ECONNRESET') {
        errorMessage = 'Connection reset by server';
      } else if (error.code === 'CERT_HAS_EXPIRED') {
        errorMessage = 'SSL certificate has expired';
      } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        errorMessage = 'SSL certificate verification failed';
      }
      
      reject({
        error: errorMessage,
        code: error.code,
        responseTime,
        url: url
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      reject({
        error: 'Request timeout (10s)',
        code: 'TIMEOUT',
        responseTime,
        url: url
      });
    });

    req.setTimeout(10000);

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test endpoint with comprehensive error handling
async function testEndpoint(name, url, description, options = {}) {
  log(`🔍 Testing ${name}...`, 'blue');
  log(`   ${description}`, 'white');
  log(`   URL: ${url}`, 'cyan');
  
  try {
    const result = await makeRequest(url, options);
    
    if (result.statusCode >= 200 && result.statusCode < 300) {
      log(`   ✅ SUCCESS (${result.statusCode} ${result.statusMessage || 'OK'}) - ${result.responseTime}ms`, 'green');
      
      // Try to parse response
      try {
        const parsed = JSON.parse(result.data);
        if (parsed.status || parsed.message) {
          log(`   📄 Response: ${parsed.status || parsed.message}`, 'white');
        }
        if (parsed.version) {
          log(`   📋 Version: ${parsed.version}`, 'white');
        }
      } catch (parseError) {
        if (result.data && result.data.length < 100 && result.data.trim()) {
          log(`   📄 Response: ${result.data.trim()}`, 'white');
        } else if (result.data.length > 0) {
          log(`   📄 Response: [${result.data.length} bytes of data]`, 'white');
        }
      }
      
      return { success: true, ...result };
    } else {
      log(`   ❌ HTTP ERROR ${result.statusCode} ${result.statusMessage || ''} - ${result.responseTime}ms`, 'red');
      
      // Provide specific guidance for common HTTP errors
      if (result.statusCode === 404) {
        log(`   💡 This endpoint doesn't exist - check if the function is deployed`, 'yellow');
      } else if (result.statusCode === 403) {
        log(`   💡 Access forbidden - check authentication or function permissions`, 'yellow');
      } else if (result.statusCode === 500) {
        log(`   💡 Server error - check function logs in Supabase dashboard`, 'yellow');
      } else if (result.statusCode === 502 || result.statusCode === 503) {
        log(`   💡 Service unavailable - function may be starting up or crashed`, 'yellow');
      }
      
      if (result.data && result.data.length > 0) {
        const errorPreview = result.data.substring(0, 300);
        log(`   📄 Error response: ${errorPreview}${result.data.length > 300 ? '...' : ''}`, 'red');
      }
      
      return { success: false, ...result };
    }
  } catch (error) {
    log(`   💥 NETWORK ERROR - ${error.responseTime || 0}ms`, 'red');
    log(`   📄 Error: ${error.error}`, 'red');
    
    // Provide specific guidance for network errors
    if (error.code === 'ENOTFOUND') {
      log(`   💡 DNS resolution failed - check if the Supabase project ID is correct`, 'yellow');
    } else if (error.code === 'ECONNREFUSED') {
      log(`   💡 Connection refused - the server may be down or unreachable`, 'yellow');
    } else if (error.code === 'TIMEOUT') {
      log(`   💡 Request timed out - the server may be slow or overloaded`, 'yellow');
    } else if (error.code === 'CERT_HAS_EXPIRED') {
      log(`   💡 SSL certificate expired - contact Supabase support`, 'yellow');
    } else if (error.error && error.error.includes('Failed to fetch')) {
      log(`   💡 Network fetch failed - check internet connection and firewall`, 'yellow');
    }
    
    return { success: false, error };
  }
}

// Main deployment check
async function runDeploymentCheck() {
  logHeader('HireVify Backend Deployment Check');
  
  // Load environment
  const env = loadEnvVars();
  if (!env) {
    process.exit(1);
  }

  const projectId = env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!projectId) {
    log('❌ NEXT_PUBLIC_SUPABASE_PROJECT_ID not found in .env.local', 'red');
    process.exit(1);
  }

  if (!anonKey) {
    log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local', 'red');
    process.exit(1);
  }

  log(`📋 Project ID: ${projectId}`, 'white');
  log(`🔑 Anon Key: ${anonKey.substring(0, 20)}...`, 'white');

  const baseUrl = `https://${projectId}.supabase.co`;
  
  logHeader('Step 1: Basic Supabase Connectivity');
  
  // Test basic Supabase connectivity
  const restApiResult = await testEndpoint(
    'Supabase REST API',
    `${baseUrl}/rest/v1/`,
    'Basic Supabase project connectivity'
  );

  const functionsBaseResult = await testEndpoint(
    'Supabase Functions Base',
    `${baseUrl}/functions/v1/`,
    'Edge Functions service availability'
  );

  // If both basic tests failed, likely a DNS or project issue
  if (!restApiResult.success && !functionsBaseResult.success) {
    log('🚨 CRITICAL: Cannot reach Supabase at all', 'red');
    log('   This suggests either:', 'yellow');
    log('   1. Incorrect project ID in environment variables', 'yellow');
    log('   2. Network connectivity issues', 'yellow');
    log('   3. Supabase service outage', 'yellow');
    log('   4. DNS resolution problems', 'yellow');
    console.log(''); // Add spacing
  }

  logHeader('Step 2: Edge Function Health Checks');

  const functionBase = `${baseUrl}/functions/v1/make-server-d4feca44`;
  
  // Test various health endpoints
  const healthTests = [
    {
      name: 'Public Health Text',
      path: '/public-health-text',
      description: 'Ultra-simple text endpoint (no auth, no JSON)'
    },
    {
      name: 'Public Health Check',
      path: '/public-health-check', 
      description: 'Public JSON health endpoint (no auth required)'
    },
    {
      name: 'Main Health',
      path: '/health',
      description: 'Main server health endpoint'
    },
    {
      name: 'Integration Health',
      path: '/integration-health',
      description: 'Integration service health'
    },
    {
      name: 'Ultra Ping',
      path: '/ultra-ping',
      description: 'Ultra-simple ping endpoint'
    }
  ];

  const results = [];
  
  for (const test of healthTests) {
    const result = await testEndpoint(
      test.name,
      `${functionBase}${test.path}`,
      test.description
    );
    results.push({ ...test, ...result });
  }

  logHeader('Step 3: Integration Service Tests');

  // Test integration-specific endpoints
  const integrationTests = [
    {
      name: 'Integration Status',
      path: '/integrations/status',
      description: 'Integration module status check'
    },
    {
      name: 'Integration Health',
      path: '/integrations/health',
      description: 'Integration service health'
    },
    {
      name: 'Integration Routes',
      path: '/integrations/test-routes',
      description: 'Available integration routes'
    }
  ];

  for (const test of integrationTests) {
    const result = await testEndpoint(
      test.name,
      `${functionBase}${test.path}`,
      test.description
    );
    results.push({ ...test, ...result });
  }

  logHeader('Step 4: Authenticated Endpoint Test');

  // Test an authenticated endpoint
  await testEndpoint(
    'Integration Debug Auth',
    `${functionBase}/integrations/debug-auth`,
    'Test authentication middleware',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`
      }
    }
  );

  logHeader('Summary');

  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  if (successful === 0) {
    log('🚨 CRITICAL: All endpoints failed', 'red');
    log('   This indicates the Edge Function is not deployed or accessible', 'red');
    log('   Check your Supabase dashboard and ensure the function is deployed', 'yellow');
  } else if (successful < total) {
    log(`⚠️  PARTIAL: ${successful}/${total} endpoints working`, 'yellow');
    log('   Some endpoints are accessible but others are failing', 'yellow');
    log('   The backend may have deployment or configuration issues', 'yellow');
  } else {
    log(`✅ EXCELLENT: All ${total} endpoints working`, 'green');
    log('   Backend is fully operational and accessible', 'green');
  }

  logHeader('Recommendations');

  if (successful === 0) {
    log('1. Check Supabase Dashboard for function deployment status', 'white');
    log('2. Verify the Edge Function "make-server-d4feca44" exists', 'white');
    log('3. Check Supabase project status and quotas', 'white');
    log('4. Ensure environment variables are correct', 'white');
  } else if (successful < total) {
    log('1. Check server logs for specific endpoint errors', 'white');
    log('2. Verify all route modules are properly imported', 'white');
    log('3. Check for CORS or middleware configuration issues', 'white');
  } else {
    log('1. Backend is healthy - integration issues may be client-side', 'white');
    log('2. Check browser console for any client-side errors', 'white');
    log('3. Verify authentication tokens are valid', 'white');
  }

  console.log('\n');
}

// Run the check
if (require.main === module) {
  runDeploymentCheck().catch(error => {
    log(`💥 Deployment check failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runDeploymentCheck };
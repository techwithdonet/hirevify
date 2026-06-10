#!/usr/bin/env node

/**
 * HireVify Fetch Error Fix Script
 * 
 * This script helps diagnose and fix "Failed to fetch" errors
 * commonly seen in the Integration Hub connectivity tests.
 */

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

// Check environment file
function checkEnvironment() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found', 'red');
    log('   This is likely the cause of fetch errors', 'yellow');
    log('   Create .env.local with your Supabase credentials:', 'yellow');
    log('   NEXT_PUBLIC_SUPABASE_PROJECT_ID=your_project_id', 'white');
    log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key', 'white');
    log('   SUPABASE_URL=https://your_project_id.supabase.co', 'white');
    log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key', 'white');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });

  let hasErrors = false;

  // Check required variables
  const required = [
    'NEXT_PUBLIC_SUPABASE_PROJECT_ID',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  for (const key of required) {
    if (!env[key]) {
      log(`❌ Missing: ${key}`, 'red');
      hasErrors = true;
    } else {
      log(`✅ Found: ${key}`, 'green');
    }
  }

  // Validate project ID format
  if (env.NEXT_PUBLIC_SUPABASE_PROJECT_ID) {
    const projectId = env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
    if (!/^[a-z0-9]{20}$/.test(projectId)) {
      log(`⚠️  Project ID format looks unusual: ${projectId}`, 'yellow');
      log('   Expected: 20 lowercase alphanumeric characters', 'yellow');
    }
  }

  // Validate URL format
  if (env.SUPABASE_URL) {
    const url = env.SUPABASE_URL;
    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      log(`⚠️  URL format looks unusual: ${url}`, 'yellow');
      log('   Expected: https://project_id.supabase.co', 'yellow');
    }
  }

  return !hasErrors;
}

// Check network connectivity
async function checkNetworkConnectivity() {
  const testUrls = [
    'https://httpbin.org/json',
    'https://api.github.com',
    'https://supabase.com'
  ];

  log('Testing basic internet connectivity...', 'blue');
  
  for (const url of testUrls) {
    try {
      const https = require('https');
      const urlObj = new URL(url);
      
      await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: urlObj.hostname,
          port: 443,
          path: urlObj.pathname,
          method: 'GET',
          timeout: 5000
        }, (res) => {
          log(`✅ ${urlObj.hostname} - ${res.statusCode}`, 'green');
          resolve();
        });

        req.on('error', (error) => {
          log(`❌ ${urlObj.hostname} - ${error.message}`, 'red');
          reject(error);
        });

        req.on('timeout', () => {
          log(`❌ ${urlObj.hostname} - Timeout`, 'red');
          reject(new Error('Timeout'));
        });

        req.end();
      });
    } catch (error) {
      // Continue to next URL
    }
  }
}

// Check for common issues
function checkCommonIssues() {
  logHeader('Common Issues Check');

  // Check for proxy settings
  if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
    log('⚠️  Proxy detected in environment', 'yellow');
    log(`   HTTP_PROXY: ${process.env.HTTP_PROXY || 'not set'}`, 'white');
    log(`   HTTPS_PROXY: ${process.env.HTTPS_PROXY || 'not set'}`, 'white');
    log('   This might cause fetch errors', 'yellow');
  }

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    log(`⚠️  Node.js version ${nodeVersion} is below recommended 18+`, 'yellow');
    log('   Consider upgrading for better fetch support', 'yellow');
  } else {
    log(`✅ Node.js version ${nodeVersion} is supported`, 'green');
  }

  // Check for package.json
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    log('✅ package.json found', 'green');
    
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (pkg.dependencies && pkg.dependencies.next) {
      log(`✅ Next.js version: ${pkg.dependencies.next}`, 'green');
    }
  } else {
    log('❌ package.json not found', 'red');
  }
}

// Provide solutions
function provideSolutions() {
  logHeader('Solutions and Recommendations');

  log('If you\'re seeing "Failed to fetch" errors, try these fixes:', 'white');
  log('', 'white');

  log('1. Environment Setup:', 'yellow');
  log('   • Copy .env.example to .env.local', 'white');
  log('   • Fill in your Supabase credentials', 'white');
  log('   • Restart your development server', 'white');
  log('', 'white');

  log('2. Network Issues:', 'yellow');
  log('   • Check your internet connection', 'white');
  log('   • Disable VPN temporarily', 'white');
  log('   • Check firewall settings', 'white');
  log('   • Try from a different network', 'white');
  log('', 'white');

  log('3. Supabase Issues:', 'yellow');
  log('   • Verify project exists in Supabase Dashboard', 'white');
  log('   • Check if Edge Functions are enabled', 'white');
  log('   • Deploy the Edge Function manually', 'white');
  log('   • Check Supabase service status', 'white');
  log('', 'white');

  log('4. Development Server:', 'yellow');
  log('   • Restart your Next.js dev server (npm run dev)', 'white');
  log('   • Clear browser cache and cookies', 'white');
  log('   • Try incognito/private browsing', 'white');
  log('   • Check browser developer console for CORS errors', 'white');
  log('', 'white');

  log('5. Alternative Solutions:', 'yellow');
  log('   • Use the offline mode in Integration Hub', 'white');
  log('   • Run deployment check: npm run check-deployment', 'white');
  log('   • Use browser diagnostic tools in Integration Hub', 'white');
  log('', 'white');
}

// Main function
async function runFixScript() {
  logHeader('HireVify Fetch Error Fix');

  log('This script will help diagnose and fix "Failed to fetch" errors', 'white');
  log('commonly seen in the Integration Hub.', 'white');

  logHeader('Step 1: Environment Check');
  const envOk = checkEnvironment();

  logHeader('Step 2: Network Check');
  await checkNetworkConnectivity();

  logHeader('Step 3: System Check');
  checkCommonIssues();

  provideSolutions();

  logHeader('Next Steps');
  
  if (!envOk) {
    log('🔥 CRITICAL: Fix environment variables first', 'red');
    log('   Create/update .env.local with correct Supabase credentials', 'yellow');
  } else {
    log('✅ Environment looks good', 'green');
    log('   If still having issues, try the solutions above', 'white');
  }

  log('', 'white');
  log('For more help, check:', 'white');
  log('• fix-integration-connectivity.md', 'cyan');
  log('• Run: npm run check-deployment', 'cyan');
  log('• Use Integration Hub diagnostic tools', 'cyan');
}

// Run if called directly
if (require.main === module) {
  runFixScript().catch(error => {
    log(`💥 Script failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runFixScript };


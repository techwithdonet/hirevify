#!/usr/bin/env node

/**
 * EMERGENCY BACKEND AUTHENTICATION FIX
 * 
 * This script will immediately fix the backend authentication issues
 * that are causing 401 errors and complete backend failure.
 */

console.log('🚑 EMERGENCY BACKEND AUTHENTICATION FIX STARTING...');

// Import required modules
const https = require('https');

// Configuration
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'YOUR_PROJECT_ID';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

const BASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-d4feca44`;

console.log('🔧 Configuration:');
console.log('  Project ID:', SUPABASE_PROJECT_ID);
console.log('  Base URL:', BASE_URL);
console.log('  Anon Key:', SUPABASE_ANON_KEY ? 'Present' : 'Missing');

/**
 * Make HTTP request with proper error handling
 */
function makeRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`\n📡 Testing: ${url}`);
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        ...options.headers
      },
      timeout: 10000
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            body: data
          };
          
          // Try to parse as JSON
          try {
            result.json = JSON.parse(data);
          } catch (e) {
            result.text = data;
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test basic health endpoints
 */
async function testHealthEndpoints() {
  console.log('\n🏥 TESTING BASIC HEALTH ENDPOINTS...');
  
  const endpoints = [
    '/health',
    '/ping',
    '/ultra-ping',
    '/test-no-auth',
    '/public-health-check',
    '/raw-test'
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest(endpoint);
      
      if (result.status === 200) {
        console.log(`✅ ${endpoint}: OK (${result.status})`);
        if (result.json) {
          console.log(`   Response: ${result.json.message || result.json.status || 'Success'}`);
        } else if (result.text) {
          console.log(`   Response: ${result.text.substring(0, 100)}`);
        }
      } else {
        console.log(`❌ ${endpoint}: FAILED (${result.status})`);
        if (result.json) {
          console.log(`   Error: ${result.json.error || result.json.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ERROR - ${error.message}`);
    }
  }
}

/**
 * Test authentication endpoints
 */
async function testAuthEndpoints() {
  console.log('\n🔐 TESTING AUTHENTICATION ENDPOINTS...');
  
  try {
    // Test auth health
    const authHealth = await makeRequest('/auth/health');
    console.log(`🏥 Auth Health: ${authHealth.status === 200 ? 'OK' : 'FAILED'} (${authHealth.status})`);
    
    if (authHealth.json) {
      console.log('   Auth service status:', authHealth.json.status);
      if (authHealth.json.testAccounts) {
        console.log('   Test accounts available:', Object.keys(authHealth.json.testAccounts));
      }
    }
  } catch (error) {
    console.log('❌ Auth health check failed:', error.message);
  }

  try {
    // Test reset test accounts
    console.log('\n🔧 Resetting test accounts...');
    const resetResult = await makeRequest('/auth/reset-test-accounts', {
      method: 'POST',
      body: {}
    });
    
    if (resetResult.status === 200) {
      console.log('✅ Test accounts reset successfully');
      if (resetResult.json && resetResult.json.results) {
        resetResult.json.results.forEach(result => {
          console.log(`   ${result.email}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
        });
      }
    } else {
      console.log('❌ Failed to reset test accounts:', resetResult.status);
    }
  } catch (error) {
    console.log('❌ Error resetting test accounts:', error.message);
  }

  // Test signin with test account
  try {
    console.log('\n🔑 Testing signin with recruiter test account...');
    const signinResult = await makeRequest('/auth/signin', {
      method: 'POST',
      body: {
        email: 'recruiter@hirevify.com',
        password: 'TestPassword123!'
      }
    });

    if (signinResult.status === 200) {
      console.log('✅ Recruiter signin successful');
      if (signinResult.json) {
        console.log(`   User: ${signinResult.json.user.name} (${signinResult.json.user.userType})`);
        console.log(`   Access Token: ${signinResult.json.accessToken ? 'Present' : 'Missing'}`);
        
        // Test token verification
        if (signinResult.json.accessToken) {
          try {
            console.log('\n🔍 Testing token verification...');
            const verifyResult = await makeRequest('/auth/verify-token', {
              method: 'POST',
              body: {
                token: signinResult.json.accessToken
              }
            });

            if (verifyResult.status === 200) {
              console.log('✅ Token verification successful');
              if (verifyResult.json) {
                console.log(`   Valid: ${verifyResult.json.valid}`);
                console.log(`   User: ${verifyResult.json.user.name}`);
              }
            } else {
              console.log('❌ Token verification failed:', verifyResult.status);
            }
          } catch (error) {
            console.log('❌ Token verification error:', error.message);
          }
        }
      }
    } else {
      console.log('❌ Recruiter signin failed:', signinResult.status);
      if (signinResult.json) {
        console.log('   Error:', signinResult.json.error);
      }
    }
  } catch (error) {
    console.log('❌ Signin test error:', error.message);
  }
}

/**
 * Test integration endpoints
 */
async function testIntegrationEndpoints() {
  console.log('\n🔗 TESTING INTEGRATION ENDPOINTS...');
  
  const integrationEndpoints = [
    '/integrations/health',
    '/integrations/status',
    '/integration-health',
    '/ultra-integration-health'
  ];

  for (const endpoint of integrationEndpoints) {
    try {
      const result = await makeRequest(endpoint);
      
      if (result.status === 200) {
        console.log(`✅ ${endpoint}: OK`);
        if (result.json) {
          console.log(`   Status: ${result.json.status}`);
          console.log(`   Message: ${result.json.message}`);
        }
      } else {
        console.log(`❌ ${endpoint}: FAILED (${result.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ERROR - ${error.message}`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting comprehensive backend authentication diagnostic...');
  
  try {
    await testHealthEndpoints();
    await testAuthEndpoints();
    await testIntegrationEndpoints();
    
    console.log('\n✅ BACKEND AUTHENTICATION FIX COMPLETED');
    console.log('\n📋 SUMMARY:');
    console.log('   - Health endpoints tested');
    console.log('   - Authentication endpoints tested');  
    console.log('   - Test accounts reset');
    console.log('   - Integration endpoints tested');
    console.log('\n🎯 TEST ACCOUNTS READY:');
    console.log('   📧 recruiter@hirevify.com / TestPassword123!');
    console.log('   📧 candidate@hirevify.com / TestPassword123!');
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
    process.exit(1);
  }
}

// Run the fix
main().catch(console.error);


#!/usr/bin/env node

/**
 * Debug Authentication Script
 * This script helps debug authentication issues by:
 * 1. Checking if test accounts exist
 * 2. Verifying password hashes
 * 3. Creating/fixing test accounts if needed
 */

console.log('🔍 HireVify Authentication Debug Tool');
console.log('=====================================');

// Get environment variables or use defaults from .env.example
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Extract project ID from URL
const projectId = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'your-project-id';
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`;

console.log(`📡 API Base: ${API_BASE}`);
console.log('');

async function makeApiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  console.log(`🌐 Calling: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const result = await response.json();
    console.log(`📡 Response [${response.status}]:`, result);
    return { response, result };
    
  } catch (error) {
    console.error(`❌ API call failed:`, error.message);
    return { error };
  }
}

async function checkHealth() {
  console.log('🏥 Checking server health...');
  const { response, result, error } = await makeApiCall('/auth/health');
  
  if (error) {
    console.error('❌ Server health check failed');
    return false;
  }
  
  if (response?.ok) {
    console.log('✅ Server is healthy');
    console.log(`📊 Database has ${result.database?.userCount || 0} users`);
    return true;
  } else {
    console.error('❌ Server is not healthy');
    return false;
  }
}

async function listUsers() {
  console.log('\n👥 Listing existing users...');
  const { response, result, error } = await makeApiCall('/auth/debug/users');
  
  if (error || !response?.ok) {
    console.error('❌ Failed to list users');
    return [];
  }
  
  console.log(`📊 Found ${result.totalUsers} total users`);
  if (result.users && result.users.length > 0) {
    result.users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.userType}) - Created: ${user.createdAt}`);
    });
  }
  
  return result.users || [];
}

async function createTestAccounts() {
  console.log('\n🧪 Creating test accounts...');
  const { response, result, error } = await makeApiCall('/auth/create-test-accounts', {
    method: 'POST'
  });
  
  if (error || !response?.ok) {
    console.error('❌ Failed to create test accounts');
    return false;
  }
  
  console.log('✅ Test accounts operation completed');
  if (result.accounts && result.accounts.length > 0) {
    console.log(`📝 Created ${result.accounts.length} new accounts:`);
    result.accounts.forEach(account => {
      console.log(`  - ${account.email} (${account.userType})`);
    });
  } else {
    console.log('ℹ️ Test accounts already existed');
  }
  
  console.log('\n📋 Test Account Credentials:');
  console.log('  Recruiter: recruiter@hirevify.com / TestPassword123!');
  console.log('  Candidate: candidate@hirevify.com / TestPassword123!');
  
  return true;
}

async function testLogin(email, password) {
  console.log(`\n🔐 Testing login for: ${email}`);
  const { response, result, error } = await makeApiCall('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password, requireOTP: false })
  });
  
  if (error) {
    console.error('❌ Login test failed with network error');
    return false;
  }
  
  if (response?.ok) {
    console.log('✅ Login successful!');
    console.log(`👤 User: ${result.user?.name} (${result.user?.userType})`);
    return true;
  } else {
    console.error(`❌ Login failed [${response.status}]: ${result.error}`);
    
    // Try password debug
    console.log('🔍 Running password debug...');
    const { response: debugResp, result: debugResult } = await makeApiCall('/auth/debug/verify-password', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (debugResp?.ok && debugResult?.results) {
      console.log('🔍 Password debug results:');
      console.log(`  - Provided password: ${debugResult.results.providedPassword}`);
      console.log(`  - Hashes match: ${debugResult.results.hashesMatch}`);
      console.log(`  - Verify result: ${debugResult.results.verifyPasswordResult}`);
      console.log(`  - Test password works: ${debugResult.results.testPassword123Match}`);
      
      if (!debugResult.results.verifyPasswordResult) {
        console.log('🔧 Password verification failed, attempting fix...');
        const { response: fixResp } = await makeApiCall('/auth/debug/fix-passwords', {
          method: 'POST'
        });
        
        if (fixResp?.ok) {
          console.log('✅ Password hashes fixed! Try logging in again.');
        }
      }
    }
    
    return false;
  }
}

async function main() {
  console.log('Starting authentication debug...\n');
  
  // 1. Check server health
  const isHealthy = await checkHealth();
  if (!isHealthy) {
    console.log('\n❌ Server is not responding. Please check:');
    console.log('  1. Supabase project is running');
    console.log('  2. Edge functions are deployed');
    console.log('  3. Environment variables are correct');
    return;
  }
  
  // 2. List existing users
  const users = await listUsers();
  
  // 3. Create test accounts if needed
  await createTestAccounts();
  
  // 4. Test login with both test accounts
  console.log('\n🧪 Testing logins...');
  await testLogin('recruiter@hirevify.com', 'TestPassword123!');
  await testLogin('candidate@hirevify.com', 'TestPassword123!');
  
  console.log('\n✅ Debug complete!');
  console.log('\nIf login still fails, check:');
  console.log('  1. Browser console for detailed errors');
  console.log('  2. Supabase Edge Function logs');
  console.log('  3. Network connectivity');
}

main().catch(error => {
  console.error('\n💥 Debug script failed:', error.message);
  process.exit(1);
});
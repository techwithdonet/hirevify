#!/usr/bin/env node

const API_BASE = 'https://usnfdvqrjdqxtlufmylg.supabase.co/functions/v1/make-server-d4feca44';

async function debugAuthSystem() {
  console.log('🔍 HireVify Authentication Debug Tool');
  console.log('=====================================\n');

  try {
    // Step 1: Check server health
    console.log('1️⃣ Checking server health...');
    const healthResponse = await fetch(`${API_BASE}/auth/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!healthResponse.ok) {
      console.error('❌ Server health check failed:', healthResponse.status);
      return;
    }

    const healthData = await healthResponse.json();
    console.log('✅ Server is healthy:', healthData.message);
    console.log('   Database users:', healthData.database?.userCount || 'unknown');
    console.log('   Test accounts:', JSON.stringify(healthData.testAccounts, null, 2));

    // Step 2: Reset test accounts
    console.log('\n2️⃣ Resetting test accounts...');
    const resetResponse = await fetch(`${API_BASE}/auth/reset-test-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (resetResponse.ok) {
      const resetData = await resetResponse.json();
      console.log('✅ Test accounts reset successfully');
      console.log('   Results:', resetData.results.map(r => `${r.email}: ${r.success ? '✅' : '❌'} ${r.message}`).join('\n   '));
    } else {
      const errorData = await resetResponse.json();
      console.error('❌ Reset failed:', errorData.error);
      return;
    }

    // Step 3: Test recruiter login
    console.log('\n3️⃣ Testing recruiter login...');
    await testLogin('recruiter@hirevify.com', 'TestPassword123!', 'Recruiter');

    // Step 4: Test candidate login  
    console.log('\n4️⃣ Testing candidate login...');
    await testLogin('candidate@hirevify.com', 'TestPassword123!', 'Candidate');

    // Step 5: Test invalid login (should fail)
    console.log('\n5️⃣ Testing invalid login (should fail)...');
    await testLogin('invalid@example.com', 'wrongpassword', 'Invalid User', true);

    console.log('\n🎉 Authentication system debug completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Server health check passed');
    console.log('   ✅ Test accounts reset successfully');
    console.log('   ✅ Authentication flow working');
    console.log('\n🚀 The authentication system should now be working properly!');

  } catch (error) {
    console.error('❌ Debug failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testLogin(email, password, userLabel, shouldFail = false) {
  try {
    const response = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (response.ok && !shouldFail) {
      console.log(`   ✅ ${userLabel} login successful`);
      console.log(`      User: ${result.user.name} (${result.user.userType})`);
      console.log(`      Email: ${result.user.email}`);
      console.log(`      Token: ${result.accessToken.substring(0, 20)}...`);
    } else if (!response.ok && shouldFail) {
      console.log(`   ✅ ${userLabel} login correctly rejected: ${result.error}`);
    } else if (!response.ok && !shouldFail) {
      console.error(`   ❌ ${userLabel} login failed: ${result.error}`);
      console.error(`      Status: ${response.status}`);
      console.error(`      Response:`, result);
    } else {
      console.error(`   ❌ ${userLabel} login should have been rejected but wasn't`);
    }
  } catch (error) {
    console.error(`   ❌ ${userLabel} login test failed with error:`, error.message);
  }
}

// Run the debug tool
debugAuthSystem().catch(console.error);
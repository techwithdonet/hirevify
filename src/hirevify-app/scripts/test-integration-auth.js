#!/usr/bin/env node

// Test script to debug integration authentication flow
const fs = require('fs');
const path = require('path');

// Read environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
    });
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const PROJECT_ID = SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split('.')[0] : null;

if (!PROJECT_ID) {
  console.error('❌ Could not extract project ID from SUPABASE_URL');
  process.exit(1);
}

const API_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/make-server-d4feca44`;

console.log('🧪 Integration Authentication Test');
console.log('📋 API Base:', API_BASE);
console.log('');

async function testIntegrationAuth() {
  try {
    // Step 1: Test sign in
    console.log('🔐 Step 1: Signing in...');
    const signInResponse = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: 'recruiter@hirevify.com',
        password: 'TestPassword123!'
      })
    });

    const signInData = await signInResponse.json();
    
    if (!signInResponse.ok) {
      console.error('❌ Sign in failed:', signInData);
      return;
    }

    console.log('✅ Sign in successful');
    console.log('👤 User:', signInData.user.email, '(' + signInData.user.userType + ')');
    console.log('🎫 Token:', signInData.accessToken.substring(0, 20) + '...');
    console.log('');

    const accessToken = signInData.accessToken;

    // Step 2: Test session debug
    console.log('🔍 Step 2: Testing session debug...');
    const sessionDebugResponse = await fetch(`${API_BASE}/auth/debug-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        token: accessToken
      })
    });

    const sessionDebugData = await sessionDebugResponse.json();
    
    if (sessionDebugResponse.ok) {
      console.log('✅ Session debug successful');
      console.log('📋 Session details:', {
        exists: sessionDebugData.exists,
        email: sessionDebugData.session?.email,
        userType: sessionDebugData.session?.userType,
        isExpired: sessionDebugData.session?.isExpired,
        userExists: sessionDebugData.user?.exists
      });
    } else {
      console.log('❌ Session debug failed:', sessionDebugData);
    }
    console.log('');

    // Step 3: Test integration auth debug
    console.log('🔗 Step 3: Testing integration auth debug...');
    const integrationAuthResponse = await fetch(`${API_BASE}/integrations/debug-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const integrationAuthData = await integrationAuthResponse.json();
    
    if (integrationAuthResponse.ok) {
      console.log('✅ Integration auth debug successful');
      console.log('👤 Authenticated user:', integrationAuthData.user.email, '(' + integrationAuthData.user.userType + ')');
      console.log('🔧 Auth method:', integrationAuthData.debug?.authMethod);
    } else {
      console.log('❌ Integration auth debug failed:', integrationAuthResponse.status, integrationAuthData);
      console.log('🔍 Debug info:', integrationAuthData.debug);
    }
    console.log('');

    // Step 4: Test integration list
    console.log('📋 Step 4: Testing integration list...');
    const integrationListResponse = await fetch(`${API_BASE}/integrations/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const integrationListData = await integrationListResponse.json();
    
    if (integrationListResponse.ok) {
      console.log('✅ Integration list successful');
      console.log('📋 Integrations count:', integrationListData.count);
    } else {
      console.log('❌ Integration list failed:', integrationListResponse.status, integrationListData);
    }

    console.log('');
    console.log('🎯 Test completed!');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

testIntegrationAuth();


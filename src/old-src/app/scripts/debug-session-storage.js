#!/usr/bin/env node

// Script to debug session storage issues
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

console.log('🔍 Session Storage Debug Test');
console.log('📋 API Base:', API_BASE);
console.log('');

async function debugSessionStorage() {
  try {
    // Step 1: Sign in and get token
    console.log('🔐 Step 1: Signing in to get a fresh token...');
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

    if (!signInResponse.ok) {
      const errorData = await signInResponse.json();
      console.error('❌ Sign in failed:', errorData);
      return;
    }

    const signInData = await signInResponse.json();
    console.log('✅ Sign in successful');
    console.log('🎫 Token format:', {
      length: signInData.accessToken.length,
      prefix: signInData.accessToken.substring(0, 20) + '...',
      containsUUID: signInData.accessToken.includes('-'),
      containsTimestamp: signInData.accessToken.includes('_')
    });

    const accessToken = signInData.accessToken;

    // Step 2: Immediately check if session exists in auth service
    console.log('');
    console.log('🔍 Step 2: Checking session in auth service...');
    const sessionCheckResponse = await fetch(`${API_BASE}/auth/debug-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        token: accessToken
      })
    });

    const sessionCheckData = await sessionCheckResponse.json();
    
    if (sessionCheckResponse.ok && sessionCheckData.exists) {
      console.log('✅ Session exists in auth service');
      console.log('📋 Session details:', {
        email: sessionCheckData.session.email,
        userType: sessionCheckData.session.userType,
        isExpired: sessionCheckData.session.isExpired,
        userExists: sessionCheckData.user.exists
      });
    } else {
      console.log('❌ Session NOT found in auth service:', sessionCheckData);
      return;
    }

    // Step 3: Try integration auth immediately after sign in
    console.log('');
    console.log('🔗 Step 3: Testing integration auth with fresh token...');
    const integrationAuthResponse = await fetch(`${API_BASE}/integrations/debug-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const integrationAuthData = await integrationAuthResponse.json();
    
    if (integrationAuthResponse.ok) {
      console.log('✅ Integration auth successful');
      console.log('👤 User:', integrationAuthData.user.email, '(' + integrationAuthData.user.userType + ')');
    } else {
      console.log('❌ Integration auth failed:', integrationAuthResponse.status);
      console.log('🔍 Error details:', integrationAuthData);
      console.log('🔍 Debug info:', integrationAuthData.debug);
      
      // If integration auth failed but auth service worked, there's a KV access issue
      console.log('');
      console.log('🚨 DIAGNOSIS: Session exists in auth service but integration service cannot access it');
      console.log('🔧 This indicates a KV store access issue in the integration service');
    }

    // Step 4: Test a simple KV operation from integration service
    console.log('');
    console.log('🗄️ Step 4: Testing if integration service can access KV store...');
    
    // We'll use the health endpoint to see if it can access KV
    const healthResponse = await fetch(`${API_BASE}/integrations/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Integration service health check passed');
      console.log('📋 Service status:', healthData.status);
    } else {
      console.log('❌ Integration service health check failed');
    }

    console.log('');
    console.log('🎯 Debug completed!');

  } catch (error) {
    console.error('💥 Debug failed with error:', error.message);
  }
}

debugSessionStorage();
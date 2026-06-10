#!/usr/bin/env node

/**
 * HireVify Backend Health Check Script
 * Run this to diagnose why your app is in offline mode
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    log('✅ Found .env.local file', colors.green);
    return true;
  } else {
    log('❌ No .env.local file found', colors.red);
    log('💡 Create .env.local with your Supabase credentials', colors.yellow);
    return false;
  }
}

function checkEnvironmentVariables() {
  log('\n🔍 Checking Environment Variables...', colors.bold);
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const optionalVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];
  
  let allGood = true;
  
  // Check required variables
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: ${process.env[varName].substring(0, 20)}...`, colors.green);
    } else {
      log(`❌ ${varName}: Not set`, colors.red);
      allGood = false;
    }
  });
  
  // Check optional variables
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: Set`, colors.blue);
    } else {
      log(`⚠️  ${varName}: Not set (optional)`, colors.yellow);
    }
  });
  
  return allGood;
}

function testBackendHealth() {
  return new Promise((resolve) => {
    log('\n🏥 Testing Backend Health...', colors.bold);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !anonKey) {
      log('❌ Cannot test backend - missing credentials', colors.red);
      resolve(false);
      return;
    }
    
    const healthUrl = `${supabaseUrl}/functions/v1/make-server-d4feca44/health`;
    log(`🔗 Testing: ${healthUrl}`, colors.blue);
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${anonKey}`
      },
      timeout: 10000
    };
    
    const req = https.request(healthUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            log('✅ Backend is healthy!', colors.green);
            log(`📊 Status: ${parsed.status}`, colors.green);
            log(`🕒 Timestamp: ${parsed.timestamp}`, colors.green);
            log(`🔢 Version: ${parsed.version}`, colors.green);
            log(`🛠️  Services: ${parsed.services?.join(', ')}`, colors.green);
            resolve(true);
          } catch (e) {
            log('⚠️  Backend responded but with invalid JSON', colors.yellow);
            log(`Response: ${data}`, colors.yellow);
            resolve(false);
          }
        } else {
          log(`❌ Backend returned status ${res.statusCode}`, colors.red);
          log(`Response: ${data}`, colors.red);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      log(`❌ Connection failed: ${error.message}`, colors.red);
      
      if (error.code === 'ENOTFOUND') {
        log('💡 DNS lookup failed - check your Supabase URL', colors.yellow);
      } else if (error.code === 'ECONNREFUSED') {
        log('💡 Connection refused - backend might not be deployed', colors.yellow);
      } else if (error.code === 'TIMEOUT') {
        log('💡 Request timed out - backend might be slow to respond', colors.yellow);
      }
      
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.abort();
      log('❌ Request timed out after 10 seconds', colors.red);
      resolve(false);
    });
    
    req.end();
  });
}

function showSolutions(hasEnv, hasVars, hasBackend) {
  log('\n🔧 Solutions:', colors.bold);
  
  if (!hasEnv) {
    log('\n1️⃣ Create .env.local file:', colors.yellow);
    log('   Copy .env.example to .env.local and fill in your values');
  }
  
  if (!hasVars) {
    log('\n2️⃣ Set Environment Variables:', colors.yellow);
    log('   Get your Supabase URL and anon key from the dashboard');
    log('   https://supabase.com/dashboard/project/lfwfwnqoioqyxnbzlnje/settings/api');
  }
  
  if (!hasBackend) {
    log('\n3️⃣ Deploy Backend Functions:', colors.yellow);
    log('   npm install -g supabase');
    log('   supabase login');
    log('   supabase functions deploy --project-ref lfwfwnqoioqyxnbzlnje');
  }
  
  log('\n📖 For detailed instructions, see: PRODUCTION_SETUP.md', colors.blue);
}

async function main() {
  log('🚀 HireVify Backend Health Check\n', colors.bold + colors.blue);
  
  // Load environment variables from .env.local
  require('dotenv').config({ path: '.env.local' });
  
  const hasEnv = checkEnvFile();
  const hasVars = checkEnvironmentVariables();
  const hasBackend = await testBackendHealth();
  
  log('\n📋 Summary:', colors.bold);
  log(`Environment file: ${hasEnv ? '✅' : '❌'}`, hasEnv ? colors.green : colors.red);
  log(`Environment vars: ${hasVars ? '✅' : '❌'}`, hasVars ? colors.green : colors.red);
  log(`Backend health: ${hasBackend ? '✅' : '❌'}`, hasBackend ? colors.green : colors.red);
  
  if (hasEnv && hasVars && hasBackend) {
    log('\n🎉 Everything looks good! Your app should be in connected mode.', colors.green);
  } else {
    showSolutions(hasEnv, hasVars, hasBackend);
  }
}

// Install dotenv if it's not available
try {
  require('dotenv');
} catch (e) {
  console.log('Installing dotenv...');
  require('child_process').execSync('npm install dotenv', { stdio: 'inherit' });
}

main().catch(console.error);


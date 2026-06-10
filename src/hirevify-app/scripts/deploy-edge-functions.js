#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 HireVify Edge Function Deployment Script');
console.log('===========================================\n');

// Check if we're in the right directory
const currentDir = process.cwd();
const packageJsonPath = path.join(currentDir, 'package.json');
const supabaseFunctionsPath = path.join(currentDir, 'supabase', 'functions');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root directory.');
  process.exit(1);
}

if (!fs.existsSync(supabaseFunctionsPath)) {
  console.error('❌ Error: /supabase/functions directory not found.');
  console.error('   Make sure you have the Supabase functions directory in your project.');
  process.exit(1);
}

// Check if Supabase CLI is installed
try {
  execSync('supabase --version', { stdio: 'ignore' });
  console.log('✅ Supabase CLI is installed');
} catch (error) {
  console.error('❌ Supabase CLI is not installed or not in PATH');
  console.error('   Please install it with: npm install -g supabase');
  console.error('   Or visit: https://supabase.com/docs/guides/cli');
  process.exit(1);
}

// Get project ID from info.tsx if it exists
let projectId = null;
const infoPath = path.join(currentDir, 'utils', 'supabase', 'info.tsx');
if (fs.existsSync(infoPath)) {
  try {
    const infoContent = fs.readFileSync(infoPath, 'utf8');
    const match = infoContent.match(/export const projectId = ["']([^"']+)["']/);
    if (match) {
      projectId = match[1];
      console.log(`✅ Found project ID: ${projectId}`);
    }
  } catch (error) {
    console.log('⚠️  Could not read project ID from info.tsx');
  }
}

// Function to run shell commands with proper error handling
function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  console.log(`   Running: ${command}`);
  
  try {
    const output = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: currentDir 
    });
    
    if (output.trim()) {
      console.log(`   Output: ${output.trim()}`);
    }
    console.log(`✅ ${description} completed successfully`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(`   Error: ${error.message}`);
    if (error.stdout) {
      console.error(`   Stdout: ${error.stdout}`);
    }
    if (error.stderr) {
      console.error(`   Stderr: ${error.stderr}`);
    }
    throw error;
  }
}

async function deployFunctions() {
  try {
    console.log('\n📋 Pre-deployment Checks');
    console.log('========================');
    
    // Check if user is logged in
    try {
      const authOutput = runCommand('supabase projects list', 'Checking Supabase authentication');
      console.log('✅ Successfully authenticated with Supabase');
    } catch (error) {
      console.error('\n❌ Not authenticated with Supabase');
      console.error('   Please run: supabase login');
      console.error('   Then try this deployment script again');
      process.exit(1);
    }
    
    // Check if project is linked
    let isLinked = false;
    try {
      const statusOutput = runCommand('supabase status', 'Checking project link status');
      isLinked = !statusOutput.includes('supabase init') && !statusOutput.includes('supabase link');
      if (isLinked) {
        console.log('✅ Project is linked to Supabase');
      }
    } catch (error) {
      console.log('⚠️  Project link status unclear, will attempt to link if needed');
    }
    
    // Link project if not linked and we have a project ID
    if (!isLinked && projectId) {
      console.log(`\n🔗 Linking to project: ${projectId}`);
      try {
        runCommand(`supabase link --project-ref ${projectId}`, 'Linking to Supabase project');
      } catch (error) {
        console.error('❌ Failed to link project. Please run manually:');
        console.error(`   supabase link --project-ref ${projectId}`);
        process.exit(1);
      }
    } else if (!isLinked) {
      console.error('\n❌ Project is not linked and no project ID found');
      console.error('   Please run: supabase link --project-ref YOUR_PROJECT_ID');
      console.error('   Or: supabase link (and select from list)');
      process.exit(1);
    }
    
    console.log('\n🚀 Starting Edge Function Deployment');
    console.log('===================================');
    
    // List available functions
    const functions = fs.readdirSync(supabaseFunctionsPath).filter(item => {
      return fs.statSync(path.join(supabaseFunctionsPath, item)).isDirectory();
    });
    
    console.log(`📁 Found ${functions.length} function(s): ${functions.join(', ')}`);
    
    // Deploy all functions
    runCommand('supabase functions deploy', 'Deploying all edge functions');
    
    console.log('\n🎉 Deployment Complete!');
    console.log('======================');
    console.log('✅ All edge functions have been deployed successfully');
    
    if (projectId) {
      console.log(`\n🔍 Your functions are available at:`);
      functions.forEach(func => {
        console.log(`   https://${projectId}.supabase.co/functions/v1/${func}`);
      });
    }
    
    console.log('\n📖 Next Steps:');
    console.log('1. Test your functions using the Integration Hub diagnostics');
    console.log('2. Check function logs in the Supabase dashboard if there are issues');
    console.log('3. Ensure all required environment variables are set');
    
    if (projectId) {
      console.log(`4. View logs at: https://supabase.com/dashboard/project/${projectId}/functions`);
    }
    
  } catch (error) {
    console.error('\n💥 Deployment failed!');
    console.error('====================');
    console.error('The deployment process encountered an error.');
    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Make sure you are authenticated: supabase login');
    console.error('2. Ensure your project is linked: supabase link');
    console.error('3. Check your internet connection');
    console.error('4. Verify your Supabase project has edge functions enabled');
    console.error('5. Check the Supabase status page: https://status.supabase.com/');
    
    process.exit(1);
  }
}

// Run the deployment
deployFunctions();


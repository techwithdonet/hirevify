/**
 * Script to create test accounts for HireVify
 * This script can be run manually or called programmatically
 */

const API_BASE = process.env.VITE_API_BASE || 'http://localhost:8000';

async function createTestAccounts() {
  console.log('🧪 Creating test accounts for HireVify...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/create-test-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'demo-key'}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test accounts created successfully!');
      console.log('\n📋 Available test accounts:');
      console.log('='.repeat(50));
      
      if (result.instructions) {
        Object.entries(result.instructions).forEach(([type, credentials]) => {
          console.log(`${type.toUpperCase()}: ${credentials}`);
        });
      }
      
      if (result.accounts) {
        console.log('\n👥 Created accounts:');
        result.accounts.forEach(account => {
          console.log(`  • ${account.email} (${account.userType}) - ${account.name}`);
        });
      }
      
      console.log('\n🎯 You can now use these credentials to test the application!');
      console.log('   Note: For OTP verification, check the server console for codes');
      
    } else {
      const error = await response.json();
      console.log('⚠️ Test account creation response:', error.message);
      
      if (error.message.includes('already exists')) {
        console.log('✅ Test accounts already exist. You can use:');
        console.log('   Recruiter: recruiter@hirevify.com / TestPassword123!');
        console.log('   Candidate: candidate@hirevify.com / TestPassword123!');
        console.log('   Admin: admin@hirevify.com / AdminPassword123!');
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to create test accounts:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Make sure the server is running:');
      console.log('   • Check that Supabase functions are deployed');
      console.log('   • Verify API_BASE URL is correct');
      console.log('   • Ensure network connectivity');
    }
  }
}

// Auto-create test accounts for development
async function autoCreateTestAccounts() {
  // Only run in development mode
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    // Wait a bit for services to start up
    setTimeout(async () => {
      await createTestAccounts();
    }, 5000);
  }
}

// Export functions for programmatic use
module.exports = {
  createTestAccounts,
  autoCreateTestAccounts
};

// Run if called directly
if (require.main === module) {
  createTestAccounts();
}
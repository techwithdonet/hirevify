// Quick integration test that can be run from browser console
// Usage: copy and paste this entire function into browser console and run quickIntegrationTest()

import { apiBaseUrl, projectId } from '../supabase/info';

interface QuickIntegrationResult {
  endpoint: string;
  url: string;
  status: number | null;
  ok: boolean;
  headers?: Record<string, string>;
  data?: unknown;
  text?: string;
  error?: string;
}

declare global {
  interface Window {
    quickIntegrationTest?: typeof quickIntegrationTest;
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function quickIntegrationTest() {
  console.log('🔍 Quick Integration Test Starting...');
  console.log('📍 Project ID:', projectId);
  
  const baseUrl = apiBaseUrl;
  console.log('🌐 Base URL:', baseUrl);
  
  const endpoints = [
    '/ultra-integration-health',
    '/simple-test', 
    '/ultra-ping',
    '/integration-health',
    '/integrations/health'
  ];
  
  const results: QuickIntegrationResult[] = [];
  
  for (const endpoint of endpoints) {
    const url = baseUrl + endpoint;
    console.log(`\n🔄 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Note: Add Authorization header if needed - this is for console testing
          // 'Authorization': 'Bearer your-anon-key-here'
        }
      });
      
      const result: QuickIntegrationResult = {
        endpoint,
        url,
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      };
      
      if (response.ok) {
        try {
          result.data = await response.json();
          console.log(`✅ ${endpoint}: SUCCESS (${response.status})`);
          console.log('   Data:', result.data);
        } catch {
          result.text = await response.text();
          console.log(`✅ ${endpoint}: SUCCESS (${response.status}) - Text response`);
          console.log('   Text:', result.text);
        }
      } else {
        const errorText = await response.text();
        result.error = errorText;
        console.log(`❌ ${endpoint}: FAILED (${response.status})`);
        console.log('   Error:', errorText);
        console.log('   Headers:', result.headers);
      }
      
      results.push(result);
      
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const result: QuickIntegrationResult = {
        endpoint,
        url,
        status: null,
        ok: false,
        error: errorMessage
      };
      
      results.push(result);
      console.log(`❌ ${endpoint}: NETWORK ERROR`);
      console.log('   Error:', errorMessage);
    }
  }
  
  // Summary
  const working = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);
  
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Working: ${working.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (working.length > 0) {
    console.log('\n✅ Working endpoints:');
    working.forEach(r => console.log(`   - ${r.endpoint} (${r.status})`));
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failed.forEach(r => console.log(`   - ${r.endpoint} (${r.status || 'Network Error'})`));
    
    // Analyze the most common error
    const status401Count = failed.filter(r => r.status === 401).length;
    const status404Count = failed.filter(r => r.status === 404).length;
    const networkErrorCount = failed.filter(r => r.status === null).length;
    
    console.log('\n🔍 ERROR ANALYSIS:');
    if (status401Count > 0) {
      console.log(`   - ${status401Count} endpoints returning 401 (authentication issue)`);
      console.log('   - SOLUTION: Check if endpoints are properly defined as public before middleware');
    }
    if (status404Count > 0) {
      console.log(`   - ${status404Count} endpoints returning 404 (routing issue)`);
      console.log('   - SOLUTION: Check if Edge Function is deployed and routes are correctly mounted');
    }
    if (networkErrorCount > 0) {
      console.log(`   - ${networkErrorCount} endpoints with network errors`);
      console.log('   - SOLUTION: Check internet connection and Edge Function deployment');
    }
  }
  
  if (working.length === 0) {
    console.log('\n💡 RECOMMENDED ACTIONS:');
    console.log('1. Check if the Supabase Edge Function is deployed');
    console.log('2. Verify the project ID is correct');
    console.log('3. Check Supabase Edge Function logs for errors');
    console.log('4. Ensure public endpoints are defined before any middleware');
  }
  
  return {
    summary: { working: working.length, failed: failed.length },
    results,
    projectId,
    baseUrl
  };
}

// Make it available globally for easy console access
if (typeof window !== 'undefined') {
  window.quickIntegrationTest = quickIntegrationTest;
  console.log('🔧 Quick Integration Test loaded. Run quickIntegrationTest() in console to test endpoints.');
}





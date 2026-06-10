import { projectId, publicAnonKey } from '../supabase/info';

// Comprehensive diagnostic tool for integration issues
export async function runIntegrationDiagnostics() {
  console.log('🔍 Starting comprehensive integration diagnostics...');
  
  const results = {
    timestamp: new Date().toISOString(),
    projectId: projectId,
    baseUrl: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`,
    tests: []
  };

  // Test 1: Basic connectivity
  console.log('🔍 Test 1: Basic connectivity...');
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/ultra-ping`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });
    results.tests.push({
      name: 'Basic Connectivity',
      endpoint: '/ultra-ping',
      status: response.status,
      ok: response.ok,
      data: response.ok ? await response.json() : await response.text(),
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    results.tests.push({
      name: 'Basic Connectivity',
      endpoint: '/ultra-ping',
      status: null,
      ok: false,
      error: error.message
    });
  }

  // Test 2: CORS preflight
  console.log('🔍 Test 2: CORS preflight...');
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/ultra-integration-health`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });
    results.tests.push({
      name: 'CORS Preflight',
      endpoint: '/ultra-integration-health',
      method: 'OPTIONS',
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    results.tests.push({
      name: 'CORS Preflight',
      endpoint: '/ultra-integration-health',
      method: 'OPTIONS',
      status: null,
      ok: false,
      error: error.message
    });
  }

  // Test 3: Ultra integration health
  console.log('🔍 Test 3: Ultra integration health...');
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/ultra-integration-health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });
    results.tests.push({
      name: 'Ultra Integration Health',
      endpoint: '/ultra-integration-health',
      status: response.status,
      ok: response.ok,
      data: response.ok ? await response.json() : await response.text(),
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    results.tests.push({
      name: 'Ultra Integration Health',
      endpoint: '/ultra-integration-health',
      status: null,
      ok: false,
      error: error.message
    });
  }

  // Test 4: Simple test endpoint
  console.log('🔍 Test 4: Simple test endpoint...');
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/simple-test`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });
    results.tests.push({
      name: 'Simple Test',
      endpoint: '/simple-test',
      status: response.status,
      ok: response.ok,
      data: response.ok ? await response.json() : await response.text(),
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    results.tests.push({
      name: 'Simple Test',
      endpoint: '/simple-test',
      status: null,
      ok: false,
      error: error.message
    });
  }

  // Test 5: Integration module health (with auth issues)
  console.log('🔍 Test 5: Integration module health...');
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/health`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });
    results.tests.push({
      name: 'Integration Module Health',
      endpoint: '/integrations/health',
      status: response.status,
      ok: response.ok,
      data: response.ok ? await response.json() : await response.text(),
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    results.tests.push({
      name: 'Integration Module Health',
      endpoint: '/integrations/health',
      status: null,
      ok: false,
      error: error.message
    });
  }

  // Test 6: Network diagnostics
  console.log('🔍 Test 6: Network diagnostics...');
  const networkInfo = {
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    connection: (navigator as any).connection ? {
      effectiveType: (navigator as any).connection.effectiveType,
      downlink: (navigator as any).connection.downlink,
      rtt: (navigator as any).connection.rtt
    } : 'not available'
  };
  
  results.tests.push({
    name: 'Network Diagnostics',
    endpoint: 'client-side',
    status: 'info',
    ok: true,
    data: networkInfo
  });

  // Summary
  const workingTests = results.tests.filter(t => t.ok);
  const failedTests = results.tests.filter(t => !t.ok);
  
  console.log('\n📊 Diagnostic Summary:');
  console.log(`✅ Working: ${workingTests.length}`);
  console.log(`❌ Failed: ${failedTests.length}`);
  
  if (workingTests.length > 0) {
    console.log('\n✅ Working endpoints:');
    workingTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.endpoint}`);
    });
  }
  
  if (failedTests.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failedTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.endpoint} (${test.status || 'Network Error'})`);
      if (test.error) {
        console.log(`     Error: ${test.error}`);
      }
    });
  }

  // Analyze common issues
  const analysis = analyzeResults(results.tests);
  console.log('\n🔍 Analysis:', analysis);

  return {
    results,
    summary: {
      working: workingTests.length,
      failed: failedTests.length,
      analysis
    }
  };
}

function analyzeResults(tests) {
  const issues = [];
  const workingCount = tests.filter(t => t.ok).length;
  const totalCount = tests.length;

  if (workingCount === 0) {
    issues.push('Complete backend failure - no endpoints accessible');
  } else if (workingCount < totalCount / 2) {
    issues.push('Partial backend failure - some endpoints not accessible');
  }

  // Check for specific status codes
  const status401Count = tests.filter(t => t.status === 401).length;
  const status404Count = tests.filter(t => t.status === 404).length;
  const status500Count = tests.filter(t => t.status === 500).length;

  if (status401Count > 0) {
    issues.push(`${status401Count} endpoints returning 401 (authentication/authorization issue)`);
  }
  if (status404Count > 0) {
    issues.push(`${status404Count} endpoints returning 404 (routing issue)`);
  }
  if (status500Count > 0) {
    issues.push(`${status500Count} endpoints returning 500 (server error)`);
  }

  // Check CORS
  const corsTest = tests.find(t => t.name === 'CORS Preflight');
  if (corsTest && !corsTest.ok) {
    issues.push('CORS preflight failing - possible CORS configuration issue');
  }

  // Check if ultra-simple endpoints work
  const ultraTests = tests.filter(t => t.endpoint.includes('ultra') || t.endpoint.includes('simple'));
  const ultraWorking = ultraTests.filter(t => t.ok).length;
  
  if (ultraWorking === 0) {
    issues.push('Even ultra-simple endpoints failing - fundamental connectivity issue');
  } else if (ultraWorking < ultraTests.length) {
    issues.push('Some ultra-simple endpoints working - partial routing issue');
  }

  return issues.length > 0 ? issues : ['All systems appear to be working correctly'];
}

// Quick fix suggestions based on diagnostic results
export function generateFixSuggestions(diagnosticResults) {
  const { summary } = diagnosticResults;
  const suggestions = [];

  if (summary.working === 0) {
    suggestions.push('1. Check if the Supabase Edge Function is deployed and running');
    suggestions.push('2. Verify the project ID and API endpoint configuration');
    suggestions.push('3. Check Supabase Edge Function logs for deployment errors');
  }

  if (summary.analysis.includes('401')) {
    suggestions.push('1. Remove all authentication middleware from public health endpoints');
    suggestions.push('2. Define public endpoints before any middleware in the server');
    suggestions.push('3. Check for global authentication middleware affecting all routes');
  }

  if (summary.analysis.includes('CORS')) {
    suggestions.push('1. Add proper CORS headers to all responses');
    suggestions.push('2. Handle OPTIONS requests for CORS preflight');
    suggestions.push('3. Check CORS middleware configuration');
  }

  if (summary.analysis.includes('404')) {
    suggestions.push('1. Verify route mounting and path configuration');
    suggestions.push('2. Check for typos in endpoint URLs');
    suggestions.push('3. Ensure Edge Function is properly deployed');
  }

  return suggestions;
}





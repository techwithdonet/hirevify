import { projectId, publicAnonKey } from '../supabase/info';

// Simple health check test for integration endpoints
export async function testIntegrationHealthEndpoints() {
  console.log('🏥 Testing all integration health endpoints...');
  
  const endpoints = [
    {
      name: 'Public Health Check',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-check`,
      description: 'Completely public health endpoint (no auth required)',
      requiresAuth: false
    },
    {
      name: 'Public Health Text',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-text`,
      description: 'Public text health endpoint (simplest possible)',
      requiresAuth: false
    },
    {
      name: 'Ultra Ping',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/ultra-ping`,
      description: 'Ultra-simple ping endpoint',
      requiresAuth: true
    },
    {
      name: 'Simple Test',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/simple-test`,
      description: 'Simple test endpoint (no middleware)',
      requiresAuth: true
    },
    {
      name: 'Ultra Integration Health',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/ultra-integration-health`,
      description: 'Ultra-public integration health (bypasses all middleware)',
      requiresAuth: true
    },
    {
      name: 'Main Integration Health',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integration-health`,
      description: 'Main server integration health endpoint',
      requiresAuth: true
    },
    {
      name: 'Integration Module Health',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/health`,
      description: 'Integration module health endpoint',
      requiresAuth: true
    }
  ];

  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Testing ${endpoint.name}...`);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Only add auth header if required
      if (endpoint.requiresAuth !== false) {
        headers['Authorization'] = `Bearer ${publicAnonKey}`;
      }
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers,
      });
      
      const result = {
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        ok: response.ok,
        data: null,
        error: null
      };
      
      if (response.ok) {
        try {
          result.data = await response.json();
          console.log(`✅ ${endpoint.name}: SUCCESS (${response.status})`);
        } catch (jsonError) {
          const text = await response.text();
          result.data = { text };
          console.log(`✅ ${endpoint.name}: SUCCESS (${response.status}) - Text response`);
        }
      } else {
        const errorText = await response.text();
        result.error = errorText;
        console.log(`❌ ${endpoint.name}: FAILED (${response.status}) - ${errorText}`);
      }
      
      results.push(result);
      
    } catch (error) {
      const result = {
        name: endpoint.name,
        url: endpoint.url,
        status: null,
        ok: false,
        data: null,
        error: error.message
      };
      
      results.push(result);
      console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
    }
  }
  
  // Summary
  const working = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);
  
  console.log(`\n📊 Health Check Summary:`);
  console.log(`✅ Working endpoints: ${working.length}`);
  console.log(`❌ Failed endpoints: ${failed.length}`);
  
  if (working.length > 0) {
    console.log(`\n🎉 Recommended endpoint: ${working[0].name}`);
    console.log(`   URL: ${working[0].url}`);
  }
  
  return {
    results,
    working,
    failed,
    recommendedEndpoint: working[0] || null
  };
}

// Quick test for a single endpoint
export async function quickHealthTest(endpointName: string = 'ultra-simple') {
  const endpoints = {
    'ultra-integration': `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/ultra-integration-health`,
    'simple-test': `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/simple-test`,
    'ultra-ping': `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/ultra-ping`,
    'main': `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integration-health`,
    'module': `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/health`,
    'backup': `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations-health`,
    'status': `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integration-status`
  };
  
  const url = endpoints[endpointName];
  if (!url) {
    throw new Error(`Unknown endpoint: ${endpointName}. Available: ${Object.keys(endpoints).join(', ')}`);
  }
  
  try {
    console.log(`🔄 Quick test of ${endpointName} endpoint...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${endpointName} endpoint is working!`, data);
      return { success: true, data, status: response.status };
    } else {
      const errorText = await response.text();
      console.log(`❌ ${endpointName} endpoint failed (${response.status}):`, errorText);
      return { success: false, error: errorText, status: response.status };
    }
    
  } catch (error) {
    console.log(`❌ ${endpointName} endpoint error:`, error.message);
    return { success: false, error: error.message, status: null };
  }
}
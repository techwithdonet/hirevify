import { projectId } from '../supabase/info';

// Ultra-simple connectivity test that doesn't require any authentication
export async function testBasicConnectivity() {
  console.log('🔍 Testing basic connectivity (no auth required)...');
  
  const testEndpoints = [
    {
      name: 'Public Health Check',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-check`,
      description: 'Completely public health endpoint'
    },
    {
      name: 'Public Health Text',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-text`,
      description: 'Simple text response endpoint'
    }
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`🔄 Testing ${endpoint.name}...`);
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // Deliberately no Authorization header
        }
      });
      
      console.log(`📡 ${endpoint.name} response:`, response.status, response.statusText);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log(`✅ ${endpoint.name}: SUCCESS (JSON)`, data);
          return { 
            success: true, 
            endpoint: endpoint.name, 
            data,
            message: `${endpoint.name} is working correctly`
          };
        } catch (jsonError) {
          const text = await response.text();
          console.log(`✅ ${endpoint.name}: SUCCESS (TEXT)`, text);
          if (text.includes('INTEGRATION_SERVICE_HEALTHY') || text.includes('healthy')) {
            return { 
              success: true, 
              endpoint: endpoint.name, 
              data: { text },
              message: `${endpoint.name} is working correctly (text response)`
            };
          }
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ ${endpoint.name}: FAILED (${response.status})`, errorText);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR`, error.message);
    }
  }
  
  return {
    success: false,
    message: 'All connectivity tests failed - backend may be down or unreachable'
  };
}

// Test a single endpoint without any authentication
export async function quickConnectivityTest() {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-text`);
    
    if (response.ok) {
      const text = await response.text();
      return {
        success: true,
        message: 'Backend is accessible',
        data: text,
        status: response.status
      };
    } else {
      return {
        success: false,
        message: `Backend returned ${response.status}`,
        status: response.status
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Network error: ${error.message}`,
      error: error.message
    };
  }
}





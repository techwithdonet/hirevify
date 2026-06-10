import { projectId, publicAnonKey } from '../supabase/info';

export interface ConnectivityTestResult {
  success: boolean;
  message: string;
  endpoint?: string;
  status?: number;
  error?: string;
  timestamp: string;
}

/**
 * Comprehensive connectivity test for the Integration Hub backend
 */
export async function testIntegrationConnectivity(): Promise<ConnectivityTestResult> {
  const timestamp = new Date().toISOString();
  
  // Test endpoints in order of preference
  const testEndpoints = [
    {
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/health`,
      name: 'Integration Health',
      timeout: 5000
    },
    {
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/status`,
      name: 'Integration Status',
      timeout: 5000
    },
    {
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/ping`,
      name: 'Integration Ping',
      timeout: 4000
    },
    {
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integration-health`,
      name: 'Main Server Integration Health',
      timeout: 5000
    },
    {
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-check`,
      name: 'Public Health Check',
      timeout: 4000
    }
  ];

  console.log('🔍 Testing Integration Hub connectivity...');

  for (const endpoint of testEndpoints) {
    try {
      console.log(`🔍 Testing ${endpoint.name}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json().catch(() => ({ status: 'ok' }));
        console.log(`✅ ${endpoint.name} successful:`, data);
        
        return {
          success: true,
          message: `Integration Hub is accessible via ${endpoint.name}`,
          endpoint: endpoint.url,
          status: response.status,
          timestamp
        };
      } else {
        console.log(`⚠️ ${endpoint.name} returned ${response.status}`);
        const errorText = await response.text().catch(() => 'Unknown error');
        
        // Don't fail immediately, try next endpoint
        continue;
      }
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      console.log(`⚠️ ${endpoint.name} failed:`, errorMessage);
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        console.log(`⚠️ ${endpoint.name} timed out after ${endpoint.timeout}ms`);
      } else if (error instanceof TypeError && errorMessage.includes('fetch')) {
        console.log(`⚠️ ${endpoint.name} network error:`, errorMessage);
      }
      
      // Continue to next endpoint
      continue;
    }
  }

  // If we get here, all endpoints failed
  return {
    success: false,
    message: 'All Integration Hub endpoints are unreachable',
    error: 'Backend connectivity failed',
    timestamp
  };
}

/**
 * Test authenticated Integration Hub endpoints
 */
export async function testAuthenticatedIntegrationEndpoints(accessToken: string): Promise<ConnectivityTestResult> {
  const timestamp = new Date().toISOString();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'No access token provided',
      error: 'Authentication required',
      timestamp
    };
  }

  try {
    console.log('🔐 Testing authenticated Integration Hub endpoints...');
    
    // Test the integrations list endpoint
    const listUrl = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/list`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authenticated Integration Hub test successful:', data);
      
      return {
        success: true,
        message: 'Authenticated Integration Hub endpoints are working',
        endpoint: listUrl,
        status: response.status,
        timestamp
      };
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.log('❌ Authenticated Integration Hub test failed:', errorData);
      
      return {
        success: false,
        message: `Authentication failed: ${errorData.error || 'Unknown error'}`,
        endpoint: listUrl,
        status: response.status,
        error: errorData.error,
        timestamp
      };
    }
  } catch (error) {
    console.error('💥 Authenticated Integration Hub test error:', error);
    
    return {
      success: false,
      message: 'Authenticated endpoint test failed',
      error: error.message || 'Unknown error',
      timestamp
    };
  }
}

/**
 * Quick connectivity test with minimal timeout
 */
export async function quickIntegrationConnectivityTest(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/ping`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
import { projectId, publicAnonKey } from '../supabase/info';

export interface ConnectivityTestResult {
  success: boolean;
  message: string;
  endpoint?: string;
  status?: number;
  error?: string;
  timestamp: string;
  responseTime?: number;
}

export interface SystemStatus {
  backend: 'online' | 'offline' | 'unknown';
  integrations: 'online' | 'offline' | 'unknown';
  lastCheck: Date;
  details: string;
}

/**
 * Ultra-simple connectivity test that just checks if we can reach any basic endpoint
 */
export async function quickBackendCheck(): Promise<boolean> {
  // Test the most basic endpoints with very short timeout
  const testUrls = [
    `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/health`,
    `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-text`,
    `https://${projectId}.supabase.co/rest/v1/`, // Basic Supabase REST API
  ];

  for (const url of testUrls) {
    try {
      console.log(`🔍 Quick test: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 401 || response.status < 500) {
        console.log(`✅ Quick test successful: ${url} (${response.status})`);
        return true;
      }
      
      console.log(`⚠️ Quick test non-ok response: ${url} (${response.status})`);
    } catch (error) {
      console.log(`❌ Quick test failed: ${url} - ${error.message}`);
    }
  }
  
  console.log('❌ All quick tests failed');
  return false;
}

/**
 * Comprehensive system status check
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Getting system status...');
    
    // Step 1: Test basic Supabase connectivity
    const supabaseAlive = await testSupabaseBasics();
    
    // Step 2: Test backend server
    const backendAlive = await testBackendServer();
    
    // Step 3: Test integration endpoints specifically
    const integrationsAlive = await testIntegrationEndpoints();
    
    const responseTime = Date.now() - startTime;
    
    console.log(`📊 System Status Results:`, {
      supabase: supabaseAlive,
      backend: backendAlive,
      integrations: integrationsAlive,
      responseTime: `${responseTime}ms`
    });
    
    let backendStatus: 'online' | 'offline' | 'unknown' = 'unknown';
    let integrationsStatus: 'online' | 'offline' | 'unknown' = 'unknown';
    let details = '';
    
    if (supabaseAlive && backendAlive) {
      backendStatus = 'online';
      details = 'Backend services are operational';
      
      if (integrationsAlive) {
        integrationsStatus = 'online';
        details = 'All services including integrations are operational';
      } else {
        integrationsStatus = 'offline';
        details = 'Backend is online but integration services are unavailable';
      }
    } else if (supabaseAlive) {
      backendStatus = 'offline';
      integrationsStatus = 'offline';
      details = 'Supabase is reachable but backend edge functions are not responding';
    } else {
      backendStatus = 'offline';
      integrationsStatus = 'offline';
      details = 'Complete backend outage - Supabase is unreachable';
    }
    
    return {
      backend: backendStatus,
      integrations: integrationsStatus,
      lastCheck: new Date(),
      details
    };
    
  } catch (error) {
    console.error('💥 System status check failed:', error);
    
    return {
      backend: 'unknown',
      integrations: 'unknown',
      lastCheck: new Date(),
      details: `Status check failed: ${error.message}`
    };
  }
}

async function testSupabaseBasics(): Promise<boolean> {
  try {
    console.log('🔍 Testing basic Supabase connectivity...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // Test the basic Supabase REST API endpoint
    const response = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': publicAnonKey,
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Supabase REST API should return 200 with OpenAPI spec or similar
    if (response.ok) {
      console.log('✅ Supabase basic connectivity successful');
      return true;
    } else {
      console.log(`⚠️ Supabase returned ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Supabase basic connectivity failed:', error.message);
    return false;
  }
}

async function testBackendServer(): Promise<boolean> {
  const endpoints = [
    '/health',
    '/public-health-text',
    '/ultra-ping'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing backend endpoint: ${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 401) {
        console.log(`✅ Backend endpoint successful: ${endpoint} (${response.status})`);
        return true;
      } else {
        console.log(`⚠️ Backend endpoint ${endpoint} returned ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Backend endpoint ${endpoint} failed:`, error.message);
    }
  }
  
  console.log('❌ All backend endpoints failed');
  return false;
}

async function testIntegrationEndpoints(): Promise<boolean> {
  const endpoints = [
    '/integrations/health',
    '/integrations/status', 
    '/integrations/ping'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing integration endpoint: ${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 401) {
        console.log(`✅ Integration endpoint successful: ${endpoint} (${response.status})`);
        return true;
      } else {
        console.log(`⚠️ Integration endpoint ${endpoint} returned ${response.status}`);
        // Log response text for debugging
        try {
          const responseText = await response.text();
          console.log(`Response: ${responseText}`);
        } catch (e) {
          console.log('Could not read response text');
        }
      }
      
    } catch (error) {
      console.log(`❌ Integration endpoint ${endpoint} failed:`, error.message);
    }
  }
  
  console.log('❌ All integration endpoints failed');
  return false;
}

/**
 * Test if we can reach the integration list endpoint with auth
 */
export async function testAuthenticatedIntegrationAccess(accessToken: string): Promise<ConnectivityTestResult> {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();
  
  if (!accessToken) {
    return {
      success: false,
      message: 'No access token provided',
      error: 'Authentication required',
      timestamp
    };
  }
  
  try {
    console.log('🔐 Testing authenticated integration access...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json().catch(() => ({ integrations: [] }));
      console.log('✅ Authenticated integration access successful');
      
      return {
        success: true,
        message: 'Integration endpoints are accessible',
        endpoint: 'integrations/list',
        status: response.status,
        responseTime,
        timestamp
      };
    } else {
      const errorText = await response.text().catch(() => 'No response body');
      console.log(`❌ Authenticated integration access failed: ${response.status}`);
      
      return {
        success: false,
        message: `Integration endpoint returned ${response.status}`,
        endpoint: 'integrations/list',
        status: response.status,
        error: errorText,
        responseTime,
        timestamp
      };
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log('💥 Authenticated integration access error:', error.message);
    
    return {
      success: false,
      message: 'Failed to connect to integration endpoints',
      error: error.message,
      responseTime,
      timestamp
    };
  }
}

/**
 * Get a human-readable status message based on system status
 */
export function getStatusMessage(status: SystemStatus): {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'error' | 'info';
} {
  if (status.backend === 'online' && status.integrations === 'online') {
    return {
      title: 'All Systems Operational',
      description: 'Integration Hub and all backend services are working normally.',
      color: 'success'
    };
  }
  
  if (status.backend === 'online' && status.integrations === 'offline') {
    return {
      title: 'Integration Services Unavailable',
      description: 'Backend is working but integration features are temporarily offline.',
      color: 'warning'
    };
  }
  
  if (status.backend === 'offline') {
    return {
      title: 'Backend Services Offline',
      description: 'Unable to connect to backend services. Integration features are unavailable.',
      color: 'error'
    };
  }
  
  return {
    title: 'System Status Unknown',
    description: 'Unable to determine system status. Please try again.',
    color: 'info'
  };
}





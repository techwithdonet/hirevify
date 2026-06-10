import { projectId, publicAnonKey } from '../supabase/info';

/**
 * Simple, direct backend test that focuses on completely public endpoints
 * This avoids any authentication issues and tests core connectivity
 */

interface SimpleTestResult {
  success: boolean;
  message: string;
  endpoint?: string;
  responseTime?: number;
  status?: number;
  error?: string;
}

/**
 * Test the most basic, guaranteed public endpoint
 */
export async function testBasicBackend(): Promise<SimpleTestResult> {
  console.log('🧪 Testing basic backend connectivity...');
  
  const startTime = Date.now();
  
  try {
    // Test the simplest possible endpoint
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-text`,
      {
        method: 'GET',
        headers: {
          'Accept': 'text/plain'
        }
      }
    );
    
    const responseTime = Date.now() - startTime;
    const text = await response.text();
    
    console.log(`📊 Response: ${response.status} in ${responseTime}ms`);
    console.log(`📄 Content: ${text.substring(0, 100)}...`);
    
    if (response.ok) {
      return {
        success: true,
        message: `Backend is accessible (${responseTime}ms) - ${text}`,
        endpoint: 'public-health-text',
        responseTime,
        status: response.status
      };
    } else {
      return {
        success: false,
        message: `Backend returned error ${response.status}`,
        endpoint: 'public-health-text',
        responseTime,
        status: response.status,
        error: `HTTP ${response.status}: ${text}`
      };
    }
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    console.error('❌ Backend test failed:', error.message);
    
    return {
      success: false,
      message: `Backend connection failed: ${error.message}`,
      endpoint: 'public-health-text',
      responseTime,
      error: error.message
    };
  }
}

/**
 * Test multiple public endpoints to ensure backend is fully operational
 */
export async function testMultipleEndpoints(): Promise<{
  success: boolean;
  message: string;
  results: SimpleTestResult[];
}> {
  console.log('🧪 Testing multiple backend endpoints...');
  
  const endpoints = [
    {
      name: 'Health Text',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-text`
    },
    {
      name: 'Health Check',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-check`
    },
    {
      name: 'Simple Test',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/simple-test`
    },
    {
      name: 'Ultra Ping',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/ultra-ping`
    }
  ];
  
  const results: SimpleTestResult[] = [];
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Testing ${endpoint.name}...`);
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json,text/plain'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        successCount++;
        results.push({
          success: true,
          message: `${endpoint.name} is working (${responseTime}ms)`,
          endpoint: endpoint.name,
          responseTime,
          status: response.status
        });
        console.log(`✅ ${endpoint.name} passed`);
      } else {
        results.push({
          success: false,
          message: `${endpoint.name} returned ${response.status}`,
          endpoint: endpoint.name,
          responseTime,
          status: response.status,
          error: `HTTP ${response.status}`
        });
        console.log(`❌ ${endpoint.name} failed: ${response.status}`);
      }
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      results.push({
        success: false,
        message: `${endpoint.name} failed: ${error.message}`,
        endpoint: endpoint.name,
        responseTime,
        error: error.message
      });
      console.log(`❌ ${endpoint.name} error:`, error.message);
    }
  }
  
  const message = `${successCount}/${endpoints.length} endpoints working`;
  
  return {
    success: successCount > 0,
    message,
    results
  };
}

/**
 * Quick health check that returns immediately with basic info
 */
export async function quickHealthCheck(): Promise<{
  backendOnline: boolean;
  responseTime: number;
  message: string;
}> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-text`,
      {
        signal: controller.signal,
        method: 'GET'
      }
    );
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    return {
      backendOnline: response.ok,
      responseTime,
      message: response.ok 
        ? `Backend is online (${responseTime}ms)` 
        : `Backend returned ${response.status} (${responseTime}ms)`
    };
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return {
      backendOnline: false,
      responseTime,
      message: `Backend offline: ${error.message}`
    };
  }
}

/**
 * Test integration service specifically (public endpoints only)
 */
export async function testIntegrationService(): Promise<SimpleTestResult> {
  console.log('🔗 Testing integration service...');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integration-health`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      
      return {
        success: true,
        message: `Integration service is healthy (${responseTime}ms)`,
        endpoint: 'integration-health',
        responseTime,
        status: response.status
      };
    } else {
      return {
        success: false,
        message: `Integration service returned ${response.status}`,
        endpoint: 'integration-health',
        responseTime,
        status: response.status,
        error: `HTTP ${response.status}`
      };
    }
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      message: `Integration service failed: ${error.message}`,
      endpoint: 'integration-health',
      responseTime,
      error: error.message
    };
  }
}
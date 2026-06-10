import { projectId, publicAnonKey } from '../supabase/info';

export interface DiagnosticResult {
  test: string;
  success: boolean;
  message: string;
  error?: string;
  status?: number;
  responseTime?: number;
  url?: string;
}

/**
 * Comprehensive backend connectivity diagnostic
 */
export async function runBackendDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  
  console.log('🔍 Starting comprehensive backend diagnostics...');
  
  // Test 1: Basic server connectivity
  const basicTest = await testBasicServerConnectivity();
  results.push(basicTest);
  
  // Test 2: Main server health endpoints
  const healthTests = await testMainHealthEndpoints();
  results.push(...healthTests);
  
  // Test 3: Integration-specific endpoints
  const integrationTests = await testIntegrationEndpoints();
  results.push(...integrationTests);
  
  // Test 4: CORS and headers test
  const corsTest = await testCORSHeaders();
  results.push(corsTest);
  
  console.log('🔍 Backend diagnostics completed');
  return results;
}

async function testBasicServerConnectivity(): Promise<DiagnosticResult> {
  const url = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/health`;
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing basic server connectivity...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json().catch(() => null);
      console.log('✅ Basic server connectivity successful:', data);
      
      return {
        test: 'Basic Server Connectivity',
        success: true,
        message: 'Main server is accessible and responding',
        status: response.status,
        responseTime,
        url
      };
    } else {
      const errorText = await response.text().catch(() => 'No response body');
      console.log('❌ Basic server connectivity failed:', response.status, errorText);
      
      return {
        test: 'Basic Server Connectivity',
        success: false,
        message: `Server returned ${response.status}`,
        error: errorText,
        status: response.status,
        responseTime,
        url
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 Basic server connectivity error:', error);
    
    return {
      test: 'Basic Server Connectivity',
      success: false,
      message: 'Failed to connect to main server',
      error: error.message || 'Connection failed',
      responseTime,
      url
    };
  }
}

async function testMainHealthEndpoints(): Promise<DiagnosticResult[]> {
  const endpoints = [
    {
      name: 'Main Health Check',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/health`
    },
    {
      name: 'Public Health Text',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-text`
    },
    {
      name: 'Public Health Check',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-check`
    },
    {
      name: 'Ultra Ping',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/ultra-ping`
    }
  ];
  
  const results: DiagnosticResult[] = [];
  
  for (const endpoint of endpoints) {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Testing ${endpoint.name}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.text().catch(() => 'Success');
        console.log(`✅ ${endpoint.name} successful`);
        
        results.push({
          test: endpoint.name,
          success: true,
          message: 'Endpoint responding correctly',
          status: response.status,
          responseTime,
          url: endpoint.url
        });
      } else {
        console.log(`❌ ${endpoint.name} failed:`, response.status);
        
        results.push({
          test: endpoint.name,
          success: false,
          message: `Returned ${response.status}`,
          status: response.status,
          responseTime,
          url: endpoint.url
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`💥 ${endpoint.name} error:`, error.message);
      
      results.push({
        test: endpoint.name,
        success: false,
        message: 'Connection failed',
        error: error.message || 'Unknown error',
        responseTime,
        url: endpoint.url
      });
    }
  }
  
  return results;
}

async function testIntegrationEndpoints(): Promise<DiagnosticResult[]> {
  const endpoints = [
    {
      name: 'Integration Health',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/health`
    },
    {
      name: 'Integration Status',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/status`
    },
    {
      name: 'Integration Ping',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/ping`
    },
    {
      name: 'Integration Debug',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/debug`
    },
    {
      name: 'Integration Routes Test',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/test-routes`
    }
  ];
  
  const results: DiagnosticResult[] = [];
  
  for (const endpoint of endpoints) {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Testing ${endpoint.name}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
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
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json().catch(() => ({ status: 'ok' }));
        console.log(`✅ ${endpoint.name} successful:`, data);
        
        results.push({
          test: endpoint.name,
          success: true,
          message: 'Integration endpoint responding correctly',
          status: response.status,
          responseTime,
          url: endpoint.url
        });
      } else {
        const errorText = await response.text().catch(() => 'No response');
        console.log(`❌ ${endpoint.name} failed:`, response.status, errorText);
        
        results.push({
          test: endpoint.name,
          success: false,
          message: `Integration endpoint returned ${response.status}`,
          error: errorText,
          status: response.status,
          responseTime,
          url: endpoint.url
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`💥 ${endpoint.name} error:`, error.message);
      
      results.push({
        test: endpoint.name,
        success: false,
        message: 'Integration endpoint connection failed',
        error: error.message || 'Connection failed',
        responseTime,
        url: endpoint.url
      });
    }
  }
  
  return results;
}

async function testCORSHeaders(): Promise<DiagnosticResult> {
  const url = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/health`;
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing CORS headers...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // First test OPTIONS request
    const optionsResponse = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers'),
    };
    
    console.log('🔍 CORS headers:', corsHeaders);
    
    if (optionsResponse.ok || optionsResponse.status === 200) {
      return {
        test: 'CORS Headers Test',
        success: true,
        message: 'CORS headers are properly configured',
        status: optionsResponse.status,
        responseTime,
        url
      };
    } else {
      return {
        test: 'CORS Headers Test',
        success: false,
        message: `CORS preflight failed with status ${optionsResponse.status}`,
        status: optionsResponse.status,
        responseTime,
        url
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 CORS test error:', error);
    
    return {
      test: 'CORS Headers Test',
      success: false,
      message: 'CORS test failed',
      error: error.message || 'Connection failed',
      responseTime,
      url
    };
  }
}

/**
 * Simple test that returns true if ANY backend endpoint is reachable
 */
export async function isBackendReachable(): Promise<boolean> {
  const quickTests = [
    `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/ultra-ping`,
    `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-text`,
    `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/health`,
  ];
  
  for (const url of quickTests) {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      
      if (response.ok) {
        console.log('✅ Backend is reachable via:', url);
        return true;
      }
    } catch {
      // Continue to next test
    }
  }
  
  console.log('❌ Backend is not reachable via any endpoint');
  return false;
}
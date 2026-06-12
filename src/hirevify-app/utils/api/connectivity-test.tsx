import { projectId, publicAnonKey } from '../supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`;

export interface ConnectivityTestResult {
  success: boolean;
  tests: {
    mainServer: { success: boolean; status?: number; error?: string; responseTime?: number };
    integrationService: { success: boolean; status?: number; error?: string; responseTime?: number };
    authentication: { success: boolean; error?: string; userInfo?: any };
  };
  recommendations: string[];
  environment: {
    projectId: string;
    hasPublicKey: boolean;
    hasUserToken: boolean;
    apiBase: string;
  };
}

export async function runConnectivityTest(accessToken?: string): Promise<ConnectivityTestResult> {
  const result: ConnectivityTestResult = {
    success: false,
    tests: {
      mainServer: { success: false },
      integrationService: { success: false },
      authentication: { success: false }
    },
    recommendations: [],
    environment: {
      projectId: projectId || 'NOT_SET',
      hasPublicKey: !!publicAnonKey,
      hasUserToken: !!accessToken,
      apiBase: API_BASE
    }
  };

  console.log('ðŸ§ª Starting comprehensive connectivity test...');
  console.log('ðŸ“Š Environment info:', result.environment);

  // Test 1: Main Server Health
  try {
    console.log('1ï¸âƒ£ Testing main server health...');
    
    // First try the simplest possible endpoint
    console.log('ðŸ” Testing no-auth endpoint first...');
    let response;
    try {
      response = await fetch(`${API_BASE}/test-no-auth`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        console.log('âœ… No-auth endpoint works - proceeding to main health check');
      } else {
        console.log(`âš ï¸ No-auth endpoint returned ${response.status} - trying main health check anyway`);
      }
    } catch (noAuthError) {
      console.log('âš ï¸ No-auth endpoint failed - trying main health check anyway:', noAuthError.message);
    }
    
    // Now try main health endpoint
    const startTime = Date.now();
    response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const responseTime = Date.now() - startTime;
    result.tests.mainServer.responseTime = responseTime;
    result.tests.mainServer.status = response.status;

    if (response.ok) {
      const data = await response.json();
      result.tests.mainServer.success = true;
      console.log('âœ… Main server health check passed:', data);
    } else {
      const errorText = await response.text();
      result.tests.mainServer.error = `HTTP ${response.status}: ${errorText}`;
      console.log('âŒ Main server health check failed:', response.status, errorText);
    }
  } catch (error) {
    result.tests.mainServer.error = error.message;
    console.log('âŒ Main server connectivity error:', error.message);
    
    if (error.name === 'TimeoutError') {
      result.recommendations.push('Server is responding slowly or may be overloaded. Try again later.');
    } else if (error.message.includes('Failed to fetch')) {
      result.recommendations.push('Cannot connect to HireVify servers. Check your internet connection or try again later.');
    }
  }

  // Test 2: Integration Service Health
  if (result.tests.mainServer.success) {
    try {
      console.log('2ï¸âƒ£ Testing integration service health...');
      const startTime = Date.now();
      
      // Try multiple endpoints in order of reliability
      const integrationEndpoints = [
        {
          name: 'Integration Health Backup',
          url: `${API_BASE}/integrations-health`,
        },
        {
          name: 'Integration Health Main', 
          url: `${API_BASE}/integration-health`,
        },
        {
          name: 'Integration Service',
          url: `${API_BASE}/integrations/health`,
        }
      ];
      
      let response;
      let successfulEndpoint;
      
      for (const endpoint of integrationEndpoints) {
        try {
          console.log(`ðŸ”„ Trying ${endpoint.name}...`);
          response = await fetch(endpoint.url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            successfulEndpoint = endpoint.name;
            console.log(`âœ… ${endpoint.name} succeeded`);
            break;
          } else {
            console.log(`âš ï¸ ${endpoint.name} failed with status ${response.status}`);
          }
        } catch (endpointError) {
          console.log(`âš ï¸ ${endpoint.name} failed with error:`, endpointError.message);
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`All integration health endpoints failed. Last status: ${response?.status || 'No response'}`);
      }

      const responseTime = Date.now() - startTime;
      result.tests.integrationService.responseTime = responseTime;
      result.tests.integrationService.status = response.status;

      if (response.ok) {
        const data = await response.json();
        result.tests.integrationService.success = true;
        console.log('âœ… Integration service health check passed:', data);
      } else {
        const errorText = await response.text();
        result.tests.integrationService.error = `HTTP ${response.status}: ${errorText}`;
        console.log('âŒ Integration service health check failed:', response.status, errorText);
      }
    } catch (error) {
      result.tests.integrationService.error = error.message;
      console.log('âŒ Integration service connectivity error:', error.message);
      result.recommendations.push('Integration service is not responding. This feature may be temporarily unavailable.');
    }
  } else {
    result.tests.integrationService.error = 'Skipped due to main server failure';
    result.recommendations.push('Integration service test skipped due to main server connectivity issues.');
  }

  // Test 3: Authentication (if token provided)
  if (accessToken && result.tests.integrationService.success) {
    try {
      console.log('3ï¸âƒ£ Testing authentication with integration service...');
      
      const response = await fetch(`${API_BASE}/integrations/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        result.tests.authentication.success = true;
        result.tests.authentication.userInfo = {
          integrationsFound: data.integrations?.length || 0
        };
        console.log('âœ… Authentication test passed:', data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        result.tests.authentication.error = `HTTP ${response.status}: ${errorData.error || 'Authentication failed'}`;
        console.log('âŒ Authentication test failed:', response.status, errorData);
        
        if (response.status === 401) {
          result.recommendations.push('Authentication failed. Try signing out and signing back in.');
        }
      }
    } catch (error) {
      result.tests.authentication.error = error.message;
      console.log('âŒ Authentication test error:', error.message);
      result.recommendations.push('Authentication test failed due to connectivity issues.');
    }
  } else if (!accessToken) {
    result.tests.authentication.error = 'No access token provided';
    result.recommendations.push('Sign in to test integration authentication.');
  } else {
    result.tests.authentication.error = 'Skipped due to service unavailability';
  }

  // Determine overall success
  result.success = result.tests.mainServer.success && result.tests.integrationService.success;

  // Add general recommendations
  if (!result.success) {
    if (!result.tests.mainServer.success) {
      result.recommendations.push('HireVify backend servers are not accessible. Please try again later or contact support.');
    }
    if (result.tests.mainServer.success && !result.tests.integrationService.success) {
      result.recommendations.push('Integration service is temporarily unavailable. Other HireVify features should work normally.');
    }
  }

  if (result.success && result.tests.authentication.success) {
    result.recommendations.push('All systems are operational and working correctly!');
  }

  console.log('ðŸ§ª Connectivity test completed:', {
    success: result.success,
    mainServer: result.tests.mainServer.success,
    integrationService: result.tests.integrationService.success,
    authentication: result.tests.authentication.success,
    recommendationsCount: result.recommendations.length
  });

  return result;
}

export function formatConnectivityTestResults(result: ConnectivityTestResult): string {
  let report = 'ðŸ§ª HireVify Connectivity Test Results\n\n';
  
  // Environment Info
  report += 'ðŸ“Š Environment:\n';
  report += `  â€¢ Project ID: ${result.environment.projectId}\n`;
  report += `  â€¢ API Base: ${result.environment.apiBase}\n`;
  report += `  â€¢ Has Public Key: ${result.environment.hasPublicKey ? 'âœ…' : 'âŒ'}\n`;
  report += `  â€¢ Has User Token: ${result.environment.hasUserToken ? 'âœ…' : 'âŒ'}\n\n`;
  
  // Test Results
  report += 'ðŸ§ª Test Results:\n';
  
  const serverTest = result.tests.mainServer;
  report += `  1. Main Server: ${serverTest.success ? 'âœ…' : 'âŒ'}\n`;
  if (serverTest.responseTime) report += `     Response Time: ${serverTest.responseTime}ms\n`;
  if (serverTest.status) report += `     Status: ${serverTest.status}\n`;
  if (serverTest.error) report += `     Error: ${serverTest.error}\n`;
  
  const integrationTest = result.tests.integrationService;
  report += `  2. Integration Service: ${integrationTest.success ? 'âœ…' : 'âŒ'}\n`;
  if (integrationTest.responseTime) report += `     Response Time: ${integrationTest.responseTime}ms\n`;
  if (integrationTest.status) report += `     Status: ${integrationTest.status}\n`;
  if (integrationTest.error) report += `     Error: ${integrationTest.error}\n`;
  
  const authTest = result.tests.authentication;
  report += `  3. Authentication: ${authTest.success ? 'âœ…' : 'âŒ'}\n`;
  if (authTest.userInfo) report += `     Integrations Found: ${authTest.userInfo.integrationsFound}\n`;
  if (authTest.error) report += `     Error: ${authTest.error}\n`;
  
  // Recommendations
  if (result.recommendations.length > 0) {
    report += '\nðŸ’¡ Recommendations:\n';
    result.recommendations.forEach((rec, index) => {
      report += `  ${index + 1}. ${rec}\n`;
    });
  }
  
  return report;
}







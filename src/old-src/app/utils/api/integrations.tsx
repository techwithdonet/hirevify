import { projectId, publicAnonKey } from '../supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`;

export interface Integration {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  credentials?: Record<string, string>;
  lastSync?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface IntegrationCredentials {
  [key: string]: string;
}

export interface IntegrationSettings {
  [key: string]: any;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed?: number;
  errors?: string[];
  error?: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  response_time?: string;
}

export interface IntegrationLog {
  userId: string;
  integrationId: string;
  eventType: string;
  data: any;
  timestamp: string;
}

// Test integration routes (debug function)
export async function testIntegrationRoutes(): Promise<{ success: boolean; routes?: any; error?: string }> {
  try {
    console.log('📋 Testing integration routes...');
    console.log('📋 Routes test URL:', `${API_BASE}/integrations/test-routes`);
    
    const response = await fetch(`${API_BASE}/integrations/test-routes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📋 Routes test response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📋 Routes test failed with status:', response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText || 'Routes test failed'}`
      };
    }

    const data = await response.json();
    console.log('📋 Integration routes test response:', data);

    return {
      success: true,
      routes: data,
    };
  } catch (error) {
    console.error('❌ Integration routes test failed:', error);
    return {
      success: false,
      error: error.message || 'Routes test failed'
    };
  }
}

// Health check for integration service
export async function checkIntegrationServiceHealth(): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    console.log('🏥 Testing integration service health...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Try multiple endpoints in order of reliability
    const healthEndpoints = [
      {
        name: 'Integration Health Backup',
        url: `${API_BASE}/integrations-health`
      },
      {
        name: 'Integration Health Main',
        url: `${API_BASE}/integration-health`
      },
      {
        name: 'Integration Service',
        url: `${API_BASE}/integrations/health`
      }
    ];
    
    let response;
    let data;
    let successfulEndpoint;
    
    for (const endpoint of healthEndpoints) {
      try {
        console.log(`🏥 Trying ${endpoint.name}: ${endpoint.url}`);
        
        response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        console.log(`🏥 ${endpoint.name} response status:`, response.status);

        if (response.ok) {
          try {
            data = await response.json();
            successfulEndpoint = endpoint.name;
            console.log(`🏥 ${endpoint.name} health response:`, data);
            break;
          } catch (jsonError) {
            console.error(`🏥 ${endpoint.name} JSON parse error:`, jsonError);
            continue; // Try next endpoint
          }
        } else {
          console.log(`🏥 ${endpoint.name} failed with status:`, response.status);
          continue; // Try next endpoint
        }
      } catch (endpointError) {
        console.log(`🏥 ${endpoint.name} failed with error:`, endpointError.message);
        continue; // Try next endpoint
      }
    }
    
    clearTimeout(timeoutId);
    
    if (!response || !response.ok || !data) {
      const lastStatus = response?.status || 'No response';
      return {
        success: false,
        error: `All health check endpoints failed. Last status: ${lastStatus}`
      };
    }

    return {
      success: true,
      status: data.status || data.message || 'healthy',
      error: undefined
    };
  } catch (error) {
    console.error('🏥 Integration service health check failed:', error);
    
    // Provide more specific error messages
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Health check timed out (10s). Service may be slow or unavailable.'
      };
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error: Unable to connect to integration service. Check if the backend is running.'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error during health check'
    };
  }
}

// Test KV store access in integration service
export async function testIntegrationKV(): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    console.log('🗄️ Testing integration service KV access...');
    
    const response = await fetch(`${API_BASE}/integrations/test-kv`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('🗄️ KV test response:', data);

    return {
      success: response.ok,
      error: response.ok ? undefined : data.error,
      data: data
    };
  } catch (error) {
    console.error('❌ Error testing KV:', error);
    return {
      success: false,
      error: error.message || 'KV test failed'
    };
  }
}

// Debug authentication - test if token is valid
export async function debugIntegrationAuth(accessToken: string): Promise<{ success: boolean; user?: any; error?: string; debug?: any }> {
  try {
    console.log('🔍 Testing integration authentication...');
    console.log('🔍 Debug URL:', `${API_BASE}/integrations/debug-auth`);
    console.log('🔍 Token (first 30 chars):', accessToken ? accessToken.substring(0, 30) + '...' : 'NO TOKEN');

    if (!accessToken) {
      return {
        success: false,
        error: 'No access token provided for authentication debug'
      };
    }

    // Test KV access first but don't fail if it doesn't work
    console.log('🗄️ Testing KV access...');
    let kvTest;
    try {
      kvTest = await testIntegrationKV();
      console.log('🗄️ KV test result:', kvTest.success ? 'PASSED' : 'FAILED');
    } catch (kvError) {
      console.log('🗄️ KV test failed with error:', kvError.message);
      kvTest = {
        success: false,
        error: kvError.message,
        warning: 'KV test failed but continuing with auth test'
      };
    }

    // Test auth regardless of KV test result
    console.log('🔍 Testing authentication...');
    const response = await fetch(`${API_BASE}/integrations/debug-auth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 Debug response status:', response.status);

    let data;
    try {
      const rawResponse = await response.text();
      data = JSON.parse(rawResponse);
      console.log('🔍 Debug response data:', data);
    } catch (jsonError) {
      console.error('🔍 Failed to parse debug response JSON:', jsonError);
      return {
        success: false,
        error: 'Invalid response from debug endpoint',
        debug: { kvTest }
      };
    }

    if (response.ok) {
      return {
        success: true,
        user: data.user,
        debug: { ...data, kvTest }
      };
    } else {
      return {
        success: false,
        error: data.error || `Debug auth failed with status ${response.status}`,
        debug: { ...data, kvTest }
      };
    }
  } catch (error) {
    console.error('❌ Error in debug auth:', error);
    return {
      success: false,
      error: error.message || 'Debug auth failed'
    };
  }
}

// Get user's integrations
export async function getUserIntegrations(accessToken: string): Promise<{ success: boolean; integrations?: Integration[]; error?: string }> {
  try {
    console.log('🔗 Fetching user integrations...');
    console.log('🔗 API URL:', `${API_BASE}/integrations/list`);
    console.log('🔗 User token (first 30 chars):', accessToken ? accessToken.substring(0, 30) + '...' : 'NO TOKEN');

    if (!accessToken) {
      return {
        success: false,
        error: 'No access token provided for authentication'
      };
    }

    // First test the health endpoint to ensure service is accessible
    console.log('🏥 Testing integration service accessibility...');
    try {
      // Use the health check function that tries multiple endpoints
      const healthResult = await checkIntegrationServiceHealth();
      
      if (!healthResult.success) {
        console.error('❌ Integration service health check failed:', healthResult.error);
        return {
          success: false,
          error: healthResult.error || 'Integration service is not accessible'
        };
      }

      console.log('✅ Integration service is accessible:', healthResult.status);
    } catch (healthError) {
      console.error('❌ Integration service connectivity test failed:', healthError);
      return {
        success: false,
        error: 'Cannot connect to integration service. The backend may be down.'
      };
    }

    // Now make the authenticated request
    console.log('🔗 Making authenticated request to integration list...');
    const response = await fetch(`${API_BASE}/integrations/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔗 Response status:', response.status);
    console.log('🔗 Response headers:', Object.fromEntries(response.headers.entries()));

    let data;
    let rawResponse = '';
    try {
      rawResponse = await response.text();
      console.log('🔗 Raw response (first 200 chars):', rawResponse.substring(0, 200));
      data = JSON.parse(rawResponse);
      console.log('🔗 Parsed response data:', data);
    } catch (jsonError) {
      console.error('🔗 Failed to parse JSON response:', jsonError);
      console.error('🔗 Full raw response text:', rawResponse);
      
      // Try to extract useful error information from non-JSON responses
      if (response.status === 401) {
        return {
          success: false,
          error: 'Authentication failed. Please sign in again.'
        };
      } else if (response.status === 403) {
        return {
          success: false,
          error: 'Access denied. Please check your permissions.'
        };
      } else if (response.status >= 500) {
        return {
          success: false,
          error: 'Server error. Please try again later.'
        };
      }
      
      return {
        success: false,
        error: `Invalid server response (${response.status}): ${rawResponse.substring(0, 100)}`
      };
    }

    if (!response.ok) {
      console.error('🔗 API request failed:', response.status, data);
      
      // Provide detailed error messages
      let errorMessage = data.error || `HTTP ${response.status} error`;
      
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Please sign in again.';
      } else if (response.status === 403) {
        errorMessage = 'Access denied. Please check your permissions.';
      } else if (response.status === 404) {
        errorMessage = 'Integration service endpoint not found.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      return {
        success: false,
        error: errorMessage + (data.details ? ` Details: ${data.details}` : '')
      };
    }

    console.log('🔗 Successfully fetched integrations:', data.integrations?.length || 0);
    return {
      success: true,
      integrations: data.integrations || []
    };
  } catch (error) {
    console.error('❌ Error fetching user integrations:', error);
    
    // Check for specific error types
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error: Unable to connect to integration service. Check if the backend is running.'
      };
    }
    
    if (error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'Failed to connect to integration service. The backend may be unavailable.'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to fetch integrations'
    };
  }
}

// Get specific integration
export async function getIntegration(accessToken: string, integrationId: string): Promise<{ success: boolean; integration?: Integration; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/integrations/${integrationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch integration');
    }

    return {
      success: true,
      integration: data.integration
    };
  } catch (error) {
    console.error('Error fetching integration:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch integration'
    };
  }
}

// Connect/configure integration
export async function connectIntegration(
  accessToken: string,
  integrationId: string,
  credentials: IntegrationCredentials,
  settings?: IntegrationSettings
): Promise<{ success: boolean; integration?: Integration; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/integrations/connect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        integrationId,
        credentials,
        settings
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to connect integration');
    }

    return {
      success: true,
      integration: data.integration
    };
  } catch (error) {
    console.error('Error connecting integration:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect integration'
    };
  }
}

// Update integration settings
export async function updateIntegrationSettings(
  accessToken: string,
  integrationId: string,
  settings: IntegrationSettings
): Promise<{ success: boolean; integration?: Integration; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/integrations/${integrationId}/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update integration settings');
    }

    return {
      success: true,
      integration: data.integration
    };
  } catch (error) {
    console.error('Error updating integration settings:', error);
    return {
      success: false,
      error: error.message || 'Failed to update integration settings'
    };
  }
}

// Disconnect integration
export async function disconnectIntegration(
  accessToken: string,
  integrationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/integrations/${integrationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to disconnect integration');
    }

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    return {
      success: false,
      error: error.message || 'Failed to disconnect integration'
    };
  }
}

// Sync integration data
export async function syncIntegration(
  accessToken: string,
  integrationId: string
): Promise<{ success: boolean; syncResult?: SyncResult; integration?: Integration; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/integrations/${integrationId}/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to sync integration');
    }

    return {
      success: true,
      syncResult: data.syncResult,
      integration: data.integration
    };
  } catch (error) {
    console.error('Error syncing integration:', error);
    return {
      success: false,
      error: error.message || 'Failed to sync integration'
    };
  }
}

// Get integration logs
export async function getIntegrationLogs(
  accessToken: string,
  integrationId: string
): Promise<{ success: boolean; logs?: IntegrationLog[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/integrations/${integrationId}/logs`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch integration logs');
    }

    return {
      success: true,
      logs: data.logs || []
    };
  } catch (error) {
    console.error('Error fetching integration logs:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch integration logs'
    };
  }
}

// Test integration connection
export async function testIntegrationConnection(
  accessToken: string,
  integrationId: string
): Promise<{ success: boolean; testResult?: TestResult; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/integrations/${integrationId}/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to test integration connection');
    }

    return {
      success: true,
      testResult: data.testResult
    };
  } catch (error) {
    console.error('Error testing integration connection:', error);
    return {
      success: false,
      error: error.message || 'Failed to test integration connection'
    };
  }
}

// Helper function to get integration status summary
export function getIntegrationStatusSummary(integrations: Integration[]) {
  const connected = integrations.filter(i => i.status === 'connected').length;
  const disconnected = integrations.filter(i => i.status === 'disconnected').length;
  const error = integrations.filter(i => i.status === 'error').length;
  
  return {
    total: integrations.length,
    connected,
    disconnected,
    error,
    health: error === 0 ? (connected > 0 ? 'good' : 'none') : 'warning'
  };
}

// Helper function to format last sync time
export function formatLastSync(lastSync?: string): string {
  if (!lastSync) return 'Never';
  
  const syncDate = new Date(lastSync);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
  
  return syncDate.toLocaleDateString();
}

// Integration templates for easy setup
export const integrationTemplates = {
  slack: {
    name: 'Slack',
    description: 'Get real-time notifications about applications and interviews',
    requiredCredentials: [
      { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...' },
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/...' }
    ],
    defaultSettings: {
      notifyOnApplication: true,
      notifyOnInterview: true,
      channel: '#hiring'
    }
  },
  workday: {
    name: 'Workday',
    description: 'Sync candidate data with Workday HCM',
    requiredCredentials: [
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'tenant', label: 'Tenant', type: 'text', placeholder: 'company_tenant' }
    ],
    defaultSettings: {
      syncCandidates: true,
      syncJobs: true,
      syncFrequency: 'hourly'
    }
  },
  google_workspace: {
    name: 'Google Workspace',
    description: 'Integrate with Gmail, Calendar, and Drive',
    requiredCredentials: [
      { key: 'clientId', label: 'Client ID', type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' }
    ],
    defaultSettings: {
      syncCalendar: true,
      syncEmail: true,
      syncDrive: false
    }
  },
  calendly: {
    name: 'Calendly',
    description: 'Automatically schedule interviews with candidates',
    requiredCredentials: [
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'organizationUri', label: 'Organization URI', type: 'url' }
    ],
    defaultSettings: {
      autoSchedule: true,
      timezonHandling: 'auto',
      reminderEmails: true
    }
  }
};
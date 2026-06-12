import { projectId, publicAnonKey } from '../supabase/info';

interface HealthCheckResult {
  success: boolean;
  message: string;
  details?: {
    endpoint: string;
    status: number;
    responseTime: number;
    headers?: Record<string, string>;
  };
  error?: string;
}

interface ServiceDiagnostic {
  serviceName: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime?: number;
  error?: string;
  endpoint?: string;
}

/**
 * Comprehensive backend health checker that tests multiple endpoints
 * and provides detailed diagnostics for troubleshooting
 */
export class BackendHealthChecker {
  private static instance: BackendHealthChecker;
  private diagnostics: Map<string, ServiceDiagnostic> = new Map();

  static getInstance(): BackendHealthChecker {
    if (!BackendHealthChecker.instance) {
      BackendHealthChecker.instance = new BackendHealthChecker();
    }
    return BackendHealthChecker.instance;
  }

  /**
   * Test a single endpoint with timeout and detailed response info
   */
  private async testEndpoint(
    name: string,
    url: string,
    options: RequestInit = {},
    timeout: number = 8000
  ): Promise<HealthCheckResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const startTime = Date.now();

    try {
      console.log(`ðŸ” Testing ${name}: ${url}`);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const responseTime = Date.now() - startTime;
      clearTimeout(timeoutId);

      console.log(`ðŸ“Š ${name} response: ${response.status} in ${responseTime}ms`);

      const result: HealthCheckResult = {
        success: response.ok,
        message: response.ok 
          ? `${name} is healthy (${responseTime}ms)` 
          : `${name} returned ${response.status}`,
        details: {
          endpoint: name,
          status: response.status,
          responseTime,
          headers: Object.fromEntries(response.headers.entries())
        }
      };

      if (response.ok) {
        // Try to get response data for additional context
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            result.message += ` - ${data.message || data.status || 'OK'}`;
          } else {
            const text = await response.text();
            if (text.length < 100) {
              result.message += ` - ${text}`;
            }
          }
        } catch (parseError) {
          // Response parsing failed but status was OK, so still count as success
          result.message += ' (response parse failed but endpoint accessible)';
        }
      } else {
        // Try to get error details
        try {
          const errorText = await response.text();
          result.error = errorText.length < 200 ? errorText : 'Server error (response too long)';
        } catch {
          result.error = `HTTP ${response.status} - Could not read error details`;
        }
      }

      return result;

    } catch (error: any) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      console.error(`âŒ ${name} failed:`, error.message);

      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = `Timeout after ${timeout}ms`;
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error - cannot reach endpoint';
      }

      return {
        success: false,
        message: `${name} failed: ${errorMessage}`,
        details: {
          endpoint: name,
          status: 0,
          responseTime
        },
        error: errorMessage
      };
    }
  }

  /**
   * Test basic backend connectivity using the most reliable endpoints
   */
  async testBasicConnectivity(): Promise<HealthCheckResult> {
    console.log('ðŸ¥ Testing basic backend connectivity...');

    // Ordered list of COMPLETELY PUBLIC endpoints to test (most reliable first)
    const endpoints = [
      {
        name: 'Public Health Text',
        url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-text`,
        options: {},
        timeout: 3000
      },
      {
        name: 'Public Health Check',
        url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/public-health-check`,
        options: {},
        timeout: 4000
      },
      {
        name: 'Simple Test',
        url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/simple-test`,
        options: {},
        timeout: 5000
      },
      {
        name: 'Ultra Ping',
        url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/ultra-ping`,
        options: {},
        timeout: 3000
      },
      {
        name: 'Raw Test',
        url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/raw-test`,
        options: {},
        timeout: 3000
      }
    ];

    // Test endpoints in order until one succeeds
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      
      try {
        const result = await this.testEndpoint(
          endpoint.name,
          endpoint.url,
          endpoint.options,
          endpoint.timeout
        );

        // Update diagnostics
        this.diagnostics.set('backend', {
          serviceName: 'Backend Service',
          status: result.success ? 'healthy' : 'unhealthy',
          lastCheck: new Date(),
          responseTime: result.details?.responseTime,
          error: result.error,
          endpoint: endpoint.name
        });

        if (result.success) {
          console.log(`âœ… Backend connectivity confirmed via ${endpoint.name}`);
          return {
            success: true,
            message: `Backend is accessible via ${endpoint.name} (${result.details?.responseTime}ms)`,
            details: result.details
          };
        } else {
          console.log(`âš ï¸ ${endpoint.name} failed, trying next...`);
        }

      } catch (error) {
        const errorMessage = error.message || 'Unknown error';
        console.log(`âš ï¸ ${endpoint.name} error: ${errorMessage}`);
        
        // Handle specific fetch errors
        if (errorMessage.includes('Failed to fetch')) {
          console.log(`   ðŸ’¡ This is likely a CORS or network connectivity issue`);
        } else if (errorMessage.includes('TypeError')) {
          console.log(`   ðŸ’¡ This might be a browser security restriction`);
        }
      }
    }

    // All endpoints failed
    this.diagnostics.set('backend', {
      serviceName: 'Backend Service',
      status: 'unhealthy',
      lastCheck: new Date(),
      error: 'All endpoints unreachable - likely deployment or network issue'
    });

    return {
      success: false,
      message: 'Backend is unreachable - all health endpoints failed',
      error: 'This could indicate: 1) Edge Function not deployed, 2) Network/CORS issues, 3) Invalid project configuration'
    };
  }

  /**
   * Test integration service specifically
   */
  async testIntegrationService(): Promise<HealthCheckResult> {
    console.log('ðŸ”— Testing integration service...');

    // Use PUBLIC integration endpoints that don't require authentication
    const integrationEndpoints = [
      {
        name: 'Integration Status (Public)',
        url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integration-status`,
        options: {}
      },
      {
        name: 'Integration Health (Public)',
        url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integration-health`,
        options: {}
      },
      {
        name: 'Integrations Health (Backup)',
        url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations-health`,
        options: {}
      },
      {
        name: 'Integration Debug (Public)',
        url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integration-debug`,
        options: {}
      },
      {
        name: 'Integration Simple Health',
        url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations-simple-health`,
        options: {}
      },
      {
        name: 'Ultra Integration Health',
        url: `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/ultra-integration-health`,
        options: {}
      }
    ];

    for (const endpoint of integrationEndpoints) {
      const result = await this.testEndpoint(endpoint.name, endpoint.url, endpoint.options);
      
      this.diagnostics.set('integrations', {
        serviceName: 'Integration Service',
        status: result.success ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        responseTime: result.details?.responseTime,
        error: result.error,
        endpoint: endpoint.name
      });

      if (result.success) {
        return result;
      }
    }

    return {
      success: false,
      message: 'Integration service is unreachable',
      error: 'All integration endpoints failed'
    };
  }

  /**
   * Test authentication flow
   */
  async testAuthentication(accessToken: string): Promise<HealthCheckResult> {
    console.log('ðŸ” Testing authentication...');

    if (!accessToken) {
      return {
        success: false,
        message: 'No access token provided',
        error: 'Authentication token is required'
      };
    }

    const result = await this.testEndpoint(
      'Auth Debug',
      `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/debug-auth`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    this.diagnostics.set('auth', {
      serviceName: 'Authentication',
      status: result.success ? 'healthy' : 'unhealthy',
      lastCheck: new Date(),
      responseTime: result.details?.responseTime,
      error: result.error,
      endpoint: 'Auth Debug'
    });

    return result;
  }

  /**
   * Run comprehensive health check
   */
  async runFullDiagnostic(accessToken?: string): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    checks: HealthCheckResult[];
    summary: string;
    recommendations: string[];
  }> {
    console.log('ðŸ” Running comprehensive health diagnostic...');

    const checks: HealthCheckResult[] = [];
    const recommendations: string[] = [];

    // 1. Basic connectivity
    const connectivityResult = await this.testBasicConnectivity();
    checks.push(connectivityResult);

    if (!connectivityResult.success) {
      recommendations.push('Check if the Supabase Edge Function is deployed');
      recommendations.push('Verify your internet connection');
      recommendations.push('Check Supabase dashboard for service status');
    }

    // 2. Integration service (only if basic connectivity works)
    if (connectivityResult.success) {
      const integrationResult = await this.testIntegrationService();
      checks.push(integrationResult);

      if (!integrationResult.success) {
        recommendations.push('Integration module may have deployment issues');
        recommendations.push('Check server logs for integration-specific errors');
      }
    }

    // 3. Authentication (only if user provided token)
    if (accessToken && connectivityResult.success) {
      const authResult = await this.testAuthentication(accessToken);
      checks.push(authResult);

      if (!authResult.success) {
        recommendations.push('Try signing out and signing back in');
        recommendations.push('Clear browser cache and cookies');
        recommendations.push('Check if session has expired');
      }
    }

    // Determine overall status
    const successfulChecks = checks.filter(c => c.success).length;
    const totalChecks = checks.length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    let summary: string;

    if (successfulChecks === totalChecks) {
      overall = 'healthy';
      summary = 'All systems operational';
    } else if (successfulChecks > 0) {
      overall = 'degraded';
      summary = `${successfulChecks}/${totalChecks} services operational`;
    } else {
      overall = 'unhealthy';
      summary = 'All services unavailable';
    }

    return {
      overall,
      checks,
      summary,
      recommendations
    };
  }

  /**
   * Get current diagnostics
   */
  getDiagnostics(): ServiceDiagnostic[] {
    return Array.from(this.diagnostics.values());
  }

  /**
   * Clear all diagnostics
   */
  clearDiagnostics(): void {
    this.diagnostics.clear();
  }
}

// Export singleton instance
export const healthChecker = BackendHealthChecker.getInstance();

// Export convenience functions
export const testBasicConnectivity = () => healthChecker.testBasicConnectivity();
export const testIntegrationService = () => healthChecker.testIntegrationService();
export const testAuthentication = (token: string) => healthChecker.testAuthentication(token);
export const runFullDiagnostic = (token?: string) => healthChecker.runFullDiagnostic(token);
export const getDiagnostics = () => healthChecker.getDiagnostics();







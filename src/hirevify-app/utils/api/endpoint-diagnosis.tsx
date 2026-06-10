import { projectId, publicAnonKey } from '../supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`;

export interface EndpointDiagnosis {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  responseTime: number;
  error?: string;
  response?: any;
  headers?: Record<string, string>;
}

export interface DiagnosisReport {
  timestamp: string;
  totalEndpoints: number;
  successfulEndpoints: number;
  failedEndpoints: number;
  results: EndpointDiagnosis[];
  recommendations: string[];
}

export async function diagnoseAllEndpoints(): Promise<DiagnosisReport> {
  console.log('🔍 Starting comprehensive endpoint diagnosis...');
  
  const endpoints = [
    // Ultra-simple endpoints (absolutely no middleware)
    { url: `${API_BASE}/ultra-ping`, name: 'Ultra Ping (No Middleware)', method: 'GET' },
    { url: `${API_BASE}/raw-test`, name: 'Raw Test (No JSON)', method: 'GET' },
    
    // Main server endpoints (should always work)
    { url: `${API_BASE}/health`, name: 'Main Health Check', method: 'GET' },
    { url: `${API_BASE}/ping`, name: 'Ping Test', method: 'GET' },
    { url: `${API_BASE}/test-no-auth`, name: 'No-Auth Test', method: 'GET' },
    
    // Integration backup endpoints
    { url: `${API_BASE}/integrations-health`, name: 'Integration Health Backup', method: 'GET' },
    { url: `${API_BASE}/integration-health`, name: 'Integration Health Main', method: 'GET' },
    { url: `${API_BASE}/integration-status`, name: 'Integration Status', method: 'GET' },
    { url: `${API_BASE}/integration-debug`, name: 'Integration Debug', method: 'GET' },
    
    // Integration service endpoints (may fail)
    { url: `${API_BASE}/integrations/health`, name: 'Integration Service Health', method: 'GET' },
    { url: `${API_BASE}/integrations/status`, name: 'Integration Service Status', method: 'GET' },
    { url: `${API_BASE}/integrations/debug`, name: 'Integration Service Debug', method: 'GET' },
    { url: `${API_BASE}/integrations/ping`, name: 'Integration Service Ping', method: 'GET' },
    { url: `${API_BASE}/integrations/test-kv`, name: 'Integration KV Test', method: 'GET' },
    { url: `${API_BASE}/integrations/test-routes`, name: 'Integration Routes Test', method: 'GET' },
  ];
  
  const results: EndpointDiagnosis[] = [];
  let successfulCount = 0;
  let failedCount = 0;
  
  for (const endpoint of endpoints) {
    console.log(`🔍 Testing ${endpoint.name}...`);
    
    const startTime = Date.now();
    let diagnosis: EndpointDiagnosis;
    
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      const headers = Object.fromEntries(response.headers.entries());
      
      let responseData;
      let parseError;
      
      try {
        const responseText = await response.text();
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch (jsonError) {
        parseError = `JSON parse error: ${jsonError.message}`;
      }
      
      diagnosis = {
        endpoint: endpoint.name,
        method: endpoint.method,
        status: response.status,
        success: response.ok,
        responseTime,
        headers,
        response: responseData,
        error: parseError || (!response.ok ? `HTTP ${response.status}` : undefined)
      };
      
      if (response.ok) {
        successfulCount++;
        console.log(`✅ ${endpoint.name}: ${response.status} (${responseTime}ms)`);
      } else {
        failedCount++;
        console.log(`❌ ${endpoint.name}: ${response.status} (${responseTime}ms)`);
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      diagnosis = {
        endpoint: endpoint.name,
        method: endpoint.method,
        status: 0,
        success: false,
        responseTime,
        error: error.message || 'Unknown error'
      };
      
      failedCount++;
      console.log(`💥 ${endpoint.name}: ${error.message} (${responseTime}ms)`);
    }
    
    results.push(diagnosis);
  }
  
  // Generate recommendations based on results
  const recommendations: string[] = [];
  
  const mainServerEndpoints = results.filter(r => 
    r.endpoint.includes('Main Health') || r.endpoint.includes('Ping') || r.endpoint.includes('No-Auth')
  );
  const integrationBackups = results.filter(r => 
    r.endpoint.includes('Backup') || r.endpoint.includes('Integration Health Main') || r.endpoint.includes('Integration Status')
  );
  const integrationService = results.filter(r => 
    r.endpoint.includes('Integration Service')
  );
  
  const mainServerWorking = mainServerEndpoints.some(r => r.success);
  const backupEndpointsWorking = integrationBackups.some(r => r.success);
  const serviceEndpointsWorking = integrationService.some(r => r.success);
  
  if (!mainServerWorking) {
    recommendations.push('Critical: Main server is not responding. Check if the Supabase Edge Function is deployed and running.');
  } else {
    recommendations.push('✅ Main server is working correctly.');
  }
  
  if (mainServerWorking && !backupEndpointsWorking) {
    recommendations.push('Warning: Integration backup endpoints are not working. Check main server routing.');
  } else if (backupEndpointsWorking) {
    recommendations.push('✅ Integration backup endpoints are working.');
  }
  
  if (mainServerWorking && backupEndpointsWorking && !serviceEndpointsWorking) {
    recommendations.push('Issue: Integration service module has problems. Check integration service routing and auth.');
  } else if (serviceEndpointsWorking) {
    recommendations.push('✅ Integration service is working correctly.');
  }
  
  // Check for specific 401 patterns
  const auth401Errors = results.filter(r => r.status === 401);
  if (auth401Errors.length > 0) {
    recommendations.push(`Authentication Issue: ${auth401Errors.length} endpoints returning 401 errors. These should be public endpoints.`);
    recommendations.push('Suggestion: Check if there is global authentication middleware interfering with public routes.');
  }
  
  // Check for CORS issues
  const corsErrors = results.filter(r => r.error?.includes('CORS') || r.error?.includes('fetch'));
  if (corsErrors.length > 0) {
    recommendations.push(`CORS Issue: ${corsErrors.length} endpoints may have CORS problems.`);
  }
  
  const report: DiagnosisReport = {
    timestamp: new Date().toISOString(),
    totalEndpoints: endpoints.length,
    successfulEndpoints: successfulCount,
    failedEndpoints: failedCount,
    results,
    recommendations
  };
  
  console.log('🔍 Endpoint diagnosis completed:', {
    total: report.totalEndpoints,
    successful: report.successfulEndpoints,
    failed: report.failedEndpoints,
    successRate: `${Math.round((successfulCount / endpoints.length) * 100)}%`
  });
  
  return report;
}

export function formatDiagnosisReport(report: DiagnosisReport): string {
  let output = '🔍 Endpoint Diagnosis Report\n\n';
  
  output += `📊 Summary:\n`;
  output += `  • Total Endpoints: ${report.totalEndpoints}\n`;
  output += `  • Successful: ${report.successfulEndpoints}\n`;
  output += `  • Failed: ${report.failedEndpoints}\n`;
  output += `  • Success Rate: ${Math.round((report.successfulEndpoints / report.totalEndpoints) * 100)}%\n`;
  output += `  • Timestamp: ${report.timestamp}\n\n`;
  
  output += `📋 Detailed Results:\n`;
  for (const result of report.results) {
    const status = result.success ? '✅' : '❌';
    const timing = `${result.responseTime}ms`;
    const statusCode = result.status > 0 ? `HTTP ${result.status}` : 'No Response';
    
    output += `  ${status} ${result.endpoint}: ${statusCode} (${timing})\n`;
    if (result.error) {
      output += `      Error: ${result.error}\n`;
    }
    if (result.response?.message) {
      output += `      Message: ${result.response.message}\n`;
    }
  }
  
  if (report.recommendations.length > 0) {
    output += `\n💡 Recommendations:\n`;
    for (const recommendation of report.recommendations) {
      output += `  • ${recommendation}\n`;
    }
  }
  
  return output;
}

export async function quickHealthCheck(): Promise<{ working: string[]; failing: string[] }> {
  const working: string[] = [];
  const failing: string[] = [];
  
  const quickEndpoints = [
    { url: `${API_BASE}/test-no-auth`, name: 'No-Auth Test' },
    { url: `${API_BASE}/integrations-health`, name: 'Integration Backup' },
    { url: `${API_BASE}/integrations/health`, name: 'Integration Service' },
  ];
  
  for (const endpoint of quickEndpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        working.push(endpoint.name);
      } else {
        failing.push(`${endpoint.name} (${response.status})`);
      }
    } catch (error) {
      failing.push(`${endpoint.name} (${error.message})`);
    }
  }
  
  return { working, failing };
}





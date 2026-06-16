import { projectId } from '../supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`;

export interface QuickTestResult {
  endpoint: string;
  working: boolean;
  status: number;
  error?: string;
  response?: any;
}

export async function runQuickConnectivityTest(): Promise<{
  allWorking: boolean;
  anyWorking: boolean;
  results: QuickTestResult[];
  summary: string;
}> {
  console.log('ðŸ§ª Running quick connectivity test...');
  
  const testEndpoints = [
    { name: 'Ultra Ping', url: `${API_BASE}/ultra-ping` },
    { name: 'Raw Test', url: `${API_BASE}/raw-test` },
    { name: 'Main Health', url: `${API_BASE}/health` },
    { name: 'Integration Backup', url: `${API_BASE}/integrations-health` },
    { name: 'Integration Service', url: `${API_BASE}/integrations/health` },
  ];
  
  const results: QuickTestResult[] = [];
  let workingCount = 0;
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      let responseData;
      let parseError;
      
      try {
        const text = await response.text();
        if (text.trim().startsWith('{')) {
          responseData = JSON.parse(text);
        } else {
          responseData = text;
        }
      } catch (err) {
        parseError = err.message;
      }
      
      const isWorking = response.ok;
      if (isWorking) workingCount++;
      
      results.push({
        endpoint: endpoint.name,
        working: isWorking,
        status: response.status,
        response: responseData,
        error: !response.ok ? `HTTP ${response.status}` : parseError
      });
      
      console.log(`${isWorking ? 'âœ…' : 'âŒ'} ${endpoint.name}: ${response.status}`);
      
    } catch (error) {
      results.push({
        endpoint: endpoint.name,
        working: false,
        status: 0,
        error: error.message
      });
      
      console.log(`ðŸ’¥ ${endpoint.name}: ${error.message}`);
    }
  }
  
  const allWorking = workingCount === testEndpoints.length;
  const anyWorking = workingCount > 0;
  
  let summary;
  if (allWorking) {
    summary = `ðŸŽ‰ All ${testEndpoints.length} endpoints are working correctly!`;
  } else if (anyWorking) {
    summary = `âš ï¸ ${workingCount}/${testEndpoints.length} endpoints are working. Some features may be limited.`;
  } else {
    summary = `âŒ No endpoints are accessible. Backend appears to be completely down.`;
  }
  
  console.log(summary);
  
  return {
    allWorking,
    anyWorking,
    results,
    summary
  };
}

// Ultra-simple test that just checks if ANY endpoint responds
export async function ultraSimpleTest(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/ultra-ping`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
}







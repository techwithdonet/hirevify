import { projectId, publicAnonKey } from '../supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`;

export interface AuthTestResult {
 success: boolean;
 step: string;
 message: string;
 data?: any;
 error?: string;
 timestamp: string;
}

export interface ComprehensiveTestReport {
 success: boolean;
 steps: AuthTestResult[];
 summary: string;
 recommendations?: string[];
 finalStatus: 'all_passed' | 'partial_success' | 'failed';
}

// Run a comprehensive integration authentication test
export async function runComprehensiveIntegrationAuthTest(
 accessToken: string,
 userEmail?: string
): Promise<ComprehensiveTestReport> {
 console.log(' Starting comprehensive integration authentication test...');
 console.log(' Token (first 30 chars):', accessToken? accessToken.substring(0, 30) + '...': 'NO TOKEN');
 
 const steps: AuthTestResult[] = [];
 const startTime = Date.now();
 
 // Step 1: Test basic service connectivity
 try {
 console.log(' Step 1: Testing basic service connectivity...');
 
 const healthResponse = await fetch(`${API_BASE}/integrations/health`, {
 method: 'GET',
 headers: {
 'Content-Type': 'application/json',
 },
 });
 
 if (healthResponse.ok) {
 const healthData = await healthResponse.json();
 steps.push({
 success: true,
 step: 'service_connectivity',
 message: 'Integration service is accessible',
 data: { status: healthData.status, version: healthData.version },
 timestamp: new Date().toISOString()
 });
 console.log('Done Step 1: Service connectivity passed');
 } else {
 throw new Error(`Health check failed with status ${healthResponse.status}`);
 }
 } catch (error) {
 console.log('Error Step 1: Service connectivity failed');
 steps.push({
 success: false,
 step: 'service_connectivity',
 message: 'Integration service is not accessible',
 error: error.message,
 timestamp: new Date().toISOString()
 });
 }
 
 // Step 2: Test KV store access
 try {
 console.log('—„ï Step 2: Testing KV store access...');
 
 const kvResponse = await fetch(`${API_BASE}/integrations/test-kv`, {
 method: 'GET',
 headers: {
 'Content-Type': 'application/json',
 },
 });
 
 if (kvResponse.ok) {
 const kvData = await kvResponse.json();
 if (kvData.success) {
 steps.push({
 success: true,
 step: 'kv_store_access',
 message: 'KV store is accessible and working',
 data: { 
 sessionCount: kvData.tests?.sessionCount || 0,
 allTestsPassed: kvData.tests
 },
 timestamp: new Date().toISOString()
 });
 console.log('Done Step 2: KV store access passed');
 } else {
 throw new Error(kvData.error || 'KV store test failed');
 }
 } else {
 throw new Error(`KV test failed with status ${kvResponse.status}`);
 }
 } catch (error) {
 console.log('Error Step 2: KV store access failed');
 steps.push({
 success: false,
 step: 'kv_store_access',
 message: 'KV store is not accessible',
 error: error.message,
 timestamp: new Date().toISOString()
 });
 }
 
 // Step 3: Test session validation in auth service
 if (accessToken) {
 try {
 console.log(' Step 3: Testing session in auth service...');
 
 const sessionResponse = await fetch(`${API_BASE}/auth/debug-session`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${publicAnonKey}`
 },
 body: JSON.stringify({
 token: accessToken
 })
 });
 
 if (sessionResponse.ok) {
 const sessionData = await sessionResponse.json();
 if (sessionData.exists &&!sessionData.session?.isExpired) {
 steps.push({
 success: true,
 step: 'session_validation',
 message: 'Session exists and is valid in auth service',
 data: {
 userId: sessionData.session?.userId,
 email: sessionData.session?.email,
 userType: sessionData.session?.userType,
 expiresAt: sessionData.session?.expiresAt
 },
 timestamp: new Date().toISOString()
 });
 console.log('Done Step 3: Session validation passed');
 } else {
 throw new Error(sessionData.session?.isExpired? 'Session has expired': 'Session not found');
 }
 } else {
 throw new Error(`Session validation failed with status ${sessionResponse.status}`);
 }
 } catch (error) {
 console.log('Error Step 3: Session validation failed');
 steps.push({
 success: false,
 step: 'session_validation',
 message: 'Session validation failed',
 error: error.message,
 timestamp: new Date().toISOString()
 });
 }
 } else {
 steps.push({
 success: false,
 step: 'session_validation',
 message: 'Cannot validate session - no access token provided',
 error: 'No access token',
 timestamp: new Date().toISOString()
 });
 }
 
 // Step 4: Test integration service authentication
 if (accessToken) {
 try {
 console.log(' Step 4: Testing integration service authentication...');
 
 const authResponse = await fetch(`${API_BASE}/integrations/debug-auth`, {
 method: 'POST',
 headers: {
 'Authorization': `Bearer ${accessToken}`,
 'Content-Type': 'application/json',
 },
 });
 
 if (authResponse.ok) {
 const authData = await authResponse.json();
 if (authData.success) {
 steps.push({
 success: true,
 step: 'integration_auth',
 message: 'Integration service authentication successful',
 data: {
 userId: authData.user?.id,
 email: authData.user?.email,
 userType: authData.user?.userType
 },
 timestamp: new Date().toISOString()
 });
 console.log('Done Step 4: Integration authentication passed');
 } else {
 throw new Error(authData.error || 'Integration auth failed');
 }
 } else {
 const errorData = await authResponse.json().catch(() => ({}));
 throw new Error(errorData.error || `Integration auth failed with status ${authResponse.status}`);
 }
 } catch (error) {
 console.log('Error Step 4: Integration authentication failed');
 steps.push({
 success: false,
 step: 'integration_auth',
 message: 'Integration service authentication failed',
 error: error.message,
 timestamp: new Date().toISOString()
 });
 }
 } else {
 steps.push({
 success: false,
 step: 'integration_auth',
 message: 'Cannot test integration authentication - no access token provided',
 error: 'No access token',
 timestamp: new Date().toISOString()
 });
 }
 
 // Step 5: Test integration list endpoint
 if (accessToken) {
 try {
 console.log('‹ Step 5: Testing integration list endpoint...');
 
 const listResponse = await fetch(`${API_BASE}/integrations/list`, {
 method: 'GET',
 headers: {
 'Authorization': `Bearer ${accessToken}`,
 'Content-Type': 'application/json',
 },
 });
 
 if (listResponse.ok) {
 const listData = await listResponse.json();
 if (listData.success!== undefined) {
 steps.push({
 success: true,
 step: 'integration_list',
 message: 'Integration list endpoint working',
 data: {
 integrationCount: listData.count || 0,
 success: listData.success
 },
 timestamp: new Date().toISOString()
 });
 console.log('Done Step 5: Integration list passed');
 } else {
 throw new Error('Invalid response format from integration list');
 }
 } else {
 const errorData = await listResponse.json().catch(() => ({}));
 throw new Error(errorData.error || `List request failed with status ${listResponse.status}`);
 }
 } catch (error) {
 console.log('Error Step 5: Integration list failed');
 steps.push({
 success: false,
 step: 'integration_list',
 message: 'Integration list endpoint failed',
 error: error.message,
 timestamp: new Date().toISOString()
 });
 }
 } else {
 steps.push({
 success: false,
 step: 'integration_list',
 message: 'Cannot test integration list - no access token provided',
 error: 'No access token',
 timestamp: new Date().toISOString()
 });
 }
 
 // Generate report
 const passedSteps = steps.filter(step => step.success);
 const failedSteps = steps.filter(step =>!step.success);
 const totalTime = Date.now() - startTime;
 
 let finalStatus: 'all_passed' | 'partial_success' | 'failed';
 let summary: string;
 
 if (failedSteps.length === 0) {
 finalStatus = 'all_passed';
 summary = `Done All 5 steps passed! Integration Hub is fully functional. Test completed in ${totalTime}ms.`;
 } else if (passedSteps.length > 0) {
 finalStatus = 'partial_success';
 summary = `Warning Partial success: ${passedSteps.length}/${steps.length} steps passed. ${failedSteps.length} issues need to be resolved.`;
 } else {
 finalStatus = 'failed';
 summary = `Error All steps failed. Integration Hub is not functional.`;
 }
 
 const recommendations: string[] = [];
 
 // Generate specific recommendations based on failed steps
 failedSteps.forEach(step => {
 switch (step.step) {
 case 'service_connectivity':
 recommendations.push('Check if the Supabase Edge Function is deployed and running');
 recommendations.push('Verify your project ID and API endpoint configuration');
 break;
 case 'kv_store_access':
 recommendations.push('Check KV store configuration and permissions');
 recommendations.push('Ensure the database is accessible from the Edge Function');
 break;
 case 'session_validation':
 recommendations.push('Sign out and sign back in to refresh your session');
 recommendations.push('Check if your session has expired');
 break;
 case 'integration_auth':
 recommendations.push('Verify that session tokens are being stored correctly');
 recommendations.push('Check if there\'s a mismatch between auth and integration services');
 break;
 case 'integration_list':
 recommendations.push('Verify that the integration endpoints are correctly mounted');
 recommendations.push('Check for any route configuration issues');
 break;
 }
 });
 
 const report: ComprehensiveTestReport = {
 success: finalStatus === 'all_passed',
 steps,
 summary,
 recommendations: recommendations.length > 0? recommendations: undefined,
 finalStatus
 };
 
 console.log(' Test report generated:', {
 finalStatus,
 passedSteps: passedSteps.length,
 failedSteps: failedSteps.length,
 totalTime: `${totalTime}ms`
 });
 
 return report;
}

// Quick authentication diagnostic
export async function quickAuthDiagnostic(accessToken: string) {
 console.log(' Running quick authentication diagnostic...');
 
 if (!accessToken) {
 return {
 success: false,
 message: 'No access token provided',
 recommendations: ['Please sign in first']
 };
 }
 
 try {
 // Test integration auth directly
 const response = await fetch(`${API_BASE}/integrations/debug-auth`, {
 method: 'POST',
 headers: {
 'Authorization': `Bearer ${accessToken}`,
 'Content-Type': 'application/json',
 },
 });
 
 const data = await response.json();
 
 if (response.ok && data.success) {
 return {
 success: true,
 message: `Authentication working for ${data.user.email}`,
 user: data.user
 };
 } else {
 return {
 success: false,
 message: data.error || `Authentication failed with status ${response.status}`,
 statusCode: response.status,
 recommendations: response.status === 401? ['Please sign out and sign back in', 'Check if your session has expired']: ['Check server logs for detailed error information']
 };
 }
 } catch (error) {
 return {
 success: false,
 message: `Network error: ${error.message}`,
 recommendations: ['Check your internet connection', 'Verify the backend is running']
 };
 }
}

// Test specific integration endpoint
export async function testIntegrationEndpoint(accessToken: string, endpoint: string) {
 console.log(` Testing integration endpoint: ${endpoint}`);
 
 try {
 const response = await fetch(`${API_BASE}/integrations${endpoint}`, {
 method: 'GET',
 headers: {
 'Authorization': `Bearer ${accessToken}`,
 'Content-Type': 'application/json',
 },
 });
 
 const data = await response.json();
 
 return {
 success: response.ok,
 status: response.status,
 data,
 endpoint,
 timestamp: new Date().toISOString()
 };
 } catch (error) {
 return {
 success: false,
 error: error.message,
 endpoint,
 timestamp: new Date().toISOString()
 };
 }
}







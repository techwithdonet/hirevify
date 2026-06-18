// Mock integration service for testing and offline mode
import { 
 type Integration, 
 type IntegrationCredentials, 
 type IntegrationSettings,
 type SyncResult,
 type TestResult,
 type IntegrationLog
} from './integrations';

// Mock storage for integration data
let mockConnectedIntegrations: Integration[] = [
 {
 id: 'slack',
 name: 'Slack',
 status: 'connected',
 lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
 settings: { 
 channel: '#hiring',
 notifyOnApplication: true,
 notifyOnInterview: true 
 },
 metadata: { 
 connectedAt: '2024-01-15T10:30:00Z',
 connectedBy: 'user123'
 }
 }
];

let mockLogs: IntegrationLog[] = [
 {
 userId: 'user123',
 integrationId: 'slack',
 eventType: 'sync',
 data: { status: 'completed', recordsProcessed: 5 },
 timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
 },
 {
 userId: 'user123',
 integrationId: 'slack',
 eventType: 'connection_test',
 data: { success: true, message: 'Slack connection successful', response_time: '150ms' },
 timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
 }
];

// Simulate network delay (reduced for better UX)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple error handling wrapper
const safeOperation = async <T,>(operation: () => Promise<T>, defaultValue: T): Promise<T> => {
 try {
 return await operation();
 } catch (error) {
 console.warn('Mock integration operation failed, using default:', error);
 return defaultValue;
 }
};

export class MockIntegrationService {
 static async getUserIntegrations(): Promise<{ success: boolean; integrations?: Integration[]; error?: string }> {
 return safeOperation(async () => {
 await delay(100); // Reduced delay for better UX
 
 console.log(' Mock: Fetching user integrations...');
 return {
 success: true,
 integrations: [...mockConnectedIntegrations]
 };
 }, {
 success: true,
 integrations: []
 });
 }

 static async getIntegration(integrationId: string): Promise<{ success: boolean; integration?: Integration; error?: string }> {
 await delay(200);
 
 console.log(' Mock: Fetching integration:', integrationId);
 const integration = mockConnectedIntegrations.find(i => i.id === integrationId);
 
 if (!integration) {
 return {
 success: false,
 error: 'Integration not found'
 };
 }
 
 return {
 success: true,
 integration
 };
 }

 static async connectIntegration(
 integrationId: string,
 credentials: IntegrationCredentials,
 settings?: IntegrationSettings
 ): Promise<{ success: boolean; integration?: Integration; error?: string }> {
 return safeOperation(async () => {
 await delay(800); // Simulate connection time
 
 console.log(' Mock: Connecting integration:', integrationId, 'with credentials:', Object.keys(credentials));
 
 // Validate required credentials based on integration type
 const validationResult = this.validateCredentials(integrationId, credentials);
 if (!validationResult.valid) {
 return {
 success: false,
 error: validationResult.error
 };
 }

 // Remove existing integration if it exists
 mockConnectedIntegrations = mockConnectedIntegrations.filter(i => i.id!== integrationId);
 
 // Create new integration
 const newIntegration: Integration = {
 id: integrationId,
 name: this.getIntegrationName(integrationId),
 status: 'connected',
 lastSync: new Date().toISOString(),
 settings: settings || this.getDefaultSettings(integrationId),
 metadata: {
 connectedAt: new Date().toISOString(),
 connectedBy: 'demo-user'
 }
 };

 mockConnectedIntegrations.push(newIntegration);
 
 // Add connection log
 mockLogs.push({
 userId: 'demo-user',
 integrationId,
 eventType: 'connected',
 data: { success: true, credentials: Object.keys(credentials) },
 timestamp: new Date().toISOString()
 });

 return {
 success: true,
 integration: newIntegration
 };
 }, {
 success: false,
 error: 'Mock integration connection failed'
 });
 }

 static async disconnectIntegration(integrationId: string): Promise<{ success: boolean; error?: string }> {
 await delay(500);
 
 console.log(' Mock: Disconnecting integration:', integrationId);
 
 const existingIndex = mockConnectedIntegrations.findIndex(i => i.id === integrationId);
 if (existingIndex === -1) {
 return {
 success: false,
 error: 'Integration not found'
 };
 }

 mockConnectedIntegrations.splice(existingIndex, 1);
 
 // Add disconnection log
 mockLogs.push({
 userId: 'user123',
 integrationId,
 eventType: 'disconnected',
 data: { success: true },
 timestamp: new Date().toISOString()
 });

 return { success: true };
 }

 static async syncIntegration(integrationId: string): Promise<{ success: boolean; syncResult?: SyncResult; integration?: Integration; error?: string }> {
 await delay(800);
 
 console.log(' Mock: Syncing integration:', integrationId);
 
 const integration = mockConnectedIntegrations.find(i => i.id === integrationId);
 if (!integration) {
 return {
 success: false,
 error: 'Integration not found'
 };
 }

 if (integration.status!== 'connected') {
 return {
 success: false,
 error: 'Integration is not connected'
 };
 }

 // Simulate sync results based on integration type
 const syncResult = this.generateSyncResult(integrationId);
 
 // Update integration with new sync time
 integration.lastSync = new Date().toISOString();
 
 // Add sync log
 mockLogs.push({
 userId: 'user123',
 integrationId,
 eventType: 'sync',
 data: syncResult,
 timestamp: new Date().toISOString()
 });

 return {
 success: true,
 syncResult,
 integration
 };
 }

 static async testIntegrationConnection(integrationId: string): Promise<{ success: boolean; testResult?: TestResult; error?: string }> {
 await delay(600);
 
 console.log(' Mock: Testing integration connection:', integrationId);
 
 const integration = mockConnectedIntegrations.find(i => i.id === integrationId);
 if (!integration) {
 return {
 success: false,
 error: 'Integration not found'
 };
 }

 const testResult = this.generateTestResult(integrationId);
 
 // Add test log
 mockLogs.push({
 userId: 'user123',
 integrationId,
 eventType: 'connection_test',
 data: testResult,
 timestamp: new Date().toISOString()
 });

 return {
 success: true,
 testResult
 };
 }

 static async getIntegrationLogs(integrationId: string): Promise<{ success: boolean; logs?: IntegrationLog[]; error?: string }> {
 await delay(400);
 
 console.log(' Mock: Fetching integration logs for:', integrationId);
 
 const logs = mockLogs.filter(log => log.integrationId === integrationId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

 return {
 success: true,
 logs
 };
 }

 static async updateIntegrationSettings(
 integrationId: string,
 settings: IntegrationSettings
 ): Promise<{ success: boolean; integration?: Integration; error?: string }> {
 await delay(400);
 
 console.log(' Mock: Updating integration settings for:', integrationId, settings);
 
 const integration = mockConnectedIntegrations.find(i => i.id === integrationId);
 if (!integration) {
 return {
 success: false,
 error: 'Integration not found'
 };
 }

 integration.settings = {...integration.settings,...settings };
 if (integration.metadata) {
 integration.metadata.lastUpdated = new Date().toISOString();
 }

 return {
 success: true,
 integration
 };
 }

 static async checkServiceHealth(): Promise<{ success: boolean; status?: string; error?: string }> {
 await delay(100);
 
 console.log(' Mock: Service health check - always healthy in mock mode');
 
 return {
 success: true,
 status: 'healthy'
 };
 }

 // Helper methods
 private static validateCredentials(integrationId: string, credentials: IntegrationCredentials): { valid: boolean; error?: string } {
 if (!credentials || Object.keys(credentials).length === 0) {
 return { valid: false, error: 'Credentials are required' };
 }

 switch (integrationId) {
 case 'slack':
 if (!credentials.botToken ||!credentials.webhookUrl) {
 return { valid: false, error: 'Slack bot token and webhook URL are required' };
 }
 if (!credentials.botToken.startsWith('xoxb-')) {
 return { valid: false, error: 'Invalid Slack bot token format' };
 }
 if (!credentials.webhookUrl.includes('hooks.slack.com')) {
 return { valid: false, error: 'Invalid Slack webhook URL' };
 }
 break;
 case 'google_workspace':
 if (!credentials.clientId ||!credentials.clientSecret) {
 return { valid: false, error: 'Google Workspace client ID and secret are required' };
 }
 break;
 case 'calendly':
 if (!credentials.apiKey ||!credentials.organizationUri) {
 return { valid: false, error: 'Calendly API key and organization URI are required' };
 }
 break;
 default:
 if (Object.keys(credentials).length === 0) {
 return { valid: false, error: 'At least one credential field is required' };
 }
 }

 return { valid: true };
 }

 private static getIntegrationName(integrationId: string): string {
 const names: Record<string, string> = {
 'slack': 'Slack',
 'google_workspace': 'Google Workspace',
 'calendly': 'Calendly',
 'workday': 'Workday',
 'greenhouse': 'Greenhouse',
 'teams': 'Microsoft Teams',
 'checkr': 'Checkr',
 'tableau': 'Tableau'
 };
 return names[integrationId] || integrationId;
 }

 private static getDefaultSettings(integrationId: string): IntegrationSettings {
 switch (integrationId) {
 case 'slack':
 return {
 notifyOnApplication: true,
 notifyOnInterview: true,
 channel: '#hiring'
 };
 case 'google_workspace':
 return {
 syncCalendar: true,
 syncEmail: true,
 syncDrive: false
 };
 case 'calendly':
 return {
 autoSchedule: true,
 timezoneHandling: 'auto',
 reminderEmails: true
 };
 default:
 return {};
 }
 }

 private static generateSyncResult(integrationId: string): SyncResult {
 const recordsProcessed = Math.floor(Math.random() * 50) + 1;
 
 switch (integrationId) {
 case 'slack':
 return {
 success: true,
 recordsProcessed,
 errors: []
 };
 case 'google_workspace':
 return {
 success: true,
 recordsProcessed: recordsProcessed * 2, // More records for Google
 errors: []
 };
 case 'calendly':
 return {
 success: true,
 recordsProcessed: Math.floor(recordsProcessed / 3), // Fewer for Calendly
 errors: []
 };
 default:
 return {
 success: true,
 recordsProcessed,
 errors: []
 };
 }
 }

 private static generateTestResult(integrationId: string): TestResult {
 const responseTime = Math.floor(Math.random() * 300) + 100; // 100-400ms
 
 switch (integrationId) {
 case 'slack':
 return {
 success: true,
 message: 'Slack API connection successful',
 response_time: `${responseTime}ms`
 };
 case 'google_workspace':
 return {
 success: true,
 message: 'Google Workspace API connection successful',
 response_time: `${responseTime}ms`
 };
 case 'calendly':
 return {
 success: true,
 message: 'Calendly API connection successful',
 response_time: `${responseTime}ms`
 };
 default:
 return {
 success: true,
 message: `${this.getIntegrationName(integrationId)} connection successful`,
 response_time: `${responseTime}ms`
 };
 }
 }
}

// Export mock functions with the same interface as the real API
export const mockGetUserIntegrations = MockIntegrationService.getUserIntegrations;
export const mockGetIntegration = MockIntegrationService.getIntegration;
export const mockConnectIntegration = MockIntegrationService.connectIntegration;
export const mockDisconnectIntegration = MockIntegrationService.disconnectIntegration;
export const mockSyncIntegration = MockIntegrationService.syncIntegration;
export const mockTestIntegrationConnection = MockIntegrationService.testIntegrationConnection;
export const mockGetIntegrationLogs = MockIntegrationService.getIntegrationLogs;
export const mockUpdateIntegrationSettings = MockIntegrationService.updateIntegrationSettings;
export const mockCheckIntegrationServiceHealth = MockIntegrationService.checkServiceHealth;







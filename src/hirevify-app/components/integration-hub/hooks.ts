import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { projectId } from '../../utils/supabase/info';
import { 
 quickBackendCheck, 
 getSystemStatus, 
 testAuthenticatedIntegrationAccess,
 SystemStatus 
} from '../../utils/api/resilient-connectivity-test';
import { Integration } from './types';
import { STATUS_CHECK_INTERVAL } from './constants';

export function useIntegrationHub(user: any) {
 const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
 const [checkingStatus, setCheckingStatus] = useState(true);
 const [connectedIntegrations, setConnectedIntegrations] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 const initializeHub = async () => {
 console.log(' Initializing Integration Hub...');
 setLoading(true);
 setCheckingStatus(true);
 
 try {
 // Quick initial check
 const quickCheck = await quickBackendCheck();
 console.log(' Quick backend check result:', quickCheck);
 
 if (quickCheck) {
 // If quick check passes, do full status check
 await checkSystemStatus();
 
 // Try to load user integrations if authenticated
 if (user?.accessToken) {
 await loadUserIntegrations();
 }
 } else {
 // If quick check fails, set offline status immediately
 setSystemStatus({
 backend: 'offline',
 integrations: 'offline',
 lastCheck: new Date(),
 details: 'Backend services are unreachable'
 });
 }
 } catch (error) {
 console.error(' Hub initialization failed:', error);
 setSystemStatus({
 backend: 'unknown',
 integrations: 'unknown',
 lastCheck: new Date(),
 details: `Initialization failed: ${error.message}`
 });
 } finally {
 setLoading(false);
 setCheckingStatus(false);
 }
 };

 const checkSystemStatus = async () => {
 console.log(' Checking system status...');
 setCheckingStatus(true);
 
 try {
 const status = await getSystemStatus();
 setSystemStatus(status);
 
 console.log(' System status updated:', status);
 
 // Show appropriate toast messages
 if (status.backend === 'online' && systemStatus?.backend === 'offline') {
 toast.success('Done Backend services restored!');
 } else if (status.backend === 'offline' && systemStatus?.backend === 'online') {
 toast.error('Warning Backend services are now offline');
 }
 
 if (status.integrations === 'online' && systemStatus?.integrations === 'offline') {
 toast.success('— Integration services restored!');
 } else if (status.integrations === 'offline' && systemStatus?.integrations === 'online') {
 toast.warning(' Integration services are now offline');
 }
 
 } catch (error) {
 console.error(' Status check failed:', error);
 toast.error('Failed to check system status');
 } finally {
 setCheckingStatus(false);
 }
 };

 const loadUserIntegrations = async () => {
 if (!user?.accessToken) {
 console.log('— No access token available for loading integrations');
 return;
 }

 if (systemStatus?.integrations!== 'online') {
 console.log('— Skipping integration load - service offline');
 return;
 }

 try {
 console.log('— Loading user integrations...');
 
 const result = await testAuthenticatedIntegrationAccess(user.accessToken);
 
 if (result.success) {
 // Try to get the actual integration data
 const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/list`, {
 method: 'GET',
 headers: {
 'Authorization': `Bearer ${user.accessToken}`,
 'Content-Type': 'application/json',
 },
 });

 if (response.ok) {
 const data = await response.json();
 console.log('Done User integrations loaded:', data.integrations?.length || 0);
 setConnectedIntegrations(data.integrations || []);
 } else {
 console.log(`Warning Integration list request failed: ${response.status}`);
 setConnectedIntegrations([]);
 }
 } else {
 console.log('Error Authenticated integration access failed:', result.error);
 setConnectedIntegrations([]);
 }
 } catch (error) {
 console.error(' Error loading user integrations:', error);
 setConnectedIntegrations([]);
 }
 };

 const connectIntegration = async (integrationId: string, credentials: any) => {
 if (!user?.accessToken) {
 toast.error('Authentication required. Please sign in and try again.');
 return false;
 }

 if (systemStatus?.integrations!== 'online') {
 toast.error('Cannot connect integrations while service is offline');
 return false;
 }

 try {
 console.log('— Attempting to connect integration:', integrationId);
 
 const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d4feca44/integrations/connect`, {
 method: 'POST',
 headers: {
 'Authorization': `Bearer ${user.accessToken}`,
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({
 integrationId,
 credentials,
 settings: {}
 }),
 });

 if (response.ok) {
 const data = await response.json();
 console.log('Done Integration connected successfully:', data);
 toast.success('Integration connected successfully!');
 await loadUserIntegrations();
 return true;
 } else {
 const errorData = await response.json().catch(() => ({}));
 const errorMsg = errorData.error || 'Failed to connect integration. Please check your credentials and try again.';
 console.error('Error Integration connection failed:', errorData);
 toast.error(errorMsg);
 return false;
 }
 } catch (error) {
 console.error(' Error connecting integration:', error);
 toast.error('Connection failed due to an unexpected error. Please try again.');
 return false;
 }
 };

 // Initialize on mount and set up periodic checks
 useEffect(() => {
 initializeHub();
 
 // Set up periodic status checks
 const interval = setInterval(() => {
 if (systemStatus?.backend === 'offline' || systemStatus?.integrations === 'offline') {
 console.log('„ Periodic status check (services offline)...');
 checkSystemStatus();
 }
 }, STATUS_CHECK_INTERVAL);
 
 return () => clearInterval(interval);
 }, []);

 return {
 systemStatus,
 checkingStatus,
 connectedIntegrations,
 loading,
 checkSystemStatus,
 loadUserIntegrations,
 connectIntegration
 };
}








import { Activity, AlertCircle, Wifi, AlertTriangle, WifiOff } from 'lucide-react';
import { Integration } from './types';

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'connected':
      return 'bg-success/10 text-success border-success/20';
    case 'available':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'coming-soon':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export const getComplexityColor = (complexity: string) => {
  switch (complexity) {
    case 'simple':
      return 'text-success';
    case 'moderate':
      return 'text-warning';
    case 'advanced':
      return 'text-error';
    default:
      return 'text-muted-foreground';
  }
};

export const getSystemStatusIcon = (checkingStatus: boolean, systemStatus: any) => {
  if (checkingStatus) return { icon: Activity, color: 'text-warning animate-pulse' };
  
  if (!systemStatus) return { icon: AlertCircle, color: 'text-muted-foreground' };
  
  if (systemStatus.backend === 'online' && systemStatus.integrations === 'online') {
    return { icon: Wifi, color: 'text-success' };
  } else if (systemStatus.backend === 'online') {
    return { icon: AlertTriangle, color: 'text-warning' };
  } else {
    return { icon: WifiOff, color: 'text-error' };
  }
};

export const mergeIntegrationsWithUserData = (
  availableIntegrations: Integration[], 
  connectedIntegrations: any[]
) => {
  return availableIntegrations.map(available => {
    const connected = connectedIntegrations.find(conn => conn.id === available.id);
    if (connected) {
      return {
        ...available,
        status: connected.status as 'connected' | 'available' | 'coming-soon',
        lastSync: connected.lastSync
      };
    }
    return available;
  });
};

export const filterIntegrations = (integrations: Integration[], activeTab: string) => {
  return activeTab === 'all' 
    ? integrations 
    : integrations.filter(integration => integration.category === activeTab);
};

export const getIntegrationCounts = (connectedIntegrations: any[], mergedIntegrations: Integration[]) => {
  const connectedCount = connectedIntegrations.filter(i => i.status === 'connected').length;
  const availableCount = mergedIntegrations.filter(i => i.status === 'available').length;
  return { connectedCount, availableCount };
};
export interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'ats' | 'communication' | 'scheduling' | 'background-check' | 'analytics' | 'productivity';
  icon: string;
  status: 'connected' | 'available' | 'coming-soon';
  isPremium: boolean;
  features: string[];
  setupComplexity: 'simple' | 'moderate' | 'advanced';
  popularity: number;
  lastSync?: string;
}

export interface IntegrationHubProps {
  onBack: () => void;
  onUpgrade: () => void;
}

export interface IntegrationCardProps {
  integration: Integration;
  systemStatus: any;
  onConnect: (integration: Integration) => void;
  getStatusBadge: (status: string) => string;
  getComplexityColor: (complexity: string) => string;
}

export interface StatusIndicatorProps {
  systemStatus: any;
  checkingStatus: boolean;
  onCheckStatus: () => void;
}

export interface ConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectingIntegration: string | null;
  availableIntegrations: Integration[];
  credentials: any;
  setCredentials: (credentials: any) => void;
  onSubmit: () => void;
  loading: boolean;
}








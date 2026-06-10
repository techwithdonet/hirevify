import { Button } from '../ui/button';
import { Loader2, RefreshCw, Server } from 'lucide-react';
import { StatusIndicatorProps } from './types';
import { getSystemStatusIcon } from './utils';

export function StatusIndicator({ systemStatus, checkingStatus, onCheckStatus }: StatusIndicatorProps) {
  const statusIcon = getSystemStatusIcon(checkingStatus, systemStatus);

  return (
    <div className="flex items-center gap-4">
      {/* System Status Indicator */}
      <div className="flex items-center space-x-2 text-sm">
        <statusIcon.icon className={`w-4 h-4 ${statusIcon.color}`} />
        <Server className={`w-4 h-4 ${statusIcon.color}`} />
        <span className={statusIcon.color}>
          {checkingStatus ? 'Checking...' : 
           systemStatus?.backend === 'online' ? 'Online' : 
           systemStatus?.backend === 'offline' ? 'Offline' : 'Unknown'}
        </span>
        {systemStatus?.lastCheck && (
          <span className="text-muted-foreground text-xs">
            {systemStatus.lastCheck.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <Button 
        variant="outline" 
        onClick={onCheckStatus}
        disabled={checkingStatus}
      >
        {checkingStatus ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4 mr-2" />
        )}
        Check Status
      </Button>
    </div>
  );
}






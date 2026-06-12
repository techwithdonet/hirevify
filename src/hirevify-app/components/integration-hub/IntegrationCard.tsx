import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Clock, Settings, RefreshCw, Plus } from 'lucide-react';
import { IntegrationCardProps } from './types';

export function IntegrationCard({ 
  integration, 
  systemStatus, 
  onConnect, 
  getStatusBadge, 
  getComplexityColor 
}: IntegrationCardProps) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${
      systemStatus?.integrations !== 'online' ? 'opacity-75' : ''
    }`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{integration.icon}</div>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusBadge(integration.status)}>
                  {integration.status}
                </Badge>
                {integration.isPremium && (
                  <Badge variant="outline" className="text-warning border-warning">
                    Premium
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className={`font-medium ${getComplexityColor(integration.setupComplexity)}`}>
              {integration.setupComplexity}
            </div>
            <div className="text-muted-foreground">
              {integration.popularity}% adoption
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="mb-4">
          {integration.description}
        </CardDescription>
        
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-2">Key Features</h4>
            <div className="flex flex-wrap gap-1">
              {integration.features.slice(0, 3).map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {integration.features.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{integration.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          
          {integration.lastSync && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              Last sync: {new Date(integration.lastSync).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-6">
          {integration.status === 'connected' ? (
            <>
              <Button variant="outline" size="sm" className="flex-1" disabled={systemStatus?.integrations !== 'online'}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={systemStatus?.integrations !== 'online'}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </>
          ) : integration.status === 'available' ? (
            <Button 
              onClick={() => onConnect(integration)}
              className="flex-1"
              disabled={systemStatus?.integrations !== 'online'}
            >
              <Plus className="w-4 h-4 mr-2" />
              {systemStatus?.integrations !== 'online' ? 'Unavailable' : 'Connect'}
            </Button>
          ) : (
            <Button variant="outline" disabled className="flex-1">
              Coming Soon
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}








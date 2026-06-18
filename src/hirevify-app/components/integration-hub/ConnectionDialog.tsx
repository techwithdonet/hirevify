import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { ConnectionDialogProps } from './types';

export function ConnectionDialog({
 open,
 onOpenChange,
 connectingIntegration,
 availableIntegrations,
 credentials,
 setCredentials,
 onSubmit,
 loading
}: ConnectionDialogProps) {
 const integration = connectingIntegration && availableIntegrations.find(i => i.id === connectingIntegration);

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Connect {integration && typeof integration!== "string"? integration.name: ""}</DialogTitle>
 <DialogDescription>
 Enter your credentials to connect this integration.
 </DialogDescription>
 </DialogHeader>
 
 <div className="space-y-4 py-4">
 {connectingIntegration === 'slack' && (
 <>
 <div className="space-y-2">
 <Label htmlFor="token">Bot Token</Label>
 <Input
 id="token"
 type="password"
 placeholder="xoxb-..."
 value={credentials.token || ''}
 onChange={(e) => setCredentials({...credentials, token: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="webhook">Webhook URL</Label>
 <Input
 id="webhook"
 type="url"
 placeholder="https://hooks.slack.com/..."
 value={credentials.webhookUrl || ''}
 onChange={(e) => setCredentials({...credentials, webhookUrl: e.target.value })}
 />
 </div>
 </>
 )}

 {connectingIntegration === 'calendly' && (
 <>
 <div className="space-y-2">
 <Label htmlFor="apiKey">API Key</Label>
 <Input
 id="apiKey"
 type="password"
 placeholder="Your Calendly API key"
 value={credentials.apiKey || ''}
 onChange={(e) => setCredentials({...credentials, apiKey: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="userId">User ID</Label>
 <Input
 id="userId"
 placeholder="Your Calendly user ID"
 value={credentials.userId || ''}
 onChange={(e) => setCredentials({...credentials, userId: e.target.value })}
 />
 </div>
 </>
 )}

 {connectingIntegration === 'google_workspace' && (
 <>
 <div className="space-y-2">
 <Label htmlFor="clientId">Client ID</Label>
 <Input
 id="clientId"
 placeholder="Google OAuth Client ID"
 value={credentials.clientId || ''}
 onChange={(e) => setCredentials({...credentials, clientId: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="clientSecret">Client Secret</Label>
 <Input
 id="clientSecret"
 type="password"
 placeholder="Google OAuth Client Secret"
 value={credentials.clientSecret || ''}
 onChange={(e) => setCredentials({...credentials, clientSecret: e.target.value })}
 />
 </div>
 </>
 )}

 {connectingIntegration === 'teams' && (
 <>
 <div className="space-y-2">
 <Label htmlFor="tenantId">Tenant ID</Label>
 <Input
 id="tenantId"
 placeholder="Microsoft Teams Tenant ID"
 value={credentials.tenantId || ''}
 onChange={(e) => setCredentials({...credentials, tenantId: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="appId">Application ID</Label>
 <Input
 id="appId"
 placeholder="Microsoft Teams App ID"
 value={credentials.appId || ''}
 onChange={(e) => setCredentials({...credentials, appId: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="appSecret">Application Secret</Label>
 <Input
 id="appSecret"
 type="password"
 placeholder="Microsoft Teams App Secret"
 value={credentials.appSecret || ''}
 onChange={(e) => setCredentials({...credentials, appSecret: e.target.value })}
 />
 </div>
 </>
 )}
 </div>

 <div className="flex justify-end space-x-2">
 <Button variant="outline" onClick={() => onOpenChange(false)}>
 Cancel
 </Button>
 <Button onClick={onSubmit} disabled={loading}>
 {loading? 'Connecting...': 'Connect'}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 );
}









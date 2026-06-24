import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  Settings,
  Download,
  Trash2,
  Building,
  CreditCard,
  Plug,
  Crown,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  X,
  ChevronRight,
  Mail,
  Phone,
  Globe,
  Users,
  Sliders,
  MessageSquare,
  Brain,
  Scan,
  Database,
  Lock,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { dashboardTheme } from '../theme/dashboardTheme';
import { subscriptionsService } from '@/src/hirevify-app/services/subscriptionsService';

interface RecruiterSettingsProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

export function RecruiterSettings({ onBack, onUpgrade }: RecruiterSettingsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(false);

  // Profile data from Supabase
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [subscription, setSubscription] = useState<any>(null);

  // Notification settings state
  const [notifications, setNotifications] = useState({
    newApplications: true,
    projectSubmission: true,
    messages: true,
    emailEnabled: true,
    inAppEnabled: true,
  });

  // Hiring preferences state
  const [hiringPreferences, setHiringPreferences] = useState({
    matchThreshold: '70',
    defaultLocation: '',
    contactPreference: 'both',
  });

  // Messaging preferences state
  const [messagingPreferences, setMessagingPreferences] = useState({
    showPhone: false,
    showEmail: false,
    allowMessages: true,
  });

  // Load recruiter profile data
  useEffect(() => {
    const loadRecruiterData = async () => {
      if (!user?.id) return;

      try {
        const supabase = createSupabaseBrowserClient();

        // Load subscription
        const subData = await subscriptionsService.getUserSubscription(user.id);
        if (subData.data) {
          setSubscription(subData.data);
        } else {
          setSubscription({ tier: 'free', isActive: false });
        }

        // Load profile data
        const { data: profile } = await supabase.from('profiles').select('*').eq('auth_user_id', user.id).maybeSingle();
        const { data: recruiterProfile } = await supabase.from('recruiter_profiles').select('*').eq('id', profile?.id).maybeSingle();

        if (recruiterProfile) {
          setProfileCompleteness(Number(recruiterProfile.profile_completeness || 0));
          setCompanyName(recruiterProfile.company_name || '');
        }
      } catch (error) {
        console.error('Error loading recruiter settings data:', error);
      }
    };

    loadRecruiterData();
  }, [user?.id]);

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      // Simulate save - in real implementation would save to database
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveHiringPreferences = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Hiring preferences saved');
    } catch (error) {
      toast.error('Failed to save hiring preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMessagingPreferences = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Messaging preferences saved');
    } catch (error) {
      toast.error('Failed to save messaging preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
      },
      companyName,
      preferences: {
        notifications,
        hiring: hiringPreferences,
        messaging: messagingPreferences,
      },
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hirevify-recruiter-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Data exported successfully');
  };

  return (
    <div className={dashboardTheme.page}>
      {/* Header */}
      <header className="bg-card border-b border-border p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Recruiter Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="privacy">Privacy & Data</TabsTrigger>
          </TabsList>

          {/* Account & Security Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Profile Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{user?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{user?.email || 'Not set'}</p>
                  </div>
                </div>

                <Separator />

                {/* Company Profile Shortcut */}
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center" />
                      <div>
                        <h4 className="font-semibold">Company Profile</h4>
                        <p className="text-sm text-muted-foreground">
                          {companyName || 'Company not configured'}
                        </p>
                      </div>
                    </div>
                    <Badge className={profileCompleteness >= 60 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                      {profileCompleteness}% complete
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Security Section */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Security
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Password</p>
                          <p className="text-sm text-muted-foreground">Last changed: Never</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Not configured yet
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan & Premium Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-amber-500" />
                  Plan & Premium
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold capitalize">{subscription?.tier || 'Free'} Plan</h4>
                      {subscription?.isActive && (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.isActive
                        ? `Next billing: ${subscription?.current_period_end || 'N/A'}`
                        : 'Upgrade to unlock premium features'}
                    </p>
                  </div>
                  {!subscription?.isActive && (
                    <Button onClick={onUpgrade} size="sm">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  )}
                </div>

                {!subscription?.isActive && (
                  <div className="p-4 rounded-lg border border-dashed">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <CreditCard className="w-5 h-5" />
                      <p className="text-sm">Billing not connected. Payments are not configured yet.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Logout */}
            <Card>
              <CardContent className="p-4">
                <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onBack}>
                  Logout
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-primary" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Application Alerts</Label>
                      <p className="text-sm text-muted-foreground">When candidates apply to your jobs</p>
                    </div>
                    <Switch
                      checked={notifications.newApplications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newApplications: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Project Submission Alerts</Label>
                      <p className="text-sm text-muted-foreground">When candidates submit project work</p>
                    </div>
                    <Switch
                      checked={notifications.projectSubmission}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, projectSubmission: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Message Alerts</Label>
                      <p className="text-sm text-muted-foreground">When candidates send you messages</p>
                    </div>
                    <Switch
                      checked={notifications.messages}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, messages: checked }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Delivery Method</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.emailEnabled}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailEnabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>In-App Notifications</Label>
                        <p className="text-sm text-muted-foreground">Show notifications in the app</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.inAppEnabled}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, inAppEnabled: checked }))}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Hiring Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sliders className="w-5 h-5 mr-2 text-primary" />
                  Hiring Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="matchThreshold">Default Match Threshold</Label>
                    <Select
                      value={hiringPreferences.matchThreshold}
                      onValueChange={(value) => setHiringPreferences(prev => ({ ...prev, matchThreshold: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50% - Show all matches</SelectItem>
                        <SelectItem value="60">60% - Recommended</SelectItem>
                        <SelectItem value="70">70% - Good matches</SelectItem>
                        <SelectItem value="80">80% - Top matches only</SelectItem>
                        <SelectItem value="90">90% - Best matches</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="defaultLocation">Default Job Location</Label>
                    <Input
                      id="defaultLocation"
                      placeholder="e.g., Remote, New York, etc."
                      value={hiringPreferences.defaultLocation}
                      onChange={(e) => setHiringPreferences(prev => ({ ...prev, defaultLocation: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contactPreference">Candidate Contact Preferences</Label>
                  <Select
                    value={hiringPreferences.contactPreference}
                    onValueChange={(value) => setHiringPreferences(prev => ({ ...prev, contactPreference: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Allow both email and phone</SelectItem>
                      <SelectItem value="email">Email only</SelectItem>
                      <SelectItem value="phone">Phone only</SelectItem>
                      <SelectItem value="none">No direct contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSaveHiringPreferences} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Saving...' : 'Save Hiring Preferences'}
                </Button>
              </CardContent>
            </Card>

            {/* Messaging Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                  Messaging Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Phone to Candidates</Label>
                      <p className="text-sm text-muted-foreground">Display your phone number on job postings</p>
                    </div>
                    <Switch
                      checked={messagingPreferences.showPhone}
                      onCheckedChange={(checked) => setMessagingPreferences(prev => ({ ...prev, showPhone: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Company Email to Candidates</Label>
                      <p className="text-sm text-muted-foreground">Display your company email on job postings</p>
                    </div>
                    <Switch
                      checked={messagingPreferences.showEmail}
                      onCheckedChange={(checked) => setMessagingPreferences(prev => ({ ...prev, showEmail: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Candidate Messages</Label>
                      <p className="text-sm text-muted-foreground">Let candidates send you direct messages</p>
                    </div>
                    <Switch
                      checked={messagingPreferences.allowMessages}
                      onCheckedChange={(checked) => setMessagingPreferences(prev => ({ ...prev, allowMessages: checked }))}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveMessagingPreferences} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Saving...' : 'Save Messaging Preferences'}
                </Button>
              </CardContent>
            </Card>

            {/* AI & Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-violet-500" />
                  AI & Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Brain className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 p-2" />
                      <div>
                        <p className="font-medium">AI Matching</p>
                        <p className="text-sm text-muted-foreground">Smart candidate matching powered by AI</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">Pro Feature</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Scan className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 p-2" />
                      <div>
                        <p className="font-medium">ATS Scanner</p>
                        <p className="text-sm text-muted-foreground">Resume screening and analysis</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">Pro Feature</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Database className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 p-2" />
                      <div>
                        <p className="font-medium">Storage & Uploads</p>
                        <p className="text-sm text-muted-foreground">File storage for resumes and documents</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Available</Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Upgrade to Pro to unlock AI features and advanced integrations.
                </p>

                <Button variant="outline" onClick={onUpgrade}>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy & Data Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-primary" />
                  Data & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Export Your Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Download all your data including jobs, applications, and settings
                    </p>
                  </div>
                  <Button variant="outline" onClick={exportData}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-red-600">Delete Account</Label>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button variant="destructive" disabled>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Coming soon
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Legal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span>Terms of Service</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <span>Privacy Policy</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

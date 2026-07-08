import { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Building2, Download, LogOut, Mail, Shield, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { getPasswordResetRedirectUrl } from '@/src/lib/appUrl';
import { BillingSettingsCard } from './BillingSettingsCard';


interface RecruiterSettingsProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

const NOTIFICATION_STORAGE_KEY = 'hirevify_recruiter_notification_settings';

export function RecruiterSettings({ onBack }: RecruiterSettingsProps) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [recruiterId, setRecruiterId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [notifications, setNotifications] = useState({
    newApplications: true,
    candidateMessages: true,
    projectSubmissions: true,
  });

  useEffect(() => {
    const savedNotifications = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (savedNotifications) {
      try {
        setNotifications({ ...notifications, ...JSON.parse(savedNotifications) });
      } catch {
        // Ignore malformed local settings.
      }
    }

    const loadSettings = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData.user?.id;
      if (!authUserId) return;
      setRecruiterId(authUserId);

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (!profileRow?.id) return;
      const { data: recruiterProfile } = await supabase
        .from('recruiter_profiles')
        .select('company_name, profile_completeness')
        .eq('id', profileRow.id)
        .maybeSingle();

      if (recruiterProfile) {
        setCompanyName(recruiterProfile.company_name || '');
        setProfileCompleteness(Number(recruiterProfile.profile_completeness || 0));
      }
    };

    void loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveNotifications = () => {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    toast.success('Notification settings saved');
  };

  const sendPasswordReset = async () => {
    if (!user?.email) return;
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: getPasswordResetRedirectUrl(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Password reset email sent');
  };

  const exportData = () => {
    const data = {
      account: { id: user?.id, name: user?.name, email: user?.email },
      company: { companyName, profileCompleteness },
      notifications,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hirevify-recruiter-settings-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="premium-page">
      <header className="premium-header">
        <div className="premium-header-inner">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Settings</h1>
            <p className="text-sm text-slate-500">Account, company status, and recruiter alerts.</p>
          </div>
        </div>
      </header>

      <main className="premium-content">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-emerald-600" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-slate-500">Name</Label>
                    <p className="font-medium text-slate-950">{user?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Email</Label>
                    <p className="font-medium text-slate-950">{user?.email || 'Not set'}</p>
                  </div>
                </div>

                <Separator />

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-9 w-9 rounded-lg bg-emerald-100 p-2 text-emerald-700" />
                      <div>
                        <p className="font-semibold text-slate-950">{companyName || 'Company profile not configured'}</p>
                        <p className="text-sm text-slate-500">Edit company details from Recruiter Profile.</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700">{profileCompleteness}% complete</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={sendPasswordReset}>
                    <Shield className="mr-2 h-4 w-4" />
                    Send password reset
                  </Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5 text-emerald-600" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  ['newApplications', 'New applications', 'Candidates applying to your jobs.'],
                  ['candidateMessages', 'Candidate messages', 'New candidate conversations.'],
                  ['projectSubmissions', 'Project submissions', 'Assigned project work submitted for review.'],
                ].map(([key, label, description]) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <div>
                      <Label>{label}</Label>
                      <p className="text-sm text-slate-500">{description}</p>
                    </div>
                    <Switch
                      checked={notifications[key as keyof typeof notifications]}
                      onCheckedChange={(checked) => setNotifications((current) => ({ ...current, [key]: checked }))}
                    />
                  </div>
                ))}
                <Button onClick={handleSaveNotifications}>Save notification settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <BillingSettingsCard userId={recruiterId} userEmail={user?.email} />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 h-5 w-5 text-emerald-600" />
                  Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Label>Export account data</Label>
                    <p className="text-sm text-slate-500">Download your settings and company summary.</p>
                  </div>
                  <Button variant="outline" onClick={exportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Export data
                  </Button>
                </div>

                <Separator />

                <div className="text-sm text-slate-500">
                  Need help? Contact support from your registered email: <span className="font-medium text-slate-800">{user?.email}</span>
                  <Mail className="ml-2 inline h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Download, Eye, FileText, LogOut, Mail, Shield, User } from 'lucide-react';
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

import { applicationsService } from '@/src/hirevify-app/services/applicationsService';

interface CandidateSettingsProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

const NOTIFICATION_STORAGE_KEY = 'hirevify_candidate_notification_settings';

export function CandidateSettings({ onBack }: CandidateSettingsProps) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [profileVisible, setProfileVisible] = useState(false);
  const [resumePath, setResumePath] = useState('');
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    applicationUpdates: true,
    recruiterMessages: true,
    jobRecommendations: true,
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
      const currentAuthId = authData.user?.id;
      if (!currentAuthId) return;

      setAuthUserId(currentAuthId);
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', currentAuthId)
        .maybeSingle();

      setProfileId(profileRow?.id || null);
      const candidateIds = [profileRow?.id, currentAuthId].filter(Boolean) as string[];
      const { data: candidateProfile } = await supabase
        .from('candidate_profiles')
        .select('profile_completed, profile_completeness, resume_url')
        .in('user_id', candidateIds)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (candidateProfile) {
        setProfileVisible(Boolean(candidateProfile.profile_completed));
        setProfileCompleteness(Number(candidateProfile.profile_completeness || 0));
        setResumePath(candidateProfile.resume_url || '');
        if (candidateProfile.resume_url) {
          const { url } = await applicationsService.getApplicationFileSignedUrl(candidateProfile.resume_url);
          setResumeUrl(url);
        }
      }
    };

    void loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveNotifications = () => {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    toast.success('Notification settings saved');
  };

  const handleProfileVisibilityChange = async (checked: boolean) => {
    if (!profileId || !authUserId) {
      toast.error('Profile not loaded yet.');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('candidate_profiles')
        .update({ profile_completed: checked, updated_at: new Date().toISOString() })
        .in('user_id', [profileId, authUserId]);

      if (error) throw error;
      setProfileVisible(checked);
      toast.success(checked ? 'Profile is visible to recruiters' : 'Profile hidden from recruiter search');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update visibility');
    } finally {
      setIsSaving(false);
    }
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
      profile: { profileCompleteness, profileVisible, resumePath },
      notifications,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hirevify-candidate-settings-${new Date().toISOString().slice(0, 10)}.json`;
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
            <p className="text-sm text-slate-500">Account, alerts, and profile visibility.</p>
          </div>
        </div>
      </header>

      <main className="premium-content">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="privacy">Privacy & Data</TabsTrigger>
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
                    <div>
                      <p className="font-semibold text-slate-950">Candidate profile</p>
                      <p className="mt-1 text-sm text-slate-500">Keep your main profile updated from Profile Completion.</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-emerald-50 text-emerald-700">{profileCompleteness}% complete</Badge>
                      <Badge className={profileVisible ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}>
                        {profileVisible ? 'Visible' : 'Hidden'}
                      </Badge>
                    </div>
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
                  ['applicationUpdates', 'Application updates', 'Status changes and recruiter actions.'],
                  ['recruiterMessages', 'Recruiter messages', 'New messages from recruiters.'],
                  ['jobRecommendations', 'Job recommendations', 'Jobs that match your profile.'],
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
            <BillingSettingsCard profileId={profileId} userEmail={user?.email} />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2 h-5 w-5 text-emerald-600" />
                  Privacy & Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Visible to recruiters</Label>
                    <p className="text-sm text-slate-500">Allow recruiters to discover your completed profile.</p>
                  </div>
                  <Switch checked={profileVisible} onCheckedChange={handleProfileVisibilityChange} disabled={isSaving} />
                </div>

                <Separator />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Label>Current CV</Label>
                    <p className="text-sm text-slate-500">{resumePath ? 'A CV is saved on your profile.' : 'No CV saved yet.'}</p>
                  </div>
                  {resumeUrl && (
                    <Button asChild variant="outline">
                      <a href={resumeUrl} target="_blank" rel="noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        Open CV
                      </a>
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Label>Export account data</Label>
                    <p className="text-sm text-slate-500">Download your settings and profile summary.</p>
                  </div>
                  <Button variant="outline" onClick={exportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Export data
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-sm text-slate-500">
                Need help? Contact support from your registered email: <span className="font-medium text-slate-800">{user?.email}</span>
                <Mail className="ml-2 inline h-4 w-4" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

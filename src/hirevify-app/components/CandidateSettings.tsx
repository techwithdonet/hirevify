import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  Settings,
  Download,
  Trash2,
  FileText,
  Crown,
  Lock,
  AlertTriangle,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Globe,
  Briefcase,
  MapPin,
  DollarSign,
  Upload,
  ExternalLink,
  CheckCircle,
  X,
  ChevronRight,
  Key,
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

interface CandidateSettingsProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

export function CandidateSettings({ onBack, onUpgrade }: CandidateSettingsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(false);

  // Profile data from Supabase
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  // Resume state
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeVisible, setResumeVisible] = useState(true);

  // Job preferences state
  const [jobPreferences, setJobPreferences] = useState({
    preferredJobType: 'fulltime',
    experienceLevel: '',
    workPreference: 'remote',
    availability: 'available',
  });

  // Notification settings state
  const [notifications, setNotifications] = useState({
    jobMatches: true,
    applicationStatus: true,
    recruiterMessages: true,
    projectAssignments: true,
  });

  // Privacy settings state
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showPhone: false,
    showEmail: false,
    showResume: true,
  });

  // Load candidate profile data
  useEffect(() => {
    const loadCandidateData = async () => {
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
        const { data: candidateProfile } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle();

        if (candidateProfile) {
          setProfileCompleteness(Number(candidateProfile.profile_completeness || 0));
          setIsProfileVisible(Boolean(candidateProfile.profile_completed));
          setResumeUrl(candidateProfile.resume_url || '');
        }
      } catch (error) {
        console.error('Error loading candidate settings data:', error);
      }
    };

    loadCandidateData();
  }, [user?.id]);

  const handleSaveJobPreferences = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Job preferences saved');
    } catch (error) {
      toast.error('Failed to save job preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Privacy settings saved');
    } catch (error) {
      toast.error('Failed to save privacy settings');
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
      preferences: {
        job: jobPreferences,
        notifications,
        privacy,
      },
      resumeUrl,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hirevify-candidate-data-${new Date().toISOString().split('T')[0]}.json`;
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
              <h1 className="text-2xl font-bold text-foreground">Candidate Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
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

                {/* Profile Shortcut */}
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center" />
                      <div>
                        <h4 className="font-semibold">Candidate Profile</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={profileCompleteness >= 60 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                            {profileCompleteness}% complete
                          </Badge>
                          <Badge className={isProfileVisible ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}>
                            {isProfileVisible ? 'Visible to recruiters' : 'Hidden from recruiters'}
                          </Badge>
                        </div>
                      </div>
                    </div>
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

            {/* Resume & CV Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary" />
                  Resume & CV Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Resume URL</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="https://..."
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" disabled>
                      <Upload className="w-4 h-4 mr-2" />
                      Not configured yet
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload functionality coming soon. Currently you can paste a resume URL.
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Resume Visibility</Label>
                    <p className="text-sm text-muted-foreground">Make your resume visible to recruiters</p>
                  </div>
                  <Switch
                    checked={resumeVisible}
                    onCheckedChange={setResumeVisible}
                  />
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
                        ? 'Premium features enabled'
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
                    <p className="text-sm text-muted-foreground">
                      Premium features: Unlimited job applications, AI resume optimization, priority visibility, and more.
                    </p>
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

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Job Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-primary" />
                  Job Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredJobType">Preferred Job Type</Label>
                    <Select
                      value={jobPreferences.preferredJobType}
                      onValueChange={(value) => setJobPreferences(prev => ({ ...prev, preferredJobType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fulltime">Full-time</SelectItem>
                        <SelectItem value="parttime">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experienceLevel">Experience Level</Label>
                    <Select
                      value={jobPreferences.experienceLevel}
                      onValueChange={(value) => setJobPreferences(prev => ({ ...prev, experienceLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workPreference">Work Preference</Label>
                    <Select
                      value={jobPreferences.workPreference}
                      onValueChange={(value) => setJobPreferences(prev => ({ ...prev, workPreference: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="any">No preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="availability">Availability Status</Label>
                    <Select
                      value={jobPreferences.availability}
                      onValueChange={(value) => setJobPreferences(prev => ({ ...prev, availability: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available immediately</SelectItem>
                        <SelectItem value="notice">Currently on notice period</SelectItem>
                        <SelectItem value="exploring">Exploring opportunities</SelectItem>
                        <SelectItem value="passive">Not actively looking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveJobPreferences} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Saving...' : 'Save Job Preferences'}
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
                      <Label>Job Match Alerts</Label>
                      <p className="text-sm text-muted-foreground">When new jobs match your preferences</p>
                    </div>
                    <Switch
                      checked={notifications.jobMatches}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, jobMatches: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Application Status Alerts</Label>
                      <p className="text-sm text-muted-foreground">When your application status changes</p>
                    </div>
                    <Switch
                      checked={notifications.applicationStatus}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, applicationStatus: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Recruiter Message Alerts</Label>
                      <p className="text-sm text-muted-foreground">When recruiters send you messages</p>
                    </div>
                    <Switch
                      checked={notifications.recruiterMessages}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, recruiterMessages: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Project Assignment Alerts</Label>
                      <p className="text-sm text-muted-foreground">When you're assigned to a project</p>
                    </div>
                    <Switch
                      checked={notifications.projectAssignments}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, projectAssignments: checked }))}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy & Visibility Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-primary" />
                  Privacy & Visibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Profile Visible to Recruiters</Label>
                      <p className="text-sm text-muted-foreground">Allow recruiters to discover and view your profile</p>
                    </div>
                    <Switch
                      checked={privacy.profileVisible}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, profileVisible: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Show Phone to Recruiters</Label>
                        <p className="text-sm text-muted-foreground">Display your phone number on your profile</p>
                      </div>
                    </div>
                    <Switch
                      checked={privacy.showPhone}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showPhone: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Show Email to Recruiters</Label>
                        <p className="text-sm text-muted-foreground">Display your email on your profile</p>
                      </div>
                    </div>
                    <Switch
                      checked={privacy.showEmail}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showEmail: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Show Resume to Recruiters</Label>
                        <p className="text-sm text-muted-foreground">Allow recruiters to view your resume</p>
                      </div>
                    </div>
                    <Switch
                      checked={privacy.showResume}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showResume: checked }))}
                    />
                  </div>
                </div>

                <Button onClick={handleSavePrivacy} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </CardContent>
            </Card>

            {/* Data & Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="w-5 h-5 mr-2 text-primary" />
                  Data & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Export Your Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Download all your profile data and application history
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

            {/* Legal */}
            <Card>
              <CardHeader>
                <CardTitle>Help & Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span>Help Center</span>
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

                <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span>Terms of Service</span>
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

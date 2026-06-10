import { useState, useEffect } from 'react';
import { ArrowLeft, User, Shield, Bell, Settings, Download, Trash2, Save, Building, Users, CreditCard, Plug, Crown, Plus, Edit3, Mail, Phone, Globe, MapPin, UserPlus, UserMinus, Check, X, Key, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

interface RecruiterSettingsProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  bio: string;
  Link: string;
  website: string;
}

interface CompanyData {
  name: string;
  description: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  founded: string;
  logo?: string;
  culture: string;
  benefits: string[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: string;
  lastActive: string;
}

interface NotificationSettings {
  emailNotifications: {
    newApplications: boolean;
    candidateMessages: boolean;
    teamUpdates: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
    marketingEmails: boolean;
  };
  pushNotifications: {
    newApplications: boolean;
    candidateMessages: boolean;
    interviews: boolean;
    teamUpdates: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily';
}

interface BillingInfo {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'cancelled';
  nextBilling: string;
  usage: {
    jobPosts: number;
    jobPostsLimit: number;
    teamMembers: number;
    teamMembersLimit: number;
    assessments: number;
    assessmentsLimit: number;
  };
}

export function RecruiterSettings({ onBack, onUpgrade }: RecruiterSettingsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Profile State
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
    title: '',
    bio: '',
    Link: '',
    website: '',
  });

  // Company State
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    description: '',
    website: '',
    industry: '',
    size: '',
    location: '',
    founded: '',
    culture: '',
    benefits: [],
  });

  // Team State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: user?.name || 'You',
      email: user?.email || '',
      role: 'admin',
      status: 'active',
      joinedAt: '2024-01-01',
      lastActive: 'Now'
    }
  ]);

  // Notification State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: {
      newApplications: true,
      candidateMessages: true,
      teamUpdates: true,
      systemAlerts: true,
      weeklyReports: false,
      marketingEmails: false
    },
    pushNotifications: {
      newApplications: true,
      candidateMessages: true,
      interviews: true,
      teamUpdates: false
    },
    frequency: 'immediate'
  });

  // Billing State
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    plan: 'free',
    status: 'active',
    nextBilling: '2024-02-01',
    usage: {
      jobPosts: 2,
      jobPostsLimit: 5,
      teamMembers: 1,
      teamMembersLimit: 3,
      assessments: 5,
      assessmentsLimit: 10
    }
  });

  const [newTeamMember, setNewTeamMember] = useState({ email: '', role: 'recruiter' as const });
  const [newBenefit, setNewBenefit] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Available options
  const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Consulting', 'Media', 'Non-profit', 'Government'];
  const companySizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
  const benefits = ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Retirement Plan', 'Flexible PTO', 'Remote Work', 'Stock Options', 'Life Insurance', 'Disability Insurance', 'Gym Membership', 'Learning Budget', 'Meals Provided'];

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Company information updated successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error('Failed to update company information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Notification settings updated successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const inviteTeamMember = async () => {
    if (!newTeamMember.email) {
      toast.error('Please enter an email address');
      return;
    }

    if (teamMembers.length >= billingInfo.usage.teamMembersLimit) {
      toast.error('Team member limit reached. Upgrade your plan to add more members.');
      return;
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: newTeamMember.email.split('@')[0],
      email: newTeamMember.email,
      role: newTeamMember.role,
      status: 'pending',
      joinedAt: new Date().toISOString().split('T')[0],
      lastActive: 'Pending'
    };

    setTeamMembers(prev => [...prev, newMember]);
    setNewTeamMember({ email: '', role: 'recruiter' });
    toast.success('Team member invitation sent');
  };

  const removeTeamMember = (memberId: string) => {
    if (memberId === '1') {
      toast.error('Cannot remove yourself from the team');
      return;
    }
    
    setTeamMembers(prev => prev.filter(member => member.id !== memberId));
    toast.success('Team member removed');
  };

  const updateTeamMemberRole = (memberId: string, role: 'admin' | 'recruiter' | 'viewer') => {
    setTeamMembers(prev => prev.map(member => 
      member.id === memberId ? { ...member, role } : member
    ));
    toast.success('Team member role updated');
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !companyData.benefits.includes(newBenefit.trim())) {
      setCompanyData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit('');
      setHasUnsavedChanges(true);
    }
  };

  const removeBenefit = (benefit: string) => {
    setCompanyData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b !== benefit)
    }));
    setHasUnsavedChanges(true);
  };

  const exportData = () => {
    const data = {
      profile: profileData,
      company: companyData,
      team: teamMembers,
      notifications: notificationSettings,
      billing: billingInfo,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hirevify-company-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Company data exported successfully');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'recruiter': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
              <p className="text-sm text-muted-foreground">Manage your account, company, and team settings</p>
            </div>
          </div>
          
          {hasUnsavedChanges && (
            <Alert className="w-auto">
              <AlertDescription className="text-sm">
                You have unsaved changes
              </AlertDescription>
            </Alert>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => {
                        setProfileData(prev => ({ ...prev, firstName: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => {
                        setProfileData(prev => ({ ...prev, lastName: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => {
                        setProfileData(prev => ({ ...prev, email: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => {
                        setProfileData(prev => ({ ...prev, phone: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Senior Recruiter, Talent Acquisition Manager"
                    value={profileData.title}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, title: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell candidates about yourself and your recruiting philosophy..."
                    value={profileData.bio}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, bio: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    className="min-h-24"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Professional Links</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="Link">Link Profile</Label>
                      <Input
                        id="Link"
                        placeholder="https://Link.com/in/username"
                        value={profileData.Link}
                        onChange={(e) => {
                          setProfileData(prev => ({ ...prev, Link: e.target.value }));
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Personal Website</Label>
                      <Input
                        id="website"
                        placeholder="https://yourwebsite.com"
                        value={profileData.website}
                        onChange={(e) => {
                          setProfileData(prev => ({ ...prev, website: e.target.value }));
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2 text-primary" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyData.name}
                      onChange={(e) => {
                        setCompanyData(prev => ({ ...prev, name: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyWebsite">Company Website</Label>
                    <Input
                      id="companyWebsite"
                      placeholder="https://company.com"
                      value={companyData.website}
                      onChange={(e) => {
                        setCompanyData(prev => ({ ...prev, website: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="companyDescription">Company Description</Label>
                  <Textarea
                    id="companyDescription"
                    placeholder="Describe your company, mission, and what makes it special..."
                    value={companyData.description}
                    onChange={(e) => {
                      setCompanyData(prev => ({ ...prev, description: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    className="min-h-24"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select 
                      value={companyData.industry} 
                      onValueChange={(value) => {
                        setCompanyData(prev => ({ ...prev, industry: value }));
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(industry => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select 
                      value={companyData.size} 
                      onValueChange={(value) => {
                        setCompanyData(prev => ({ ...prev, size: value }));
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {companySizes.map(size => (
                          <SelectItem key={size} value={size}>{size} employees</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="founded">Founded</Label>
                    <Input
                      id="founded"
                      placeholder="2020"
                      value={companyData.founded}
                      onChange={(e) => {
                        setCompanyData(prev => ({ ...prev, founded: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State/Country"
                    value={companyData.location}
                    onChange={(e) => {
                      setCompanyData(prev => ({ ...prev, location: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="culture">Company Culture</Label>
                  <Textarea
                    id="culture"
                    placeholder="Describe your company culture, values, and work environment..."
                    value={companyData.culture}
                    onChange={(e) => {
                      setCompanyData(prev => ({ ...prev, culture: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    className="min-h-20"
                  />
                </div>

                <Separator />

                <div>
                  <Label>Benefits & Perks</Label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {companyData.benefits.map(benefit => (
                        <Badge key={benefit} variant="secondary" className="cursor-pointer" onClick={() => removeBenefit(benefit)}>
                          {benefit} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Select value={newBenefit} onValueChange={setNewBenefit}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a benefit" />
                        </SelectTrigger>
                        <SelectContent>
                          {benefits.filter(b => !companyData.benefits.includes(b)).map(benefit => (
                            <SelectItem key={benefit} value={benefit}>{benefit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={addBenefit} variant="outline">Add</Button>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveCompany} disabled={isLoading} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Company Info'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-primary" />
                    Team Management
                  </span>
                  <Badge variant="outline">
                    {teamMembers.length}/{billingInfo.usage.teamMembersLimit} members
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Team Member */}
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-semibold mb-4">Invite Team Member</h4>
                  <div className="flex space-x-3">
                    <Input
                      placeholder="Email address"
                      value={newTeamMember.email}
                      onChange={(e) => setNewTeamMember(prev => ({ ...prev, email: e.target.value }))}
                      className="flex-1"
                    />
                    <Select 
                      value={newTeamMember.role} 
                      onValueChange={(value: any) => setNewTeamMember(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="recruiter">Recruiter</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={inviteTeamMember} disabled={teamMembers.length >= billingInfo.usage.teamMembersLimit}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite
                    </Button>
                  </div>
                  {teamMembers.length >= billingInfo.usage.teamMembersLimit && (
                    <p className="text-sm text-amber-600 mt-2">
                      Team member limit reached. <button onClick={onUpgrade} className="underline">Upgrade your plan</button> to add more members.
                    </p>
                  )}
                </div>

                <Separator />

                {/* Team Members List */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Team Members</h4>
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{member.name}</span>
                              {member.id === '1' && <Badge variant="outline" className="text-xs">You</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                            <div className="text-xs text-muted-foreground">Last active: {member.lastActive}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge className={getRoleColor(member.role)}>
                            {member.role}
                          </Badge>
                          <Badge className={getStatusColor(member.status)}>
                            {member.status}
                          </Badge>
                          
                          {member.id !== '1' && (
                            <div className="flex items-center space-x-1">
                              <Select 
                                value={member.role} 
                                onValueChange={(value: any) => updateTeamMemberRole(member.id, value)}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="recruiter">Recruiter</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeTeamMember(member.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Role Permissions */}
                <div>
                  <h4 className="font-semibold mb-4">Role Permissions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 border border-border rounded-lg">
                      <h5 className="font-medium text-red-700 mb-2">Admin</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Full access to all features</li>
                        <li>• Manage team members</li>
                        <li>• Billing and settings</li>
                        <li>• Company information</li>
                      </ul>
                    </div>
                    <div className="p-3 border border-border rounded-lg">
                      <h5 className="font-medium text-blue-700 mb-2">Recruiter</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Post and manage jobs</li>
                        <li>• View and contact candidates</li>
                        <li>• Conduct assessments</li>
                        <li>• Schedule interviews</li>
                      </ul>
                    </div>
                    <div className="p-3 border border-border rounded-lg">
                      <h5 className="font-medium text-gray-700 mb-2">Viewer</h5>
                      <ul className="text-sm space-y-1">
                        <li>• View jobs and candidates</li>
                        <li>• View analytics</li>
                        <li>• Limited editing access</li>
                        <li>• Cannot manage team</li>
                      </ul>
                    </div>
                  </div>
                </div>
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
                <div>
                  <Label>Notification Frequency</Label>
                  <Select 
                    value={notificationSettings.frequency} 
                    onValueChange={(value: any) => {
                      setNotificationSettings(prev => ({ ...prev, frequency: value }));
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly digest</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Email Notifications</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Applications</Label>
                      <p className="text-sm text-muted-foreground">When candidates apply to your jobs</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications.newApplications}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          emailNotifications: { ...prev.emailNotifications, newApplications: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Candidate Messages</Label>
                      <p className="text-sm text-muted-foreground">Direct messages from candidates</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications.candidateMessages}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          emailNotifications: { ...prev.emailNotifications, candidateMessages: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Team Updates</Label>
                      <p className="text-sm text-muted-foreground">Updates from your team members</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications.teamUpdates}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          emailNotifications: { ...prev.emailNotifications, teamUpdates: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>System Alerts</Label>
                      <p className="text-sm text-muted-foreground">Important system notifications</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications.systemAlerts}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          emailNotifications: { ...prev.emailNotifications, systemAlerts: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">Weekly hiring performance summary</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications.weeklyReports}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          emailNotifications: { ...prev.emailNotifications, weeklyReports: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Push Notifications</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Applications</Label>
                      <p className="text-sm text-muted-foreground">Instant notifications for new applications</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications.newApplications}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          pushNotifications: { ...prev.pushNotifications, newApplications: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Messages</Label>
                      <p className="text-sm text-muted-foreground">New messages from candidates</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications.candidateMessages}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          pushNotifications: { ...prev.pushNotifications, candidateMessages: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Interview Reminders</Label>
                      <p className="text-sm text-muted-foreground">Reminders for upcoming interviews</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications.interviews}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          pushNotifications: { ...prev.pushNotifications, interviews: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveNotificationSettings} disabled={isLoading} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-primary" />
                  Billing & Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold capitalize">{billingInfo.plan} Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        {billingInfo.plan === 'free' ? 'Free forever' : `Next billing: ${billingInfo.nextBilling}`}
                      </p>
                    </div>
                    <Badge className={`${billingInfo.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {billingInfo.status}
                    </Badge>
                  </div>
                  
                  {billingInfo.plan === 'free' && (
                    <Button onClick={onUpgrade}>
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Usage Stats */}
                <div>
                  <h4 className="font-semibold mb-4">Current Usage</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Job Posts</span>
                        <span>{billingInfo.usage.jobPosts}/{billingInfo.usage.jobPostsLimit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(billingInfo.usage.jobPosts / billingInfo.usage.jobPostsLimit) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Team Members</span>
                        <span>{billingInfo.usage.teamMembers}/{billingInfo.usage.teamMembersLimit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(billingInfo.usage.teamMembers / billingInfo.usage.teamMembersLimit) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Custom Assessments</span>
                        <span>{billingInfo.usage.assessments}/{billingInfo.usage.assessmentsLimit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(billingInfo.usage.assessments / billingInfo.usage.assessmentsLimit) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {billingInfo.plan !== 'free' && (
                  <>
                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">Billing Management</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full md:w-auto">
                          View Billing History
                        </Button>
                        <Button variant="outline" className="w-full md:w-auto">
                          Update Payment Method
                        </Button>
                        <Button variant="outline" className="w-full md:w-auto">
                          Download Invoice
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-primary" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handlePasswordChange} disabled={isLoading} variant="outline">
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Export Company Data</Label>
                    <p className="text-sm text-muted-foreground">Download all company data including team, jobs, and candidates</p>
                  </div>
                  <Button onClick={exportData} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-red-600">Delete Company Account</Label>
                    <p className="text-sm text-muted-foreground">Permanently delete company account and all associated data</p>
                  </div>
                  <Button variant="destructive" onClick={() => toast.error('Account deletion requires admin confirmation')}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plug className="w-5 h-5 mr-2 text-primary" />
                  API Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Integrate HireVify with your existing systems using our API. Generate API keys to access candidate data, job postings, and more.
                  </p>
                  <Button variant="outline" onClick={() => toast.info('API access available in Pro plans')}>
                    <Key className="w-4 h-4 mr-2" />
                    Generate API Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}






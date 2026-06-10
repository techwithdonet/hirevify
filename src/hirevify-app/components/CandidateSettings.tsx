import { useState, useEffect } from 'react';
import { ArrowLeft, User, Shield, Bell, Settings, Download, Trash2, Eye, EyeOff, Save, Edit3, MapPin, Briefcase, DollarSign, Clock, Mail, Phone, Globe, Camera, Check, X } from 'lucide-react';
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

interface CandidateSettingsProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  website: string;
  Link: string;
  GitBranch: string;
  portfolio: string;
  currentTitle: string;
  experience: string;
  availableForWork: boolean;
  profilePicture?: string;
}

interface SkillsPreferences {
  skills: string[];
  jobTypes: string[];
  workArrangement: string[];
  salaryMin: number;
  salaryMax: number;
  currency: string;
  preferredLocations: string[];
  industries: string[];
  companySizes: string[];
  noticePeriod: string;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'verified-only';
  showEmail: boolean;
  showPhone: boolean;
  allowContactFromRecruiters: boolean;
  showSalaryExpectations: boolean;
  anonymousApplications: boolean;
}

interface NotificationSettings {
  emailNotifications: {
    jobMatches: boolean;
    applicationUpdates: boolean;
    interviews: boolean;
    messages: boolean;
    weeklyDigest: boolean;
    platformUpdates: boolean;
  };
  pushNotifications: {
    jobMatches: boolean;
    messages: boolean;
    interviews: boolean;
    reminders: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
}

export function CandidateSettings({ onBack, onUpgrade }: CandidateSettingsProps) {
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
    location: '',
    bio: '',
    website: '',
    Link: '',
    GitBranch: '',
    portfolio: '',
    currentTitle: '',
    experience: '',
    availableForWork: true,
  });

  // Skills & Preferences State
  const [skillsPreferences, setSkillsPreferences] = useState<SkillsPreferences>({
    skills: [],
    jobTypes: ['Full-time'],
    workArrangement: ['Remote'],
    salaryMin: 50000,
    salaryMax: 100000,
    currency: 'USD',
    preferredLocations: [],
    industries: [],
    companySizes: [],
    noticePeriod: '2 weeks'
  });

  // Privacy State
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'verified-only',
    showEmail: false,
    showPhone: false,
    allowContactFromRecruiters: true,
    showSalaryExpectations: false,
    anonymousApplications: false
  });

  // Notification State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: {
      jobMatches: true,
      applicationUpdates: true,
      interviews: true,
      messages: true,
      weeklyDigest: false,
      platformUpdates: false
    },
    pushNotifications: {
      jobMatches: true,
      messages: true,
      interviews: true,
      reminders: true
    },
    frequency: 'immediate'
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Available options
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
  const workArrangements = ['Remote', 'Hybrid', 'On-site', 'Flexible'];
  const experienceLevels = ['Entry Level', '1-2 years', '3-5 years', '5-10 years', '10+ years'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Consulting', 'Media', 'Non-profit', 'Government'];
  const companySizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
  const noticePeriods = ['Immediate', '1 week', '2 weeks', '1 month', '2 months', '3 months'];

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSkillsPreferences = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Preferences updated successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrivacySettings = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Privacy settings updated successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error('Failed to update privacy settings');
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

  const addSkill = () => {
    if (newSkill.trim() && !skillsPreferences.skills.includes(newSkill.trim())) {
      setSkillsPreferences(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
      setHasUnsavedChanges(true);
    }
  };

  const removeSkill = (skill: string) => {
    setSkillsPreferences(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
    setHasUnsavedChanges(true);
  };

  const addLocation = () => {
    if (newLocation.trim() && !skillsPreferences.preferredLocations.includes(newLocation.trim())) {
      setSkillsPreferences(prev => ({
        ...prev,
        preferredLocations: [...prev.preferredLocations, newLocation.trim()]
      }));
      setNewLocation('');
      setHasUnsavedChanges(true);
    }
  };

  const removeLocation = (location: string) => {
    setSkillsPreferences(prev => ({
      ...prev,
      preferredLocations: prev.preferredLocations.filter(l => l !== location)
    }));
    setHasUnsavedChanges(true);
  };

  const exportData = () => {
    const data = {
      profile: profileData,
      skillsPreferences,
      privacySettings,
      notificationSettings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hirevify-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion requires email confirmation. Please contact support.');
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
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Job Preferences</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, State/Country"
                      value={profileData.location}
                      onChange={(e) => {
                        setProfileData(prev => ({ ...prev, location: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentTitle">Current Title</Label>
                    <Input
                      id="currentTitle"
                      placeholder="e.g. Frontend Developer"
                      value={profileData.currentTitle}
                      onChange={(e) => {
                        setProfileData(prev => ({ ...prev, currentTitle: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select 
                    value={profileData.experience} 
                    onValueChange={(value) => {
                      setProfileData(prev => ({ ...prev, experience: value }));
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell employers about yourself, your experience, and what you're looking for..."
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
                      <Label htmlFor="website">Website</Label>
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
                    <div>
                      <Label htmlFor="Link">Link</Label>
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
                      <Label htmlFor="GitBranch">GitBranch</Label>
                      <Input
                        id="GitBranch"
                        placeholder="https://GitBranch.com/username"
                        value={profileData.GitBranch}
                        onChange={(e) => {
                          setProfileData(prev => ({ ...prev, GitBranch: e.target.value }));
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="portfolio">Portfolio</Label>
                      <Input
                        id="portfolio"
                        placeholder="https://portfolio.com"
                        value={profileData.portfolio}
                        onChange={(e) => {
                          setProfileData(prev => ({ ...prev, portfolio: e.target.value }));
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={profileData.availableForWork}
                    onCheckedChange={(checked) => {
                      setProfileData(prev => ({ ...prev, availableForWork: checked }));
                      setHasUnsavedChanges(true);
                    }}
                  />
                  <Label>Available for work opportunities</Label>
                </div>

                <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-primary" />
                  Job Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Skills */}
                <div>
                  <Label>Skills</Label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {skillsPreferences.skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                          {skill} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add a skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      />
                      <Button onClick={addSkill} variant="outline">Add</Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Job Type & Work Arrangement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Job Types</Label>
                    <div className="space-y-2 mt-2">
                      {jobTypes.map(type => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={skillsPreferences.jobTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSkillsPreferences(prev => ({
                                  ...prev,
                                  jobTypes: [...prev.jobTypes, type]
                                }));
                              } else {
                                setSkillsPreferences(prev => ({
                                  ...prev,
                                  jobTypes: prev.jobTypes.filter(t => t !== type)
                                }));
                              }
                              setHasUnsavedChanges(true);
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Work Arrangement</Label>
                    <div className="space-y-2 mt-2">
                      {workArrangements.map(arrangement => (
                        <label key={arrangement} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={skillsPreferences.workArrangement.includes(arrangement)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSkillsPreferences(prev => ({
                                  ...prev,
                                  workArrangement: [...prev.workArrangement, arrangement]
                                }));
                              } else {
                                setSkillsPreferences(prev => ({
                                  ...prev,
                                  workArrangement: prev.workArrangement.filter(a => a !== arrangement)
                                }));
                              }
                              setHasUnsavedChanges(true);
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{arrangement}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Salary Expectations */}
                <div>
                  <Label>Salary Expectations</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="salaryMin" className="text-sm">Minimum</Label>
                      <Input
                        id="salaryMin"
                        type="number"
                        value={skillsPreferences.salaryMin}
                        onChange={(e) => {
                          setSkillsPreferences(prev => ({ ...prev, salaryMin: parseInt(e.target.value) || 0 }));
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="salaryMax" className="text-sm">Maximum</Label>
                      <Input
                        id="salaryMax"
                        type="number"
                        value={skillsPreferences.salaryMax}
                        onChange={(e) => {
                          setSkillsPreferences(prev => ({ ...prev, salaryMax: parseInt(e.target.value) || 0 }));
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency" className="text-sm">Currency</Label>
                      <Select 
                        value={skillsPreferences.currency} 
                        onValueChange={(value) => {
                          setSkillsPreferences(prev => ({ ...prev, currency: value }));
                          setHasUnsavedChanges(true);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Preferred Locations */}
                <div>
                  <Label>Preferred Locations</Label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {skillsPreferences.preferredLocations.map(location => (
                        <Badge key={location} variant="secondary" className="cursor-pointer" onClick={() => removeLocation(location)}>
                          {location} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add a location"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                      />
                      <Button onClick={addLocation} variant="outline">Add</Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Preferred Industries</Label>
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                      {industries.map(industry => (
                        <label key={industry} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={skillsPreferences.industries.includes(industry)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSkillsPreferences(prev => ({
                                  ...prev,
                                  industries: [...prev.industries, industry]
                                }));
                              } else {
                                setSkillsPreferences(prev => ({
                                  ...prev,
                                  industries: prev.industries.filter(i => i !== industry)
                                }));
                              }
                              setHasUnsavedChanges(true);
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{industry}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Company Size Preference</Label>
                    <div className="space-y-2 mt-2">
                      {companySizes.map(size => (
                        <label key={size} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={skillsPreferences.companySizes.includes(size)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSkillsPreferences(prev => ({
                                  ...prev,
                                  companySizes: [...prev.companySizes, size]
                                }));
                              } else {
                                setSkillsPreferences(prev => ({
                                  ...prev,
                                  companySizes: prev.companySizes.filter(s => s !== size)
                                }));
                              }
                              setHasUnsavedChanges(true);
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{size} employees</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Notice Period</Label>
                  <Select 
                    value={skillsPreferences.noticePeriod} 
                    onValueChange={(value) => {
                      setSkillsPreferences(prev => ({ ...prev, noticePeriod: value }));
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {noticePeriods.map(period => (
                        <SelectItem key={period} value={period}>{period}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSaveSkillsPreferences} disabled={isLoading} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary" />
                  Privacy & Visibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Profile Visibility</Label>
                  <Select 
                    value={privacySettings.profileVisibility} 
                    onValueChange={(value: any) => {
                      setPrivacySettings(prev => ({ ...prev, profileVisibility: value }));
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Visible to everyone</SelectItem>
                      <SelectItem value="verified-only">Verified Recruiters Only</SelectItem>
                      <SelectItem value="private">Private - Not visible in searches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Contact Information</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Email Address</Label>
                      <p className="text-sm text-muted-foreground">Allow recruiters to see your email</p>
                    </div>
                    <Switch
                      checked={privacySettings.showEmail}
                      onCheckedChange={(checked) => {
                        setPrivacySettings(prev => ({ ...prev, showEmail: checked }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Phone Number</Label>
                      <p className="text-sm text-muted-foreground">Allow recruiters to see your phone</p>
                    </div>
                    <Switch
                      checked={privacySettings.showPhone}
                      onCheckedChange={(checked) => {
                        setPrivacySettings(prev => ({ ...prev, showPhone: checked }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Salary Expectations</Label>
                      <p className="text-sm text-muted-foreground">Display your salary range to recruiters</p>
                    </div>
                    <Switch
                      checked={privacySettings.showSalaryExpectations}
                      onCheckedChange={(checked) => {
                        setPrivacySettings(prev => ({ ...prev, showSalaryExpectations: checked }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Recruiter Communication</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Contact from Recruiters</Label>
                      <p className="text-sm text-muted-foreground">Receive messages and opportunities from recruiters</p>
                    </div>
                    <Switch
                      checked={privacySettings.allowContactFromRecruiters}
                      onCheckedChange={(checked) => {
                        setPrivacySettings(prev => ({ ...prev, allowContactFromRecruiters: checked }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Anonymous Applications</Label>
                      <p className="text-sm text-muted-foreground">Hide your identity in initial applications</p>
                    </div>
                    <Switch
                      checked={privacySettings.anonymousApplications}
                      onCheckedChange={(checked) => {
                        setPrivacySettings(prev => ({ ...prev, anonymousApplications: checked }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <Button onClick={handleSavePrivacySettings} disabled={isLoading} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Privacy Settings'}
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
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Email Notifications</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Job Matches</Label>
                      <p className="text-sm text-muted-foreground">When new jobs match your preferences</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications.jobMatches}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          emailNotifications: { ...prev.emailNotifications, jobMatches: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Application Updates</Label>
                      <p className="text-sm text-muted-foreground">Status changes on your applications</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications.applicationUpdates}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          emailNotifications: { ...prev.emailNotifications, applicationUpdates: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Interview Invitations</Label>
                      <p className="text-sm text-muted-foreground">When you're invited to an interview</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications.interviews}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          emailNotifications: { ...prev.emailNotifications, interviews: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Messages</Label>
                      <p className="text-sm text-muted-foreground">Direct messages from recruiters</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications.messages}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          emailNotifications: { ...prev.emailNotifications, messages: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">Summary of activity and opportunities</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications.weeklyDigest}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          emailNotifications: { ...prev.emailNotifications, weeklyDigest: checked }
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
                      <Label>Job Matches</Label>
                      <p className="text-sm text-muted-foreground">Instant notifications for job matches</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications.jobMatches}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          pushNotifications: { ...prev.pushNotifications, jobMatches: checked }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Messages</Label>
                      <p className="text-sm text-muted-foreground">New messages from recruiters</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications.messages}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          pushNotifications: { ...prev.pushNotifications, messages: checked }
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

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Password Change */}
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
                    <Label>Export Your Data</Label>
                    <p className="text-sm text-muted-foreground">Download a copy of all your data</p>
                  </div>
                  <Button onClick={exportData} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-red-600">Delete Account</Label>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                  <Button onClick={handleDeleteAccount} variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Current Plan</Label>
                    <p className="text-sm text-muted-foreground">Free Plan - Limited features</p>
                  </div>
                  <Button onClick={onUpgrade}>
                    Upgrade to Pro
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






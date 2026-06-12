import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { HireVifyLogo } from './HireVifyLogo';
import { 
  Plus, 
  Briefcase, 
  Users, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  LogOut,
  TrendingUp,
  Clock,
  Target,
  Crown,
  Bell,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Star,
  Award,
  Plug,
  MessageSquare,
  User,
  ChevronDown,
  ArrowRight,
  FileText,
  Lightbulb,
  Brain,
  Scan,
  Zap,
  Loader
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { usePremiumAccess } from '../utils/premium';
import { profilesService } from '@/src/hirevify-app/services/profilesService';
import { jobsService } from '@/src/hirevify-app/services/jobsService';
import { applicationsService } from '@/src/hirevify-app/services/applicationsService';
import { subscriptionsService } from '@/src/hirevify-app/services/subscriptionsService';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget: string;
  timeline: string;
  applications: number;
  status: 'active' | 'closed' | 'draft';
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
}

interface RecruiterDashboardProps {
  [key: string]: any;
  onPostProject: (project?: Project) => void;
  onViewProjects?: () => void;
  onViewATS: () => void;
  onViewATSScanner?: () => void;
  onViewAIMatchingDashboard?: () => void;
  onViewAnalytics: () => void;
  onViewSkillsAssessment?: () => void;
  onViewIntegrations?: () => void;
  onViewInterviews?: () => void;
  onViewSettings?: () => void;
  onSearchCandidates?: () => void;
  onViewMessages?: () => void;
  onViewNotifications?: () => void;
  onUpgrade: () => void;
  onLogout: () => void;
  onSkillsFirstHiring?: () => void;
  onEmployerEducation?: () => void;
  unreadNotifications?: number;
  unreadMessages?: number;
}

export function RecruiterDashboard({ 
  onPostProject, 
  onViewProjects,
  onViewATS, 
  onViewATSScanner,
  onViewAIMatchingDashboard,
  onViewAnalytics, 
  onViewSkillsAssessment,
  onViewIntegrations,
  onViewInterviews,
  onViewSettings,
  onSearchCandidates,
  onViewMessages,
  onViewNotifications,
  onUpgrade, 
  onLogout,
  onSkillsFirstHiring,
  onEmployerEducation,
  unreadNotifications = 0,
  unreadMessages = 0
}: RecruiterDashboardProps) {
  const { user } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recruiterProfile, setRecruiterProfile] = useState<any>(null);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  
  // Safe premium access with fallbacks
  let checkAccess, getSubscription, premiumSubscription;
  let aiMatchingAccess = false;
  let atsAccess = false;
  let assessmentsAccess = false;
  let analyticsAccess = false;
  let integrationsAccess = false;

  try {
    const premiumAccess = usePremiumAccess();
    checkAccess = premiumAccess.checkAccess;
    getSubscription = premiumAccess.getSubscription;
    premiumSubscription = getSubscription();

    // Optimize access checks
    aiMatchingAccess = checkAccess('ai-matching');
    atsAccess = checkAccess('ats-scanner');
    assessmentsAccess = checkAccess('custom-assessments');
    analyticsAccess = checkAccess('advanced-analytics');
    integrationsAccess = checkAccess('integrations');
  } catch (error) {
    console.error('Error accessing premium features:', error);
    premiumSubscription = { isActive: false, tier: 'free', expiresAt: null, trialEndsAt: null };
  }

  // Load recruiter data from Supabase
  useEffect(() => {
    const loadRecruiterData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Load subscription
        const subData = await subscriptionsService.getUserSubscription(user.id);
        if (subData.data) {
          setSubscription(subData.data);
        } else {
          setSubscription({ tier: 'free', isActive: false });
        }

        // Load recruiter profile
        const profileData = await profilesService.getRecruiterProfile(user.id);
        if (profileData.data) {
          setRecruiterProfile(profileData.data);
        }

        // Load posted jobs
        const jobsData = await jobsService.getRecruiterJobs(user.id);
        if (jobsData.data) {
          setPostedJobs(jobsData.data);
        }

        // Load applications
        const appData = await applicationsService.getRecruiterApplications(user.id);
        if (appData.data) {
          setApplicants(appData.data);
        }

        // Load stats
        const statsData = await jobsService.getRecruiterStats(user.id);
        if (statsData.data) {
          setStats(statsData.data);
        }
      } catch (error) {
        console.error('Error loading recruiter data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecruiterData();
  }, [user?.id]);

  const sidebarItems = useMemo(() => [
    { icon: BarChart3, label: 'Dashboard', active: true, count: null },
    { icon: FolderOpen, label: 'Projects', active: false, count: postedJobs.length || null, onClick: onViewProjects },
    { icon: Users, label: 'Candidates', active: false, count: applicants.length || null, onClick: onViewATS },
    { 
      icon: Brain, 
      label: 'AI Matching', 
      active: false, 
      count: null, 
      onClick: onViewAIMatchingDashboard, 
      premium: true,
      hasAccess: aiMatchingAccess
    },
    { 
      icon: Scan, 
      label: 'ATS Scanner', 
      active: false, 
      count: null, 
      onClick: onViewATSScanner, 
      premium: true,
      hasAccess: atsAccess
    },
    { 
      icon: Award, 
      label: 'Assessments', 
      active: false, 
      count: null, 
      onClick: onViewSkillsAssessment, 
      premium: true,
      hasAccess: assessmentsAccess
    },
    { 
      icon: Target, 
      label: 'Analytics', 
      active: false, 
      count: null, 
      onClick: onViewAnalytics, 
      premium: true,
      hasAccess: analyticsAccess
    },
    { icon: Calendar, label: 'Interviews', active: false, count: null, onClick: onViewInterviews },
    { icon: MessageSquare, label: 'Messages', active: false, count: unreadMessages || null, onClick: onViewMessages },
    { 
      icon: Plug, 
      label: 'Integrations', 
      active: false, 
      count: null, 
      onClick: onViewIntegrations,
      premium: true,
      hasAccess: integrationsAccess
    },
    { icon: Settings, label: 'Settings', active: false, count: null, onClick: onViewSettings },
  ], [
    postedJobs.length, 
    applicants.length,
    aiMatchingAccess,
    atsAccess,
    assessmentsAccess,
    analyticsAccess,
    integrationsAccess,
    onViewProjects, 
    onViewATS, 
    onViewAIMatchingDashboard,
    onViewATSScanner,
    onViewSkillsAssessment,
    onViewAnalytics,
    onViewInterviews,
    onViewMessages,
    onViewIntegrations,
    onViewSettings,
    unreadMessages
  ]);

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <HireVifyLogo size="md" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your hiring pipeline</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Premium Status */}
              {subscription?.isActive ? (
                <Badge className="hidden md:flex bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2 font-semibold rounded-full">
                  <Crown className="w-4 h-4 mr-2 text-emerald-600" />
                  {subscription.tier?.charAt(0).toUpperCase() + subscription.tier?.slice(1)} Plan
                </Badge>
              ) : (
                <Button onClick={onUpgrade} className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
              
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" onClick={onViewNotifications} className="relative rounded-lg hover:bg-emerald-50">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </Badge>
                  )}
                </Button>
                
                <Button variant="ghost" size="icon" onClick={onViewMessages} className="relative rounded-lg hover:bg-emerald-50">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  {unreadMessages > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                      {unreadMessages}
                    </Badge>
                  )}
                </Button>
                
                <Button variant="ghost" size="icon" onClick={onViewSettings} className="rounded-lg hover:bg-emerald-50">
                  <Settings className="w-5 h-5 text-gray-600" />
                </Button>
                
                <Button variant="ghost" size="icon" onClick={onLogout} className="rounded-lg hover:bg-red-50">
                  <LogOut className="w-5 h-5 text-gray-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-12 h-12 animate-spin text-emerald-600" />
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        )}

        {!isLoading && (
        <>
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={onViewProjects}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{postedJobs.length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={onViewATS}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Applications</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{applicants.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={onViewInterviews}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Interviews</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.interviewsScheduled || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={onViewAnalytics}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Hire Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.hireRate || 'N/A'}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button 
            onClick={() => onPostProject()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md h-auto h-14"
          >
            <Plus className="w-5 h-5 mr-2" />
            Post New Project
          </Button>
          
          <Button 
            variant="outline"
            onClick={onSearchCandidates}
            className="border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold px-6 py-3 rounded-lg h-auto h-14"
          >
            <Search className="w-5 h-5 mr-2" />
            Search Candidates
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Hiring Tools</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={onViewAIMatchingDashboard} className="p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group">
                  <div className="flex items-center justify-between mb-3">
                    <Brain className="w-6 h-6 text-emerald-600" />
                    {aiMatchingAccess && <Badge className="text-xs bg-emerald-100 text-emerald-700">PRO</Badge>}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI Matching</h3>
                  <p className="text-sm text-gray-600">Smart candidate matching</p>
                </button>

                <button onClick={onViewATSScanner} className="p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group">
                  <div className="flex items-center justify-between mb-3">
                    <Scan className="w-6 h-6 text-blue-600" />
                    {atsAccess && <Badge className="text-xs bg-emerald-100 text-emerald-700">PRO</Badge>}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">ATS Scanner</h3>
                  <p className="text-sm text-gray-600">Resume screening tool</p>
                </button>

                <button onClick={onViewSkillsAssessment} className="p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group">
                  <div className="flex items-center justify-between mb-3">
                    <Award className="w-6 h-6 text-purple-600" />
                    {assessmentsAccess && <Badge className="text-xs bg-emerald-100 text-emerald-700">PRO</Badge>}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Assessments</h3>
                  <p className="text-sm text-gray-600">Custom skills tests</p>
                </button>

                <button onClick={onViewAnalytics} className="p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group">
                  <div className="flex items-center justify-between mb-3">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                    {analyticsAccess && <Badge className="text-xs bg-emerald-100 text-emerald-700">PRO</Badge>}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
                  <p className="text-sm text-gray-600">Hiring insights</p>
                </button>
              </div>
            </div>

            {/* Features Overview */}
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Why Skills-First Hiring?</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Target className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Project-Based Evaluation</h4>
                    <p className="text-sm text-gray-600">See real work samples instead of just resumes</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Zap className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">AI-Powered Matching</h4>
                    <p className="text-sm text-gray-600">Advanced AI finds the perfect candidates automatically</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Award className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Skills Assessments</h4>
                    <p className="text-sm text-gray-600">Create custom tests to validate technical skills</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Premium Status */}
            {!subscription?.isActive ? (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <div className="text-center">
                  <Crown className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Go Premium</h3>
                  <p className="text-sm text-gray-600 mb-4">Unlock AI matching, advanced analytics, and more</p>
                  <Button onClick={onUpgrade} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg">
                    Upgrade Now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <div className="text-center">
                  <Crown className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-1">{subscription?.tier?.charAt(0).toUpperCase() + subscription?.tier?.slice(1)} Plan</h3>
                  <p className="text-sm text-gray-600">All premium features enabled</p>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Recent Applications</h3>
              {applicants.length > 0 ? (
                <div className="space-y-3">
                  {applicants.slice(0, 3).map((app: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{app.candidate_id}</p>
                      <p className="text-xs text-gray-500">Status: {app.status || 'pending'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No applications yet</p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Navigation</h3>
              <div className="space-y-2">
                <button onClick={onViewProjects} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-lg font-medium transition-colors">
                  View All Projects
                </button>
                <button onClick={onViewInterviews} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-lg font-medium transition-colors">
                  Schedule Interviews
                </button>
                <button onClick={onViewIntegrations} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-lg font-medium transition-colors flex items-center justify-between">
                  Integrations
                  {integrationsAccess && <Badge className="text-xs bg-emerald-100 text-emerald-700">PRO</Badge>}
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </main>
    </div>
  );
}



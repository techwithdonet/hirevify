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
import { DashboardGrid, LoadingState, StatCard } from './layout/AppLayout';

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

  const recruiterProfileCompleteness = Number(recruiterProfile?.profile_completeness || 0);
  const isRecruiterProfileComplete =
    Boolean(recruiterProfile?.profile_completed) || recruiterProfileCompleteness >= 60;

  if (isLoading) {
    return (
      <div className="hv-page-shell">
        <LoadingState label="Loading your dashboard..." className="min-h-screen" />
      </div>
    );
  }

  return (
    <div className="hv-page-shell flex flex-col">
      {/* Header */}
      <header className="hv-dashboard-header">
        <div className="hv-container py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <HireVifyLogo size="md" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Recruiter workspace</p>
                <h1 className="truncate text-2xl font-semibold tracking-normal text-slate-950">Recruiter Dashboard</h1>
                <p className="text-sm text-slate-500">Manage projects, screening, interviews, and hiring analytics.</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {/* Premium Status */}
              {subscription?.isActive ? (
                <Badge className="hidden rounded-full border border-emerald-200 bg-emerald-100 px-4 py-2 font-semibold text-emerald-800 md:flex">
                  <Crown className="w-4 h-4 mr-2 text-emerald-600" />
                  {subscription.tier?.charAt(0).toUpperCase() + subscription.tier?.slice(1)} Plan
                </Badge>
              ) : (
                <Button onClick={onUpgrade} className="hidden rounded-lg bg-emerald-600 px-5 font-semibold text-white shadow-sm hover:bg-emerald-700 md:flex">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={onViewNotifications} className="relative rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {false && unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </Badge>
                  )}
                </Button>
                
                <Button variant="ghost" size="icon" onClick={onViewMessages} className="relative rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  {false && unreadMessages > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                      {unreadMessages}
                    </Badge>
                  )}
                </Button>
                
                <Button variant="ghost" size="icon" onClick={onViewSettings} className="rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
                  <Settings className="w-5 h-5 text-gray-600" />
                </Button>
                
                <Button variant="ghost" size="icon" onClick={onLogout} className="rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600">
                  <LogOut className="w-5 h-5 text-gray-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="hv-container flex-1 py-6 sm:py-8">
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
        {/* Company Profile Completion Card */}
        <Card className="mb-6 border-emerald-100 bg-white/95 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isRecruiterProfileComplete ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                  {isRecruiterProfileComplete ? (
                    <Award className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <User className="w-6 h-6 text-amber-600" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-900">
                      {isRecruiterProfileComplete ? 'Your company profile is ready' : 'Complete your company profile'}
                    </h2>
                    <Badge className={isRecruiterProfileComplete ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}>
                      {recruiterProfileCompleteness}% complete
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mt-1">
                    {isRecruiterProfileComplete
                      ? 'Candidates can trust your company details. Keep your profile updated before posting jobs and scheduling interviews.'
                      : 'Add company name, contact person, industry, location, website, and description before inviting candidates.'}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => onViewSettings?.()}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
              >
                {isRecruiterProfileComplete ? 'View / Edit Company Profile' : 'Complete Company Profile'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <DashboardGrid className="mb-6">
          <StatCard label="Active Projects" value={postedJobs.length} icon={FolderOpen} tone="emerald" onClick={onViewProjects} />
          <StatCard label="Applications" value={applicants.length} icon={Users} tone="blue" onClick={onViewATS} />
          <StatCard label="Interviews" value={stats?.interviewsScheduled || 0} icon={Calendar} tone="violet" onClick={onViewInterviews} />
          <StatCard label="Hire Rate" value={stats?.hireRate || 'N/A'} icon={BarChart3} tone="amber" onClick={onViewAnalytics} />
        </DashboardGrid>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 mb-6">
          <Button 
            onClick={() => onPostProject()}
            className="h-12 rounded-lg bg-emerald-600 px-6 font-semibold text-white shadow-sm hover:bg-emerald-700 sm:h-14"
          >
            <Plus className="w-5 h-5 mr-2" />
            Post New Project
          </Button>
          
          <Button 
            variant="outline"
            onClick={onSearchCandidates}
            className="h-12 rounded-lg border-slate-300 px-6 font-semibold text-slate-900 hover:bg-slate-50 sm:h-14"
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
            <div className="hv-surface p-5 sm:p-6 lg:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Hiring Tools</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={onViewAIMatchingDashboard} className="hv-action-card group">
                  <div className="flex items-center justify-between mb-3">
                    <Brain className="w-6 h-6 text-emerald-600" />
                    {aiMatchingAccess && <Badge className="text-xs bg-emerald-100 text-emerald-700">PRO</Badge>}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI Matching</h3>
                  <p className="text-sm text-gray-600">Smart candidate matching</p>
                </button>

                <button onClick={onViewATSScanner} className="hv-action-card group">
                  <div className="flex items-center justify-between mb-3">
                    <Scan className="w-6 h-6 text-blue-600" />
                    {atsAccess && <Badge className="text-xs bg-emerald-100 text-emerald-700">PRO</Badge>}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">ATS Scanner</h3>
                  <p className="text-sm text-gray-600">Resume screening tool</p>
                </button>

                <button onClick={onViewSkillsAssessment} className="hv-action-card group">
                  <div className="flex items-center justify-between mb-3">
                    <Award className="w-6 h-6 text-purple-600" />
                    {assessmentsAccess && <Badge className="text-xs bg-emerald-100 text-emerald-700">PRO</Badge>}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Assessments</h3>
                  <p className="text-sm text-gray-600">Custom skills tests</p>
                </button>

                <button onClick={onViewAnalytics} className="hv-action-card group">
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
            <div className="hv-surface p-5 sm:p-6 lg:p-8">
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
              <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm">
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
              <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm">
                <div className="text-center">
                  <Crown className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-1">{subscription?.tier?.charAt(0).toUpperCase() + subscription?.tier?.slice(1)} Plan</h3>
                  <p className="text-sm text-gray-600">All premium features enabled</p>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="hv-surface p-6">
              <h3 className="font-bold text-gray-900 mb-4">Recent Applications</h3>
              {applicants.length > 0 ? (
                <div className="space-y-3">
                  {applicants.slice(0, 3).map((app: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{app.candidate_profile?.full_name || app.candidate_profile?.email || app.candidate_name || app.candidate_email || 'Candidate'}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">Applied for: {app.job?.title || app.job_title || 'Job'}</p>
                      <p className="text-xs text-gray-500">Status: {app.status || 'applied'}</p>
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
            <div className="hv-surface p-6">
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



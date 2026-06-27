import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useConversations } from '../hooks/useConversations';
import { useNotifications } from '../hooks/useNotifications';
import { Badge } from './ui/badge';
import { HireVifyLogo } from './HireVifyLogo';
import { 
  Plus, 
  Briefcase, 
  Users, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  LogOut,
  Clock,
  Target,
  Crown,
  Bell,
  Search,
  ChevronRight,
  Calendar,
  Award,
  MessageSquare,
  User,
  ArrowRight,
  Brain,
  Scan,
  Zap,
  BookOpen,
  TrendingUp,
  Clock3,
  CheckCircle2,
  ArrowUpRight,
  LayoutDashboard,
  FileSearch,
  Sparkles,
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { usePremiumAccess } from '../utils/premium';
import { profilesService } from '@/src/hirevify-app/services/profilesService';
import { jobsService } from '@/src/hirevify-app/services/jobsService';
import { applicationsService } from '@/src/hirevify-app/services/applicationsService';
import { careerGrowthService, type CareerGrowthApplication, type CareerGrowthType } from '@/src/hirevify-app/services/careerGrowthService';
import { subscriptionsService } from '@/src/hirevify-app/services/subscriptionsService';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { CommunicationsAPI, type Conversation } from '@/src/hirevify-app/utils/api/communications';
import { toast } from 'sonner';
import { cn } from './ui/utils';

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
  onPostProject?: (project?: Project) => void;
  onPostJob?: (job?: any) => void;
  onViewProjects?: () => void;
  onViewATS: () => void;
  onViewATSScanner?: () => void;
  onViewAIMatchingDashboard?: () => void;
  onViewAnalytics: () => void;
  onViewSkillsAssessment?: () => void;
  onViewIntegrations?: () => void;
  onViewInterviews?: () => void;
  onViewSettings?: () => void;
  onEditProfile?: () => void;
  onSearchCandidates?: () => void;
  onViewMessages?: () => void;
  onViewNotifications?: () => void;
  onUpgrade: () => void;
  onLogout: () => void;
  onSkillsFirstHiring?: () => void;
  onEmployerEducation?: () => void;
  onViewOngoingProjects?: () => void;
  unreadNotifications?: number;
  unreadMessages?: number;
}

const isProjectOnlyRow = (job: any) => job?.job_type === 'freelance' && job?.has_project === true;

export function RecruiterDashboard({
  onPostProject,
  onPostJob,
  onViewProjects,
  onViewATS, 
  onViewATSScanner,
  onViewAIMatchingDashboard,
  onViewAnalytics, 
  onViewSkillsAssessment,
  onViewIntegrations,
  onViewInterviews,
  onViewSettings,
  onEditProfile,
  onSearchCandidates,
  onViewMessages,
  onViewNotifications,
  onUpgrade, 
  onLogout,
  onSkillsFirstHiring,
  onEmployerEducation,
  onViewOngoingProjects,
  unreadNotifications = 0,
  unreadMessages = 0
}: RecruiterDashboardProps) {
  const { user } = useAuth();
  const [recruiterProfile, setRecruiterProfile] = useState<any>(null);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [growthApplicants, setGrowthApplicants] = useState<CareerGrowthApplication[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);
  const { conversations: messageConversations } = useConversations();
  const { unreadCount: unreadNotificationsCount } = useNotifications();

  const totalUnreadMessages = messageConversations.reduce(
    (sum, conversation) => sum + (conversation.unreadCount || 0),
    0
  );
  
  // Safe premium access with fallbacks
  let checkAccess, getSubscription;
  let aiMatchingAccess = false;
  let atsAccess = false;
  let assessmentsAccess = false;
  let analyticsAccess = false;
  let integrationsAccess = false;

  try {
    const premiumAccess = usePremiumAccess();
    checkAccess = premiumAccess.checkAccess;
    getSubscription = premiumAccess.getSubscription;
    getSubscription();

    // Optimize access checks
    aiMatchingAccess = checkAccess('ai-matching');
    atsAccess = checkAccess('ats-scanner');
    assessmentsAccess = checkAccess('custom-assessments');
    analyticsAccess = checkAccess('advanced-analytics');
    integrationsAccess = checkAccess('integrations');
  } catch (error) {
    console.error('Error accessing premium features:', error);
  }

  // Load recruiter data from Supabase
  useEffect(() => {
    const loadRecruiterData = async () => {
      if (!user?.id) return;

      try {
        const supabase = createSupabaseBrowserClient();
        const { data: profileRow } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle();
        const recruiterId = profileRow?.id || user.id;

        // Load subscription
        const subData = await subscriptionsService.getUserSubscription(user.id);
        if (subData.data) {
          setSubscription(subData.data);
        } else {
          setSubscription({ tier: 'free', isActive: false });
        }

        // Load recruiter profile
        const profileData = await profilesService.getRecruiterProfile(recruiterId);
        if (profileData.data) {
          setRecruiterProfile(profileData.data);
        }

        // Load posted jobs
        const jobsData = await jobsService.getRecruiterJobs(recruiterId);
        if (jobsData.data) {
          setPostedJobs((jobsData.data || []).filter((job: any) => !isProjectOnlyRow(job)));
        }

        // Load applications
        const appData = await applicationsService.getRecruiterApplications(recruiterId);
        if (appData.data) {
          setApplicants(appData.data);
        }

        const growthAppData = await careerGrowthService.getCareerGrowthApplicationsForRecruiter(recruiterId);
        if (growthAppData.data) {
          setGrowthApplicants(growthAppData.data);
        }
        if (growthAppData.error && Object.keys(growthAppData.error).length > 0) {
          console.error('Error loading career growth applications:', growthAppData.error);
        }

        // Load stats
        const statsData = await jobsService.getRecruiterStats(recruiterId);
        if (statsData.data) {
          setStats(statsData.data);
        }
      } catch (error) {
        console.error('Error loading recruiter data:', error);
        toast.error('Failed to load dashboard data');
      }
    };

    loadRecruiterData();
  }, [user?.id]);


  const openGrowthApplications = (type: 'experience_builder' | 'micro_internship') => {
    if (typeof window!== 'undefined') {
      window.localStorage.setItem('hirevify_growth_post_type', type);
      window.localStorage.setItem('hirevify_growth_review_mode', 'applications');
    }

    onViewProjects?.();
  };

  const recruiterProfileCompleteness = Number(recruiterProfile?.profile_completeness || 0);
  const isRecruiterProfileComplete =
    Boolean(recruiterProfile?.profile_completed) || recruiterProfileCompleteness >= 60;
  const growthApplicationCountByType = (type: CareerGrowthType) =>
    growthApplicants.filter((application) => application.opportunity?.type === type).length;
  const latestApplicationLabel = (application: any) =>
    application?.candidate_profile?.full_name || application?.candidate_profile?.email || application?.candidate_name || application?.candidate_email || 'Candidate';
  const applicationSections = [
    {
      key: 'job_applications',
      title: 'Job Applications',
      subtitle: 'Candidates who applied to jobs',
      count: applicants.length,
      icon: Briefcase,
      accent: 'bg-emerald-50 text-emerald-600',
      hoverAccent: 'group-hover:bg-emerald-600',
      action: onViewATS,
      latest: applicants[0]? `${latestApplicationLabel(applicants[0])} - ${applicants[0]?.job?.title || applicants[0]?.job_title || 'Job'}`: 'No applications yet',
    },
    {
      key: 'experience_builder',
      title: 'Experience Builder Applications',
      subtitle: 'Candidates applying to experience posts',
      count: growthApplicationCountByType('experience_builder'),
      icon: Target,
      accent: 'bg-blue-50 text-blue-600',
      hoverAccent: 'group-hover:bg-blue-600',
      action: () => openGrowthApplications('experience_builder'),
      latest: growthApplicants.find((application) => application.opportunity?.type === 'experience_builder')
        ? `${latestApplicationLabel(growthApplicants.find((application) => application.opportunity?.type === 'experience_builder'))} - ${growthApplicants.find((application) => application.opportunity?.type === 'experience_builder')?.opportunity?.title || 'Experience post'}`
        : 'No applications yet',
    },
    {
      key: 'micro_internship',
      title: 'Micro Internship Applications',
      subtitle: 'Candidates applying to micro internships',
      count: growthApplicationCountByType('micro_internship'),
      icon: Clock,
      accent: 'bg-amber-50 text-amber-600',
      hoverAccent: 'group-hover:bg-amber-600',
      action: () => openGrowthApplications('micro_internship'),
      latest: growthApplicants.find((application) => application.opportunity?.type === 'micro_internship')
        ? `${latestApplicationLabel(growthApplicants.find((application) => application.opportunity?.type === 'micro_internship'))} - ${growthApplicants.find((application) => application.opportunity?.type === 'micro_internship')?.opportunity?.title || 'Micro internship'}`
        : 'No applications yet',
    },
    // Mentorship and Career Switch removed from recruiter portal
  ];
  const recentApplications = [
    ...applicants.map((application) => ({
      id: application.id,
      candidate: latestApplicationLabel(application),
      source: application.job?.title || application.job_title || 'Job',
      status: application.status || 'applied',
      category: 'Job Application',
      createdAt: application.created_at || '',
    })),
    ...growthApplicants
      .filter((application) => application.opportunity?.type && ['experience_builder', 'micro_internship'].includes(application.opportunity.type))
      .map((application) => ({
        id: application.id,
        candidate: latestApplicationLabel(application),
        source: application.opportunity?.title || 'Career growth opportunity',
        status: application.status || 'applied',
        category: application.opportunity?.type === 'experience_builder'? 'Experience Builder': 'Micro Internship',
        createdAt: application.created_at || '',
      })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="premium-page">
      {/* Premium Header */}
      <header className="premium-header">
        <div className="premium-header-inner">
          {/* Logo and Title */}
          <div className="flex min-w-0 items-center gap-4">
            <HireVifyLogo size="md" />
            <div className="min-w-0">
              <p className="premium-eyebrow text-emerald-600">Recruiter workspace</p>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Dashboard</h1>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Premium Status */}
            {subscription?.isActive? (
              <Badge className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-700 md:flex">
                <Crown className="h-3.5 w-3.5" />
                {subscription.tier?.charAt(0).toUpperCase() + subscription.tier?.slice(1)} Plan
              </Badge>
            ): (
              <Button onClick={onUpgrade} className="hidden items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-slate-800 md:flex">
                <Crown className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            )}
            
            {/* Icon Buttons */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onViewNotifications} 
                className="premium-btn-icon-ghost relative"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadNotificationsCount > 9? '9+': unreadNotificationsCount}
                  </span>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onViewMessages} 
                className="premium-btn-icon-ghost relative"
              >
                <MessageSquare className="h-5 w-5" />
                {totalUnreadMessages > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {totalUnreadMessages > 9? '9+': totalUnreadMessages}
                  </span>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onViewSettings} 
                className="premium-btn-icon-ghost"
              >
                <Settings className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onLogout} 
                className="premium-btn-icon-ghost hover:text-red-600"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="premium-content">
        {/* Profile Completion Card */}
        <div className="mb-6 premium-card">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                  isRecruiterProfileComplete 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-amber-100 text-amber-600'
                )}>
                  {isRecruiterProfileComplete ? <Award className="h-6 w-6" /> : <User className="h-6 w-6" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {isRecruiterProfileComplete ? 'Company profile ready' : 'Complete your profile'}
                    </h2>
                    <Badge className={isRecruiterProfileComplete ? 'premium-badge-success' : 'premium-badge-warning'}>
                      {recruiterProfileCompleteness}% complete
                    </Badge>
                  </div>
                  <p className="mt-1 max-w-xl text-sm text-slate-600">
                    {isRecruiterProfileComplete 
                      ? 'Your company details are visible to candidates. Keep it updated for better engagement.'
                      : 'Add your company details to start posting jobs and receiving applications.'
                    }
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => onEditProfile?.()} 
                className="premium-btn-primary shrink-0"
              >
                {isRecruiterProfileComplete ? 'Edit Profile' : 'Complete Profile'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Jobs', value: postedJobs.length, icon: FolderOpen, action: onViewProjects, color: 'text-blue-600 bg-blue-50' },
            { label: 'All Projects', value: applicants.filter((a) => a.status === 'assigned').length, icon: Briefcase, action: onViewOngoingProjects || onViewATS, color: 'text-teal-600 bg-teal-50' },
            { label: 'Hire Rate', value: stats?.hireRate || 'N/A', icon: TrendingUp, action: onViewAnalytics, color: 'text-violet-600 bg-violet-50' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="premium-stat-card cursor-pointer text-left"
              >
                <div className="mb-3">
                  <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl', item.color)}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="premium-stat-label">{item.label}</p>
                <p className="premium-stat-value">{item.value}</p>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-6 premium-card-interactive overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6">
            <div className="mb-4">
              <p className="premium-eyebrow text-slate-400">Quick Actions</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Post jobs and source candidates</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                onClick={() => (onPostJob ? onPostJob() : onPostProject?.())}
                className="h-14 rounded-xl bg-white px-6 font-semibold text-slate-900 shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                <Plus className="mr-2 h-5 w-5" />
                Post Job
              </Button>
              <Button
                variant="outline"
                onClick={onSearchCandidates}
                className="h-14 rounded-xl border-white/30 bg-white/10 px-6 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <Search className="mr-2 h-5 w-5" />
                Search Candidates
              </Button>
            </div>
          </div>
        </div>

        {/* Application Sections */}
        <div className="mb-6 premium-card">
          <div className="premium-card-header">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="premium-eyebrow text-emerald-600">Applications</p>
                <h2 className="premium-card-title mt-1">Application Pipeline</h2>
              </div>
              <p className="text-sm text-slate-500">Review and manage applications by category.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
            {applicationSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={section.action}
                  className="group flex min-h-[160px] flex-col rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/70 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors', section.accent, section.hoverAccent, 'group-hover:text-white')}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 px-2 text-sm font-bold text-white shadow-sm">
                      {section.count}
                    </span>
                  </div>
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-slate-950">{section.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{section.subtitle}</p>
                  </div>
                  <p className="mt-auto line-clamp-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-100">{section.latest}</p>
                  <div className="mt-4 flex items-center text-xs font-semibold text-slate-600">
                    <span className="transition-colors group-hover:text-emerald-600">View all</span>
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          {/* Left Column */}
          <div className="space-y-6">
            {/* AI Tools */}
            <div className="premium-card">
              <div className="premium-card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="premium-eyebrow text-violet-600">Powered by AI</p>
                    <h2 className="premium-card-title mt-1">Hiring Tools</h2>
                  </div>
                  <Badge className="premium-badge-default">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Pro
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'AI Matching', description: 'Smart candidate matching', icon: Brain, action: onViewAIMatchingDashboard, access: aiMatchingAccess, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'ATS Scanner', description: 'Resume screening', icon: Scan, action: onViewATSScanner, access: atsAccess, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Assessments', description: 'Custom skills tests', icon: Award, action: onViewSkillsAssessment, access: assessmentsAccess, color: 'bg-violet-50 text-violet-600' },
                    { label: 'Analytics', description: 'Hiring insights', icon: BarChart3, action: onViewAnalytics, access: analyticsAccess, color: 'bg-amber-50 text-amber-600' },
                  ].map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button 
                        key={tool.label} 
                        type="button" 
                        onClick={tool.action} 
                        className="group rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:border-emerald-300 hover:bg-white"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl', tool.color)}>
                            <Icon className="h-5 w-5" />
                          </span>
                          {tool.access && <Badge className="premium-badge-success">PRO</Badge>}
                        </div>
                        <h3 className="font-semibold text-slate-900">{tool.label}</h3>
                        <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Why Skills-First Hiring */}
            <div className="premium-card">
              <div className="premium-card-header">
                <h2 className="premium-card-title">Why Skills-First Hiring?</h2>
              </div>
              <div className="p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { title: 'Project-Based', copy: 'See real work samples instead of just resumes', icon: Target },
                    { title: 'AI-Powered', copy: 'Advanced AI finds the perfect candidates', icon: Zap },
                    { title: 'Skills Tests', copy: 'Validate technical skills with custom tests', icon: Award },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <Icon className="mb-3 h-5 w-5 text-emerald-600" />
                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                        <p className="mt-1 text-sm text-slate-600">{item.copy}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Messages */}
            <div className="premium-card">
              <div className="premium-card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="premium-eyebrow text-blue-600">Inbox</p>
                    <h3 className="premium-card-title mt-1">Messages</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onViewMessages}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    View all
                  </Button>
                </div>
              </div>
              <div>
                {messageConversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">No conversations yet</p>
                    <p className="mt-1 text-xs text-slate-500">Candidate messages will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {messageConversations.slice(0, 5).map((conversation) => (
                      <button
                        key={conversation.otherUser.id}
                        type="button"
                        onClick={onViewMessages}
                        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-sm font-semibold text-blue-600">
                          {(conversation.otherUser.name || 'U').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">{conversation.otherUser.name || 'User'}</p>
                            <span className="text-xs text-slate-400">{conversation.lastMessage ? formatMessageTime(conversation.lastMessage.createdAt) : ''}</span>
                          </div>
                          <p className="truncate text-xs text-slate-500">{conversation.lastMessage ? conversation.lastMessage.message : 'No messages yet'}</p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Applications */}
            <div className="premium-card">
              <div className="premium-card-header">
                <h3 className="premium-card-title">Recent Applications</h3>
              </div>
              <div className="p-4">
                {recentApplications.length > 0 ? (
                  <div className="space-y-3">
                    {recentApplications.map((application) => (
                      <div 
                        key={`${application.category}-${application.id}`} 
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors hover:border-slate-200"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="line-clamp-1 text-sm font-semibold text-slate-900">{application.candidate}</p>
                          <Badge className="premium-badge-default shrink-0">{application.category}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{application.source}</p>
                        <p className="mt-2 text-xs font-medium capitalize text-slate-600">
                          Status: {application.status}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="premium-empty py-8">
                    <Users className="premium-empty-icon" />
                    <p className="premium-empty-title">No applications yet</p>
                    <p className="premium-empty-description">Post a job to start receiving applications.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}





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
  Award,
  MessageSquare,
  ArrowRight,
  Brain,
  Scan,
  Zap,
  TrendingUp,
  ArrowUpRight,
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
        if (growthAppData.error?.message) {
          console.warn('Career growth applications were not loaded:', growthAppData.error.message);
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
      accent: 'bg-teal-50 text-teal-700',
      hoverAccent: 'group-hover:bg-teal-700',
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
      accent: 'bg-lime-50 text-lime-700',
      hoverAccent: 'group-hover:bg-lime-700',
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
    <div className="min-h-screen bg-white text-slate-950">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 shadow-[0_14px_36px_rgba(16,185,129,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo and Title */}
          <div className="flex min-w-0 items-center gap-4">
            <HireVifyLogo size="md" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-normal text-emerald-700">Recruiter workspace</p>
              <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Dashboard</h1>
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
              <Button onClick={onUpgrade} className="hidden items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] hover:bg-emerald-700 md:flex">
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
                className="relative rounded-full text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
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
                className="relative rounded-full text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
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
                className="rounded-full text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Settings className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onLogout} 
                className="rounded-full text-slate-700 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Workspace Overview */}
        <section className="mb-8 overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="bg-white px-5 py-7 sm:px-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-normal text-emerald-700">
                      Workspace
                    </span>
                    <span className="h-px w-8 bg-emerald-300" />
                    <span className="text-sm text-slate-600">Recruiting operations</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                    Recruiting desk
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Keep the essentials close: publish roles, review assigned work, and move candidates through the pipeline.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => (onPostJob ? onPostJob() : onPostProject?.())}
                    className="h-11 rounded-full bg-emerald-600 px-5 font-semibold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] hover:bg-emerald-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Post Job
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onSearchCandidates}
                    className="h-11 rounded-full border-emerald-200 bg-white px-5 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search Candidates
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 overflow-hidden rounded-2xl border border-emerald-100 bg-white/80 sm:grid-cols-3">
                {[
                  { label: 'Open jobs', value: postedJobs.length, action: onViewProjects },
                  { label: 'Assigned projects', value: applicants.filter((a) => a.status === 'assigned').length, action: onViewOngoingProjects || onViewATS },
                  { label: 'Hire rate', value: stats?.hireRate || 'N/A', action: onViewAnalytics },
                ].map((item, index) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className={cn(
                      "group px-5 py-5 text-left transition-colors hover:bg-emerald-50",
                      index > 0 && "border-t border-emerald-100 sm:border-l sm:border-t-0"
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700 group-hover:text-emerald-700">
                      {item.label}
                    </p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <p className="text-3xl font-semibold tracking-normal text-slate-950">{item.value}</p>
                      <ArrowUpRight className="mb-1 h-4 w-4 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <aside className="border-t border-emerald-100 bg-white px-5 py-7 text-slate-950 sm:px-7 lg:border-l lg:border-t-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Profile task</p>
                  <h3 className="mt-2 text-base font-semibold text-slate-950">
                    {isRecruiterProfileComplete ? 'Company profile ready' : 'Complete company profile'}
                  </h3>
                </div>
                <span className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                  isRecruiterProfileComplete
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-emerald-100 text-emerald-700'
                )}>
                  {recruiterProfileCompleteness}%
                </span>
              </div>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-emerald-200">
                <div
                  className={cn(
                    "h-full rounded-full",
                    isRecruiterProfileComplete ? 'bg-emerald-500' : 'bg-emerald-600'
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, recruiterProfileCompleteness))}%` }}
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {isRecruiterProfileComplete
                  ? 'Your public company details are active. Refresh them when hiring priorities change.'
                  : 'Add the missing company details before you start receiving serious applications.'
                }
              </p>

              <button
                type="button"
                onClick={() => onEditProfile?.()}
                className="mt-5 inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-700"
              >
                {isRecruiterProfileComplete ? 'Edit profile' : 'Finish setup'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </aside>
          </div>
        </section>

        {/* Application Sections */}
        <div className="mb-6 overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
          <div className="border-b border-emerald-100 bg-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Applications</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Application Pipeline</h2>
              </div>
              <p className="text-sm text-slate-600">Review and manage applications by category.</p>
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
                  className="group flex min-h-[160px] flex-col rounded-2xl border border-emerald-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-[0_18px_45px_rgba(16,185,129,0.12)]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors', section.accent, section.hoverAccent, 'group-hover:text-white')}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 px-2 text-sm font-bold text-white shadow-sm">
                      {section.count}
                    </span>
                  </div>
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-slate-950">{section.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{section.subtitle}</p>
                  </div>
                  <p className="mt-auto line-clamp-2 rounded-lg bg-white/85 px-3 py-2 text-xs text-slate-600 ring-1 ring-emerald-100">{section.latest}</p>
                  <div className="mt-4 flex items-center text-xs font-semibold text-slate-600">
                    <span className="transition-colors group-hover:text-emerald-700">View all</span>
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
            <section className="overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-2 border-b border-emerald-100 bg-white px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Powered by AI</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">Hiring Tools</h2>
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <Sparkles className="mr-1.5 h-3 w-3" />
                  Pro workspace
                </span>
              </div>

              <div className="divide-y divide-emerald-100">
                {[
                  { label: 'AI Matching', description: 'Rank candidates against role requirements and project signals.', icon: Brain, action: onViewAIMatchingDashboard, access: aiMatchingAccess },
                  { label: 'ATS Scanner', description: 'Screen resumes and surface missing evidence before review.', icon: Scan, action: onViewATSScanner, access: atsAccess },
                  { label: 'Assessments', description: 'Create skills tests tied to the work you are hiring for.', icon: Award, action: onViewSkillsAssessment, access: assessmentsAccess },
                  { label: 'Analytics', description: 'Track pipeline health, conversion, and hiring momentum.', icon: BarChart3, action: onViewAnalytics, access: analyticsAccess },
                ].map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.label}
                      type="button"
                      onClick={tool.action}
                      className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-800 transition-colors group-hover:bg-emerald-200 group-hover:text-slate-950">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-950">{tool.label}</span>
                        <span className="mt-1 block text-sm leading-5 text-slate-600">{tool.description}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className={cn(
                          "hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex",
                          tool.access ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-emerald-700 ring-1 ring-emerald-100'
                        )}>
                          {tool.access ? 'Available' : 'Pro'}
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Messages */}
            <section className="overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
              <div className="flex items-end justify-between border-b border-emerald-100 bg-white px-5 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Inbox</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">Messages</h3>
                </div>
                <button
                  type="button"
                  onClick={onViewMessages}
                  className="text-sm font-semibold text-emerald-800 hover:text-emerald-700"
                >
                  View all
                </button>
              </div>
              <div>
                {messageConversations.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <MessageSquare className="mx-auto mb-3 h-7 w-7 text-emerald-300" />
                    <p className="text-sm font-semibold text-slate-950">No conversations yet</p>
                    <p className="mt-1 text-xs text-slate-600">Candidate messages will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-emerald-100">
                    {messageConversations.slice(0, 5).map((conversation) => (
                      <button
                        key={conversation.otherUser.id}
                        type="button"
                        onClick={onViewMessages}
                        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                          {(conversation.otherUser.name || 'U').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{conversation.otherUser.name || 'User'}</p>
                          <p className="truncate text-xs text-slate-600">{conversation.lastMessage ? conversation.lastMessage.message : 'No messages yet'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-slate-400">{conversation.lastMessage ? formatMessageTime(conversation.lastMessage.createdAt) : ''}</span>
                          {conversation.unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Recent Applications */}
            <section className="overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
              <div className="border-b border-emerald-100 bg-white px-5 py-5">
                <h3 className="text-lg font-semibold text-slate-950">Recent Applications</h3>
              </div>
              <div>
                {recentApplications.length > 0 ? (
                  <div className="divide-y divide-emerald-100">
                    {recentApplications.map((application) => (
                      <div
                        key={`${application.category}-${application.id}`}
                        className="px-5 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="line-clamp-1 text-sm font-semibold text-slate-950">{application.candidate}</p>
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                            {application.category}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-600">{application.source}</p>
                        <p className="mt-2 text-xs font-semibold capitalize text-emerald-700">
                          {application.status}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <Users className="mx-auto mb-3 h-8 w-8 text-emerald-300" />
                    <p className="text-sm font-semibold text-slate-950">No applications yet</p>
                    <p className="mt-1 text-xs text-slate-600">Post a job to start receiving applications.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Why Skills-First Hiring */}
        <section className="mt-6 overflow-hidden rounded-[28px] border border-emerald-100 bg-white text-slate-950 shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="px-5 py-7 sm:px-7">
              <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Hiring approach</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal">Why skills-first hiring?</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                Use real work evidence, AI review, and structured assessments to reduce guesswork before interviews.
              </p>
            </div>
            <div className="grid grid-cols-1 border-t border-emerald-100 bg-white sm:grid-cols-3 lg:border-l lg:border-t-0">
              {[
                { title: 'Project-based', copy: 'Review proof of work before shortlisting.', icon: Target },
                { title: 'AI-assisted', copy: 'Find stronger matches without manual sorting.', icon: Zap },
                { title: 'Skills tested', copy: 'Validate ability with focused assessments.', icon: Award },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={cn(
                      "px-5 py-7 sm:px-6",
                      index > 0 && "border-t border-emerald-100 sm:border-l sm:border-t-0"
                    )}
                  >
                    <Icon className="h-5 w-5 text-emerald-700" />
                    <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}








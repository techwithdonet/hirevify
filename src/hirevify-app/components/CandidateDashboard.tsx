import { useState, useEffect } from 'react';
import {
  Bell,
  MessageCircle,
  Settings,
  LogOut,
  Search,
  User,
  FileText,
  Award,
  Users,
  Target,
  Timer,
  BookOpen,
  ArrowRight,
  Crown,
  CheckCircle,
  Brain,
  Sparkles,
  Briefcase,
  MapPin,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Rocket,
  Lightbulb,
  Zap,
  Bookmark,
  Send,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { HireVifyLogo } from './HireVifyLogo';
import { subscriptionsService } from '@/src/hirevify-app/services/subscriptionsService';
import { profilesService } from '@/src/hirevify-app/services/profilesService';
import { applicationsService } from '@/src/hirevify-app/services/applicationsService';
import { portfolioService } from '@/src/hirevify-app/services/portfolioService';
import { savedJobsService } from '@/src/hirevify-app/services/savedJobsService';
import { jobsService } from '@/src/hirevify-app/services/jobsService';
import { usePremiumAccess } from '../utils/premium';
import { useConversations } from '../hooks/useConversations';
import { useNotifications } from '../hooks/useNotifications';
import { toast } from 'sonner';
import { cn } from './ui/utils';

interface CandidateDashboardProps {
  onBuildResume: () => void;
  onViewPortfolio: () => void;
  onTakeKnowledgeAssessment: () => void;
  onVideoInterview: () => void;
  onSearchProjects: () => void;
  onViewInterviews: () => void;
  onViewSettings: () => void;
  onEditProfile: () => void;
  onViewMessages: () => void;
  onViewNotifications: () => void;
  onViewAppliedJobs: () => void;
  onViewSavedJobs: () => void;
  onUpgrade: () => void;
  onLogout: () => void;
  onExperienceBuilder: () => void;
  onMicroInternships: () => void;
  onMentorshipProgram: () => void;
  onCareerSwitcherTrack: () => void;
  onProjectChallengeVideo: (projectId: string, projectTitle: string, challengeDescription?: string) => void;
  onAIInterviewCoach: () => void;
  onSkillsDevelopmentAI: () => void;
  onMarketIntelligence: () => void;
  unreadNotifications: number;
  unreadMessages: number;
}

export function CandidateDashboard({
  onBuildResume,
  onViewPortfolio,
  onTakeKnowledgeAssessment,
  onVideoInterview,
  onSearchProjects,
  onViewInterviews,
  onViewSettings,
  onEditProfile,
  onViewMessages,
  onViewNotifications,
  onViewAppliedJobs,
  onViewSavedJobs,
  onUpgrade,
  onLogout,
  onExperienceBuilder,
  onMicroInternships,
  onMentorshipProgram,
  onCareerSwitcherTrack,
  onProjectChallengeVideo,
  onAIInterviewCoach,
  onSkillsDevelopmentAI,
  onMarketIntelligence,
  unreadNotifications,
  unreadMessages
}: CandidateDashboardProps) {
  const { user } = useAuth();
  const { checkAccess } = usePremiumAccess();
  const { conversations: messageConversations } = useConversations();
  const { unreadCount: unreadNotificationsCount } = useNotifications();
  const totalUnreadMessages = messageConversations.reduce(
    (sum, conversation) => sum + (conversation.unreadCount || 0),
    0
  );
  void checkAccess;
  void onVideoInterview;
  void onViewInterviews;
  void onProjectChallengeVideo;
  void onMarketIntelligence;
  void unreadNotifications;
  void unreadMessages;
  const [subscription, setSubscription] = useState<any>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [publishedJobsCount, setPublishedJobsCount] = useState<number>(0);

  // Check profile completeness before allowing job search/apply
  const checkProfileForJobSearch = () => {
    const completeness = Number(candidateProfile?.profile_completeness || 0);
    const hasResume = Boolean(candidateProfile?.resume_url);
    const isProfileComplete = Boolean(candidateProfile?.profile_completed) || completeness >= 60;
    
    // Show warning if profile is incomplete or CV is missing
    if (!isProfileComplete || !hasResume) {
      const missing: string[] = [];
      if (!hasResume) missing.push('upload a CV');
      if (!isProfileComplete) missing.push(`complete your profile (${completeness}% done)`);
      
      toast.error(
        `Please ${missing.join(' and ')} before finding jobs and applying.`,
        { 
          action: {
            label: 'Complete Profile',
            onClick: onEditProfile
          },
          duration: 8000
        }
      );
      return false;
    }
    return true;
  };

  // Wrapper for onSearchProjects with profile check
  const handleSearchProjects = () => {
    if (checkProfileForJobSearch()) {
      onSearchProjects();
    }
  };

  // Load all candidate data from Supabase
  useEffect(() => {
    const loadCandidateData = async () => {
      if (!user?.id) return;

      try {
        // Load subscription
        const subData = await subscriptionsService.getUserSubscription(user.id);
        if (subData.data) {
          setSubscription(subData.data);
        } else {
          // Default free tier if no subscription
          setSubscription({ tier: 'free', isActive: false });
        }

        // Load candidate profile
        const profileData = await profilesService.getCandidateProfile(user.id);
        if (profileData.data) {
          setCandidateProfile(profileData.data);
        }

        // Load applications — use auth.users.id since that's what's stored as candidate_id
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const appData = await applicationsService.getCandidateApplications(user.id, authUser?.id);
        if (appData.data) {
          setApplications(appData.data);
        }

        // Load portfolio
        const portfolioData = await portfolioService.getUserPortfolio(user.id);
        if (portfolioData.data) {
          setPortfolio(portfolioData.data);
        }

        // Load saved jobs
        const savedData = await savedJobsService.getCandidateSavedJobs(user.id);
        if (savedData.data) {
          setSavedJobs(savedData.data);
        }

        // Load published jobs count for the Find Jobs hero CTA
        try {
          const { count } = await jobsService.getPublishedJobs({ limit: 1 });
          setPublishedJobsCount(count || 0);
        } catch (countErr) {
          console.warn('Could not load published jobs count for hero CTA', countErr);
        }
      } catch (error) {
        console.error('Error loading candidate data:', error);
        toast.error('Failed to load dashboard data');
      }
    };

    loadCandidateData();
  }, [user?.id]);

  const candidateProfileCompleteness = Number(candidateProfile?.profile_completeness || 0);
  const isCandidateProfileComplete =
    Boolean(candidateProfile?.profile_completed) || candidateProfileCompleteness >= 60;

  return (
    <div className="premium-page">
      {/* Premium Header */}
      <header className="premium-header">
        <div className="premium-header-inner">
          {/* Logo and Title */}
          <div className="flex min-w-0 items-center gap-4">
            <HireVifyLogo size="md" />
            <div className="min-w-0">
              <p className="premium-eyebrow text-emerald-600">Candidate workspace</p>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Welcome, {user?.name?.split(' ')[0] || 'Candidate'}
              </h1>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Premium Status */}
            {subscription && subscription.isActive ? (
              <Badge className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-700 md:flex">
                <Crown className="h-3.5 w-3.5" />
                {subscription.tier?.charAt(0).toUpperCase() + subscription.tier?.slice(1)} Plan
              </Badge>
            ) : (
              <Button onClick={onUpgrade} className="hidden items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-slate-800 md:flex">
                <Crown className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            )}
            
            {/* Icon Buttons */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onViewMessages} 
                className="premium-btn-icon-ghost relative"
              >
                <MessageCircle className="h-5 w-5" />
                {totalUnreadMessages > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {totalUnreadMessages > 9? '9+': totalUnreadMessages}
                  </span>
                )}
              </Button>

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
        {/* Profile Completion Hero */}
        <section className="mb-6 premium-card">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors",
                isCandidateProfileComplete 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : 'bg-amber-100 text-amber-600'
              )}>
                {isCandidateProfileComplete ? (
                  <CheckCircle className="h-7 w-7" />
                ) : (
                  <User className="h-7 w-7" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge className={isCandidateProfileComplete ? 'premium-badge-success' : 'premium-badge-warning'}>
                    {candidateProfileCompleteness}% complete
                  </Badge>
                  <Badge className="premium-badge-default">
                    Recruiter visibility
                  </Badge>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {isCandidateProfileComplete ? 'Your profile is ready' : 'Complete your candidate profile'}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  {isCandidateProfileComplete 
                    ? 'Recruiters can now discover your profile. Keep it updated for better matches.'
                    : 'Add skills, experience, and portfolio details so recruiters can find you.'
                  }
                </p>

                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${Math.min(candidateProfileCompleteness, 100)}%` }}
                  />
                </div>
              </div>

              <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:w-64">
                <p className="text-sm font-semibold text-slate-900">Next step</p>
                <p className="mt-1 text-sm text-slate-600">
                  {isCandidateProfileComplete 
                    ? 'Review your details before applying to new projects.'
                    : 'Finish the missing fields to improve matching quality.'
                  }
                </p>
                <Button 
                  onClick={onEditProfile} 
                  className="mt-4 w-full premium-btn-primary"
                >
                  {isCandidateProfileComplete ? 'View / Edit Profile' : 'Complete Profile'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Applied Jobs', value: applications.length, icon: FileText, color: 'bg-emerald-50 text-emerald-600', action: onViewAppliedJobs },
            { label: 'Portfolio Items', value: portfolio.length, icon: Award, color: 'bg-blue-50 text-blue-600' },
            { label: 'Saved Jobs', value: savedJobs.length, icon: Bookmark, color: 'bg-violet-50 text-violet-600', action: onViewSavedJobs },
            { label: 'Subscription', value: (subscription?.tier || 'free').charAt(0).toUpperCase() + (subscription?.tier || 'free').slice(1), icon: Crown, color: 'bg-amber-50 text-amber-600' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                onClick={item.action}
                className={cn(
                  "premium-stat-card",
                  item.action && "cursor-pointer"
                )}
              >
                <div className="mb-3">
                  <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl', item.color)}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="premium-stat-label">{item.label}</p>
                <p className="premium-stat-value">{item.value}</p>
              </div>
            );
          })}
        </div>

        {/* Find Jobs Hero CTA */}
        <section
          onClick={handleSearchProjects}
          className="group relative mb-6 cursor-pointer overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6 text-white shadow-lg transition-shadow hover:shadow-xl sm:p-8"
        >
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Featured
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Find Your Next Opportunity
              </h2>
              <p className="mt-3 text-base text-white/80 sm:text-lg">
                Browse open roles from real companies, see attached projects, and apply in one click.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2 text-sm text-white/70 sm:grid-cols-3">
                <li className="inline-flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-300" />
                  {publishedJobsCount} open jobs
                </li>
                <li className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-300" />
                  Remote Â· Hybrid Â· On-site
                </li>
                <li className="inline-flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-300" />
                  Transparent budgets
                </li>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 lg:items-end">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-sm transition-transform group-hover:scale-105 group-hover:bg-white/25">
                <Search className="h-7 w-7" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-colors group-hover:bg-emerald-50">
                Browse all jobs
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Left Column - Main Tools */}
          <div className="space-y-6">
            {/* Essential Tools */}
            <section className="premium-card">
              <div className="premium-card-header">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="premium-eyebrow text-emerald-600">Start here</p>
                    <h2 className="premium-card-title mt-1">Essential Tools</h2>
                  </div>
                  <p className="max-w-md text-sm text-slate-500">Build credibility and prepare better for opportunities.</p>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Knowledge Assessment', description: 'Verify your skills', icon: Award, color: 'bg-emerald-50 text-emerald-600', action: onTakeKnowledgeAssessment },
                    { label: 'AI Resume Builder', description: 'Create your resume', icon: Brain, color: 'bg-blue-50 text-blue-600', action: onBuildResume },
                    { label: 'Portfolio', description: 'Showcase your work', icon: Sparkles, color: 'bg-violet-50 text-violet-600', action: onViewPortfolio },
                    { label: 'Find Jobs', description: 'Browse opportunities', icon: Search, color: 'bg-amber-50 text-amber-600', action: handleSearchProjects },
                  ].map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.label}
                        onClick={tool.action}
                        className="group relative rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-emerald-300 hover:shadow-md"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <span className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors', tool.color, 'group-hover:bg-slate-900 group-hover:text-white')}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900">{tool.label}</h3>
                        <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Career Growth */}
            <section className="premium-card">
              <div className="premium-card-header">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="premium-eyebrow text-violet-600">Growth plan</p>
                    <h2 className="premium-card-title mt-1">Career Growth Paths</h2>
                  </div>
                  <p className="max-w-md text-sm text-slate-500">Choose a guided path to build real experience.</p>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[
                    { title: 'Experience Builder', description: '1-2 week projects', icon: Target, color: 'bg-emerald-50 text-emerald-600', action: onExperienceBuilder },
                    { title: 'Micro-Internships', description: '1-5 day projects', icon: Timer, color: 'bg-blue-50 text-blue-600', action: onMicroInternships },
                    { title: 'Mentorship', description: 'Expert guidance', icon: Users, color: 'bg-amber-50 text-amber-600', action: onMentorshipProgram },
                    { title: 'Career Switch', description: 'Structured learning', icon: BookOpen, color: 'bg-violet-50 text-violet-600', action: onCareerSwitcherTrack },
                  ].map((path) => {
                    const Icon = path.icon;
                    return (
                      <button
                        key={path.title}
                        onClick={path.action}
                        className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-emerald-300 hover:shadow-md"
                      >
                        <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors', path.color, 'group-hover:bg-slate-900 group-hover:text-white')}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-900">{path.title}</h4>
                          <p className="text-sm text-slate-500">{path.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <aside className="space-y-6">
            {/* Premium Card */}
            {!subscription?.isActive ? (
              <section className="relative overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 p-6 text-white shadow-lg">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl" />
                <div className="relative text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Crown className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">Go Premium</h3>
                  <p className="mt-2 text-sm text-white/70">Unlock advanced tools and features</p>
                  <Button 
                    onClick={onUpgrade} 
                    className="mt-5 w-full rounded-xl bg-white font-bold text-emerald-900 shadow-lg hover:bg-emerald-50"
                  >
                    Upgrade Now
                  </Button>
                </div>
              </section>
            ) : (
              <section className="relative overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 p-6 text-white shadow-lg">
                <div className="relative text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Crown className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">{subscription?.tier?.charAt(0).toUpperCase() + subscription?.tier?.slice(1)} Plan</h3>
                  <p className="mt-2 text-sm text-white/70">Premium features enabled</p>
                </div>
              </section>
            )}

            {/* Recent Applications */}
            <section className="premium-card">
              <div className="premium-card-header">
                <div className="flex items-center justify-between">
                  <h3 className="premium-card-title">Recent Applications</h3>
                  <button
                    type="button"
                    onClick={onViewAppliedJobs}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    View all â†’
                  </button>
                </div>
              </div>
              <div className="p-4">
                {applications.length > 0 ? (
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app: any, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={onViewAppliedJobs}
                        className="block w-full rounded-xl border border-slate-100 bg-slate-50 p-4 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/50"
                      >
                        <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                          {app.job?.title || app.job_title || app.title || 'Application submitted'}
                        </p>
                        <p className="mt-1 text-xs font-medium capitalize text-slate-500">
                          Status: {app.status || 'applied'}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="premium-empty py-8">
                    <FileText className="premium-empty-icon" />
                    <p className="premium-empty-title">No applications yet</p>
                    <p className="premium-empty-description">Apply to a project to see progress here.</p>
                    <Button onClick={onViewAppliedJobs} variant="outline" className="mt-4 premium-btn-secondary">
                      Browse jobs
                    </Button>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Links */}
            <section className="premium-card">
              <div className="premium-card-header">
                <h3 className="premium-card-title">Quick Links</h3>
              </div>
              <div className="p-4">
                <div className="space-y-1">
                  {[
                    { label: 'Interview Coach', icon: Brain, action: onAIInterviewCoach },
                    { label: 'Skills Development', icon: TrendingUp, action: onSkillsDevelopmentAI },
                  ].map((link) => (
                    <button
                      key={link.label}
                      onClick={link.action}
                      className="group flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-emerald-700"
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}




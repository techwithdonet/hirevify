import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle,
  ChevronRight,
  Crown,
  DollarSign,
  FileText,
  Lightbulb,
  LogOut,
  MapPin,
  MessageCircle,
  Rocket,
  Search,
  Send,
  Settings,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  User,
  Users,
  Zap,
  Bookmark,
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from './AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { HireVifyLogo } from './HireVifyLogo';
import { subscriptionsService } from '@/src/hirevify-app/services/subscriptionsService';
import { profilesService } from '@/src/hirevify-app/services/profilesService';
import { applicationsService, MIN_CANDIDATE_PROFILE_COMPLETENESS } from '@/src/hirevify-app/services/applicationsService';
import { portfolioService } from '@/src/hirevify-app/services/portfolioService';
import { savedJobsService } from '@/src/hirevify-app/services/savedJobsService';
import { jobsService } from '@/src/hirevify-app/services/jobsService';
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
  unreadMessages,
}: CandidateDashboardProps) {
  const { user } = useAuth();
  const { conversations: messageConversations } = useConversations();
  const { unreadCount: unreadNotificationsCount } = useNotifications();
  void onProjectChallengeVideo;
  void unreadNotifications;
  void unreadMessages;

  const totalUnreadMessages = messageConversations.reduce(
    (sum, conversation) => sum + (conversation.unreadCount || 0),
    0
  );

  const [subscription, setSubscription] = useState<any>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [publishedJobsCount, setPublishedJobsCount] = useState<number>(0);

  const checkProfileForJobSearch = () => {
    const completeness = Number(candidateProfile?.profile_completeness || 0);
    const hasResume = Boolean(candidateProfile?.resume_url);
    const isProfileComplete =
      Boolean(candidateProfile?.profile_completed) || completeness >= MIN_CANDIDATE_PROFILE_COMPLETENESS;

    if (!isProfileComplete || !hasResume) {
      const missing: string[] = [];
      if (!hasResume) missing.push('upload a CV');
      if (!isProfileComplete) missing.push(`complete all required profile fields (${completeness}% done)`);

      toast.error(
        `Please ${missing.join(' and ')} before finding jobs and applying.`,
        {
          action: {
            label: 'Complete Profile',
            onClick: onEditProfile,
          },
          duration: 8000,
        }
      );
      return false;
    }
    return true;
  };

  const handleSearchProjects = () => {
    if (checkProfileForJobSearch()) {
      onSearchProjects();
    }
  };

  useEffect(() => {
    const loadCandidateData = async () => {
      if (!user?.id) return;

      try {
        const subData = await subscriptionsService.getUserSubscription(user.id);
        setSubscription(subData.data || { tier: 'free', isActive: false });

        const profileData = await profilesService.getCandidateProfile(user.id);
        if (profileData.data) {
          setCandidateProfile(profileData.data);
        }

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        const appData = await applicationsService.getCandidateApplications(user.id, authUser?.id);
        if (appData.data) {
          setApplications(appData.data);
        }

        const portfolioData = await portfolioService.getUserPortfolio(user.id);
        if (portfolioData.data) {
          setPortfolio(portfolioData.data);
        }

        const savedData = await savedJobsService.getCandidateSavedJobs(user.id);
        if (savedData.data) {
          setSavedJobs(savedData.data);
        }

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

  const candidateName = user?.name?.split(' ')[0] || 'Candidate';
  const planName = subscription?.tier
    ? subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)
    : 'Free';
  const candidateProfileCompleteness = Number(candidateProfile?.profile_completeness || 0);
  const visibleProgress = Math.min(candidateProfileCompleteness, 100);
  const isCandidateProfileComplete =
    Boolean(candidateProfile?.profile_completed) ||
    candidateProfileCompleteness >= MIN_CANDIDATE_PROFILE_COMPLETENESS;

  const metrics = [
    { label: 'Applied', value: applications.length, icon: FileText, action: onViewAppliedJobs, tone: 'tone-mint' },
    { label: 'Portfolio', value: portfolio.length, icon: Award, action: onViewPortfolio, tone: 'tone-blue' },
    { label: 'Saved', value: savedJobs.length, icon: Bookmark, action: onViewSavedJobs, tone: 'tone-violet' },
    { label: 'Plan', value: planName, icon: Crown, action: subscription?.isActive ? undefined : onUpgrade, tone: 'tone-amber' },
  ];

  const workbenchActions = [
    { label: 'Find jobs', meta: `${publishedJobsCount} live roles`, icon: Search, action: handleSearchProjects, tone: 'tone-ink' },
    { label: 'Knowledge test', meta: 'Skill proof', icon: Award, action: onTakeKnowledgeAssessment, tone: 'tone-mint' },
    { label: 'Resume studio', meta: 'CV builder', icon: FileText, action: onBuildResume, tone: 'tone-blue' },
    { label: 'Portfolio', meta: 'Work samples', icon: Sparkles, action: onViewPortfolio, tone: 'tone-violet' },
    { label: 'Mock interview', meta: 'Practice run', icon: Send, action: onVideoInterview, tone: 'tone-coral' },
    { label: 'Interview coach', meta: 'Prep notes', icon: Brain, action: onAIInterviewCoach, tone: 'tone-amber' },
  ];

  const growthPaths = [
    { label: 'Experience Builder', meta: '1-2 week projects', icon: Target, action: onExperienceBuilder, tone: 'tone-mint' },
    { label: 'Micro-Internships', meta: '1-5 day projects', icon: Timer, action: onMicroInternships, tone: 'tone-blue' },
    { label: 'Mentorship', meta: 'Expert guidance', icon: Users, action: onMentorshipProgram, tone: 'tone-coral' },
    { label: 'Career Switch', meta: 'Structured track', icon: BookOpen, action: onCareerSwitcherTrack, tone: 'tone-violet' },
  ];

  const sideLinks = [
    { label: 'Applied jobs', icon: Briefcase, action: onViewAppliedJobs },
    { label: 'Saved jobs', icon: Bookmark, action: onViewSavedJobs },
    { label: 'Interviews', icon: User, action: onViewInterviews },
    { label: 'Skills lab', icon: TrendingUp, action: onSkillsDevelopmentAI },
    { label: 'Market pulse', icon: Lightbulb, action: onMarketIntelligence },
  ];

  return (
    <div className="candidate-workbench">
      <header className="candidate-workbench-header">
        <div className="candidate-workbench-header-inner">
          <div className="candidate-brand-lockup">
            <HireVifyLogo size="md" />
            <div>
              <p className="candidate-small-label">Candidate workspace</p>
              <h1>{candidateName}'s desk</h1>
            </div>
          </div>

          <div className="candidate-header-actions">
            {subscription?.isActive ? (
              <span className="candidate-plan-pill">
                <Crown className="h-4 w-4" />
                {planName}
              </span>
            ) : (
              <Button onClick={onUpgrade} className="candidate-upgrade-button">
                <Crown className="h-4 w-4" />
                Upgrade
              </Button>
            )}

            <div className="candidate-icon-cluster" aria-label="Workspace actions">
              <button type="button" onClick={onViewMessages} className="candidate-icon-button" aria-label="Messages">
                <MessageCircle className="h-5 w-5" />
                {totalUnreadMessages > 0 && (
                  <span>{totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}</span>
                )}
              </button>
              <button type="button" onClick={onViewNotifications} className="candidate-icon-button" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span>{unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}</span>
                )}
              </button>
              <button type="button" onClick={onViewSettings} className="candidate-icon-button" aria-label="Settings">
                <Settings className="h-5 w-5" />
              </button>
              <button type="button" onClick={onLogout} className="candidate-icon-button danger" aria-label="Log out">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="candidate-workbench-main">
        <section className="candidate-command-board">
          <div className="candidate-profile-story">
            <div className={cn('candidate-profile-mark', isCandidateProfileComplete ? 'is-ready' : 'is-open')}>
              {isCandidateProfileComplete ? <CheckCircle className="h-7 w-7" /> : <User className="h-7 w-7" />}
            </div>
            <div className="candidate-profile-copy">
              <div className="candidate-status-line">
                <span>{visibleProgress}% complete</span>
                <span>{isCandidateProfileComplete ? 'Visible to recruiters' : 'Hidden until complete'}</span>
              </div>
              <h2>{isCandidateProfileComplete ? 'Profile ready for recruiters' : 'Finish the required profile details'}</h2>
              <p>
                {isCandidateProfileComplete
                  ? 'Your profile can be discovered. Keep the details fresh before applying.'
                  : 'Complete the required fields and upload your CV before job matching opens.'}
              </p>
              <div className="candidate-meter" aria-label={`Profile completion ${visibleProgress}%`}>
                <div style={{ width: `${visibleProgress}%` }} />
              </div>
            </div>
            <button type="button" onClick={onEditProfile} className="candidate-profile-link">
              {isCandidateProfileComplete ? 'Review profile' : 'Complete profile'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="candidate-metric-strip">
            {metrics.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <span className={cn('candidate-tone-dot', item.tone)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <strong>{item.value}</strong>
                    <small>{item.label}</small>
                  </span>
                </>
              );

              return item.action ? (
                <button key={item.label} type="button" onClick={item.action} className="candidate-metric-item">
                  {content}
                </button>
              ) : (
                <div key={item.label} className="candidate-metric-item">
                  {content}
                </div>
              );
            })}
          </div>
        </section>

        <div className="candidate-workbench-layout">
          <div className="candidate-workbench-primary">
            <button type="button" onClick={handleSearchProjects} className="candidate-job-strip">
              <span className="candidate-job-icon">
                <Search className="h-6 w-6" />
              </span>
              <span className="candidate-job-copy">
                <span className="candidate-small-label">Open roles</span>
                <strong>Find your next opportunity</strong>
                <span>
                  <Briefcase className="h-4 w-4" />
                  {publishedJobsCount} live jobs
                  <MapPin className="h-4 w-4" />
                  Remote, hybrid, onsite
                  <DollarSign className="h-4 w-4" />
                  Clear budgets
                </span>
              </span>
              <span className="candidate-job-cta">
                Browse jobs
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>

            <section className="candidate-section">
              <div className="candidate-section-heading">
                <span>Workbench</span>
                <h2>Tools you actually use</h2>
              </div>
              <div className="candidate-action-grid">
                {workbenchActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button key={action.label} type="button" onClick={action.action} className="candidate-action-row">
                      <span className={cn('candidate-tone-dot', action.tone)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <strong>{action.label}</strong>
                        <small>{action.meta}</small>
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="candidate-section">
              <div className="candidate-section-heading">
                <span>Growth paths</span>
                <h2>Build proof, not just a profile</h2>
              </div>
              <div className="candidate-growth-list">
                {growthPaths.map((path) => {
                  const Icon = path.icon;
                  return (
                    <button key={path.label} type="button" onClick={path.action} className="candidate-growth-row">
                      <span className={cn('candidate-tone-dot', path.tone)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <strong>{path.label}</strong>
                        <small>{path.meta}</small>
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="candidate-workbench-rail">
            <section className="candidate-rail-panel candidate-plan-panel">
              <div className="candidate-plan-symbol">
                {subscription?.isActive ? <Crown className="h-5 w-5" /> : <Rocket className="h-5 w-5" />}
              </div>
              <div>
                <span className="candidate-small-label">{subscription?.isActive ? 'Current plan' : 'Upgrade path'}</span>
                <h3>{subscription?.isActive ? `${planName} is active` : 'Make the workspace sharper'}</h3>
                <p>{subscription?.isActive ? 'Premium tools are enabled.' : 'Unlock advanced preparation and matching tools.'}</p>
              </div>
              {!subscription?.isActive && (
                <button type="button" onClick={onUpgrade} className="candidate-rail-button">
                  Upgrade now
                  <Zap className="h-4 w-4" />
                </button>
              )}
            </section>

            <section className="candidate-rail-panel">
              <div className="candidate-rail-title">
                <h3>Recent applications</h3>
                <button type="button" onClick={onViewAppliedJobs}>
                  View all
                </button>
              </div>
              {applications.length > 0 ? (
                <div className="candidate-application-list">
                  {applications.slice(0, 3).map((app: any, index: number) => (
                    <button key={app.id || index} type="button" onClick={onViewAppliedJobs} className="candidate-application-row">
                      <span>
                        <strong>{app.job?.title || app.job_title || app.title || 'Application submitted'}</strong>
                        <small>Status: {app.status || 'applied'}</small>
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="candidate-empty-note">
                  <FileText className="h-5 w-5" />
                  <span>No applications yet</span>
                  <button type="button" onClick={handleSearchProjects}>Browse jobs</button>
                </div>
              )}
            </section>

            <section className="candidate-rail-panel">
              <div className="candidate-rail-title">
                <h3>Quick links</h3>
              </div>
              <div className="candidate-quick-list">
                {sideLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button key={link.label} type="button" onClick={link.action}>
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

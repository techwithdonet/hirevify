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
 Loader
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { HireVifyLogo } from './HireVifyLogo';
import { CandidateATSScanner } from './CandidateATSScanner';
import { subscriptionsService } from '@/src/hirevify-app/services/subscriptionsService';
import { profilesService } from '@/src/hirevify-app/services/profilesService';
import { applicationsService } from '@/src/hirevify-app/services/applicationsService';
import { portfolioService } from '@/src/hirevify-app/services/portfolioService';
import { savedJobsService } from '@/src/hirevify-app/services/savedJobsService';
import { usePremiumAccess } from '../utils/premium';
import { useConversations } from '../hooks/useConversations';
import { useNotifications } from '../hooks/useNotifications';
import { toast } from 'sonner';
import { LoadingState } from './layout/AppLayout';

interface CandidateDashboardProps {
 onBuildResume: () => void;
 onViewPortfolio: () => void;
 onTakeKnowledgeAssessment: () => void;
 onVideoInterview: () => void;
 onSearchProjects: () => void;
 onViewInterviews: () => void;
 onViewSettings: () => void;
 onViewMessages: () => void;
 onViewNotifications: () => void;
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
 onATSScanner: () => void;
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
 onViewMessages,
 onViewNotifications,
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
 onATSScanner,
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
 // unreadNotifications/unreadMessages props are no longer used directly —
 // real counts now come from useNotifications/useConversations below.
 void unreadNotifications;
 void unreadMessages;
 const [subscription, setSubscription] = useState<any>(null);
 const [candidateProfile, setCandidateProfile] = useState<any>(null);
 const [applications, setApplications] = useState<any[]>([]);
 const [portfolio, setPortfolio] = useState<any[]>([]);
 const [savedJobs, setSavedJobs] = useState<any[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [showATSDialog, setShowATSDialog] = useState(false);

 // Load all candidate data from Supabase
 useEffect(() => {
 const loadCandidateData = async () => {
 if (!user?.id) return;

 try {
 setIsLoading(true);

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

 // Load applications
 const appData = await applicationsService.getCandidateApplications(user.id);
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
 } catch (error) {
 console.error('Error loading candidate data:', error);
 toast.error('Failed to load dashboard data');
 } finally {
 setIsLoading(false);
 }
 };

 loadCandidateData();
 }, [user?.id]);

 const candidateProfileCompleteness = Number(candidateProfile?.profile_completeness || 0);
 const isCandidateProfileComplete =
 Boolean(candidateProfile?.profile_completed) || candidateProfileCompleteness >= 60;

 if (isLoading) {
 return (
 <div className="hv-candidate-shell">
 <LoadingState label="Loading your dashboard..." className="min-h-screen" />
 </div>
 );
 }

 return (
 <div className="hv-candidate-shell">
 {/* Header */}
 <header className="hv-candidate-header">
 <div className="hv-container">
 <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex min-w-0 items-center gap-3 sm:gap-4">
 <div className="shrink-0 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
 <HireVifyLogo size="md" />
 </div>

 <div className="min-w-0">
 <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
 Candidate workspace
 </div>
 <h1 className="truncate text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">
 Welcome, {user?.name?.split(' ')[0] || 'Candidate'}
 </h1>
 <p className="mt-1 text-sm text-slate-600">
 Manage resumes, assessments, projects, and interviews from one clean workspace.
 </p>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2 sm:justify-end">
 {subscription && subscription.isActive? (
 <Badge className="hidden rounded-full border border-emerald-200 bg-white px-4 py-2 font-semibold text-emerald-700 shadow-sm md:flex">
 <Crown className="mr-2 h-4 w-4 text-emerald-600" />
 {subscription.tier?.charAt(0).toUpperCase() + subscription.tier?.slice(1)} Plan
 </Badge>
 ): (
 <Button onClick={onUpgrade} className="hidden rounded-full bg-white px-5 font-semibold text-white shadow-sm hover:bg-slate-800 md:flex">
 <Crown className="mr-2 h-4 w-4" />
 Upgrade to Pro
 </Button>
 )}

 <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
 <Button variant="ghost" size="icon" onClick={onViewMessages} className="relative rounded-full text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
 <MessageCircle className="h-5 w-5" />
 {totalUnreadMessages > 0 && (
 <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-xs text-white">
 {totalUnreadMessages > 9? '9+': totalUnreadMessages}
 </Badge>
 )}
 </Button>

 <Button variant="ghost" size="icon" onClick={onViewNotifications} className="relative rounded-full text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
 <Bell className="h-5 w-5" />
 {unreadNotificationsCount > 0 && (
 <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-xs text-white">
 {unreadNotificationsCount > 9? '9+': unreadNotificationsCount}
 </Badge>
 )}
 </Button>

 <Button variant="ghost" size="icon" onClick={onViewSettings} className="rounded-full text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
 <Settings className="h-5 w-5" />
 </Button>

 <Button variant="ghost" size="icon" onClick={onLogout} className="rounded-full text-slate-600 hover:bg-red-50 hover:text-red-600">
 <LogOut className="h-5 w-5" />
 </Button>
 </div>
 </div>
 </div>
 </div>
 </header>

 <main className="hv-container py-6 sm:py-8 lg:py-10">
 {isLoading && (
 <div className="flex items-center justify-center py-24">
 <div className="flex flex-col items-center gap-4">
 <Loader className="h-12 w-12 animate-spin text-emerald-600" />
 <p className="text-slate-600">Loading your dashboard...</p>
 </div>
 </div>
 )}

 {!isLoading && (
 <>
 {/* Profile Completion Hero */}
 <section className="candidate-profile-hero mb-6 rounded-xl">
 <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.4fr_0.6fr] lg:p-8">
 <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
 <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isCandidateProfileComplete? 'bg-emerald-100 text-emerald-700': 'bg-amber-100 text-amber-700'}`}>
 {isCandidateProfileComplete? (
 <CheckCircle className="h-7 w-7" />
 ): (
 <User className="h-7 w-7" />
 )}
 </div>

 <div className="min-w-0 flex-1">
 <div className="mb-3 flex flex-wrap items-center gap-2">
 <Badge className={isCandidateProfileComplete? 'rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700': 'rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700'}>
 {candidateProfileCompleteness}% complete
 </Badge>
 <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
 Recruiter visibility
 </Badge>
 </div>

 <h2 className="text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
 {isCandidateProfileComplete? 'Your profile is ready': 'Complete your candidate profile'}
 </h2>

 <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
 {isCandidateProfileComplete? 'Recruiters can now discover your profile from candidate search. Keep it updated for better matches.': 'Add skills, experience, salary, work type, location, and portfolio details so recruiters can find you.'}
 </p>

 <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
 <div
 className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
 style={{ width: `${Math.min(candidateProfileCompleteness, 100)}%` }}
 />
 </div>
 </div>
 </div>

 <div className="relative flex flex-col justify-center rounded-lg border border-slate-200 bg-slate-50 p-5">
 <p className="text-sm font-semibold text-slate-950">Next best action</p>
 <p className="mt-1 text-sm leading-6 text-slate-600">
 {isCandidateProfileComplete? 'Review your latest details before applying to new projects.': 'Finish the missing fields to improve matching quality.'}
 </p>
 <Button onClick={onViewSettings} className="mt-4 w-full rounded-full bg-white text-white shadow-sm hover:bg-slate-800">
 {isCandidateProfileComplete? 'View / Edit Profile': 'Complete Profile'}
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </div>
 </div>
 </section>

 {/* Quick Stats */}
 <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
 <Card className="candidate-stat-card">
 <CardContent className="p-5">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="text-sm font-medium text-slate-500">Applications</p>
 <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950">{applications.length}</p>
 </div>
 <div className="candidate-stat-icon bg-emerald-50 text-emerald-700"> <FileText className="h-5 w-5" />
 </div>
 </div>
 </CardContent>
 </Card>

 <Card className="candidate-stat-card">
 <CardContent className="p-5">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="text-sm font-medium text-slate-500">Portfolio Items</p>
 <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950">{portfolio.length}</p>
 </div>
 <div className="candidate-stat-icon bg-blue-50 text-blue-700">
 <User className="h-5 w-5" />
 </div>
 </div>
 </CardContent>
 </Card>

 <Card className="candidate-stat-card">
 <CardContent className="p-5">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="text-sm font-medium text-slate-500">Saved Jobs</p>
 <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950">{savedJobs.length}</p>
 </div>
 <div className="candidate-stat-icon bg-violet-50 text-violet-700">
 <BookOpen className="h-5 w-5" />
 </div>
 </div>
 </CardContent>
 </Card>

 <Card className="candidate-stat-card">
 <CardContent className="p-5">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="text-sm font-medium text-slate-500">Subscription</p>
 <p className="mt-2 text-3xl font-bold capitalize tracking-[-0.04em] text-slate-950">{subscription?.tier || 'free'}</p>
 </div>
 <div className="candidate-stat-icon bg-amber-50 text-amber-700">
 <Crown className="h-5 w-5" />
 </div>
 </div>
 </CardContent>
 </Card>
 </section>

 {/* Main Grid */}
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
 {/* Left Column - Main Tools */}
 <div className="space-y-6">
 {/* Essential Tools */}
 <section className="candidate-panel">
 <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
 <div>
 <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Start here</p>
 <h2 className="mt-1 text-2xl font-bold tracking-[-0.035em] text-slate-950">Get Started</h2>
 </div>
 <p className="max-w-md text-sm text-slate-500">Build credibility, prepare better, and find matching opportunities.</p>
 </div>

 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 <button onClick={onTakeKnowledgeAssessment} className="candidate-action-card group">
 <div className="mb-5 flex items-start justify-between gap-4">
 <div className="candidate-action-icon bg-emerald-50 text-emerald-700">
 <Award className="h-6 w-6" />
 </div>
 <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
 </div>
 <h3 className="text-base font-bold text-slate-950">Knowledge Assessment</h3>
 <p className="mt-1 text-sm text-slate-500">Verify your skills</p>
 </button>

 <button onClick={onBuildResume} className="candidate-action-card group">
 <div className="mb-5 flex items-start justify-between gap-4">
 <div className="candidate-action-icon bg-blue-50 text-blue-700">
 <Brain className="h-6 w-6" />
 </div>
 <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
 </div>
 <h3 className="text-base font-bold text-slate-950">AI Resume Builder</h3>
 <p className="mt-1 text-sm text-slate-500">Create your resume</p>
 </button>

 <button onClick={onViewPortfolio} className="candidate-action-card group">
 <div className="mb-5 flex items-start justify-between gap-4">
 <div className="candidate-action-icon bg-violet-50 text-violet-700">
 <Sparkles className="h-6 w-6" />
 </div>
 <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
 </div>
 <h3 className="text-base font-bold text-slate-950">Portfolio</h3>
 <p className="mt-1 text-sm text-slate-500">Showcase your work</p>
 </button>

 <button onClick={onSearchProjects} className="candidate-action-card group">
 <div className="mb-5 flex items-start justify-between gap-4">
 <div className="candidate-action-icon bg-orange-50 text-orange-700">
 <Search className="h-6 w-6" />
 </div>
 <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
 </div>
 <h3 className="text-base font-bold text-slate-950">Find Projects</h3>
 <p className="mt-1 text-sm text-slate-500">Explore opportunities</p>
 </button>
 </div>
 </section>

 {/* Career Growth */}
 <section className="candidate-panel">
 <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
 <div>
 <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Growth plan</p>
 <h2 className="mt-1 text-2xl font-bold tracking-[-0.035em] text-slate-950">Career Growth Paths</h2>
 </div>
 <p className="max-w-md text-sm text-slate-500">Choose a guided path to build real experience.</p>
 </div>

 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 <button onClick={onExperienceBuilder} className="candidate-path-card group">
 <div className="candidate-path-icon bg-emerald-50 text-emerald-700">
 <Target className="h-5 w-5" />
 </div>
 <div className="min-w-0">
 <h4 className="font-bold text-slate-950">Experience Builder</h4>
 <p className="text-sm text-slate-500">1-2 week projects</p>
 </div>
 <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
 </button>

 <button onClick={onMicroInternships} className="candidate-path-card group">
 <div className="candidate-path-icon bg-blue-50 text-blue-700">
 <Timer className="h-5 w-5" />
 </div>
 <div className="min-w-0">
 <h4 className="font-bold text-slate-950">Micro-Internships</h4>
 <p className="text-sm text-slate-500">1-5 day projects</p>
 </div>
 <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
 </button>

 <button onClick={onMentorshipProgram} className="candidate-path-card group">
 <div className="candidate-path-icon bg-orange-50 text-orange-700">
 <Users className="h-5 w-5" />
 </div>
 <div className="min-w-0">
 <h4 className="font-bold text-slate-950">Mentorship</h4>
 <p className="text-sm text-slate-500">Expert guidance</p>
 </div>
 <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
 </button>

 <button onClick={onCareerSwitcherTrack} className="candidate-path-card group">
 <div className="candidate-path-icon bg-violet-50 text-violet-700">
 <BookOpen className="h-5 w-5" />
 </div>
 <div className="min-w-0">
 <h4 className="font-bold text-slate-950">Career Switch</h4>
 <p className="text-sm text-slate-500">Structured learning</p>
 </div>
 <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
 </button>
 </div>
 </section>
 </div>

 {/* Right Column - Sidebar */}
 <aside className="space-y-6">
 {!subscription?.isActive? (
 <section className="candidate-premium-card">
 <div className="relative">
 <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
 <Crown className="h-5 w-5" />
 </div>
 <h3 className="mt-4 text-center text-xl font-bold tracking-[-0.03em] text-white">Go Premium</h3>
 <p className="mt-2 text-center text-sm leading-6 text-emerald-50/80">Unlock advanced tools and features</p>
 <Button onClick={onUpgrade} className="mt-5 w-full rounded-full bg-white font-bold text-emerald-900 shadow-sm hover:bg-emerald-50">
 Upgrade Now
 </Button>
 </div>
 </section>
 ): (
 <section className="candidate-premium-card">
 <div className="relative text-center">
 <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
 <Crown className="h-5 w-5" />
 </div>
 <h3 className="mt-4 text-xl font-bold tracking-[-0.03em] text-white">{subscription?.tier?.charAt(0).toUpperCase() + subscription?.tier?.slice(1)} Plan</h3>
 <p className="mt-2 text-sm text-emerald-50/80">Premium features enabled</p>
 </div>
 </section>
 )}

 {/* Recent Activity */}
 <section className="candidate-panel p-5">
 <div className="mb-4 flex items-center justify-between">
 <h3 className="font-bold text-slate-950">Recent Applications</h3>
 <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-500">{applications.length}</Badge>
 </div>

 {applications.length > 0? (
 <div className="space-y-3">
 {applications.slice(0, 3).map((app: any, idx: number) => (
 <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50">
 <p className="line-clamp-1 text-sm font-bold text-slate-950">{app.job?.title || app.job_title || app.title || 'Application submitted'}</p>
 <p className="mt-1 text-xs font-medium capitalize text-slate-500">Status: {app.status || 'applied'}</p>
 </div>
 ))}
 </div>
 ): (
 <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
 <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
 <FileText className="h-6 w-6" />
 </div>
 <p className="mt-3 text-sm font-semibold text-slate-600">No applications yet</p>
 <p className="mt-1 text-xs text-slate-500">Apply to a project to see progress here.</p>
 </div>
 )}
 </section>

 {/* Quick Links */}
 <section className="candidate-panel p-5">
 <h3 className="mb-4 font-bold text-slate-950">Quick Links</h3>
 <div className="space-y-2">
 <button onClick={onATSScanner} className="candidate-quick-link group">
 <span>ATS Resume Scanner</span>
 <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
 </button>
 <button onClick={onAIInterviewCoach} className="candidate-quick-link group">
 <span>Interview Coach</span>
 <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
 </button>
 <button onClick={onSkillsDevelopmentAI} className="candidate-quick-link group">
 <span>Skills Development</span>
 <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
 </button>
 </div>
 </section>
 </aside>
 </div>
 </>
 )}
 </main>

 {/* ATS Scanner Dialog */}
 <CandidateATSScanner
 showUploadDialog={showATSDialog}
 setShowUploadDialog={setShowATSDialog}
 />
 </div>
 );
}


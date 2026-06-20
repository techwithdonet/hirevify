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
 BookOpen
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
 setPostedJobs(jobsData.data);
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
 if (growthAppData.error) {
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


 const openGrowthPostFlow = (type: 'experience_builder' | 'micro_internship' | 'mentorship' | 'career_switch') => {
 if (type === 'mentorship' || type === 'career_switch') {
 setComingSoonFeature(type === 'mentorship'? 'Mentorship': 'Career Switch');
 toast.info(`${type === 'mentorship'? 'Mentorship': 'Career Switch'} recruiter posting is coming soon.`);
 return;
 }

 if (typeof window!== 'undefined') {
 window.localStorage.setItem('hirevify_growth_post_type', type);
 }

 onViewProjects?.();
 };

 const recruiterProfileCompleteness = Number(recruiterProfile?.profile_completeness || 0);
 const isRecruiterProfileComplete =
 Boolean(recruiterProfile?.profile_completed) || recruiterProfileCompleteness >= 60;
 const totalApplicationCount = applicants.length + growthApplicants.length;
 const growthApplicationCountByType = (type: CareerGrowthType) =>
 growthApplicants.filter((application) => application.opportunity?.type === type).length;
 const latestApplicationLabel = (application: any) =>
 application?.candidate_profile?.full_name || application?.candidate_profile?.email || application?.candidate_name || application?.candidate_email || 'Candidate';
 const applicationSections = [
 {
 key: 'projects',
 title: 'Project Applications',
 subtitle: 'Job and project applications',
 count: applicants.length,
 icon: Briefcase,
 accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
 action: onViewATS,
 latest: applicants[0]? `${latestApplicationLabel(applicants[0])} - ${applicants[0]?.job?.title || applicants[0]?.job_title || 'Project'}`: 'No project applications yet',
 },
 {
 key: 'experience_builder',
 title: 'Experience Builder',
 subtitle: 'Portfolio sprint applicants',
 count: growthApplicationCountByType('experience_builder'),
 icon: Target,
 accent: 'border-blue-200 bg-blue-50 text-blue-700',
 action: () => openGrowthPostFlow('experience_builder'),
 latest: growthApplicants.find((application) => application.opportunity?.type === 'experience_builder')?.opportunity?.title || 'No experience applications yet',
 },
 {
 key: 'micro_internship',
 title: 'Micro-Internships',
 subtitle: 'Short assignment applicants',
 count: growthApplicationCountByType('micro_internship'),
 icon: Clock,
 accent: 'border-amber-200 bg-amber-50 text-amber-700',
 action: () => openGrowthPostFlow('micro_internship'),
 latest: growthApplicants.find((application) => application.opportunity?.type === 'micro_internship')?.opportunity?.title || 'No micro-internship applications yet',
 },
 {
 key: 'mentorship',
 title: 'Mentorship',
 subtitle: 'Mentor-led growth applicants',
 count: growthApplicationCountByType('mentorship'),
 icon: Users,
 accent: 'border-rose-200 bg-rose-50 text-rose-700',
 action: () => openGrowthPostFlow('mentorship'),
 latest: growthApplicants.find((application) => application.opportunity?.type === 'mentorship')?.opportunity?.title || 'No mentorship applications yet',
 },
 {
 key: 'career_switch',
 title: 'Career Switch',
 subtitle: 'Transition-track applicants',
 count: growthApplicationCountByType('career_switch'),
 icon: BookOpen,
 accent: 'border-violet-200 bg-violet-50 text-violet-700',
 action: () => openGrowthPostFlow('career_switch'),
 latest: growthApplicants.find((application) => application.opportunity?.type === 'career_switch')?.opportunity?.title || 'No career-switch applications yet',
 },
 ];
 const recentApplications = [
 ...applicants.slice(0, 3).map((application) => ({
 id: application.id,
 candidate: latestApplicationLabel(application),
 source: application.job?.title || application.job_title || 'Project',
 status: application.status || 'applied',
 category: 'Project',
 })),
 ...growthApplicants.slice(0, 3).map((application) => ({
 id: application.id,
 candidate: latestApplicationLabel(application),
 source: application.opportunity?.title || 'Career growth opportunity',
 status: application.status || 'applied',
 category: application.opportunity?.type === 'experience_builder'? 'Experience Builder': application.opportunity?.type === 'micro_internship'? 'Micro-Internship': application.opportunity?.type === 'mentorship'? 'Mentorship': 'Career Switch',
 })),
 ].slice(0, 5);
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
 <div className="hv-page-shell flex flex-col bg-[linear-gradient(135deg,#f0fdf4_0%,#eff6ff_42%,#fff7ed_100%)]">
 {/* Header */}
 <header className="border-b border-emerald-100 bg-white/90 shadow-sm backdrop-blur-xl">
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
 {subscription?.isActive? (
 <Badge className="hidden rounded-full border border-emerald-200 bg-emerald-100 px-4 py-2 font-semibold text-emerald-800 md:flex">
 <Crown className="w-4 h-4 mr-2 text-emerald-600" />
 {subscription.tier?.charAt(0).toUpperCase() + subscription.tier?.slice(1)} Plan
 </Badge>
 ): (
 <Button onClick={onUpgrade} className="hidden rounded-lg bg-emerald-600 px-5 font-semibold text-white shadow-sm hover:bg-emerald-700 md:flex">
 <Crown className="w-4 h-4 mr-2" />
 Upgrade to Pro
 </Button>
 )}
 
 <div className="flex items-center gap-1">
 <Button variant="ghost" size="icon" onClick={onViewNotifications} className="relative rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
 <Bell className="w-5 h-5 text-gray-600" />
 {unreadNotificationsCount > 0 && (
 <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
 {unreadNotificationsCount > 9? '9+': unreadNotificationsCount}
 </Badge>
 )}
 </Button>
 
 <Button variant="ghost" size="icon" onClick={onViewMessages} className="relative rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
 <MessageSquare className="w-5 h-5 text-gray-600" />
 {totalUnreadMessages > 0 && (
 <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
 {totalUnreadMessages > 9? '9+': totalUnreadMessages}
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
 <>
 <div className="mb-6 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
 <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
 <div className="border-b border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_55%,#eff6ff_100%)] p-5 sm:p-6 lg:border-b-0 lg:border-r">
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div className="flex items-start gap-4">
 <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${isRecruiterProfileComplete? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100': 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'}`}>
 {isRecruiterProfileComplete? <Award className="h-6 w-6" />: <User className="h-6 w-6" />}
 </div>
 <div>
 <div className="flex flex-wrap items-center gap-2">
 <h2 className="text-lg font-semibold text-slate-950">
 {isRecruiterProfileComplete? 'Company profile ready': 'Company profile needs attention'}
 </h2>
 <Badge className={isRecruiterProfileComplete? 'border border-emerald-200 bg-emerald-50 text-emerald-700': 'border border-amber-200 bg-amber-50 text-amber-700'}>
 {recruiterProfileCompleteness}% complete
 </Badge>
 </div>
 <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
 {isRecruiterProfileComplete? 'Candidates can trust your company details. Keep the profile current before posting new roles.': 'Add the core company details before inviting candidates into interviews.'}
 </p>
 </div>
 </div>
 <Button onClick={() => onViewSettings?.()} className="w-full rounded-lg bg-slate-950 text-white hover:bg-slate-800 sm:w-auto">
 {isRecruiterProfileComplete? 'Edit Profile': 'Complete Profile'}
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-2 divide-x divide-slate-200 sm:grid-cols-4 lg:grid-cols-2">
 {[
 { label: 'Active Projects', value: postedJobs.length, icon: FolderOpen, action: onViewProjects, tone: 'from-emerald-50 to-white text-emerald-700' },
 { label: 'Applications', value: totalApplicationCount, icon: Users, action: onViewATS, tone: 'from-blue-50 to-white text-blue-700' },
 { label: 'Interviews', value: stats?.interviewsScheduled || 0, icon: Calendar, action: onViewInterviews, tone: 'from-amber-50 to-white text-amber-700' },
 { label: 'Hire Rate', value: stats?.hireRate || 'N/A', icon: BarChart3, action: onViewAnalytics, tone: 'from-violet-50 to-white text-violet-700' },
 ].map((item) => {
 const Icon = item.icon;
 return (
 <button
 key={item.label}
 type="button"
 onClick={item.action}
 className={`min-h-[112px] border-b border-slate-200 bg-gradient-to-br ${item.tone} p-4 text-left transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`}
 >
 <div className="flex items-center justify-between gap-3">
 <p className="text-xs font-semibold uppercase text-slate-500">{item.label}</p>
 <Icon className="h-4 w-4" />
 </div>
 <p className="mt-4 text-3xl font-semibold tracking-normal text-slate-950">{item.value}</p>
 </button>
 );
 })}
 </div>
 </div>
 </div>

 <div className="mb-6 rounded-lg border border-emerald-100 bg-[linear-gradient(135deg,#064e3b_0%,#0369a1_100%)] p-5 text-white shadow-sm">
 <div className="mb-4 flex flex-col gap-1">
 <p className="text-xs font-semibold uppercase text-emerald-200">Project Actions</p>
 <h2 className="text-xl font-semibold text-white">Create and Source Candidates</h2>
 </div>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <Button onClick={() => onPostProject()} className="h-14 rounded-lg bg-white px-6 font-semibold text-slate-950 shadow-sm hover:bg-emerald-50">
 <Plus className="mr-2 h-5 w-5" />
 Post New Project
 </Button>
 <Button variant="outline" onClick={onSearchCandidates} className="h-14 rounded-lg border-white/40 bg-white/10 px-6 font-semibold text-white hover:bg-white/20">
 <Search className="mr-2 h-5 w-5" />
 Search Candidates
 </Button>
 </div>
 </div>

 <div className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm">
 <div className="border-b border-slate-200 p-5 sm:p-6">
 <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
 <div>
 <p className="text-xs font-semibold uppercase text-emerald-700">Applications</p>
 <h2 className="text-xl font-semibold text-slate-950">Applications</h2>
 </div>
 <p className="text-sm text-slate-500">Separated by source so project, micro-internship, and growth applicants do not mix together.</p>
 </div>
 </div>
 <div className="grid grid-cols-1 gap-3 bg-slate-100 p-3 md:grid-cols-2 xl:grid-cols-5">
 {applicationSections.map((section) => {
 const Icon = section.icon;
 return (
 <button
 key={section.key}
 type="button"
 onClick={section.action}
 className="group flex min-h-[190px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
 >
 <div>
 <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border ${section.accent}`}>
 <Icon className="h-5 w-5" />
 </div>
 <div className="flex items-start justify-between gap-3">
 <div>
 <h3 className="font-semibold text-slate-950">{section.title}</h3>
 <p className="mt-1 text-xs leading-5 text-slate-500">{section.subtitle}</p>
 </div>
 <span className="rounded-lg bg-slate-950 px-2.5 py-1 text-sm font-semibold text-white">{section.count}</span>
 </div>
 </div>
 <div className="mt-5">
 <p className="line-clamp-2 text-xs leading-5 text-slate-500">{section.latest}</p>
 <div className="mt-3 flex items-center text-xs font-semibold text-slate-700 group-hover:text-emerald-700">
 Review section
 <ChevronRight className="ml-1 h-4 w-4" />
 </div>
 </div>
 </button>
 );
 })}
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr]">
 <div className="space-y-6">
 <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
 <div className="mb-5 flex items-center justify-between gap-3">
 <h2 className="text-xl font-semibold text-slate-950">ATS Best Matches</h2>
 <Badge className="border border-slate-200 bg-slate-50 text-slate-700">Workspace</Badge>
 </div>
 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 {[
 { label: 'AI Matching', description: 'Smart candidate matching', icon: Brain, action: onViewAIMatchingDashboard, access: aiMatchingAccess, tone: 'text-emerald-700 bg-emerald-50' },
 { label: 'ATS Scanner', description: 'Resume screening tool', icon: Scan, action: onViewATSScanner, access: atsAccess, tone: 'text-blue-700 bg-blue-50' },
 { label: 'Assessments', description: 'Custom skills tests', icon: Award, action: onViewSkillsAssessment, access: assessmentsAccess, tone: 'text-violet-700 bg-violet-50' },
 { label: 'Analytics', description: 'Hiring insights', icon: BarChart3, action: onViewAnalytics, access: analyticsAccess, tone: 'text-amber-700 bg-amber-50' },
 ].map((tool) => {
 const Icon = tool.icon;
 return (
 <button key={tool.label} type="button" onClick={tool.action} className="group rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 hover:bg-white">
 <div className="mb-4 flex items-center justify-between">
 <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tool.tone}`}>
 <Icon className="h-5 w-5" />
 </span>
 {tool.access && <Badge className="border border-emerald-200 bg-emerald-50 text-xs text-emerald-700">PRO</Badge>}
 </div>
 <h3 className="font-semibold text-slate-950">{tool.label}</h3>
 <p className="mt-1 text-sm text-slate-600">{tool.description}</p>
 </button>
 );
 })}
 </div>
 </div>

 <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
 <h2 className="mb-5 text-xl font-semibold text-slate-950">Why Skills-First Hiring?</h2>
 <div className="grid gap-3 md:grid-cols-3">
 {[
 { title: 'Project-Based Evaluation', copy: 'See real work samples instead of just resumes', icon: Target },
 { title: 'AI-Powered Matching', copy: 'Advanced AI finds the perfect candidates automatically', icon: Zap },
 { title: 'Skills Assessments', copy: 'Create custom tests to validate technical skills', icon: Award },
 ].map((item) => {
 const Icon = item.icon;
 return (
 <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
 <Icon className="mb-3 h-5 w-5 text-emerald-700" />
 <h4 className="font-semibold text-slate-950">{item.title}</h4>
 <p className="mt-1 text-sm leading-6 text-slate-600">{item.copy}</p>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <div className="rounded-lg border border-blue-200 bg-white shadow-sm">
 <div className="p-5 pb-0">
 <div className="mb-4 flex items-center justify-between gap-3">
 <div>
 <p className="text-xs font-semibold uppercase text-blue-700">Messages</p>
 <h3 className="font-semibold text-slate-950">Recruiter Inbox</h3>
 </div>
 <Button variant="ghost" size="sm" onClick={onViewMessages} className="text-blue-700 hover:bg-blue-50">
 Open
 </Button>
 </div>
 </div>
 <div className="space-y-1">
 {messageConversations.length === 0? (
 <div className="p-5 text-center">
 <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300" />
 <p className="text-sm font-medium text-slate-900">No conversations yet</p>
 <p className="mt-1 text-xs text-slate-500">Candidate messages will appear here.</p>
 </div>
 ): (
 messageConversations.slice(0, 5).map((conversation) => (
 <button
 key={conversation.otherUser.id}
 type="button"
 onClick={onViewMessages}
 className="flex w-full items-center gap-3 border-t border-slate-100 p-3 text-left transition hover:bg-blue-50"
 >
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
 {(conversation.otherUser.name || 'U').slice(0, 1).toUpperCase()}
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center justify-between gap-2">
 <p className="truncate text-sm font-semibold text-slate-950">{conversation.otherUser.name || 'User'}</p>
 <span className="text-xs text-slate-400">{conversation.lastMessage ? formatMessageTime(conversation.lastMessage.createdAt) : ''}</span>
 </div>
 <p className="truncate text-xs text-slate-500">{conversation.lastMessage ? conversation.lastMessage.message : 'No messages yet'}</p>
 </div>
 {conversation.unreadCount > 0 && (
 <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{conversation.unreadCount}</span>
 )}
 </button>
 ))
 )}
 </div>
 </div>

 <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
 <h3 className="mb-4 font-semibold text-slate-950">Recent Applications</h3>
 {recentApplications.length > 0? (
 <div className="space-y-3">
 {recentApplications.map((application) => (
 <div key={`${application.category}-${application.id}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
 <div className="flex items-center justify-between gap-3">
 <p className="line-clamp-1 text-sm font-semibold text-slate-950">{application.candidate}</p>
 <Badge className="border border-slate-200 bg-white text-xs text-slate-600">{application.category}</Badge>
 </div>
 <p className="mt-1 line-clamp-1 text-xs text-slate-500">{application.source}</p>
 <p className="mt-2 text-xs font-medium text-slate-600">Status: {application.status}</p>
 </div>
 ))}
 </div>
 ): (
 <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
 <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
 <p className="text-sm text-slate-500">No applications yet</p>
 </div>
 )}
 </div>

 </div>
 </div>
 </>
 </main>
 </div>
 );
}

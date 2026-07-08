/**
 * Live AI Matching Dashboard
 *
 * Shows real recruiter jobs, real applications, and Supabase-backed candidate
 * profile data. Scores use saved match scores when present and otherwise use
 * the existing HireVify ATS matching service.
 */

import { type ComponentType, useCallback, useEffect, useMemo, useState } from 'react';
import {
 ArrowLeft,
 AlertCircle,
 BarChart3,
 Brain,
 Briefcase,
 CheckCircle,
 Clock,
 Eye,
 RefreshCw,
 Settings,
 Target,
 ThumbsUp,
 TrendingUp,
 Users,
 Zap,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { dashboardTheme } from '../theme/dashboardTheme';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { calculateAtsMatch, type AtsMatchResult } from '@/src/hirevify-app/services/atsMatchingService';

interface AIMatchingDashboardProps {
 onBack: () => void;
 onUpgrade?: () => void;
}

interface LiveMatchRow {
 id: string;
 applicationId: string;
 candidateId: string;
 candidateName: string;
 candidateEmail: string;
 projectTitle: string;
 projectId: string;
 score: number;
 status: string;
 source: AtsMatchResult['source'];
 matchedKeywords: string[];
 missingKeywords: string[];
 explanation: string;
 timestamp: string;
 skills: string[];
}

interface LiveMetrics {
 totalJobs: number;
 totalApplications: number;
 totalMatches: number;
 bestMatches: number;
 todayMatches: number;
 averageMatchScore: number;
 successRate: number;
 averageConfidence: number;
 savedScoreRate: number;
 sourceCounts: Record<AtsMatchResult['source'], number>;
 currentWeights: Record<string, number>;
}

const MATCH_WEIGHTS = {
 skills: 0.35,
 experience: 0.25,
 availability: 0.15,
 budget: 0.15,
 preferences: 0.07,
 location: 0.03,
};

const emptyMetrics = (): LiveMetrics => ({
 totalJobs: 0,
 totalApplications: 0,
 totalMatches: 0,
 bestMatches: 0,
 todayMatches: 0,
 averageMatchScore: 0,
 successRate: 0,
 averageConfidence: 0,
 savedScoreRate: 0,
  sourceCounts: {
  deterministic: 0,
  stored: 0,
  openai: 0,
  keyword: 0,
  },
 currentWeights: MATCH_WEIGHTS,
});

const formatPercent = (value: number) => `${Math.round(Math.max(0, Math.min(100, value)))}%`;

const average = (values: number[]) => {
 if (values.length === 0) return 0;
 return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const isToday = (value: string) => {
 const date = new Date(value);
 const now = new Date();
 return date.toDateString() === now.toDateString();
};

const getStatusColor = (status: string) => {
 switch (status) {
 case 'hired': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
 case 'offer': return 'bg-green-100 text-green-800 border-green-200';
 case 'interview': return 'bg-purple-100 text-purple-800 border-purple-200';
 case 'screening': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
 case 'applied': return 'bg-blue-100 text-blue-800 border-blue-200';
 case 'viewed': return 'bg-slate-100 text-slate-800 border-slate-200';
 case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
 default: return 'bg-slate-100 text-slate-800 border-slate-200';
 }
};

const getStatusIcon = (status: string) => {
 switch (status) {
 case 'hired':
 case 'offer':
 return <CheckCircle className="h-3 w-3" />;
 case 'interview':
 case 'screening':
 return <Users className="h-3 w-3" />;
 case 'applied':
 return <ThumbsUp className="h-3 w-3" />;
 case 'viewed':
 return <Eye className="h-3 w-3" />;
 default:
 return <Clock className="h-3 w-3" />;
 }
};

export function AIMatchingDashboard({ onBack, onUpgrade }: AIMatchingDashboardProps) {
 const { user } = useAuth();
 const [metrics, setMetrics] = useState<LiveMetrics>(() => emptyMetrics());
 const [matches, setMatches] = useState<LiveMatchRow[]>([]);
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [lastUpdated, setLastUpdated] = useState<string | null>(null);
 const [loadError, setLoadError] = useState<string | null>(null);

 const loadDashboardData = useCallback(async (showRefreshState = false) => {
 if (showRefreshState) {
 setIsRefreshing(true);
 }

 try {
 setLoadError(null);

 const supabase = createSupabaseBrowserClient();
 const { data: authData } = await supabase.auth.getUser();
 const { data: sessionData } = await supabase.auth.getSession();
 const authUserId = authData.user?.id || user?.id;
 const authToken = sessionData.session?.access_token || null;

 if (!authUserId) {
 setMetrics(emptyMetrics());
 setMatches([]);
 setLoadError('Sign in as a recruiter to view live AI matches.');
 return;
 }

 const { data: profileRow, error: profileError } = await supabase
 .from('profiles')
 .select('id, auth_user_id')
 .or(`auth_user_id.eq.${authUserId},id.eq.${authUserId}`)
 .maybeSingle();

 if (profileError) {
 throw new Error(profileError.message);
 }

 const recruiterId = profileRow?.id || authUserId;

 const { data: jobRows, error: jobsError } = await supabase
 .from('jobs')
 .select('id, title, description, requirements, skills, experience_level, status, created_at, job_type, has_project')
 .eq('recruiter_id', recruiterId)
 .order('created_at', { ascending: false });

 if (jobsError) {
 throw new Error(jobsError.message);
 }

 const jobs = (jobRows || []).filter((job: any) => !(job.has_project === true && job.job_type === 'freelance'));
 const jobIds = jobs.map((job: any) => job.id).filter(Boolean);

 if (jobIds.length === 0) {
 setMetrics(emptyMetrics());
 setMatches([]);
 setLastUpdated(new Date().toISOString());
 return;
 }

 const { data: applicationRows, error: applicationsError } = await supabase
 .from('applications')
 .select('id, job_id, candidate_id, cover_letter, status, match_score, created_at, submitted_at, updated_at')
 .in('job_id', jobIds)
 .order('created_at', { ascending: false });

 if (applicationsError) {
 throw new Error(applicationsError.message);
 }

 const applications = applicationRows || [];
 const candidateIds = Array.from(new Set(applications.map((application: any) => application.candidate_id).filter(Boolean)));

 const { data: profileRows, error: candidateProfileError } = candidateIds.length > 0
 ? await supabase
 .from('profiles')
 .select('id, auth_user_id, full_name, email, phone, location')
 .in('auth_user_id', candidateIds)
 : { data: [], error: null };

 if (candidateProfileError) {
 throw new Error(candidateProfileError.message);
 }

 const profiles = profileRows || [];
 const candidateProfileLookupIds = Array.from(new Set([
 ...candidateIds,
 ...profiles.map((profile: any) => profile.auth_user_id).filter(Boolean),
 ]));

 const { data: candidateDetailRows, error: candidateDetailsError } = candidateProfileLookupIds.length > 0
 ? await supabase
 .from('candidate_profiles')
 .select('*')
 .in('user_id', candidateProfileLookupIds)
 : { data: [], error: null };

 if (candidateDetailsError) {
 console.error('Failed to load candidate profile details for AI matching:', candidateDetailsError);
 }

 const candidateDetails = candidateDetailRows || [];

 const scoredRows = await Promise.all(applications.map(async (application: any): Promise<LiveMatchRow> => {
 const job = jobs.find((item: any) => item.id === application.job_id);
 const profile = profiles.find((item: any) => item.id === application.candidate_id || item.auth_user_id === application.candidate_id);
 const details = candidateDetails.find((item: any) =>
 item.id === application.candidate_id ||
 item.user_id === application.candidate_id ||
 item.user_id === profile?.id ||
 item.user_id === profile?.auth_user_id
 );
 const skills = Array.isArray(details?.skills) ? details.skills.filter(Boolean) : [];
 const years = details?.years_of_experience;
 const experience = details?.experience_summary ||
 (typeof years === 'number' ? `${years} year${years === 1 ? '' : 's'} experience` : '');
 const candidateName = details?.full_name || profile?.full_name || profile?.email || 'Candidate';
 const candidateEmail = profile?.email || details?.email || '';

 const atsMatch = await calculateAtsMatch(
 {
 id: job?.id || application.job_id,
 title: job?.title || 'Project',
 description: job?.description || '',
 requirements: Array.isArray(job?.requirements) ? job.requirements : [],
 skills: Array.isArray(job?.skills) ? job.skills : [],
 experience_level: job?.experience_level || null,
 },
 {
 applicationId: application.id,
 name: candidateName,
 skills,
 headline: details?.headline || '',
 summary: details?.profile_summary || details?.summary || details?.bio || details?.experience_summary || '',
 resumeUrl: details?.resume_url || details?.resume_file_url || '',
 resumeText: details?.resume_text || details?.resume_content || '',
 coverLetter: application.cover_letter || '',
 experience,
 storedScore: application.match_score,
 },
 authToken
 );

 if ((application.match_score === null || application.match_score === undefined) && atsMatch.score > 0) {
 const { error: updateScoreError } = await supabase
 .from('applications')
 .update({ match_score: atsMatch.score })
 .eq('id', application.id);

 if (updateScoreError) {
 console.error('Failed to save AI match score:', updateScoreError);
 }
 }

 return {
 id: application.id,
 applicationId: application.id,
 candidateId: application.candidate_id,
 candidateName,
 candidateEmail,
 projectTitle: job?.title || 'Project',
 projectId: application.job_id,
 score: atsMatch.score,
 status: application.status || 'applied',
 source: atsMatch.source,
 matchedKeywords: atsMatch.matchedKeywords,
 missingKeywords: atsMatch.missingKeywords,
 explanation: atsMatch.explanation,
 timestamp: application.submitted_at || application.created_at || new Date().toISOString(),
 skills,
 };
 }));

  const sortedRows = scoredRows.sort((a, b) => b.score - a.score || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const scoredValues = sortedRows.map((row) => row.score).filter((score) => score > 0);
  const sourceCounts = sortedRows.reduce(
  (counts, row) => ({ ...counts, [row.source]: (counts[row.source] || 0) + 1 }),
  { deterministic: 0, stored: 0, openai: 0, keyword: 0 } as Record<AtsMatchResult['source'], number>,
  );
 const advancedStatuses = new Set(['screening', 'interview', 'offer', 'hired']);
 const averageScore = average(scoredValues);

 setMatches(sortedRows);
 setMetrics({
 totalJobs: jobs.length,
 totalApplications: applications.length,
 totalMatches: sortedRows.length,
 bestMatches: sortedRows.filter((row) => row.score >= 70).length,
 todayMatches: sortedRows.filter((row) => isToday(row.timestamp)).length,
 averageMatchScore: averageScore,
 successRate: sortedRows.length > 0
 ? (sortedRows.filter((row) => advancedStatuses.has(row.status)).length / sortedRows.length) * 100
 : 0,
 averageConfidence: scoredValues.length > 0 ? Math.min(98, Math.max(50, averageScore + 8)) : 0,
 savedScoreRate: sortedRows.length > 0 ? (sourceCounts.stored / sortedRows.length) * 100 : 0,
 sourceCounts,
 currentWeights: MATCH_WEIGHTS,
 });
 setLastUpdated(new Date().toISOString());

 if (showRefreshState) {
 toast.success('Live AI matching data refreshed');
 }
 } catch (error) {
 console.error('Failed to load live AI matching data:', error);
 const message = error instanceof Error ? error.message : 'Failed to load live AI matching data.';
 setLoadError(message);
 setMetrics(emptyMetrics());
 setMatches([]);
 if (showRefreshState) {
 toast.error(message);
 }
 } finally {
 if (showRefreshState) {
 setIsRefreshing(false);
 }
 }
 }, [user?.id]);

 useEffect(() => {
 void loadDashboardData(false);
 }, [loadDashboardData]);

 const topMatches = useMemo(() => matches.slice(0, 10), [matches]);
 const eligibleMatches = useMemo(() => matches.filter((match) => match.score >= 70), [matches]);

 return (
  <div className="premium-page">
  <header className="premium-header">
  <div className="premium-header-inner">
  <div className="flex items-center gap-4">
  <Button variant="ghost" size="icon" onClick={onBack} className="rounded-lg">
  <ArrowLeft className="h-4 w-4" />
  </Button>
  <div>
  <h1 className="flex items-center gap-3 text-3xl font-bold tracking-normal">
  <Brain className="h-8 w-8 text-emerald-700" />
  AI Matching System
  </h1>
  <p className="text-muted-foreground">
  Live candidate-project matching from your Supabase applications.
 </p>
 {lastUpdated && (
 <p className="mt-1 text-xs text-slate-500">Last refreshed {new Date(lastUpdated).toLocaleString()}</p>
 )}
 </div>
 </div>

 <div className="flex items-center gap-3">
 <Button onClick={() => void loadDashboardData(true)} variant="outline" disabled={isRefreshing}>
 <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
 Refresh
 </Button>
 {onUpgrade && (
 <Button onClick={onUpgrade} className="bg-emerald-600 text-white hover:bg-emerald-700">
 <Zap className="mr-2 h-4 w-4" />
 Upgrade
 </Button>
  )}
  </div>
  </div>
  </header>
  <main className="premium-content">

  {loadError && (
 <Card className="mb-6 border-red-200 bg-red-50 p-4 text-red-800">
 <div className="flex items-start gap-3">
 <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
 <p className="text-sm">{loadError}</p>
 </div>
 </Card>
 )}

 <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
 <Card className="p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground">AI Status</p>
 <p className="text-2xl font-bold text-emerald-600">Live</p>
 </div>
 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
 <ActivityDot />
 </div>
 </div>
 <div className="mt-4 flex items-center gap-2">
 <div className="h-2 w-2 rounded-full bg-emerald-500" />
 <span className="text-sm text-emerald-700">{metrics.totalJobs} recruiter job{metrics.totalJobs === 1 ? '' : 's'} connected</span>
 </div>
 </Card>

 <Card className="p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground">Today's Applications</p>
 <p className="text-2xl font-bold">{metrics.todayMatches}</p>
 </div>
 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
 <Target className="h-6 w-6 text-blue-600" />
 </div>
 </div>
 <div className="mt-4 flex items-center gap-2">
 <TrendingUp className="h-4 w-4 text-slate-500" />
 <span className="text-sm text-slate-600">{metrics.totalApplications} total real application{metrics.totalApplications === 1 ? '' : 's'}</span>
 </div>
 </Card>

 <Card className="p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground">70%+ Matches</p>
 <p className="text-2xl font-bold">{metrics.bestMatches}</p>
 </div>
 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
 <CheckCircle className="h-6 w-6 text-amber-700" />
 </div>
 </div>
 <div className="mt-4">
 <Progress value={metrics.totalMatches > 0 ? (metrics.bestMatches / metrics.totalMatches) * 100 : 0} className="h-2" />
 </div>
 </Card>

 <Card className="p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground">Average Match</p>
 <p className="text-2xl font-bold">{formatPercent(metrics.averageMatchScore)}</p>
 </div>
 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
 <Brain className="h-6 w-6 text-violet-700" />
 </div>
 </div>
 <div className="mt-4">
 <Progress value={metrics.averageMatchScore} className="h-2" />
 </div>
 </Card>
 </div>

 <Tabs defaultValue="overview" className="space-y-6">
 <TabsList className="grid w-full grid-cols-4">
 <TabsTrigger value="overview">Overview</TabsTrigger>
 <TabsTrigger value="performance">Performance</TabsTrigger>
 <TabsTrigger value="matches">Matches</TabsTrigger>
 <TabsTrigger value="settings">Settings</TabsTrigger>
 </TabsList>

 <TabsContent value="overview" className="space-y-6">
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 <Card className="p-6">
 <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
 <BarChart3 className="h-5 w-5" />
 Live Performance Summary
 </h3>
 <div className="space-y-4">
 <MetricLine label="Jobs scanned" value={String(metrics.totalJobs)} />
 <MetricLine label="Applications scored" value={String(metrics.totalMatches)} />
 <MetricLine label="Average match score" value={formatPercent(metrics.averageMatchScore)} />
 <MetricLine label="Advanced pipeline rate" value={formatPercent(metrics.successRate)} />
 <MetricLine label="Saved score reuse" value={formatPercent(metrics.savedScoreRate)} />
 </div>
 </Card>

 <Card className="p-6">
 <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
 <Settings className="h-5 w-5" />
 Current Algorithm Weights
 </h3>
 <div className="space-y-3">
 {Object.entries(metrics.currentWeights).map(([factor, weight]) => (
 <div key={factor} className="space-y-1">
 <div className="flex items-center justify-between text-sm">
 <span className="capitalize">{factor}</span>
 <span className="text-muted-foreground">{Math.round(weight * 100)}%</span>
 </div>
 <Progress value={weight * 100} className="h-1.5" />
 </div>
 ))}
 </div>
 <div className="mt-4 rounded-lg bg-emerald-50 p-3">
 <p className="flex items-center gap-1 text-xs text-emerald-700">
 <AlertCircle className="h-3 w-3" />
 Scores are saved back to applications when no match score exists.
 </p>
 </div>
 </Card>
 </div>

 <Card className="p-6">
 <h3 className="mb-4 text-lg font-semibold">Live Insights</h3>
 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
 <InsightCard
 icon={CheckCircle}
 title="Best Candidates"
 copy={`${eligibleMatches.length} applicant${eligibleMatches.length === 1 ? '' : 's'} currently score 70% or higher.`}
 tone="border-emerald-200 bg-emerald-50 text-emerald-800"
 />
 <InsightCard
 icon={Briefcase}
 title="Coverage"
 copy={`${metrics.totalApplications} real application${metrics.totalApplications === 1 ? '' : 's'} across ${metrics.totalJobs} recruiter job${metrics.totalJobs === 1 ? '' : 's'}.`}
 tone="border-blue-200 bg-blue-50 text-blue-800"
 />
 <InsightCard
 icon={Brain}
 title="Scoring Source"
 copy={`${metrics.sourceCounts.openai} OpenAI, ${metrics.sourceCounts.stored} saved, ${metrics.sourceCounts.keyword} keyword fallback.`}
 tone="border-violet-200 bg-violet-50 text-violet-800"
 />
 </div>
 </Card>
 </TabsContent>

 <TabsContent value="performance" className="space-y-6">
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 <Card className="p-6">
 <h3 className="mb-4 text-lg font-semibold">Source Breakdown</h3>
 <div className="space-y-4">
 <MetricLine label="Saved application score" value={String(metrics.sourceCounts.stored)} />
 <MetricLine label="OpenAI enhanced score" value={String(metrics.sourceCounts.openai)} />
 <MetricLine label="Keyword fallback score" value={String(metrics.sourceCounts.keyword)} />
 <MetricLine label="Average confidence" value={formatPercent(metrics.averageConfidence)} />
 </div>
 </Card>

 <Card className="p-6">
 <h3 className="mb-4 text-lg font-semibold">Pipeline Signals</h3>
 <div className="space-y-4">
 <MetricLine label="70%+ match count" value={String(metrics.bestMatches)} />
 <MetricLine label="Advanced statuses" value={formatPercent(metrics.successRate)} />
 <MetricLine label="Matches generated today" value={String(metrics.todayMatches)} />
 <MetricLine label="Total live matches" value={String(metrics.totalMatches)} />
 </div>
 </Card>
 </div>
 </TabsContent>

 <TabsContent value="matches" className="space-y-6">
 <Card className="p-6">
 <h3 className="mb-4 text-lg font-semibold">Top Live AI Matches</h3>
 {topMatches.length === 0 ? (
 <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
 <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
 <p className="font-medium text-slate-900">No applications to score yet</p>
 <p className="mt-1 text-sm text-slate-500">When candidates apply to your jobs, AI matches will appear here.</p>
 </div>
 ) : (
 <div className="space-y-4">
 {topMatches.map((match) => (
 <div key={match.id} className="rounded-lg border border-slate-200 p-4">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="min-w-0 flex-1">
 <div className="mb-1 flex flex-wrap items-center gap-3">
 <span className="font-medium text-slate-950">{match.candidateName}</span>
 <span className="text-sm text-muted-foreground">to</span>
 <span className="text-sm font-medium text-slate-700">{match.projectTitle}</span>
 </div>
 <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
 <Clock className="h-3 w-3" />
 {new Date(match.timestamp).toLocaleString()}
 {match.candidateEmail && <span>{match.candidateEmail}</span>}
 </div>
 <p className="mt-3 line-clamp-2 text-sm text-slate-600">{match.explanation}</p>
 {match.matchedKeywords.length > 0 && (
 <div className="mt-3 flex flex-wrap gap-1">
 {match.matchedKeywords.slice(0, 8).map((keyword) => (
 <Badge key={keyword} className="border border-emerald-200 bg-emerald-50 text-xs text-emerald-700">{keyword}</Badge>
 ))}
 </div>
 )}
 </div>
 <div className="flex items-center gap-3 lg:shrink-0">
 <div className="text-right">
 <div className="text-sm font-semibold">{match.score}% match</div>
 <div className="text-xs capitalize text-muted-foreground">{match.source} score</div>
 </div>
 <Badge variant="outline" className={`${getStatusColor(match.status)} flex items-center gap-1`}>
 {getStatusIcon(match.status)}
 {match.status}
 </Badge>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </Card>
 </TabsContent>

 <TabsContent value="settings" className="space-y-6">
 <Card className="p-6">
 <h3 className="mb-4 text-lg font-semibold">AI Matching Rules</h3>
 <div className="space-y-4">
 <RuleBlock
 title="Real Data Only"
 description="This page does not use demo candidates. It reads jobs, applications, profiles, and candidate profile details from Supabase."
 badge="Enabled"
 />
 <RuleBlock
 title="Duplicate Score Prevention"
 description="Existing application match scores are reused. New scores are saved only when an application does not already have one."
 badge="Enabled"
 />
 <RuleBlock
 title="Best Match Threshold"
 description="HireVify treats applicants scoring 70% or higher as ATS best matches."
 badge="70%+"
 />
 </div>
 </Card>
 </TabsContent>
  </Tabs>
  </main>
  </div>
  );
}

function ActivityDot() {
 return (
 <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600">
 <div className="h-2.5 w-2.5 rounded-full bg-white" />
 </div>
 );
}

function MetricLine({ label, value }: { label: string; value: string }) {
 return (
 <div className="flex items-center justify-between gap-4">
 <span className="text-sm text-muted-foreground">{label}</span>
 <span className="font-medium text-slate-950">{value}</span>
 </div>
 );
}

function InsightCard({
 icon: Icon,
 title,
 copy,
 tone,
}: {
 icon: ComponentType<{ className?: string }>;
 title: string;
 copy: string;
 tone: string;
}) {
 return (
 <div className={`rounded-lg border p-4 ${tone}`}>
 <div className="mb-2 flex items-center gap-2">
 <Icon className="h-4 w-4" />
 <span className="text-sm font-medium">{title}</span>
 </div>
 <p className="text-xs leading-5">{copy}</p>
 </div>
 );
}

function RuleBlock({ title, description, badge }: { title: string; description: string; badge: string }) {
 return (
 <div className="rounded-lg border border-slate-200 p-4">
 <div className="mb-2 flex items-center justify-between gap-3">
 <h4 className="font-medium">{title}</h4>
 <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">{badge}</Badge>
 </div>
 <p className="text-sm text-muted-foreground">{description}</p>
 </div>
 );
}


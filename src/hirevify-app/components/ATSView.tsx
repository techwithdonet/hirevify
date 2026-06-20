import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import {
 ArrowLeft,
 User,
 Mail,
 Calendar,
 FileText,
 Video,
 Star,
 MessageSquare,
 Crown,
 TrendingUp,
 Award,
 Target,
 Search,
 Briefcase,
 Clock,
 BookOpen,
 Users
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ProfessionalATSDashboard from './ProfessionalATSDashboard';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { careerGrowthService, type CareerGrowthType } from '@/src/hirevify-app/services/careerGrowthService';
import { calculateAtsMatch, type AtsMatchResult } from '@/src/hirevify-app/services/atsMatchingService';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { openOrCreateConversationAndNavigate } from '../utils/openConversation';
import { dashboardTheme } from '../theme/dashboardTheme';

type CandidateStatus = 'applied' | 'reviewing' | 'screening' | 'shortlisted' | 'accepted' | 'assigned' | 'in_progress' | 'completed' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
type ApplicationCategory = 'project' | CareerGrowthType;

interface Candidate {
 id: string;
 applicationId: string;
 candidateId: string;
 name: string;
 email: string;
 projectId: string;
 projectTitle: string;
 status: CandidateStatus;
 matchScore: number;
 appliedDate: string;
 sourceType: ApplicationCategory;
 sourceLabel: string;
 skills: string[];
 experience: string;
 location: string;
 coverLetter?: string;
 resumeUrl?: string;
 atsMatchedKeywords: string[];
 atsMissingKeywords: string[];
 atsExplanation: string;
 scoreSource: AtsMatchResult['source'];
}

interface ATSViewProps {
 onBack: () => void;
 onStartInterview: () => void;
 onViewMessages: (conversationId?: string) => void;
 selectedCandidate?: any;
}

export function ATSView({ onBack, onStartInterview, onViewMessages, selectedCandidate }: ATSViewProps) {
 const { user } = useAuth();
 const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
 const [notes, setNotes] = useState('');
 const [statusFilter, setStatusFilter] = useState<string>('all');
 const [categoryFilter, setCategoryFilter] = useState<'all' | ApplicationCategory>('all');
 const [searchTerm, setSearchTerm] = useState('');
 const [candidates, setCandidates] = useState<Candidate[]>([]);

 const selectedJobId = selectedCandidate?.projectId || selectedCandidate?.job_id || selectedCandidate?.id || null;
 const selectedJobTitle = selectedCandidate?.projectTitle || selectedCandidate?.title || selectedCandidate?.job_title || '';
 const isBestMatchScanner = Boolean(selectedCandidate?.atsScannerMode);

 const loadApplications = async () => {
 try {
 const supabase = createSupabaseBrowserClient();
 const { data: authData, error: authError } = await supabase.auth.getUser();

 if (authError ||!authData?.user?.id) {
 throw new Error('No active Supabase login found. Please login again.');
 }

 const { data: recruiterProfile, error: profileError } = await supabase.from('profiles').select('id, role').eq('auth_user_id', authData.user.id).maybeSingle();

 if (profileError) {
 throw new Error(profileError.message);
 }

 if (!recruiterProfile?.id) {
 throw new Error('Recruiter profile row not found.');
 }

 let jobsQuery = supabase.from('jobs').select('id, title, description, requirements, skills, experience_level').eq('recruiter_id', recruiterProfile.id);

 if (selectedJobId) {
 jobsQuery = jobsQuery.eq('id', selectedJobId);
 }

 const { data: jobs, error: jobsError } = await jobsQuery;

 if (jobsError) {
 throw new Error(jobsError.message);
 }

 const jobRows = jobs || [];
 const jobIds = jobRows.map((job: any) => job.id);
 let mappedProjectApplications: Candidate[] = [];

 if (jobIds.length > 0) {
 const { data: sessionData } = await supabase.auth.getSession();
 const authToken = sessionData.session?.access_token || null;
 const { data: applications, error: applicationsError } = await supabase.from('applications').select('id, job_id, candidate_id, cover_letter, status, match_score, notes, recruiter_notes, created_at, updated_at').in('job_id', jobIds).order('created_at', { ascending: false });

 if (applicationsError) {
 throw new Error(applicationsError.message);
 }

 const applicationRows = applications || [];
 const candidateIds = Array.from(new Set(applicationRows.map((app: any) => app.candidate_id).filter(Boolean)));
 const { data: profileRows, error: candidateProfileError } = candidateIds.length > 0
 ? await supabase.from('profiles').select('id, auth_user_id, full_name, email, phone, location').in('id', candidateIds)
 : { data: [], error: null };

 if (candidateProfileError) {
 throw new Error(candidateProfileError.message);
 }

 const profiles = profileRows || [];
 const profileAuthIds = profiles.map((profile: any) => profile.auth_user_id).filter(Boolean);
 const profileLookupIds = Array.from(new Set([...candidateIds,...profileAuthIds]));

 let candidateDetails: any[] = [];
 if (profileLookupIds.length > 0) {
 const { data: detailRows, error: detailError } = await supabase.from('candidate_profiles').select('*').in('user_id', profileLookupIds);

 if (detailError) {
 console.error('Failed to load candidate profile details:', detailError);
 } else {
 candidateDetails = detailRows || [];
 }
 }

 mappedProjectApplications = await Promise.all(applicationRows.map(async (application: any) => {
 const profile = profiles.find((item: any) => item.id === application.candidate_id);
 const details = candidateDetails.find(
 (item: any) => item.user_id === profile?.id || item.user_id === profile?.auth_user_id
 );
 const job = jobRows.find((item: any) => item.id === application.job_id);
 const skills = Array.isArray(details?.skills) ? details.skills : [];
 const resumeUrl = details?.resume_url || details?.resume_file_url || '';

 const years = details?.years_of_experience;
 const experience =
 details?.experience_summary ||
 (typeof years === 'number'? `${years} year${years === 1? '': 's'} experience`: 'Not specified');
 const atsMatch = await calculateAtsMatch(
 {
 id: job?.id || application.job_id,
 title: job?.title || selectedJobTitle || 'Project',
 description: job?.description || '',
 requirements: Array.isArray(job?.requirements) ? job.requirements : [],
 skills: Array.isArray(job?.skills) ? job.skills : [],
 experience_level: job?.experience_level || null,
 },
 {
 applicationId: application.id,
 name: details?.full_name || profile?.full_name || 'Candidate',
 skills,
 headline: details?.headline || '',
 summary: details?.profile_summary || details?.summary || details?.bio || details?.experience_summary || '',
 resumeUrl,
 resumeText: details?.resume_text || details?.resume_content || '',
 coverLetter: application.cover_letter || '',
 experience,
 storedScore: application.match_score,
 },
 authToken
 );

 if ((application.match_score === null || application.match_score === undefined) && atsMatch.score > 0) {
 const { error: updateScoreError } = await supabase.from('applications').update({ match_score: atsMatch.score }).eq('id', application.id);

 if (updateScoreError) {
 console.error('Failed to store ATS match score:', updateScoreError);
 }
 }

 return {
 id: `project-${application.id}`,
 applicationId: application.id,
 candidateId: application.candidate_id,
 name: details?.full_name || profile?.full_name || 'Candidate',
 email: profile?.email || '',
 projectId: application.job_id,
 projectTitle: job?.title || selectedJobTitle || 'Project',
 status: application.status || 'applied',
 matchScore: atsMatch.score,
 appliedDate: application.created_at,
 sourceType: 'project',
 sourceLabel: 'Project',
 skills,
 experience,
 location: details?.location || profile?.location || 'Not specified',
 coverLetter: application.cover_letter || '',
 resumeUrl,
 atsMatchedKeywords: atsMatch.matchedKeywords,
 atsMissingKeywords: atsMatch.missingKeywords,
 atsExplanation: atsMatch.explanation,
 scoreSource: atsMatch.source,
 };
 }));
 }

 const growthResult = selectedJobId? { data: [], error: null }: await careerGrowthService.getCareerGrowthApplicationsForRecruiter(recruiterProfile.id);
 if (growthResult.error) {
 console.error('Failed to load career growth applications:', growthResult.error);
 }

 const growthLabel = (type?: CareerGrowthType) => {
 switch (type) {
 case 'experience_builder': return 'Experience Builder';
 case 'micro_internship': return 'Micro-Internship';
 case 'mentorship': return 'Mentorship';
 case 'career_switch': return 'Career Switch';
 default: return 'Career Growth';
 }
 };

 const mappedGrowthApplications: Candidate[] = (growthResult.data || []).map((application: any) => {
 const type = (application.opportunity?.type || 'experience_builder') as CareerGrowthType;

 return {
 id: `growth-${application.id}`,
 applicationId: application.id,
 candidateId: application.candidate_profile_id,
 name: application.candidate_profile?.full_name || application.candidate_profile?.email || 'Candidate',
 email: application.candidate_profile?.email || '',
 projectId: application.opportunity_id,
 projectTitle: application.opportunity?.title || 'Career growth opportunity',
 status: application.status || 'applied',
 matchScore: 0,
 appliedDate: application.created_at,
 sourceType: type,
 sourceLabel: growthLabel(type),
 skills: application.opportunity?.skills || [],
 experience: application.opportunity?.duration_label || 'Career growth application',
 location: application.opportunity?.location || 'Not specified',
 coverLetter: application.cover_message || application.message || '',
 resumeUrl: '',
 atsMatchedKeywords: [],
 atsMissingKeywords: [],
 atsExplanation: 'Career growth applications are listed from real application data; ATS scoring is available for project applications.',
 scoreSource: 'keyword',
 };
 });

 const mapped = [...mappedProjectApplications,...mappedGrowthApplications]
 .filter((candidate) => !isBestMatchScanner || (candidate.sourceType === 'project' && candidate.matchScore >= 70))
 .sort((a, b) => b.matchScore - a.matchScore || new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());

 setCandidates(mapped);
 setSelectedCandidateId((current) => current && mapped.some((candidate) => candidate.id === current)? current: mapped[0]?.id || null);
 } catch (error) {
 console.error('Failed to load real applications:', error);
 toast.error(error instanceof Error? error.message: 'Failed to load applications');
 setCandidates([]);
 }
 };

 useEffect(() => {
 loadApplications();
 }, [user?.id, selectedJobId, isBestMatchScanner]);

 const filteredCandidates = useMemo(() => {
 return candidates.filter((candidate) => {
 const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
 const matchesCategory = categoryFilter === 'all' || candidate.sourceType === categoryFilter;
 const term = searchTerm.trim().toLowerCase();
 const matchesSearch =!term ||
 candidate.name.toLowerCase().includes(term) ||
 candidate.email.toLowerCase().includes(term) ||
 candidate.projectTitle.toLowerCase().includes(term) ||
 candidate.skills.some((skill) => skill.toLowerCase().includes(term));

 return matchesStatus && matchesCategory && matchesSearch;
 });
 }, [candidates, statusFilter, categoryFilter, searchTerm]);

 const selectedCand = candidates.find(c => c.id === selectedCandidateId);

 const openCandidateConversation = async (candidate: Candidate) => {
 if (!user?.id) {
 toast.error('Please sign in to message candidates.');
 return;
 }

 try {
 await openOrCreateConversationAndNavigate({
 recruiterProfileId: user.id,
 candidateProfileId: candidate.candidateId,
 currentUserProfileId: user.id,
 navigateToMessages: onViewMessages,
 });
 } catch (error) {
 console.error('Failed to open applicant conversation:', error);
 toast.error(error instanceof Error? error.message: 'Could not open messages.');
 }
 };
 const categoryOptions: Array<{ value: 'all' | ApplicationCategory; label: string; icon: any; count: number; description: string; tone: string }> = [
 { value: 'all', label: 'All Applications', icon: Users, count: candidates.length, description: 'Every incoming applicant', tone: 'border-slate-200 bg-slate-50 text-slate-700' },
 { value: 'project', label: 'Projects', icon: Briefcase, count: candidates.filter((candidate) => candidate.sourceType === 'project').length, description: 'Normal project applicants', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
 { value: 'experience_builder', label: 'Experience Builder', icon: Target, count: candidates.filter((candidate) => candidate.sourceType === 'experience_builder').length, description: 'Portfolio sprint applicants', tone: 'border-blue-200 bg-blue-50 text-blue-700' },
 { value: 'micro_internship', label: 'Micro-Internships', icon: Clock, count: candidates.filter((candidate) => candidate.sourceType === 'micro_internship').length, description: 'Short assignment applicants', tone: 'border-amber-200 bg-amber-50 text-amber-700' },
 { value: 'mentorship', label: 'Mentorship', icon: Award, count: candidates.filter((candidate) => candidate.sourceType === 'mentorship').length, description: 'Mentor-led path applicants', tone: 'border-rose-200 bg-rose-50 text-rose-700' },
 { value: 'career_switch', label: 'Career Switch', icon: BookOpen, count: candidates.filter((candidate) => candidate.sourceType === 'career_switch').length, description: 'Transition-track applicants', tone: 'border-violet-200 bg-violet-50 text-violet-700' },
 ];

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'applied': return 'bg-blue-100 text-blue-800';
 case 'reviewing': return 'bg-cyan-100 text-cyan-800';
 case 'screening': return 'bg-yellow-100 text-yellow-800';
 case 'shortlisted': return 'bg-indigo-100 text-indigo-800';
 case 'accepted': return 'bg-green-100 text-green-800';
 case 'assigned': return 'bg-teal-100 text-teal-800';
 case 'in_progress': return 'bg-orange-100 text-orange-800';
 case 'completed': return 'bg-emerald-100 text-emerald-800';
 case 'interview': return 'bg-purple-100 text-purple-800';
 case 'offer': return 'bg-green-100 text-green-800';
 case 'hired': return 'bg-emerald-100 text-emerald-800';
 case 'rejected': return 'bg-red-100 text-red-800';
 case 'withdrawn': return 'bg-gray-100 text-gray-800';
 default: return 'bg-gray-100 text-gray-800';
 }
 };

 const getMatchScoreColor = (score: number) => {
 if (score >= 90) return 'text-green-600';
 if (score >= 70) return 'text-yellow-600';
 if (score > 0) return 'text-red-600';
 return 'text-muted-foreground';
 };

 const getInitials = (name: string) => {
 return name.split(' ').filter(Boolean).map((item) => item[0]).join('').slice(0, 2).toUpperCase() || 'C';
 };

 return (
 <div className={dashboardTheme.page}>
 <header className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
 <div className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div className="flex min-w-0 items-center gap-4">
 <Button variant="ghost" size="icon" onClick={onBack} className="rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950">
 <ArrowLeft className="h-5 w-5" />
 </Button>
 <div className="flex min-w-0 items-center gap-3">
 <img src={(hirevifyLogo as any).src?? hirevifyLogo} alt="HireVify" className="h-14 shrink-0" />
 <div className="min-w-0">
 <p className="text-xs font-semibold uppercase text-emerald-700">{isBestMatchScanner? 'ATS Best Matches': 'Applications'}</p>
 <h1 className="truncate text-2xl font-semibold tracking-normal text-slate-950">
 {isBestMatchScanner? 'HireVify ATS Scanner': 'Candidate Application Center'}
 </h1>
 <p className="text-sm text-slate-500">
 {isBestMatchScanner && selectedJobTitle
 ? `Candidates scoring 70% or higher for ${selectedJobTitle}`
 : selectedJobTitle
 ? `Applications for ${selectedJobTitle}`
 : 'Project, micro-internship, and growth applications in one workspace'}
 </p>
 </div>
 </div>
 </div>
 <Badge variant="secondary" className="w-fit border border-yellow-200 bg-yellow-50 text-yellow-800">
 <Crown className="mr-1 h-3 w-3" />
 Premium Feature
 </Badge>
 </div>
 </div>
 </header>

 <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
 <div className="mb-4 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
 <p className="text-xs font-semibold uppercase text-emerald-700">{isBestMatchScanner? 'ATS Best Matches': 'Applications Workspace'}</p>
 <Badge className="w-fit border border-emerald-200 bg-white text-emerald-700">
 {filteredCandidates.length} applicant{filteredCandidates.length === 1? '': 's'}
 </Badge>
 </div>

 <div className="grid min-h-[760px] grid-cols-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm xl:grid-cols-[280px_minmax(0,1fr)_390px]">
 <aside className="border-b border-slate-200 bg-slate-950 p-4 text-white xl:border-b-0 xl:border-r">
 <div className="mb-5">
 <p className="text-xs font-semibold uppercase text-emerald-300">Queues</p>
 <h3 className="text-lg font-semibold">Application Options</h3>
 </div>
 <div className="space-y-2">
 {categoryOptions.map((option) => {
 const Icon = option.icon;
 const isActive = categoryFilter === option.value;
 return (
 <button
 key={option.value}
 type="button"
 onClick={() => setCategoryFilter(option.value)}
 className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${isActive? 'border-emerald-300 bg-emerald-400 text-slate-950': 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'}`}
 >
 <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive? 'bg-slate-950 text-white': 'bg-white/10 text-emerald-200'}`}>
 <Icon className="h-4 w-4" />
 </span>
 <span className="min-w-0 flex-1">
 <span className="block text-sm font-semibold">{option.label}</span>
 <span className={`block truncate text-xs ${isActive? 'text-slate-800': 'text-slate-400'}`}>{option.description}</span>
 </span>
 <span className={`rounded-md px-2 py-1 text-xs font-semibold ${isActive? 'bg-slate-950 text-white': 'bg-white text-slate-950'}`}>{option.count}</span>
 </button>
 );
 })}
 </div>
 <div className="mt-6 space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
 <div>
 <label className="mb-1 block text-xs font-semibold uppercase text-slate-300">Search</label>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 placeholder="Candidate, project, skill"
 value={searchTerm}
 onChange={(event) => setSearchTerm(event.target.value)}
 className="w-full rounded-lg border border-white/10 bg-white py-2 pl-10 pr-3 text-sm text-slate-950 outline-none focus:ring-2 focus:ring-emerald-300"
 />
 </div>
 </div>
 <div>
 <label className="mb-1 block text-xs font-semibold uppercase text-slate-300">Status</label>
 <select
 value={statusFilter}
 onChange={(event) => setStatusFilter(event.target.value)}
 className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:ring-2 focus:ring-emerald-300"
 >
 <option value="all">All Status</option>
 <option value="applied">Applied</option>
 <option value="reviewing">Reviewing</option>
 <option value="screening">Screening</option>
 <option value="shortlisted">Shortlisted</option>
 <option value="assigned">Assigned</option>
 <option value="completed">Completed</option>
 <option value="interview">Interview</option>
 <option value="offer">Offer</option>
 <option value="hired">Hired</option>
 <option value="rejected">Rejected</option>
 <option value="withdrawn">Withdrawn</option>
 </select>
 </div>
 </div>
 </aside>
 <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
 <div className="border-b border-slate-200 bg-white p-5">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold text-slate-950">
 {isBestMatchScanner? 'ATS Best Matches': 'Candidates'} ({filteredCandidates.length})
 </h2>
 <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">Sorted by ATS score</Badge>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto">
 {filteredCandidates.length === 0? (
 <div className="h-full flex items-center justify-center py-24">
 <div className="text-center max-w-md">
 <Briefcase className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
 <h3 className="text-foreground mb-2">
 {isBestMatchScanner? 'No candidate reached 70% ATS match yet': 'No applications yet'}
 </h3>
 <p className="text-muted-foreground">
 {isBestMatchScanner
 ? 'The scanner found no real applicants at or above the 70% threshold for this project.'
 : 'When candidates apply to this project, they will appear here.'}
 </p>
 </div>
 </div>
 ): (
 <div className="space-y-1 p-2">
 {filteredCandidates.map((candidate) => (
 <Card
 key={candidate.id}
 className={`cursor-pointer transition-all border ${
 selectedCandidateId === candidate.id? 'border-primary bg-primary/5': 'border-border hover:border-primary/50 hover:shadow-sm'
 }`}
 onClick={() => setSelectedCandidateId(candidate.id)}
 >
 <CardContent className="p-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-4">
 <Avatar className="w-12 h-12">
 <AvatarFallback className="bg-muted text-muted-foreground">
 {getInitials(candidate.name)}
 </AvatarFallback>
 </Avatar>
 <div>
 <h3 className="text-foreground">{candidate.name}</h3>
 <p className="text-sm text-muted-foreground">{candidate.projectTitle}</p>
 <p className="text-xs text-muted-foreground">{candidate.location}</p>
 </div>
 </div>
 <div className="text-right">
 <div className="flex items-center space-x-3 mb-2">
 <div className="text-right">
 <p className="text-sm text-muted-foreground">Match Score</p>
 <p className={`text-lg ${getMatchScoreColor(candidate.matchScore)}`}>
 {candidate.matchScore}%
 </p>
 </div>
 <Badge className={getStatusColor(candidate.status)}>
 {candidate.status}
 </Badge>
 </div>
 <p className="text-xs text-muted-foreground">
 Applied {new Date(candidate.appliedDate).toLocaleDateString()}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="bg-slate-50">
 {selectedCand? (
 <div className="h-full flex flex-col">
 <div className="border-b border-slate-200 bg-white p-5">
 <div className="mb-4 flex items-start gap-4">
 <Avatar className="h-14 w-14">
 <AvatarFallback className="bg-emerald-50 text-emerald-700 text-lg">
 {getInitials(selectedCand.name)}
 </AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-3">
 <h2 className="truncate text-xl font-semibold text-slate-950">{selectedCand.name}</h2>
 <Badge className={getStatusColor(selectedCand.status)} variant="secondary">
 {selectedCand.status}
 </Badge>
 </div>
 <div className="mt-2 flex items-center space-x-2 text-sm text-slate-500">
 <Mail className="w-4 h-4" />
 <span>{selectedCand.email || 'No email saved'}</span>
 </div>
 <div className="flex items-center space-x-2 text-sm text-slate-500">
 <Calendar className="w-4 h-4" />
 <span>Applied {new Date(selectedCand.appliedDate).toLocaleDateString()}</span>
 </div>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
 <p className="text-xs font-semibold uppercase text-emerald-700">ATS Score</p>
 <p className={`mt-1 text-2xl font-bold ${getMatchScoreColor(selectedCand.matchScore)}`}>{selectedCand.matchScore}%</p>
 </div>
 <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
 <p className="text-xs font-semibold uppercase text-blue-700">Project</p>
 <p className="mt-1 truncate text-sm font-semibold text-slate-950">{selectedCand.projectTitle}</p>
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-hidden">
 <Tabs defaultValue="profile" className="h-full flex flex-col">
 <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
 <TabsTrigger value="profile" className="gap-2">
 <User className="h-4 w-4" />
 Profile
 </TabsTrigger>
 <TabsTrigger value="ats-score" className="gap-2">
 <Target className="h-4 w-4" />
 ATS Score
 </TabsTrigger>
 <TabsTrigger value="performance" className="gap-2">
 <Award className="h-4 w-4" />
 Analytics
 </TabsTrigger>
 </TabsList>

 <TabsContent value="profile" className="flex-1 overflow-y-auto p-4 space-y-4">
 <Card className="p-4">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-foreground font-medium">ATS Match Score</h3>
 <span className={`text-2xl font-bold ${getMatchScoreColor(selectedCand.matchScore)}`}>
 {selectedCand.matchScore}%
 </span>
 </div>
 <Progress value={selectedCand.matchScore} className="h-2" />
 <p className="text-sm text-muted-foreground mt-2">
 Score source: {selectedCand.scoreSource === 'openai'? 'OpenAI-enhanced analysis': selectedCand.scoreSource === 'stored'? 'saved application match score': 'keyword fallback analysis'}.
 </p>
 </Card>

 <Card className="p-4">
 <h4 className="text-foreground mb-3 font-medium">Skills</h4>
 {selectedCand.skills.length > 0? (
 <div className="flex flex-wrap gap-2">
 {selectedCand.skills.map((skill) => (
 <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary">
 {skill}
 </Badge>
 ))}
 </div>
 ): (
 <p className="text-sm text-muted-foreground">No skills saved in candidate profile.</p>
 )}
 </Card>

 <Card className="p-4">
 <h4 className="text-foreground mb-3 font-medium">Experience</h4>
 <p className="text-muted-foreground">{selectedCand.experience}</p>
 </Card>

 <Card className="p-4">
 <h4 className="text-foreground mb-3 font-medium">Cover Letter</h4>
 <p className="text-sm text-muted-foreground whitespace-pre-wrap">
 {selectedCand.coverLetter || 'No cover letter submitted.'}
 </p>
 </Card>

 <Card className="p-4">
 <h4 className="text-foreground mb-3 font-medium">Resume</h4>
 {selectedCand.resumeUrl? (
 <Button
 variant="outline"
 className="w-full border-border text-foreground hover:bg-muted"
 onClick={() => window.open(selectedCand.resumeUrl, '_blank')}
 >
 <FileText className="w-4 h-4 mr-2" />
 View Resume
 </Button>
 ): (
 <p className="text-sm text-muted-foreground">No resume URL saved.</p>
 )}
 </Card>

 <Card className="p-4">
 <Label htmlFor="notes" className="text-foreground mb-3 font-medium">Recruiter Notes</Label>
 <Textarea
 id="notes"
 value={notes}
 onChange={(event) => setNotes(event.target.value)}
 placeholder="Add notes about this candidate..."
 rows={4}
 className="bg-input-background border-border text-foreground resize-none mt-2"
 />
 <p className="text-xs text-muted-foreground mt-2">Notes save will be connected in the next cleanup step.</p>
 </Card>

 <div className="space-y-3">
 <Button
 onClick={onStartInterview}
 className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
 >
 <Video className="w-4 h-4 mr-2" />
 Start Video Interview
 </Button>
 <div className="grid grid-cols-2 gap-3">
 <Button
 variant="outline"
 className="border-green-200 text-green-800 hover:bg-green-50"
 >
 <Star className="w-4 h-4 mr-2" />
 Shortlist
 </Button>
 <Button
 variant="outline"
 className="border-border text-foreground hover:bg-muted"
 onClick={() => openCandidateConversation(selectedCand)}
 >
 <MessageSquare className="w-4 h-4 mr-2" />
 Message
 </Button>
 </div>
 </div>
 </TabsContent>

 <TabsContent value="ats-score" className="flex-1 overflow-y-auto p-4 space-y-4">
 <Card className="p-4">
 <h4 className="text-foreground mb-3 font-medium flex items-center gap-2">
 <Target className="h-4 w-4 text-primary" />
 ATS Analysis
 </h4>
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-sm text-muted-foreground">Overall Score</span>
 <span className={`font-bold ${getMatchScoreColor(selectedCand.matchScore)}`}>
 {selectedCand.matchScore}%
 </span>
 </div>
 <Progress value={selectedCand.matchScore} className="h-2" />
 <p className="text-sm text-muted-foreground">{selectedCand.atsExplanation}</p>
 </div>
 </Card>

 <Card className="p-4">
 <h4 className="text-foreground mb-3 font-medium">Matched Skills/Keywords</h4>
 {selectedCand.atsMatchedKeywords.length > 0? (
 <div className="flex flex-wrap gap-2">
 {selectedCand.atsMatchedKeywords.map((keyword) => (
 <Badge key={keyword} className="bg-emerald-50 text-emerald-700 border border-emerald-200">
 {keyword}
 </Badge>
 ))}
 </div>
 ): (
 <p className="text-sm text-muted-foreground">No matched keywords were found in available candidate data.</p>
 )}
 </Card>

 <Card className="p-4">
 <h4 className="text-foreground mb-3 font-medium">Missing Skills/Keywords</h4>
 {selectedCand.atsMissingKeywords.length > 0? (
 <div className="flex flex-wrap gap-2">
 {selectedCand.atsMissingKeywords.map((keyword) => (
 <Badge key={keyword} variant="secondary" className="bg-slate-100 text-slate-700">
 {keyword}
 </Badge>
 ))}
 </div>
 ): (
 <p className="text-sm text-muted-foreground">No missing keywords were identified from the job requirements.</p>
 )}
 </Card>

 <Card className="p-4">
 <h4 className="text-foreground mb-3 font-medium">Recommendations</h4>
 <div className="space-y-2 text-sm text-muted-foreground">
 <p>Review candidate profile and portfolio before shortlisting.</p>
 <p>Schedule an interview if the skills match your project requirements.</p>
 <p>Update application status after screening.</p>
 </div>
 </Card>
 </TabsContent>

 <TabsContent value="performance" className="flex-1 overflow-y-auto p-0">
 <ProfessionalATSDashboard className="p-4" />
 </TabsContent>
 </Tabs>
 </div>
 <div className="border-t border-slate-200 bg-white p-4">
 <div className="mb-3 flex items-center justify-between">
 <div>
 <p className="text-xs font-semibold uppercase text-emerald-700">Chat</p>
 <h3 className="font-semibold text-slate-950">Candidate Conversation</h3>
 </div>
 <MessageSquare className="h-5 w-5 text-emerald-600" />
 </div>
 <Button
 className="mt-3 w-full bg-slate-950 text-white hover:bg-slate-800"
 onClick={() => openCandidateConversation(selectedCand)}
 >
 <MessageSquare className="mr-2 h-4 w-4" />
 Open Conversation
 </Button>
 </div>
 </div>
 ): (
 <div className="h-full flex items-center justify-center">
 <div className="text-center">
 <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
 <h3 className="text-foreground mb-2">Select a real applicant</h3>
 <p className="text-muted-foreground">Applications from your database will appear here.</p>
 </div>
 </div>
 )}
</div>
</div>
</main>
</div>
);
}

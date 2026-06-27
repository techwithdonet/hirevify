import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Briefcase, Calendar, Edit, Eye, Loader, MapPin, Plus, Scan, Trash2, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { ModernField, ModernFormSection, ModernFormShell } from './common/ModernForm';
import { SkillMultiSelect } from './common/SkillMultiSelect';
import { useAuth } from './AuthProvider';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { toast } from 'sonner';
import {
 careerGrowthService,
 parseCareerGrowthReview,
 type CareerGrowthApplication,
 type CareerGrowthOpportunity,
 type CareerGrowthSubmission,
 type CareerGrowthStatus,
 type CareerGrowthType,
} from '../services/careerGrowthService';
import { dashboardTheme } from '../theme/dashboardTheme';

interface JobRow {
 id: string;
 recruiter_id: string;
 title: string | null;
 description: string | null;
 requirements: string[] | null;
 skills: string[] | null;
 location: string | null;
 status: string | null;
 applications_count: number | null;
 budget_min: number | null;
 budget_max: number | null;
 budget_currency: string | null;
 created_at: string;
}

interface ProjectManagementProps {
 onBack: () => void;
 onEditProject?: (project?: any) => void;
  onPostJob?: (job?: any) => void;
 onViewApplications?: (project?: any) => void;
 onCreateProject?: () => void;
}

type RecruiterGrowthPostType = Extract<CareerGrowthType, 'experience_builder' | 'micro_internship'>;

const growthTypeLabels: Record<RecruiterGrowthPostType, string> = {
 experience_builder: 'Experience Builder',
 micro_internship: 'Micro Internship',
};

const durationOptions: Record<RecruiterGrowthPostType, Array<{ label: string; value: number; unit: 'day' | 'week' | 'month' }>> = {
 experience_builder: [
 { label: '1 week', value: 1, unit: 'week' },
 { label: '2 weeks', value: 2, unit: 'week' },
 { label: '3 weeks', value: 3, unit: 'week' },
 { label: '1 month', value: 1, unit: 'month' },
 ],
 micro_internship: [
 { label: '1 day', value: 1, unit: 'day' },
 { label: '2 days', value: 2, unit: 'day' },
 { label: '3 days', value: 3, unit: 'day' },
 { label: '5 days', value: 5, unit: 'day' },
 { label: '1 week', value: 1, unit: 'week' },
 ],
};

function isRecruiterGrowthPostType(value: string | null): value is RecruiterGrowthPostType {
 return value === 'experience_builder' || value === 'micro_internship';
}

function splitList(value: string) {
 return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

function normalizeList(value: string | string[]) {
 return Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean) : splitList(value);
}

const emptyGrowthForm = (type: RecruiterGrowthPostType) => ({
 type,
 title: '',
 description: '',
 skills: [] as string[],
 requirements: '',
 responsibilities: '',
 deliverables: '',
 durationLabel: durationOptions[type][0].label,
 location: 'Remote',
 remoteType: 'remote',
 difficulty: 'Beginner',
 slots: '',
 applicationDeadline: '',
 startDate: '',
 endDate: '',
 compensationType: '',
 compensationAmount: '',
 currency: 'INR',
 submissionRequired: true,
 videoRequired: true,
});

const mapOpportunityToGrowthForm = (opportunity: CareerGrowthOpportunity, type: RecruiterGrowthPostType) => ({
 type,
 title: opportunity.title || '',
 description: opportunity.description || '',
 skills: opportunity.skills || [],
 requirements: (opportunity.requirements || []).join('\n'),
 responsibilities: (opportunity.responsibilities || []).join('\n'),
 deliverables: (opportunity.deliverables || []).join('\n'),
 durationLabel: opportunity.duration_label || durationOptions[type][0].label,
 location: opportunity.location || 'Remote',
 remoteType: opportunity.remote_type || 'remote',
 difficulty: opportunity.difficulty || 'Beginner',
 slots: opportunity.slots ? String(opportunity.slots) : '',
 applicationDeadline: opportunity.application_deadline || '',
 startDate: opportunity.start_date || '',
 endDate: opportunity.end_date || '',
 compensationType: opportunity.compensation_type || '',
 compensationAmount: opportunity.compensation_amount ? String(opportunity.compensation_amount) : '',
 currency: opportunity.currency || 'INR',
 submissionRequired: opportunity.submission_required ?? true,
 videoRequired: opportunity.video_required ?? true,
});

export function ProjectManagement({
 onBack,
 onEditProject,
  onPostJob,
 onViewApplications,
 onCreateProject,
}: ProjectManagementProps) {
 const { user } = useAuth();
 const [jobs, setJobs] = useState<JobRow[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [recruiterProfileId, setRecruiterProfileId] = useState<string | null>(null);
 const [careerGrowthOnlyType, setCareerGrowthOnlyType] = useState<RecruiterGrowthPostType | null>(null);
 const [growthOpportunities, setGrowthOpportunities] = useState<CareerGrowthOpportunity[]>([]);
 const [growthApplications, setGrowthApplications] = useState<CareerGrowthApplication[]>([]);
 const [growthSubmissions, setGrowthSubmissions] = useState<CareerGrowthSubmission[]>([]);
 const [isGrowthLoading, setIsGrowthLoading] = useState(false);
 const [growthForm, setGrowthForm] = useState(emptyGrowthForm('experience_builder'));
 const [showGrowthForm, setShowGrowthForm] = useState(false);
 const [editingGrowthId, setEditingGrowthId] = useState<string | null>(null);
 const [expandedGrowthId, setExpandedGrowthId] = useState<string | null>(null);
 const [growthReviewMode, setGrowthReviewMode] = useState(false);
 const [growthView, setGrowthView] = useState<'programs' | 'applications'>('programs');
 const [scoreByApplicationId, setScoreByApplicationId] = useState<Record<string, string>>({});

 useEffect(() => {
 if (typeof window === 'undefined') return;

 const selectedGrowthType = window.localStorage.getItem('hirevify_growth_post_type');

 if (!isRecruiterGrowthPostType(selectedGrowthType)) return;

 setCareerGrowthOnlyType(selectedGrowthType);
 setGrowthForm(emptyGrowthForm(selectedGrowthType));
 setShowGrowthForm(false);
 setEditingGrowthId(null);
 setExpandedGrowthId(null);
 const shouldOpenApplications = window.localStorage.getItem('hirevify_growth_review_mode') === 'applications';
 setGrowthReviewMode(shouldOpenApplications);
 setGrowthView(shouldOpenApplications ? 'applications' : 'programs');
 window.localStorage.removeItem('hirevify_growth_post_type');
 window.localStorage.removeItem('hirevify_growth_review_mode');
 }, []);

 const loadGrowthData = async (profileId: string, type: RecruiterGrowthPostType) => {
 setIsGrowthLoading(true);

 const [opportunityResult, applicationResult] = await Promise.all([
 careerGrowthService.getRecruiterCareerGrowthOpportunities(profileId, type),
 careerGrowthService.getCareerGrowthApplicationsForRecruiter(profileId),
 ]);

 if (opportunityResult.error) {
 toast.error(opportunityResult.error.message);
 }

 if (applicationResult.error) {
 toast.error(applicationResult.error.message);
 }

 setGrowthOpportunities(opportunityResult.data.filter((opportunity) => opportunity.type === type));
 setGrowthApplications(applicationResult.data);
 const submissionResult = await careerGrowthService.getSubmissionsForApplications(applicationResult.data.map((application) => application.id));
 if (submissionResult.error) {
 toast.error(submissionResult.error.message);
 } else {
 setGrowthSubmissions(submissionResult.data);
 }
 setIsGrowthLoading(false);
 };

 const loadData = async () => {
 try {
 setIsLoading(true);

 const supabase = createSupabaseBrowserClient();
 const { data: authData, error: authError } = await supabase.auth.getUser();

 if (authError ||!authData?.user?.id) {
 throw new Error('No active Supabase login found. Please login again.');
 }

 const { data: profileRow, error: profileError } = await supabase.from('profiles').select('id, role').eq('auth_user_id', authData.user.id).maybeSingle();

 if (profileError) throw new Error(profileError.message);
 if (!profileRow?.id) throw new Error('Recruiter profile row not found.');

 setRecruiterProfileId(profileRow.id);

 if (careerGrowthOnlyType) {
 await loadGrowthData(profileRow.id, careerGrowthOnlyType);
 setJobs([]);
 return;
 }

 const { data, error } = await supabase.from('jobs').select('*').eq('recruiter_id', profileRow.id).order('created_at', { ascending: false });

 if (error) throw new Error(error.message);

 setJobs((data || []).filter((job: any) => !(job.has_project === true && job.job_type === 'freelance')));
 } catch (error) {
 console.error('Failed to load recruiter projects:', error);
 toast.error(error instanceof Error? error.message: 'Failed to load projects');
 setJobs([]);
 setGrowthOpportunities([]);
 setGrowthApplications([]);
 setGrowthSubmissions([]);
 } finally {
 setIsLoading(false);
 setIsGrowthLoading(false);
 }
 };

 useEffect(() => {
 void loadData();
 }, [user?.id, careerGrowthOnlyType]);

 useEffect(() => {
 if (!careerGrowthOnlyType) return;

 setGrowthForm((current) => {
 if (current.type === careerGrowthOnlyType) return current;
 return emptyGrowthForm(careerGrowthOnlyType);
 });
 setShowGrowthForm(false);
 setEditingGrowthId(null);
 setExpandedGrowthId(null);
 }, [careerGrowthOnlyType]);

 const filteredGrowthOpportunities = useMemo(() => {
 if (!careerGrowthOnlyType) return [];
 return growthOpportunities.filter((opportunity) => opportunity.type === careerGrowthOnlyType);
 }, [careerGrowthOnlyType, growthOpportunities]);

 useEffect(() => {
 if (!growthReviewMode || expandedGrowthId || filteredGrowthOpportunities.length === 0) return;
 const opportunityWithApplicants = filteredGrowthOpportunities.find((opportunity) =>
 growthApplications.some((application) => application.opportunity_id === opportunity.id)
 );
 setExpandedGrowthId((opportunityWithApplicants || filteredGrowthOpportunities[0]).id);
 }, [expandedGrowthId, filteredGrowthOpportunities, growthApplications, growthReviewMode]);

 const openCreateProject = () => {
 if (onCreateProject) {
 onCreateProject();
 return;
 }

 onEditProject?.();
 };

 const createGrowthOpportunity = async () => {
 if (!recruiterProfileId ||!careerGrowthOnlyType) {
 toast.error('No recruiter profile found. Please login again.');
 return;
 }

 if (!growthForm.title.trim() ||!growthForm.description.trim()) {
 toast.error('Please add a title and description.');
 return;
 }

 const selectedDuration = durationOptions[careerGrowthOnlyType].find((option) => option.label === growthForm.durationLabel);

 if (!selectedDuration) {
 toast.error('Please select a valid duration.');
 return;
 }

 const payload = {
 type: careerGrowthOnlyType,
 title: growthForm.title.trim(),
 description: growthForm.description.trim(),
 company_name: 'Recruiter Opportunity',
 recruiter_id: recruiterProfileId,
 created_by_profile_id: recruiterProfileId,
 skills: normalizeList(growthForm.skills),
 requirements: normalizeList(growthForm.requirements),
 responsibilities: normalizeList(growthForm.responsibilities),
 deliverables: normalizeList(growthForm.deliverables),
 duration_value: selectedDuration.value,
 duration_unit: selectedDuration.unit,
 duration_label: selectedDuration.label,
 location: growthForm.location.trim() || null,
 remote_type: growthForm.remoteType,
 difficulty: growthForm.difficulty || null,
 slots: growthForm.slots? Number(growthForm.slots): null,
 status: 'published',
 application_deadline: growthForm.applicationDeadline || null,
 start_date: growthForm.startDate || null,
 end_date: growthForm.endDate || null,
 compensation_type: growthForm.compensationType || null,
 compensation_amount: growthForm.compensationAmount? Number(growthForm.compensationAmount): null,
 currency: growthForm.currency || 'INR',
 submission_required: growthForm.submissionRequired,
 video_required: growthForm.videoRequired,
 metadata: {
 category: growthTypeLabels[careerGrowthOnlyType],
 },
 };

 const { error } = editingGrowthId
 ? await careerGrowthService.updateCareerGrowthOpportunity(editingGrowthId, payload)
 : await careerGrowthService.createCareerGrowthOpportunity(payload);

 if (error) {
 toast.error(error.message);
 return;
 }

 toast.success(`${growthTypeLabels[careerGrowthOnlyType]} ${editingGrowthId ? 'updated' : 'published'}.`);
 setGrowthForm(emptyGrowthForm(careerGrowthOnlyType));
 setEditingGrowthId(null);
 setShowGrowthForm(false);
 await loadGrowthData(recruiterProfileId, careerGrowthOnlyType);
 };

 const startNewGrowthOpportunity = () => {
 if (!careerGrowthOnlyType) return;
 setGrowthForm(emptyGrowthForm(careerGrowthOnlyType));
 setEditingGrowthId(null);
 setGrowthView('programs');
 setShowGrowthForm(true);
 };

 const editGrowthOpportunity = (opportunity: CareerGrowthOpportunity) => {
 if (!careerGrowthOnlyType) return;
 setGrowthForm(mapOpportunityToGrowthForm(opportunity, careerGrowthOnlyType));
 setEditingGrowthId(opportunity.id);
 setGrowthView('programs');
 setShowGrowthForm(true);
 };

 const cancelGrowthForm = () => {
 if (!careerGrowthOnlyType) return;
 setGrowthForm(emptyGrowthForm(careerGrowthOnlyType));
 setEditingGrowthId(null);
 setShowGrowthForm(false);
 };

 const deleteGrowthOpportunity = async (opportunityId: string) => {
 if (!recruiterProfileId ||!careerGrowthOnlyType) return;

 const { error } = await careerGrowthService.deleteCareerGrowthOpportunity(opportunityId);

 if (error) {
 toast.error(error.message);
 return;
 }

 toast.success('Career growth opportunity deleted.');
 await loadGrowthData(recruiterProfileId, careerGrowthOnlyType);
 };

 const updateGrowthStatus = async (applicationId: string, status: CareerGrowthStatus) => {
 if (!recruiterProfileId ||!careerGrowthOnlyType) return;

 const { error } = await careerGrowthService.updateCareerGrowthApplicationStatus(applicationId, status);

 if (error) {
 toast.error(error.message);
 return;
 }

 toast.success('Application status updated.');
 await loadGrowthData(recruiterProfileId, careerGrowthOnlyType);
 };

 const notifyGrowthCandidate = async (application: CareerGrowthApplication, title: string, message: string) => {
 const supabase = createSupabaseBrowserClient();
 const { data: candidateProfile } = await supabase
 .from('profiles')
 .select('auth_user_id')
 .eq('id', application.candidate_profile_id)
 .maybeSingle();
 await supabase.from('notifications').insert({
 user_id: candidateProfile?.auth_user_id || application.candidate_profile_id,
 type: 'career_growth',
 title,
 message,
 data: {
 application_id: application.id,
 opportunity_id: application.opportunity_id,
 type: application.opportunity?.type,
 },
 read: false,
 });
 };

 const acceptGrowthApplication = async (application: CareerGrowthApplication) => {
 if (!recruiterProfileId || !careerGrowthOnlyType) return;
 const { error } = await careerGrowthService.updateCareerGrowthApplicationStatus(application.id, 'accepted');
 if (error) {
 toast.error(error.message);
 return;
 }
 await notifyGrowthCandidate(
 application,
 `${growthTypeLabels[careerGrowthOnlyType]} assigned`,
 `Your application for "${application.opportunity?.title || growthTypeLabels[careerGrowthOnlyType]}" was accepted. You can now submit your project file.`,
 );
 toast.success('Candidate assigned.');
 await loadGrowthData(recruiterProfileId, careerGrowthOnlyType);
 };

 const reviewGrowthApplication = async (applicationId: string) => {
 if (!recruiterProfileId || !careerGrowthOnlyType) return;
 const score = Number(scoreByApplicationId[applicationId]);
 if (!Number.isFinite(score) || score < 0 || score > 100) {
 toast.error('Enter a score from 0 to 100.');
 return;
 }

 const { error } = await careerGrowthService.reviewApplication(applicationId, {
 score,
 certificateIssued: true,
 note: 'Certificate issued by recruiter.',
 });

 if (error) {
 toast.error(error.message);
 return;
 }

 const application = growthApplications.find((item) => item.id === applicationId);
 if (application) {
 await notifyGrowthCandidate(
 application,
 'Project approved',
 `Your project for "${application.opportunity?.title || 'career growth opportunity'}" was approved. Your certificate is ready.`,
 );
 }
 toast.success('Score saved and certificate issued.');
 await loadGrowthData(recruiterProfileId, careerGrowthOnlyType);
 };

 const rejectGrowthApplication = async (application: CareerGrowthApplication) => {
 if (!recruiterProfileId || !careerGrowthOnlyType) return;
 const { error } = await careerGrowthService.updateCareerGrowthApplicationStatus(application.id, 'rejected');
 if (error) {
 toast.error(error.message);
 return;
 }
 await notifyGrowthCandidate(
 application,
 'Application not selected',
 `Your ${growthTypeLabels[careerGrowthOnlyType]} application for "${application.opportunity?.title || 'this opportunity'}" was not selected.`,
 );
 toast.success('Application rejected.');
 await loadGrowthData(recruiterProfileId, careerGrowthOnlyType);
 };

 const getApplicationSubmission = (applicationId: string) =>
 growthSubmissions.find((submission) => submission.application_id === applicationId);

 const openSubmissionFile = async (path: string) => {
 const { url, error } = await careerGrowthService.getCareerGrowthFileUrl(path);
 if (error || !url) {
 toast.error(error?.message || 'Could not open submitted file.');
 return;
 }
 window.open(url, '_blank', 'noopener,noreferrer');
 };

 const mapJobToProject = (job: JobRow) => ({
 id: job.id,
 title: job.title || '',
 description: job.description || '',
 skills: job.skills || [],
 budget:
 job.budget_min || job.budget_max? `${job.budget_currency || 'USD'} ${job.budget_min || 0} - ${job.budget_max || job.budget_min || 0}`: '',
 timeline: job.requirements?.find((item) => item.toLowerCase().startsWith('timeline:'))?.replace(/^Timeline:\s*/i, '') || '',
 applications: job.applications_count || 0,
 status: job.status || 'published',
 });

 if (careerGrowthOnlyType) {
 const label = growthTypeLabels[careerGrowthOnlyType];
 const applicationOpportunities = filteredGrowthOpportunities.filter((opportunity) =>
 growthApplications.some((application) => application.opportunity_id === opportunity.id)
 );
 const visibleApplicationOpportunities = applicationOpportunities.length > 0 ? applicationOpportunities : filteredGrowthOpportunities;

 return (
 <div className={dashboardTheme.page}>
 <div className="max-w-7xl mx-auto px-6 py-8">
 <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-center gap-4">
 <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
 <ArrowLeft className="w-4 h-4" />
 Back to Dashboard
 </Button>
 <div>
 <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Career Growth</p>
 <h1 className="text-3xl font-bold text-gray-900">
 {label}
 </h1>
 <p className="text-gray-600">Manage active posts and applications.</p>
 </div>
 </div>
 <Button onClick={startNewGrowthOpportunity} className="bg-emerald-600 text-white hover:bg-emerald-700">
 <Plus className="w-4 h-4 mr-2" />
 Add new {label}
 </Button>
 </div>

 <div className="mb-5 grid gap-3 sm:grid-cols-2">
 <button
 type="button"
 onClick={() => {
 setGrowthView('programs');
 setExpandedGrowthId(null);
 }}
 className={`rounded-xl border p-4 text-left transition ${
 growthView === 'programs'
 ? 'border-emerald-300 bg-emerald-50 text-emerald-950 shadow-sm'
 : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200'
 }`}
 >
 <div className="flex items-center justify-between gap-3">
 <div>
 <p className="font-semibold">View Active Programs</p>
 <p className="mt-1 text-sm text-slate-500">Edit, delete, and check posted programs.</p>
 </div>
 <Badge variant="secondary">{filteredGrowthOpportunities.length}</Badge>
 </div>
 </button>
 <button
 type="button"
 onClick={() => setGrowthView('applications')}
 className={`rounded-xl border p-4 text-left transition ${
 growthView === 'applications'
 ? 'border-emerald-300 bg-emerald-50 text-emerald-950 shadow-sm'
 : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200'
 }`}
 >
 <div className="flex items-center justify-between gap-3">
 <div>
 <p className="font-semibold">View Applications</p>
 <p className="mt-1 text-sm text-slate-500">Open each program and review candidates.</p>
 </div>
 <Badge variant="secondary">{growthApplications.length}</Badge>
 </div>
 </button>
 </div>

 <Card className="border border-gray-100 bg-white shadow-sm">
 <CardHeader>
 <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
 <div>
 <CardTitle className="flex items-center gap-2 text-gray-900">
 <Briefcase className="w-5 h-5 text-emerald-600" />
 {growthView === 'programs' ? `${label} Programs` : `${label} Applications`}
 </CardTitle>
 <p className="text-sm text-gray-500 mt-1">
 {growthView === 'programs' ? 'Active and posted programs' : 'Select a program to view candidate applications'}
 </p>
 </div>
 <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
 {growthView === 'programs'
 ? `${filteredGrowthOpportunities.length} posted`
 : `${growthApplications.length} application${growthApplications.length === 1 ? '' : 's'}`}
 </Badge>
 </div>
 </CardHeader>

 <CardContent className="space-y-6 bg-slate-50/70">
 {growthView === 'programs' && showGrowthForm && (
 <>
 <ModernFormShell
 >
 <ModernFormSection eyebrow={editingGrowthId ? 'Edit' : 'New'} title={`${editingGrowthId ? 'Edit' : 'Add'} ${label}`} description="">
 <ModernField label="Title" className="md:col-span-2">
 <Input
 value={growthForm.title}
 onChange={(event) => setGrowthForm((current) => ({...current, title: event.target.value }))}
 placeholder={careerGrowthOnlyType === 'experience_builder'? 'e.g. Frontend dashboard implementation sprint': 'e.g. Two-day landing page QA task'}
 className="bg-white"
 />
 </ModernField>
 <ModernField label="Description" hint="Explain the work, candidate outcome, and how success will be reviewed." className="md:col-span-2">
 <Textarea
 value={growthForm.description}
 onChange={(event) => setGrowthForm((current) => ({...current, description: event.target.value }))}
 placeholder="Describe the opportunity, expected work, and candidate outcome."
 rows={5}
 className="bg-white"
 />
 </ModernField>
 <ModernField label="Difficulty">
 <Select value={growthForm.difficulty} onValueChange={(value) => setGrowthForm((current) => ({...current, difficulty: value }))}>
 <SelectTrigger className="bg-white">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="Beginner">Beginner</SelectItem>
 <SelectItem value="Intermediate">Intermediate</SelectItem>
 <SelectItem value="Advanced">Advanced</SelectItem>
 </SelectContent>
 </Select>
 </ModernField>
 <ModernField label="Slots">
 <Input
 type="number"
 min="1"
 value={growthForm.slots}
 onChange={(event) => setGrowthForm((current) => ({...current, slots: event.target.value }))}
 placeholder="e.g. 3"
 className="bg-white"
 />
 </ModernField>
 </ModernFormSection>

 <ModernFormSection eyebrow="Schedule" title="Schedule and Location" description="">
 <ModernField label="Duration">
 <Select value={growthForm.durationLabel} onValueChange={(value) => setGrowthForm((current) => ({...current, durationLabel: value }))}>
 <SelectTrigger className="bg-white">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {durationOptions[careerGrowthOnlyType].map((option) => (
 <SelectItem key={option.label} value={option.label}>
 {option.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </ModernField>
 <ModernField label="Remote Type">
 <Select value={growthForm.remoteType} onValueChange={(value) => setGrowthForm((current) => ({...current, remoteType: value }))}>
 <SelectTrigger className="bg-white">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="remote">Remote</SelectItem>
 <SelectItem value="onsite">Onsite</SelectItem>
 <SelectItem value="hybrid">Hybrid</SelectItem>
 </SelectContent>
 </Select>
 </ModernField>
 <ModernField label="Location">
 <Input
 value={growthForm.location}
 onChange={(event) => setGrowthForm((current) => ({...current, location: event.target.value }))}
 placeholder="Remote, Bengaluru, Delhi..."
 className="bg-white"
 />
 </ModernField>
 <ModernField label="Application Deadline">
 <Input
 type="date"
 value={growthForm.applicationDeadline}
 onChange={(event) => setGrowthForm((current) => ({...current, applicationDeadline: event.target.value }))}
 className="bg-white"
 />
 </ModernField>
 <ModernField label="Start Date">
 <Input
 type="date"
 value={growthForm.startDate}
 onChange={(event) => setGrowthForm((current) => ({...current, startDate: event.target.value }))}
 className="bg-white"
 />
 </ModernField>
 <ModernField label="End Date">
 <Input
 type="date"
 value={growthForm.endDate}
 onChange={(event) => setGrowthForm((current) => ({...current, endDate: event.target.value }))}
 className="bg-white"
 />
 </ModernField>
 </ModernFormSection>

 <ModernFormSection eyebrow="Pay" title="Compensation" description="">
 <ModernField label="Compensation Type">
 <Select value={growthForm.compensationType || 'stipend'} onValueChange={(value) => setGrowthForm((current) => ({...current, compensationType: value }))}>
 <SelectTrigger className="bg-white">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="stipend">Stipend</SelectItem>
 <SelectItem value="paid">Paid</SelectItem>
 <SelectItem value="unpaid">Unpaid</SelectItem>
 <SelectItem value="certificate">Certificate only</SelectItem>
 </SelectContent>
 </Select>
 </ModernField>
 <div className="grid grid-cols-[1fr_96px] gap-3">
 <ModernField label="Amount">
 <Input
 type="number"
 min="0"
 value={growthForm.compensationAmount}
 onChange={(event) => setGrowthForm((current) => ({...current, compensationAmount: event.target.value }))}
 placeholder="Optional"
 className="bg-white"
 />
 </ModernField>
 <ModernField label="Currency">
 <Select value={growthForm.currency} onValueChange={(value) => setGrowthForm((current) => ({...current, currency: value }))}>
 <SelectTrigger className="bg-white">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="INR">INR</SelectItem>
 <SelectItem value="USD">USD</SelectItem>
 <SelectItem value="EUR">EUR</SelectItem>
 <SelectItem value="GBP">GBP</SelectItem>
 <SelectItem value="QAR">QAR</SelectItem>
 </SelectContent>
 </Select>
 </ModernField>
 </div>
 </ModernFormSection>

 <ModernFormSection eyebrow="Details" title="Skills and Instructions" description="">
 <ModernField label="Skills" hint="Select up to 12 core skills." className="md:col-span-2">
 <SkillMultiSelect
 value={growthForm.skills}
 onChange={(skills) => setGrowthForm((current) => ({...current, skills }))}
 placeholder="Add required skill"
 />
 </ModernField>
 <ModernField label="Requirements">
 <Textarea
 value={growthForm.requirements}
 onChange={(event) => setGrowthForm((current) => ({...current, requirements: event.target.value }))}
 placeholder="One per line"
 rows={4}
 className="bg-white"
 />
 </ModernField>
 <ModernField label="Responsibilities">
 <Textarea
 value={growthForm.responsibilities}
 onChange={(event) => setGrowthForm((current) => ({...current, responsibilities: event.target.value }))}
 placeholder="One per line"
 rows={4}
 className="bg-white"
 />
 </ModernField>
 <ModernField label="Deliverables" className="md:col-span-2">
 <Textarea
 value={growthForm.deliverables}
 onChange={(event) => setGrowthForm((current) => ({...current, deliverables: event.target.value }))}
 placeholder="Submitted file, project link, video explanation..."
 rows={4}
 className="bg-white"
 />
 </ModernField>
 <div className="flex flex-wrap gap-3 md:col-span-2">
 <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
 <input
 type="checkbox"
 checked={growthForm.submissionRequired}
 onChange={(event) => setGrowthForm((current) => ({...current, submissionRequired: event.target.checked }))}
 />
 Submission required
 </label>
 <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
 <input
 type="checkbox"
 checked={growthForm.videoRequired}
 onChange={(event) => setGrowthForm((current) => ({...current, videoRequired: event.target.checked }))}
 />
 Webcam explanation video required
 </label>
 </div>
 </ModernFormSection>
 </ModernFormShell>

 <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
 <Button variant="outline" onClick={cancelGrowthForm}>
 Cancel
 </Button>
 <Button onClick={createGrowthOpportunity} className="bg-emerald-600 px-6 text-white hover:bg-emerald-700">
 <Plus className="w-4 h-4 mr-2" />
 {editingGrowthId ? 'Save Changes' : `Publish ${label}`}
 </Button>
 </div>
 </>
 )}

 {isGrowthLoading || isLoading? (
 <div className="py-12 flex flex-col items-center justify-center text-center">
 <Loader className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
 <p className="text-gray-600">Loading {label} opportunities...</p>
 </div>
 ): growthView === 'programs' && filteredGrowthOpportunities.length === 0? (
 <div className="text-center py-10">
 <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
 <p className="text-sm text-gray-500">No {label} opportunities yet</p>
 </div>
 ): growthView === 'programs' ? (
 <div className="space-y-4">
 {filteredGrowthOpportunities.map((opportunity) => {
 const applicants = growthApplications.filter((application) => application.opportunity_id === opportunity.id);

 return (
 <div key={opportunity.id} className="rounded-xl border border-gray-100 bg-white p-5">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="flex-1">
 <div className="flex flex-wrap items-center gap-2 mb-2">
 <h3 className="text-lg font-bold text-gray-900">{opportunity.title}</h3>
 <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">{label}</Badge>
 <Badge variant="secondary">{opportunity.status}</Badge>
 </div>
 <p className="text-sm text-gray-600 line-clamp-2 mb-3">{opportunity.description}</p>
 <div className="flex flex-wrap gap-2 mb-3">
 {(opportunity.skills || []).map((skill) => (
 <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700">
 {skill}
 </Badge>
 ))}
 </div>
 <div className="text-sm text-gray-500">
 {applicants.length} applicant{applicants.length === 1? '': 's'} - {opportunity.duration_label || 'Duration not set'}
 </div>
 </div>
 <div className="flex flex-wrap gap-2">
 <Button variant="outline" onClick={() => setExpandedGrowthId((current) => current === opportunity.id ? null : opportunity.id)}>
 <Eye className="w-4 h-4 mr-2" />
 View Details
 </Button>
 <Button variant="outline" onClick={() => editGrowthOpportunity(opportunity)}>
 <Edit className="w-4 h-4 mr-2" />
 Edit
 </Button>
 <Button variant="outline" onClick={() => deleteGrowthOpportunity(opportunity.id)} className="text-red-600 hover:text-red-700">
 <Trash2 className="w-4 h-4 mr-2" />
 Delete
 </Button>
 </div>
 </div>

 {expandedGrowthId === opportunity.id && (
 <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600 md:grid-cols-2">
 <div>
 <p className="font-semibold text-gray-900">Schedule</p>
 <p>{opportunity.duration_label || 'Duration not set'} - {opportunity.location || 'Remote'}</p>
 </div>
 <div>
 <p className="font-semibold text-gray-900">Dates</p>
 <p>{opportunity.start_date || 'Start not set'} to {opportunity.end_date || 'End not set'}</p>
 </div>
 {(opportunity.requirements || []).length > 0 && (
 <div>
 <p className="font-semibold text-gray-900">Requirements</p>
 <p>{opportunity.requirements.slice(0, 3).join(', ')}</p>
 </div>
 )}
 {(opportunity.deliverables || []).length > 0 && (
 <div>
 <p className="font-semibold text-gray-900">Deliverables</p>
 <p>{(opportunity.deliverables ?? []).slice(0, 3).join(', ')}</p>
 </div>
 )}
 </div>
 )}

 {false && applicants.length > 0 && (
 <div className="mt-4 border-t border-gray-100 pt-4">
 <h4 className="text-sm font-semibold text-gray-900 mb-3">Applicants</h4>
 <div className="space-y-3">
 {applicants.map((application) => {
 const submission = getApplicationSubmission(application.id);
 const review = parseCareerGrowthReview(application.recruiter_notes);
 const progress = application.status === 'completed' || application.status === 'rejected' ? 100 : submission ? 66 : ['accepted', 'assigned', 'in_progress'].includes(application.status) ? 33 : 12;
 const canDecideApplication = ['applied', 'reviewing', 'screening', 'shortlisted'].includes(application.status);
 const canReviewSubmission = Boolean(submission) && !['completed', 'rejected'].includes(application.status);

 return (
 <div key={application.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
 <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <p className="text-sm font-semibold text-slate-950">
 {application.candidate_profile?.full_name || application.candidate_profile?.email || 'Candidate'}
 </p>
 <Badge className={
 application.status === 'accepted' || application.status === 'assigned'
 ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
 : application.status === 'rejected'
 ? 'border-red-200 bg-red-50 text-red-700'
 : application.status === 'completed'
 ? 'border-blue-200 bg-blue-50 text-blue-700'
 : 'border-slate-200 bg-slate-50 text-slate-700'
 } variant="outline">
 {application.status.replace('_', ' ')}
 </Badge>
 </div>
 <p className="mt-1 text-xs text-slate-500">
 Applied {new Date(application.created_at).toLocaleDateString()}
 </p>
 <div className="mt-3 max-w-md">
 <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-500">
 <span>Applied</span>
 <span>Assigned</span>
 <span>Submitted</span>
 <span>Completed</span>
 </div>
 <div className="h-2 overflow-hidden rounded-full bg-slate-100">
 <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
 </div>
 </div>
 {submission && (
 <div className="mt-3 space-y-1 rounded-md border border-blue-100 bg-white p-3 text-xs text-slate-600">
 <p className="font-semibold text-slate-900">Submitted work</p>
 {submission.submission_text && <p>{submission.submission_text}</p>}
 {submission.submission_url && (
 <a href={submission.submission_url} target="_blank" rel="noreferrer" className="text-blue-700 underline">
 Open project link
 </a>
 )}
 {submission.file_url && (
 <button type="button" onClick={() => openSubmissionFile(submission.file_url!)} className="block text-blue-700 underline">
 Open attached file
 </button>
 )}
 </div>
 )}
 {review.score !== undefined && (
 <p className="mt-2 text-xs font-semibold text-emerald-700">Score: {review.score}% - Certificate issued</p>
 )}
 </div>
 <div className="flex flex-col gap-2 sm:min-w-[220px]">
 {canDecideApplication && (
 <Button size="sm" onClick={() => acceptGrowthApplication(application)} className="bg-emerald-600 text-white hover:bg-emerald-700">
 Assign Candidate
 </Button>
 )}
 {canReviewSubmission && (
 <div className="flex gap-2">
 <Input
 type="number"
 min="0"
 max="100"
 placeholder="Score"
 value={scoreByApplicationId[application.id] || ''}
 onChange={(event) => setScoreByApplicationId((current) => ({ ...current, [application.id]: event.target.value }))}
 className="bg-white"
 />
 <Button size="sm" onClick={() => reviewGrowthApplication(application.id)}>
 Approve
 </Button>
 </div>
 )}
 {canDecideApplication && (
 <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => rejectGrowthApplication(application)}>
 Reject
 </Button>
 )}
 {canReviewSubmission && (
 <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => rejectGrowthApplication(application)}>
 Reject Submission
 </Button>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>
 );
 })}
 </div>
 ) : visibleApplicationOpportunities.length === 0 ? (
 <div className="text-center py-10">
 <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
 <p className="text-sm text-gray-500">No applications yet</p>
 </div>
 ) : (
 <div className="space-y-4">
 {visibleApplicationOpportunities.map((opportunity) => {
 const applicants = growthApplications.filter((application) => application.opportunity_id === opportunity.id);

 return (
 <div key={opportunity.id} className="rounded-xl border border-gray-100 bg-white p-5">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="flex-1">
 <div className="flex flex-wrap items-center gap-2 mb-2">
 <h3 className="text-lg font-bold text-gray-900">{opportunity.title}</h3>
 <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">{label}</Badge>
 <Badge variant="secondary">{applicants.length} application{applicants.length === 1 ? '' : 's'}</Badge>
 </div>
 <p className="text-sm text-gray-600 line-clamp-2">{opportunity.description}</p>
 </div>
 <Button variant="outline" onClick={() => setExpandedGrowthId((current) => current === opportunity.id ? null : opportunity.id)}>
 <Eye className="w-4 h-4 mr-2" />
 View Applications
 </Button>
 </div>

 {expandedGrowthId === opportunity.id && (
 <div className="mt-4 border-t border-gray-100 pt-4">
 {applicants.length === 0 ? (
 <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
 No candidates have applied to this program yet.
 </div>
 ) : (
 <div className="space-y-3">
 {applicants.map((application) => {
 const submission = getApplicationSubmission(application.id);
 const review = parseCareerGrowthReview(application.recruiter_notes);
 const progress = application.status === 'completed' || application.status === 'rejected' ? 100 : submission ? 66 : ['accepted', 'assigned', 'in_progress'].includes(application.status) ? 33 : 12;
 const canDecideApplication = ['applied', 'reviewing', 'screening', 'shortlisted'].includes(application.status);
 const canReviewSubmission = Boolean(submission) && !['completed', 'rejected'].includes(application.status);

 return (
 <div key={application.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
 <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <p className="text-sm font-semibold text-slate-950">
 {application.candidate_profile?.full_name || application.candidate_profile?.email || 'Candidate'}
 </p>
 <Badge className={
 application.status === 'accepted' || application.status === 'assigned'
 ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
 : application.status === 'rejected'
 ? 'border-red-200 bg-red-50 text-red-700'
 : application.status === 'completed'
 ? 'border-blue-200 bg-blue-50 text-blue-700'
 : 'border-slate-200 bg-slate-50 text-slate-700'
 } variant="outline">
 {application.status.replace('_', ' ')}
 </Badge>
 </div>
 <p className="mt-1 text-xs text-slate-500">
 Applied {new Date(application.created_at).toLocaleDateString()}
 </p>
 <div className="mt-3 max-w-md">
 <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-500">
 <span>Applied</span>
 <span>Assigned</span>
 <span>Submitted</span>
 <span>Completed</span>
 </div>
 <div className="h-2 overflow-hidden rounded-full bg-slate-100">
 <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
 </div>
 </div>
 {submission && (
 <div className="mt-3 space-y-1 rounded-md border border-blue-100 bg-white p-3 text-xs text-slate-600">
 <p className="font-semibold text-slate-900">Submitted work</p>
 {submission.submission_text && <p>{submission.submission_text}</p>}
 {submission.submission_url && (
 <a href={submission.submission_url} target="_blank" rel="noreferrer" className="text-blue-700 underline">
 Open project link
 </a>
 )}
 {submission.file_url && (
 <button type="button" onClick={() => openSubmissionFile(submission.file_url!)} className="block text-blue-700 underline">
 Open attached file
 </button>
 )}
 </div>
 )}
 {review.score !== undefined && (
 <p className="mt-2 text-xs font-semibold text-emerald-700">Score: {review.score}% - Certificate issued</p>
 )}
 </div>
 <div className="flex flex-col gap-2 sm:min-w-[220px]">
 {canDecideApplication && (
 <Button size="sm" onClick={() => acceptGrowthApplication(application)} className="bg-emerald-600 text-white hover:bg-emerald-700">
 Assign Candidate
 </Button>
 )}
 {canReviewSubmission && (
 <div className="flex gap-2">
 <Input
 type="number"
 min="0"
 max="100"
 placeholder="Score"
 value={scoreByApplicationId[application.id] || ''}
 onChange={(event) => setScoreByApplicationId((current) => ({ ...current, [application.id]: event.target.value }))}
 className="bg-white"
 />
 <Button size="sm" onClick={() => reviewGrowthApplication(application.id)}>
 Approve
 </Button>
 </div>
 )}
 {canDecideApplication && (
 <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => rejectGrowthApplication(application)}>
 Reject
 </Button>
 )}
 {canReviewSubmission && (
 <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => rejectGrowthApplication(application)}>
 Reject Submission
 </Button>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 </div>
 );
 }

 return (
 <div className={dashboardTheme.page}>
 <div className="max-w-7xl mx-auto px-6 py-8">
 <div className="flex items-center gap-4 mb-6">
 <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
 <ArrowLeft className="w-4 h-4" />
 Back to Dashboard
 </Button>
 <div>
<h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
  <p className="text-gray-600">Manage all your posted jobs in one place</p>
 </div>
 </div>

 <Card className="border border-gray-100 shadow-sm bg-white">
 <CardHeader>
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div>
<CardTitle className="flex items-center gap-2 text-gray-900">
  <Briefcase className="w-5 h-5 text-emerald-600" />
  Your Jobs
  </CardTitle>
  <p className="text-sm text-gray-500 mt-1">
  {jobs.length} job{jobs.length === 1? '': 's'} saved
  </p>
  </div>

  <Button onClick={openCreateProject} className="bg-emerald-600 hover:bg-emerald-700 text-white">
  <Plus className="w-4 h-4 mr-2" />
  Post New Job
  </Button>
 </div>
 </CardHeader>

 <CardContent>
 {isLoading? (
<div className="py-16 flex flex-col items-center justify-center text-center">
  <Loader className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
  <p className="text-gray-600">Loading jobs...</p>
  </div>
  ): jobs.length === 0? (
  <div className="text-center py-16">
  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
  <Briefcase className="w-8 h-8 text-emerald-600" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs yet</h3>
  <p className="text-gray-500 mb-6">Post your first job to start hiring top talent</p>
  <Button onClick={openCreateProject} className="bg-emerald-600 hover:bg-emerald-700 text-white">
  <Plus className="w-4 h-4 mr-2" />
  Post New Job
  </Button>
  </div>
 ): (
 <div className="space-y-4">
 {jobs.map((job) => (
 <div key={job.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all bg-white">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="flex-1">
 <div className="flex items-center gap-3 flex-wrap mb-2">
 <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
 <Badge className={job.status === 'published'? 'bg-emerald-100 text-emerald-800 border border-emerald-200': 'bg-gray-100 text-gray-800 border border-gray-200'}>
 {job.status || 'published'}
 </Badge>
 </div>

 <p className="text-gray-600 line-clamp-2 mb-4">
 {job.description || 'No description added'}
 </p>

 <div className="flex flex-wrap gap-2 mb-4">
 {(job.skills || []).map((skill) => (
 <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700">
 {skill}
 </Badge>
 ))}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
 <div className="flex items-center gap-2">
 <MapPin className="w-4 h-4 text-emerald-600" />
 {job.location || 'Not specified'}
 </div>
 <div className="flex items-center gap-2">
 <Users className="w-4 h-4 text-emerald-600" />
 {job.applications_count || 0} applications
 </div>
 <div className="flex items-center gap-2">
 <Calendar className="w-4 h-4 text-emerald-600" />
 {new Date(job.created_at).toLocaleDateString()}
 </div>
 </div>
 </div>

<div className="flex flex-col sm:flex-row lg:flex-col gap-2 min-w-[170px]">
  <Button variant="outline" onClick={() => onViewApplications?.({ id: job.id, title: job.title || '', description: job.description || '', skills: job.skills || [], location: job.location || '', status: job.status || 'published' })}>
  <Eye className="w-4 h-4 mr-2" />
  View Applications
  </Button>
 <Button variant="outline" onClick={() => onPostJob?.(job)}>
   <Edit className="w-4 h-4 mr-2" />
   Edit Job
   </Button>
  </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 </div>
 );
}






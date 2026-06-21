import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, CheckCircle2, Link2 } from 'lucide-react';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { jobsService } from '@/src/hirevify-app/services/jobsService';
import { toast } from 'sonner';
import { SkillMultiSelect } from './common/SkillMultiSelect';
import { dashboardTheme } from '../theme/dashboardTheme';

interface Project {
 id: string;
 title: string;
 description: string;
 skills: string[];
 budget: string;
 timeline: string;
 applications: number;
}

interface ProjectPostingFlowProps {
 onBack: () => void;
 existingProject?: Project | null;
}

export function ProjectPostingFlow({ onBack, existingProject }: ProjectPostingFlowProps) {
 const [step, setStep] = useState<'details' | 'success'>('details');
 const [projectTitle, setProjectTitle] = useState(existingProject?.title || '');
 const [projectDescription, setProjectDescription] = useState(existingProject?.description || '');
 const [skills, setSkills] = useState<string[]>(existingProject?.skills || []);
 const [budget, setBudget] = useState(existingProject?.budget || '');
 const [timeline, setTimeline] = useState(existingProject?.timeline || '');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [savedJobId, setSavedJobId] = useState<string | null>(null);
 const [linkToJobId, setLinkToJobId] = useState<string>('');
 const [recruiterJobs, setRecruiterJobs] = useState<{ id: string; title: string; has_project: boolean }[]>([]);
 const [isLoadingJobs, setIsLoadingJobs] = useState(false);

 const isEditing =!!existingProject;

 useEffect(() => {
 const loadRecruiterJobs = async () => {
 try {
 setIsLoadingJobs(true);
 const supabase = createSupabaseBrowserClient();
 const { data: authData } = await supabase.auth.getUser();
 if (!authData?.user?.id) return;

 const { data: profileRow } = await supabase
 .from('profiles')
 .select('id')
 .eq('auth_user_id', authData.user.id)
 .maybeSingle();
 if (!profileRow?.id) return;

 const { data, error } = await jobsService.getRecruiterJobs(profileRow.id);
 if (error) {
 console.warn('Could not load recruiter jobs for project link', error);
 return;
 }
 setRecruiterJobs(
 (data || []).map((j) => ({ id: j.id, title: j.title, has_project: Boolean(j.has_project) }))
 );
 } catch (err) {
 console.warn('Could not load recruiter jobs for project link', err);
 } finally {
 setIsLoadingJobs(false);
 }
 };
 loadRecruiterJobs();
 }, []);

 const parseBudgetRange = (value: string) => {
 const cleaned = value.replace(/,/g, '');
 const numbers = cleaned.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
 const lowerValue = value.toLowerCase();

 let currency = 'USD';
 if (lowerValue.includes('inr') || lowerValue.includes('rs')) currency = 'INR';
 if (lowerValue.includes('eur')) currency = 'EUR';
 if (lowerValue.includes('gbp')) currency = 'GBP';
 if (lowerValue.includes('qar')) currency = 'QAR';

 const min = numbers[0]?? null;
 const max = numbers[1]?? min;

 return { min, max, currency };
 };

 const saveProjectToDatabase = async () => {
 const supabase = createSupabaseBrowserClient();

 const { data: authData, error: authError } = await supabase.auth.getUser();

 if (authError ||!authData?.user?.id) {
 throw new Error('No active Supabase login found. Please logout and login again.');
 }

 const { data: profileRow, error: profileError } = await supabase.from('profiles').select('id, role, company_name').eq('auth_user_id', authData.user.id).maybeSingle();

 if (profileError) {
 throw new Error(profileError.message || 'Failed to find recruiter profile.');
 }

 if (!profileRow?.id) {
 throw new Error('Main profile row not found. Please complete recruiter profile first.');
 }

 if (profileRow.role!== 'recruiter') {
 throw new Error('Only recruiter accounts can post projects.');
 }

 const { data: recruiterProfile } = await supabase.from('recruiter_profiles').select('id, company_name').eq('id', profileRow.id).maybeSingle();

 const { min, max, currency } = parseBudgetRange(budget);

 // If the recruiter picked an existing job, attach this project to that job
 // (update that job's row with has_project=true + project_* fields) instead
 // of creating a brand-new freelance job row.
 if (linkToJobId) {
 const updatePayload: Record<string, any> = {
 has_project: true,
 project_title: projectTitle.trim(),
 project_description: projectDescription.trim(),
 project_skills: skills,
 project_timeline: timeline.trim() || null,
 project_budget_range: budget.trim() || null,
 updated_at: new Date().toISOString(),
 };

 if (isEditing && existingProject?.id) {
 const { data, error } = await supabase
 .from('jobs')
 .update(updatePayload)
 .eq('id', existingProject.id)
 .select('id, title, status, created_at, updated_at')
 .single();

 if (error) {
 throw new Error(error.message || 'Failed to update project.');
 }
 if (!data?.id) {
 throw new Error('Project update did not return a saved row.');
 }
 return data;
 }

 const { data, error } = await supabase
 .from('jobs')
 .update(updatePayload)
 .eq('id', linkToJobId)
 .select('id, title, status, created_at, updated_at')
 .single();

 if (error) {
 throw new Error(error.message || 'Failed to link project to job.');
 }
 if (!data?.id) {
 throw new Error('Link did not return a saved row.');
 }
 return data;
 }

 const payload = {
 recruiter_id: profileRow.id,
 title: projectTitle.trim(),
 company_name: recruiterProfile?.company_name || profileRow.company_name || 'Company',
 description: projectDescription.trim(),
 requirements: [`Timeline: ${timeline.trim()}`],
 skills,
 location: 'Not specified',
 job_type: 'freelance',
 experience_level: 'mid',
 remote_type: 'remote',
 salary_min: min,
 salary_max: max,
 currency,
 budget_min: min,
 budget_max: max,
 budget_currency: currency,
 status: 'published',
 applications_count: 0,
 views_count: 0,
 has_assessment: false,
 has_video_challenge: false,
 video_challenge_description: null,
 updated_at: new Date().toISOString(),
 };

 if (isEditing && existingProject?.id) {
 const { data, error } = await supabase.from('jobs').update(payload).eq('id', existingProject.id).select('id, title, status, created_at, updated_at').single();

 if (error) {
 throw new Error(error.message || 'Failed to update project.');
 }

 if (!data?.id) {
 throw new Error('Project update did not return a saved row.');
 }

 return data;
 }

 const { data, error } = await supabase.from('jobs').insert(payload).select('id, title, status, created_at, updated_at').single();

 if (error) {
 throw new Error(error.message || 'Failed to post project.');
 }

 if (!data?.id) {
 throw new Error('Project post did not return a saved row.');
 }

 return data;
 };

 const handleSubmit = async () => {
 if (!projectTitle.trim() ||!projectDescription.trim() || skills.length === 0 ||!budget.trim() ||!timeline.trim()) {
 toast.error('Please complete all project fields before posting.');
 return;
 }

 setIsSubmitting(true);

 try {
 const savedJob = await saveProjectToDatabase();
 setSavedJobId(savedJob.id);
 toast.success(isEditing? 'Project saved': 'Project posted');
 setStep('success');
 } catch (error) {
 console.error('Failed to save project:', error);
 toast.error(error instanceof Error? error.message: 'Failed to save project');
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div className={dashboardTheme.page}>
 {/* Header */}
 <header className="border-b border-border bg-card">
 <div className="max-w-4xl mx-auto px-6 py-4">
 <div className="flex items-center space-x-4">
 <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
 <ArrowLeft className="w-5 h-5" />
 </Button>
 <div className="flex items-center space-x-3">
 <img src={(hirevifyLogo as any).src?? hirevifyLogo} alt="HireVify" className="h-16" />
 </div>
 </div>
 </div>
 </header>

 {/* Main Content */}
 <main className="max-w-3xl mx-auto px-6 py-8">
 {step === 'details' && (
 <Card className="border border-border">
 <CardHeader>
 <CardTitle className="text-foreground text-2xl">
 {isEditing? 'Edit Project': 'Post a New Project'}
 </CardTitle>
 <p className="text-muted-foreground">
 {isEditing? 'Update your project details and requirements': 'Define your project requirements to attract the right candidates'
 }
 </p>
 </CardHeader>
 <CardContent className="space-y-8">
 {/* Link to existing job (optional) */}
 <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
 <div className="flex items-center gap-2">
 <Link2 className="h-4 w-4 text-primary" />
 <Label htmlFor="link-to-job" className="text-foreground text-base font-semibold">
 Link to an existing job (optional)
 </Label>
 </div>
 <p className="text-xs text-muted-foreground">
 Choose a job to attach this project to. Candidates browsing that job will see the project details. Leave blank to post a standalone project.
 </p>
 <select
 id="link-to-job"
 value={linkToJobId}
 onChange={(e) => setLinkToJobId(e.target.value)}
 className="w-full rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground"
 >
 <option value="">
 {isLoadingJobs ? 'Loading jobs…' : '— Standalone project (no job) —'}
 </option>
 {recruiterJobs.map((job) => (
 <option key={job.id} value={job.id}>
 {job.title}
 {job.has_project ? ' • already has a project' : ''}
 </option>
 ))}
 </select>
 {linkToJobId && (
 <p className="text-xs text-amber-700">
 This project will be attached to the selected job and replace any existing project on it.
 </p>
 )}
 </div>

 {/* Project Title */}
 <div className="space-y-3">
 <Label htmlFor="project-title" className="text-foreground text-lg">Project Title</Label>
 <Input
 id="project-title"
 value={projectTitle}
 onChange={(e) => setProjectTitle(e.target.value)}
 placeholder="e.g. E-commerce React Frontend Development"
 className="bg-input-background border-border text-foreground text-lg p-4 h-auto"
 />
 </div>
 
 {/* Project Description */}
 <div className="space-y-3">
 <Label htmlFor="project-description" className="text-foreground text-lg">Project Description</Label>
 <Textarea
 id="project-description"
 value={projectDescription}
 onChange={(e) => setProjectDescription(e.target.value)}
 placeholder="Describe the project scope, deliverables, and key requirements..."
 rows={6}
 className="bg-input-background border-border text-foreground resize-none"
 />
 </div>

 {/* Skills Required */}
 <div className="space-y-3">
 <Label className="text-foreground text-lg">Skills Required</Label>
 <SkillMultiSelect value={skills} onChange={setSkills} placeholder="Add required skill" />
 </div>

 {/* Project Details Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-3">
 <Label htmlFor="budget" className="text-foreground text-lg">Budget Range</Label>
 <Input
 id="budget"
 value={budget}
 onChange={(e) => setBudget(e.target.value)}
 placeholder="e.g. $3,000 - $5,000"
 className="bg-input-background border-border text-foreground"
 />
 </div>

 <div className="space-y-3">
 <Label htmlFor="timeline" className="text-foreground text-lg">Timeline</Label>
 <Input
 id="timeline"
 value={timeline}
 onChange={(e) => setTimeline(e.target.value)}
 placeholder="e.g. 4-6 weeks"
 className="bg-input-background border-border text-foreground"
 />
 </div>
 </div>

 {/* Submit Button */}
 <div className="pt-6">
 <Button
 onClick={handleSubmit}
 disabled={isSubmitting ||!projectTitle.trim() ||!projectDescription.trim() || skills.length === 0 ||!budget.trim() ||!timeline.trim()}
 className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg"
 >
 {isSubmitting
 ? 'Saving to Database...'
 : linkToJobId
 ? 'Link Project to Selected Job'
 : isEditing
 ? 'Update Project'
 : 'Post Project'}
 </Button>
 </div>
 </CardContent>
 </Card>
 )}

 {step === 'success' && (
 <Card className="border border-border">
 <CardContent className="pt-8">
 <div className="text-center space-y-6">
 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
 <CheckCircle2 className="w-10 h-10 text-green-600" />
 </div>
 
 <div>
 <h2 className="text-2xl text-foreground mb-3">
 {isEditing
 ? 'Project Updated!'
 : linkToJobId
 ? 'Project Linked to Job!'
 : 'Project Posted Successfully!'}
 </h2>
 <p className="text-muted-foreground text-lg">
 {isEditing
 ? 'Your project has been updated and is now live with the new details.'
 : linkToJobId
 ? 'Your project is now attached to the selected job. Candidates browsing that job will see the project details.'
 : 'Your project is now live and candidates can start applying. You\'ll receive notifications as applications come in.'}
 </p>
 </div>

 {/* Project Summary */}
 <div className="bg-muted rounded-xl p-6 text-left max-w-md mx-auto">
 <h3 className="text-foreground mb-3">{projectTitle}</h3>
 {savedJobId && <p className="text-xs text-muted-foreground mb-3">Saved Job ID: {savedJobId}</p>}
 <div className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Skills:</span>
 <span className="text-foreground">{skills.length} required</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Budget:</span>
 <span className="text-foreground">{budget}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Timeline:</span>
 <span className="text-foreground">{timeline}</span>
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <Button 
 variant="outline" 
 onClick={onBack}
 className="px-6 py-3 border-border text-foreground hover:bg-muted"
 >
 Back to Dashboard
 </Button>
 <Button
 onClick={() => {
 setStep('details');
 setLinkToJobId('');
 }}
 className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
 >
 Post Another Project
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 )}
 </main>
 </div>
 );
}








import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, CheckCircle2, Briefcase, Plus, MapPin, DollarSign, Clock, X, Paperclip, FileText, Trash2 } from 'lucide-react';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { toast } from 'sonner';
import { SkillMultiSelect } from './common/SkillMultiSelect';
import { dashboardTheme } from '../theme/dashboardTheme';
import { useAuth } from './AuthProvider';

interface JobData {
  recruiter_id?: string | null;
  id?: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  job_type: 'fulltime' | 'contract';
  experience_level: 'entry' | 'mid' | 'senior' | 'lead';
  location: string;
  remote_type: 'remote' | 'onsite' | 'hybrid';
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  status: 'draft' | 'published' | 'closed' | 'paused';
  has_project?: boolean;
  project_title?: string | null;
  project_description?: string | null;
project_skills?: string[];
  project_timeline?: string | null;
  project_budget_range?: string | null;
  project_attachment_url?: string | null;
  project_attachment_name?: string | null;
  project_attachment_size?: number | null;
  project_attachment_type?: string | null;
}

interface ProjectAttachmentMeta {
  url: string;
  name: string;
  size: number;
  type: string;
}


type ActiveProjectOption = {
  id: string;
  title: string;
  status?: string | null;
  project_title?: string | null;
  project_description?: string | null;
  project_skills?: string[] | null;
  project_timeline?: string | null;
  project_budget_range?: string | null;
  project_attachment_url?: string | null;
  project_attachment_name?: string | null;
  project_attachment_size?: number | null;
  project_attachment_type?: string | null;
};
interface JobPostingFlowProps {
  onBack: () => void;
  existingJob?: JobData | null;
}

export function JobPostingFlow({ onBack, existingJob }: JobPostingFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedJobId, setSavedJobId] = useState<string | null>(null);
  const [recruiterProfile, setRecruiterProfile] = useState<{ id: string; company_name: string | null } | null>(null);

  // Job fields
  const [jobTitle, setJobTitle] = useState(existingJob?.title || '');
  const [jobDescription, setJobDescription] = useState(existingJob?.description || '');
  const [jobRequirements, setJobRequirements] = useState<string[]>(existingJob?.requirements || []);
  const [requirementInput, setRequirementInput] = useState('');
  const [skills, setSkills] = useState<string[]>(existingJob?.skills || []);
  const [jobType, setJobType] = useState<JobData['job_type']>(
    (existingJob?.job_type === 'fulltime' || existingJob?.job_type === 'contract') 
      ? existingJob.job_type 
      : 'fulltime'
  );
  const [experienceLevel, setExperienceLevel] = useState<JobData['experience_level']>(existingJob?.experience_level || 'mid');
  const [location, setLocation] = useState(existingJob?.location || '');
  const [remoteType, setRemoteType] = useState<JobData['remote_type']>(existingJob?.remote_type || 'remote');
  const [budgetMin, setBudgetMin] = useState<string>(
    existingJob?.budget_min != null ? String(existingJob.budget_min) : ''
  );
  const [budgetMax, setBudgetMax] = useState<string>(
    existingJob?.budget_max != null ? String(existingJob.budget_max) : ''
  );
  const [budgetCurrency, setBudgetCurrency] = useState<string>(existingJob?.budget_currency || 'USD');
  const [status, setStatus] = useState<JobData['status']>(existingJob?.status || 'published');

// Add Project for this Job
  const [showProjectSection, setShowProjectSection] = useState<boolean>(false);
  const [projectTitle, setProjectTitle] = useState(existingJob?.project_title || '');
  const [projectDescription, setProjectDescription] = useState(existingJob?.project_description || '');
  const [projectSkills, setProjectSkills] = useState<string[]>(existingJob?.project_skills || []);
  const [projectTimeline, setProjectTimeline] = useState(existingJob?.project_timeline || '');
  const [projectAttachment, setProjectAttachment] = useState<ProjectAttachmentMeta | null>(
    existingJob?.project_attachment_url
      ? {
          url: existingJob.project_attachment_url,
          name: existingJob.project_attachment_name || 'attachment',
          size: existingJob.project_attachment_size || 0,
          type: existingJob.project_attachment_type || 'application/octet-stream',
        }
      : null
  );
  const [projectAttachmentFile, setProjectAttachmentFile] = useState<File | null>(null);
  const [projectAttachmentUploading, setProjectAttachmentUploading] = useState(false);
  const [activeProjects, setActiveProjects] = useState<ActiveProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [extraAttachedProjects, setExtraAttachedProjects] = useState<ActiveProjectOption[]>([]);
  const [removedExtraProjectIds, setRemovedExtraProjectIds] = useState<string[]>([]);

  const isEditing = Boolean(existingJob?.id);
  useEffect(() => {
    const loadActiveProjectsForJobEdit = async () => {
      if (!isEditing) return;

      const supabase = createSupabaseBrowserClient();

      let recruiterId = existingJob?.recruiter_id || null;

      if (!recruiterId) {
        const { data: authData } = await supabase.auth.getUser();

        if (authData.user?.id) {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('id')
            .eq('auth_user_id', authData.user.id)
            .maybeSingle();

          recruiterId = profileRow?.id || null;
        }
      }

// Query only the columns that always exist in the schema.
      // The new attachment columns will be loaded once the migration is applied.
      // The new attachment columns will be loaded once the migration is applied.
      let query = supabase
        .from('jobs')
        .select('id, title, status, job_type, recruiter_id, project_title, project_description, project_skills, project_timeline, project_budget_range')
        .eq('has_project', true)
        .eq('job_type', 'freelance')
        .eq('status', 'published');

      if (existingJob?.id) {
        query = query.neq('id', existingJob.id);
      }

      if (recruiterId) {
        query = query.eq('recruiter_id', recruiterId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        // Typically means the schema hasn't been updated yet — ignore, project list will be empty.
        return;
      }

      setActiveProjects((data || []) as unknown as ActiveProjectOption[]);
    };

    loadActiveProjectsForJobEdit();
  }, [isEditing, existingJob?.id, existingJob?.recruiter_id]);

  const attachProjectFromDropdown = (projectId: string) => {
    const selectedProject = activeProjects.find((project) => project.id === projectId);
    setSelectedProjectId('');

    if (!selectedProject) return;

    const alreadyMainProject =
      projectTitle &&
      (selectedProject.project_title || selectedProject.title) === projectTitle;

    const alreadyExtraProject = extraAttachedProjects.some((project) => project.id === selectedProject.id);

    if (alreadyMainProject || alreadyExtraProject) {
      return;
    }

    // If this job already has a project, keep it and add the selected one as an extra project.
    if (projectTitle || showProjectSection) {
      setExtraAttachedProjects((prev) => [...prev, selectedProject]);
      setRemovedExtraProjectIds((prev) => prev.filter((id) => id !== selectedProject.id));
      return;
    }

// If no project exists yet, make the selected project the main associated project.
    setShowProjectSection(true);
    setProjectTitle(selectedProject.project_title || selectedProject.title || '');
    setProjectDescription(selectedProject.project_description || '');
    setProjectSkills(Array.isArray(selectedProject.project_skills) ? selectedProject.project_skills : []);
    setProjectTimeline(selectedProject.project_timeline || '');
    setProjectAttachment(
      selectedProject.project_attachment_url
        ? {
            url: selectedProject.project_attachment_url,
            name: selectedProject.project_attachment_name || 'attachment',
            size: selectedProject.project_attachment_size || 0,
            type: selectedProject.project_attachment_type || 'application/octet-stream',
          }
        : null
    );
    setProjectAttachmentFile(null);
  };

  const removeExtraAttachedProject = (projectId: string) => {
    setExtraAttachedProjects((prev) => prev.filter((project) => project.id !== projectId));
    setRemovedExtraProjectIds((prev) => [...new Set([...prev, projectId])]);
  };

const removeAssociatedProject = () => {
    setSelectedProjectId('');
    setShowProjectSection(false);
    setProjectTitle('');
    setProjectDescription('');
    setProjectSkills([]);
    setProjectTimeline('');
    setProjectAttachment(null);
    setProjectAttachmentFile(null);
  };

  // Project attachment (max 20 MB, any file type)
  const MAX_PROJECT_ATTACHMENT_SIZE = 20 * 1024 * 1024;
  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let value = bytes;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i += 1;
    }
    return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  };

  const handleProjectAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so picking the same file twice still fires onChange
    event.target.value = '';

    if (!file) return;

    if (file.size > MAX_PROJECT_ATTACHMENT_SIZE) {
      toast.error(`File is too large. Maximum size is 20 MB.`);
      return;
    }

    setProjectAttachmentFile(file);
    setProjectAttachment({
      url: '', // will be filled after upload on save
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
    });
  };

  const removeProjectAttachment = () => {
    setProjectAttachment(null);
    setProjectAttachmentFile(null);
  };

  // When editing a job, switch from viewing the attached project to the project form
  const handleCreateNewProject = () => {
    // Clear fields so the form is ready for a fresh project entry
    setProjectTitle('');
    setProjectDescription('');
    setProjectSkills([]);
    setProjectTimeline('');
    setProjectAttachment(null);
    setProjectAttachmentFile(null);
    setShowProjectSection(true);
  };

  // Cancel creating/editing the project and collapse the form (keeps the existing associated project)
  const handleCancelProjectEdit = () => {
    // If there was an existing project attached to the job, restore its data
    if (existingJob?.has_project) {
      setProjectTitle(existingJob.project_title || '');
      setProjectDescription(existingJob.project_description || '');
      setProjectSkills(existingJob.project_skills || []);
      setProjectTimeline(existingJob.project_timeline || '');
      setProjectAttachment(
        existingJob.project_attachment_url
          ? {
              url: existingJob.project_attachment_url,
              name: existingJob.project_attachment_name || 'attachment',
              size: existingJob.project_attachment_size || 0,
              type: existingJob.project_attachment_type || 'application/octet-stream',
            }
          : null
      );
      setProjectAttachmentFile(null);
    } else {
      // No project ever existed — clear everything and collapse
      setProjectTitle('');
      setProjectDescription('');
      setProjectSkills([]);
      setProjectTimeline('');
      setProjectAttachment(null);
      setProjectAttachmentFile(null);
    }
    setShowProjectSection(false);
  };

  useEffect(() => {
    const loadRecruiterProfile = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user?.id) return;

        const { data: profileRow } = await supabase
          .from('profiles')
          .select('id, role, company_name')
          .eq('auth_user_id', authData.user.id)
          .maybeSingle();

        if (profileRow) {
          const { data: recruiterRow } = await supabase
            .from('recruiter_profiles')
            .select('id, company_name')
            .eq('id', profileRow.id)
            .maybeSingle();

          setRecruiterProfile({
            id: profileRow.id,
            company_name: recruiterRow?.company_name || profileRow.company_name || null,
          });
        }
      } catch (err) {
        console.warn('Could not load recruiter profile for Post Job form', err);
      }
    };

    loadRecruiterProfile();
  }, []);

  const addRequirement = () => {
    const trimmed = requirementInput.trim();
    if (!trimmed) return;
    if (jobRequirements.includes(trimmed)) {
      setRequirementInput('');
      return;
    }
    setJobRequirements([...jobRequirements, trimmed]);
    setRequirementInput('');
  };

  const removeRequirement = (req: string) => {
    setJobRequirements(jobRequirements.filter((r) => r !== req));
  };

  const toggleProjectSection = () => {
    setShowProjectSection((prev) => !prev);
  };

  const saveJobToDatabase = async () => {
    const supabase = createSupabaseBrowserClient();

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
      throw new Error('No active Supabase login found. Please logout and login again.');
    }

    let profileRow: { id: string; role: string; company_name: string | null } | null =
      recruiterProfile
        ? { ...recruiterProfile, role: 'recruiter' }
        : null;

    if (!profileRow) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, company_name')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();
      if (error) throw new Error(error.message || 'Failed to find recruiter profile.');
      profileRow = data as any;
    }

    if (!profileRow?.id) {
      throw new Error('Main profile row not found. Please complete recruiter profile first.');
    }

    if (profileRow.role !== 'recruiter') {
      throw new Error('Only recruiter accounts can post jobs.');
    }

    const { data: recruiterProfileRow } = await supabase
      .from('recruiter_profiles')
      .select('id, company_name')
      .eq('id', profileRow.id)
      .maybeSingle();

    const companyName =
      recruiterProfileRow?.company_name || profileRow.company_name || 'Company';

    const min = budgetMin.trim() === '' ? null : Number(budgetMin);
    const max = budgetMax.trim() === '' ? null : Number(budgetMax);

const hasProject = Boolean(
      showProjectSection && projectTitle.trim() && projectDescription.trim()
    );

    // Upload the new attachment file (if any) BEFORE saving the job row,
    // so we can persist the resulting public URL on the same write.
    let resolvedAttachment: ProjectAttachmentMeta | null = hasProject ? projectAttachment : null;
    if (hasProject && projectAttachmentFile) {
      setProjectAttachmentUploading(true);
      try {
        const safeName = projectAttachmentFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const objectPath = `${profileRow.id}/pending/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('job-project-attachments')
          .upload(objectPath, projectAttachmentFile, {
            contentType: projectAttachmentFile.type || 'application/octet-stream',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message || 'Failed to upload project attachment.');
        }

        const { data: urlData } = supabase.storage
          .from('job-project-attachments')
          .getPublicUrl(objectPath);

        resolvedAttachment = {
          url: urlData.publicUrl,
          name: projectAttachmentFile.name,
          size: projectAttachmentFile.size,
          type: projectAttachmentFile.type || 'application/octet-stream',
        };
      } catch (err) {
        setProjectAttachmentUploading(false);
        throw err instanceof Error ? err : new Error('Failed to upload project attachment.');
      }
      setProjectAttachmentUploading(false);
    }

    const payload: Record<string, any> = {
      recruiter_id: profileRow.id,
      title: jobTitle.trim(),
      company_name: companyName,
      description: jobDescription.trim(),
      requirements: jobRequirements,
      skills,
      location: location.trim() || 'Not specified',
      job_type: jobType,
      experience_level: experienceLevel,
      remote_type: remoteType,
      budget_min: min,
      budget_max: max,
      budget_currency: budgetCurrency,
      status,
      has_project: hasProject,
      project_title: hasProject ? projectTitle.trim() : null,
      project_description: hasProject ? projectDescription.trim() : null,
      project_skills: hasProject ? projectSkills : [],
      project_timeline: hasProject ? projectTimeline.trim() || null : null,
      project_attachment_url: hasProject && resolvedAttachment ? resolvedAttachment.url : null,
      project_attachment_name: hasProject && resolvedAttachment ? resolvedAttachment.name : null,
      project_attachment_size: hasProject && resolvedAttachment ? resolvedAttachment.size : null,
      project_attachment_type: hasProject && resolvedAttachment ? resolvedAttachment.type : null,
      updated_at: new Date().toISOString(),
    };

    if (isEditing && existingJob?.id) {
      const { data, error } = await supabase
        .from('jobs')
        .update(payload)
        .eq('id', existingJob.id)
        .select('id, title, status, created_at, updated_at')
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update job.');
      }
      if (!data?.id) {
        throw new Error('Job update did not return a saved row.');
      }
      return data as { id: string };
    }

    const insertPayload = {
      ...payload,
      applications_count: 0,
      views_count: 0,
      has_assessment: false,
      has_video_challenge: false,
      video_challenge_description: null,
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert(insertPayload)
      .select('id, title, status, created_at, updated_at')
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to post job.');
    }
    if (!data?.id) {
      throw new Error('Job post did not return a saved row.');
    }
    return data as { id: string };
  };

  const handleSubmit = async () => {
    if (!jobTitle.trim()) {
      toast.error('Please enter a job title.');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description.');
      return;
    }
    if (skills.length === 0) {
      toast.error('Please add at least one required skill.');
      return;
    }
    if (!location.trim()) {
      toast.error('Please enter a job location.');
      return;
    }

    // If the recruiter opened the "Add Project" sub-form, both title and
    // description are required before we let them {isEditing ? 'Save Job Changes' : showProjectSection ? '{isEditing ? 'Save Job Changes' : showProjectSection ? 'Save Project and Post Job' : 'Post Job'}' : 'Post Job'}.
    if (showProjectSection) {
      if (!projectTitle.trim()) {
        toast.error('Please enter a project title (or remove the project section).');
        return;
      }
      if (!projectDescription.trim()) {
        toast.error('Please enter a project description (or remove the project section).');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const savedJob = await saveJobToDatabase();
      setSavedJobId(savedJob.id);
      toast.success(isEditing ? 'Job updated' : 'Job posted');
      setStep('success');
    } catch (error) {
      console.error('Failed to save job:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save job');
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
              <img src={(hirevifyLogo as any).src ?? hirevifyLogo} alt="HireVify" className="h-16" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {step === 'details' && (
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">
                {isEditing ? 'Edit Job' : 'Post a New Job'}
              </CardTitle>
              <p className="text-muted-foreground">
                {isEditing
                  ? 'Update your job details and requirements'
                  : 'Define your job details to attract the right candidates. You can also attach a project for candidates to work on after selection.'}
              </p>
              {recruiterProfile?.company_name && (
                <p className="text-sm text-muted-foreground">
                  Posting as <span className="font-medium text-foreground">{recruiterProfile.company_name}</span>
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="job-title" className="text-foreground text-base">Job Title</Label>
                <Input
                  id="job-title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior React Developer"
                  className="bg-input-background border-border text-foreground"
                />
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <Label htmlFor="job-description" className="text-foreground text-base">Job Description</Label>
                <Textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Describe the role, day-to-day responsibilities, and what makes this opportunity exciting..."
                  rows={5}
                  className="bg-input-background border-border text-foreground resize-none"
                />
              </div>

              {/* Requirements list */}
              <div className="space-y-2">
                <Label className="text-foreground text-base">Requirements</Label>
                <div className="flex gap-2">
                  <Input
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRequirement();
                      }
                    }}
                    placeholder="e.g. 5+ years with React"
                    className="bg-input-background border-border text-foreground"
                  />
                  <Button type="button" variant="outline" onClick={addRequirement}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {jobRequirements.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {jobRequirements.map((req) => (
                      <span
                        key={req}
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"
                      >
                        {req}
                        <button
                          type="button"
                          onClick={() => removeRequirement(req)}
                          className="text-primary/70 hover:text-primary"
                          aria-label={`Remove ${req}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills Required */}
              <div className="space-y-2">
                <Label className="text-foreground text-base">Skills Required</Label>
                <SkillMultiSelect value={skills} onChange={setSkills} placeholder="Add required skill" />
              </div>

              {/* Job meta grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job-type" className="text-foreground text-base">Job Type</Label>
                  <select
                    id="job-type"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as JobData['job_type'])}
                    className="w-full rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="fulltime">Full-time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience-level" className="text-foreground text-base">Experience Level</Label>
                  <select
                    id="experience-level"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as JobData['experience_level'])}
                    className="w-full rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="entry">Entry</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remote-type" className="text-foreground text-base">Workplace</Label>
                  <select
                    id="remote-type"
                    value={remoteType}
                    onChange={(e) => setRemoteType(e.target.value as JobData['remote_type'])}
                    className="w-full rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-foreground text-base">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bangalore, India or Remote"
                      className="bg-input-background border-border text-foreground pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-min" className="text-foreground text-base">Budget Min</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="budget-min"
                      type="number"
                      min="0"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder="e.g. 3000"
                      className="bg-input-background border-border text-foreground pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-max" className="text-foreground text-base">Budget Max</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="budget-max"
                      type="number"
                      min="0"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder="e.g. 5000"
                      className="bg-input-background border-border text-foreground pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-currency" className="text-foreground text-base">Currency</Label>
                  <select
                    id="budget-currency"
                    value={budgetCurrency}
                    onChange={(e) => setBudgetCurrency(e.target.value)}
                    className="w-full rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                    <option value="QAR">QAR</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-foreground text-base">Publish Status</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as JobData['status'])}
                    className="w-full rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="published">Publish now</option>
                    <option value="draft">Save as draft</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              {/* Add Project for this Job - Collapsible Button */}
              <div className="rounded-lg border border-dashed border-border p-4">
                <Button
                  type="button"
                  variant={showProjectSection ? "secondary" : "outline"}
                  className={`w-full ${showProjectSection ? 'bg-primary/10 border-primary/30' : ''}`}
                  onClick={toggleProjectSection}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  {showProjectSection ? 'Remove Project' : 'Add Project for this Job'}
                </Button>

              {isEditing && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Associated Project</h3>
                      <p className="text-sm text-gray-600">
                        View the project attached to this job, remove it, or choose another active project.
                      </p>
                    </div>

                    {projectTitle && (
                      <Button type="button" variant="outline" onClick={removeAssociatedProject}>
                        Remove Project
                      </Button>
                    )}
                  </div>

                                    {extraAttachedProjects.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Extra attached projects</p>
{extraAttachedProjects.map((project) => (
                        <div key={project.id} className="flex items-start justify-between gap-3 rounded-xl border border-white bg-white p-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{project.project_title || project.title}</p>
                            {project.project_description && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{project.project_description}</p>
                            )}
                            {project.project_timeline && (
                              <p className="mt-2 text-xs text-gray-500">Timeline: {project.project_timeline}</p>
                            )}
                            {project.project_attachment_url && (
                              <p className="mt-1 text-xs text-gray-500">
                                Attachment:{' '}
                                <a
                                  href={project.project_attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {project.project_attachment_name || 'view file'}
                                </a>
                              </p>
                            )}
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeExtraAttachedProject(project.id)}>
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
{projectTitle ? (
                    <div className="mb-4 rounded-xl border border-white bg-white p-4">
                      <p className="text-sm font-semibold text-gray-900">{projectTitle}</p>
                      {projectDescription && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{projectDescription}</p>
                      )}
                      {projectTimeline && (
                        <p className="mt-2 text-xs text-gray-500">Timeline: {projectTimeline}</p>
                      )}
                      {projectAttachment && (
                        <p className="mt-1 text-xs text-gray-500">
                          Attachment:{' '}
                          <a
                            href={projectAttachment.url || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {projectAttachment.name}
                          </a>
                          {' '}({formatBytes(projectAttachment.size)})
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4 rounded-xl border border-dashed border-emerald-200 bg-white p-4 text-sm text-gray-600">
                      No project is currently attached to this job.
                    </div>
                  )}

<label className="mb-2 block text-sm font-medium text-gray-700">
                    Add project from active projects
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(event) => attachProjectFromDropdown(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">Choose active project</option>
                    {activeProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project_title || project.title}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCreateNewProject}
                    className="mt-2 w-full border-dashed text-muted-foreground hover:border-primary hover:text-foreground"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create new project
                  </Button>
                </div>
              )}


                
{showProjectSection && (
                  <div className="mt-4 space-y-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Attach a project that matched candidates will work on after being selected.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="project-title" className="text-foreground text-sm">Project Title</Label>
                        <Input
                          id="project-title"
                          value={projectTitle}
                          onChange={(e) => setProjectTitle(e.target.value)}
                          placeholder="e.g. Build e-commerce checkout flow"
                          className="bg-input-background border-border text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="project-description" className="text-foreground text-sm">Project Description</Label>
                        <Textarea
                          id="project-description"
                          value={projectDescription}
                          onChange={(e) => setProjectDescription(e.target.value)}
                          placeholder="Describe the project scope, deliverables, and key requirements..."
                          rows={4}
                          className="bg-input-background border-border text-foreground resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Project Skills</Label>
                        <SkillMultiSelect
                          value={projectSkills}
                          onChange={setProjectSkills}
                          placeholder="Add required skill for this project"
                        />
                      </div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="project-timeline" className="text-foreground text-sm">Project Timeline</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="project-timeline"
                              value={projectTimeline}
                              onChange={(e) => setProjectTimeline(e.target.value)}
                              placeholder="e.g. 4-6 weeks"
                              className="bg-input-background border-border text-foreground pl-9"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-foreground text-sm">Attachment</Label>
                          {projectAttachment ? (
                            <div className="flex items-center gap-2 rounded-md border border-border bg-input-background px-3 py-2">
                              <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <a
                                  href={projectAttachment.url || undefined}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block truncate text-sm text-foreground hover:underline"
                                  title={projectAttachment.name}
                                >
                                  {projectAttachment.name}
                                </a>
                                <p className="text-xs text-muted-foreground">
                                  {formatBytes(projectAttachment.size)}
                                  {projectAttachmentFile ? ' • ready to upload' : ''}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeProjectAttachment}
                                disabled={projectAttachmentUploading}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                aria-label="Remove attachment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <label
                              htmlFor="project-attachment"
                              className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-input-background px-3 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground"
                            >
                              <Paperclip className="w-4 h-4 shrink-0" />
                              <span className="truncate">Upload any file (max 20 MB)</span>
                              <Input
                                id="project-attachment"
                                type="file"
                                onChange={handleProjectAttachmentChange}
                                className="hidden"
                              />
                            </label>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Any file type. Max 20 MB. Optional — only attach if it helps candidates understand the work.
                          </p>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelProjectEdit}
                            disabled={isSubmitting}
                            className="w-full"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit â€” Save Project (if attached) and Post Job */}
              <div className="pt-2 space-y-3">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !jobTitle.trim() ||
                    !jobDescription.trim() ||
                    skills.length === 0 ||
                    !location.trim()
                  }
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : isEditing
                    ? 'Save Job Changes'
                    : showProjectSection && projectTitle.trim()
                    ? 'Save Project and Post Job'
                    : 'Post Job'}
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
                  <h2 className="text-2xl text-foreground mb-2">
                    {isEditing
                      ? 'Job Updated!'
                      : showProjectSection && projectTitle.trim()
                      ? 'Project Saved and Job Posted!'
                      : 'Job Posted Successfully!'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isEditing
                      ? 'Your job has been updated and is now live with the new details.'
                      : showProjectSection && projectTitle.trim()
                      ? 'Your job and attached project are now live. Candidates can see the project details on the job page and apply for the role.'
                      : 'Your job is now live and candidates can start applying. You can review applications and assign a project from the dashboard.'}
                  </p>
                </div>

                {/* Job Summary */}
                <div className="bg-muted rounded-xl p-6 text-left max-w-md mx-auto">
                  <h3 className="text-foreground mb-2">{jobTitle}</h3>
                  {savedJobId && (
                    <p className="text-xs text-muted-foreground mb-3">Saved Job ID: {savedJobId}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Skills:</span>
                      <span className="text-foreground">{skills.length} required</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-foreground">{location || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="text-foreground">{jobType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Workplace:</span>
                      <span className="text-foreground">{remoteType}</span>
                    </div>
                    {showProjectSection && projectTitle && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Project:</span>
                        <span className="text-foreground">{projectTitle}</span>
                      </div>
                    )}
                  </div>
                </div>

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
                      setSavedJobId(null);
                    }}
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Post Another Job
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

export default JobPostingFlow;







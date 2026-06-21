import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, CheckCircle2, Building2, Loader2, Users, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { DashboardPageLayout } from './shared/DashboardPageLayout';
import { dashboardTheme } from '../theme/dashboardTheme';
import type { Job } from '../types/app';
import { applicationsService } from '../services/applicationsService';
import type { Application as ServiceApplication } from '../services/applicationsService';

interface CandidateJobDetailProps {
  job: Job;
  onBack: () => void;
  onViewAssignment?: (assignmentId: string) => void;
  onApply?: (job: Job) => void;
}

const JOB_TYPE_LABELS: Record<Job['job_type'], string> = {
  fulltime: 'Full-time',
  contract: 'Contract',
  freelance: 'Freelance',
  internship: 'Internship',
};

const EXPERIENCE_LABELS: Record<Job['experience_level'], string> = {
  entry: 'Entry level',
  mid: 'Mid level',
  senior: 'Senior',
  lead: 'Lead',
};

const REMOTE_LABELS: Record<Job['remote_type'], string> = {
  remote: 'Remote',
  onsite: 'On-site',
  hybrid: 'Hybrid',
};

function formatBudget(job: Job): string | null {
  if (!job.budget_min && !job.budget_max) return null;
  const min = job.budget_min ?? job.budget_max ?? 0;
  const max = job.budget_max ?? job.budget_min ?? 0;
  const currency = job.budget_currency || 'USD';
  if (min === max) return `${currency} ${min.toLocaleString()}`;
  return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
}

export function CandidateJobDetail({ job, onBack, onViewAssignment, onApply }: CandidateJobDetailProps) {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();

  const [hasApplied, setHasApplied] = useState(false);
  const [existingApplication, setExistingApplication] = useState<ServiceApplication | null>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [existingAssignmentId, setExistingAssignmentId] = useState<string | null>(null);

  // Resolve candidate profile from auth
  const [candidateProfileId, setCandidateProfileId] = useState<string | null>(null);

  useEffect(() => {
    const loadCandidateProfile = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user?.id) {
          setIsCheckingApplication(false);
          return;
        }
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', authData.user.id)
          .maybeSingle();
        if (profileRow?.id) setCandidateProfileId(profileRow.id);
      } catch (err) {
        console.warn('Could not resolve candidate profile', err);
      }
    };
    loadCandidateProfile();
  }, [supabase]);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        if (!job.recruiter_id) return;
        const { data: recruiterProfile } = await supabase
          .from('recruiter_profiles')
          .select('company_name')
          .eq('id', job.recruiter_id)
          .maybeSingle();
        if (recruiterProfile?.company_name) {
          setCompanyName(recruiterProfile.company_name);
        }
      } catch (err) {
        console.warn('Could not resolve company name', err);
      }
    };
    loadCompany();
  }, [supabase, job.recruiter_id]);

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!candidateProfileId || !job.id) {
        setIsCheckingApplication(false);
        return;
      }
      try {
        const { hasApplied: applied, error } = await applicationsService.hasApplied(
          job.id,
          candidateProfileId
        );
        if (!error) setHasApplied(Boolean(applied));

        if (applied) {
          const { data: apps } = await applicationsService.getCandidateApplications(candidateProfileId);
          const found = (apps || []).find((a: any) => a.job_id === job.id) as ServiceApplication | undefined;
          if (found) setExistingApplication(found);
        }

        // Check if a project assignment already exists
        const { data: assignmentRows } = await supabase
          .from('job_project_assignments')
          .select('id')
          .eq('job_id', job.id)
          .eq('candidate_id', candidateProfileId)
          .maybeSingle();
        if (assignmentRows?.id) setExistingAssignmentId(assignmentRows.id);
      } catch (err) {
        console.warn('Could not check existing application', err);
      } finally {
        setIsCheckingApplication(false);
      }
    };
    checkExistingApplication();
  }, [candidateProfileId, job.id, supabase]);

  const handleApplyClick = () => {
    if (!user) {
      toast.error('Please sign in to apply.');
      return;
    }
    if (onApply) {
      onApply(job);
    }
  };

  const budgetText = formatBudget(job);

  return (
    <div className="hv-candidate-shell min-h-screen">
      {/* Candidate-dashboard-style gradient header */}
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#064e3b_0%,#0369a1_100%)] text-white">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8">
          <button
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all jobs
          </button>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                <Sparkles className="h-3.5 w-3.5" />
                Job Details
              </div>
              <h1 className="text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
                {job.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-emerald-50/90">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-emerald-200" />
                  {companyName || 'Hiring company'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-emerald-200" />
                  {job.location || 'Location not specified'}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                  {REMOTE_LABELS[job.remote_type]}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                  {JOB_TYPE_LABELS[job.job_type]}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                  {EXPERIENCE_LABELS[job.experience_level]}
                </span>
              </div>
            </div>

            {budgetText && (
              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Budget</p>
                <p className="mt-1 flex items-center gap-1 text-lg font-bold text-white">
                  <DollarSign className="h-4 w-4" />
                  {budgetText}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-base font-bold text-slate-950">Description</h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {job.description || 'No description provided.'}
              </p>
            </div>

            {job.requirements && job.requirements.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-base font-bold text-slate-950">Requirements</h3>
                <ul className="space-y-2 pl-1 text-sm text-slate-600">
                  {job.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.skills && job.skills.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-base font-bold text-slate-950">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Project attached — kept confidential until the recruiter assigns it. */}
            {job.has_project && (
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      This role includes a project assignment
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Project details (brief, deliverables, timeline, budget)
                      are kept confidential so every candidate starts on the
                      same level. You'll see the full project once the
                      recruiter assigns it to you after your application is
                      reviewed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
              <div className="border-b border-emerald-100 bg-emerald-50/50 px-5 py-4">
                <h3 className="text-base font-bold text-slate-950">Ready to apply?</h3>
                <p className="mt-1 text-xs text-slate-500">Your profile is auto-attached. Add a CV to stand out.</p>
              </div>
              <div className="space-y-3 p-5">
                {isCheckingApplication ? (
                  <Button disabled className="w-full bg-emerald-600 text-white">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking…
                  </Button>
                ) : existingAssignmentId ? (
                  <Button
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => onViewAssignment?.(existingAssignmentId)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    View Project Assignment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : hasApplied ? (
                  <div className="space-y-2">
                    <Button disabled className="w-full bg-emerald-600 text-white hover:bg-emerald-600">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Applied
                    </Button>
                    <p className="text-xs text-slate-500">
                      Your application is in. The recruiter will review your profile and may assign the project.
                    </p>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-emerald-600 font-bold text-white shadow-sm hover:bg-emerald-700"
                    onClick={handleApplyClick}
                  >
                    Apply for this job
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {existingApplication && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                    <p>
                      Status:{' '}
                      <span className="font-bold capitalize text-slate-950">
                        {existingApplication.status}
                      </span>
                    </p>
                    {existingApplication.submitted_at && (
                      <p>
                        Submitted:{' '}
                        {new Date(existingApplication.submitted_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-bold text-slate-950">At a glance</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  {job.applications_count ?? 0} candidates applied
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  Posted{' '}
                  {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'recently'}
                </div>
                {job.has_project && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    A project is attached to this job
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default CandidateJobDetail;

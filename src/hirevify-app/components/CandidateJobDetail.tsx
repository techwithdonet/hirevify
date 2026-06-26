import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, CheckCircle2, Building2, Loader2, Users, Sparkles, ArrowRight, Lock, FileText, Wand2, AlertTriangle } from 'lucide-react';
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
import { calculateAtsMatch, type AtsMatchResult } from '../services/atsMatchingService';
import { extractResumeText } from '../utils/ats/resumeTextExtractor';

interface CandidateJobDetailProps {
  job: Job;
  onBack: () => void;
  onViewAssignment?: (assignmentId: string) => void;
  onApply?: (job: Job, optimizedCv?: { path: string; fileName: string }) => void;
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

interface CandidateExtras {
  headline: string | null;
  skills: string[] | null;
  experience_summary: string | null;
  years_of_experience: number | null;
  resume_url: string | null;
}

function formatBudget(job: Job): string | null {
  if (!job.budget_min && !job.budget_max) return null;
  const min = job.budget_min ?? job.budget_max ?? 0;
  const max = job.budget_max ?? job.budget_min ?? 0;
  const currency = job.budget_currency || 'USD';
  if (min === max) return `${currency} ${min.toLocaleString()}`;
  return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
}

export function CandidateJobDetail({ job, onBack, onViewAssignment, onApply }: CandidateJobDetailProps) {
  const { user, accessToken } = useAuth();
  const supabase = createSupabaseBrowserClient();

  const [hasApplied, setHasApplied] = useState(false);
  const [existingApplication, setExistingApplication] = useState<ServiceApplication | null>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [existingAssignmentId, setExistingAssignmentId] = useState<string | null>(null);
  const [candidateExtras, setCandidateExtras] = useState<CandidateExtras | null>(null);
  const [cvSignedUrl, setCvSignedUrl] = useState<string | null>(null);
  const [cvMatch, setCvMatch] = useState<AtsMatchResult | null>(null);
  const [isCheckingCvMatch, setIsCheckingCvMatch] = useState(false);
  const [cvMatchProgressText, setCvMatchProgressText] = useState('');
  const [optimizedCv, setOptimizedCv] = useState<{ path: string; fileName: string; preview: string; projectedScore: number } | null>(null);
  const [isOptimizingCv, setIsOptimizingCv] = useState(false);
  const [optimizationProgressText, setOptimizationProgressText] = useState('');

  // Resolve candidate profile from auth
  const [candidateProfileId, setCandidateProfileId] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadCandidateProfile = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user?.id) {
          setIsCheckingApplication(false);
          return;
        }
        setAuthUserId(authData.user.id);
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', authData.user.id)
          .maybeSingle();
        if (profileRow?.id) setCandidateProfileId(profileRow.id);

        const candidateIds = [profileRow?.id, authData.user.id].filter(Boolean) as string[];
        const { data: extrasRow } = await supabase
          .from('candidate_profiles')
          .select('headline, skills, experience_summary, years_of_experience, resume_url')
          .in('user_id', candidateIds)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle<CandidateExtras>();
        setCandidateExtras(extrasRow ?? null);

        if (extrasRow?.resume_url) {
          const value = String(extrasRow.resume_url);
          if (/^https?:\/\//i.test(value)) {
            setCvSignedUrl(value);
          } else {
            const signed = await applicationsService.getApplicationFileSignedUrl(value);
            if (signed.url) setCvSignedUrl(signed.url);
          }
        }
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
    if (!cvMatch) {
      toast.error('Check your CV match before applying to this job.');
      return;
    }
    if (cvMatch && cvMatch.score < 70) {
      toast.error('Your CV match is below 70%. Improve your CV before applying to this job.');
      return;
    }
    if (onApply) {
      if (optimizedCv && typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          `hirevify_optimized_cv_${job.id}`,
          JSON.stringify({ path: optimizedCv.path, fileName: optimizedCv.fileName })
        );
      }
      onApply(job, optimizedCv ? { path: optimizedCv.path, fileName: optimizedCv.fileName } : undefined);
    }
  };

  const getCvFileName = () => {
    const value = candidateExtras?.resume_url || '';
    const lastPart = value.split('/').pop() || value;
    return lastPart.replace(/^\d+_/, '') || 'Current CV';
  };

  const loadCurrentCvText = async () => {
    if (!cvSignedUrl) return '';
    const response = await fetch(cvSignedUrl);
    if (!response.ok) return '';
    const blob = await response.blob();
    const file = new File([blob], getCvFileName(), { type: blob.type || 'application/pdf' });
    const extracted = await extractResumeText(file);
    return extracted.text;
  };

  const handleCheckCvMatch = async () => {
    if (!candidateExtras?.resume_url) {
      toast.error('Upload your CV in profile completion first.');
      return;
    }

    setIsCheckingCvMatch(true);
    setCvMatchProgressText('Reading your uploaded CV...');
    try {
      let resumeText = '';
      try {
        resumeText = await loadCurrentCvText();
      } catch (err) {
        console.warn('Could not extract current CV text, using profile data only', err);
      }

      setCvMatchProgressText('Comparing your CV with the job requirements...');
      const result = await calculateAtsMatch(
        {
          id: job.id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          skills: job.skills,
          experience_level: job.experience_level,
        },
        {
          skills: candidateExtras.skills || [],
          headline: candidateExtras.headline,
          summary: candidateExtras.experience_summary,
          resumeUrl: candidateExtras.resume_url,
          resumeText,
          experience: candidateExtras.years_of_experience,
        },
        accessToken
      );

      setCvMatch(result);
      setCvMatchProgressText('');
      if (result.score < 70) {
        toast.error(`CV match score: ${result.score}%. Improve your CV before applying.`);
      } else {
        toast.success(`CV match score: ${result.score}%. You can optimize before applying.`);
      }
    } catch (err) {
      console.error('CV match check failed', err);
      toast.error(err instanceof Error ? err.message : 'Could not check CV match.');
    } finally {
      setIsCheckingCvMatch(false);
      setCvMatchProgressText('');
    }
  };

  const handleOptimizeCv = async () => {
    if (!candidateExtras?.resume_url) {
      toast.error('Upload your CV in profile completion first.');
      return;
    }
    if (!cvMatch) {
      toast.error('Check your CV match before optimizing.');
      return;
    }
    if (cvMatch.score < 70) {
      toast.error('Your CV match is below 70%. Update your profile CV before applying.');
      return;
    }
    if (!authUserId) {
      toast.error('Please sign in again.');
      return;
    }
    const currentUser = user;
    if (!currentUser) {
      toast.error('Please sign in again.');
      return;
    }

    setIsOptimizingCv(true);
    setOptimizationProgressText('Finding missing job keywords...');
    try {
      let resumeText = '';
      try {
        resumeText = await loadCurrentCvText();
      } catch (err) {
        console.warn('Could not extract current CV text for AI rewrite', err);
      }

      setOptimizationProgressText('Applying small, grounded CV improvements...');
      const resumeData = {
        contactInfo: { fullName: currentUser.name || '', email: currentUser.email || '', phone: '', location: '', linkedinUrl: '', portfolioUrl: '' },
        summary: candidateExtras.experience_summary || candidateExtras.headline || '',
        experience: [],
        education: [],
        skills: (candidateExtras.skills || []).map((skill) => ({ name: skill, category: 'technical', proficiency: 'intermediate' })),
      };

      const response = await fetch('/api/ai/rewrite-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          resumeData,
          rawResumeText: resumeText,
          targetJobDescription: [job.title, job.description, ...(job.requirements || []), ...(job.skills || [])].filter(Boolean).join('\n'),
          atsScore: cvMatch?.score,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'HireVify AI could not optimize this CV.');
      }

      const payload = await response.json();
      const rewritten = payload?.resumeData || payload?.fixedResume || {};
      const projectedScore = Math.min(80, cvMatch.score + (cvMatch.score >= 75 ? 5 : 10));
      const preview = [
        currentUser.name,
        currentUser.email,
        '',
        'Professional Summary',
        rewritten.summary || resumeData.summary,
        '',
        'Skills',
        (rewritten.skills || resumeData.skills).map((skill: any) => skill.name || skill).filter(Boolean).join(', '),
      ].join('\n');
      const fileName = `hirevify-optimized-${job.title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.txt`;
      const file = new File([preview], fileName, { type: 'text/plain' });
      const upload = await applicationsService.uploadCV(authUserId, file);

      if (upload.error || !upload.path) {
        throw new Error(upload.error?.message || 'Could not save optimized CV.');
      }

      setOptimizedCv({ path: upload.path, fileName, preview, projectedScore });
      setOptimizationProgressText('');
      toast.success(`Optimized CV is ready. Projected match: ${projectedScore}%.`);
    } catch (err) {
      console.error('CV optimization failed', err);
      toast.error(err instanceof Error ? err.message : 'Could not optimize CV.');
    } finally {
      setIsOptimizingCv(false);
      setOptimizationProgressText('');
    }
  };

  const handleReplaceCurrentCv = async () => {
    if (!optimizedCv || !candidateProfileId) return;
    const { error } = await supabase
      .from('candidate_profiles')
      .update({ resume_url: optimizedCv.path, updated_at: new Date().toISOString() })
      .in('user_id', [candidateProfileId, authUserId].filter(Boolean) as string[]);

    if (error) {
      toast.error(error.message || 'Could not replace current CV.');
      return;
    }

    setCandidateExtras((current) => current ? { ...current, resume_url: optimizedCv.path } : current);
    toast.success('Your profile CV was replaced with the optimized CV.');
  };

  const budgetText = formatBudget(job);
  const isCvBelowThreshold = Boolean(cvMatch && cvMatch.score < 70);
  const canOptimizeCv = Boolean(cvMatch && cvMatch.score >= 70);

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
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-950">Current CV</p>
                      {candidateExtras?.resume_url ? (
                        <>
                          <a
                            href={cvSignedUrl || candidateExtras.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate text-xs font-medium text-emerald-700 underline"
                          >
                            {getCvFileName()}
                          </a>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCheckCvMatch}
                            disabled={isCheckingCvMatch}
                            className="mt-3 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Check your CV match
                          </Button>
                        </>
                      ) : (
                        <p className="mt-1 text-xs text-amber-700">
                          Upload a mandatory CV from profile completion before applying.
                        </p>
                      )}
                    </div>
                  </div>

                  {isCheckingCvMatch && (
                    <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Analyzing your CV</p>
                          <p className="mt-0.5 text-xs text-sky-800">
                            {cvMatchProgressText || 'Checking skills, requirements, and role keywords...'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full w-2/3 animate-pulse rounded-full bg-sky-500" />
                      </div>
                    </div>
                  )}

                  {cvMatch && (
                    <div className={`mt-4 rounded-lg border p-3 ${isCvBelowThreshold ? 'border-red-200 bg-red-50' : 'border-emerald-100 bg-emerald-50'}`}>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${isCvBelowThreshold ? 'text-red-700' : 'text-emerald-700'}`}>Match score</p>
                        <span className={`text-lg font-black ${isCvBelowThreshold ? 'text-red-800' : 'text-emerald-800'}`}>{cvMatch.score}%</span>
                      </div>
                      <p className={`mt-1 text-xs leading-5 ${isCvBelowThreshold ? 'text-red-800' : 'text-emerald-800'}`}>{cvMatch.explanation}</p>
                      {isCvBelowThreshold ? (
                        <div className="mt-3 rounded-lg border border-red-200 bg-white p-3 text-xs text-red-800">
                          <div className="flex gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>
                              Your CV match is below 70%, so you cannot apply for this job yet. Update your CV in profile completion and check again.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-3 text-xs text-emerald-800">
                          You meet the minimum CV match. You can apply now, or optimize your CV for a small improvement.
                        </div>
                      )}
                      {cvMatch.missingKeywords.length > 0 && (
                        <p className={`mt-2 text-xs ${isCvBelowThreshold ? 'text-red-900' : 'text-emerald-900'}`}>
                          Missing keywords: {cvMatch.missingKeywords.slice(0, 6).join(', ')}
                        </p>
                      )}
                      {canOptimizeCv && (
                        <Button
                          type="button"
                          onClick={handleOptimizeCv}
                          disabled={isOptimizingCv}
                          className="mt-3 w-full bg-slate-900 text-white hover:bg-slate-800"
                        >
                          <Wand2 className="mr-2 h-4 w-4" />
                          Optimize your CV with HireVify
                        </Button>
                      )}
                    </div>
                  )}

                  {isOptimizingCv && (
                    <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm">
                          <Wand2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Applying HireVify fixes</p>
                          <p className="mt-0.5 text-xs text-violet-800">
                            {optimizationProgressText || 'Tuning wording and job keywords without inventing experience...'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-violet-500" />
                      </div>
                    </div>
                  )}

                  {optimizedCv && (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-950">Optimized CV ready</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Applying now will send this optimized CV to the recruiter for this job. Projected match: {optimizedCv.projectedScore}%.
                      </p>
                      <p className="mt-3 text-xs font-medium text-slate-800">
                        Do you want to replace your current CV with this?
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Button type="button" size="sm" onClick={handleReplaceCurrentCv} className="bg-emerald-600 text-white hover:bg-emerald-700">
                          Yes, replace
                        </Button>
                        <Button type="button" size="sm" variant="outline">
                          No, this job only
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

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
                    disabled={!cvMatch || isCvBelowThreshold}
                  >
                    {!cvMatch
                      ? 'Check CV match to apply'
                      : isCvBelowThreshold
                        ? 'CV match too low to apply'
                        : 'Apply for this job'}
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

/**
 * Candidate Job Apply
 *
 * Two-step apply flow for the candidate. The button on
 * `CandidateJobDetail` routes here via `navigateToJobApply`.
 *
 *  Step 1 (Write)  — cover letter + optional PDF CV
 *  Step 2 (Review) — basic details from the candidate's profile
 *                    (`profiles` + `candidate_profiles` tables) plus
 *                    the form contents, with a final Submit button
 *  Step 3 (Done)   — green checkmark success card
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  X,
  Send,
  User,
  Pencil,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useAuth } from './AuthProvider';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { DashboardPageLayout } from './shared/DashboardPageLayout';
import { dashboardTheme } from '../theme/dashboardTheme';
import type { Job } from '../types/app';
import { applicationsService, MIN_CANDIDATE_PROFILE_COMPLETENESS } from '../services/applicationsService';
import { hasCompleteCandidateName } from '../utils/candidateProfileValidation';

interface CandidateJobApplyProps {
  job: Job;
  onBack: () => void;
  onApplied: () => void;
}

const MAX_COVER_LETTER = 2000;
const ACCEPTED_CV_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_CV_BYTES = 10 * 1024 * 1024; // 10 MB

// Subset of `profiles` we care about for the review step
interface ProfileRow {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  role: string | null;
}

// Subset of `candidate_profiles` we care about for the review step
interface CandidateExtras {
  full_name: string | null;
  headline: string | null;
  years_of_experience: number | null;
  skills: string[];
  resume_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  availability: string | null;
  profile_completeness: number | null;
  profile_completed?: boolean | null;
}

type Step = 'edit' | 'review' | 'success';

export function CandidateJobApply({ job, onBack, onApplied }: CandidateJobApplyProps) {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();

  const [step, setStep] = useState<Step>('edit');

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [extras, setExtras] = useState<CandidateExtras | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [optimizedCv, setOptimizedCv] = useState<{ path: string; fileName: string; projectedScore?: number } | null>(null);
  const [submittedMatchScore, setSubmittedMatchScore] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
const [showCvPrompt, setShowCvPrompt] = useState(true);
const [isReplacingCv, setIsReplacingCv] = useState(false);
const profileCompleteness = Number(extras?.profile_completeness || 0);
const hasRequiredCandidateName = hasCompleteCandidateName(profile?.full_name || extras?.full_name);
const isProfileReadyToApply =
  hasRequiredCandidateName &&
  (Boolean(extras?.profile_completed) || profileCompleteness >= MIN_CANDIDATE_PROFILE_COMPLETENESS);

  // Resolve the candidate's profile row (from `profiles`) and the
  // candidate-specific extras (from `candidate_profiles`) from the
  // auth user. We need BOTH — `profiles` carries name/email/location,
  // `candidate_profiles` carries headline/skills/years.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const scoreRaw = window.sessionStorage.getItem(`hirevify_application_match_${job.id}`);
    if (scoreRaw) {
      try {
        const parsed = JSON.parse(scoreRaw);
        const score = Number(parsed?.score);
        setSubmittedMatchScore(Number.isFinite(score) ? Math.round(score) : null);
      } catch {
        setSubmittedMatchScore(null);
      }
    }

    const raw = window.sessionStorage.getItem(`hirevify_optimized_cv_${job.id}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.path && parsed?.fileName) {
        setOptimizedCv({ 
          path: parsed.path, 
          fileName: parsed.fileName,
          projectedScore: parsed.projectedScore 
        });
      }
    } catch {
      setOptimizedCv(null);
    }
  }, [job.id]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setExtras(null);
      setIsProfileLoading(false);
      return;
    }
    let cancelled = false;    (async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData?.user?.id || user.id;

        const profileIds = Array.from(new Set([authUserId, user.id].filter(Boolean) as string[]));
        const profileFilter = profileIds
          .flatMap((id) => [`auth_user_id.eq.${id}`, `id.eq.${id}`])
          .join(',');

        const { data: profileRow } = await supabase
          .from('profiles')
          .select('id, auth_user_id, full_name, email, avatar_url, phone, location, bio, role')
          .or(profileFilter)
          .maybeSingle<ProfileRow>();

        if (cancelled) return;
        setProfile(profileRow ?? null);

        const candidateIds = Array.from(
          new Set([authUserId, user.id, profileRow?.id, profileRow?.auth_user_id].filter(Boolean) as string[])
        );

        let extrasRow: CandidateExtras | null = null;

        if (candidateIds.length > 0) {
          const { data: extrasRows } = await supabase
            .from('candidate_profiles')
            .select('*')
            .or(candidateIds.map((id) => `user_id.eq.${id}`).join(','))
            .limit(1);

          extrasRow = Array.isArray(extrasRows) ? (extrasRows[0] as CandidateExtras | null) : null;
        }

        if (!cancelled) setExtras(extrasRow ?? null);
      } catch (err) {
        console.warn('Could not resolve candidate profile', err);
      } finally {
        if (!cancelled) setIsProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name.toLowerCase();
    const accepted =
      ACCEPTED_CV_TYPES.includes(file.type) ||
      fileName.endsWith('.pdf') ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx');

    if (!accepted) {
      toast.error('Please upload a PDF, DOC, or DOCX file.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      toast.error('CV must be under 10 MB.');
      e.target.value = '';
      return;
    }
    setCvFile(file);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to apply.');
      return;
    }
    if (!profile) {
      toast.error('Could not load your account profile. Please refresh and try again.');
      return;
    }
    const hasCompletedProfile = Boolean(profile) && isProfileReadyToApply;

    if (!hasCompletedProfile) {
      toast.error(
        hasRequiredCandidateName
          ? 'Complete all required candidate profile fields before applying.'
          : 'Add your first and last name in your candidate profile before applying.'
      );
      return;
    }
    if (coverLetter.length > MAX_COVER_LETTER) {
      toast.error(`Cover letter is too long (max ${MAX_COVER_LETTER} characters).`);
      return;
    }
    
    // Debug logging for CV detection
    console.log('[Apply Debug] CV Check:', {
      hasCvFile: !!cvFile,
      hasOptimizedCv: !!optimizedCv,
      hasExtras: !!extras,
      extrasResumeUrl: extras?.resume_url,
      candidateId: user.id,
      profileCompleteness,
    });
    
    const savedCvPath = extras?.resume_url || (extras as any)?.resume_file_url || (extras as any)?.cv_url || null;

    if (!cvFile && !optimizedCv && !savedCvPath) {
      toast.error('Please choose your CV before submitting this application.', {
        description: 'Click Back to edit, choose your CV file, then submit again.',
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let cvPath: string | null = null;
      let cvFileName: string | null = null;
      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData?.user?.id;

      if (!authUserId) {
        throw new Error('Please login again before applying.');
      }

      if (cvFile) {
        const upload = await applicationsService.uploadCV(authUserId, cvFile);
        if (upload.error || !upload.path) {
          throw new Error(
            upload.error?.message || 'CV upload failed. Please try again.',
          );
        }
        cvPath = upload.path;
        cvFileName = cvFile.name;
      } else if (optimizedCv) {
        cvPath = optimizedCv.path;
        cvFileName = optimizedCv.fileName;
      } else if (savedCvPath) {
        cvPath = savedCvPath;
        cvFileName = savedCvPath.split('/').pop()?.replace(/^\d+_/, '') || 'Profile CV';
      }

      // Debug: log what's being submitted
      console.log('[Apply Debug] Submitting with:', {
        jobId: job.id,
        candidateId: authUserId,
        cvPath,
        cvFileName,
        matchScore: submittedMatchScore,
      });

      const { error } = await applicationsService.submitApplication(
        job.id,
        authUserId,
        coverLetter.trim() || undefined,
        { cvUrl: cvPath, cvFileName, matchScore: submittedMatchScore },
      );

      if (error) {
        throw new Error(error.message || 'Could not submit your application.');
      }

      setStep('success');
      toast.success('Application submitted!');
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(`hirevify_optimized_cv_${job.id}`);
        window.sessionStorage.removeItem(`hirevify_application_match_${job.id}`);
      }
    } catch (err: any) {
      console.error('Application submit error', err);
      toast.error(err?.message || 'Could not submit your application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueToReview = () => {
    if (!isProfileReadyToApply) {
      toast.error(
        hasRequiredCandidateName
          ? 'Complete all required candidate profile fields before applying.'
          : 'Add your first and last name in your candidate profile before applying.'
      );
      return;
    }

    setStep('review');
  };

  // ─── Success state ────────────────────────────────────────────────────
  if (step === 'success') {
  

    const handleReplaceCv = async () => {
      if (!optimizedCv || !user?.id) return;
      setIsReplacingCv(true);
      try {
        const { error } = await supabase
          .from('candidate_profiles')
          .update({
            resume_url: optimizedCv.path,
            resume_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
        setExtras((current) => current ? { ...current, resume_url: optimizedCv.path } : current);
        if (typeof window !== 'undefined' && optimizedCv.projectedScore) {
          window.localStorage.setItem(
            `hirevify_replaced_cv_match_${job.id}_${optimizedCv.path}`,
            JSON.stringify({ score: optimizedCv.projectedScore })
          );
        }
        toast.success('Your profile CV has been updated with the optimized version!');
        setShowCvPrompt(false);
      } catch (err: any) {
        toast.error(err?.message || 'Could not update your CV.');
      } finally {
        setIsReplacingCv(false);
      }
    };

    return (
      <DashboardPageLayout
        title="Application sent"
        subtitle={`Your application for ${job.title} is in. The recruiter will review your profile and may assign the project.`}
        onBack={onApplied}
        backLabel="Back to dashboard"
        eyebrow="Application Submitted"
      >
        <div className={dashboardTheme.emptyState}>
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
          <h3 className="text-base font-semibold text-slate-950">You're all set</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            We'll let you know as soon as the recruiter takes a look. If they
            assign the project, you'll see it in your dashboard.
          </p>

          {/* CV Replacement Prompt - only show if optimized CV scored >= 70% */}
          {optimizedCv && optimizedCv.projectedScore && optimizedCv.projectedScore >= 70 && showCvPrompt && (
            <div className="mx-auto mt-6 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900">Upgrade your profile CV?</h4>
                  <p className="mt-1 text-xs text-amber-700">
                    This optimized CV scored above 70% for this job. Would you like to make it your default CV in your profile?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleReplaceCv}
                      disabled={isReplacingCv}
                      className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                      {isReplacingCv ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Yes, update my CV'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowCvPrompt(false)}
                      className="text-amber-700 hover:bg-amber-100"
                    >
                      No, keep current
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={onBack} variant="ghost">
              View job
            </Button>
            <Button
              onClick={onApplied}
              className={dashboardTheme.buttonPrimary}
            >
              Back to dashboard
            </Button>
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  // ─── Review state ──────────────────────────────────────────────────────
  if (step === 'review') {
    const fullName = profile?.full_name || user?.email || 'You';
    const initials = (profile?.full_name || user?.email || '?')
      .split(/\s|@/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('');

    return (
      <DashboardPageLayout
        title="Review your application"
        subtitle="Check the details below before sending it to the recruiter."
        onBack={() => setStep('edit')}
        backLabel="Edit application"
        eyebrow={`Step 2 of 2 · ${job.title}`}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column — what you're sending */}
          <div className="space-y-6 lg:col-span-2">
            {/* Profile basics */}
            <section className={dashboardTheme.panel}>
              <header className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-950">
                  Your details
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('edit')}
                  className="text-xs"
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </header>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-base font-bold text-emerald-700">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-950">
                    {fullName}
                  </p>
                  {extras?.headline && (
                    <p className="mt-0.5 text-sm text-slate-600">
                      {extras.headline}
                    </p>
                  )}
                  <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    {profile?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{profile.email}</span>
                      </div>
                    )}
                    {profile?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{profile.location}</span>
                      </div>
                    )}
                    {profile?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{profile.phone}</span>
                      </div>
                    )}
                    {typeof extras?.years_of_experience === 'number' && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                        <span>
                          {extras.years_of_experience} year
                          {extras.years_of_experience === 1 ? '' : 's'} of
                          experience
                        </span>
                      </div>
                    )}
                  </dl>
                  {extras?.skills && extras.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {extras.skills.slice(0, 12).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                      {extras.skills.length > 12 && (
                        <span className="text-xs text-slate-500">
                          +{extras.skills.length - 12} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Job details */}
            <section className={dashboardTheme.panel}>
              <h3 className="mb-3 text-sm font-semibold text-slate-950">
                Applying to
              </h3>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-base font-semibold text-slate-950">
                  {job.title}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {job.location || 'Location not specified'}
                </p>
                {(optimizedCv || extras?.resume_url) && (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                    <FileText className="h-3.5 w-3.5" />
                    {optimizedCv ? `Optimized CV ready: ${optimizedCv.fileName}` : 'Resume on file'}
                  </p>
                )}
              </div>
            </section>

            {/* Cover letter */}
            <section className={dashboardTheme.panel}>
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-950">
                  Cover letter
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('edit')}
                  className="text-xs"
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </header>
              {coverLetter.trim() ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {coverLetter}
                </p>
              ) : (
                <p className="text-sm italic text-slate-400">
                  No cover letter provided.
                </p>
              )}
            </section>

            {/* CV upload */}
            <section className={dashboardTheme.panel}>
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-950">
                  CV attachment
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('edit')}
                  className="text-xs"
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </header>
              {cvFile ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  <FileText className="h-4 w-4 flex-shrink-0 text-emerald-700" />
                  <span className="truncate">{cvFile.name}</span>
                  <span className="ml-auto text-xs text-emerald-700">
                    {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ) : optimizedCv ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  <Sparkles className="h-4 w-4 flex-shrink-0 text-emerald-700" />
                  <span className="truncate">{optimizedCv.fileName}</span>
                  <span className="ml-auto text-xs text-emerald-700">Optimized</span>
                </div>
              ) : (
                <p className="text-sm italic text-slate-400">
                  Your current profile CV will be attached to this application.
                </p>
              )}
            </section>
          </div>

          {/* Sidebar — submit CTA */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-semibold text-slate-950">
                  Ready to send
                </h3>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Once submitted, the recruiter will be notified and can review
                your profile and attached CV. You can't edit this
                application after sending.
              </p>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !user?.id}
                className="mt-4 w-full bg-emerald-600 font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit application
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 w-full"
                onClick={() => setStep('edit')}
                disabled={isSubmitting}
              >
                Back to edit
              </Button>
            </div>

            <div className={dashboardTheme.panel}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                What's next
              </h4>
              <ol className="mt-3 space-y-2 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                    1
                  </span>
                  Recruiter reviews your profile
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                    2
                  </span>
                  They may assign the attached project
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                    3
                  </span>
                  You submit deliverables if assigned
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </DashboardPageLayout>
    );
  }

  // ─── Edit state (Step 1) ───────────────────────────────────────────────
  return (
    <DashboardPageLayout
      title={`Apply: ${job.title}`}
      subtitle="Your profile and CV are auto-attached. Add a short note before applying."
      onBack={onBack}
      backLabel="Back to job"
      eyebrow="Step 1 of 2"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Cover letter */}
          <div className={dashboardTheme.panel}>
            <h3 className="text-sm font-semibold text-slate-950">
              Cover letter (optional)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              A short note explaining why you're a great fit for this role.
            </p>
            <Textarea
              className={`mt-3 ${dashboardTheme.textarea}`}
              rows={8}
              maxLength={MAX_COVER_LETTER}
              placeholder="Hi! I'm interested in this role because…"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
            <p className="mt-2 text-right text-xs text-slate-500">
              {coverLetter.length} / {MAX_COVER_LETTER}
            </p>
          </div>

          {/* CV upload */}
          <div className={dashboardTheme.panel}>
            <h3 className="text-sm font-semibold text-slate-950">
              CV (PDF, DOC, or DOCX)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Your profile CV is attached by default. Upload another file only if you want to override it for this application.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                <Upload className="h-4 w-4" />
                Choose CV
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleCvChange}
                />
              </label>
              {cvFile && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="max-w-[240px] truncate">{cvFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setCvFile(null)}
                    className="ml-1 text-slate-400 transition hover:text-slate-700"
                    aria-label="Remove CV"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          {/* Profile summary */}
          <div className={dashboardTheme.panel}>
            <h3 className="text-sm font-semibold text-slate-950">Your profile</h3>
            {isProfileLoading ? (
              <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading your profile…
              </div>
            ) : (
              <>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {profile?.full_name ||
                        (user as any)?.user_metadata?.full_name ||
                        user?.email ||
                        'You'}
                    </p>
                    {extras?.headline && (
                      <p className="truncate text-xs text-slate-500">
                        {extras.headline}
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Your name, headline, location, skills, and resume (if any)
                  will be attached to this application automatically. You'll
                  see the full review on the next step.
                </p>
                {!isProfileReadyToApply && (
                  <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
                    {!hasRequiredCandidateName
                      ? 'Add your first and last name in Profile before applying.'
                      : `Complete all required profile fields before applying (${profileCompleteness}% done).`}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Continue */}
          <div className="space-y-2">
            <Button
              type="button"
              onClick={handleContinueToReview}
              disabled={isProfileLoading || !isProfileReadyToApply}
              className="w-full bg-emerald-600 font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              Continue to review
              <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </aside>
      </div>
    </DashboardPageLayout>
  );
}








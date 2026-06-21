import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  Briefcase,
  Upload,
  Video,
  Hourglass,
  Trophy,
  XCircle,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { DashboardPageLayout } from './shared/DashboardPageLayout';
import { dashboardTheme } from '../theme/dashboardTheme';
import { projectAssignmentsService } from '../services/projectAssignmentsService';
import type { JobProjectAssignment } from '../types/app';

interface CandidateProjectAssignmentProps {
  assignmentId: string;
  onBack: () => void;
}

interface AssignmentDetail {
  id: string;
  assignment_status: JobProjectAssignment['assignment_status'];
  project_submission_url: string | null;
  video_submission_url: string | null;
  submission_notes: string | null;
  submitted_at: string | null;
  review_notes: string | null;
  final_decision: JobProjectAssignment['final_decision'];
  decided_at: string | null;
  job: {
    id: string;
    title: string;
    location?: string;
    job_type?: string;
    remote_type?: string;
    recruiter_id?: string;
    recruiter_profile?: { company_name?: string } | null;
  };
  project: {
    id: string;
    title: string;
    description: string;
    skills: string[];
    project_timeline?: string | null;
    project_budget_range?: string | null;
  };
}

type StepKey = 'assigned' | 'submission' | 'waiting' | 'final';

interface Step {
  key: StepKey;
  label: string;
  description: string;
  icon: any;
}

const STEPS: Step[] = [
  {
    key: 'assigned',
    label: 'Project Assignment',
    description: 'Review your assigned project and accept or decline.',
    icon: Briefcase,
  },
  {
    key: 'submission',
    label: 'Upload Project and Video Submission',
    description: 'Submit your project work and a short video explanation.',
    icon: Upload,
  },
  {
    key: 'waiting',
    label: 'Waiting for Employer Decision',
    description: 'Your work is under review. Hang tight.',
    icon: Hourglass,
  },
  {
    key: 'final',
    label: 'Final Decision',
    description: 'See the recruiter’s final decision.',
    icon: Trophy,
  },
];

function statusToStepKey(status: JobProjectAssignment['assignment_status']): StepKey {
  switch (status) {
    case 'pending':
      return 'assigned';
    case 'accepted':
      return 'submission';
    case 'submitted':
    case 'under_review':
      return 'waiting';
    case 'hired':
    case 'not_selected':
      return 'final';
    case 'rejected':
      return 'final';
    default:
      return 'assigned';
  }
}

export function CandidateProjectAssignment({ assignmentId, onBack }: CandidateProjectAssignmentProps) {
  const supabase = createSupabaseBrowserClient();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  // Submission form state
  const [projectUrl, setProjectUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await projectAssignmentsService.getAssignment(assignmentId);
        if (error) {
          toast.error(error.message || 'Could not load assignment');
          setAssignment(null);
          return;
        }
        if (!data) {
          setAssignment(null);
          return;
        }
        // Cast the joined relations onto our local shape
        setAssignment({
          id: data.id,
          assignment_status: data.assignment_status,
          project_submission_url: data.project_submission_url,
          video_submission_url: data.video_submission_url,
          submission_notes: data.submission_notes,
          submitted_at: data.submitted_at,
          review_notes: data.review_notes,
          final_decision: data.final_decision,
          decided_at: data.decided_at,
          job: {
            id: data.job?.id ?? '',
            title: data.job?.title ?? 'Job',
            recruiter_id: (data.job as any)?.recruiter_id,
            recruiter_profile: (data.job as any)?.recruiter_profile ?? null,
          },
          project: {
            id: data.project?.id ?? '',
            title: data.project?.title ?? 'Project',
            description: data.project?.description ?? '',
            skills: data.project?.skills ?? [],
            project_timeline: (data.project as any)?.project_timeline ?? null,
            project_budget_range: (data.project as any)?.project_budget_range ?? null,
          },
        });
        setProjectUrl(data.project_submission_url ?? '');
        setVideoUrl(data.video_submission_url ?? '');
        setSubmissionNotes(data.submission_notes ?? '');
      } catch (err) {
        console.error('Load assignment failed', err);
        toast.error('Could not load assignment');
        setAssignment(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [assignmentId]);

  const currentStep = useMemo<StepKey>(() => {
    if (!assignment) return 'assigned';
    return statusToStepKey(assignment.assignment_status);
  }, [assignment]);

  const stepIndex = useMemo(() => STEPS.findIndex((s) => s.key === currentStep), [currentStep]);

  const refresh = async () => {
    const { data } = await projectAssignmentsService.getAssignment(assignmentId);
    if (data) {
      setAssignment((prev) =>
        prev
          ? {
              ...prev,
              assignment_status: data.assignment_status,
              project_submission_url: data.project_submission_url,
              video_submission_url: data.video_submission_url,
              submission_notes: data.submission_notes,
              submitted_at: data.submitted_at,
              review_notes: data.review_notes,
              final_decision: data.final_decision,
              decided_at: data.decided_at,
            }
          : prev,
      );
    }
  };

  const handleAccept = async () => {
    if (!assignment) return;
    setIsMutating(true);
    try {
      const { error } = await projectAssignmentsService.acceptAssignment(assignment.id);
      if (error) throw error;
      toast.success('Project accepted. You can now upload your submission.');
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept project');
    } finally {
      setIsMutating(false);
    }
  };

  const handleReject = async () => {
    if (!assignment) return;
    setIsMutating(true);
    try {
      const { error } = await projectAssignmentsService.rejectAssignment(assignment.id);
      if (error) throw error;
      toast.success('Project declined.');
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to decline project');
    } finally {
      setIsMutating(false);
    }
  };

  const handleSubmitProject = async () => {
    if (!assignment) return;
    if (!projectUrl.trim()) {
      toast.error('Please add a link to your project submission (GitHub, Drive, etc.).');
      return;
    }
    setIsMutating(true);
    try {
      const { error } = await projectAssignmentsService.submitProject(assignment.id, {
        projectSubmissionUrl: projectUrl.trim(),
        videoSubmissionUrl: videoUrl.trim() || undefined,
        submissionNotes: submissionNotes.trim() || undefined,
      });
      if (error) throw error;
      toast.success('Submission sent! The recruiter will review it soon.');
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit project');
    } finally {
      setIsMutating(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardPageLayout title="Project Assignment" subtitle="Loading your assignment...">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardPageLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardPageLayout title="Project Assignment" subtitle="This assignment is unavailable.">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardContent className="py-10 text-center">
              <XCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-medium">Assignment not found</h2>
              <p className="text-sm text-muted-foreground">
                The recruiter hasn’t assigned a project to you yet, or this assignment is no longer available.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      title={assignment ? assignment.project.title : 'Project Assignment'}
      subtitle={assignment ? `Linked to: ${assignment.job.title}` : undefined}
    >
      <div className={dashboardTheme.page}>
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Project Assignment</p>
              <h1 className="text-2xl font-semibold text-foreground">{assignment.project.title}</h1>
            </div>
          </div>

          {/* Progress stepper */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <ol className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = idx < stepIndex || assignment.assignment_status === 'hired';
                  const isCurrent = idx === stepIndex;
                  return (
                    <li key={step.key} className="flex flex-col items-start gap-2 sm:items-center sm:text-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          isDone
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : isCurrent
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Step {idx + 1}: {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          {/* Step content */}
          {currentStep === 'assigned' && assignment.assignment_status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Sparkles className="h-5 w-5 text-primary" />
                  You’ve been assigned this project
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-md border border-border p-4 text-sm">
                  <p className="font-medium">{assignment.project.title}</p>
                  <p className="mt-1 text-muted-foreground">{assignment.project.description}</p>
                  {assignment.project.skills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {assignment.project.skills.map((s) => (
                        <Badge key={s} variant="secondary" className="bg-primary/10 text-primary">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-border p-3 text-sm">
                    <p className="text-muted-foreground">Job</p>
                    <p className="font-medium">{assignment.job.title}</p>
                  </div>
                  <div className="rounded-md border border-border p-3 text-sm">
                    <p className="text-muted-foreground">Company</p>
                    <p className="font-medium">
                      {assignment.job.recruiter_profile?.company_name || 'Hiring company'}
                    </p>
                  </div>
                  {assignment.project.project_timeline && (
                    <div className="rounded-md border border-border p-3 text-sm">
                      <p className="text-muted-foreground">Timeline</p>
                      <p className="font-medium">{assignment.project.project_timeline}</p>
                    </div>
                  )}
                  {assignment.project.project_budget_range && (
                    <div className="rounded-md border border-border p-3 text-sm">
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium">{assignment.project.project_budget_range}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={isMutating}
                    className="border-destructive text-destructive hover:bg-destructive/10"
                  >
                    Reject Project
                  </Button>
                  <Button
                    onClick={handleAccept}
                    disabled={isMutating}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Accept Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {assignment.assignment_status === 'rejected' && (
            <Card className="border-amber-200 bg-amber-50/60">
              <CardContent className="py-8 text-center">
                <XCircle className="mx-auto mb-3 h-10 w-10 text-amber-600" />
                <h2 className="text-lg font-medium text-foreground">You declined this project</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The recruiter has been notified. You can keep exploring other opportunities.
                </p>
              </CardContent>
            </Card>
          )}

          {currentStep === 'submission' && assignment.assignment_status === 'accepted' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Submit your work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-url" className="text-foreground">Project link</Label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="project-url"
                      value={projectUrl}
                      onChange={(e) => setProjectUrl(e.target.value)}
                      placeholder="GitHub repo, Figma file, or hosted demo URL"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-url" className="text-foreground">Video submission link (optional)</Label>
                  <div className="relative">
                    <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="video-url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="Loom, YouTube (unlisted), or hosted MP4 link"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-foreground">Notes for the recruiter</Label>
                  <Textarea
                    id="notes"
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    rows={4}
                    placeholder="Anything the recruiter should know about your work?"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitProject}
                    disabled={isMutating || !projectUrl.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'waiting' &&
            (assignment.assignment_status === 'submitted' ||
              assignment.assignment_status === 'under_review') && (
              <Card>
                <CardContent className="space-y-4 py-8 text-center">
                  <Hourglass className="mx-auto h-10 w-10 text-primary" />
                  <h2 className="text-lg font-medium text-foreground">
                    Waiting for the recruiter’s decision
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your submission has been received. We’ll let you know as soon as there’s an update.
                  </p>
                  {assignment.submitted_at && (
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(assignment.submitted_at).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

          {currentStep === 'final' &&
            (assignment.assignment_status === 'hired' ||
              assignment.assignment_status === 'not_selected') && (
              <Card
                className={
                  assignment.assignment_status === 'hired'
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-slate-200 bg-slate-50/60'
                }
              >
                <CardContent className="space-y-3 py-8 text-center">
                  {assignment.assignment_status === 'hired' ? (
                    <>
                      <Trophy className="mx-auto h-10 w-10 text-emerald-600" />
                      <h2 className="text-xl font-semibold text-emerald-800">Hired</h2>
                      <p className="text-sm text-emerald-900/80">
                        Congratulations! The recruiter has selected you. They will reach out with next steps.
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="mx-auto h-10 w-10 text-slate-500" />
                      <h2 className="text-xl font-semibold text-foreground">Not Selected</h2>
                      <p className="text-sm text-muted-foreground">
                        The recruiter has decided not to move forward this time. Keep applying — many candidates
                        find the right fit on a later opportunity.
                      </p>
                    </>
                  )}
                  {assignment.review_notes && (
                    <div className="mx-auto mt-3 max-w-md rounded-md border border-border bg-white p-3 text-left text-sm text-muted-foreground">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground">
                        Recruiter notes
                      </p>
                      <p className="whitespace-pre-wrap">{assignment.review_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Quick recap (always visible) */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Quick recap</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                Job: <span className="font-medium text-foreground">{assignment.job.title}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Company:{' '}
                <span className="font-medium text-foreground">
                  {assignment.job.recruiter_profile?.company_name || 'Hiring company'}
                </span>
              </div>
              {assignment.job.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {assignment.job.location}
                </div>
              )}
              {assignment.project.project_timeline && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {assignment.project.project_timeline}
                </div>
              )}
              {assignment.project.project_budget_range && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  {assignment.project.project_budget_range}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Circle
                  className={`h-4 w-4 ${
                    assignment.assignment_status === 'hired'
                      ? 'text-emerald-500'
                      : assignment.assignment_status === 'rejected' ||
                          assignment.assignment_status === 'not_selected'
                        ? 'text-slate-400'
                        : 'text-primary'
                  }`}
                />
                Status:{' '}
                <span className="font-medium capitalize text-foreground">
                  {assignment.assignment_status.replace('_', ' ')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardPageLayout>
  );
}

export default CandidateProjectAssignment;

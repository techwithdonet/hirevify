/**
 * Candidate Applied Jobs
 *
 * Shows every job the candidate has applied to, each with a 4-phase progress
 * tracker:
 *
 *  Phase 1 — Application submitted
 *  Phase 2 — Waiting for project assignment (recruiter creates assignment)
 *  Phase 3 — Complete project file + video upload (candidate submits deliverable)
 *  Phase 4 — Hired or not selected by employer (final decision)
 *
 * Progress is computed from the joined state of `applications.status` and the
 * matching `job_project_assignments.assignment_status` row. We need BOTH tables
 * to know whether the candidate is still in phase 1 (no assignment yet) vs.
 * phase 2 (assignment row exists but is `pending`) vs. phase 3+ (recruiter
 * accepted and candidate is now working) vs. phase 4 (terminal state).
 *
 * Clicking a row deep-links into:
 *   - the job detail (if no assignment yet — phase 1/2), or
 *   - the project assignment page (phase 3+), so the candidate can keep moving
 *     forward in the flow without leaving the dashboard.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  FileText,
  Hourglass,
  Loader2,
  MapPin,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  XCircle,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { useAuth } from './AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { applicationsService, type ApplicationWithDetails } from '../services/applicationsService';
import { projectAssignmentsService, type AssignmentWithDetails } from '../services/projectAssignmentsService';
import { profilesService } from '../services/profilesService';
import { DashboardPageLayout } from './shared/DashboardPageLayout';
import type { Job, JobProjectAssignment } from '../types/app';
import { toast } from 'sonner';

// --- Phase model -------------------------------------------------------------

type PhaseId = 1 | 2 | 3 | 4;

interface PhaseDef {
  id: PhaseId;
  label: string;
  description: string;
  icon: typeof Circle;
}

// Phases are intentionally ordered — `progressPhase` returns the highest
// reached phase; `currentPhase` is the one the candidate is actively in.
const PHASES: PhaseDef[] = [
  {
    id: 1,
    label: 'Application Submitted',
    description: 'Your application is in the recruiter\u2019s queue.',
    icon: FileText,
  },
  {
    id: 2,
    label: 'Waiting for Project Assignment',
    description: 'Recruiter is preparing the project brief for you.',
    icon: Hourglass,
  },
  {
    id: 3,
    label: 'Complete Project File & Video',
    description: 'Submit your project deliverable + walkthrough video.',
    icon: Upload,
  },
  {
    id: 4,
    label: 'Final Decision',
    description: 'Recruiter has reviewed your work — hired or not selected.',
    icon: ShieldCheck,
  },
];

type TerminalOutcome = 'hired' | 'not_selected' | null;

interface PhaseState {
  progressPhase: PhaseId;
  currentPhase: PhaseId;
  terminal: TerminalOutcome;
}

function computePhaseState(
  application: ApplicationWithDetails,
  assignment: AssignmentWithDetails | null
): PhaseState {
  const appStatus = application.status;
  const assignStatus = assignment?.assignment_status ?? null;
  const finalDecision = (assignment?.final_decision ?? null) as TerminalOutcome;

  // Terminal outcomes first — once decided, we lock the UI on phase 4.
  if (assignStatus === 'hired' || finalDecision === 'hired') {
    return { progressPhase: 4, currentPhase: 4, terminal: 'hired' };
  }
  if (assignStatus === 'not_selected' || finalDecision === 'not_selected') {
    return { progressPhase: 4, currentPhase: 4, terminal: 'not_selected' };
  }

  // Withdrawn / rejected applications — keep on phase 1 with a sad outcome.
  if (appStatus === 'withdrawn' || appStatus === 'rejected') {
    return { progressPhase: 1, currentPhase: 1, terminal: 'not_selected' };
  }

  // Phase 3 active: assignment accepted (candidate needs to submit work).
  if (assignStatus === 'accepted') {
    return { progressPhase: 3, currentPhase: 3, terminal: null };
  }

  // Phase 3 wrapping up: assignment submitted / under review.
  if (assignStatus === 'submitted' || assignStatus === 'under_review') {
    return { progressPhase: 3, currentPhase: 4, terminal: null };
  }

  // Phase 2 active: assignment exists but recruiter hasn't accepted yet.
  if (assignStatus === 'pending' || appStatus === 'assigned') {
    return { progressPhase: 2, currentPhase: 2, terminal: null };
  }

  // Default — application was submitted, recruiter hasn't created an assignment.
  return { progressPhase: 1, currentPhase: 1, terminal: null };
}

// --- Component --------------------------------------------------------------

interface CandidateAppliedJobsProps {
  onBack: () => void;
  onViewJob: (job: Job) => void;
  onViewAssignment: (assignmentId: string) => void;
  onSearchProjects: () => void;
}

interface AppliedJobRow {
  application: ApplicationWithDetails;
  assignment: AssignmentWithDetails | null;
  phase: PhaseState;
}

export function CandidateAppliedJobs({
  onBack,
  onViewJob,
  onViewAssignment,
  onSearchProjects,
}: CandidateAppliedJobsProps) {
  const { user } = useAuth();

  const [rows, setRows] = useState<AppliedJobRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'hired' | 'closed'>('all');
  const [candidateProfile, setCandidateProfile] = useState<any>(null);

  // Load candidate profile for completeness check
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        const profileData = await profilesService.getCandidateProfile(user.id);
        if (profileData.data) {
          setCandidateProfile(profileData.data);
        }
      } catch (err) {
        console.warn('Could not load candidate profile', err);
      }
    };
    loadProfile();
  }, [user?.id]);

  // Check profile before job search
  const checkProfileForJobSearch = () => {
    const completeness = Number(candidateProfile?.profile_completeness || 0);
    const hasResume = Boolean(candidateProfile?.resume_url);
    const isProfileComplete = Boolean(candidateProfile?.profile_completed) || completeness >= 60;
    
    if (!isProfileComplete || !hasResume) {
      const missing: string[] = [];
      if (!hasResume) missing.push('upload a CV');
      if (!isProfileComplete) missing.push(`complete your profile (${completeness}% done)`);
      
      toast.error(
        `Please ${missing.join(' and ')} before finding jobs and applying.`,
        { 
          action: {
            label: 'Complete Profile',
            onClick: onBack // Go back to dashboard where they can edit profile
          },
          duration: 8000
        }
      );
      return false;
    }
    return true;
  };

  const handleSearchProjects = () => {
    if (checkProfileForJobSearch()) {
      onSearchProjects();
    }
  };

  const loadApplications = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Find the candidate's `profiles.id` first — that's the value stored in
      // `applications.candidate_id` and `job_project_assignments.candidate_id`.
      // `getCandidateApplications` already does the candidate-id resolution.
      // Get auth.users.id for querying — applications are stored with candidate_id = auth.users.id,
      // but user.id from AuthProvider is profiles.id, which may differ.
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const appsRes = await applicationsService.getCandidateApplications(user.id, authUser?.id);
      const apps = appsRes.data ?? [];

      // Pull assignments in parallel — same candidate.
      const assignsRes = await projectAssignmentsService.getCandidateAssignments(user.id);
      const assigns = assignsRes.data ?? [];

      const assignmentByJobId = new Map<string, AssignmentWithDetails>();
      for (const a of assigns) {
        if (a.job_id && !assignmentByJobId.has(a.job_id)) {
          assignmentByJobId.set(a.job_id, a);
        }
      }

      const built: AppliedJobRow[] = apps.map((app) => {
        const assignment = assignmentByJobId.get(app.job_id) ?? null;
        return {
          application: app,
          assignment,
          phase: computePhaseState(app, assignment),
        };
      });

      setRows(built);
    } catch (err) {
      console.error('Failed to load applied jobs', err);
      toast.error('Could not load your applied jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const filteredRows = useMemo(() => {
    let next = rows;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      next = next.filter((row) => {
        const title = (row.application.job?.title ?? '').toLowerCase();
        const company = (row.application.job?.company_name ?? '').toLowerCase();
        return title.includes(q) || company.includes(q);
      });
    }

    if (statusFilter !== 'all') {
      next = next.filter((row) => {
        if (statusFilter === 'hired') return row.phase.terminal === 'hired';
        if (statusFilter === 'closed') return row.phase.terminal === 'not_selected';
        // in_progress = terminal is null (still moving)
        return row.phase.terminal === null;
      });
    }

    // Newest first — already sorted by `submitted_at desc` in the service.
    return next;
  }, [rows, searchQuery, statusFilter]);

  const summary = useMemo(() => {
    const total = rows.length;
    const inProgress = rows.filter((r) => r.phase.terminal === null).length;
    const hired = rows.filter((r) => r.phase.terminal === 'hired').length;
    const notSelected = rows.filter((r) => r.phase.terminal === 'not_selected').length;
    return { total, inProgress, hired, notSelected };
  }, [rows]);

  return (
    <DashboardPageLayout
      eyebrow="Candidate workspace"
      title="Applied Jobs"
      subtitle="Track every application from submission through final decision."
      onBack={onBack}
      backLabel="Back to Dashboard"
      actions={
        <Button onClick={handleSearchProjects} variant="outline">
          <Search className="mr-2 h-4 w-4" />
          Browse more jobs
        </Button>
      }
    >
      {/* Summary strip */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile label="Total applied" value={summary.total} accent="emerald" icon={Briefcase} />
        <SummaryTile label="In progress" value={summary.inProgress} accent="amber" icon={Hourglass} />
        <SummaryTile label="Hired" value={summary.hired} accent="emerald" icon={CheckCircle2} />
        <SummaryTile label="Not selected" value={summary.notSelected} accent="slate" icon={XCircle} />
      </section>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title or company"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              label={`All (${summary.total})`}
            />
            <FilterPill
              active={statusFilter === 'in_progress'}
              onClick={() => setStatusFilter('in_progress')}
              label={`In progress (${summary.inProgress})`}
            />
            <FilterPill
              active={statusFilter === 'hired'}
              onClick={() => setStatusFilter('hired')}
              label={`Hired (${summary.hired})`}
            />
            <FilterPill
              active={statusFilter === 'closed'}
              onClick={() => setStatusFilter('closed')}
              label={`Not selected (${summary.notSelected})`}
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <LoadingState />
      ) : filteredRows.length === 0 ? (
        <EmptyState
          hasAnyApplications={rows.length > 0}
          onBrowseJobs={handleSearchProjects}
          onClearFilters={() => {
            setSearchQuery('');
            setStatusFilter('all');
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredRows.map((row) => (
            <AppliedJobCard
              key={row.application.id}
              row={row}
              expanded={expandedId === row.application.id}
              onToggle={() =>
                setExpandedId((prev) =>
                  prev === row.application.id ? null : row.application.id
                )
              }
              onViewJob={() => onViewJob(row.application.job as Job)}
              onViewAssignment={() => {
                if (row.assignment?.id) onViewAssignment(row.assignment.id);
              }}
            />
          ))}
        </div>
      )}
    </DashboardPageLayout>
  );
}

// --- Sub-components ---------------------------------------------------------

function SummaryTile({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: number;
  accent: 'emerald' | 'amber' | 'slate';
  icon: typeof Briefcase;
}) {
  const accentMap: Record<string, string> = {
    emerald: 'from-emerald-50 to-emerald-100/60 text-emerald-700',
    amber: 'from-amber-50 to-amber-100/60 text-amber-700',
    slate: 'from-slate-50 to-slate-100/60 text-slate-700',
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-gradient-to-br ${accentMap[accent]} p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
        <Icon className="h-4 w-4 opacity-70" />
      </div>
      <p className="mt-2 text-3xl font-bold tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm'
          : 'rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
      }
    >
      {label}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Loading your applications\u2026</p>
      </div>
    </div>
  );
}

function EmptyState({
  hasAnyApplications,
  onBrowseJobs,
  onClearFilters,
}: {
  hasAnyApplications: boolean;
  onBrowseJobs: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm">
        <Rocket className="h-7 w-7" />
      </div>
      {hasAnyApplications ? (
        <>
          <h3 className="mt-4 text-lg font-bold text-slate-950">No applications match your filters</h3>
          <p className="mt-1 text-sm text-slate-500">Try clearing the search or status filter.</p>
          <Button onClick={onClearFilters} className="mt-5">
            Clear filters
          </Button>
        </>
      ) : (
        <>
          <h3 className="mt-4 text-lg font-bold text-slate-950">No applications yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Browse open roles and apply \u2014 your progress will show up here.
          </p>
          <Button onClick={onBrowseJobs} className="mt-5">
            <Search className="mr-2 h-4 w-4" />
            Browse jobs
          </Button>
        </>
      )}
    </div>
  );
}

function AppliedJobCard({
  row,
  expanded,
  onToggle,
  onViewJob,
  onViewAssignment,
}: {
  row: AppliedJobRow;
  expanded: boolean;
  onToggle: () => void;
  onViewJob: () => void;
  onViewAssignment: () => void;
}) {
  const { application, assignment, phase } = row;
  const jobTitle = application.job?.title ?? 'Untitled role';
  const companyName = application.job?.company_name ?? 'Company';
  const submittedAt = application.submitted_at ?? application.created_at;
  const submittedDate = submittedAt ? new Date(submittedAt) : null;

  return (
    <Card className="overflow-hidden transition hover:border-emerald-300 hover:shadow-md">
      <CardContent className="p-0">
        {/* Header row */}
        <button
          type="button"
          onClick={onToggle}
          className="block w-full p-5 text-left transition hover:bg-slate-50"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <PhaseStatusBadge phase={phase} />
                {assignment && (
                  <Badge className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-violet-700">
                    Project assigned
                  </Badge>
                )}
              </div>
              <h3 className="truncate text-lg font-bold text-slate-950">{jobTitle}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{companyName}</span>
                {(application.job as any)?.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {(application.job as any).location}
                  </span>
                )}
                {submittedDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Applied {submittedDate.toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden sm:block">
                <ProgressBar phase={phase} compact />
              </div>
              <ChevronRight
                className={`h-5 w-5 text-slate-400 transition ${expanded ? 'rotate-90' : ''}`}
              />
            </div>
          </div>

          {/* Mobile compact progress */}
          <div className="mt-3 sm:hidden">
            <ProgressBar phase={phase} compact />
          </div>
        </button>

        {/* Expanded body */}
        {expanded && (
          <div className="border-t border-slate-100 bg-slate-50/60 p-5">
            <ProgressBar phase={phase} />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <ActionPanel phase={phase} assignment={assignment} onViewAssignment={onViewAssignment} />
              <NextSteps phase={phase} assignment={assignment} />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={onViewJob}>
                View job details
              </Button>
              {assignment && (
                <Button onClick={onViewAssignment}>
                  {phase.currentPhase === 3
                    ? 'Continue project'
                    : phase.currentPhase === 4
                    ? 'View final decision'
                    : 'Open assignment'}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressBar({ phase, compact = false }: { phase: PhaseState; compact?: boolean }) {
  return (
    <div>
      {!compact && (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          Application progress
        </p>
      )}
      <div className="relative">
        <div className="absolute left-4 right-4 top-3.5 h-1 rounded-full bg-slate-200" />
        <div
          className={`absolute left-4 top-3.5 h-1 rounded-full transition-all duration-500 ${
            phase.terminal === 'not_selected' ? 'bg-red-400' : 'bg-emerald-500'
          }`}
          style={{
            width: `calc((100% - 2rem) * ${Math.max(0, phase.progressPhase - 1) / 3})`,
          }}
        />

        <div className="relative flex items-start justify-between">
          {PHASES.map((p) => {
            const reached = phase.progressPhase >= p.id;
            const isCurrent = phase.currentPhase === p.id && phase.terminal === null;
            const PhaseIcon = p.icon;

            const nodeColor = phase.terminal === 'not_selected' && p.id === 4
              ? 'border-red-400 bg-red-100 text-red-700'
              : reached
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 bg-white text-slate-400';

            return (
              <div key={p.id} className="flex w-0 flex-1 flex-col items-center text-center">
                <div
                  className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${nodeColor} shadow-sm`}
                >
                  {phase.terminal === 'not_selected' && p.id === 4 ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : reached ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <PhaseIcon className="h-3.5 w-3.5" />
                  )}
                </div>
                {!compact && (
                  <p
                    className={`mt-2 text-[11px] font-bold leading-tight sm:text-xs ${
                      isCurrent ? 'text-emerald-700' : reached ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {p.label}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PhaseStatusBadge({ phase }: { phase: PhaseState }) {
  if (phase.terminal === 'hired') {
    return (
      <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
        <CheckCircle2 className="mr-1.5 h-3 w-3" /> Hired
      </Badge>
    );
  }
  if (phase.terminal === 'not_selected') {
    return (
      <Badge className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700">
        <XCircle className="mr-1.5 h-3 w-3" /> Not selected
      </Badge>
    );
  }

  switch (phase.currentPhase) {
    case 1:
      return (
        <Badge className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
          <Clock className="mr-1.5 h-3 w-3" /> Application submitted
        </Badge>
      );
    case 2:
      return (
        <Badge className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
          <Hourglass className="mr-1.5 h-3 w-3" /> Awaiting project assignment
        </Badge>
      );
    case 3:
      return (
        <Badge className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-violet-700">
          <Upload className="mr-1.5 h-3 w-3" /> Complete project + video
        </Badge>
      );
    case 4:
      return (
        <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
          <Sparkles className="mr-1.5 h-3 w-3" /> Under final review
        </Badge>
      );
    default:
      return null;
  }
}

function ActionPanel({
  phase,
  assignment,
  onViewAssignment,
}: {
  phase: PhaseState;
  assignment: AssignmentWithDetails | null;
  onViewAssignment: () => void;
}) {
  if (phase.terminal === 'hired') {
    return (
      <ActionCard
        tone="emerald"
        title="You\u2019re hired"
        body="The recruiter has accepted your project submission. Your assignment has been moved to the hired state."
        actionLabel="View assignment"
        onAction={onViewAssignment}
        disabled={!assignment}
      />
    );
  }
  if (phase.terminal === 'not_selected') {
    return (
      <ActionCard
        tone="slate"
        title="Not selected this time"
        body="The recruiter has closed this assignment. Keep applying \u2014 other roles are waiting."
        actionLabel="View assignment"
        onAction={onViewAssignment}
        disabled={!assignment}
      />
    );
  }

  if (phase.currentPhase === 1) {
    return (
      <ActionCard
        tone="blue"
        title="Sit tight"
        body="Your application is in the recruiter\u2019s review queue. You\u2019ll be notified once a project brief is prepared for you."
        actionLabel="View assignment"
        onAction={onViewAssignment}
        disabled={!assignment}
      />
    );
  }

  if (phase.currentPhase === 2) {
    return (
      <ActionCard
        tone="amber"
        title="Waiting on recruiter"
        body="The recruiter has prepared the project assignment and will share details with you shortly."
        actionLabel="View assignment"
        onAction={onViewAssignment}
        disabled={!assignment}
      />
    );
  }

  if (phase.currentPhase === 3) {
    return (
      <ActionCard
        tone="violet"
        title="Your turn"
        body="Upload your project deliverable and walkthrough video from the assignment page."
        actionLabel="Continue project"
        onAction={onViewAssignment}
        disabled={!assignment}
      />
    );
  }

  // currentPhase === 4 (under final review)
  return (
    <ActionCard
      tone="emerald"
      title="Under final review"
      body="The recruiter is reviewing your submission. You\u2019ll see the final decision soon."
      actionLabel="View assignment"
      onAction={onViewAssignment}
      disabled={!assignment}
    />
  );
}

function ActionCard({
  tone,
  title,
  body,
  actionLabel,
  onAction,
  disabled,
}: {
  tone: 'emerald' | 'amber' | 'blue' | 'violet' | 'slate';
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  disabled: boolean;
}) {
  const toneMap: Record<string, { wrap: string; pill: string }> = {
    emerald: { wrap: 'border-emerald-200 bg-white', pill: 'bg-emerald-600 text-white' },
    amber: { wrap: 'border-amber-200 bg-white', pill: 'bg-amber-500 text-white' },
    blue: { wrap: 'border-blue-200 bg-white', pill: 'bg-blue-600 text-white' },
    violet: { wrap: 'border-violet-200 bg-white', pill: 'bg-violet-600 text-white' },
    slate: { wrap: 'border-slate-200 bg-white', pill: 'bg-slate-600 text-white' },
  };
  const t = toneMap[tone];

  return (
    <div className={`rounded-xl border p-4 ${t.wrap}`}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Current action</p>
      <h4 className="mt-1 text-base font-bold text-slate-950">{title}</h4>
      <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
      <Button onClick={onAction} disabled={disabled} className={`mt-3 ${t.pill}`}>
        {actionLabel}
      </Button>
    </div>
  );
}

function NextSteps({ phase, assignment }: { phase: PhaseState; assignment: AssignmentWithDetails | null }) {
  const nextPhaseIdx = Math.min(phase.progressPhase, PHASES.length - 1);
  const upcoming = PHASES.slice(nextPhaseIdx);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">What\u2019s next</p>
      <h4 className="mt-1 text-base font-bold text-slate-950">
        {phase.terminal === 'hired'
          ? 'Onboarding to follow'
          : phase.terminal === 'not_selected'
          ? 'Keep applying'
          : 'Timeline'}
      </h4>
      <ul className="mt-3 space-y-3">
        {phase.terminal === 'hired' && (
          <>
            <NextStepItem
              icon={CheckCircle2}
              title="Project accepted"
              done
              detail="Your submission met the recruiter\u2019s bar."
            />
            <NextStepItem
              icon={Briefcase}
              title="Onboarding & start date"
              detail="Your recruiter will reach out with paperwork and a start date."
            />
          </>
        )}

        {phase.terminal === 'not_selected' && (
          <NextStepItem
            icon={Search}
            title="Find your next role"
            detail="Open roles refresh daily \u2014 we\u2019ll surface matches based on your profile."
          />
        )}

        {phase.terminal === null && (
          <>
            <NextStepItem
              icon={phase.progressPhase >= 1 ? CheckCircle2 : Circle}
              title={PHASES[0].label}
              detail={PHASES[0].description}
              done={phase.progressPhase >= 1}
            />
            <NextStepItem
              icon={phase.progressPhase >= 2 ? CheckCircle2 : Circle}
              title={PHASES[1].label}
              detail={assignment ? 'Project assignment is being prepared.' : PHASES[1].description}
              done={phase.progressPhase >= 2}
            />
            <NextStepItem
              icon={phase.progressPhase >= 3 ? CheckCircle2 : Circle}
              title={PHASES[2].label}
              detail={PHASES[2].description}
              done={phase.progressPhase >= 3}
            />
            <NextStepItem
              icon={phase.progressPhase >= 4 ? CheckCircle2 : Circle}
              title={PHASES[3].label}
              detail={PHASES[3].description}
              done={phase.progressPhase >= 4}
            />
          </>
        )}
      </ul>
    </div>
  );
}

function NextStepItem({
  icon: Icon,
  title,
  detail,
  done = false,
}: {
  icon: typeof Circle;
  title: string;
  detail: string;
  done?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <p className={`text-sm font-semibold ${done ? 'text-slate-950' : 'text-slate-700'}`}>{title}</p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
    </li>
  );
}
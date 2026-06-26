/**
 * All Projects Screen
 * Shows all assigned candidates with status and submission tracking
 * Recruiter can verify, approve, and hire candidates
 */

import { useEffect, useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Circle,
  FileCheck,
  UserCheck,
  Briefcase,
  Users,
  Search,
  Filter,
  ChevronRight,
  Loader2,
  AlertCircle,
  Calendar,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { projectAssignmentsService, type AssignmentWithDetails } from '@/src/hirevify-app/services/projectAssignmentsService';
import { toast } from 'sonner';
import { cn } from './ui/utils';

// Phase types for both candidate and recruiter views
type CandidatePhase = 'pending' | 'working' | 'submitted' | 'complete';
type RecruiterPhase = 'assigned' | 'reviewing' | 'approved' | 'hired';

interface OngoingProjectsProps {
  onBack: () => void;
  onViewCandidateDetail?: (assignmentId: string) => void;
  onViewMessages?: (candidateId?: string) => void;
}

// Phase configuration
const CANDIDATE_PHASES: { key: CandidatePhase; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: 'bg-slate-100 text-slate-600' },
  { key: 'working', label: 'Working', color: 'bg-blue-100 text-blue-600' },
  { key: 'submitted', label: 'Submitted', color: 'bg-amber-100 text-amber-600' },
  { key: 'complete', label: 'Complete', color: 'bg-emerald-100 text-emerald-600' },
];

const RECRUITER_PHASES: { key: RecruiterPhase; label: string; color: string }[] = [
  { key: 'assigned', label: 'Assigned', color: 'bg-slate-100 text-slate-600' },
  { key: 'reviewing', label: 'Reviewing', color: 'bg-blue-100 text-blue-600' },
  { key: 'approved', label: 'Approved', color: 'bg-violet-100 text-violet-600' },
  { key: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-600' },
];

// Map assignment status to phases
function getCandidatePhase(status: string): CandidatePhase {
  switch (status) {
    case 'pending':
    case 'accepted':
      return 'pending';
    case 'rejected':
      return 'pending';
    case 'submitted':
      return 'submitted';
    case 'under_review':
    case 'hired':
      return 'complete';
    default:
      return 'working';
  }
}

function getRecruiterPhase(status: string): RecruiterPhase {
  switch (status) {
    case 'pending':
    case 'accepted':
      return 'assigned';
    case 'submitted':
      return 'reviewing';
    case 'under_review':
      return 'approved';
    case 'hired':
      return 'hired';
    case 'not_selected':
      return 'assigned';
    default:
      return 'assigned';
  }
}

function getPhaseIndex(phase: CandidatePhase | RecruiterPhase, phases: any[]): number {
  return phases.findIndex(p => p.key === phase);
}

// Progress bar component
function PhaseProgressBar({
  phases,
  currentPhase,
  phaseIndex,
  showLabels = true,
}: {
  phases: { key: string; label: string; color: string }[];
  currentPhase: string;
  phaseIndex: number;
  showLabels?: boolean;
}) {
  return (
    <div className="space-y-2">
      {showLabels && (
        <div className="flex justify-between text-xs text-slate-500">
          {phases.map((phase, idx) => (
            <span
              key={phase.key}
              className={cn(
                'transition-colors',
                idx <= phaseIndex ? 'text-slate-700 font-medium' : 'text-slate-400'
              )}
            >
              {phase.label}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1">
        {phases.map((phase, idx) => {
          const isComplete = idx < phaseIndex;
          const isCurrent = idx === phaseIndex;
          return (
            <div key={phase.key} className="flex-1">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  isComplete
                    ? 'bg-emerald-500'
                    : isCurrent
                    ? phase.color.replace('100', '500')
                    : 'bg-slate-200'
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Candidate card component
function CandidateCard({
  assignment,
  onViewDetail,
  onMessage,
}: {
  assignment: AssignmentWithDetails;
  onViewDetail: () => void;
  onMessage: () => void;
}) {
  const candidatePhase = getCandidatePhase(assignment.assignment_status);
  const recruiterPhase = getRecruiterPhase(assignment.assignment_status);
  const candidatePhaseIndex = getPhaseIndex(candidatePhase, CANDIDATE_PHASES);
  const recruiterPhaseIndex = getPhaseIndex(recruiterPhase, RECRUITER_PHASES);

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    submitted: 'bg-amber-50 text-amber-700 border-amber-200',
    under_review: 'bg-violet-50 text-violet-700 border-violet-200',
    hired: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    not_selected: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Awaiting Response',
      accepted: 'Working',
      rejected: 'Declined',
      submitted: 'Submitted',
      under_review: 'Under Review',
      hired: 'Hired',
      not_selected: 'Not Selected',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const openSubmission = (url: string | null | undefined) => {
    if (!url) return;
    const firstUrl = url.split(',').map((value) => value.trim()).filter(Boolean)[0];
    if (!firstUrl) return;
    window.open(firstUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md cursor-pointer"
      onClick={onViewDetail}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 font-semibold">
              {assignment.candidate_profile?.full_name?.charAt(0).toUpperCase() || 'C'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-slate-900">
              {assignment.candidate_profile?.full_name || 'Candidate'}
            </h3>
            <p className="text-sm text-slate-500">
              {assignment.candidate_profile?.email || 'No email'}
            </p>
          </div>
        </div>
        <Badge className={cn('shrink-0', statusColors[assignment.assignment_status] || 'bg-slate-50')}>
          {getStatusLabel(assignment.assignment_status)}
        </Badge>
      </div>

      {/* Project Info */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Briefcase className="h-4 w-4 text-slate-400" />
        <span className="text-slate-600">
          {assignment.job?.title || assignment.project?.title || 'Project'}
        </span>
      </div>

      {/* Candidate Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500">Candidate Progress</span>
          <span className="text-xs text-slate-400">{candidatePhaseIndex + 1}/4</span>
        </div>
        <PhaseProgressBar
          phases={CANDIDATE_PHASES}
          currentPhase={candidatePhase}
          phaseIndex={candidatePhaseIndex}
          showLabels={false}
        />
      </div>

      {/* Recruiter Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500">Recruiter Action</span>
          <span className="text-xs text-slate-400">{recruiterPhaseIndex + 1}/4</span>
        </div>
        <PhaseProgressBar
          phases={RECRUITER_PHASES}
          currentPhase={recruiterPhase}
          phaseIndex={recruiterPhaseIndex}
          showLabels={false}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar className="h-3 w-3" />
          <span>Assigned {formatDate(assignment.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          {assignment.project_submission_url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openSubmission(assignment.project_submission_url);
              }}
              className="h-8 text-slate-500 hover:text-emerald-600"
            >
              <FileCheck className="h-4 w-4" />
            </Button>
          )}
          {assignment.video_submission_url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openSubmission(assignment.video_submission_url);
              }}
              className="h-8 text-slate-500 hover:text-purple-600"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onMessage();
            }}
            className="h-8 text-slate-500 hover:text-blue-600"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
}

export function OngoingProjects({ onBack, onViewCandidateDetail, onViewMessages }: OngoingProjectsProps) {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [recruiterId, setRecruiterId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Load recruiter profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user?.id) return;

        const { data: profileRow } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', authData.user.id)
          .maybeSingle();

        if (profileRow?.id) {
          setRecruiterId(profileRow.id);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    loadProfile();
  }, []);

  // Load assignments
  useEffect(() => {
    if (!recruiterId) return;

    const loadAssignments = async () => {
      setLoading(true);
      try {
        const { data, error } = await projectAssignmentsService.getRecruiterAssignments(recruiterId);
        if (error) {
          console.error('Error loading assignments:', error);
          toast.error('Failed to load projects');
          return;
        }
        setAssignments(data || []);
      } catch (err) {
        console.error('Error loading assignments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [recruiterId]);

  // Get unique jobs/projects from assignments
  const jobs = useMemo(() => {
    const jobMap = new Map<string, { id: string; title: string; count: number }>();
    assignments.forEach((a) => {
      const jobId = a.job_id || a.project_id;
      const jobTitle = a.job?.title || a.project?.title || 'Unknown';
      const existing = jobMap.get(jobId);
      if (existing) {
        existing.count++;
      } else {
        jobMap.set(jobId, { id: jobId, title: jobTitle, count: 1 });
      }
    });
    return Array.from(jobMap.values());
  }, [assignments]);

  // Stats
  const stats = useMemo(() => {
    const active = assignments.filter((a) => !['hired', 'not_selected', 'rejected'].includes(a.assignment_status));
    const pendingReview = assignments.filter((a) => a.assignment_status === 'submitted');
    const underReview = assignments.filter((a) => a.assignment_status === 'under_review');
    const hired = assignments.filter((a) => a.assignment_status === 'hired');

    return {
      total: assignments.length,
      active: active.length,
      pendingReview: pendingReview.length,
      underReview: underReview.length,
      hired: hired.length,
    };
  }, [assignments]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Status filter
      if (statusFilter !== 'all' && a.assignment_status !== statusFilter) {
        return false;
      }
      // Job filter
      if (selectedJobId) {
        const jobId = a.job_id || a.project_id;
        if (jobId !== selectedJobId) return false;
      }
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const candidateName = a.candidate_profile?.full_name?.toLowerCase() || '';
        const candidateEmail = a.candidate_profile?.email?.toLowerCase() || '';
        const jobTitle = a.job?.title?.toLowerCase() || '';
        const projectTitle = a.project?.title?.toLowerCase() || '';
        if (
          !candidateName.includes(search) &&
          !candidateEmail.includes(search) &&
          !jobTitle.includes(search) &&
          !projectTitle.includes(search)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [assignments, statusFilter, selectedJobId, searchTerm]);

  // Group assignments by job/project
  const groupedAssignments = useMemo(() => {
    const groups: Record<string, AssignmentWithDetails[]> = {};
    filteredAssignments.forEach((a) => {
      const jobId = a.job_id || a.project_id;
      if (!groups[jobId]) {
        groups[jobId] = [];
      }
      groups[jobId].push(a);
    });
    return groups;
  }, [filteredAssignments]);

  const handleViewDetail = (assignmentId: string) => {
    onViewCandidateDetail?.(assignmentId);
  };

  const handleMessage = (candidateId: string) => {
    onViewMessages?.(candidateId);
  };

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">All Projects</h1>
              <p className="text-sm text-slate-500">Track every assigned project, submission, and decision</p>
            </div>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {stats.total} Total
          </Badge>
        </div>
      </header>

      {/* Stats Row */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.pendingReview}</p>
            <p className="text-xs text-slate-500">Submitted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-violet-600">{stats.underReview}</p>
            <p className="text-xs text-slate-500">Under Review</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.hired}</p>
            <p className="text-xs text-slate-500">Hired</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Working</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="hired">Hired</option>
            <option value="not_selected">Not Selected</option>
          </select>

          {/* Job Filter */}
          <select
            value={selectedJobId || ''}
            onChange={(e) => setSelectedJobId(e.target.value || null)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} ({job.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4">
              <Briefcase className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">No projects yet</h3>
            <p className="text-sm text-slate-500">
              Assign candidates to projects from the ATS view to see them here.
            </p>
            <Button onClick={onBack} className="mt-4">
              Go to ATS
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAssignments).map(([jobId, jobAssignments]) => (
              <div key={jobId}>
                {/* Job Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <h2 className="font-semibold text-slate-900">
                      {jobAssignments[0]?.job?.title || jobAssignments[0]?.project?.title || 'Project'}
                    </h2>
                  </div>
                  <Badge variant="outline">{jobAssignments.length} candidates</Badge>
                </div>

                {/* Candidate Cards */}
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {jobAssignments.map((assignment) => (
                    <CandidateCard
                      key={assignment.id}
                      assignment={assignment}
                      onViewDetail={() => handleViewDetail(assignment.id)}
                      onMessage={() => handleMessage(assignment.candidate_id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-medium">Candidate Progress:</span>
            {CANDIDATE_PHASES.map((phase) => (
              <span key={phase.key} className="flex items-center gap-1">
                <span className={cn('h-2 w-2 rounded-full', phase.color.replace('100', '500'))} />
                {phase.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Recruiter Action:</span>
            {RECRUITER_PHASES.map((phase) => (
              <span key={phase.key} className="flex items-center gap-1">
                <span className={cn('h-2 w-2 rounded-full', phase.color.replace('100', '500'))} />
                {phase.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

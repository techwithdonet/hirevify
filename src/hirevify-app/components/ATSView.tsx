import { useEffect, useMemo, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Calendar,
  FileText,
  Crown,
  Search,
  Briefcase,
  CheckSquare,
  Square,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  Filter,
  X,
  RefreshCw,
  Loader2,
  Target,
  TrendingUp,
  AlertCircle,
  Check,
  Zap,
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { calculateAtsMatch, type AtsMatchResult } from '@/src/hirevify-app/services/atsMatchingService';
import { projectAssignmentsService } from '@/src/hirevify-app/services/projectAssignmentsService';
import { dashboardTheme } from '../theme/dashboardTheme';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';

type CandidateStatus = 'applied' | 'reviewing' | 'screening' | 'shortlisted' | 'accepted' | 'assigned' | 'in_progress' | 'completed' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'submitted' | 'under_review' | 'hired' | 'not_selected';

interface JobApplication {
  id: string;
  applicationId: string;
  candidateId: string;
  name: string;
  email: string;
  jobId: string;
  jobTitle: string;
  status: CandidateStatus;
  matchScore: number;
  appliedDate: string;
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

interface Job {
  id: string;
  title: string;
  description: string;
  skills: string[];
  requirements: string[];
  experience_level: string | null;
  status: string;
  applicationCount: number;
}

interface AssignmentRecord {
  id: string;
  candidateName: string;
  candidateEmail: string;
  assignmentStatus: AssignmentStatus;
  assignedAt: string;
  respondedAt?: string;
}

interface ATSViewProps {
  onBack: () => void;
  onStartInterview: () => void;
  onViewMessages: (conversationId?: string) => void;
  selectedCandidate?: any;
}

export function ATSView({ onBack, onStartInterview, onViewMessages, selectedCandidate }: ATSViewProps) {
  const { user } = useAuth();
  const [recruiterId, setRecruiterId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  // Tracks which application IDs already have an assignment — these are read-only
  const [assignedCandidateIds, setAssignedCandidateIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchFilter, setMatchFilter] = useState<'all' | '70plus' | 'below'>('all');
  const [showAssignmentPanel, setShowAssignmentPanel] = useState(false);

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

  // Load recruiter's jobs
  useEffect(() => {
    if (!recruiterId) return;
    const loadJobs = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('jobs')
          .select('id, title, description, skills, requirements, experience_level, status')
          .eq('recruiter_id', recruiterId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get application counts per job
        const jobIds = (data || []).map((j: any) => j.id);
        let appCounts: Record<string, number> = {};
        if (jobIds.length > 0) {
          const { data: apps } = await supabase
            .from('applications')
            .select('job_id')
            .in('job_id', jobIds);
          apps?.forEach((a: any) => {
            appCounts[a.job_id] = (appCounts[a.job_id] || 0) + 1;
          });
        }

        setJobs((data || []).map((j: any) => ({
          ...j,
          applicationCount: appCounts[j.id] || 0,
        })));

        // Auto-select first job or passed-in job
        if (selectedCandidate?.job_id) {
          setSelectedJobId(selectedCandidate.job_id);
        } else if ((data || []).length > 0) {
          setSelectedJobId((data as any[])[0].id);
        }
      } catch (err) {
        console.error('Error loading jobs:', err);
      }
    };
    loadJobs();
  }, [recruiterId]);

  // Load applications for selected job
  useEffect(() => {
    if (!recruiterId || !selectedJobId) {
      setApplications([]);
      return;
    }
    const loadApplications = async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const authToken = sessionData.session?.access_token || null;

        const job = jobs.find((j) => j.id === selectedJobId);
        const { data: apps, error: appsError } = await supabase
          .from('applications')
          .select('id, job_id, candidate_id, cover_letter, status, match_score, notes, created_at, updated_at')
          .eq('job_id', selectedJobId)
          .order('created_at', { ascending: false });

        if (appsError) throw appsError;

        const candidateIds = (apps || []).map((a: any) => a.candidate_id).filter(Boolean);
        const { data: profiles } = candidateIds.length > 0
          ? await supabase.from('profiles').select('id, auth_user_id, full_name, email, location').in('id', candidateIds)
          : { data: [] };

        const profileAuthIds = (profiles || []).map((p: any) => p.auth_user_id).filter(Boolean);
        const { data: candidateDetails } = profileAuthIds.length > 0
          ? await supabase.from('candidate_profiles').select('*').in('user_id', profileAuthIds)
          : { data: [] };

        const mapped: JobApplication[] = await Promise.all((apps || []).map(async (app: any) => {
          const profile = (profiles || []).find((p: any) => p.id === app.candidate_id);
          const details = (candidateDetails || []).find(
            (d: any) => d.user_id === profile?.id || d.user_id === profile?.auth_user_id
          );
          const skills = Array.isArray(details?.skills) ? details.skills : [];
          const resumeUrl = details?.resume_url || details?.resume_file_url || '';

          const atsMatch = await calculateAtsMatch(
            {
              id: job?.id || selectedJobId,
              title: job?.title || '',
              description: job?.description || '',
              requirements: Array.isArray(job?.requirements) ? job.requirements : [],
              skills: Array.isArray(job?.skills) ? job.skills : [],
              experience_level: job?.experience_level || null,
            },
            {
              applicationId: app.id,
              name: details?.full_name || profile?.full_name || 'Candidate',
              skills,
              headline: details?.headline || '',
              summary: details?.profile_summary || details?.summary || details?.bio || '',
              resumeUrl,
              resumeText: details?.resume_text || details?.resume_content || '',
              coverLetter: app.cover_letter || '',
              experience: details?.experience_summary ||
                (typeof details?.years_of_experience === 'number'
                  ? `${details.years_of_experience} year${details.years_of_experience === 1 ? '' : 's'} experience`
                  : 'Not specified'),
              storedScore: app.match_score,
            },
            authToken
          );

          if ((app.match_score === null || app.match_score === undefined) && atsMatch.score > 0) {
            await supabase.from('applications').update({ match_score: atsMatch.score }).eq('id', app.id);
          }

          return {
            id: `app-${app.id}`,
            applicationId: app.id,
            candidateId: app.candidate_id,
            name: details?.full_name || profile?.full_name || 'Candidate',
            email: profile?.email || '',
            jobId: app.job_id,
            jobTitle: job?.title || '',
            status: (app.status || 'applied') as CandidateStatus,
            matchScore: atsMatch.score,
            appliedDate: app.created_at,
            skills,
            experience: details?.experience_summary ||
              (typeof details?.years_of_experience === 'number'
                ? `${details.years_of_experience} year${details.years_of_experience === 1 ? '' : 's'} experience`
                : 'Not specified'),
            location: details?.location || profile?.location || 'Not specified',
            coverLetter: app.cover_letter || '',
            resumeUrl,
            atsMatchedKeywords: atsMatch.matchedKeywords,
            atsMissingKeywords: atsMatch.missingKeywords,
            atsExplanation: atsMatch.explanation,
            scoreSource: atsMatch.source,
          };
        }));

        setApplications(mapped.sort((a, b) => b.matchScore - a.matchScore));
      } catch (err) {
        console.error('Error loading applications:', err);
        toast.error('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, [recruiterId, selectedJobId, jobs]);

  // Load assignments for selected job
  useEffect(() => {
    setSelectedCandidateIds(new Set()); // reset selections when switching jobs
    if (!selectedJobId) {
      setAssignments([]);
      setAssignedCandidateIds(new Set());
      return;
    }
    const loadAssignments = async () => {
      try {
        const { data, error } = await projectAssignmentsService.getJobAssignments(selectedJobId);
        if (error) throw error;

        setAssignments((data || []).map((a: any) => ({
          id: a.id,
          candidateName: a.candidate_profile?.full_name || 'Candidate',
          candidateEmail: a.candidate_profile?.email || '',
          assignmentStatus: a.assignment_status,
          assignedAt: a.created_at,
          respondedAt: a.assignment_status !== 'pending' ? a.updated_at : undefined,
        })));

        // Build a set of already-assigned application IDs so we can lock those cards
        setAssignedCandidateIds(new Set((data || []).map((a: any) => a.application_id).filter(Boolean)));
      } catch (err) {
        console.error('Error loading assignments:', err);
      }
    };
    loadAssignments();
  }, [selectedJobId]);

  const filteredApplications = useMemo(() => {
    let result = applications;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          a.email.toLowerCase().includes(term) ||
          a.skills.some((s) => s.toLowerCase().includes(term))
      );
    }

    if (matchFilter === '70plus') {
      result = result.filter((a) => a.matchScore >= 70);
    } else if (matchFilter === 'below') {
      result = result.filter((a) => a.matchScore < 70);
    }

    return result;
  }, [applications, searchTerm, matchFilter]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const selectedJobApplications = filteredApplications;
  // High-match list for display — includes assigned so recruiter can see the stats
  const highMatchApps = applications.filter((a) => a.matchScore >= 70);
  // Selectable high-match = exclude already-assigned (already shown as locked cards)
  const selectableHighMatch = highMatchApps.filter((a) => !assignedCandidateIds.has(a.id));
  // Only count selectable (unassigned) candidates in the selected count
  const selectedCount = Array.from(selectedCandidateIds).filter(
    (id) => !assignedCandidateIds.has(id)
  ).length;

  const toggleCandidate = (id: string) => {
    // Already-assigned candidates cannot be re-assigned
    if (assignedCandidateIds.has(id)) return;
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllHighMatch = () => {
    // Only select high-match candidates that aren't already assigned
    const selectable = highMatchApps
      .filter((a) => !assignedCandidateIds.has(a.id))
      .map((a) => a.id);
    setSelectedCandidateIds(new Set(selectable));
  };

  const deselectAll = () => {
    setSelectedCandidateIds(new Set());
  };

  const handleSendAssignment = async () => {
    if (selectedCandidateIds.size === 0) {
      toast.error('Select at least one candidate to assign');
      return;
    }

    if (!selectedJobId || !recruiterId) return;

    setSending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      let createdCount = 0;

      for (const appId of selectedCandidateIds) {
        const app = applications.find((a) => a.id === appId);
        if (!app) continue;

        // Check if assignment already exists
        const { hasAssignment } = await projectAssignmentsService.hasExistingAssignment(
          selectedJobId,
          selectedJobId,
          app.candidateId
        );

        if (hasAssignment) continue;

        const { error } = await projectAssignmentsService.createAssignment({
          jobId: selectedJobId,
          projectId: selectedJobId,
          candidateId: app.candidateId,
          recruiterId: recruiterId,
          applicationId: app.applicationId,
        });

        if (!error) {
          // Update application status
          await supabase
            .from('applications')
            .update({ status: 'assigned' })
            .eq('id', app.applicationId);

          // Send notification to candidate
          await supabase.from('notifications').insert([
            {
              user_id: app.candidateId,
              type: 'assignment',
              title: 'New Project Assignment',
              message: `You have been assigned to "${selectedJob?.title}". Please review and accept or decline.`,
              read: false,
            },
          ]);

          createdCount++;
        }
      }

      toast.success(`${createdCount} candidate${createdCount === 1 ? '' : 's'} assigned successfully`);
      setSelectedCandidateIds(new Set());

      // Refresh assignments
      const { data } = await projectAssignmentsService.getJobAssignments(selectedJobId);
      setAssignments((data || []).map((a: any) => ({
        id: a.id,
        candidateName: a.candidate_profile?.full_name || 'Candidate',
        candidateEmail: a.candidate_profile?.email || '',
        assignmentStatus: a.assignment_status,
        assignedAt: a.created_at,
        respondedAt: a.assignment_status !== 'pending' ? a.updated_at : undefined,
      })));

      // Refresh applications
      const { data: updatedApps } = await supabase
        .from('applications')
        .select('id, job_id, candidate_id, cover_letter, status, match_score, notes, created_at, updated_at')
        .eq('job_id', selectedJobId)
        .order('created_at', { ascending: false });

      if (updatedApps) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, auth_user_id, full_name, email, location')
          .in('id', updatedApps.map((a: any) => a.candidate_id));

        setApplications(
          updatedApps.map((app: any) => {
            const profile = (profiles || []).find((p: any) => p.id === app.candidate_id);
            return {
              ...app,
              name: profile?.full_name || 'Candidate',
              email: profile?.email || '',
            };
          }).map((app: any) => ({
            id: `app-${app.id}`,
            applicationId: app.id,
            candidateId: app.candidate_id,
            name: app.name,
            email: app.email,
            jobId: app.job_id,
            jobTitle: selectedJob?.title || '',
            status: (app.status || 'applied') as CandidateStatus,
            matchScore: app.match_score || 0,
            appliedDate: app.created_at,
            skills: [],
            experience: '',
            location: 'Not specified',
            coverLetter: '',
            resumeUrl: '',
            atsMatchedKeywords: [],
            atsMissingKeywords: [],
            atsExplanation: '',
            scoreSource: 'stored' as AtsMatchResult['source'],
          }))
        );
      }
    } catch (err) {
      console.error('Error sending assignments:', err);
      toast.error('Failed to send assignments');
    } finally {
      setSending(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-yellow-600';
    if (score > 0) return 'text-red-500';
    return 'text-slate-400';
  };

  const getMatchBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    if (score > 0) return 'bg-red-50 border-red-200';
    return 'bg-slate-50 border-slate-200';
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      applied: 'bg-blue-50 text-blue-700 border-blue-200',
      reviewing: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      screening: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      shortlisted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      assigned: 'bg-teal-50 text-teal-700 border-teal-200',
      in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      interview: 'bg-purple-50 text-purple-700 border-purple-200',
      offer: 'bg-green-50 text-green-700 border-green-200',
      hired: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      withdrawn: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return map[status] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const getAssignmentBadge = (status: string) => {
    const map: Record<string, { class: string; icon: any; label: string }> = {
      pending: { class: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' },
      accepted: { class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Accepted' },
      rejected: { class: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Declined' },
      submitted: { class: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText, label: 'Submitted' },
      under_review: { class: 'bg-purple-50 text-purple-700 border-purple-200', icon: RefreshCw, label: 'Under Review' },
      hired: { class: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: Check, label: 'Hired' },
      not_selected: { class: 'bg-slate-50 text-slate-600 border-slate-200', icon: X, label: 'Not Selected' },
    };
    return map[status] || { class: 'bg-slate-50 text-slate-600 border-slate-200', icon: Clock, label: status };
  };

  const getInitials = (name: string) =>
    name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'C';

  return (
    <div className={dashboardTheme.page}>
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="rounded-lg text-slate-600 hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={(hirevifyLogo as any).src ?? hirevifyLogo} alt="HireVify" className="h-14 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-emerald-700">Applications</p>
                <h1 className="truncate text-2xl font-semibold text-slate-950">Job Application Manager</h1>
                <p className="text-sm text-slate-500">Select a job to view and manage applications</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Job Selector */}
        <div className="mb-6 rounded-lg border border-emerald-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-950">Select a Job</h2>
              </div>
              {selectedJob && (
                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                  {selectedJobApplications.length} application{selectedJobApplications.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          {/* Job cards */}
          {jobs.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-700">No jobs posted yet</p>
              <p className="mt-1 text-sm text-slate-500">Post a job to start receiving applications.</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto p-4">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setSelectedCandidateIds(new Set());
                  }}
                  className={`min-w-[200px] shrink-0 rounded-lg border-2 p-4 text-left transition-all ${
                    selectedJobId === job.id
                      ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      job.status === 'published'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {job.status || 'published'}
                    </span>
                    <span className="text-xs text-slate-400">#{job.applicationCount || 0}</span>
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold text-slate-950">{job.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{job.skills?.slice(0, 3).join(', ')}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedJobId && (
          <>
            {/* Assignment Action Bar */}
            <div className="mb-6 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAllHighMatch}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    disabled={selectableHighMatch.length === 0}
                  >
                    <CheckSquare className="mr-1.5 h-4 w-4" />
                    Select All (70%+)
                    {selectableHighMatch.length > 0 && (
                      <Badge className="ml-1.5 bg-blue-600 text-white">{selectableHighMatch.length}</Badge>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={deselectAll}
                    className="border-slate-300 text-slate-600 hover:bg-slate-100"
                    disabled={selectedCount === 0}
                  >
                    <Square className="mr-1.5 h-4 w-4" />
                    Deselect All
                  </Button>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="font-medium">{selectedCount}</span>
                    <span>candidates selected</span>
                  </div>

                  {selectedCount > 0 && (
                    <Button
                      size="sm"
                      onClick={handleSendAssignment}
                      disabled={sending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {sending ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-1.5 h-4 w-4" />
                      )}
                      Send Assignment
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600">
                  {selectableHighMatch.length > 0 && (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                      <Target className="h-3.5 w-3.5" />
                      {selectableHighMatch.length} selectable (70%+)
                    </span>
                  )}
                  {assignedCandidateIds.size > 0 && (
                    <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-teal-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {assignedCandidateIds.size} already assigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content: Applications + Status */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
              {/* Left: Applications List */}
              <div className="space-y-4">
                {/* Search + Filter */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search candidates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(['all', '70plus', 'below'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setMatchFilter(f)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          matchFilter === f
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {f === 'all' ? 'All Matches' : f === '70plus' ? '70%+ Match' : '<70% Match'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Applications List */}
                {loading ? (
                  <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  </div>
                ) : selectedJobApplications.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                    <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="font-semibold text-slate-700">
                      {searchTerm || matchFilter !== 'all'
                        ? 'No applications match your filters'
                        : 'No applications for this job yet'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {searchTerm || matchFilter !== 'all'
                        ? 'Try adjusting your search or filter'
                        : 'Candidates will appear here when they apply'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedJobApplications.map((app) => {
                      const isSelected = selectedCandidateIds.has(app.id);
                      const isHighMatch = app.matchScore >= 70;
                      const isAlreadyAssigned = assignedCandidateIds.has(app.id);

                      return (
                        <Card
                          key={app.id}
                          className={`border-2 transition-all ${
                            isAlreadyAssigned
                              ? 'cursor-default border-teal-300 bg-teal-50/50 opacity-80'
                              : isSelected
                              ? 'cursor-pointer border-blue-400 bg-blue-50 shadow-sm'
                              : isHighMatch
                              ? 'cursor-pointer border-emerald-200 bg-white hover:border-emerald-400'
                              : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          onClick={() => !isAlreadyAssigned && toggleCandidate(app.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              {/* Checkbox / lock icon */}
                              <div className="shrink-0">
                                {isAlreadyAssigned ? (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100">
                                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                                  </div>
                                ) : isSelected ? (
                                  <CheckSquare className="h-6 w-6 text-blue-600" />
                                ) : (
                                  <Square className="h-6 w-6 text-slate-300" />
                                )}
                              </div>

                              {/* Avatar + Info */}
                              <Avatar className="h-12 w-12 shrink-0">
                                <AvatarFallback className={`text-sm font-semibold ${
                                  isHighMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {getInitials(app.name)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-base font-semibold text-slate-950">{app.name}</p>
                                  {isAlreadyAssigned ? (
                                    <Badge className="bg-teal-50 text-teal-700 border-teal-200" variant="outline">
                                      Assigned
                                    </Badge>
                                  ) : (
                                    <Badge className={getStatusBadge(app.status)} variant="outline">
                                      {app.status}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                                  <Mail className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{app.email}</span>
                                  <span className="text-slate-300">·</span>
                                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                                  <span>{new Date(app.appliedDate).toLocaleDateString()}</span>
                                </div>
                                {app.skills.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {app.skills.slice(0, 5).map((skill) => (
                                      <span
                                        key={skill}
                                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {app.skills.length > 5 && (
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                        +{app.skills.length - 5}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {app.atsMatchedKeywords.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {app.atsMatchedKeywords.slice(0, 4).map((kw) => (
                                      <span
                                        key={kw}
                                        className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 border border-emerald-200"
                                      >
                                        {kw}
                                      </span>
                                    ))}
                                    {app.atsMissingKeywords.length > 0 && (
                                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600 border border-red-200">
                                        -{app.atsMissingKeywords.length}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Match Score */}
                              <div className="shrink-0 text-right">
                                <div className={`rounded-lg border px-3 py-2 ${getMatchBg(app.matchScore)}`}>
                                  <p className="text-xs font-semibold uppercase text-slate-500">Match</p>
                                  <p className={`text-2xl font-bold ${getMatchColor(app.matchScore)}`}>
                                    {app.matchScore}%
                                  </p>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">
                                  {app.scoreSource === 'openai' ? 'AI analysis' : app.scoreSource === 'stored' ? 'Saved' : 'Keyword'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Application Status */}
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-600" />
                      <h3 className="font-semibold text-slate-950">Application Status</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Track assignments for <span className="font-medium">{selectedJob?.title}</span>
                    </p>
                  </div>

                  {assignments.length === 0 ? (
                    <div className="p-6 text-center">
                      <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">No assignments yet</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Assign candidates to track their status here
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {assignments.map((a) => {
                        const badge = getAssignmentBadge(a.assignmentStatus);
                        const Icon = badge.icon;
                        return (
                          <div key={a.id} className="flex items-center gap-3 p-4">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badge.class} border`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-950">{a.candidateName}</p>
                              <p className="truncate text-xs text-slate-400">{a.candidateEmail}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={badge.class} variant="outline">{badge.label}</Badge>
                              {a.respondedAt && (
                                <p className="mt-1 text-xs text-slate-400">
                                  {new Date(a.respondedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Stats Summary */}
                {assignments.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total', value: assignments.length, color: 'text-slate-700 bg-slate-50' },
                      { label: 'Pending', value: assignments.filter(a => a.assignmentStatus === 'pending').length, color: 'text-amber-700 bg-amber-50' },
                      { label: 'Accepted', value: assignments.filter(a => a.assignmentStatus === 'accepted').length, color: 'text-emerald-700 bg-emerald-50' },
                      { label: 'Rejected', value: assignments.filter(a => a.assignmentStatus === 'rejected').length, color: 'text-red-700 bg-red-50' },
                    ].map((stat) => (
                      <div key={stat.label} className={`rounded-lg border border-slate-200 p-3 text-center ${stat.color}`}>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs font-medium">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!selectedJobId && jobs.length > 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-24 text-center">
            <Target className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">Select a job above</h3>
            <p className="mt-2 text-sm text-slate-500">
              Choose a job from your list to view and manage candidate applications
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

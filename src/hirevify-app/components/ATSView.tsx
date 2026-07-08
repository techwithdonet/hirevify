import { useEffect, useMemo, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
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
  Video,
  PlayCircle,
  FileCheck,
  MapPin,
  Award,
  GraduationCap,
  ExternalLink,
  Download,
  Star,
  XIcon,
  Phone,
  Globe,
  Building2,
  Home,
  Wallet,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { calculateAtsMatch, type AtsMatchResult } from '@/src/hirevify-app/services/atsMatchingService';
import { projectAssignmentsService } from '@/src/hirevify-app/services/projectAssignmentsService';
import { applicationsService } from '@/src/hirevify-app/services/applicationsService';
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
  resumeFileName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  atsMatchedKeywords: string[];
  atsMissingKeywords: string[];
  atsExplanation: string;
  scoreSource: AtsMatchResult['source'];
  // Extended profile fields for candidate profile modal
  profileCompleteness?: number | null;
  headline?: string | null;
  profileSummary?: string | null;
  yearsOfExperience?: number | null;
  certifications?: string[] | null;
  education?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  portfolioLinks?: string[];
  cvSignedUrl?: string | null;
  allAtsCategories?: AtsMatchResult['categories'];
  dateOfBirth?: string | null;
  // Rich profile fields (extended for Candidate Profile popup)
  workMode?: string | null;
  willingToRelocate?: boolean | null;
  noticePeriod?: string | null;
  employmentType?: string | null;
  employmentStatus?: string | null;
  expectedSalary?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  languages?: string[] | null;
  achievements?: string[] | null;
  previousCompanies?: string[] | null;
  careerLevel?: string | null;
  industry?: string | null;
  preferredRoles?: string[] | null;
  preferredWorkType?: string[] | null;
  currentCompany?: string | null;
  currentDesignation?: string | null;
  profileViews?: number | null;
  profileLastUpdated?: string | null;
  emailVerified?: boolean | null;
  phoneVerified?: boolean | null;
  resumeVerified?: boolean | null;
  availability?: string | null;
  timezone?: string | null;
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
  applicationId: string | null;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  assignmentStatus: AssignmentStatus;
  assignedAt: string;
  respondedAt?: string;
  projectSubmissionUrl?: string | null;
  videoSubmissionUrl?: string | null;
  submissionNotes?: string | null;
}

interface ATSViewProps {
  onBack: () => void;
  onStartInterview: () => void;
  onViewMessages: (conversationId?: string) => void;
  onViewOngoingProjects?: () => void;
  onViewCandidateDetail?: (candidate: any) => void;
  selectedCandidate?: any;
}

const isProjectOnlyJobRow = (job: any) => job?.job_type === 'freelance' && job?.has_project === true;

const mapAssignmentRecord = (assignment: any): AssignmentRecord => ({
  id: assignment.id,
  applicationId: assignment.application_id || null,
  candidateId: assignment.candidate_id,
  candidateName: assignment.candidate_profile?.full_name || 'Candidate',
  candidateEmail: assignment.candidate_profile?.email || '',
  assignmentStatus: assignment.assignment_status,
  assignedAt: assignment.created_at,
  respondedAt: assignment.assignment_status !== 'pending' ? assignment.updated_at : undefined,
  projectSubmissionUrl: assignment.project_submission_url || null,
  videoSubmissionUrl: assignment.video_submission_url || null,
  submissionNotes: assignment.submission_notes || null,
});

// Map JobApplication to Candidate format for navigation to candidate profile
const mapApplicationToCandidate = (app: JobApplication): any => {
  // Parse education string into EducationEntry array
  let educationArray: any[] = [];
  if (app.education) {
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(app.education);
      if (Array.isArray(parsed)) {
        educationArray = parsed;
      } else if (typeof parsed === 'object') {
        educationArray = [parsed];
      }
    } catch {
      // If not JSON, treat as plain text degree/institution
      if (app.education.trim()) {
        educationArray = [{
          degree: app.education.trim(),
          fieldOfStudy: '',
          institution: '',
        }];
      }
    }
  }

  return {
    id: app.candidateId,
    name: app.name || 'Unknown Candidate',
    email: app.email,
    phone: app.phone || '',
    avatar: app.avatarUrl || '',
    title: app.headline || app.jobTitle || 'Candidate',
    location: app.location || '',
    experience: app.experience || '',
    experienceSummary: app.profileSummary || '',
    skills: app.skills || [],
    matchScore: app.matchScore || 0,
    availability: 'immediate' as const,
    salaryRange: { min: 0, max: 0, currency: 'USD' },
    lastActive: app.appliedDate || new Date().toISOString(),
    isVerified: false,
    profileCompleteness: app.profileCompleteness || 0,
    bio: app.profileSummary || '',
    preferredWorkType: [],
    education: educationArray,
    certifications: app.certifications || [],
    hasPortfolio: Boolean(app.portfolioUrl || app.githubUrl),
    portfolioItems: 0,
    githubUrl: app.githubUrl,
    linkedinUrl: app.linkedinUrl,
    resumeUrl: app.resumeUrl || app.cvSignedUrl,
    portfolioUrl: app.portfolioUrl,
    portfolioLinks: app.portfolioLinks || [],
    yearsOfExperience: app.yearsOfExperience || 0,
    previousCompanies: [],
    achievements: [],
    languages: [],
    timezone: '',
    responseRate: 0,
    hiringSuccessRate: 0,
    dateOfBirth: app.dateOfBirth || null,
  };
};

export function ATSView({ onBack, onStartInterview, onViewMessages, onViewOngoingProjects, onViewCandidateDetail, selectedCandidate }: ATSViewProps) {
  const { user } = useAuth();
  const [recruiterId, setRecruiterId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [allProjectAssignments, setAllProjectAssignments] = useState<AssignmentRecord[]>([]);
  const [assignedApplicationIds, setAssignedApplicationIds] = useState<Set<string>>(new Set());
  const [assignedCandidateIds, setAssignedCandidateIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchFilter, setMatchFilter] = useState<'all' | '70plus' | 'below'>('all');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<'active' | 'rejected' | 'all'>('active');
  const [assignmentFilter, setAssignmentFilter] = useState<'pending' | 'assigned'>('pending');
  const [showAssignmentPanel, setShowAssignmentPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'applicants' | 'projects'>('applicants');
  const [selectedCandidateProfile, setSelectedCandidateProfile] = useState<JobApplication | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  // Handle sessionStorage for browser refresh persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedCandidateId = sessionStorage.getItem('ats_viewing_candidate_id');
    if (savedCandidateId && applications.length > 0) {
      const app = applications.find((a) => a.applicationId === savedCandidateId || a.id === savedCandidateId);
      if (app) {
        setSelectedCandidateProfile(app);
        setShowProfileModal(true);
      }
    }
  }, [applications]);

  // Sync sessionStorage with modal state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (showProfileModal && selectedCandidateProfile?.applicationId) {
      sessionStorage.setItem('ats_viewing_candidate_id', selectedCandidateProfile.applicationId);
    } else {
      sessionStorage.removeItem('ats_viewing_candidate_id');
    }
  }, [showProfileModal, selectedCandidateProfile]);

  // Load recruiter's jobs
  useEffect(() => {
    if (!recruiterId) return;
    const loadJobs = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('jobs')
          .select('id, title, description, skills, requirements, experience_level, status, job_type, has_project')
          .eq('recruiter_id', recruiterId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const realJobs = (data || []).filter((job: any) => !isProjectOnlyJobRow(job));

        // Get application counts per job
        const jobIds = realJobs.map((j: any) => j.id);
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

        setJobs(realJobs.map((j: any) => ({
          ...j,
          applicationCount: appCounts[j.id] || 0,
        })));

        // Auto-select first job or passed-in job
        const selectedCandidateJob = realJobs.find((job: any) => job.id === selectedCandidate?.job_id);
        if (selectedCandidateJob) {
          setSelectedJobId(selectedCandidate.job_id);
        } else if (realJobs.length > 0) {
          setSelectedJobId(realJobs[0].id);
        } else {
          setSelectedJobId(null);
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
          .select('id, job_id, candidate_id, cover_letter, cv_url, cv_file_name, status, match_score, notes, created_at, updated_at')
          .eq('job_id', selectedJobId)
          .order('created_at', { ascending: false });

        if (appsError) throw appsError;

        const candidateIds = Array.from(new Set((apps || []).map((a: any) => a.candidate_id).filter(Boolean)));
        const { data: profiles } = candidateIds.length > 0
          ? await supabase
            .from('profiles')
            .select('id, auth_user_id, full_name, email, avatar_url, phone, location')
            .or(`id.in.(${candidateIds.join(',')}),auth_user_id.in.(${candidateIds.join(',')})`)
          : { data: [] };

        const profileAuthIds = (profiles || []).flatMap((p: any) => [p.id, p.auth_user_id]).filter(Boolean);
        const candidateDetailIds = Array.from(new Set([...candidateIds, ...profileAuthIds]));
        const { data: candidateDetails } = candidateDetailIds.length > 0
          ? await supabase.from('candidate_profiles').select('*').in('user_id', candidateDetailIds)
          : { data: [] };
        const { data: portfolioItems } = candidateDetailIds.length > 0
          ? await supabase.from('portfolio_items').select('user_id, title, project_url, live_url, github_url').in('user_id', candidateDetailIds)
          : { data: [] };

        const mapped: JobApplication[] = await Promise.all((apps || []).map(async (app: any) => {
          const profile = (profiles || []).find((p: any) => p.id === app.candidate_id || p.auth_user_id === app.candidate_id);
          const details = (candidateDetails || []).find(
            (d: any) => d.user_id === app.candidate_id || d.user_id === profile?.id || d.user_id === profile?.auth_user_id
          );
          const skills = Array.isArray(details?.skills) ? details.skills : [];
          const resumeUrl = app.cv_url || details?.resume_url || details?.resume_file_url || '';
          const experience = details?.experience_summary ||
            (typeof details?.years_of_experience === 'number'
              ? `${details.years_of_experience} year${details.years_of_experience === 1 ? '' : 's'} experience`
              : 'Not provided');
          const storedScore = app.match_score === null || app.match_score === undefined ? null : Number(app.match_score);
          const hasValidStoredScore = storedScore !== null && Number.isFinite(storedScore) && storedScore > 0;
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
              experience,
              storedScore: app.match_score,
            },
            authToken
          );

          if (!hasValidStoredScore && atsMatch.score > 0) {
            await supabase.from('applications').update({ match_score: atsMatch.score }).eq('id', app.id);
          }
          const candidatePortfolioLinks = (portfolioItems || [])
            .filter((item: any) => item.user_id === app.candidate_id || item.user_id === profile?.id || item.user_id === profile?.auth_user_id)
            .flatMap((item: any) => [item.project_url, item.live_url, item.github_url])
            .filter(Boolean);

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
            experience,
            location: details?.location || profile?.location || 'Not provided',
            coverLetter: app.cover_letter || '',
            resumeUrl,
            resumeFileName: app.cv_file_name || details?.resume_file_name || null,
            avatarUrl: profile?.avatar_url || details?.avatar_url || null,
            phone: details?.phone || profile?.phone || null,
            atsMatchedKeywords: atsMatch.matchedKeywords,
            atsMissingKeywords: atsMatch.missingKeywords,
            atsExplanation: atsMatch.explanation,
            scoreSource: atsMatch.source,
            profileCompleteness: details?.profile_completeness ?? null,
            headline: details?.headline || null,
            profileSummary: details?.profile_summary || details?.summary || details?.bio || null,
            yearsOfExperience: typeof details?.years_of_experience === 'number' ? details.years_of_experience : null,
            certifications: Array.isArray(details?.certifications) ? details.certifications : [],
            education: details?.education || null,
            linkedinUrl: details?.linkedin_url || null,
            portfolioUrl: details?.portfolio_url || null,
            githubUrl: details?.github_url || null,
            portfolioLinks: Array.from(new Set([details?.portfolio_url, ...candidatePortfolioLinks].filter(Boolean))),
            cvSignedUrl: null,
            allAtsCategories: atsMatch.categories,
            dateOfBirth: (details as any)?.date_of_birth || (profile as any)?.date_of_birth || null,
            // Rich profile fields
            workMode: (details as any)?.work_mode || null,
            willingToRelocate: typeof (details as any)?.willing_to_relocate === 'boolean' ? (details as any).willing_to_relocate : null,
            noticePeriod: (details as any)?.notice_period || null,
            employmentType: (details as any)?.employment_type || null,
            employmentStatus: (details as any)?.employment_status || null,
            expectedSalary: (details as any)?.expected_salary || null,
            salaryMin: typeof (details as any)?.salary_min === 'number' ? (details as any).salary_min : null,
            salaryMax: typeof (details as any)?.salary_max === 'number' ? (details as any).salary_max : null,
            salaryCurrency: (details as any)?.salary_currency || null,
            languages: Array.isArray((details as any)?.languages) ? (details as any).languages : [],
            achievements: Array.isArray((details as any)?.achievements) ? (details as any).achievements : [],
            previousCompanies: Array.isArray((details as any)?.previous_companies) ? (details as any).previous_companies : [],
            careerLevel: (details as any)?.career_level || null,
            industry: (details as any)?.industry || null,
            preferredRoles: Array.isArray((details as any)?.preferred_roles) ? (details as any).preferred_roles : [],
            preferredWorkType: Array.isArray((details as any)?.preferred_work_type) ? (details as any).preferred_work_type : [],
            currentCompany: (details as any)?.current_company || null,
            currentDesignation: (details as any)?.current_designation || details?.headline || null,
            profileViews: typeof (details as any)?.profile_views === 'number' ? (details as any).profile_views : null,
            profileLastUpdated: (details as any)?.profile_last_updated || (details as any)?.updated_at || null,
            emailVerified: typeof (details as any)?.email_verified === 'boolean' ? (details as any).email_verified : Boolean(profile?.email),
            phoneVerified: typeof (details as any)?.phone_verified === 'boolean' ? (details as any).phone_verified : Boolean(details?.phone || profile?.phone),
            resumeVerified: typeof (details as any)?.resume_verified === 'boolean' ? (details as any).resume_verified : Boolean(resumeUrl),
            availability: (details as any)?.availability || null,
            timezone: (details as any)?.timezone || null,
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

  useEffect(() => {
    if (!recruiterId) {
      setAllProjectAssignments([]);
      return;
    }

    const loadAllProjectAssignments = async () => {
      const { data, error } = await projectAssignmentsService.getRecruiterAssignments(recruiterId);
      if (error) {
        console.error('Error loading all project assignments:', error);
        return;
      }

      setAllProjectAssignments((data || []).map(mapAssignmentRecord));
    };

    void loadAllProjectAssignments();
  }, [recruiterId]);

  // Load assignments for selected job
  useEffect(() => {
    setSelectedCandidateIds(new Set()); // reset selections when switching jobs
    if (!selectedJobId) {
      setAssignments([]);
      setAssignedApplicationIds(new Set());
      setAssignedCandidateIds(new Set());
      return;
    }
    const loadAssignments = async () => {
      try {
        const { data, error } = await projectAssignmentsService.getJobAssignments(selectedJobId);
        if (error) throw error;

        setAssignments((data || []).map(mapAssignmentRecord));

        setAssignedApplicationIds(new Set((data || []).map((a: any) => a.application_id).filter(Boolean)));
        setAssignedCandidateIds(new Set((data || []).map((a: any) => a.candidate_id).filter(Boolean)));
      } catch (err) {
        console.error('Error loading assignments:', err);
      }
    };
    loadAssignments();
  }, [selectedJobId]);

  useEffect(() => {
    setSelectedCandidateIds(new Set());
  }, [assignmentFilter]);

  const filteredApplications = useMemo(() => {
    let result = applications;

    if (applicationStatusFilter === 'active') {
      result = result.filter((application) => application.status !== 'rejected' && application.status !== 'withdrawn');
    } else if (applicationStatusFilter === 'rejected') {
      result = result.filter((application) => application.status === 'rejected' || application.status === 'withdrawn');
    }

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
  }, [applications, applicationStatusFilter, searchTerm, matchFilter]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  // High-match list for display  •   •  includes assigned so recruiter can see the stats
  const isAlreadyAssignedApplication = (application: JobApplication) =>
    assignedApplicationIds.has(application.applicationId) ||
    assignedApplicationIds.has(application.id) ||
    assignedCandidateIds.has(application.candidateId);
  const getAssignmentForApplication = (application: JobApplication) =>
    assignments.find((assignment) =>
      assignment.applicationId === application.applicationId ||
      assignment.candidateId === application.candidateId
    );
  const pendingApplications = filteredApplications.filter((application) => !isAlreadyAssignedApplication(application));
  const assignedApplications = filteredApplications.filter((application) => isAlreadyAssignedApplication(application));
  const selectedJobApplications = assignmentFilter === 'assigned' ? assignedApplications : pendingApplications;
  const highMatchApps = selectedJobApplications.filter((a) => a.matchScore >= 70);
  // Selectable high-match = exclude already-assigned (already shown as locked cards)
  const selectableHighMatch = highMatchApps.filter((a) => !isAlreadyAssignedApplication(a));
  // Only count selectable (unassigned) candidates in the selected count
  const selectedCount = Array.from(selectedCandidateIds).filter(
    (id) => {
      const application = applications.find((item) => item.id === id);
      return application ? !isAlreadyAssignedApplication(application) : false;
    }
  ).length;
  const toggleCandidate = (id: string) => {
    // Already-assigned candidates cannot be re-assigned
    const application = applications.find((item) => item.id === id);
    if (application && isAlreadyAssignedApplication(application)) return;
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
      .filter((a) => !isAlreadyAssignedApplication(a))
      .map((a) => a.id);
    setSelectedCandidateIds(new Set(selectable));
  };

  const deselectAll = () => {
    setSelectedCandidateIds(new Set());
  };

  const handleSendAssignment = async () => {
    if (selectedCount === 0) {
      toast.error('Select at least one candidate to assign');
      return;
    }

    if (!selectedJobId || !recruiterId) return;

    setSending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      let createdCount = 0;
      let skippedCount = 0;
      let failedMessage = '';
      const assignmentProjectId = String(
        (selectedJob as any)?.project_id ||
        (selectedJob as any)?.projectId ||
        (selectedJob as any)?.project?.id ||
        selectedJobId
      );

      for (const appId of selectedCandidateIds) {
        const app = applications.find((a) => a.id === appId);
        if (!app) continue;        // Resolve candidate_id to profiles.id because job_project_assignments.candidate_id has FK to profiles.id
        const { data: candidateProfileRow, error: candidateProfileError } = await supabase
          .from('profiles')
          .select('id, auth_user_id')
          .or(`id.eq.${app.candidateId},auth_user_id.eq.${app.candidateId}`)
          .maybeSingle();

        if (candidateProfileError || !candidateProfileRow?.id) {
          console.error('Candidate profile not found for assignment:', {
            candidateId: app.candidateId,
            error: candidateProfileError,
          });
          failedMessage = 'Candidate profile record was not found in profiles table.';
          continue;
        }

        const resolvedCandidateId = candidateProfileRow.id;

        // Check if assignment already exists
        const { hasAssignment } = await projectAssignmentsService.hasExistingAssignment(
          selectedJobId,
          assignmentProjectId,
          resolvedCandidateId
        );

        if (hasAssignment) { skippedCount++; continue; }

        const { data: assignment, error } = await projectAssignmentsService.createAssignment({
          jobId: selectedJobId,
          projectId: assignmentProjectId,
          candidateId: resolvedCandidateId,
          recruiterId: recruiterId,
          applicationId: app.applicationId || app.id,
        });

        if (error) {
          console.error('Assignment create failed:', error);
          failedMessage = error.message || 'Assignment creation failed.';
          continue;
        }

        if (assignment) {
          // Update application status
          await supabase
            .from('applications')
            .update({ status: 'assigned' })
            .eq('id', app.applicationId);

          // Send notification to candidate
          const { data: candidateProfile } = await supabase
            .from('profiles')
            .select('auth_user_id')
            .eq('id', resolvedCandidateId)
            .maybeSingle();
          await supabase.from('notifications').insert([
            {
              user_id: candidateProfile?.auth_user_id || resolvedCandidateId,
              type: 'assignment',
              title: 'New Project Assignment',
              message: `You have been assigned to "${selectedJob?.title}". Please review and accept or decline.`,
              data: {
                assignment_id: assignment?.id,
                job_id: selectedJobId,
                application_id: app.applicationId,
              },
              read: false,
            },
          ]);

          createdCount++;
        }
      }

      if (createdCount === 0) {
        if (failedMessage) {
          toast.error('Assignment failed: ' + failedMessage);
        } else if (skippedCount > 0) {
          toast.error('Candidate already has this assignment. Refreshing assignment status.');
          await refreshProjectAssignments();
        } else {
          toast.error('No candidates were assigned. Please select a pending candidate and try again.');
        }
        setSelectedCandidateIds(new Set());
        return;
      }

      toast.success(`${createdCount} candidate${createdCount === 1 ? '' : 's'} assigned successfully`);
      setSelectedCandidateIds(new Set());

      await refreshProjectAssignments();

      // Refresh applications
      const { data: updatedApps } = await supabase
        .from('applications')
        .select('id, job_id, candidate_id, cover_letter, status, match_score, notes, created_at, updated_at')
        .eq('job_id', selectedJobId)
        .order('created_at', { ascending: false });

      if (updatedApps) {
        setApplications((current) =>
          current.map((item) => {
            const updated = updatedApps.find((app: any) => app.id === item.applicationId);
            return updated
              ? {
                ...item,
                status: (updated.status || item.status) as CandidateStatus,
                matchScore: updated.match_score ?? item.matchScore,
              }
              : item;
          }),
        );
      }
    } catch (err) {
      console.error('Error sending assignments:', err);
      toast.error('Failed to send assignments');
    } finally {
      setSending(false);
    }
  };

  const handleRejectApplication = async (application: JobApplication) => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('id', application.applicationId);

    if (error) {
      toast.error(error.message || 'Could not reject application.');
      return;
    }

    await notifyCandidate(
      application.candidateId,
      'Application rejected',
      `Your application for "${selectedJob?.title || application.jobTitle}" was not selected.`,
    );

    setApplications((current) =>
      current.map((item) =>
        item.applicationId === application.applicationId ? { ...item, status: 'rejected' } : item,
      ),
    );
    setSelectedCandidateIds((current) => {
      const next = new Set(current);
      next.delete(application.id);
      return next;
    });
    toast.success('Application rejected.');
  };

  const refreshProjectAssignments = async () => {
    if (recruiterId) {
      const { data } = await projectAssignmentsService.getRecruiterAssignments(recruiterId);
      setAllProjectAssignments((data || []).map(mapAssignmentRecord));
    }

    if (selectedJobId) {
      const { data } = await projectAssignmentsService.getJobAssignments(selectedJobId);
      setAssignments((data || []).map(mapAssignmentRecord));
      setAssignedApplicationIds(new Set((data || []).map((a: any) => a.application_id).filter(Boolean)));
      setAssignedCandidateIds(new Set((data || []).map((a: any) => a.candidate_id).filter(Boolean)));
    }
  };

  const openSubmissionUrl = async (url: string | null | undefined) => {
    if (!url) return;
    const firstUrl = url.split(',').map((value) => value.trim()).filter(Boolean)[0];
    if (!firstUrl) return;

    const pathFromPublicUrl = firstUrl.match(/\/storage\/v1\/object\/public\/project-files\/(.+)$/)?.[1];
    const directPath = firstUrl.startsWith('project-files::') ? firstUrl.split('::')[1] : null;
    const objectPath = directPath || pathFromPublicUrl;

    if (objectPath) {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.storage
        .from('project-files')
        .createSignedUrl(decodeURIComponent(objectPath), 60 * 10);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    window.open(firstUrl, '_blank', 'noopener,noreferrer');
  };

  const notifyCandidate = async (
    candidateProfileId: string,
    title: string,
    message: string,
    data?: Record<string, string | null | undefined>,
  ) => {
    const supabase = createSupabaseBrowserClient();
    const { data: candidateProfile } = await supabase
      .from('profiles')
      .select('auth_user_id')
      .eq('id', candidateProfileId)
      .maybeSingle();

    await supabase.from('notifications').insert([
      {
        user_id: candidateProfile?.auth_user_id || candidateProfileId,
        type: 'assignment',
        title,
        message,
        data: {
          job_id: selectedJobId,
          ...data,
        },
        read: false,
      },
    ]);
  };

  const updateApplicationFromAssignment = async (assignment: AssignmentRecord, status: CandidateStatus) => {
    if (!assignment.applicationId) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.from('applications').update({ status }).eq('id', assignment.applicationId);
  };

  const handleAssignmentDecision = async (
    assignment: AssignmentRecord,
    status: AssignmentStatus,
    notificationTitle: string,
    notificationMessage: string,
    applicationStatus?: CandidateStatus,
  ) => {
    const { error } = await projectAssignmentsService.updateAssignmentStatus(assignment.id, status);
    if (error) {
      toast.error(error.message || 'Could not update assignment.');
      return;
    }

    if (applicationStatus) {
      await updateApplicationFromAssignment(assignment, applicationStatus);
    }

    await notifyCandidate(assignment.candidateId, notificationTitle, notificationMessage, {
      assignment_id: assignment.id,
      application_id: assignment.applicationId,
    });
    await refreshProjectAssignments();
    toast.success(notificationTitle);
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

  const openCandidateProfile = (app: JobApplication) => {
    if (onViewCandidateDetail) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('hirevify_candidate_detail_back_screen', 'recruiter-ats');
      }
      onViewCandidateDetail(mapApplicationToCandidate(app));
      return;
    }

    setSelectedCandidateProfile(app);
    setShowProfileModal(true);
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

  const notProvided = (value?: string | number | null) =>
    value === null || value === undefined || String(value).trim() === '' ? 'Not provided' : String(value);

  const computeAge = (dateOfBirth?: string | null): number | null => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 && age < 150 ? age : null;
  };

  const getSuitabilityVerdict = (score: number) => {
    if (score >= 90) return 'Strong fit for this job';
    if (score >= 70) return 'Good fit for recruiter review';
    if (score >= 50) return 'Possible fit with gaps';
    return 'Low fit for this job';
  };

  const getJobSkillMatches = (application: JobApplication) => {
    const jobSkills = selectedJob?.skills || [];
    const candidateSkills = application.skills || [];
    if (jobSkills.length === 0 || candidateSkills.length === 0) return [];

    return candidateSkills.filter((skill) =>
      jobSkills.some((jobSkill) => jobSkill.toLowerCase().trim() === skill.toLowerCase().trim())
    );
  };

  const getMatchedEvidence = (application: JobApplication) =>
    Array.from(new Set([...getJobSkillMatches(application), ...application.atsMatchedKeywords].filter(Boolean)));

  const getCandidateFitReasons = (application: JobApplication) => {
    const reasons: string[] = [];
    const skillMatches = getJobSkillMatches(application);

    if (application.matchScore >= 70) {
      reasons.push(`The CV checker scored this candidate ${application.matchScore}% against the selected job requirements.`);
    }
    if (skillMatches.length > 0) {
      reasons.push(`Direct skill overlap with the role: ${skillMatches.slice(0, 5).join(', ')}.`);
    } else if (application.atsMatchedKeywords.length > 0) {
      reasons.push(`The resume and application contain relevant job keywords: ${application.atsMatchedKeywords.slice(0, 5).join(', ')}.`);
    }
    if (application.yearsOfExperience !== null && application.yearsOfExperience !== undefined) {
      reasons.push(`${application.yearsOfExperience} year${application.yearsOfExperience === 1 ? '' : 's'} of candidate-reported experience supports the role fit.`);
    } else if (application.experience && application.experience !== 'Not provided') {
      reasons.push(`Experience evidence found in the profile/CV: ${application.experience.slice(0, 110)}${application.experience.length > 110 ? '...' : ''}`);
    }
    if (typeof application.profileCompleteness === 'number' && application.profileCompleteness >= 100) {
      reasons.push('The candidate has a complete recruiter-visible profile, so the match is based on a fuller profile record.');
    }

    if (reasons.length === 0) {
      reasons.push('The score is available, but detailed CV checker evidence is limited for this saved application.');
    }

    return reasons.slice(0, 4);
  };

  const openCandidateResume = async (application: JobApplication) => {
    if (!application.resumeUrl) {
      toast.error('Resume/CV not provided');
      return;
    }

    try {
      const { url } = await applicationsService.getApplicationFileSignedUrl(application.resumeUrl);
      const fallbackUrl = /^https?:\/\//i.test(application.resumeUrl) ? application.resumeUrl : null;
      const resumeUrl = url || fallbackUrl;
      if (!resumeUrl) {
        toast.error('Could not create a secure resume link. Check storage access in deployment.');
        return;
      }
      window.open(resumeUrl, '_blank', 'noopener,noreferrer');
    } catch {
      if (/^https?:\/\//i.test(application.resumeUrl)) {
        window.open(application.resumeUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      toast.error('Could not create a secure resume link. Check storage access in deployment.');
    }
  };

  const getResumeDownloadFileName = (application: JobApplication) => {
    const source = application.resumeFileName || application.resumeUrl || 'candidate-resume';
    const fallbackName = source.split('?')[0].split('/').pop() || 'candidate-resume';
    return fallbackName.replace(/^\d+_/, '').replace(/[^a-zA-Z0-9._ -]+/g, '_') || 'candidate-resume';
  };

  const downloadCandidateResume = async (application: JobApplication) => {
    if (!application.resumeUrl) {
      toast.error('Resume/CV not provided');
      return;
    }

    try {
      const { data: blob, error } = await applicationsService.downloadApplicationFile(application.resumeUrl);
      if (error) {
        throw new Error(error.message || 'Unable to access resume/CV');
      }
      if (!blob || blob.size === 0) {
        throw new Error('Resume/CV file is empty or unavailable');
      }

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = getResumeDownloadFileName(application);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to download resume/CV');
    }
  };

  const openExternalUrl = (url?: string | null) => {
    if (!url) return;
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    window.open(normalized, '_blank', 'noopener,noreferrer');
  };

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
                <p className="text-xs font-semibold uppercase text-emerald-700">Recruiter</p>
                <h1 className="truncate text-2xl font-semibold text-slate-950">Candidate Pipeline</h1>
                <p className="text-sm text-slate-500">Manage applications and track project submissions</p>
              </div>
            </div>
            
            {/* Tab Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('applicants')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'applicants'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="h-4 w-4" />
                Active Jobs
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'projects'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCheck className="h-4 w-4" />
                All Projects
                {allProjectAssignments.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                    {allProjectAssignments.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="ats-candidate-profile-dialog max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          {selectedCandidateProfile && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-950">AI CV match analysis</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <section className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
                  <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                    <div className="bg-[#075c46] p-5 text-white">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white">
                        <FileCheck className="h-4 w-4" />
                        HireVify CV Checker
                      </div>
                      <p className="mt-4 text-5xl font-bold leading-none">{selectedCandidateProfile.matchScore}%</p>
                      <p className="mt-2 text-lg font-semibold">{getSuitabilityVerdict(selectedCandidateProfile.matchScore)}</p>
                      <p className="mt-4 text-sm font-medium leading-6 text-white">
                        Analysis for {selectedCandidateProfile.name} against {selectedJob?.title || selectedCandidateProfile.jobTitle || 'this job'}.
                      </p>
                      <div className="mt-5 inline-flex items-center rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-bold text-white">
                        Score source: {selectedCandidateProfile.scoreSource === 'stored' ? 'Saved CV score' : 'Live CV checker'}
                      </div>
                    </div>

                    <div className="space-y-5 p-5">
                      <div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Why this candidate is suitable</p>
                            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                              {notProvided(selectedCandidateProfile.name)} for {selectedJob?.title || selectedCandidateProfile.jobTitle || 'selected role'}
                            </h2>
                          </div>
                          <Badge className={getStatusBadge(selectedCandidateProfile.status)} variant="outline">
                            {selectedCandidateProfile.status}
                          </Badge>
                        </div>

                        <ul className="mt-4 grid gap-3 md:grid-cols-2">
                          {getCandidateFitReasons(selectedCandidateProfile).map((reason) => (
                            <li key={reason} className="flex gap-3 rounded-lg border border-slate-300 bg-white p-3 text-sm font-medium leading-6 text-slate-800 shadow-sm">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <p className="text-xs font-bold uppercase text-slate-700">Skill overlap</p>
                          <p className="mt-1 text-2xl font-bold text-slate-950">{getJobSkillMatches(selectedCandidateProfile).length}</p>
                          <p className="mt-1 text-xs font-medium text-slate-600">direct job skill match{getJobSkillMatches(selectedCandidateProfile).length === 1 ? '' : 'es'}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <p className="text-xs font-bold uppercase text-slate-700">Matched evidence</p>
                          <p className="mt-1 text-2xl font-bold text-emerald-700">{getMatchedEvidence(selectedCandidateProfile).length}</p>
                          <p className="mt-1 text-xs font-medium text-slate-600">skills and CV terms found</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <p className="text-xs font-bold uppercase text-slate-700">Open gaps</p>
                          <p className="mt-1 text-2xl font-bold text-amber-600">{selectedCandidateProfile.atsMissingKeywords.length}</p>
                          <p className="mt-1 text-xs font-medium text-slate-600">keywords to verify</p>
                        </div>
                      </div>

                      {selectedCandidateProfile.atsExplanation && (
                        <div className="rounded-lg border border-sky-300 bg-white p-4 shadow-sm">
                          <p className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-950">
                            <Target className="h-4 w-4" />
                            CV checker explanation
                          </p>
                          <p className="text-sm font-medium leading-6 text-slate-800">{selectedCandidateProfile.atsExplanation}</p>
                        </div>
                      )}

                      {selectedCandidateProfile.allAtsCategories && selectedCandidateProfile.allAtsCategories.length > 0 && (
                        <div>
                          <p className="mb-3 text-sm font-semibold text-slate-950">Score breakdown</p>
                          <div className="grid gap-3 md:grid-cols-2">
                            {selectedCandidateProfile.allAtsCategories.slice(0, 6).map((category) => (
                              <div key={category.category} className="rounded-lg border border-slate-200 bg-white p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-slate-800">{category.category}</p>
                                  <span className="text-sm font-bold text-slate-950">{category.score}/{category.maxScore}</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${Math.max(0, Math.min(100, category.percentage))}%` }}
                                  />
                                </div>
                                <p className="mt-2 text-xs font-medium leading-5 text-slate-700">{category.details}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-emerald-300 bg-white p-4 shadow-sm">
                          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-900">
                            <CheckCircle2 className="h-4 w-4" />
                            Evidence matched
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {getMatchedEvidence(selectedCandidateProfile).slice(0, 14).map((item) => (
                              <Badge key={item} className="border border-emerald-200 bg-white text-emerald-700" variant="secondary">
                                {item}
                              </Badge>
                            ))}
                            {getMatchedEvidence(selectedCandidateProfile).length === 0 && (
                              <p className="text-sm font-medium text-slate-700">No detailed matched evidence is available for this score yet.</p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg border border-amber-300 bg-white p-4 shadow-sm">
                          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-900">
                            <AlertCircle className="h-4 w-4" />
                            Gaps to verify
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedCandidateProfile.atsMissingKeywords.slice(0, 12).map((item) => (
                              <Badge key={item} className="border border-amber-200 bg-white text-amber-700" variant="secondary">
                                {item}
                              </Badge>
                            ))}
                            {selectedCandidateProfile.atsMissingKeywords.length === 0 && (
                              <p className="text-sm font-medium text-slate-700">No major keyword gaps were returned by the checker.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <Avatar className="h-16 w-16 shrink-0">
                      {selectedCandidateProfile.avatarUrl && (
                        <AvatarImage src={selectedCandidateProfile.avatarUrl} alt={selectedCandidateProfile.name} />
                      )}
                      <AvatarFallback className="bg-emerald-100 text-lg font-semibold text-emerald-700">
                        {getInitials(selectedCandidateProfile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-semibold text-slate-950">
                        {notProvided(selectedCandidateProfile.name)}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">{notProvided(selectedCandidateProfile.headline)}</p>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />{notProvided(selectedCandidateProfile.email)}</span>
                        <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{notProvided(selectedCandidateProfile.phone)}</span>
                        <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{notProvided(selectedCandidateProfile.location)}</span>
                        <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" />{selectedCandidateProfile.appliedDate ? new Date(selectedCandidateProfile.appliedDate).toLocaleString() : 'Not provided'}</span>
                        {selectedCandidateProfile.dateOfBirth && (
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-emerald-500" />
                            DOB: {new Date(selectedCandidateProfile.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {(() => {
                              const age = computeAge(selectedCandidateProfile.dateOfBirth);
                              return age !== null ? (
                                <span className="ml-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                  {age} yr{age === 1 ? '' : 's'} old
                                </span>
                              ) : null;
                            })()}
                          </span>
                        )}
                        {(selectedCandidateProfile.yearsOfExperience !== null && selectedCandidateProfile.yearsOfExperience !== undefined) && (
                          <span className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-slate-400" />
                            {selectedCandidateProfile.yearsOfExperience} year{selectedCandidateProfile.yearsOfExperience === 1 ? '' : 's'} experience
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 space-y-2 text-left sm:text-right">
                    <div className={`rounded-lg border px-4 py-3 ${getMatchBg(selectedCandidateProfile.matchScore)}`}>
                      <p className="text-xs font-semibold uppercase text-slate-500">ATS Match Score</p>
                      <p className={`text-3xl font-bold ${getMatchColor(selectedCandidateProfile.matchScore)}`}>
                        {selectedCandidateProfile.matchScore}%
                      </p>
                    </div>
                    {typeof selectedCandidateProfile.profileCompleteness === 'number' && (
                      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase text-slate-500">Profile Completeness</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {selectedCandidateProfile.profileCompleteness}%
                        </p>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                            style={{ width: `${Math.max(0, Math.min(100, selectedCandidateProfile.profileCompleteness))}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <Badge className={getStatusBadge(selectedCandidateProfile.status)} variant="outline">
                      {selectedCandidateProfile.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => void openCandidateResume(selectedCandidateProfile)}
                    disabled={!selectedCandidateProfile.resumeUrl}
                  >
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    View Resume/CV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void downloadCandidateResume(selectedCandidateProfile)}
                    disabled={!selectedCandidateProfile.resumeUrl}
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    Download
                  </Button>
                  {selectedCandidateProfile.linkedinUrl && (
                    <Button size="sm" variant="outline" onClick={() => openExternalUrl(selectedCandidateProfile.linkedinUrl)}>
                      <ExternalLink className="mr-1.5 h-4 w-4" />
                      LinkedIn
                    </Button>
                  )}
                  {selectedCandidateProfile.githubUrl && (
                    <Button size="sm" variant="outline" onClick={() => openExternalUrl(selectedCandidateProfile.githubUrl)}>
                      <ExternalLink className="mr-1.5 h-4 w-4" />
                      GitHub
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-lg border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950"><Zap className="h-4 w-4 text-emerald-600" />Skills</h3>
                    {selectedCandidateProfile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidateProfile.skills.map((skill) => (
                          <Badge key={skill} className="bg-slate-100 text-slate-700" variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-500">Not provided</p>}
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950"><Briefcase className="h-4 w-4 text-slate-500" />Experience</h3>
                    <p className="whitespace-pre-wrap text-sm text-slate-600">{notProvided(selectedCandidateProfile.experience)}</p>
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950"><GraduationCap className="h-4 w-4 text-slate-500" />Education</h3>
                    {(() => {
                      if (!selectedCandidateProfile.education) return <p className="text-sm text-slate-500">Not provided</p>;
                      try {
                        const educationData = typeof selectedCandidateProfile.education === 'string' 
                          ? JSON.parse(selectedCandidateProfile.education) 
                          : selectedCandidateProfile.education;
                        if (!Array.isArray(educationData)) {
                          return <p className="text-sm text-slate-600">{selectedCandidateProfile.education}</p>;
                        }
                        return (
                          <div className="space-y-3">
                            {educationData.map((edu: any, index: number) => (
                              <div key={edu.id || index} className="border-l-2 border-emerald-400 pl-3">
                                <p className="font-medium text-sm text-slate-800">{edu.degree || 'Degree not specified'}</p>
                                {edu.fieldOfStudy && <p className="text-xs text-slate-600 mt-0.5">{edu.fieldOfStudy}</p>}
                                {edu.institution && <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Building2 className="h-3 w-3" />{edu.institution}</p>}
                                {(edu.startYear || edu.endYear) && (
                                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {edu.startYear || '?'}{edu.startYear && edu.endYear && ' - '}{edu.endYear || 'Present'}
                                    {(edu.startYear === 'Ongoing' || edu.endYear === 'Ongoing') && ' (Ongoing)'}
                                  </p>
                                )}
                                {edu.grade && <p className="text-xs text-slate-400 mt-1">Grade: {edu.grade}</p>}
                              </div>
                            ))}
                          </div>
                        );
                      } catch {
                        return <p className="text-sm text-slate-600">{selectedCandidateProfile.education}</p>;
                      }
                    })()}
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950"><Award className="h-4 w-4 text-slate-500" />Certifications</h3>
                    {selectedCandidateProfile.certifications && selectedCandidateProfile.certifications.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidateProfile.certifications.map((certification) => (
                          <Badge key={certification} className="bg-blue-50 text-blue-700" variant="secondary">{certification}</Badge>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-500">Not provided</p>}
                  </section>
                </div>

                {(() => {
                  const c = selectedCandidateProfile;
                  const hasCareerProfile =
                    c.careerLevel || c.industry || c.currentDesignation || c.currentCompany ||
                    (c.previousCompanies && c.previousCompanies.length > 0);
                  const hasWorkPreferences =
                    c.workMode || c.noticePeriod || c.availability || c.timezone ||
                    c.employmentType || c.employmentStatus ||
                    typeof c.willingToRelocate === 'boolean' ||
                    c.expectedSalary || c.salaryMin || c.salaryMax || c.salaryCurrency;
                  const hasLookingFor =
                    (c.preferredRoles && c.preferredRoles.length > 0) ||
                    (c.preferredWorkType && c.preferredWorkType.length > 0);
                  const hasLanguages = c.languages && c.languages.length > 0;
                  const hasAchievements = c.achievements && c.achievements.length > 0;
                  const hasProfileStats =
                    typeof c.profileViews === 'number' || c.profileLastUpdated ||
                    typeof c.emailVerified === 'boolean' ||
                    typeof c.phoneVerified === 'boolean' ||
                    typeof c.resumeVerified === 'boolean';

                  const anyRichData =
                    hasCareerProfile || hasWorkPreferences || hasLookingFor ||
                    hasLanguages || hasAchievements || hasProfileStats;

                  if (!anyRichData) return null;

                  const formatSalaryRange = () => {
                    if (c.salaryMin != null && c.salaryMax != null) {
                      const cur = c.salaryCurrency || 'USD';
                      const formatter = (n: number) =>
                        n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);
                      return `${c.salaryCurrency || ''} ${formatter(c.salaryMin)} – ${formatter(c.salaryMax)}`.trim();
                    }
                    if (c.expectedSalary) return c.expectedSalary;
                    return null;
                  };
                  const salaryDisplay = formatSalaryRange();

                  return (
                    <section className="rounded-lg border border-slate-200 bg-white p-4">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-950">
                        <Briefcase className="h-4 w-4 text-emerald-600" />
                        Professional Details
                      </h3>

                      <div className="space-y-4">
                        {/* Career Profile */}
                        {hasCareerProfile && (
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Career Profile</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {(c.currentDesignation || c.currentCompany) && (
                                <div>
                                  <p className="text-xs text-slate-500">Current Role</p>
                                  {c.currentDesignation && (
                                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{c.currentDesignation}</p>
                                  )}
                                  {c.currentCompany && (
                                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
                                      <Building2 className="h-3.5 w-3.5" />
                                      {c.currentCompany}
                                    </p>
                                  )}
                                </div>
                              )}
                              {c.careerLevel && (
                                <div>
                                  <p className="text-xs text-slate-500">Career Level</p>
                                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                                    {c.careerLevel}
                                  </p>
                                </div>
                              )}
                              {c.industry && (
                                <div>
                                  <p className="text-xs text-slate-500">Industry</p>
                                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                    <Target className="h-3.5 w-3.5 text-emerald-600" />
                                    {c.industry}
                                  </p>
                                </div>
                              )}
                              {c.previousCompanies && c.previousCompanies.length > 0 && (
                                <div className="sm:col-span-2">
                                  <p className="text-xs text-slate-500">Previous Companies</p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {c.previousCompanies.map((company) => (
                                      <Badge key={company} className="bg-white text-slate-700 border border-slate-200" variant="secondary">
                                        <Building2 className="mr-1 h-3 w-3" />
                                        {company}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Work Preferences */}
                        {hasWorkPreferences && (
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Work Preferences</p>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {c.workMode && (
                                <div>
                                  <p className="text-xs text-slate-500">Work Mode</p>
                                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                    {c.workMode.toLowerCase().includes('remote') ? <Home className="h-3.5 w-3.5 text-emerald-600" /> : <Building2 className="h-3.5 w-3.5 text-emerald-600" />}
                                    {c.workMode}
                                  </p>
                                </div>
                              )}
                              {typeof c.willingToRelocate === 'boolean' && (
                                <div>
                                  <p className="text-xs text-slate-500">Willing to Relocate</p>
                                  <p className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    c.willingToRelocate
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    <MapPin className="h-3 w-3" />
                                    {c.willingToRelocate ? 'Yes' : 'No'}
                                  </p>
                                </div>
                              )}
                              {c.noticePeriod && (
                                <div>
                                  <p className="text-xs text-slate-500">Notice Period</p>
                                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                    <Clock className="h-3.5 w-3.5 text-emerald-600" />
                                    {c.noticePeriod}
                                  </p>
                                </div>
                              )}
                              {c.availability && (
                                <div>
                                  <p className="text-xs text-slate-500">Availability</p>
                                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                                    {c.availability}
                                  </p>
                                </div>
                              )}
                              {c.timezone && (
                                <div>
                                  <p className="text-xs text-slate-500">Timezone</p>
                                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                    <Globe className="h-3.5 w-3.5 text-emerald-600" />
                                    {c.timezone}
                                  </p>
                                </div>
                              )}
                              {c.employmentType && (
                                <div>
                                  <p className="text-xs text-slate-500">Employment Type</p>
                                  <p className="mt-0.5 text-sm font-medium text-slate-800">{c.employmentType}</p>
                                </div>
                              )}
                              {c.employmentStatus && (
                                <div>
                                  <p className="text-xs text-slate-500">Employment Status</p>
                                  <p className="mt-0.5 text-sm font-medium text-slate-800">{c.employmentStatus}</p>
                                </div>
                              )}
                              {salaryDisplay && (
                                <div className="sm:col-span-2 lg:col-span-1">
                                  <p className="text-xs text-slate-500">Expected Salary</p>
                                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                                    <Wallet className="h-3.5 w-3.5" />
                                    {salaryDisplay}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Looking For */}
                        {hasLookingFor && (
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Looking For</p>
                            <div className="space-y-3">
                              {c.preferredRoles && c.preferredRoles.length > 0 && (
                                <div>
                                  <p className="text-xs text-slate-500">Preferred Roles</p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {c.preferredRoles.map((role) => (
                                      <Badge key={role} className="bg-emerald-50 text-emerald-700 border border-emerald-200" variant="secondary">
                                        <Briefcase className="mr-1 h-3 w-3" />
                                        {role}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {c.preferredWorkType && c.preferredWorkType.length > 0 && (
                                <div>
                                  <p className="text-xs text-slate-500">Preferred Work Type</p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {c.preferredWorkType.map((workType) => (
                                      <Badge key={workType} className="bg-blue-50 text-blue-700 border border-blue-200" variant="secondary">
                                        {workType}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Languages */}
                        {hasLanguages && (
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Languages</p>
                            <div className="flex flex-wrap gap-1.5">
                              {c.languages!.map((language) => (
                                <Badge key={language} className="bg-indigo-50 text-indigo-700 border border-indigo-200" variant="secondary">
                                  <Globe className="mr-1 h-3 w-3" />
                                  {language}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Achievements */}
                        {hasAchievements && (
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <Star className="h-3.5 w-3.5 text-amber-500" />
                              Key Achievements
                            </p>
                            <ul className="space-y-2">
                              {c.achievements!.map((achievement, idx) => (
                                <li key={`${idx}-${achievement.slice(0, 20)}`} className="flex items-start gap-2 text-sm text-slate-700">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                  <span className="leading-6">{achievement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Trust & Activity */}
                        {hasProfileStats && (
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Trust & Activity</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {typeof c.emailVerified === 'boolean' && (
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  c.emailVerified
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-200 text-slate-600 border border-slate-300'
                                }`}>
                                  <ShieldCheck className="h-3 w-3" />
                                  Email {c.emailVerified ? 'verified' : 'unverified'}
                                </span>
                              )}
                              {typeof c.phoneVerified === 'boolean' && (
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  c.phoneVerified
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-200 text-slate-600 border border-slate-300'
                                }`}>
                                  <ShieldCheck className="h-3 w-3" />
                                  Phone {c.phoneVerified ? 'verified' : 'unverified'}
                                </span>
                              )}
                              {typeof c.resumeVerified === 'boolean' && (
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  c.resumeVerified
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-200 text-slate-600 border border-slate-300'
                                }`}>
                                  <ShieldCheck className="h-3 w-3" />
                                  Resume {c.resumeVerified ? 'on file' : 'missing'}
                                </span>
                              )}
                              {typeof c.profileViews === 'number' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                  <Eye className="h-3 w-3" />
                                  {c.profileViews} profile view{c.profileViews === 1 ? '' : 's'}
                                </span>
                              )}
                              {c.profileLastUpdated && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                                  <RefreshCw className="h-3 w-3" />
                                  Updated {new Date(c.profileLastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })()}

                {selectedCandidateProfile.profileSummary && (
                  <section className="rounded-lg border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <FileText className="h-4 w-4 text-slate-500" />
                      Professional Summary
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {selectedCandidateProfile.profileSummary}
                    </p>
                  </section>
                )}

                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950"><Globe className="h-4 w-4 text-slate-500" />Portfolio Links</h3>
                  {selectedCandidateProfile.portfolioLinks && selectedCandidateProfile.portfolioLinks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCandidateProfile.portfolioLinks.map((link) => (
                        <button key={link} type="button" onClick={() => openExternalUrl(link)} className="block max-w-full truncate text-sm font-medium text-emerald-700 hover:underline">
                          {link}
                        </button>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-500">Not provided</p>}
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950"><FileText className="h-4 w-4 text-slate-500" />Cover Letter</h3>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{notProvided(selectedCandidateProfile.coverLetter)}</p>
                </section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================== ACTIVE JOBS TAB ==================== */}
        {activeTab === 'applicants' && (
        <>
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
                  {applications.length} application{applications.length !== 1 ? 's' : ''}
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
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">Candidate assignment status</p>
                <p className="text-xs text-slate-500">
                  Pending candidates can be selected and assigned. Assigned candidates are locked.
                </p>
              </div>
              <div className="flex rounded-lg bg-slate-100 p-1">
                {[
                  { value: 'pending' as const, label: `Pending (${pendingApplications.length})` },
                  { value: 'assigned' as const, label: `Assigned (${assignedApplications.length})` },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAssignmentFilter(option.value)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                      assignmentFilter === option.value
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignment Action Bar */}
            <div className={`mb-6 rounded-lg border p-4 shadow-sm ${
              assignmentFilter === 'assigned'
                ? 'border-teal-200 bg-teal-50'
                : 'border-blue-200 bg-gradient-to-r from-blue-50 to-white'
            }`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {assignmentFilter === 'assigned' ? (
                  <div className="flex items-center gap-3 text-teal-800">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Project already assigned</p>
                      <p className="text-xs text-teal-700">These candidates already have this project assigned.</p>
                    </div>
                  </div>
                ) : (
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
                )}

                <div className="flex items-center gap-3 text-sm text-slate-600">
                  {selectableHighMatch.length > 0 && (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                      <Target className="h-3.5 w-3.5" />
                      {selectableHighMatch.length} selectable (70%+)
                    </span>
                  )}
                  {assignmentFilter === 'assigned' && assignedCandidateIds.size > 0 && (
                    <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-teal-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {assignedCandidateIds.size} already assigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content: Applications + Status */}
            <div className="grid grid-cols-1 gap-6">
              {/* Left: Applications List */}
              <div className="space-y-4">
                {/* Search + Filter */}
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
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
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {([
                      { value: 'active' as const, label: 'Active' },
                      { value: 'rejected' as const, label: 'Rejected' },
                      { value: 'all' as const, label: 'All' },
                    ]).map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setApplicationStatusFilter(filter.value)}
                        className={`min-w-fit rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          applicationStatusFilter === filter.value
                            ? 'border-slate-400 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                    {(['all', '70plus', 'below'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setMatchFilter(f)}
                        className={`min-w-fit rounded-lg border px-3 py-2 text-sm font-medium transition ${
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
                      {assignmentFilter === 'pending' && assignedApplications.length > 0
                        ? 'All visible candidates are already assigned'
                        : searchTerm || matchFilter !== 'all'
                        ? 'No applications match your filters'
                        : 'No applications for this job yet'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {assignmentFilter === 'pending' && assignedApplications.length > 0
                        ? 'Switch to Assigned to view project status and submissions.'
                        : searchTerm || matchFilter !== 'all'
                        ? 'Try adjusting your search or filter'
                        : 'Candidates will appear here when they apply'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedJobApplications.map((app) => {
                      const isSelected = selectedCandidateIds.has(app.id);
                      const isHighMatch = app.matchScore >= 70;
                      const isAlreadyAssigned = isAlreadyAssignedApplication(app);
                      const assignmentRecord = getAssignmentForApplication(app);
                      const assignmentBadge = getAssignmentBadge(assignmentRecord?.assignmentStatus || 'pending');

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
                                  <button
                                    type="button"
                                    className="truncate text-left text-base font-semibold text-slate-950 hover:text-emerald-700 hover:underline"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openCandidateProfile(app);
                                    }}
                                  >
                                    {app.name}
                                  </button>
                                  {isAlreadyAssigned ? (
                                    <Badge className={assignmentBadge.class} variant="outline">
                                      {assignmentBadge.label}
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
                                  <span className="text-slate-300"> •   • </span>
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
                                <button
                                  type="button"
                                  className={`rounded-lg border px-3 py-2 text-right transition hover:shadow-sm ${getMatchBg(app.matchScore)}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedCandidateProfile(app);
                                    setShowProfileModal(true);
                                  }}
                                  aria-label={`Open match score details for ${app.name}`}
                                >
                                  <p className="text-xs font-semibold uppercase text-slate-500">Match</p>
                                  <p className={`text-2xl font-bold ${getMatchColor(app.matchScore)}`}>
                                    {app.matchScore}%
                                  </p>
                                </button>
                                <p className="mt-1 text-xs text-slate-400">
                                  {app.scoreSource === 'openai' ? 'AI analysis' : app.scoreSource === 'stored' ? 'Saved' : 'Keyword'}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openCandidateProfile(app);
                                  }}
                                >
                                  <User className="mr-1.5 h-4 w-4" />
                                  View Candidate Profile
                                </Button>
                                {!isAlreadyAssigned && app.status !== 'rejected' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2 border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleRejectApplication(app);
                                    }}
                                  >
                                    Reject
                                  </Button>
                                )}
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
                {/* Video Verification Progress */}
                <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-sm overflow-hidden">
                  <div className="border-b border-purple-100 bg-purple-50 p-4">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-slate-950">Video Verification</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Track candidate video & project submissions
                    </p>
                  </div>
                  
                  {/* Progress Stats */}
                  {assignments.length > 0 && (
                    <div className="p-4 space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Verification Progress</span>
                          <span className="text-sm font-bold text-purple-700">
                            {assignments.filter(a => a.projectSubmissionUrl || a.videoSubmissionUrl || ['submitted', 'under_review', 'hired', 'not_selected'].includes(a.assignmentStatus)).length} / {assignments.length}
                          </span>
                        </div>
                        <div className="w-full bg-purple-100 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${assignments.length > 0 ? Math.round((assignments.filter((assignment) => assignment.projectSubmissionUrl || assignment.videoSubmissionUrl || ['submitted', 'under_review', 'hired', 'not_selected'].includes(assignment.assignmentStatus)).length / assignments.length) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg border border-purple-100 p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <FileCheck className="h-4 w-4 text-purple-600" />
                            <span className="text-2xl font-bold text-purple-700">
                              {assignments.filter(a => a.projectSubmissionUrl).length}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Project Submitted</p>
                        </div>
                        <div className="bg-white rounded-lg border border-purple-100 p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Video className="h-4 w-4 text-purple-600" />
                            <span className="text-2xl font-bold text-purple-700">
                              {assignments.filter(a => a.videoSubmissionUrl).length}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Video Submitted</p>
                        </div>
                      </div>
                      
                      {/* Pending Review Count */}
                      {assignments.filter(a => a.assignmentStatus === 'submitted').length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                          <p className="text-xs text-amber-800">
                            <span className="font-semibold">{assignments.filter(a => a.assignmentStatus === 'submitted').length}</span> submission(s) awaiting your review
                          </p>
                        </div>
                      )}
                      
                      {/* Under Review */}
                      {assignments.filter(a => a.assignmentStatus === 'under_review').length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-blue-600 shrink-0" />
                          <p className="text-xs text-blue-800">
                            <span className="font-semibold">{assignments.filter(a => a.assignmentStatus === 'under_review').length}</span> in review
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {assignments.length === 0 && (
                    <div className="p-6 text-center">
                      <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">No assignments yet</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Assign candidates to track their status here
                      </p>
                    </div>
                  )}
                </div>

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
                      { label: 'Not Selected', value: assignments.filter(a => ['rejected', 'not_selected'].includes(a.assignmentStatus)).length, color: 'text-red-700 bg-red-50' },
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
        </>
        )}
        
        {/* ==================== ONGOING PROJECTS TAB ==================== */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Projects', value: allProjectAssignments.length, color: 'border-slate-200 bg-white', textColor: 'text-slate-700' },
                { label: 'Submitted', value: allProjectAssignments.filter(a => a.assignmentStatus === 'submitted').length, color: 'border-blue-200 bg-blue-50', textColor: 'text-blue-700' },
                { label: 'Under Review', value: allProjectAssignments.filter(a => a.assignmentStatus === 'under_review').length, color: 'border-purple-200 bg-purple-50', textColor: 'text-purple-700' },
                { label: 'Completed', value: allProjectAssignments.filter(a => ['hired', 'not_selected'].includes(a.assignmentStatus)).length, color: 'border-emerald-200 bg-emerald-50', textColor: 'text-emerald-700' },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-lg border p-4 ${stat.color}`}>
                  <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* 4-Phase Progress Overview */}
            <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6">
              <h3 className="text-lg font-semibold text-slate-950 mb-4">Recruitment Pipeline</h3>
              <div className="flex items-center justify-between">
                {[
                  { phase: 'Submitted', icon: FileCheck, color: 'bg-blue-500', count: allProjectAssignments.filter(a => a.assignmentStatus === 'submitted').length },
                  { phase: 'Under Review', icon: RefreshCw, color: 'bg-purple-500', count: allProjectAssignments.filter(a => a.assignmentStatus === 'under_review').length },
                  { phase: 'Approved', icon: CheckCircle2, color: 'bg-emerald-500', count: allProjectAssignments.filter(a => a.assignmentStatus === 'hired').length },
                  { phase: 'Hired', icon: Crown, color: 'bg-amber-500', count: allProjectAssignments.filter(a => a.assignmentStatus === 'hired').length },
                ].map((phase, idx) => {
                  const Icon = phase.icon;
                  return (
                    <div key={phase.phase} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-14 h-14 rounded-full ${phase.color} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-700">{phase.phase}</p>
                        <p className="text-xs text-slate-500">{phase.count} candidates</p>
                      </div>
                      {idx < 3 && (
                        <div className="w-16 h-1 bg-slate-200 mx-2 rounded-full">
                          <div className={`h-full ${phase.color} rounded-full`} style={{ width: '100%' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Candidate List with Progress */}
            {allProjectAssignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                <FileCheck className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="font-semibold text-slate-700">No projects yet</p>
                <p className="mt-1 text-sm text-slate-500">Assign candidates to jobs to start tracking all project statuses here.</p>
                {onViewOngoingProjects && (
                  <button
                    onClick={onViewOngoingProjects}
                    className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                  >
                    Open All Projects
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-950">Candidates Progress</h3>
                  {onViewOngoingProjects && (
                    <button
                      onClick={onViewOngoingProjects}
                      className="text-sm font-medium text-teal-600 hover:text-teal-700"
                    >
                      View All ?
                    </button>
                  )}
                </div>
                {allProjectAssignments.map((assignment) => {
                  const phaseIndex = ['submitted', 'under_review', 'hired', 'not_selected'].indexOf(assignment.assignmentStatus);
                  const progress = assignment.assignmentStatus === 'pending' ? 0 : 
                                   assignment.assignmentStatus === 'accepted' ? 1 :
                                   phaseIndex >= 0 ? phaseIndex + 1 : 1;
                  
                  return (
                    <div key={assignment.id} className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                              {assignment.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-950">{assignment.candidateName}</p>
                            <p className="text-sm text-slate-500">{assignment.candidateEmail}</p>
                          </div>
                        </div>
                        <Badge className={getAssignmentBadge(assignment.assignmentStatus).class} variant="outline">
                          {getAssignmentBadge(assignment.assignmentStatus).label}
                        </Badge>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">Submission Progress</span>
                          <span className="text-xs font-medium text-slate-700">
                            {assignment.projectSubmissionUrl && assignment.videoSubmissionUrl ? 'Complete' : 
                             assignment.projectSubmissionUrl ? 'Project Done' : 
                             assignment.videoSubmissionUrl ? 'Video Done' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <div className={`flex-1 h-2 rounded-full ${assignment.projectSubmissionUrl ? 'bg-blue-500' : 'bg-slate-200'}`} />
                          <div className={`flex-1 h-2 rounded-full ${assignment.videoSubmissionUrl ? 'bg-purple-500' : 'bg-slate-200'}`} />
                          <div className={`flex-1 h-2 rounded-full ${['under_review', 'hired', 'not_selected'].includes(assignment.assignmentStatus) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                          <div className={`flex-1 h-2 rounded-full ${['hired', 'not_selected'].includes(assignment.assignmentStatus) ? 'bg-amber-500' : 'bg-slate-200'}`} />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-slate-400">
                          <span>Project</span>
                          <span>Video</span>
                          <span>Review</span>
                          <span>Decision</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {assignment.assignmentStatus === 'submitted' && (
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={async () => {
                            await handleAssignmentDecision(
                              assignment,
                              'under_review',
                              'Project review started',
                              'Your project submission is now under recruiter review.',
                              'in_progress',
                            );
                          }}>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Start Review
                          </Button>
                        )}
                        {assignment.assignmentStatus === 'under_review' && (
                          <>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={async () => {
                              await handleAssignmentDecision(
                                assignment,
                                'under_review',
                                'First level passed',
                                'Your project has passed the first review level. The recruiter can now make a hiring decision.',
                                'interview',
                              );
                            }}>
                              <Check className="w-4 h-4 mr-1" />
                              Passed
                            </Button>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={async () => {
                              await handleAssignmentDecision(
                                assignment,
                                'hired',
                                'You are hired',
                                'Congratulations. The recruiter selected you after reviewing your project.',
                                'hired',
                              );
                            }}>
                              <Crown className="w-4 h-4 mr-1" />
                              Hired
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={async () => {
                              await handleAssignmentDecision(
                                assignment,
                                'not_selected',
                                'Project not selected',
                                'The recruiter reviewed your project and decided not to move forward this time.',
                                'rejected',
                              );
                            }}>
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {assignment.projectSubmissionUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={() => void openSubmissionUrl(assignment.projectSubmissionUrl)}
                          >
                            <FileCheck className="w-4 h-4 mr-1" />
                            Project File
                          </Button>
                        )}
                        {assignment.videoSubmissionUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-200 text-purple-600 hover:bg-purple-50"
                            onClick={() => void openSubmissionUrl(assignment.videoSubmissionUrl)}
                          >
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Video
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}








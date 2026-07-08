import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, DollarSign, Clock, Bookmark, BookmarkCheck, Star, Zap, Video, CheckCircle, PlayCircle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { ScrollArea } from './ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { savedJobsService } from '../services/savedJobsService';
import { MIN_CANDIDATE_PROFILE_COMPLETENESS } from '../services/applicationsService';

// Local types to avoid API dependency issues
interface Project {
 id: string;
 
 recruiter_id?: string | null;title: string;
 description: string;
 company: string;
 location: string;
 budget: string;
 timeline: string;
 skills: string[];
 requirements?: string[];
 type: string;
 applications?: any[] | number;
 applicationsCount?: number;
 createdAt: string;
 status?: 'available' | 'applied' | 'selected' | 'in-progress' | 'completed' | 'submitted';
 challengeDescription?: string;
 hasVideoSubmission?: boolean;
}

interface ProjectFilters {
 page?: number;
 limit?: number;
 type?: string;
 location?: string;
 skills?: string[];
 sortBy?: string;
}

interface ProjectSearchProps {
 onBack: () => void;
 onUpgrade: () => void;
 onProjectChallengeVideo?: (projectId: string, projectTitle: string, challengeDescription?: string) => void;
 onViewJob?: (job: Project) => void;
}

export function ProjectSearch({ onBack, onUpgrade, onProjectChallengeVideo, onViewJob }: ProjectSearchProps) {
 const { user, accessToken } = useAuth();
 const [projects, setProjects] = useState<Project[]>([]);
 
 const [appliedProjectIds, setAppliedProjectIds] = useState<Set<string>>(new Set());
const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [filters, setFilters] = useState<ProjectFilters>({
 page: 1,
 limit: 20,
 sortBy: 'newest'
 });
 const [bookmarkedProjects, setBookmarkedProjects] = useState<Set<string>>(new Set());
 const [selectedProject, setSelectedProject] = useState<Project | null>(null);
 const [showApplicationDialog, setShowApplicationDialog] = useState(false);
 const [showProjectDetailsDialog, setShowProjectDetailsDialog] = useState(false);
 const [coverLetter, setCoverLetter] = useState('');
 const [isApplying, setIsApplying] = useState(false);

 
 const openApplicationDialog = (projectToApply: Project | null) => {
 if (!projectToApply?.id) {
 toast.error('Please select a job first.');
 return;
 }

 setSelectedProject(projectToApply);
 setCoverLetter('');
 setShowApplicationDialog(true);
 };
// AI-powered recommendations
 const [recommendations, setRecommendations] = useState<Project[]>([]);
 const [showRecommendations, setShowRecommendations] = useState(true);
 const [aiMatches, setAiMatches] = useState<Map<string, number>>(new Map());
 const [isLoadingAI, setIsLoadingAI] = useState(false);

 // Note: All mock data generation removed - using real API data only

  useEffect(() => {
  // Load real projects data only - no fake data fallback
  loadProjects();
  }, [accessToken]);

  const loadProjects = async () => {
  if (!accessToken) {
  setIsLoading(false);
  console.log('ProjectSearch loaded');
  return;
  }

  setIsLoading(true);

  try {
  // Load real recruiter-posted projects from public.jobs
  const { createSupabaseBrowserClient } = await import('@/src/lib/supabase');
  const supabase = createSupabaseBrowserClient();

  // STEP 1: Fetch jobs (must be first — everything else depends on this)
  const { data: jobs, error } = await supabase.from('jobs').select('*').eq('status', 'published').order('created_at', { ascending: false });

  if (error) {
  console.error('Failed to load published jobs:', error);
  setProjects([]);
  setFilteredProjects([]);
  return;
  }

  const publishedJobRows = (jobs || []).filter((job: any) => {
  const title = String(job.title || '').trim().toLowerCase();
  const projectTitle = String(job.project_title || '').trim().toLowerCase();
  const description = String(job.description || '').trim().toLowerCase();
  const projectDescription = String(job.project_description || '').trim().toLowerCase();
  const looksLikeStandaloneProject =
  Boolean(job.has_project) &&
  job.job_type === 'freelance' &&
  (!job.location || job.location === 'Not specified') &&
  (!projectTitle || projectTitle === title) &&
  (!projectDescription || projectDescription === description);

  return !looksLikeStandaloneProject;
  });

  const jobIds = publishedJobRows.map((job: any) => String(job.id)).filter(Boolean);

  // STEP 2: Get authUserId ONCE (was called twice before)
  const { data: authData } = await supabase.auth.getUser();
  const authUserId = authData?.user?.id;

  // STEP 3: Fetch profiles, candidate_profiles, applications, and saved_jobs in PARALLEL
  const [profileResult, savedResult] = await Promise.all([
  (async () => {
  if (!authUserId) return { profileRow: null, candidateIds: new Set<string>(), appliedJobIds: new Set<string>() };

  const candidateIds = new Set<string>();
  candidateIds.add(String(authUserId));

  const { data: profileRow } = await supabase.from('profiles').select('id, auth_user_id').or(`auth_user_id.eq.${authUserId},id.eq.${authUserId}`).maybeSingle();
  if (profileRow?.id) candidateIds.add(String(profileRow.id));
  if (profileRow?.auth_user_id) candidateIds.add(String(profileRow.auth_user_id));

  const candidateProfileFilters = [`user_id.eq.${authUserId}`];
  if (profileRow?.id) candidateProfileFilters.push(`user_id.eq.${profileRow.id}`);

  const { data: candidateProfileRows } = await supabase.from('candidate_profiles').select('user_id').or(candidateProfileFilters.join(','));
  (candidateProfileRows || []).forEach((row: any) => {
  if (row?.user_id) candidateIds.add(String(row.user_id));
  });

  let appliedJobIds = new Set<string>();
  if (jobIds.length && candidateIds.size) {
  const { data: applicationRows } = await supabase.from('applications').select('job_id').in('job_id', jobIds).in('candidate_id', Array.from(candidateIds));
  appliedJobIds = new Set<string>((applicationRows || []).map((row: any) => String(row.job_id)).filter(Boolean));
  }

  return { profileRow, candidateIds, appliedJobIds };
  })(),

  (async () => {
  if (!authUserId) return { savedIds: new Set<string>() };

  const { data: savedRows } = await supabase.from('saved_jobs').select('job_id').eq('candidate_id', authUserId);
  return { savedIds: new Set<string>((savedRows || []).map((row: any) => String(row.job_id)).filter(Boolean)) };
  })(),
  ]);

  const appliedJobIdsFromDb = profileResult.appliedJobIds;
  const savedIds = savedResult.savedIds;

  setAppliedProjectIds(appliedJobIdsFromDb);
  setBookmarkedProjects(savedIds);

  const mappedProjects = publishedJobRows.map((job: any) => ({
  id: job.id,
  title: job.title || 'Untitled Job',
  description: job.description || '',
  company: job.company_name || 'Company',
  companyName: job.company_name || 'Company',
  skills: job.skills || [],
  budget: job.budget_min || job.budget_max? `${job.budget_currency || job.currency || 'USD'} ${job.budget_min || job.salary_min || 0} - ${job.budget_max || job.salary_max || job.budget_min || job.salary_min || 0}`: 'Not specified',
  budgetMin: Number(job.budget_min || job.salary_min || 0),
  budgetMax: Number(job.budget_max || job.salary_max || 0),
  currency: job.budget_currency || job.currency || 'USD',
  location: job.location || 'Not specified',
  type: job.job_type || 'freelance',
  jobType: job.job_type || 'freelance',
  remoteType: job.remote_type || 'remote',
  experienceLevel: job.experience_level || 'mid',
  status: appliedJobIdsFromDb.has(String(job.id))? 'applied': 'available',
  applications: job.applications_count || 0,
  applicationsCount: job.applications_count || 0,
  views: job.views_count || 0,
  viewsCount: job.views_count || 0,
  postedDate: job.created_at,
  createdAt: job.created_at,
  timeline: Array.isArray(job.requirements)? (job.requirements.find((item: string) => item.toLowerCase().startsWith('timeline:')) || '').replace(/^Timeline:\s*/i, ''): '',
  requirements: job.requirements || [],
  matchScore: 85,
  }));

  setProjects(mappedProjects as any);
  setFilteredProjects(mappedProjects as any);

  console.log(`Successfully loaded ${mappedProjects.length} published jobs from database`);
  } catch (error) {
  console.error('Failed to load projects:', error);
  setProjects([]);
  setFilteredProjects([]);
  toast.error('Failed to load projects. Please check your connection and try again.');
  } finally {
  setIsLoading(false);
  }
  };

 const generateAIRecommendations = async (projectList: Project[]) => {
 if (!user?.id || projectList.length === 0) {
 // No recommendations without user or projects
 setRecommendations([]);
 return;
 }

 setIsLoadingAI(true);
 
 try {
 // Import AI matching service
 const { aiMatchingService } = await import('../utils/ai/matchingService');
 
 // Check if we have a test user before trying AI matching
 const isTestUser = user.email && (user.email === 'candidate@hirevify.com' || user.email === 'recruiter@hirevify.com');
 
 if (!isTestUser) {
 console.log('ProjectSearch loaded');
 generateSkillBasedRecommendations(projectList);
 return;
 }
 
 // Get AI-powered project recommendations
 const result = await aiMatchingService.findProjectsForCandidate(
 user.id,
 10, // Get top 10 matches
 false // Use cache if available
 );
 
 // Store match scores for all projects
 const matchScores = new Map<string, number>();
 result.matches.forEach(match => {
 matchScores.set(match.projectId, match.score);
 });
 setAiMatches(matchScores);
 
 // Set top 3 as recommendations
 const topRecommendations = result.matches.slice(0, 3).map(match => projectList.find(p => p.id === match.projectId)).filter(Boolean) as Project[];
 
 if (topRecommendations.length > 0) {
 setRecommendations(topRecommendations);
 console.log('ProjectSearch loaded');
 } else {
 // Fallback to skill-based matching
 console.log('No AI matches found, falling back to skill-based matching');
 generateSkillBasedRecommendations(projectList);
 }
 
 } catch (error) {
 console.warn('AI matching failed, falling back to skill-based matching:', error.message || error);
 generateSkillBasedRecommendations(projectList);
 } finally {
 setIsLoadingAI(false);
 }
 };

 const generateSkillBasedRecommendations = (projectList: Project[]) => {
 if (!projectList || projectList.length === 0) {
 setRecommendations([]);
 return;
 }

 if ((user as any)?.skills && (user as any).skills.length > 0) {
 const userSkills = (user as any).skills.map((s: string) => s.toLowerCase());
 const recommendedProjects = projectList.filter(project => 
 project.skills.some(skill => 
 userSkills.some((userSkill: string) => 
 skill.toLowerCase().includes(userSkill) || userSkill.includes(skill.toLowerCase())
 )
 )
 ).slice(0, 3);
 setRecommendations(recommendedProjects);
 } else {
 // No skill-based filtering without user skills - no default recommendations
 setRecommendations([]);
 }
 };

 useEffect(() => {
 // Real-time search with debouncing
 const debounceTimer = setTimeout(() => {
 applyFilters();
 }, 300);

 return () => clearTimeout(debounceTimer);
 }, [searchQuery, projects, filters]);



 const applyFilters = () => {
 let filtered = projects;

 // Search filter
 if (searchQuery) {
 const query = searchQuery.toLowerCase();
 filtered = filtered.filter(project =>
 project.title.toLowerCase().includes(query) ||
 project.description.toLowerCase().includes(query) ||
 project.company.toLowerCase().includes(query) ||
 project.skills.some(skill => skill.toLowerCase().includes(query))
 );
 }

 // Type filter
 if (filters.type && filters.type!== 'all') {
 filtered = filtered.filter(project => project.type === filters.type);
 }

 // Location filter
 if (filters.location) {
 filtered = filtered.filter(project => 
 project.location.toLowerCase().includes(filters.location!.toLowerCase())
 );
 }

 // Skills filter
 if (filters.skills && filters.skills.length > 0) {
 filtered = filtered.filter(project =>
 filters.skills!.some(skill =>
 project.skills.some(pSkill => 
 pSkill.toLowerCase().includes(skill.toLowerCase())
 )
 )
 );
 }

 // Sort
 if (filters.sortBy) {
 filtered = [...filtered].sort((a, b) => {
 switch (filters.sortBy) {
 case 'newest':
 return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
 case 'oldest':
 return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
 case 'mostApplied':
 return ((typeof b.applicationsCount === 'number'? b.applicationsCount: Array.isArray(b.applications)? b.applications.length: Number(b.applications || 0)) - (typeof a.applicationsCount === 'number'? a.applicationsCount: Array.isArray(a.applications)? a.applications.length: Number(a.applications || 0)));
 case 'budget':
 // Simple budget sorting by extracting the upper range
 const getBudgetValue = (budget: string) => {
 const match = budget.match(/\$[\d,]+\s*-\s*\$?([\d,]+)/);
 return match? parseInt(match[1].replace(/,/g, '')): 0;
 };
 return getBudgetValue(b.budget) - getBudgetValue(a.budget);
 default:
 return 0;
 }
 });
 }

 setFilteredProjects(filtered);
 };

 const updateFilter = (key: keyof ProjectFilters, value: any) => {
 setFilters(prev => ({...prev,
 [key]: value,
 page: 1 // Reset to first page when filters change
 }));
 };

const toggleBookmark = async (projectId: string) => {
  if (!user?.id) {
  toast.error('Please sign in to save jobs.');
  return;
  }

  const wasSaved = bookmarkedProjects.has(projectId);

  // Optimistic update — flip the icon immediately, then reconcile with DB.
  setBookmarkedProjects(prev => {
  const newSet = new Set(prev);
  if (wasSaved) newSet.delete(projectId);
  else newSet.add(projectId);
  return newSet;
  });

  try {
 if (wasSaved) {
  const { error } = await savedJobsService.unsaveJob(user.id, projectId);
  if (error) {
  console.error('Failed to unsave job', error);
  // Roll back optimistic change
  setBookmarkedProjects(prev => new Set(prev).add(projectId));
  toast.error('Could not remove from saved jobs');
  return;
  }
  toast.success('Removed from saved jobs');
  } else {
  const { error } = await savedJobsService.saveJob(user.id, projectId);
  if (error) {
  console.error('Failed to save job', error);
  setBookmarkedProjects(prev => {
  const newSet = new Set(prev);
  newSet.delete(projectId);
  return newSet;
  });
  toast.error('Could not save job');
  return;
  }
  toast.success('Added to saved jobs');
  }
  } catch (err) {
  console.error('Bookmark toggle failed:', err);
  // Roll back on any unexpected failure
  setBookmarkedProjects(prev => {
  const newSet = new Set(prev);
  if (wasSaved) newSet.add(projectId);
  else newSet.delete(projectId);
  return newSet;
  });
  toast.error('Something went wrong saving this job');
  }
  };

 const calculateMatchScore = (project: Project): number => {
 // Check if we have AI-generated match score
 const aiScore = aiMatches.get(project.id);
 if (aiScore!== undefined) {
 return Math.round(aiScore * 100); // AI engine returns 0-1, we need 0-100
 }
 
 // Skill-based matching calculation - no random fallback
 if (!(user as any)?.skills || (user as any).skills.length === 0) {
 return 50; // Default neutral score when no skills available
 }
 
 const userSkills = (user as any).skills.map((skill: string) => skill.toLowerCase());
 const projectSkills = project.skills.map((skill: string) => skill.toLowerCase());
 
 if (projectSkills.length === 0) {
 return 50; // Default neutral score when project has no skills listed
 }
 
 const matchedSkills = userSkills.filter((skill: string) => 
 projectSkills.some(pSkill => pSkill.includes(skill) || skill.includes(pSkill))
 );
 
 // Calculate percentage based on overlap
 const matchPercentage = (matchedSkills.length / projectSkills.length) * 100;
 
 // Ensure score is between 0-100
 return Math.min(100, Math.max(0, Math.round(matchPercentage)));
 };

 const getMatchScoreColor = (score: number) => {
 if (score >= 80) return 'match-excellent';
 if (score >= 60) return 'match-good';
 if (score >= 40) return 'match-fair';
 return 'match-poor';
 };

 const getMatchScoreText = (score: number) => {
 if (score >= 80) return 'Excellent match';
 if (score >= 60) return 'Good match';
 if (score >= 40) return 'Fair match';
 return 'Skills needed';
 };

 const getStatusColor = (status?: string) => {
 switch (status) {
 case 'applied': return 'bg-blue-100 text-blue-800 border-blue-200';
 case 'selected': return 'bg-green-100 text-green-800 border-green-200';
 case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
 case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
 case 'submitted': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
 default: return 'bg-gray-100 text-gray-800 border-gray-200';
 }
 };

 const getStatusText = (status?: string) => {
 switch (status) {
 case 'applied': return 'Applied';
 case 'selected': return 'Selected';
 case 'in-progress': return 'In Progress';
 case 'completed': return 'Completed';
 case 'submitted': return 'Video Submitted';
 default: return 'Available';
 }
 };

 const handleRecordVideo = (project: Project) => {
 if (onProjectChallengeVideo) {
 onProjectChallengeVideo(project.id, project.title, project.challengeDescription);
 }
 };

const applyToProject = async () => {
 if (!selectedProject) {
 toast.error('Please select a job first.');
 return;
 }

 if (!coverLetter.trim()) {
 toast.error('Please enter a cover letter before submitting.');
 return;
 }

 if (!user?.id) {
 toast.error('Please login to apply.');
 return;
 }

 try {
 setIsApplying(true);

 const { createSupabaseBrowserClient } = await import('@/src/lib/supabase');
 const supabase = createSupabaseBrowserClient();

 const { data: authData } = await supabase.auth.getUser();
 if (!authData.user) {
 toast.error('Authentication failed.');
 return;
 }

  const { data: candidateProfile } = await supabase.from('profiles').select('id, full_name, email, role').or(`auth_user_id.eq.${authData.user.id},id.eq.${authData.user.id}`).single();

 if (!candidateProfile || candidateProfile.role!== 'candidate') {
 toast.error('Only candidates can apply.');
 return;
 }

 // Check existing application const { data: currentAuthData, error: currentAuthError } = await supabase.auth.getUser();
 const { data: currentAuthData, error: currentAuthError } = await supabase.auth.getUser();
 const currentAuthUserId = currentAuthData?.user?.id;

 if (currentAuthError ||!currentAuthUserId) {
 toast.error('Please login again before applying.');
 return;
 }

  const { data: applicationProfileRow, error: applicationProfileError } = await supabase.from('profiles').select('id, auth_user_id, full_name').or(`auth_user_id.eq.${currentAuthUserId},id.eq.${currentAuthUserId}`).maybeSingle();

 if (applicationProfileError ||!applicationProfileRow?.id) {
 toast.error(applicationProfileError?.message || 'Candidate profile not found. Please complete your profile first.');
 return;
 }

 const { data: candidateDetails, error: candidateDetailsError } = await supabase
 .from('candidate_profiles')
 .select('profile_completeness, profile_completed')
 .eq('user_id', currentAuthUserId)
 .maybeSingle();

 if (candidateDetailsError) {
 toast.error(candidateDetailsError.message || 'Could not validate your candidate profile.');
 return;
 }

 const profileCompleteness = Number(candidateDetails?.profile_completeness || 0);
 const hasCompletedProfile =
 Boolean(candidateDetails?.profile_completed) ||
 profileCompleteness >= MIN_CANDIDATE_PROFILE_COMPLETENESS;

 if (!hasCompletedProfile) {
      toast.error('Complete all required candidate profile fields before applying.');
 return;
 }

 const candidateOwnerId = currentAuthUserId;

 const { data: existing } = await supabase.from('applications').select('id').eq('job_id', selectedProject.id).eq('candidate_id', candidateOwnerId).maybeSingle();

 if (existing) {
 toast.error('You have already applied to this job.');
 const markSelectedProjectApplied = () => {
 if (!selectedProject?.id) return;

 setProjects((prevProjects) =>
 prevProjects.map((project) =>
 project.id === selectedProject.id? {...project,
 status: 'applied' as const,
 applicationsCount: Number(project.applicationsCount || 0) + 1,
 }: project
 )
 );

 setSelectedProject((current) =>
 current? {...current,
 status: 'applied' as const,
 applicationsCount: Number(current.applicationsCount || 0) + 1,
 }: current
 );
 };

 markSelectedProjectApplied();

 setShowApplicationDialog(false);
 return;
 }

 const matchScore = calculateMatchScore(selectedProject);
const { error: appError } = await supabase.from('applications').insert({
 job_id: selectedProject.id,
 candidate_id: candidateOwnerId,
 cover_letter: coverLetter.trim(),
 status: 'applied',
 match_score: matchScore,
 });

 if (appError) {
 toast.error('Failed to submit: ' + appError.message);
 return;
 }

 // Update job count
 await supabase.from('jobs').update({ applications_count: (selectedProject.applicationsCount || 0) + 1 }).eq('id', selectedProject.id);

 // Create Notification for Recruiter
 if (selectedProject.recruiter_id) {
 const { data: recruiterProfile } = await supabase
 .from('profiles')
 .select('auth_user_id')
 .eq('id', selectedProject.recruiter_id)
 .maybeSingle();

 await supabase.from('notifications').insert({
 user_id: recruiterProfile?.auth_user_id || selectedProject.recruiter_id,
 type: 'new_application',
 title: 'New Application Received',
 message: `${candidateProfile.full_name || 'A candidate'} applied for "${selectedProject.title}"`,
 data: { job_id: selectedProject.id, candidate_id: candidateOwnerId },
 read: false,
 });
 }

 toast.success('Application submitted successfully! Done');
// Refresh projects
 await loadProjects();

 // Close dialog
 setCoverLetter('');
 const markSelectedProjectApplied = () => {
 if (!selectedProject?.id) return;

 setProjects((prevProjects) =>
 prevProjects.map((project) =>
 project.id === selectedProject.id? {...project,
 status: 'applied' as const,
 applicationsCount: Number(project.applicationsCount || 0) + 1,
 }: project
 )
 );

 setSelectedProject((current) =>
 current? {...current,
 status: 'applied' as const,
 applicationsCount: Number(current.applicationsCount || 0) + 1,
 }: current
 );
 };

 markSelectedProjectApplied();

 setShowApplicationDialog(false);
 setSelectedProject(null);

 } catch (error) {
 console.error(error);
 toast.error('Something went wrong.');
 } finally {
 setIsApplying(false);
 }
};

 useEffect(() => {
 const syncAppliedProjectsFromDatabase = async () => {
 try {
 if (!projects.length) return;

 const supabaseForAppliedState = createSupabaseBrowserClient();
 const { data: authData } = await supabaseForAppliedState.auth.getUser();
 const authUserId = authData?.user?.id;

 if (!authUserId) return;

  const { data: ownerProfile } = await supabaseForAppliedState.from('profiles').select('id, auth_user_id').or(`auth_user_id.eq.${authUserId},id.eq.${authUserId}`).maybeSingle();

 const candidateIds = [ownerProfile?.id, authUserId].filter(Boolean) as string[];
 const projectIds = projects.map((project) => project.id).filter(Boolean);

 if (!candidateIds.length ||!projectIds.length) return;

 const { data: applicationRows, error } = await supabaseForAppliedState.from('applications').select('job_id').in('job_id', projectIds).in('candidate_id', candidateIds);

 if (error) {
 console.error('Failed to sync applied project state:', error);
 return;
 }

 const nextAppliedIds = new Set<string>((applicationRows || []).map((row: any) => String(row.job_id)));

 setAppliedProjectIds(nextAppliedIds);

 setProjects((prevProjects) =>
 prevProjects.map((project) =>
 nextAppliedIds.has(String(project.id))? {...project, status: 'applied' as const }: project
 )
 );
 } catch (error) {
 console.error('Failed to sync applied project state:', error);
 }
 };

 void syncAppliedProjectsFromDatabase();
 }, [projects.length]);

 useEffect(() => {
 const syncAppliedStatusAfterRefresh = async () => {
 try {
 if (!projects.length) return;

 const supabase = createSupabaseBrowserClient();
 const { data: authData } = await supabase.auth.getUser();
 const authUserId = authData?.user?.id;

 if (!authUserId) return;

  const { data: profileRow } = await supabase.from('profiles').select('id, auth_user_id').or(`auth_user_id.eq.${authUserId},id.eq.${authUserId}`).maybeSingle();

 const { data: candidateProfileRow } = await supabase.from('candidate_profiles').select('user_id').eq('user_id', authUserId).maybeSingle();

 const candidateIds = Array.from(
 new Set(
 [
 authUserId,
 profileRow?.id,
 candidateProfileRow?.user_id,
 ].filter(Boolean).map(String)
 )
 );

 const projectIds = projects.map((project) => String(project.id)).filter(Boolean);

 if (!candidateIds.length ||!projectIds.length) return;

 const { data: applicationRows, error } = await supabase.from('applications').select('job_id, candidate_id').in('job_id', projectIds).in('candidate_id', candidateIds);

 if (error) {
 console.error('Failed to sync applied project status after refresh:', error);
 return;
 }

 const appliedIds = new Set<string>(
 (applicationRows || []).map((row: any) => row.job_id).filter(Boolean).map(String)
 );

 setAppliedProjectIds(appliedIds);

 setProjects((currentProjects) =>
 currentProjects.map((project) =>
 appliedIds.has(String(project.id))? {...project, status: 'applied' as const }: project
 )
 );
 } catch (error) {
 console.error('Failed to sync applied project status after refresh:', error);
 }
 };

 void syncAppliedStatusAfterRefresh();
 }, [projects.length]);

 const skillsOptions = [
 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
 'UI/UX Design', 'Graphic Design', 'Product Management', 'Data Science',
 'Machine Learning', 'DevOps', 'Cloud Computing', 'Mobile Development',
 'WordPress', 'PHP', 'CSS', 'HTML', 'SEO', 'AWS', 'Docker', 'Kubernetes'
 ];


 // Project Details Component
 function ProjectDetails({ project, matchScore, onRecordVideo }: {
 project: Project;
 matchScore: number;
 onRecordVideo?: () => void;
 }) {
 const getMatchScoreColor = (score: number) => {
 if (score >= 80) return 'match-excellent';
 if (score >= 60) return 'match-good';
 if (score >= 40) return 'match-fair';
 return 'match-poor';
 };

 const getStatusColor = (status?: string) => {
 switch (status) {
 case 'applied': return 'bg-blue-100 text-blue-800 border-blue-200';
 case 'selected': return 'bg-green-100 text-green-800 border-green-200';
 case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
 case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
 case 'submitted': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
 default: return 'bg-gray-100 text-gray-800 border-gray-200';
 }
 };

 const getStatusText = (status?: string) => {
 switch (status) {
 case 'applied': return 'Applied';
 case 'selected': return 'Selected';
 case 'in-progress': return 'In Progress';
 case 'completed': return 'Completed';
 case 'submitted': return 'Video Submitted';
 default: return 'Available';
 }
 };

 return (
 <div className="space-y-6">
 {/* Project Header */}
 <div className="flex items-start justify-between">
 <div className="mx-auto w-full max-w-5xl">
 <div className="flex items-center gap-2 mb-2">
 <Badge 
 variant="outline" 
 className={getStatusColor(project.status)}
 >
 {appliedProjectIds.has(project.id) || project.status === 'applied'? 'Applied': getStatusText(project.status)}
 </Badge>
 <Badge 
 variant="outline" 
 className={`${getMatchScoreColor(matchScore)} border-current`}
 >
 <Star className="w-3 h-3 mr-1" />
 {matchScore}% match
 </Badge>
 </div>
 <h3 className="text-xl font-bold mb-1">{project.company}</h3>
 <p className="text-muted-foreground">{project.type} - {project.location}</p>
 </div>
 </div>

 {/* Project Description */}
 <div>
 <h4 className="font-semibold mb-2">Job Description</h4>
 <p className="text-muted-foreground">{project.description}</p>
 </div>

 {/* Challenge Description for Assigned Projects */}
 {project.status && ['selected', 'in-progress', 'completed'].includes(project.status) && project.challengeDescription && (
 <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
 <h4 className="font-semibold text-blue-800 mb-2">AI Match Summary</h4>
 <p className="text-blue-700 mb-3">{project.challengeDescription}</p>
 
 {/* Video Recording Section */}
 {(project.status === 'in-progress' || project.status === 'completed') && (
 <div className="mt-4 p-3 bg-white rounded-lg border border-blue-300">
 <h5 className="font-medium text-blue-800 mb-2 flex items-center">
 <Video className="w-4 h-4 mr-2" />
 Project Explanation Video
 </h5>
 <p className="text-sm text-blue-600 mb-3">
 Record a 3-minute video explaining your project approach, tool choices, and challenges faced. 
 This helps verify your work and showcases your problem-solving process.
 </p>
 
 {project.hasVideoSubmission? (
 <div className="flex items-center text-green-700">
 <CheckCircle className="w-4 h-4 mr-2" />
 <span className="text-sm font-medium">Video submitted successfully</span>
 </div>
 ): onRecordVideo? (
 <Button 
 onClick={onRecordVideo}
 className="bg-red-600 hover:bg-red-700 text-slate-900"
 >
 <Video className="w-4 h-4 mr-2" />
 Record Project Explanation
 </Button>
 ): (
 <div className="text-sm text-orange-600">
 Complete your project to unlock video recording
 </div>
 )}
 </div>
 )}
 </div>
 )}

 {/* Project Details */}
 <div className="grid grid-cols-2 gap-6">
 <div>
 <h4 className="font-semibold mb-2">Job Details</h4>
 <div className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Budget:</span>
 <span className="font-medium">{project.budget}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Timeline:</span>
 <span className="font-medium">{project.timeline}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Applications:</span>
 <span className="font-medium">{project.applicationsCount || project.applications || 0}</span>
 </div>
 </div>
 </div>

 <div>
 <h4 className="font-semibold mb-2">Required Skills</h4>
 <div className="flex flex-wrap gap-2">
 {project.skills.map((skill) => (
 <Badge key={skill} variant="secondary" className="text-xs">
 {skill}
 </Badge>
 ))}
 </div>
 </div>
 </div>

 {/* Requirements */}
 {project.requirements && project.requirements.length > 0 && (
 <div>
 <h4 className="font-semibold mb-2">Requirements</h4>
 <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
 {project.requirements.map((req, index) => (
 <li key={index}>{req}</li>
 ))}
 </ul>
 </div>
 )}
 </div>
 );
 }

 // Filter Content Component
 function FilterContent({ filters, updateFilter, skillsOptions }: {
 filters: ProjectFilters;
 updateFilter: (key: keyof ProjectFilters, value: any) => void;
 skillsOptions: string[];
 }) {
 return (
 <div className="space-y-6">
 {/* Sort */}
 <Card className="p-4">
 <h3 className="font-medium mb-3">Sort by</h3>
 <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
 <SelectTrigger>
 <SelectValue placeholder="Sort by..." />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="newest">Newest first</SelectItem>
 <SelectItem value="oldest">Oldest first</SelectItem>
 <SelectItem value="budget">Highest budget</SelectItem>
 <SelectItem value="mostApplied">Most applied</SelectItem>
 </SelectContent>
 </Select>
 </Card>

 {/* Project Type */}
 <Card className="p-4">
 <h3 className="font-medium mb-3">Job Type</h3>
 <Select value={filters.type || 'all'} onValueChange={(value) => updateFilter('type', value === 'all'? undefined: value)}>
 <SelectTrigger>
 <SelectValue placeholder="All types" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All types</SelectItem>
 <SelectItem value="contract">Contract</SelectItem>
 <SelectItem value="freelance">Freelance</SelectItem>
 <SelectItem value="part-time">Part-time</SelectItem>
 <SelectItem value="full-time">Full-time</SelectItem>
 </SelectContent>
 </Select>
 </Card>

 {/* Location */}
 <Card className="p-4">
 <h3 className="font-medium mb-3">Location</h3>
 <Input
 placeholder="Enter location..."
 value={filters.location || ''}
 onChange={(e) => updateFilter('location', e.target.value || undefined)}
 />
 </Card>

 {/* Skills */}
 <Card className="p-4">
 <h3 className="font-medium mb-3">Skills</h3>
 <div className="space-y-2 max-h-48 overflow-y-auto">
 {skillsOptions.map((skill) => (
 <div key={skill} className="flex items-center space-x-2">
 <Checkbox
 id={skill}
 checked={filters.skills?.includes(skill) || false}
 onCheckedChange={(checked) => {
 const currentSkills = filters.skills || [];
 if (checked) {
 updateFilter('skills', [...currentSkills, skill]);
 } else {
 updateFilter('skills', currentSkills.filter(s => s!== skill));
 }
 }}
 />
 <label htmlFor={skill} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
 {skill}
 </label>
 </div>
 ))}
 </div>
 </Card>
 </div>
 );
 }

  return (
  <div className="hv-candidate-shell min-h-screen">
  {/* Candidate-dashboard-style gradient header */}
  <div className="relative overflow-hidden bg-[linear-gradient(135deg,#064e3b_0%,#0369a1_100%)] text-white">
    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
    <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/20"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </button>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
            <Search className="h-3.5 w-3.5" />
            Browse Jobs
          </div>
          <h1 className="text-2xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
            All Jobs
          </h1>
          <p className="mt-2 text-sm text-emerald-50/90">
            Browse open roles from real companies and apply in one click
          </p>
        </div>

        <Button onClick={onUpgrade} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/20">
          <Zap className="w-4 h-4 mr-2" />
          Upgrade for Premium Search
        </Button>
      </div>
    </div>
  </div>

  <main className="w-full space-y-5 px-3 py-5 sm:px-6 sm:py-8">
        {/* Jobs List */}
    <div className="mx-auto w-full max-w-5xl space-y-4">
          {isLoading? (
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 rounded"></div>
                      <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 shadow-sm text-center">
              <div className="max-w-md mx-auto">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-950 mb-2">No jobs available</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {!accessToken? 'Please sign in to view available jobs.': searchQuery || filters.type || filters.location || (filters.skills && filters.skills.length > 0)? 'Try adjusting your search criteria or filters to find more jobs.': 'No jobs are currently available. Check back later for new opportunities.'}
                </p>
                {(searchQuery || filters.type || filters.location || (filters.skills && filters.skills.length > 0)) && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      setFilters({ page: 1, limit: 20, sortBy: 'newest' });
                    }}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    {filteredProjects.length} {filteredProjects.length === 1 ? 'job' : 'jobs'} found
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Showing personalized matches based on your skills
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                {filteredProjects.map((project) => {
                  const matchScore = calculateMatchScore(project);
                  return (
                    <div key={project.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6 cursor-pointer">
                      <div className="space-y-4">
                        {/* Project Header */}
                        <div className="flex items-start justify-between">
                          <div className="mx-auto w-full max-w-5xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className={getStatusColor(project.status)}
                              >
                                {appliedProjectIds.has(project.id) || project.status === 'applied'? 'Applied': getStatusText(project.status)}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`${getMatchScoreColor(matchScore)} border-current`}
                              >
                                <Star className="w-3 h-3 mr-1" />
                                {matchScore}%
                              </Badge>
                            </div>
                            <h3
                              className="font-semibold text-lg text-slate-950 hover:text-emerald-600 cursor-pointer"
                              onClick={() => {
                                if (onViewJob) {
                                  onViewJob(project);
                                  return;
                                }
                                setSelectedProject(project);
                                setShowProjectDetailsDialog(true);
                              }}
                            >
                              {project.title}
                            </h3>
                            <p className="text-sm text-slate-500 mt-0.5">{project.company}</p>
                          </div>
  <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBookmark(project.id)}
                            className="hover:bg-slate-100"
                          >
                            {bookmarkedProjects.has(project.id)? (
                              <BookmarkCheck className="w-4 h-4 text-amber-500" />
                            ): (
                              <Bookmark className="w-4 h-4 text-slate-400" />
                            )}
                          </Button>
                        </div>

                        {/* Project Description */}
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {project.description}
                        </p>

                        {/* Project Details */}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-600">{project.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-600">{project.budget}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-600">{project.timeline}</span>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2">
                          {project.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {skill}
                            </span>
                          ))}
                          {project.skills.length > 3 && (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                              +{project.skills.length - 3} more
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (onViewJob) {
                                onViewJob(project);
                                return;
                              }
                              setSelectedProject(project);
                              setShowProjectDetailsDialog(true);
                            }}
                            className="border-slate-200 text-slate-700 hover:bg-slate-50"
                          >
                            View Details
                          </Button>
  
                          {['available', 'published', 'open'].includes(String(project.status || 'available')) &&!appliedProjectIds.has(project.id)? (
                            <Button
                              size="sm"
                              onClick={() => {
                                if (onViewJob) {
                                  // Open the dedicated job detail / apply page
                                  onViewJob(project);
                                  return;
                                }
                                openApplicationDialog(project);
                              }}
                              className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                            >
                              Apply Now
                            </Button>
                          ): project.status && ['in-progress', 'completed'].includes(project.status) &&!project.hasVideoSubmission? (
                            <Button 
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleRecordVideo(project)}
                            >
                              <Video className="w-3 h-3 mr-1" />
                              Record Video
                            </Button>
                          ): project.hasVideoSubmission? (
                            <div className="flex items-center text-emerald-600 text-sm font-medium">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Video Submitted
                            </div>
                          ): (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                              {appliedProjectIds.has(project.id)? 'Applied': getStatusText(project.status)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                  </div>
                </>
              )}
            </div>
    <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[280px_minmax(0,1fr)_280px]">
      {/* Search, filters and sidebar */}
      <div className="order-1 w-full space-y-5 2xl:col-start-1">

        {/* Search Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search jobs, skills, or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>

 {/* AI Recommendations */}
 {showRecommendations && recommendations.length > 0 && (
 <Card className="p-4">
 <div className="flex items-center gap-2 mb-3">
 <Zap className="w-4 h-4 text-amber-500" />
 <h3 className="font-medium">AI Recommendations</h3>
 </div>
 <div className="space-y-2">
 {recommendations.map((project) => (
 <div
 key={project.id}
 className="p-2 rounded-md border border-border hover:bg-muted/50 cursor-pointer"
 onClick={() => {
 setSelectedProject(project);
 setShowProjectDetailsDialog(true);
 }}
 >
 <h4 className="font-medium text-sm">{project.title}</h4>
 <p className="text-xs text-muted-foreground">{project.company}</p>
 <div className="flex items-center gap-2 mt-1">
 <Badge variant="outline" className="text-xs">
 {calculateMatchScore(project)}% match
 </Badge>
 </div>
 </div>
 ))}
 </div>
 </Card>
 )}

 {/* Mobile Filter Sheet */}
 <Sheet>
 <SheetTrigger asChild>
 <Button variant="outline" className="hidden">
 <Filter className="w-4 h-4 mr-2" />
 Filters
 </Button>
 </SheetTrigger>
 <SheetContent side="left" className="w-80">
    <SheetHeader>
    <SheetTitle>Filter Jobs</SheetTitle>
    </SheetHeader>
 <div className="mt-6">
  <FilterContent 
  filters={filters}
  updateFilter={updateFilter}
  skillsOptions={skillsOptions}
  />
  </div>
  </SheetContent>
  </Sheet>

  {/* Desktop Filters */}
  <div className="block">
  <FilterContent 
  filters={filters}
  updateFilter={updateFilter}
  skillsOptions={skillsOptions}
  />
  </div>
      </div>

      {/* Sidebar */}
      <aside className="order-2 w-full space-y-4 2xl:col-start-3">
        {/* AI Recommendations */}
        {showRecommendations && recommendations.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-sm text-slate-950">AI Recommendations</h3>
            </div>
            <div className="space-y-2">
              {recommendations.map((project) => (
                <div
                  key={project.id}
                  className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedProject(project);
                    setShowProjectDetailsDialog(true);
                  }}
                >
                  <h4 className="font-medium text-sm text-slate-950">{project.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{project.company}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      {calculateMatchScore(project)}% match
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-950 mb-3">Quick Stats</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Jobs</span>
              <span className="font-semibold text-slate-950">{filteredProjects.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Applied</span>
              <span className="font-semibold text-emerald-600">{appliedProjectIds.size}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Saved</span>
              <span className="font-semibold text-amber-600">{bookmarkedProjects.size}</span>
            </div>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="hidden">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filter Jobs</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent 
                filters={filters}
                updateFilter={updateFilter}
                skillsOptions={skillsOptions}
              />
            </div>
          </SheetContent>
        </Sheet>
      </aside>
    </div>


      {/* Project Details Dialog */}
      <Dialog open={showProjectDetailsDialog} onOpenChange={setShowProjectDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Job details and requirements for {selectedProject?.company}
            </DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <>
              <ProjectDetails
                project={selectedProject}
                matchScore={calculateMatchScore(selectedProject)}
                onRecordVideo={() => {
                  setShowProjectDetailsDialog(false);
                  handleRecordVideo(selectedProject);
                }}
              />

              {['available', 'published', 'open'].includes(String(selectedProject?.status || 'available')) &&!appliedProjectIds.has(selectedProject.id)? (
                <Button 
                  size="sm"
                  onClick={() => {
                    openApplicationDialog(selectedProject);
                  }}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                >
                  {selectedProject?.status === 'applied'? 'Applied': 'Apply Now'}
                </Button>
              ) : (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Applied
                </Badge>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Submit your application for this job. Include a cover letter explaining why you're the perfect fit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cover Letter</label>
              <Textarea
                placeholder="Tell us why you're perfect for this job..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowApplicationDialog(false)}
                disabled={isApplying}
              >
                Cancel
              </Button>
              <Button 
                onClick={applyToProject}
                disabled={isApplying ||!coverLetter.trim()}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isApplying? 'Submitting...': 'Submit Application'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  </main>
  </div>
  );
}































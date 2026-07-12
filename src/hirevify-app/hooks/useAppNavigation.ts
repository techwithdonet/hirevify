import { useCallback } from 'react';
import { toast } from 'sonner';
import { Screen, Project, Application, Job, JobProjectAssignment, Candidate } from '../types/app';
import { User } from '../components/AuthProvider';

interface ScreenNavigationOptions {
 replace?: boolean;
 skipScroll?: boolean;
 candidateId?: string | null;
}

interface UseAppNavigationProps {
  user: User | null;
  setCurrentScreen: (screen: Screen, options?: ScreenNavigationOptions) => void;
  setSelectedProject: (project: Project | null) => void;
  setSelectedApplication: (application: Application | null) => void;
  setSelectedJob: (job: Job | null) => void;
  setSelectedAssignment: (assignment: JobProjectAssignment | null) => void;
  setSelectedCandidate: (candidate: Candidate | null) => void;
  setSelectedConversationId: (conversationId: string | null) => void;
  setProjectChallengeData: (data: {
    projectId: string;
    projectTitle: string;
    challengeDescription?: string;
  } | null) => void;
  setAssessmentBuilderData: (data: unknown) => void;
  signOut: () => Promise<void>;
}

export const useAppNavigation = ({
  user,
  setCurrentScreen,
  setSelectedProject,
  setSelectedApplication,
  setSelectedJob,
  setSelectedAssignment,
  setSelectedCandidate,
  setSelectedConversationId,
  setProjectChallengeData,
  setAssessmentBuilderData,
  signOut
}: UseAppNavigationProps) => {

 // Show login prompt for unauthenticated users trying to access protected features
 const requireAuth = useCallback((action: string, requiredUserType?: 'recruiter' | 'candidate') => {
 if (!user) {
 toast.error(`Please sign in to ${action.toLowerCase()}`);
 return false;
 }
 
 if (requiredUserType && user.userType!== requiredUserType) {
 const userTypeText = requiredUserType === 'recruiter'? 'recruiters': 'candidates';
 toast.error(`This feature is only available for ${userTypeText}`);
 return false;
 }
 
 return true;
 }, [user]);

 const navigateHome = useCallback(() => {
 console.log('Navigating to homepage');
 setCurrentScreen('homepage', { replace: true });
 }, [setCurrentScreen]);

 const handleLogout = useCallback(async () => {
 try {
 console.log('Logging out user');
 await signOut();
 setCurrentScreen('homepage', { replace: true });
 setSelectedProject(null);
 setSelectedApplication(null);
 setSelectedConversationId(null);
 toast.success('Logged out successfully', { id: 'auth-logout-success' });
 } catch (error) {
 console.error('Logout error:', error);
 toast.error('Failed to logout. Please try again.');
 }
 }, [signOut, setCurrentScreen, setSelectedProject, setSelectedApplication, setSelectedConversationId]);

 const navigateToPricing = useCallback(() => {
 setCurrentScreen('pricing');
 }, [setCurrentScreen]);

 // Enhanced navigation for "Post a Project" - requires authentication
 const navigateToPostProject = useCallback((project?: Project) => {
 if (!requireAuth('post projects', 'recruiter')) return;
 
 setSelectedProject(project || null);
 setCurrentScreen('recruiter-post-project');
 }, [requireAuth, setSelectedProject, setCurrentScreen]);

 // Enhanced navigation for "Find a Job" - requires authentication
  const navigateToProjectSearch = useCallback(() => {
  if (!requireAuth('search for projects', 'candidate')) return;
  
  setCurrentScreen('candidate-search-projects');
  }, [requireAuth, setCurrentScreen]);

  const navigateToJobs = useCallback(() => {
    if (!requireAuth('browse jobs', 'candidate')) return;
    setCurrentScreen('candidate-jobs');
  }, [requireAuth, setCurrentScreen]);

  const navigateToMyJobs = useCallback(() => {
    if (!requireAuth('view your jobs', 'candidate')) return;
    setCurrentScreen('candidate-my-jobs');
  }, [requireAuth, setCurrentScreen]);

  const navigateToAppliedJobs = useCallback(() => {
    if (!requireAuth('view your applied jobs', 'candidate')) return;
    setCurrentScreen('candidate-applied-jobs');
  }, [requireAuth, setCurrentScreen]);

  const navigateToSavedJobs = useCallback(() => {
    if (!requireAuth('view your saved jobs', 'candidate')) return;
    setCurrentScreen('candidate-saved-jobs');
  }, [requireAuth, setCurrentScreen]);

  const navigateToJobApply = useCallback((job: Job) => {
    if (!requireAuth('apply to jobs', 'candidate')) return;
    setSelectedJob(job);
    setCurrentScreen('candidate-job-apply');
  }, [requireAuth, setSelectedJob, setCurrentScreen]);

  const navigateToRecruiterApplicationDetail = useCallback((application: Application) => {
    if (!requireAuth('review applications', 'recruiter')) return;
    setSelectedApplication(application);
    setCurrentScreen('recruiter-application-detail');
  }, [requireAuth, setSelectedApplication, setCurrentScreen]);

 const navigateToProjects = useCallback(() => {
 if (!requireAuth('manage projects', 'recruiter')) return;
 setCurrentScreen('recruiter-projects');
 }, [requireAuth, setCurrentScreen]);

 const navigateToInterviews = useCallback(() => {
 if (!requireAuth('manage interviews')) return;
 if (user!.userType === 'recruiter') {
 setCurrentScreen('recruiter-interviews');
 } else {
 setCurrentScreen('candidate-interviews');
 }
 }, [requireAuth, user, setCurrentScreen]);

 const navigateToSettings = useCallback(() => {
 if (!requireAuth('access settings')) return;
 if (user!.userType === 'recruiter') {
 setCurrentScreen('recruiter-settings');
 } else {
 setCurrentScreen('candidate-settings');
 }
 }, [requireAuth, user, setCurrentScreen]);

  const navigateToATS = useCallback((application?: Application) => {
    if (!requireAuth('access the ATS', 'recruiter')) return;
    setSelectedApplication(application || null);
    setCurrentScreen('recruiter-ats', { candidateId: null });
  }, [requireAuth, setSelectedApplication, setCurrentScreen]);

 const navigateToResumeBuilder = useCallback(() => {
 if (!requireAuth('build your resume', 'candidate')) return;
 setCurrentScreen('candidate-ai-resume-builder');
 }, [requireAuth, setCurrentScreen]);

 const navigateToATSScanner = useCallback(() => {
 if (!requireAuth('access ATS scanner', 'recruiter')) return;
 setCurrentScreen('recruiter-ats-scanner');
 }, [requireAuth, setCurrentScreen]);

 const navigateToFunctionalATS = useCallback(() => {
 if (!requireAuth('access functional ATS scanner')) return;
 if (user!.userType === 'recruiter') {
 setCurrentScreen('recruiter-functional-ats');
 } else {
 setCurrentScreen('candidate-functional-ats');
 }
 }, [requireAuth, user, setCurrentScreen]);

 const navigateToAccuracyFirstATS = useCallback(() => {
 if (!requireAuth('access accuracy-first ATS scanner')) return;
 if (user!.userType === 'recruiter') {
 setCurrentScreen('recruiter-accuracy-first-ats');
 } else {
 setCurrentScreen('candidate-accuracy-first-ats');
 }
 }, [requireAuth, user, setCurrentScreen]);

 const navigateToCandidateATSScanner = useCallback(() => {
 if (!requireAuth('access resume analyzer', 'candidate')) return;
 setCurrentScreen('candidate-ats-scanner');
 }, [requireAuth, setCurrentScreen]);

 const navigateToCandidateFunctionalATS = useCallback(() => {
 if (!requireAuth('access functional resume analyzer', 'candidate')) return;
 setCurrentScreen('candidate-functional-ats');
 }, [requireAuth, setCurrentScreen]);

 const navigateToCandidateAccuracyFirstATS = useCallback(() => {
 if (!requireAuth('access accuracy-first resume analyzer', 'candidate')) return;
 setCurrentScreen('candidate-accuracy-first-ats');
 }, [requireAuth, setCurrentScreen]);

 const navigateToAIMatchingDashboard = useCallback(() => {
 if (!requireAuth('access AI matching dashboard', 'recruiter')) return;
 setCurrentScreen('recruiter-ai-matching-dashboard');
 }, [requireAuth, setCurrentScreen]);

 const navigateToPortfolio = useCallback(() => {
 if (!requireAuth('manage your portfolio', 'candidate')) return;
 setCurrentScreen('candidate-portfolio');
 }, [requireAuth, setCurrentScreen]);

 const navigateToAnalytics = useCallback(() => {
 if (!requireAuth('view analytics', 'recruiter')) return;
 setCurrentScreen('recruiter-analytics');
 }, [requireAuth, setCurrentScreen]);

 const navigateToAdvancedAnalytics = useCallback(() => {
 if (!requireAuth('view advanced analytics', 'recruiter')) return;
 setCurrentScreen('recruiter-advanced-analytics');
 }, [requireAuth, setCurrentScreen]);

 const navigateToKnowledgeAssessment = useCallback(() => {
 if (!requireAuth('access knowledge assessments')) return;
 if (user!.userType === 'recruiter') {
 setCurrentScreen('recruiter-skills-assessment');
 } else {
 setCurrentScreen('candidate-knowledge-assessment');
 }
 }, [requireAuth, user, setCurrentScreen]);

 const navigateToCustomAssessmentBuilder = useCallback((existingAssessment?: unknown) => {
 if (!requireAuth('create custom assessments', 'recruiter')) return;
 setAssessmentBuilderData(existingAssessment || null);
 setCurrentScreen('recruiter-custom-assessment-builder');
 }, [requireAuth, setAssessmentBuilderData, setCurrentScreen]);

 const navigateToVideoInterview = useCallback(() => {
 if (!requireAuth('access video interviews', 'candidate')) return;
 setCurrentScreen('candidate-video-interview');
 }, [requireAuth, setCurrentScreen]);

 const navigateToEnhancedVideoInterview = useCallback(() => {
 if (!requireAuth('access enhanced video interviews')) return;
 
 if (user!.userType === 'recruiter') {
 setCurrentScreen('recruiter-enhanced-video-interview');
 } else {
 setCurrentScreen('candidate-enhanced-video-interview');
 }
 }, [requireAuth, user, setCurrentScreen]);

 const navigateToIntegrations = useCallback(() => {
 if (!requireAuth('access integrations', 'recruiter')) return;
 setCurrentScreen('recruiter-integrations');
 }, [requireAuth, setCurrentScreen]);

 const navigateToSubscriptionManager = useCallback(() => {
 if (!requireAuth('manage your subscription')) return;
 setCurrentScreen('subscription-manager');
 }, [requireAuth, setCurrentScreen]);

 const navigateToBetaProgram = useCallback(() => {
 if (!requireAuth('access the beta program')) return;
 setCurrentScreen('beta-program');
 }, [requireAuth, setCurrentScreen]);

 const navigateToLiveInterview = useCallback(() => {
 if (!requireAuth('start an interview')) return;
 setCurrentScreen('live-interview');
 }, [requireAuth, setCurrentScreen]);

 const navigateToOneWayInterview = useCallback(() => {
 if (!requireAuth('access interviews')) return;
 setCurrentScreen('one-way-interview');
 }, [requireAuth, setCurrentScreen]);

  const navigateToRecruiterDashboard = useCallback(() => {
  if (!requireAuth('access the dashboard', 'recruiter')) return;
  setCurrentScreen('recruiter-dashboard', { replace: true });
  setSelectedProject(null);
  setSelectedApplication(null);
  
  // Ensure URL is updated with recruiter-dashboard screen parameter
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    params.set('screen', 'recruiter-dashboard');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }
  }, [requireAuth, setCurrentScreen, setSelectedProject, setSelectedApplication]);

  const navigateToCandidateDashboard = useCallback(() => {
  if (!requireAuth('access the dashboard', 'candidate')) return;
  setCurrentScreen('candidate-dashboard', { replace: true });
  
  // Ensure URL is updated with candidate-dashboard screen parameter
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    params.set('screen', 'candidate-dashboard');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }
  }, [requireAuth, setCurrentScreen]);

 const navigateToMessages = useCallback((conversationId?: string) => {
 if (!requireAuth('access messages')) return;
 setSelectedConversationId(conversationId || null);
 setCurrentScreen('messages');
 }, [requireAuth, setCurrentScreen, setSelectedConversationId]);

 const navigateToNotifications = useCallback(() => {
 if (!requireAuth('view notifications')) return;
 setCurrentScreen('notifications');
 }, [requireAuth, setCurrentScreen]);

 const navigateToAISkillsDevelopment = useCallback(() => {
 if (!requireAuth('access AI skills development', 'candidate')) return;
 setCurrentScreen('candidate-ai-skills-development' as any);
 }, [requireAuth, setCurrentScreen]);

 const navigateToAICareerAdvisor = useCallback(() => {
 if (!requireAuth('access AI career advisor', 'candidate')) return;
 setCurrentScreen('candidate-ai-career-advisor' as any);
 }, [requireAuth, setCurrentScreen]);

  const navigateToCandidateSearch = useCallback(() => {
  if (!requireAuth('search candidates', 'recruiter')) return;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('hirevify_show_saved_candidates');
  }
  setCurrentScreen('recruiter-search-candidates');
  }, [requireAuth, setCurrentScreen]);

  const navigateToSavedCandidateSearch = useCallback(() => {
  if (!requireAuth('view saved candidates', 'recruiter')) return;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('hirevify_show_saved_candidates', '1');
  }
  setCurrentScreen('recruiter-search-candidates');
  }, [requireAuth, setCurrentScreen]);

  const navigateToCandidateDetail = useCallback((candidate: Candidate) => {
    if (!requireAuth('view candidate details', 'recruiter')) return;
    // Persist to sessionStorage so it survives page refresh
    try {
      sessionStorage.setItem('selectedCandidate', JSON.stringify(candidate));
    } catch (e) {
      console.warn('Failed to persist candidate to sessionStorage:', e);
    }
    setSelectedCandidate(candidate);
    setCurrentScreen('recruiter-candidate-detail', { candidateId: candidate.id });
  }, [requireAuth, setSelectedCandidate, setCurrentScreen]);

 const navigateToExperienceBuilder = useCallback(() => {
 if (!requireAuth('access the experience builder', 'candidate')) return;
 setCurrentScreen('candidate-experience-builder');
 }, [requireAuth, setCurrentScreen]);

 const navigateToMicroInternships = useCallback(() => {
 if (!requireAuth('access micro-internships', 'candidate')) return;
 setCurrentScreen('candidate-micro-internships');
 }, [requireAuth, setCurrentScreen]);

 const navigateToSkillsFirstHiring = useCallback(() => {
 if (!requireAuth('access skills-first hiring', 'recruiter')) return;
 setCurrentScreen('recruiter-skills-first-hiring');
 }, [requireAuth, setCurrentScreen]);

 const navigateToMentorshipProgram = useCallback(() => {
 if (!requireAuth('access the mentorship program', 'candidate')) return;
 setCurrentScreen('candidate-mentorship-program');
 }, [requireAuth, setCurrentScreen]);

const navigateToEmployerEducation = useCallback(() => {
  if (!requireAuth('access employer education', 'recruiter')) return;
  setCurrentScreen('recruiter-employer-education');
  }, [requireAuth, setCurrentScreen]);

  const navigateToOngoingProjects = useCallback(() => {
 if (!requireAuth('access all projects', 'recruiter')) return;
  setCurrentScreen('recruiter-ongoing-projects');
  }, [requireAuth, setCurrentScreen]);

  const navigateToCareerSwitcherTrack = useCallback(() => {
 if (!requireAuth('access the career switcher track', 'candidate')) return;
 setCurrentScreen('candidate-career-switcher-track');
 }, [requireAuth, setCurrentScreen]);

 const navigateToAutomatedScreening = useCallback(() => {
 if (!requireAuth('access automated screening', 'recruiter')) return;
 setCurrentScreen('recruiter-automated-screening');
 }, [requireAuth, setCurrentScreen]);

 const navigateToRecruiterMarketIntelligence = useCallback(() => {
 if (!requireAuth('access market intelligence', 'recruiter')) return;
 setCurrentScreen('recruiter-market-intelligence');
 }, [requireAuth, setCurrentScreen]);

 const navigateToCandidateMarketIntelligence = useCallback(() => {
 if (!requireAuth('access market intelligence', 'candidate')) return;
 setCurrentScreen('candidate-market-intelligence');
 }, [requireAuth, setCurrentScreen]);

 const navigateToAIInterviewCoach = useCallback(() => {
 if (!requireAuth('access AI interview coach', 'candidate')) return;
 setCurrentScreen('candidate-ai-interview-coach');
 }, [requireAuth, setCurrentScreen]);

 const navigateToSkillsDevelopmentAI = useCallback(() => {
 if (!requireAuth('access AI skills development', 'candidate')) return;
 setCurrentScreen('candidate-skills-development-ai');
 }, [requireAuth, setCurrentScreen]);

  const navigateToProjectChallengeVideo = useCallback((projectId: string, projectTitle: string, challengeDescription?: string) => {
  if (!requireAuth('record project explanation', 'candidate')) return;
  
  setProjectChallengeData({
    projectId,
    projectTitle,
    challengeDescription
  });
  setCurrentScreen('candidate-project-challenge-video');
  }, [requireAuth, setProjectChallengeData, setCurrentScreen]);

  // Navigate to Post Job screen (enhanced from Post Project)
  const navigateToPostJob = useCallback((job?: Job) => {
    if (!requireAuth('post jobs', 'recruiter')) return;
    
    setSelectedJob(job || null);
    setCurrentScreen('recruiter-post-job');
  }, [requireAuth, setSelectedJob, setCurrentScreen]);

// Navigate to job detail from candidate side
   const navigateToJobDetail = useCallback((job: Job) => {
     if (!requireAuth('view job details', 'candidate')) return;
     
     setSelectedJob(job);
     setCurrentScreen('candidate-job-detail');
   }, [requireAuth, setSelectedJob, setCurrentScreen]);

   // Navigate to job applicants (recruiter side)
   const navigateToJobApplicants = useCallback((job: any) => {
     if (!requireAuth('view job applicants', 'recruiter')) return;
     
     setSelectedJob(job);
     setCurrentScreen('recruiter-job-applicants');
   }, [requireAuth, setSelectedJob, setCurrentScreen]);

   // Navigate back to recruiter projects (job management)
   const navigateToRecruiterProjects = useCallback(() => {
     if (!requireAuth('manage jobs', 'recruiter')) return;
     setCurrentScreen('recruiter-projects');
   }, [requireAuth, setCurrentScreen]);

  // Navigate to project assignment for candidate
  const navigateToProjectAssignment = useCallback((assignmentId: string) => {
    if (!requireAuth('view project assignment', 'candidate')) return;
    
    setSelectedAssignment({ id: assignmentId } as JobProjectAssignment);
    setCurrentScreen('candidate-project-assignment');
  }, [requireAuth, setSelectedAssignment, setCurrentScreen]);

  // Navigate to project submission
  const navigateToProjectSubmission = useCallback((assignmentId: string) => {
    if (!requireAuth('submit project', 'candidate')) return;
    
    setSelectedAssignment({ id: assignmentId } as JobProjectAssignment);
    setCurrentScreen('candidate-project-submission');
  }, [requireAuth, setSelectedAssignment, setCurrentScreen]);

  return {
  
    navigateToRecruiterProfileEditor: () => setCurrentScreen('recruiter-profile-editor'),
    navigateToCandidateProfileEditor: () => setCurrentScreen('candidate-profile-editor'),
navigateHome,
  handleLogout,
  navigateToPricing,
  navigateToPostProject,
  navigateToPostJob,
  navigateToProjectSearch,
  navigateToProjects,
  navigateToInterviews,
  navigateToSettings,
  navigateToATS,
  navigateToResumeBuilder,
  navigateToATSScanner,
  navigateToFunctionalATS,
  navigateToAccuracyFirstATS,
  navigateToCandidateATSScanner,
  navigateToCandidateFunctionalATS,
  navigateToCandidateAccuracyFirstATS,
  navigateToAIMatchingDashboard,
  navigateToPortfolio,
  navigateToAnalytics,
  navigateToAdvancedAnalytics,
  navigateToKnowledgeAssessment,
  navigateToCustomAssessmentBuilder,
  navigateToVideoInterview,
  navigateToEnhancedVideoInterview,
  navigateToIntegrations,
  navigateToSubscriptionManager,
  navigateToBetaProgram,
  navigateToLiveInterview,
  navigateToOneWayInterview,
  navigateToRecruiterDashboard,
  navigateToCandidateDashboard,
  navigateToMessages,
  navigateToNotifications,
  navigateToAISkillsDevelopment,
    navigateToAICareerAdvisor,
    navigateToCandidateSearch,
    navigateToSavedCandidateSearch,
    navigateToCandidateDetail,
    navigateToExperienceBuilder,
  navigateToMicroInternships,
  navigateToSkillsFirstHiring,
  navigateToMentorshipProgram,
  navigateToEmployerEducation,
  navigateToOngoingProjects,
  navigateToCareerSwitcherTrack,
  navigateToAutomatedScreening,
  navigateToRecruiterMarketIntelligence,
  navigateToCandidateMarketIntelligence,
  navigateToAIInterviewCoach,
  navigateToSkillsDevelopmentAI,
  navigateToProjectChallengeVideo,
  navigateToJobDetail,
  navigateToProjectAssignment,
  navigateToProjectSubmission,
navigateToJobApply,
   navigateToMyJobs,
   navigateToJobs,
   navigateToAppliedJobs,
   navigateToSavedJobs,
   navigateToRecruiterApplicationDetail,
   navigateToJobApplicants,
   navigateToRecruiterProjects,
   };
};









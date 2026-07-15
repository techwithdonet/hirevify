/**
 * App Router Component
 * 
 * Handles screen rendering logic based on current screen state
 */

import dynamic from 'next/dynamic';
import { Homepage } from './Homepage'; // Homepage component
import { RecruiterDashboard } from './RecruiterDashboard';
import { CandidateDashboard } from './CandidateDashboard';
import { DashboardPageLayout } from './shared/DashboardPageLayout';
import { PremiumGate } from './PremiumGate';
import { toast } from 'sonner';
import { VideoSubmissionData, UserType, Project, Application, Screen, Job, JobProjectAssignment, Candidate } from '../types/app';

const ScreenLoading = () => <div className="premium-loading" role="status"><div className="premium-spinner" /><span className="sr-only">Loading screen</span></div>;

const FunctionalATSScanner = dynamic(() => import('./FunctionalATSScanner').then((mod) => mod.FunctionalATSScanner), { loading: ScreenLoading });
const AccuracyFirstATSScanner = dynamic(() => import('./AccuracyFirstATSScanner').then((mod) => mod.AccuracyFirstATSScanner), { loading: ScreenLoading });
const ProfessionalATSScanner = dynamic(() => import('./ProfessionalATSScanner').then((mod) => mod.ProfessionalATSScanner), { loading: ScreenLoading });
const ReliableATSScanner = dynamic(() => import('./ReliableATSScanner').then((mod) => mod.ReliableATSScanner), { loading: ScreenLoading });
const ProjectPostingFlow = dynamic(() => import('./ProjectPostingFlow').then((mod) => mod.ProjectPostingFlow), { loading: ScreenLoading });
const ATSView = dynamic(() => import('./ATSView').then((mod) => mod.ATSView), { loading: ScreenLoading });
const ResumeBuilder = dynamic(() => import('./ResumeBuilder').then((mod) => mod.ResumeBuilder), { loading: ScreenLoading });
const LiveInterviewScreen = dynamic(() => import('./LiveInterviewScreen').then((mod) => mod.LiveInterviewScreen), { loading: ScreenLoading });
const PricingPage = dynamic(() => import('./PricingPage').then((mod) => mod.PricingPage), { loading: ScreenLoading });
const MarketingInfoPage = dynamic(() => import('./MarketingInfoPage').then((mod) => mod.MarketingInfoPage), { loading: ScreenLoading });
const RecruiterAnalytics = dynamic(() => import('./RecruiterAnalytics').then((mod) => mod.RecruiterAnalytics), { loading: ScreenLoading });
const CandidatePortfolio = dynamic(() => import('./CandidatePortfolio').then((mod) => mod.CandidatePortfolio), { loading: ScreenLoading });
const SkillsAssessment = dynamic(() => import('./SkillsAssessment').then((mod) => mod.SkillsAssessment), { loading: ScreenLoading });
const OneWayVideoInterview = dynamic(() => import('./OneWayVideoInterview').then((mod) => mod.OneWayVideoInterview), { loading: ScreenLoading });
const IntegrationHub = dynamic(() => import('./IntegrationHub').then((mod) => mod.IntegrationHub), { loading: ScreenLoading });
const NotificationCenter = dynamic(() => import('./NotificationCenter').then((mod) => mod.NotificationCenter), { loading: ScreenLoading });
const MessagingCenter = dynamic(() => import('./MessagingCenter').then((mod) => mod.MessagingCenter), { loading: ScreenLoading });
const ProjectSearch = dynamic(() => import('./ProjectSearch').then((mod) => mod.ProjectSearch), { loading: ScreenLoading });
const CandidateSearch = dynamic(() => import('./CandidateSearch').then((mod) => mod.CandidateSearch), { loading: ScreenLoading });
const RecruiterCandidateDetail = dynamic(() => import('./RecruiterCandidateDetail').then((mod) => mod.RecruiterCandidateDetail), { loading: ScreenLoading });
const ProjectManagement = dynamic(() => import('./ProjectManagement').then((mod) => mod.ProjectManagement), { loading: ScreenLoading });
const JobApplicants = dynamic(() => import('./JobApplicants').then((mod) => mod.JobApplicants), { loading: ScreenLoading });
const InterviewManagement = dynamic(() => import('./InterviewManagement').then((mod) => mod.InterviewManagement), { loading: ScreenLoading });
const EnhancedVideoInterview = dynamic(() => import('./EnhancedVideoInterview').then((mod) => mod.EnhancedVideoInterview), { loading: ScreenLoading });
const RecruiterSettings = dynamic(() => import('./RecruiterSettings').then((mod) => mod.RecruiterSettings), { loading: ScreenLoading });
const RecruiterProfileEditor = dynamic(() => import('./RecruiterProfileEditor').then((mod) => mod.RecruiterProfileEditor), { loading: ScreenLoading });
const AIMatchingDashboard = dynamic(() => import('./AIMatchingDashboard').then((mod) => mod.AIMatchingDashboard), { loading: ScreenLoading });
const AutomatedScreening = dynamic(() => import('./AutomatedScreening').then((mod) => mod.AutomatedScreening), { loading: ScreenLoading });
const MarketIntelligenceDashboard = dynamic(() => import('./MarketIntelligenceDashboard').then((mod) => mod.MarketIntelligenceDashboard), { loading: ScreenLoading });
const AdvancedAnalyticsDashboard = dynamic(() => import('./AdvancedAnalyticsDashboard').then((mod) => mod.AdvancedAnalyticsDashboard), { loading: ScreenLoading });
const CustomAssessmentBuilder = dynamic(() => import('./CustomAssessmentBuilder').then((mod) => mod.CustomAssessmentBuilder), { loading: ScreenLoading });
const SkillsFirstHiring = dynamic(() => import('./SkillsFirstHiring').then((mod) => mod.SkillsFirstHiring), { loading: ScreenLoading });
const EmployerEducation = dynamic(() => import('./EmployerEducation').then((mod) => mod.EmployerEducation), { loading: ScreenLoading });
const OngoingProjects = dynamic(() => import('./OngoingProjects').then((mod) => mod.OngoingProjects), { loading: ScreenLoading });
const CandidateSettings = dynamic(() => import('./CandidateSettings').then((mod) => mod.CandidateSettings), { loading: ScreenLoading });
const CandidateProfileEditor = dynamic(() => import('./CandidateProfileEditor').then((mod) => mod.CandidateProfileEditor), { loading: ScreenLoading });
const AIInterviewCoach = dynamic(() => import('./AIInterviewCoach').then((mod) => mod.AIInterviewCoach), { loading: ScreenLoading });
const SkillsDevelopmentAI = dynamic(() => import('./SkillsDevelopmentAI').then((mod) => mod.SkillsDevelopmentAI), { loading: ScreenLoading });
const ExperienceBuilder = dynamic(() => import('./ExperienceBuilder').then((mod) => mod.ExperienceBuilder), { loading: ScreenLoading });
const MicroInternships = dynamic(() => import('./MicroInternships').then((mod) => mod.MicroInternships), { loading: ScreenLoading });
const MentorshipProgram = dynamic(() => import('./MentorshipProgram').then((mod) => mod.MentorshipProgram), { loading: ScreenLoading });
const CareerSwitcherTrack = dynamic(() => import('./CareerSwitcherTrack').then((mod) => mod.CareerSwitcherTrack), { loading: ScreenLoading });
const ProjectChallengeVideoRecording = dynamic(() => import('./ProjectChallengeVideoRecording').then((mod) => mod.ProjectChallengeVideoRecording), { loading: ScreenLoading });
const ATSUploadDiagnostic = dynamic(() => import('./ATSUploadDiagnostic').then((mod) => mod.ATSUploadDiagnostic), { loading: ScreenLoading });
const SubscriptionManager = dynamic(() => import('./SubscriptionManager').then((mod) => mod.SubscriptionManager), { loading: ScreenLoading });
const BetaProgram = dynamic(() => import('./BetaProgram').then((mod) => mod.BetaProgram), { loading: ScreenLoading });
const JobPostingFlow = dynamic(() => import('./JobPostingFlow').then((mod) => mod.JobPostingFlow), { loading: ScreenLoading });
const CandidateJobDetail = dynamic(() => import('./CandidateJobDetail').then((mod) => mod.CandidateJobDetail), { loading: ScreenLoading });
const CandidateJobApply = dynamic(() => import('./CandidateJobApply').then((mod) => mod.CandidateJobApply), { loading: ScreenLoading });
const CandidateProjectAssignment = dynamic(() => import('./CandidateProjectAssignment').then((mod) => mod.CandidateProjectAssignment), { loading: ScreenLoading });
const CandidateAppliedJobs = dynamic(() => import('./CandidateAppliedJobs').then((mod) => mod.CandidateAppliedJobs), { loading: ScreenLoading });
const CandidateSavedJobs = dynamic(() => import('./CandidateSavedJobs').then((mod) => mod.CandidateSavedJobs), { loading: ScreenLoading });

// Define the navigation methods that we expect from useAppNavigation
interface NavigationMethods {
  navigateToPostProject: (project?: Project) => void;
  navigateToPostJob: (job?: Job) => void;
  navigateToProjectSearch: () => void;
  navigateToRecruiterDashboard: () => void;
  navigateToCandidateDashboard: () => void;
  navigateToProjects: () => void;
  navigateToJobApplicants: (job: any) => void;
  navigateToRecruiterProjects: () => void;
  navigateToATS: (application?: Application) => void;
  navigateToATSScanner: () => void;
  navigateToAccuracyFirstATS: () => void;
  navigateToCandidateATSScanner: () => void;
  navigateToCandidateAccuracyFirstATS: () => void;
  navigateToAutomatedScreening: () => void;
  navigateToAIMatchingDashboard: () => void;
  navigateToRecruiterMarketIntelligence: () => void;
  navigateToCandidateMarketIntelligence: () => void;
  navigateToAnalytics: () => void;
  navigateToKnowledgeAssessment: () => void;
  navigateToIntegrations: () => void;
  navigateToInterviews: () => void;
  navigateToSettings: () => void;
  navigateToRecruiterProfileEditor: () => void;
  navigateToCandidateProfileEditor: () => void;
  navigateToCandidateSearch: () => void;
  navigateToSavedCandidateSearch: () => void;
  navigateToCandidateDetail: (candidate: Candidate) => void;
  navigateToMessages: (conversationId?: string) => void;
  navigateToNotifications: () => void;
  navigateToPricing: () => void;
  navigateToSkillsFirstHiring: () => void;
  navigateToEmployerEducation: () => void;
  navigateToOngoingProjects: () => void;
  navigateToResumeBuilder: () => void;
  navigateToPortfolio: () => void;
  navigateToVideoInterview: () => void;
  navigateToExperienceBuilder: () => void;
  navigateToMicroInternships: () => void;
  navigateToMentorshipProgram: () => void;
  navigateToCareerSwitcherTrack: () => void;
  navigateToProjectChallengeVideo: (projectId: string, projectTitle: string, challengeDescription?: string) => void;
  navigateToJobDetail: (job: Job) => void;
  navigateToProjectAssignment: (assignmentId: string) => void;
  navigateToProjectSubmission: (assignmentId: string) => void;
  navigateToJobApply: (job: Job) => void;
 navigateToAppliedJobs: () => void;
 navigateToSavedJobs: () => void;
  navigateToAIInterviewCoach: () => void;
  navigateToSkillsDevelopmentAI: () => void;
  navigateToLiveInterview: () => void;
  navigateToEnhancedVideoInterview: () => void;
  navigateToCustomAssessmentBuilder: (existingAssessment?: any) => void;
  navigateToAdvancedAnalytics: () => void;
  navigateToSubscriptionManager: () => void;
  navigateHome: () => void;
  handleLogout: () => Promise<void>;
}

interface ScreenNavigationOptions {
 replace?: boolean;
 skipScroll?: boolean;
 candidateId?: string | null;
}

interface User {
 id: string;
 email: string;
 name: string;
 userType: UserType;
}

/**
 * ProjectSearch passes its own local `Project` shape to `onViewJob`. The
 * rest of the app speaks the unified `Job` type (which now carries the
 * project_* fields too). This adapter bridges the two so we can navigate
 * to CandidateJobDetail regardless of where the row originated.
 */
const projectToJob = (p: any): Job => ({
  id: p.id,
  recruiter_id: p.recruiter_id ?? '',
  title: p.title,
  description: p.description ?? '',
  requirements: p.requirements ?? [],
  skills: p.skills ?? [],
  job_type: 'freelance',
  experience_level: 'mid',
  location: p.location ?? '',
  remote_type: 'remote',
  budget_min: null,
  budget_max: null,
  budget_currency: 'USD',
  status: 'published',
  has_project: true,
  project_title: p.title,
  project_description: p.description ?? null,
  project_skills: p.skills ?? [],
  project_timeline: p.timeline ?? null,
  project_budget_range: p.budget ?? null,
  created_at: p.createdAt ?? new Date().toISOString(),
});

interface AppRouterProps {
  currentScreen: Screen;
  user: User | null;
  selectedProject: Project | null;
  selectedApplication: Application | null;
  selectedJob: Job | null;
  selectedAssignment: JobProjectAssignment | null;
  selectedCandidate: Candidate | null;
  savedCandidates: string[];
  onToggleSavedCandidate: (candidateId: string) => void;
  unreadNotifications: number;
  unreadMessages: number;
  selectedConversationId: string | null;
  projectChallengeData: {
    projectId: string;
    projectTitle: string;
    challengeDescription?: string;
  } | null;
  assessmentBuilderData: any;
  navigation: NavigationMethods;
  handleLogout: () => Promise<void>;
  handleUserTypeSelection: (userType: UserType) => void;
  loginPromptSignal: number;
  onOpenHomepageLogin: () => void;
  setCurrentScreen: (screen: Screen, options?: ScreenNavigationOptions) => void;
  setUnreadMessages: (count: number) => void;
  setUnreadNotifications: (count: number) => void;
}

export function AppRouter({
  currentScreen,
  user,
  selectedProject,
  selectedApplication,
  selectedJob,
  selectedAssignment,
  selectedCandidate,
  savedCandidates,
  onToggleSavedCandidate,
  unreadNotifications,
  unreadMessages,
  selectedConversationId,
  projectChallengeData,
  assessmentBuilderData,
  navigation,
  handleLogout,
  handleUserTypeSelection,
  loginPromptSignal,
  onOpenHomepageLogin,
  setCurrentScreen,
  setUnreadMessages,
  setUnreadNotifications,
}: AppRouterProps) {
 const handleCandidateDetailBack = () => {
  const backScreen = typeof window !== 'undefined'
   ? window.sessionStorage.getItem('hirevify_candidate_detail_back_screen')
   : null;

  if (typeof window !== 'undefined') {
   window.sessionStorage.removeItem('hirevify_candidate_detail_back_screen');
  }

  if (backScreen === 'recruiter-ats') {
   navigation.navigateToATS();
   return;
  }

  navigation.navigateToCandidateSearch();
 };
 
 switch (currentScreen) {
 case 'homepage':
 return (
 <Homepage 
 onSelectUserType={handleUserTypeSelection}
 onPostProject={navigation.navigateToPostProject}
 onFindProject={navigation.navigateToProjectSearch}
 onNavigateScreen={setCurrentScreen}
 loginPromptSignal={loginPromptSignal}
 />
 );
 
   case 'recruiter-dashboard':
   return (
   <RecruiterDashboard 
   onPostProject={(project?: any) => navigation.navigateToPostProject(project)}
   onPostJob={(job?: any) => navigation.navigateToPostJob(job)}
   onViewProjects={navigation.navigateToProjects}
  onViewATS={navigation.navigateToATS}
  onViewATSScanner={navigation.navigateToATSScanner}
  onViewAutomatedScreening={navigation.navigateToAutomatedScreening}
  onViewAIMatchingDashboard={navigation.navigateToAIMatchingDashboard}
  onViewMarketIntelligence={navigation.navigateToRecruiterMarketIntelligence}
  onViewAnalytics={navigation.navigateToAnalytics}
  onViewSkillsAssessment={navigation.navigateToKnowledgeAssessment}
  onViewIntegrations={navigation.navigateToIntegrations}
  onViewInterviews={navigation.navigateToInterviews}
  onViewSettings={navigation.navigateToSettings}
          onEditProfile={navigation.navigateToRecruiterProfileEditor}
  onSearchCandidates={navigation.navigateToCandidateSearch}
  onViewSavedCandidates={navigation.navigateToSavedCandidateSearch}
  onViewMessages={navigation.navigateToMessages}
  onViewNotifications={navigation.navigateToNotifications}
  onUpgrade={navigation.navigateToPricing}
  onLogout={handleLogout}
 onSkillsFirstHiring={navigation.navigateToSkillsFirstHiring}
   onEmployerEducation={navigation.navigateToEmployerEducation}
   onViewOngoingProjects={navigation.navigateToOngoingProjects}
   unreadNotifications={unreadNotifications}
  unreadMessages={unreadMessages}
  />
  );
 
  case 'recruiter-post-project':
  return (
  <ProjectPostingFlow 
  onBack={navigation.navigateToRecruiterDashboard}
  existingProject={selectedProject as any}
  />
  );

  case 'recruiter-post-job':
  return (
  <JobPostingFlow 
  onBack={navigation.navigateToRecruiterDashboard}
  existingJob={selectedJob as any}
  />
  );

case 'recruiter-projects':
  return (
  <ProjectManagement 
  onBack={navigation.navigateToRecruiterDashboard}
  onEditProject={(project) => navigation.navigateToPostProject(project as any)}
  onViewApplications={(job) => navigation.navigateToJobApplicants(job)}
    onPostJob={(job?: any) => navigation.navigateToPostJob(job)}
  />
  );

  case 'recruiter-job-applicants':
  return (
  <JobApplicants
  job={selectedJob as any}
  onBack={navigation.navigateToRecruiterProjects}
  />
  );

  case 'recruiter-interviews':
 return (
 <InterviewManagement 
 onBack={navigation.navigateToRecruiterDashboard}
 onStartInterview={navigation.navigateToLiveInterview}
 onEnhancedVideoInterview={navigation.navigateToEnhancedVideoInterview}
 userType="recruiter"
 />
 );

 case 'recruiter-enhanced-video-interview':
 return (
 <PremiumGate featureKey="enhanced-video-interviews" onUpgrade={navigation.navigateToPricing} showFullPage>
 <EnhancedVideoInterview 
 onBack={navigation.navigateToRecruiterDashboard}
 onComplete={(recordings) => {
 console.log('Video interview completed:', recordings);
 toast.success('Video interview completed successfully');
 navigation.navigateToRecruiterDashboard();
 }}
 mode="recruiter-preview"
 />
 </PremiumGate>
 );

  case 'recruiter-settings':
  return (
  <RecruiterSettings 
  onBack={navigation.navigateToRecruiterDashboard}
  onUpgrade={navigation.navigateToPricing}
  />
  );
  
  case 'recruiter-profile-editor':
  return (
  <RecruiterProfileEditor 
  onBack={navigation.navigateToRecruiterDashboard}
  onUpgrade={navigation.navigateToPricing}
  />
  );
 
case 'recruiter-ats':
  return (
  <ATSView 
  onBack={navigation.navigateToRecruiterDashboard}
  onStartInterview={navigation.navigateToLiveInterview}
  onViewMessages={navigation.navigateToMessages}
  onViewOngoingProjects={navigation.navigateToOngoingProjects}
  onViewCandidateDetail={navigation.navigateToCandidateDetail}
  selectedCandidate={selectedApplication as any}
  />
  );

 case 'recruiter-ats-scanner':
 return (
 <PremiumGate featureKey="ats-scanner" onUpgrade={navigation.navigateToPricing} showFullPage>
 <ReliableATSScanner
 onBack={navigation.navigateToRecruiterDashboard}
 userType="recruiter"
 />
 </PremiumGate>
 );

 case 'recruiter-functional-ats':
 return (
 <FunctionalATSScanner />
 );

 case 'recruiter-accuracy-first-ats':
 return (
 <AccuracyFirstATSScanner />
 ); 

 case 'recruiter-professional-ats':
 return (
 <ProfessionalATSScanner />
 );

 case 'recruiter-ai-matching-dashboard':
 return (
 <PremiumGate featureKey="ai-matching" onUpgrade={navigation.navigateToPricing} showFullPage>
 <AIMatchingDashboard 
 onBack={navigation.navigateToRecruiterDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 </PremiumGate>
 );

 case 'recruiter-automated-screening':
 return (
 <PremiumGate featureKey="automated-screening" onUpgrade={navigation.navigateToPricing} showFullPage>
 <AutomatedScreening 
 onBack={navigation.navigateToRecruiterDashboard}
 onUpgrade={navigation.navigateToPricing}
 onViewMessages={navigation.navigateToMessages}
 />
 </PremiumGate>
 );

 case 'recruiter-market-intelligence':
 return (
 <PremiumGate featureKey="market-intelligence-recruiter" onUpgrade={navigation.navigateToPricing} showFullPage>
 <MarketIntelligenceDashboard 
 onBack={navigation.navigateToRecruiterDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 </PremiumGate>
 );
 
 case 'recruiter-analytics':
 return (
 <RecruiterAnalytics 
 onBack={navigation.navigateToRecruiterDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 );

 case 'recruiter-advanced-analytics':
 return (
 <PremiumGate featureKey="advanced-analytics" onUpgrade={navigation.navigateToPricing} showFullPage>
 <AdvancedAnalyticsDashboard 
 onBack={navigation.navigateToRecruiterDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 </PremiumGate>
 );
 
 case 'recruiter-skills-assessment':
 return (
 <SkillsAssessment 
 onBack={navigation.navigateToRecruiterDashboard}
 userType="recruiter"
 onCreateCustomAssessment={navigation.navigateToCustomAssessmentBuilder}
 />
 );

 case 'recruiter-custom-assessment-builder':
 return (
 <PremiumGate featureKey="custom-assessments" onUpgrade={navigation.navigateToPricing} showFullPage>
 <CustomAssessmentBuilder 
 onBack={() => setCurrentScreen('recruiter-skills-assessment', { replace: true })}
 existingAssessment={assessmentBuilderData}
 onSave={(assessment) => {
 console.log('Assessment saved:', assessment);
 toast.success('Assessment saved successfully');
 setCurrentScreen('recruiter-skills-assessment', { replace: true });
 }}
 />
 </PremiumGate>
 );
 
 case 'recruiter-integrations':
 return (
 <PremiumGate featureKey="integrations" onUpgrade={navigation.navigateToPricing} showFullPage>
 <IntegrationHub 
 onBack={navigation.navigateToRecruiterDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 </PremiumGate>
 );
 
 case 'recruiter-search-candidates':
  return (
  <PremiumGate featureKey="candidate-search" onUpgrade={navigation.navigateToPricing} showFullPage>
  <CandidateSearch 
  onBack={navigation.navigateToRecruiterDashboard}
  onUpgrade={navigation.navigateToPricing}
  onViewMessages={navigation.navigateToMessages}
  onViewCandidateDetail={navigation.navigateToCandidateDetail}
  savedOnly={typeof window !== 'undefined' && window.localStorage.getItem('hirevify_show_saved_candidates') === '1'}
  />
  </PremiumGate>
  );

 case 'recruiter-candidate-detail':
  if (!selectedCandidate) {
    // Render a structurally identical loading placeholder on both server and
    // client first render. After mount, the useEffect in App.tsx populates
    // `selectedCandidate` from sessionStorage and we re-render with the real
    // detail page. This avoids a hydration mismatch where the server (no
    // sessionStorage) would otherwise fall back to <CandidateSearch/>.
    return (
      <DashboardPageLayout
        title="Loading candidate..."
        onBack={handleCandidateDetailBack}
      >
        <div className="mx-auto max-w-6xl p-8 text-center text-slate-500">
          Loading candidate profile...
        </div>
      </DashboardPageLayout>
    );
  }
  return (
    <RecruiterCandidateDetail
      candidate={selectedCandidate}
      onBack={handleCandidateDetailBack}
      onUpgrade={navigation.navigateToPricing}
      onViewMessages={navigation.navigateToMessages}
      onToggleSaved={onToggleSavedCandidate}
      savedCandidates={savedCandidates}
    />
  );

  case 'recruiter-skills-first-hiring':
 return (
 <SkillsFirstHiring 
 onBack={navigation.navigateToRecruiterDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 );

case 'recruiter-employer-education':
  return (
  <EmployerEducation
  onBack={navigation.navigateToRecruiterDashboard}
  onUpgrade={navigation.navigateToPricing}
  />
  );

  case 'recruiter-ongoing-projects':
  return (
  <OngoingProjects
  onBack={navigation.navigateToRecruiterDashboard}
  onViewCandidateDetail={(assignmentId) => {
    // TODO: Navigate to candidate detail with assignment
    console.log('View candidate detail:', assignmentId);
  }}
  onViewMessages={navigation.navigateToMessages}
  />
  );
 
case 'candidate-dashboard':
  return (
  <CandidateDashboard 
  onBuildResume={navigation.navigateToResumeBuilder}
  onViewPortfolio={navigation.navigateToPortfolio}
  onTakeKnowledgeAssessment={navigation.navigateToKnowledgeAssessment}
  onVideoInterview={navigation.navigateToVideoInterview}
  onSearchProjects={navigation.navigateToProjectSearch}
  onViewInterviews={navigation.navigateToInterviews}
  onViewSettings={navigation.navigateToSettings}
  onEditProfile={navigation.navigateToCandidateProfileEditor}
  onViewMessages={navigation.navigateToMessages}
  onViewNotifications={navigation.navigateToNotifications}
  onViewAppliedJobs={navigation.navigateToAppliedJobs}
  onViewSavedJobs={navigation.navigateToSavedJobs}
  onUpgrade={navigation.navigateToPricing}
  onLogout={handleLogout}
  onExperienceBuilder={navigation.navigateToExperienceBuilder}
  onMicroInternships={navigation.navigateToMicroInternships}
  onMentorshipProgram={navigation.navigateToMentorshipProgram}
  onCareerSwitcherTrack={navigation.navigateToCareerSwitcherTrack}
  onProjectChallengeVideo={navigation.navigateToProjectChallengeVideo}
  onAIInterviewCoach={navigation.navigateToAIInterviewCoach}
  onSkillsDevelopmentAI={navigation.navigateToSkillsDevelopmentAI}
  onMarketIntelligence={navigation.navigateToCandidateMarketIntelligence}
  unreadNotifications={unreadNotifications}
  unreadMessages={unreadMessages}
  />
  );

 case 'candidate-interviews':
 return (
 <InterviewManagement 
 onBack={navigation.navigateToCandidateDashboard}
 onJoinInterview={navigation.navigateToLiveInterview}
 onTakeVideoInterview={navigation.navigateToVideoInterview}
 onEnhancedVideoInterview={navigation.navigateToEnhancedVideoInterview}
 userType="candidate"
 />
 );

 case 'candidate-enhanced-video-interview':
 return (
 <PremiumGate featureKey="enhanced-video-interviews-candidate" onUpgrade={navigation.navigateToPricing} showFullPage>
 <EnhancedVideoInterview 
 onBack={navigation.navigateToCandidateDashboard}
 onComplete={(recordings) => {
 console.log('Video interview completed:', recordings);
 toast.success('Video interview submitted successfully');
 navigation.navigateToCandidateDashboard();
 }}
 mode="candidate"
 />
 </PremiumGate>
 );

  case 'candidate-settings':
  return (
  <CandidateSettings 
  onBack={navigation.navigateToCandidateDashboard}
  onUpgrade={navigation.navigateToPricing}
  />
  );
  
  case 'candidate-profile-editor':
  return (
  <CandidateProfileEditor 
  onBack={navigation.navigateToCandidateDashboard}
  />
  );
 
 case 'candidate-ai-resume-builder':
 case 'candidate-resume-builder':
 return (
 <PremiumGate featureKey="ai-resume-builder" onUpgrade={navigation.navigateToPricing} showFullPage>
 <ResumeBuilder
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 </PremiumGate>
 );

 case 'candidate-ai-interview-coach':
 return (
 <PremiumGate featureKey="ai-interview-coach" onUpgrade={navigation.navigateToPricing} showFullPage>
 <AIInterviewCoach 
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 </PremiumGate>
 );

 case 'candidate-skills-development-ai':
 return (
 <PremiumGate featureKey="ai-skills-development" onUpgrade={navigation.navigateToPricing} showFullPage>
 <SkillsDevelopmentAI 
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 </PremiumGate>
 );

 case 'candidate-market-intelligence':
 return (
 <PremiumGate featureKey="market-intelligence-candidate" onUpgrade={navigation.navigateToPricing} showFullPage>
 <MarketIntelligenceDashboard 
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 </PremiumGate>
 );
 
 case 'candidate-portfolio':
 return (
 <CandidatePortfolio 
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 );
 
 case 'candidate-knowledge-assessment':
 return (
 <SkillsAssessment 
 onBack={navigation.navigateToCandidateDashboard}
 userType="candidate"
 />
 );
 
 case 'candidate-video-interview':
 return (
 <OneWayVideoInterview 
 onBack={navigation.navigateToCandidateDashboard}
 onComplete={navigation.navigateToCandidateDashboard}
 />
 );
 
  case 'candidate-search-projects':
  case 'candidate-jobs':
  return (
  <ProjectSearch
  onBack={navigation.navigateToCandidateDashboard}
  onUpgrade={navigation.navigateToPricing}
  onProjectChallengeVideo={navigation.navigateToProjectChallengeVideo}
  onViewJob={(p) => navigation.navigateToJobDetail(projectToJob(p))}
  />
  );

  case 'candidate-job-detail':
  return (
  selectedJob ? (
  <CandidateJobDetail
  job={selectedJob as any}
  onBack={navigation.navigateToProjectSearch}
  onViewAssignment={(assignmentId) => navigation.navigateToProjectAssignment(assignmentId)}
  onApply={navigation.navigateToJobApply}
  onEditProfile={() => navigation.navigateToCandidateProfileEditor()}
  />
  ) : (
  <ProjectSearch
  onBack={navigation.navigateToCandidateDashboard}
  onUpgrade={navigation.navigateToPricing}
  onProjectChallengeVideo={navigation.navigateToProjectChallengeVideo}
  onViewJob={(p) => navigation.navigateToJobDetail(projectToJob(p))}
  />
  )
  );

  case 'candidate-project-assignment':
  case 'candidate-project-submission':
  return (
  selectedAssignment?.id ? (
  <CandidateProjectAssignment
  assignmentId={selectedAssignment.id}
  onBack={navigation.navigateToCandidateDashboard}
  />
  ) : (
  <ProjectSearch
  onBack={navigation.navigateToCandidateDashboard}
  onUpgrade={navigation.navigateToPricing}
  onProjectChallengeVideo={navigation.navigateToProjectChallengeVideo}
  />
  )
  );

  case 'candidate-job-apply':
  return (
  selectedJob ? (
  <CandidateJobApply
  job={selectedJob as any}
  onBack={() => navigation.navigateToJobDetail(selectedJob as Job)}
  onApplied={navigation.navigateToCandidateDashboard}
  />
  ) : (
  <ProjectSearch
  onBack={navigation.navigateToCandidateDashboard}
  onUpgrade={navigation.navigateToPricing}
  onProjectChallengeVideo={navigation.navigateToProjectChallengeVideo}
  onViewJob={(p) => navigation.navigateToJobDetail(projectToJob(p))}
  />
  )
  );

  case 'candidate-applied-jobs':
  return (
  <CandidateAppliedJobs
  onBack={navigation.navigateToCandidateDashboard}
  onViewJob={navigation.navigateToJobDetail}
  onViewAssignment={navigation.navigateToProjectAssignment}
  onSearchProjects={navigation.navigateToProjectSearch}
  />
  );

  case 'candidate-saved-jobs':
  return (
  <CandidateSavedJobs
  onBack={navigation.navigateToCandidateDashboard}
  onViewJob={navigation.navigateToJobDetail}
  onBrowseJobs={navigation.navigateToProjectSearch}
  />
  );


 case 'candidate-experience-builder':
 return (
 <ExperienceBuilder 
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 );

 case 'candidate-micro-internships':
 return (
 <MicroInternships 
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 );

 case 'candidate-mentorship-program':
 return (
 <MentorshipProgram 
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 );

 case 'candidate-career-switcher-track':
 return (
 <CareerSwitcherTrack 
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 );

 case 'candidate-project-challenge-video':
 return (
 <ProjectChallengeVideoRecording 
 onBack={navigation.navigateToCandidateDashboard}
 onComplete={async (videoData: any) => {
 try {
 console.log('Video submission completed:', {
 projectId: videoData.projectId,
 duration: videoData.duration,
 questionsAnswered: videoData.responses.length,
 submittedAt: new Date(videoData.timestamp).toLocaleString()
 });
 
 navigation.navigateToCandidateDashboard();
 
 toast.success('Project explanation submitted successfully!', {
 description: `${videoData.responses.length} questions answered in ${Math.round(videoData.duration / 1000 / 60)} minutes`,
 });
 
 } catch (error) {
 console.error('Error processing video submission:', error);
 toast.error('Video submitted but there was an error processing it');
 navigation.navigateToCandidateDashboard();
 }
 }}
 projectTitle={projectChallengeData?.projectTitle || 'Project Challenge'}
 projectId={projectChallengeData?.projectId || ''}
 challengeDescription={projectChallengeData?.challengeDescription}
 />
 );
 
 case 'candidate-ats-scanner':
 return (
 <PremiumGate featureKey="candidate-ats-scanner" onUpgrade={navigation.navigateToPricing} showFullPage>
 <ReliableATSScanner
 onBack={navigation.navigateToCandidateDashboard}
 userType="candidate"
 />
 </PremiumGate>
 ); 

 case 'candidate-functional-ats':
 return (
 <FunctionalATSScanner />
 ); 

 case 'candidate-accuracy-first-ats':
 return (
 <AccuracyFirstATSScanner />
 ); 

 case 'candidate-professional-ats':
 return (
 <ProfessionalATSScanner />
 );

 // Debug/diagnostic route
 case 'ats-diagnostic':
 return (
 <ATSUploadDiagnostic />
 );

 case 'pricing':
 return (
 <PricingPage 
 onBack={user?.userType === 'recruiter'? navigation.navigateToRecruiterDashboard: 
 user?.userType === 'candidate'? navigation.navigateToCandidateDashboard: 
 navigation.navigateHome}
 onManageSubscription={navigation.navigateToSubscriptionManager}
 userType={user?.userType}
 />
 );

 case 'subscription-manager':
 return (
 <SubscriptionManager 
 onBack={user?.userType === 'recruiter'? navigation.navigateToRecruiterDashboard: navigation.navigateToCandidateDashboard}
 userType={user?.userType}
 />
 );

 case 'beta-program':
 return (
 <BetaProgram 
 onBack={user?.userType === 'recruiter'? navigation.navigateToRecruiterDashboard: navigation.navigateToCandidateDashboard}
 />
 );
 
 case 'live-interview':
 return (
 <LiveInterviewScreen 
 onEndInterview={user?.userType === 'recruiter'? navigation.navigateToRecruiterDashboard: navigation.navigateToCandidateDashboard}
 />
 );
 
 case 'one-way-interview':
 return (
 <OneWayVideoInterview 
 onBack={user?.userType === 'recruiter'? navigation.navigateToRecruiterDashboard: navigation.navigateToCandidateDashboard}
 onComplete={user?.userType === 'recruiter'? navigation.navigateToRecruiterDashboard: navigation.navigateToCandidateDashboard}
 />
 );
 
 case 'messages':
 return (
 <MessagingCenter 
 onBack={user?.userType === 'recruiter'? navigation.navigateToRecruiterDashboard: navigation.navigateToCandidateDashboard}
 onUpdateUnreadCount={setUnreadMessages}
 selectedConversationId={selectedConversationId}
 />
 );
 
 case 'notifications':
 return (
 <NotificationCenter 
 onBack={user?.userType === 'recruiter'? navigation.navigateToRecruiterDashboard: navigation.navigateToCandidateDashboard}
 onUpdateUnreadCount={setUnreadNotifications}
 onOpenNotification={(notification) => {
   const data = (notification as any).data || {};
   if (user?.userType === 'candidate' && data.assignment_id) {
     navigation.navigateToProjectAssignment(data.assignment_id);
     return;
   }
   if (user?.userType === 'recruiter') {
     navigation.navigateToATS();
     return;
   }
   navigation.navigateToCandidateDashboard();
 }}
 />
 );

 case 'product-features':
 case 'product-api':
 case 'product-integrations':
 case 'company-about':
 case 'company-blog':
 case 'company-careers':
 case 'company-contact':
 case 'support-help-center':
 case 'support-privacy-policy':
 case 'support-terms-of-service':
 case 'support-status':
 return (
 <MarketingInfoPage
 page={currentScreen}
 onBack={navigation.navigateHome}
 onNavigate={setCurrentScreen}
 onOpenHomepageLogin={onOpenHomepageLogin}
 />
 );
 
 default:
 return (
 <Homepage 
 onSelectUserType={handleUserTypeSelection}
 onPostProject={navigation.navigateToPostProject}
 onFindProject={navigation.navigateToProjectSearch}
 onNavigateScreen={setCurrentScreen}
 loginPromptSignal={loginPromptSignal}
 />
 );
 }
}





















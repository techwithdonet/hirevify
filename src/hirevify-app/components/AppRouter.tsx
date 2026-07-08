/**
 * App Router Component
 * 
 * Handles screen rendering logic based on current screen state
 */

import { FunctionalATSScanner } from './FunctionalATSScanner'; // Functional prototype ATS scanner
import { AccuracyFirstATSScanner } from './AccuracyFirstATSScanner'; // Accuracy-first ATS scanner
import { ProfessionalATSScanner } from './ProfessionalATSScanner'; // Professional third-party integration ATS scanner
import { ReliableATSScanner } from './ReliableATSScanner'; // New reliable and simple ATS scanner
import { Homepage } from './Homepage'; // Homepage component
import { ProjectPostingFlow } from './ProjectPostingFlow';
import { ATSView } from './ATSView';
import { ResumeBuilder } from './ResumeBuilder';
import { LiveInterviewScreen } from './LiveInterviewScreen';
import { PricingPage } from './PricingPage';
import { RecruiterAnalytics } from './RecruiterAnalytics';
import { CandidatePortfolio } from './CandidatePortfolio';
import { SkillsAssessment } from './SkillsAssessment';
import { OneWayVideoInterview } from './OneWayVideoInterview';
import { IntegrationHub } from './IntegrationHub';
import { NotificationCenter } from './NotificationCenter';
import { MessagingCenter } from './MessagingCenter';
import { ProjectSearch } from './ProjectSearch';
import { CandidateSearch } from './CandidateSearch';
import { RecruiterCandidateDetail } from './RecruiterCandidateDetail';
import { ProjectManagement } from './ProjectManagement';
import { JobApplicants } from './JobApplicants';
import { InterviewManagement } from './InterviewManagement';
import { EnhancedVideoInterview } from './EnhancedVideoInterview';
import { RecruiterSettings } from './RecruiterSettings';
import { RecruiterProfileEditor } from './RecruiterProfileEditor';
import { AIMatchingDashboard } from './AIMatchingDashboard';
import { AutomatedScreening } from './AutomatedScreening';
import { MarketIntelligenceDashboard } from './MarketIntelligenceDashboard';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import { CustomAssessmentBuilder } from './CustomAssessmentBuilder';
import { SkillsFirstHiring } from './SkillsFirstHiring';
import { EmployerEducation } from './EmployerEducation';
import { OngoingProjects } from './OngoingProjects';
import { CandidateSettings } from './CandidateSettings';
import { CandidateProfileEditor } from './CandidateProfileEditor';
import { AIInterviewCoach } from './AIInterviewCoach';
import { SkillsDevelopmentAI } from './SkillsDevelopmentAI';
import { ExperienceBuilder } from './ExperienceBuilder';
import { MicroInternships } from './MicroInternships';
import { MentorshipProgram } from './MentorshipProgram';
import { CareerSwitcherTrack } from './CareerSwitcherTrack';
import { ProjectChallengeVideoRecording } from './ProjectChallengeVideoRecording';
import { ATSUploadDiagnostic } from './ATSUploadDiagnostic';
import { RecruiterDashboard } from './RecruiterDashboard';
import { CandidateDashboard } from './CandidateDashboard';
import { SubscriptionManager } from './SubscriptionManager';
import { BetaProgram } from './BetaProgram';
import { JobPostingFlow } from './JobPostingFlow';
import { CandidateJobDetail } from './CandidateJobDetail';
import { CandidateJobApply } from './CandidateJobApply';
import { CandidateProjectAssignment } from './CandidateProjectAssignment';
import { CandidateAppliedJobs } from './CandidateAppliedJobs';
import { CandidateSavedJobs } from './CandidateSavedJobs';
import { DashboardPageLayout } from './shared/DashboardPageLayout';
import { toast } from 'sonner';
import { VideoSubmissionData, UserType, Project, Application, Screen, Job, JobProjectAssignment, Candidate } from '../types/app';

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
  setCurrentScreen,
  setUnreadMessages,
  setUnreadNotifications,
}: AppRouterProps) {
 
 switch (currentScreen) {
 case 'homepage':
 return (
 <Homepage 
 onSelectUserType={handleUserTypeSelection}
 onPostProject={navigation.navigateToPostProject}
 onFindProject={navigation.navigateToProjectSearch}
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
 <EnhancedVideoInterview 
 onBack={navigation.navigateToRecruiterDashboard}
 onComplete={(recordings) => {
 console.log('Video interview completed:', recordings);
 toast.success('Video interview completed successfully');
 navigation.navigateToRecruiterDashboard();
 }}
 mode="recruiter-preview"
 />
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
 <ReliableATSScanner
 onBack={navigation.navigateToRecruiterDashboard}
 userType="recruiter"
 />
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
 <AIMatchingDashboard 
 onBack={navigation.navigateToRecruiterDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 );

 case 'recruiter-automated-screening':
 return (
 <AutomatedScreening 
 onBack={navigation.navigateToRecruiterDashboard}
 onUpgrade={navigation.navigateToPricing}
 onViewMessages={navigation.navigateToMessages}
 />
 );

 case 'recruiter-market-intelligence':
 return (
 <MarketIntelligenceDashboard 
 onBack={navigation.navigateToRecruiterDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
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
 <AdvancedAnalyticsDashboard 
 onBack={navigation.navigateToRecruiterDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
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
 <CustomAssessmentBuilder 
 onBack={() => setCurrentScreen('recruiter-skills-assessment', { replace: true })}
 existingAssessment={assessmentBuilderData}
 onSave={(assessment) => {
 console.log('Assessment saved:', assessment);
 toast.success('Assessment saved successfully');
 setCurrentScreen('recruiter-skills-assessment', { replace: true });
 }}
 />
 );
 
 case 'recruiter-integrations':
 return (
 <IntegrationHub 
 onBack={navigation.navigateToRecruiterDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 );
 
 case 'recruiter-search-candidates':
  return (
  <CandidateSearch 
  onBack={navigation.navigateToRecruiterDashboard}
  onUpgrade={navigation.navigateToPricing}
  onViewMessages={navigation.navigateToMessages}
  onViewCandidateDetail={navigation.navigateToCandidateDetail}
  savedOnly={typeof window !== 'undefined' && window.localStorage.getItem('hirevify_show_saved_candidates') === '1'}
  />
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
        onBack={navigation.navigateToCandidateSearch}
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
      onBack={navigation.navigateToCandidateSearch}
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
 <EnhancedVideoInterview 
 onBack={navigation.navigateToCandidateDashboard}
 onComplete={(recordings) => {
 console.log('Video interview completed:', recordings);
 toast.success('Video interview submitted successfully');
 navigation.navigateToCandidateDashboard();
 }}
 mode="candidate"
 />
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
 <ResumeBuilder
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 );

 case 'candidate-ai-interview-coach':
 return (
 <AIInterviewCoach 
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 );

 case 'candidate-skills-development-ai':
 return (
 <SkillsDevelopmentAI 
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
 );

 case 'candidate-market-intelligence':
 return (
 <MarketIntelligenceDashboard 
 onBack={navigation.navigateToCandidateDashboard}
 onUpgrade={navigation.navigateToPricing}
 />
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
 <ReliableATSScanner
 onBack={navigation.navigateToCandidateDashboard}
 userType="candidate"
 />
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
 
 default:
 return (
 <Homepage 
 onSelectUserType={handleUserTypeSelection}
 onPostProject={navigation.navigateToPostProject}
 onFindProject={navigation.navigateToProjectSearch}
 />
 );
 }
}





















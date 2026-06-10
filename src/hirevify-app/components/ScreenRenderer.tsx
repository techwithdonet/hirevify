import React from 'react';
import { Screen, Project, Application, VideoSubmissionData } from '../types/navigation';
import { User } from './AuthProvider';
import { toast } from 'sonner';

// Component imports
import { Homepage } from './Homepage_fixed';
import { RecruiterDashboard } from './RecruiterDashboard';
import { CandidateDashboard } from './CandidateDashboard';
import { ProjectPostingFlow } from './ProjectPostingFlow';
import { ATSView } from './ATSView';
import { ResumeBuilder } from './ResumeBuilder';
import { LiveInterviewScreen } from './LiveInterviewScreen';
import { PricingPage } from './PricingPage';
import { RecruiterAnalytics } from './RecruiterAnalytics';
import { CandidatePortfolio } from './CandidatePortfolio';
import { SkillsAssessment } from './SkillsAssessment';
import { OneWayVideoInterview } from './OneWayVideoInterview';
import { IntegrationHub } from './IntegrationHub_Resilient';
import { IntegrationHub_OfflineMode } from './IntegrationHub_OfflineMode';
import { NotificationCenter } from './NotificationCenter';
import { AISkillsDevelopment } from './AISkillsDevelopment';
import { AICareerAdvisor } from './AICareerAdvisor';
import { AISmartNotifications } from './AISmartNotifications';
import { MessagingCenter } from './MessagingCenter';
import { ProjectSearch } from './ProjectSearch';
import { CandidateSearch } from './CandidateSearch';
import { AIResumeBuilder } from './AIResumeBuilder';
import { ATSResumeScanner } from './ATSResumeScanner';
import { AIMatchingDashboard } from './AIMatchingDashboard';
import { ExperienceBuilder } from './ExperienceBuilder';
import { MicroInternships } from './MicroInternships';
import { SkillsFirstHiring } from './SkillsFirstHiring';
import { MentorshipProgram } from './MentorshipProgram';
import { EmployerEducation } from './EmployerEducation';
import { CareerSwitcherTrack } from './CareerSwitcherTrack';
import { ProjectChallengeVideoRecording } from './ProjectChallengeVideoRecording';
import { CustomAssessmentBuilder } from './CustomAssessmentBuilder';
import { EnhancedVideoInterview } from './EnhancedVideoInterview';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import { CandidateSettings } from './CandidateSettings';
import { RecruiterSettings } from './RecruiterSettings';
import { ProjectManagement } from './ProjectManagement';
import { InterviewManagement } from './InterviewManagement';
import { SubscriptionManager } from './SubscriptionManager';
import { BetaProgram } from './BetaProgram';

interface ScreenRendererProps {
  currentScreen: Screen;
  user: User | null;
  isLoading: boolean;
  connectionStatus: string;
  selectedProject: Project | null;
  selectedApplication: Application | null;
  assessmentBuilderData: any;
  projectChallengeData: any;
  unreadNotifications: number;
  unreadMessages: number;
  navigation: any; // All navigation functions
  handleUserTypeSelection: (userType: 'recruiter' | 'candidate') => Promise<void>;
  setUnreadMessages: (count: number) => void;
  setUnreadNotifications: (count: number) => void;
}

export const ScreenRenderer: React.FC<ScreenRendererProps> = ({
  currentScreen,
  user,
  isLoading,
  connectionStatus,
  selectedProject,
  selectedApplication,
  assessmentBuilderData,
  projectChallengeData,
  unreadNotifications,
  unreadMessages,
  navigation,
  handleUserTypeSelection,
  setUnreadMessages,
  setUnreadNotifications
}) => {
  // Enhanced loading state with better UX
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">HireVify</h3>
          <p className="text-muted-foreground">
            {connectionStatus === 'checking' ? 'Connecting to services...' : 
             connectionStatus === 'error' ? 'Connection failed - retrying...' :
             user ? `Welcome back, ${user.name}!` : 'Loading...'}
          </p>
          {user && (
            <p className="text-sm text-muted-foreground mt-2">
              Redirecting to your {user.userType} dashboard...
            </p>
          )}
        </div>
      </div>
    );
  }

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
          onPostProject={navigation.navigateToPostProject}
          onViewProjects={navigation.navigateToProjects}
          onViewATS={navigation.navigateToATS}
          onViewATSScanner={navigation.navigateToATSScanner}
          onViewAIMatchingDashboard={navigation.navigateToAIMatchingDashboard}
          onViewAnalytics={navigation.navigateToAnalytics}
          onViewSkillsAssessment={navigation.navigateToKnowledgeAssessment}
          onViewIntegrations={navigation.navigateToIntegrations}
          onViewInterviews={navigation.navigateToInterviews}
          onViewSettings={navigation.navigateToSettings}
          onSearchCandidates={navigation.navigateToCandidateSearch}
          onViewMessages={navigation.navigateToMessages}
          onViewNotifications={navigation.navigateToNotifications}
          onUpgrade={navigation.navigateToPricing}
          onLogout={navigation.handleLogout}
          onSkillsFirstHiring={navigation.navigateToSkillsFirstHiring}
          onEmployerEducation={navigation.navigateToEmployerEducation}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
        />
      );
    
    case 'recruiter-post-project':
      return (
        <ProjectPostingFlow 
          onBack={navigation.navigateToRecruiterDashboard}
          existingProject={selectedProject}
        />
      );

    case 'recruiter-projects':
      return (
        <ProjectManagement 
          onBack={navigation.navigateToRecruiterDashboard}
          onEditProject={navigation.navigateToPostProject}
          onViewApplications={navigation.navigateToATS}
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
    
    case 'recruiter-ats':
      return (
        <ATSView 
          onBack={navigation.navigateToRecruiterDashboard}
          onStartInterview={navigation.navigateToLiveInterview}
          selectedApplication={selectedApplication}
        />
      );

    case 'recruiter-ats-scanner':
      return (
        <ATSResumeScanner 
          onBack={navigation.navigateToRecruiterDashboard}
          onUpgrade={navigation.navigateToPricing}
        />
      );

    case 'recruiter-ai-matching-dashboard':
      return (
        <AIMatchingDashboard 
          onBack={navigation.navigateToRecruiterDashboard}
          onUpgrade={navigation.navigateToPricing}
        />
      );
    
    case 'recruiter-analytics':
      return (
        <RecruiterAnalytics 
          onBack={navigation.navigateToRecruiterDashboard}
          onUpgrade={navigation.navigateToPricing}
          onAdvancedAnalytics={navigation.navigateToAdvancedAnalytics}
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
          onBack={() => navigation.navigateToKnowledgeAssessment()}
          existingAssessment={assessmentBuilderData}
          onSave={(assessment) => {
            console.log('Assessment saved:', assessment);
            toast.success('Assessment saved successfully');
            navigation.navigateToKnowledgeAssessment();
          }}
        />
      );
    
    case 'recruiter-integrations':
      // Use offline mode if backend services are unavailable
      if (connectionStatus === 'error') {
        return (
          <IntegrationHub_OfflineMode 
            onBack={navigation.navigateToRecruiterDashboard}
            onUpgrade={navigation.navigateToPricing}
          />
        );
      }
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
          onViewMessages={navigation.navigateToMessages}
          onViewNotifications={navigation.navigateToNotifications}
          onUpgrade={navigation.navigateToPricing}
          onLogout={navigation.handleLogout}
          onExperienceBuilder={navigation.navigateToExperienceBuilder}
          onMicroInternships={navigation.navigateToMicroInternships}
          onMentorshipProgram={navigation.navigateToMentorshipProgram}
          onCareerSwitcherTrack={navigation.navigateToCareerSwitcherTrack}
          onProjectChallengeVideo={navigation.navigateToProjectChallengeVideo}
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
    
    case 'candidate-ai-resume-builder':
      return (
        <AIResumeBuilder 
          onBack={navigation.navigateToCandidateDashboard}
          onUpgrade={navigation.navigateToPricing}
        />
      );

    case 'candidate-resume-builder':
      return (
        <ResumeBuilder 
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
      return (
        <ProjectSearch 
          onBack={navigation.navigateToCandidateDashboard}
          onUpgrade={navigation.navigateToPricing}
          onProjectChallengeVideo={navigation.navigateToProjectChallengeVideo}
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
          onComplete={async (videoData: VideoSubmissionData) => {
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
    
    case 'pricing':
      return (
        <PricingPage 
          onBack={user?.userType === 'recruiter' ? navigation.navigateToRecruiterDashboard : user?.userType === 'candidate' ? navigation.navigateToCandidateDashboard : navigation.navigateHome}
          onManageSubscription={navigation.navigateToSubscriptionManager}
          userType={user?.userType}
        />
      );

    case 'subscription-manager':
      return (
        <SubscriptionManager 
          onBack={user?.userType === 'recruiter' ? navigation.navigateToRecruiterDashboard : navigation.navigateToCandidateDashboard}
          userType={user?.userType}
        />
      );

    case 'beta-program':
      return (
        <BetaProgram 
          onBack={user?.userType === 'recruiter' ? navigation.navigateToRecruiterDashboard : navigation.navigateToCandidateDashboard}
        />
      );
    
    case 'live-interview':
      return (
        <LiveInterviewScreen 
          onEndInterview={user?.userType === 'recruiter' ? navigation.navigateToRecruiterDashboard : navigation.navigateToCandidateDashboard}
        />
      );
    
    case 'one-way-interview':
      return (
        <OneWayVideoInterview 
          onBack={user?.userType === 'recruiter' ? navigation.navigateToRecruiterDashboard : navigation.navigateToCandidateDashboard}
          onComplete={user?.userType === 'recruiter' ? navigation.navigateToRecruiterDashboard : navigation.navigateToCandidateDashboard}
        />
      );
    
    case 'messages':
      return (
        <MessagingCenter 
          onBack={user?.userType === 'recruiter' ? navigation.navigateToRecruiterDashboard : navigation.navigateToCandidateDashboard}
          onUpdateUnreadCount={setUnreadMessages}
        />
      );
    
    case 'notifications':
      return (
        <NotificationCenter 
          onBack={user?.userType === 'recruiter' ? navigation.navigateToRecruiterDashboard : navigation.navigateToCandidateDashboard}
          onUpdateUnreadCount={setUnreadNotifications}
        />
      );

    case 'candidate-ai-skills-development':
      return (
        <AISkillsDevelopment 
          onBack={navigation.navigateToCandidateDashboard}
          onUpgrade={navigation.navigateToPricing}
        />
      );

    case 'candidate-ai-career-advisor':
      return (
        <AICareerAdvisor 
          onBack={navigation.navigateToCandidateDashboard}
          onUpgrade={navigation.navigateToPricing}
        />
      );

    case 'ai-smart-notifications':
      return (
        <AISmartNotifications 
          onBack={user?.userType === 'recruiter' ? navigation.navigateToRecruiterDashboard : navigation.navigateToCandidateDashboard}
          onUpgrade={navigation.navigateToPricing}
          onUpdateUnreadCount={setUnreadNotifications}
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
};






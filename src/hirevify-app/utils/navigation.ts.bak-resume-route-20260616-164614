/**
 * Navigation Utilities
 * 
 * Centralized navigation logic and authentication requirements
 */

import { toast } from 'sonner';
import type { Screen, UserType, Project, Application } from '../types/app';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: UserType;
}

export class NavigationManager {
  private setCurrentScreen: (screen: Screen) => void;
  private setSelectedProject: (project: Project | null) => void;
  private setSelectedApplication: (application: Application | null) => void;
  private setProjectChallengeData: (data: any) => void;
  private setAssessmentBuilderData: (data: any) => void;
  private user: User | null;

  constructor(
    setCurrentScreen: (screen: Screen) => void,
    setSelectedProject: (project: Project | null) => void,
    setSelectedApplication: (application: Application | null) => void,
    setProjectChallengeData: (data: any) => void,
    setAssessmentBuilderData: (data: any) => void,
    user: User | null
  ) {
    this.setCurrentScreen = setCurrentScreen;
    this.setSelectedProject = setSelectedProject;
    this.setSelectedApplication = setSelectedApplication;
    this.setProjectChallengeData = setProjectChallengeData;
    this.setAssessmentBuilderData = setAssessmentBuilderData;
    this.user = user;
  }

  private requireAuth = (action: string, requiredUserType?: UserType): boolean => {
    if (!this.user) {
      toast.error(`Please sign in to ${action.toLowerCase()}`);
      return false;
    }
    
    if (requiredUserType && this.user.userType !== requiredUserType) {
      const userTypeText = requiredUserType === 'recruiter' ? 'recruiters' : 'candidates';
      toast.error(`This feature is only available for ${userTypeText}`);
      return false;
    }
    
    return true;
  };

  // Basic Navigation
  navigateHome = () => {
    console.log('Navigating to homepage');
    this.setCurrentScreen('homepage');
  };

  // Recruiter Navigation
  navigateToRecruiterDashboard = () => {
    if (!this.requireAuth('access the dashboard', 'recruiter')) return;
    this.setCurrentScreen('recruiter-dashboard');
    this.setSelectedProject(null);
    this.setSelectedApplication(null);
  };

  navigateToPostProject = (project?: Project) => {
    if (!this.requireAuth('post projects', 'recruiter')) return;
    this.setSelectedProject(project || null);
    this.setCurrentScreen('recruiter-post-project');
  };

  navigateToProjects = () => {
    if (!this.requireAuth('manage projects', 'recruiter')) return;
    this.setCurrentScreen('recruiter-projects');
  };

  navigateToATS = (application?: Application) => {
    if (!this.requireAuth('access the ATS', 'recruiter')) return;
    this.setSelectedApplication(application || null);
    this.setCurrentScreen('recruiter-ats');
  };

  navigateToATSScanner = () => {
    if (!this.requireAuth('access ATS scanner', 'recruiter')) return;
    this.setCurrentScreen('recruiter-ats-scanner');
  };

  navigateToAutomatedScreening = () => {
    if (!this.requireAuth('access automated screening', 'recruiter')) return;
    this.setCurrentScreen('recruiter-automated-screening');
  };

  navigateToAIMatchingDashboard = () => {
    if (!this.requireAuth('access AI matching dashboard', 'recruiter')) return;
    this.setCurrentScreen('recruiter-ai-matching-dashboard');
  };

  navigateToRecruiterMarketIntelligence = () => {
    if (!this.requireAuth('access market intelligence', 'recruiter')) return;
    this.setCurrentScreen('recruiter-market-intelligence');
  };

  navigateToAnalytics = () => {
    if (!this.requireAuth('view analytics', 'recruiter')) return;
    this.setCurrentScreen('recruiter-analytics');
  };

  navigateToAdvancedAnalytics = () => {
    if (!this.requireAuth('view advanced analytics', 'recruiter')) return;
    this.setCurrentScreen('recruiter-advanced-analytics');
  };

  navigateToIntegrations = () => {
    if (!this.requireAuth('access integrations', 'recruiter')) return;
    this.setCurrentScreen('recruiter-integrations');
  };

  navigateToCandidateSearch = () => {
    if (!this.requireAuth('search candidates', 'recruiter')) return;
    this.setCurrentScreen('recruiter-search-candidates');
  };

  navigateToSkillsFirstHiring = () => {
    if (!this.requireAuth('access skills-first hiring', 'recruiter')) return;
    this.setCurrentScreen('recruiter-skills-first-hiring');
  };

  navigateToEmployerEducation = () => {
    if (!this.requireAuth('access employer education', 'recruiter')) return;
    this.setCurrentScreen('recruiter-employer-education');
  };

  navigateToCustomAssessmentBuilder = (existingAssessment?: any) => {
    if (!this.requireAuth('create custom assessments', 'recruiter')) return;
    this.setAssessmentBuilderData(existingAssessment || null);
    this.setCurrentScreen('recruiter-custom-assessment-builder');
  };

  // Candidate Navigation
  navigateToCandidateDashboard = () => {
    if (!this.requireAuth('access the dashboard', 'candidate')) return;
    this.setCurrentScreen('candidate-dashboard');
  };

  navigateToResumeBuilder = () => {
    if (!this.requireAuth('build your resume', 'candidate')) return;
    this.setCurrentScreen('candidate-ai-resume-builder');
  };

  navigateToAIInterviewCoach = () => {
    if (!this.requireAuth('access AI interview coach', 'candidate')) return;
    this.setCurrentScreen('candidate-ai-interview-coach');
  };

  navigateToSkillsDevelopmentAI = () => {
    if (!this.requireAuth('access skills development AI', 'candidate')) return;
    this.setCurrentScreen('candidate-skills-development-ai');
  };

  navigateToCandidateMarketIntelligence = () => {
    if (!this.requireAuth('access market intelligence', 'candidate')) return;
    this.setCurrentScreen('candidate-market-intelligence');
  };

  navigateToPortfolio = () => {
    if (!this.requireAuth('manage your portfolio', 'candidate')) return;
    this.setCurrentScreen('candidate-portfolio');
  };

  navigateToVideoInterview = () => {
    if (!this.requireAuth('access video interviews', 'candidate')) return;
    this.setCurrentScreen('candidate-video-interview');
  };

  navigateToProjectSearch = () => {
    if (!this.requireAuth('search for projects', 'candidate')) return;
    this.setCurrentScreen('candidate-search-projects');
  };

  navigateToExperienceBuilder = () => {
    if (!this.requireAuth('access the experience builder', 'candidate')) return;
    this.setCurrentScreen('candidate-experience-builder');
  };

  navigateToMicroInternships = () => {
    if (!this.requireAuth('access micro-internships', 'candidate')) return;
    this.setCurrentScreen('candidate-micro-internships');
  };

  navigateToMentorshipProgram = () => {
    if (!this.requireAuth('access the mentorship program', 'candidate')) return;
    this.setCurrentScreen('candidate-mentorship-program');
  };

  navigateToCareerSwitcherTrack = () => {
    if (!this.requireAuth('access the career switcher track', 'candidate')) return;
    this.setCurrentScreen('candidate-career-switcher-track');
  };

  navigateToProjectChallengeVideo = (projectId: string, projectTitle: string, challengeDescription?: string) => {
    if (!this.requireAuth('record project explanation', 'candidate')) return;
    
    this.setProjectChallengeData({
      projectId,
      projectTitle,
      challengeDescription
    });
    this.setCurrentScreen('candidate-project-challenge-video');
  };

  // Shared Navigation
  navigateToInterviews = () => {
    if (!this.requireAuth('manage interviews')) return;
    if (this.user!.userType === 'recruiter') {
      this.setCurrentScreen('recruiter-interviews');
    } else {
      this.setCurrentScreen('candidate-interviews');
    }
  };

  navigateToSettings = () => {
    if (!this.requireAuth('access settings')) return;
    if (this.user!.userType === 'recruiter') {
      this.setCurrentScreen('recruiter-settings');
    } else {
      this.setCurrentScreen('candidate-settings');
    }
  };

  navigateToKnowledgeAssessment = () => {
    if (!this.requireAuth('access knowledge assessments')) return;
    if (this.user!.userType === 'recruiter') {
      this.setCurrentScreen('recruiter-skills-assessment');
    } else {
      this.setCurrentScreen('candidate-knowledge-assessment');
    }
  };

  navigateToEnhancedVideoInterview = () => {
    if (!this.requireAuth('access enhanced video interviews')) return;
    
    if (this.user!.userType === 'recruiter') {
      this.setCurrentScreen('recruiter-enhanced-video-interview');
    } else {
      this.setCurrentScreen('candidate-enhanced-video-interview');
    }
  };

  navigateToMessages = () => {
    if (!this.requireAuth('access messages')) return;
    this.setCurrentScreen('messages');
  };

  navigateToNotifications = () => {
    if (!this.requireAuth('view notifications')) return;
    this.setCurrentScreen('notifications');
  };

  // Universal Navigation (no auth required)
  navigateToPricing = () => {
    this.setCurrentScreen('pricing');
  };

  navigateToSubscriptionManager = () => {
    if (!this.requireAuth('manage your subscription')) return;
    this.setCurrentScreen('subscription-manager');
  };

  navigateToBetaProgram = () => {
    if (!this.requireAuth('access the beta program')) return;
    this.setCurrentScreen('beta-program');
  };

  navigateToLiveInterview = () => {
    if (!this.requireAuth('start an interview')) return;
    this.setCurrentScreen('live-interview');
  };

  navigateToOneWayInterview = () => {
    if (!this.requireAuth('access interviews')) return;
    this.setCurrentScreen('one-way-interview');
  };
}







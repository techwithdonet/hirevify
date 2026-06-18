/**
 * Application Types
 * 
 * Centralized type definitions for the HireVify application
 */

export interface Project {
 id: string;
 title: string;
 description: string;
 requirements: string[];
 budget?: string;
 timeline?: string;
 skills: string[];
 status: 'draft' | 'active' | 'paused' | 'completed';
 createdAt: string;
 updatedAt: string;
applications?: Application[];
}

export interface Application {
 id: string;
 projectId: string;
 candidateId: string;
 status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
 submittedAt: string;
 candidateName: string;
 candidateEmail: string;
 matchScore?: number;
}

export interface VideoSubmissionData {
 projectId: string;
 videoUrl: string;
 responses: Array<{
 questionId: string;
 question: string;
 response: string;
 timestamp: number;
 }>;
 duration: number;
 timestamp: number;
}

export type Screen = 
 | 'homepage'
 | 'recruiter-dashboard'
 | 'recruiter-post-project'
 | 'recruiter-projects'
 | 'recruiter-ats'
 | 'recruiter-ats-scanner'
 | 'recruiter-functional-ats'
 | 'recruiter-accuracy-first-ats'
 | 'recruiter-professional-ats'
 | 'recruiter-automated-screening'
 | 'recruiter-analytics'
 | 'recruiter-advanced-analytics'
 | 'recruiter-ai-matching-dashboard'
 | 'recruiter-market-intelligence'
 | 'recruiter-skills-assessment'
 | 'recruiter-custom-assessment-builder'
 | 'recruiter-integrations'
 | 'recruiter-search-candidates'
 | 'recruiter-interviews'
 | 'recruiter-enhanced-video-interview'
 | 'recruiter-settings'
 | 'recruiter-skills-first-hiring'
 | 'recruiter-employer-education'
 | 'candidate-dashboard'
 | 'candidate-ai-resume-builder'
 | 'candidate-resume-builder'
 | 'candidate-ai-interview-coach'
 | 'candidate-skills-development-ai'
 | 'candidate-market-intelligence'
 | 'candidate-portfolio'
 | 'candidate-knowledge-assessment'
 | 'candidate-video-interview'
 | 'candidate-enhanced-video-interview'
 | 'candidate-search-projects'
 | 'candidate-interviews'
 | 'candidate-settings'
 | 'candidate-experience-builder'
 | 'candidate-micro-internships'
 | 'candidate-mentorship-program'
 | 'candidate-career-switcher-track'
 | 'candidate-project-challenge-video'
 | 'candidate-ats-scanner'
 | 'candidate-functional-ats'
 | 'candidate-accuracy-first-ats'
 | 'candidate-professional-ats'
 | 'ai-smart-notifications'
 | 'ats-diagnostic'
 | 'pricing'
 | 'subscription-manager'
 | 'beta-program'
 | 'live-interview'
 | 'one-way-interview'
 | 'messages'
 | 'notifications';

export interface AppState {
 currentScreen: Screen;
 selectedProject: Project | null;
 selectedApplication: Application | null;
 unreadNotifications: number;
 unreadMessages: number;
 projectChallengeData: {
 projectId: string;
 projectTitle: string;
 challengeDescription?: string;
 } | null;
 assessmentBuilderData: unknown;
}

export type UserType = 'recruiter' | 'candidate';







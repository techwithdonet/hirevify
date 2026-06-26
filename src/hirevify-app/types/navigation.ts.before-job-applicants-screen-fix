export type Screen = 
  | 'homepage'
  | 'recruiter-dashboard'
  | 'recruiter-post-project'
  | 'recruiter-post-job'
  | 'recruiter-projects'
  | 'recruiter-job-applicants'
  | 'recruiter-ats'
  | 'recruiter-ats-scanner'
  | 'recruiter-functional-ats'
  | 'recruiter-accuracy-first-ats'
  | 'recruiter-professional-ats'
  | 'recruiter-analytics'
  | 'recruiter-advanced-analytics'
  | 'recruiter-ai-matching-dashboard'
  | 'recruiter-skills-assessment'
  | 'recruiter-custom-assessment-builder'
  | 'recruiter-integrations'
  | 'recruiter-search-candidates'
  | 'recruiter-interviews'
  | 'recruiter-enhanced-video-interview'
  | 'recruiter-profile-editor' | 'recruiter-settings'
  | 'recruiter-skills-first-hiring'
  | 'recruiter-employer-education'
  | 'candidate-dashboard'
  | 'candidate-ai-resume-builder'
  | 'candidate-resume-builder'
  | 'candidate-portfolio'
  | 'candidate-knowledge-assessment'
  | 'candidate-video-interview'
  | 'candidate-enhanced-video-interview'
  | 'candidate-search-projects'
  | 'candidate-job-detail'
  | 'candidate-interviews'
  | 'candidate-profile-editor' | 'candidate-settings'
  | 'candidate-experience-builder'
  | 'candidate-micro-internships'
  | 'candidate-mentorship-program'
  | 'candidate-career-switcher-track'
  | 'candidate-project-challenge-video'
  | 'candidate-project-assignment'
  | 'candidate-project-submission'
  | 'candidate-ats-scanner'
  | 'candidate-functional-ats'
  | 'candidate-accuracy-first-ats'
  | 'candidate-professional-ats'
  | 'candidate-ai-skills-development'
  | 'candidate-ai-career-advisor'
  | 'ai-smart-notifications'
  | 'pricing'
  | 'subscription-manager'
  | 'beta-program'
  | 'live-interview'
  | 'one-way-interview'
  | 'messages'
  | 'notifications';

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








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

export interface JobProjectAssignment {
  id: string;
  job_id: string;
  project_id: string;
  candidate_id: string;
  recruiter_id: string;
  application_id: string | null;
  assignment_status: 'pending' | 'accepted' | 'rejected' | 'submitted' | 'under_review' | 'hired' | 'not_selected';
  project_submission_url: string | null;
  video_submission_url: string | null;
  submission_notes: string | null;
  submitted_at: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  final_decision: 'hired' | 'not_selected' | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  recruiter_id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  job_type: 'fulltime' | 'contract' | 'freelance' | 'internship';
  experience_level: 'entry' | 'mid' | 'senior' | 'lead';
  location: string;
  remote_type: 'remote' | 'onsite' | 'hybrid';
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  status: 'draft' | 'published' | 'closed' | 'paused';
  has_project: boolean;
  project_title: string | null;
  project_description: string | null;
  project_skills: string[];
  project_timeline: string | null;
  project_budget_range: string | null;
  applications_count?: number;
  views_count?: number;
  created_at: string;
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
  | 'recruiter-post-job'
  | 'recruiter-projects'
  | 'recruiter-job-applicants'
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
  | 'recruiter-candidate-detail'
  | 'recruiter-interviews'
  | 'recruiter-enhanced-video-interview'
  | 'recruiter-settings'
  | 'recruiter-profile-editor'
  | 'recruiter-skills-first-hiring'
  | 'recruiter-employer-education'
  | 'recruiter-application-detail'  // recruiter reviews an application + can assign project / mark project-level-passed
  | 'recruiter-ongoing-projects'    // ongoing projects with assigned candidates and progress tracking
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
  | 'candidate-jobs'               // renamed from candidate-search-projects (all jobs list)
  | 'candidate-job-detail'
| 'candidate-job-apply'         // new multi-step apply flow
 | 'candidate-applied-jobs'      // applied jobs list with 4-phase progress
 | 'candidate-saved-jobs'        // saved / bookmarked jobs list
 | 'candidate-my-jobs'            // applied + assigned jobs in one place
  | 'candidate-interviews'
  | 'candidate-settings'
  | 'candidate-profile-editor'
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
  | 'ai-smart-notifications'
  | 'ats-diagnostic'
  | 'product-features'
  | 'product-api'
  | 'product-integrations'
  | 'company-about'
  | 'company-blog'
  | 'company-careers'
  | 'company-contact'
  | 'support-help-center'
  | 'support-privacy-policy'
  | 'support-terms-of-service'
  | 'support-status'
  | 'pricing'
  | 'subscription-manager'
  | 'beta-program'
  | 'live-interview'
  | 'one-way-interview'
  | 'messages'
  | 'notifications';

export interface EducationEntry {
  id?: string;
  degree: string;
  fieldOfStudy?: string;
  institution?: string;
  university?: string;
  startYear?: string;
  endYear?: string;
  grade?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  title: string;
  location: string;
  experience: string;
  experienceSummary?: string;
  skills: string[];
  matchScore: number;
  availability: 'immediate' | 'two-weeks' | 'one-month' | 'not-looking';
  currentLocation?: string;
  country?: string;
  state?: string;
  city?: string;
  totalExperience?: number;
  currentCompany?: string;
  currentDesignation?: string;
  employmentStatus?: string;
  noticePeriod?: string;
  preferredLocations?: string[];
  employmentType?: string;
  workMode?: string;
  expectedSalary?: string;
  industry?: string;
  preferredRoles?: string[];
  careerLevel?: string;
  workAuthorization?: string;
  willingToRelocate?: boolean;
  availableFrom?: string | null;
  profileLastUpdated?: string | null;
  profileViews?: number;
  responseTime?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  resumeVerified?: boolean;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  lastActive: string;
  isVerified: boolean;
  profileCompleteness: number;
  bio: string;
  preferredWorkType: string[];
  education: EducationEntry[];
  certifications: string[];
  hasPortfolio: boolean;
  portfolioItems: number;
  githubUrl?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  portfolioLinks?: string[];
  yearsOfExperience: number;
  previousCompanies: string[];
  achievements: string[];
  languages: string[];
  timezone: string;
  responseRate: number;
  hiringSuccessRate: number;
  dateOfBirth?: string | null;
}

export interface AppState {
  currentScreen: Screen;
  selectedProject: Project | null;
  selectedApplication: Application | null;
  selectedJob: Job | null;
  selectedAssignment: JobProjectAssignment | null;
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









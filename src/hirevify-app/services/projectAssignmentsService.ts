/**
 * Job Project Assignments Service
 * Handles all job-project assignment operations from Supabase
 */

import { createSupabaseBrowserClient } from '@/src/lib/supabase';

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

export interface AssignmentWithDetails extends JobProjectAssignment {
  job?: {
    id: string;
    title: string;
    company_name?: string;
  };
  project?: {
    id: string;
    title: string;
    description: string;
    skills: string[];
  };
  candidate_profile?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CreateAssignmentParams {
  jobId: string;
  projectId: string;
  candidateId: string;
  recruiterId: string;
  applicationId?: string;
}

class ProjectAssignmentsService {
  private supabase = createSupabaseBrowserClient();

  /**
   * Create a new project assignment for a candidate
   */
  async createAssignment(params: CreateAssignmentParams) {
    const { data, error } = await this.supabase.from('job_project_assignments').insert([
      {
        job_id: params.jobId,
        project_id: params.projectId,
        candidate_id: params.candidateId,
        recruiter_id: params.recruiterId,
        application_id: params.applicationId || null,
        assignment_status: 'pending',
      },
    ]).select().single<JobProjectAssignment>();

    if (error) {
      console.error('Error creating assignment:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Get all assignments for a candidate
   */
  async getCandidateAssignments(candidateId: string) {
    const { data, error } = await this.supabase.from('job_project_assignments').select(`
      *,
      job:job_id(id, title, recruiter_id, recruiter_profile:recruiter_id(company_name)),
      project:project_id(id, title, description, skills)
    `).eq('candidate_id', candidateId).order('created_at', { ascending: false }).returns<AssignmentWithDetails[]>();

    if (error) {
      console.error('Error fetching candidate assignments:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  }

  /**
   * Get assignments for a specific job
   */
  async getJobAssignments(jobId: string) {
    const { data, error } = await this.supabase.from('job_project_assignments').select(`
      *,
      candidate_profile:candidate_id(full_name, email, avatar_url),
      project:project_id(id, title, description)
    `).eq('job_id', jobId).order('created_at', { ascending: false }).returns<AssignmentWithDetails[]>();

    if (error) {
      console.error('Error fetching job assignments:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  }

  /**
   * Get assignments for a specific project
   */
  async getProjectAssignments(projectId: string) {
    const { data, error } = await this.supabase.from('job_project_assignments').select(`
      *,
      candidate_profile:candidate_id(full_name, email, avatar_url),
      job:job_id(id, title)
    `).eq('project_id', projectId).order('created_at', { ascending: false }).returns<AssignmentWithDetails[]>();

    if (error) {
      console.error('Error fetching project assignments:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  }

  /**
   * Get assignments created by a recruiter
   */
  async getRecruiterAssignments(recruiterId: string) {
    const { data, error } = await this.supabase.from('job_project_assignments').select(`
      *,
      candidate_profile:candidate_id(full_name, email, avatar_url),
      job:job_id(id, title),
      project:project_id(id, title, description, skills)
    `).eq('recruiter_id', recruiterId).order('created_at', { ascending: false }).returns<AssignmentWithDetails[]>();

    if (error) {
      console.error('Error fetching recruiter assignments:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  }

  /**
   * Get a single assignment by ID
   */
  async getAssignment(assignmentId: string) {
    const { data, error } = await this.supabase.from('job_project_assignments').select(`
      *,
      job:job_id(id, title, recruiter_id, recruiter_profile:recruiter_id(company_name)),
      project:project_id(id, title, description, skills, project_timeline, project_budget_range),
      candidate_profile:candidate_id(full_name, email, avatar_url)
    `).eq('id', assignmentId).single<AssignmentWithDetails>();

    if (error) {
      console.error('Error fetching assignment:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Accept a project assignment (candidate action)
   */
  async acceptAssignment(assignmentId: string) {
    const { data, error } = await this.supabase.from('job_project_assignments').update({
      assignment_status: 'accepted',
    }).eq('id', assignmentId).select().single<JobProjectAssignment>();

    if (error) {
      console.error('Error accepting assignment:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Reject a project assignment (candidate action)
   */
  async rejectAssignment(assignmentId: string) {
    const { data, error } = await this.supabase.from('job_project_assignments').update({
      assignment_status: 'rejected',
    }).eq('id', assignmentId).select().single<JobProjectAssignment>();

    if (error) {
      console.error('Error rejecting assignment:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Submit project deliverables (candidate action)
   */
  async submitProject(
    assignmentId: string,
    submissionData: {
      projectSubmissionUrl: string;
      videoSubmissionUrl?: string;
      submissionNotes?: string;
    }
  ) {
    const { data, error } = await this.supabase.from('job_project_assignments').update({
      assignment_status: 'submitted',
      project_submission_url: submissionData.projectSubmissionUrl,
      video_submission_url: submissionData.videoSubmissionUrl || null,
      submission_notes: submissionData.submissionNotes || null,
      submitted_at: new Date().toISOString(),
    }).eq('id', assignmentId).select().single<JobProjectAssignment>();

    if (error) {
      console.error('Error submitting project:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Mark assignment as under review (recruiter action)
   */
  async markUnderReview(assignmentId: string) {
    const { data, error } = await this.supabase.from('job_project_assignments').update({
      assignment_status: 'under_review',
    }).eq('id', assignmentId).select().single<JobProjectAssignment>();

    if (error) {
      console.error('Error marking under review:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Make final decision - Hire (recruiter action)
   */
  async hireCandidate(assignmentId: string, notes?: string) {
    const { data, error } = await this.supabase.from('job_project_assignments').update({
      assignment_status: 'hired',
      final_decision: 'hired',
      review_notes: notes || null,
      reviewed_at: new Date().toISOString(),
      decided_at: new Date().toISOString(),
    }).eq('id', assignmentId).select().single<JobProjectAssignment>();

    if (error) {
      console.error('Error hiring candidate:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Make final decision - Not Selected (recruiter action)
   */
  async notSelectCandidate(assignmentId: string, notes?: string) {
    const { data, error } = await this.supabase.from('job_project_assignments').update({
      assignment_status: 'not_selected',
      final_decision: 'not_selected',
      review_notes: notes || null,
      reviewed_at: new Date().toISOString(),
      decided_at: new Date().toISOString(),
    }).eq('id', assignmentId).select().single<JobProjectAssignment>();

    if (error) {
      console.error('Error not selecting candidate:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Check if candidate already has an assignment for a job/project
   */
  async hasExistingAssignment(jobId: string, projectId: string, candidateId: string) {
    const { data, error } = await this.supabase.from('job_project_assignments').select('id').eq('job_id', jobId).eq('project_id', projectId).eq('candidate_id', candidateId).single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking existing assignment:', error);
      return { hasAssignment: false, error };
    }

    return { hasAssignment: !!data, error: null };
  }

  /**
   * Get assignment statistics for a recruiter
   */
  async getRecruiterAssignmentStats(recruiterId: string) {
    const { data, error } = await this.supabase.from('job_project_assignments').select('assignment_status').eq('recruiter_id', recruiterId);

    if (error) {
      console.error('Error fetching assignment stats:', error);
      return { data: null, error };
    }

    const stats = {
      total: data?.length || 0,
      pending: data?.filter((a) => a.assignment_status === 'pending').length || 0,
      accepted: data?.filter((a) => a.assignment_status === 'accepted').length || 0,
      rejected: data?.filter((a) => a.assignment_status === 'rejected').length || 0,
      submitted: data?.filter((a) => a.assignment_status === 'submitted').length || 0,
      under_review: data?.filter((a) => a.assignment_status === 'under_review').length || 0,
      hired: data?.filter((a) => a.assignment_status === 'hired').length || 0,
      not_selected: data?.filter((a) => a.assignment_status === 'not_selected').length || 0,
    };

    return { data: stats, error: null };
  }
}

export const projectAssignmentsService = new ProjectAssignmentsService();

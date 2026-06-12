/**
 * Applications Service
 * Handles all job application operations from Supabase
 */

import { createSupabaseBrowserClient } from '@/src/lib/supabase';

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  cover_letter: string | null;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  match_score: number | null;
  notes: string | null;
  recruiter_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  rejected_at: string | null;
  offer_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithDetails extends Application {
  candidate_profile?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  candidate_details?: {
    headline?: string;
    skills?: string[];
    years_of_experience?: number;
  };
  job?: {
    title: string;
    company_name?: string;
  };
}

class ApplicationsService {
  private supabase = createSupabaseBrowserClient();

  /**
   * Submit a job application
   */
  async submitApplication(
    jobId: string,
    candidateId: string,
    coverLetter?: string
  ) {
    const { data, error } = await this.supabase
      .from('applications')
      .insert([
        {
          job_id: jobId,
          candidate_id: candidateId,
          cover_letter: coverLetter || null,
          status: 'applied',
        },
      ])
      .select()
      .single<Application>();

    if (error) {
      console.error('Error submitting application:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Get all applications for a candidate
   */
  async getCandidateApplications(candidateId: string) {
    // First try with relationship, fall back to simple query if it fails
    let { data, error } = await this.supabase
      .from('applications')
      .select(
        `
        *,
        job:job_id(id, title, status, created_at, recruiter_id, recruiter_profile:recruiter_id(company_name))
      `
      )
      .eq('candidate_id', candidateId)
      .order('submitted_at', { ascending: false })
      .returns<ApplicationWithDetails[]>();

    // If relationship query fails, try without relationships
    if (error && (error.code === 'PGRST200' || error.code === 'PGRST205' || error.code === '42501')) {
      const { data: simpleData, error: simpleError } = await this.supabase
        .from('applications')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('submitted_at', { ascending: false })
        .returns<Application[]>();

      if (simpleError) {
        // Return empty array as fallback
        if (simpleError.code === 'PGRST205' || simpleError.code === '42P01' || simpleError.code === '42501') {
          return { data: [], error: null };
        }
        console.error('Error fetching candidate applications:', simpleError);
        return { data: [], error: simpleError };
      }

      return { data: simpleData || [], error: null };
    }

    if (error) {
      console.error('Error fetching candidate applications:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  }

  /**
   * Get all applications for a job
   */
  async getJobApplications(jobId: string) {
    const { data, error } = await this.supabase
      .from('applications')
      .select(
        `
        *,
        candidate_profile:candidate_id(full_name, email, avatar_url),
        candidate_details:candidate_id(headline, skills, years_of_experience)
      `
      )
      .eq('job_id', jobId)
      .order('submitted_at', { ascending: false })
      .returns<ApplicationWithDetails[]>();

    if (error) {
      console.error('Error fetching job applications:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  }

  /**
   * Get applications for a recruiter's jobs
   */
 async getRecruiterApplications(recruiterId: string) {
  // Step 1: Get recruiter's jobs first
  const { data: jobs, error: jobsError } = await this.supabase
    .from('jobs')
    .select('id, title, recruiter_id')
    .eq('recruiter_id', recruiterId);

  if (jobsError) {
    console.error('Error fetching recruiter jobs for applications:', jobsError);
    return { data: [], error: jobsError };
  }

  const jobIds = (jobs || []).map((job) => job.id);

  if (jobIds.length === 0) {
    return { data: [], error: null };
  }

  // Step 2: Get applications for those jobs without broken Supabase joins
  const { data, error } = await this.supabase
    .from('applications')
    .select('*')
    .in('job_id', jobIds)
    .order('submitted_at', { ascending: false })
    .returns<Application[]>();

  if (error) {
    console.error('Error fetching recruiter applications:', error);
    return { data: [], error };
  }

  const applicationsWithJobs = (data || []).map((application) => {
    const job = jobs?.find((j) => j.id === application.job_id);

    return {
      ...application,
      job: job
        ? {
            title: job.title,
          }
        : undefined,
    };
  });

  return { data: applicationsWithJobs as ApplicationWithDetails[], error: null };
}
  /**
   * Withdraw an application
   */
  async withdrawApplication(applicationId: string) {
    const { data, error } = await this.supabase
      .from('applications')
      .update({ status: 'withdrawn' })
      .eq('id', applicationId)
      .select()
      .single<Application>();

    if (error) {
      console.error('Error withdrawing application:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Get application stats for recruiter
   */
  async getRecruiterApplicationStats(recruiterId: string) {
    const { data, error } = await this.supabase
      .from('applications')
      .select('status, job_id, job:job_id(recruiter_id)')
      .eq('job.recruiter_id', recruiterId)
      .returns<any[]>();

    if (error) {
      console.error('Error fetching application stats:', error);
      return { data: null, error };
    }

    const stats = {
      total: data?.length || 0,
      applied: data?.filter((a) => a.status === 'applied').length || 0,
      screening: data?.filter((a) => a.status === 'screening').length || 0,
      interview: data?.filter((a) => a.status === 'interview').length || 0,
      offer: data?.filter((a) => a.status === 'offer').length || 0,
      hired: data?.filter((a) => a.status === 'hired').length || 0,
      rejected: data?.filter((a) => a.status === 'rejected').length || 0,
    };

    return { data: stats, error: null };
  }

  /**
   * Get application by ID
   */
  async getApplication(applicationId: string) {
    const { data, error } = await this.supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single<Application>();

    if (error) {
      console.error('Error fetching application:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Check if candidate already applied to job
   */
  async hasApplied(jobId: string, candidateId: string) {
    const { data, error } = await this.supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking application:', error);
      return { hasApplied: false, error };
    }

    return { hasApplied: !!data, error: null };
  }
}

export const applicationsService = new ApplicationsService();



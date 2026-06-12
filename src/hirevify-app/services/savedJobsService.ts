/**
 * Saved Jobs Service
 * Handles saved job bookmarking operations from Supabase
 */

import { createSupabaseBrowserClient } from '@/src/lib/supabase';

export interface SavedJob {
  id: string;
  candidate_id: string;
  job_id: string;
  saved_at: string;
}

class SavedJobsService {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get saved jobs for a candidate
   */
  async getCandidateSavedJobs(candidateId: string) {
    const { data, error } = await this.supabase
      .from('saved_jobs')
      .select(
        `
        *,
        job:job_id(id, title, description, budget_min, budget_max, location, remote_type, skills, status, created_at, recruiter_id, recruiter_profile:recruiter_id(company_name, company_logo_url))
      `
      )
      .eq('candidate_id', candidateId)
      .order('saved_at', { ascending: false })
      .returns<any[]>();

    if (error) {
      // No saved jobs found, or table doesn't exist - return empty list
      if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.code === '42P01' || error.code === '42501') {
        return { data: [], error: null };
      }
      console.error('Error fetching saved jobs:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  }

  /**
   * Save a job
   */
  async saveJob(candidateId: string, jobId: string) {
    const { data, error } = await this.supabase
      .from('saved_jobs')
      .insert([{ candidate_id: candidateId, job_id: jobId }])
      .select()
      .single<SavedJob>();

    if (error) {
      // Handle unique constraint violation (already saved)
      if (error.code === '23505') {
        console.warn('Job already saved');
        return { data: null, error: null, alreadySaved: true };
      }
      console.error('Error saving job:', error);
      return { data: null, error };
    }

    return { data, error: null, alreadySaved: false };
  }

  /**
   * Unsave a job
   */
  async unsaveJob(candidateId: string, jobId: string) {
    const { error } = await this.supabase
      .from('saved_jobs')
      .delete()
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId);

    if (error) {
      console.error('Error unsaving job:', error);
      return { error };
    }

    return { error: null };
  }

  /**
   * Check if job is saved
   */
  async isJobSaved(candidateId: string, jobId: string) {
    const { data, error } = await this.supabase
      .from('saved_jobs')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking saved job:', error);
      return { isSaved: false, error };
    }

    return { isSaved: !!data, error: null };
  }

  /**
   * Get count of saved jobs
   */
  async getSavedJobCount(candidateId: string) {
    const { count, error } = await this.supabase
      .from('saved_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', candidateId);

    if (error) {
      console.error('Error getting saved job count:', error);
      return { count: 0, error };
    }

    return { count: count || 0, error: null };
  }
}

export const savedJobsService = new SavedJobsService();



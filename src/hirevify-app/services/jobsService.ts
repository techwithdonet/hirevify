/**
 * Jobs/Projects Service
 * Handles all job posting and retrieval operations from Supabase
 */

import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

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
 applications_count: number;
 views_count: number;
 has_assessment: boolean;
 has_video_challenge: boolean;
 video_challenge_description: string | null;
 created_at: string;
 updated_at: string;
}

export interface JobWithRecruiter extends Job {
 recruiter_profile: {
 company_name: string;
 company_logo_url?: string;
 };
}

export interface JobFilter {
 status?: 'draft' | 'published' | 'closed' | 'paused';
 recruiter_id?: string;
 skills?: string[];
 job_type?: string;
 experience_level?: string;
 remote_type?: string;
 location?: string;
 search?: string;
}

class JobsService {
 private supabase = createSupabaseBrowserClient();

 /**
 * Get all published jobs with optional filters
 */
 async getPublishedJobs(filters?: JobFilter & { limit?: number; offset?: number }) {
 let query = this.supabase.from('jobs').select(`*, recruiter_profile:recruiter_id(company_name, company_logo_url)`).eq('status', 'published').order('created_at', { ascending: false });

 if (filters?.recruiter_id) {
 query = query.eq('recruiter_id', filters.recruiter_id);
 }

 if (filters?.job_type) {
 query = query.eq('job_type', filters.job_type);
 }

 if (filters?.experience_level) {
 query = query.eq('experience_level', filters.experience_level);
 }

 if (filters?.remote_type) {
 query = query.eq('remote_type', filters.remote_type);
 }

 if (filters?.location) {
 query = query.ilike('location', `%${filters.location}%`);
 }

 if (filters?.search) {
 query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
 }

 const limit = filters?.limit || 50;
 const offset = filters?.offset || 0;

 const { data, error, count } = await query.range(offset, offset + limit - 1).returns<JobWithRecruiter[]>();

 if (error) {
 console.error('Error fetching published jobs:', error);
 return { data: [], error, count: 0 };
 }

 return { data: data || [], error: null, count: count || 0 };
 }

 /**
 * Get a single job by ID
 */
 async getJob(jobId: string) {
 const { data, error } = await this.supabase.from('jobs').select(`*, recruiter_profile:recruiter_id(company_name, company_logo_url, verified_recruiter)`).eq('id', jobId).single<JobWithRecruiter>();

 if (error) {
 console.error('Error fetching job:', error);
 return { data: null, error };
 }

 return { data, error: null };
 }

 /**
 * Get jobs posted by current recruiter
 */
 async getRecruiterJobs(recruiterId: string, filters?: { status?: string }) {
 let query = this.supabase.from('jobs').select('*').eq('recruiter_id', recruiterId).order('created_at', { ascending: false });

 if (filters?.status) {
 query = query.eq('status', filters.status);
 }

 const { data, error } = await query.returns<Job[]>();

 if (error) {
 console.error('Error fetching recruiter jobs:', error);
 return { data: [], error };
 }

 return { data: data || [], error: null };
 }

 /**
 * Create a new job posting
 */
 async createJob(jobData: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'applications_count' | 'views_count'>) {
 const { data, error } = await this.supabase.from('jobs').insert([jobData]).select().single<Job>();

 if (error) {
 console.error('Error creating job:', error);
 return { data: null, error };
 }

 return { data, error: null };
 }

 /**
 * Update a job posting
 */
 async updateJob(jobId: string, updates: Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>>) {
 const { data, error } = await this.supabase.from('jobs').update(updates).eq('id', jobId).select().single<Job>();

 if (error) {
 console.error('Error updating job:', error);
 return { data: null, error };
 }

 return { data, error: null };
 }

 /**
 * Delete a job posting
 */
 async deleteJob(jobId: string) {
 const { error } = await this.supabase.from('jobs').delete().eq('id', jobId);

 if (error) {
 console.error('Error deleting job:', error);
 return { error };
 }

 return { error: null };
 }

 /**
 * Search jobs by skills
 */
 async searchJobsBySkills(skills: string[]) {
 let query = this.supabase.from('jobs').select('*').eq('status', 'published');

 // Filter by skills using OR logic
 if (skills.length > 0) {
 const skillFilters = skills.map((skill) => `skills.cs.{${skill}}`).join(',');
 query = query.or(skillFilters);
 }

 const { data, error } = await query.order('created_at', { ascending: false }).returns<Job[]>();

 if (error) {
 console.error('Error searching jobs by skills:', error);
 return { data: [], error };
 }

 return { data: data || [], error: null };
 }

 /**
 * Get job statistics for a recruiter
 */
 async getRecruiterStats(recruiterId: string) {
 const { data: jobs, error: jobsError } = await this.supabase.from('jobs').select('status, applications_count').eq('recruiter_id', recruiterId).returns<{ status: string; applications_count: number }[]>();

 if (jobsError) {
 console.error('Error fetching recruiter stats:', jobsError);
 return { data: null, error: jobsError };
 }

 const stats = {
 totalJobs: jobs?.length || 0,
 publishedJobs: jobs?.filter((j) => j.status === 'published').length || 0,
 draftJobs: jobs?.filter((j) => j.status === 'draft').length || 0,
 totalApplications: jobs?.reduce((sum, j) => sum + j.applications_count, 0) || 0,
 };

 return { data: stats, error: null };
 }
}

export const jobsService = new JobsService();



/**
 * Applications Service
 * Handles all job application operations from Supabase
 */

import { createSupabaseBrowserClient } from '@/src/lib/supabase';

const DEFAULT_CV_BUCKETS = [
  process.env.NEXT_PUBLIC_CANDIDATE_CV_BUCKET,
  'resumes',
  'portfolio-files',
  'make-d4feca44-resumes',
  'application-files',
].filter(Boolean) as string[];

function parseStoredCvPath(value: string) {
  const separator = value.indexOf('::');

  if (separator > 0) {
    return {
      bucket: value.slice(0, separator),
      path: value.slice(separator + 2),
    };
  }

  return {
    bucket: null,
    path: value,
  };
}

export interface Application {
 id: string;
 job_id: string;
 candidate_id: string;
 cover_letter: string | null;
 cv_url: string | null;
 cv_file_name: string | null;
 cv_uploaded_at: string | null;
 status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn' | 'assigned';
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
  coverLetter?: string,
  extras?: { cvUrl?: string | null; cvFileName?: string | null }
  ) {
  const { data, error } = await this.supabase.from('applications').insert([
  {
  job_id: jobId,
  candidate_id: candidateId,
  cover_letter: coverLetter || null,
  cv_url: extras?.cvUrl || null,
  cv_file_name: extras?.cvFileName || null,
  cv_uploaded_at: extras?.cvUrl ? new Date().toISOString() : null,
  status: 'applied',
  },
  ]).select().single<Application>();

 if (error) {
 console.error('Error submitting application:', error);
 return { data: null, error };
 }

 const { data: jobRow } = await this.supabase
 .from('jobs')
 .select('title, recruiter_id')
 .eq('id', jobId)
 .maybeSingle();

 if (jobRow?.recruiter_id) {
 const { data: recruiterProfile } = await this.supabase
 .from('profiles')
 .select('auth_user_id')
 .eq('id', jobRow.recruiter_id)
 .maybeSingle();

 await this.supabase.from('notifications').insert([
 {
 user_id: recruiterProfile?.auth_user_id || jobRow.recruiter_id,
 type: 'new_application',
 title: 'New application received',
 message: `A candidate applied for "${jobRow.title || 'your job'}".`,
 read: false,
 },
 ]);
 }

 return { data, error: null };
 }

 /**
 * Get all applications for a candidate
 */
 async getCandidateApplications(candidateId: string) {
 // First try with relationship, fall back to simple query if it fails
 let { data, error } = await this.supabase.from('applications').select(
 `
 *,
 job:job_id(id, title, status, created_at, recruiter_id, recruiter_profile:recruiter_id(company_name))
 `
 ).eq('candidate_id', candidateId).order('submitted_at', { ascending: false }).returns<ApplicationWithDetails[]>();

 // If relationship query fails, try without relationships
 if (error && (error.code === 'PGRST200' || error.code === 'PGRST205' || error.code === '42501')) {
 const { data: simpleData, error: simpleError } = await this.supabase.from('applications').select('*').eq('candidate_id', candidateId).order('submitted_at', { ascending: false }).returns<Application[]>();

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
    const { data: applications, error } = await this.supabase
      .from('applications')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .returns<Application[]>();

    if (error) {
      console.error('Error fetching job applications:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        raw: error,
      });
      return { data: [], error };
    }

    const rows = applications || [];
    const candidateIds = Array.from(
      new Set(rows.map((application) => application.candidate_id).filter(Boolean))
    );

    if (candidateIds.length === 0) {
      return { data: rows as ApplicationWithDetails[], error: null };
    }

    const { data: profiles, error: profilesError } = await this.supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', candidateIds);

    if (profilesError) {
      console.error('Error fetching application candidate profiles:', {
        message: profilesError?.message,
        details: profilesError?.details,
        hint: profilesError?.hint,
        code: profilesError?.code,
        raw: profilesError,
      });
    }

    const { data: candidateProfiles, error: detailsError } = await this.supabase
      .from('candidate_profiles')
      .select('*')
      .in('id', candidateIds);

    if (detailsError) {
      console.error('Error fetching application candidate details:', {
        message: detailsError?.message,
        details: detailsError?.details,
        hint: detailsError?.hint,
        code: detailsError?.code,
        raw: detailsError,
      });
    }

    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const detailsMap = new Map((candidateProfiles || []).map((profile) => [profile.id, profile]));

    const merged = rows.map((application) => ({
      ...application,
      candidate_profile: profileMap.get(application.candidate_id) || null,
      candidate_details: detailsMap.get(application.candidate_id) || null,
    })) as ApplicationWithDetails[];

    return { data: merged, error: null };
  }

 /**
 * Get applications for a recruiter's jobs
 */
 async getRecruiterApplications(recruiterId: string) {
 // Step 1: Get recruiter's jobs first
 const { data: jobs, error: jobsError } = await this.supabase.from('jobs').select('id, title, recruiter_id, job_type, has_project').eq('recruiter_id', recruiterId);

 if (jobsError) {
 console.error('Error fetching recruiter jobs for applications:', jobsError);
 return { data: [], error: jobsError };
 }

 const realJobs = (jobs || []).filter((job: any) => !(job.has_project === true && job.job_type === 'freelance'));
 const jobIds = realJobs.map((job) => job.id);

 if (jobIds.length === 0) {
 return { data: [], error: null };
 }

 // Step 2: Get applications for those jobs without broken Supabase joins
 const { data, error } = await this.supabase.from('applications').select('*').in('job_id', jobIds).order('submitted_at', { ascending: false }).returns<Application[]>();

 if (error) {
 console.error('Error fetching recruiter applications:', error);
 return { data: [], error };
 }

 const applicationsWithJobs = (data || []).map((application) => {
 const job = realJobs.find((j) => j.id === application.job_id);

 return {...application,
 job: job? {
 title: job.title,
 }: undefined,
 };
 });

 return { data: applicationsWithJobs as ApplicationWithDetails[], error: null };
}
 /**
 * Withdraw an application
 */
 async withdrawApplication(applicationId: string) {
 const { data, error } = await this.supabase.from('applications').update({ status: 'withdrawn' }).eq('id', applicationId).select().single<Application>();

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
 const { data: jobs, error: jobsError } = await this.supabase
 .from('jobs')
 .select('id, recruiter_id, job_type, has_project')
 .eq('recruiter_id', recruiterId);

 if (jobsError) {
 console.error('Error fetching recruiter jobs for application stats:', jobsError);
 return { data: null, error: jobsError };
 }

 const jobIds = (jobs || [])
 .filter((job: any) => !(job.has_project === true && job.job_type === 'freelance'))
 .map((job) => job.id);

 if (jobIds.length === 0) {
 return {
 data: { total: 0, applied: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0 },
 error: null,
 };
 }

 const { data, error } = await this.supabase.from('applications').select('status, job_id').in('job_id', jobIds).returns<any[]>();

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
 const { data, error } = await this.supabase.from('applications').select('*').eq('id', applicationId).single<Application>();

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
  const { data, error } = await this.supabase.from('applications').select('id').eq('job_id', jobId).eq('candidate_id', candidateId).single();

  if (error && error.code!== 'PGRST116') {
  console.error('Error checking application:', error);
  return { hasApplied: false, error };
  }

  return { hasApplied:!!data, error: null };
  }

  /**
   * Upload a CV file to the existing candidate file storage bucket
   * at path: resumes/<authUserId>/cv/<timestamp>_<originalName>
   * Returns the storage path (not a public URL â€” caller must use
   * `getApplicationFileSignedUrl` to fetch a temporary link).
   */
  async uploadCV(authUserId: string, file: File) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const path = `resumes/${authUserId}/cv/${Date.now()}_${safeName}`;
    const attemptedBuckets: string[] = [];

    for (const bucket of DEFAULT_CV_BUCKETS) {
      attemptedBuckets.push(bucket);
      const { error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (!error) {
        return { path: `${bucket}::${path}`, error: null };
      }

      const message = String(error.message || '').toLowerCase();
      const shouldTryNextBucket =
        message.includes('bucket not found') ||
        message.includes('not found') ||
        message.includes('does not exist');

      if (!shouldTryNextBucket) {
        console.error('CV upload failed:', error);
        return { path: null, error };
      }
    }

    const error = {
      message: `CV upload bucket not found. Tried: ${attemptedBuckets.join(', ')}.`,
    } as any;

    console.error('CV upload failed:', error);
    return { path: null, error };
  }

  /**
   * Returns a short-lived signed URL for a file in the resumes bucket.
   */
  async getApplicationFileSignedUrl(path: string, expiresIn = 60 * 60) {
    if (/^https?:\/\//i.test(path)) {
      return { url: path, error: null };
    }

    const parsed = parseStoredCvPath(path);
    const bucketsToTry = parsed.bucket
      ? [parsed.bucket]
      : DEFAULT_CV_BUCKETS;

    for (const bucket of bucketsToTry) {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(parsed.path, expiresIn);

      if (!error && data?.signedUrl) {
        return { url: data.signedUrl, error: null };
      }

      const message = String(error?.message || '').toLowerCase();
      const bucketMissing =
        message.includes('bucket not found') ||
        message.includes('not found') ||
        message.includes('does not exist');

      if (!bucketMissing) {
        const publicUrl = this.supabase.storage.from(bucket).getPublicUrl(parsed.path).data?.publicUrl;
        if (publicUrl) {
          return { url: publicUrl, error: null };
        }
      }

      if (parsed.bucket && error) {
        console.error('Could not sign application file URL:', error);
        return { url: null, error };
      }
    }

    return { url: null, error: null };
  }
}

export const applicationsService = new ApplicationsService();






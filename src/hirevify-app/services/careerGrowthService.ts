import { createSupabaseBrowserClient } from '@/src/lib/supabase';

export type CareerGrowthType =
 | 'experience_builder'
 | 'micro_internship'
 | 'mentorship'
 | 'career_switch';

export type CareerGrowthStatus =
 | 'applied'
 | 'reviewing'
 | 'screening'
 | 'shortlisted'
 | 'accepted'
 | 'assigned'
 | 'in_progress'
 | 'completed'
 | 'rejected'
 | 'withdrawn';

export interface CareerGrowthOpportunity {
 id: string;
 type: CareerGrowthType;
 title: string;
 description: string | null;
 company_name: string | null;
 recruiter_id: string | null;
 created_by_profile_id: string | null;
 skills: string[];
 responsibilities?: string[];
 deliverables?: string[];
 duration_value?: number | null;
 duration_unit?: 'day' | 'week' | 'month' | null;
 duration_label: string | null;
 difficulty: string | null;
 location: string | null;
 remote_type: string | null;
 status: string;
 application_deadline?: string | null;
 start_date: string | null;
 end_date: string | null;
 slots: number | null;
 requirements: string[];
 benefits: string[];
 compensation_type?: string | null;
 compensation_amount?: number | null;
 currency?: string | null;
 submission_required?: boolean;
 video_required?: boolean;
 metadata: Record<string, any>;
 created_at: string;
 updated_at: string;
}

export interface CareerGrowthApplication {
 id: string;
 opportunity_id: string;
 candidate_profile_id: string;
 status: CareerGrowthStatus;
 cover_message?: string | null;
 message: string | null;
 recruiter_notes: string | null;
 assigned_at?: string | null;
 created_at: string;
 updated_at: string;
 opportunity?: CareerGrowthOpportunity;
 candidate_profile?: {
 full_name: string | null;
 email: string | null;
 avatar_url?: string | null;
 };
}

export interface CareerGrowthSubmission {
 id: string;
 application_id: string;
 candidate_profile_id: string;
 submission_text: string | null;
 submission_url: string | null;
 file_url: string | null;
 video_url: string | null;
 status: string;
 submitted_at: string;
 reviewed_at?: string | null;
 recruiter_feedback?: string | null;
 created_at: string;
 updated_at: string;
}

export interface CareerGrowthReview {
 score?: number;
 certificateIssued?: boolean;
 certificateIssuedAt?: string;
 note?: string;
}

export function parseCareerGrowthReview(notes?: string | null): CareerGrowthReview {
 if (!notes) return {};
 try {
 const parsed = JSON.parse(notes);
 return typeof parsed === 'object' && parsed ? parsed : { note: notes };
 } catch {
 return { note: notes };
 }
}

function serializeCareerGrowthReview(review: CareerGrowthReview) {
 return JSON.stringify(review);
}

export type CareerGrowthOpportunityInput = Partial<
 Omit<CareerGrowthOpportunity, 'id' | 'created_at' | 'updated_at' | 'metadata'>
> & {
 type: CareerGrowthType;
 title: string;
 metadata?: Record<string, any>;
};

interface CareerGrowthServiceError {
 message: string;
 code?: string;
 details?: string;
 hint?: string;
}

function normalizeCareerGrowthError(error: any): CareerGrowthServiceError {
 const code = typeof error?.code === 'string'? error.code: undefined;
 const details = typeof error?.details === 'string'? error.details: undefined;
 const hint = typeof error?.hint === 'string'? error.hint: undefined;

 let message = typeof error?.message === 'string'? error.message: '';

 if (!message && code === '42P01') {
 message = 'Career growth database tables are missing. Run career_growth_migration.sql in Supabase.';
 }

 if (!message && code === 'PGRST205') {
 message = 'Supabase schema cache cannot find the career growth tables. Run career_growth_migration.sql, then refresh the schema cache.';
 }

 if (!message) {
 try {
 message = JSON.stringify(error);
 } catch {
 message = '';
 }
 }

 return {
 message: message && message!== '{}'? message: 'Career growth database request failed. Run career_growth_migration.sql in Supabase if the tables are not created yet.',
 code,
 details,
 hint,
 };
}

class CareerGrowthService {
 private supabase = createSupabaseBrowserClient();

 async getPublishedGrowthOpportunities(type: CareerGrowthType) {
 const { data, error } = await this.supabase.from('career_growth_opportunities').select('*').eq('type', type).eq('status', 'published').order('created_at', { ascending: false }).returns<CareerGrowthOpportunity[]>();

 if (error) {
 return { data: [], error: normalizeCareerGrowthError(error) };
 }

 return { data: data || [], error: null };
 }

 async getOpportunityById(id: string) {
 const { data, error } = await this.supabase.from('career_growth_opportunities').select('*').eq('id', id).single<CareerGrowthOpportunity>();

 if (error) {
 return { data: null, error: normalizeCareerGrowthError(error) };
 }

 return { data, error: null };
 }

 async applyToOpportunity(opportunityId: string, candidateProfileId: string, message?: string) {
 const { data, error } = await this.supabase.from('career_growth_applications').insert([
 {
 opportunity_id: opportunityId,
 candidate_profile_id: candidateProfileId,
 status: 'applied',
 cover_message: message || null,
 message: message || null,
 },
 ]).select().single<CareerGrowthApplication>();

 if (error) {
 return { data: null, error: normalizeCareerGrowthError(error) };
 }

 return { data, error: null };
 }

 async getCandidateGrowthApplications(candidateProfileId: string) {
 const { data, error } = await this.supabase.from('career_growth_applications').select('*, opportunity:opportunity_id(*)').eq('candidate_profile_id', candidateProfileId).order('created_at', { ascending: false }).returns<CareerGrowthApplication[]>();

 if (error) {
 return { data: [], error: normalizeCareerGrowthError(error) };
 }

 return { data: data || [], error: null };
 }

 async getRecruiterGrowthOpportunities(recruiterId: string, type?: CareerGrowthType) {
 let query = this.supabase.from('career_growth_opportunities').select('*').eq('recruiter_id', recruiterId).order('created_at', { ascending: false });

 if (type) {
 query = query.eq('type', type);
 }

 const { data, error } = await query.returns<CareerGrowthOpportunity[]>();

 if (error) {
 return { data: [], error: normalizeCareerGrowthError(error) };
 }

 return { data: data || [], error: null };
 }

 async createGrowthOpportunity(input: CareerGrowthOpportunityInput) {
 const { data, error } = await this.supabase.from('career_growth_opportunities').insert([{...input, status: input.status || 'published' }]).select().single<CareerGrowthOpportunity>();

 if (error) {
 return { data: null, error: normalizeCareerGrowthError(error) };
 }

 return { data, error: null };
 }

 async updateGrowthOpportunity(id: string, input: Partial<CareerGrowthOpportunityInput>) {
 const { data, error } = await this.supabase.from('career_growth_opportunities').update(input).eq('id', id).select().single<CareerGrowthOpportunity>();

 if (error) {
 return { data: null, error: normalizeCareerGrowthError(error) };
 }

 return { data, error: null };
 }

 async deleteGrowthOpportunity(id: string) {
 const { error } = await this.supabase.from('career_growth_opportunities').delete().eq('id', id);

 if (error) {
 return { error: normalizeCareerGrowthError(error) };
 }

 return { error: null };
 }

 async getRecruiterGrowthApplications(recruiterId: string, opportunityId?: string) {
 const { data: opportunities, error: opportunitiesError } = await this.getRecruiterGrowthOpportunities(recruiterId);

 if (opportunitiesError) {
 return { data: [], error: opportunitiesError };
 }

 const opportunityIds = opportunityId? [opportunityId]: opportunities.map((opportunity) => opportunity.id);

 if (opportunityIds.length === 0) {
 return { data: [], error: null };
 }

 const { data, error } = await this.supabase.from('career_growth_applications').select('*, candidate_profile:candidate_profile_id(full_name, email, avatar_url)').in('opportunity_id', opportunityIds).order('created_at', { ascending: false }).returns<CareerGrowthApplication[]>();

 if (error) {
 return { data: [], error: normalizeCareerGrowthError(error) };
 }

 const enriched = (data || []).map((application) => ({...application,
 opportunity: opportunities.find((opportunity) => opportunity.id === application.opportunity_id),
 }));

 return { data: enriched, error: null };
 }

 async updateGrowthApplicationStatus(
 applicationId: string,
 status: CareerGrowthStatus,
 recruiterNotes?: string,
 ) {
 const { data, error } = await this.supabase.from('career_growth_applications').update({
 status,
 recruiter_notes: recruiterNotes || null,
 }).eq('id', applicationId).select().single<CareerGrowthApplication>();

 if (error) {
 return { data: null, error: normalizeCareerGrowthError(error) };
 }

 return { data, error: null };
 }

 async reviewCareerGrowthApplication(
 applicationId: string,
 input: { score: number; note?: string; certificateIssued?: boolean },
 ) {
 const review = {
 score: Math.max(0, Math.min(100, Math.round(input.score))),
 note: input.note || '',
 certificateIssued: Boolean(input.certificateIssued),
 certificateIssuedAt: input.certificateIssued ? new Date().toISOString() : undefined,
 };

 const { data, error } = await this.supabase.from('career_growth_applications').update({
 status: 'completed',
 recruiter_notes: serializeCareerGrowthReview(review),
 }).eq('id', applicationId).select().single<CareerGrowthApplication>();

 if (error) {
 return { data: null, error: normalizeCareerGrowthError(error) };
 }

 return { data, error: null };
 }

 async assignCareerGrowthOpportunity(applicationId: string) {
 const { data, error } = await this.supabase.from('career_growth_applications').update({
 status: 'assigned',
 assigned_at: new Date().toISOString(),
 }).eq('id', applicationId).select().single<CareerGrowthApplication>();

 if (error) {
 return { data: null, error: normalizeCareerGrowthError(error) };
 }

 return { data, error: null };
 }

 async submitCareerGrowthWork(
 applicationId: string,
 payload: {
 candidate_profile_id: string;
 submission_text?: string;
 submission_url?: string;
 file_url?: string;
 video_url?: string;
 status?: string;
 },
 ) {
 const { data, error } = await this.supabase.from('career_growth_submissions').insert([
 {
 application_id: applicationId,
 candidate_profile_id: payload.candidate_profile_id,
 submission_text: payload.submission_text || null,
 submission_url: payload.submission_url || null,
 file_url: payload.file_url || null,
 video_url: payload.video_url || null,
 status: payload.status || 'submitted',
 },
 ]).select().single<CareerGrowthSubmission>();

 if (error) {
 return { data: null, error: normalizeCareerGrowthError(error) };
 }

 return { data, error: null };
 }

 async getSubmissionsForApplications(applicationIds: string[]) {
 if (applicationIds.length === 0) return { data: [], error: null };

 const { data, error } = await this.supabase
 .from('career_growth_submissions')
 .select('*')
 .in('application_id', applicationIds)
 .order('submitted_at', { ascending: false })
 .returns<CareerGrowthSubmission[]>();

 if (error) {
 return { data: [], error: normalizeCareerGrowthError(error) };
 }

 return { data: data || [], error: null };
 }

 async uploadCareerGrowthFile(candidateProfileId: string, file: File) {
 const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
 const path = `career-growth/${candidateProfileId}/${Date.now()}_${safeName}`;
 const { error } = await this.supabase.storage
 .from('project-files')
 .upload(path, file, { upsert: true, contentType: file.type });

 if (error) {
 return { path: null, error: normalizeCareerGrowthError(error) };
 }

 return { path: `project-files::${path}`, error: null };
 }

 async getCareerGrowthFileUrl(path: string, expiresIn = 60 * 60) {
 if (/^https?:\/\//i.test(path)) return { url: path, error: null };
 const separator = path.indexOf('::');
 const bucket = separator > 0 ? path.slice(0, separator) : 'project-files';
 const objectPath = separator > 0 ? path.slice(separator + 2) : path;

 const { data, error } = await this.supabase.storage.from(bucket).createSignedUrl(objectPath, expiresIn);

 if (error) {
 return { url: null, error: normalizeCareerGrowthError(error) };
 }

 return { url: data?.signedUrl || null, error: null };
 }

 getRecruiterCareerGrowthOpportunities(recruiterId: string, type?: CareerGrowthType) {
 return this.getRecruiterGrowthOpportunities(recruiterId, type);
 }

 createCareerGrowthOpportunity(input: CareerGrowthOpportunityInput) {
 return this.createGrowthOpportunity(input);
 }

 updateCareerGrowthOpportunity(id: string, input: Partial<CareerGrowthOpportunityInput>) {
 return this.updateGrowthOpportunity(id, input);
 }

 deleteCareerGrowthOpportunity(id: string) {
 return this.deleteGrowthOpportunity(id);
 }

 getCareerGrowthApplicationsForRecruiter(recruiterId: string, opportunityId?: string) {
 return this.getRecruiterGrowthApplications(recruiterId, opportunityId);
 }

 updateCareerGrowthApplicationStatus(applicationId: string, status: CareerGrowthStatus, notes?: string) {
 return this.updateGrowthApplicationStatus(applicationId, status, notes);
 }

 reviewApplication(applicationId: string, input: { score: number; note?: string; certificateIssued?: boolean }) {
 return this.reviewCareerGrowthApplication(applicationId, input);
 }

 getCandidateCareerGrowthApplications(candidateProfileId: string) {
 return this.getCandidateGrowthApplications(candidateProfileId);
 }
}

export const careerGrowthService = new CareerGrowthService();

import { z } from 'zod';

const optionalUrl = (label: string, hostPattern?: RegExp) =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
        return hostPattern ? hostPattern.test(url.hostname) : true;
      } catch {
        return false;
      }
    }, `${label} must be a valid URL`);

const uniqueStringArray = (label: string) =>
  z
    .array(z.string().trim().min(1))
    .default([])
    .refine((items) => new Set(items.map((item) => item.toLowerCase())).size === items.length, {
      message: `${label} cannot contain duplicates`,
    });

export const candidateProfessionalProfileSchema = z.object({
  current_company: z.string().trim().optional().or(z.literal('')),
  current_designation: z.string().trim().optional().or(z.literal('')),
  industry: z.string().trim().optional().or(z.literal('')),
  career_level: z.string().trim().optional().or(z.literal('')),
  total_experience: z.coerce.number().min(0, 'Experience must be greater than or equal to 0').nullable().optional(),
  employment_status: z.string().trim().optional().or(z.literal('')),
  notice_period: z.string().trim().optional().or(z.literal('')),
  available_from: z.string().trim().optional().or(z.literal('')),
  expected_salary: z.string().trim().optional().or(z.literal('')),
  preferred_roles: uniqueStringArray('Preferred roles'),
  preferred_locations: uniqueStringArray('Preferred locations'),
  employment_type: z.string().trim().optional().or(z.literal('')),
  work_mode: z.string().trim().optional().or(z.literal('')),
  willing_to_relocate: z.boolean().default(false),
  work_authorization: z.string().trim().optional().or(z.literal('')),
  country: z.string().trim().optional().or(z.literal('')),
  state: z.string().trim().optional().or(z.literal('')),
  city: z.string().trim().optional().or(z.literal('')),
  current_location: z.string().trim().optional().or(z.literal('')),
  linkedin_url: optionalUrl('LinkedIn URL', /(^|\.)linkedin\.com$/i),
  github_url: optionalUrl('GitHub URL', /(^|\.)github\.com$/i),
  portfolio_url: optionalUrl('Portfolio URL'),
  languages: uniqueStringArray('Languages'),
});

export type CandidateProfessionalProfileInput = z.infer<typeof candidateProfessionalProfileSchema>;

export type CompletionItem = {
  key: string;
  label: string;
  complete: boolean;
};

const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const hasArray = (value: unknown) => Array.isArray(value) && value.length > 0;

export function getCandidateProfileCompletionChecklist(profile: Record<string, unknown>): CompletionItem[] {
  return [
    { key: 'resume', label: 'Resume', complete: hasText(profile.resume_url) },
    { key: 'summary', label: 'Summary', complete: hasText(profile.bio) || hasText(profile.experience_summary) },
    { key: 'skills', label: 'Skills', complete: hasArray(profile.skills) },
    { key: 'experience', label: 'Experience', complete: Number(profile.total_experience ?? profile.years_of_experience ?? 0) >= 0 && (Number(profile.total_experience ?? profile.years_of_experience ?? 0) > 0 || hasText(profile.experience_level)) },
    { key: 'education', label: 'Education', complete: hasText(profile.education) || hasArray(profile.education) },
    { key: 'contact', label: 'Contact', complete: hasText(profile.phone) || hasText(profile.email) },
    { key: 'linkedin', label: 'LinkedIn', complete: hasText(profile.linkedin_url) },
    { key: 'languages', label: 'Languages', complete: hasArray(profile.languages) },
    { key: 'preferred_role', label: 'Preferred Role', complete: hasArray(profile.preferred_roles) },
    { key: 'current_company', label: 'Current Company', complete: hasText(profile.current_company) },
    { key: 'location', label: 'Location', complete: hasText(profile.current_location) || hasText(profile.location) || hasText(profile.city) },
  ];
}

export function calculateCandidateProfileCompletion(profile: Record<string, unknown>) {
  const checklist = getCandidateProfileCompletionChecklist(profile);
  const completed = checklist.filter((item) => item.complete).length;
  return {
    checklist,
    percentage: Math.round((completed / checklist.length) * 100),
    isComplete: completed === checklist.length,
    missing: checklist.filter((item) => !item.complete).map((item) => item.label),
  };
}

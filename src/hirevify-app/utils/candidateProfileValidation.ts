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

export const MIN_CANDIDATE_PROFILE_COMPLETENESS = 100;

const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
export const hasCompleteCandidateName = (value: unknown) => {
  if (typeof value !== 'string') return false;
  return value.trim().split(/\s+/).filter(Boolean).length >= 2;
};
const hasOwn = (profile: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(profile, key);
const hasArray = (value: unknown) => Array.isArray(value) && value.length > 0;
const hasArrayCount = (value: unknown, count: number) => Array.isArray(value) && value.length >= count;
const hasNumericValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return false;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0;
};

const hasValidEducation = (value: unknown) => {
  if (!value) return false;

  let entries = value;
  if (typeof value === 'string') {
    try {
      entries = JSON.parse(value);
    } catch {
      return value.trim().length > 0;
    }
  }

  if (!Array.isArray(entries)) return false;

  return entries.some((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const education = entry as Record<string, unknown>;
    return (
      hasText(education.degree) &&
      hasText(education.fieldOfStudy ?? education.field) &&
      hasText(education.institution ?? education.university) &&
      hasText(education.startYear ?? education.startDate) &&
      hasText(education.endYear ?? education.endDate)
    );
  });
};

export function getCandidateProfileCompletionChecklist(profile: Record<string, unknown>): CompletionItem[] {
  const locationComplete =
    hasText(profile.current_location) ||
    hasText(profile.location) ||
    hasText(profile.city);
  const experienceComplete =
    hasNumericValue(profile.total_experience) ||
    hasNumericValue(profile.years_of_experience) ||
    hasText(profile.experience_level);

  const nameChecklist =
    hasOwn(profile, 'first_name') || hasOwn(profile, 'last_name')
      ? [
          { key: 'first_name', label: 'First name', complete: hasText(profile.first_name) },
          { key: 'last_name', label: 'Last name', complete: hasText(profile.last_name) },
        ]
      : [{ key: 'full_name', label: 'First and last name', complete: hasCompleteCandidateName(profile.full_name) }];

  return [
    ...nameChecklist,
    { key: 'phone', label: 'Phone number', complete: hasText(profile.phone) },
    { key: 'location', label: 'Location', complete: locationComplete },
    { key: 'headline', label: 'Current title / headline', complete: hasText(profile.headline) || hasText(profile.current_designation) },
    { key: 'bio', label: 'Short bio', complete: hasText(profile.bio) },
    { key: 'education', label: 'At least 1 education entry', complete: hasValidEducation(profile.education) },
    { key: 'skills', label: 'At least 3 skills', complete: hasArrayCount(profile.skills, 3) },
    { key: 'experience', label: 'Experience level', complete: experienceComplete },
    { key: 'experience_summary', label: 'Experience summary', complete: hasText(profile.experience_summary) },
    { key: 'preferred_roles', label: 'Preferred role', complete: hasArray(profile.preferred_roles) },
    { key: 'job_types', label: 'Preferred job type', complete: hasArray(profile.job_types) || hasArray(profile.preferred_job_type) || hasText(profile.employment_type) },
    { key: 'work_arrangement', label: 'Work arrangement', complete: hasArray(profile.work_arrangement) || hasArray(profile.preferred_work_type) || hasText(profile.work_mode) },
    { key: 'availability', label: 'Availability / notice period', complete: hasText(profile.availability) || hasText(profile.notice_period) },
    { key: 'timezone', label: 'Timezone', complete: hasText(profile.timezone) },
    { key: 'currency', label: 'Currency', complete: hasText(profile.salary_currency) },
    { key: 'resume', label: 'CV file', complete: hasText(profile.resume_url) },
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

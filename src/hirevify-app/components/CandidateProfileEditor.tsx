import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Plus,
  Save,
  Trash2,
  Upload,
  User,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from './AuthProvider';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { applicationsService } from '@/src/hirevify-app/services/applicationsService';
import { toast } from 'sonner';
import { dashboardTheme } from '../theme/dashboardTheme';
import {
  calculateCandidateProfileCompletion,
  candidateProfessionalProfileSchema,
  MIN_CANDIDATE_PROFILE_COMPLETENESS,
} from '../utils/candidateProfileValidation';
import { z } from 'zod';

interface CandidateProfileEditorProps {
 onBack: () => void;
 onUpgrade?: () => void;
}

interface ProfileData {
 firstName: string;
 lastName: string;
 email: string;
 phone: string;
 location: string;
 bio: string;
 dateOfBirth: string;
 currentTitle: string;
 experience: string;
 experienceSummary: string;
 website: string;
 Link: string;
 GitBranch: string;
 portfolio: string;
 resumeUrl: string;
}

interface EducationEntry {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startYear: string;
  endYear: string;
  grade: string;
}

interface CertificationEntry {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
}

interface SkillsPreferences {
 skills: string[];
 jobTypes: string[];
 workArrangement: string[];
 salaryMin: number;
 salaryMax: number;
 currency: string;
 noticePeriod: string;
 timezone: string;
}

interface ProfessionalProfileData {
 currentCompany: string;
 currentDesignation: string;
 industry: string;
 careerLevel: string;
 totalExperience: string;
 employmentStatus: string;
 noticePeriod: string;
 availableFrom: string;
 expectedSalary: string;
 preferredRoles: string[];
 preferredLocations: string[];
 employmentType: string;
 workMode: string;
 willingToRelocate: boolean;
 workAuthorization: string;
 country: string;
 state: string;
 city: string;
 currentLocation: string;
 languages: string[];
}

const experienceLevels = ['Entry Level', '1-2 years', '3-5 years', '5-10 years', '10+ years'];

const degreeTypes = [
  'High School / SSLC',
  'HSE / PUC / 12th',
  'Diploma',
  'B.Sc',
  'B.A',
  'B.Com',
  'B.Tech / B.E',
  'BBA',
  'BCA',
  'MBBS',
  'M.Sc',
  'M.A',
  'M.Com',
  'M.Tech / M.E',
  'MBA',
  'PGDM',
  'Ph.D',
  'Postdoctoral',
  'Certificate',
  'Other',
];

const fieldOfStudyOptions = [
  'Computer Science & IT',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Data Science & Analytics',
  'Artificial Intelligence & Machine Learning',
  'Business Administration',
  'Finance & Accounting',
  'Marketing & Sales',
  'Human Resources',
  'Economics',
  'Commerce',
  'Mathematics & Statistics',
  'Physics',
  'Chemistry',
  'Biology & Life Sciences',
  'Pharmacy',
  'Nursing & Healthcare',
  'Law',
  'Media & Communication',
  'Design & Arts',
  'Hotel Management',
  'Education & Teaching',
  'Agriculture',
  'Other',
];

// Degree → relevant fields of study
const degreeFieldsMap: Record<string, string[]> = {
  'High School / SSLC': ['General', 'Science', 'Commerce', 'Arts', 'Other'],
  'HSE / PUC / 12th': ['Science', 'Commerce', 'Arts & Humanities', 'Vocational', 'Other'],
  'Diploma': [
    'Computer Science & IT', 'Electronics & Communication', 'Electrical Engineering',
    'Mechanical Engineering', 'Civil Engineering', 'Information Technology',
    'Pharmacy', 'Nursing & Healthcare', 'Hotel Management', 'Other',
  ],
  'B.Sc': ['Computer Science & IT', 'Mathematics & Statistics', 'Physics', 'Chemistry', 'Biology & Life Sciences', 'Commerce', 'Other'],
  'B.A': ['Economics', 'Media & Communication', 'Design & Arts', 'Education & Teaching', 'Law', 'Human Resources', 'Other'],
  'B.Com': ['Finance & Accounting', 'Commerce', 'Business Administration', 'Economics', 'Other'],
  'B.Tech / B.E': ['Computer Science & IT', 'Electronics & Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Information Technology', 'Data Science & Analytics', 'Artificial Intelligence & Machine Learning', 'Other'],
  'BBA': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources', 'Economics', 'Other'],
  'BCA': ['Computer Science & IT', 'Information Technology', 'Other'],
  'MBBS': ['Nursing & Healthcare', 'Biology & Life Sciences', 'Other'],
  'M.Sc': ['Computer Science & IT', 'Mathematics & Statistics', 'Physics', 'Chemistry', 'Biology & Life Sciences', 'Data Science & Analytics', 'Other'],
  'M.A': ['Economics', 'Media & Communication', 'Design & Arts', 'Education & Teaching', 'Human Resources', 'Other'],
  'M.Com': ['Finance & Accounting', 'Commerce', 'Business Administration', 'Economics', 'Other'],
  'M.Tech / M.E': ['Computer Science & IT', 'Electronics & Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Information Technology', 'Data Science & Analytics', 'Artificial Intelligence & Machine Learning', 'Other'],
  'MBA': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources', 'Economics', 'Other'],
  'PGDM': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources', 'Other'],
  'Ph.D': ['Computer Science & IT', 'Electronics & Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Economics', 'Commerce', 'Biology & Life Sciences', 'Chemistry', 'Physics', 'Mathematics & Statistics', 'Education & Teaching', 'Other'],
  'Postdoctoral': ['Computer Science & IT', 'Biology & Life Sciences', 'Chemistry', 'Physics', 'Medicine', 'Other'],
  'Certificate': ['Computer Science & IT', 'Data Science & Analytics', 'Artificial Intelligence & Machine Learning', 'Finance & Accounting', 'Digital Marketing', 'Project Management', 'Other'],
  'Other': ['Other'],
};
const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
const workArrangements = ['Remote', 'Hybrid', 'On-site'];
const noticePeriods = ['Immediate', '1 week', '2 weeks', '1 month', '2 months', '3 months'];
const employmentStatuses = ['Open to work', 'Employed', 'Serving notice', 'Freelancing', 'Student', 'Not actively looking'];
const careerLevels = ['Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager', 'Director'];
const industries = ['Software & IT', 'Data & Analytics', 'Finance', 'Healthcare', 'Education', 'Retail', 'Media', 'Manufacturing', 'Other'];
const workAuthorizations = ['Citizen', 'Permanent Resident', 'Work Visa', 'Student Visa', 'Sponsorship Required', 'Not specified'];
const commonRoles = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'Power BI Analyst', 'QA Engineer', 'Product Manager'];
const commonLocations = ['Remote', 'Kochi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Mumbai', 'Delhi NCR'];
const commonLanguages = ['English', 'Hindi', 'Malayalam', 'Tamil', 'Kannada', 'Telugu'];
const timezones = ['IST', 'UTC', 'GST', 'EST', 'CST', 'MST', 'PST', 'GMT', 'CET'];
const currencies = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'QAR'];
const ACCEPTED_CV_TYPES = [
 'application/pdf',
 'application/msword',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ACCEPTED_CV_EXTENSIONS = '.pdf,.doc,.docx';
const MAX_CV_BYTES = 10 * 1024 * 1024;
const PROFILE_EDITOR_PROFILE_COLUMNS = 'id, auth_user_id, email, full_name, phone, location, bio';
const PROFILE_EDITOR_CANDIDATE_COLUMNS = [
 'full_name',
 'phone',
 'location',
 'bio',
 'date_of_birth',
 'headline',
 'experience_level',
 'experience_summary',
 'years_of_experience',
 'portfolio_url',
 'linkedin_url',
 'github_url',
 'resume_url',
 'skills',
 'preferred_job_type',
 'preferred_work_type',
 'salary_min',
 'salary_max',
 'salary_currency',
 'availability',
 'timezone',
 'current_company',
 'current_designation',
 'industry',
 'career_level',
 'total_experience',
 'employment_status',
 'notice_period',
 'available_from',
 'expected_salary',
 'preferred_roles',
 'preferred_locations',
 'employment_type',
 'work_mode',
 'willing_to_relocate',
 'work_authorization',
 'country',
 'state',
 'city',
 'current_location',
 'languages',
 'education',
 'updated_at',
].join(', ');
const PROFILE_EDITOR_CACHE_VERSION = 1;

interface ProfileEditorCacheSnapshot {
 version: typeof PROFILE_EDITOR_CACHE_VERSION;
 userId: string;
 profileData: ProfileData;
 skillsPreferences: SkillsPreferences;
 professionalData: ProfessionalProfileData;
 education: EducationEntry[];
 cachedAt: string;
}

const getProfileEditorCacheKey = (userId: string) => `hirevify_candidate_profile_editor:${userId}`;

const readProfileEditorCache = (userId?: string | null): ProfileEditorCacheSnapshot | null => {
 if (typeof window === 'undefined' || !userId) return null;

 try {
 const raw = window.sessionStorage.getItem(getProfileEditorCacheKey(userId));
 if (!raw) return null;
 const parsed = JSON.parse(raw) as ProfileEditorCacheSnapshot;
 if (parsed.version !== PROFILE_EDITOR_CACHE_VERSION || parsed.userId !== userId) return null;
 return parsed;
 } catch {
 return null;
 }
};

const writeProfileEditorCache = (
 userId: string | undefined,
 snapshot: Omit<ProfileEditorCacheSnapshot, 'version' | 'userId' | 'cachedAt'>
) => {
 if (typeof window === 'undefined' || !userId) return;

 try {
 window.sessionStorage.setItem(
 getProfileEditorCacheKey(userId),
 JSON.stringify({
 version: PROFILE_EDITOR_CACHE_VERSION,
 userId,
 cachedAt: new Date().toISOString(),
 ...snapshot,
 } satisfies ProfileEditorCacheSnapshot)
 );
 } catch {
 // Session cache is only a refresh speed-up; failing silently is fine.
 }
};

const normalizeOptionalUrl = (value: string) => {
 const trimmed = value.trim();
 if (!trimmed) return '';
 return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const normalizeLinkedInUrl = (value: string) => {
 const trimmed = value.trim();
 if (!trimmed) return '';
 if (/^https?:\/\//i.test(trimmed) || /(^|\.)linkedin\.com\//i.test(trimmed)) {
 return normalizeOptionalUrl(trimmed);
 }
 const handle = trimmed.replace(/^@+/, '').replace(/^in\//i, '').replace(/^\/+/, '');
 return handle ? `https://www.linkedin.com/in/${handle}` : '';
};

const normalizeGitHubUrl = (value: string) => {
 const trimmed = value.trim();
 if (!trimmed) return '';
 if (/^https?:\/\//i.test(trimmed) || /(^|\.)github\.com\//i.test(trimmed)) {
 return normalizeOptionalUrl(trimmed);
 }
 const handle = trimmed.replace(/^@+/, '').replace(/^\/+/, '');
 return handle ? `https://github.com/${handle}` : '';
};

export function CandidateProfileEditor({ onBack }: CandidateProfileEditorProps) {
 const { user } = useAuth();
 
 
const [currentStep, setCurrentStep] = useState(0);
 const [isLoading, setIsLoading] = useState(false);
 const [isLoadingProfile, setIsLoadingProfile] = useState(true);
 const [newSkill, setNewSkill] = useState('');
 const [newPreferredRole, setNewPreferredRole] = useState('');
 const [newPreferredLocation, setNewPreferredLocation] = useState('');
 const [newLanguage, setNewLanguage] = useState('');
 const [cvFile, setCvFile] = useState<File | null>(null);

 const [profileData, setProfileData] = useState<ProfileData>({
 firstName: user?.name?.split(' ')[0] || '',
 lastName: user?.name?.split(' ').slice(1).join(' ') || '',
 email: user?.email || '',
 phone: '',
 location: '',
 bio: '',
 dateOfBirth: '',
 currentTitle: '',
 experience: '',
 experienceSummary: '',
 website: '',
 Link: '',
 GitBranch: '',
 portfolio: '',
 resumeUrl: '',
 });

  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);

  const [skillsPreferences, setSkillsPreferences] = useState<SkillsPreferences>({
 skills: [],
 jobTypes: [],
 workArrangement: [],
 salaryMin: 0,
 salaryMax: 0,
 currency: 'USD',
 noticePeriod: '',
  timezone: 'IST',
  });

  const [professionalData, setProfessionalData] = useState<ProfessionalProfileData>({
 currentCompany: '',
 currentDesignation: '',
 industry: '',
 careerLevel: '',
 totalExperience: '',
 employmentStatus: '',
 noticePeriod: '',
 availableFrom: '',
 expectedSalary: '',
 preferredRoles: [],
 preferredLocations: [],
 employmentType: '',
 workMode: '',
 willingToRelocate: false,
 workAuthorization: '',
 country: '',
 state: '',
 city: '',
 currentLocation: '',
 languages: [],
  });

  const steps = [
  { title: 'Basic Profile', description: 'Your identity and headline', icon: User },
  { title: 'Education', description: 'Your academic background', icon: GraduationCap },
  { title: 'Skills', description: 'Your core skills and experience', icon: Briefcase },
  { title: 'Certifications', description: 'Professional certifications and awards', icon: Award },
  { title: 'Preferences', description: 'Work type, salary and availability', icon: Briefcase },
  { title: 'CV / Portfolio', description: 'CV file and professional links', icon: FileText },
  { title: 'Review', description: 'Complete and become visible', icon: CheckCircle2 },
  ];

 const fullName = (profileData.firstName + ' ' + profileData.lastName).trim();

 const parseCandidateExperienceYears = (experience: string) => {
 if (experience.includes('10+')) return 10;
 if (experience.includes('5-10')) return 5;
 if (experience.includes('3-5')) return 3;
 if (experience.includes('1-2')) return 1;
 return 0;
 };

const mapYearsToExperienceLevel = (years?: number | null) => {
  const value = Number(years || 0);

  if (value <= 1) return 'entry';
  if (value <= 3) return 'mid';
  if (value <= 6) return 'senior';
  return 'lead';
};

 const mapNoticePeriodToAvailability = (noticePeriod: string) => {
 if (!noticePeriod) return '';
 if (noticePeriod === 'Immediate') return 'immediate';
 return noticePeriod.toLowerCase();
 };

 const hasCv = () => Boolean(cvFile || profileData.resumeUrl.trim());

 const computeAge = (dateOfBirth?: string | null): number | null => {
 if (!dateOfBirth) return null;
 const dob = new Date(dateOfBirth);
 if (Number.isNaN(dob.getTime())) return null;
 const now = new Date();
 let age = now.getFullYear() - dob.getFullYear();
 const m = now.getMonth() - dob.getMonth();
 if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
 age--;
 }
 return age >= 0 && age < 150 ? age : null;
 };

 const getStoredCvName = () => {
 if (cvFile) return cvFile.name;
 const value = profileData.resumeUrl.trim();
 if (!value) return '';
 const lastPart = value.split('/').pop() || value;
 return lastPart.replace(/^\d+_/, '');
 };

 const handleCvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
 const file = event.target.files?.[0];
 if (!file) return;

 const fileName = file.name.toLowerCase();
 const isAcceptedType =
 ACCEPTED_CV_TYPES.includes(file.type) ||
 fileName.endsWith('.pdf') ||
 fileName.endsWith('.doc') ||
 fileName.endsWith('.docx');

 if (!isAcceptedType) {
 toast.error('Upload a PDF, DOC, or DOCX CV.');
 event.target.value = '';
 return;
 }

 if (file.size > MAX_CV_BYTES) {
 toast.error('CV must be under 10 MB.');
 event.target.value = '';
 return;
 }

 setCvFile(file);
 };

 const completion = useMemo(() => {
 const calculated = calculateCandidateProfileCompletion({
 first_name: profileData.firstName,
 last_name: profileData.lastName,
 full_name: fullName,
 phone: profileData.phone,
 email: profileData.email,
 location: profileData.location,
 current_location: professionalData.currentLocation,
 current_designation: professionalData.currentDesignation,
 headline: profileData.currentTitle,
 bio: profileData.bio,
 experience_summary: profileData.experienceSummary,
 skills: skillsPreferences.skills,
 job_types: skillsPreferences.jobTypes,
 work_arrangement: skillsPreferences.workArrangement,
 availability: skillsPreferences.noticePeriod,
 timezone: skillsPreferences.timezone,
 salary_currency: skillsPreferences.currency,
 total_experience: professionalData.totalExperience,
 years_of_experience: parseCandidateExperienceYears(profileData.experience),
 experience_level: profileData.experience,
 education,
 resume_url: hasCv() ? profileData.resumeUrl || 'selected-file' : '',
 linkedin_url: profileData.Link,
 languages: professionalData.languages,
 preferred_roles: professionalData.preferredRoles,
 employment_type: professionalData.employmentType,
 work_mode: professionalData.workMode,
 notice_period: professionalData.noticePeriod,
 current_company: professionalData.currentCompany,
 city: professionalData.city,
 });

 return {
 percentage: calculated.percentage,
 isComplete: calculated.percentage >= MIN_CANDIDATE_PROFILE_COMPLETENESS && calculated.isComplete,
 missing: calculated.missing,
 checklist: calculated.checklist,
 };
  }, [profileData, skillsPreferences, cvFile, education, professionalData]);

 const validateCurrentStep = () => {
 if (currentStep === 0) {
 const missing = [];
 if (!profileData.firstName.trim()) missing.push('first name');
 if (!profileData.lastName.trim()) missing.push('last name');
 if (!profileData.phone.trim()) missing.push('phone');
 if (!profileData.location.trim()) missing.push('location');
 if (!profileData.currentTitle.trim()) missing.push('current title');
 if (!profileData.experience.trim()) missing.push('experience level');
 if (!profileData.bio.trim()) missing.push('bio');

 if (missing.length > 0) {
 toast.error('Complete basic profile fields: ' + missing.join(', '));
 return false;
 }
 }

  if (currentStep === 1) {
  const hasValidEducation = education.some(
    (e) => e.degree.trim() && e.fieldOfStudy.trim() && e.institution.trim() && e.startYear.trim() && e.endYear.trim()
  );
  if (!hasValidEducation) {
    toast.error('Add at least one education entry (fill all fields in the entry)');
    return false;
  }
  return true;
  }

  if (currentStep === 2) {
  if (skillsPreferences.skills.length < 3) {
  toast.error('Add at least 3 skills');
  return false;
  }

  if (!profileData.experienceSummary.trim()) {
  toast.error('Add your experience summary');
  return false;
  }
  }

  if (currentStep === 3) {
  // Certifications - optional, always allow next
  return true;
  }

  if (currentStep === 4) {
  if (skillsPreferences.workArrangement.length < 1) {
  toast.error('Select at least one work arrangement');
  return false;
  }

  if (skillsPreferences.jobTypes.length < 1) {
  toast.error('Select at least one job type');
  return false;
  }

  if (!skillsPreferences.noticePeriod.trim()) {
  toast.error('Select your availability / notice period');
  return false;
  }

  if (!skillsPreferences.timezone.trim()) {
  toast.error('Select your timezone');
  return false;
  }

  if (!skillsPreferences.currency.trim()) {
  toast.error('Select your salary currency');
  return false;
  }

  if (professionalData.preferredRoles.length < 1) {
  toast.error('Add at least one preferred role');
  return false;
  }
  }

  if (currentStep === 5) {
  if (!hasCv()) {
  toast.error('Upload your CV before continuing');
  return false;
  }
  }

  return true;
 };

 const loadCandidateProfile = async () => {
 try {
 setIsLoadingProfile(true);

 if (!user?.id) {
 setIsLoadingProfile(false);
 return;
 }

 const supabase = createSupabaseBrowserClient();
  const profileRequest = supabase
  .from('profiles')
  .select(PROFILE_EDITOR_PROFILE_COLUMNS)
  .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)
  .maybeSingle();

  const directCandidateRequest = supabase
  .from('candidate_profiles')
  .select(PROFILE_EDITOR_CANDIDATE_COLUMNS)
  .eq('user_id', user.id)
  .order('updated_at', { ascending: false })
  .limit(1)
  .maybeSingle();

  const [
  { data: profileRow, error: profileError },
  { data: directCandidateProfileRow, error: directCandidateError },
  ] = await Promise.all([profileRequest, directCandidateRequest]);

 if (profileError) {
 throw new Error(profileError.message);
 }

 if (!profileRow?.id) {
 setIsLoadingProfile(false);
 return;
 }

 let candidateProfileRow = directCandidateProfileRow;
 let candidateError = directCandidateError;
 const candidateProfileUserIds = Array.from(new Set([profileRow.auth_user_id, profileRow.id].filter((id) => id && id !== user.id)));

 if (!candidateProfileRow && candidateProfileUserIds.length > 0) {
 const fallbackCandidateResult = await supabase
  .from('candidate_profiles')
  .select(PROFILE_EDITOR_CANDIDATE_COLUMNS)
  .in('user_id', candidateProfileUserIds)
  .order('updated_at', { ascending: false })
  .limit(1)
  .maybeSingle();

 candidateProfileRow = fallbackCandidateResult.data;
 candidateError = fallbackCandidateResult.error;
 }
 const candidateProfile = candidateProfileRow as any;

 if (candidateError) {
 console.error('Candidate profile load error:', candidateError);
 }

 const nameParts = String(profileRow.full_name || user?.name || '').split(' ').filter(Boolean);

 const nextProfileData: ProfileData = {
 firstName: candidateProfile?.full_name?.split(' ')[0] || nameParts[0] || '',
 lastName: candidateProfile?.full_name?.split(' ').slice(1).join(' ') || nameParts.slice(1).join(' ') || '',
 email: profileRow.email || user?.email || '',
 phone: candidateProfile?.phone || profileRow.phone || '',
 location: candidateProfile?.location || profileRow.location || '',
 bio: candidateProfile?.bio || profileRow.bio || '',
 dateOfBirth: candidateProfile?.date_of_birth ? String(candidateProfile.date_of_birth).slice(0, 10) : '',
 currentTitle: candidateProfile?.headline || '',
 experience: candidateProfile?.experience_level && experienceLevels.includes(candidateProfile.experience_level) ? candidateProfile.experience_level : candidateProfile?.experience_summary && experienceLevels.includes(candidateProfile.experience_summary) ? candidateProfile.experience_summary : mapYearsToExperienceLevel(candidateProfile?.years_of_experience),
 experienceSummary: candidateProfile?.experience_summary || '',
 website: candidateProfile?.portfolio_url || '',
 Link: candidateProfile?.linkedin_url || '',
 GitBranch: candidateProfile?.github_url || '',
 portfolio: candidateProfile?.portfolio_url || '',
 resumeUrl: candidateProfile?.resume_url || '',
 };

  const nextSkillsPreferences: SkillsPreferences = {
  skills: candidateProfile?.skills || [],
  jobTypes: Array.isArray(candidateProfile?.preferred_job_type) ? candidateProfile.preferred_job_type : [],
  workArrangement: candidateProfile?.preferred_work_type || [],
  salaryMin: Number(candidateProfile?.salary_min || 0),
  salaryMax: Number(candidateProfile?.salary_max || 0),
  currency: candidateProfile?.salary_currency || 'USD',
  noticePeriod: candidateProfile?.availability || '',
  timezone: candidateProfile?.timezone || 'IST',
  };

  const nextProfessionalData: ProfessionalProfileData = {
  currentCompany: candidateProfile?.current_company || '',
  currentDesignation: candidateProfile?.current_designation || candidateProfile?.headline || '',
  industry: candidateProfile?.industry || '',
  careerLevel: candidateProfile?.career_level || '',
  totalExperience: String(candidateProfile?.total_experience ?? candidateProfile?.years_of_experience ?? ''),
  employmentStatus: candidateProfile?.employment_status || '',
  noticePeriod: candidateProfile?.notice_period || candidateProfile?.availability || '',
  availableFrom: candidateProfile?.available_from || '',
  expectedSalary: candidateProfile?.expected_salary || '',
  preferredRoles: candidateProfile?.preferred_roles || [],
  preferredLocations: candidateProfile?.preferred_locations || [],
  employmentType: candidateProfile?.employment_type || '',
  workMode: candidateProfile?.work_mode || (candidateProfile?.preferred_work_type || [])[0] || '',
  willingToRelocate: Boolean(candidateProfile?.willing_to_relocate),
  workAuthorization: candidateProfile?.work_authorization || '',
  country: candidateProfile?.country || '',
  state: candidateProfile?.state || '',
  city: candidateProfile?.city || '',
  currentLocation: candidateProfile?.current_location || candidateProfile?.location || profileRow.location || '',
  languages: candidateProfile?.languages || [],
  };

  let nextEducation: EducationEntry[] = [];
  if (candidateProfile?.education) {
    try {
      const parsed = typeof candidateProfile.education === 'string'
        ? JSON.parse(candidateProfile.education)
        : candidateProfile.education;
      if (Array.isArray(parsed) && parsed.length > 0) {
        nextEducation = parsed.map((e: any, i: number) => ({
          id: e.id || String(Date.now() + i),
          degree: e.degree || '',
          fieldOfStudy: e.fieldOfStudy || e.field || '',
          institution: e.institution || e.university || '',
          startYear: e.startYear || e.startDate || '',
          endYear: e.endYear || e.endDate || '',
          grade: e.grade || '',
        }));
      }
    } catch {
      // ignore parse errors
    }
  }

 setProfileData(nextProfileData);
 setSkillsPreferences(nextSkillsPreferences);
 setProfessionalData(nextProfessionalData);
 setEducation(nextEducation);
 writeProfileEditorCache(user.id, {
 profileData: nextProfileData,
 skillsPreferences: nextSkillsPreferences,
 professionalData: nextProfessionalData,
 education: nextEducation,
 });
  } catch (error) {
 console.error('Failed to load candidate profile:', error);
 toast.error(error instanceof Error? error.message: 'Failed to load candidate profile');
 } finally {
 setIsLoadingProfile(false);
 }
 };

 useEffect(() => {
 const cachedProfile = readProfileEditorCache(user?.id);
 if (cachedProfile) {
 setProfileData(cachedProfile.profileData);
 setSkillsPreferences(cachedProfile.skillsPreferences);
 setProfessionalData(cachedProfile.professionalData);
 setEducation(cachedProfile.education || []);
 }

 loadCandidateProfile();
 }, [user?.id]);

 const saveCandidateProfileToDatabase = async (markComplete: boolean) => {
 const supabase = createSupabaseBrowserClient();
 const { data: authData, error: authError } = await supabase.auth.getUser();

 if (authError ||!authData?.user?.id) {
 throw new Error('No active Supabase login found. Please login again.');
 }

  const { data: profileRow, error: profileError } = await supabase.from('profiles').select('id, auth_user_id, email, role').or(`auth_user_id.eq.${authData.user.id},id.eq.${authData.user.id}`).maybeSingle();

  if (profileError) {
  throw new Error(profileError.message);
  }

  if (!profileRow?.id) {
  throw new Error('Main profile row not found. Please login again.');
  }

 const profileCompleted = markComplete && completion.isComplete;
 const profileCompleteness = profileCompleted? 100: completion.percentage;
 const now = new Date().toISOString();
 let savedResumeUrl = profileData.resumeUrl.trim();

 let professionalPayload;
 try {
 professionalPayload = candidateProfessionalProfileSchema.parse({
 current_company: professionalData.currentCompany,
 current_designation: professionalData.currentDesignation || profileData.currentTitle,
 industry: professionalData.industry,
 career_level: professionalData.careerLevel,
 total_experience: professionalData.totalExperience === '' ? null : Number(professionalData.totalExperience),
 employment_status: professionalData.employmentStatus,
 notice_period: professionalData.noticePeriod || skillsPreferences.noticePeriod,
 available_from: professionalData.availableFrom,
 expected_salary: professionalData.expectedSalary,
 preferred_roles: professionalData.preferredRoles,
 preferred_locations: professionalData.preferredLocations,
 employment_type: professionalData.employmentType || skillsPreferences.jobTypes[0] || '',
 work_mode: professionalData.workMode || skillsPreferences.workArrangement[0] || '',
 willing_to_relocate: professionalData.willingToRelocate,
 work_authorization: professionalData.workAuthorization,
 country: professionalData.country,
 state: professionalData.state,
 city: professionalData.city,
 current_location: professionalData.currentLocation || profileData.location,
 linkedin_url: normalizeLinkedInUrl(profileData.Link),
 github_url: normalizeGitHubUrl(profileData.GitBranch),
 portfolio_url: profileData.portfolio || profileData.website ? normalizeOptionalUrl(profileData.portfolio || profileData.website) : '',
 languages: professionalData.languages,
 });
 } catch (error) {
 if (error instanceof z.ZodError) {
 const message = error.issues.map((issue) => issue.message).join(', ');
 throw new Error(message || 'Please check your profile links.');
 }
 throw error;
 }

 if (cvFile) {
 const upload = await applicationsService.uploadCV(authData.user.id, cvFile);

 if (upload.error || !upload.path) {
 throw new Error(upload.error?.message || 'CV upload failed. Please try again.');
 }

 savedResumeUrl = upload.path;
 setProfileData((current) => ({ ...current, resumeUrl: upload.path || '' }));
 setCvFile(null);
 }

 const profileUpdate = {
 full_name: fullName,
 phone: profileData.phone.trim(),
 location: profileData.location.trim(),
 bio: profileData.bio.trim(),
 updated_at: now,
 };

 const { error: updateProfileError } = await supabase.from('profiles').update(profileUpdate).eq('id', profileRow.id);

 if (updateProfileError) {
 throw new Error(updateProfileError.message);
 }

const payload: Record<string, any> = {
 user_id: authData.user.id,
 full_name: fullName,
 phone: profileData.phone.trim(),
 location: profileData.location.trim(),
 bio: profileData.bio.trim(),
 date_of_birth: profileData.dateOfBirth || null,
 headline: profileData.currentTitle.trim(),
 skills: skillsPreferences.skills,
 years_of_experience: Number(professionalPayload.total_experience ?? parseCandidateExperienceYears(profileData.experience)),
  experience_level: profileData.experience.trim(),
 experience_summary: profileData.experienceSummary.trim(),
  preferred_job_type: [...skillsPreferences.jobTypes],
 preferred_work_type: skillsPreferences.workArrangement,
 availability: mapNoticePeriodToAvailability(skillsPreferences.noticePeriod),
 salary_min: Number(skillsPreferences.salaryMin || 0),
 salary_max: Number(skillsPreferences.salaryMax || 0),
 salary_currency: skillsPreferences.currency,
 timezone: skillsPreferences.timezone,
 portfolio_url: professionalPayload.portfolio_url || null,
 github_url: professionalPayload.github_url || null,
  linkedin_url: professionalPayload.linkedin_url || null,
  resume_url: savedResumeUrl || null,
  education: JSON.stringify(education),
  certifications: certifications.map((cert) => cert.name.trim()).filter(Boolean),
  languages: professionalPayload.languages,
  current_location: professionalPayload.current_location || null,
  country: professionalPayload.country || null,
  state: professionalPayload.state || null,
  city: professionalPayload.city || null,
  total_experience: professionalPayload.total_experience,
  current_company: professionalPayload.current_company || null,
  current_designation: professionalPayload.current_designation || null,
  employment_status: professionalPayload.employment_status || null,
  notice_period: professionalPayload.notice_period || null,
  preferred_locations: professionalPayload.preferred_locations,
  employment_type: professionalPayload.employment_type || null,
  work_mode: professionalPayload.work_mode || null,
  expected_salary: professionalPayload.expected_salary || null,
  industry: professionalPayload.industry || null,
  preferred_roles: professionalPayload.preferred_roles,
  career_level: professionalPayload.career_level || null,
  work_authorization: professionalPayload.work_authorization || null,
  willing_to_relocate: professionalPayload.willing_to_relocate,
  available_from: professionalPayload.available_from || null,
  profile_last_updated: now,
  response_time: professionalData.noticePeriod || skillsPreferences.noticePeriod || null,
  email_verified: Boolean(profileRow.email),
  phone_verified: Boolean(profileData.phone.trim()),
  resume_verified: Boolean(savedResumeUrl),
 profile_completeness: profileCompleteness,
 profile_completed: profileCompleted,
 updated_at: now,
 };

 const candidateProfileUserIds = Array.from(new Set([profileRow.id, authData.user.id].filter(Boolean)));

const { data: existingProfile, error: existingError } = await supabase
  .from('candidate_profiles')
  .select('*')
  .in('user_id', candidateProfileUserIds)
  .order('updated_at', { ascending: false })
  .limit(1)
  .maybeSingle();

 if (existingError) {
  throw new Error(existingError.message);
}

// Protect draft save from overwriting existing data with blanks.
if (!markComplete && existingProfile?.id) {
  const keepTextValue = (next: unknown, current: unknown) => {
    const nextText = typeof next === 'string' ? next.trim() : '';
    const currentText = typeof current === 'string' ? current.trim() : '';
    return nextText || currentText || null;
  };

  const keepArrayValue = (next: unknown, current: unknown) => {
    if (Array.isArray(next) && next.length > 0) return next;
    if (Array.isArray(current) && current.length > 0) return current;
    return Array.isArray(next) ? next : [];
  };

payload.full_name = keepTextValue(payload.full_name, existingProfile.full_name);
  payload.phone = keepTextValue(payload.phone, existingProfile.phone);
  payload.location = keepTextValue(payload.location, existingProfile.location);
  payload.date_of_birth = keepTextValue(payload.date_of_birth, existingProfile.date_of_birth);
  payload.headline = keepTextValue(payload.headline, existingProfile.headline);
  payload.bio = keepTextValue(payload.bio, existingProfile.bio);
  payload.experience_summary = keepTextValue(payload.experience_summary, existingProfile.experience_summary);
  payload.resume_url = keepTextValue(payload.resume_url, existingProfile.resume_url);
  payload.portfolio_url = keepTextValue(payload.portfolio_url, existingProfile.portfolio_url);
  payload.github_url = keepTextValue(payload.github_url, existingProfile.github_url);
  payload.linkedin_url = keepTextValue(payload.linkedin_url, existingProfile.linkedin_url);
  payload.current_location = keepTextValue(payload.current_location, existingProfile.current_location);
  payload.country = keepTextValue(payload.country, existingProfile.country);
  payload.state = keepTextValue(payload.state, existingProfile.state);
  payload.city = keepTextValue(payload.city, existingProfile.city);
  payload.current_company = keepTextValue(payload.current_company, existingProfile.current_company);
  payload.current_designation = keepTextValue(payload.current_designation, existingProfile.current_designation);
  payload.employment_status = keepTextValue(payload.employment_status, existingProfile.employment_status);
  payload.notice_period = keepTextValue(payload.notice_period, existingProfile.notice_period);
  payload.employment_type = keepTextValue(payload.employment_type, existingProfile.employment_type);
  payload.work_mode = keepTextValue(payload.work_mode, existingProfile.work_mode);
  payload.expected_salary = keepTextValue(payload.expected_salary, existingProfile.expected_salary);
  payload.industry = keepTextValue(payload.industry, existingProfile.industry);
  payload.career_level = keepTextValue(payload.career_level, existingProfile.career_level);
  payload.work_authorization = keepTextValue(payload.work_authorization, existingProfile.work_authorization);

  // Keep education if new one is empty
  if ((!payload.education || payload.education === '[]') && existingProfile.education) {
    payload.education = existingProfile.education;
  }

  payload.skills = keepArrayValue(payload.skills, existingProfile.skills);
  payload.preferred_work_type = keepArrayValue(payload.preferred_work_type, existingProfile.preferred_work_type);
  payload.preferred_job_type = keepArrayValue(payload.preferred_job_type, existingProfile.preferred_job_type);
  payload.preferred_roles = keepArrayValue(payload.preferred_roles, existingProfile.preferred_roles);
  payload.preferred_locations = keepArrayValue(payload.preferred_locations, existingProfile.preferred_locations);
  payload.languages = keepArrayValue(payload.languages, existingProfile.languages);

  payload.experience_level = keepTextValue(payload.experience_level, existingProfile.experience_level);

  if ((!payload.years_of_experience || Number(payload.years_of_experience) === 0) && existingProfile.years_of_experience) {
    payload.years_of_experience = Number(existingProfile.years_of_experience);
  }

  if (completion.isComplete && Boolean(existingProfile.profile_completed) && Number(existingProfile.profile_completeness || 0) >= 100) {
    payload.profile_completed = true;
    payload.profile_completeness = 100;
  }
}

  if (!markComplete && completion.isComplete && Boolean(existingProfile?.profile_completed) && Number(existingProfile?.profile_completeness || 0) >= 100) {
    payload.profile_completed = true;
    payload.profile_completeness = 100;
  }

 const result = existingProfile?.id? await supabase.from('candidate_profiles').update(payload).eq('id', existingProfile.id).select('id, profile_completed, profile_completeness').single(): await supabase.from('candidate_profiles').insert(payload).select('id, profile_completed, profile_completeness').single();

 if (result.error) {
 throw new Error(result.error.message);
 }

 if (!result.data?.id) {
 throw new Error('Profile save did not return a saved database row.');
 }

 return result.data;
 };

 const cacheCurrentProfileEditorState = () => {
 writeProfileEditorCache(user?.id, {
 profileData,
 skillsPreferences,
 professionalData,
 education,
 });
 };

 const handleSaveDraft = async () => {
 try {
 setIsLoading(true);
 await saveCandidateProfileToDatabase(false);
 cacheCurrentProfileEditorState();
 toast.success('Saved');
 } catch (error) {
 console.error('Failed to save draft:', error);
 toast.error(error instanceof Error? error.message: 'Failed to save draft');
 } finally {
 setIsLoading(false);
 }
 };

 const handleNext = async () => {
 if (!validateCurrentStep()) return;

 try {
 setIsLoading(true);
 await saveCandidateProfileToDatabase(false);
 cacheCurrentProfileEditorState();
 setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
 } catch (error) {
 console.error('Failed to save step:', error);
 toast.error(error instanceof Error? error.message: 'Failed to save step');
 } finally {
 setIsLoading(false);
 }
 };

 const handleCompleteProfile = async () => {
 if (!completion.isComplete) {
 toast.error('Complete all mandatory fields first');
 return;
 }

 try {
 setIsLoading(true);
 await saveCandidateProfileToDatabase(true);
 cacheCurrentProfileEditorState();
 toast.success('Profile completed and visible to recruiters');
 onBack();
 } catch (error) {
 console.error('Failed to complete profile:', error);
 toast.error(error instanceof Error? error.message: 'Failed to complete profile');
 } finally {
 setIsLoading(false);
 }
 };

 const addSkill = () => {
 const cleanSkill = newSkill.trim();

 if (!cleanSkill) return;

 if (skillsPreferences.skills.includes(cleanSkill)) {
 toast.error('Skill already added');
 return;
 }

 setSkillsPreferences((prev) => ({...prev,
 skills: [...prev.skills, cleanSkill],
 }));
 setNewSkill('');
 };

 const removeSkill = (skill: string) => {
 setSkillsPreferences((prev) => ({...prev,
 skills: prev.skills.filter((item) => item!== skill),
 }));
 };

 const addUniqueProfessionalValue = (
 key: 'preferredRoles' | 'preferredLocations' | 'languages',
 value: string,
 reset: (value: string) => void,
 label: string,
 ) => {
 const cleanValue = value.trim();
 if (!cleanValue) return;

 const exists = professionalData[key].some((item) => item.toLowerCase() === cleanValue.toLowerCase());
 if (exists) {
 toast.error(`${label} already added`);
 return;
 }

 setProfessionalData((prev) => ({
 ...prev,
 [key]: [...prev[key], cleanValue],
 }));
 reset('');
 };

 const toggleProfessionalArrayValue = (key: 'preferredRoles' | 'preferredLocations' | 'languages', value: string) => {
 setProfessionalData((prev) => {
 const exists = prev[key].includes(value);
 return {
 ...prev,
 [key]: exists ? prev[key].filter((item) => item !== value) : [...prev[key], value],
 };
 });
 };

 const removeProfessionalArrayValue = (key: 'preferredRoles' | 'preferredLocations' | 'languages', value: string) => {
 setProfessionalData((prev) => ({
 ...prev,
 [key]: prev[key].filter((item) => item !== value),
 }));
 };

 const toggleArrayValue = (key: 'jobTypes' | 'workArrangement', value: string) => {
 setSkillsPreferences((prev) => {
 const exists = prev[key].includes(value);
 return {...prev,
 [key]: exists? prev[key].filter((item) => item!== value): [...prev[key], value],
 };
 });
 };

 const renderRequiredBadge = () => (
 <span className="ml-1 text-sm font-bold text-red-600">*</span>
 );

 const renderStepContent = () => {
 if (currentStep === 0) {
 return (
 <Card className="border border-emerald-100 shadow-sm">
 <CardHeader>
 <CardTitle>Step 1: Basic Profile</CardTitle>
 <p className="text-sm text-muted-foreground">These fields are required before recruiters can find you.</p>
 </CardHeader>
 <CardContent className="space-y-5">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <Label>First Name {renderRequiredBadge()}</Label>
 <Input value={profileData.firstName} onChange={(event) => setProfileData({...profileData, firstName: event.target.value })} />
 </div>
 <div>
 <Label>Last Name {renderRequiredBadge()}</Label>
 <Input value={profileData.lastName} onChange={(event) => setProfileData({...profileData, lastName: event.target.value })} />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <Label>Email</Label>
 <Input type="email" value={profileData.email} onChange={(event) => setProfileData({...profileData, email: event.target.value })} />
 </div>
 <div>
 <Label>Phone {renderRequiredBadge()}</Label>
 <Input value={profileData.phone} onChange={(event) => setProfileData({...profileData, phone: event.target.value })} placeholder="Mobile number" />
 </div>
 </div>

 <div>
 <Label>Location {renderRequiredBadge()}</Label>
 <Input value={profileData.location} onChange={(event) => setProfileData({...profileData, location: event.target.value })} placeholder="Kochi, Kerala / Remote / Bangalore" />
 </div>

 <div>
 <Label>Date of Birth</Label>
 <Input
 type="date"
 max={new Date().toISOString().slice(0, 10)}
 value={profileData.dateOfBirth}
 onChange={(event) => setProfileData({...profileData, dateOfBirth: event.target.value })}
 />
 {(() => {
 const age = computeAge(profileData.dateOfBirth);
 if (age === null) return <p className="mt-1 text-xs text-slate-500">Optional. Recruiters see this alongside your profile.</p>;
 return (
 <p className="mt-1 text-xs text-slate-600">
 <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
 {age} yr{age === 1 ? '' : 's'} old
 </span>
 <span className="ml-2 text-slate-500">— recruiters will see this on your profile.</span>
 </p>
 );
 })()}
 </div>

 <div>
 <Label>Current Title / Headline {renderRequiredBadge()}</Label>
 <Input value={profileData.currentTitle} onChange={(event) => setProfileData({...profileData, currentTitle: event.target.value })} placeholder="Power BI Analyst, React Developer, IT Support Engineer" />
 </div>

 <div>
 <Label>Experience Level {renderRequiredBadge()}</Label>
 <Select value={profileData.experience} onValueChange={(value) => setProfileData({...profileData, experience: value })}>
 <SelectTrigger>
 <SelectValue placeholder="Select experience level" />
 </SelectTrigger>
 <SelectContent>
 {experienceLevels.map((level) => (
 <SelectItem key={level} value={level}>{level}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div>
 <Label>Short Bio {renderRequiredBadge()}</Label>
 <Textarea
 value={profileData.bio}
 onChange={(event) => setProfileData({...profileData, bio: event.target.value })}
 placeholder="Tell recruiters who you are and what type of work you are looking for."
 className="min-h-28"
 />
 </div>
 </CardContent>
 </Card>
 );
 }

  if (currentStep === 1) {
  return (
  <Card className="border border-emerald-100 shadow-sm">
  <CardHeader>
  <CardTitle>Step 2: Education</CardTitle>
  <p className="text-sm text-muted-foreground">Add your academic background. You can add multiple entries.</p>
  </CardHeader>
  <CardContent className="space-y-6">
  {education.length === 0 && (
  <Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>No education added yet. Add at least one completed education row.</AlertDescription>
  </Alert>
  )}

  {education.map((entry, index) => (
  <div key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
  <div className="flex justify-between items-center">
  <span className="text-sm font-medium text-slate-600">Education {index + 1}</span>
  <button
  type="button"
  onClick={() => setEducation(education.filter((_, i) => i !== index))}
  className="text-slate-400 hover:text-red-500 transition"
  >
  <Trash2 className="w-4 h-4" />
  </button>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
  <Label>Degree {renderRequiredBadge()}</Label>
  <Select value={entry.degree} onValueChange={(val) => {
    const updated = [...education];
    updated[index] = { ...updated[index], degree: val, fieldOfStudy: '' };
    setEducation(updated);
  }}>
  <SelectTrigger>
  <SelectValue placeholder="Select degree" />
  </SelectTrigger>
  <SelectContent>
  {degreeTypes.map((d) => (
  <SelectItem key={d} value={d}>{d}</SelectItem>
  ))}
  </SelectContent>
  </Select>
  </div>
  <div>
  <Label>Field of Study {renderRequiredBadge()}</Label>
  <Select value={entry.fieldOfStudy} onValueChange={(val) => {
    const updated = [...education];
    updated[index] = { ...updated[index], fieldOfStudy: val };
    setEducation(updated);
  }}>
  <SelectTrigger>
  <SelectValue placeholder={entry.degree ? "Select field" : "Choose degree first"} />
  </SelectTrigger>
  <SelectContent>
  {(degreeFieldsMap[entry.degree] || fieldOfStudyOptions).map((f) => (
  <SelectItem key={f} value={f}>{f}</SelectItem>
  ))}
  </SelectContent>
  </Select>
  </div>
  </div>
  <div>
  <Label>Institution / University {renderRequiredBadge()}</Label>
  <Input
  value={entry.institution}
  onChange={(e) => {
    const updated = [...education];
    updated[index] = { ...updated[index], institution: e.target.value };
    setEducation(updated);
  }}
  placeholder="University of Kerala, IIT, NIT..."
  />
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div>
  <Label>Start Year {renderRequiredBadge()}</Label>
  <Select
    value={entry.startYear}
    onValueChange={(value) => {
      const updated = [...education];
      updated[index] = { ...updated[index], startYear: value };
      setEducation(updated);
    }}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select year" />
    </SelectTrigger>
    <SelectContent>
      {Array.from({ length: 50 }, (_, i) => 2026 - i).map((year) => (
        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
      ))}
      <SelectItem value="Ongoing">Ongoing</SelectItem>
    </SelectContent>
  </Select>
  </div>
  <div>
  <Label>End Year {renderRequiredBadge()}</Label>
  <Select
    value={entry.endYear}
    onValueChange={(value) => {
      const updated = [...education];
      updated[index] = { ...updated[index], endYear: value };
      setEducation(updated);
    }}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select year" />
    </SelectTrigger>
    <SelectContent>
      {Array.from({ length: 50 }, (_, i) => 2026 - i).map((year) => (
        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
      ))}
      <SelectItem value="Ongoing">Ongoing</SelectItem>
    </SelectContent>
  </Select>
  </div>
  <div>
  <Label>Grade / GPA</Label>
  <Input
  value={entry.grade}
  onChange={(e) => {
    const updated = [...education];
    updated[index] = { ...updated[index], grade: e.target.value };
    setEducation(updated);
  }}
  placeholder="8.5 CGPA, First Class..."
  />
  </div>
  </div>
  </div>
  ))}

  <Button
  type="button"
  variant="outline"
  onClick={() =>
    setEducation([
      ...education,
      { id: String(Date.now()), degree: '', fieldOfStudy: '', institution: '', startYear: '', endYear: '', grade: '' },
    ])
  }
  className="w-full"
  >
  <Plus className="w-4 h-4 mr-2" />
  Add Education
  </Button>
  </CardContent>
  </Card>
  );
  }

  if (currentStep === 2) {
  return (
  <Card className="border border-emerald-100 shadow-sm">
  <CardHeader>
  <CardTitle>Step 3: Skills</CardTitle>
  </CardHeader>
  <CardContent className="space-y-5">
 <div>
 <Label>Skills {renderRequiredBadge()}</Label>
 <div className="flex gap-2 mt-2">
 <Input
 value={newSkill}
 onChange={(event) => setNewSkill(event.target.value)}
 onKeyDown={(event) => {
 if (event.key === 'Enter') {
 event.preventDefault();
 addSkill();
 }
 }}
 placeholder="Power BI, Excel, React, SQL..."
 />
 <Button type="button" onClick={addSkill} variant="outline">
 <Plus className="w-4 h-4 mr-2" />
 Add
 </Button>
 </div>

 <div className="flex flex-wrap gap-2 mt-3">
 {skillsPreferences.skills.map((skill) => (
 <Badge key={skill} variant="secondary" className="gap-1">
 {skill}
 <button type="button" onClick={() => removeSkill(skill)}>
 <X className="w-3 h-3" />
 </button>
 </Badge>
 ))}
 </div>
 <p className="text-xs text-muted-foreground mt-2">{skillsPreferences.skills.length}/3 required skills added</p>
 </div>

 <div>
 <Label>Experience Summary {renderRequiredBadge()}</Label>
 <Textarea
 value={profileData.experienceSummary}
 onChange={(event) => setProfileData({...profileData, experienceSummary: event.target.value })}
 placeholder="Example: 3 years experience in Power BI dashboards, Excel reporting and business data analysis."
 className="min-h-32"
 />
 </div>
  </CardContent>
  </Card>
  );
  }

  if (currentStep === 3) {
  return (
  <Card className="border border-emerald-100 shadow-sm">
  <CardHeader>
  <CardTitle>Step 4: Certifications</CardTitle>
  <p className="text-sm text-muted-foreground">Add professional certifications, licenses, and awards.</p>
  </CardHeader>
  <CardContent className="space-y-6">

  {certifications.length === 0 && (
  <Alert className="border-amber-200 bg-amber-50">
  <AlertCircle className="h-4 w-4 text-amber-600" />
  <AlertDescription className="text-amber-800">
  No certifications added yet. Add your professional certifications below.
  </AlertDescription>
  </Alert>
  )}

  {certifications.map((cert, index) => (
  <div key={cert.id} className="rounded-lg border p-4 space-y-4">
  <div className="flex justify-between items-center">
  <span className="text-sm font-medium text-muted-foreground">Certification {index + 1}</span>
  <Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={() => setCertifications(certifications.filter((_, i) => i !== index))}
  className="text-red-500 hover:text-red-600 hover:bg-red-50"
  >
  <Trash2 className="w-4 h-4" />
  </Button>
  </div>

  <div>
  <Label>Certification Name</Label>
  <Input
  value={cert.name}
  onChange={(e) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], name: e.target.value };
    setCertifications(updated);
  }}
  placeholder="AWS Solutions Architect, PMP, Google Analytics..."
  />
  </div>

  <div>
  <Label>Issuing Organization</Label>
  <Input
  value={cert.issuingOrganization}
  onChange={(e) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], issuingOrganization: e.target.value };
    setCertifications(updated);
  }}
  placeholder="Amazon Web Services, Google, PMI..."
  />
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
  <Label>Issue Date</Label>
  <Input
  type="month"
  value={cert.issueDate}
  onChange={(e) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], issueDate: e.target.value };
    setCertifications(updated);
  }}
  placeholder="YYYY-MM"
  />
  </div>
  <div>
  <Label>Expiry Date (leave blank if no expiry)</Label>
  <Input
  type="month"
  value={cert.expiryDate}
  onChange={(e) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], expiryDate: e.target.value };
    setCertifications(updated);
  }}
  placeholder="YYYY-MM or leave blank"
  />
  </div>
  </div>

  <div>
  <Label>Credential ID (optional)</Label>
  <Input
  value={cert.credentialId}
  onChange={(e) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], credentialId: e.target.value };
    setCertifications(updated);
  }}
  placeholder="Credential ID or number"
  />
  </div>

  <div>
  <Label>Credential URL (optional)</Label>
  <Input
  value={cert.credentialUrl}
  onChange={(e) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], credentialUrl: e.target.value };
    setCertifications(updated);
  }}
  placeholder="https://..."
  />
  </div>
  </div>
  ))}

  <Button
  type="button"
  variant="outline"
  onClick={() =>
    setCertifications([
      ...certifications,
      { id: String(Date.now()), name: '', issuingOrganization: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' },
    ])
  }
  className="w-full"
  >
  <Plus className="w-4 h-4 mr-2" />
  Add Certification
  </Button>
  </CardContent>
  </Card>
  );
  }

   if (currentStep === 4) {
   return (
   <Card className="border border-emerald-100 shadow-sm">
   <CardHeader>
   <CardTitle>Step 5: Job Preferences</CardTitle>
 <p className="text-sm text-muted-foreground">These fields power employer filters.</p>
 </CardHeader>
 <CardContent className="space-y-6">
 <div>
 <h3 className="text-base font-semibold text-slate-900">Professional Information</h3>
 <p className="text-sm text-muted-foreground">These details make your profile easier for recruiters to shortlist.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <Label>Current Company</Label>
 <Input value={professionalData.currentCompany} onChange={(event) => setProfessionalData({...professionalData, currentCompany: event.target.value })} placeholder="Accenture, TCS, Freelance..." />
 </div>
 <div>
 <Label>Current Designation</Label>
 <Input value={professionalData.currentDesignation} onChange={(event) => setProfessionalData({...professionalData, currentDesignation: event.target.value })} placeholder="Software Engineer" />
 </div>
 <div>
 <Label>Industry</Label>
 <Select value={professionalData.industry} onValueChange={(value) => setProfessionalData({...professionalData, industry: value })}>
 <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
 <SelectContent>{industries.map((industry) => <SelectItem key={industry} value={industry}>{industry}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 <div>
 <Label>Career Level</Label>
 <Select value={professionalData.careerLevel} onValueChange={(value) => setProfessionalData({...professionalData, careerLevel: value })}>
 <SelectTrigger><SelectValue placeholder="Select career level" /></SelectTrigger>
 <SelectContent>{careerLevels.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 <div>
 <Label>Total Experience</Label>
 <Input type="number" min="0" step="0.5" value={professionalData.totalExperience} onChange={(event) => setProfessionalData({...professionalData, totalExperience: event.target.value })} placeholder="1.5" />
 </div>
 <div>
 <Label>Expected Salary</Label>
 <Input value={professionalData.expectedSalary} onChange={(event) => setProfessionalData({...professionalData, expectedSalary: event.target.value })} placeholder="INR 8 LPA, negotiable" />
 </div>
 <div>
 <Label>Employment Status</Label>
 <Select value={professionalData.employmentStatus} onValueChange={(value) => setProfessionalData({...professionalData, employmentStatus: value })}>
 <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
 <SelectContent>{employmentStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 <div>
 <Label>Notice Period</Label>
 <Select value={professionalData.noticePeriod} onValueChange={(value) => setProfessionalData({...professionalData, noticePeriod: value, employmentStatus: value === 'Immediate' ? 'Open to work' : professionalData.employmentStatus })}>
 <SelectTrigger><SelectValue placeholder="Select notice period" /></SelectTrigger>
 <SelectContent>{noticePeriods.map((period) => <SelectItem key={period} value={period}>{period}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 <div>
 <Label>Available From</Label>
 <Input type="date" value={professionalData.availableFrom} onChange={(event) => setProfessionalData({...professionalData, availableFrom: event.target.value })} />
 </div>
 <div>
 <Label>Work Authorization</Label>
 <Select value={professionalData.workAuthorization} onValueChange={(value) => setProfessionalData({...professionalData, workAuthorization: value })}>
 <SelectTrigger><SelectValue placeholder="Select authorization" /></SelectTrigger>
 <SelectContent>{workAuthorizations.map((authorization) => <SelectItem key={authorization} value={authorization}>{authorization}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <Label>Employment Type</Label>
 <Select value={professionalData.employmentType} onValueChange={(value) => setProfessionalData({...professionalData, employmentType: value })}>
 <SelectTrigger><SelectValue placeholder="Select employment type" /></SelectTrigger>
 <SelectContent>{jobTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 <div>
 <Label>Remote / Hybrid / Onsite</Label>
 <Select value={professionalData.workMode} onValueChange={(value) => setProfessionalData({...professionalData, workMode: value })}>
 <SelectTrigger><SelectValue placeholder="Select work mode" /></SelectTrigger>
 <SelectContent>{workArrangements.map((mode) => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 </div>

 <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium">
 <input
 type="checkbox"
 checked={professionalData.willingToRelocate}
 onChange={(event) => setProfessionalData({...professionalData, willingToRelocate: event.target.checked })}
 className="h-4 w-4"
 />
 Open to relocation
 </label>

 <ChipEditor
 label={<>Preferred Roles {renderRequiredBadge()}</>}
 value={newPreferredRole}
 placeholder="Add role"
 suggestions={commonRoles}
 items={professionalData.preferredRoles}
 onValueChange={setNewPreferredRole}
 onAdd={() => addUniqueProfessionalValue('preferredRoles', newPreferredRole, setNewPreferredRole, 'Preferred role')}
 onToggleSuggestion={(role) => toggleProfessionalArrayValue('preferredRoles', role)}
 onRemove={(role) => removeProfessionalArrayValue('preferredRoles', role)}
 />

 <ChipEditor
 label="Preferred Locations"
 value={newPreferredLocation}
 placeholder="Add location"
 suggestions={commonLocations}
 items={professionalData.preferredLocations}
 onValueChange={setNewPreferredLocation}
 onAdd={() => addUniqueProfessionalValue('preferredLocations', newPreferredLocation, setNewPreferredLocation, 'Preferred location')}
 onToggleSuggestion={(location) => toggleProfessionalArrayValue('preferredLocations', location)}
 onRemove={(location) => removeProfessionalArrayValue('preferredLocations', location)}
 />

 <div>
 <h3 className="text-base font-semibold text-slate-900">Location</h3>
 <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
 <Input value={professionalData.country} onChange={(event) => setProfessionalData({...professionalData, country: event.target.value })} placeholder="Country" />
 <Input value={professionalData.state} onChange={(event) => setProfessionalData({...professionalData, state: event.target.value })} placeholder="State" />
 <Input value={professionalData.city} onChange={(event) => setProfessionalData({...professionalData, city: event.target.value })} placeholder="City" />
 <Input value={professionalData.currentLocation} onChange={(event) => setProfessionalData({...professionalData, currentLocation: event.target.value })} placeholder="Current location" />
 </div>
 </div>

 <div>
 <Label>Preferred Job Types {renderRequiredBadge()}</Label>
 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
 {jobTypes.map((type) => (
 <button
 key={type}
 type="button"
 onClick={() => toggleArrayValue('jobTypes', type)}
 className={skillsPreferences.jobTypes.includes(type)? 'rounded-lg border border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-800': 'rounded-lg border border-border bg-card p-3 text-sm'}
 >
 {type}
 </button>
 ))}
 </div>
 </div>

 <div>
 <Label>Work Arrangement {renderRequiredBadge()}</Label>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
 {workArrangements.map((arrangement) => (
 <button
 key={arrangement}
 type="button"
 onClick={() => toggleArrayValue('workArrangement', arrangement)}
 className={skillsPreferences.workArrangement.includes(arrangement)? 'rounded-lg border border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-800': 'rounded-lg border border-border bg-card p-3 text-sm'}
 >
 {arrangement}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <Label>Availability {renderRequiredBadge()}</Label>
 <Select value={skillsPreferences.noticePeriod} onValueChange={(value) => setSkillsPreferences({...skillsPreferences, noticePeriod: value })}>
 <SelectTrigger>
 <SelectValue placeholder="Select availability" />
 </SelectTrigger>
 <SelectContent>
 {noticePeriods.map((period) => (
 <SelectItem key={period} value={period}>{period}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div>
 <Label>Timezone {renderRequiredBadge()}</Label>
 <Select value={skillsPreferences.timezone} onValueChange={(value) => setSkillsPreferences({...skillsPreferences, timezone: value })}>
 <SelectTrigger>
 <SelectValue placeholder="Select timezone" />
 </SelectTrigger>
 <SelectContent>
 {timezones.map((timezone) => (
 <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div>
 <Label>Currency {renderRequiredBadge()}</Label>
 <Select value={skillsPreferences.currency} onValueChange={(value) => setSkillsPreferences({...skillsPreferences, currency: value })}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {currencies.map((currency) => (
 <SelectItem key={currency} value={currency}>{currency}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>
 </CardContent>
 </Card>
 );
 }

   if (currentStep === 5) {
   return (
   <Card className="border border-emerald-100 shadow-sm">
   <CardHeader>
   <CardTitle>Step 6: CV / Portfolio</CardTitle>
 <p className="text-sm text-muted-foreground">Upload your CV file. Portfolio links are optional but help recruiters verify your work.</p>
 </CardHeader>
 <CardContent className="space-y-5">
 <div>
 <Label>CV {renderRequiredBadge()}</Label>
 <div className="mt-2 flex flex-wrap items-center gap-3">
 <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100">
 <Upload className="h-4 w-4" />
 Attach CV
 <input
 type="file"
 accept={ACCEPTED_CV_EXTENSIONS}
 className="hidden"
 onChange={handleCvFileChange}
 />
 </label>
 {hasCv() && (
 <div className="flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
 <FileText className="h-4 w-4 shrink-0 text-slate-500" />
 <span className="truncate">{getStoredCvName() || 'CV uploaded'}</span>
 {cvFile && (
 <button
 type="button"
 onClick={() => setCvFile(null)}
 className="text-slate-400 transition hover:text-slate-700"
 aria-label="Remove selected CV"
 >
 <X className="h-3.5 w-3.5" />
 </button>
 )}
 </div>
 )}
 </div>
 <p className="mt-2 text-xs text-muted-foreground">PDF, DOC, or DOCX. Max 10 MB.</p>
 </div>

 <div>
 <Label>Portfolio URL</Label>
 <Input value={profileData.portfolio} onChange={(event) => setProfileData({...profileData, portfolio: event.target.value })} placeholder="https://portfolio.com" />
 </div>

 <div>
 <Label>LinkedIn URL</Label>
 <Input value={profileData.Link} onChange={(event) => setProfileData({...profileData, Link: event.target.value })} placeholder="https://linkedin.com/in/username" />
 </div>

 <div>
 <Label>GitHub Repo URL</Label>
 <Input value={profileData.GitBranch} onChange={(event) => setProfileData({...profileData, GitBranch: event.target.value })} placeholder="https://github.com/username/repository" />
 </div>

 <ChipEditor
 label="Languages"
 value={newLanguage}
 placeholder="Add language"
 suggestions={commonLanguages}
 items={professionalData.languages}
 onValueChange={setNewLanguage}
 onAdd={() => addUniqueProfessionalValue('languages', newLanguage, setNewLanguage, 'Language')}
 onToggleSuggestion={(language) => toggleProfessionalArrayValue('languages', language)}
 onRemove={(language) => removeProfessionalArrayValue('languages', language)}
 />

 <div>
 <Label>Website</Label>
 <Input value={profileData.website} onChange={(event) => setProfileData({...profileData, website: event.target.value })} placeholder="https://yourwebsite.com" />
 </div>

 {!hasCv() && (
 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>Upload your CV before continuing.</AlertDescription>
 </Alert>
 )}
 </CardContent>
 </Card>
 );
 }

  return (
  <Card className="border border-emerald-100 shadow-sm">
  <CardHeader>
  <CardTitle>Step 7: Review & Complete</CardTitle>
 <p className="text-sm text-muted-foreground">Complete your profile to appear in employer search.</p>
 </CardHeader>
 <CardContent className="space-y-5">
 <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="font-semibold text-emerald-900">Profile Completion</h3>
 <p className="text-sm text-emerald-700">{completion.percentage}% complete</p>
 </div>
 {completion.isComplete? (
 <Badge className="bg-emerald-600 text-white">Ready for employer search</Badge>
 ): (
 <Badge variant="secondary">Not visible yet</Badge>
 )}
 </div>

 <div className="mt-4 h-3 w-full rounded-full bg-white">
 <div className="h-3 rounded-full bg-emerald-600" style={{ width: completion.percentage + '%' }} />
 </div>
 <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
 {completion.checklist.map((item) => (
 <div key={item.key} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
 <CheckCircle2 className={item.complete ? 'h-4 w-4 text-emerald-600' : 'h-4 w-4 text-slate-300'} />
 <span className={item.complete ? 'text-slate-800' : 'text-slate-500'}>{item.label}</span>
 </div>
 ))}
 </div>
 </div>

 {completion.missing.length > 0? (
 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 <div className="font-medium mb-2">Missing required fields:</div>
 <ul className="list-disc pl-5 space-y-1">
 {completion.missing.map((field) => (
 <li key={field}>{field}</li>
 ))}
 </ul>
 </AlertDescription>
 </Alert>
 ): (
 <Alert className="border-emerald-200 bg-emerald-50">
 <CheckCircle2 className="h-4 w-4 text-emerald-600" />
 <AlertDescription className="text-emerald-800">
 All mandatory fields are complete. Click Complete Profile to become visible to recruiters.
 </AlertDescription>
 </Alert>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
 <div className="rounded-lg border p-4">
 <p className="font-medium">Name</p>
 <p className="text-muted-foreground">{fullName || 'Missing'}</p>
 </div>
 <div className="rounded-lg border p-4">
 <p className="font-medium">Headline</p>
 <p className="text-muted-foreground">{profileData.currentTitle || 'Missing'}</p>
 </div>
 <div className="rounded-lg border p-4">
 <p className="font-medium">Skills</p>
 <p className="text-muted-foreground">{skillsPreferences.skills.join(', ') || 'Missing'}</p>
 </div>
 <div className="rounded-lg border p-4">
 <p className="font-medium">Work Type</p>
 <p className="text-muted-foreground">{skillsPreferences.workArrangement.join(', ') || 'Missing'}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 );
 };

 const CurrentIcon = steps[currentStep].icon;

 return (
 <div className={dashboardTheme.page}>
 <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
 <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Button variant="ghost" onClick={onBack}>
 <ArrowLeft className="w-4 h-4 mr-2" />
 Back to Dashboard
 </Button>
 <div>
 <h1 className="text-2xl font-bold text-gray-900">Complete Candidate Profile</h1>
 <p className="text-sm text-gray-500">Finish all required fields to appear in employer search.</p>
 </div>
 </div>

 <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading || isLoadingProfile}>
 <Save className="w-4 h-4 mr-2" />
 {isLoadingProfile ? 'Loading...' : 'Save Draft'}
 </Button>
 </div>
 </header>

 <main className="max-w-5xl mx-auto px-6 py-8">
 <div className="mb-8 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
 <div className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="h-11 w-11 rounded-full bg-emerald-100 flex items-center justify-center">
 <CurrentIcon className="w-5 h-5 text-emerald-700" />
 </div>
 <div>
 <p className="text-sm text-emerald-700">Step {currentStep + 1} of {steps.length}</p>
 <h2 className="text-xl font-semibold text-gray-900">{steps[currentStep].title}</h2>
 <p className="text-sm text-gray-500">{steps[currentStep].description}</p>
 </div>
 </div>

 <div className="text-right min-w-[160px]">
 <p className="text-sm text-gray-500">Completion</p>
 <p className="text-2xl font-bold text-emerald-700">{completion.percentage}%</p>
 </div>
 </div>

 <div className="mt-5 h-3 w-full rounded-full bg-slate-100">
 <div className="h-3 rounded-full bg-emerald-600 transition-all" style={{ width: ((currentStep + 1) / steps.length) * 100 + '%' }} />
 </div>

 {isLoadingProfile && (
 <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
 Loading your saved profile details...
 </div>
 )}

 <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
 {steps.map((step, index) => (
 <button
 key={step.title}
 type="button"
 disabled={isLoadingProfile}
 onClick={() => setCurrentStep(index)}
 className={index === currentStep? 'rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm': index < currentStep? 'rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800': 'rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200'}
 >
 {index + 1}. {step.title}
 </button>
 ))}
 </div>
 </div>

 {renderStepContent()}

 <div className="mt-6 flex items-center justify-between">
 <Button
 variant="outline"
 onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
 disabled={currentStep === 0 || isLoading || isLoadingProfile}
 >
 <ChevronLeft className="w-4 h-4 mr-2" />
 Back
 </Button>

 <div className="flex gap-3">
 <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading || isLoadingProfile}>
 {isLoadingProfile ? 'Loading...' : isLoading? 'Saving...': 'Save Draft'}
 </Button>

 {currentStep < steps.length - 1? (
 <Button onClick={handleNext} disabled={isLoading || isLoadingProfile} className="bg-emerald-600 hover:bg-emerald-700 text-white">
 {isLoadingProfile ? 'Loading...' : isLoading? 'Saving...': 'Next'}
 <ChevronRight className="w-4 h-4 ml-2" />
 </Button>
 ): (
 <Button
 onClick={handleCompleteProfile}
 disabled={isLoading || isLoadingProfile ||!completion.isComplete}
 className="bg-emerald-600 hover:bg-emerald-700 text-white"
 >
 <CheckCircle2 className="w-4 h-4 mr-2" />
 {isLoadingProfile ? 'Loading...' : isLoading? 'Completing...': 'Complete Profile'}
 </Button>
 )}
 </div>
 </div>
 </main>
 </div>
 );
}

function ChipEditor({
 label,
 value,
 placeholder,
 suggestions,
 items,
 onValueChange,
 onAdd,
 onToggleSuggestion,
 onRemove,
}: {
 label: any;
 value: string;
 placeholder: string;
 suggestions: string[];
 items: string[];
 onValueChange: (value: string) => void;
 onAdd: () => void;
 onToggleSuggestion: (value: string) => void;
 onRemove: (value: string) => void;
}) {
 return (
 <div>
 <Label>{label}</Label>
 <div className="mt-2 flex gap-2">
 <Input
 value={value}
 onChange={(event) => onValueChange(event.target.value)}
 onKeyDown={(event) => {
 if (event.key === 'Enter') {
 event.preventDefault();
 onAdd();
 }
 }}
 placeholder={placeholder}
 />
 <Button type="button" variant="outline" onClick={onAdd}>
 <Plus className="mr-2 h-4 w-4" />
 Add
 </Button>
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 {suggestions.map((suggestion) => (
 <button
 key={suggestion}
 type="button"
 onClick={() => onToggleSuggestion(suggestion)}
 className={items.includes(suggestion) ? 'rounded-full border border-emerald-500 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800' : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600'}
 >
 {suggestion}
 </button>
 ))}
 </div>
 {items.length > 0 && (
 <div className="mt-3 flex flex-wrap gap-2">
 {items.map((item) => (
 <Badge key={item} variant="secondary" className="gap-1">
 {item}
 <button type="button" onClick={() => onRemove(item)} aria-label={`Remove ${item}`}>
 <X className="h-3 w-3" />
 </button>
 </Badge>
 ))}
 </div>
 )}
 </div>
 );
}

























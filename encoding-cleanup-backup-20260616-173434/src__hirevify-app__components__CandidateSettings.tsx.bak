import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader,
  Plus,
  Save,
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
import { toast } from 'sonner';

interface CandidateSettingsProps {
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
  currentTitle: string;
  experience: string;
  experienceSummary: string;
  website: string;
  Link: string;
  GitBranch: string;
  portfolio: string;
  resumeUrl: string;
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

const experienceLevels = ['Entry Level', '1-2 years', '3-5 years', '5-10 years', '10+ years'];
const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
const workArrangements = ['Remote', 'Hybrid', 'On-site'];
const noticePeriods = ['Immediate', '1 week', '2 weeks', '1 month', '2 months', '3 months'];
const timezones = ['IST', 'UTC', 'GST', 'EST', 'CST', 'MST', 'PST', 'GMT', 'CET'];
const currencies = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'QAR'];

export function CandidateSettings({ onBack }: CandidateSettingsProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [newSkill, setNewSkill] = useState('');

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
    currentTitle: '',
    experience: '',
    experienceSummary: '',
    website: '',
    Link: '',
    GitBranch: '',
    portfolio: '',
    resumeUrl: '',
  });

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

  const steps = [
    { title: 'Basic Profile', description: 'Your identity and headline', icon: User },
    { title: 'Skills', description: 'Your core skills and experience', icon: Briefcase },
    { title: 'Preferences', description: 'Work type, salary and availability', icon: Briefcase },
    { title: 'Portfolio', description: 'Resume and professional links', icon: FileText },
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

  const mapNoticePeriodToAvailability = (noticePeriod: string) => {
    if (!noticePeriod) return '';
    if (noticePeriod === 'Immediate') return 'immediate';
    return noticePeriod.toLowerCase();
  };

  const hasPortfolioOrResume = () => {
    return Boolean(
      profileData.resumeUrl.trim() ||
      profileData.portfolio.trim() ||
      profileData.website.trim() ||
      profileData.GitBranch.trim() ||
      profileData.Link.trim()
    );
  };

  const getMissingFields = () => {
    const missing: string[] = [];

    if (!fullName) missing.push('Full name');
    if (!profileData.phone.trim()) missing.push('Phone number');
    if (!profileData.location.trim()) missing.push('Location');
    if (!profileData.currentTitle.trim()) missing.push('Current title / headline');
    if (!profileData.experience.trim()) missing.push('Experience level');
    if (!profileData.bio.trim()) missing.push('Short bio');
    if (skillsPreferences.skills.length < 3) missing.push('At least 3 skills');
    if (!profileData.experienceSummary.trim()) missing.push('Experience summary');
    if (skillsPreferences.workArrangement.length < 1) missing.push('Preferred work arrangement');
    if (skillsPreferences.jobTypes.length < 1) missing.push('Preferred job type');
    if (!skillsPreferences.noticePeriod.trim()) missing.push('Availability / notice period');
    if (!skillsPreferences.timezone.trim()) missing.push('Timezone');
    if (Number(skillsPreferences.salaryMin) <= 0) missing.push('Salary minimum');
    if (Number(skillsPreferences.salaryMax) <= 0) missing.push('Salary maximum');
    if (Number(skillsPreferences.salaryMax) < Number(skillsPreferences.salaryMin)) missing.push('Salary maximum must be greater than minimum');
    if (!skillsPreferences.currency.trim()) missing.push('Currency');
    if (!hasPortfolioOrResume()) missing.push('Resume, portfolio, GitHub, LinkedIn, or website');

    return missing;
  };

  const completion = useMemo(() => {
    const checks = [
      Boolean(fullName),
      Boolean(profileData.phone.trim()),
      Boolean(profileData.location.trim()),
      Boolean(profileData.currentTitle.trim()),
      Boolean(profileData.experience.trim()),
      Boolean(profileData.bio.trim()),
      skillsPreferences.skills.length >= 3,
      Boolean(profileData.experienceSummary.trim()),
      skillsPreferences.workArrangement.length >= 1,
      skillsPreferences.jobTypes.length >= 1,
      Boolean(skillsPreferences.noticePeriod.trim()),
      Boolean(skillsPreferences.timezone.trim()),
      Number(skillsPreferences.salaryMin) > 0,
      Number(skillsPreferences.salaryMax) > 0,
      Number(skillsPreferences.salaryMax) >= Number(skillsPreferences.salaryMin),
      Boolean(skillsPreferences.currency.trim()),
      hasPortfolioOrResume(),
    ];

    const completed = checks.filter(Boolean).length;
    const percentage = Math.round((completed / checks.length) * 100);
    const missing = getMissingFields();

    return {
      percentage,
      isComplete: missing.length === 0,
      missing,
    };
  }, [profileData, skillsPreferences]);

  const validateCurrentStep = () => {
    if (currentStep === 0) {
      const missing = [];
      if (!fullName) missing.push('full name');
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
      if (skillsPreferences.skills.length < 3) {
        toast.error('Add at least 3 skills');
        return false;
      }

      if (!profileData.experienceSummary.trim()) {
        toast.error('Add your experience summary');
        return false;
      }
    }

    if (currentStep === 2) {
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

      if (Number(skillsPreferences.salaryMin) <= 0 || Number(skillsPreferences.salaryMax) <= 0) {
        toast.error('Enter valid salary minimum and maximum');
        return false;
      }

      if (Number(skillsPreferences.salaryMax) < Number(skillsPreferences.salaryMin)) {
        toast.error('Salary maximum must be greater than salary minimum');
        return false;
      }
    }

    if (currentStep === 3) {
      if (!hasPortfolioOrResume()) {
        toast.error('Add at least one: resume, portfolio, GitHub, LinkedIn, or website');
        return false;
      }
    }

    return true;
  };

  const loadCandidateProfile = async () => {
    try {
      setIsLoadingProfile(true);

      const supabase = createSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData?.user?.id) {
        throw new Error('No active Supabase login found.');
      }

      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!profileRow?.id) {
        setIsLoadingProfile(false);
        return;
      }

      const { data: candidateProfile, error: candidateError } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', profileRow.id)
        .maybeSingle();

      if (candidateError) {
        console.error('Candidate profile load error:', candidateError);
      }

      const nameParts = String(profileRow.full_name || user?.name || '').split(' ').filter(Boolean);

      setProfileData({
        firstName: candidateProfile?.full_name?.split(' ')[0] || nameParts[0] || '',
        lastName: candidateProfile?.full_name?.split(' ').slice(1).join(' ') || nameParts.slice(1).join(' ') || '',
        email: profileRow.email || user?.email || '',
        phone: candidateProfile?.phone || profileRow.phone || '',
        location: candidateProfile?.location || profileRow.location || '',
        bio: candidateProfile?.bio || profileRow.bio || '',
        currentTitle: candidateProfile?.headline || '',
        experience: candidateProfile?.experience_summary && experienceLevels.includes(candidateProfile.experience_summary)
          ? candidateProfile.experience_summary
          : '',
        experienceSummary: candidateProfile?.experience_summary || '',
        website: candidateProfile?.portfolio_url || '',
        Link: candidateProfile?.linkedin_url || '',
        GitBranch: candidateProfile?.github_url || '',
        portfolio: candidateProfile?.portfolio_url || '',
        resumeUrl: candidateProfile?.resume_url || '',
      });

      setSkillsPreferences({
        skills: candidateProfile?.skills || [],
        jobTypes: candidateProfile?.job_types || [],
        workArrangement: candidateProfile?.preferred_work_type || [],
        salaryMin: Number(candidateProfile?.salary_min || 0),
        salaryMax: Number(candidateProfile?.salary_max || 0),
        currency: candidateProfile?.salary_currency || 'USD',
        noticePeriod: candidateProfile?.availability || '',
        timezone: candidateProfile?.timezone || 'IST',
      });
    } catch (error) {
      console.error('Failed to load candidate profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load candidate profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadCandidateProfile();
  }, [user?.id]);

  const saveCandidateProfileToDatabase = async (markComplete: boolean) => {
    const supabase = createSupabaseBrowserClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user?.id) {
      throw new Error('No active Supabase login found. Please login again.');
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('id, auth_user_id, email, role')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    if (!profileRow?.id) {
      throw new Error('Main profile row not found. Please login again.');
    }

    const profileCompleted = markComplete && completion.isComplete;
    const profileCompleteness = profileCompleted ? 100 : completion.percentage;
    const now = new Date().toISOString();

    const profileUpdate = {
      full_name: fullName,
      phone: profileData.phone.trim(),
      location: profileData.location.trim(),
      bio: profileData.bio.trim(),
      updated_at: now,
    };

    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', profileRow.id);

    if (updateProfileError) {
      throw new Error(updateProfileError.message);
    }

    const payload = {
      user_id: profileRow.id,
      full_name: fullName,
      phone: profileData.phone.trim(),
      location: profileData.location.trim(),
      bio: profileData.bio.trim(),
      headline: profileData.currentTitle.trim(),
      skills: skillsPreferences.skills,
      years_of_experience: parseCandidateExperienceYears(profileData.experience),
      experience_summary: profileData.experienceSummary.trim(),
      preferred_work_type: skillsPreferences.workArrangement,
      availability: mapNoticePeriodToAvailability(skillsPreferences.noticePeriod),
      salary_min: Number(skillsPreferences.salaryMin || 0),
      salary_max: Number(skillsPreferences.salaryMax || 0),
      salary_currency: skillsPreferences.currency,
      timezone: skillsPreferences.timezone,
      portfolio_url: profileData.portfolio.trim() || profileData.website.trim() || null,
      github_url: profileData.GitBranch.trim() || null,
      linkedin_url: profileData.Link.trim() || null,
      resume_url: profileData.resumeUrl.trim() || null,
      profile_completeness: profileCompleteness,
      profile_completed: profileCompleted,
      updated_at: now,
    };

    const { data: existingProfile, error: existingError } = await supabase
      .from('candidate_profiles')
      .select('id')
      .eq('user_id', profileRow.id)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    const result = existingProfile?.id
      ? await supabase
          .from('candidate_profiles')
          .update(payload)
          .eq('id', existingProfile.id)
          .select('id, profile_completed, profile_completeness')
          .single()
      : await supabase
          .from('candidate_profiles')
          .insert(payload)
          .select('id, profile_completed, profile_completeness')
          .single();

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data?.id) {
      throw new Error('Profile save did not return a saved database row.');
    }

    return result.data;
  };

  const handleSaveDraft = async () => {
    try {
      setIsLoading(true);
      await saveCandidateProfileToDatabase(false);
      toast.success('Draft saved to database');
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    try {
      setIsLoading(true);
      await saveCandidateProfileToDatabase(false);
      setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
    } catch (error) {
      console.error('Failed to save step:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save step');
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
      toast.success('Profile completed and visible to recruiters');
      onBack();
    } catch (error) {
      console.error('Failed to complete profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete profile');
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

    setSkillsPreferences((prev) => ({
      ...prev,
      skills: [...prev.skills, cleanSkill],
    }));
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    setSkillsPreferences((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skill),
    }));
  };

  const toggleArrayValue = (key: 'jobTypes' | 'workArrangement', value: string) => {
    setSkillsPreferences((prev) => {
      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists ? prev[key].filter((item) => item !== value) : [...prev[key], value],
      };
    });
  };

  const renderRequiredBadge = () => (
    <span className="ml-2 text-xs text-red-600">Required</span>
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
                <Input value={profileData.firstName} onChange={(event) => setProfileData({ ...profileData, firstName: event.target.value })} />
              </div>
              <div>
                <Label>Last Name {renderRequiredBadge()}</Label>
                <Input value={profileData.lastName} onChange={(event) => setProfileData({ ...profileData, lastName: event.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={profileData.email} onChange={(event) => setProfileData({ ...profileData, email: event.target.value })} />
              </div>
              <div>
                <Label>Phone {renderRequiredBadge()}</Label>
                <Input value={profileData.phone} onChange={(event) => setProfileData({ ...profileData, phone: event.target.value })} placeholder="Mobile number" />
              </div>
            </div>

            <div>
              <Label>Location {renderRequiredBadge()}</Label>
              <Input value={profileData.location} onChange={(event) => setProfileData({ ...profileData, location: event.target.value })} placeholder="Kochi, Kerala / Remote / Bangalore" />
            </div>

            <div>
              <Label>Current Title / Headline {renderRequiredBadge()}</Label>
              <Input value={profileData.currentTitle} onChange={(event) => setProfileData({ ...profileData, currentTitle: event.target.value })} placeholder="Power BI Analyst, React Developer, IT Support Engineer" />
            </div>

            <div>
              <Label>Experience Level {renderRequiredBadge()}</Label>
              <Select value={profileData.experience} onValueChange={(value) => setProfileData({ ...profileData, experience: value })}>
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
                onChange={(event) => setProfileData({ ...profileData, bio: event.target.value })}
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
            <CardTitle>Step 2: Skills</CardTitle>
            <p className="text-sm text-muted-foreground">Add at least 3 skills. These are used in recruiter filters.</p>
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
                onChange={(event) => setProfileData({ ...profileData, experienceSummary: event.target.value })}
                placeholder="Example: 3 years experience in Power BI dashboards, Excel reporting and business data analysis."
                className="min-h-32"
              />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (currentStep === 2) {
      return (
        <Card className="border border-emerald-100 shadow-sm">
          <CardHeader>
            <CardTitle>Step 3: Job Preferences</CardTitle>
            <p className="text-sm text-muted-foreground">These fields power employer filters.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Preferred Job Types {renderRequiredBadge()}</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {jobTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleArrayValue('jobTypes', type)}
                    className={skillsPreferences.jobTypes.includes(type) ? 'rounded-lg border border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-800' : 'rounded-lg border border-border bg-card p-3 text-sm'}
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
                    className={skillsPreferences.workArrangement.includes(arrangement) ? 'rounded-lg border border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-800' : 'rounded-lg border border-border bg-card p-3 text-sm'}
                  >
                    {arrangement}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Availability {renderRequiredBadge()}</Label>
                <Select value={skillsPreferences.noticePeriod} onValueChange={(value) => setSkillsPreferences({ ...skillsPreferences, noticePeriod: value })}>
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
                <Select value={skillsPreferences.timezone} onValueChange={(value) => setSkillsPreferences({ ...skillsPreferences, timezone: value })}>
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
                <Select value={skillsPreferences.currency} onValueChange={(value) => setSkillsPreferences({ ...skillsPreferences, currency: value })}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Salary Minimum {renderRequiredBadge()}</Label>
                <Input
                  type="number"
                  value={skillsPreferences.salaryMin}
                  onChange={(event) => setSkillsPreferences({ ...skillsPreferences, salaryMin: Number(event.target.value || 0) })}
                />
              </div>
              <div>
                <Label>Salary Maximum {renderRequiredBadge()}</Label>
                <Input
                  type="number"
                  value={skillsPreferences.salaryMax}
                  onChange={(event) => setSkillsPreferences({ ...skillsPreferences, salaryMax: Number(event.target.value || 0) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (currentStep === 3) {
      return (
        <Card className="border border-emerald-100 shadow-sm">
          <CardHeader>
            <CardTitle>Step 4: Resume / Portfolio</CardTitle>
            <p className="text-sm text-muted-foreground">At least one link is required to become visible to recruiters.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Resume URL</Label>
              <Input value={profileData.resumeUrl} onChange={(event) => setProfileData({ ...profileData, resumeUrl: event.target.value })} placeholder="https://..." />
            </div>

            <div>
              <Label>Portfolio URL</Label>
              <Input value={profileData.portfolio} onChange={(event) => setProfileData({ ...profileData, portfolio: event.target.value })} placeholder="https://portfolio.com" />
            </div>

            <div>
              <Label>GitHub URL</Label>
              <Input value={profileData.GitBranch} onChange={(event) => setProfileData({ ...profileData, GitBranch: event.target.value })} placeholder="https://github.com/username" />
            </div>

            <div>
              <Label>LinkedIn URL</Label>
              <Input value={profileData.Link} onChange={(event) => setProfileData({ ...profileData, Link: event.target.value })} placeholder="https://linkedin.com/in/username" />
            </div>

            <div>
              <Label>Website</Label>
              <Input value={profileData.website} onChange={(event) => setProfileData({ ...profileData, website: event.target.value })} placeholder="https://yourwebsite.com" />
            </div>

            {!hasPortfolioOrResume() && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Add at least one link before continuing.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border border-emerald-100 shadow-sm">
        <CardHeader>
          <CardTitle>Step 5: Review & Complete</CardTitle>
          <p className="text-sm text-muted-foreground">Complete your profile to appear in employer search.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-emerald-900">Profile Completion</h3>
                <p className="text-sm text-emerald-700">{completion.percentage}% complete</p>
              </div>
              {completion.isComplete ? (
                <Badge className="bg-emerald-600 text-white">Ready for employer search</Badge>
              ) : (
                <Badge variant="secondary">Not visible yet</Badge>
              )}
            </div>

            <div className="mt-4 h-3 w-full rounded-full bg-white">
              <div className="h-3 rounded-full bg-emerald-600" style={{ width: completion.percentage + '%' }} />
            </div>
          </div>

          {completion.missing.length > 0 ? (
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
          ) : (
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

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-emerald-50">
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

          <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
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

          <div className="mt-4 grid grid-cols-5 gap-2">
            {steps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={index === currentStep ? 'rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white' : index < currentStep ? 'rounded-lg bg-emerald-100 px-3 py-2 text-xs text-emerald-800' : 'rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600'}
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
            disabled={currentStep === 0 || isLoading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Draft'}
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isLoading ? 'Saving...' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCompleteProfile}
                disabled={isLoading || !completion.isComplete}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isLoading ? 'Completing...' : 'Complete Profile'}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

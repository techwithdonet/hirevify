import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, CheckCircle2, Building2, Loader2, Users, Sparkles, ArrowRight, Lock, FileText, Wand2, AlertTriangle, UserCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { DashboardPageLayout } from './shared/DashboardPageLayout';
import { dashboardTheme } from '../theme/dashboardTheme';
import type { Job } from '../types/app';
import { applicationsService } from '../services/applicationsService';
import type { Application as ServiceApplication } from '../services/applicationsService';
import { calculateAtsMatch, type AtsMatchResult } from '../services/atsMatchingService';
import { extractResumeText } from '../utils/ats/resumeTextExtractor';

interface CandidateJobDetailProps {
  job: Job;
  onBack: () => void;
  onViewAssignment?: (assignmentId: string) => void;
  onApply?: (job: Job, optimizedCv?: { path: string; fileName: string; projectedScore?: number }) => void;
  onEditProfile?: () => void;
}

const JOB_TYPE_LABELS: Record<Job['job_type'], string> = {
  fulltime: 'Full-time',
  contract: 'Contract',
  freelance: 'Freelance',
  internship: 'Internship',
};

const EXPERIENCE_LABELS: Record<Job['experience_level'], string> = {
  entry: 'Entry level',
  mid: 'Mid level',
  senior: 'Senior',
  lead: 'Lead',
};

const REMOTE_LABELS: Record<Job['remote_type'], string> = {
  remote: 'Remote',
  onsite: 'On-site',
  hybrid: 'Hybrid',
};

interface CandidateExtras {
  headline: string | null;
  skills: string[] | null;
  experience_summary: string | null;
  years_of_experience: number | null;
  resume_url: string | null;
  profile_completeness: number | null;
}

function formatBudget(job: Job): string | null {
  if (!job.budget_min && !job.budget_max) return null;
  const min = job.budget_min ?? job.budget_max ?? 0;
  const max = job.budget_max ?? job.budget_min ?? 0;
  const currency = job.budget_currency || 'USD';
  if (min === max) return `${currency} ${min.toLocaleString()}`;
  return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
}

export function CandidateJobDetail({ job, onBack, onViewAssignment, onApply, onEditProfile }: CandidateJobDetailProps) {
  const { user, accessToken } = useAuth();
  const supabase = createSupabaseBrowserClient();

  const [hasApplied, setHasApplied] = useState(false);
  const [existingApplication, setExistingApplication] = useState<ServiceApplication | null>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);
  const [profileCompleteness, setProfileCompleteness] = useState<number>(0);
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [existingAssignmentId, setExistingAssignmentId] = useState<string | null>(null);
  const [candidateExtras, setCandidateExtras] = useState<CandidateExtras | null>(null);
  const [cvSignedUrl, setCvSignedUrl] = useState<string | null>(null);
  const [cvMatch, setCvMatch] = useState<AtsMatchResult | null>(null);
  const [isCheckingCvMatch, setIsCheckingCvMatch] = useState(false);
  const [cvMatchProgressText, setCvMatchProgressText] = useState('');
  const [optimizedCv, setOptimizedCv] = useState<{ 
    path: string; 
    fileName: string; 
    preview: string; 
    projectedScore: number;
    estimatedImprovement?: { minIncrease: number; maxIncrease: number };
    changes?: Array<{ section: string; before: string; after: string; reason: string }>;
    projectedCategories?: Array<{ category: string; percentage: number }>;
  } | null>(null);
  const [isOptimizingCv, setIsOptimizingCv] = useState(false);
  const [optimizationProgressText, setOptimizationProgressText] = useState('');
  const [jobOnlyChosen, setJobOnlyChosen] = useState(false);

  // Resolve candidate profile from auth
  const [candidateProfileId, setCandidateProfileId] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadCandidateProfile = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user?.id) {
          setIsCheckingApplication(false);
          return;
        }
        setAuthUserId(authData.user.id);
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('id')
          .or(`auth_user_id.eq.${authData.user.id},id.eq.${authData.user.id}`)
          .maybeSingle();
        if (profileRow?.id) setCandidateProfileId(profileRow.id);

        const candidateIds = [profileRow?.id, authData.user.id].filter(Boolean) as string[];
        const { data: extrasRow } = await supabase
          .from('candidate_profiles')
          .select('headline, skills, experience_summary, years_of_experience, resume_url, profile_completeness')
          .in('user_id', candidateIds)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle<CandidateExtras>();
        setCandidateExtras(extrasRow ?? null);
        if (extrasRow?.profile_completeness !== null && extrasRow?.profile_completeness !== undefined) {
          setProfileCompleteness(extrasRow.profile_completeness);
        }

        if (extrasRow?.resume_url) {
          const value = String(extrasRow.resume_url);
          if (/^https?:\/\//i.test(value)) {
            setCvSignedUrl(value);
          } else {
            const signed = await applicationsService.getApplicationFileSignedUrl(value);
            if (signed.url) setCvSignedUrl(signed.url);
          }
        }
      } catch (err) {
        console.warn('Could not resolve candidate profile', err);
      }
    };
    loadCandidateProfile();
  }, [supabase]);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        if (!job.recruiter_id) return;
        const { data: recruiterProfile } = await supabase
          .from('recruiter_profiles')
          .select('company_name')
          .eq('id', job.recruiter_id)
          .maybeSingle();
        if (recruiterProfile?.company_name) {
          setCompanyName(recruiterProfile.company_name);
        }
      } catch (err) {
        console.warn('Could not resolve company name', err);
      }
    };
    loadCompany();
  }, [supabase, job.recruiter_id]);

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!authUserId || !job.id) {
        setIsCheckingApplication(false);
        return;
      }
      try {
        // Use auth.users.id (authUserId) since that's what application.candidate_id stores
        const { hasApplied: applied, error } = await applicationsService.hasApplied(
          job.id,
          authUserId!
        );
        if (!error) setHasApplied(Boolean(applied));

        if (applied) {
          const { data: apps } = await applicationsService.getCandidateApplications(candidateProfileId!, authUserId!);
          const found = (apps || []).find((a: any) => a.job_id === job.id) as ServiceApplication | undefined;
          if (found) setExistingApplication(found);
        }

        // Check if a project assignment already exists
        const { data: assignmentRows } = await supabase
          .from('job_project_assignments')
          .select('id')
          .eq('job_id', job.id)
          .eq('candidate_id', authUserId!)
          .maybeSingle();
        if (assignmentRows?.id) setExistingAssignmentId(assignmentRows.id);
      } catch (err) {
        console.warn('Could not check existing application', err);
      } finally {
        setIsCheckingApplication(false);
      }
    };
    checkExistingApplication();
  }, [candidateProfileId, authUserId, job.id, supabase]);

  const handleApplyClick = () => {
    if (!user) {
      toast.error('Please sign in to apply.');
      return;
    }
    // Check profile completeness - show modal if below threshold
    if (profileCompleteness < 40) {
      setShowProfileIncompleteModal(true);
      return;
    }
    if (!cvMatch) {
      toast.error('Check your CV match before applying to this job.');
      return;
    }
    if (cvMatch && cvMatch.score < 70 && !optimizedCv) {
      toast.error('Your CV match is below 70%. Improve your CV before applying to this job.');
      return;
    }
    // Allow apply if optimized CV score is >= 70 (even if original was < 70)
    if (cvMatch && cvMatch.score < 70 && optimizedCv && optimizedCv.projectedScore < 70) {
      toast.error('Your optimized CV match is still below 70%. Consider further improvements.');
      return;
    }
    if (onApply) {
      if (optimizedCv && typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          `hirevify_optimized_cv_${job.id}`,
          JSON.stringify({ 
            path: optimizedCv.path, 
            fileName: optimizedCv.fileName,
            projectedScore: optimizedCv.projectedScore 
          })
        );
      }
      onApply(job, optimizedCv ? { path: optimizedCv.path, fileName: optimizedCv.fileName, projectedScore: optimizedCv.projectedScore } : undefined);
    }
  };

  const getCvFileName = () => {
    const value = candidateExtras?.resume_url || '';
    const lastPart = value.split('/').pop() || value;
    return lastPart.replace(/^\d+_/, '') || 'Current CV';
  };

  const loadCurrentCvText = async () => {
    if (!cvSignedUrl) return '';
    const response = await fetch(cvSignedUrl);
    if (!response.ok) return '';
    const blob = await response.blob();
    const file = new File([blob], getCvFileName(), { type: blob.type || 'application/pdf' });
    const extracted = await extractResumeText(file);
    return extracted.text;
  };

  const handleCheckCvMatch = async () => {
    if (!candidateExtras?.resume_url) {
      toast.error('Upload your CV in profile completion first.');
      return;
    }

    setIsCheckingCvMatch(true);
    setCvMatchProgressText('Reading your uploaded CV...');
    try {
      let resumeText = '';
      try {
        resumeText = await loadCurrentCvText();
      } catch (err) {
        console.warn('Could not extract current CV text, using profile data only', err);
      }

      setCvMatchProgressText('Comparing your CV with the job requirements...');
      const result = await calculateAtsMatch(
        {
          id: job.id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          skills: job.skills,
          experience_level: job.experience_level,
        },
        {
          skills: candidateExtras.skills || [],
          headline: candidateExtras.headline,
          summary: candidateExtras.experience_summary,
          resumeUrl: candidateExtras.resume_url,
          resumeText,
          experience: candidateExtras.years_of_experience,
        },
        accessToken
      );

      setCvMatch(result);
      setCvMatchProgressText('');
      if (result.score < 70) {
        toast.error(`CV match score: ${result.score}%. Improve your CV before applying.`);
      } else {
        toast.success(`CV match score: ${result.score}%. You can optimize before applying.`);
      }
    } catch (err) {
      console.error('CV match check failed', err);
      toast.error(err instanceof Error ? err.message : 'Could not check CV match.');
    } finally {
      setIsCheckingCvMatch(false);
      setCvMatchProgressText('');
    }
  };

  const handleOptimizeCv = async () => {
    if (!candidateExtras?.resume_url) {
      toast.error('Upload your CV in profile completion first.');
      return;
    }
    if (!cvMatch) {
      toast.error('Check your CV match before optimizing.');
      return;
    }
    if (!authUserId) {
      toast.error('Please sign in again.');
      return;
    }
    const currentUser = user;
    if (!currentUser) {
      toast.error('Please sign in again.');
      return;
    }

    setIsOptimizingCv(true);
    setOptimizationProgressText('Reading your CV...');
    try {
      let resumeText = '';
      try {
        resumeText = await loadCurrentCvText();
        if (resumeText.length > 100) {
          setOptimizationProgressText('Analyzing job requirements...');
        }
      } catch (err) {
        console.warn('Could not extract current CV text for AI rewrite', err);
      }

      // Extract missing keywords from ATS result
      const missingKeywords = cvMatch?.missingKeywords || [];

      setOptimizationProgressText('Optimizing CV for ATS compatibility...');
      
      // Build resume data from profile
      const resumeData = {
        contactInfo: { 
          fullName: currentUser.name || '', 
          email: currentUser.email || '', 
          phone: '',
          location: '',
          linkedinUrl: '',
          portfolioUrl: ''
        },
        summary: candidateExtras.experience_summary || candidateExtras.headline || '',
        experience: [],
        education: [],
        skills: (candidateExtras.skills || []).map((skill) => ({ name: skill, category: 'technical', proficiency: 'intermediate' })),
      };

      setOptimizationProgressText('Optimizing CV for ATS...');
      
      const response = await fetch('/api/ai/rewrite-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          resumeData,
          rawResumeText: resumeText.length > 20000 ? `${resumeText.slice(0, 20000)}\n\n[Truncated for AI context]` : resumeText,
          targetJobDescription: [job.title, job.description, ...(job.requirements || []), ...(job.skills || [])].filter(Boolean).join('\n'),
          atsScore: cvMatch?.score,
          categories: cvMatch?.categories,
          missingSkills: cvMatch?.missingSkills || [],
          missingKeywords: missingKeywords,
          strengths: cvMatch?.strengths || [],
          weaknesses: cvMatch?.weaknesses || [],
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'HireVify AI could not optimize this CV.');
      }

      setOptimizationProgressText('Generating optimized CV...');
      const payload = await response.json();
      const optimizedResume = payload?.optimizedResume || {};
      const estimatedImprovement = payload?.estimatedImprovement || { minIncrease: 5, maxIncrease: 10 };
      const changes = payload?.changes || [];
      
      // Calculate projected score using the AI's estimate (deterministic backend confirms)
      const projectedScore = Math.min(95, (cvMatch?.score || 50) + estimatedImprovement.maxIncrease);

      // Calculate projected categories based on optimization improvements
      const projectedCategories = cvMatch?.categories?.map((cat) => {
        const currentScore = cat.percentage;
        // Categories that can improve: ATS Keywords (usually has missing keywords), 
        // Required Skills (may have missing skills), Education (minor tweaks)
        // Categories already at 100% stay the same
        if (currentScore >= 100) {
          return { category: cat.category, percentage: 100 };
        }
        
        // For categories with room to improve, estimate the improvement
        // ATS Keywords typically get the biggest boost from keyword optimization
        // Skills categories get boosted when missing skills are added
        const isAtsKeywords = cat.category.toLowerCase().includes('keyword') || cat.category.toLowerCase().includes('ats');
        const isSkills = cat.category.toLowerCase().includes('skill');
        const isEducation = cat.category.toLowerCase().includes('education');
        const isExperience = cat.category.toLowerCase().includes('experience');
        
        let maxBoost = 0;
        if (isAtsKeywords) {
          maxBoost = 40; // Keywords can get a big boost
        } else if (isSkills) {
          maxBoost = 25; // Skills improvements
        } else if (isEducation) {
          maxBoost = 15; // Minor education tweaks
        } else if (isExperience) {
          maxBoost = 10; // Experience bullet rewording
        } else {
          maxBoost = 15; // Default boost for other categories
        }
        
        // Scale boost based on estimated improvement
        const improvementRatio = estimatedImprovement.maxIncrease / 15; // Normalize around 15%
        const scaledBoost = maxBoost * improvementRatio;
        const projectedScore = Math.min(100, currentScore + scaledBoost);
        
        return { category: cat.category, percentage: Math.round(projectedScore) };
      }) || [];

      // Generate full CV content
      const contactInfo = resumeData.contactInfo;
      const lines: string[] = [];
      
      // Header
      lines.push(contactInfo.fullName.toUpperCase());
      if (contactInfo.email) lines.push(contactInfo.email);
      lines.push('');

      // Summary
      if (optimizedResume.summary) {
        lines.push('PROFESSIONAL SUMMARY');
        lines.push(optimizedResume.summary);
        lines.push('');
      }

      // Skills
      if (optimizedResume.skills && optimizedResume.skills.length > 0) {
        lines.push('SKILLS');
        const skillGroups: Record<string, string[]> = { technical: [], soft: [], language: [] };
        for (const skill of optimizedResume.skills) {
          const name = skill.name || skill;
          const category = skill.category || 'technical';
          if (skillGroups[category]) {
            skillGroups[category].push(name);
          } else {
            skillGroups.technical.push(name);
          }
        }
        if (skillGroups.technical.length > 0) {
          lines.push('Technical: ' + skillGroups.technical.join(', '));
        }
        if (skillGroups.soft.length > 0) {
          lines.push('Soft Skills: ' + skillGroups.soft.join(', '));
        }
        if (skillGroups.language.length > 0) {
          lines.push('Languages: ' + skillGroups.language.join(', '));
        }
        lines.push('');
      }

      // Experience
      if (optimizedResume.experience && optimizedResume.experience.length > 0) {
        lines.push('WORK EXPERIENCE');
        for (const exp of optimizedResume.experience) {
          const titleLine = `${exp.jobTitle}${exp.companyName ? ` at ${exp.companyName}` : ''}`;
          lines.push(titleLine);
          const dateLine = [exp.startDate, exp.isCurrentJob ? 'Present' : exp.endDate].filter(Boolean).join(' - ');
          if (dateLine) lines.push(dateLine);
          if (exp.city) lines.push(exp.city);
          if (exp.description && exp.description.length > 0) {
            for (const desc of exp.description) {
              lines.push('• ' + desc);
            }
          }
          lines.push('');
        }
      }

      // Education
      if (optimizedResume.education && optimizedResume.education.length > 0) {
        lines.push('EDUCATION');
        for (const edu of optimizedResume.education) {
          const degreeLine = [edu.degree, edu.university].filter(Boolean).join(', ');
          if (degreeLine) lines.push(degreeLine);
          if (edu.graduationDate) lines.push(edu.graduationDate);
          lines.push('');
        }
      }

      const preview = lines.join('\n');
      const fileName = `hirevify-optimized-${job.title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.txt`;
      const file = new File([preview], fileName, { type: 'text/plain' });
      const upload = await applicationsService.uploadCV(authUserId, file);

      if (upload.error || !upload.path) {
        throw new Error(upload.error?.message || 'Could not save optimized CV.');
      }

      setOptimizedCv({ 
        path: upload.path, 
        fileName, 
        preview, 
        projectedScore,
        estimatedImprovement,
        changes,
        projectedCategories
      });
      setOptimizationProgressText('');
      toast.success(`Optimized CV ready! Estimated improvement: +${estimatedImprovement.minIncrease}-${estimatedImprovement.maxIncrease}%`);
    } catch (err) {
      console.error('CV optimization failed', err);
      toast.error(err instanceof Error ? err.message : 'Could not optimize CV.');
    } finally {
      setIsOptimizingCv(false);
      setOptimizationProgressText('');
    }
  };

  const handleReplaceCurrentCv = async () => {
    if (!optimizedCv || !candidateProfileId) return;
    
    setIsCheckingCvMatch(true);
    setCvMatchProgressText('Processing optimized CV...');
    
    try {
      // Extract text from optimized CV
      const file = new File([optimizedCv.preview], optimizedCv.fileName, { type: 'text/plain' });
      const extracted = await extractResumeText(file);
      const resumeText = extracted.text;
      
      // Extract skills from the optimized CV text
      // Simple extraction: split by common delimiters and look for skill-like words
      const textLower = resumeText.toLowerCase();
      const skillKeywords = [
        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'kotlin', 'swift',
        'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring',
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'graphql',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'git',
        'html', 'css', 'sass', 'tailwind', 'bootstrap',
        'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch',
        'api', 'rest', 'microservices', 'ci/cd', 'devops',
        'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
        'excel', 'tableau', 'powerbi', 'data analysis', 'statistics',
        'communication', 'leadership', 'problem solving', 'teamwork',
        'ui', 'ux', 'user interface', 'user experience', 'design', 'wireframe',
        'agile', 'scrum', 'project management', 'product management',
        'science', 'engineering', 'mathematics', 'physics', 'chemistry',
        'bachelor', 'master', 'phd', 'mba', 'degree', 'diploma', 'certificate',
        'sales', 'marketing', 'business development', 'customer service',
        'php', 'laravel', 'symfony',
        'android', 'ios', 'react native', 'flutter',
        'security', 'cybersecurity',
        'networking', 'linux', 'bash',
        'sap', 'oracle', 'salesforce', 'crm', 'erp',
      ];
      
      const extractedSkills: string[] = [];
      for (const skill of skillKeywords) {
        if (textLower.includes(skill)) {
          extractedSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
      }
      
      // Merge with existing profile skills (avoid duplicates)
      const existingSkills = candidateExtras?.skills || [];
      const allSkills = [...new Set([...existingSkills, ...extractedSkills])];
      
      // Update profile with new CV URL and extracted skills
      const { error } = await supabase
        .from('candidate_profiles')
        .update({ 
          resume_url: optimizedCv.path, 
          skills: allSkills,
          updated_at: new Date().toISOString() 
        })
        .in('user_id', [candidateProfileId, authUserId].filter(Boolean) as string[]);

      if (error) {
        toast.error(error.message || 'Could not replace current CV.');
        return;
      }

      // Update local state with new skills and CV URL
      setCandidateExtras((current) => current ? { 
        ...current, 
        resume_url: optimizedCv.path,
        skills: allSkills 
      } : current);
      
      // Refresh the signed URL for the new CV so future checks use the updated file
      if (/^https?:\/\//i.test(optimizedCv.path)) {
        setCvSignedUrl(optimizedCv.path);
      } else {
        const signed = await applicationsService.getApplicationFileSignedUrl(optimizedCv.path);
        if (signed.url) setCvSignedUrl(signed.url);
      }
      
      // Re-calculate match with the NEW CV and NEW skills
      setCvMatchProgressText('Calculating new match score...');
      const newMatch = await calculateAtsMatch(
        {
          id: job.id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          skills: job.skills,
          experience_level: job.experience_level,
        },
        {
          skills: allSkills,
          headline: candidateExtras?.headline,
          summary: candidateExtras?.experience_summary,
          resumeUrl: optimizedCv.path,
          resumeText: resumeText,
          experience: candidateExtras?.years_of_experience,
        },
        accessToken
      );
      
      setCvMatch(newMatch);
      setJobOnlyChosen(true);
      toast.success(`CV replaced! New match score: ${newMatch.score}%`);
    } catch (err) {
      console.error('Failed to replace CV:', err);
      toast.error('Could not process optimized CV. Please try again.');
    } finally {
      setIsCheckingCvMatch(false);
      setCvMatchProgressText('');
    }
  };

  const handleUseForThisJobOnly = () => {
    if (!optimizedCv) return;
    setJobOnlyChosen(true);
    toast.success('Got it — your profile CV stays as is. The optimized CV will be sent with this application.');
  };

  const budgetText = formatBudget(job);
  const isCvBelowThreshold = Boolean(cvMatch && cvMatch.score < 70);
  const canOptimizeCv = Boolean(cvMatch);

  // Profile Incomplete Modal
  if (showProfileIncompleteModal) {
    return (
      <div className="hv-candidate-shell min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-12">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <UserCircle className="h-10 w-10 text-amber-600" />
              </div>
            </div>
            <h2 className="mb-2 text-center text-xl font-bold text-slate-950">
              Complete your profile first
            </h2>
            <p className="mb-6 text-center text-sm text-slate-600">
              Your profile is only <span className="font-semibold text-amber-600">{profileCompleteness}%</span> complete. 
              Recruiters can only see candidates with complete profiles. Please add more information before applying.
            </p>
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Profile completeness
              </p>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div 
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${profileCompleteness}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Minimum 40% required to apply. Add your skills, experience, and resume to increase your profile strength.
              </p>
            </div>
            <div className="space-y-3">
              <a
                href="/candidate/settings"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <UserCircle className="h-4 w-4" />
                Complete your profile
              </a>
              <button
                onClick={() => setShowProfileIncompleteModal(false)}
                className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hv-candidate-shell min-h-screen">
      {/* Candidate-dashboard-style gradient header */}
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#064e3b_0%,#0369a1_100%)] text-white">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8">
          <button
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all jobs
          </button>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                <Sparkles className="h-3.5 w-3.5" />
                Job Details
              </div>
              <h1 className="text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
                {job.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-emerald-50/90">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-emerald-200" />
                  {companyName || 'Hiring company'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-emerald-200" />
                  {job.location || 'Location not specified'}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                  {REMOTE_LABELS[job.remote_type]}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                  {JOB_TYPE_LABELS[job.job_type]}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                  {EXPERIENCE_LABELS[job.experience_level]}
                </span>
              </div>
            </div>

            {budgetText && (
              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Budget</p>
                <p className="mt-1 flex items-center gap-1 text-lg font-bold text-white">
                  <DollarSign className="h-4 w-4" />
                  {budgetText}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-base font-bold text-slate-950">Description</h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {job.description || 'No description provided.'}
              </p>
            </div>

            {job.requirements && job.requirements.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-base font-bold text-slate-950">Requirements</h3>
                <ul className="space-y-2 pl-1 text-sm text-slate-600">
                  {job.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.skills && job.skills.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-base font-bold text-slate-950">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Project attached — kept confidential until the recruiter assigns it. */}
            {job.has_project && (
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      This role includes a project assignment
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Project details (brief, deliverables, timeline, budget)
                      are kept confidential so every candidate starts on the
                      same level. You'll see the full project once the
                      recruiter assigns it to you after your application is
                      reviewed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Profile Completeness Warning */}
            {profileCompleteness < 40 && (
              <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
                <div className="flex items-start gap-3 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950">Profile too incomplete</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Your profile is only <span className="font-semibold text-amber-600">{profileCompleteness}%</span> complete. 
                      Complete at least 40% to apply for jobs.
                    </p>
                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Complete your profile
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
              <div className="border-b border-emerald-100 bg-emerald-50/50 px-5 py-4">
                <h3 className="text-base font-bold text-slate-950">Ready to apply?</h3>
                <p className="mt-1 text-xs text-slate-500">Your profile is auto-attached. Add a CV to stand out.</p>
              </div>
              <div className="space-y-3 p-5">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-950">Current CV</p>
                      {candidateExtras?.resume_url ? (
                        <>
                          <a
                            href={cvSignedUrl || candidateExtras.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate text-xs font-medium text-emerald-700 underline"
                          >
                            {getCvFileName()}
                          </a>
                          {profileCompleteness < 100 ? (
                            <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                              <p className="text-xs text-amber-800">
                                Complete your profile to check CV match.{' '}
                                <button
                                  type="button"
                                  onClick={onEditProfile}
                                  className="font-semibold underline hover:no-underline"
                                >
                                  Go to Profile →
                                </button>
                              </p>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCheckCvMatch}
                              disabled={isCheckingCvMatch}
                              className="mt-3 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Check your CV match
                            </Button>
                          )}
                        </>
                      ) : (
                        <p className="mt-1 text-xs text-amber-700">
                          Upload a mandatory CV from profile completion before applying.
                        </p>
                      )}
                    </div>
                  </div>

                  {isCheckingCvMatch && (
                    <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Analyzing your CV</p>
                          <p className="mt-0.5 text-xs text-sky-800">
                            {cvMatchProgressText || 'Checking skills, requirements, and role keywords...'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full w-2/3 animate-pulse rounded-full bg-sky-500" />
                      </div>
                    </div>
                  )}

                  {cvMatch && (
                    <div className={`mt-4 rounded-lg border p-3 ${isCvBelowThreshold ? 'border-red-200 bg-red-50' : 'border-emerald-100 bg-emerald-50'}`}>
                      {/* Overall Score */}
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${isCvBelowThreshold ? 'text-red-700' : 'text-emerald-700'}`}>Match score</p>
                        <span className={`text-lg font-black ${isCvBelowThreshold ? 'text-red-800' : 'text-emerald-800'}`}>{cvMatch.score}%</span>
                      </div>
                      
                      {/* Category Breakdown */}
                      {cvMatch.categories && cvMatch.categories.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold text-slate-700">Score breakdown:</p>
                          {cvMatch.categories.map((cat, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs text-slate-600">{cat.category}</p>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                  <div 
                                    className={`h-full rounded-full ${cat.percentage >= 70 ? 'bg-emerald-500' : cat.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${cat.percentage}%` }}
                                  />
                                </div>
                              </div>
                              <span className="ml-2 text-xs font-semibold text-slate-700">{cat.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Strengths & Weaknesses */}
                      {cvMatch.strengths && cvMatch.strengths.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-emerald-700">Strengths:</p>
                          <ul className="mt-1 space-y-0.5">
                            {cvMatch.strengths.slice(0, 3).map((s, i) => (
                              <li key={i} className="flex items-start gap-1 text-xs text-emerald-800">
                                <span className="text-emerald-500">✓</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {cvMatch.weaknesses && cvMatch.weaknesses.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-red-700">Needs improvement:</p>
                          <ul className="mt-1 space-y-0.5">
                            {cvMatch.weaknesses.slice(0, 3).map((w, i) => (
                              <li key={i} className="flex items-start gap-1 text-xs text-red-800">
                                <span className="text-red-500">!</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Missing Skills & Keywords */}
                      {((cvMatch.missingSkills?.length ?? 0) > 0 || (cvMatch.missingKeywords?.length ?? 0) > 0) && (
                        <div className="mt-3 space-y-1">
                          {cvMatch.missingSkills && cvMatch.missingSkills.length > 0 && (
                            <p className="text-xs text-red-700">
                              <span className="font-semibold">Missing skills:</span> {cvMatch.missingSkills.slice(0, 5).join(', ')}
                            </p>
                          )}
                          {cvMatch.missingKeywords && cvMatch.missingKeywords.length > 0 && (
                            <p className="text-xs text-amber-700">
                              <span className="font-semibold">Missing keywords:</span> {cvMatch.missingKeywords.slice(0, 5).join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Threshold Message */}
                      {isCvBelowThreshold ? (
                        <div className="mt-3 rounded-lg border border-red-200 bg-white p-3 text-xs text-red-800">
                          <div className="flex gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>
                              Your CV match is below 70%, so you cannot apply for this job yet. Use the HireVify optimizer below to improve your match score, or update your CV in profile completion.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-3 text-xs text-emerald-800">
                          You meet the minimum CV match. You can apply now, or optimize your CV for a better score.
                        </div>
                      )}
                      
                      {canOptimizeCv && (
                        <Button
                          type="button"
                          onClick={handleOptimizeCv}
                          disabled={isOptimizingCv}
                          className="mt-3 w-full bg-slate-900 text-white hover:bg-slate-800"
                        >
                          <Wand2 className="mr-2 h-4 w-4" />
                          Optimize your CV with HireVify
                        </Button>
                      )}
                    </div>
                  )}

                  {isOptimizingCv && (
                    <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm">
                          <Wand2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Applying HireVify fixes</p>
                          <p className="mt-0.5 text-xs text-violet-800">
                            {optimizationProgressText || 'Tuning wording and job keywords without inventing experience...'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-violet-500" />
                      </div>
                    </div>
                  )}

                  {optimizedCv && !jobOnlyChosen && (
                    <div className="mt-4 space-y-3">
                      {/* Score Summary */}
                      <div className="rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-emerald-800">Optimized CV Ready</p>
                            <p className="mt-1 flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-emerald-600">
                                ~{optimizedCv.projectedScore}%
                              </span>
                              <span className="text-sm text-slate-500">
                                (was {cvMatch?.score}%)
                              </span>
                            </p>
                          </div>
                          {optimizedCv.estimatedImprovement && (
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Est. improvement</p>
                              <p className="text-lg font-bold text-emerald-600">
                                +{optimizedCv.estimatedImprovement.minIncrease}-{optimizedCv.estimatedImprovement.maxIncrease}%
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Projected Score Breakdown */}
                        {optimizedCv.projectedCategories && optimizedCv.projectedCategories.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold text-slate-700">Score breakdown:</p>
                            {optimizedCv.projectedCategories.map((cat, idx) => {
                              const currentCat = cvMatch?.categories?.find(c => c.category === cat.category);
                              const currentScore = currentCat?.percentage || 0;
                              const improved = cat.percentage > currentScore;
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs text-slate-600">{cat.category}</p>
                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                      <div 
                                        className={`h-full rounded-full ${cat.percentage >= 70 ? 'bg-emerald-500' : cat.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${cat.percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                  <span className={`ml-2 text-xs font-semibold ${improved ? 'text-emerald-600' : 'text-slate-700'}`}>
                                    {cat.percentage}%
                                    {improved && <span className="ml-1 text-emerald-500">↑</span>}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* CV Preview */}
                      <div className="rounded-lg border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                          <p className="text-xs font-semibold text-slate-700">Optimized CV Preview</p>
                          <span className="text-xs text-slate-500">{optimizedCv.fileName}</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-4">
                          <pre className="whitespace-pre-wrap text-xs text-slate-700 font-sans">
                            {optimizedCv.preview || 'Loading preview...'}
                          </pre>
                        </div>
                      </div>

                      {/* Changes Summary */}
                      {optimizedCv.changes && optimizedCv.changes.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs font-semibold text-amber-800 mb-2">What Changed:</p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {optimizedCv.changes.slice(0, 5).map((change, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium text-amber-900">{change.section}:</span>{' '}
                                <span className="text-amber-700">{change.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strengths - What Improved */}
                      {optimizedCv.projectedCategories && optimizedCv.projectedCategories.length > 0 && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-xs font-semibold text-emerald-800 mb-2">Strengths:</p>
                          <ul className="space-y-1">
                            {optimizedCv.projectedCategories
                              .filter(cat => {
                                const current = cvMatch?.categories?.find(c => c.category === cat.category);
                                return current && cat.percentage > current.percentage;
                              })
                              .slice(0, 3)
                              .map((cat, idx) => (
                                <li key={idx} className="flex items-start gap-1 text-xs text-emerald-800">
                                  <span className="text-emerald-500">✓</span>
                                  <span>
                                    Strong match on {cat.category.toLowerCase()} ({cat.percentage}%)
                                  </span>
                                </li>
                              ))}
                            {cvMatch?.missingKeywords && cvMatch.missingKeywords.length > 0 && (
                              <li className="flex items-start gap-1 text-xs text-emerald-800">
                                <span className="text-emerald-500">✓</span>
                                <span>Added missing keywords: {cvMatch.missingKeywords.slice(0, 3).join(', ')}</span>
                              </li>
                            )}
                            <li className="flex items-start gap-1 text-xs text-emerald-800">
                              <span className="text-emerald-500">✓</span>
                              <span>Well-formatted resume with quality indicators</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <p className="text-xs text-slate-600 text-center">
                        Want to use this optimized CV?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" size="sm" onClick={handleReplaceCurrentCv} className="bg-emerald-600 text-white hover:bg-emerald-700">
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Replace & Apply
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={handleUseForThisJobOnly}>
                          This job only
                        </Button>
                      </div>
                    </div>
                  )}

                  {optimizedCv && jobOnlyChosen && (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      {candidateExtras?.resume_url === optimizedCv.path ? (
                        <>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-emerald-800">Profile CV Updated!</p>
                            <span className="text-lg font-bold text-emerald-600">
                              {cvMatch?.score || optimizedCv.projectedScore}%
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-emerald-700">
                            Your new CV is ready. Click Apply to submit with this improved match score.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-emerald-800">
                            Using optimized CV for this job only.
                          </p>
                          <p className="mt-1 text-xs text-emerald-700">
                            Click Apply to send the optimized version with this application.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {isCheckingApplication ? (
                  <Button disabled className="w-full bg-emerald-600 text-white">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking…
                  </Button>
                ) : existingAssignmentId ? (
                  <Button
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => onViewAssignment?.(existingAssignmentId)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    View Project Assignment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : hasApplied ? (
                  <div className="space-y-2">
                    <Button disabled className="w-full bg-emerald-600 text-white hover:bg-emerald-600">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Applied
                    </Button>
                    <p className="text-xs text-slate-500">
                      Your application is in. The recruiter will review your profile and may assign the project.
                    </p>
                  </div>
                ) : profileCompleteness < 100 ? (
                  <div className="space-y-2">
                    <Button
                      disabled
                      className="w-full cursor-not-allowed bg-slate-200 font-bold text-slate-400 shadow-sm"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Complete your profile to check CV match
                    </Button>
                    <p className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
                      Your profile is only <span className="font-semibold">{profileCompleteness}%</span> complete.
                      Please complete it before checking your CV match for this job.{' '}
                      <button
                        type="button"
                        onClick={onEditProfile}
                        className="font-semibold underline hover:no-underline"
                      >
                        Go to Profile →
                      </button>
                    </p>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-emerald-600 font-bold text-white shadow-sm hover:bg-emerald-700"
                    onClick={handleApplyClick}
                    disabled={profileCompleteness < 40 || !cvMatch || isCvBelowThreshold}
                  >
                    {profileCompleteness < 40
                      ? 'Complete profile to apply'
                      : !cvMatch
                        ? 'Check CV match to apply'
                        : isCvBelowThreshold
                          ? 'CV match too low to apply'
                          : 'Apply for this job'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {existingApplication && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                    <p>
                      Status:{' '}
                      <span className="font-bold capitalize text-slate-950">
                        {existingApplication.status}
                      </span>
                    </p>
                    {existingApplication.submitted_at && (
                      <p>
                        Submitted:{' '}
                        {new Date(existingApplication.submitted_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-bold text-slate-950">At a glance</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  {job.applications_count ?? 0} candidates applied
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  Posted{' '}
                  {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'recently'}
                </div>
                {job.has_project && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    A project is attached to this job
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default CandidateJobDetail;

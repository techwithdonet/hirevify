import { useState, useEffect, useRef } from 'react';
import {
 ArrowLeft, ArrowRight, Check, Download, FileText, User, Briefcase,
 GraduationCap, Award, Zap, CheckCircle, X, Star, Crown, Sparkles, Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';
import { profilesService } from '../services/profilesService';
import { applicationsService } from '../services/applicationsService';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { extractResumeText } from '../utils/ats/resumeTextExtractor';

const cleanBrokenText = (value: string) => {
 return String(value || '').replace(/<pad>/gi, '').replace(/<\/?pad>/gi, '').replace(/(<pad>\s*)+/gi, '').replace(/\u00e2\u20ac\u00a2/g, '').replace(/\u00e2\u20ac\u00a6/g, '...').replace(/\u00e2\u20ac\u201c/g, '-').replace(/\u00e2\u20ac\u201d/g, '-').replace(/\u00e2\u20ac\u02dc/g, "'").replace(/\u00e2\u20ac\u2122/g, "'").replace(/\u00e2\u20ac\u0153/g, '"').replace(/\u00e2\u20ac\u009d/g, '"').replace(/\u00c2\u00a0/g, ' ').replace(/\u00c2/g, '').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
};

const cleanDomTextNodes = (root: HTMLElement) => {
 const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
 const nodes: Text[] = [];

 while (walker.nextNode()) {
 nodes.push(walker.currentNode as Text);
 }

 nodes.forEach((node) => {
 node.nodeValue = cleanBrokenText(node.nodeValue || '');
 });
};

interface ResumeBuilderProps {
 onBack: () => void;
 onUpgrade: () => void;
}

interface ContactInfo {
 fullName: string;
 email: string;
 phone: string;
 linkedinUrl: string;
 portfolioUrl: string;
 location: string;
}

interface WorkExperience {
 id: string;
 jobTitle: string;
 companyName: string;
 city: string;
 state: string;
 startDate: string;
 endDate: string;
 isCurrentJob: boolean;
 description: string[];
}

interface Education {
 id: string;
 degree: string;
 university: string;
 city: string;
 state: string;
 graduationDate: string;
 gpa?: string;
}

interface Skill {
 name: string;
 category: 'technical' | 'soft' | 'language';
 proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface ResumeData {
 template: 'professional' | 'modern' | 'minimalist';
 contactInfo: ContactInfo;
 summary: string;
 experience: WorkExperience[];
 skills: Skill[];
 education: Education[];
}

interface ATSCheck {
 id: string;
 name: string;
 status: 'pass' | 'fail' | 'warning';
 description: string;
 recommendation?: string;
}

type Step = 'welcome' | 'template' | 'contact' | 'summary' | 'experience' | 'skills' | 'education' | 'review' | 'ats-report';

const templates = [
 {
 id: 'professional',
 name: 'Professional',
 description: 'Clean, traditional layout suitable for corporate roles',
 preview: '/template-professional.png',
 features: ['ATS-Optimized', 'Traditional Format', 'Corporate Style']
 },
 {
 id: 'modern',
 name: 'Modern',
 description: 'Bold, two-column layout with visual hierarchy',
 preview: '/template-modern.png',
 features: ['Visual Impact', 'Two-Column', 'Creative Industries']
 },
 {
 id: 'minimalist',
 name: 'Minimalist',
 description: 'Simple, single-column design focused on scannability',
 preview: '/template-minimalist.png',
 features: ['Clean Design', 'Easy to Read', 'Versatile']
 }
];

export function ResumeBuilder({ onBack, onUpgrade }: ResumeBuilderProps) {
 const { user } = useAuth();
 const [currentStep, setCurrentStep] = useState<Step>('welcome');
const [isLoadingProfile, setIsLoadingProfile] = useState(false);
const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
const [isDownloading, setIsDownloading] = useState(false);
const [isFixingResumeWithAI, setIsFixingResumeWithAI] = useState(false);
const [isRewritingResume, setIsRewritingResume] = useState(false);
const [isImportingFromCv, setIsImportingFromCv] = useState(false);
 const resumePreviewRef = useRef<HTMLDivElement>(null);

 const [resumeData, setResumeData] = useState<ResumeData>({
 template: 'professional',
 contactInfo: {
 fullName: '',
 email: '',
 phone: '',
 linkedinUrl: '',
 portfolioUrl: '',
 location: ''
 },
 summary: '',
 experience: [],
 skills: [],
 education: []
 });
 const [atsScore, setAtsScore] = useState(0);
 const [atsChecks, setAtsChecks] = useState<ATSCheck[]>([]);

 const steps: { id: Step; title: string; icon: any }[] = [
 { id: 'welcome', title: 'Welcome', icon: Star },
 { id: 'template', title: 'Template', icon: FileText },
 { id: 'contact', title: 'Contact', icon: User },
 { id: 'summary', title: 'Summary', icon: FileText },
 { id: 'experience', title: 'Experience', icon: Briefcase },
 { id: 'skills', title: 'Skills', icon: Award },
 { id: 'education', title: 'Education', icon: GraduationCap },
 { id: 'review', title: 'Review', icon: Check }
 ];

 const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
 const progress = ((getCurrentStepIndex() + 1) / steps.length) * 100;

 // Auto-clean corrupted AI summary text like <pad><pad>
 useEffect(() => {
 const cleanedSummary = cleanBrokenText(resumeData.summary);
 if (resumeData.summary!== cleanedSummary) {
 setResumeData(prev => ({...prev, summary: cleanedSummary }));
 }
 }, [resumeData.summary]);

 // Load real Supabase profile data on mount 
 useEffect(() => {
 if (!user) return;

 const loadProfileData = async () => {
 setIsLoadingProfile(true);
 try {
 // 1. Get base profile by auth user ID
 const { data: profile, error: profileError } = await profilesService.getProfileByAuthId(user.id);

 if (profileError ||!profile) {
 // Fallback to basic auth data
 setResumeData(prev => ({...prev,
 contactInfo: {...prev.contactInfo,
 fullName: user.name || '',
 email: user.email || ''
 }
 }));
 return;
 }

 // 2. Get candidate profile using the candidate auth ID
 const { data: candidateProfile } = await profilesService.getCandidateProfile(user.id);

 // 3. Map skills: string[] -> Skill[]
 const mappedSkills: Skill[] = (candidateProfile?.skills || []).map((name: string) => ({
 name: cleanBrokenText(name),
 category: 'technical' as const,
 proficiency: 'intermediate' as const
 }));

 // 4. Update resume data with all real profile fields
 setResumeData(prev => ({...prev,
 contactInfo: {
 fullName: profile.full_name || user.name || '',
 email: profile.email || user.email || '',
 phone: profile.phone || '',
 location: profile.location || '',
 linkedinUrl: candidateProfile?.linkedin_url || '',
 portfolioUrl: candidateProfile?.portfolio_url || ''
 },
 summary: candidateProfile?.headline || '',
 skills: mappedSkills
 // Note: experience left empty - no structured work history in DB schema.
 // User fills this in manually per session.
 }));

 } catch (err) {
 console.error('Failed to load profile:', err);
 toast.error('Could not load your profile data. Please fill in manually.');
 // Still populate with auth data as fallback
 setResumeData(prev => ({...prev,
 contactInfo: {...prev.contactInfo,
 fullName: user.name || '',
 email: user.email || ''
 }
 }));
 } finally {
 setIsLoadingProfile(false);
 }
 };

 loadProfileData();
 }, [user]);

 const nextStep = () => {
 const currentIndex = getCurrentStepIndex();
 if (currentIndex < steps.length - 1) {
 setCurrentStep(steps[currentIndex + 1].id);
 } else {
 setCurrentStep('review');
 }
 };

 const prevStep = () => {
 const currentIndex = getCurrentStepIndex();
 if (currentIndex > 0) {
 setCurrentStep(steps[currentIndex - 1].id);
 }
 };

 const runATSCheck = () => {
 const clean = (value?: string) => (value || '').trim();

 const contact = resumeData.contactInfo;
 const hasContact =
 clean(contact.fullName).length > 0 &&
 clean(contact.email).length > 0 &&
 clean(contact.phone).length > 0;

 const validExperienceEntries = resumeData.experience.filter((exp) => {
 const hasMainFields =
 clean(exp.jobTitle).length > 0 &&
 clean(exp.companyName).length > 0 &&
 clean(exp.startDate).length > 0 &&
 (exp.isCurrentJob || clean(exp.endDate).length > 0);

 const hasBullets = exp.description.some((line) => clean(line).length >= 10);

 return hasMainFields && hasBullets;
 });

 const partialExperienceEntries = resumeData.experience.filter((exp) => {
 return (
 clean(exp.jobTitle).length > 0 ||
 clean(exp.companyName).length > 0 ||
 clean(exp.startDate).length > 0 ||
 exp.description.some((line) => clean(line).length > 0)
 );
 });

 const validEducationEntries = resumeData.education.filter((edu) => {
 return (
 clean(edu.degree).length > 0 &&
 clean(edu.university).length > 0 &&
 clean(edu.graduationDate).length > 0
 );
 });

 const skillNames = resumeData.skills.map((skill) => clean(skill.name).toLowerCase()).filter(Boolean);

 const summaryText = clean(resumeData.summary);
 const experienceText = resumeData.experience.flatMap((exp) => exp.description).join(' ').toLowerCase();

 const resumeText = `${summaryText} ${experienceText}`.toLowerCase();

 const matchedSkillKeywords = skillNames.filter((skill) =>
 resumeText.includes(skill)
 );

 const checks: ATSCheck[] = [
 {
 id: '1',
 name: 'Contact Information Present',
 status: hasContact? 'pass': 'fail',
 description: hasContact? `Name, email, and phone are present for ${contact.fullName || 'this candidate'}.`: 'Name, email, and phone are required for ATS and recruiter contact.',
 recommendation: hasContact? '': 'Add full name, email address, and phone number.'
 },
 {
 id: '2',
 name: 'Standard Section Headers',
 status: 'pass',
 description: 'This builder uses standard ATS-readable sections: Summary, Experience, Education, and Skills.',
 recommendation: ''
 },
 {
 id: '3',
 name: 'Work Experience Format',
 status:
 validExperienceEntries.length > 0? 'pass': partialExperienceEntries.length > 0? 'warning': 'fail',
 description:
 validExperienceEntries.length > 0? `${validExperienceEntries.length} complete work experience entr${validExperienceEntries.length === 1? 'y': 'ies'} found with title, company, dates, and description.`: partialExperienceEntries.length > 0? 'Work experience exists, but some required fields or bullet descriptions are incomplete.': 'No complete work experience entry found.',
 recommendation:
 validExperienceEntries.length > 0? '': 'Add job title, company, start/end date, and at least one clear responsibility or achievement.'
 },
 {
 id: '4',
 name: 'Skills Section',
 status:
 resumeData.skills.length >= 5? 'pass': resumeData.skills.length >= 3? 'warning': 'fail',
 description: `${resumeData.skills.length} skill${resumeData.skills.length === 1? '': 's'} listed.`,
 recommendation:
 resumeData.skills.length >= 5? '': 'Add at least 5-8 relevant technical or job-specific skills.'
 },
 {
 id: '5',
 name: 'Education Information',
 status:
 validEducationEntries.length > 0? 'pass': resumeData.education.length > 0? 'warning': 'fail',
 description:
 validEducationEntries.length > 0? `${validEducationEntries.length} complete education entr${validEducationEntries.length === 1? 'y': 'ies'} found.`: resumeData.education.length > 0? 'Education exists, but degree, institution, or graduation date is incomplete.': 'No education entry found.',
 recommendation:
 validEducationEntries.length > 0? '': 'Add degree, university/institution, and graduation date.'
 },
 {
 id: '6',
 name: 'Professional Summary',
 status:
 summaryText.length >= 100? 'pass': summaryText.length >= 50? 'warning': 'fail',
 description: `Summary length: ${summaryText.length} characters.`,
 recommendation:
 summaryText.length >= 100? '': 'Write a 2-3 sentence summary with role, key skills, and value.'
 },
 {
 id: '7',
 name: 'Keyword Optimization',
 status:
 matchedSkillKeywords.length >= 3? 'pass': matchedSkillKeywords.length >= 1? 'warning': 'fail',
 description: `${matchedSkillKeywords.length} listed skill keyword${matchedSkillKeywords.length === 1? '': 's'} found in your summary or experience descriptions.`,
 recommendation:
 matchedSkillKeywords.length >= 3? '': 'Use your important skills naturally inside your summary and work experience descriptions.'
 },
 {
 id: '8',
 name: 'Formatting Consistency',
 status: 'pass',
 description: `The selected ${resumeData.template} template uses consistent builder-controlled formatting.`,
 recommendation: ''
 }
 ];

 const score = Math.round(
 (checks.reduce((total, check) => {
 if (check.status === 'pass') return total + 1;
 if (check.status === 'warning') return total + 0.5;
 return total;
 }, 0) / checks.length) * 100
 );

 console.info('ATS check used current resume data:', {
 contact,
 summaryLength: summaryText.length,
 experienceCount: resumeData.experience.length,
 validExperienceCount: validExperienceEntries.length,
 educationCount: resumeData.education.length,
 validEducationCount: validEducationEntries.length,
 skillsCount: resumeData.skills.length,
 matchedSkillKeywords,
 score
 });

 setAtsChecks(checks);
 setAtsScore(score);
 setCurrentStep('ats-report');
 };

 // Real PDF download using html2canvas + jsPDF 
 const createPdfSafeResumeClone = () => {
 const escapeHtml = (value: string) =>
 cleanBrokenText(String(value || '')).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

 const contactInfo = resumeData.contactInfo as any;

 const fullName = escapeHtml(
 contactInfo.fullName || [contactInfo.firstName, contactInfo.lastName].filter(Boolean).join(' ')
 ) || 'Your Name';

 const email = escapeHtml(contactInfo.email || '');
 const phone = escapeHtml(contactInfo.phone || '');
 const location = escapeHtml(
 contactInfo.location ||
 [contactInfo.city, contactInfo.state, contactInfo.country].filter(Boolean).join(', ')
 );

 const contactLine = [email, phone, location].filter(Boolean).join(' | ');
 const summary = escapeHtml(resumeData.summary || '');

 const experience = Array.isArray(resumeData.experience)? resumeData.experience.filter((exp) =>
 exp.jobTitle || exp.companyName || exp.startDate || exp.endDate || exp.description?.length
 ): [];

 const education = Array.isArray(resumeData.education)? resumeData.education.filter((edu) =>
 edu.degree || edu.university || edu.graduationDate
 ): [];

 const skills = Array.isArray(resumeData.skills)? resumeData.skills.filter((skill) => skill.name): [];

 const dateRange = (startDate?: string, endDate?: string, isCurrentJob?: boolean) => {
 const start = escapeHtml(startDate || '');
 const endText = isCurrentJob? 'Present': escapeHtml(endDate || '');
 return [start, endText].filter(Boolean).join(' - ');
 };

 const experienceHtml = experience.map((exp, index) => {
 const bullets = Array.isArray(exp.description)? exp.description.filter(Boolean).map((item) => `<li style="margin:0 0 5px 0;">${escapeHtml(item)}</li>`).join(''): '';

 const place = [exp.city, exp.state].filter(Boolean).map((item) => escapeHtml(item)).join(', ');

 return `
 <div style="margin-bottom:22px;">
 <div style="display:flex;justify-content:space-between;gap:20px;">
 <div>
 <div style="font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(exp.jobTitle || 'Role Title')}</div>
 <div style="font-size:16px;font-weight:600;color:#334155;">${escapeHtml(exp.companyName || 'Company')}${place? ` - ${place}`: ''}</div>
 </div>
 <div style="font-size:15px;color:#475569;white-space:nowrap;">${dateRange(exp.startDate, exp.endDate, exp.isCurrentJob)}</div>
 </div>
 ${bullets? `<ul style="margin:8px 0 0 18px;padding:0;font-size:16px;line-height:1.75;color:#334155;">${bullets}</ul>`: ''}
 </div>
 `;
 }).join('');

 const educationHtml = education.map((edu) => {
 const meta = [edu.city, edu.state, edu.graduationDate].filter(Boolean).map((item) => escapeHtml(item)).join(' - ');

 return `
 <div style="margin-bottom:16px;">
 <div style="font-size:17px;font-weight:700;color:#0f172a;">${escapeHtml(edu.degree || 'Degree')}</div>
 <div style="font-size:16px;color:#334155;">${escapeHtml(edu.university || 'Institution')}</div>
 ${meta? `<div style="font-size:15px;color:#64748b;">${meta}</div>`: ''}
 ${edu.gpa? `<div style="font-size:15px;color:#64748b;">GPA: ${escapeHtml(edu.gpa)}</div>`: ''}
 </div>
 `;
 }).join('');

 const skillsPills = skills.map((skill) =>
 `<span style="display:inline-block;border:1px solid #cbd5e1;border-radius:999px;padding:5px 10px;margin:0 6px 6px 0;font-size:15px;color:#0f172a;background:#f8fafc;">${escapeHtml(skill.name)}</span>`
 ).join('');

 const skillsPlain = skills.map((skill) =>
 `<div style="font-size:16px;color:#ffffff;margin-bottom:8px;">${escapeHtml(skill.name)}</div>`
 ).join('');

 const sectionTitle = (title: string) =>
 `<div style="font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:0;color:#0f172a;border-bottom:1px solid #cbd5e1;padding-bottom:6px;margin-bottom:14px;">${title}</div>`;

 let html = '';

 if (resumeData.template === 'modern') {
 html = `
 <div style="width:794px;min-height:950px;background:#ffffff;color:#0f172a;font-family:Arial,sans-serif;border:1px solid #e5e7eb;display:grid;grid-template-columns:260px 534px;">
 <aside style="background:#0f172a;color:#ffffff;padding:34px;min-height:950px;">
 <div style="font-size:34px;font-weight:800;line-height:1.15;margin-bottom:14px;color:#ffffff;">${fullName}</div>
 <div style="font-size:15px;line-height:1.75;color:#e2e8f0;margin-bottom:34px;">${[email, phone, location].filter(Boolean).join('<br />')}</div>

 ${skills.length? `
 <div style="margin-bottom:34px;">
 <div style="font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:0;color:#ffffff;border-bottom:1px solid #64748b;padding-bottom:8px;margin-bottom:14px;">Skills</div>
 ${skillsPlain}
 </div>
 `: ''}

 ${education.length? `
 <div>
 <div style="font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:0;color:#ffffff;border-bottom:1px solid #64748b;padding-bottom:8px;margin-bottom:14px;">Education</div>
 ${education.map((edu) => `
 <div style="margin-bottom:16px;color:#ffffff;">
 <div style="font-size:16px;font-weight:700;color:#ffffff;">${escapeHtml(edu.degree || 'Degree')}</div>
 <div style="font-size:15px;color:#e2e8f0;">${escapeHtml(edu.university || 'Institution')}</div>
 <div style="font-size:13px;color:#cbd5e1;">${escapeHtml(edu.graduationDate || '')}</div>
 </div>
 `).join('')}
 </div>
 `: ''}
 </aside>

 <main style="padding:34px;background:#ffffff;color:#0f172a;">
 ${summary? `
 <section style="margin-bottom:32px;">
 ${sectionTitle('Professional Summary')}
 <p style="font-size:16px;line-height:1.75;color:#334155;margin:0;">${summary}</p>
 </section>
 `: ''}

 ${experience.length? `
 <section>
 ${sectionTitle('Work Experience')}
 ${experienceHtml}
 </section>
 `: ''}
 </main>
 </div>
 `;
 } else if (resumeData.template === 'minimalist') {
 html = `
 <div style="width:794px;min-height:950px;background:#ffffff;color:#0f172a;font-family:Arial,sans-serif;border:1px solid #e5e7eb;padding:42px;">
 <header style="margin-bottom:34px;">
 <div style="font-size:42px;font-weight:300;letter-spacing:0;color:#0f172a;">${fullName}</div>
 <div style="font-size:15px;color:#475569;margin-top:8px;">${contactLine}</div>
 </header>

 ${summary? `<section style="margin-bottom:30px;"><div style="font-size:19px;font-weight:700;margin-bottom:8px;color:#0f172a;">Summary</div><p style="font-size:16px;line-height:1.75;color:#334155;margin:0;">${summary}</p></section>`: ''}
 ${experience.length? `<section style="margin-bottom:30px;border-top:1px solid #e2e8f0;padding-top:18px;"><div style="font-size:19px;font-weight:700;margin-bottom:18px;color:#0f172a;">Experience</div>${experienceHtml}</section>`: ''}
 ${education.length? `<section style="margin-bottom:30px;border-top:1px solid #e2e8f0;padding-top:18px;"><div style="font-size:19px;font-weight:700;margin-bottom:18px;color:#0f172a;">Education</div>${educationHtml}</section>`: ''}
 ${skills.length? `<section style="border-top:1px solid #e2e8f0;padding-top:18px;"><div style="font-size:19px;font-weight:700;margin-bottom:14px;color:#0f172a;">Skills</div>${skillsPills}</section>`: ''}
 </div>
 `;
 } else {
 html = `
 <div style="width:794px;min-height:950px;background:#ffffff;color:#0f172a;font-family:Arial,sans-serif;border:1px solid #e5e7eb;padding:42px;">
 <header style="text-align:center;margin-bottom:34px;">
 <div style="font-size:36px;font-weight:800;color:#0f172a;">${fullName}</div>
 <div style="font-size:15px;color:#475569;margin-top:8px;">${contactLine}</div>
 </header>

 ${summary? `<section style="margin-bottom:30px;">${sectionTitle('Professional Summary')}<p style="font-size:16px;line-height:1.75;color:#334155;margin:0;">${summary}</p></section>`: ''}
 ${experience.length? `<section style="margin-bottom:30px;">${sectionTitle('Work Experience')}${experienceHtml}</section>`: ''}
 ${education.length? `<section style="margin-bottom:30px;">${sectionTitle('Education')}${educationHtml}</section>`: ''}
 ${skills.length? `<section>${sectionTitle('Skills')}${skillsPills}</section>`: ''}
 </div>
 `;
 }

 const wrapper = document.createElement('div');
 wrapper.setAttribute('data-pdf-safe-clone', 'true');
 wrapper.setAttribute('data-selected-template', resumeData.template);
 wrapper.style.position = 'fixed';
 wrapper.style.left = '-10000px';
 wrapper.style.top = '0';
 wrapper.style.background = '#ffffff';
 wrapper.style.color = '#0f172a';
 wrapper.style.fontFamily = 'Arial, sans-serif';
 wrapper.innerHTML = html;

 document.body.appendChild(wrapper);
 return wrapper;
 };
 const downloadResume = async () => {
 setIsDownloading(true);
 const toastId = toast.loading('Generating your PDF...');

 try {
 // Dynamically import to avoid bundle bloat
 const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
 import('html2canvas'),
 import('jspdf')
 ]);

 const pdfTarget = createPdfSafeResumeClone();
 if (!pdfTarget) {
 throw new Error('Resume preview not available.');
 }

const canvas = await html2canvas(pdfTarget, {
  scale: 2, // 2x is plenty for crisp text without bloating file size
  useCORS: true,
  backgroundColor: '#ffffff',
  logging: false,
  foreignObjectRendering: false
});

const imgData = canvas.toDataURL('image/jpeg', 0.85);
const pdf = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
const canvasRatio = canvas.height / canvas.width;
const imgHeight = pdfWidth * canvasRatio;

// If content exceeds one page, split across pages
if (imgHeight <= pdfHeight) {
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
} else {
  let yOffset = 0;
  while (yOffset < imgHeight) {
    pdf.addImage(imgData, 'JPEG', 0, -yOffset, pdfWidth, imgHeight);
    yOffset += pdfHeight;
    if (yOffset < imgHeight) pdf.addPage();
  }
}

 const fileName = resumeData.contactInfo.fullName? `${resumeData.contactInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`: 'resume.pdf';

 pdf.save(`hirevify-${resumeData.template}-resume.pdf`);
 document.querySelectorAll('[data-pdf-safe-clone="true"]').forEach((node) => node.remove());
 toast.success('Resume downloaded!', { id: toastId });

 } catch (err) {
 console.error('PDF generation failed:', err);
 toast.error('PDF download failed. Please try again.', { id: toastId });
 } finally {
 document.querySelectorAll('[data-pdf-safe-clone="true"]').forEach((node) => node.remove());
 setIsDownloading(false);
 }
 };
 const handleFinishAndSaveCV = async () => {
 await downloadResume();
 toast.success('CV saved successfully');
 onBack();
 };

 // AI summary generation via Next.js API route
 const generateSummary = async () => {
 setIsGeneratingSummary(true);
 const toastId = toast.loading('Generating your professional summary...');

 try {
 const supabase = createSupabaseBrowserClient();
 const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

 if (sessionError ||!sessionData.session?.access_token) {
 throw new Error('No active Supabase login found. Please login again.');
 }

 const payload = {
 name: resumeData.contactInfo.fullName || 'the candidate',
 headline: resumeData.summary || '',
 skills: resumeData.skills.map(s => s.name),
 experience: resumeData.experience.map(e => ({
 title: e.jobTitle,
 company: e.companyName
 }))
 };

 const response = await fetch('/api/ai/generate-summary', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${sessionData.session.access_token}`
 },
 body: JSON.stringify(payload)
 });

 const rawResponse = await response.text();
 let data: any = {};

 try {
 data = rawResponse? JSON.parse(rawResponse): {};
 } catch {
 throw new Error('AI summary API returned an invalid response.');
 }

 if (!response.ok) {
 throw new Error(data?.error || 'AI summary generation failed.');
 }

 if (data?.summary) {
 setResumeData(prev => ({...prev, summary: cleanBrokenText(String(data.summary)) }));
 toast.success('Summary generated!', { id: toastId });
 } else {
 throw new Error('No summary returned from AI');
 }

 } catch (err: any) {
 console.error('AI summary generation failed:', err);
 toast.error(
 err instanceof Error? err.message: 'AI generation failed. Please write your summary manually.',
 { id: toastId }
 );
 } finally {
 setIsGeneratingSummary(false);
 }
 };

 const rewriteResumeWithAI = async () => {
 setIsRewritingResume(true);
 const toastId = toast.loading('Rewriting your resume with AI...');

 try {
 const supabase = createSupabaseBrowserClient();
 const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

 if (sessionError ||!sessionData.session?.access_token) {
 throw new Error('No active Supabase login found. Please login again.');
 }

 const response = await fetch('/api/ai/rewrite-resume', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${sessionData.session.access_token}`
 },
 body: JSON.stringify({
 resumeData,
 atsScore,
 atsChecks
 })
 });

 const rawResponse = await response.text();
 let data: any = {};

 try {
 data = rawResponse? JSON.parse(rawResponse): {};
 } catch {
 throw new Error('AI rewrite API returned an invalid response.');
 }

 if (!response.ok) {
 throw new Error(data?.error || 'AI resume rewrite failed.');
 }

 const rewritten = data?.resumeData || {};

 const rewrittenExperience: WorkExperience[] = Array.isArray(rewritten.experience)? rewritten.experience.map((exp: any, index: number) => {
 const oldExp = resumeData.experience[index];

 const description = Array.isArray(exp.description)? exp.description.map((line: any) => cleanBrokenText(String(line || ''))).filter(Boolean): oldExp?.description || [];

 return {
 id: String(exp.id || oldExp?.id || `${Date.now()}-${index}`),
 jobTitle: cleanBrokenText(String(exp.jobTitle || oldExp?.jobTitle || '')),
 companyName: cleanBrokenText(String(exp.companyName || oldExp?.companyName || '')),
 city: cleanBrokenText(String(exp.city || oldExp?.city || '')),
 state: cleanBrokenText(String(exp.state || oldExp?.state || '')),
 startDate: cleanBrokenText(String(exp.startDate || oldExp?.startDate || '')),
 endDate: cleanBrokenText(String(exp.endDate || oldExp?.endDate || '')),
 isCurrentJob: Boolean(exp.isCurrentJob?? oldExp?.isCurrentJob?? false),
 description
 };
 }): resumeData.experience;

 const rewrittenEducation: Education[] = Array.isArray(rewritten.education)? rewritten.education.map((edu: any, index: number) => {
 const oldEdu = resumeData.education[index];

 return {
 id: String(edu.id || oldEdu?.id || `${Date.now()}-edu-${index}`),
 degree: cleanBrokenText(String(edu.degree || oldEdu?.degree || '')),
 university: cleanBrokenText(String(edu.university || oldEdu?.university || '')),
 city: cleanBrokenText(String(edu.city || oldEdu?.city || '')),
 state: cleanBrokenText(String(edu.state || oldEdu?.state || '')),
 graduationDate: cleanBrokenText(String(edu.graduationDate || oldEdu?.graduationDate || '')),
 gpa: cleanBrokenText(String(edu.gpa || oldEdu?.gpa || ''))
 };
 }): resumeData.education;

 const rewrittenSkills: Skill[] = Array.isArray(rewritten.skills)? rewritten.skills.map((skill: any) => ({
 name: cleanBrokenText(String(skill.name || '')),
 category: ['technical', 'soft', 'language'].includes(skill.category)? skill.category: 'technical',
 proficiency: ['beginner', 'intermediate', 'advanced', 'expert'].includes(skill.proficiency)? skill.proficiency: 'intermediate'
 })).filter((skill: Skill) => skill.name.length > 0): resumeData.skills;

 setResumeData(prev => ({...prev,
 summary: cleanBrokenText(String(rewritten.summary || prev.summary || '')),
 experience: rewrittenExperience,
 education: rewrittenEducation,
 skills: rewrittenSkills
 }));

 toast.success('Resume rewritten with AI. Review it, then download the new version.', { id: toastId });
setCurrentStep('review');
  } catch (err: any) {
  console.error('AI resume rewrite failed:', err);
  toast.error(err instanceof Error? err.message: 'AI resume rewrite failed.', { id: toastId });
  } finally {
  setIsRewritingResume(false);
  }
  };

  const importFromUploadedCv = async (target: 'experience' | 'education') => {
  if (isImportingFromCv) return;
  setIsImportingFromCv(true);
  const toastId = toast.loading(`Reading your uploaded CV to fill ${target}...`);

  try {
  const supabase = createSupabaseBrowserClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) throw new Error('Please sign in to import from your CV.');

  const { data: profileRow } = await supabase
  .from('profiles')
  .select('id')
  .or(`auth_user_id.eq.${authData.user.id},id.eq.${authData.user.id}`)
  .maybeSingle();

  const candidateIds = [profileRow?.id, authData.user.id].filter(Boolean) as string[];
  const { data: extrasRow } = await supabase
  .from('candidate_profiles')
  .select('resume_url')
  .in('user_id', candidateIds)
  .order('updated_at', { ascending: false })
  .limit(1)
  .maybeSingle();

  if (!extrasRow?.resume_url) {
  throw new Error('Upload a CV in profile completion first, then come back here to import.');
  }

  const resumePath = String(extrasRow.resume_url);
  let signedUrl = resumePath;
  if (!/^https?:\/\//i.test(resumePath)) {
  const { url } = await applicationsService.getApplicationFileSignedUrl(resumePath);
  if (!url) throw new Error('Could not access your uploaded CV.');
  signedUrl = url;
  }

  toast.loading('Extracting text from your CV...', { id: toastId });
  const downloadResponse = await fetch(signedUrl);
  if (!downloadResponse.ok) throw new Error('Could not download your uploaded CV.');
  const blob = await downloadResponse.blob();
  const file = new File([blob], 'uploaded-cv', { type: blob.type || 'application/pdf' });
  const { text } = await extractResumeText(file);
  if (!text || !text.trim()) throw new Error('No readable text found in your uploaded CV.');

  toast.loading(`AI is parsing your ${target}...`, { id: toastId });
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) throw new Error('Please sign in again to import.');

  const aiResponse = await fetch('/api/ai/parse-resume', {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${sessionData.session.access_token}`,
  },
  body: JSON.stringify({
  rawResumeText: text,
  }),
  });

  const rawAi = await aiResponse.text();
  let aiPayload: any = {};
  try {
  aiPayload = rawAi ? JSON.parse(rawAi) : {};
  } catch {
  throw new Error('AI parse returned an invalid response.');
  }

  if (!aiResponse.ok) {
  throw new Error(aiPayload?.error || 'AI could not parse your CV.');
  }

  const parsed = aiPayload?.resumeData || {};

  if (target === 'experience') {
  const newExperience: WorkExperience[] = Array.isArray(parsed.experience)
  ? parsed.experience.map((exp: any, index: number) => ({
  id: `${Date.now()}-exp-${index}`,
  jobTitle: cleanBrokenText(String(exp.jobTitle || '')),
  companyName: cleanBrokenText(String(exp.companyName || '')),
  city: cleanBrokenText(String(exp.city || '')),
  state: cleanBrokenText(String(exp.state || '')),
  startDate: cleanBrokenText(String(exp.startDate || '')),
  endDate: cleanBrokenText(String(exp.endDate || '')),
  isCurrentJob: Boolean(exp.isCurrentJob),
  description: Array.isArray(exp.description)
  ? exp.description.map((line: any) => cleanBrokenText(String(line || ''))).filter(Boolean)
  : [],
  }))
  : [];

  if (newExperience.length === 0) {
  toast.error('No work experience found in your uploaded CV. Add it manually.', { id: toastId });
  return;
  }

  setResumeData(prev => ({ ...prev, experience: newExperience }));
  toast.success(`Imported ${newExperience.length} work experience entr${newExperience.length === 1 ? 'y' : 'ies'} from your CV.`, { id: toastId });
  return;
  }

  if (target === 'education') {
  const newEducation: Education[] = Array.isArray(parsed.education)
  ? parsed.education.map((edu: any, index: number) => ({
  id: `${Date.now()}-edu-${index}`,
  degree: cleanBrokenText(String(edu.degree || '')),
  university: cleanBrokenText(String(edu.university || '')),
  city: cleanBrokenText(String(edu.city || '')),
  state: cleanBrokenText(String(edu.state || '')),
  graduationDate: cleanBrokenText(String(edu.graduationDate || '')),
  gpa: cleanBrokenText(String(edu.gpa || '')),
  }))
  : [];

  if (newEducation.length === 0) {
  toast.error('No education found in your uploaded CV. Add it manually.', { id: toastId });
  return;
  }

  setResumeData(prev => ({ ...prev, education: newEducation }));
  toast.success(`Imported ${newEducation.length} education entr${newEducation.length === 1 ? 'y' : 'ies'} from your CV.`, { id: toastId });
  return;
  }
  } catch (err) {
  console.error('Import from uploaded CV failed:', err);
  toast.error(err instanceof Error ? err.message : 'Could not import from your uploaded CV.', { id: toastId });
  } finally {
  setIsImportingFromCv(false);
  }
  };

 const fixResumeWithHireVify = async () => {
 setIsFixingResumeWithAI(true);
 const toastId = toast.loading('HireVify is analyzing and fixing your resume...');

 try {
 const supabase = createSupabaseBrowserClient();
 const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

 if (sessionError ||!sessionData.session?.access_token) {
 throw new Error('No active Supabase login found. Please login again.');
 }

 const response = await fetch('/api/ai/rewrite-resume', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${sessionData.session.access_token}`
 },
 body: JSON.stringify({
 resumeData,
 atsScore,
 atsChecks
 })
 });

 const rawResponse = await response.text();
 let data: any = {};

 try {
 data = rawResponse? JSON.parse(rawResponse): {};
 } catch {
 throw new Error('HireVify AI returned an invalid response.');
 }

 if (!response.ok) {
 throw new Error(data?.error || 'HireVify AI failed to fix the resume.');
 }

 const fixed = data?.fixedResume || {};

 const fixedSummary = cleanBrokenText(String(fixed.summary || resumeData.summary || ''));

 const fixedExperience: WorkExperience[] = Array.isArray(fixed.experience)? fixed.experience.map((exp: any, index: number) => {
 const oldExp = resumeData.experience[index];

 return {
 id: String(exp.id || oldExp?.id || `${Date.now()}-${index}`),
 jobTitle: cleanBrokenText(String(exp.jobTitle || oldExp?.jobTitle || '')),
 companyName: cleanBrokenText(String(exp.companyName || oldExp?.companyName || '')),
 city: cleanBrokenText(String(exp.city || oldExp?.city || '')),
 state: cleanBrokenText(String(exp.state || oldExp?.state || '')),
 startDate: cleanBrokenText(String(exp.startDate || oldExp?.startDate || '')),
 endDate: cleanBrokenText(String(exp.endDate || oldExp?.endDate || '')),
 isCurrentJob: Boolean(exp.isCurrentJob?? oldExp?.isCurrentJob?? false),
 description: Array.isArray(exp.description)? exp.description.map((line: any) => cleanBrokenText(String(line || ''))).filter(Boolean): oldExp?.description || []
 };
 }): resumeData.experience;

 const fixedEducation: Education[] = Array.isArray(fixed.education)? fixed.education.map((edu: any, index: number) => {
 const oldEdu = resumeData.education[index];

 return {
 id: String(edu.id || oldEdu?.id || `${Date.now()}-edu-${index}`),
 degree: cleanBrokenText(String(edu.degree || oldEdu?.degree || '')),
 university: cleanBrokenText(String(edu.university || oldEdu?.university || '')),
 city: cleanBrokenText(String(edu.city || oldEdu?.city || '')),
 state: cleanBrokenText(String(edu.state || oldEdu?.state || '')),
 graduationDate: cleanBrokenText(String(edu.graduationDate || oldEdu?.graduationDate || '')),
 gpa: cleanBrokenText(String(edu.gpa || oldEdu?.gpa || ''))
 };
 }): resumeData.education;

 const fixedSkills: Skill[] = Array.isArray(fixed.skills)? fixed.skills.map((skill: any) => ({
 name: cleanBrokenText(String(skill.name || '')),
 category: ['technical', 'soft', 'language'].includes(skill.category)? skill.category: 'technical',
 proficiency: ['beginner', 'intermediate', 'advanced', 'expert'].includes(skill.proficiency)? skill.proficiency: 'intermediate'
 })).filter((skill: Skill) => skill.name.length > 0): resumeData.skills;

 setResumeData(prev => ({...prev,
 summary: fixedSummary || prev.summary,
 experience: fixedExperience,
 education: fixedEducation,
 skills: fixedSkills
 }));

 toast.success('HireVify fixed your resume. Review and download the new version.', { id: toastId });
 setCurrentStep('review');
 } catch (err: any) {
 console.error('HireVify resume fix failed:', err);
 toast.error(err instanceof Error? err.message: 'HireVify AI failed to fix the resume.', { id: toastId });
 } finally {
 setIsFixingResumeWithAI(false);
 }
 };

 const updateContactInfo = (field: keyof ContactInfo, value: string) => {
 setResumeData(prev => ({...prev,
 contactInfo: {...prev.contactInfo, [field]: value }
 }));
 };

 const addExperience = () => {
 const newExperience: WorkExperience = {
 id: Date.now().toString(),
 jobTitle: '',
 companyName: '',
 city: '',
 state: '',
 startDate: '',
 endDate: '',
 isCurrentJob: false,
 description: ['']
 };
 setResumeData(prev => ({...prev,
 experience: [...prev.experience, newExperience]
 }));
 };

 const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
 setResumeData(prev => ({...prev,
 experience: prev.experience.map(exp =>
 exp.id === id? {...exp, [field]: value }: exp
 )
 }));
 };

 const removeExperience = (id: string) => {
 setResumeData(prev => ({...prev,
 experience: prev.experience.filter(exp => exp.id!== id)
 }));
 };

 const addEducation = () => {
 const newEducation: Education = {
 id: Date.now().toString(),
 degree: '',
 university: '',
 city: '',
 state: '',
 graduationDate: ''
 };
 setResumeData(prev => ({...prev,
 education: [...prev.education, newEducation]
 }));
 };

 const updateEducation = (id: string, field: keyof Education, value: string) => {
 setResumeData(prev => ({...prev,
 education: prev.education.map(edu =>
 edu.id === id? {...edu, [field]: value }: edu
 )
 }));
 };

 const removeEducation = (id: string) => {
 setResumeData(prev => ({...prev,
 education: prev.education.filter(edu => edu.id!== id)
 }));
 };

 const addSkill = (name: string, category: 'technical' | 'soft' | 'language') => {
 const newSkill: Skill = {
 name: cleanBrokenText(name),
 category,
 proficiency: 'intermediate'
 };
 setResumeData(prev => ({...prev,
 skills: [...prev.skills, newSkill]
 }));
 };

 const removeSkill = (index: number) => {
 setResumeData(prev => ({...prev,
 skills: prev.skills.filter((_, i) => i!== index)
 }));
 };

 const renderStepContent = () => {
 // Show profile loading overlay while fetching from Supabase
 if (isLoadingProfile && ['contact', 'summary', 'skills'].includes(currentStep)) {
 return (
 <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
 <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
 <p className="text-lg font-medium">Loading your profile...</p>
 <p className="text-sm mt-1">Fetching your saved data from HireVify</p>
 </div>
 );
 }

 switch (currentStep) {
 case 'welcome':
 return (
 <div className="max-w-2xl mx-auto text-center py-12">
 <div className="mb-8">
 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <FileText className="w-8 h-8 text-primary" />
 </div>
 <h1 className="text-4xl font-bold text-foreground mb-4">
 Create Your Perfect Resume
 </h1>
 <p className="text-lg text-muted-foreground mb-8">
 Build an ATS-friendly resume in minutes with our professional templates and built-in compatibility checker.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
 <div className="text-center">
 <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
 <Check className="w-6 h-6 text-success" />
 </div>
 <h3 className="font-semibold mb-2">ATS-Optimized</h3>
 <p className="text-sm text-muted-foreground">Designed to pass applicant tracking systems</p>
 </div>
 <div className="text-center">
 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
 <Zap className="w-6 h-6 text-primary" />
 </div>
 <h3 className="font-semibold mb-2">Professional Templates</h3>
 <p className="text-sm text-muted-foreground">Choose from expertly designed layouts</p>
 </div>
 <div className="text-center">
 <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-3">
 <Star className="w-6 h-6 text-warning" />
 </div>
 <h3 className="font-semibold mb-2">Live Preview</h3>
 <p className="text-sm text-muted-foreground">See your resume update in real-time</p>
 </div>
 </div>

 <Button size="lg" onClick={nextStep} className="px-8">
 Start Building Your Resume
 <ArrowRight className="w-5 h-5 ml-2" />
 </Button>
 </div>
 );

 case 'template':
 return (
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-8">
 <h2 className="text-3xl font-bold text-foreground mb-4">Choose Your Template</h2>
 <p className="text-lg text-muted-foreground">
 Select a professional template that matches your industry and style
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {templates.map((template) => (
 <Card
 key={template.id}
 className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
 resumeData.template === template.id? 'ring-2 ring-primary border-primary': ''
 }`}
 onClick={() => setResumeData(prev => ({...prev, template: template.id as any }))}
 >
 <CardContent className="p-6">
 <div className="aspect-[3/4] bg-muted rounded-lg mb-4 flex items-center justify-center">
 <FileText className="w-16 h-16 text-muted-foreground" />
 </div>
 <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
 <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
 <div className="space-y-1">
 {template.features.map((feature, index) => (
 <div key={index} className="flex items-center text-xs text-muted-foreground">
 <Check className="w-3 h-3 text-primary mr-2" />
 {feature}
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 );

 case 'contact':
 return (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div>
 <h2 className="text-2xl font-bold text-foreground mb-6">Contact Information</h2>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-2">Full Name *</label>
 <Input
 value={resumeData.contactInfo.fullName}
 onChange={(e) => updateContactInfo('fullName', e.target.value)}
 placeholder="John Doe"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">Email Address *</label>
 <Input
 type="email"
 value={resumeData.contactInfo.email}
 onChange={(e) => updateContactInfo('email', e.target.value)}
 placeholder="john.doe@email.com"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">Phone Number *</label>
 <Input
 type="tel"
 value={resumeData.contactInfo.phone}
 onChange={(e) => updateContactInfo('phone', e.target.value)}
 placeholder="(555) 123-4567"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">Location</label>
 <Input
 value={resumeData.contactInfo.location}
 onChange={(e) => updateContactInfo('location', e.target.value)}
 placeholder="City, State"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">Link URL</label>
 <Input
 value={resumeData.contactInfo.linkedinUrl}
 onChange={(e) => updateContactInfo('linkedinUrl', e.target.value)}
 placeholder="Link.com/in/johndoe"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">Portfolio URL</label>
 <Input
 value={resumeData.contactInfo.portfolioUrl}
 onChange={(e) => updateContactInfo('portfolioUrl', e.target.value)}
 placeholder="johndoe.com"
 />
 </div>
 </div>
 </div>
 <div className="lg:block hidden">
 <ResumePreview resumeData={resumeData} />
 </div>
 </div>
 );

 // SUMMARY STEP - now with AI Generate button 
 case 'summary':
 return (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div>
 <h2 className="text-2xl font-bold text-foreground mb-6">Professional Summary</h2>
 <div className="space-y-4">
 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="text-sm font-medium">Summary</label>
 <Button
 size="sm"
 variant="outline"
 onClick={generateSummary}
 disabled={isGeneratingSummary}
 className="text-primary border-primary/30 hover:bg-primary/5"
 >
 {isGeneratingSummary? (
 <>
 <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
 Generating...
 </>
 ): (
 <>
 <Sparkles className="w-3.5 h-3.5 mr-1.5" />
 Generate with AI
 </>
 )}
 </Button>
 </div>
 <Textarea
 value={resumeData.summary}
 onChange={(e) => setResumeData(prev => ({...prev, summary: e.target.value }))}
 placeholder="Write a compelling 2-3 sentence summary highlighting your key qualifications and career objectives, or click Generate with AI above..."
 rows={6}
 />
 <p className="text-sm text-muted-foreground mt-2">
 Tip: Use action words and quantifiable achievements. Focus on what makes you unique.
 </p>
 </div>
 </div>
 </div>
 <div className="lg:block hidden">
 <ResumePreview resumeData={resumeData} />
 </div>
 </div>
 );

case 'experience':
  return (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <div>
  <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
  <h2 className="text-2xl font-bold text-foreground">Work Experience</h2>
  <div className="flex flex-wrap gap-2">
  <Button
  variant="outline"
  onClick={() => importFromUploadedCv('experience')}
  disabled={isImportingFromCv}
  >
  <Sparkles className="mr-2 h-4 w-4" />
  Import from my CV
  </Button>
  <Button onClick={addExperience}>Add Experience</Button>
  </div>
  </div>
 <div className="space-y-6">
 {resumeData.experience.map((exp) => (
 <Card key={exp.id}>
 <CardContent className="p-4">
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div>
 <label className="block text-sm font-medium mb-1">Job Title *</label>
 <Input
 value={exp.jobTitle}
 onChange={(e) => updateExperience(exp.id, 'jobTitle', e.target.value)}
 placeholder="Software Engineer"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Company *</label>
 <Input
 value={exp.companyName}
 onChange={(e) => updateExperience(exp.id, 'companyName', e.target.value)}
 placeholder="Company Name"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Start Date *</label>
 <Input
 type="month"
 value={exp.startDate}
 onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">End Date</label>
 <Input
 type="month"
 value={exp.endDate}
 onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
 disabled={exp.isCurrentJob}
 placeholder={exp.isCurrentJob? 'Present': ''}
 />
 </div>
 </div>
 <div className="mb-4">
 <label className="flex items-center">
 <input
 type="checkbox"
 checked={exp.isCurrentJob}
 onChange={(e) => updateExperience(exp.id, 'isCurrentJob', e.target.checked)}
 className="mr-2"
 />
 <span className="text-sm">I currently work here</span>
 </label>
 </div>
 <div className="mb-4">
 <label className="block text-sm font-medium mb-1">Description</label>
 <Textarea
 value={exp.description.join('\n')}
 onChange={(e) => updateExperience(exp.id, 'description', e.target.value.split('\n'))}
 placeholder=" Developed and maintained web applications&#10; Collaborated with cross-functional teams&#10; Improved performance by 30%"
 rows={4}
 />
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => removeExperience(exp.id)}
 className="text-red-600 hover:text-red-700"
 >
 Remove
 </Button>
 </CardContent>
 </Card>
 ))}
 {resumeData.experience.length === 0 && (
 <div className="text-center py-8 text-muted-foreground">
 <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
 <p>No work experience added yet</p>
 <Button onClick={addExperience} className="mt-4">Add Your First Job</Button>
 </div>
 )}
 </div>
 </div>
 <div className="lg:block hidden">
 <ResumePreview resumeData={resumeData} />
 </div>
 </div>
 );

 case 'skills':
 return (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div>
 <h2 className="text-2xl font-bold text-foreground mb-6">Skills</h2>
 <div className="space-y-6">
 <SkillsInput
 skills={resumeData.skills}
 onAddSkill={addSkill}
 onRemoveSkill={removeSkill}
 />
 </div>
 </div>
 <div className="lg:block hidden">
 <ResumePreview resumeData={resumeData} />
 </div>
 </div>
 );

case 'education':
  return (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <div>
  <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
  <h2 className="text-2xl font-bold text-foreground">Education</h2>
  <div className="flex flex-wrap gap-2">
  <Button
  variant="outline"
  onClick={() => importFromUploadedCv('education')}
  disabled={isImportingFromCv}
  >
  <Sparkles className="mr-2 h-4 w-4" />
  Import from my CV
  </Button>
  <Button onClick={addEducation}>Add Education</Button>
  </div>
  </div>
 <div className="space-y-6">
 {resumeData.education.map((edu) => (
 <Card key={edu.id}>
 <CardContent className="p-4">
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div>
 <label className="block text-sm font-medium mb-1">Degree *</label>
 <Input
 value={edu.degree}
 onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
 placeholder="Bachelor of Science in Computer Science"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">University *</label>
 <Input
 value={edu.university}
 onChange={(e) => updateEducation(edu.id, 'university', e.target.value)}
 placeholder="University Name"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Graduation Date</label>
 <Input
 type="month"
 value={edu.graduationDate}
 onChange={(e) => updateEducation(edu.id, 'graduationDate', e.target.value)}
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">GPA (Optional)</label>
 <Input
 value={edu.gpa || ''}
 onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
 placeholder="3.8"
 />
 </div>
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => removeEducation(edu.id)}
 className="text-red-600 hover:text-red-700"
 >
 Remove
 </Button>
 </CardContent>
 </Card>
 ))}
 {resumeData.education.length === 0 && (
 <div className="text-center py-8 text-muted-foreground">
 <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
 <p>No education added yet</p>
 <Button onClick={addEducation} className="mt-4">Add Education</Button>
 </div>
 )}
 </div>
 </div>
 <div className="lg:block hidden">
 <ResumePreview resumeData={resumeData} />
 </div>
 </div>
 );

 // REVIEW STEP - ref on preview div for PDF capture 
 case 'review':
 return (
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-8">
 <h2 className="text-3xl font-bold text-foreground mb-4">Review Your Resume</h2>
 <p className="text-lg text-muted-foreground">
 Take a final look at your resume before downloading or checking ATS compatibility
 </p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* ref captures this div for PDF export */}
 <div className="lg:col-span-2" ref={resumePreviewRef}>
 <ResumePreview resumeData={resumeData} showFullPreview />
 </div>
 <div className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center">
 <CheckCircle className="w-5 h-5 text-primary mr-2" />
 Resume Complete
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <Button
 onClick={downloadResume}
 className="w-full"
 size="lg"
 disabled={isDownloading}
 >
 {isDownloading? (
 <Loader2 className="w-5 h-5 mr-2 animate-spin" />
 ): (
 <Download className="w-5 h-5 mr-2" />
 )}
 {isDownloading? 'Generating PDF...': 'Download Resume'}
 </Button>
 <Button onClick={runATSCheck} variant="outline" className="w-full" size="lg">
 <Zap className="w-5 h-5 mr-2" />
 Check ATS Compatibility
 </Button>
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle>Resume Summary</CardTitle>
 </CardHeader>
 <CardContent className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Template:</span>
 <span className="font-medium capitalize">{resumeData.template}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Work Experience:</span>
 <span className="font-medium">{resumeData.experience.length} entries</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Education:</span>
 <span className="font-medium">{resumeData.education.length} entries</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Skills:</span>
 <span className="font-medium">{resumeData.skills.length} skills</span>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );

 case 'ats-report':
 return <ATSReport atsScore={atsScore} atsChecks={atsChecks} onDownload={handleFinishAndSaveCV}
 onEditResume={() => setCurrentStep('review')}
 onFixResumeWithHireVify={fixResumeWithHireVify}
 isFixingResumeWithAI={isFixingResumeWithAI} onUpgrade={onUpgrade} />;

 default:
 return null;
 }
 };

 if (currentStep === 'welcome') {
 return (
 <div className="hv-page-shell">
 <header className="hv-dashboard-header">
 <div className="hv-container flex items-center justify-between py-4">
 <div className="flex items-center gap-3">
 <Button variant="ghost" onClick={onBack} className="rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950">
 <ArrowLeft className="w-4 h-4 mr-2" />
 Back to Dashboard
 </Button>
 <img src={(hirevifyLogo as any).src?? hirevifyLogo} alt="HireVify" className="h-12" />
 </div>
 </div>
 </header>
 <main className="px-4 py-8 sm:px-6 lg:px-8">
 {renderStepContent()}
 </main>
 </div>
 );
 }

 if (currentStep === 'ats-report') {
 return (
 <div className="hv-page-shell">
 <header className="hv-dashboard-header">
 <div className="hv-container flex items-center justify-between py-4">
 <div className="flex items-center gap-3">
 <Button variant="ghost" onClick={() => setCurrentStep('review')} className="rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950">
 <ArrowLeft className="w-4 h-4 mr-2" />
 Back to Review
 </Button>
 <img src={(hirevifyLogo as any).src?? hirevifyLogo} alt="HireVify" className="h-12" />
 </div>
 </div>
 </header>
 <main className="px-4 py-8 sm:px-6 lg:px-8">
 {renderStepContent()}
 </main>
 </div>
 );
 }

 return (
 <div className="hv-page-shell pb-24">
 {/* Header with Progress */}
 <header className="hv-dashboard-header">
 <div className="hv-container py-4">
 <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-center gap-3">
 <Button variant="ghost" onClick={currentStep === 'template'? onBack: prevStep} className="rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950">
 <ArrowLeft className="w-4 h-4 mr-2" />
 {currentStep === 'template'? 'Back to Dashboard': 'Previous'}
 </Button>
 <img src={(hirevifyLogo as any).src?? hirevifyLogo} alt="HireVify" className="h-12" />
 </div>
 <div className="flex items-center gap-3">
 <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
 Step {getCurrentStepIndex() + 1} of {steps.length}
 </span>
 </div>
 </div>

 <div className="space-y-2">
 <div className="flex justify-between text-sm text-slate-600">
 <span className="font-medium text-slate-800">Resume Builder Progress</span>
 <span className="font-semibold text-emerald-700">{Math.round(progress)}%</span>
 </div>
 <Progress value={progress} className="h-2" />
 <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pt-2">
 {steps.map((step, index) => {
 const isActive = step.id === currentStep;
 const isComplete = index < getCurrentStepIndex();

 return (
 <button
 key={step.id}
 type="button"
 onClick={() => setCurrentStep(step.id)}
 className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
 isActive? 'border-emerald-300 bg-emerald-50 text-emerald-800': isComplete? 'border-slate-200 bg-white text-slate-700': 'border-slate-200 bg-white/70 text-slate-500'
 }`}
 >
 <step.icon className="h-3.5 w-3.5" />
 {step.title}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 </header>

 {/* Main Content */}
 <main className="px-4 py-6 sm:px-6 lg:px-8">
 <div className="mx-auto max-w-7xl">
 {renderStepContent()}
 </div>
 </main>

 {/* Footer Navigation */}
 {!['welcome', 'ats-report'].includes(currentStep as string) && (
 <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:p-4">
 <div className="mx-auto flex max-w-7xl justify-between gap-3">
 <Button variant="outline" onClick={prevStep} disabled={currentStep === 'template'}>
 <ArrowLeft className="w-4 h-4 mr-2" />
 Previous
 </Button>
 <Button onClick={currentStep === 'review'? handleFinishAndSaveCV: nextStep} disabled={isDownloading} className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">
 {currentStep === 'review'? (isDownloading? 'Saving CV...': 'Finish & Save CV'): 'Save & Continue'}
 <ArrowRight className="w-4 h-4 ml-2" />
 </Button>
 </div>
 </footer>
 )}
 </div>
 );
}

// Resume Preview Component (unchanged) 
function ResumePreview({ resumeData, showFullPreview = false }: { resumeData: ResumeData; showFullPreview?: boolean }) {
 const contactInfo = resumeData.contactInfo as any;

 const fullName = cleanBrokenText(
 [contactInfo.firstName, contactInfo.lastName].filter(Boolean).join(' ')
 ) || 'Your Name';

 const email = cleanBrokenText(contactInfo.email || '');
 const phone = cleanBrokenText(contactInfo.phone || '');
 const location = cleanBrokenText(
 contactInfo.location ||
 [contactInfo.city, contactInfo.state, contactInfo.country].filter(Boolean).join(', ')
 );

 const summary = cleanBrokenText(resumeData.summary || '');

 const experience = Array.isArray(resumeData.experience)? resumeData.experience.filter((exp) =>
 exp.jobTitle || exp.companyName || exp.startDate || exp.endDate || exp.description?.length
 ): [];

 const education = Array.isArray(resumeData.education)? resumeData.education.filter((edu) =>
 edu.degree || edu.university || edu.graduationDate
 ): [];

 const skills = Array.isArray(resumeData.skills)? resumeData.skills.filter((skill) => skill.name): [];

 const formatDateRange = (startDate?: string, endDate?: string, isCurrentJob?: boolean) => {
 const start = cleanBrokenText(startDate || '');
 const end = isCurrentJob? 'Present': cleanBrokenText(endDate || '');
 return [start, end].filter(Boolean).join(' - ');
 };

 const contactItems = [email, phone, location].filter(Boolean);

 const SectionTitle = ({ children }: { children: React.ReactNode }) => (
 <h3 className="text-sm font-bold uppercase tracking-normal text-slate-900 border-b border-slate-300 pb-1 mb-3">
 {children}
 </h3>
 );

 const ExperienceList = () => (
 <>
 {experience.map((exp, index) => (
 <div key={exp.id || index} className="mb-5">
 <div className="flex items-start justify-between gap-4">
 <div>
 <h4 className="font-bold text-slate-900">
 {cleanBrokenText(exp.jobTitle || 'Role Title')}
 </h4>
 <p className="text-sm font-medium text-slate-700">
 {cleanBrokenText(exp.companyName || 'Company')}
 {[exp.city, exp.state].filter(Boolean).length > 0? ` - ${[exp.city, exp.state].filter(Boolean).map((item) => cleanBrokenText(item)).join(', ')}`: ''}
 </p>
 </div>
 <p className="text-xs text-slate-600 whitespace-nowrap">
 {formatDateRange(exp.startDate, exp.endDate, exp.isCurrentJob)}
 </p>
 </div>

 {Array.isArray(exp.description) && exp.description.length > 0 && (
 <ul className="mt-2 space-y-1 text-sm text-slate-700">
 {exp.description.map((item, itemIndex) => (
 <li key={itemIndex} className="flex gap-2">
 <span>-</span>
 <span>{cleanBrokenText(item)}</span>
 </li>
 ))}
 </ul>
 )}
 </div>
 ))}
 </>
 );

 const EducationList = () => (
 <>
 {education.map((edu, index) => (
 <div key={edu.id || index} className="mb-4">
 <h4 className="font-bold text-slate-900">{cleanBrokenText(edu.degree || 'Degree')}</h4>
 <p className="text-sm text-slate-700">{cleanBrokenText(edu.university || 'Institution')}</p>
 <p className="text-xs text-slate-600">
 {[edu.city, edu.state, edu.graduationDate].filter(Boolean).map((item) => cleanBrokenText(item)).join(' - ')}
 </p>
 {edu.gpa && <p className="text-xs text-slate-600">GPA: {cleanBrokenText(edu.gpa)}</p>}
 </div>
 ))}
 </>
 );

 const SkillsList = ({ compact = false }: { compact?: boolean }) => (
 <div className={compact? 'flex flex-wrap gap-1.5': 'flex flex-wrap gap-2'}>
 {skills.map((skill, index) => (
 <span
 key={`${skill.name}-${index}`}
 className={compact? 'text-xs border border-slate-300 px-2 py-1 rounded': 'text-sm bg-slate-100 border border-slate-200 px-3 py-1 rounded-full'}
 >
 {cleanBrokenText(skill.name)}
 </span>
 ))}
 </div>
 );

 if (resumeData.template === 'modern') {
 return (
 <div data-resume-template="modern" className="bg-white text-slate-900 shadow-sm border border-slate-200 max-w-4xl mx-auto">
 <div className="grid grid-cols-12 min-h-[900px]">
 <aside className="col-span-4 bg-slate-900 text-white p-8">
 <h1 className="text-3xl font-bold leading-tight mb-3">{fullName}</h1>
 <div className="space-y-1 text-sm text-slate-200 mb-8">
 {contactItems.map((item, index) => (
 <p key={index}>{item}</p>
 ))}
 </div>

 {skills.length > 0 && (
 <section className="mb-8">
 <h3 className="text-xs font-bold uppercase tracking-normal border-b border-slate-500 pb-2 mb-3">
 Skills
 </h3>
 <div className="space-y-2">
 {skills.map((skill, index) => (
 <p key={`${skill.name}-${index}`} className="text-sm text-slate-100">
 {cleanBrokenText(skill.name)}
 </p>
 ))}
 </div>
 </section>
 )}

 {education.length > 0 && (
 <section>
 <h3 className="text-xs font-bold uppercase tracking-normal border-b border-slate-500 pb-2 mb-3">
 Education
 </h3>
 {education.map((edu, index) => (
 <div key={edu.id || index} className="mb-4">
 <p className="text-sm font-bold">{cleanBrokenText(edu.degree || 'Degree')}</p>
 <p className="text-xs text-slate-200">{cleanBrokenText(edu.university || 'Institution')}</p>
 <p className="text-xs text-slate-300">{cleanBrokenText(edu.graduationDate || '')}</p>
 </div>
 ))}
 </section>
 )}
 </aside>

 <main className="col-span-8 p-8">
 {summary && (
 <section className="mb-8">
 <SectionTitle>Professional Summary</SectionTitle>
 <p className="text-sm leading-7 text-slate-700">{summary}</p>
 </section>
 )}

 {experience.length > 0 && (
 <section>
 <SectionTitle>Work Experience</SectionTitle>
 <ExperienceList />
 </section>
 )}
 </main>
 </div>
 </div>
 );
 }

 if (resumeData.template === 'minimalist') {
 return (
 <div className="bg-white text-slate-900 border border-slate-200 max-w-4xl mx-auto p-10">
 <header className="mb-8">
 <h1 className="text-4xl font-light tracking-normal">{fullName}</h1>
 <p className="text-sm text-slate-600 mt-2">{contactItems.join(' | ')}</p>
 </header>

 {summary && (
 <section className="mb-7">
 <h3 className="text-base font-semibold mb-2">Summary</h3>
 <p className="text-sm leading-7 text-slate-700">{summary}</p>
 </section>
 )}

 {experience.length > 0 && (
 <section className="mb-7">
 <h3 className="text-base font-semibold border-t border-slate-200 pt-4 mb-4">Experience</h3>
 <ExperienceList />
 </section>
 )}

 {education.length > 0 && (
 <section className="mb-7">
 <h3 className="text-base font-semibold border-t border-slate-200 pt-4 mb-4">Education</h3>
 <EducationList />
 </section>
 )}

 {skills.length > 0 && (
 <section>
 <h3 className="text-base font-semibold border-t border-slate-200 pt-4 mb-4">Skills</h3>
 <SkillsList compact />
 </section>
 )}
 </div>
 );
 }

 return (
 <div className="bg-white text-slate-900 border border-slate-200 max-w-4xl mx-auto p-10">
 <header className="text-center mb-8">
 <h1 className="text-3xl font-bold">{fullName}</h1>
 <p className="text-sm text-slate-600 mt-2">{contactItems.join(' | ')}</p>
 </header>

 {summary && (
 <section className="mb-7">
 <SectionTitle>Professional Summary</SectionTitle>
 <p className="text-sm leading-7 text-slate-700">{summary}</p>
 </section>
 )}

 {experience.length > 0 && (
 <section className="mb-7">
 <SectionTitle>Work Experience</SectionTitle>
 <ExperienceList />
 </section>
 )}

 {education.length > 0 && (
 <section className="mb-7">
 <SectionTitle>Education</SectionTitle>
 <EducationList />
 </section>
 )}

 {skills.length > 0 && (
 <section>
 <SectionTitle>Skills</SectionTitle>
 <SkillsList />
 </section>
 )}
 </div>
 );
}

function SkillsInput({
 skills,
 onAddSkill,
 onRemoveSkill
}: {
 skills: Skill[];
 onAddSkill: (name: string, category: 'technical' | 'soft' | 'language') => void;
 onRemoveSkill: (index: number) => void;
}) {
 const [newSkillName, setNewSkillName] = useState('');
 const [newSkillCategory, setNewSkillCategory] = useState<'technical' | 'soft' | 'language'>('technical');

 const handleAddSkill = () => {
 if (newSkillName.trim()) {
 onAddSkill(cleanBrokenText(newSkillName), newSkillCategory);
 setNewSkillName('');
 }
 };

 const skillsByCategory = {
 technical: skills.filter(s => s.category === 'technical'),
 soft: skills.filter(s => s.category === 'soft'),
 language: skills.filter(s => s.category === 'language')
 };

 return (
 <div className="space-y-6">
 <div className="flex gap-2">
 <Input
 value={newSkillName}
 onChange={(e) => setNewSkillName(e.target.value)}
 placeholder="Add a skill..."
 onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
 />
 <Select value={newSkillCategory} onValueChange={(value: any) => setNewSkillCategory(value)}>
 <SelectTrigger className="w-40">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="technical">Technical</SelectItem>
 <SelectItem value="soft">Soft Skills</SelectItem>
 <SelectItem value="language">Language</SelectItem>
 </SelectContent>
 </Select>
 <Button onClick={handleAddSkill}>Add</Button>
 </div>

 {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
 categorySkills.length > 0 && (
 <div key={category}>
 <h4 className="font-medium mb-2 capitalize">{category} Skills</h4>
 <div className="flex flex-wrap gap-2">
 {categorySkills.map((skill, index) => {
 const originalIndex = skills.findIndex(s => s === skill);
 return (
 <Badge key={index} variant="secondary" className="flex items-center gap-2">
 {skill.name}
 <button
 onClick={() => onRemoveSkill(originalIndex)}
 className="text-muted-foreground hover:text-red-600"
 >
 <X className="w-3 h-3" />
 </button>
 </Badge>
 );
 })}
 </div>
 </div>
 )
 ))}

 {skills.length === 0 && (
 <div className="text-center py-8 text-muted-foreground">
 <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
 <p>No skills added yet</p>
 </div>
 )}
 </div>
 );
}

// ATS Report Component (unchanged) 
function ATSReport({
 atsScore,
 atsChecks,
 onDownload,
 onEditResume,
 onFixResumeWithHireVify,
 isFixingResumeWithAI,
 onUpgrade
}: {
 atsScore: number;
 atsChecks: ATSCheck[];
 onDownload: () => void;
 onEditResume: () => void;
 onFixResumeWithHireVify: () => void;
 isFixingResumeWithAI: boolean;
 onUpgrade: () => void;
}) {
 const getScoreColor = (score: number) => {
 if (score >= 90) return 'text-green-600';
 if (score >= 75) return 'text-yellow-600';
 return 'text-red-600';
 };

 const getScoreBackground = (score: number) => {
 if (score >= 90) return 'bg-green-100';
 if (score >= 75) return 'bg-yellow-100';
 return 'bg-red-100';
 };

 const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
 switch (status) {
 case 'pass': return <CheckCircle className="w-5 h-5 text-green-600" />;
 case 'fail': return <X className="w-5 h-5 text-red-600" />;
 case 'warning': return <Zap className="w-5 h-5 text-yellow-600" />;
 }
 };

 return (
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-8">
 <h1 className="text-3xl font-bold text-foreground mb-4">ATS Compatibility Report</h1>
 <p className="text-lg text-muted-foreground">
 Your resume has been analyzed for Applicant Tracking System compatibility
 </p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-6">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center">
 <Star className="w-6 h-6 text-primary mr-2" />
 Overall ATS Score
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className={`text-center p-6 rounded-lg ${getScoreBackground(atsScore)}`}>
 <div className={`text-4xl font-bold ${getScoreColor(atsScore)} mb-2`}>
 {atsScore}%
 </div>
 <p className="text-muted-foreground">
 {atsScore >= 90? 'Excellent': atsScore >= 75? 'Good': 'Needs Improvement'}
 </p>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle>Detailed Analysis</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 {atsChecks.map((check) => (
 <div key={check.id} className="flex items-start gap-4 p-4 border border-border rounded-lg">
 <div className="flex-shrink-0">{getStatusIcon(check.status)}</div>
 <div className="flex-1">
 <h4 className="font-medium text-foreground mb-1">{check.name}</h4>
 <p className="text-sm text-muted-foreground mb-2">{check.description}</p>
 {check.recommendation && (
 <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
 <strong>Tip:</strong> {check.recommendation}
 </p>
 )}
 </div>
 </div>
 ))}
 </CardContent>
 </Card>
 </div>

 <div className="space-y-6">
 <Card>
 <CardHeader><CardTitle>Next Steps</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <Button onClick={onDownload} className="w-full" size="lg">
 <Download className="w-5 h-5 mr-2" />
 Download Resume
 </Button>
 <Button onClick={onEditResume} variant="outline" className="w-full">
 <ArrowLeft className="w-5 h-5 mr-2" />
 Edit Resume
 </Button>
 <Button
 onClick={onFixResumeWithHireVify}
 className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
 size="lg"
 disabled={isFixingResumeWithAI}
 >
 {isFixingResumeWithAI? (
 <Loader2 className="w-5 h-5 mr-2 animate-spin" />
 ): (
 <Sparkles className="w-5 h-5 mr-2" />
 )}
 {isFixingResumeWithAI? 'Analyzing and fixing...': 'Fix Your Resume with HireVify'}
 </Button>
 </CardContent>
 </Card>

 <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
 <CardHeader>
 <CardTitle className="flex items-center text-yellow-800">
 <Crown className="w-5 h-5 mr-2" />
 Unlock Premium Features
 </CardTitle>
 </CardHeader>
 <CardContent>
 <ul className="space-y-2 text-sm text-yellow-700 mb-4">
 <li className="flex items-center"><Check className="w-4 h-4 mr-2" />AI-Powered Keyword Optimization</li>
 <li className="flex items-center"><Check className="w-4 h-4 mr-2" />Industry-Specific Templates</li>
 <li className="flex items-center"><Check className="w-4 h-4 mr-2" />Advanced ATS Analysis</li>
 <li className="flex items-center"><Check className="w-4 h-4 mr-2" />Custom Formatting Options</li>
 </ul>
 <Button onClick={onUpgrade} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
 Upgrade Now
 </Button>
 </CardContent>
 </Card>

 <Card>
 <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
 <CardContent className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Passed Checks:</span>
 <span className="font-medium text-green-600">{atsChecks.filter(c => c.status === 'pass').length}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Warnings:</span>
 <span className="font-medium text-yellow-600">{atsChecks.filter(c => c.status === 'warning').length}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Failed Checks:</span>
 <span className="font-medium text-red-600">{atsChecks.filter(c => c.status === 'fail').length}</span>
 </div>
 <Separator className="my-2" />
 <div className="flex justify-between">
 <span className="text-muted-foreground">Overall Score:</span>
 <span className={`font-bold ${getScoreColor(atsScore)}`}>{atsScore}%</span>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );
}































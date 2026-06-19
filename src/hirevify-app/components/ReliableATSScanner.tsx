/**
 * Reliable ATS Scanner - Simple, Fast, and Effective
 * 
 * This component focuses on delivering consistent results with real resumes.
 * It uses a simplified parsing approach that prioritizes reliability over complexity.
 */

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
 ArrowLeft,
 Upload, 
 FileText, 
 User, 
 Mail, 
 Phone, 
 MapPin, 
 Briefcase, 
 GraduationCap,
 Award,
 ExternalLink,
 CheckCircle,
 XCircle,
 AlertTriangle,
 Target,
 Zap,
 Download,
 Copy,
 RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { dashboardTheme } from '../theme/dashboardTheme';
import { ReliableDocumentParser, type ReliableResumeData } from '../utils/ats/reliableDocumentParser';
import { functionalDocumentParser } from '../utils/ats/functionalDocumentParser';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { useAuth } from './AuthProvider';

interface ReliableATSScannerProps {
 onBack?: () => void;
 userType?: 'recruiter' | 'candidate';
}

interface ScanResult {
 fileName: string;
 data: ReliableResumeData;
 processingTime: number;
 rawText: string;
}

interface JobOption {
 id: string;
 title: string;
 description: string;
 requirements: string[];
 skills: string[];
 company?: string;
}

interface RankedResumeResult extends ScanResult {
 matchScore: number;
 matchedKeywords: string[];
 missingKeywords: string[];
}

type ResumeTemplate = 'professional' | 'modern' | 'minimalist';

interface OptimizedResumeData {
 template: ResumeTemplate;
 contactInfo: {
 fullName: string;
 email: string;
 phone: string;
 linkedinUrl: string;
 portfolioUrl: string;
 location: string;
 };
 summary: string;
 experience: Array<{
 id: string;
 jobTitle: string;
 companyName: string;
 city: string;
 state: string;
 startDate: string;
 endDate: string;
 isCurrentJob: boolean;
 description: string[];
 }>;
 skills: Array<{
 name: string;
 category: 'technical' | 'soft' | 'language';
 proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
 }>;
 education: Array<{
 id: string;
 degree: string;
 university: string;
 city: string;
 state: string;
 graduationDate: string;
 gpa?: string;
 }>;
}

export function ReliableATSScanner({ onBack, userType = 'candidate' }: ReliableATSScannerProps) {
 const { user } = useAuth();
 const [isProcessing, setIsProcessing] = useState(false);
 const [progress, setProgress] = useState(0);
 const [scanResult, setScanResult] = useState<ScanResult | null>(null);
 const [rankedResults, setRankedResults] = useState<RankedResumeResult[]>([]);
 const [error, setError] = useState<string | null>(null);
 const [uploadedFile, setUploadedFile] = useState<File | null>(null);
 const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
 const [jobs, setJobs] = useState<JobOption[]>([]);
 const [selectedJobId, setSelectedJobId] = useState('');
 const [isLoadingJobs, setIsLoadingJobs] = useState(false);
 const [jobDescription, setJobDescription] = useState('');
 const [optimizedCvText, setOptimizedCvText] = useState('');
 const [optimizedResumeData, setOptimizedResumeData] = useState<OptimizedResumeData | null>(null);
 const [isOptimizingCv, setIsOptimizingCv] = useState(false);
 const [isDownloadingOptimizedCv, setIsDownloadingOptimizedCv] = useState(false);
 const [isSavingPrimaryCv, setIsSavingPrimaryCv] = useState(false);
 const [activeTab, setActiveTab] = useState('personal');
 const fileInputRef = useRef<HTMLInputElement>(null);
 const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) || null, [jobs, selectedJobId]);
 const isBulkJobScanner = userType === 'recruiter';
 const isCandidateOptimizer = userType === 'candidate';

 useEffect(() => {
 if (!isBulkJobScanner) return;

 const loadJobs = async () => {
 try {
 setIsLoadingJobs(true);
 const supabase = createSupabaseBrowserClient();
 const { data, error } = await supabase
 .from('jobs')
 .select('id, title, description, requirements, skills, status, recruiter_profile:recruiter_id(company_name)')
 .eq('status', 'published')
 .order('created_at', { ascending: false });

 if (error) {
 throw new Error(error.message);
 }

 const mapped = (data || []).map((job: any) => ({
 id: job.id,
 title: job.title || 'Untitled job',
 description: job.description || '',
 requirements: Array.isArray(job.requirements) ? job.requirements : [],
 skills: Array.isArray(job.skills) ? job.skills : [],
 company: job.recruiter_profile?.company_name || 'Recruiter',
 }));

 setJobs(mapped);
 setSelectedJobId((current) => current || mapped[0]?.id || '');
 } catch (error) {
 console.error('Failed to load jobs for ATS scanner:', error);
 toast.error(error instanceof Error ? error.message : 'Failed to load jobs.');
 setJobs([]);
 } finally {
 setIsLoadingJobs(false);
 }
 };

 loadJobs();
 }, [isBulkJobScanner]);

 const normalizeKeyword = (value: string) => value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ').replace(/\s+/g, ' ').trim();

 const extractJobKeywords = (job: JobOption) => {
 const source = [
 job.title,
 job.description,
 ...job.requirements,
 ...job.skills,
 ];

 const stopWords = new Set([
 'and', 'or', 'the', 'with', 'for', 'from', 'this', 'that', 'will', 'must', 'have', 'has', 'are', 'you', 'your',
 'job', 'role', 'candidate', 'experience', 'work', 'team', 'project', 'requirements', 'skills', 'years',
 ]);

 return Array.from(
 new Set(
 source
 .flatMap((item) => normalizeKeyword(String(item || '')).split(/[,;|/()]|\s+-\s+|\n/))
 .flatMap((item) => item.split(/\s+/))
 .map((item) => item.trim())
 .filter((item) => item.length >= 2 && !stopWords.has(item)),
 ),
 ).slice(0, 80);
 };

 const resumeToText = (data: ReliableResumeData, rawText: string) => normalizeKeyword([
 rawText,
 data.personalInfo.name,
 data.professionalSummary,
 ...data.skills.technical,
 ...data.skills.soft,
 ...data.skills.tools,
 ...data.skills.languages,
 ...data.experience.map((item) => `${item.position} ${item.company} ${item.description}`),
 ...data.education.map((item) => `${item.degree} ${item.institution}`),
 ].join(' '));

 const calculateJobMatch = (data: ReliableResumeData, rawText: string, job: JobOption) => {
 const resumeText = resumeToText(data, rawText);
 const requiredSkills = job.skills.map(normalizeKeyword).filter(Boolean);
 const jobKeywords = extractJobKeywords(job);
 const allKeywords = Array.from(new Set([...requiredSkills, ...jobKeywords]));
 const matchedKeywords = allKeywords.filter((keyword) => resumeText.includes(keyword));
 const missingKeywords = allKeywords.filter((keyword) => !resumeText.includes(keyword));
 const requiredMatches = requiredSkills.filter((keyword) => resumeText.includes(keyword)).length;
 const requiredScore = requiredSkills.length > 0 ? (requiredMatches / requiredSkills.length) * 70 : 35;
 const keywordScore = allKeywords.length > 0 ? (matchedKeywords.length / allKeywords.length) * 30 : 0;

 return {
 matchScore: Math.min(100, Math.round(requiredScore + keywordScore)),
 matchedKeywords: matchedKeywords.slice(0, 18),
 missingKeywords: missingKeywords.slice(0, 18),
 };
 };

 const readRawTextPreview = async (file: File) => {
 try {
 const reader = new FileReader();
 return await new Promise<string>((resolve, reject) => {
 const timeout = setTimeout(() => {
 reader.abort();
 reject(new Error('Timeout'));
 }, 5000);

 reader.onload = (event) => {
 clearTimeout(timeout);
 resolve(event.target?.result as string || '');
 };
 reader.onerror = () => {
 clearTimeout(timeout);
 reject(new Error('Failed to read file'));
 };
 reader.readAsText(file);
 });
 } catch {
 return '';
 }
 };

 const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
 const selectedFiles = Array.from(event.target.files || []);
 const files = isBulkJobScanner ? selectedFiles : selectedFiles.slice(0, 1);
 if (files.length === 0) return;

 // Simple file validation
 const maxSize = 10 * 1024 * 1024; // 10MB
 const tooLarge = files.find((file) => file.size > maxSize);
 if (tooLarge) {
 setError('File too large. Maximum size is 10MB.');
 return;
 }

 setUploadedFile(files[0]);
 setUploadedFiles(files);
 setError(null);
 setScanResult(null);
 setRankedResults([]);
 setOptimizedCvText('');
 
 toast.success(isBulkJobScanner
 ? `${files.length} file${files.length === 1 ? '' : 's'} ready for processing`
 : '1 CV ready for processing');
 };

 const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
 event.preventDefault();
 event.stopPropagation();

 const files = Array.from(event.dataTransfer.files);
 const acceptedFiles = isBulkJobScanner ? files : files.slice(0, 1);
 if (acceptedFiles.length > 0) {
 if (fileInputRef.current) {
 const dataTransfer = new DataTransfer();
 acceptedFiles.forEach((file) => dataTransfer.items.add(file));
 fileInputRef.current.files = dataTransfer.files;
 handleFileSelect({ target: { files: dataTransfer.files } } as any);
 }
 }
 };

 const processBulkResumes = async () => {
 if (!selectedJob) {
 setError('Please choose a job first.');
 return;
 }

 if (uploadedFiles.length === 0) {
 setError('Please select one or more CVs to scan.');
 return;
 }

 setIsProcessing(true);
 setError(null);
 setProgress(0);
 setRankedResults([]);
 setScanResult(null);

 try {
 const parser = new ReliableDocumentParser();
 const results: RankedResumeResult[] = [];

 for (let index = 0; index < uploadedFiles.length; index += 1) {
 const file = uploadedFiles[index];
 const startTime = Date.now();
 setProgress(Math.round((index / uploadedFiles.length) * 90));

 const parsed = await parser.parseDocument(file);
 const rawText = await readRawTextPreview(file);
 const match = calculateJobMatch(parsed, rawText, selectedJob);

 results.push({
 fileName: file.name,
 data: parsed,
 processingTime: Date.now() - startTime,
 rawText,
 ...match,
 });
 }

 const ranked = results.sort((a, b) => b.matchScore - a.matchScore);
 setRankedResults(ranked);
 setScanResult(ranked[0] || null);
 setProgress(100);
 toast.success(`Ranked ${ranked.length} CV${ranked.length === 1 ? '' : 's'} for ${selectedJob.title}`);
 } catch (error: any) {
 console.error('Bulk ATS scan failed:', error);
 const message = error?.message || 'Failed to scan uploaded CVs.';
 setError(message);
 toast.error('Bulk scan failed', { description: message });
 } finally {
 setIsProcessing(false);
 setProgress(0);
 }
 };

 const generateOptimizedCvText = () => {
 if (!scanResult) return '';

 const data = scanResult.data;
 const jdKeywords = normalizeKeyword(jobDescription)
 .split(/\s+/)
 .filter((keyword) => keyword.length > 2)
 .filter((keyword, index, all) => all.indexOf(keyword) === index)
 .slice(0, 30);
 const resumeText = resumeToText(data, scanResult.rawText);
 const missingKeywords = jdKeywords.filter((keyword) => !resumeText.includes(keyword)).slice(0, 12);
 const technicalSkills = Array.from(new Set([...data.skills.technical, ...data.skills.tools, ...missingKeywords]));

 return [
 data.personalInfo.name,
 [data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].filter(Boolean).join(' | '),
 '',
 'TARGETED PROFESSIONAL SUMMARY',
 data.professionalSummary !== 'Professional summary not found'
 ? data.professionalSummary
 : 'Candidate profile aligned to the pasted job description with relevant skills, measurable experience, and ATS-friendly keywords.',
 missingKeywords.length > 0
 ? `Additional role keywords to emphasize naturally: ${missingKeywords.join(', ')}.`
 : 'The resume already includes strong overlap with the pasted job description.',
 '',
 'CORE SKILLS',
 technicalSkills.filter(Boolean).join(', ') || 'Add role-specific technical skills from the job description.',
 '',
 'EXPERIENCE',
 ...(data.experience.length > 0
 ? data.experience.flatMap((item) => [
 `${item.position} - ${item.company}`,
 [item.startDate, item.endDate || 'Present'].filter(Boolean).join(' - '),
 item.description || 'Rewrite this bullet with measurable impact and job-relevant keywords.',
 '',
 ])
 : ['Add recent experience with measurable achievements tied to the pasted job description.', '']),
 'EDUCATION',
 ...(data.education.length > 0
 ? data.education.map((item) => `${item.degree} - ${item.institution}${item.graduationDate ? ` (${item.graduationDate})` : ''}`)
 : ['Add education details relevant to the role.']),
 '',
 'ATS NOTES',
 `Use these missing or important job terms only where truthful: ${missingKeywords.join(', ') || 'No major missing keywords detected.'}`,
 ].join('\n');
 };

 const optimizeCandidateCv = async () => {
 if (!scanResult) {
 setError('Upload and scan your CV first.');
 return;
 }

 if (!jobDescription.trim()) {
 setError('Paste a job description before optimizing your CV.');
 return;
 }

 setIsOptimizingCv(true);
 setError(null);

 try {
 const optimized = generateOptimizedCvText();
 setOptimizedCvText(optimized);
 toast.success('AI CV rewrite draft generated.');
 } finally {
 setIsOptimizingCv(false);
 }
 };

 const downloadOptimizedCv = () => {
 if (!optimizedCvText.trim()) return;

 const blob = new Blob([optimizedCvText], { type: 'text/plain;charset=utf-8' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = 'hirevify-optimized-cv.txt';
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(url);
 };

 const setAsPrimaryCv = async () => {
 if (!user?.id) {
 toast.error('Please sign in to save your primary CV.');
 return;
 }

 if (!optimizedCvText.trim()) {
 setError('Generate the optimized CV before setting it as primary.');
 return;
 }

 setIsSavingPrimaryCv(true);
 setError(null);

 try {
 const supabase = createSupabaseBrowserClient();
 const blob = new Blob([optimizedCvText], { type: 'text/plain;charset=utf-8' });
 const path = `resumes/${user.id}/hirevify-primary-cv-${Date.now()}.txt`;
 const { error: uploadError } = await supabase.storage.from('make-d4feca44-resumes').upload(path, blob, {
 contentType: 'text/plain;charset=utf-8',
 upsert: true,
 });

 if (uploadError) {
 throw new Error(uploadError.message);
 }

 const { data: urlData } = supabase.storage.from('make-d4feca44-resumes').getPublicUrl(path);
 const resumeUrl = urlData.publicUrl;
 const { data: existingProfile, error: existingError } = await supabase
 .from('candidate_profiles')
 .select('id')
 .eq('user_id', user.id)
 .maybeSingle();

 if (existingError) {
 throw new Error(existingError.message);
 }

 const result = existingProfile?.id
 ? await supabase.from('candidate_profiles').update({ resume_url: resumeUrl }).eq('id', existingProfile.id)
 : await supabase.from('candidate_profiles').insert({ user_id: user.id, resume_url: resumeUrl });

 if (result.error) {
 throw new Error(result.error.message);
 }

 toast.success('Optimized CV set as your HireVify primary CV.');
 } catch (error) {
 console.error('Failed to set primary CV:', error);
 toast.error(error instanceof Error ? error.message : 'Could not set primary CV.');
 } finally {
 setIsSavingPrimaryCv(false);
 }
 };

 const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
 event.preventDefault();
 event.stopPropagation();
 };

 const processResume = async () => {
 if (!uploadedFile) {
 setError('Please select a file to process');
 return;
 }

 setIsProcessing(true);
 setError(null);
 setProgress(0);
 
 const startTime = Date.now();

 try {
 console.log('Starting resume processing for:', uploadedFile.name);
 
 // Show progress - File validation
 setProgress(10);
 await new Promise(resolve => setTimeout(resolve, 100));
 
 // Initialize parser
 setProgress(20);
 const parser = new ReliableDocumentParser();
 
 // Parse document
 setProgress(30);
 console.log('Parsing document...');
 const result = await parser.parseDocument(uploadedFile);
 
 setProgress(70);
 console.log('Document parsed successfully');

 // Get raw text for display (optional, don't fail if this doesn't work)
 setProgress(80);
 let rawText = 'Raw text preview not available';
 try {
 const reader = new FileReader();
 rawText = await new Promise<string>((resolve, reject) => {
 const timeout = setTimeout(() => {
 reader.abort();
 reject(new Error('Timeout'));
 }, 5000);
 
 reader.onload = (e) => {
 clearTimeout(timeout);
 resolve(e.target?.result as string || '');
 };
 reader.onerror = () => {
 clearTimeout(timeout);
 reject(new Error('Failed to read file'));
 };
 reader.readAsText(uploadedFile);
 });
 } catch (rawTextError) {
 console.warn('Could not get raw text preview:', rawTextError);
 // Don't fail the whole process for this
 }

 const processingTime = Date.now() - startTime;

 const scanResult = {
 fileName: uploadedFile.name,
 data: result,
 processingTime,
 rawText
 };

 setScanResult(scanResult);
 setProgress(100);
 
 console.log('Resume processing completed in', processingTime, 'ms');
 toast.success(`Resume processed successfully in ${processingTime}ms!`);
 
 } catch (error: any) {
 console.error('Resume processing error:', error);
 
 let errorMessage = error.message || 'Failed to process resume';
 
 // Provide more helpful error messages
 if (errorMessage.includes('binary data')) {
 errorMessage = 'This file format is not supported. Please save your resume as a.txt file and try again.';
 } else if (errorMessage.includes('insufficient')) {
 errorMessage = 'The file appears to be empty or contains very little text. Please check that your resume has content.';
 } else if (errorMessage.includes('corrupted')) {
 errorMessage = 'The file appears to be corrupted. Please try saving your resume as a.txt file.';
 } else if (errorMessage.includes('size')) {
 errorMessage = 'File is too large. Please try with a smaller file (under 10MB).';
 }
 
 setError(errorMessage);
 toast.error('Processing failed', {
 description: errorMessage
 });
 } finally {
 setIsProcessing(false);
 setProgress(0);
 }
 };

 const reset = () => {
 setUploadedFile(null);
 setUploadedFiles([]);
 setScanResult(null);
 setRankedResults([]);
 setError(null);
 setProgress(0);
 if (fileInputRef.current) {
 fileInputRef.current.value = '';
 }
 };

 const downloadResults = () => {
 if (!scanResult) return;

 const results = {
 fileName: scanResult.fileName,
 processingTime: scanResult.processingTime,
 extractedData: scanResult.data,
 timestamp: new Date().toISOString()
 };

 const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `ats-scan-${scanResult.fileName}.json`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 };

 const copyToClipboard = (text: string) => {
 navigator.clipboard.writeText(text);
 toast.success('Copied to clipboard');
 };

 const getConfidenceColor = (score: number) => {
 if (score >= 80) return 'text-green-600';
 if (score >= 60) return 'text-yellow-600';
 return 'text-red-600';
 };

 const getConfidenceBadge = (score: number) => {
 if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
 if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
 return 'bg-red-100 text-red-800 border-red-200';
 };

 return (
 <div className={`${dashboardTheme.page} px-4 py-5 sm:px-6 lg:px-8`}>
 <div className="mx-auto max-w-6xl space-y-6">
 {/* Header */}
 <Card className="border-slate-200/80 bg-white/95 shadow-sm">
 <CardHeader>
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div className="flex items-start gap-3">
 {onBack && (
 <Button
 type="button"
 variant="ghost"
 size="icon"
 onClick={onBack}
 aria-label="Back to dashboard"
 className="mt-1 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950"
 >
 <ArrowLeft className="h-5 w-5" />
 </Button>
 )}
 <div>
 <CardTitle className="flex items-center gap-2 text-2xl text-slate-950">
 <Target className="h-6 w-6 text-emerald-600" />
 {userType === 'recruiter'? 'Recruiter ATS Scanner': 'Resume ATS Scanner'}
 </CardTitle>
 <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
 Upload a real resume to extract structured data, inspect confidence, and export the scan results.
 </p>
 </div>
 </div>
 </div>
 </CardHeader>
 </Card>

 {isBulkJobScanner && (
 <Card className="border-slate-200/80 bg-white/95 shadow-sm">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Briefcase className="h-5 w-5 text-emerald-600" />
 1. Choose Job
 </CardTitle>
 <p className="text-sm text-slate-600">
 Select the job description first. Uploaded CVs will be ranked against this exact role.
 </p>
 </CardHeader>
 <CardContent className="space-y-4">
 {isLoadingJobs ? (
 <div className={dashboardTheme.loadingState}>Loading published jobs...</div>
 ) : jobs.length === 0 ? (
 <div className={dashboardTheme.emptyState}>No published jobs are available for matching yet.</div>
 ) : (
 <>
 <select
 value={selectedJobId}
 onChange={(event) => {
 setSelectedJobId(event.target.value);
 setRankedResults([]);
 setScanResult(null);
 }}
 className={dashboardTheme.select}
 >
 {jobs.map((job) => (
 <option key={job.id} value={job.id}>
 {job.title} - {job.company}
 </option>
 ))}
 </select>
 {selectedJob && (
 <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
 <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <h3 className="font-semibold text-slate-950">{selectedJob.title}</h3>
 <p className="mt-1 line-clamp-2 text-sm text-slate-600">{selectedJob.description || 'No description saved.'}</p>
 </div>
 <Badge className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700">
 {selectedJob.skills.length} skills
 </Badge>
 </div>
 {selectedJob.skills.length > 0 && (
 <div className="mt-3 flex flex-wrap gap-2">
 {selectedJob.skills.slice(0, 12).map((skill) => (
 <Badge key={skill} variant="secondary">{skill}</Badge>
 ))}
 </div>
 )}
 </div>
 )}
 </>
 )}
 </CardContent>
 </Card>
 )}

 {isCandidateOptimizer && (
 <Card className="border-slate-200/80 bg-white/95 shadow-sm">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Briefcase className="h-5 w-5 text-emerald-600" />
 Paste Job Description
 </CardTitle>
 <p className="text-sm text-slate-600">
 Upload one CV, paste a target job description, then generate an ATS-focused rewrite.
 </p>
 </CardHeader>
 <CardContent>
 <textarea
 value={jobDescription}
 onChange={(event) => setJobDescription(event.target.value)}
 placeholder="Paste the job description here..."
 rows={7}
 className={dashboardTheme.textarea}
 />
 </CardContent>
 </Card>
 )}

 {/* Upload Section */}
 <Card className="border-slate-200/80 bg-white/95 shadow-sm">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Upload className="h-5 w-5" />
 {isBulkJobScanner ? '2. Upload CVs' : 'Upload One CV'}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div
 className="cursor-pointer rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50 sm:p-8"
 onDrop={handleDrop}
 onDragOver={handleDragOver}
 onClick={() => fileInputRef.current?.click()}
 >
 <Upload className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
 <p className="text-lg font-medium mb-2">
 {uploadedFiles.length > 0
 ? `${uploadedFiles.length} CV${uploadedFiles.length === 1 ? '' : 's'} selected`
 : isBulkJobScanner
 ? 'Drop CVs here or click to browse'
 : 'Drop your resume here or click to browse'}
 </p>
 <p className="text-sm text-muted-foreground mb-4">
 Best with.TXT files. Also tries.PDF,.DOC, and.DOCX. Max 10MB per file.
 </p>
 {uploadedFiles.length > 0 && (
 <div className="mx-auto mb-4 max-w-2xl rounded-xl border border-slate-200 bg-white p-3 text-left">
 <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Selected files</p>
 <div className="max-h-28 space-y-1 overflow-y-auto text-sm text-slate-700">
 {uploadedFiles.map((file) => (
 <div key={`${file.name}-${file.size}`} className="truncate">{file.name}</div>
 ))}
 </div>
 </div>
 )}
 
 <input
 ref={fileInputRef}
 type="file"
 accept=".txt,.pdf,.doc,.docx"
 multiple={isBulkJobScanner}
 onChange={handleFileSelect}
 className="hidden"
 />
 
 <div className="flex flex-col justify-center gap-2 sm:flex-row">
 <Button
 onClick={() => fileInputRef.current?.click()}
 variant="outline"
 size="sm"
 >
 <FileText className="h-4 w-4 mr-2" />
 Choose File
 </Button>
 
 {uploadedFiles.length > 0 && (
 <Button
 onClick={isBulkJobScanner ? processBulkResumes : processResume}
 disabled={isProcessing || (isBulkJobScanner && !selectedJob)}
 size="sm"
 >
 {isProcessing? (
 <>
 <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
 Processing...
 </>
 ): (
 <>
 <Zap className="h-4 w-4 mr-2" />
 {isBulkJobScanner ? `Rank ${uploadedFiles.length} CV${uploadedFiles.length === 1 ? '' : 's'}` : 'Scan Resume'}
 </>
 )}
 </Button>
 )}
 
 {(uploadedFile || scanResult) && (
 <Button
 onClick={reset}
 variant="outline"
 size="sm"
 >
 Reset
 </Button>
 )}
 </div>
 </div>

 {/* Progress Bar */}
 {isProcessing && (
 <div className="mt-4">
 <Progress value={progress} className="h-2" />
 <p className="text-center text-sm text-muted-foreground mt-2">
 {isBulkJobScanner ? 'Ranking CVs' : 'Processing resume'}... {progress}%
 </p>
 </div>
 )}

 {/* Error Display */}
 {error && (
 <Alert className="mt-4 border-red-200 bg-red-50">
 <XCircle className="h-4 w-4 text-red-600" />
 <AlertDescription className="text-red-800">
 {error}
 </AlertDescription>
 </Alert>
 )}
 </CardContent>
 </Card>

 {isCandidateOptimizer && scanResult && (
 <Card className="border-slate-200/80 bg-white/95 shadow-sm">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Zap className="h-5 w-5 text-emerald-600" />
 AI CV Rewrite
 </CardTitle>
 <p className="text-sm text-slate-600">
 Generate a truthful, ATS-friendly text CV from your uploaded CV and pasted job description.
 </p>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="flex flex-wrap gap-2">
 <Button onClick={optimizeCandidateCv} disabled={isOptimizingCv || !jobDescription.trim()}>
 {isOptimizingCv ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
 Change CV with AI
 </Button>
 <Button variant="outline" onClick={downloadOptimizedCv} disabled={!optimizedCvText.trim()}>
 <Download className="mr-2 h-4 w-4" />
 Download
 </Button>
 <Button variant="outline" onClick={setAsPrimaryCv} disabled={!optimizedCvText.trim() || isSavingPrimaryCv}>
 {isSavingPrimaryCv ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
 Set as My HireVify Primary CV
 </Button>
 </div>
 <textarea
 value={optimizedCvText}
 onChange={(event) => setOptimizedCvText(event.target.value)}
 placeholder="Your AI-optimized CV draft will appear here."
 rows={16}
 className={dashboardTheme.textarea}
 />
 </CardContent>
 </Card>
 )}

 {rankedResults.length > 0 && selectedJob && (
 <Card className="border-slate-200/80 bg-white/95 shadow-sm">
 <CardHeader>
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <CardTitle className="flex items-center gap-2">
 <Award className="h-5 w-5 text-emerald-600" />
 Best Matching CVs
 </CardTitle>
 <p className="mt-1 text-sm text-slate-600">
 Showing CVs at or above 70%. If fewer qualify, the strongest matches remain ranked at the top.
 </p>
 </div>
 <Badge className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700">
 {selectedJob.title}
 </Badge>
 </div>
 </CardHeader>
 <CardContent>
 <div className="overflow-hidden rounded-xl border border-slate-200">
 <div className="grid grid-cols-[64px_minmax(0,1fr)_96px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
 <span>Rank</span>
 <span>CV</span>
 <span className="text-right">Match</span>
 </div>
 {rankedResults
 .filter((result, _index, all) => result.matchScore >= 70 || all.filter((item) => item.matchScore >= 70).length === 0)
 .slice(0, 10)
 .map((result, index) => (
 <button
 key={`${result.fileName}-${result.processingTime}`}
 type="button"
 onClick={() => {
 setScanResult(result);
 setActiveTab('skills');
 }}
 className="grid w-full grid-cols-[64px_minmax(0,1fr)_96px] items-start gap-3 border-t border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50"
 >
 <span className="font-semibold text-slate-500">#{index + 1}</span>
 <span className="min-w-0">
 <span className="block truncate font-semibold text-slate-950">{result.fileName}</span>
 <span className="mt-1 block text-xs text-slate-500">
 Matched: {result.matchedKeywords.slice(0, 6).join(', ') || 'No exact keywords'}
 </span>
 {result.missingKeywords.length > 0 && (
 <span className="mt-1 block text-xs text-slate-400">
 Missing: {result.missingKeywords.slice(0, 5).join(', ')}
 </span>
 )}
 </span>
 <span className={`text-right text-lg font-bold ${result.matchScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
 {result.matchScore}%
 </span>
 </button>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {/* Results Section */}
 {scanResult && (
 <Card className="border-slate-200/80 bg-white/95 shadow-sm">
 <CardHeader>
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <CardTitle className="flex items-center gap-2">
 <CheckCircle className="h-5 w-5 text-green-600" />
 Extraction Results
 </CardTitle>
 <div className="flex flex-wrap items-center gap-2">
 <Badge className={getConfidenceBadge(scanResult.data.extractionMetadata.confidence)}>
 {scanResult.data.extractionMetadata.confidence}% Confidence
 </Badge>
 <Button onClick={downloadResults} variant="outline" size="sm">
 <Download className="h-4 w-4 mr-2" />
 Download
 </Button>
 </div>
 </div>
 <p className="text-sm text-muted-foreground">
 Processed in {scanResult.processingTime}ms using {scanResult.data.extractionMetadata.processingMethod}.
 </p>
 </CardHeader>
 <CardContent>
 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
 <TabsTrigger value="personal">Personal Info</TabsTrigger>
 <TabsTrigger value="experience">Experience</TabsTrigger>
 <TabsTrigger value="education">Education</TabsTrigger>
 <TabsTrigger value="skills">Skills</TabsTrigger>
 </TabsList>

 <TabsContent value="personal" className="space-y-4">
 <div className="grid gap-4 md:grid-cols-2">
 <div className="space-y-3">
 <div className="flex items-center gap-2">
 <User className="h-4 w-4 text-muted-foreground" />
 <span className="font-medium">Name:</span>
 <span>{scanResult.data.personalInfo.name}</span>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => copyToClipboard(scanResult.data.personalInfo.name)}
 >
 <Copy className="h-3 w-3" />
 </Button>
 </div>
 
 <div className="flex items-center gap-2">
 <Mail className="h-4 w-4 text-muted-foreground" />
 <span className="font-medium">Email:</span>
 <span>{scanResult.data.personalInfo.email}</span>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => copyToClipboard(scanResult.data.personalInfo.email)}
 >
 <Copy className="h-3 w-3" />
 </Button>
 </div>
 
 <div className="flex items-center gap-2">
 <Phone className="h-4 w-4 text-muted-foreground" />
 <span className="font-medium">Phone:</span>
 <span>{scanResult.data.personalInfo.phone}</span>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => copyToClipboard(scanResult.data.personalInfo.phone)}
 >
 <Copy className="h-3 w-3" />
 </Button>
 </div>
 
 <div className="flex items-center gap-2">
 <MapPin className="h-4 w-4 text-muted-foreground" />
 <span className="font-medium">Location:</span>
 <span>{scanResult.data.personalInfo.location}</span>
 </div>
 </div>
 
 <div className="space-y-3">
 {scanResult.data.personalInfo.Link && (
 <div className="flex items-center gap-2">
 <ExternalLink className="h-4 w-4 text-muted-foreground" />
 <span className="font-medium">Link:</span>
 <span className="text-blue-600">{scanResult.data.personalInfo.Link}</span>
 </div>
 )}
 
 {scanResult.data.personalInfo.GitBranch && (
 <div className="flex items-center gap-2">
 <ExternalLink className="h-4 w-4 text-muted-foreground" />
 <span className="font-medium">GitBranch:</span>
 <span className="text-blue-600">{scanResult.data.personalInfo.GitBranch}</span>
 </div>
 )}
 
 {scanResult.data.personalInfo.portfolio && (
 <div className="flex items-center gap-2">
 <ExternalLink className="h-4 w-4 text-muted-foreground" />
 <span className="font-medium">Portfolio:</span>
 <span className="text-blue-600">{scanResult.data.personalInfo.portfolio}</span>
 </div>
 )}
 </div>
 </div>
 
 {scanResult.data.professionalSummary!== 'Professional summary not found' && (
 <div className="mt-6">
 <h4 className="font-medium mb-2">Professional Summary</h4>
 <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
 {scanResult.data.professionalSummary}
 </p>
 </div>
 )}
 </TabsContent>

 <TabsContent value="experience" className="space-y-4">
 {scanResult.data.experience.length > 0? (
 scanResult.data.experience.map((exp, index) => (
 <Card key={exp.id} className="border-l-4 border-l-emerald-500">
 <CardContent className="pt-4">
 <div className="flex items-start justify-between mb-2">
 <div>
 <h4 className="font-semibold">{exp.position}</h4>
 <p className="text-muted-foreground">{exp.company}</p>
 </div>
 <Badge variant="outline">
 {exp.startDate} - {exp.endDate || 'Present'}
 </Badge>
 </div>
 {exp.description && (
 <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
 )}
 </CardContent>
 </Card>
 ))
 ): (
 <div className="text-center py-8">
 <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
 <p className="text-muted-foreground">No work experience found</p>
 </div>
 )}
 </TabsContent>

 <TabsContent value="education" className="space-y-4">
 {scanResult.data.education.length > 0? (
 scanResult.data.education.map((edu, index) => (
 <Card key={edu.id} className="border-l-4 border-l-green-500">
 <CardContent className="pt-4">
 <div className="flex items-start justify-between mb-2">
 <div>
 <h4 className="font-semibold">{edu.degree}</h4>
 <p className="text-muted-foreground">{edu.institution}</p>
 </div>
 {edu.graduationDate && (
 <Badge variant="outline">{edu.graduationDate}</Badge>
 )}
 </div>
 </CardContent>
 </Card>
 ))
 ): (
 <div className="text-center py-8">
 <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
 <p className="text-muted-foreground">No education information found</p>
 </div>
 )}
 </TabsContent>

 <TabsContent value="skills" className="space-y-4">
 <div className="grid md:grid-cols-2 gap-6">
 <div>
 <h4 className="font-medium mb-3">Technical Skills</h4>
 <div className="flex flex-wrap gap-2">
 {scanResult.data.skills.technical.length > 0? (
 scanResult.data.skills.technical.map((skill, index) => (
 <Badge key={index} variant="secondary">{skill}</Badge>
 ))
 ): (
 <p className="text-sm text-muted-foreground">None found</p>
 )}
 </div>
 </div>
 
 <div>
 <h4 className="font-medium mb-3">Soft Skills</h4>
 <div className="flex flex-wrap gap-2">
 {scanResult.data.skills.soft.length > 0? (
 scanResult.data.skills.soft.map((skill, index) => (
 <Badge key={index} variant="outline">{skill}</Badge>
 ))
 ): (
 <p className="text-sm text-muted-foreground">None found</p>
 )}
 </div>
 </div>
 
 <div>
 <h4 className="font-medium mb-3">Tools & Technologies</h4>
 <div className="flex flex-wrap gap-2">
 {scanResult.data.skills.tools.length > 0? (
 scanResult.data.skills.tools.map((tool, index) => (
 <Badge key={index} variant="secondary">{tool}</Badge>
 ))
 ): (
 <p className="text-sm text-muted-foreground">None found</p>
 )}
 </div>
 </div>
 
 <div>
 <h4 className="font-medium mb-3">Languages</h4>
 <div className="flex flex-wrap gap-2">
 {scanResult.data.skills.languages.length > 0? (
 scanResult.data.skills.languages.map((language, index) => (
 <Badge key={index} variant="outline">{language}</Badge>
 ))
 ): (
 <p className="text-sm text-muted-foreground">None found</p>
 )}
 </div>
 </div>
 </div>
 </TabsContent>
 </Tabs>
 </CardContent>
 </Card>
 )}
 
 {/* Tips Section */}
 <Card className="border-slate-200/80 bg-white/95 shadow-sm">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <AlertTriangle className="h-5 w-5 text-yellow-600" />
 Tips for Best Results
 </CardTitle>
 </CardHeader>
 <CardContent>
 <ul className="space-y-2 text-sm text-muted-foreground">
 <li><strong>Best format:</strong> Copy your resume content and save it as a.txt file.</li>
 <li><strong>File size:</strong> Keep files under 10MB for optimal performance.</li>
 <li><strong>Structure:</strong> Use clear section headers such as Experience, Education, and Skills.</li>
 <li><strong>Dates:</strong> Include years in YYYY format, for example 2020-2023.</li>
 <li><strong>Contact info:</strong> Include email, phone, and location clearly.</li>
 <li><strong>Having issues?</strong> Try the Professional ATS Scanner for advanced file support.</li>
 </ul>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}









import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Award, BookOpen, Briefcase, Building, CheckCircle, Clock, Download, FileText, MapPin, Play, Star, Target, Upload, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import { careerGrowthService, parseCareerGrowthReview, type CareerGrowthApplication, type CareerGrowthOpportunity, type CareerGrowthSubmission, type CareerGrowthType } from '../services/careerGrowthService';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';

interface CandidateGrowthPageProps {
 type: CareerGrowthType;
 title: string;
 eyebrow: string;
 description: string;
 badgeLabel: string;
 availableTabLabel: string;
 mineTabLabel: string;
 aboutTabLabel: string;
 searchPlaceholder: string;
 emptyAvailableLabel?: string;
 emptyMineLabel: string;
 applyLabel: string;
 appliedToastVerb: string;
 onBack: () => void;
}

function getDifficultyColor(difficulty?: string | null) {
 switch ((difficulty || '').toLowerCase()) {
 case 'beginner':
 case 'entry level':
 return 'bg-green-100 text-green-800 border-green-200';
 case 'intermediate':
 return 'bg-blue-100 text-blue-800 border-blue-200';
 case 'advanced':
 return 'bg-purple-100 text-purple-800 border-purple-200';
 default:
 return 'bg-gray-100 text-gray-800 border-gray-200';
 }
}

function getStatusBadge(status?: string) {
 switch (status) {
 case 'completed':
 return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
 case 'in_progress':
 return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
 case 'accepted':
 case 'assigned':
 return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Assigned</Badge>;
 case 'rejected':
 return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
 case 'withdrawn':
 return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Withdrawn</Badge>;
 default:
 return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Applied</Badge>;
 }
}

function getCategories(opportunities: CareerGrowthOpportunity[]) {
 const categories = opportunities.map((opportunity) => String(opportunity.metadata?.category || '').trim()).filter(Boolean);

 return ['All',...Array.from(new Set(categories))];
}

function matchesOpportunity(opportunity: CareerGrowthOpportunity, searchTerm: string, selectedCategory: string) {
 const search = searchTerm.trim().toLowerCase();
 const category = String(opportunity.metadata?.category || '');
 const matchesCategory = selectedCategory === 'All' || category === selectedCategory;

 if (!search) return matchesCategory;

 return (
 matchesCategory &&
 [
 opportunity.title,
 opportunity.description || '',
 opportunity.company_name || '',
 opportunity.location || '',...(opportunity.skills || []),
 ].some((value) => value.toLowerCase().includes(search))
 );
}

export function CandidateGrowthPage({
 type,
 title,
 eyebrow,
 description,
 badgeLabel,
 availableTabLabel,
 mineTabLabel,
 aboutTabLabel,
 searchPlaceholder,
 emptyAvailableLabel = 'No opportunities available yet.',
 emptyMineLabel,
 applyLabel,
 appliedToastVerb,
 onBack,
}: CandidateGrowthPageProps) {
 const { user } = useAuth();
 const [activeTab, setActiveTab] = useState('available');
 const [selectedCategory, setSelectedCategory] = useState('All');
 const [searchTerm, setSearchTerm] = useState('');
 const [opportunities, setOpportunities] = useState<CareerGrowthOpportunity[]>([]);
 const [applications, setApplications] = useState<CareerGrowthApplication[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [isApplyingId, setIsApplyingId] = useState<string | null>(null);
 const [submissions, setSubmissions] = useState<CareerGrowthSubmission[]>([]);
 const [submissionTextById, setSubmissionTextById] = useState<Record<string, string>>({});
 const [submissionUrlById, setSubmissionUrlById] = useState<Record<string, string>>({});
 const [submissionFileById, setSubmissionFileById] = useState<Record<string, File | null>>({});
 const [isSubmittingId, setIsSubmittingId] = useState<string | null>(null);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);

 const loadGrowthData = async () => {
 if (!user?.id) {
 setIsLoading(false);
 setErrorMessage('Please login to view career growth opportunities.');
 return;
 }

 setIsLoading(true);
 setErrorMessage(null);

 const [opportunityResult, applicationResult] = await Promise.all([
 careerGrowthService.getPublishedGrowthOpportunities(type),
 careerGrowthService.getCandidateGrowthApplications(user.id),
 ]);

 if (opportunityResult.error) {
 setErrorMessage(opportunityResult.error.message);
 }

 if (applicationResult.error) {
 setErrorMessage(applicationResult.error.message);
 }

 setOpportunities(opportunityResult.data);
 const filteredApplications = applicationResult.data.filter((application) => application.opportunity?.type === type);
 setApplications(filteredApplications);
 const submissionResult = await careerGrowthService.getSubmissionsForApplications(filteredApplications.map((application) => application.id));
 if (submissionResult.error) {
 toast.error(submissionResult.error.message);
 } else {
 setSubmissions(submissionResult.data);
 }
 setIsLoading(false);
 };

 useEffect(() => {
 void loadGrowthData();
 }, [type, user?.id]);

 const categories = useMemo(() => getCategories(opportunities), [opportunities]);
 const filteredOpportunities = useMemo(
 () => opportunities.filter((opportunity) => matchesOpportunity(opportunity, searchTerm, selectedCategory)),
 [opportunities, searchTerm, selectedCategory],
 );

 const getApplication = (opportunityId: string) => {
 return applications.find((application) => application.opportunity_id === opportunityId);
 };

 const getSubmission = (applicationId: string) => submissions.find((submission) => submission.application_id === applicationId);

 const getProgress = (application: CareerGrowthApplication) => {
 const submission = getSubmission(application.id);
 if (application.status === 'completed') return 100;
 if (submission || application.status === 'in_progress') return 66;
 if (['accepted', 'assigned', 'shortlisted'].includes(application.status)) return 33;
 return 12;
 };

 const handleSubmitWork = async (application: CareerGrowthApplication) => {
 const text = submissionTextById[application.id]?.trim() || '';
 const url = submissionUrlById[application.id]?.trim() || '';
 const file = submissionFileById[application.id] || null;

 if (!text && !url && !file) {
 toast.error('Add a project note, link, or file before submitting.');
 return;
 }

 setIsSubmittingId(application.id);
 try {
 let filePath: string | undefined;
 if (file) {
 const upload = await careerGrowthService.uploadCareerGrowthFile(application.candidate_profile_id, file);
 if (upload.error || !upload.path) throw new Error(upload.error?.message || 'Project upload failed.');
 filePath = upload.path;
 }

 const { error } = await careerGrowthService.submitCareerGrowthWork(application.id, {
 candidate_profile_id: application.candidate_profile_id,
 submission_text: text,
 submission_url: url,
 file_url: filePath,
 status: 'submitted',
 });

 if (error) throw new Error(error.message);
 await careerGrowthService.updateCareerGrowthApplicationStatus(application.id, 'in_progress');
 if (application.opportunity?.recruiter_id) {
 const supabase = createSupabaseBrowserClient();
 const { data: recruiterProfile } = await supabase
 .from('profiles')
 .select('auth_user_id')
 .eq('id', application.opportunity.recruiter_id)
 .maybeSingle();
 await supabase.from('notifications').insert({
 user_id: recruiterProfile?.auth_user_id || application.opportunity.recruiter_id,
 type: 'career_growth_submission',
 title: 'Project submitted',
 message: `Candidate submitted work for "${application.opportunity?.title || title}".`,
 data: { application_id: application.id, opportunity_id: application.opportunity_id, type },
 read: false,
 });
 }
 toast.success('Project submitted.');
 await loadGrowthData();
 } catch (error) {
 toast.error(error instanceof Error ? error.message : 'Could not submit project.');
 } finally {
 setIsSubmittingId(null);
 }
 };

 const downloadCertificate = async (application: CareerGrowthApplication) => {
 const review = parseCareerGrowthReview(application.recruiter_notes);
 const { jsPDF } = await import('jspdf');
 const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
 const name = user?.name || application.candidate_profile?.full_name || 'Student';
 const titleText = application.opportunity?.title || title;
 doc.setFillColor(245, 253, 250);
 doc.rect(0, 0, 842, 595, 'F');
 doc.setDrawColor(16, 185, 129);
 doc.setLineWidth(4);
 doc.rect(36, 36, 770, 523);
 doc.setFont('helvetica', 'bold');
 doc.setFontSize(34);
 doc.text('Certificate of Completion', 421, 150, { align: 'center' });
 doc.setFontSize(18);
 doc.setFont('helvetica', 'normal');
 doc.text('This certificate is awarded to', 421, 205, { align: 'center' });
 doc.setFont('helvetica', 'bold');
 doc.setFontSize(28);
 doc.text(name, 421, 250, { align: 'center' });
 doc.setFont('helvetica', 'normal');
 doc.setFontSize(16);
 doc.text(`for completing ${titleText}`, 421, 300, { align: 'center' });
 doc.text(`Score: ${review.score ?? 0}%`, 421, 335, { align: 'center' });
 doc.setFontSize(12);
 doc.text(`Issued by HireVify on ${new Date(review.certificateIssuedAt || Date.now()).toLocaleDateString()}`, 421, 430, { align: 'center' });
 doc.save(`${titleText.replace(/[^a-z0-9]+/gi, '_')}_certificate.pdf`);
 };

 const handleApply = async (opportunity: CareerGrowthOpportunity) => {
 if (!user?.id) {
 toast.error('Please login before applying.');
 return;
 }

 setIsApplyingId(opportunity.id);
 const { data, error } = await careerGrowthService.applyToOpportunity(opportunity.id, user.id);
 setIsApplyingId(null);

 if (error) {
 if (error.code === '23505') {
 toast.info('You already applied to this opportunity.');
 await loadGrowthData();
 return;
 }

 toast.error(error.message);
 return;
 }

 if (data) {
 if (opportunity.recruiter_id) {
 const supabase = createSupabaseBrowserClient();
 const { data: recruiterProfile } = await supabase
 .from('profiles')
 .select('auth_user_id')
 .eq('id', opportunity.recruiter_id)
 .maybeSingle();
 await supabase.from('notifications').insert({
 user_id: recruiterProfile?.auth_user_id || opportunity.recruiter_id,
 type: 'career_growth_application',
 title: 'New application received',
 message: `A candidate applied for "${opportunity.title}".`,
 data: { application_id: data.id, opportunity_id: opportunity.id, type },
 read: false,
 });
 }
 toast.success(`${appliedToastVerb} ${opportunity.title}.`);
 await loadGrowthData();
 }
 };

 return (
  <div className="premium-page">
  <header className="premium-header">
  <div className="premium-header-inner">
  <div className="flex items-center justify-between">
  <div className="flex items-center space-x-4">
  <Button variant="ghost" onClick={onBack}>
  <ArrowLeft className="w-4 h-4 mr-2" />
  Back to Dashboard
  </Button>
  <img src={(hirevifyLogo as any).src?? hirevifyLogo} alt="HireVify" className="h-12" />
  </div>
  <Badge className="bg-primary/10 text-primary border-primary/20">
  <Target className="w-3 h-3 mr-1" />
  {badgeLabel}
  </Badge>
  </div>
  </div>
  </header>

  <main className="premium-content">
 <div className="text-center mb-12">
 <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
 <Target className="w-4 h-4 mr-2" />
 {eyebrow}
 </div>
 <h1 className="text-4xl font-bold text-foreground mb-4">{title}</h1>
 <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">{description}</p>
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="grid w-full grid-cols-3">
 <TabsTrigger value="available">{availableTabLabel}</TabsTrigger>
 <TabsTrigger value="mine">{mineTabLabel}</TabsTrigger>
 <TabsTrigger value="about">{aboutTabLabel}</TabsTrigger>
 </TabsList>

 <TabsContent value="available" className="space-y-6">
 <div className="flex flex-col md:flex-row gap-4">
 <div className="flex-1">
 <Input
 placeholder={searchPlaceholder}
 value={searchTerm}
 onChange={(event) => setSearchTerm(event.target.value)}
 />
 </div>
 <Select value={selectedCategory} onValueChange={setSelectedCategory}>
 <SelectTrigger className="w-48">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {categories.map((category) => (
 <SelectItem key={category} value={category}>
 {category}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {errorMessage && (
 <Card className="border-red-200 bg-red-50">
 <CardContent className="p-4 text-sm text-red-700">{errorMessage}</CardContent>
 </Card>
 )}

 {isLoading? (
 <div className="text-center py-12 text-muted-foreground">Loading opportunities...</div>
 ): filteredOpportunities.length === 0? (
 <div className="text-center py-12">
 <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
 <h3 className="text-lg font-semibold mb-2">{emptyAvailableLabel}</h3>
 </div>
 ): (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {filteredOpportunities.map((opportunity) => {
 const application = getApplication(opportunity.id);
 const payment = opportunity.metadata?.payment;

 return (
 <Card key={opportunity.id} className="relative">
 <CardHeader>
 <div className="space-y-3">
 <div>
 <CardTitle className="text-lg mb-2">{opportunity.title}</CardTitle>
 <div className="flex items-center text-sm text-muted-foreground mb-2">
 <Building className="w-4 h-4 mr-1" />
 {opportunity.company_name || 'Company'}
 </div>
 <div className="flex items-center text-sm text-muted-foreground">
 <MapPin className="w-4 h-4 mr-1" />
 {opportunity.location || opportunity.remote_type || 'Not specified'}
 </div>
 </div>

 <div className="flex flex-wrap gap-2">
 <Badge variant="outline" className={getDifficultyColor(opportunity.difficulty)}>
 {opportunity.difficulty || 'Open'}
 </Badge>
 {opportunity.duration_label && (
 <Badge variant="outline">
 <Clock className="w-3 h-3 mr-1" />
 {opportunity.duration_label}
 </Badge>
 )}
 {payment && (
 <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
 {String(payment)}
 </Badge>
 )}
 {application && getStatusBadge(application.status)}
 </div>
 </div>
 </CardHeader>

 <CardContent>
 <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
 {opportunity.description || 'No description provided.'}
 </p>

 <div className="space-y-3 mb-4">
 <div>
 <div className="text-xs font-medium text-muted-foreground mb-1">Skills</div>
 <div className="flex flex-wrap gap-1">
 {(opportunity.skills || []).slice(0, 5).map((skill) => (
 <Badge key={skill} variant="secondary" className="text-xs">
 {skill}
 </Badge>
 ))}
 </div>
 </div>

 {opportunity.requirements?.length > 0 && (
 <div>
 <div className="text-xs font-medium text-muted-foreground mb-1">Requirements</div>
 <ul className="text-sm text-muted-foreground space-y-1">
 {opportunity.requirements.slice(0, 3).map((requirement) => (
 <li key={requirement} className="flex items-center">
 <CheckCircle className="w-3 h-3 text-green-600 mr-2" />
 {requirement}
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>

 {application? (
 <Button variant="outline" className="w-full" disabled>
 {getStatusBadge(application.status)}
 </Button>
 ): (
 <Button className="w-full" onClick={() => handleApply(opportunity)} disabled={isApplyingId === opportunity.id}>
 <Play className="w-4 h-4 mr-2" />
 {isApplyingId === opportunity.id? 'Saving...': applyLabel}
 </Button>
 )}
 </CardContent>
 </Card>
 );
 })}
 </div>
 )}
 </TabsContent>

 <TabsContent value="mine" className="space-y-6">
 {isLoading? (
 <div className="text-center py-12 text-muted-foreground">Loading your applications...</div>
 ): applications.length === 0? (
 <div className="text-center py-12">
 <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
 <h3 className="text-lg font-semibold mb-2">{emptyMineLabel}</h3>
 <Button onClick={() => setActiveTab('available')}>Browse Opportunities</Button>
 </div>
 ): (
 <div className="space-y-6">
 {applications.map((application) => {
 const submission = getSubmission(application.id);
 const review = parseCareerGrowthReview(application.recruiter_notes);
 const canSubmit = ['accepted', 'assigned', 'in_progress'].includes(application.status);
 const canDownloadCertificate = application.status === 'completed' && review.certificateIssued;
 const progress = getProgress(application);

 return (
 <Card key={application.id}>
 <CardHeader>
 <div className="flex items-start justify-between gap-4">
 <div>
 <CardTitle className="text-lg mb-2">{application.opportunity?.title || 'Career Growth Opportunity'}</CardTitle>
 <p className="text-sm text-muted-foreground">
 {application.opportunity?.company_name || 'Company'} - Applied {new Date(application.created_at).toLocaleDateString()}
 </p>
 </div>
 {getStatusBadge(application.status)}
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <p className="text-sm text-muted-foreground mb-4">
 {application.opportunity?.description || 'No description provided.'}
 </p>

 <div>
 <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
 <span>Applied</span>
 <span>Assigned</span>
 <span>Submitted</span>
 <span>Completed</span>
 </div>
 <div className="h-2 overflow-hidden rounded-full bg-slate-100">
 <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
 </div>
 </div>

 {canSubmit && !submission && (
 <div className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
 <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
 <Upload className="h-4 w-4 text-emerald-700" />
 Submit your project
 </div>
 <Input
 placeholder="Project link"
 value={submissionUrlById[application.id] || ''}
 onChange={(event) => setSubmissionUrlById((current) => ({ ...current, [application.id]: event.target.value }))}
 />
 <Input
 placeholder="Short note"
 value={submissionTextById[application.id] || ''}
 onChange={(event) => setSubmissionTextById((current) => ({ ...current, [application.id]: event.target.value }))}
 />
 <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
 <FileText className="h-4 w-4" />
 {submissionFileById[application.id]?.name || 'Attach project file'}
 <input
 type="file"
 className="hidden"
 onChange={(event) => setSubmissionFileById((current) => ({ ...current, [application.id]: event.target.files?.[0] || null }))}
 />
 </label>
 <Button onClick={() => handleSubmitWork(application)} disabled={isSubmittingId === application.id}>
 {isSubmittingId === application.id ? 'Submitting...' : 'Submit Project'}
 </Button>
 </div>
 )}

 {submission && (
 <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
 Project submitted. Recruiter can now review and score your work.
 </div>
 )}

 {application.recruiter_notes && (
 <div className="rounded-lg border border-border p-3 text-sm">
 <div className="font-medium mb-1">Recruiter Review</div>
 <p className="text-muted-foreground">
 {review.score !== undefined ? `Score: ${review.score}%` : ''}
 {review.note ? ` - ${review.note}` : ''}
 </p>
 </div>
 )}
 {canDownloadCertificate && (
 <Button variant="outline" onClick={() => downloadCertificate(application)}>
 <Download className="mr-2 h-4 w-4" />
 Download Certificate
 </Button>
 )}
 </CardContent>
 </Card>
 );
 })}
 </div>
 )}
 </TabsContent>

 <TabsContent value="about" className="space-y-8">
 <Card>
 <CardHeader>
 <CardTitle>How {title} Works</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 {['Browse', 'Apply', 'Get Reviewed', 'Build Progress'].map((step, index) => (
 <div key={step} className="text-center">
 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
 <span className="text-primary font-bold">{index + 1}</span>
 </div>
 <h4 className="font-semibold mb-2">{step}</h4>
 <p className="text-sm text-muted-foreground">
 {index === 0 && 'Find database-backed opportunities that match your goals.'}
 {index === 1 && 'Submit once and track your real status.'}
 {index === 2 && 'Recruiters or admins review your application.'}
 {index === 3 && 'Continue once your status is updated.'}
 </p>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
 <CardContent className="text-center py-8">
 <h3 className="text-2xl font-bold mb-4">Ready to continue?</h3>
 <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
 Opportunities shown here are loaded from Supabase and update as new records are published.
 </p>
 <Button size="lg" onClick={() => setActiveTab('available')}>
 <Award className="w-5 h-5 mr-2" />
 Browse Opportunities
 </Button>
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 </main>
 </div>
 );
}

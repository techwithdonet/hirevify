import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, MapPin, Briefcase, Star, Send, Eye, BookOpen, Award, Clock, Users, TrendingUp, Download, Crown, Plus, X, ChevronDown, Globe, Calendar, DollarSign, CheckCircle, MessageCircle, Heart, Link as LinkIcon, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { profilesService } from '@/src/hirevify-app/services/profilesService';
import { SkillMultiSelect } from './common/SkillMultiSelect';
import { openOrCreateConversationAndNavigate } from '../utils/openConversation';
import { DashboardPageLayout } from './shared/DashboardPageLayout';
import { dashboardTheme } from '../theme/dashboardTheme';
import type { Candidate } from '@/src/hirevify-app/types/app';
import { MIN_CANDIDATE_PROFILE_COMPLETENESS } from '../services/applicationsService';

interface CandidateSearchProps {
 onBack: () => void;
 onUpgrade?: () => void;
 onViewMessages: (conversationId?: string) => void;
 onViewCandidateDetail: (candidate: Candidate) => void;
 savedOnly?: boolean;
}

interface SearchFilters {
 keywords: string;
 location: string;
 skills: string[];
 experience: string;
 availability: string;
 workType: string[];
 salaryMin: number;
 salaryMax: number;
 verified: boolean;
 minMatchScore: number;
 responseTime: string;
 timezone: string;
 hasPortfolio: boolean;
}

export function CandidateSearch({ onBack, onUpgrade, onViewMessages, onViewCandidateDetail, savedOnly = false }: CandidateSearchProps) {
 const { user } = useAuth();
 const [activeTab, setActiveTab] = useState('search');
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('match');
  const [savedCandidates, setSavedCandidates] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = window.localStorage.getItem('hirevify_saved_candidates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
 const [searchFilters, setSearchFilters] = useState<SearchFilters>({
 keywords: '',
 location: '',
 skills: [],
 experience: '',
 availability: '',
 workType: [],
 salaryMin: 0,
 salaryMax: 300000,
 verified: false,
 minMatchScore: 0,
 responseTime: '',
 timezone: '',
 hasPortfolio: false
 });

  // Comprehensive candidate database with realistic profiles
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

 // Load only completed candidate profiles from Supabase
 useEffect(() => {
 async function loadCandidates() {
 try {
 setIsLoadingCandidates(true);

 const { createSupabaseBrowserClient } = await import('@/src/lib/supabase');
 const supabase = createSupabaseBrowserClient();

 const { data: candidateDetails, error: detailsError } = await supabase
 .from('candidate_profiles')
 .select('*')
 .gte('profile_completeness', MIN_CANDIDATE_PROFILE_COMPLETENESS)
 .order('updated_at', { ascending: false });

 if (detailsError) {
 console.error('Error loading completed candidate profiles:', detailsError);
 setCandidates([]);
 setFilteredCandidates([]);
 return;
 }

 const completedProfiles = candidateDetails || [];

 if (completedProfiles.length === 0) {
 setCandidates([]);
 setFilteredCandidates([]);
 return;
 }

 const lookupIds = Array.from(
 new Set(
 completedProfiles.map((candidate: any) => candidate.user_id).filter(Boolean)
 )
 );

 const [{ data: profilesById }, { data: profilesByAuthId }, { data: portfolioRows }] = await Promise.all([
 lookupIds.length > 0
 ? supabase.from('profiles').select('*').in('id', lookupIds)
 : Promise.resolve({ data: [] as any[] }),
 lookupIds.length > 0
 ? supabase.from('profiles').select('*').in('auth_user_id', lookupIds)
 : Promise.resolve({ data: [] as any[] }),
 lookupIds.length > 0
 ? supabase
 .from('portfolio_items')
 .select('user_id, title, project_url, live_url, github_url')
 .in('user_id', lookupIds)
 : Promise.resolve({ data: [] as any[] }),
 ]);

 const profileRows = [...(profilesById || []), ...(profilesByAuthId || [])];
 const profileById = new Map<string, any>(
 profileRows
 .filter((profile: any) => Boolean(profile.id))
 .map((profile: any) => [profile.id, profile] as [string, any])
 );
 const profileByAuthId = new Map<string, any>(
 profileRows
 .filter((profile: any) => Boolean(profile.auth_user_id))
 .map((profile: any) => [profile.auth_user_id, profile] as [string, any])
 );
 const portfolioByUserId = new Map<string, any[]>();
 (portfolioRows || []).forEach((item: any) => {
 const items = portfolioByUserId.get(item.user_id) || [];
 items.push(item);
 portfolioByUserId.set(item.user_id, items);
 });

 const mapped = completedProfiles.map((details: any, index: number) => {
 const profile = profileById.get(details.user_id) || profileByAuthId.get(details.user_id);

 const yearsOfExperience = Number(details.years_of_experience || 0);
 const portfolioItemsForCandidate = [
 ...(portfolioByUserId.get(details.user_id) || []),
 ...(profile?.id ? portfolioByUserId.get(profile.id) || [] : []),
 ...(profile?.auth_user_id ? portfolioByUserId.get(profile.auth_user_id) || [] : []),
 ];
 const portfolioLinks = portfolioItemsForCandidate
 .flatMap((item: any) => [item.project_url, item.live_url, item.github_url])
 .filter(Boolean);

  return {
    id: details.user_id,
 name: details.full_name || profile?.full_name || 'Candidate',
 email: profile?.email || '',
 avatar: profile?.avatar_url || '',
 title: details.headline || 'Candidate',
 headline: details.headline || 'Open to opportunities',
 location: details.location || profile?.location || 'Not specified',
 currentLocation: details.current_location || details.location || profile?.location || '',
 country: details.country || '',
 state: details.state || '',
 city: details.city || '',
 phone: details.phone || profile?.phone || '',
 skills: details.skills || [],
 experienceSummary: details.experience_summary || '',
 resumeUrl: details.resume_url || '',
 portfolioUrl: details.portfolio_url || '',
 githubUrl: details.github_url || '',
 linkedinUrl: details.linkedin_url || '',

 matchScore: Math.max(60, 95 - index * 4),
 responseRate: Number(details.response_rate || Math.max(50, 90 - index * 3)),
 preferredWorkType: details.preferred_work_type || [],
 experience: yearsOfExperience > 0? `${yearsOfExperience} years`: 'Not specified',
 yearsOfExperience,
 totalExperience: Number(details.total_experience ?? yearsOfExperience),
 currentCompany: details.current_company || '',
 currentDesignation: details.current_designation || details.headline || '',
 employmentStatus: details.employment_status || '',
 noticePeriod: details.notice_period || details.availability || '',
 preferredLocations: details.preferred_locations || [],
 employmentType: details.employment_type || '',
 workMode: details.work_mode || (details.preferred_work_type || [])[0] || '',
 expectedSalary: details.expected_salary || '',
 industry: details.industry || '',
 preferredRoles: details.preferred_roles || [],
 careerLevel: details.career_level || '',
 workAuthorization: details.work_authorization || '',
 willingToRelocate: Boolean(details.willing_to_relocate),
 availableFrom: details.available_from || null,
 profileLastUpdated: details.profile_last_updated || details.updated_at || '',
 profileViews: Number(details.profile_views || 0),
 responseTime: details.response_time || '',
 emailVerified: Boolean(details.email_verified || profile?.email),
 phoneVerified: Boolean(details.phone_verified),
 resumeVerified: Boolean(details.resume_verified || details.resume_url),
 timezone: details.timezone || 'IST',
 availability: normalizeCandidateAvailability(details.availability),

 salaryRange: {
 min: Number(details.salary_min || 0),
 max: Number(details.salary_max || 0),
 currency: details.salary_currency || 'USD',
 },

 lastActive: details.updated_at || profile?.created_at || '',
 isVerified: Boolean(profile?.is_verified),
 profileCompleteness: Number(details.profile_completeness || 0),
 hasPortfolio: Boolean(details.resume_url || details.portfolio_url || details.github_url || details.linkedin_url),
  bio: details.bio || '',
  education: (() => {
    try {
      const raw = details.education;
      if (!raw) return [];
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!Array.isArray(parsed)) return [];
      return parsed.map((e: any) => ({
        id: e.id || String(Math.random()),
        degree: e.degree || '',
        fieldOfStudy: e.fieldOfStudy || e.field || '',
        institution: e.institution || e.university || '',
        startYear: e.startYear || e.startDate || '',
        endYear: e.endYear || e.endDate || '',
        grade: e.grade || '',
      }));
    } catch {
      return [];
    }
  })(),
  certifications: details.certifications || [],
 portfolioItems: Array.from(new Set([details.portfolio_url, ...portfolioLinks].filter(Boolean))).length,
 portfolioLinks: Array.from(new Set([details.portfolio_url, ...portfolioLinks].filter(Boolean))),
 previousCompanies: details.previous_companies || [],
 achievements: details.achievements || [],
 languages: details.languages || [],
 hiringSuccessRate: 0,
 };
 });

  setCandidates(mapped as unknown as Candidate[]);
  setFilteredCandidates(mapped as unknown as Candidate[]);
  
  // Extract unique locations from candidates
  const uniqueLocations = Array.from(
  new Set(
  mapped
  .map((c: any) => c.location)
  .filter((loc: any) => loc && loc !== 'Not specified')
  )
  ).sort() as string[];
  setAvailableLocations(uniqueLocations);
 } catch (err) {
 console.error('Unexpected error loading completed candidates:', err);
 setCandidates([]);
 setFilteredCandidates([]);
 } finally {
 setIsLoadingCandidates(false);
 }
 }

 loadCandidates();
 }, []);


 const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(candidates);
 const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
 const [showFilters, setShowFilters] = useState(false);
 const [aiRecommendations, setAiRecommendations] = useState<Candidate[]>([]);
 const [isLoadingAI, setIsLoadingAI] = useState(false);
 const [showAiRecommendations, setShowAiRecommendations] = useState(true);
 useEffect(() => {
 if (savedOnly) {
 setFilteredCandidates(candidates.filter((candidate) => savedCandidates.includes(candidate.id)));
 return;
 }
 setFilteredCandidates(candidates);
}, [candidates, savedCandidates, savedOnly]);



 const timezones = [
 'PST', 'MST', 'CST', 'EST', 'GMT', 'CET', 'JST', 'IST'
 ];

 useEffect(() => {
 if (isLoadingCandidates) return;
 applyFilters();
 loadAIRecommendations();
 }, [searchFilters, sortBy, candidates, isLoadingCandidates, savedCandidates, savedOnly]);

 const loadAIRecommendations = async () => {
 if (user?.userType!== 'recruiter') return;
 
 setIsLoadingAI(true);
 
 try {
 // Simulate AI recommendations based on recent projects or hiring patterns
 // In a real implementation, this would call the AI matching service
 const topCandidates = [...candidates].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
 
 setAiRecommendations(topCandidates);
 
 // Optional: Try to load real AI recommendations
 try {
 const { aiMatchingService } = await import('../utils/ai/matchingService');
 // This would get recommendations based on recruiter's recent projects
 // const result = await aiMatchingService.findCandidatesForProject(currentProjectId, 3);
 // setAiRecommendations(result.matches);
 } catch (error) {
 console.log('AI service not available, using fallback recommendations');
 }
 
 } catch (error) {
 console.error('Failed to load AI recommendations:', error);
 } finally {
 setIsLoadingAI(false);
 }
 };

 const applyFilters = () => {
 setIsLoading(true);

 let filtered = candidates.filter(candidate => {
 if (savedOnly && !savedCandidates.includes(candidate.id)) {
 return false;
 }

 // Keywords filter
 if (searchFilters.keywords) {
 const keywords = searchFilters.keywords.toLowerCase();
 const matchesKeywords = 
 candidate.name.toLowerCase().includes(keywords) ||
 candidate.title.toLowerCase().includes(keywords) ||
 candidate.bio.toLowerCase().includes(keywords) ||
 candidate.skills.some(skill => skill.toLowerCase().includes(keywords)) ||
 candidate.previousCompanies.some(company => company.toLowerCase().includes(keywords));
 
 if (!matchesKeywords) return false;
 }

 // Location filter
 if (searchFilters.location &&!candidate.location.toLowerCase().includes(searchFilters.location.toLowerCase())) {
 return false;
 }

 // Skills filter
 if (searchFilters.skills.length > 0) {
 const hasRequiredSkills = searchFilters.skills.every(skill =>
 candidate.skills.some(candidateSkill => candidateSkill.toLowerCase().includes(skill.toLowerCase()))
 );
 if (!hasRequiredSkills) return false;
 }

 // Experience filter
 if (searchFilters.experience && candidate.experience!== searchFilters.experience) {
 return false;
 }

 // Availability filter
 if (searchFilters.availability && candidate.availability!== searchFilters.availability) {
 return false;
 }

 // Work type filter
 if (searchFilters.workType.length > 0) {
 const hasMatchingWorkType = searchFilters.workType.some(type =>
 candidate.preferredWorkType.includes(type)
 );
 if (!hasMatchingWorkType) return false;
 }

 // Salary filter
 if (candidate.salaryRange.min > searchFilters.salaryMax || candidate.salaryRange.max < searchFilters.salaryMin) {
 return false;
 }

 // Verified filter
 if (searchFilters.verified &&!candidate.isVerified) {
 return false;
 }

 // Match score filter
 if (candidate.matchScore < searchFilters.minMatchScore) {
 return false;
 }

 // Portfolio filter
 if (searchFilters.hasPortfolio && candidate.portfolioItems === 0) {
 return false;
 }

 // Timezone filter
 if (searchFilters.timezone && candidate.timezone!== searchFilters.timezone) {
 return false;
 }

 return true;
 });

 // Apply sorting
 filtered.sort((a, b) => {
 switch (sortBy) {
 case 'match':
 return b.matchScore - a.matchScore;
 case 'recent':
 return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
 case 'salary':
 return b.salaryRange.max - a.salaryRange.max;
 case 'availability':
 const availabilityOrder = { 'immediate': 0, 'two-weeks': 1, 'one-month': 2, 'not-looking': 3 };
 return availabilityOrder[a.availability] - availabilityOrder[b.availability];
 case 'experience':
 return b.yearsOfExperience - a.yearsOfExperience;
 case 'response':
 return b.responseRate - a.responseRate;
 default:
 return b.matchScore - a.matchScore;
 }
 });

 setFilteredCandidates(filtered);
 setIsLoading(false);
 };

 const contactCandidate = async (candidateId: string) => {
 if (!user?.id) {
 toast.error('Please sign in to message candidates.');
 return;
 }

 try {
 await openOrCreateConversationAndNavigate({
 recruiterProfileId: user.id,
 candidateProfileId: candidateId,
 currentUserProfileId: user.id,
 navigateToMessages: onViewMessages,
 });
 } catch (error) {
 console.error('Failed to open candidate conversation:', error);
 toast.error(error instanceof Error? error.message: 'Could not open messages.');
 }
 };

 const saveCandidate = (candidateId: string) => {
 if (savedCandidates.includes(candidateId)) {
 const next = savedCandidates.filter(id => id!== candidateId);
 setSavedCandidates(next);
 if (typeof window !== 'undefined') {
 window.localStorage.setItem('hirevify_saved_candidates', JSON.stringify(next));
 }
 toast.success('Candidate removed from saved list');
 } else {
 const next = [...savedCandidates, candidateId];
 setSavedCandidates(next);
 if (typeof window !== 'undefined') {
 window.localStorage.setItem('hirevify_saved_candidates', JSON.stringify(next));
 }
 toast.success('Candidate saved to your list');
 }
 };

 const notProvided = (value?: string | number | null) =>
 value === null || value === undefined || String(value).trim() === '' ? 'Not provided' : String(value);

 const openExternalUrl = (url?: string | null) => {
 if (!url) return;
 const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
 window.open(normalized, '_blank', 'noopener,noreferrer');
 };

 const openResume = async (candidate: Candidate) => {
 if (!candidate.resumeUrl) {
 toast.error('Resume/CV not provided');
 return;
 }

 try {
 const { applicationsService } = await import('@/src/hirevify-app/services/applicationsService');
 const { url } = await applicationsService.getApplicationFileSignedUrl(candidate.resumeUrl);
 const fallbackUrl = /^https?:\/\//i.test(candidate.resumeUrl) ? candidate.resumeUrl : null;
 const resumeUrl = url || fallbackUrl;
 if (!resumeUrl) {
 toast.error('Could not create a secure resume link. Check storage access in deployment.');
 return;
 }
 window.open(resumeUrl, '_blank', 'noopener,noreferrer');
 } catch {
 if (/^https?:\/\//i.test(candidate.resumeUrl)) {
 openExternalUrl(candidate.resumeUrl);
 return;
 }
 toast.error('Could not create a secure resume link. Check storage access in deployment.');
 }
 };

 const getMatchScoreColor = (score: number) => {
 if (score >= 90) return 'text-green-600 bg-green-100';
 if (score >= 80) return 'text-yellow-600 bg-yellow-100';
 if (score >= 70) return 'text-orange-600 bg-orange-100';
 return 'text-red-600 bg-red-100';
 };

function normalizeCandidateAvailability(value?: string | null): 'immediate' | 'two-weeks' | 'one-month' | 'not-looking' {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw || raw === 'null' || raw === 'undefined') {
    return 'immediate';
  }

  const compact = raw
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  if (['immediate', 'available', 'available-now', 'available-immediately', 'now', 'asap'].includes(compact)) {
    return 'immediate';
  }

  if (['two-weeks', '2-weeks', '2-weeks-notice', 'available-in-2-weeks', 'available-in-two-weeks'].includes(compact)) {
    return 'two-weeks';
  }

  if (['one-month', '1-month', '30-days', '30-days-notice', 'available-in-1-month', 'available-in-one-month'].includes(compact)) {
    return 'one-month';
  }

  if (['not-looking', 'not-available', 'not-actively-looking', 'unavailable'].includes(compact)) {
    return 'not-looking';
  }

  return 'immediate';
}

const getAvailabilityBadge = (availability: string) => {
  const config = {
  'immediate': { label: 'Available Now', className: 'bg-green-100 text-green-800' },
  'two-weeks': { label: '2 Weeks Notice', className: 'bg-blue-100 text-blue-800' },
  'one-month': { label: '1 Month Notice', className: 'bg-yellow-100 text-yellow-800' },
  'not-looking': { label: 'Not Looking', className: 'bg-gray-100 text-gray-800' }
  };
  
  // If availability is empty/null/undefined, show neutral "Availability Unknown" instead of defaulting to "Not Looking"
  if (!availability || availability === '' || availability === 'null' || availability === 'undefined') {
    return { label: 'Availability Unknown', className: 'bg-slate-100 text-slate-600' };
  }
  
  const normalizedAvailability = normalizeCandidateAvailability(availability);
  return config[normalizedAvailability] || { label: 'Availability Unknown', className: 'bg-slate-100 text-slate-600' };
  };

 const clearAllFilters = () => {
 setSearchFilters({
 keywords: '',
 location: '',
 skills: [],
 experience: '',
 availability: '',
 workType: [],
 salaryMin: 0,
 salaryMax: 300000,
 verified: false,
 minMatchScore: 0,
 responseTime: '',
 timezone: '',
 hasPortfolio: false
 });
  };

  const renderFilters = () => (
 <Card className={`${showFilters? 'block': 'hidden'} lg:block`}>
 <CardHeader>
 <CardTitle className="flex items-center justify-between">
 Advanced Filters
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setShowFilters(false)}
 className="lg:hidden"
 >
 <X className="w-4 h-4" />
 </Button>
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 {/* Keywords */}
 <div>
 <label className="text-sm font-medium mb-2 block">Keywords</label>
 <Input
 placeholder="Job title, skills, company..."
 value={searchFilters.keywords}
 onChange={(e) => setSearchFilters(prev => ({...prev, keywords: e.target.value }))}
 />
 </div>

  {/* Location */}
  <div>
  <label className="text-sm font-medium mb-2 block">Location</label>
  <div className="relative">
  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
  <Input
  placeholder="Kerala, Kochi, Mumbai, Bangalore..."
  value={searchFilters.location}
  onChange={(e) => setSearchFilters(prev => ({...prev, location: e.target.value }))}
  className="pl-9"
  />
  {searchFilters.location && (
  <button
  type="button"
  onClick={() => setSearchFilters(prev => ({...prev, location: ''}))}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
  >
  <X className="h-4 w-4" />
  </button>
  )}
  </div>
  <p className="mt-1 text-xs text-slate-500">
  {availableLocations.length > 0 
  ? `${availableLocations.length} locations available`
  : 'Type to search any city or region'}
  </p>
  </div>

 {/* Skills */}
 <div>
 <label className="text-sm font-medium mb-2 block">Required Skills</label>
 <SkillMultiSelect
 value={searchFilters.skills}
 onChange={(skills) => setSearchFilters((prev) => ({...prev, skills }))}
 max={10}
 placeholder="Add skill requirement"
 />
 </div>

 {/* Experience */}
 <div>
 <label className="text-sm font-medium mb-2 block">Experience Level</label>
 <Select value={searchFilters.experience} onValueChange={(value) => setSearchFilters(prev => ({...prev, experience: value }))}>
 <SelectTrigger>
 <SelectValue placeholder="Any experience" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="any-availability">Any availability</SelectItem>
 <SelectItem value="0-2 years">0-2 years</SelectItem>
 <SelectItem value="3-5 years">3-5 years</SelectItem>
 <SelectItem value="5-7 years">5-7 years</SelectItem>
 <SelectItem value="7+ years">7+ years</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Availability */}
 <div>
 <label className="text-sm font-medium mb-2 block">Availability</label>
 <Select value={searchFilters.availability} onValueChange={(value) => setSearchFilters(prev => ({...prev, availability: value }))}>
 <SelectTrigger>
 <SelectValue placeholder="Any availability" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="any-availability">Any availability</SelectItem>
 <SelectItem value="immediate">Available immediately</SelectItem>
 <SelectItem value="two-weeks">2 weeks notice</SelectItem>
 <SelectItem value="one-month">1 month notice</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Work Type */}
 <div>
 <label className="text-sm font-medium mb-2 block">Work Type</label>
 <div className="space-y-2">
 {['Remote', 'Hybrid', 'On-site'].map(type => (
 <label key={type} className="flex items-center space-x-2">
 <Checkbox
 checked={searchFilters.workType.includes(type)}
 onCheckedChange={(checked) => {
 if (checked) {
 setSearchFilters(prev => ({...prev, workType: [...prev.workType, type] }));
 } else {
 setSearchFilters(prev => ({...prev, workType: prev.workType.filter(t => t!== type) }));
 }
 }}
 />
 <span className="text-sm">{type}</span>
 </label>
 ))}
 </div>
 </div>

 {/* Salary Range */}
 <div>
 <label className="text-sm font-medium mb-2 block">
 Salary Range: ${searchFilters.salaryMin.toLocaleString()} - ${searchFilters.salaryMax.toLocaleString()}
 </label>
 <div className="space-y-4">
 <div>
 <span className="text-xs text-muted-foreground">Minimum</span>
 <Slider
 value={[searchFilters.salaryMin]}
 onValueChange={([value]) => setSearchFilters(prev => ({...prev, salaryMin: value }))}
 max={300000}
 step={5000}
 className="mt-1"
 />
 </div>
 <div>
 <span className="text-xs text-muted-foreground">Maximum</span>
 <Slider
 value={[searchFilters.salaryMax]}
 onValueChange={([value]) => setSearchFilters(prev => ({...prev, salaryMax: value }))}
 max={400000}
 min={searchFilters.salaryMin}
 step={5000}
 className="mt-1"
 />
 </div>
 </div>
 </div>

 {/* Match Score */}
 <div>
 <label className="text-sm font-medium mb-2 block">
 Minimum Match Score: {searchFilters.minMatchScore}%
 </label>
 <Slider
 value={[searchFilters.minMatchScore]}
 onValueChange={([value]) => setSearchFilters(prev => ({...prev, minMatchScore: value }))}
 max={100}
 step={5}
 className="mt-1"
 />
 </div>

 {/* Timezone */}
 <div>
 <label className="text-sm font-medium mb-2 block">Timezone</label>
 <Select value={searchFilters.timezone} onValueChange={(value) => setSearchFilters(prev => ({...prev, timezone: value }))}>
 <SelectTrigger>
 <SelectValue placeholder="Any timezone" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="any-timezone">Any timezone</SelectItem>
 {timezones.map(tz => (
 <SelectItem key={tz} value={tz}>{tz}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Additional Filters */}
 <div className="space-y-3">
 <label className="flex items-center space-x-2">
 <Checkbox
 checked={searchFilters.verified}
 onCheckedChange={(checked) => setSearchFilters(prev => ({...prev, verified:!!checked }))}
 />
 <span className="text-sm">Verified profiles only</span>
 </label>
 
 <label className="flex items-center space-x-2">
 <Checkbox
 checked={searchFilters.hasPortfolio}
 onCheckedChange={(checked) => setSearchFilters(prev => ({...prev, hasPortfolio:!!checked }))}
 />
 <span className="text-sm">Has portfolio/projects</span>
 </label>
 </div>

 {/* Clear Filters */}
 <Button
 variant="outline"
 onClick={clearAllFilters}
 className="w-full"
 >
 Clear All Filters
 </Button>
 </CardContent>
 </Card>
 );

 const renderCandidateCard = (candidate: Candidate) => (
 <button
 key={candidate.id}
 type="button"
 className="group rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
 onClick={() => {
 if (typeof window !== 'undefined') {
 window.sessionStorage.setItem('hirevify_candidate_detail_back_screen', 'recruiter-search-candidates');
 }
 onViewCandidateDetail(candidate);
 }}
 >
 <Avatar className="mx-auto h-24 w-24 border-4 border-slate-50 shadow-sm">
 {candidate.avatar && <AvatarImage src={candidate.avatar} alt={candidate.name} />}
 <AvatarFallback className="bg-emerald-100 text-2xl font-bold text-emerald-700">
 {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
 </AvatarFallback>
 </Avatar>
 <div className="mt-4 min-w-0">
 <div className="flex items-center justify-center gap-1">
 <h3 className="truncate text-base font-semibold text-slate-950 group-hover:text-emerald-700">{candidate.name}</h3>
 {savedCandidates.includes(candidate.id) && <Heart className="h-4 w-4 fill-red-500 text-red-500" />}
 </div>
 <p className="mt-1 line-clamp-1 text-sm text-slate-500">{candidate.title || 'Candidate'}</p>
 <p className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400">
 <MapPin className="h-3.5 w-3.5" />
 <span className="truncate">{candidate.location || 'Not provided'}</span>
 </p>
 </div>
 <div className="mt-4 flex flex-wrap justify-center gap-1.5">
 {candidate.skills.slice(0, 3).map(skill => (
 <span key={skill} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{skill}</span>
 ))}
 {candidate.skills.length > 3 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">+{candidate.skills.length - 3}</span>}
 </div>
 <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
 <span>{candidate.yearsOfExperience || 0}y exp</span>
 <span className="text-slate-300">|</span>
 <span>{candidate.portfolioItems} links</span>
 </div>
 </button>
 );

 const renderSearchResults = () => (
 <div className="space-y-6">
 {(() => {
 const isResultsLoading = isLoadingCandidates || isLoading;
 return (
 <>
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-xl font-semibold">
 {isResultsLoading
 ? 'Loading candidates...'
 : savedOnly
 ? `${filteredCandidates.length} saved candidate${filteredCandidates.length!== 1? 's': ''}`
 : `${filteredCandidates.length} candidate profile${filteredCandidates.length!== 1? 's': ''}`}
 </h2>
 <p className="text-sm text-muted-foreground">
 {isResultsLoading
 ? 'Fetching real candidate profiles'
 : savedOnly
 ? 'Showing only candidates you saved'
 : 'Click a profile to open the full recruiter view'}
 </p>
 </div>
 
 <div className="flex items-center space-x-2">
 <Button
 variant="outline"
 onClick={() => setShowFilters(!showFilters)}
 className="lg:hidden"
 >
 <Filter className="w-4 h-4 mr-2" />
 Filters
 </Button>
 <Select value={sortBy} onValueChange={setSortBy}>
 <SelectTrigger className="w-48">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="match">Best Match</SelectItem>
 <SelectItem value="recent">Most Recent</SelectItem>
 <SelectItem value="salary">Salary Range</SelectItem>
 <SelectItem value="availability">Availability</SelectItem>
 <SelectItem value="experience">Experience</SelectItem>
 <SelectItem value="response">Response Rate</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

 {isResultsLoading? (
 <div className="space-y-4">
 {[1, 2, 3].map(i => (
 <Card key={i} className="animate-pulse">
 <CardContent className="p-6">
 <div className="flex items-start space-x-4">
 <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
 <div className="flex-1">
 <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
 <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
 <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
 <div className="h-3 bg-gray-200 rounded w-2/3"></div>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 ): filteredCandidates.length === 0? (
 <Card>
 <CardContent className="text-center py-12">
 <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
 <h3 className="text-lg font-semibold mb-2">{savedOnly ? 'No saved candidates yet' : 'No candidates found'}</h3>
 <p className="text-muted-foreground mb-4">
 {savedOnly ? 'Save candidates from the search results to see them here.' : 'Try adjusting your search criteria or removing some filters'}
 </p>
 <Button variant="outline" onClick={clearAllFilters}>
 Clear All Filters
 </Button>
 </CardContent>
 </Card>
 ): (
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
 {filteredCandidates.map(candidate => renderCandidateCard(candidate))}
 </div>
 )}

 {/* Load More Button */}
 {!isResultsLoading && filteredCandidates.length > 0 && filteredCandidates.length >= 10 && (
 <div className="text-center">
 <Button variant="outline" onClick={() => toast.info('Loading more candidates...')}>
 Load More Candidates
 </Button>
 </div>
 )}
 </>
 );
 })()}
 </div>
 );

 return (
 <DashboardPageLayout
 title="Find Candidates"
 subtitle="Search and connect with qualified candidates from our talent pool"
 onBack={onBack}
 actions={(
 <Button onClick={onUpgrade} className={dashboardTheme.buttonPrimary}>
 <Crown className="w-4 h-4 mr-2" />
 Upgrade to Pro
 </Button>
 )}
 >
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
 {/* Filters Sidebar */}
 <div className="lg:col-span-1">
 {renderFilters()}
 </div>

 {/* Search Results */}
 <div className="lg:col-span-3">
 {renderSearchResults()}
 </div>
 </div>

  {/* Candidate Profile Modal */}
  </DashboardPageLayout>
 );
}















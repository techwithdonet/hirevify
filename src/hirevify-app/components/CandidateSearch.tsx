import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, MapPin, Briefcase, Star, Send, Eye, BookOpen, Award, Clock, Users, TrendingUp, Download, Crown, Plus, X, ChevronDown, Globe, Calendar, DollarSign, CheckCircle, MessageCircle, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { profilesService } from '@/src/hirevify-app/services/profilesService';

interface CandidateSearchProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

interface Candidate {
  id: string;
  name: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  matchScore: number;
  availability: 'immediate' | 'two-weeks' | 'one-month' | 'not-looking';
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  lastActive: string;
  isVerified: boolean;
  profileCompleteness: number;
  bio: string;
  preferredWorkType: string[];
  education?: string;
  certifications: string[];
  portfolioItems: number;
  GitBranch?: string;
  Link?: string;
  yearsOfExperience: number;
  previousCompanies: string[];
  achievements: string[];
  languages: string[];
  timezone: string;
  responseRate: number;
  hiringSuccessRate: number;
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

export function CandidateSearch({ onBack, onUpgrade }: CandidateSearchProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('match');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [savedCandidates, setSavedCandidates] = useState<string[]>([]);
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

  // Load candidates from Supabase
  useEffect(() => {
    async function loadCandidates() {
      try {
        setIsLoadingCandidates(true);

        const { data: profiles, error: profilesError } =
          await profilesService.searchProfiles('', 'candidate');

        if (profilesError) {
          console.error('Error loading candidate profiles:', profilesError);
          setCandidates([]);
          setFilteredCandidates([]);
          return;
        }

        const authUserIds = (profiles || [])
          .map((profile: any) => profile.auth_user_id)
          .filter(Boolean);

        const { createSupabaseBrowserClient } = await import('@/src/lib/supabase');
        const supabase = createSupabaseBrowserClient();

        const { data: candidateDetails, error: detailsError } = await supabase
          .from('candidate_profiles')
          .select('*')
          .in('user_id', authUserIds);

        if (detailsError) {
          console.error('Error loading candidate details:', detailsError);
        }

        const mapped = (profiles || []).map((profile: any, index: number) => {
          const details = (candidateDetails || []).find(
            (item: any) => item.user_id === profile.auth_user_id
          );

          return {
            id: profile.id,
            name: details?.full_name || profile.full_name || 'Candidate',
            email: profile.email || '',
            avatar: profile.avatar_url || '',
            title: details?.headline || 'Candidate',
            headline: details?.headline || 'Open to opportunities',
            location: details?.location || 'Not specified',
            phone: details?.phone || profile.phone || '',
            skills: details?.skills || [],
            experienceSummary: details?.experience_summary || '',
            resumeUrl: details?.resume_url || '',

            matchScore: Math.max(60, 95 - index * 4),
            responseRate: Math.max(50, 90 - index * 3),
            workType: 'Remote',
            experience: 'Not specified',
            timezone: 'IST',
            availability: 'immediate' as const,

            salaryRange: {
              min: 30000,
              max: 80000,
              currency: 'USD',
            },

            lastActive: details?.updated_at || profile.created_at,
            isVerified: false,
            hasPortfolio: !!details?.resume_url,
          };
        });

        setCandidates(mapped as unknown as Candidate[]);
        setFilteredCandidates(mapped as unknown as Candidate[]);
      } catch (err) {
        console.error('Unexpected error loading candidates:', err);
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
  setFilteredCandidates(candidates);
}, [candidates]);

  const availableSkills = [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java',
    'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'PostgreSQL', 'MongoDB',
    'Vue.js', 'Angular', 'Django', 'Spring Boot', 'Go', 'Rust',
    'Machine Learning', 'Data Science', 'Cybersecurity', 'DevOps',
    'Mobile Development', 'UI/UX Design', 'Product Management'
  ];

  const locations = [
    'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX',
    'Los Angeles, CA', 'Boston, MA', 'Denver, CO', 'Chicago, IL',
    'Remote', 'United States', 'International'
  ];

  const timezones = [
    'PST', 'MST', 'CST', 'EST', 'GMT', 'CET', 'JST', 'IST'
  ];

  useEffect(() => {
    applyFilters();
    loadAIRecommendations();
  }, [searchFilters, sortBy]);

  const loadAIRecommendations = async () => {
    if (user?.userType !== 'recruiter') return;
    
    setIsLoadingAI(true);
    
    try {
      // Simulate AI recommendations based on recent projects or hiring patterns
      // In a real implementation, this would call the AI matching service
      const topCandidates = candidates
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);
      
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
    
    // Simulate API call delay
    setTimeout(() => {
      let filtered = candidates.filter(candidate => {
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
        if (searchFilters.location && !candidate.location.toLowerCase().includes(searchFilters.location.toLowerCase())) {
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
        if (searchFilters.experience && candidate.experience !== searchFilters.experience) {
          return false;
        }

        // Availability filter
        if (searchFilters.availability && candidate.availability !== searchFilters.availability) {
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
        if (searchFilters.verified && !candidate.isVerified) {
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
        if (searchFilters.timezone && candidate.timezone !== searchFilters.timezone) {
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
    }, 500);
  };

  const addSkillFilter = (skill: string) => {
    if (!searchFilters.skills.includes(skill)) {
      setSearchFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkillFilter = (skill: string) => {
    setSearchFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const contactCandidate = (candidateId: string) => {
    if (!onUpgrade) {
      toast.success('Message sent to candidate!');
      return;
    }
    
    toast.info('Direct messaging available in Pro plans');
    onUpgrade();
  };

  const saveCandidate = (candidateId: string) => {
    if (savedCandidates.includes(candidateId)) {
      setSavedCandidates(prev => prev.filter(id => id !== candidateId));
      toast.success('Candidate removed from saved list');
    } else {
      setSavedCandidates(prev => [...prev, candidateId]);
      toast.success('Candidate saved to your list');
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-yellow-600 bg-yellow-100';
    if (score >= 70) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getAvailabilityBadge = (availability: string) => {
    const config = {
      'immediate': { label: 'Available Now', className: 'bg-green-100 text-green-800' },
      'two-weeks': { label: '2 Weeks Notice', className: 'bg-blue-100 text-blue-800' },
      'one-month': { label: '1 Month Notice', className: 'bg-yellow-100 text-yellow-800' },
      'not-looking': { label: 'Not Looking', className: 'bg-gray-100 text-gray-800' }
    };
    
    return config[availability as keyof typeof config] || config['not-looking'];
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

  const renderCandidateProfile = () => {
    if (!selectedCandidate) return null;

    return (
      <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback>{selectedCandidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <span>{selectedCandidate.name}</span>
                  {selectedCandidate.isVerified && (
                    <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{selectedCandidate.title}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-lg font-bold px-3 py-1 rounded-full ${getMatchScoreColor(selectedCandidate.matchScore)}`}>
                  {selectedCandidate.matchScore}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Match Score</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{selectedCandidate.responseRate}%</div>
                <p className="text-xs text-muted-foreground">Response Rate</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{selectedCandidate.portfolioItems}</div>
                <p className="text-xs text-muted-foreground">Portfolio Items</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{selectedCandidate.yearsOfExperience}</div>
                <p className="text-xs text-muted-foreground">Years Exp.</p>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Professional Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCandidate.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCandidate.experience}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>${selectedCandidate.salaryRange.min.toLocaleString()} - ${selectedCandidate.salaryRange.max.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCandidate.timezone}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Availability & Preferences</h3>
                <div className="space-y-2">
                  <Badge className={getAvailabilityBadge(selectedCandidate.availability).className}>
                    {getAvailabilityBadge(selectedCandidate.availability).label}
                  </Badge>
                  <div className="flex flex-wrap gap-1">
                    {selectedCandidate.preferredWorkType.map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedCandidate.bio}</p>
            </div>

            {/* Skills */}
            <div>
              <h3 className="font-semibold mb-3">Skills & Technologies</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCandidate.skills.map(skill => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <h3 className="font-semibold mb-3">Previous Companies</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCandidate.previousCompanies.map(company => (
                  <Badge key={company} variant="outline">
                    {company}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h3 className="font-semibold mb-3">Key Achievements</h3>
              <ul className="space-y-2">
                {selectedCandidate.achievements.map((achievement, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Education & Certifications */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Education</h3>
                <p className="text-sm text-muted-foreground">{selectedCandidate.education}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Certifications</h3>
                <div className="space-y-1">
                  {selectedCandidate.certifications.map(cert => (
                    <Badge key={cert} variant="outline" className="text-xs block w-fit">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Languages */}
            <div>
              <h3 className="font-semibold mb-2">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCandidate.languages.map(language => (
                  <Badge key={language} variant="outline">
                    {language}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t">
              <Button onClick={() => contactCandidate(selectedCandidate.id)} className="flex-1">
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
              <Button 
                variant="outline" 
                onClick={() => saveCandidate(selectedCandidate.id)}
                className={savedCandidates.includes(selectedCandidate.id) ? 'bg-red-50 text-red-600' : ''}
              >
                <Heart className={`w-4 h-4 mr-2 ${savedCandidates.includes(selectedCandidate.id) ? 'fill-current' : ''}`} />
                {savedCandidates.includes(selectedCandidate.id) ? 'Saved' : 'Save'}
              </Button>
              {selectedCandidate.GitBranch && (
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  GitBranch
                </Button>
              )}
              {selectedCandidate.Link && (
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Link
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderFilters = () => (
    <Card className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
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
            onChange={(e) => setSearchFilters(prev => ({ ...prev, keywords: e.target.value }))}
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium mb-2 block">Location</label>
          <Select value={searchFilters.location} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, location: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Any location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any-location">Any location</SelectItem>
              {locations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Skills */}
        <div>
          <label className="text-sm font-medium mb-2 block">Required Skills</label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {searchFilters.skills.map(skill => (
                <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkillFilter(skill)}>
                  {skill} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
            <Select onValueChange={(value) => addSkillFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Add skill requirement" />
              </SelectTrigger>
              <SelectContent>
                {availableSkills.filter(skill => !searchFilters.skills.includes(skill)).map(skill => (
                  <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className="text-sm font-medium mb-2 block">Experience Level</label>
          <Select value={searchFilters.experience} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, experience: value }))}>
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
          <Select value={searchFilters.availability} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, availability: value }))}>
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
                      setSearchFilters(prev => ({ ...prev, workType: [...prev.workType, type] }));
                    } else {
                      setSearchFilters(prev => ({ ...prev, workType: prev.workType.filter(t => t !== type) }));
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
                onValueChange={([value]) => setSearchFilters(prev => ({ ...prev, salaryMin: value }))}
                max={300000}
                step={5000}
                className="mt-1"
              />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Maximum</span>
              <Slider
                value={[searchFilters.salaryMax]}
                onValueChange={([value]) => setSearchFilters(prev => ({ ...prev, salaryMax: value }))}
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
            onValueChange={([value]) => setSearchFilters(prev => ({ ...prev, minMatchScore: value }))}
            max={100}
            step={5}
            className="mt-1"
          />
        </div>

        {/* Timezone */}
        <div>
          <label className="text-sm font-medium mb-2 block">Timezone</label>
          <Select value={searchFilters.timezone} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, timezone: value }))}>
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
              onCheckedChange={(checked) => setSearchFilters(prev => ({ ...prev, verified: !!checked }))}
            />
            <span className="text-sm">Verified profiles only</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={searchFilters.hasPortfolio}
              onCheckedChange={(checked) => setSearchFilters(prev => ({ ...prev, hasPortfolio: !!checked }))}
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
    <Card key={candidate.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCandidate(candidate)}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg flex items-center">
                  {candidate.name}
                  {candidate.isVerified && (
                    <Badge className="ml-2 text-xs bg-blue-100 text-blue-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </h3>
                <p className="text-muted-foreground">{candidate.title}</p>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium px-2 py-1 rounded-full ${getMatchScoreColor(candidate.matchScore)}`}>
                  {candidate.matchScore}% match
                </div>
                <p className="text-xs text-muted-foreground mt-1">{candidate.responseRate}% response rate</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {candidate.location}
              </span>
              <span className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1" />
                {candidate.yearsOfExperience}y exp
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {candidate.lastActive}
              </span>
              <span className="flex items-center">
                <Globe className="w-4 h-4 mr-1" />
                {candidate.timezone}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {candidate.bio}
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {candidate.skills.slice(0, 5).map(skill => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{candidate.skills.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge className={getAvailabilityBadge(candidate.availability).className}>
                    {getAvailabilityBadge(candidate.availability).label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ${candidate.salaryRange.min.toLocaleString()} - ${candidate.salaryRange.max.toLocaleString()}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      saveCandidate(candidate.id);
                    }}
                    className={savedCandidates.includes(candidate.id) ? 'bg-red-50 text-red-600' : ''}
                  >
                    <Heart className={`w-4 h-4 ${savedCandidates.includes(candidate.id) ? 'fill-current' : ''}`} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      contactCandidate(candidate.id);
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSearchResults = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {isLoading ? 'Searching...' : `${filteredCandidates.length} candidate${filteredCandidates.length !== 1 ? 's' : ''} found`}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Finding the best matches for your requirements' : 'Based on your search criteria'}
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

      {isLoading ? (
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
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or removing some filters
            </p>
            <Button variant="outline" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map(candidate => renderCandidateCard(candidate))}
        </div>
      )}

      {/* Load More Button */}
      {!isLoading && filteredCandidates.length > 0 && filteredCandidates.length >= 10 && (
        <div className="text-center">
          <Button variant="outline" onClick={() => toast.info('Loading more candidates...')}>
            Load More Candidates
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Find Candidates</h1>
              <p className="text-sm text-muted-foreground">
                Search and connect with qualified candidates from our talent pool
              </p>
            </div>
          </div>
          
          <Button onClick={onUpgrade} className="hidden sm:flex">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
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
      </main>

      {/* Candidate Profile Modal */}
      {renderCandidateProfile()}
    </div>
  );
}













import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  FileText,
  Video,
  Star,
  MessageSquare,
  Crown,
  TrendingUp,
  Award,
  Target,
  Search,
  Briefcase,
  Loader
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ProfessionalATSDashboard from './ProfessionalATSDashboard';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

type CandidateStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';

interface Candidate {
  id: string;
  applicationId: string;
  candidateId: string;
  name: string;
  email: string;
  projectId: string;
  projectTitle: string;
  status: CandidateStatus;
  matchScore: number;
  appliedDate: string;
  skills: string[];
  experience: string;
  location: string;
  coverLetter?: string;
  resumeUrl?: string;
}

interface ATSViewProps {
  onBack: () => void;
  onStartInterview: () => void;
  selectedCandidate?: any;
}

export function ATSView({ onBack, onStartInterview, selectedCandidate }: ATSViewProps) {
  const { user } = useAuth();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedJobId = selectedCandidate?.projectId || selectedCandidate?.job_id || selectedCandidate?.id || null;
  const selectedJobTitle = selectedCandidate?.projectTitle || selectedCandidate?.title || selectedCandidate?.job_title || '';

  const loadApplications = async () => {
    try {
      setIsLoading(true);

      const supabase = createSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData?.user?.id) {
        throw new Error('No active Supabase login found. Please login again.');
      }

      const { data: recruiterProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!recruiterProfile?.id) {
        throw new Error('Recruiter profile row not found.');
      }

      let jobsQuery = supabase
        .from('jobs')
        .select('id, title')
        .eq('recruiter_id', recruiterProfile.id);

      if (selectedJobId) {
        jobsQuery = jobsQuery.eq('id', selectedJobId);
      }

      const { data: jobs, error: jobsError } = await jobsQuery;

      if (jobsError) {
        throw new Error(jobsError.message);
      }

      const jobRows = jobs || [];
      const jobIds = jobRows.map((job: any) => job.id);

      if (jobIds.length === 0) {
        setCandidates([]);
        return;
      }

      const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select('id, job_id, candidate_id, cover_letter, status, match_score, notes, recruiter_notes, created_at, updated_at')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      if (applicationsError) {
        throw new Error(applicationsError.message);
      }

      const applicationRows = applications || [];

      if (applicationRows.length === 0) {
        setCandidates([]);
        return;
      }

      const candidateIds = Array.from(new Set(applicationRows.map((app: any) => app.candidate_id).filter(Boolean)));

      const { data: profileRows, error: candidateProfileError } = await supabase
        .from('profiles')
        .select('id, auth_user_id, full_name, email, phone, location')
        .in('id', candidateIds);

      if (candidateProfileError) {
        throw new Error(candidateProfileError.message);
      }

      const profiles = profileRows || [];
      const profileAuthIds = profiles.map((profile: any) => profile.auth_user_id).filter(Boolean);
      const profileLookupIds = Array.from(new Set([...candidateIds, ...profileAuthIds]));

      let candidateDetails: any[] = [];
      if (profileLookupIds.length > 0) {
        const { data: detailRows, error: detailError } = await supabase
          .from('candidate_profiles')
          .select('*')
          .in('user_id', profileLookupIds);

        if (detailError) {
          console.error('Failed to load candidate profile details:', detailError);
        } else {
          candidateDetails = detailRows || [];
        }
      }

      const mapped: Candidate[] = applicationRows.map((application: any) => {
        const profile = profiles.find((item: any) => item.id === application.candidate_id);
        const details = candidateDetails.find(
          (item: any) => item.user_id === profile?.id || item.user_id === profile?.auth_user_id
        );
        const job = jobRows.find((item: any) => item.id === application.job_id);

        const years = details?.years_of_experience;
        const experience =
          details?.experience_summary ||
          (typeof years === 'number' ? `${years} year${years === 1 ? '' : 's'} experience` : 'Not specified');

        return {
          id: application.id,
          applicationId: application.id,
          candidateId: application.candidate_id,
          name: details?.full_name || profile?.full_name || 'Candidate',
          email: profile?.email || '',
          projectId: application.job_id,
          projectTitle: job?.title || selectedJobTitle || 'Project',
          status: application.status || 'applied',
          matchScore: Number(application.match_score || 0),
          appliedDate: application.created_at,
          skills: details?.skills || [],
          experience,
          location: details?.location || profile?.location || 'Not specified',
          coverLetter: application.cover_letter || '',
          resumeUrl: details?.resume_url || '',
        };
      });

      setCandidates(mapped);
      setSelectedCandidateId((current) => current || mapped[0]?.id || null);
    } catch (error) {
      console.error('Failed to load real applications:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load applications');
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [user?.id, selectedJobId]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        candidate.name.toLowerCase().includes(term) ||
        candidate.email.toLowerCase().includes(term) ||
        candidate.projectTitle.toLowerCase().includes(term) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [candidates, statusFilter, searchTerm]);

  const selectedCand = candidates.find(c => c.id === selectedCandidateId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'screening': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'hired': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score > 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((item) => item[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'C';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <img src={(hirevifyLogo as any).src ?? hirevifyLogo} alt="HireVify" className="h-16" />
                <div>
                  <h1 className="text-xl text-foreground">ATS - Candidate Management</h1>
                  <p className="text-sm text-muted-foreground">
                    {selectedJobTitle ? `Real applications for ${selectedJobTitle}` : 'Review real candidate applications'}
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Crown className="w-3 h-3 mr-1" />
              Premium Feature
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        <div className="w-2/3 border-r border-border">
          <div className="p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-foreground">Candidates ({filteredCandidates.length})</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-10 pr-4 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="screening">Screening</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="h-full flex items-center justify-center py-24">
                <div className="text-center">
                  <Loader className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading real applications...</p>
                </div>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="h-full flex items-center justify-center py-24">
                <div className="text-center max-w-md">
                  <Briefcase className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-foreground mb-2">No real applications yet</h3>
                  <p className="text-muted-foreground">
                    When candidates apply to this project, they will appear here. No dummy candidate data is shown.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredCandidates.map((candidate) => (
                  <Card
                    key={candidate.id}
                    className={`cursor-pointer transition-all border ${
                      selectedCandidateId === candidate.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {getInitials(candidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-foreground">{candidate.name}</h3>
                            <p className="text-sm text-muted-foreground">{candidate.projectTitle}</p>
                            <p className="text-xs text-muted-foreground">{candidate.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Match Score</p>
                              <p className={`text-lg ${getMatchScoreColor(candidate.matchScore)}`}>
                                {candidate.matchScore}%
                              </p>
                            </div>
                            <Badge className={getStatusColor(candidate.status)}>
                              {candidate.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Applied {new Date(candidate.appliedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-1/3 bg-card">
          {selectedCand ? (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-border">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                      {getInitials(selectedCand.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl text-foreground">{selectedCand.name}</h2>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{selectedCand.email || 'No email saved'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Applied {new Date(selectedCand.appliedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(selectedCand.status)} variant="secondary">
                  {selectedCand.status}
                </Badge>
              </div>

              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="profile" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
                    <TabsTrigger value="profile" className="gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="ats-score" className="gap-2">
                      <Target className="h-4 w-4" />
                      ATS Score
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="gap-2">
                      <Award className="h-4 w-4" />
                      Analytics
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="flex-1 overflow-y-auto p-4 space-y-4">
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-foreground font-medium">ATS Match Score</h3>
                        <span className={`text-2xl font-bold ${getMatchScoreColor(selectedCand.matchScore)}`}>
                          {selectedCand.matchScore}%
                        </span>
                      </div>
                      <Progress value={selectedCand.matchScore} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Score loaded from the real application record.
                      </p>
                    </Card>

                    <Card className="p-4">
                      <h4 className="text-foreground mb-3 font-medium">Skills</h4>
                      {selectedCand.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedCand.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No skills saved in candidate profile.</p>
                      )}
                    </Card>

                    <Card className="p-4">
                      <h4 className="text-foreground mb-3 font-medium">Experience</h4>
                      <p className="text-muted-foreground">{selectedCand.experience}</p>
                    </Card>

                    <Card className="p-4">
                      <h4 className="text-foreground mb-3 font-medium">Cover Letter</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedCand.coverLetter || 'No cover letter submitted.'}
                      </p>
                    </Card>

                    <Card className="p-4">
                      <h4 className="text-foreground mb-3 font-medium">Resume</h4>
                      {selectedCand.resumeUrl ? (
                        <Button
                          variant="outline"
                          className="w-full border-border text-foreground hover:bg-muted"
                          onClick={() => window.open(selectedCand.resumeUrl, '_blank')}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Resume
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">No resume URL saved.</p>
                      )}
                    </Card>

                    <Card className="p-4">
                      <Label htmlFor="notes" className="text-foreground mb-3 font-medium">Recruiter Notes</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Add notes about this candidate..."
                        rows={4}
                        className="bg-input-background border-border text-foreground resize-none mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">Notes save will be connected in the next cleanup step.</p>
                    </Card>

                    <div className="space-y-3">
                      <Button
                        onClick={onStartInterview}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Start Video Interview
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="border-green-200 text-green-800 hover:bg-green-50"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Shortlist
                        </Button>
                        <Button
                          variant="outline"
                          className="border-border text-foreground hover:bg-muted"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ats-score" className="flex-1 overflow-y-auto p-4 space-y-4">
                    <Card className="p-4">
                      <h4 className="text-foreground mb-3 font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        ATS Analysis
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Overall Score</span>
                          <span className={`font-bold ${getMatchScoreColor(selectedCand.matchScore)}`}>
                            {selectedCand.matchScore}%
                          </span>
                        </div>
                        <Progress value={selectedCand.matchScore} className="h-2" />
                        <p className="text-sm text-muted-foreground">
                          This score comes from the saved application row. Add real AI scoring later if needed.
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="text-foreground mb-3 font-medium">Recommendations</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>? Review candidate profile and portfolio before shortlisting.</p>
                        <p>? Schedule an interview if the skills match your project requirements.</p>
                        <p>? Update application status after screening.</p>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="performance" className="flex-1 overflow-y-auto p-0">
                    <ProfessionalATSDashboard className="p-4" />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-foreground mb-2">Select a real applicant</h3>
                <p className="text-muted-foreground">Applications from your database will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

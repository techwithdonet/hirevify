import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { 
  ArrowLeft, 
  Briefcase, 
  User, 
  Mail, 
  Calendar, 
  FileText, 
  Video,
  Star,
  MessageSquare,
  Filter,
  Search,
  Crown,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ProfessionalATSDashboard from './ProfessionalATSDashboard';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';

interface Candidate {
  id: string;
  name: string;
  email: string;
  projectId: string;
  projectTitle: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';
  matchScore: number;
  appliedDate: string;
  skills: string[];
  experience: string;
  location: string;
}

interface ATSViewProps {
  onBack: () => void;
  onStartInterview: () => void;
  selectedCandidate?: Candidate | null;
}

export function ATSView({ onBack, onStartInterview, selectedCandidate }: ATSViewProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(selectedCandidate?.id || null);
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const candidates: Candidate[] = [
    {
      id: '1',
      name: 'Alex Chen',
      email: 'alex.chen@email.com',
      projectId: '1',
      projectTitle: 'E-commerce React Frontend',
      status: 'screening',
      matchScore: 94,
      appliedDate: '2024-01-15',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'],
      experience: '5+ years',
      location: 'San Francisco, CA'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      projectId: '1',
      projectTitle: 'E-commerce React Frontend',
      status: 'interview',
      matchScore: 89,
      appliedDate: '2024-01-14',
      skills: ['React', 'JavaScript', 'CSS', 'Redux'],
      experience: '4+ years',
      location: 'New York, NY'
    },
    {
      id: '3',
      name: 'Mike Rodriguez',
      email: 'mike.r@email.com',
      projectId: '2',
      projectTitle: 'Mobile App UX Design',
      status: 'applied',
      matchScore: 87,
      appliedDate: '2024-01-16',
      skills: ['UI/UX Design', 'Figma', 'Mobile Design', 'Prototyping'],
      experience: '3+ years',
      location: 'Austin, TX'
    },
    {
      id: '4',
      name: 'Emily Zhang',
      email: 'emily.zhang@email.com',
      projectId: '3',
      projectTitle: 'API Development & Integration',
      status: 'offer',
      matchScore: 96,
      appliedDate: '2024-01-13',
      skills: ['Node.js', 'Express', 'PostgreSQL', 'AWS'],
      experience: '6+ years',
      location: 'Seattle, WA'
    },
    {
      id: '5',
      name: 'David Kim',
      email: 'david.k@email.com',
      projectId: '1',
      projectTitle: 'E-commerce React Frontend',
      status: 'rejected',
      matchScore: 72,
      appliedDate: '2024-01-12',
      skills: ['React', 'JavaScript', 'HTML'],
      experience: '2+ years',
      location: 'Los Angeles, CA'
    }
  ];

  const filteredCandidates = statusFilter === 'all' 
    ? candidates 
    : candidates.filter(c => c.status === statusFilter);

  const selectedCand = candidates.find(c => c.id === selectedCandidateId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'screening': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                  <p className="text-sm text-muted-foreground">Review and manage candidate applications</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Crown className="w-3 h-3 mr-1" />
                Premium Feature
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Candidates List */}
        <div className="w-2/3 border-r border-border">
          {/* Filters */}
          <div className="p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-foreground">Candidates ({filteredCandidates.length})</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    className="pl-10 pr-4 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="screening">Screening</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="flex-1 overflow-y-auto">
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
                            {candidate.name.split(' ').map(n => n[0]).join('')}
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
          </div>
        </div>

        {/* Candidate Detail Panel with Professional ATS */}
        <div className="w-1/3 bg-card">
          {selectedCand ? (
            <div className="h-full flex flex-col">
              {/* Candidate Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                      {selectedCand.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl text-foreground">{selectedCand.name}</h2>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{selectedCand.email}</span>
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

              {/* Professional ATS Tabs */}
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
                    {/* Match Score */}
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-foreground font-medium">ATS Match Score</h3>
                        <span className={`text-2xl font-bold ${getMatchScoreColor(selectedCand.matchScore)}`}>
                          {selectedCand.matchScore}%
                        </span>
                      </div>
                      <Progress value={selectedCand.matchScore} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Enterprise-grade ATS analysis with 95%+ accuracy
                      </p>
                    </Card>

                    {/* Skills */}
                    <Card className="p-4">
                      <h4 className="text-foreground mb-3 font-medium">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCand.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </Card>

                    {/* Experience */}
                    <Card className="p-4">
                      <h4 className="text-foreground mb-3 font-medium">Experience</h4>
                      <p className="text-muted-foreground">{selectedCand.experience}</p>
                    </Card>

                    {/* Resume */}
                    <Card className="p-4">
                      <h4 className="text-foreground mb-3 font-medium">Resume</h4>
                      <Button 
                        variant="outline" 
                        className="w-full border-border text-foreground hover:bg-muted"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Resume
                      </Button>
                    </Card>

                    {/* Notes */}
                    <Card className="p-4">
                      <Label htmlFor="notes" className="text-foreground mb-3 font-medium">Recruiter Notes</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this candidate..."
                        rows={4}
                        className="bg-input-background border-border text-foreground resize-none mt-2"
                      />
                    </Card>

                    {/* Actions */}
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
                    {/* Enhanced ATS Scoring */}
                    <Card className="p-4">
                      <h4 className="text-foreground mb-3 font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Professional ATS Analysis
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Overall Score</span>
                          <span className={`font-bold ${getMatchScoreColor(selectedCand.matchScore)}`}>
                            {selectedCand.matchScore}%
                          </span>
                        </div>
                        <Progress value={selectedCand.matchScore} className="h-2" />
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Keyword Match</span>
                            <span className="text-green-600">92%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Experience Relevance</span>
                            <span className="text-green-600">{selectedCand.matchScore - 5}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Skills Alignment</span>
                            <span className="text-yellow-600">{selectedCand.matchScore + 3}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ATS Compatibility</span>
                            <span className="text-green-600">96%</span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="text-foreground mb-3 font-medium">AI Insights</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">Strong career progression</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Award className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">High-impact achievements</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">Excellent skill-role fit</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="text-foreground mb-3 font-medium">Recommendations</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• Consider for senior-level positions</p>
                        <p>• Strong technical leadership potential</p>
                        <p>• Schedule technical deep-dive interview</p>
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
                <h3 className="text-foreground mb-2">Select a candidate</h3>
                <p className="text-muted-foreground">Click on a candidate to view their details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}






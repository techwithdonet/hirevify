/**
 * Automated Candidate Pre-screening
 * 
 * AI-powered system that automatically screens candidates against job requirements,
 * provides ranking recommendations, and generates detailed evaluation reports
 * to save recruiters time on initial candidate review.
 */

import { useState, useEffect } from 'react';
import { 
  Brain, 
  Users, 
  Target, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Star, 
  ArrowLeft, 
  Filter, 
  Search, 
  Download, 
  Eye, 
  RefreshCw,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Mail,
  Phone,
  TrendingUp,
  BarChart3,
  Award,
  Settings,
  PlayCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';

interface AutomatedScreeningProps {
  onBack: () => void;
  onUpgrade?: () => void;
  projectId?: string;
}

interface CandidateApplication {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  appliedAt: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'pending' | 'auto-approved' | 'auto-rejected' | 'needs-review' | 'interviewed' | 'hired';
  aiScore: number;
  screeningResult: {
    recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
    confidence: number;
    reasoning: string[];
    strengths: string[];
    concerns: string[];
    keyMetrics: {
      skillsMatch: number;
      experienceMatch: number;
      educationMatch: number;
      locationFit: number;
      salaryAlignment: number;
    };
    timeToReview: number; // estimated minutes
  };
  candidateProfile: {
    skills: string[];
    yearsExperience: number;
    education: string;
    location: string;
    expectedSalary?: string;
    availability: string;
    portfolio?: {
      projects: number;
      githubUrl?: string;
      linkedinUrl?: string;
    };
  };
  interviewReadiness: {
    score: number;
    preparationAreas: string[];
    suggestedQuestions: string[];
  };
}

interface ScreeningCriteria {
  requiredSkills: Array<{
    skill: string;
    importance: 'critical' | 'important' | 'preferred';
    minimumLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;
  experienceRequirements: {
    minimum: number;
    maximum?: number;
    relevantIndustry: boolean;
  };
  educationRequirements: {
    required: boolean;
    preferredLevel: string[];
  };
  locationPreferences: {
    remote: boolean;
    preferredLocations: string[];
    relocationAcceptable: boolean;
  };
  budgetConstraints: {
    min: number;
    max: number;
    currency: string;
  };
  autoScreeningRules: {
    autoApproveThreshold: number; // AI score threshold for auto-approval
    autoRejectThreshold: number; // AI score threshold for auto-rejection
    requireHumanReview: string[]; // Conditions that require human review
  };
}

interface ScreeningStats {
  totalApplications: number;
  autoApproved: number;
  autoRejected: number;
  needsReview: number;
  timeSaved: number; // hours
  avgProcessingTime: number; // minutes
  accuracyRate: number; // %
}

export function AutomatedScreening({ onBack, onUpgrade, projectId }: AutomatedScreeningProps) {
  const { user } = useAuth();
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<CandidateApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<CandidateApplication | null>(null);
  const [screeningCriteria, setScreeningCriteria] = useState<ScreeningCriteria | null>(null);
  const [stats, setStats] = useState<ScreeningStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    minScore: 0,
    recommendation: 'all',
    sortBy: 'score'
  });
  const [showCriteriaDialog, setShowCriteriaDialog] = useState(false);
  const [batchSelection, setBatchSelection] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadApplications();
    loadScreeningCriteria();
    loadStats();
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  const loadApplications = () => {
    // Mock application data with AI screening results
    const mockApplications: CandidateApplication[] = [
      {
        id: '1',
        candidateId: 'cand-1',
        candidateName: 'Sarah Chen',
        candidateEmail: 'sarah.chen@email.com',
        jobTitle: 'Senior Frontend Developer',
        appliedAt: '2024-01-15T09:00:00Z',
        status: 'auto-approved',
        aiScore: 89,
        screeningResult: {
          recommendation: 'strong_yes',
          confidence: 94,
          reasoning: [
            'Exceptional skills match (95%) with React, TypeScript, and Node.js expertise',
            'Perfect experience level with 6+ years in similar roles',
            'Strong portfolio with 8 high-quality projects',
            'Salary expectations align perfectly with budget'
          ],
          strengths: [
            '95% skills match including all critical requirements',
            'Led frontend teams at prestigious companies (Airbnb, Stripe)',
            'AWS certified with cloud deployment experience',
            'Excellent portfolio demonstrating modern React patterns'
          ],
          concerns: [],
          keyMetrics: {
            skillsMatch: 95,
            experienceMatch: 92,
            educationMatch: 88,
            locationFit: 100,
            salaryAlignment: 95
          },
          timeToReview: 5
        },
        candidateProfile: {
          skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS', 'Redux', 'CSS-in-JS', 'Testing'],
          yearsExperience: 6,
          education: 'BS Computer Science - Stanford University',
          location: 'San Francisco, CA',
          expectedSalary: '$120K - $150K',
          availability: 'Available in 2 weeks',
          portfolio: {
            projects: 8,
            githubUrl: 'GitBranch.com/sarahchen',
            linkedinUrl: 'Link.com/in/sarahchen'
          }
        },
        interviewReadiness: {
          score: 85,
          preparationAreas: ['System Design', 'Leadership Examples'],
          suggestedQuestions: [
            'Describe your experience architecting scalable frontend applications',
            'How do you ensure code quality in a fast-paced environment?'
          ]
        }
      },
      {
        id: '2',
        candidateId: 'cand-2',
        candidateName: 'Michael Rodriguez',
        candidateEmail: 'michael.r@email.com',
        jobTitle: 'Senior Frontend Developer',
        appliedAt: '2024-01-14T14:30:00Z',
        status: 'needs-review',
        aiScore: 67,
        screeningResult: {
          recommendation: 'maybe',
          confidence: 78,
          reasoning: [
            'Good technical skills but missing some advanced requirements',
            'Experience level is slightly below ideal range',
            'Strong Python/Django background but limited React experience',
            'Portfolio shows potential but needs more frontend projects'
          ],
          strengths: [
            'Strong backend development experience (4+ years)',
            'Solid fundamentals in Python and Django',
            'Good problem-solving approach in previous projects',
            'Available to start immediately'
          ],
          concerns: [
            'Limited React experience (only 1 year)',
            'No TypeScript projects in portfolio',
            'Missing AWS/cloud deployment experience',
            'Junior-level frontend experience despite backend seniority'
          ],
          keyMetrics: {
            skillsMatch: 65,
            experienceMatch: 58,
            educationMatch: 85,
            locationFit: 95,
            salaryAlignment: 80
          },
          timeToReview: 15
        },
        candidateProfile: {
          skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'JavaScript', 'React', 'HTML/CSS'],
          yearsExperience: 4,
          education: 'BS Software Engineering - UT Austin',
          location: 'Austin, TX (Remote OK)',
          expectedSalary: '$90K - $120K',
          availability: 'Immediate',
          portfolio: {
            projects: 5,
            githubUrl: 'GitBranch.com/michaelr',
            linkedinUrl: 'Link.com/in/michaelrodriguez'
          }
        },
        interviewReadiness: {
          score: 72,
          preparationAreas: ['Frontend Architecture', 'React Advanced Concepts', 'TypeScript'],
          suggestedQuestions: [
            'How would you transition from backend to frontend development?',
            'Describe your experience with modern JavaScript frameworks'
          ]
        }
      },
      {
        id: '3',
        candidateId: 'cand-3',
        candidateName: 'Jennifer Park',
        candidateEmail: 'jennifer.park@email.com',
        jobTitle: 'Senior Frontend Developer',
        appliedAt: '2024-01-13T11:15:00Z',
        status: 'auto-rejected',
        aiScore: 34,
        screeningResult: {
          recommendation: 'strong_no',
          confidence: 91,
          reasoning: [
            'Significant skills gap - missing most critical requirements',
            'Experience level significantly below requirements',
            'No relevant frontend development experience',
            'Portfolio primarily shows marketing/design work'
          ],
          strengths: [
            'Strong design background and visual skills',
            'Good communication skills based on portfolio presentation',
            'Enthusiasm for learning new technologies'
          ],
          concerns: [
            'No professional development experience',
            'Missing all critical technical requirements (React, TypeScript, Node.js)',
            '90% skills gap for this senior-level position',
            'Salary expectations significantly below market rate (red flag)'
          ],
          keyMetrics: {
            skillsMatch: 15,
            experienceMatch: 25,
            educationMatch: 60,
            locationFit: 100,
            salaryAlignment: 30
          },
          timeToReview: 2
        },
        candidateProfile: {
          skills: ['HTML', 'CSS', 'Figma', 'Adobe Creative Suite', 'Basic JavaScript'],
          yearsExperience: 1,
          education: 'BA Graphic Design - Art Institute',
          location: 'Los Angeles, CA',
          expectedSalary: '$45K - $60K',
          availability: 'Immediate',
          portfolio: {
            projects: 3,
            linkedinUrl: 'Link.com/in/jenniferpark'
          }
        },
        interviewReadiness: {
          score: 35,
          preparationAreas: ['Basic Programming Concepts', 'Frontend Development Fundamentals'],
          suggestedQuestions: [
            'What attracts you to frontend development?',
            'How are you planning to develop your technical skills?'
          ]
        }
      }
    ];

    setApplications(mockApplications);
  };

  const loadScreeningCriteria = () => {
    const mockCriteria: ScreeningCriteria = {
      requiredSkills: [
        { skill: 'React', importance: 'critical', minimumLevel: 'advanced' },
        { skill: 'TypeScript', importance: 'critical', minimumLevel: 'intermediate' },
        { skill: 'Node.js', importance: 'important', minimumLevel: 'intermediate' },
        { skill: 'AWS', importance: 'preferred', minimumLevel: 'beginner' }
      ],
      experienceRequirements: {
        minimum: 4,
        maximum: 10,
        relevantIndustry: true
      },
      educationRequirements: {
        required: false,
        preferredLevel: ['Bachelor', 'Master']
      },
      locationPreferences: {
        remote: true,
        preferredLocations: ['San Francisco', 'New York', 'Seattle'],
        relocationAcceptable: false
      },
      budgetConstraints: {
        min: 100000,
        max: 160000,
        currency: 'USD'
      },
      autoScreeningRules: {
        autoApproveThreshold: 85,
        autoRejectThreshold: 40,
        requireHumanReview: ['salary_mismatch', 'location_conflict', 'overqualified']
      }
    };

    setScreeningCriteria(mockCriteria);
  };

  const loadStats = () => {
    const mockStats: ScreeningStats = {
      totalApplications: 247,
      autoApproved: 23,
      autoRejected: 156,
      needsReview: 68,
      timeSaved: 32.5,
      avgProcessingTime: 2.3,
      accuracyRate: 92
    };

    setStats(mockStats);
  };

  const applyFilters = () => {
    let filtered = [...applications];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // Score filter
    filtered = filtered.filter(app => app.aiScore >= filters.minScore);

    // Recommendation filter
    if (filters.recommendation !== 'all') {
      filtered = filtered.filter(app => app.screeningResult.recommendation === filters.recommendation);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'score':
          return b.aiScore - a.aiScore;
        case 'name':
          return a.candidateName.localeCompare(b.candidateName);
        case 'date':
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        case 'confidence':
          return b.screeningResult.confidence - a.screeningResult.confidence;
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  };

  const processSelectedCandidates = async (action: 'approve' | 'reject' | 'schedule') => {
    if (batchSelection.size === 0) {
      toast.error('Please select candidates to process');
      return;
    }

    setIsProcessing(true);

    try {
      const selectedIds = Array.from(batchSelection);
      
      // Simulate batch processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      setApplications(prev => prev.map(app => {
        if (selectedIds.includes(app.id)) {
          let newStatus: CandidateApplication['status'];
          switch (action) {
            case 'approve':
              newStatus = 'auto-approved';
              break;
            case 'reject':
              newStatus = 'auto-rejected';
              break;
            case 'schedule':
              newStatus = 'interviewed';
              break;
            default:
              return app;
          }
          return { ...app, status: newStatus };
        }
        return app;
      }));

      setBatchSelection(new Set());
      
      const actionText = action === 'schedule' ? 'scheduled for interview' : `${action}d`;
      toast.success(`${batchSelection.size} candidate(s) ${actionText}`);
      
    } catch (error) {
      console.error('Batch processing failed:', error);
      toast.error('Failed to process candidates. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const overrideAIDecision = (applicationId: string, newStatus: CandidateApplication['status'], reason: string) => {
    setApplications(prev => prev.map(app => 
      app.id === applicationId ? { ...app, status: newStatus } : app
    ));
    
    toast.success('AI decision overridden', {
      description: `Status changed to ${newStatus}. Reason: ${reason}`
    });
    
    // Log for improving AI accuracy
    console.log('AI override:', { applicationId, newStatus, reason });
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_yes': return 'bg-green-100 text-green-800 border-green-200';
      case 'yes': return 'bg-green-50 text-green-700 border-green-200';
      case 'maybe': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'no': return 'bg-red-50 text-red-700 border-red-200';
      case 'strong_no': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'strong_yes': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'yes': return <ThumbsUp className="w-4 h-4 text-green-600" />;
      case 'maybe': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'no': return <ThumbsDown className="w-4 h-4 text-red-600" />;
      case 'strong_no': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'auto-approved': return 'bg-green-100 text-green-800';
      case 'auto-rejected': return 'bg-red-100 text-red-800';
      case 'needs-review': return 'bg-yellow-100 text-yellow-800';
      case 'interviewed': return 'bg-blue-100 text-blue-800';
      case 'hired': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  Automated Candidate Screening
                </h1>
                <p className="text-sm text-muted-foreground">
                  AI-powered pre-screening with intelligent recommendations
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setShowCriteriaDialog(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Screening Criteria
              </Button>
              {onUpgrade && (
                <Button onClick={onUpgrade} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-2xl font-bold">{stats.totalApplications}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Time Saved</p>
                  <p className="text-2xl font-bold">{stats.timeSaved}h</p>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>vs manual screening</span>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Accuracy</p>
                  <p className="text-2xl font-bold">{stats.accuracyRate}%</p>
                </div>
                <Target className="w-8 h-8 text-primary" />
              </div>
              <div className="mt-2">
                <Progress value={stats.accuracyRate} className="h-2" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Processing</p>
                  <p className="text-2xl font-bold">{stats.avgProcessingTime}m</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </Card>
          </div>
        )}

        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="queue">Screening Queue</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">AI Settings</TabsTrigger>
          </TabsList>

          {/* Screening Queue Tab */}
          <TabsContent value="queue" className="space-y-6">
            {/* Filters and Batch Actions */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filter & Batch Actions</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {batchSelection.size} selected
                  </span>
                  {batchSelection.size > 0 && (
                    <>
                      <Button size="sm" onClick={() => processSelectedCandidates('approve')} disabled={isProcessing}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => processSelectedCandidates('schedule')} disabled={isProcessing}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => processSelectedCandidates('reject')} disabled={isProcessing}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="needs-review">Needs Human Review</SelectItem>
                    <SelectItem value="auto-approved">Auto Approved</SelectItem>
                    <SelectItem value="auto-rejected">Auto Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.recommendation} onValueChange={(value) => setFilters(prev => ({ ...prev, recommendation: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Recommendations</SelectItem>
                    <SelectItem value="strong_yes">Strong Yes</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="maybe">Maybe</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="strong_no">Strong No</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.minScore.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, minScore: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Score</SelectItem>
                    <SelectItem value="60">60%+</SelectItem>
                    <SelectItem value="70">70%+</SelectItem>
                    <SelectItem value="80">80%+</SelectItem>
                    <SelectItem value="90">90%+</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => setFilters({ status: 'all', minScore: 0, recommendation: 'all', sortBy: 'score' })}>
                  Clear Filters
                </Button>
              </div>
            </Card>

            {/* Applications List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {filteredApplications.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Applications Found</h3>
                    <p className="text-muted-foreground">
                      Adjust your filters or wait for new applications to arrive
                    </p>
                  </Card>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        Candidate Applications ({filteredApplications.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>

                    {filteredApplications.map((application) => (
                      <Card 
                        key={application.id}
                        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedApplication?.id === application.id ? 'ring-2 ring-primary border-primary' : ''
                        }`}
                        onClick={() => setSelectedApplication(application)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={batchSelection.has(application.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setBatchSelection(prev => new Set([...prev, application.id]));
                                } else {
                                  setBatchSelection(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(application.id);
                                    return newSet;
                                  });
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>
                                {application.candidateName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{application.candidateName}</h4>
                              <p className="text-sm text-muted-foreground">{application.candidateEmail}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={`${getRecommendationColor(application.screeningResult.recommendation)} flex items-center gap-1`}>
                              {getRecommendationIcon(application.screeningResult.recommendation)}
                              {application.screeningResult.recommendation.replace('_', ' ')}
                            </Badge>
                            <Badge className={getStatusColor(application.status)}>
                              {application.status.replace('-', ' ')}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">AI Score:</span>
                            <div className="font-medium text-primary">{application.aiScore}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Experience:</span>
                            <div className="font-medium">{application.candidateProfile.yearsExperience} years</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Skills Match:</span>
                            <div className="font-medium">{application.screeningResult.keyMetrics.skillsMatch}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Review Time:</span>
                            <div className="font-medium">{application.screeningResult.timeToReview}m</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {application.candidateProfile.skills.slice(0, 4).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {application.candidateProfile.skills.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{application.candidateProfile.skills.length - 4} more
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            Applied {new Date(application.appliedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                )}
              </div>

              {/* Detailed Analysis Panel */}
              <div>
                {selectedApplication ? (
                  <Card className="p-6 sticky top-6">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="flex items-center justify-between">
                        <span>Detailed Analysis</span>
                        <Badge className={`${getRecommendationColor(selectedApplication.screeningResult.recommendation)}`}>
                          {selectedApplication.screeningResult.recommendation.replace('_', ' ')}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="px-0 space-y-4">
                      {/* Overall Score */}
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-2">
                          {selectedApplication.aiScore}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Confidence: {selectedApplication.screeningResult.confidence}%
                        </p>
                      </div>

                      <Separator />

                      {/* Key Metrics */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Key Metrics</h4>
                        {Object.entries(selectedApplication.screeningResult.keyMetrics).map(([metric, score]) => (
                          <div key={metric} className="flex items-center justify-between">
                            <span className="text-sm capitalize">
                              {metric.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div className="flex items-center gap-2">
                              <Progress value={score} className="w-16 h-2" />
                              <span className="text-sm font-medium w-8">{score}%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Strengths */}
                      <div>
                        <h4 className="font-medium mb-2 text-green-600">Strengths</h4>
                        <div className="space-y-1">
                          {selectedApplication.screeningResult.strengths.map((strength, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                              <span className="text-xs">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Concerns */}
                      {selectedApplication.screeningResult.concerns.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium mb-2 text-orange-600">Concerns</h4>
                            <div className="space-y-1">
                              {selectedApplication.screeningResult.concerns.map((concern, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <AlertCircle className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                                  <span className="text-xs">{concern}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      <Separator />

                      {/* Quick Actions */}
                      <div className="space-y-2">
                        <Button className="w-full" size="sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Interview
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Resume
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4 mr-2" />
                            Send Message
                          </Button>
                        </div>
                      </div>

                      {/* Override AI Decision */}
                      <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Override AI recommendation:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => overrideAIDecision(selectedApplication.id, 'auto-approved', 'Manual override - approved')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => overrideAIDecision(selectedApplication.id, 'auto-rejected', 'Manual override - rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <ThumbsDown className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="p-8 text-center">
                    <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Select an Application</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose an application to view detailed AI analysis
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <CardTitle className="mb-4">Screening Performance</CardTitle>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Auto-Approval Rate</span>
                    <span className="font-medium">{stats ? Math.round((stats.autoApproved / stats.totalApplications) * 100) : 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Auto-Rejection Rate</span>
                    <span className="font-medium">{stats ? Math.round((stats.autoRejected / stats.totalApplications) * 100) : 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Human Review Required</span>
                    <span className="font-medium">{stats ? Math.round((stats.needsReview / stats.totalApplications) * 100) : 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processing Speed</span>
                    <span className="font-medium">{stats?.avgProcessingTime || 0}m avg</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <CardTitle className="mb-4">Quality Metrics</CardTitle>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Accuracy</span>
                    <span className="font-medium text-green-600">{stats?.accuracyRate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">False Positives</span>
                    <span className="font-medium">3.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">False Negatives</span>
                    <span className="font-medium">4.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Time Savings</span>
                    <span className="font-medium text-green-600">{stats?.timeSaved || 0}h/week</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <CardTitle className="mb-4">AI Screening Configuration</CardTitle>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Auto-Screening Thresholds</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Auto-Approve Above</label>
                      <Input type="number" value={screeningCriteria?.autoScreeningRules.autoApproveThreshold || 85} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Auto-Reject Below</label>
                      <Input type="number" value={screeningCriteria?.autoScreeningRules.autoRejectThreshold || 40} />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Learning & Accuracy</h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Continuous Learning</span>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI learns from your hiring decisions to improve accuracy over time
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}






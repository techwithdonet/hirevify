import { useState, useEffect } from 'react';
import { 
  TestTube, 
  Star, 
  MessageSquare, 
  Send, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';

interface BetaFeedback {
  id: string;
  userId: string;
  userName: string;
  userType: 'recruiter' | 'candidate';
  type: 'bug' | 'feature_request' | 'improvement' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rating: number;
  tags: string[];
  status: 'pending' | 'reviewed' | 'in_progress' | 'resolved' | 'rejected';
  createdAt: number;
  updatedAt: number;
  responses?: BetaResponse[];
}

interface BetaResponse {
  id: string;
  feedbackId: string;
  message: string;
  isFromTeam: boolean;
  userName: string;
  createdAt: number;
}

interface BetaMetrics {
  totalFeedback: number;
  resolvedIssues: number;
  activeUsers: number;
  averageRating: number;
  featureRequests: number;
  bugReports: number;
  improvementSuggestions: number;
  responseTime: number; // in hours
}

interface BetaProgramProps {
  onBack: () => void;
  isAdmin?: boolean;
}

export function BetaProgram({ onBack, isAdmin = false }: BetaProgramProps) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<BetaFeedback[]>([]);
  const [metrics, setMetrics] = useState<BetaMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [filter, setFilter] = useState({
    type: 'all',
    status: 'all',
    priority: 'all'
  });

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'general' as const,
    priority: 'medium' as const,
    title: '',
    description: '',
    rating: 5
  });

  useEffect(() => {
    loadBetaData();
  }, []);

  const loadBetaData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demonstration
      const mockFeedback: BetaFeedback[] = [
        {
          id: 'feedback-1',
          userId: 'user-1',
          userName: 'Sarah Chen',
          userType: 'recruiter',
          type: 'feature_request',
          priority: 'high',
          title: 'Bulk candidate invitation feature',
          description: 'Would love to be able to invite multiple candidates to apply for a project at once, rather than sending individual invitations.',
          rating: 4,
          tags: ['efficiency', 'bulk-actions', 'candidate-management'],
          status: 'in_progress',
          createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
          updatedAt: Date.now() - (1 * 24 * 60 * 60 * 1000),
          responses: [
            {
              id: 'response-1',
              feedbackId: 'feedback-1',
              message: 'Great suggestion! We\'re working on this feature and expect to release it in the next sprint.',
              isFromTeam: true,
              userName: 'HireVify Team',
              createdAt: Date.now() - (1 * 24 * 60 * 60 * 1000)
            }
          ]
        },
        {
          id: 'feedback-2',
          userId: 'user-2',
          userName: 'Marcus Rodriguez',
          userType: 'candidate',
          type: 'bug',
          priority: 'medium',
          title: 'Video upload fails for large files',
          description: 'When trying to upload project explanation videos larger than 50MB, the upload fails without clear error message.',
          rating: 3,
          tags: ['video', 'upload', 'file-size'],
          status: 'resolved',
          createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000),
          updatedAt: Date.now() - (1 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'feedback-3',
          userId: 'user-3',
          userName: 'Emily Johnson',
          userType: 'recruiter',
          type: 'improvement',
          priority: 'low',
          title: 'Enhanced filtering options',
          description: 'Add more granular filtering options for candidate search, including years of experience ranges and specific technology versions.',
          rating: 5,
          tags: ['search', 'filtering', 'candidate-discovery'],
          status: 'pending',
          createdAt: Date.now() - (1 * 24 * 60 * 60 * 1000),
          updatedAt: Date.now() - (1 * 24 * 60 * 60 * 1000)
        }
      ];

      const mockMetrics: BetaMetrics = {
        totalFeedback: 47,
        resolvedIssues: 23,
        activeUsers: 156,
        averageRating: 4.2,
        featureRequests: 18,
        bugReports: 12,
        improvementSuggestions: 17,
        responseTime: 18.5
      };

      setFeedback(mockFeedback);
      setMetrics(mockMetrics);

    } catch (error) {
      console.error('Error loading beta data:', error);
      toast.error('Failed to load beta program data');
    } finally {
      setIsLoading(false);
    }
  };

  const submitFeedback = async () => {
    try {
      if (!feedbackForm.title.trim() || !feedbackForm.description.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }

      const newFeedback: BetaFeedback = {
        id: `feedback-${Date.now()}`,
        userId: user?.id || 'anonymous',
        userName: user?.name || 'Anonymous User',
        userType: user?.userType || 'candidate',
        type: feedbackForm.type,
        priority: feedbackForm.priority,
        title: feedbackForm.title,
        description: feedbackForm.description,
        rating: feedbackForm.rating,
        tags: [],
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // In production, submit to backend API
      setFeedback(prev => [newFeedback, ...prev]);
      
      // Reset form
      setFeedbackForm({
        type: 'general',
        priority: 'medium',
        title: '',
        description: '',
        rating: 5
      });
      setShowFeedbackForm(false);

      toast.success('Thank you for your feedback!', {
        description: 'Your feedback helps us improve HireVify for everyone.',
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'high': return <Flag className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'feature_request': return <Star className="w-4 h-4 text-blue-600" />;
      case 'improvement': return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'general': return <MessageSquare className="w-4 h-4 text-gray-600" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredFeedback = feedback.filter(item => {
    if (filter.type !== 'all' && item.type !== filter.type) return false;
    if (filter.status !== 'all' && item.status !== filter.status) return false;
    if (filter.priority !== 'all' && item.priority !== filter.priority) return false;
    return true;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading beta program data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onBack}>
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <TestTube className="w-8 h-8 mr-3 text-primary" />
                HireVify Beta Program
              </h1>
              <p className="text-muted-foreground">Help us build the future of skills-first hiring</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
              <Users className="w-4 h-4 mr-2" />
              Beta Tester
            </Badge>
            <Button onClick={() => setShowFeedbackForm(true)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Give Feedback
            </Button>
          </div>
        </div>

        {/* Metrics Dashboard */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Feedback</p>
                    <p className="text-2xl font-bold">{metrics.totalFeedback}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved Issues</p>
                    <p className="text-2xl font-bold">{metrics.resolvedIssues}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-success-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Beta Users</p>
                    <p className="text-2xl font-bold">{metrics.activeUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Rating</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-2xl font-bold">{metrics.averageRating}</p>
                      <div className="flex">{renderStars(Math.round(metrics.averageRating))}</div>
                    </div>
                  </div>
                  <Star className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="feedback" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feedback">Community Feedback</TabsTrigger>
            <TabsTrigger value="my-feedback">My Feedback</TabsTrigger>
            <TabsTrigger value="insights">Beta Insights</TabsTrigger>
          </TabsList>

          {/* Community Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  
                  <Select value={filter.type} onValueChange={(value) => setFilter(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="bug">Bug Reports</SelectItem>
                      <SelectItem value="feature_request">Feature Requests</SelectItem>
                      <SelectItem value="improvement">Improvements</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filter.priority} onValueChange={(value) => setFilter(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Feedback List */}
            <div className="space-y-4">
              {filteredFeedback.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getTypeIcon(item.type)}
                            <h3 className="font-semibold">{item.title}</h3>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.replace('_', ' ')}
                            </Badge>
                            {getPriorityIcon(item.priority)}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <span>By {item.userName}</span>
                            <span>•</span>
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{item.userType}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {renderStars(item.rating)}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground">{item.description}</p>

                      {/* Tags */}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Responses */}
                      {item.responses && item.responses.length > 0 && (
                        <div className="border-t pt-4 space-y-3">
                          <h4 className="font-medium text-sm">Team Response:</h4>
                          {item.responses.map((response) => (
                            <div key={response.id} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium text-sm">{response.userName}</span>
                                {response.isFromTeam && (
                                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                    Team
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(response.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm">{response.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* My Feedback Tab */}
          <TabsContent value="my-feedback" className="space-y-6">
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your Feedback History</h3>
              <p className="text-muted-foreground mb-4">
                Track the status of your feedback and suggestions
              </p>
              <Button onClick={() => setShowFeedbackForm(true)}>
                <Send className="w-4 h-4 mr-2" />
                Submit New Feedback
              </Button>
            </div>
          </TabsContent>

          {/* Beta Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Feedback Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Star className="w-4 h-4 mr-2 text-blue-600" />
                        Feature Requests
                      </span>
                      <span className="font-semibold">{metrics.featureRequests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                        Bug Reports
                      </span>
                      <span className="font-semibold">{metrics.bugReports}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                        Improvements
                      </span>
                      <span className="font-semibold">{metrics.improvementSuggestions}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Response Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Average Response Time</span>
                      <span className="font-semibold">{metrics.responseTime.toFixed(1)} hours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Resolution Rate</span>
                      <span className="font-semibold">
                        {Math.round((metrics.resolvedIssues / metrics.totalFeedback) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>User Satisfaction</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{metrics.averageRating}/5</span>
                        <div className="flex">{renderStars(Math.round(metrics.averageRating))}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Feedback Form Modal */}
        {showFeedbackForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Submit Beta Feedback</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Help us improve HireVify by sharing your experience
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Feedback Type</label>
                    <Select 
                      value={feedbackForm.type} 
                      onValueChange={(value: any) => setFeedbackForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="improvement">Improvement</SelectItem>
                        <SelectItem value="general">General Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <Select 
                      value={feedbackForm.priority} 
                      onValueChange={(value: any) => setFeedbackForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    value={feedbackForm.title}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief summary of your feedback"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <Textarea
                    value={feedbackForm.description}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of your feedback, including steps to reproduce if it's a bug"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Overall Rating</label>
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setFeedbackForm(prev => ({ ...prev, rating: i + 1 }))}
                        className="p-1"
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            i < feedbackForm.rating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300 hover:text-yellow-200'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFeedbackForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={submitFeedback}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
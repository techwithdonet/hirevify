/**
 * AI Smart Notifications System
 * 
 * Intelligent notification system that uses AI to predict optimal timing,
 * personalize content, and provide actionable insights through contextual notifications.
 */

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Brain, 
  Clock, 
  TrendingUp, 
  Target, 
  Users,
  MessageSquare,
  Briefcase,
  Star,
  AlertCircle,
  CheckCircle,
  X,
  Settings,
  Filter,
  ArrowLeft,
  Zap,
  Calendar,
  DollarSign,
  Award,
  Lightbulb,
  Activity,
  BarChart3,
  Bookmark,
  Eye,
  ThumbsUp,
  Archive
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { useAuth } from './AuthProvider';

interface AISmartNotificationsProps {
  onBack: () => void;
  onUpgrade?: () => void;
  onUpdateUnreadCount?: (count: number) => void;
}

interface SmartNotification {
  id: string;
  type: 'opportunity' | 'reminder' | 'insight' | 'alert' | 'achievement' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  aiReasoning: string;
  actions: NotificationAction[];
  timestamp: Date;
  read: boolean;
  archived: boolean;
  category: string;
  relevanceScore: number; // 0-100
  urgencyScore: number; // 0-100
  personalizedContent: boolean;
  optimalTiming: {
    suggestedTime: Date;
    timezone: string;
    confidence: number;
  };
  metadata: {
    source: string;
    relatedItems: string[];
    expiresAt?: Date;
  };
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'link';
  action: () => void;
}

interface NotificationPreferences {
  categories: {
    opportunities: boolean;
    reminders: boolean;
    insights: boolean;
    alerts: boolean;
    achievements: boolean;
    recommendations: boolean;
  };
  delivery: {
    immediate: boolean;
    digest: boolean;
    quiet_hours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  ai_features: {
    smart_timing: boolean;
    personalized_content: boolean;
    predictive_notifications: boolean;
  };
}

interface AIAnalytics {
  engagement: {
    openRate: number;
    actionRate: number;
    dismissRate: number;
  };
  timing: {
    optimalHours: number[];
    bestDays: string[];
    avgResponseTime: number;
  };
  content: {
    mostEngaging: string[];
    leastEngaging: string[];
    preferredLength: 'short' | 'medium' | 'long';
  };
}

export function AISmartNotifications({ onBack, onUpgrade, onUpdateUnreadCount }: AISmartNotificationsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    categories: {
      opportunities: true,
      reminders: true,
      insights: true,
      alerts: true,
      achievements: true,
      recommendations: true
    },
    delivery: {
      immediate: true,
      digest: false,
      quiet_hours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    },
    ai_features: {
      smart_timing: true,
      personalized_content: true,
      predictive_notifications: true
    }
  });
  const [analytics, setAnalytics] = useState<AIAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    loadNotifications();
    loadAnalytics();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    
    try {
      // Simulate AI-generated notifications
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockNotifications: SmartNotification[] = [
        {
          id: '1',
          type: 'opportunity',
          priority: 'high',
          title: 'Perfect Job Match Detected',
          message: 'A Senior React Developer position at TechCorp matches 94% of your skills and preferences. Salary: $130k-$150k.',
          aiReasoning: 'This role aligns perfectly with your React expertise, desired salary range, and remote work preference. The company culture also matches your values.',
          actions: [
            { id: '1', label: 'View Job', type: 'primary', action: () => toast.info('Opening job details') },
            { id: '2', label: 'Quick Apply', type: 'secondary', action: () => toast.success('Application started') }
          ],
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          read: false,
          archived: false,
          category: 'Job Opportunities',
          relevanceScore: 94,
          urgencyScore: 85,
          personalizedContent: true,
          optimalTiming: {
            suggestedTime: new Date(Date.now() + 1000 * 60 * 60 * 2),
            timezone: 'PST',
            confidence: 87
          },
          metadata: {
            source: 'AI Job Matching',
            relatedItems: ['job_123', 'company_456'],
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48)
          }
        },
        {
          id: '2',
          type: 'insight',
          priority: 'medium',
          title: 'Skills Market Analysis Update',
          message: 'TypeScript demand increased 23% this month. Your current skill level puts you in the top 15% of candidates.',
          aiReasoning: 'Based on job posting analysis and your recent TypeScript work, you\'re well-positioned for premium opportunities.',
          actions: [
            { id: '1', label: 'View Trends', type: 'primary', action: () => toast.info('Opening market trends') },
            { id: '2', label: 'Skill Assessment', type: 'secondary', action: () => toast.info('Starting assessment') }
          ],
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          read: false,
          archived: false,
          category: 'Market Intelligence',
          relevanceScore: 78,
          urgencyScore: 45,
          personalizedContent: true,
          optimalTiming: {
            suggestedTime: new Date(Date.now() + 1000 * 60 * 60 * 1),
            timezone: 'PST',
            confidence: 92
          },
          metadata: {
            source: 'Market Analysis Engine',
            relatedItems: ['skill_typescript', 'market_data_2024']
          }
        },
        {
          id: '3',
          type: 'reminder',
          priority: 'urgent',
          title: 'Interview Tomorrow',
          message: 'Technical interview with StartupXYZ tomorrow at 2 PM. Review: React hooks, system design, and company values.',
          aiReasoning: 'Based on the job description and your preparation history, focus on these key areas for maximum impact.',
          actions: [
            { id: '1', label: 'Prep Guide', type: 'primary', action: () => toast.info('Opening prep guide') },
            { id: '2', label: 'Practice Questions', type: 'secondary', action: () => toast.info('Starting practice') }
          ],
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
          read: true,
          archived: false,
          category: 'Interviews',
          relevanceScore: 100,
          urgencyScore: 95,
          personalizedContent: true,
          optimalTiming: {
            suggestedTime: new Date(Date.now() - 1000 * 60 * 60 * 8),
            timezone: 'PST',
            confidence: 98
          },
          metadata: {
            source: 'Interview Scheduler',
            relatedItems: ['interview_789', 'company_xyz'],
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 6)
          }
        },
        {
          id: '4',
          type: 'achievement',
          priority: 'low',
          title: 'Skill Milestone Reached',
          message: 'Congratulations! You\'ve completed 50 hours of AWS learning. You\'re now in the top 25% of cloud engineers.',
          aiReasoning: 'This achievement significantly boosts your market value and opens up cloud architecture opportunities.',
          actions: [
            { id: '1', label: 'Share Achievement', type: 'primary', action: () => toast.success('Shared on LinkedIn') },
            { id: '2', label: 'Next Milestone', type: 'secondary', action: () => toast.info('Setting next goal') }
          ],
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
          read: true,
          archived: false,
          category: 'Achievements',
          relevanceScore: 65,
          urgencyScore: 20,
          personalizedContent: true,
          optimalTiming: {
            suggestedTime: new Date(Date.now() - 1000 * 60 * 60 * 12),
            timezone: 'PST',
            confidence: 75
          },
          metadata: {
            source: 'Learning Tracker',
            relatedItems: ['skill_aws', 'milestone_50h']
          }
        },
        {
          id: '5',
          type: 'recommendation',
          priority: 'medium',
          title: 'Networking Opportunity',
          message: 'Tech meetup "React Best Practices" this Friday has 3 senior engineers from companies you\'re interested in.',
          aiReasoning: 'Based on your networking goals and target companies, this event has high networking potential.',
          actions: [
            { id: '1', label: 'RSVP Event', type: 'primary', action: () => toast.success('RSVP confirmed') },
            { id: '2', label: 'View Attendees', type: 'secondary', action: () => toast.info('Opening attendee list') }
          ],
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          read: false,
          archived: false,
          category: 'Networking',
          relevanceScore: 82,
          urgencyScore: 65,
          personalizedContent: true,
          optimalTiming: {
            suggestedTime: new Date(Date.now() + 1000 * 60 * 60 * 4),
            timezone: 'PST',
            confidence: 80
          },
          metadata: {
            source: 'Event Recommendations',
            relatedItems: ['event_react_meetup', 'networking_goals']
          }
        },
        {
          id: '6',
          type: 'alert',
          priority: 'high',
          title: 'Application Deadline Soon',
          message: 'Your application for Google SWE II closes in 6 hours. 89% complete - missing: cover letter.',
          aiReasoning: 'This is a high-priority opportunity that matches your career goals. The application is nearly complete.',
          actions: [
            { id: '1', label: 'Complete Now', type: 'primary', action: () => toast.info('Opening application') },
            { id: '2', label: 'AI Cover Letter', type: 'secondary', action: () => toast.info('Generating cover letter') }
          ],
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18),
          read: false,
          archived: false,
          category: 'Applications',
          relevanceScore: 91,
          urgencyScore: 90,
          personalizedContent: true,
          optimalTiming: {
            suggestedTime: new Date(Date.now() - 1000 * 60 * 60 * 18),
            timezone: 'PST',
            confidence: 95
          },
          metadata: {
            source: 'Application Tracker',
            relatedItems: ['application_google', 'job_swe2'],
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 6)
          }
        }
      ];

      setNotifications(mockNotifications);
      
      // Update unread count
      const unreadCount = mockNotifications.filter(n => !n.read).length;
      onUpdateUnreadCount?.(unreadCount);
      
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    const mockAnalytics: AIAnalytics = {
      engagement: {
        openRate: 87,
        actionRate: 64,
        dismissRate: 13
      },
      timing: {
        optimalHours: [9, 10, 14, 16, 19],
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        avgResponseTime: 245 // minutes
      },
      content: {
        mostEngaging: ['Job Opportunities', 'Skill Insights', 'Interview Prep'],
        leastEngaging: ['General Updates', 'Social Features'],
        preferredLength: 'medium'
      }
    };

    setAnalytics(mockAnalytics);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
    
    // Update unread count
    const unreadCount = notifications.filter(n => !n.read && n.id !== notificationId).length;
    onUpdateUnreadCount?.(unreadCount);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    onUpdateUnreadCount?.(0);
    toast.success('All notifications marked as read');
  };

  const archiveNotification = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, archived: true } : n
    ));
    toast.success('Notification archived');
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success('Notification deleted');
  };

  const updatePreferences = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    toast.success('Preferences updated');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'reminder': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'insight': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'alert': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'achievement': return <Award className="w-4 h-4 text-green-500" />;
      case 'recommendation': return <Star className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (notification.archived) return false;
    if (filterCategory !== 'all' && notification.category !== filterCategory) return false;
    if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Smart Notifications</h1>
              <p className="text-muted-foreground">Loading AI-powered notifications...</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  Smart Notifications
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  AI-powered notifications with intelligent timing and personalization
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
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

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">AI Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Job Opportunities">Job Opportunities</SelectItem>
                  <SelectItem value="Market Intelligence">Market Intelligence</SelectItem>
                  <SelectItem value="Interviews">Interviews</SelectItem>
                  <SelectItem value="Achievements">Achievements</SelectItem>
                  <SelectItem value="Networking">Networking</SelectItem>
                  <SelectItem value="Applications">Applications</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <Card className="p-8 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No notifications</h3>
                  <p className="text-muted-foreground">
                    {filterCategory !== 'all' || filterPriority !== 'all' 
                      ? 'No notifications match your current filters'
                      : 'You\'re all caught up! AI will notify you when something important happens.'
                    }
                  </p>
                </Card>
              ) : (
                filteredNotifications.map(notification => (
                  <Card 
                    key={notification.id} 
                    className={`p-6 transition-all duration-200 ${
                      !notification.read ? 'ring-2 ring-primary/20 bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center border flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{notification.title}</h3>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-8 w-8 p-0"
                              >
                                {notification.read ? <Eye className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => archiveNotification(notification.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Archive className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* AI Reasoning */}
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Brain className="w-3 h-3 text-primary" />
                            <span className="text-xs font-medium text-primary">AI Insight</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.aiReasoning}</p>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                          <span>{getRelativeTime(notification.timestamp)}</span>
                          <span>•</span>
                          <span>{notification.category}</span>
                          <span>•</span>
                          <span>Relevance: {notification.relevanceScore}%</span>
                          {notification.metadata.expiresAt && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600">
                                Expires: {getRelativeTime(notification.metadata.expiresAt)}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {notification.actions.map(action => (
                            <Button
                              key={action.id}
                              size="sm"
                              variant={action.type === 'primary' ? 'default' : 'outline'}
                              onClick={() => {
                                action.action();
                                if (!notification.read) {
                                  markAsRead(notification.id);
                                }
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notification Categories */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Notification Categories</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="space-y-4">
                    {Object.entries(preferences.categories).map(([key, enabled]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {key === 'opportunities' && 'Job matches and career opportunities'}
                            {key === 'reminders' && 'Interview prep and deadline alerts'}
                            {key === 'insights' && 'Market trends and skill analysis'}
                            {key === 'alerts' && 'Urgent action items and deadlines'}
                            {key === 'achievements' && 'Milestones and accomplishments'}
                            {key === 'recommendations' && 'AI-suggested actions and tips'}
                          </p>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            updatePreferences('categories', { ...preferences.categories, [key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Features */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    AI Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Smart Timing</p>
                        <p className="text-sm text-muted-foreground">
                          AI predicts optimal notification timing
                        </p>
                      </div>
                      <Switch
                        checked={preferences.ai_features.smart_timing}
                        onCheckedChange={(checked) => 
                          updatePreferences('ai_features', { 
                            ...preferences.ai_features, 
                            smart_timing: checked 
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Personalized Content</p>
                        <p className="text-sm text-muted-foreground">
                          Tailor notifications to your preferences
                        </p>
                      </div>
                      <Switch
                        checked={preferences.ai_features.personalized_content}
                        onCheckedChange={(checked) => 
                          updatePreferences('ai_features', { 
                            ...preferences.ai_features, 
                            personalized_content: checked 
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Predictive Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified before important events
                        </p>
                      </div>
                      <Switch
                        checked={preferences.ai_features.predictive_notifications}
                        onCheckedChange={(checked) => 
                          updatePreferences('ai_features', { 
                            ...preferences.ai_features, 
                            predictive_notifications: checked 
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Settings */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Delivery Settings</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Immediate Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications as they happen
                        </p>
                      </div>
                      <Switch
                        checked={preferences.delivery.immediate}
                        onCheckedChange={(checked) => 
                          updatePreferences('delivery', { 
                            ...preferences.delivery, 
                            immediate: checked 
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Daily Digest</p>
                        <p className="text-sm text-muted-foreground">
                          Receive a summary of daily notifications
                        </p>
                      </div>
                      <Switch
                        checked={preferences.delivery.digest}
                        onCheckedChange={(checked) => 
                          updatePreferences('delivery', { 
                            ...preferences.delivery, 
                            digest: checked 
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Quiet Hours</p>
                        <p className="text-sm text-muted-foreground">
                          Disable notifications during specified hours
                        </p>
                      </div>
                      <Switch
                        checked={preferences.delivery.quiet_hours.enabled}
                        onCheckedChange={(checked) => 
                          updatePreferences('delivery', { 
                            ...preferences.delivery, 
                            quiet_hours: { 
                              ...preferences.delivery.quiet_hours, 
                              enabled: checked 
                            }
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Settings */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Test & Preview</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="space-y-4">
                    <Button className="w-full" variant="outline">
                      <Bell className="w-4 h-4 mr-2" />
                      Send Test Notification
                    </Button>
                    
                    <Button className="w-full" variant="outline">
                      <Activity className="w-4 h-4 mr-2" />
                      Optimize AI Settings
                    </Button>
                    
                    <Button className="w-full" variant="outline">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Performance Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Engagement Metrics */}
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Engagement Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Open Rate</span>
                        <span className="font-medium">{analytics.engagement.openRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Action Rate</span>
                        <span className="font-medium">{analytics.engagement.actionRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Dismiss Rate</span>
                        <span className="font-medium">{analytics.engagement.dismissRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timing Analytics */}
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Optimal Timing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm mb-2">Best Hours</p>
                        <div className="flex flex-wrap gap-1">
                          {analytics.timing.optimalHours.map(hour => (
                            <Badge key={hour} variant="secondary" className="text-xs">
                              {hour}:00
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm mb-2">Best Days</p>
                        <div className="flex flex-wrap gap-1">
                          {analytics.timing.bestDays.map(day => (
                            <Badge key={day} variant="secondary" className="text-xs">
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Avg Response Time</span>
                        <span className="font-medium">{Math.round(analytics.timing.avgResponseTime / 60)}h</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Analytics */}
                <Card className="p-6 lg:col-span-2">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      Content Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2 text-green-600">Most Engaging</h4>
                        <div className="space-y-1">
                          {analytics.content.mostEngaging.map(category => (
                            <div key={category} className="flex items-center gap-2">
                              <ThumbsUp className="w-3 h-3 text-green-500" />
                              <span className="text-sm">{category}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2 text-red-600">Least Engaging</h4>
                        <div className="space-y-1">
                          {analytics.content.leastEngaging.map(category => (
                            <div key={category} className="flex items-center gap-2">
                              <X className="w-3 h-3 text-red-500" />
                              <span className="text-sm">{category}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Preferred Content Length</span>
                      <Badge variant="outline" className="capitalize">
                        {analytics.content.preferredLength}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
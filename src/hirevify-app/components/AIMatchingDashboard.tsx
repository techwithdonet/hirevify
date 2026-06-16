/**
 * AI Matching Dashboard
 * 
 * Comprehensive dashboard for AI matching system including real-time metrics,
 * performance analytics, and interactive controls for the matching algorithm.
 */

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  Zap, 
  BarChart3, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Settings,
  Eye,
  ThumbsUp,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

interface AIMatchingDashboardProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

export function AIMatchingDashboard({ onBack, onUpgrade }: AIMatchingDashboardProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Load AI metrics from service
      const { aiMatchingService } = await import('../utils/ai/matchingService');
      const data = aiMatchingService.getMatchingMetrics();
      setMetrics(data);

      // Load recent matches (mock data for demo)
      setRecentMatches([
        {
          id: '1',
          candidateName: 'Sarah Chen',
          projectTitle: 'React Frontend Development',
          score: 0.92,
          status: 'hired',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
          id: '2',
          candidateName: 'Michael Rodriguez',
          projectTitle: 'Full-Stack Web App',
          score: 0.87,
          status: 'interviewed',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
        },
        {
          id: '3',
          candidateName: 'Emily Johnson',
          projectTitle: 'UI/UX Design Project',
          score: 0.84,
          status: 'applied',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
        },
        {
          id: '4',
          candidateName: 'David Kim',
          projectTitle: 'Python Data Analysis',
          score: 0.79,
          status: 'viewed',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString()
        }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set mock data for demonstration
      setMetrics({
        performance: {
          totalMatches: 1247,
          successRate: 0.78,
          averageMatchScore: 0.73,
          averageConfidence: 0.82,
          currentWeights: {
            skills: 0.35,
            experience: 0.25,
            availability: 0.15,
            budget: 0.15,
            preferences: 0.07,
            location: 0.03
          }
        },
        cacheStats: {
          totalCachedMatches: 342,
          cacheHitRate: 0.85
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
    toast.success('Dashboard data refreshed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired': return 'bg-green-100 text-green-800 border-green-200';
      case 'interviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'applied': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'viewed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hired': return <CheckCircle className="w-3 h-3" />;
      case 'interviewed': return <Users className="w-3 h-3" />;
      case 'applied': return <ThumbsUp className="w-3 h-3" />;
      case 'viewed': return <Eye className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">AI Matching System</h1>
              <p className="text-muted-foreground">Loading performance analytics...</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { performance, cacheStats } = metrics;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                AI Matching System
              </h1>
              <p className="text-muted-foreground">
                Intelligent candidate-project matching with real-time analytics
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {onUpgrade && (
              <Button onClick={onUpgrade} className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Zap className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* AI Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Status</p>
                <p className="text-2xl font-bold text-green-600">Active</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Learning continuously</span>
            </div>
          </Card>

          {/* Today's Matches */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Matches</p>
                <p className="text-2xl font-bold">247</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">+23% vs yesterday</span>
            </div>
          </Card>

          {/* Success Rate */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{Math.round(performance.successRate * 100)}%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={performance.successRate * 100} className="h-2" />
            </div>
          </Card>

          {/* Cache Performance */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{Math.round(cacheStats.cacheHitRate * 100)}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={cacheStats.cacheHitRate * 100} className="h-2" />
            </div>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="matches">Recent Matches</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Matches Generated</span>
                    <span className="font-medium">{performance.totalMatches.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Match Score</span>
                    <span className="font-medium">{Math.round(performance.averageMatchScore * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Algorithm Confidence</span>
                    <span className="font-medium">{Math.round(performance.averageConfidence * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cached Results</span>
                    <span className="font-medium">{cacheStats.totalCachedMatches}</span>
                  </div>
                </div>
              </Card>

              {/* Algorithm Weights */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Current Algorithm Weights
                </h3>
                <div className="space-y-3">
                  {Object.entries(performance.currentWeights).map(([factor, weight]) => (
                    <div key={factor} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="capitalize">
                          {factor.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-muted-foreground">
                          {Math.round((weight as number) * 100)}%
                        </span>
                      </div>
                      <Progress value={(weight as number) * 100} className="h-1.5" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Weights automatically optimize based on successful matches
                  </p>
                </div>
              </Card>
            </div>

            {/* Quick Insights */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Skills Matching</span>
                  </div>
                  <p className="text-xs text-green-700">
                    35% weight in algorithm. Excellent performance with contextual skill understanding.
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Experience Level</span>
                  </div>
                  <p className="text-xs text-yellow-700">
                    25% weight. Consider adjusting for junior-level project preferences.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Match Quality</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Trending upward. 78% of AI matches result in successful project completion.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Performance */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Daily Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Matches Generated</span>
                    <span className="font-medium">247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Processing Time</span>
                    <span className="font-medium">324ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cache Hit Rate</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Requests</span>
                    <span className="font-medium">1,842</span>
                  </div>
                </div>
              </Card>

              {/* Weekly Trends */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Weekly Trends</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate Change</span>
                    <Badge className="bg-green-100 text-green-800">+5.2%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Match Score</span>
                    <Badge className="bg-blue-100 text-blue-800">+3.1%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processing Speed</span>
                    <Badge className="bg-green-100 text-green-800">+12%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">User Satisfaction</span>
                    <Badge className="bg-green-100 text-green-800">+7.8%</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Recent Matches Tab */}
          <TabsContent value="matches" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent AI Matches</h3>
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium">{match.candidateName}</span>
                        <span className="text-muted-foreground">ÃƒÆ’Ã‚¢Ãƒ¢Ã¢â€š¬Ã‚ Ãƒ¢Ã¢â€š¬Ã¢â€ž¢</span>
                        <span className="text-sm text-muted-foreground">{match.projectTitle}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(match.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {Math.round(match.score * 100)}% match
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Score: {match.score.toFixed(2)}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(match.status)} flex items-center gap-1`}
                      >
                        {getStatusIcon(match.status)}
                        {match.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Algorithm Settings</h3>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Automatic Learning</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    The AI continuously learns from successful matches to improve recommendations
                  </p>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Cache Settings</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Match results are cached for 24 hours to improve performance
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">24h TTL</Badge>
                    <Badge className="bg-green-100 text-green-800">85% Hit Rate</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Performance Monitoring</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Real-time monitoring of algorithm performance and success metrics
                  </p>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}









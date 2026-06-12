/**
 * AI Career Advisor
 * 
 * Intelligent career guidance system that analyzes market trends, 
 * candidate profiles, and industry data to provide personalized 
 * career path recommendations and long-term strategic advice.
 */

import { useState, useEffect } from 'react';
import { 
  Brain, 
  Play,
  TrendingUp, 
  Target, 
  MapPin,
  Clock,
  DollarSign,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Star,
  Award,
  Briefcase,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Zap,
  BookOpen,
  Trophy,
  Rocket,
  LineChart,
  Globe,
  Building,
  UserCheck
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';

interface AICareerAdvisorProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

interface CareerPath {
  id: string;
  title: string;
  description: string;
  currentRelevance: number; // 0-100
  futureProjection: number; // 0-100
  salaryRange: {
    entry: number;
    mid: number;
    senior: number;
    expert: number;
  };
  timeToAchieve: number; // months
  requiredSkills: string[];
  growthRate: number; // percentage
  marketDemand: 'low' | 'medium' | 'high' | 'critical';
  industry: string;
  locations: string[];
  workType: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  jobSecurity: number; // 0-100
  workLifeBalance: number; // 0-100
  stress: 'low' | 'medium' | 'high';
}

interface MarketTrend {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'transformative';
  timeframe: string;
  affectedRoles: string[];
  opportunities: string[];
  threats: string[];
  preparation: string[];
}

interface CareerMilestone {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  skills: string[];
  actions: string[];
  completed: boolean;
  progress: number;
}

interface AIInsight {
  type: 'opportunity' | 'warning' | 'trend' | 'action';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export function AICareerAdvisor({ onBack, onUpgrade }: AICareerAdvisorProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [milestones, setMilestones] = useState<CareerMilestone[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [showPathDialog, setShowPathDialog] = useState(false);
  const [timeframe, setTimeframe] = useState('5years');

  useEffect(() => {
    loadCareerData();
    generateAIInsights();
  }, []);

  const loadCareerData = async () => {
    setIsLoading(true);
    
    try {
      // Simulate AI analysis of career data
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const mockCareerPaths: CareerPath[] = [
        {
          id: '1',
          title: 'Senior Full-Stack Developer',
          description: 'Lead development of complex web applications with modern technologies',
          currentRelevance: 85,
          futureProjection: 90,
          salaryRange: { entry: 75000, mid: 105000, senior: 135000, expert: 180000 },
          timeToAchieve: 18,
          requiredSkills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
          growthRate: 12,
          marketDemand: 'high',
          industry: 'Technology',
          locations: ['San Francisco', 'Seattle', 'New York', 'Remote'],
          workType: 'flexible',
          jobSecurity: 85,
          workLifeBalance: 75,
          stress: 'medium'
        },
        {
          id: '2',
          title: 'AI/ML Engineer',
          description: 'Develop and deploy machine learning models and AI systems',
          currentRelevance: 78,
          futureProjection: 95,
          salaryRange: { entry: 90000, mid: 125000, senior: 165000, expert: 220000 },
          timeToAchieve: 24,
          requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'Statistics', 'Cloud ML'],
          growthRate: 25,
          marketDemand: 'critical',
          industry: 'AI/Machine Learning',
          locations: ['San Francisco', 'Boston', 'Austin', 'Remote'],
          workType: 'hybrid',
          jobSecurity: 90,
          workLifeBalance: 70,
          stress: 'high'
        },
        {
          id: '3',
          title: 'DevOps/Cloud Architect',
          description: 'Design and manage scalable cloud infrastructure and deployment pipelines',
          currentRelevance: 82,
          futureProjection: 88,
          salaryRange: { entry: 85000, mid: 115000, senior: 150000, expert: 200000 },
          timeToAchieve: 20,
          requiredSkills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Security'],
          growthRate: 15,
          marketDemand: 'high',
          industry: 'Cloud Computing',
          locations: ['Seattle', 'Austin', 'Denver', 'Remote'],
          workType: 'remote',
          jobSecurity: 88,
          workLifeBalance: 80,
          stress: 'medium'
        },
        {
          id: '4',
          title: 'Product Manager (Technical)',
          description: 'Lead product strategy and development for technical products',
          currentRelevance: 75,
          futureProjection: 80,
          salaryRange: { entry: 95000, mid: 130000, senior: 170000, expert: 250000 },
          timeToAchieve: 30,
          requiredSkills: ['Product Strategy', 'Data Analysis', 'Leadership', 'Technical Understanding'],
          growthRate: 8,
          marketDemand: 'medium',
          industry: 'Product Management',
          locations: ['San Francisco', 'New York', 'Seattle', 'Hybrid'],
          workType: 'hybrid',
          jobSecurity: 75,
          workLifeBalance: 65,
          stress: 'high'
        }
      ];

      const mockTrends: MarketTrend[] = [
        {
          id: '1',
          title: 'AI Integration Acceleration',
          description: 'Rapid adoption of AI tools across all software development roles',
          impact: 'transformative',
          timeframe: '2024-2026',
          affectedRoles: ['Software Engineer', 'Product Manager', 'Data Analyst'],
          opportunities: ['AI-assisted development', 'ML model integration', 'AI product features'],
          threats: ['Automation of basic coding tasks', 'Reduced demand for junior developers'],
          preparation: ['Learn AI/ML fundamentals', 'Practice with AI coding tools', 'Understand AI ethics']
        },
        {
          id: '2',
          title: 'Remote-First Culture',
          description: 'Permanent shift to remote and hybrid work models',
          impact: 'high',
          timeframe: '2024-2025',
          affectedRoles: ['All technical roles'],
          opportunities: ['Global job market access', 'Better work-life balance', 'Lower cost of living'],
          threats: ['Increased competition', 'Communication challenges', 'Career advancement difficulties'],
          preparation: ['Improve remote collaboration skills', 'Build strong online presence', 'Master async communication']
        },
        {
          id: '3',
          title: 'Cloud-Native Development',
          description: 'Complete transition to cloud-native architectures and microservices',
          impact: 'high',
          timeframe: '2024-2027',
          affectedRoles: ['Backend Developer', 'DevOps Engineer', 'Solutions Architect'],
          opportunities: ['Cloud expertise premium', 'Scalable system design', 'DevOps automation'],
          threats: ['Legacy system knowledge depreciation', 'Increased complexity'],
          preparation: ['Master cloud platforms', 'Learn containerization', 'Understand microservices']
        }
      ];

      const mockMilestones: CareerMilestone[] = [
        {
          id: '1',
          title: 'Master Advanced React Patterns',
          description: 'Become proficient in advanced React concepts and patterns',
          timeframe: '3 months',
          priority: 'high',
          skills: ['React Hooks', 'Context API', 'State Management', 'Performance Optimization'],
          actions: ['Complete advanced React course', 'Build complex project', 'Contribute to open source'],
          completed: false,
          progress: 60
        },
        {
          id: '2',
          title: 'AWS Certification',
          description: 'Obtain AWS Solutions Architect certification',
          timeframe: '6 months',
          priority: 'critical',
          skills: ['AWS Services', 'Cloud Architecture', 'Security', 'Cost Optimization'],
          actions: ['Study AWS documentation', 'Practice with labs', 'Take practice exams'],
          completed: false,
          progress: 25
        },
        {
          id: '3',
          title: 'Lead a Technical Project',
          description: 'Take technical leadership role on a significant project',
          timeframe: '12 months',
          priority: 'medium',
          skills: ['Technical Leadership', 'Project Management', 'Team Coordination'],
          actions: ['Volunteer for leadership opportunities', 'Mentor junior developers', 'Improve communication skills'],
          completed: false,
          progress: 15
        }
      ];

      setCareerPaths(mockCareerPaths);
      setMarketTrends(mockTrends);
      setMilestones(mockMilestones);
      
    } catch (error) {
      console.error('Failed to load career data:', error);
      toast.error('Failed to load career data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsights = async () => {
    const mockInsights: AIInsight[] = [
      {
        type: 'opportunity',
        title: 'High-Growth AI/ML Career Path',
        description: 'Based on your technical background and market trends, transitioning to AI/ML could increase your earning potential by 35-50% within 2 years.',
        confidence: 88,
        impact: 'high',
        urgency: 'medium',
        recommendations: [
          'Start with Python and basic ML concepts',
          'Complete an online ML specialization',
          'Build portfolio projects with real datasets',
          'Network with AI professionals'
        ]
      },
      {
        type: 'warning',
        title: 'Skills Gap in Cloud Technologies',
        description: 'Your current skillset lacks cloud expertise, which is becoming essential for 85% of senior developer roles.',
        confidence: 92,
        impact: 'high',
        urgency: 'high',
        recommendations: [
          'Prioritize AWS or Azure certification',
          'Practice with cloud deployment projects',
          'Learn Infrastructure as Code (Terraform)',
          'Understand cloud security principles'
        ]
      },
      {
        type: 'trend',
        title: 'Remote Work Advantage',
        description: 'Your location and remote work skills position you well for accessing global opportunities with 40% higher salaries.',
        confidence: 85,
        impact: 'medium',
        urgency: 'low',
        recommendations: [
          'Optimize your Link for remote positions',
          'Join remote-first tech communities',
          'Showcase async communication skills',
          'Consider timezone-flexible roles'
        ]
      },
      {
        type: 'action',
        title: 'Immediate Salary Negotiation Opportunity',
        description: 'Market data suggests you are 15-20% below market rate for your current role and skills.',
        confidence: 75,
        impact: 'medium',
        urgency: 'high',
        recommendations: [
          'Research current market salaries',
          'Document your recent achievements',
          'Schedule performance review meeting',
          'Prepare compelling compensation case'
        ]
      }
    ];

    setInsights(mockInsights);
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'trend': return <BarChart3 className="w-4 h-4 text-blue-500" />;
      case 'action': return <Target className="w-4 h-4 text-purple-500" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'transformative': return 'text-purple-600 bg-purple-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">AI Career Advisor</h1>
              <p className="text-muted-foreground">Analyzing market trends and generating personalized career insights...</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  AI Career Advisor
                </h1>
                <p className="text-sm text-muted-foreground">
                  Intelligent career guidance powered by market analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2years">2 Years</SelectItem>
                  <SelectItem value="5years">5 Years</SelectItem>
                  <SelectItem value="10years">10 Years</SelectItem>
                </SelectContent>
              </Select>
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
        {/* Career Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Career Score</p>
                <p className="text-2xl font-bold">82/100</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={82} className="h-2" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Market Position</p>
                <p className="text-2xl font-bold">Strong</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-yellow-600">Top 25% in your field</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth Potential</p>
                <p className="text-2xl font-bold">+45%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Rocket className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Next 2 years</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Confidence</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">High accuracy</span>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="paths">Career Paths</TabsTrigger>
            <TabsTrigger value="trends">Market Trends</TabsTrigger>
            <TabsTrigger value="roadmap">Personal Roadmap</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* AI Insights */}
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <div className="space-y-4">
                  {insights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{insight.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${insight.impact === 'high' ? 'bg-red-100 text-red-800' : insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {insight.impact} impact
                              </Badge>
                              <span className="text-xs text-muted-foreground">{insight.confidence}%</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <ArrowRight className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                            <Button size="sm">Take Action</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Career Progression Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Current Level</span>
                      <Badge className="bg-blue-100 text-blue-800">Mid-Level</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Next Milestone</span>
                      <span className="text-sm font-medium">Senior Developer (18 months)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Salary Growth</span>
                      <span className="text-sm font-medium text-green-600">+$25k - $35k</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Market Demand</span>
                      <Badge className="bg-green-100 text-green-800">High</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Immediate Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Update AWS Skills</p>
                        <p className="text-xs text-muted-foreground">Critical for next role</p>
                      </div>
                      <Button size="sm" variant="outline">Start</Button>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Build Portfolio Project</p>
                        <p className="text-xs text-muted-foreground">Showcase new skills</p>
                      </div>
                      <Button size="sm" variant="outline">Plan</Button>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Network with Seniors</p>
                        <p className="text-xs text-muted-foreground">Learn from experience</p>
                      </div>
                      <Button size="sm" variant="outline">Connect</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Career Paths Tab */}
          <TabsContent value="paths" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {careerPaths.map(path => (
                <Card key={path.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{path.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
                    </div>
                    <Badge className={`${getDemandColor(path.marketDemand)}`}>
                      {path.marketDemand}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span>Current Relevance</span>
                      <div className="flex items-center gap-2">
                        <Progress value={path.currentRelevance} className="w-16 h-2" />
                        <span className="font-medium">{path.currentRelevance}%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span>Future Projection</span>
                      <div className="flex items-center gap-2">
                        <Progress value={path.futureProjection} className="w-16 h-2" />
                        <span className="font-medium">{path.futureProjection}%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span>Time to Achieve</span>
                      <span className="font-medium">{path.timeToAchieve} months</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span>Growth Rate</span>
                      <span className="font-medium text-green-600">+{path.growthRate}%/year</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Salary Range</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>Entry:</span>
                        <span className="font-medium">${path.salaryRange.entry.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mid:</span>
                        <span className="font-medium">${path.salaryRange.mid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Senior:</span>
                        <span className="font-medium">${path.salaryRange.senior.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expert:</span>
                        <span className="font-medium">${path.salaryRange.expert.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Key Skills Needed</p>
                    <div className="flex flex-wrap gap-1">
                      {path.requiredSkills.slice(0, 4).map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {path.requiredSkills.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{path.requiredSkills.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      variant="outline"
                      onClick={() => {
                        setSelectedPath(path);
                        setShowPathDialog(true);
                      }}
                    >
                      View Details
                    </Button>
                    <Button>
                      <Target className="w-4 h-4 mr-2" />
                      Plan Path
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Market Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="space-y-4">
              {marketTrends.map(trend => (
                <Card key={trend.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{trend.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{trend.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`${getImpactColor(trend.impact)} mb-1`}>
                        {trend.impact}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{trend.timeframe}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-green-600 mb-2">Opportunities</h4>
                      <ul className="text-xs space-y-1">
                        {trend.opportunities.map((opp, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {opp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-2">Threats</h4>
                      <ul className="text-xs space-y-1">
                        {trend.threats.map((threat, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            {threat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-blue-600 mb-2">Preparation</h4>
                      <ul className="text-xs space-y-1">
                        {trend.preparation.map((prep, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-blue-500" />
                            {prep}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Affected Roles:</p>
                    <div className="flex flex-wrap gap-1">
                      {trend.affectedRoles.map(role => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Personal Roadmap Tab */}
          <TabsContent value="roadmap" className="space-y-6">
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <Card key={milestone.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{milestone.title}</h3>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={`${milestone.priority === 'critical' ? 'bg-red-100 text-red-800' : milestone.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'} mb-1`}>
                            {milestone.priority}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{milestone.timeframe}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span>Progress</span>
                          <span>{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Skills to Develop</h4>
                          <div className="flex flex-wrap gap-1">
                            {milestone.skills.map(skill => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Action Items</h4>
                          <ul className="text-xs space-y-1">
                            {milestone.actions.map((action, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm">
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="w-3 h-3 mr-1" />
                          Schedule
                        </Button>
                        <Button size="sm" variant="outline">
                          <BookOpen className="w-3 h-3 mr-1" />
                          Resources
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Career Path Details Dialog */}
      <Dialog open={showPathDialog} onOpenChange={setShowPathDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPath?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPath && (
            <div className="space-y-6">
              <div>
                <p className="text-muted-foreground mb-4">{selectedPath.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Job Security:</span>
                      <span className="font-medium">{selectedPath.jobSecurity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Work-Life Balance:</span>
                      <span className="font-medium">{selectedPath.workLifeBalance}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Stress Level:</span>
                      <Badge className={`${selectedPath.stress === 'high' ? 'bg-red-100 text-red-800' : selectedPath.stress === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {selectedPath.stress}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Work Type:</span>
                      <Badge variant="outline">{selectedPath.workType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Industry:</span>
                      <span className="font-medium">{selectedPath.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Growth Rate:</span>
                      <span className="font-medium text-green-600">+{selectedPath.growthRate}%/year</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPath.requiredSkills.map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Top Locations</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPath.locations.map(location => (
                    <Badge key={location} variant="outline">{location}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1">
                  <Target className="w-4 h-4 mr-2" />
                  Create Career Plan
                </Button>
                <Button variant="outline" onClick={() => setShowPathDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}








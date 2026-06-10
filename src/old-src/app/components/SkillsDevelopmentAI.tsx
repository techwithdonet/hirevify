/**
 * Skills Development AI
 * 
 * Intelligent system that analyzes market trends, skill gaps, and career goals
 * to provide personalized learning recommendations and development paths
 * for candidates to become more marketable and successful.
 */

import { useState, useEffect } from 'react';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Award, 
  Clock, 
  ArrowLeft, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  BarChart3, 
  Users, 
  DollarSign,
  Calendar,
  ExternalLink,
  PlayCircle,
  FileText,
  Lightbulb,
  Trophy,
  Rocket,
  Map,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { useAuth } from './AuthProvider';

interface SkillsDevelopmentAIProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

interface SkillGap {
  skill: string;
  currentLevel: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  importance: 'critical' | 'important' | 'nice-to-have';
  marketDemand: number; // 0-100
  salaryImpact: number; // potential salary increase %
  timeToLearn: {
    estimated: string;
    withMentorship: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  learningPath: LearningResource[];
}

interface LearningResource {
  id: string;
  title: string;
  type: 'course' | 'tutorial' | 'book' | 'project' | 'certification' | 'bootcamp' | 'mentorship';
  provider: string;
  url?: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  cost: 'free' | 'paid' | 'premium';
  rating: number;
  completionRate: number;
  skills: string[];
  description: string;
  aiRecommendationReason: string;
}

interface CareerPath {
  id: string;
  title: string;
  description: string;
  targetRoles: string[];
  timeframe: string;
  skillsRequired: string[];
  currentProgress: number;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  demandTrend: 'increasing' | 'stable' | 'decreasing';
  keyMilestones: Array<{
    title: string;
    skills: string[];
    timeframe: string;
    completed: boolean;
  }>;
  recommendedResources: LearningResource[];
}

interface MarketInsight {
  skill: string;
  demandScore: number;
  growthRate: number; // %
  averageSalary: number;
  jobOpenings: number;
  competitionLevel: 'low' | 'medium' | 'high';
  trend: 'hot' | 'growing' | 'stable' | 'declining';
  industries: string[];
  relatedSkills: string[];
}

export function SkillsDevelopmentAI({ onBack, onUpgrade }: SkillsDevelopmentAIProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [personalizedPlan, setPersonalizedPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [targetRole, setTargetRole] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('5-10 hours/week');
  const [learningStyle, setLearningStyle] = useState('mixed');
  const [budget, setBudget] = useState('free');

  useEffect(() => {
    loadSkillsAnalysis();
  }, []);

  const loadSkillsAnalysis = async () => {
    setIsLoading(true);
    
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock skill gaps based on current market demands
      const gaps: SkillGap[] = [
        {
          skill: 'TypeScript',
          currentLevel: 'beginner',
          targetLevel: 'advanced',
          importance: 'critical',
          marketDemand: 94,
          salaryImpact: 15,
          timeToLearn: {
            estimated: '2-3 months',
            withMentorship: '1-2 months'
          },
          difficulty: 'medium',
          prerequisites: ['JavaScript'],
          learningPath: [
            {
              id: 'ts-1',
              title: 'TypeScript Fundamentals',
              type: 'course',
              provider: 'TypeScript Official',
              url: 'https://typescriptlang.org/docs',
              duration: '2 weeks',
              difficulty: 'beginner',
              cost: 'free',
              rating: 4.8,
              completionRate: 89,
              skills: ['TypeScript'],
              description: 'Official TypeScript documentation and tutorials',
              aiRecommendationReason: 'Best starting point with comprehensive coverage'
            },
            {
              id: 'ts-2',
              title: 'Build a TypeScript Project',
              type: 'project',
              provider: 'Self-Guided',
              duration: '1-2 weeks',
              difficulty: 'intermediate',
              cost: 'free',
              rating: 4.6,
              completionRate: 76,
              skills: ['TypeScript', 'React'],
              description: 'Convert an existing JavaScript project to TypeScript',
              aiRecommendationReason: 'Hands-on practice reinforces learning'
            }
          ]
        },
        {
          skill: 'AWS Cloud Services',
          currentLevel: 'none',
          targetLevel: 'intermediate',
          importance: 'important',
          marketDemand: 89,
          salaryImpact: 20,
          timeToLearn: {
            estimated: '3-4 months',
            withMentorship: '2-3 months'
          },
          difficulty: 'hard',
          prerequisites: ['Basic networking', 'Linux fundamentals'],
          learningPath: [
            {
              id: 'aws-1',
              title: 'AWS Cloud Practitioner',
              type: 'certification',
              provider: 'AWS',
              duration: '4-6 weeks',
              difficulty: 'beginner',
              cost: 'paid',
              rating: 4.7,
              completionRate: 82,
              skills: ['AWS', 'Cloud Computing'],
              description: 'Entry-level AWS certification covering basic cloud concepts',
              aiRecommendationReason: 'Industry-recognized credential that opens doors'
            }
          ]
        },
        {
          skill: 'System Design',
          currentLevel: 'beginner',
          targetLevel: 'advanced',
          importance: 'critical',
          marketDemand: 91,
          salaryImpact: 25,
          timeToLearn: {
            estimated: '4-6 months',
            withMentorship: '3-4 months'
          },
          difficulty: 'hard',
          prerequisites: ['Distributed Systems', 'Database Design'],
          learningPath: [
            {
              id: 'sd-1',
              title: 'System Design Interview Prep',
              type: 'course',
              provider: 'Educative',
              duration: '8 weeks',
              difficulty: 'advanced',
              cost: 'paid',
              rating: 4.9,
              completionRate: 71,
              skills: ['System Design', 'Architecture'],
              description: 'Comprehensive system design course with real-world examples',
              aiRecommendationReason: 'Critical for senior roles and high salary growth'
            }
          ]
        }
      ];

      setSkillGaps(gaps);

      // Mock career paths
      const paths: CareerPath[] = [
        {
          id: 'senior-frontend',
          title: 'Senior Frontend Developer',
          description: 'Advanced frontend development with team leadership responsibilities',
          targetRoles: ['Senior Frontend Developer', 'Frontend Tech Lead', 'Frontend Architect'],
          timeframe: '6-12 months',
          skillsRequired: ['React', 'TypeScript', 'Node.js', 'System Design', 'Team Leadership'],
          currentProgress: 68,
          salaryRange: { min: 130000, max: 180000, currency: 'USD' },
          demandTrend: 'increasing',
          keyMilestones: [
            { title: 'Master TypeScript', skills: ['TypeScript'], timeframe: '2 months', completed: false },
            { title: 'Learn System Design', skills: ['System Design'], timeframe: '3 months', completed: false },
            { title: 'Leadership Experience', skills: ['Team Leadership'], timeframe: '4 months', completed: false }
          ],
          recommendedResources: gaps[0].learningPath
        },
        {
          id: 'fullstack-lead',
          title: 'Full-Stack Technical Lead',
          description: 'End-to-end development leadership with architecture responsibilities',
          targetRoles: ['Full-Stack Lead', 'Technical Lead', 'Engineering Manager'],
          timeframe: '9-15 months',
          skillsRequired: ['React', 'Node.js', 'TypeScript', 'AWS', 'System Design', 'Team Management'],
          currentProgress: 45,
          salaryRange: { min: 150000, max: 220000, currency: 'USD' },
          demandTrend: 'increasing',
          keyMilestones: [
            { title: 'Backend Mastery', skills: ['Node.js', 'Databases'], timeframe: '3 months', completed: true },
            { title: 'Cloud Expertise', skills: ['AWS', 'DevOps'], timeframe: '4 months', completed: false },
            { title: 'Architecture Skills', skills: ['System Design'], timeframe: '5 months', completed: false }
          ],
          recommendedResources: []
        }
      ];

      setCareerPaths(paths);

      // Mock market insights
      const insights: MarketInsight[] = [
        {
          skill: 'React',
          demandScore: 95,
          growthRate: 12,
          averageSalary: 125000,
          jobOpenings: 15420,
          competitionLevel: 'medium',
          trend: 'stable',
          industries: ['Technology', 'Finance', 'Healthcare', 'E-commerce'],
          relatedSkills: ['JavaScript', 'Redux', 'Next.js', 'TypeScript']
        },
        {
          skill: 'TypeScript',
          demandScore: 89,
          growthRate: 28,
          averageSalary: 135000,
          jobOpenings: 8940,
          competitionLevel: 'low',
          trend: 'hot',
          industries: ['Technology', 'FinTech', 'SaaS'],
          relatedSkills: ['JavaScript', 'React', 'Node.js', 'Angular']
        },
        {
          skill: 'AWS',
          demandScore: 91,
          growthRate: 22,
          averageSalary: 145000,
          jobOpenings: 12350,
          competitionLevel: 'medium',
          trend: 'growing',
          industries: ['Technology', 'Finance', 'Healthcare', 'Government'],
          relatedSkills: ['Docker', 'Kubernetes', 'Terraform', 'DevOps']
        }
      ];

      setMarketInsights(insights);

    } catch (error) {
      console.error('Failed to load skills analysis:', error);
      toast.error('Failed to load skills analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePersonalizedPlan = async () => {
    if (!targetRole) {
      toast.error('Please select a target role first');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const plan = {
        targetRole,
        timeCommitment,
        totalTimeframe: '6-9 months',
        prioritySkills: skillGaps.filter(gap => gap.importance === 'critical').slice(0, 3),
        weeklyPlan: [
          { week: 1, focus: 'TypeScript Fundamentals', hours: 8, milestone: 'Complete basic syntax' },
          { week: 2, focus: 'TypeScript with React', hours: 10, milestone: 'Build first TS+React project' },
          { week: 3, focus: 'Advanced TypeScript', hours: 8, milestone: 'Understand generics and decorators' }
        ],
        expectedOutcomes: {
          salaryIncrease: '15-25%',
          jobOpportunities: '+40%',
          interviewSuccessRate: '+60%'
        }
      };

      setPersonalizedPlan(plan);
      setActiveTab('plan');
      toast.success('Your personalized learning plan is ready!');

    } catch (error) {
      console.error('Failed to generate plan:', error);
      toast.error('Failed to generate learning plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'hot': return <Star className="w-4 h-4 text-red-500" />;
      case 'growing': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'stable': return <Target className="w-4 h-4 text-blue-500" />;
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading && !skillGaps.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">Analyzing Your Skills</h3>
          <p className="text-muted-foreground mb-4">
            Our AI is analyzing market trends and your profile to create personalized recommendations...
          </p>
          <div className="w-64 mx-auto">
            <Progress value={Math.random() * 100} className="h-2" />
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
                  AI Skills Development
                </h1>
                <p className="text-sm text-muted-foreground">
                  Personalized learning paths based on market intelligence
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {targetRole && (
                <Badge className="bg-primary/10 text-primary">
                  Target: {targetRole}
                </Badge>
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Setup */}
        {!personalizedPlan && (
          <Card className="mb-8 p-6 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                Get Your Personalized Learning Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <p className="text-muted-foreground mb-6">
                Our AI will analyze market trends, your current skills, and career goals to create a customized development plan.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Role</label>
                  <Select value={targetRole} onValueChange={setTargetRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Senior Frontend Developer">Senior Frontend Developer</SelectItem>
                      <SelectItem value="Full-Stack Engineer">Full-Stack Engineer</SelectItem>
                      <SelectItem value="Technical Lead">Technical Lead</SelectItem>
                      <SelectItem value="Product Manager">Product Manager</SelectItem>
                      <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Time Commitment</label>
                  <Select value={timeCommitment} onValueChange={setTimeCommitment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-5 hours/week">1-5 hours/week</SelectItem>
                      <SelectItem value="5-10 hours/week">5-10 hours/week</SelectItem>
                      <SelectItem value="10-20 hours/week">10-20 hours/week</SelectItem>
                      <SelectItem value="20+ hours/week">20+ hours/week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Learning Style</label>
                  <Select value={learningStyle} onValueChange={setLearningStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visual">Visual (Videos, Diagrams)</SelectItem>
                      <SelectItem value="hands-on">Hands-on (Projects, Labs)</SelectItem>
                      <SelectItem value="reading">Reading (Docs, Books)</SelectItem>
                      <SelectItem value="mixed">Mixed Approach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Budget</label>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free Resources Only</SelectItem>
                      <SelectItem value="budget">Budget ($0-50/month)</SelectItem>
                      <SelectItem value="moderate">Moderate ($50-200/month)</SelectItem>
                      <SelectItem value="premium">Premium ($200+/month)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={generatePersonalizedPlan} 
                className="w-full" 
                size="lg"
                disabled={!targetRole || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Your Plan...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate My Learning Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
            <TabsTrigger value="market">Market Insights</TabsTrigger>
            <TabsTrigger value="paths">Career Paths</TabsTrigger>
            <TabsTrigger value="plan" disabled={!personalizedPlan}>My Plan</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Skills Health Score */}
              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Skills Health Score</h3>
                <div className="text-3xl font-bold text-primary mb-2">78%</div>
                <p className="text-sm text-muted-foreground">
                  Good foundation with room for strategic growth
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab('gaps')}>
                  View Gaps
                </Button>
              </Card>

              {/* Market Position */}
              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Market Position</h3>
                <div className="text-3xl font-bold text-emerald-600 mb-2">Top 35%</div>
                <p className="text-sm text-muted-foreground">
                  Among frontend developers in your area
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab('market')}>
                  View Market
                </Button>
              </Card>

              {/* Growth Potential */}
              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Growth Potential</h3>
                <div className="text-3xl font-bold text-amber-600 mb-2">+35%</div>
                <p className="text-sm text-muted-foreground">
                  Potential salary increase with recommended skills
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab('paths')}>
                  View Paths
                </Button>
              </Card>
            </div>

            {/* Priority Actions */}
            <Card className="p-6">
              <CardTitle className="mb-4">Priority Actions This Month</CardTitle>
              <div className="space-y-4">
                {skillGaps.filter(gap => gap.importance === 'critical').slice(0, 3).map((gap) => (
                  <div key={gap.skill} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{gap.skill}</h4>
                        <Badge className="bg-red-100 text-red-800 text-xs">Critical</Badge>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          +{gap.salaryImpact}% salary
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Market demand: {gap.marketDemand}% • {gap.timeToLearn.estimated}
                      </p>
                    </div>
                    <Button size="sm">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Learning
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Skill Gaps Tab */}
          <TabsContent value="gaps" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Identified Skill Gaps</h3>
              <Button variant="outline" onClick={loadSkillsAnalysis}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Analysis
              </Button>
            </div>

            <div className="space-y-4">
              {skillGaps.map((gap) => (
                <Card key={gap.skill} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold">{gap.skill}</h4>
                        <Badge className={
                          gap.importance === 'critical' ? 'bg-red-100 text-red-800' :
                          gap.importance === 'important' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {gap.importance}
                        </Badge>
                        <Badge className={`${getTrendIcon(marketInsights.find(m => m.skill === gap.skill)?.trend || 'stable')} bg-transparent border-0 p-0`}>
                          {getTrendIcon(marketInsights.find(m => m.skill === gap.skill)?.trend || 'stable')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Current: {gap.currentLevel} → Target: {gap.targetLevel}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{gap.marketDemand}%</div>
                      <p className="text-xs text-muted-foreground">Market Demand</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <div className="font-semibold text-green-700">+{gap.salaryImpact}%</div>
                      <p className="text-xs text-green-600">Salary Impact</p>
                    </div>
                    
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <div className="font-semibold text-blue-700">{gap.timeToLearn.estimated}</div>
                      <p className="text-xs text-blue-600">Time to Learn</p>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Award className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <div className="font-semibold text-purple-700 capitalize">{gap.difficulty}</div>
                      <p className="text-xs text-purple-600">Difficulty</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Learning Path Preview */}
                  <div>
                    <h5 className="font-medium mb-3">Recommended Learning Path</h5>
                    <div className="space-y-2">
                      {gap.learningPath.slice(0, 2).map((resource) => (
                        <div key={resource.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              resource.type === 'course' ? 'bg-blue-100' :
                              resource.type === 'project' ? 'bg-green-100' :
                              resource.type === 'certification' ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              {resource.type === 'course' ? <BookOpen className="w-4 h-4 text-blue-600" /> :
                               resource.type === 'project' ? <PlayCircle className="w-4 h-4 text-green-600" /> :
                               resource.type === 'certification' ? <Award className="w-4 h-4 text-purple-600" /> :
                               <FileText className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{resource.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{resource.provider}</span>
                                <span>•</span>
                                <span>{resource.duration}</span>
                                <span>•</span>
                                <Badge className={resource.cost === 'free' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} style={{ fontSize: '10px', padding: '1px 4px' }}>
                                  {resource.cost}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs">{resource.rating}</span>
                            </div>
                            <Button size="sm" variant="outline">
                              Start
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Market Insights Tab */}
          <TabsContent value="market" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Market Intelligence</h3>
              <Badge className="bg-green-100 text-green-800">
                Updated daily
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {marketInsights.map((insight) => (
                <Card key={insight.skill} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        {insight.skill}
                        {getTrendIcon(insight.trend)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {insight.jobOpenings.toLocaleString()} open positions
                      </p>
                    </div>
                    <Badge className={getCompetitionColor(insight.competitionLevel)}>
                      {insight.competitionLevel} competition
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <div className="text-xl font-bold text-primary">{insight.demandScore}%</div>
                      <p className="text-xs text-muted-foreground">Demand Score</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">+{insight.growthRate}%</div>
                      <p className="text-xs text-green-600">YoY Growth</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Average Salary</span>
                      <span className="font-semibold">${insight.averageSalary.toLocaleString()}</span>
                    </div>
                    <Progress value={(insight.averageSalary / 200000) * 100} className="h-2" />
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Top Industries:</p>
                    <div className="flex flex-wrap gap-1">
                      {insight.industries.slice(0, 3).map((industry, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Related Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {insight.relatedSkills.slice(0, 4).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Career Paths Tab */}
          <TabsContent value="paths" className="space-y-6">
            <h3 className="text-lg font-semibold">Recommended Career Paths</h3>
            <div className="space-y-6">
              {careerPaths.map((path) => (
                <Card key={path.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{path.title}</h4>
                      <p className="text-muted-foreground mb-3">{path.description}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{path.timeframe}</span>
                        <Badge className={path.demandTrend === 'increasing' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                          {path.demandTrend}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        ${path.salaryRange.min.toLocaleString()} - ${path.salaryRange.max.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">Expected salary range</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">{path.currentProgress}% complete</span>
                    </div>
                    <Progress value={path.currentProgress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium mb-2">Key Milestones</h5>
                      <div className="space-y-2">
                        {path.keyMilestones.map((milestone, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {milestone.completed ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                            )}
                            <div className="flex-1">
                              <p className={`text-sm ${milestone.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                                {milestone.title}
                              </p>
                              <p className="text-xs text-muted-foreground">{milestone.timeframe}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Target Roles</h5>
                      <div className="space-y-1">
                        {path.targetRoles.map((role, index) => (
                          <Badge key={index} variant="outline" className="mr-1 mb-1">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button onClick={generatePersonalizedPlan}>
                      <Map className="w-4 h-4 mr-2" />
                      Create Learning Plan
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Personalized Plan Tab */}
          {personalizedPlan && (
            <TabsContent value="plan" className="space-y-6">
              <div className="text-center mb-8">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Your Personalized Learning Plan</h2>
                <p className="text-muted-foreground">
                  AI-generated plan to become a {personalizedPlan.targetRole}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-green-600">{personalizedPlan.expectedOutcomes.salaryIncrease}</div>
                  <p className="text-sm text-muted-foreground">Expected Salary Increase</p>
                </Card>
                
                <Card className="p-6 text-center">
                  <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-600">{personalizedPlan.expectedOutcomes.jobOpportunities}</div>
                  <p className="text-sm text-muted-foreground">More Job Opportunities</p>
                </Card>
                
                <Card className="p-6 text-center">
                  <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-purple-600">{personalizedPlan.expectedOutcomes.interviewSuccessRate}</div>
                  <p className="text-sm text-muted-foreground">Interview Success Rate</p>
                </Card>
              </div>

              <Card className="p-6">
                <CardTitle className="mb-4">Your Weekly Learning Schedule</CardTitle>
                <div className="space-y-3">
                  {personalizedPlan.weeklyPlan.slice(0, 8).map((week: any) => (
                    <div key={week.week} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Week {week.week}: {week.focus}</h4>
                        <p className="text-sm text-muted-foreground">
                          Goal: {week.milestone}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{week.hours}h</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex gap-3">
                  <Button className="flex-1">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Learning Plan
                  </Button>
                  <Button variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Add to Calendar
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Plan
                  </Button>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
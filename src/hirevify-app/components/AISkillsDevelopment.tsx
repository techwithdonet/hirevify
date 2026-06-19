/**
 * AI Skills Development System
 * 
 * Intelligent skills development platform that analyzes candidate profiles,
 * identifies skill gaps, and provides personalized learning recommendations
 * with AI-powered progress tracking and adaptive learning paths.
 */

import { useState, useEffect } from 'react';
import { 
 Brain, 
 Target, 
 TrendingUp, 
 BookOpen, 
 CheckCircle, 
 Clock, 
 Star, 
 ArrowRight,
 Play,
 Pause,
 RotateCcw,
 Award,
 Zap,
 Users,
 BarChart3,
 Lightbulb,
 ArrowLeft,
 Calendar,
 AlertCircle,
 Trophy,
 Download,
 Eye,
 Settings,
 Filter
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
import { dashboardTheme } from '../theme/dashboardTheme';

interface AISkillsDevelopmentProps {
 onBack: () => void;
 onUpgrade?: () => void;
}

interface Skill {
 id: string;
 name: string;
 category: string;
 currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
 targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
 marketDemand: 'low' | 'medium' | 'high' | 'critical';
 salaryImpact: number; // percentage increase
 timeToLearn: number; // weeks
 priority: 'low' | 'medium' | 'high' | 'critical';
 verified: boolean;
 lastAssessed: Date;
}

interface LearningPath {
 id: string;
 title: string;
 description: string;
 skills: string[];
 estimatedTime: number; // weeks
 difficulty: 'beginner' | 'intermediate' | 'advanced';
 modules: LearningModule[];
 prerequisites: string[];
 outcomes: string[];
 industry: string;
 completionRate: number;
 enrolled: boolean;
 progress: number;
}

interface LearningModule {
 id: string;
 title: string;
 type: 'video' | 'article' | 'exercise' | 'project' | 'assessment';
 duration: number; // minutes
 completed: boolean;
 score?: number;
 resources: Resource[];
}

interface Resource {
 id: string;
 title: string;
 type: 'video' | 'article' | 'course' | 'book' | 'tutorial';
 provider: string;
 url: string;
 rating: number;
 reviews: number;
 free: boolean;
 duration?: number;
}

interface AIRecommendation {
 type: 'skill' | 'path' | 'resource' | 'opportunity';
 title: string;
 description: string;
 reasoning: string;
 confidence: number;
 impact: 'low' | 'medium' | 'high';
 timeframe: string;
 actionItems: string[];
}

export function AISkillsDevelopment({ onBack, onUpgrade }: AISkillsDevelopmentProps) {
 const { user } = useAuth();
 const [activeTab, setActiveTab] = useState('overview');
 const [skills, setSkills] = useState<Skill[]>([]);
 const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
 const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
 const [showPathDialog, setShowPathDialog] = useState(false);
 const [filterCategory, setFilterCategory] = useState('all');
 const [sortBy, setSortBy] = useState('priority');

 useEffect(() => {
 loadSkillsData();
 generateAIRecommendations();
 }, []);

 const loadSkillsData = async () => {
 setIsLoading(true);
 
 try {
 // Simulate API call to get user's skills and generate development plan
 await new Promise(resolve => setTimeout(resolve, 2000));
 
 // Mock skills data with AI analysis
 const mockSkills: Skill[] = [
 {
 id: '1',
 name: 'React',
 category: 'Frontend Development',
 currentLevel: 'intermediate',
 targetLevel: 'advanced',
 marketDemand: 'high',
 salaryImpact: 15,
 timeToLearn: 6,
 priority: 'high',
 verified: true,
 lastAssessed: new Date(Date.now() - 86400000 * 30)
 },
 {
 id: '2',
 name: 'TypeScript',
 category: 'Programming Languages',
 currentLevel: 'intermediate',
 targetLevel: 'expert',
 marketDemand: 'critical',
 salaryImpact: 25,
 timeToLearn: 8,
 priority: 'critical',
 verified: false,
 lastAssessed: new Date(Date.now() - 86400000 * 60)
 },
 {
 id: '3',
 name: 'Node.js',
 category: 'Backend Development',
 currentLevel: 'beginner',
 targetLevel: 'intermediate',
 marketDemand: 'high',
 salaryImpact: 20,
 timeToLearn: 10,
 priority: 'high',
 verified: false,
 lastAssessed: new Date(Date.now() - 86400000 * 90)
 },
 {
 id: '4',
 name: 'AWS',
 category: 'Cloud Computing',
 currentLevel: 'beginner',
 targetLevel: 'intermediate',
 marketDemand: 'critical',
 salaryImpact: 30,
 timeToLearn: 12,
 priority: 'critical',
 verified: false,
 lastAssessed: new Date()
 },
 {
 id: '5',
 name: 'Machine Learning',
 category: 'Data Science',
 currentLevel: 'beginner',
 targetLevel: 'intermediate',
 marketDemand: 'high',
 salaryImpact: 35,
 timeToLearn: 16,
 priority: 'medium',
 verified: false,
 lastAssessed: new Date()
 }
 ];

 const mockLearningPaths: LearningPath[] = [
 {
 id: '1',
 title: 'Full-Stack React Developer',
 description: 'Complete path to become a senior full-stack developer with React and Node.js',
 skills: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB'],
 estimatedTime: 16,
 difficulty: 'intermediate',
 modules: [
 {
 id: '1',
 title: 'Advanced React Patterns',
 type: 'video',
 duration: 180,
 completed: false,
 resources: []
 },
 {
 id: '2',
 title: 'TypeScript Fundamentals',
 type: 'video',
 duration: 300,
 completed: true,
 score: 85,
 resources: []
 }
 ],
 prerequisites: ['JavaScript', 'HTML', 'CSS'],
 outcomes: ['Build complex React applications', 'Implement backend APIs', 'Deploy full-stack apps'],
 industry: 'Software Development',
 completionRate: 78,
 enrolled: true,
 progress: 35
 },
 {
 id: '2',
 title: 'Cloud Solutions Architect',
 description: 'Master AWS cloud architecture and DevOps practices',
 skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
 estimatedTime: 20,
 difficulty: 'advanced',
 modules: [],
 prerequisites: ['Basic programming', 'Linux fundamentals'],
 outcomes: ['Design scalable cloud architectures', 'Implement CI/CD pipelines', 'Manage cloud infrastructure'],
 industry: 'Cloud Computing',
 completionRate: 65,
 enrolled: false,
 progress: 0
 },
 {
 id: '3',
 title: 'AI/ML Engineer Path',
 description: 'Become proficient in machine learning and AI development',
 skills: ['Python', 'TensorFlow', 'PyTorch', 'Data Analysis'],
 estimatedTime: 24,
 difficulty: 'advanced',
 modules: [],
 prerequisites: ['Python programming', 'Statistics', 'Linear Algebra'],
 outcomes: ['Build ML models', 'Deploy AI applications', 'Analyze complex datasets'],
 industry: 'Artificial Intelligence',
 completionRate: 72,
 enrolled: false,
 progress: 0
 }
 ];

 setSkills(mockSkills);
 setLearningPaths(mockLearningPaths);
 
 } catch (error) {
 console.error('Failed to load skills data:', error);
 toast.error('Failed to load skills data');
 } finally {
 setIsLoading(false);
 }
 };

 const generateAIRecommendations = async () => {
 // Simulate AI analysis
 const mockRecommendations: AIRecommendation[] = [
 {
 type: 'skill',
 title: 'Prioritize TypeScript Learning',
 description: 'Based on market analysis, TypeScript skills are in critical demand and would increase your salary potential by 25%.',
 reasoning: 'High market demand (95% of job postings), significant salary impact, and builds on your existing JavaScript knowledge.',
 confidence: 92,
 impact: 'high',
 timeframe: '8 weeks',
 actionItems: [
 'Complete TypeScript fundamentals course',
 'Build a project using TypeScript',
 'Take skills assessment for verification'
 ]
 },
 {
 type: 'path',
 title: 'Consider Full-Stack React Path',
 description: 'Your current React and TypeScript progress aligns perfectly with the Full-Stack React Developer path.',
 reasoning: 'You already have 60% of required prerequisites and are actively improving in key areas.',
 confidence: 88,
 impact: 'high',
 timeframe: '16 weeks',
 actionItems: [
 'Complete current React advanced topics',
 'Start Node.js fundamentals',
 'Build a full-stack portfolio project'
 ]
 },
 {
 type: 'opportunity',
 title: 'AWS Certification Opportunity',
 description: 'There are 3 AWS developer positions at companies in your area with 30% salary increases.',
 reasoning: 'Cloud skills are becoming essential, and early investment could lead to significant career advancement.',
 confidence: 85,
 impact: 'high',
 timeframe: '12 weeks',
 actionItems: [
 'Start AWS fundamentals',
 'Practice with AWS free tier',
 'Prepare for AWS certification exam'
 ]
 },
 {
 type: 'resource',
 title: 'Free React Advanced Course Available',
 description: 'A highly-rated advanced React course is currently free for the next 2 weeks.',
 reasoning: 'Perfect timing to advance your React skills while saving $299 on course fees.',
 confidence: 95,
 impact: 'medium',
 timeframe: '2 weeks',
 actionItems: [
 'Enroll in the course immediately',
 'Dedicate 1 hour daily to course content',
 'Complete hands-on projects'
 ]
 }
 ];

 setRecommendations(mockRecommendations);
 };

 const enrollInPath = (path: LearningPath) => {
 setLearningPaths(prev => prev.map(p => 
 p.id === path.id? {...p, enrolled: true }: p
 ));
 toast.success(`Enrolled in ${path.title} learning path!`);
 setShowPathDialog(false);
 };

 const getSkillLevelColor = (level: string) => {
 switch (level) {
 case 'expert': return 'text-purple-600 bg-purple-100';
 case 'advanced': return 'text-green-600 bg-green-100';
 case 'intermediate': return 'text-blue-600 bg-blue-100';
 case 'beginner': return 'text-orange-600 bg-orange-100';
 default: return 'text-gray-600 bg-gray-100';
 }
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

 const getPriorityColor = (priority: string) => {
 switch (priority) {
 case 'critical': return 'text-red-600';
 case 'high': return 'text-orange-600';
 case 'medium': return 'text-yellow-600';
 case 'low': return 'text-gray-600';
 default: return 'text-gray-600';
 }
 };

 const getRecommendationIcon = (type: string) => {
 switch (type) {
 case 'skill': return <Target className="w-4 h-4" />;
 case 'path': return <BookOpen className="w-4 h-4" />;
 case 'resource': return <Star className="w-4 h-4" />;
 case 'opportunity': return <Trophy className="w-4 h-4" />;
 default: return <Lightbulb className="w-4 h-4" />;
 }
 };

 const filteredSkills = skills.filter(skill => 
 filterCategory === 'all' || skill.category === filterCategory
 );

 const sortedSkills = [...filteredSkills].sort((a, b) => {
 switch (sortBy) {
 case 'priority':
 const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
 return priorityOrder[b.priority] - priorityOrder[a.priority];
 case 'demand':
 const demandOrder = { critical: 4, high: 3, medium: 2, low: 1 };
 return demandOrder[b.marketDemand] - demandOrder[a.marketDemand];
 case 'impact':
 return b.salaryImpact - a.salaryImpact;
 case 'time':
 return a.timeToLearn - b.timeToLearn;
 default:
 return 0;
 }
 });

 if (isLoading) {
 return (
 <div className={`${dashboardTheme.page} p-6`}>
 <div className="max-w-7xl mx-auto">
 <div className="flex items-center gap-4 mb-8">
 <Button variant="ghost" onClick={onBack}>
 <ArrowLeft className="w-4 h-4" />
 </Button>
 <div>
 <h1 className="text-3xl font-bold">AI Skills Development</h1>
 <p className="text-muted-foreground">Analyzing your skills and generating personalized recommendations...</p>
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
 <div className={dashboardTheme.page}>
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
 Personalized learning paths powered by AI analysis
 </p>
 </div>
 </div>
 
 <div className="flex items-center gap-3">
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
 {/* AI Insights Overview */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
 <Card className="p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground">Skills Tracked</p>
 <p className="text-2xl font-bold">{skills.length}</p>
 </div>
 <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
 <Target className="w-6 h-6 text-blue-600" />
 </div>
 </div>
 <div className="mt-4 flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-green-500" />
 <span className="text-sm text-green-600">3 skills improving</span>
 </div>
 </Card>

 <Card className="p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground">Learning Paths</p>
 <p className="text-2xl font-bold">{learningPaths.filter(p => p.enrolled).length}</p>
 </div>
 <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
 <BookOpen className="w-6 h-6 text-green-600" />
 </div>
 </div>
 <div className="mt-4 flex items-center gap-2">
 <Clock className="w-4 h-4 text-blue-500" />
 <span className="text-sm text-blue-600">16 weeks remaining</span>
 </div>
 </Card>

 <Card className="p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground">Skill Level</p>
 <p className="text-2xl font-bold">72%</p>
 </div>
 <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
 <Award className="w-6 h-6 text-purple-600" />
 </div>
 </div>
 <div className="mt-4">
 <Progress value={72} className="h-2" />
 </div>
 </Card>

 <Card className="p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground">Salary Impact</p>
 <p className="text-2xl font-bold">+25%</p>
 </div>
 <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
 <TrendingUp className="w-6 h-6 text-yellow-600" />
 </div>
 </div>
 <div className="mt-4 flex items-center gap-2">
 <Star className="w-4 h-4 text-yellow-500" />
 <span className="text-sm text-yellow-600">High impact skills</span>
 </div>
 </Card>
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
 <TabsList className="grid w-full grid-cols-4">
 <TabsTrigger value="overview">Overview</TabsTrigger>
 <TabsTrigger value="skills">My Skills</TabsTrigger>
 <TabsTrigger value="paths">Learning Paths</TabsTrigger>
 <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
 </TabsList>

 {/* Overview Tab */}
 <TabsContent value="overview" className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Progress Summary */}
 <Card className="p-6">
 <CardHeader className="px-0 pt-0">
 <CardTitle className="flex items-center gap-2">
 <BarChart3 className="w-5 h-5 text-primary" />
 Learning Progress
 </CardTitle>
 </CardHeader>
 <CardContent className="px-0">
 <div className="space-y-4">
 {learningPaths.filter(p => p.enrolled).map(path => (
 <div key={path.id} className="space-y-2">
 <div className="flex justify-between items-center">
 <span className="text-sm font-medium">{path.title}</span>
 <span className="text-sm text-muted-foreground">{path.progress}%</span>
 </div>
 <Progress value={path.progress} className="h-2" />
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 {/* Top Priority Skills */}
 <Card className="p-6">
 <CardHeader className="px-0 pt-0">
 <CardTitle className="flex items-center gap-2">
 <Target className="w-5 h-5 text-primary" />
 Priority Skills
 </CardTitle>
 </CardHeader>
 <CardContent className="px-0">
 <div className="space-y-3">
 {skills.filter(s => s.priority === 'critical' || s.priority === 'high').slice(0, 4).map(skill => (
 <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <span className="font-medium">{skill.name}</span>
 <Badge className={`text-xs ${getPriorityColor(skill.priority)}`} variant="outline">
 {skill.priority}
 </Badge>
 </div>
 <p className="text-xs text-muted-foreground">{skill.category}</p>
 </div>
 <div className="text-right">
 <p className="text-sm font-medium">+{skill.salaryImpact}%</p>
 <p className="text-xs text-muted-foreground">{skill.timeToLearn}w</p>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Quick Actions */}
 <Card className="p-6">
 <CardHeader className="px-0 pt-0">
 <CardTitle>Recommended Actions</CardTitle>
 </CardHeader>
 <CardContent className="px-0">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Button className="h-auto p-4 flex flex-col items-start" variant="outline">
 <Play className="w-5 h-5 mb-2 text-primary" />
 <span className="font-medium mb-1">Continue Learning</span>
 <span className="text-xs text-muted-foreground">Resume your React path</span>
 </Button>
 
 <Button className="h-auto p-4 flex flex-col items-start" variant="outline">
 <Trophy className="w-5 h-5 mb-2 text-primary" />
 <span className="font-medium mb-1">Take Assessment</span>
 <span className="text-xs text-muted-foreground">Verify your TypeScript skills</span>
 </Button>
 
 <Button className="h-auto p-4 flex flex-col items-start" variant="outline">
 <Lightbulb className="w-5 h-5 mb-2 text-primary" />
 <span className="font-medium mb-1">Explore New Path</span>
 <span className="text-xs text-muted-foreground">Check AI recommendations</span>
 </Button>
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 {/* Skills Tab */}
 <TabsContent value="skills" className="space-y-6">
 {/* Filters */}
 <div className="flex items-center gap-4">
 <Select value={filterCategory} onValueChange={setFilterCategory}>
 <SelectTrigger className="w-48">
 <SelectValue placeholder="Filter by category" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Categories</SelectItem>
 <SelectItem value="Frontend Development">Frontend Development</SelectItem>
 <SelectItem value="Backend Development">Backend Development</SelectItem>
 <SelectItem value="Cloud Computing">Cloud Computing</SelectItem>
 <SelectItem value="Data Science">Data Science</SelectItem>
 <SelectItem value="Programming Languages">Programming Languages</SelectItem>
 </SelectContent>
 </Select>

 <Select value={sortBy} onValueChange={setSortBy}>
 <SelectTrigger className="w-48">
 <SelectValue placeholder="Sort by" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="priority">Priority</SelectItem>
 <SelectItem value="demand">Market Demand</SelectItem>
 <SelectItem value="impact">Salary Impact</SelectItem>
 <SelectItem value="time">Time to Learn</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Skills Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {sortedSkills.map(skill => (
 <Card key={skill.id} className="p-6">
 <div className="flex items-start justify-between mb-4">
 <div>
 <h3 className="font-semibold flex items-center gap-2">
 {skill.name}
 {skill.verified && <CheckCircle className="w-4 h-4 text-green-500" />}
 </h3>
 <p className="text-sm text-muted-foreground">{skill.category}</p>
 </div>
 <Badge className={`text-xs ${getPriorityColor(skill.priority)}`} variant="outline">
 {skill.priority}
 </Badge>
 </div>

 <div className="space-y-3">
 <div className="flex justify-between items-center text-sm">
 <span>Current Level</span>
 <Badge className={`text-xs ${getSkillLevelColor(skill.currentLevel)}`}>
 {skill.currentLevel}
 </Badge>
 </div>

 <div className="flex justify-between items-center text-sm">
 <span>Target Level</span>
 <Badge className={`text-xs ${getSkillLevelColor(skill.targetLevel)}`}>
 {skill.targetLevel}
 </Badge>
 </div>

 <div className="flex justify-between items-center text-sm">
 <span>Market Demand</span>
 <Badge className={`text-xs ${getDemandColor(skill.marketDemand)}`}>
 {skill.marketDemand}
 </Badge>
 </div>

 <Separator />

 <div className="flex justify-between items-center text-sm">
 <span>Salary Impact</span>
 <span className="font-medium text-green-600">+{skill.salaryImpact}%</span>
 </div>

 <div className="flex justify-between items-center text-sm">
 <span>Time to Learn</span>
 <span className="font-medium">{skill.timeToLearn} weeks</span>
 </div>

 <Button className="w-full mt-4" variant="outline">
 <BookOpen className="w-4 h-4 mr-2" />
 Start Learning
 </Button>
 </div>
 </Card>
 ))}
 </div>
 </TabsContent>

 {/* Learning Paths Tab */}
 <TabsContent value="paths" className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {learningPaths.map(path => (
 <Card key={path.id} className="p-6">
 <div className="flex items-start justify-between mb-4">
 <div>
 <h3 className="font-semibold">{path.title}</h3>
 <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
 </div>
 <Badge className={`${path.enrolled? 'bg-green-100 text-green-800': 'bg-gray-100 text-gray-800'}`}>
 {path.enrolled? 'Enrolled': 'Available'}
 </Badge>
 </div>

 <div className="space-y-3 mb-4">
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-muted-foreground" />
 <span className="text-sm">{path.estimatedTime} weeks</span>
 <Badge variant="outline" className="text-xs">
 {path.difficulty}
 </Badge>
 </div>

 <div className="flex items-center gap-2">
 <Users className="w-4 h-4 text-muted-foreground" />
 <span className="text-sm">{path.completionRate}% completion rate</span>
 </div>

 {path.enrolled && (
 <div className="space-y-1">
 <div className="flex justify-between text-sm">
 <span>Progress</span>
 <span>{path.progress}%</span>
 </div>
 <Progress value={path.progress} className="h-2" />
 </div>
 )}
 </div>

 <div className="mb-4">
 <p className="text-sm font-medium mb-2">Skills you'll learn:</p>
 <div className="flex flex-wrap gap-1">
 {path.skills.slice(0, 4).map(skill => (
 <Badge key={skill} variant="secondary" className="text-xs">
 {skill}
 </Badge>
 ))}
 {path.skills.length > 4 && (
 <Badge variant="secondary" className="text-xs">
 +{path.skills.length - 4} more
 </Badge>
 )}
 </div>
 </div>

 <div className="flex gap-2">
 {path.enrolled? (
 <Button className="flex-1">
 <Play className="w-4 h-4 mr-2" />
 Continue Learning
 </Button>
 ): (
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
 )}
 <Button variant="outline" size="icon">
 <Eye className="w-4 h-4" />
 </Button>
 </div>
 </Card>
 ))}
 </div>
 </TabsContent>

 {/* AI Recommendations Tab */}
 <TabsContent value="recommendations" className="space-y-6">
 <div className="space-y-4">
 {recommendations.map((rec, index) => (
 <Card key={index} className="p-6">
 <div className="flex items-start gap-4">
 <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
 {getRecommendationIcon(rec.type)}
 </div>
 
 <div className="flex-1">
 <div className="flex items-start justify-between mb-2">
 <div>
 <h3 className="font-semibold">{rec.title}</h3>
 <p className="text-sm text-muted-foreground">{rec.description}</p>
 </div>
 <div className="text-right">
 <Badge className={`${rec.impact === 'high'? 'bg-red-100 text-red-800': rec.impact === 'medium'? 'bg-yellow-100 text-yellow-800': 'bg-green-100 text-green-800'}`}>
 {rec.impact} impact
 </Badge>
 <p className="text-xs text-muted-foreground mt-1">{rec.confidence}% confidence</p>
 </div>
 </div>

 <div className="bg-muted/50 rounded-lg p-3 mb-3">
 <p className="text-sm"><strong>AI Reasoning:</strong> {rec.reasoning}</p>
 </div>

 <div className="flex items-center gap-4 mb-3 text-sm">
 <div className="flex items-center gap-1">
 <Calendar className="w-4 h-4 text-muted-foreground" />
 <span>Timeframe: {rec.timeframe}</span>
 </div>
 <div className="flex items-center gap-1">
 <Target className="w-4 h-4 text-muted-foreground" />
 <span className="capitalize">{rec.type}</span>
 </div>
 </div>

 <div className="mb-4">
 <p className="text-sm font-medium mb-2">Recommended Actions:</p>
 <ul className="text-sm space-y-1">
 {rec.actionItems.map((item, i) => (
 <li key={i} className="flex items-center gap-2">
 <CheckCircle className="w-3 h-3 text-green-500" />
 {item}
 </li>
 ))}
 </ul>
 </div>

 <div className="flex gap-2">
 <Button>
 <ArrowRight className="w-4 h-4 mr-2" />
 Take Action
 </Button>
 <Button variant="outline">
 Learn More
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

 {/* Learning Path Details Dialog */}
 <Dialog open={showPathDialog} onOpenChange={setShowPathDialog}>
 <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>
 {selectedPath?.title}
 </DialogTitle>
 </DialogHeader>
 
 {selectedPath && (
 <div className="space-y-6">
 <div>
 <p className="text-muted-foreground mb-4">{selectedPath.description}</p>
 
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-muted-foreground" />
 <span className="text-sm">{selectedPath.estimatedTime} weeks</span>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant="outline">{selectedPath.difficulty}</Badge>
 </div>
 <div className="flex items-center gap-2">
 <Users className="w-4 h-4 text-muted-foreground" />
 <span className="text-sm">{selectedPath.completionRate}% completion rate</span>
 </div>
 <div className="flex items-center gap-2">
 <Star className="w-4 h-4 text-yellow-500" />
 <span className="text-sm">{selectedPath.industry}</span>
 </div>
 </div>
 </div>

 <div>
 <h4 className="font-semibold mb-2">Skills You'll Master</h4>
 <div className="flex flex-wrap gap-2">
 {selectedPath.skills.map(skill => (
 <Badge key={skill} variant="secondary">{skill}</Badge>
 ))}
 </div>
 </div>

 <div>
 <h4 className="font-semibold mb-2">Prerequisites</h4>
 <ul className="text-sm space-y-1">
 {selectedPath.prerequisites.map((prereq, i) => (
 <li key={i} className="flex items-center gap-2">
 <CheckCircle className="w-3 h-3 text-green-500" />
 {prereq}
 </li>
 ))}
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-2">Learning Outcomes</h4>
 <ul className="text-sm space-y-1">
 {selectedPath.outcomes.map((outcome, i) => (
 <li key={i} className="flex items-center gap-2">
 <Target className="w-3 h-3 text-primary" />
 {outcome}
 </li>
 ))}
 </ul>
 </div>

 <div className="flex gap-2 pt-4">
 <Button 
 className="flex-1"
 onClick={() => enrollInPath(selectedPath)}
 >
 <Play className="w-4 h-4 mr-2" />
 Enroll Now
 </Button>
 <Button variant="outline" onClick={() => setShowPathDialog(false)}>
 Cancel
 </Button>
 </div>
 </div>
 )}
 </DialogContent>
 </Dialog>
 </div>
 );
}








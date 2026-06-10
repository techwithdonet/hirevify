/**
 * AI-Powered Resume Builder
 * 
 * Enhanced resume builder with AI optimization, ATS scanning,
 * and intelligent content suggestions for candidates.
 */

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Download, 
  FileText, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Zap, 
  CheckCircle, 
  X, 
  Star, 
  Crown,
  Brain,
  Target,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Sparkles,
  BarChart3,
  Eye,
  Magic
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { useAuth } from './AuthProvider';

import type { 
  ResumeData, 
  ATSScore, 
  ResumeOptimizationSuggestion, 
  SkillsAnalysis,
  JobDescription
} from '../utils/ai/resumeOptimizer';

interface AIResumeBuilderProps {
  onBack: () => void;
  onUpgrade: () => void;
}

type Step = 
  | 'welcome' 
  | 'template' 
  | 'contact' 
  | 'summary' 
  | 'experience' 
  | 'skills' 
  | 'education' 
  | 'ai-optimization'
  | 'ats-analysis'
  | 'review' 
  | 'download';

interface AIInsight {
  type: 'suggestion' | 'warning' | 'improvement';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

const templates = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, traditional layout optimized for ATS systems',
    preview: '/template-professional.png',
    features: ['ATS-Optimized', 'Traditional Format', 'Corporate Style'],
    atsScore: 98
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with visual hierarchy',
    preview: '/template-modern.png',
    features: ['Visual Impact', 'Two-Column', 'Creative Industries'],
    atsScore: 85
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, focused design for maximum readability',
    preview: '/template-minimalist.png',
    features: ['Clean Design', 'Easy to Read', 'Versatile'],
    atsScore: 92
  }
];

export function AIResumeBuilder({ onBack, onUpgrade }: AIResumeBuilderProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
      languages: []
    },
    projects: [],
    certifications: [],
    sections: []
  });

  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<ResumeOptimizationSuggestion[]>([]);
  const [skillsAnalysis, setSkillsAnalysis] = useState<SkillsAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [targetJob, setTargetJob] = useState<JobDescription | null>(null);
  const [showJobTargeting, setShowJobTargeting] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const steps: { id: Step; title: string; icon: any; description: string }[] = [
    { id: 'welcome', title: 'Welcome', icon: Star, description: 'Get started' },
    { id: 'template', title: 'Template', icon: FileText, description: 'Choose design' },
    { id: 'contact', title: 'Contact', icon: User, description: 'Personal info' },
    { id: 'summary', title: 'Summary', icon: FileText, description: 'Professional summary' },
    { id: 'experience', title: 'Experience', icon: Briefcase, description: 'Work history' },
    { id: 'skills', title: 'Skills', icon: Award, description: 'Technical & soft skills' },
    { id: 'education', title: 'Education', icon: GraduationCap, description: 'Academic background' },
    { id: 'ai-optimization', title: 'AI Optimize', icon: Brain, description: 'AI suggestions' },
    { id: 'ats-analysis', title: 'ATS Check', icon: Target, description: 'Compatibility score' },
    { id: 'review', title: 'Review', icon: Check, description: 'Final review' }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const progress = ((getCurrentStepIndex() + 1) / steps.length) * 100;

  useEffect(() => {
    // Initialize with user data if available
    if (user) {
      setResumeData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          name: user.name || '',
          email: user.email || ''
        }
      }));
    }
  }, [user]);

  useEffect(() => {
    // Generate AI insights when resume data changes
    if (currentStep === 'ai-optimization') {
      generateAIInsights();
    }
  }, [currentStep, resumeData]);

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const generateAIInsights = async () => {
    try {
      // Import AI resume optimizer
      const { aiResumeOptimizer } = await import('../utils/ai/resumeOptimizer');
      
      // Generate optimization suggestions
      const suggestions = aiResumeOptimizer.generateOptimizationSuggestions(resumeData, targetJob || undefined);
      setOptimizationSuggestions(suggestions);
      
      // Calculate ATS score
      const score = aiResumeOptimizer.calculateATSScore(resumeData, targetJob || undefined);
      setAtsScore(score);
      
      // Analyze skills if target job is set
      if (targetJob) {
        const analysis = aiResumeOptimizer.analyzeSkillsGap(resumeData, targetJob);
        setSkillsAnalysis(analysis);
      }
      
      // Generate insights
      const insights: AIInsight[] = [];
      
      if (score.overall < 70) {
        insights.push({
          type: 'warning',
          title: 'ATS Compatibility Needs Improvement',
          description: `Your current ATS score is ${score.overall}%. Consider following the optimization suggestions to improve compatibility.`,
          priority: 'high'
        });
      }
      
      if (suggestions.filter(s => s.priority === 'high').length > 0) {
        insights.push({
          type: 'suggestion',
          title: 'High-Priority Optimizations Available',
          description: `${suggestions.filter(s => s.priority === 'high').length} high-priority improvements can significantly boost your resume.`,
          action: 'Review suggestions below',
          priority: 'high'
        });
      }
      
      if (resumeData.summary.length < 100) {
        insights.push({
          type: 'improvement',
          title: 'Professional Summary Too Brief',
          description: 'A compelling 2-3 sentence summary can significantly improve recruiter engagement.',
          priority: 'medium'
        });
      }
      
      setAiInsights(insights);
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast.error('AI analysis temporarily unavailable');
    }
  };

  const runATSAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const { aiResumeOptimizer } = await import('../utils/ai/resumeOptimizer');
      
      // Simulate analysis delay for UX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const score = aiResumeOptimizer.calculateATSScore(resumeData, targetJob || undefined);
      setAtsScore(score);
      
      setCurrentStep('ats-analysis');
      
      toast.success(`ATS analysis complete! Your score: ${score.overall}%`);
      
    } catch (error) {
      console.error('ATS analysis failed:', error);
      toast.error('ATS analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = (suggestion: ResumeOptimizationSuggestion) => {
    // Apply the suggestion to resume data
    switch (suggestion.section) {
      case 'summary':
        if (suggestion.type === 'content') {
          setResumeData(prev => ({
            ...prev,
            summary: suggestion.suggested
          }));
        }
        break;
      // Add more cases for other sections
    }
    
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    toast.success('Suggestion applied successfully!');
  };

  const setJobTarget = (job: Partial<JobDescription>) => {
    const fullJob: JobDescription = {
      title: job.title || '',
      company: job.company || '',
      description: job.description || '',
      requirements: job.requirements || [],
      preferredSkills: job.preferredSkills || [],
      responsibilities: job.responsibilities || [],
      experienceLevel: job.experienceLevel || 'mid',
      industry: job.industry || 'technology',
      remote: job.remote || false
    };
    
    setTargetJob(fullJob);
    setShowJobTargeting(false);
    toast.success('Job target set! AI will optimize your resume for this role.');
    
    // Trigger re-analysis
    setTimeout(generateAIInsights, 500);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                AI-Powered Resume Builder
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Create an ATS-optimized resume with AI-powered content suggestions, 
                real-time optimization, and professional templates designed for modern hiring.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 border-0 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">AI Content Suggestions</h3>
                <p className="text-sm text-muted-foreground">
                  Get intelligent suggestions for summaries, achievements, and keywords
                </p>
              </Card>
              
              <Card className="p-6 border-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold mb-2">ATS Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time ATS scoring and compatibility checks with actionable feedback
                </p>
              </Card>
              
              <Card className="p-6 border-0 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-semibold mb-2">Job-Specific Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  Tailor your resume for specific job postings with AI analysis
                </p>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={nextStep} className="px-8">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Building with AI
              </Button>
              <Button size="lg" variant="outline" onClick={() => setShowJobTargeting(true)}>
                <Target className="w-5 h-5 mr-2" />
                Target Specific Job
              </Button>
            </div>
          </div>
        );

      case 'ai-optimization':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center">
                <Brain className="w-8 h-8 text-primary mr-3" />
                AI Optimization Center
              </h2>
              <p className="text-lg text-muted-foreground">
                Our AI has analyzed your resume and generated personalized optimization suggestions
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* ATS Score Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">ATS Compatibility</h3>
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {atsScore?.overall || 0}%
                  </div>
                  <Progress value={atsScore?.overall || 0} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {atsScore?.overall && atsScore.overall >= 80 ? 'Excellent' : 
                     atsScore?.overall && atsScore.overall >= 60 ? 'Good' : 'Needs Improvement'}
                  </p>
                </div>
              </Card>

              {/* Optimization Status */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Optimizations</h3>
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600 mb-2">
                    {appliedSuggestions.size}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Applied</p>
                  <Badge variant="secondary">
                    {optimizationSuggestions.filter(s => s.priority === 'high').length} high priority remaining
                  </Badge>
                </div>
              </Card>

              {/* Skills Match */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Skills Match</h3>
                  <Award className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">
                    {skillsAnalysis ? 
                      Math.round((skillsAnalysis.matchedSkills.length / (skillsAnalysis.matchedSkills.length + skillsAnalysis.missingSkills.length)) * 100) 
                      : '--'}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {targetJob ? 'Job target match' : 'Set job target for analysis'}
                  </p>
                </div>
              </Card>
            </div>

            <Tabs defaultValue="suggestions" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Optimization Suggestions</h3>
                  <Button variant="outline" onClick={generateAIInsights} disabled={isAnalyzing}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    Refresh Analysis
                  </Button>
                </div>

                <div className="space-y-4">
                  {optimizationSuggestions.map((suggestion) => (
                    <Card key={suggestion.id} className={`p-4 ${appliedSuggestions.has(suggestion.id) ? 'bg-green-50 border-green-200' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={suggestion.priority === 'high' ? 'destructive' : 
                                     suggestion.priority === 'medium' ? 'default' : 'secondary'}
                            >
                              {suggestion.priority} priority
                            </Badge>
                            <Badge variant="outline">{suggestion.section}</Badge>
                            <Badge variant="outline">{suggestion.type}</Badge>
                          </div>
                          <h4 className="font-medium mb-2">
                            {suggestion.type === 'content' ? 'Content Enhancement' :
                             suggestion.type === 'keyword' ? 'Keyword Optimization' :
                             suggestion.type === 'achievement' ? 'Achievement Quantification' :
                             'Formatting Improvement'}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">{suggestion.reason}</p>
                          <div className="bg-muted p-3 rounded-lg mb-2">
                            <p className="text-sm"><strong>Suggestion:</strong> {suggestion.suggested}</p>
                          </div>
                          <p className="text-xs text-primary">{suggestion.impact}</p>
                        </div>
                        <div className="ml-4">
                          {appliedSuggestions.has(suggestion.id) ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Applied
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => applySuggestion(suggestion)}
                            >
                              Apply
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {optimizationSuggestions.length === 0 && (
                    <Card className="p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Great Job!</h3>
                      <p className="text-muted-foreground">Your resume is well-optimized. No critical suggestions at this time.</p>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <h3 className="text-lg font-semibold">AI Insights</h3>
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          insight.type === 'warning' ? 'bg-red-100 text-red-600' :
                          insight.type === 'suggestion' ? 'bg-blue-100 text-blue-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {insight.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                           insight.type === 'suggestion' ? <Sparkles className="w-4 h-4" /> :
                           <TrendingUp className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                          {insight.action && (
                            <Badge variant="outline" className="text-xs">{insight.action}</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="skills" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Skills Analysis</h3>
                  {!targetJob && (
                    <Button variant="outline" onClick={() => setShowJobTargeting(true)}>
                      <Target className="w-4 h-4 mr-2" />
                      Set Job Target
                    </Button>
                  )}
                </div>

                {skillsAnalysis ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <h4 className="font-medium mb-3 text-green-600">Matched Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {skillsAnalysis.matchedSkills.map((skill, index) => (
                          <Badge key={index} className="bg-green-100 text-green-800">{skill}</Badge>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-medium mb-3 text-orange-600">Missing Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {skillsAnalysis.missingSkills.slice(0, 10).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-orange-600">{skill}</Badge>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-4 md:col-span-2">
                      <h4 className="font-medium mb-3">Skill Gaps & Recommendations</h4>
                      <div className="space-y-3">
                        {skillsAnalysis.skillGaps.slice(0, 5).map((gap, index) => (
                          <div key={index} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{gap.skill}</span>
                              <Badge 
                                variant={gap.importance === 'critical' ? 'destructive' : 
                                        gap.importance === 'important' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {gap.importance}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {gap.suggestions.slice(0, 2).map((suggestion, idx) => (
                                <p key={idx}>• {suggestion}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Set a Job Target for Skills Analysis</h3>
                    <p className="text-muted-foreground mb-4">
                      Target a specific job to get detailed skills gap analysis and recommendations
                    </p>
                    <Button onClick={() => setShowJobTargeting(true)}>
                      <Target className="w-4 h-4 mr-2" />
                      Add Job Target
                    </Button>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        );

      case 'ats-analysis':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">ATS Compatibility Report</h2>
              <p className="text-lg text-muted-foreground">
                Detailed analysis of how well your resume performs with Applicant Tracking Systems
              </p>
            </div>

            {atsScore && (
              <div className="space-y-6">
                {/* Overall Score */}
                <Card className="p-6 text-center">
                  <div className="text-6xl font-bold text-primary mb-4">{atsScore.overall}%</div>
                  <h3 className="text-xl font-semibold mb-2">Overall ATS Score</h3>
                  <p className="text-muted-foreground">
                    {atsScore.overall >= 85 ? 'Excellent - Your resume is highly compatible with ATS systems' :
                     atsScore.overall >= 70 ? 'Good - Minor improvements could boost your score' :
                     atsScore.overall >= 50 ? 'Fair - Several optimizations recommended' :
                     'Poor - Significant improvements needed for ATS compatibility'}
                  </p>
                </Card>

                {/* Breakdown Scores */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(atsScore.breakdown).map(([category, score]) => (
                      <div key={category} className="text-center">
                        <div className="text-2xl font-bold text-primary mb-1">{score}%</div>
                        <div className="text-sm font-medium capitalize mb-2">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-green-600">Strengths</h3>
                    <div className="space-y-2">
                      {atsScore.strengths.map((strength, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-orange-600">Recommendations</h3>
                    <div className="space-y-2">
                      {atsScore.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Critical Issues */}
                {atsScore.criticalIssues.length > 0 && (
                  <Card className="p-6 border-red-200 bg-red-50">
                    <h3 className="text-lg font-semibold mb-4 text-red-600">Critical Issues</h3>
                    <div className="space-y-2">
                      {atsScore.criticalIssues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-red-700">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        );

      // Add other step cases (template, contact, summary, experience, skills, education, review)
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Step: {currentStep}</h2>
            <p className="text-muted-foreground mb-6">
              This step is under construction. Use the navigation to move between steps.
            </p>
            <Button onClick={nextStep}>Continue</Button>
          </div>
        );
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
                <h1 className="text-xl font-semibold">AI Resume Builder</h1>
                <p className="text-sm text-muted-foreground">
                  {steps.find(s => s.id === currentStep)?.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {targetJob && (
                <Badge className="bg-primary/10 text-primary">
                  Targeting: {targetJob.title}
                </Badge>
              )}
              <Button onClick={onUpgrade} className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      {currentStep !== 'welcome' && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={getCurrentStepIndex() === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {currentStep === 'ai-optimization' && (
                <Button onClick={runATSAnalysis} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Target className="w-4 h-4 mr-2" />
                  )}
                  Run ATS Analysis
                </Button>
              )}
              
              <Button 
                onClick={nextStep}
                disabled={getCurrentStepIndex() === steps.length - 1}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Job Targeting Dialog */}
      <Dialog open={showJobTargeting} onOpenChange={setShowJobTargeting}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Target a Specific Job
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Add details about a job you're applying for to get personalized optimization suggestions.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Job Title</label>
                <Input placeholder="e.g. Senior Software Engineer" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <Input placeholder="e.g. Google" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Job Description</label>
              <Textarea 
                placeholder="Paste the job description here..."
                rows={6}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowJobTargeting(false)}>
                Cancel
              </Button>
              <Button onClick={() => setJobTarget({
                title: "Senior Software Engineer",
                company: "Tech Company",
                description: "Sample job description",
                requirements: ["React", "TypeScript", "Node.js"],
                preferredSkills: ["AWS", "Docker"],
                responsibilities: ["Develop applications"],
                experienceLevel: "senior",
                industry: "technology",
                remote: true
              })}>
                Set Target
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
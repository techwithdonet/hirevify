import { useState, useEffect } from 'react';
import { Bell, MessageCircle, Settings, LogOut, Plus, Search, User, FileText, Award, Video, Calendar, Users, Zap, Target, Building, Timer, BookOpen, Star, ExternalLink, ArrowRight, Crown, Lightbulb, CheckCircle, PlayCircle, Brain, Sparkles, Scan } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useAuth } from './AuthProvider';
import { usePremiumAccess } from '../utils/premium';
import { HireVifyLogo } from './HireVifyLogo';
import { CandidateATSScanner } from './CandidateATSScanner';

interface CandidateDashboardProps {
  onBuildResume: () => void;
  onViewPortfolio: () => void;
  onTakeKnowledgeAssessment: () => void;
  onVideoInterview: () => void;
  onSearchProjects: () => void;
  onViewInterviews: () => void;
  onViewSettings: () => void;
  onViewMessages: () => void;
  onViewNotifications: () => void;
  onUpgrade: () => void;
  onLogout: () => void;
  onExperienceBuilder: () => void;
  onMicroInternships: () => void;
  onMentorshipProgram: () => void;
  onCareerSwitcherTrack: () => void;
  onProjectChallengeVideo: (projectId: string, projectTitle: string, challengeDescription?: string) => void;
  onAIInterviewCoach: () => void;
  onSkillsDevelopmentAI: () => void;
  onMarketIntelligence: () => void;
  onATSScanner: () => void;
  unreadNotifications: number;
  unreadMessages: number;
}

export function CandidateDashboard({
  onBuildResume,
  onViewPortfolio,
  onTakeKnowledgeAssessment,
  onVideoInterview,
  onSearchProjects,
  onViewInterviews,
  onViewSettings,
  onViewMessages,
  onViewNotifications,
  onUpgrade,
  onLogout,
  onExperienceBuilder,
  onMicroInternships,
  onMentorshipProgram,
  onCareerSwitcherTrack,
  onProjectChallengeVideo,
  onAIInterviewCoach,
  onSkillsDevelopmentAI,
  onMarketIntelligence,
  onATSScanner,
  unreadNotifications,
  unreadMessages
}: CandidateDashboardProps) {
  const { user } = useAuth();
  
  // Safe premium access with fallbacks
  let checkAccess, getSubscription, isTestAccount, subscription;
  try {
    const premiumAccess = usePremiumAccess();
    checkAccess = premiumAccess.checkAccess;
    getSubscription = premiumAccess.getSubscription;
    isTestAccount = premiumAccess.isTestAccount;
    subscription = getSubscription();
  } catch (error) {
    console.error('Error accessing premium features:', error);
    checkAccess = () => false;
    getSubscription = () => ({ isActive: false, tier: 'free', expiresAt: null, trialEndsAt: null });
    isTestAccount = false;
    subscription = { isActive: false, tier: 'free', expiresAt: null, trialEndsAt: null };
  }

  // ATS Scanner state
  const [showATSDialog, setShowATSDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <HireVifyLogo size="md" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Candidate Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome to HireVify, {user?.name || 'Candidate'}!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Premium Status / Upgrade Button */}
              {subscription.isActive ? (
                <Badge className="hidden md:flex bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 px-4 py-2 font-semibold">
                  <Crown className="w-4 h-4 mr-2 text-green-600" />
                  {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
                </Badge>
              ) : (
                <Button onClick={onUpgrade} className="hidden md:flex bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold px-6 py-2 shadow-lg">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={onViewMessages} className="relative">
                  <MessageCircle className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {unreadMessages}
                    </Badge>
                  )}
                </Button>
                
                <Button variant="ghost" size="sm" onClick={onViewNotifications} className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
                
                <Button variant="ghost" size="sm" onClick={onViewSettings}>
                  <Settings className="w-5 h-5" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Getting Started Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 mb-8 border border-primary/20">
          <div className="max-w-4xl">
            <div className="flex items-center mb-4">
              <Lightbulb className="w-8 h-8 text-primary mr-3" />
              <h2 className="text-3xl font-bold text-foreground">
                Welcome to Skills-First Hiring!
              </h2>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              Get started on your career journey with our proven two-step process: verify your knowledge, then showcase your skills through real projects.
            </p>
            
            {/* Two-Step Process */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg border border-primary/10">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Knowledge Assessment</h3>
                  <p className="text-sm text-muted-foreground">Verify your theoretical knowledge with our partners</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg border border-primary/10">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Project Challenge</h3>
                  <p className="text-sm text-muted-foreground">Apply to real projects and prove your practical skills</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button onClick={onTakeKnowledgeAssessment} size="lg">
                <Award className="w-5 h-5 mr-2" />
                Start Knowledge Assessment
              </Button>
              <Button onClick={onSearchProjects} variant="outline" size="lg">
                <Search className="w-5 h-5 mr-2" />
                Browse Project Challenges
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Essential Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Essential Tools</CardTitle>
                <p className="text-sm text-muted-foreground">Build your professional profile and start your journey</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Knowledge Assessment */}
                  <div 
                    onClick={onTakeKnowledgeAssessment} 
                    className="relative p-6 border-2 border-blue-200 hover:border-blue-300 bg-blue-50/30 rounded-lg cursor-pointer transition-colors group h-auto min-h-[140px] flex flex-col"
                  >
                    <div className="flex items-start justify-between w-full mb-3">
                      <div className="flex items-center">
                        <Award className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0" />
                        <span className="font-semibold text-foreground text-base">Knowledge Assessment</span>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">R</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <div className="flex-1 mb-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Verify your theoretical knowledge with a quick, objective test from our partners
                      </p>
                    </div>
                  </div>

                  {/* AI Resume Builder */}
                  <div 
                    onClick={onBuildResume} 
                    className="relative p-6 border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-lg cursor-pointer transition-colors group h-auto min-h-[140px] flex flex-col"
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="flex items-center">
                        <Brain className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                        <span className="font-semibold text-foreground text-base">AI Resume Builder</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!checkAccess('ai-resume-builder') && <Crown className="w-4 h-4 text-yellow-500" />}
                        {checkAccess('ai-resume-builder') && <Crown className="w-4 h-4 text-green-500" />}
                        <Sparkles className="w-4 h-4 text-purple-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        AI-powered resume optimization with ATS scanning, content suggestions, and smart formatting
                      </p>
                    </div>
                  </div>

                  {/* Portfolio */}
                  <div 
                    onClick={onViewPortfolio} 
                    className="relative p-6 border border-border hover:border-primary/30 bg-card rounded-lg cursor-pointer transition-colors group h-auto min-h-[140px] flex flex-col"
                  >
                    <div className="flex items-center w-full mb-3">
                      <User className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                      <span className="font-semibold text-foreground text-base">Portfolio</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Showcase your projects, achievements, and work samples to employers
                      </p>
                    </div>
                  </div>

                  {/* ATS Resume Scanner */}
                  <div 
                    onClick={onATSScanner} 
                    className="relative p-6 border-2 border-orange-200 hover:border-orange-300 bg-gradient-to-br from-orange-50/50 to-red-50/30 rounded-lg cursor-pointer transition-colors group h-auto min-h-[140px] flex flex-col"
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="flex items-center">
                        <Scan className="w-5 h-5 mr-3 text-orange-600 flex-shrink-0" />
                        <span className="font-semibold text-foreground text-base">ATS Resume Scanner</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Check your resume's ATS compatibility and get personalized optimization suggestions
                      </p>
                    </div>
                  </div>

                  {/* Find Projects */}
                  <div 
                    onClick={onSearchProjects} 
                    className="relative p-6 border border-border hover:border-primary/30 bg-card rounded-lg cursor-pointer transition-colors group h-auto min-h-[140px] flex flex-col"
                  >
                    <div className="flex items-center w-full mb-3">
                      <Search className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                      <span className="font-semibold text-foreground text-base">Find Projects</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Discover project-based opportunities and real work challenges
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experience Building Pathways */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-primary" />
                  Experience Building Pathways
                </CardTitle>
                <p className="text-sm text-muted-foreground">Multiple ways to gain experience and build your career</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={onExperienceBuilder}
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Experience Builder</h4>
                        <p className="text-xs text-muted-foreground">1-2 week trial projects</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Gain real work experience through short-term projects with companies
                    </p>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      High conversion rate
                    </Badge>
                  </div>

                  <div 
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={onMicroInternships}
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-blue/10 rounded-lg flex items-center justify-center mr-3">
                        <Timer className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Micro-Internships</h4>
                        <p className="text-xs text-muted-foreground">1-5 day projects</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Quick wins with paid projects that build your portfolio
                    </p>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      Paid opportunities
                    </Badge>
                  </div>

                  <div 
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={onMentorshipProgram}
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center mr-3">
                        <Users className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Mentorship Program</h4>
                        <p className="text-xs text-muted-foreground">1-on-1 guidance</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Get paired with industry professionals for career guidance
                    </p>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      Expert mentors
                    </Badge>
                  </div>

                  <div 
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={onCareerSwitcherTrack}
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-purple/10 rounded-lg flex items-center justify-center mr-3">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Career Switcher Track</h4>
                        <p className="text-xs text-muted-foreground">Structured learning</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Structured learning paths for career transitions
                    </p>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      High success rate
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Getting Started Guide */}
            <Card>
              <CardHeader>
                <CardTitle>How Skills-First Hiring Works</CardTitle>
                <p className="text-sm text-muted-foreground">Understanding our revolutionary approach to hiring</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Verify Your Knowledge</h4>
                      <p className="text-sm text-muted-foreground">
                        Complete objective assessments to validate your theoretical understanding of key concepts and technologies.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PlayCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Demonstrate Through Projects</h4>
                      <p className="text-sm text-muted-foreground">
                        Apply to real project challenges where you can showcase your practical skills and problem-solving abilities.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Video className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Explain Your Work</h4>
                      <p className="text-sm text-muted-foreground">
                        Record video explanations of your project solutions to show your thought process and communication skills.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Premium Status / Upgrade - Mobile Version */}
            {!subscription.isActive ? (
              <Card className="md:hidden bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="text-center py-6">
                  <Crown className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                  <h3 className="font-bold text-foreground mb-2">Unlock Premium Features</h3>
                  <p className="text-sm text-muted-foreground mb-4">Advanced analytics, priority support, and more</p>
                  <Button onClick={onUpgrade} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white">
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="md:hidden bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="text-center py-6">
                  <Crown className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-bold text-foreground mb-2">{subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan Active</h3>
                  <p className="text-sm text-muted-foreground mb-4">Enjoying all premium features</p>
                  <Button onClick={onUpgrade} variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50">
                    Manage Plan
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Next Steps - Getting Started Guide */}
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Your Journey Starts Here
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">1. Complete Knowledge Assessment</span>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Start Here</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Verify your theoretical knowledge to unlock project opportunities</p>
                    <Button onClick={onTakeKnowledgeAssessment} size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                      Begin Assessment
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-white/50 rounded-lg border border-gray-200 opacity-75">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">2. Apply to Project Challenges</span>
                      <Badge variant="outline" className="text-xs">Next</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Once assessment is complete, browse and apply to real projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Profile Setup</span>
                  <Button variant="ghost" size="sm" onClick={onViewSettings}>
                    <Settings className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Basic Profile</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={onViewSettings}>
                      Setup
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-gradient-to-r from-primary/5 to-purple-500/5">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm">AI Resume</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={onBuildResume} className="border-primary/20 hover:bg-primary/10">
                      Create
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Portfolio</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={onViewPortfolio}>
                      Build
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* No Active Projects - Empty State */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="w-5 h-5 mr-2 text-primary" />
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No active projects yet</p>
                  <Button onClick={onSearchProjects} size="sm" className="w-full">
                    Find Projects
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* No Upcoming Interviews - Empty State */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Upcoming Interviews</span>
                  <Button variant="ghost" size="sm" onClick={onViewInterviews}>
                    <Calendar className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming interviews</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* ATS Scanner Dialog */}
      <CandidateATSScanner 
        showUploadDialog={showATSDialog}
        setShowUploadDialog={setShowATSDialog}
      />
    </div>
  );
}
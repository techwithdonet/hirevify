import { useState, useEffect } from 'react';
import { Bell, MessageCircle, Settings, LogOut, Plus, Search, User, FileText, Award, Video, Calendar, Users, Zap, Target, Building, Timer, BookOpen, Star, ExternalLink, ArrowRight, Crown, Lightbulb, CheckCircle, PlayCircle, Brain, Sparkles, Scan, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useAuth } from './AuthProvider';
import { HireVifyLogo } from './HireVifyLogo';
import { CandidateATSScanner } from './CandidateATSScanner';
import { subscriptionsService } from '@/src/hirevify-app/services/subscriptionsService';
import { profilesService } from '@/src/hirevify-app/services/profilesService';
import { applicationsService } from '@/src/hirevify-app/services/applicationsService';
import { portfolioService } from '@/src/hirevify-app/services/portfolioService';
import { savedJobsService } from '@/src/hirevify-app/services/savedJobsService';
import { usePremiumAccess } from '../utils/premium';
import { toast } from 'sonner';

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
  const { checkAccess } = usePremiumAccess();
  const [subscription, setSubscription] = useState<any>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showATSDialog, setShowATSDialog] = useState(false);

  // Load all candidate data from Supabase
  useEffect(() => {
    const loadCandidateData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Load subscription
        const subData = await subscriptionsService.getUserSubscription(user.id);
        if (subData.data) {
          setSubscription(subData.data);
        } else {
          // Default free tier if no subscription
          setSubscription({ tier: 'free', isActive: false });
        }

        // Load candidate profile
        const profileData = await profilesService.getCandidateProfile(user.id);
        if (profileData.data) {
          setCandidateProfile(profileData.data);
        }

        // Load applications
        const appData = await applicationsService.getCandidateApplications(user.id);
        if (appData.data) {
          setApplications(appData.data);
        }

        // Load portfolio
        const portfolioData = await portfolioService.getUserPortfolio(user.id);
        if (portfolioData.data) {
          setPortfolio(portfolioData.data);
        }

        // Load saved jobs
        const savedData = await savedJobsService.getCandidateSavedJobs(user.id);
        if (savedData.data) {
          setSavedJobs(savedData.data);
        }
      } catch (error) {
        console.error('Error loading candidate data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidateData();
  }, [user?.id]);

  const candidateProfileCompleteness = Number(candidateProfile?.profile_completeness || 0);
  const isCandidateProfileComplete =
    Boolean(candidateProfile?.profile_completed) || candidateProfileCompleteness >= 60;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <HireVifyLogo size="md" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(' ')[0] || 'Candidate'}</h1>
                <p className="text-sm text-gray-500">Your career dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Premium Status / Upgrade Button */}
              {subscription && subscription.isActive ? (
                <Badge className="hidden md:flex bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2 font-semibold rounded-full">
                  <Crown className="w-4 h-4 mr-2 text-emerald-600" />
                  {subscription.tier?.charAt(0).toUpperCase() + subscription.tier?.slice(1)} Plan
                </Badge>
              ) : (
                <Button onClick={onUpgrade} className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
              
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" onClick={onViewMessages} className="relative rounded-lg hover:bg-emerald-50">
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                  {false && unreadMessages > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                      {unreadMessages}
                    </Badge>
                  )}
                </Button>
                
                <Button variant="ghost" size="icon" onClick={onViewNotifications} className="relative rounded-lg hover:bg-emerald-50">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {false && unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
                
                <Button variant="ghost" size="icon" onClick={onViewSettings} className="rounded-lg hover:bg-emerald-50">
                  <Settings className="w-5 h-5 text-gray-600" />
                </Button>
                
                <Button variant="ghost" size="icon" onClick={onLogout} className="rounded-lg hover:bg-red-50">
                  <LogOut className="w-5 h-5 text-gray-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-12 h-12 animate-spin text-emerald-600" />
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        )}

        {!isLoading && (
        <>
        {/* Profile Completion Card */}
        <Card className="mb-8 border border-emerald-100 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCandidateProfileComplete ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                  {isCandidateProfileComplete ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <User className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-900">
                      {isCandidateProfileComplete ? 'Your profile is ready' : 'Complete your candidate profile'}
                    </h2>
                    <Badge className={isCandidateProfileComplete ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}>
                      {candidateProfileCompleteness}% complete
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {isCandidateProfileComplete
                      ? 'Recruiters can now discover your profile from candidate search. Keep it updated for better matches.'
                      : 'Add skills, experience, salary, work type, location, and portfolio details so recruiters can find you.'}
                  </p>
                </div>
              </div>

              <Button onClick={onViewSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isCandidateProfileComplete ? 'View / Edit Profile' : 'Complete Profile'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Applications</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{applications.length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Portfolio Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{portfolio.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Saved Jobs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{savedJobs.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Subscription</p>
                <p className="text-lg font-bold text-gray-900 mt-2">{subscription?.tier || 'Free'}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Tools */}
          <div className="lg:col-span-2 space-y-6">
            {/* Essential Tools */}
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Get Started</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={onTakeKnowledgeAssessment} className="p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group">
                  <div className="flex items-center justify-between mb-3">
                    <Award className="w-6 h-6 text-emerald-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Knowledge Assessment</h3>
                  <p className="text-sm text-gray-600">Verify your skills</p>
                </button>

                <button onClick={onBuildResume} className="p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group">
                  <div className="flex items-center justify-between mb-3">
                    <Brain className="w-6 h-6 text-blue-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI Resume Builder</h3>
                  <p className="text-sm text-gray-600">Create your resume</p>
                </button>

                <button onClick={onViewPortfolio} className="p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group">
                  <div className="flex items-center justify-between mb-3">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Portfolio</h3>
                  <p className="text-sm text-gray-600">Showcase your work</p>
                </button>

                <button onClick={onSearchProjects} className="p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group">
                  <div className="flex items-center justify-between mb-3">
                    <Search className="w-6 h-6 text-orange-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Find Projects</h3>
                  <p className="text-sm text-gray-600">Explore opportunities</p>
                </button>
              </div>
            </div>

            {/* Career Growth */}
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Career Growth Paths</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={onExperienceBuilder} className="p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                      <Target className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Experience Builder</h4>
                      <p className="text-xs text-gray-500">1-2 week projects</p>
                    </div>
                  </div>
                </button>

                <button onClick={onMicroInternships} className="p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Timer className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Micro-Internships</h4>
                      <p className="text-xs text-gray-500">1-5 day projects</p>
                    </div>
                  </div>
                </button>

                <button onClick={onMentorshipProgram} className="p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Mentorship</h4>
                      <p className="text-xs text-gray-500">Expert guidance</p>
                    </div>
                  </div>
                </button>

                <button onClick={onCareerSwitcherTrack} className="p-6 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Career Switch</h4>
                      <p className="text-xs text-gray-500">Structured learning</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Premium Status / Upgrade - Mobile Version */}
            {!subscription?.isActive ? (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <div className="text-center">
                  <Crown className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Go Premium</h3>
                  <p className="text-sm text-gray-600 mb-4">Unlock advanced tools and features</p>
                  <Button onClick={onUpgrade} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg">
                    Upgrade Now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <div className="text-center">
                  <Crown className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-1">{subscription?.tier?.charAt(0).toUpperCase() + subscription?.tier?.slice(1)} Plan</h3>
                  <p className="text-sm text-gray-600">Premium features enabled</p>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Recent Applications</h3>
              {applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{app.job?.title || app.job_title || app.title || 'Application submitted'}</p>
                      <p className="text-xs text-gray-500">Status: {app.status || 'applied'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No applications yet</p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button onClick={onATSScanner} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-lg font-medium transition-colors">
                  ATS Resume Scanner
                </button>
                <button onClick={onAIInterviewCoach} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-lg font-medium transition-colors">
                  Interview Coach
                </button>
                <button onClick={onSkillsDevelopmentAI} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-lg font-medium transition-colors">
                  Skills Development
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </main>
      
      {/* ATS Scanner Dialog */}
      <CandidateATSScanner 
        showUploadDialog={showATSDialog}
        setShowUploadDialog={setShowATSDialog}
      />
    </div>
  );
}







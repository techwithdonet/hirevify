import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { HireVifyLogo } from './HireVifyLogo';
import { 
  Plus, 
  Briefcase, 
  Users, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  LogOut,
  TrendingUp,
  Clock,
  Target,
  Crown,
  Bell,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Star,
  Award,
  Plug,
  MessageSquare,
  User,
  ChevronDown,
  ArrowRight,
  FileText,
  Lightbulb,
  Brain,
  Scan
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { usePremiumAccess } from '../utils/premium';

interface Project {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget: string;
  timeline: string;
  applications: number;
  status: 'active' | 'closed' | 'draft';
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
}

interface RecruiterDashboardProps {
  [key: string]: any;
  onPostProject: (project?: Project) => void;
  onViewProjects?: () => void;
  onViewATS: () => void;
  onViewATSScanner?: () => void;
  onViewAIMatchingDashboard?: () => void;
  onViewAnalytics: () => void;
  onViewSkillsAssessment?: () => void;
  onViewIntegrations?: () => void;
  onViewInterviews?: () => void;
  onViewSettings?: () => void;
  onSearchCandidates?: () => void;
  onViewMessages?: () => void;
  onViewNotifications?: () => void;
  onUpgrade: () => void;
  onLogout: () => void;
  onSkillsFirstHiring?: () => void;
  onEmployerEducation?: () => void;
  unreadNotifications?: number;
  unreadMessages?: number;
}

export function RecruiterDashboard({ 
  onPostProject, 
  onViewProjects,
  onViewATS, 
  onViewATSScanner,
  onViewAIMatchingDashboard,
  onViewAnalytics, 
  onViewSkillsAssessment,
  onViewIntegrations,
  onViewInterviews,
  onViewSettings,
  onSearchCandidates,
  onViewMessages,
  onViewNotifications,
  onUpgrade, 
  onLogout,
  onSkillsFirstHiring,
  onEmployerEducation,
  unreadNotifications = 0,
  unreadMessages = 0
}: RecruiterDashboardProps) {
  const { user } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Safe premium access with fallbacks
  let checkAccess, getSubscription, subscription;
  let aiMatchingAccess = false;
  let atsAccess = false;
  let assessmentsAccess = false;
  let analyticsAccess = false;
  let integrationsAccess = false;

  try {
    const premiumAccess = usePremiumAccess();
    checkAccess = premiumAccess.checkAccess;
    getSubscription = premiumAccess.getSubscription;
    subscription = getSubscription();

    // Optimize access checks
    aiMatchingAccess = checkAccess('ai-matching');
    atsAccess = checkAccess('ats-scanner');
    assessmentsAccess = checkAccess('custom-assessments');
    analyticsAccess = checkAccess('advanced-analytics');
    integrationsAccess = checkAccess('integrations');
  } catch (error) {
    console.error('Error accessing premium features:', error);
    subscription = { isActive: false, tier: 'free', expiresAt: null, trialEndsAt: null };
  }

  // Remove demo data - start with empty arrays
  const projects: Project[] = [];

  const sidebarItems = useMemo(() => [
    { icon: BarChart3, label: 'Dashboard', active: true, count: null },
    { icon: FolderOpen, label: 'Projects', active: false, count: projects.length || null, onClick: onViewProjects },
    { icon: Users, label: 'Candidates', active: false, count: null, onClick: onViewATS },
    { 
      icon: Brain, 
      label: 'AI Matching', 
      active: false, 
      count: null, 
      onClick: onViewAIMatchingDashboard, 
      premium: true,
      hasAccess: aiMatchingAccess
    },
    { 
      icon: Scan, 
      label: 'ATS Scanner', 
      active: false, 
      count: null, 
      onClick: onViewATSScanner, 
      premium: true,
      hasAccess: atsAccess
    },
    { 
      icon: Award, 
      label: 'Assessments', 
      active: false, 
      count: null, 
      onClick: onViewSkillsAssessment, 
      premium: true,
      hasAccess: assessmentsAccess
    },
    { 
      icon: Target, 
      label: 'Analytics', 
      active: false, 
      count: null, 
      onClick: onViewAnalytics, 
      premium: true,
      hasAccess: analyticsAccess
    },
    { icon: Calendar, label: 'Interviews', active: false, count: null, onClick: onViewInterviews },
    { icon: MessageSquare, label: 'Messages', active: false, count: unreadMessages || null, onClick: onViewMessages },
    { 
      icon: Plug, 
      label: 'Integrations', 
      active: false, 
      count: null, 
      onClick: onViewIntegrations,
      premium: true,
      hasAccess: integrationsAccess
    },
    { icon: Settings, label: 'Settings', active: false, count: null, onClick: onViewSettings },
  ], [
    projects.length, 
    aiMatchingAccess,
    atsAccess,
    assessmentsAccess,
    analyticsAccess,
    integrationsAccess,
    onViewProjects, 
    onViewATS, 
    onViewAIMatchingDashboard,
    onViewATSScanner,
    onViewSkillsAssessment,
    onViewAnalytics,
    onViewInterviews,
    onViewMessages,
    onViewIntegrations,
    onViewSettings,
    unreadMessages
  ]);

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Professional Sidebar */}
      <aside className="w-80 bg-card border-r border-border flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3 mb-2">
            <HireVifyLogo size="md" />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Recruiter Portal
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item, index) => (
            <Button
              key={index}
              variant={item.active ? "default" : "ghost"}
              className={`w-full justify-between h-12 px-4 ${
                item.active 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-foreground hover:bg-muted hover:text-foreground'
              }`}
              onClick={item.onClick}
            >
              <div className="flex items-center flex-1 min-w-0">
                <item.icon className="w-5 h-5 mr-3 shrink-0" />
                <span className="flex-1 text-left ">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(item as any).isNew && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-1.5 py-0.5 shrink-0">
                    NEW
                  </Badge>
                )}
                {item.premium && !item.hasAccess && <Crown className="w-4 h-4 text-yellow-500 shrink-0" />}
                {item.premium && item.hasAccess && <Crown className="w-4 h-4 text-green-500 shrink-0" />}
                {item.count && (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs shrink-0">
                    {item.count}
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </nav>

        {/* Upgrade Section / Premium Status */}
        <div className="p-4 border-t border-border">
          {subscription.isActive ? (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <Crown className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-semibold text-foreground">{subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Enjoying premium features! Access to all advanced tools and priority support.
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onUpgrade}
                  className="w-full border-green-200 text-green-700 hover:bg-green-50 font-medium"
                >
                  Manage Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <Crown className="w-5 h-5 text-primary mr-2" />
                  <span className="font-semibold text-foreground">Upgrade to Pro</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Unlock advanced analytics, AI-powered screening, and priority support.
                </p>
                <Button 
                  size="sm" 
                  onClick={onUpgrade}
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
                >
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 w-full justify-start p-2 hover:bg-muted">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {user ? getUserInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{user?.name || 'User'}</p>
                  <p className="text-sm text-muted-foreground">Recruiter</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => {}}>
                <User className="w-4 h-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout();
                }}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Enhanced Header */}
        <header className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome to HireVify, {user?.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-muted-foreground">
                Get started by posting your first project or exploring our hiring tools
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={onSearchCandidates}
                className="border-border text-foreground hover:bg-muted"
              >
                <Search className="w-4 h-4 mr-2" />
                Search Candidates
              </Button>
              <Button 
                variant="outline" 
                onClick={onViewNotifications}
                className="border-border text-foreground hover:bg-muted relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 rounded-full p-0 flex items-center justify-center">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Badge>
                )}
              </Button>
              <Button 
                onClick={() => onPostProject()}
                className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium px-6"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Post Your First Project
              </Button>
            </div>
          </div>

          {/* Quick Stats - All showing 0 for new users */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { 
                label: 'Active Projects', 
                value: '0',
                icon: FolderOpen,
                color: 'text-primary',
                bg: 'bg-primary/10',
                onClick: onViewProjects
              },
              { 
                label: 'Total Applications', 
                value: '0',
                icon: Users,
                color: 'text-success',
                bg: 'bg-success/10',
                onClick: onViewATS
              },
              { 
                label: 'Interviews Scheduled', 
                value: '0',
                icon: Calendar,
                color: 'text-warning',
                bg: 'bg-warning/10',
                onClick: onViewInterviews
              },
              { 
                label: 'Days Active',
                value: 'New',
                icon: BarChart3,
                color: 'text-secondary-600',
                bg: 'bg-secondary/10',
                onClick: onViewAnalytics
              }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="flex items-center p-4 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={stat.onClick}
              >
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mr-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="font-bold text-xl text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* Content Area - Getting Started */}
        <div className="flex-1 p-6 space-y-8">
          {projects.length === 0 ? (
            /* Getting Started Section for New Users */
            <>
              <section>
                <Card className="border border-border">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 mr-2 text-primary" />
                      Welcome to Skills-First Hiring
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Transform your hiring process with project-based evaluation and AI-powered matching. Get started in just a few steps.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Plus className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">1. Post Your First Project</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create a project posting with specific requirements and let candidates showcase their skills through real work.
                        </p>
                        <Button 
                          onClick={() => onPostProject()}
                          className="bg-primary hover:bg-primary-hover text-primary-foreground"
                        >
                          Create Project
                        </Button>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-success" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">2. Review Candidates</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Evaluate candidates based on their project submissions and real work samples instead of just resumes.
                        </p>
                        <Button 
                          variant="outline"
                          onClick={onViewATS}
                          className="border-border text-foreground hover:bg-muted"
                        >
                          Explore ATS
                        </Button>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Award className="w-8 h-8 text-warning" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">3. Use Skills Assessments</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create custom assessments to validate technical skills and ensure the perfect match for your needs.
                        </p>
                        <Button 
                          variant="outline"
                          onClick={onViewSkillsAssessment}
                          className="border-border text-foreground hover:bg-muted"
                        >
                          <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                          Try Assessments
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Quick Actions Section */}
              <section>
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center">
                      <Star className="w-5 h-5 mr-2 text-primary" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Essential tools to get your hiring process started
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          title: 'Post New Project',
                          description: 'Create your first project posting',
                          icon: Plus,
                          onClick: () => onPostProject(),
                          color: 'text-primary',
                          bg: 'bg-primary/10'
                        },
                        {
                          title: 'Search Candidates',
                          description: 'Browse our talent pool',
                          icon: Search,
                          onClick: onSearchCandidates,
                          color: 'text-success',
                          bg: 'bg-success/10'
                        },
                        {
                          title: 'Skills-First Hiring',
                          description: 'Learn our methodology',
                          icon: Target,
                          onClick: onSkillsFirstHiring,
                          color: 'text-purple-600',
                          bg: 'bg-purple-100'
                        },
                        {
                          title: 'Employer Education',
                          description: 'Best hiring practices',
                          icon: FileText,
                          onClick: onEmployerEducation,
                          color: 'text-blue-600',
                          bg: 'bg-blue-100'
                        }
                      ].map((action, index) => (
                        <Button 
                          key={index}
                          variant="outline" 
                          onClick={action.onClick}
                          className="h-auto p-6 border-border text-left hover:bg-muted hover:border-primary/20 transition-all duration-200"
                        >
                          <div className="w-full">
                            <div className="flex items-center mb-3">
                              <div className={`w-10 h-10 ${action.bg} rounded-lg flex items-center justify-center mr-3`}>
                                <action.icon className={`w-5 h-5 ${action.color}`} />
                              </div>
                            </div>
                            <h4 className="font-medium text-foreground mb-1">{action.title}</h4>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Features Overview */}
              <section>
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Why Choose Skills-First Hiring?</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Transform how you evaluate and hire talent
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Project-Based Evaluation</h4>
                          <p className="text-sm text-muted-foreground">
                            See real work samples and assess candidates based on actual project outcomes, not just keywords on a resume.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BarChart3 className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">AI-Powered Matching</h4>
                          <p className="text-sm text-muted-foreground">
                            Our advanced AI analyzes skills, project requirements, and preferences to find perfect matches with 95% accuracy.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Award className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Skills Assessments</h4>
                          <p className="text-sm text-muted-foreground">
                            Create custom technical assessments and coding challenges to validate skills before making hiring decisions.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Advanced Analytics</h4>
                          <p className="text-sm text-muted-foreground">
                            Track hiring metrics, diversity insights, and ROI with comprehensive analytics and reporting dashboards.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </>
          ) : (
            /* Active Projects Section - for users with existing projects */
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Active Projects</h2>
                  <p className="text-muted-foreground">Manage your current project postings and applications</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" onClick={onViewATS} className="border-border text-foreground hover:bg-muted">
                    <Users className="w-4 h-4 mr-2" />
                    View All Candidates
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <Card 
                    key={project.id} 
                    className="border border-border hover:shadow-lg transition-all duration-300 hover:border-primary/20 cursor-pointer"
                    onClick={() => onPostProject(project)}
                  >
                    {/* Project card content would go here */}
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}






import { useState } from 'react';
import { Button } from './ui/button';
import { AuthModal } from './AuthModal';
import { useAuth } from './AuthProvider';
import { 
  Building2, 
  Search, 
  Target,
  Shield,
  BarChart3,
  Settings,
  User,
  Zap,
  Star,
  CheckCircle,
  MessageCircle,
  Link,
  GitBranch,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { HireVifyLogo } from './HireVifyLogo';

interface HomepageProps {
  onSelectUserType: (userType: 'recruiter' | 'candidate') => void;
  onPostProject: () => void;
  onFindProject: () => void;
}

export function Homepage({ onSelectUserType, onPostProject, onFindProject }: HomepageProps) {
  const { signIn, user, setUser } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleSignIn = () => {
    setAuthModalTab('signin');
    setAuthModalOpen(true);
  };

  // Handle CTA buttons with proper authentication flow
  const handlePostProject = () => {
    if (!user) {
      setAuthModalTab('signin');
      setAuthModalOpen(true);
      toast.info('Please sign in to start hiring');
    } else {
      onPostProject();
    }
  };

  const handleFindProject = () => {
    if (!user) {
      setAuthModalTab('signin');
      setAuthModalOpen(true);
      toast.info('Please sign in to find projects');
    } else {
      onFindProject();
    }
  };

 // Test account login handlers
const handleTestRecruiterLogin = async () => {
  try {
    toast.info('Signing in as test recruiter...');

    const result = await signIn('recruiter@hirevify.com', 'TestPassword123!');

    if (result.success && result.user) {
      const recruiterUser = {
        ...result.user,
        name: result.user.name || 'Test Recruiter',
        email: 'recruiter@hirevify.com',
        userType: 'recruiter' as const,
        profileComplete: true,
      };

      setUser(recruiterUser);

      localStorage.setItem('hirevify_user', JSON.stringify(recruiterUser));
      localStorage.setItem('hirevify_access_token', recruiterUser.accessToken || '');

      toast.success('Successfully signed in as recruiter!');

      setTimeout(() => {
        onSelectUserType('recruiter');
      }, 300);
    } else {
      toast.error(result.message || 'Failed to sign in as test recruiter');
    }
  } catch (error) {
    console.error('Test recruiter login error:', error);
    toast.error('Failed to sign in as test recruiter');
  }
};

const handleTestCandidateLogin = async () => {
  try {
    toast.info('Signing in as test candidate...');

    const result = await signIn('candidate@hirevify.com', 'TestPassword123!');

    if (result.success && result.user) {
      const candidateUser = {
        ...result.user,
        name: result.user.name || 'Test Candidate',
        email: 'candidate@hirevify.com',
        userType: 'candidate' as const,
        profileComplete: true,
      };

      setUser(candidateUser);

      localStorage.setItem('hirevify_user', JSON.stringify(candidateUser));
      localStorage.setItem('hirevify_access_token', candidateUser.accessToken || '');

      toast.success('Successfully signed in as candidate!');

      setTimeout(() => {
        onSelectUserType('candidate');
      }, 300);
    } else {
      toast.error(result.message || 'Failed to sign in as test candidate');
    }
  } catch (error) {
    console.error('Test candidate login error:', error);
    toast.error('Failed to sign in as test candidate');
  }
};
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 lg:h-24">
            {/* HireVify Logo */}
            <div className="flex items-center">
              <HireVifyLogo size="xl" className="h-10 sm:h-14 lg:h-20" />
            </div>

            {/* Navigation and Login - All Inline */}
            <div className="hidden md:flex items-center gap-3 lg:gap-6">
              {/* Navigation Links - Always Visible */}
              <nav className="flex items-center gap-3 lg:gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection('features')}
                  className="text-gray-800 hover:text-primary hover:bg-primary/10 font-semibold px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  Features
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-gray-800 hover:text-primary hover:bg-primary/10 font-semibold px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  How it Works
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection('testimonials')}
                  className="text-gray-800 hover:text-primary hover:bg-primary/10 font-semibold px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  Testimonials
                </Button>
              </nav>

              {/* Login Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignIn}
                className="group border-2 border-gray-300 text-gray-800 hover:border-primary hover:text-primary bg-white/90 backdrop-blur-sm rounded-xl transition-all duration-200 transform hover:scale-105 font-semibold px-3 py-2"
              >
                <User className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                Login
              </Button>
              {/* Admin Button - Temporary */}
              <a 
                href="/admin1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-primary transition-colors px-2 py-1"
              >
                Admin
              </a>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignIn}
                className="group border border-gray-300 text-gray-800 hover:border-primary hover:text-primary bg-white/90 rounded-lg font-semibold px-3"
              >
                <User className="w-4 h-4" />
                Login
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="rounded-lg text-gray-800 hover:bg-primary/10 hover:text-primary"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden border-t border-gray-200/70 py-3">
              <div className="grid gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection('features')}
                  className="justify-start rounded-lg text-gray-800 hover:bg-primary/10 hover:text-primary"
                >
                  Features
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection('how-it-works')}
                  className="justify-start rounded-lg text-gray-800 hover:bg-primary/10 hover:text-primary"
                >
                  How it Works
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection('testimonials')}
                  className="justify-start rounded-lg text-gray-800 hover:bg-primary/10 hover:text-primary"
                >
                  Testimonials
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className={`relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/30 sm:pt-28 ${mobileMenuOpen ? 'pt-56' : 'pt-24'}`}>
        {/* Modern Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-1/6 w-48 h-48 bg-gradient-to-br from-teal-200/40 to-emerald-200/20 rounded-full blur-2xl"></div>
          
          {/* Geometric Shapes */}
          <div className="absolute top-20 right-20 w-16 h-16 border border-primary/20 rounded-lg rotate-45 opacity-30"></div>
          <div className="absolute bottom-40 left-20 w-12 h-12 bg-primary/10 rounded-full"></div>
          <div className="absolute top-1/3 left-1/6 w-8 h-8 bg-gradient-to-br from-primary/30 to-transparent rounded-sm rotate-12"></div>
        </div>

        {/* Hero Content */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* AI Badge */}
          <div className="inline-flex items-center px-6 py-3 mb-8 bg-white/80 backdrop-blur-sm border border-primary/20 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-2 h-2 bg-primary rounded-full mr-3 animate-pulse"></div>
            <Zap className="w-4 h-4 mr-2 text-primary" />
            <span className="text-sm font-medium bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              AI-Powered Hiring Platform
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-6 leading-[0.9] tracking-tight">
            Hiring based on{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-emerald-500">
              projects
            </span>
            <br />
            not just resumes
          </h1>
          
          {/* Subheadline */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">
            Hire for skills, not keywords.
          </h2>

          {/* Description */}
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Connect with top talent through real project work. Our AI-powered platform 
            matches candidates and companies based on{' '}
            <span className="font-semibold text-gray-800">actual skills and project requirements</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={handlePostProject}
              className="group relative px-8 py-4 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Start Hiring Better
              </span>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleFindProject}
              className="group px-8 py-4 border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white bg-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Find Your Next Project
              </span>
            </Button>
          </div>

          {/* Bottom Badge */}
          <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-lg">
            <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
            <span className="text-sm text-gray-600">
              Revolutionary hiring platform — Join the{' '}
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
                skills-first movement
              </span>
            </span>
          </div>


        </div>
      </section>

      {/* Why Choose HireVify Section */}
      <section id="features" className="py-16 bg-gradient-to-br from-gray-50 via-white to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <Star className="w-4 h-4 mr-2" />
              Platform Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
                HireVify
              </span>
              ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Our platform revolutionizes hiring with{' '}
              <span className="font-semibold text-gray-800">AI-powered matching</span> and{' '}
              <span className="font-semibold text-gray-800">project-based evaluation</span>.
            </p>
          </div>

          {/* Horizontal 4-Column Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                icon: Settings,
                title: "AI-Powered Matching",
                description: "Advanced AI analyzes skills, project requirements, and preferences to find perfect matches with 90% accuracy.",
                gradient: "from-primary to-emerald-500"
              },
              {
                icon: Building2,
                title: "Project-Based Hiring",
                description: "Evaluate candidates through real project work, not just interviews and resumes. See skills in action.",
                gradient: "from-blue-500 to-primary"
              },
              {
                icon: Shield,
                title: "Secure & Verified",
                description: "All users are verified with background checks and skill assessments for trust and quality assurance.",
                gradient: "from-emerald-500 to-teal-500"
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Track hiring metrics, diversity, and ROI with comprehensive analytics and reporting dashboards.",
                gradient: "from-purple-500 to-primary"
              }
            ].map((feature, index) => (
              <div key={index} className="group relative text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-sm rounded-2xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group-hover:bg-white/90 h-full flex flex-col">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm flex-grow">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <Target className="w-4 h-4 mr-2" />
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple Steps to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
                Better Hiring
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Transform your recruitment process with our streamlined approach
            </p>
          </div>

          {/* Two Column Layout for Companies and Candidates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Companies Column */}
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-full font-semibold mb-6">
                  <Building2 className="w-5 h-5 mr-2" />
                  For Companies
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Find the Right Talent</h3>
              </div>

              {/* Company Steps */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-2xl">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Post Your Project</h4>
                    <p className="text-gray-600 text-sm">Define requirements and let our AI instantly match you with qualified candidates</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-2xl">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Review AI Matches</h4>
                    <p className="text-gray-600 text-sm">Get ranked candidates with detailed compatibility scores and skill assessments</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-2xl">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Evaluate Through Projects</h4>
                    <p className="text-gray-600 text-sm">Assess real skills through practical project work and video demonstrations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Candidates Column */}
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-full font-semibold mb-6">
                  <User className="w-5 h-5 mr-2" />
                  For Candidates
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Showcase Your Skills</h3>
              </div>

              {/* Candidate Steps */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-6 bg-blue-50 rounded-2xl">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Build Your Profile</h4>
                    <p className="text-gray-600 text-sm">Create a comprehensive profile showcasing your skills, experience, and portfolio</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 bg-blue-50 rounded-2xl">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Get Matched</h4>
                    <p className="text-gray-600 text-sm">AI intelligently connects you with projects that match your skills and career goals</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 bg-blue-50 rounded-2xl">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Work on Real Projects</h4>
                    <p className="text-gray-600 text-sm">Demonstrate your abilities through meaningful work and build your reputation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 via-white to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <Star className="w-4 h-4 mr-2" />
              Expert Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Industry{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
                Experts
              </span>
              {' '}Are Saying
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Leading voices in HR and technology recognize the{' '}
              <span className="font-semibold text-gray-800">revolutionary potential</span>
              {' '}of skills-first hiring
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                rating: 5,
                text: "This skills-first approach could fundamentally transform how we view talent acquisition. By evaluating through real project work, addresses a decades-old problem in hiring bias and inefficiency.",
                author: "Dr. Jennifer Walsh",
                position: "Workforce Innovation, Stanford"
              },
              {
                rating: 5,
                text: "Project-based hiring with AI matching represents the next evolution in talent acquisition. This model could reduce hiring time by 60% while dramatically improving quality of matches.",
                author: "Alex Thompson",
                position: "Future of Work, McKinsey"
              },
              {
                rating: 5,
                text: "The idea of showcasing skills through actual work rather than traditional interviews is revolutionary. This approach could finally solve the disconnect between resumes and real capability.",
                author: "Maya Patel",
                position: "HR Technology, Deloitte"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                {/* Star Rating */}
                <div className="flex mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                {/* Testimonial Text */}
                <p className="text-gray-700 mb-8 leading-relaxed italic">
                  &quot;{testimonial.text}&quot;
                </p>
                
                {/* Author Info */}
                <div className="flex items-center">
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.position}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-emerald-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Ready to Transform
          </h2>
          <h3 className="text-3xl sm:text-4xl font-semibold text-white/90 mb-8">
            Your Hiring?
          </h3>
          
          <p className="text-lg text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
            Be part of the movement to revolutionize hiring. Join the{' '}
            <span className="font-semibold text-white">skills-first hiring revolution</span>
            {' '}and build better teams.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={handlePostProject}
              className="group relative px-8 py-4 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Start Hiring Better
              </span>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleFindProject}
              className="group px-8 py-4 border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white bg-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Find Your Next Project
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info with Logo */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-6">
                <div className="bg-white p-2 rounded-lg">
                  <HireVifyLogo size="lg" className="h-10 w-auto" />
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                The future of project-based hiring powered by AI.
              </p>
              <div className="flex space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-800 transition-colors rounded-lg"
                >
                  <MessageCircle className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                  <span className="sr-only">MessageCircle</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-800 transition-colors rounded-lg"
                >
                  <Link className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                  <span className="sr-only">Link</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-800 transition-colors rounded-lg"
                >
                  <GitBranch className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                  <span className="sr-only">GitBranch</span>
                </Button>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom section */}
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              © 2024 HireVify. All rights reserved.
            </p>
            <p className="text-gray-400">
              Made with ❤️ for better hiring
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        key={authModalTab}
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </div>
  );
}





import { useState } from 'react';
import { useScrollReveal } from './useScrollReveal';
import { Button } from './ui/button';
import { AuthModal } from './AuthModal';
import { useAuth } from './AuthProvider';
import { 
 Building2, 
 Shield,
 BarChart3,
 Settings,
 User,
 MessageCircle,
 Link,
 GitBranch,
 Menu,
 X
} from 'lucide-react';
import { toast } from 'sonner';

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

 useScrollReveal();

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
 const recruiterUser = {...result.user,
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
 const candidateUser = {...result.user,
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
 <header className="sticky top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#1f3b28]/95 backdrop-blur-xl">
 <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-6">
 <div className="flex h-16 items-center justify-between sm:h-20">
 {/* HireVify Logo */}
 <div className="flex items-center gap-2.5">
 <img src="/hirevify-logo-mark.png" alt="HireVify" className="h-10 w-10 object-contain opacity-90" />
 <span className="text-lg font-semibold tracking-tight text-white">
 Hire<span className="text-lime-300">Vify</span>
 </span>
 </div>

 {/* Desktop Navigation */}
 <div className="hidden md:flex items-center gap-6 lg:gap-8">
 <nav className="flex items-center gap-8">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => scrollToSection('features')}
 className="relative rounded-none px-0 text-sm font-medium tracking-wide text-white/70 hover:bg-transparent hover:text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-lime-300 after:transition-all hover:after:w-full"
 >
 Features
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => scrollToSection('how-it-works')}
 className="relative rounded-none px-0 text-sm font-medium tracking-wide text-white/70 hover:bg-transparent hover:text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-lime-300 after:transition-all hover:after:w-full"
 >
 How it Works
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => scrollToSection('testimonials')}
 className="relative rounded-none px-0 text-sm font-medium tracking-wide text-white/70 hover:bg-transparent hover:text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-lime-300 after:transition-all hover:after:w-full"
 >
 Testimonials
 </Button>
 </nav>

 <Button
 variant="outline"
 size="sm"
 onClick={handleSignIn}
 className="h-10 rounded-none border border-white/30 bg-transparent px-5 text-sm font-medium text-white hover:border-lime-300 hover:bg-transparent hover:text-lime-300"
 >
 Login
 </Button>

 <a
 href="/admin1"
 target="_blank"
 rel="noopener noreferrer"
 className="rounded-full px-3 py-2 text-xs font-semibold text-lime-100/75 transition hover:bg-white/10 hover:text-lime-200"
 >
 Admin
 </a>
 </div>

 {/* Mobile Actions */}
 <div className="flex items-center gap-2 md:hidden">
 <Button
 variant="outline"
 size="sm"
 onClick={handleSignIn}
 className="h-10 rounded-none border border-white/30 bg-transparent px-4 text-sm font-medium text-white hover:border-lime-300 hover:bg-transparent hover:text-lime-300"
 >
 Login
 </Button>
 <Button
 variant="ghost"
 size="icon"
 aria-expanded={mobileMenuOpen}
 aria-label="Toggle navigation menu"
 onClick={() => setMobileMenuOpen((open) =>!open)}
 className="rounded-sm text-white hover:bg-white/10 hover:text-lime-300"
 >
 {mobileMenuOpen? <X className="h-5 w-5" />: <Menu className="h-5 w-5" />}
 </Button>
 </div>
 </div>

 {mobileMenuOpen && (
 <nav className="md:hidden border-t border-white/10 py-4">
 <div className="grid gap-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => scrollToSection('features')}
 className="justify-start rounded-none text-sm font-medium tracking-wide text-white/70 hover:bg-transparent hover:text-lime-300"
 >
 Features
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => scrollToSection('how-it-works')}
 className="justify-start rounded-none text-sm font-medium tracking-wide text-white/70 hover:bg-transparent hover:text-lime-300"
 >
 How it Works
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => scrollToSection('testimonials')}
 className="justify-start rounded-none text-sm font-medium tracking-wide text-white/70 hover:bg-transparent hover:text-lime-300"
 >
 Testimonials
 </Button>
 <a
 href="/admin1"
 target="_blank"
 rel="noopener noreferrer"
 className="rounded-xl px-3 py-2 text-sm font-semibold text-lime-100/80 hover:bg-white/10 hover:text-lime-200"
 >
 Admin
 </a>
 </div>
 </nav>
 )}
 </div>
 </header>

 {/* Hero Section - Editorial SaaS */}
 <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a0f] via-[#112318] to-[#0d1f14]">
 <div className="mx-auto grid min-h-[82vh] max-w-7xl items-center gap-12 px-6 py-16 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-20">
 {/* Left Hero Content */}
 <div className="max-w-2xl">
 <span className="text-xs font-semibold tracking-[0.2em] uppercase text-lime-400/80">
 AI-Powered Skills Hiring
 </span>

 <h1 className="mt-6 max-w-3xl text-6xl font-light leading-[1.0] tracking-tight text-white lg:text-8xl">
 Hire Smarter.
 <span className="block font-bold text-lime-300">Grow Talent.</span>
 </h1>

 <p className="mt-6 max-w-md text-lg font-light leading-8 text-white/60">
 A project-based hiring platform where recruiters evaluate real work and candidates prove skills beyond keywords.
 </p>

 <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center">
 <Button
 size="lg"
 onClick={handlePostProject}
 className="h-12 rounded-none bg-lime-400 px-8 text-sm font-semibold tracking-wide text-[#0b1a0f] shadow-none hover:bg-lime-300"
 >
 Start Hiring
 </Button>

 <Button
 size="lg"
 variant="ghost"
 onClick={handleFindProject}
 className="h-auto rounded-none bg-transparent px-0 py-0 text-sm font-medium text-white/50 underline underline-offset-4 hover:bg-transparent hover:text-white"
 >
 Find a Project &rarr;
 </Button>
 </div>

 <hr className="mt-12 max-w-sm border-t border-white/10" />
 <div className="mt-4 flex gap-8 text-sm text-white/40">
 <span><strong className="font-semibold text-white">92%</strong> match accuracy</span>
 <span><strong className="font-semibold text-white">3&times;</strong> faster shortlisting</span>
 </div>
 </div>

 {/* Right Dashboard Card */}
 <div className="hidden lg:block">
 <div className="ml-auto max-w-xl rounded-2xl bg-white p-6 text-[#102417] shadow-2xl">
 <div className="mb-6 flex items-center justify-between">
 <div>
 <div className="text-3xl font-semibold leading-none text-[#102417]">Skill Match</div>
 <div className="mt-2 text-sm font-normal text-[#7a9478]">Save time. Hire with proof.</div>
 </div>
 <div className="bg-lime-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#102417]">
 Live
 </div>
 </div>

 <div className="grid grid-cols-3 gap-3">
 {[
 ['92%', 'match score'],
 ['18', 'projects live'],
 ['7', 'interviews'],
 ].map(([value, label]) => (
 <div key={label} className="border border-[#e8f0e4] bg-white p-4 shadow-sm">
 <div className="text-3xl font-semibold text-[#183b22]">{value}</div>
 <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[#7a9478]">{label}</div>
 </div>
 ))}
 </div>

 <div className="mt-5 border border-[#e8f0e4] bg-[#f7fbf3] p-5">
 <div className="mb-5 flex items-center justify-between">
 <div>
 <div className="text-xl font-semibold text-[#0f2418]">Candidate Proof Board</div>
 <div className="mt-1 text-xs font-normal text-[#7a9478]">Ranked by real project signals</div>
 </div>
 <div className="h-9 w-24 bg-[#65a83d]" />
 </div>

 {[0, 1, 2].map((item) => (
 <div key={item} className="mb-3 flex items-center gap-3 border border-[#dcebd7] bg-white p-3 last:mb-0">
 <div className="flex h-11 w-11 items-center justify-center bg-[#7cc04b] text-white">
 <User className="h-5 w-5" />
 </div>
 <div className="flex-1">
 <div className="h-2.5 w-2/3 bg-[#17331f]" />
 <div className="mt-2 h-2 w-5/6 bg-[#b8d4ad]" />
 </div>
 <div className="bg-lime-200 px-3 py-1 text-xs font-semibold text-[#1f3b28]">
 {item === 0? '96%': item === 1? '89%': '84%'}
 </div>
 </div>
 ))}
 </div>

 <div className="mt-4 grid grid-cols-3 gap-3">
 {['Review Proof', 'Rank Skills', 'Interview Ready'].map((label) => (
 <div key={label} className="border border-[#cfe8c2] bg-[#f4fbef] p-3 text-center text-xs font-semibold uppercase tracking-wide text-[#2f672b] shadow-sm">
 {label}
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* Why Choose HireVify Section */}
 <section id="features" className="relative overflow-hidden bg-white px-3 py-16 sm:px-6 lg:px-8 lg:py-24">
 <div className="relative mx-auto max-w-7xl">
 <div className="mx-auto mb-14 max-w-3xl text-center">
 <h2 className="text-5xl font-light tracking-tight text-[#102417]">
 Why Choose
 <span className="block font-bold text-[#102417]">HireVify?</span>
 </h2>
 <p className="mx-auto mt-5 max-w-lg text-base font-light leading-7 text-[#8a9e89] sm:text-lg">
 A clean skills-first platform that turns hiring from resume guessing into real proof, scored matches, and faster decisions.
 </p>
 </div>

 <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
 <div className="bg-[#0f2418] p-7 text-white sm:p-9">
 <div className="mb-8 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-lime-300/60">
 Proof-first hiring engine
 </div>

 <h3 className="text-3xl font-light leading-tight sm:text-4xl">
 Evaluate talent like you
 <span className="block font-bold">evaluate real work.</span>
 </h3>
 <p className="mt-5 max-w-xl text-base font-light leading-7 text-white/55">
 HireVify brings project work, assessments, AI matching, and recruiter dashboards into one polished flow.
 </p>

 <div className="mt-8 grid gap-4 sm:grid-cols-2">
 {[
 ['92%', 'Skill match clarity'],
 ['60%', 'Less screening time'],
 ['Real', 'Project evidence'],
 ['Live', 'Candidate pipeline'],
 ].map(([value, label]) => (
 <div key={label} className="border border-white/10 p-5">
 <div className="text-3xl font-semibold text-white">{value}</div>
 <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-white/40">{label}</div>
 </div>
 ))}
 </div>

 <div className="mt-6 border border-white/10 p-4 text-sm font-light leading-6 text-white/45">
 Built for recruiters demoing, candidates proving, and founders showing a polished product flow without noise.
 </div>
 </div>

 <div className="grid gap-5 sm:grid-cols-2">
 {[
 {
 icon: Settings,
 title: 'AI-Powered Matching',
 description: 'Match candidates to projects using skills, role signals, and practical evidence instead of keyword-only filtering.',
 badge: 'Smart Fit',
 },
 {
 icon: Building2,
 title: 'Project-Based Hiring',
 description: 'Let candidates prove ability through real project work, portfolios, video proof, and relevant tasks.',
 badge: 'Real Work',
 },
 {
 icon: Shield,
 title: 'Secure & Verified',
 description: 'Keep recruiter and candidate flows clean with verified profiles, assessments, and trusted data states.',
 badge: 'Trusted',
 },
 {
 icon: BarChart3,
 title: 'Decision Analytics',
 description: 'See match scores, pipeline movement, project status, and hiring progress in one recruiter-ready view.',
 badge: 'Insight',
 },
 ].map((feature) => (
 <div key={feature.title} className="border border-[#e8f0e4] bg-white p-6 shadow-sm transition-colors duration-300 hover:border-[#a8d4a0]">
 <div className="mb-5 flex items-center justify-between gap-3">
 <div className="flex h-10 w-10 items-center justify-center border border-[#c5dfc0] text-[#3f7a2c]">
 <feature.icon className="h-5 w-5" />
 </div>
 <span className="text-[10px] font-semibold uppercase tracking-widest text-[#65a83d]/60">{feature.badge}</span>
 </div>
 <h3 className="text-lg font-semibold text-[#0f2418]">{feature.title}</h3>
 <p className="mt-3 text-sm font-normal leading-6 text-[#7a9478]">{feature.description}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>

 {/* How It Works Section */}
 <section id="how-it-works" className="relative overflow-hidden bg-white px-3 py-16 sm:px-6 lg:px-8 lg:py-24">
 <div className="relative mx-auto max-w-7xl">
 <div className="mb-14 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
 <div>
 <h2 className="text-4xl font-light tracking-tight text-[#0f2418] sm:text-5xl">
 Simple steps. <span className="font-bold text-[#0f2418]">Better hiring.</span>
 </h2>
 </div>
 <p className="max-w-2xl text-base leading-8 text-[#526b50] sm:text-lg">
 Two clean paths: recruiters create proof-based opportunities, candidates show real capability, and HireVify connects both sides with clarity.
 </p>
 </div>

 <div className="grid gap-6 lg:grid-cols-2">
 <div className="border border-[#e4ede0] bg-white p-5 sm:p-7">
 <div className="mb-6 flex items-start justify-between gap-4">
 <div>
 <div className="border-l-2 border-[#65a83d] pl-3 text-xs font-semibold uppercase tracking-widest text-[#65a83d]">
 For Companies
 </div>
 <h3 className="mt-4 text-2xl font-semibold text-[#102417]">Find the right talent</h3>
 </div>
 <span className="hidden select-none text-6xl font-thin text-[#d0e8c8] sm:block">01</span>
 </div>

 <div>
 {[
 ['Post Your Project', 'Define requirements, skills, budget, and evaluation style in a guided hiring flow.'],
 ['Review AI Matches', 'See ranked candidates with match score, profile signals, and assessment evidence.'],
 ['Evaluate Through Projects', 'Shortlist talent using practical work, portfolio proof, and recruiter notes.'],
 ].map(([title, description], index) => (
 <div key={title} className="flex items-start gap-4 border-t border-[#f0f5ee] py-4">
 <span className="mt-0.5 w-5 shrink-0 text-sm font-semibold text-[#65a83d]">{index + 1}.</span>
 <div>
 <h4 className="text-sm font-semibold text-[#0f2418]">{title}</h4>
 <p className="mt-1 text-sm font-normal leading-6 text-[#8a9e89]">{description}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="border border-[#e4ede0] bg-white p-5 sm:p-7">
 <div className="mb-6 flex items-start justify-between gap-4">
 <div>
 <div className="border-l-2 border-[#65a83d] pl-3 text-xs font-semibold uppercase tracking-widest text-[#65a83d]">
 For Candidates
 </div>
 <h3 className="mt-4 text-2xl font-semibold text-[#102417]">Showcase your skills</h3>
 </div>
 <span className="hidden select-none text-6xl font-thin text-[#d0e8c8] sm:block">02</span>
 </div>

 <div>
 {[
 ['Build Your Profile', 'Create a strong profile with skills, experience, portfolio, and career direction.'],
 ['Get Matched', 'Find projects and jobs that fit your actual capability and growth goals.'],
 ['Work on Real Projects', 'Demonstrate ability through meaningful work that recruiters can trust.'],
 ].map(([title, description], index) => (
 <div key={title} className="flex items-start gap-4 border-t border-[#f0f5ee] py-4">
 <span className="mt-0.5 w-5 shrink-0 text-sm font-semibold text-[#65a83d]">{index + 1}.</span>
 <div>
 <h4 className="text-sm font-semibold text-[#0f2418]">{title}</h4>
 <p className="mt-1 text-sm font-normal leading-6 text-[#8a9e89]">{description}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* Testimonials Section */}
 <section id="testimonials" className="relative overflow-hidden bg-white px-3 py-16 sm:px-6 lg:px-8 lg:py-24">
 <div className="relative mx-auto max-w-7xl">
 <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
 <div className="max-w-2xl">
 <h2 className="text-4xl font-light tracking-tight text-[#0f2418] sm:text-5xl">
 What industry experts
 <span className="block font-bold text-[#0f2418]">are saying</span>
 </h2>
 </div>
 <p className="max-w-xl text-base font-light leading-7 text-[#a0b09e]">
 A more believable, modern presentation for your MVP demo &mdash; clean cards, strong spacing, and premium green styling.
 </p>
 </div>

 <div className="grid gap-8 lg:grid-cols-3">
 {[
 {
 rating: 5,
 text: 'This skills-first approach could transform talent acquisition by replacing guesswork with practical evidence and better matching signals.',
 author: 'Dr. Jennifer Walsh',
 position: 'Workforce Innovation, Stanford',
 },
 {
 rating: 5,
 text: 'Project-based hiring with AI matching is a powerful next step for teams that want faster shortlisting and stronger quality signals.',
 author: 'Alex Thompson',
 position: 'Future of Work, McKinsey',
 },
 {
 rating: 5,
 text: 'Showcasing skills through actual work helps close the gap between polished resumes and real-world capability.',
 author: 'Maya Patel',
 position: 'HR Technology, Deloitte',
 },
 ].map((testimonial) => (
 <div key={testimonial.author} className="border-t-2 border-[#0f2418] bg-white px-0 pb-0 pt-6">
 <span className="text-xs font-semibold tracking-[0.15em] text-[#65a83d]">
 {String.fromCharCode(9733).repeat(testimonial.rating)}
 </span>

 <p className="mt-6 min-h-[10rem] text-base font-normal italic leading-8 text-[#2d4a35]">
 {testimonial.text}
 </p>

 <div className="mt-6">
 <div className="mb-3 mt-6 h-px w-8 bg-[#65a83d]" />
 <div className="text-sm font-semibold text-[#0f2418]">{testimonial.author}</div>
 <div className="mt-1 text-xs font-normal text-[#a0b09e]">{testimonial.position}</div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Final CTA Section */}
 <section className="relative overflow-hidden bg-[#0b1a0f] text-white">
 <div className="bg-[#0b1a0f] px-6 py-16 sm:px-10 lg:px-14 lg:py-20">
 <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-center">
 <div>
 <span className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400/60">
 Launch with confidence
 </span>
 <h2 className="mt-6 max-w-3xl text-5xl font-light leading-tight tracking-tight text-white lg:text-7xl">
 Make every hiring
 <span className="block font-bold">demo feel premium.</span>
 </h2>
 <p className="mt-6 max-w-2xl text-base font-light leading-8 text-white/40 sm:text-lg">
 Present a clear product story for recruiters, candidates, partners, and early users &mdash; built around proof, trust, and better decisions.
 </p>

 <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center">
 <Button
 size="lg"
 onClick={handlePostProject}
 className="h-12 rounded-none bg-lime-400 px-8 text-sm font-semibold tracking-wide text-[#0b1a0f] shadow-none hover:bg-lime-300"
 >
 Start Hiring
 </Button>

 <Button
 size="lg"
 variant="ghost"
 onClick={handleFindProject}
 className="h-auto rounded-none bg-transparent px-0 py-0 text-sm font-medium text-white/40 underline underline-offset-4 hover:bg-transparent hover:text-white"
 >
 Find a Project &rarr;
 </Button>
 </div>
 </div>

 <dl className="grid gap-x-10 sm:grid-cols-2">
 {[
 ['Demo story', 'Clear flow for partners'],
 ['Trust layer', 'Proof before interviews'],
 ['Shortlists', 'Less noise, better fit'],
 ['Launch path', 'Early users aligned'],
 ].map(([title, text]) => (
 <div key={title} className="border-b border-white/10 py-5">
 <dt className="text-lg font-semibold text-white">{title}</dt>
 <dd className="mt-2 text-sm text-white/30">{text}</dd>
 </div>
 ))}
 </dl>
 </div>
 </div>
 </section>

 {/* Footer */}
 <footer className="border-t border-white/5 bg-[#080f0a] px-3 py-12 text-white sm:px-6 lg:px-8">
 <div className="mx-auto max-w-7xl">
 <div className="grid gap-10 lg:grid-cols-[1.1fr_1.6fr]">
 <div>
 <div className="flex items-center gap-2.5">
 <img src="/hirevify-logo-mark.png" alt="HireVify" className="h-10 w-10 object-contain opacity-90" />
 <span className="text-lg font-semibold tracking-tight text-white">
 Hire<span className="text-lime-300">Vify</span>
 </span>
 </div>
 <p className="mt-5 max-w-sm text-sm font-light leading-7 text-white/30">
 Skill-based hiring. Real proof. Better decisions.
 </p>
 <div className="mt-6 flex gap-3">
 {[MessageCircle, Link, GitBranch].map((Icon, index) => (
 <Button key={index} variant="ghost" size="icon" className="rounded-none bg-transparent text-white/25 hover:bg-transparent hover:text-lime-300">
 <Icon className="h-5 w-5" />
 </Button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
 {[
 { heading: 'Product', links: ['Features', 'API', 'Integrations', 'Pricing'] },
 { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
 { heading: 'Support', links: ['Help Center', 'Privacy Policy', 'Terms of Service', 'Status'] },
 ].map((section) => (
 <div key={section.heading}>
 <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-white/30">{section.heading}</h3>
 <ul className="mt-4 space-y-3">
 {section.links.map((item) => (
 <li key={item}>
 <a href="#" className="text-sm font-normal text-white/40 transition hover:text-white">
 {item}
 </a>
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>
 </div>

 <div className="mt-10 flex flex-col gap-4 border-t border-white/5 pt-6 text-left text-xs text-white/20 sm:flex-row sm:items-center">
 <p>&copy; 2026 HireVify</p>
 <p>Built for better hiring decisions.</p>
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









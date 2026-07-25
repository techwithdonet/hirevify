import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Code2,
  FileText,
  HeartHandshake,
  LifeBuoy,
  Mail,
  Plug,
  RadioTower,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui/button';
import type { Screen } from '../types/app';

type MarketingPageKey =
  | 'product-features'
  | 'product-api'
  | 'product-integrations'
  | 'company-about'
  | 'company-blog'
  | 'company-careers'
  | 'company-contact'
  | 'support-help-center'
  | 'support-privacy-policy'
  | 'support-terms-of-service'
  | 'support-status';

type MarketingInfoPageProps = {
  page: MarketingPageKey;
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onOpenHomepageLogin: () => void;
};

type Action = {
  label: string;
  screen?: Screen;
  href?: string;
};

type MarketingPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  primaryAction: Action;
  secondaryAction?: Action;
  highlights: string[];
  sections: Array<{
    title: string;
    description: string;
    icon: LucideIcon;
  }>;
  note?: string;
};

const pages: Record<MarketingPageKey, MarketingPageContent> = {
  'product-features': {
    eyebrow: 'Product',
    title: 'Features that turn hiring into proof.',
    description:
      'HireVify connects recruiter workflows, candidate proof, AI matching, assessments, and interview readiness into one skills-first hiring experience.',
    icon: Sparkles,
    primaryAction: { label: 'View Pricing', screen: 'pricing' },
    secondaryAction: { label: 'Contact Team', screen: 'company-contact' },
    highlights: ['AI match scoring', 'Project-based evaluation', 'Recruiter and candidate dashboards'],
    sections: [
      {
        title: 'Proof boards',
        description: 'Review project work, profile signals, assessment evidence, and match quality from one focused view.',
        icon: BadgeCheck,
      },
      {
        title: 'Smart shortlists',
        description: 'Prioritize candidates by skill fit and practical evidence, not only resume keywords.',
        icon: CheckCircle2,
      },
      {
        title: 'Candidate growth tools',
        description: 'Help candidates build resumes, portfolios, interview practice, and skill development plans.',
        icon: HeartHandshake,
      },
    ],
  },
  'product-api': {
    eyebrow: 'Product',
    title: 'API access for connected hiring workflows.',
    description:
      'Use HireVify data and events to connect jobs, candidates, applications, assessments, and messaging with your existing HR stack.',
    icon: Code2,
    primaryAction: { label: 'Talk to Integrations', screen: 'company-contact' },
    secondaryAction: { label: 'See Integrations', screen: 'product-integrations' },
    highlights: ['Candidate and job objects', 'Application status events', 'Secure recruiter access'],
    sections: [
      {
        title: 'Structured hiring data',
        description: 'Model jobs, projects, applications, assessment status, and candidate proof signals consistently.',
        icon: FileText,
      },
      {
        title: 'Workflow automation',
        description: 'Connect status changes and candidate activity with downstream tools and internal dashboards.',
        icon: RadioTower,
      },
      {
        title: 'Permission-aware access',
        description: 'Keep recruiter and candidate data separated with authenticated, role-based access patterns.',
        icon: ShieldCheck,
      },
    ],
    note: 'API keys and production partner access are prepared through the HireVify team.',
  },
  'product-integrations': {
    eyebrow: 'Product',
    title: 'Integrations for the tools hiring teams already use.',
    description:
      'Connect HireVify with communication, calendar, ATS, and analytics systems so proof-based hiring fits into daily operations.',
    icon: Plug,
    primaryAction: { label: 'Contact Team', screen: 'company-contact' },
    secondaryAction: { label: 'View API', screen: 'product-api' },
    highlights: ['ATS handoff', 'Calendar and interview workflows', 'Messaging and notifications'],
    sections: [
      {
        title: 'Recruiter systems',
        description: 'Push qualified candidates and application decisions into the systems your recruiting team checks every day.',
        icon: Building2,
      },
      {
        title: 'Candidate communication',
        description: 'Keep candidates updated with cleaner status changes, reminders, and next-step notifications.',
        icon: Mail,
      },
      {
        title: 'Operational visibility',
        description: 'Bring match quality, project submissions, and funnel activity into reporting workflows.',
        icon: RadioTower,
      },
    ],
  },
  'company-about': {
    eyebrow: 'Company',
    title: 'HireVify is built for skills-first hiring.',
    description:
      'We believe hiring gets better when candidates can prove ability through real work and recruiters can make decisions from clear evidence.',
    icon: Building2,
    primaryAction: { label: 'Explore Features', screen: 'product-features' },
    secondaryAction: { label: 'Contact Us', screen: 'company-contact' },
    highlights: ['Proof over polish', 'Better candidate signal', 'Faster recruiter decisions'],
    sections: [
      {
        title: 'Our mission',
        description: 'Make practical skills visible so hiring teams can evaluate capability with less guesswork.',
        icon: BadgeCheck,
      },
      {
        title: 'Our platform',
        description: 'Combine projects, assessments, portfolios, resumes, analytics, and interviews in one product flow.',
        icon: Sparkles,
      },
      {
        title: 'Our users',
        description: 'Serve recruiters who need stronger shortlists and candidates who want their real ability to be seen.',
        icon: HeartHandshake,
      },
    ],
  },
  'company-blog': {
    eyebrow: 'Company',
    title: 'Blog and hiring insights.',
    description:
      'Ideas, product notes, and practical guidance on skills-first recruiting, candidate proof, and modern hiring operations.',
    icon: BookOpen,
    primaryAction: { label: 'Read Product Features', screen: 'product-features' },
    secondaryAction: { label: 'Contact Editorial', screen: 'company-contact' },
    highlights: ['Skills-first hiring playbooks', 'Candidate experience notes', 'Product updates'],
    sections: [
      {
        title: 'Replacing keyword screening',
        description: 'How proof signals and project work can reduce noisy shortlists.',
        icon: BadgeCheck,
      },
      {
        title: 'Better candidate proof',
        description: 'What recruiters should look for in portfolios, assignments, and practical assessments.',
        icon: FileText,
      },
      {
        title: 'Hiring operations',
        description: 'How analytics, integrations, and status workflows keep evaluation moving.',
        icon: RadioTower,
      },
    ],
    note: 'Full publishing and article archive can be connected when your content calendar is ready.',
  },
  'company-careers': {
    eyebrow: 'Company',
    title: 'Careers at HireVify.',
    description:
      'We are shaping a platform where people are evaluated by what they can do. Join us if that future feels worth building.',
    icon: BriefcaseBusiness,
    primaryAction: { label: 'Contact Hiring Team', screen: 'company-contact' },
    secondaryAction: { label: 'Learn About Us', screen: 'company-about' },
    highlights: ['Product engineering', 'AI and matching systems', 'Customer success'],
    sections: [
      {
        title: 'Build meaningful tools',
        description: 'Work on candidate proof, recruiter workflows, matching, assessment, and interview experiences.',
        icon: Sparkles,
      },
      {
        title: 'Operate with clarity',
        description: 'We value practical judgment, thoughtful execution, and customer proximity.',
        icon: CheckCircle2,
      },
      {
        title: 'Grow with the product',
        description: 'Early team members shape both the product surface and how teams adopt skills-first hiring.',
        icon: HeartHandshake,
      },
    ],
    note: 'Open roles are shared directly with interested candidates and partners at this stage.',
  },
  'company-contact': {
    eyebrow: 'Company',
    title: 'Contact HireVify.',
    description:
      'Reach the team for sales, partnerships, integrations, support, or product questions. We will route your message to the right place.',
    icon: Mail,
    primaryAction: { label: 'Email Support', href: 'mailto:support@hirevify.com?subject=HireVify%20question' },
    secondaryAction: { label: 'View Help Center', screen: 'support-help-center' },
    highlights: ['support@hirevify.com', 'Partnership and API requests', 'Product and billing questions'],
    sections: [
      {
        title: 'Sales and partnerships',
        description: 'Discuss team rollouts, recruiter workflows, or proof-based hiring pilots.',
        icon: Building2,
      },
      {
        title: 'Product support',
        description: 'Get help with accounts, dashboards, subscriptions, and candidate or recruiter flows.',
        icon: LifeBuoy,
      },
      {
        title: 'Integrations',
        description: 'Plan API access, HR stack handoffs, and workflow automation.',
        icon: Plug,
      },
    ],
  },
  'support-help-center': {
    eyebrow: 'Support',
    title: 'Help Center.',
    description:
      'Find fast answers for accounts, profiles, job and project workflows, assessments, messaging, subscriptions, and integrations.',
    icon: LifeBuoy,
    primaryAction: { label: 'Contact Support', screen: 'company-contact' },
    secondaryAction: { label: 'Check Status', screen: 'support-status' },
    highlights: ['Account setup', 'Recruiter workflows', 'Candidate workflows'],
    sections: [
      {
        title: 'Recruiter help',
        description: 'Create jobs, review applicants, assign projects, manage interviews, and track hiring progress.',
        icon: Building2,
      },
      {
        title: 'Candidate help',
        description: 'Build your profile, apply to jobs, submit project work, and prepare for interviews.',
        icon: HeartHandshake,
      },
      {
        title: 'Billing and access',
        description: 'Understand pricing, subscriptions, premium features, and account access.',
        icon: ShieldCheck,
      },
    ],
  },
  'support-privacy-policy': {
    eyebrow: 'Support',
    title: 'Privacy Policy.',
    description:
      'HireVify handles candidate and recruiter data with care, using information to provide matching, workflow, communication, and account services.',
    icon: ShieldCheck,
    primaryAction: { label: 'Contact Privacy Team', screen: 'company-contact' },
    secondaryAction: { label: 'Terms of Service', screen: 'support-terms-of-service' },
    highlights: ['Role-based data access', 'Profile and application data', 'Security-minded workflows'],
    sections: [
      {
        title: 'Data we use',
        description: 'Profile, job, application, assessment, communication, billing, and usage information needed to run the platform.',
        icon: FileText,
      },
      {
        title: 'Why we use it',
        description: 'To provide hiring workflows, match insights, project evaluation, notifications, support, and platform improvement.',
        icon: Sparkles,
      },
      {
        title: 'Your choices',
        description: 'Users can request support for account, profile, access, and data questions through the contact channel.',
        icon: HeartHandshake,
      },
    ],
    note: 'This in-product policy page is informational and should be reviewed by legal counsel before public launch.',
  },
  'support-terms-of-service': {
    eyebrow: 'Support',
    title: 'Terms of Service.',
    description:
      'These terms outline responsible use of HireVify for recruiter workflows, candidate profiles, assessments, communications, and subscriptions.',
    icon: FileText,
    primaryAction: { label: 'Contact Support', screen: 'company-contact' },
    secondaryAction: { label: 'Privacy Policy', screen: 'support-privacy-policy' },
    highlights: ['Use accurate information', 'Respect candidate and recruiter data', 'Follow platform rules'],
    sections: [
      {
        title: 'Platform use',
        description: 'Use HireVify for legitimate hiring, career, assessment, and communication workflows.',
        icon: CheckCircle2,
      },
      {
        title: 'User responsibilities',
        description: 'Keep account credentials secure and avoid misusing candidate, recruiter, or company information.',
        icon: ShieldCheck,
      },
      {
        title: 'Service changes',
        description: 'Features, plans, integrations, and availability may change as the product evolves.',
        icon: RadioTower,
      },
    ],
    note: 'This in-product terms page is informational and should be reviewed by legal counsel before public launch.',
  },
  'support-status': {
    eyebrow: 'Support',
    title: 'System status.',
    description:
      'Track the health of core HireVify surfaces, including the homepage, dashboards, authentication, APIs, payments, and integrations.',
    icon: RadioTower,
    primaryAction: { label: 'Contact Support', screen: 'company-contact' },
    secondaryAction: { label: 'Help Center', screen: 'support-help-center' },
    highlights: ['Homepage online', 'Dashboard routes available', 'API checks visible in admin health'],
    sections: [
      {
        title: 'Core app',
        description: 'Homepage, pricing, recruiter dashboards, candidate dashboards, and navigation are available.',
        icon: CheckCircle2,
      },
      {
        title: 'Authentication',
        description: 'Sign-in and role-based access depends on the configured Supabase environment.',
        icon: ShieldCheck,
      },
      {
        title: 'Integrations',
        description: 'Third-party availability can vary by provider and configured workspace credentials.',
        icon: Plug,
      },
    ],
  },
};

function runAction(action: Action, onNavigate: (screen: Screen) => void) {
  if (action.screen) {
    onNavigate(action.screen);
  }
}

export function MarketingInfoPage({ page, onBack, onNavigate, onOpenHomepageLogin }: MarketingInfoPageProps) {
  const content = pages[page];
  const Icon = content.icon;

  return (
    <div className="min-h-screen bg-[#f4f8f6] text-[#0f2418]">
      <header className="border-b border-white/10 bg-[#064e3b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-6">
          <button
            type="button"
            onClick={() => onNavigate('homepage')}
            className="flex h-20 items-center gap-2.5 text-left"
            aria-label="Go to HireVify homepage"
          >
            <img src="/hirevify-logo-mark.png" alt="" className="h-10 w-10 object-contain opacity-90" />
            <span className="text-lg font-semibold tracking-tight text-white">
              Hire<span className="text-cyan-200">Vify</span>
            </span>
          </button>
        </div>
      </header>

      <main>
        <section className="workspace-marketing-hero bg-[linear-gradient(135deg,#064e3b_0%,#0369a1_100%)] px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className="mb-8 h-auto rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:border-white/35 hover:bg-white/15 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Button>
              <div className="workspace-marketing-icon mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-emerald-100">
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">{content.eyebrow}</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-light leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                {content.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base font-light leading-8 text-white/55 sm:text-lg">{content.description}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {content.primaryAction.href ? (
                  <Button asChild className="h-11 rounded-xl bg-white px-6 text-sm font-semibold text-[#0b6258] shadow-sm hover:bg-[#edf7f4]">
                    <a href={content.primaryAction.href}>{content.primaryAction.label}</a>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => runAction(content.primaryAction, onNavigate)}
                    className="h-11 rounded-xl bg-white px-6 text-sm font-semibold text-[#0b6258] shadow-sm hover:bg-[#edf7f4]"
                  >
                    {content.primaryAction.label}
                  </Button>
                )}
                {content.secondaryAction && (
                  content.secondaryAction.href ? (
                    <Button asChild variant="outline" className="h-11 rounded-xl border-white/25 bg-white/10 px-6 text-sm font-semibold text-white hover:border-white/40 hover:bg-white/15 hover:text-white">
                      <a href={content.secondaryAction.href}>{content.secondaryAction.label}</a>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => runAction(content.secondaryAction!, onNavigate)}
                      className="h-11 rounded-xl border-white/25 bg-white/10 px-6 text-sm font-semibold text-white hover:border-white/40 hover:bg-white/15 hover:text-white"
                    >
                      {content.secondaryAction.label}
                    </Button>
                  )
                )}
              </div>
            </div>

            <div className="workspace-marketing-highlights rounded-2xl border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Highlights</p>
              <div className="mt-5 grid gap-3">
                {content.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-100" />
                    <span className="text-sm leading-6 text-white/75">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {content.sections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-[#d5e5df] bg-white p-6 shadow-sm">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-[#9bcdbf] bg-[#edf7f4] text-[#0b6258]">
                  <section.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-[#0f2418]">{section.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#5f6f65]">{section.description}</p>
              </article>
            ))}
          </div>

          {content.note && (
            <div className="mx-auto mt-8 max-w-7xl rounded-2xl border border-[#d5e5df] bg-white p-5 text-sm leading-6 text-[#5f6f65] shadow-sm">
              {content.note}
            </div>
          )}

          <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-[#d5e5df] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#5f6f65]">Ready to keep exploring HireVify?</p>
            <Button
              type="button"
              onClick={onOpenHomepageLogin}
              className="h-11 rounded-xl bg-[#0f7f74] px-5 text-white shadow-sm hover:bg-[#0b665e]"
            >
              Explore Product
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

import {
  ArrowUpRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  GraduationCap,
  Heart,
  Home,
  Link as LinkIcon,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
  Globe,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { Candidate } from '../types/app';
import { openOrCreateConversationAndNavigate } from '../utils/openConversation';
import { DashboardPageLayout } from './shared/DashboardPageLayout';

interface RecruiterCandidateDetailProps {
  candidate: Candidate;
  onBack: () => void;
  onUpgrade?: () => void;
  onViewMessages: (conversationId?: string) => void;
  savedCandidates: string[];
  onToggleSaved: (candidateId: string) => void;
}

function normalizeCandidateAvailability(value?: string | null): 'immediate' | 'two-weeks' | 'one-month' | 'not-looking' {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw || raw === 'null' || raw === 'undefined') {
    return 'immediate';
  }

  const compact = raw
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  if (['immediate', 'available', 'available-now', 'available-immediately', 'now', 'asap'].includes(compact)) {
    return 'immediate';
  }

  if (['two-weeks', '2-weeks', '2-weeks-notice', 'available-in-2-weeks', 'available-in-two-weeks'].includes(compact)) {
    return 'two-weeks';
  }

  if (['one-month', '1-month', '30-days', '30-days-notice', 'available-in-1-month', 'available-in-one-month'].includes(compact)) {
    return 'one-month';
  }

  if (['not-looking', 'not-available', 'not-actively-looking', 'unavailable'].includes(compact)) {
    return 'not-looking';
  }

  return 'immediate';
}

const getAvailabilityBadge = (availability: string) => {
  const config = {
    immediate: { label: 'Available now', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'two-weeks': { label: '2 weeks notice', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    'one-month': { label: '1 month notice', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    'not-looking': { label: 'Not looking', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  if (!availability || availability === '' || availability === 'null' || availability === 'undefined') {
    return { label: 'Availability unknown', className: 'bg-slate-100 text-slate-600 border-slate-200' };
  }

  const normalizedAvailability = normalizeCandidateAvailability(availability);
  return config[normalizedAvailability] || { label: 'Availability unknown', className: 'bg-slate-100 text-slate-600 border-slate-200' };
};

export function RecruiterCandidateDetail({
  candidate,
  onBack,
  onUpgrade,
  onViewMessages,
  savedCandidates,
  onToggleSaved,
}: RecruiterCandidateDetailProps) {
  const { user } = useAuth();

  const notProvided = (value?: string | number | null) =>
    value === null || value === undefined || String(value).trim() === '' ? 'Not provided' : String(value);

  const openExternalUrl = (url?: string | null) => {
    if (!url) return;
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    window.open(normalized, '_blank', 'noopener,noreferrer');
  };

  const openResume = async (candidate: Candidate) => {
    if (!candidate.resumeUrl) {
      toast.error('Resume/CV not provided');
      return;
    }

    try {
      const { applicationsService } = await import('@/src/hirevify-app/services/applicationsService');
      const { url } = await applicationsService.getApplicationFileSignedUrl(candidate.resumeUrl);
      window.open(url || candidate.resumeUrl, '_blank', 'noopener,noreferrer');
    } catch {
      openExternalUrl(candidate.resumeUrl);
    }
  };

  const contactCandidate = async (candidateId: string) => {
    if (!user?.id) {
      toast.error('Please sign in to message candidates.');
      return;
    }

    try {
      await openOrCreateConversationAndNavigate({
        recruiterProfileId: user.id,
        candidateProfileId: candidateId,
        currentUserProfileId: user.id,
        navigateToMessages: onViewMessages,
      });
    } catch (error) {
      console.error('Failed to open candidate conversation:', error);
      toast.error(error instanceof Error ? error.message : 'Could not open messages.');
    }
  };

  const isSaved = savedCandidates.includes(candidate.id);
  const availability = getAvailabilityBadge(candidate.availability);
  const initials = candidate.name.split(' ').map((name) => name[0]).join('').slice(0, 2);
  const summary = candidate.bio || candidate.experienceSummary;
  const workPreference = candidate.preferredWorkType.length > 0 ? candidate.preferredWorkType.join(', ') : 'Flexible';
  const displayLocation = candidate.currentLocation || candidate.location;
  const displayExperience = candidate.totalExperience ?? candidate.yearsOfExperience ?? 0;
  const displayCompany = candidate.currentCompany || 'Company not provided';
  const displayDesignation = candidate.currentDesignation || candidate.title;
  const preferredRole = candidate.preferredRoles?.[0] || 'Preferred role not set';
  const salary = candidate.expectedSalary
    ? candidate.expectedSalary
    : candidate.salaryRange.min || candidate.salaryRange.max
      ? `${candidate.salaryRange.currency} ${candidate.salaryRange.min.toLocaleString()} - ${candidate.salaryRange.max.toLocaleString()}`
      : 'Not disclosed';
  const primarySkills = candidate.skills.slice(0, 6);
  const extraSkillCount = Math.max(candidate.skills.length - primarySkills.length, 0);
  const lastActive = candidate.lastActive ? new Date(candidate.lastActive).toLocaleDateString() : 'Unknown';

  return (
    <DashboardPageLayout
      title=""
      subtitle=""
      onBack={onBack}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleSaved(candidate.id)}
            className={`rounded-full border px-4 ${
              isSaved
                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className={`mr-1.5 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          <Button
            onClick={() => contactCandidate(candidate.id)}
            className="rounded-full bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
            size="sm"
          >
            <MessageCircle className="mr-1.5 h-4 w-4" />
            Message
          </Button>
        </div>
      }
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="relative bg-[radial-gradient(circle_at_top_left,_#0f766e_0,_#0f172a_42%,_#111827_100%)] px-5 py-6 text-white sm:px-7">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <Avatar className="h-28 w-28 border-4 border-white/90 bg-white shadow-xl">
                  {candidate.avatar && <AvatarImage src={candidate.avatar} alt={candidate.name} />}
                  <AvatarFallback className="bg-slate-950 text-3xl font-bold text-white">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 pb-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge className={`rounded-full border px-3 py-1 text-xs font-semibold ${availability.className}`}>
                      <Clock className="mr-1.5 h-3.5 w-3.5" />
                      {availability.label}
                    </Badge>
                    {candidate.isVerified && (
                      <Badge className="rounded-full border border-teal-200 bg-white/95 px-3 py-1 text-xs font-semibold text-teal-800">
                        <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-white sm:text-4xl">{candidate.name}</h1>
                  <p className="mt-2 text-base font-medium text-slate-200">{notProvided(displayDesignation)}</p>
                  <p className="mt-1 text-sm text-slate-300">{displayCompany}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-teal-200" />
                      {notProvided(displayLocation)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-teal-200" />
                      {displayExperience} years experience
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Home className="h-4 w-4 text-teal-200" />
                      {candidate.workMode || workPreference}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-teal-200" />
                      {candidate.willingToRelocate ? 'Open to relocate' : 'No relocation preference'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-teal-200" />
                      {preferredRole}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      availability.label,
                      candidate.employmentStatus === 'Open to work' ? 'Open to Work' : '',
                      candidate.workMode,
                      candidate.noticePeriod === 'Immediate' ? 'Immediate Joiner' : '',
                      candidate.emailVerified ? 'Verified Email' : '',
                      candidate.phoneVerified ? 'Verified Phone' : '',
                      candidate.resumeVerified ? 'Verified Resume' : '',
                      candidate.willingToRelocate ? 'Open to Relocation' : '',
                    ].filter(Boolean).map((badge) => (
                      <span key={badge} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/15 bg-white/10 p-2 backdrop-blur">
                <Metric label="Complete" value={`${candidate.profileCompleteness}%`} />
                <Metric label="Response" value={`${candidate.responseRate}%`} />
                <Metric label="Success" value={`${candidate.hiringSuccessRate || 0}%`} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-3">
            <QuickFact icon={Wallet} label="Expected salary" value={salary} />
            <QuickFact icon={Building2} label="Work preference" value={workPreference} />
            <QuickFact icon={Calendar} label="Last active" value={lastActive} />
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="space-y-5">
            <Panel
              icon={BookOpen}
              title="Professional Summary"
              eyebrow="Candidate overview"
            >
              <p className="text-sm leading-7 text-slate-600 whitespace-pre-wrap">{notProvided(summary)}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoPill label="Industry" value={candidate.industry || 'Not provided'} />
                <InfoPill label="Career Level" value={candidate.careerLevel || 'Not provided'} />
                <InfoPill label="Languages" value={candidate.languages.length ? candidate.languages.join(', ') : 'Not provided'} />
                <InfoPill label="Preferred Roles" value={candidate.preferredRoles?.length ? candidate.preferredRoles.join(', ') : 'Not provided'} />
              </div>
            </Panel>

            <Panel icon={Sparkles} title="Core Skills" eyebrow={`${candidate.skills.length} skills listed`}>
              {candidate.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <Badge
                      key={skill}
                      className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-800 hover:bg-teal-100"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyText>Not provided</EmptyText>
              )}
            </Panel>

            <div className="grid gap-5 md:grid-cols-2">
              <Panel icon={GraduationCap} title="Education" eyebrow="Academic background">
                {candidate.education && candidate.education.length > 0 ? (
                  <div className="space-y-4">
                    {candidate.education.map((edu, index) => (
                      <div key={edu.id || index} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                        <p className="font-semibold text-slate-950">{edu.degree}</p>
                        {edu.fieldOfStudy && <p className="mt-1 text-sm text-slate-600">{edu.fieldOfStudy}</p>}
                        {(edu.institution || edu.university) && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                            <Building2 className="h-3.5 w-3.5" />
                            {edu.institution || edu.university}
                          </p>
                        )}
                        {(edu.startYear || edu.endYear) && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            {edu.startYear}{edu.startYear && edu.endYear && ' - '}{edu.endYear}
                          </p>
                        )}
                        {edu.grade && <p className="mt-1 text-xs font-medium text-slate-400">Grade: {edu.grade}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyText>Not provided</EmptyText>
                )}
              </Panel>

              <Panel icon={Award} title="Credentials" eyebrow="Certifications">
                {candidate.certifications && candidate.certifications.length > 0 ? (
                  <div className="space-y-2">
                    {candidate.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                        <Award className="h-4 w-4 flex-shrink-0 text-amber-600" />
                        <span className="text-sm font-semibold text-slate-700">{cert}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyText>None listed</EmptyText>
                )}
              </Panel>
            </div>

            {(candidate.previousCompanies.length > 0 || candidate.achievements.length > 0 || candidate.languages.length > 0) && (
              <Panel icon={Star} title="Hiring Signals" eyebrow="Experience, proof points, languages">
                <div className="grid gap-5 md:grid-cols-3">
                  <SignalBlock title="Companies">
                    {candidate.previousCompanies.length > 0 ? (
                      candidate.previousCompanies.map((company) => (
                        <Badge key={company} variant="outline" className="mr-2 mb-2 rounded-full border-slate-200 bg-white text-slate-700">
                          {company}
                        </Badge>
                      ))
                    ) : (
                      <EmptyText>Not provided</EmptyText>
                    )}
                  </SignalBlock>
                  <SignalBlock title="Highlights">
                    {candidate.achievements.length > 0 ? (
                      <ul className="space-y-2">
                        {candidate.achievements.map((achievement, index) => (
                          <li key={index} className="flex gap-2 text-sm text-slate-600">
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyText>Not provided</EmptyText>
                    )}
                  </SignalBlock>
                  <SignalBlock title="Languages">
                    {candidate.languages.length > 0 ? (
                      candidate.languages.map((language) => (
                        <Badge key={language} variant="outline" className="mr-2 mb-2 rounded-full border-slate-200 bg-white text-slate-700">
                          {language}
                        </Badge>
                      ))
                    ) : (
                      <EmptyText>Not provided</EmptyText>
                    )}
                  </SignalBlock>
                </div>
              </Panel>
            )}
          </main>

          <aside className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Recruiter actions</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">Shortlist decision</h2>
              </div>
              <div className="mb-5 rounded-lg bg-slate-950 p-4 text-white">
                <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
                  <span>Profile completeness</span>
                  <span className="font-semibold text-white">{candidate.profileCompleteness}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-300 to-emerald-300"
                    style={{ width: `${candidate.profileCompleteness}%` }}
                  />
                </div>
                {primarySkills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {primarySkills.map((skill) => (
                      <span key={skill} className="rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-slate-100">
                        {skill}
                      </span>
                    ))}
                    {extraSkillCount > 0 && <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-slate-100">+{extraSkillCount}</span>}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Button onClick={() => contactCandidate(candidate.id)} className="w-full rounded-lg bg-teal-600 text-white hover:bg-teal-700">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message candidate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void openResume(candidate)}
                  disabled={!candidate.resumeUrl}
                  className="w-full rounded-lg border-slate-200 bg-white hover:bg-slate-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download resume
                </Button>
              </div>
            </div>

            <SidebarPanel title="Contact Information">
              <ContactRow icon={Mail} value={candidate.email} href={candidate.email ? `mailto:${candidate.email}` : undefined} />
              <ContactRow icon={Phone} value={candidate.phone} />
              <ContactRow icon={Clock} value={candidate.timezone} />
              <LinkButton label="LinkedIn" url={candidate.linkedinUrl} onOpen={openExternalUrl} />
              <LinkButton label="Portfolio" url={candidate.portfolioUrl} onOpen={openExternalUrl} />
              <LinkButton label="GitHub" url={candidate.githubUrl} onOpen={openExternalUrl} />
            </SidebarPanel>

            {(candidate.linkedinUrl || candidate.githubUrl || candidate.portfolioUrl || (candidate.portfolioLinks && candidate.portfolioLinks.length > 0)) && (
              <SidebarPanel title="Online Presence">
                <LinkButton label="LinkedIn" url={candidate.linkedinUrl} onOpen={openExternalUrl} />
                <LinkButton label="GitHub" url={candidate.githubUrl} onOpen={openExternalUrl} />
                <LinkButton label="Portfolio" url={candidate.portfolioUrl} onOpen={openExternalUrl} />
                {candidate.portfolioLinks?.map((link, index) => (
                  <LinkButton key={index} label={link.replace(/^https?:\/\//, '')} url={link} onOpen={openExternalUrl} />
                ))}
              </SidebarPanel>
            )}

            <SidebarPanel title="Role Preferences">
              <InfoLine label="Experience" value={`${displayExperience} years`} />
              <InfoLine label="Availability" value={candidate.employmentStatus || availability.label} />
              <InfoLine label="Notice Period" value={candidate.noticePeriod || availability.label} />
              <InfoLine label="Employment Type" value={candidate.employmentType || 'Not provided'} />
              <InfoLine label="Salary" value={salary} />
              <InfoLine label="Profile Views" value={String(candidate.profileViews || 0)} />
              <InfoLine label="Last Updated" value={candidate.profileLastUpdated ? new Date(candidate.profileLastUpdated).toLocaleDateString() : lastActive} />
              <InfoLine label="Email Verified" value={candidate.emailVerified ? 'Yes' : 'No'} />
              <InfoLine label="Phone Verified" value={candidate.phoneVerified ? 'Yes' : 'No'} />
              <InfoLine label="Resume Verified" value={candidate.resumeVerified ? 'Yes' : 'No'} />
              {candidate.dateOfBirth && (
                <InfoLine
                  label="Date of birth"
                  value={new Date(candidate.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
              )}
            </SidebarPanel>

            {onUpgrade && (
              <div className="rounded-lg border border-teal-200 bg-gradient-to-br from-teal-50 to-slate-50 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-950">Unlock full candidate intelligence</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Upgrade to access richer comparisons, unlimited candidate profiles, and advanced outreach tools.</p>
                <Button onClick={onUpgrade} className="mt-4 w-full rounded-lg bg-slate-950 text-white hover:bg-slate-800">
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </DashboardPageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[86px] rounded-lg bg-white/10 px-3 py-2 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[11px] font-medium uppercase text-slate-300">{label}</p>
    </div>
  );
}

function QuickFact({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  eyebrow,
  children,
}: {
  icon: typeof BookOpen;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">{eyebrow}</p>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function SignalBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function SidebarPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-slate-950">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ContactRow({ icon: Icon, value, href }: { icon: typeof Mail; value?: string; href?: string }) {
  if (!value) {
    return <EmptyText>Not provided</EmptyText>;
  }

  const content = (
    <>
      <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
      <span className="truncate text-sm font-medium text-slate-700">{value}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 transition hover:bg-slate-50">
        {content}
      </a>
    );
  }

  return <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">{content}</div>;
}

function LinkButton({ label, url, onOpen }: { label: string; url?: string; onOpen: (url?: string | null) => void }) {
  if (!url) return null;

  return (
    <button
      type="button"
      onClick={() => onOpen(url)}
      className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-left transition hover:border-teal-200 hover:bg-teal-50"
    >
      <span className="flex min-w-0 items-center gap-2">
        <LinkIcon className="h-4 w-4 flex-shrink-0 text-teal-700" />
        <span className="truncate text-sm font-semibold text-slate-700">{label}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
    </button>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}

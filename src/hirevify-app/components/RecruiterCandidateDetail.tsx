import { ArrowLeft, MapPin, Briefcase, Send, Eye, BookOpen, Award, Clock, Globe, Calendar, DollarSign, CheckCircle, MessageCircle, Heart, Link as LinkIcon, Building2, Download, Mail, Phone, Globe as GlobeIcon, Star, GraduationCap } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { Candidate } from '../types/app';
import { openOrCreateConversationAndNavigate } from '../utils/openConversation';
import { DashboardPageLayout } from './shared/DashboardPageLayout';
import { dashboardTheme } from '../theme/dashboardTheme';

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
    'immediate': { label: 'Available Now', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'two-weeks': { label: '2 Weeks Notice', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    'one-month': { label: '1 Month Notice', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    'not-looking': { label: 'Not Looking', className: 'bg-slate-50 text-slate-600 border-slate-200' }
  };
  
  if (!availability || availability === '' || availability === 'null' || availability === 'undefined') {
    return { label: 'Availability Unknown', className: 'bg-slate-50 text-slate-600 border-slate-200' };
  }
  
  const normalizedAvailability = normalizeCandidateAvailability(availability);
  return config[normalizedAvailability] || { label: 'Availability Unknown', className: 'bg-slate-50 text-slate-600 border-slate-200' };
};

export function RecruiterCandidateDetail({
  candidate,
  onBack,
  onUpgrade,
  onViewMessages,
  savedCandidates,
  onToggleSaved
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

  return (
    <DashboardPageLayout
      title=""
      subtitle=""
      onBack={onBack}
      actions={
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleSaved(candidate.id)}
            className={`${isSaved ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-300 text-slate-700'} rounded-full px-4`}
          >
            <Heart className={`mr-1.5 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          <Button 
            onClick={() => contactCandidate(candidate.id)} 
            className="bg-[#0a66c2] hover:bg-[#004182] text-white rounded-full px-6"
            size="sm"
          >
            <MessageCircle className="mr-1.5 h-4 w-4" />
            Message
          </Button>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* LinkedIn-style Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {/* Banner Background */}
          <div className="h-32 bg-gradient-to-r from-[#0a66c2] via-[#0077b5] to-[#00a0dc]"></div>
          
          {/* Profile Info Section */}
          <div className="px-6 pb-4">
            <div className="flex flex-col sm:flex-row items-start gap-4 -mt-12">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-white shadow-lg bg-white">
                  {candidate.avatar && <AvatarImage src={candidate.avatar} alt={candidate.name} />}
                  <AvatarFallback className="bg-[#0a66c2] text-white text-3xl font-bold">
                    {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {candidate.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Name & Title */}
              <div className="flex-1 pt-1 sm:pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900">{candidate.name}</h1>
                </div>
                <p className="text-base text-slate-700 mb-2">{notProvided(candidate.title)}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {notProvided(candidate.location)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    {candidate.yearsOfExperience || 0} years experience
                  </span>
                  <Badge className={`text-xs font-medium border ${getAvailabilityBadge(candidate.availability).className}`}>
                    <Clock className="h-3 w-3 mr-1" />
                    {getAvailabilityBadge(candidate.availability).label}
                  </Badge>
                </div>
              </div>
              
              {/* Match Score */}
              <div className="flex flex-col items-center bg-white rounded-lg border border-slate-200 px-4 py-2 shadow-sm">
                <span className="text-2xl font-bold text-emerald-600">{candidate.matchScore}%</span>
                <span className="text-xs text-slate-500">Match Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Completeness Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Profile Completeness</span>
            <span className="text-sm font-semibold text-[#0a66c2]">{candidate.profileCompleteness}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${candidate.profileCompleteness}%` }}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* Left Column */}
          <div className="space-y-4">
            
            {/* About Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#0a66c2]" />
                About
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                {notProvided(candidate.bio || candidate.experienceSummary)}
              </p>
            </div>

            {/* Skills Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Skills</h2>
              {candidate.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map(skill => (
                    <Badge key={skill} className="bg-[#ebf4fc] text-[#0a66c2] border border-[#b3d4f0] px-3 py-1 font-medium text-sm hover:bg-[#dbeafe] transition-colors">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Not provided</p>
              )}
            </div>

            {/* Experience Section */}
            {candidate.previousCompanies.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#0a66c2]" />
                  Experience
                </h2>
                <div className="flex flex-wrap gap-2">
                  {candidate.previousCompanies.map(company => (
                    <Badge key={company} variant="outline" className="border-slate-300 text-slate-700 bg-slate-50 px-3 py-1">
                      <Building2 className="h-3 w-3 mr-1" />
                      {company}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Education & Certifications */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Education */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-[#0a66c2]" />
                  Education
                </h2>
                {candidate.education && candidate.education.length > 0 ? (
                  <div className="space-y-3">
                    {candidate.education.map((edu, index) => (
                      <div key={edu.id || index} className="border-l-2 border-[#0a66c2] pl-3">
                        <p className="font-medium text-sm text-slate-800">{edu.degree}</p>
                        {edu.fieldOfStudy && (
                          <p className="text-xs text-slate-600 mt-0.5">{edu.fieldOfStudy}</p>
                        )}
                        {edu.institution && (
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {edu.institution}
                          </p>
                        )}
                        {(edu.startYear || edu.endYear) && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {edu.startYear}{edu.startYear && edu.endYear && ' - '}{edu.endYear}
                            {edu.startYear === 'Ongoing' || edu.endYear === 'Ongoing' ? ' (Ongoing)' : ''}
                          </p>
                        )}
                        {edu.grade && (
                          <p className="text-xs text-slate-400 mt-0.5">Grade: {edu.grade}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Not provided</p>
                )}
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#0a66c2]" />
                  Certifications
                </h2>
                {candidate.certifications && candidate.certifications.length > 0 ? (
                  <div className="space-y-2">
                    {candidate.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                        <Award className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span className="text-sm text-slate-700 font-medium">{cert}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">None listed</p>
                )}
              </div>
            </div>

            {/* Highlights/Achievements */}
            {candidate.achievements.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Highlights
                </h2>
                <ul className="space-y-2">
                  {candidate.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Languages */}
            {candidate.languages.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#0a66c2]" />
                  Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {candidate.languages.map(language => (
                    <Badge key={language} variant="outline" className="border-slate-300 text-slate-700 bg-white px-3 py-1">
                      <Globe className="h-3 w-3 mr-1" />
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-4">
            
            {/* Contact & Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-[#0a66c2] to-[#0077b5] px-4 py-3">
                <h3 className="text-white font-semibold text-sm">Contact Information</h3>
              </div>
              <div className="p-4 space-y-3">
                {candidate.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a href={`mailto:${candidate.email}`} className="text-[#0a66c2] hover:underline truncate">
                      {candidate.email}
                    </a>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{candidate.phone}</span>
                  </div>
                )}
                {candidate.timezone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{candidate.timezone}</span>
                  </div>
                )}
                
                <div className="pt-2 space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => void openResume(candidate)}
                    disabled={!candidate.resumeUrl}
                    className="w-full justify-start border-slate-300 hover:border-[#0a66c2] hover:bg-[#ebf4fc]"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Resume
                  </Button>
                  
                  <div className="flex gap-2">
                    {candidate.linkedinUrl && (
                      <Button variant="outline" size="sm" onClick={() => openExternalUrl(candidate.linkedinUrl)} className="flex-1 justify-center border-slate-300 hover:border-[#0a66c2] hover:bg-[#ebf4fc]">
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    )}
                    {candidate.githubUrl && (
                      <Button variant="outline" size="sm" onClick={() => openExternalUrl(candidate.githubUrl)} className="flex-1 justify-center border-slate-300 hover:border-[#0a66c2] hover:bg-[#ebf4fc]">
                        <GlobeIcon className="h-4 w-4" />
                      </Button>
                    )}
                    {candidate.portfolioUrl && (
                      <Button variant="outline" size="sm" onClick={() => openExternalUrl(candidate.portfolioUrl)} className="flex-1 justify-center border-slate-300 hover:border-[#0a66c2] hover:bg-[#ebf4fc]">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700">Profile Insights</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Response Rate</span>
                  <span className="text-sm font-semibold text-emerald-600">{candidate.responseRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Work Type</span>
                  <span className="text-sm font-medium text-slate-700">
                    {candidate.preferredWorkType.length > 0
                      ? candidate.preferredWorkType.join(', ')
                      : 'Not set'}
                  </span>
                </div>
                {candidate.salaryRange.min || candidate.salaryRange.max ? (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Salary Range</span>
                    <span className="text-sm font-medium text-slate-700">
                      {candidate.salaryRange.currency} {candidate.salaryRange.min.toLocaleString()} - {candidate.salaryRange.max.toLocaleString()}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Last Active</span>
                  <span className="text-sm text-slate-600">{candidate.lastActive ? new Date(candidate.lastActive).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Portfolio Links */}
            {candidate.portfolioLinks && candidate.portfolioLinks.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Portfolio</h3>
                <div className="space-y-2">
                  {candidate.portfolioLinks.map((link, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => openExternalUrl(link)}
                      className="block max-w-full truncate text-sm font-medium text-[#0a66c2] hover:underline text-left flex items-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3 flex-shrink-0" />
                      {link.replace(/^https?:\/\//, '')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upgrade CTA */}
            {onUpgrade && (
              <div className="bg-gradient-to-br from-[#f5f5f5] to-[#ebf4fc] rounded-lg border border-[#b3d4f0] p-4 text-center">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Unlock Full Potential</h3>
                <p className="text-xs text-slate-500 mb-3">Upgrade to Pro for unlimited access</p>
                <Button 
                  onClick={onUpgrade} 
                  className="w-full bg-[#0a66c2] hover:bg-[#004182] text-white text-sm"
                >
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

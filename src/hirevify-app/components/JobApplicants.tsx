/**
 * Job Applicants Screen
 * Shows the list of candidates who applied to a specific job
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, Calendar, MapPin, FileText, Loader2, Briefcase, User, Eye, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { applicationsService, type ApplicationWithDetails } from '@/src/hirevify-app/services/applicationsService';
import { dashboardTheme } from '../theme/dashboardTheme';
import { cn } from './ui/utils';

interface JobApplicantsProps {
  job: {
    id: string;
    title: string;
    description?: string;
    skills?: string[];
    location?: string;
    status?: string;
  };
  onBack: () => void;
  onViewCandidate?: (application: ApplicationWithDetails) => void;}

const statusColors: Record<string, string> = {
  applied: 'bg-blue-50 text-blue-700 border-blue-200',
  screening: 'bg-amber-50 text-amber-700 border-amber-200',
  interview: 'bg-purple-50 text-purple-700 border-purple-200',
  offer: 'bg-teal-50 text-teal-700 border-teal-200',
  hired: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  withdrawn: 'bg-slate-50 text-slate-700 border-slate-200',
  assigned: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
};

const statusLabels: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export function JobApplicants({ job, onBack, onViewCandidate }: JobApplicantsProps) {
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCvUrl, setSelectedCvUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!job?.id) return;

    const loadApplications = async () => {
      setLoading(true);
      try {
        const { data, error } = await applicationsService.getJobApplications(job.id);
        if (error) {
          console.error('Error loading applications:', error);
          setApplications([]);
          return;
        }
        setApplications(data || []);
      } catch (err) {
        console.error('Error loading applications:', err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    void loadApplications();
  }, [job?.id]);

  useEffect(() => {
    let cancelled = false;

    const loadCvUrl = async () => {
      const rawUrl = selectedApplication?.cv_url || (selectedApplication?.candidate_details as any)?.resume_url || null;
      setSelectedCvUrl(null);

      if (!rawUrl) return;

      if (/^https?:\/\//i.test(rawUrl)) {
        setSelectedCvUrl(rawUrl);
        return;
      }

      const { url } = await applicationsService.getApplicationFileSignedUrl(rawUrl);
      if (!cancelled) setSelectedCvUrl(url || null);
    };

    void loadCvUrl();

    return () => {
      cancelled = true;
    };
  }, [selectedApplication]);

  const filteredApplications = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const name = app.candidate_profile?.full_name?.toLowerCase() || '';
      const email = app.candidate_profile?.email?.toLowerCase() || '';
      return name.includes(search) || email.includes(search);
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!job) {
    return (
      <div className={dashboardTheme.page}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Button>
          <div className="text-center py-16">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No job selected</h3>
            <p className="text-gray-500">Please select a job from the list to view its applicants.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={dashboardTheme.page}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">Applicants for: {job.title}</h1>
                <Badge variant="secondary">{filteredApplications.length} candidate{filteredApplications.length !== 1 ? 's' : ''}</Badge>
              </div>
              {job.description && (
                <p className="text-gray-600 text-sm line-clamp-1">{job.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 border border-gray-100 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
            <p className="text-gray-600">Loading applicants...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No matching applicants' : 'No applicants yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Applicants will appear here once candidates apply to this job'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const candidateName = application.candidate_profile?.full_name || 'Unknown Candidate';
              const candidateEmail = application.candidate_profile?.email || 'No email';
              const skills = application.candidate_details?.skills || [];

              return (
                <Card
                  key={application.id}
                  className="border border-gray-100 bg-white hover:shadow-md transition-all"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Avatar & Basic Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 font-semibold text-lg">
                            {getInitials(candidateName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{candidateName}</h3>
                            <Badge className={cn('text-xs', statusColors[application.status] || 'bg-gray-100 text-gray-700')}>
                              {statusLabels[application.status] || application.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${candidateEmail}`} className="hover:text-emerald-600">
                              {candidateEmail}
                            </a>
                          </div>
                          {application.candidate_details?.headline && (
                            <p className="text-sm text-gray-600 mb-2">{application.candidate_details.headline}</p>
                          )}
                        </div>
                      </div>

                      {/* Skills */}
                      {skills.length > 0 && (
                        <div className="lg:w-64">
                          <div className="flex flex-wrap gap-1.5">
                            {skills.slice(0, 6).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-700 text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {skills.length > 6 && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                                +{skills.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Meta & Actions */}
                      <div className="flex flex-col gap-2 lg:items-end">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Applied {formatDate(application.submitted_at)}</span>
                        </div>
                        {application.cv_url && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <FileText className="w-3.5 h-3.5" />
                            <span>CV attached</span>
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedApplication(application)}
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    
      {/* Full candidate profile view */}
      {selectedApplication && (() => {
        const candidateProfile = selectedApplication.candidate_profile;
        const candidateDetails = selectedApplication.candidate_details as any;
        const candidateName = candidateProfile?.full_name || 'Unknown Candidate';
        const candidateEmail = candidateProfile?.email || 'No email';
        const resumeUrl = selectedCvUrl;
        const skills = Array.isArray(candidateDetails?.skills) ? candidateDetails.skills : [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{candidateName}</h2>
                  <p className="text-sm text-gray-500">Complete candidate profile</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedApplication(null)}>
                  Close
                </Button>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <h3 className="mb-3 font-semibold text-gray-900">Basic Details</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="font-medium">Name:</span> {candidateName}</p>
                      <p><span className="font-medium">Email:</span> {candidateEmail}</p>
                      {candidateDetails?.phone && <p><span className="font-medium">Phone:</span> {candidateDetails.phone}</p>}
                      {candidateDetails?.location && <p><span className="font-medium">Location:</span> {candidateDetails.location}</p>}
                      {candidateDetails?.headline && <p><span className="font-medium">Headline:</span> {candidateDetails.headline}</p>}
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <h3 className="mb-3 font-semibold text-gray-900">Experience & Availability</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      {candidateDetails?.experience_level && <p><span className="font-medium">Experience Level:</span> {candidateDetails.experience_level}</p>}
                      {candidateDetails?.years_of_experience !== undefined && candidateDetails?.years_of_experience !== null && (
                        <p><span className="font-medium">Years of Experience:</span> {candidateDetails.years_of_experience}</p>
                      )}
                      {candidateDetails?.availability && <p><span className="font-medium">Availability:</span> {candidateDetails.availability}</p>}
                      {(candidateDetails?.salary_min || candidateDetails?.salary_max) && (
                        <p><span className="font-medium">Expected Salary:</span> ${candidateDetails?.salary_min || 0} - ${candidateDetails?.salary_max || 0}</p>
                      )}
                    </div>
                  </div>
                </div>

                {candidateDetails?.bio && (
                  <div className="rounded-xl border p-4">
                    <h3 className="mb-3 font-semibold text-gray-900">Bio</h3>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">{candidateDetails.bio}</p>
                  </div>
                )}

                {candidateDetails?.experience_summary && (
                  <div className="rounded-xl border p-4">
                    <h3 className="mb-3 font-semibold text-gray-900">Experience Summary</h3>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">{candidateDetails.experience_summary}</p>
                  </div>
                )}

                {skills.length > 0 && (
                  <div className="rounded-xl border p-4">
                    <h3 className="mb-3 font-semibold text-gray-900">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill: string, index: number) => (
                        <span key={`${skill}-${index}`} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border p-4">
                  <h3 className="mb-3 font-semibold text-gray-900">Application Details</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><span className="font-medium">Status:</span> {selectedApplication.status}</p>
                    {selectedApplication.cover_letter && (
                      <div>
                        <p className="font-medium">Cover Letter:</p>
                        <p className="mt-1 whitespace-pre-wrap text-gray-700">{selectedApplication.cover_letter}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <h3 className="mb-3 font-semibold text-gray-900">CV / Resume</h3>
                  {resumeUrl ? (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Open CV / Resume
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">No CV uploaded for this candidate.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


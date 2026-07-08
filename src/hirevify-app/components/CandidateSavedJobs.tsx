/**
 * Candidate Saved Jobs
 *
 * Lists every job the candidate has bookmarked from the Find Jobs page.
 * Each row shows the job card + an "Unsave" action that removes the row
 * from the database (and immediately from the list).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Loader2,
  MapPin,
  Search,
  Trash2,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { useAuth } from './AuthProvider';
import { savedJobsService } from '../services/savedJobsService';
import { profilesService } from '../services/profilesService';
import { MIN_CANDIDATE_PROFILE_COMPLETENESS } from '../services/applicationsService';
import { DashboardPageLayout } from './shared/DashboardPageLayout';
import { toast } from 'sonner';
import type { Job } from '../types/app';

interface CandidateSavedJobsProps {
  onBack: () => void;
  onViewJob: (job: Job) => void;
  onBrowseJobs: () => void;
}

export function CandidateSavedJobs({ onBack, onViewJob, onBrowseJobs }: CandidateSavedJobsProps) {
  const { user } = useAuth();

  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingUnsave, setPendingUnsave] = useState<string | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);

  // Load candidate profile for completeness check
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        const profileData = await profilesService.getCandidateProfile(user.id);
        if (profileData.data) {
          setCandidateProfile(profileData.data);
        }
      } catch (err) {
        console.warn('Could not load candidate profile', err);
      }
    };
    loadProfile();
  }, [user?.id]);

  // Check profile before job search
  const checkProfileForJobSearch = () => {
    const completeness = Number(candidateProfile?.profile_completeness || 0);
    const hasResume = Boolean(candidateProfile?.resume_url);
    const isProfileComplete =
      Boolean(candidateProfile?.profile_completed) || completeness >= MIN_CANDIDATE_PROFILE_COMPLETENESS;
    
    if (!isProfileComplete || !hasResume) {
      const missing: string[] = [];
      if (!hasResume) missing.push('upload a CV');
      if (!isProfileComplete) missing.push(`complete all required profile fields (${completeness}% done)`);
      
      toast.error(
        `Please ${missing.join(' and ')} before finding jobs and applying.`,
        { 
          action: {
            label: 'Complete Profile',
            onClick: onBack
          },
          duration: 8000
        }
      );
      return false;
    }
    return true;
  };

  const handleBrowseJobs = () => {
    if (checkProfileForJobSearch()) {
      onBrowseJobs();
    }
  };

  const loadSavedJobs = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await savedJobsService.getCandidateSavedJobs(user.id);
      if (error) {
        console.error('Failed to load saved jobs:', error);
        toast.error('Could not load saved jobs');
      }
      setRows(data ?? []);
    } catch (err) {
      console.error('Failed to load saved jobs', err);
      toast.error('Could not load saved jobs');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadSavedJobs();
  }, [loadSavedJobs]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const title = String(row.job?.title ?? '').toLowerCase();
      const company = String(row.job?.company_name ?? row.job?.recruiter_profile?.company_name ?? '').toLowerCase();
      const location = String(row.job?.location ?? '').toLowerCase();
      return title.includes(q) || company.includes(q) || location.includes(q);
    });
  }, [rows, searchQuery]);

  const unsaveJob = useCallback(
    async (jobId: string) => {
      if (!user?.id) return;
      setPendingUnsave(jobId);

      // Optimistic removal — strip the row immediately so the UI feels
      // instant; roll back if the DB call fails.
      const previous = rows;
      setRows((prev) => prev.filter((row) => String(row.job_id ?? row.job?.id) !== String(jobId)));

      const { error } = await savedJobsService.unsaveJob(user.id, jobId);
      setPendingUnsave(null);

      if (error) {
        console.error('Failed to unsave job', error);
        setRows(previous);
        toast.error('Could not remove from saved jobs');
        return;
      }
      toast.success('Removed from saved jobs');
    },
    [user?.id, rows]
  );

  return (
    <DashboardPageLayout
      eyebrow="Candidate workspace"
      title="Saved Jobs"
      subtitle="All the roles you\u2019ve bookmarked. Unsave anytime to remove them from your list."
      onBack={onBack}
      backLabel="Back to Dashboard"
      actions={
        <Button onClick={handleBrowseJobs} variant="outline">
          <Search className="mr-2 h-4 w-4" />
          Browse jobs
        </Button>
      }
    >
      <Card className="mb-6">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, company, or location"
              className="pl-9"
            />
          </div>
          <Badge className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-violet-700">
            <BookmarkCheck className="mr-1.5 h-3 w-3" />
            {rows.length} saved
          </Badge>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Loading your saved jobs\u2026</p>
          </div>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 shadow-sm">
            <Bookmark className="h-7 w-7" />
          </div>
          {rows.length === 0 ? (
            <>
              <h3 className="mt-4 text-lg font-bold text-slate-950">No saved jobs yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Tap the bookmark icon on any job to save it for later. Your saved jobs stay here until you remove them.
              </p>
              <Button onClick={handleBrowseJobs} className="mt-5">
                <Search className="mr-2 h-4 w-4" />
                Browse jobs
              </Button>
            </>
          ) : (
            <>
              <h3 className="mt-4 text-lg font-bold text-slate-950">No matches</h3>
              <p className="mt-1 text-sm text-slate-500">Try a different search term.</p>
              <Button onClick={() => setSearchQuery('')} variant="outline" className="mt-5">
                Clear search
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row: any) => {
            const job: any = row.job ?? {};
            const jobId = String(row.job_id ?? job.id ?? '');
            const title = String(job.title ?? 'Untitled role');
            const company = String(job.company_name ?? job.recruiter_profile?.company_name ?? 'Company');
            const location = String(job.location ?? 'Remote');
            const skills: string[] = Array.isArray(job.skills) ? job.skills : [];

            return (
              <Card
                key={row.id ?? jobId}
                className="group overflow-hidden transition hover:border-violet-300 hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-violet-700">
                          <BookmarkCheck className="mr-1.5 h-3 w-3" />
                          Saved
                        </Badge>
                        {job.status && (
                          <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 capitalize text-slate-600">
                            {String(job.status)}
                          </Badge>
                        )}
                      </div>
                      <h3 className="truncate text-lg font-bold text-slate-950">{title}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{company}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {location}
                        </span>
                        {job.job_type && (
                          <span className="inline-flex items-center gap-1 capitalize">
                            <Briefcase className="h-3 w-3" />
                            {String(job.job_type).replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>

                      {skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {skills.slice(0, 5).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {skills.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                      <Button
                        onClick={() => onViewJob(job as Job)}
                        className="flex-1 sm:flex-none"
                      >
                        View job
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => unsaveJob(jobId)}
                        disabled={pendingUnsave === jobId}
                        className="flex-1 border-red-200 text-red-700 hover:bg-red-50 sm:flex-none"
                      >
                        {pendingUnsave === jobId ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Unsave
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardPageLayout>
  );
}

import { useEffect, useState } from 'react';
import { ArrowLeft, Briefcase, Calendar, Edit, Eye, Loader, MapPin, Plus, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { toast } from 'sonner';

interface JobRow {
  id: string;
  recruiter_id: string;
  title: string | null;
  company_name: string | null;
  description: string | null;
  requirements: string[] | null;
  skills: string[] | null;
  location: string | null;
  job_type: string | null;
  status: string | null;
  applications_count: number | null;
  views_count: number | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectManagementProps {
  onBack: () => void;
  onEditProject?: (project?: any) => void;
  onViewApplications?: (project?: any) => void;
  onCreateProject?: () => void;
}

export function ProjectManagement({
  onBack,
  onEditProject,
  onViewApplications,
  onCreateProject,
}: ProjectManagementProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadJobs = async () => {
    try {
      setIsLoading(true);

      const supabase = createSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData?.user?.id) {
        throw new Error('No active Supabase login found. Please login again.');
      }

      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!profileRow?.id) {
        throw new Error('Recruiter profile row not found.');
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', profileRow.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setJobs(data || []);
    } catch (error) {
      console.error('Failed to load recruiter projects:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load projects');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [user?.id]);

  const openCreateProject = () => {
    if (onCreateProject) {
      onCreateProject();
      return;
    }

    onEditProject?.();
  };

  const mapJobToProject = (job: JobRow) => ({
    id: job.id,
    title: job.title || '',
    description: job.description || '',
    skills: job.skills || [],
    budget:
      job.budget_min || job.budget_max
        ? `${job.budget_currency || 'USD'} ${job.budget_min || 0} - ${job.budget_max || job.budget_min || 0}`
        : '',
    timeline: job.requirements?.find((item) => item.toLowerCase().startsWith('timeline:'))?.replace(/^Timeline:\s*/i, '') || '',
    applications: job.applications_count || 0,
    status: job.status || 'published',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
            <p className="text-gray-600">Manage all your hiring projects in one place</p>
          </div>
        </div>

        <Card className="border border-gray-100 shadow-sm bg-white">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  Your Projects
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {jobs.length} project{jobs.length === 1 ? '' : 's'} saved in database
                </p>
              </div>

              <Button onClick={openCreateProject} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create New Project
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <Loader className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
                <p className="text-gray-600">Loading projects from database...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-6">Create your first project to start hiring top talent</p>
                <Button onClick={openCreateProject} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all bg-white">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <Badge className={job.status === 'published' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-800 border border-gray-200'}>
                            {job.status || 'published'}
                          </Badge>
                        </div>

                        <p className="text-gray-600 line-clamp-2 mb-4">
                          {job.description || 'No description added'}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {(job.skills || []).map((skill) => (
                            <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            {job.location || 'Not specified'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-600" />
                            {job.applications_count || 0} applications
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            {new Date(job.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 min-w-[170px]">
                        <Button variant="outline" onClick={() => onViewApplications?.(mapJobToProject(job))}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Applications
                        </Button>
                        <Button variant="outline" onClick={() => onEditProject?.(mapJobToProject(job))}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Project
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

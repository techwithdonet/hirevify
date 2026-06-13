import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Link2, CheckCircle2, Briefcase } from 'lucide-react';
import { createClient } from '../utils/supabase/client';

interface Job {
  id: string;
  title: string;
  description: string;
  candidateEmail?: string;
  interviewLink?: string;
}

interface CreateJobFlowProps {
  onBack: () => void;
  onLinkGenerated: (link: string) => void;
  existingJob?: Job | null;
}

export function CreateJobFlow({ onBack, onLinkGenerated, existingJob }: CreateJobFlowProps) {
  const [step, setStep] = useState<'job-details' | 'schedule' | 'success'>('job-details');
  const [jobTitle, setJobTitle] = useState(existingJob?.title || '');
  const [jobDescription, setJobDescription] = useState(existingJob?.description || '');
  const [candidateEmail, setCandidateEmail] = useState(existingJob?.candidateEmail || '');
  const [generatedLink, setGeneratedLink] = useState(existingJob?.interviewLink || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleJobDetailsSubmit = () => {
    if (jobTitle.trim() && jobDescription.trim()) {
      setStep('schedule');
    }
  };

  const handleGenerateLink = async () => {
    if (!candidateEmail.trim()) {
      toast.error('Enter candidate email first.');
      return;
    }

    try {
      setIsGenerating(true);

      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        toast.error('Please login again to generate interview link.');
        return;
      }

      const { data: invite, error: insertError } = await supabase
        .from('interview_invites')
        .insert({
          recruiter_id: userData.user.id,
          job_id: existingJob?.id || null,
          job_title: jobTitle.trim(),
          job_description: jobDescription.trim(),
          candidate_email: candidateEmail.trim(),
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError || !invite?.id) {
        throw new Error(insertError?.message || 'Failed to create interview invite.');
      }

      const link = `${window.location.origin}/interview/${invite.id}`;

      const { error: updateError } = await supabase
        .from('interview_invites')
        .update({
          interview_link: link,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to save interview link.');
      }

      setGeneratedLink(link);
      setStep('success');
      toast.success('Interview invite saved to database.');
    } catch (error) {
      console.error('Failed to generate interview link:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate interview link.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseLink = () => {
    onLinkGenerated(generatedLink);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl text-foreground">HireVify</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {step === 'job-details' && (
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                {existingJob ? 'Schedule Interview' : 'Create New Job'}
              </CardTitle>
              <p className="text-muted-foreground">
                {existingJob
                  ? 'Review job details and proceed to schedule an interview'
                  : 'Fill in the job details to get started'}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="job-title" className="text-foreground">Job Title</Label>
                <Input
                  id="job-title"
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="e.g. Senior Frontend Developer"
                  className="bg-input-background border-border text-foreground"
                  disabled={!!existingJob}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-description" className="text-foreground">Job Description</Label>
                <Textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Describe the role, requirements, and responsibilities..."
                  rows={4}
                  className="bg-input-background border-border text-foreground resize-none"
                  disabled={!!existingJob}
                />
              </div>

              <Button
                onClick={handleJobDetailsSubmit}
                disabled={!jobTitle.trim() || !jobDescription.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Continue to Schedule Interview
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'schedule' && (
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Schedule Interview</CardTitle>
              <p className="text-muted-foreground">
                Enter the candidate&apos;s email to create a database-backed interview invite.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg border border-border">
                <h3 className="text-foreground mb-2">{jobTitle}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2">{jobDescription}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidate-email" className="text-foreground">Candidate Email</Label>
                <Input
                  id="candidate-email"
                  type="email"
                  value={candidateEmail}
                  onChange={(event) => setCandidateEmail(event.target.value)}
                  placeholder="candidate@example.com"
                  className="bg-input-background border-border text-foreground"
                />
              </div>

              <Button
                onClick={handleGenerateLink}
                disabled={!candidateEmail.trim() || isGenerating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link2 className="w-4 h-4 mr-2" />
                {isGenerating ? 'Saving Invite...' : 'Generate Interview Link'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'success' && (
          <Card className="border border-border">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>

                <div>
                  <h2 className="text-xl text-foreground mb-2">Interview Invite Created</h2>
                  <p className="text-muted-foreground">
                    The interview invite has been saved for {candidateEmail}.
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Interview Link:</p>
                  <p className="text-foreground break-all bg-input-background p-2 rounded border border-border">
                    {generatedLink}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onBack}
                    className="flex-1 border-border text-foreground hover:bg-muted"
                  >
                    Back to Dashboard
                  </Button>
                  <Button
                    onClick={handleUseLink}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Preview Interview Page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

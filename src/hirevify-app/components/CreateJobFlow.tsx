import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Link2, CheckCircle2, Briefcase } from 'lucide-react';

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
  const [candidateEmail, setCandidateEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const handleJobDetailsSubmit = () => {
    if (jobTitle.trim() && jobDescription.trim()) {
      setStep('schedule');
    }
  };

  const handleGenerateLink = () => {
    if (candidateEmail.trim()) {
      const mockLink = `https://hirevify.com/interview/${Math.random().toString(36).substr(2, 9)}`;
      setGeneratedLink(mockLink);
      setStep('success');
    }
  };

  const handleUseLink = () => {
    onLinkGenerated(generatedLink);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Main Content */}
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
                  : 'Fill in the job details to get started'
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="job-title" className="text-foreground">Job Title</Label>
                <Input
                  id="job-title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
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
                  onChange={(e) => setJobDescription(e.target.value)}
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
                Enter the candidate's email to generate a secure interview link
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
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="bg-input-background border-border text-foreground"
                />
              </div>

              <Button 
                onClick={handleGenerateLink}
                disabled={!candidateEmail.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link2 className="w-4 h-4 mr-2" />
                Generate Interview Link
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
                  <h2 className="text-xl text-foreground mb-2">Interview Link Generated!</h2>
                  <p className="text-muted-foreground">
                    The secure interview link has been created for {candidateEmail}
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








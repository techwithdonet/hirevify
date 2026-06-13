import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ArrowLeft, Plus, X, CheckCircle2, Briefcase } from 'lucide-react';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget: string;
  timeline: string;
  applications: number;
}

interface ProjectPostingFlowProps {
  onBack: () => void;
  existingProject?: Project | null;
}

export function ProjectPostingFlow({ onBack, existingProject }: ProjectPostingFlowProps) {
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [projectTitle, setProjectTitle] = useState(existingProject?.title || '');
  const [projectDescription, setProjectDescription] = useState(existingProject?.description || '');
  const [skills, setSkills] = useState<string[]>(existingProject?.skills || []);
  const [budget, setBudget] = useState(existingProject?.budget || '');
  const [timeline, setTimeline] = useState(existingProject?.timeline || '');
  const [newSkill, setNewSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedJobId, setSavedJobId] = useState<string | null>(null);

  const isEditing = !!existingProject;

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const parseBudgetRange = (value: string) => {
    const cleaned = value.replace(/,/g, '');
    const numbers = cleaned.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
    const lowerValue = value.toLowerCase();

    let currency = 'USD';
    if (lowerValue.includes('inr') || lowerValue.includes('rs')) currency = 'INR';
    if (lowerValue.includes('eur')) currency = 'EUR';
    if (lowerValue.includes('gbp')) currency = 'GBP';
    if (lowerValue.includes('qar')) currency = 'QAR';

    const min = numbers[0] ?? null;
    const max = numbers[1] ?? min;

    return { min, max, currency };
  };

  const saveProjectToDatabase = async () => {
    const supabase = createSupabaseBrowserClient();

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user?.id) {
      throw new Error('No active Supabase login found. Please logout and login again.');
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, company_name')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message || 'Failed to find recruiter profile.');
    }

    if (!profileRow?.id) {
      throw new Error('Main profile row not found. Please complete recruiter profile first.');
    }

    if (profileRow.role !== 'recruiter') {
      throw new Error('Only recruiter accounts can post projects.');
    }

    const { data: recruiterProfile } = await supabase
      .from('recruiter_profiles')
      .select('id, company_name')
      .eq('id', profileRow.id)
      .maybeSingle();

    const { min, max, currency } = parseBudgetRange(budget);

    const payload = {
      recruiter_id: profileRow.id,
      title: projectTitle.trim(),
      company_name: recruiterProfile?.company_name || profileRow.company_name || 'Company',
      description: projectDescription.trim(),
      requirements: [`Timeline: ${timeline.trim()}`],
      skills,
      location: 'Not specified',
      job_type: 'freelance',
      experience_level: 'mid',
      remote_type: 'remote',
      salary_min: min,
      salary_max: max,
      currency,
      budget_min: min,
      budget_max: max,
      budget_currency: currency,
      status: 'published',
      applications_count: 0,
      views_count: 0,
      has_assessment: false,
      has_video_challenge: false,
      video_challenge_description: null,
      updated_at: new Date().toISOString(),
    };

    if (isEditing && existingProject?.id) {
      const { data, error } = await supabase
        .from('jobs')
        .update(payload)
        .eq('id', existingProject.id)
        .select('id, title, status, created_at, updated_at')
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update project.');
      }

      if (!data?.id) {
        throw new Error('Project update did not return a saved row.');
      }

      return data;
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert(payload)
      .select('id, title, status, created_at, updated_at')
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to post project.');
    }

    if (!data?.id) {
      throw new Error('Project post did not return a saved row.');
    }

    return data;
  };

  const handleSubmit = async () => {
    if (!projectTitle.trim() || !projectDescription.trim() || skills.length === 0 || !budget.trim() || !timeline.trim()) {
      toast.error('Please complete all project fields before posting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const savedJob = await saveProjectToDatabase();
      setSavedJobId(savedJob.id);
      toast.success(isEditing ? 'Project updated in database' : 'Project posted to database');
      setStep('success');
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
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
              <img src={(hirevifyLogo as any).src ?? hirevifyLogo} alt="HireVify" className="h-16" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {step === 'details' && (
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">
                {isEditing ? 'Edit Project' : 'Post a New Project'}
              </CardTitle>
              <p className="text-muted-foreground">
                {isEditing 
                  ? 'Update your project details and requirements' 
                  : 'Define your project requirements to attract the right candidates'
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Project Title */}
              <div className="space-y-3">
                <Label htmlFor="project-title" className="text-foreground text-lg">Project Title</Label>
                <Input
                  id="project-title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. E-commerce React Frontend Development"
                  className="bg-input-background border-border text-foreground text-lg p-4 h-auto"
                />
              </div>
              
              {/* Project Description */}
              <div className="space-y-3">
                <Label htmlFor="project-description" className="text-foreground text-lg">Project Description</Label>
                <Textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe the project scope, deliverables, and key requirements..."
                  rows={6}
                  className="bg-input-background border-border text-foreground resize-none"
                />
              </div>

              {/* Skills Required */}
              <div className="space-y-3">
                <Label className="text-foreground text-lg">Skills Required</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a skill (e.g. React, Python, UI/UX)"
                      className="bg-input-background border-border text-foreground"
                    />
                    <Button 
                      type="button" 
                      onClick={addSkill}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg border border-border">
                      {skills.map((skill) => (
                        <Badge 
                          key={skill} 
                          variant="secondary" 
                          className="px-3 py-1 text-sm bg-card border border-border"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-2 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Project Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="budget" className="text-foreground text-lg">Budget Range</Label>
                  <Input
                    id="budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. $3,000 - $5,000"
                    className="bg-input-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="timeline" className="text-foreground text-lg">Timeline</Label>
                  <Input
                    id="timeline"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g. 4-6 weeks"
                    className="bg-input-background border-border text-foreground"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !projectTitle.trim() || !projectDescription.trim() || skills.length === 0 || !budget.trim() || !timeline.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg"
                >
                  {isSubmitting ? 'Saving to Database...' : isEditing ? 'Update Project' : 'Post Project'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'success' && (
          <Card className="border border-border">
            <CardContent className="pt-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                
                <div>
                  <h2 className="text-2xl text-foreground mb-3">
                    {isEditing ? 'Project Updated!' : 'Project Posted Successfully!'}
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    {isEditing 
                      ? 'Your project has been updated and is now live with the new details.'
                      : 'Your project is now live and candidates can start applying. You\'ll receive notifications as applications come in.'
                    }
                  </p>
                </div>

                {/* Project Summary */}
                <div className="bg-muted rounded-xl p-6 text-left max-w-md mx-auto">
                  <h3 className="text-foreground mb-3">{projectTitle}</h3>
                  {savedJobId && <p className="text-xs text-muted-foreground mb-3">Saved Job ID: {savedJobId}</p>}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Skills:</span>
                      <span className="text-foreground">{skills.length} required</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="text-foreground">{budget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timeline:</span>
                      <span className="text-foreground">{timeline}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={onBack}
                    className="px-6 py-3 border-border text-foreground hover:bg-muted"
                  >
                    Back to Dashboard
                  </Button>
                  <Button 
                    onClick={() => setStep('details')}
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Post Another Project
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








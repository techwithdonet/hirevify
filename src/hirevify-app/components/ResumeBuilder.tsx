import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Download, FileText, User, Briefcase, GraduationCap, Award, Zap, CheckCircle, X, Star, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';

interface ResumeBuilderProps {
  onBack: () => void;
  onUpgrade: () => void;
}

interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  portfolioUrl: string;
  location: string;
}

interface WorkExperience {
  id: string;
  jobTitle: string;
  companyName: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  isCurrentJob: boolean;
  description: string[];
}

interface Education {
  id: string;
  degree: string;
  university: string;
  city: string;
  state: string;
  graduationDate: string;
  gpa?: string;
}

interface Skill {
  name: string;
  category: 'technical' | 'soft' | 'language';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface ResumeData {
  template: 'professional' | 'modern' | 'minimalist';
  contactInfo: ContactInfo;
  summary: string;
  experience: WorkExperience[];
  skills: Skill[];
  education: Education[];
}

interface ATSCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  recommendation?: string;
}

type Step = 'welcome' | 'template' | 'contact' | 'summary' | 'experience' | 'skills' | 'education' | 'review' | 'ats-report';

const templates = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, traditional layout suitable for corporate roles',
    preview: '/template-professional.png',
    features: ['ATS-Optimized', 'Traditional Format', 'Corporate Style']
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bold, two-column layout with visual hierarchy',
    preview: '/template-modern.png',
    features: ['Visual Impact', 'Two-Column', 'Creative Industries']
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Simple, single-column design focused on scannability',
    preview: '/template-minimalist.png',
    features: ['Clean Design', 'Easy to Read', 'Versatile']
  }
];

export function ResumeBuilder({ onBack, onUpgrade }: ResumeBuilderProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [resumeData, setResumeData] = useState<ResumeData>({
    template: 'professional',
    contactInfo: {
      fullName: '',
      email: '',
      phone: '',
      linkedinUrl: '',
      portfolioUrl: '',
      location: ''
    },
    summary: '',
    experience: [],
    skills: [],
    education: []
  });
  const [atsScore, setAtsScore] = useState(0);
  const [atsChecks, setAtsChecks] = useState<ATSCheck[]>([]);

  const steps: { id: Step; title: string; icon: any }[] = [
    { id: 'welcome', title: 'Welcome', icon: Star },
    { id: 'template', title: 'Template', icon: FileText },
    { id: 'contact', title: 'Contact', icon: User },
    { id: 'summary', title: 'Summary', icon: FileText },
    { id: 'experience', title: 'Experience', icon: Briefcase },
    { id: 'skills', title: 'Skills', icon: Award },
    { id: 'education', title: 'Education', icon: GraduationCap },
    { id: 'review', title: 'Review', icon: Check }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const progress = ((getCurrentStepIndex() + 1) / steps.length) * 100;

  useEffect(() => {
    // Initialize with user data if available
    if (user) {
      setResumeData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          fullName: user.name || '',
          email: user.email || ''
        }
      }));
    }
  }, [user]);

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    } else {
      setCurrentStep('review');
    }
  };

  const prevStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const runATSCheck = () => {
    // Simulate ATS checking
    const checks: ATSCheck[] = [
      {
        id: '1',
        name: 'Contact Information Present',
        status: resumeData.contactInfo.fullName && resumeData.contactInfo.email && resumeData.contactInfo.phone ? 'pass' : 'fail',
        description: 'All essential contact information is included',
        recommendation: 'Ensure name, email, and phone number are clearly stated'
      },
      {
        id: '2',
        name: 'Standard Section Headers',
        status: 'pass',
        description: 'Using standard resume section headers (Experience, Education, Skills)',
        recommendation: ''
      },
      {
        id: '3',
        name: 'Work Experience Format',
        status: resumeData.experience.length > 0 ? 'pass' : 'fail',
        description: 'Work experience follows proper chronological format',
        recommendation: 'Add at least one work experience entry with dates and descriptions'
      },
      {
        id: '4',
        name: 'Skills Section',
        status: resumeData.skills.length >= 5 ? 'pass' : 'warning',
        description: 'Adequate number of relevant skills listed',
        recommendation: 'Include at least 5-8 relevant skills for better keyword matching'
      },
      {
        id: '5',
        name: 'Education Information',
        status: resumeData.education.length > 0 ? 'pass' : 'warning',
        description: 'Educational background is included',
        recommendation: 'Add your highest level of education'
      },
      {
        id: '6',
        name: 'Professional Summary',
        status: resumeData.summary.length >= 100 ? 'pass' : 'warning',
        description: 'Includes a compelling professional summary',
        recommendation: 'Write a 2-3 sentence summary highlighting your key qualifications'
      },
      {
        id: '7',
        name: 'Keyword Optimization',
        status: 'warning',
        description: 'Resume contains industry-relevant keywords',
        recommendation: 'Consider upgrading for AI-powered keyword optimization'
      },
      {
        id: '8',
        name: 'Formatting Consistency',
        status: 'pass',
        description: 'Consistent formatting and clean layout',
        recommendation: ''
      }
    ];

    const passCount = checks.filter(check => check.status === 'pass').length;
    const score = Math.round((passCount / checks.length) * 100);

    setAtsChecks(checks);
    setAtsScore(score);
    setCurrentStep('ats-report');
  };

  const downloadResume = () => {
    toast.success('Resume downloaded successfully!');
    // In a real implementation, this would generate and download a PDF
  };

  const updateContactInfo = (field: keyof ContactInfo, value: string) => {
    setResumeData(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, [field]: value }
    }));
  };

  const addExperience = () => {
    const newExperience: WorkExperience = {
      id: Date.now().toString(),
      jobTitle: '',
      companyName: '',
      city: '',
      state: '',
      startDate: '',
      endDate: '',
      isCurrentJob: false,
      description: ['']
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExperience]
    }));
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      degree: '',
      university: '',
      city: '',
      state: '',
      graduationDate: ''
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addSkill = (name: string, category: 'technical' | 'soft' | 'language') => {
    const newSkill: Skill = {
      name,
      category,
      proficiency: 'intermediate'
    };
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }));
  };

  const removeSkill = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Create Your Perfect Resume
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Build an ATS-friendly resume in minutes with our professional templates and built-in compatibility checker.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-semibold mb-2">ATS-Optimized</h3>
                <p className="text-sm text-muted-foreground">Designed to pass applicant tracking systems</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Professional Templates</h3>
                <p className="text-sm text-muted-foreground">Choose from expertly designed layouts</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-warning" />
                </div>
                <h3 className="font-semibold mb-2">Live Preview</h3>
                <p className="text-sm text-muted-foreground">See your resume update in real-time</p>
              </div>
            </div>

            <Button size="lg" onClick={nextStep} className="px-8">
              Start Building Your Resume
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        );

      case 'template':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">Choose Your Template</h2>
              <p className="text-lg text-muted-foreground">
                Select a professional template that matches your industry and style
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    resumeData.template === template.id ? 'ring-2 ring-primary border-primary' : ''
                  }`}
                  onClick={() => setResumeData(prev => ({ ...prev, template: template.id as any }))}
                >
                  <CardContent className="p-6">
                    <div className="aspect-[3/4] bg-muted rounded-lg mb-4 flex items-center justify-center">
                      <FileText className="w-16 h-16 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                    <div className="space-y-1">
                      {template.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-primary mr-2" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <Input
                    value={resumeData.contactInfo.fullName}
                    onChange={(e) => updateContactInfo('fullName', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address *</label>
                  <Input
                    type="email"
                    value={resumeData.contactInfo.email}
                    onChange={(e) => updateContactInfo('email', e.target.value)}
                    placeholder="john.doe@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <Input
                    type="tel"
                    value={resumeData.contactInfo.phone}
                    onChange={(e) => updateContactInfo('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input
                    value={resumeData.contactInfo.location}
                    onChange={(e) => updateContactInfo('location', e.target.value)}
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Link URL</label>
                  <Input
                    value={resumeData.contactInfo.linkedinUrl}
                    onChange={(e) => updateContactInfo('linkedinUrl', e.target.value)}
                    placeholder="Link.com/in/johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Portfolio URL</label>
                  <Input
                    value={resumeData.contactInfo.portfolioUrl}
                    onChange={(e) => updateContactInfo('portfolioUrl', e.target.value)}
                    placeholder="johndoe.com"
                  />
                </div>
              </div>
            </div>
            <div className="lg:block hidden">
              <ResumePreview resumeData={resumeData} />
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Professional Summary</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Summary</label>
                  <Textarea
                    value={resumeData.summary}
                    onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Write a compelling 2-3 sentence summary highlighting your key qualifications and career objectives..."
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Tip: Use action words and quantifiable achievements. Focus on what makes you unique.
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:block hidden">
              <ResumePreview resumeData={resumeData} />
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Work Experience</h2>
                <Button onClick={addExperience}>Add Experience</Button>
              </div>
              <div className="space-y-6">
                {resumeData.experience.map((exp, index) => (
                  <Card key={exp.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Job Title *</label>
                          <Input
                            value={exp.jobTitle}
                            onChange={(e) => updateExperience(exp.id, 'jobTitle', e.target.value)}
                            placeholder="Software Engineer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Company *</label>
                          <Input
                            value={exp.companyName}
                            onChange={(e) => updateExperience(exp.id, 'companyName', e.target.value)}
                            placeholder="Company Name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Start Date *</label>
                          <Input
                            type="month"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">End Date</label>
                          <Input
                            type="month"
                            value={exp.endDate}
                            onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                            disabled={exp.isCurrentJob}
                            placeholder={exp.isCurrentJob ? 'Present' : ''}
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={exp.isCurrentJob}
                            onChange={(e) => updateExperience(exp.id, 'isCurrentJob', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm">I currently work here</span>
                        </label>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                          value={exp.description.join('\n')}
                          onChange={(e) => updateExperience(exp.id, 'description', e.target.value.split('\n'))}
                          placeholder="• Developed and maintained web applications using React and Node.js&#10;• Collaborated with cross-functional teams to deliver high-quality software&#10;• Improved application performance by 30% through optimization"
                          rows={4}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeExperience(exp.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {resumeData.experience.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No work experience added yet</p>
                    <Button onClick={addExperience} className="mt-4">Add Your First Job</Button>
                  </div>
                )}
              </div>
            </div>
            <div className="lg:block hidden">
              <ResumePreview resumeData={resumeData} />
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Skills</h2>
              <div className="space-y-6">
                <SkillsInput 
                  skills={resumeData.skills} 
                  onAddSkill={addSkill} 
                  onRemoveSkill={removeSkill} 
                />
              </div>
            </div>
            <div className="lg:block hidden">
              <ResumePreview resumeData={resumeData} />
            </div>
          </div>
        );

      case 'education':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Education</h2>
                <Button onClick={addEducation}>Add Education</Button>
              </div>
              <div className="space-y-6">
                {resumeData.education.map((edu) => (
                  <Card key={edu.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Degree *</label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            placeholder="Bachelor of Science in Computer Science"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">University *</label>
                          <Input
                            value={edu.university}
                            onChange={(e) => updateEducation(edu.id, 'university', e.target.value)}
                            placeholder="University Name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Graduation Date</label>
                          <Input
                            type="month"
                            value={edu.graduationDate}
                            onChange={(e) => updateEducation(edu.id, 'graduationDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">GPA (Optional)</label>
                          <Input
                            value={edu.gpa || ''}
                            onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                            placeholder="3.8"
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEducation(edu.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {resumeData.education.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No education added yet</p>
                    <Button onClick={addEducation} className="mt-4">Add Education</Button>
                  </div>
                )}
              </div>
            </div>
            <div className="lg:block hidden">
              <ResumePreview resumeData={resumeData} />
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">Review Your Resume</h2>
              <p className="text-lg text-muted-foreground">
                Take a final look at your resume before downloading or checking ATS compatibility
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ResumePreview resumeData={resumeData} showFullPreview />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-primary mr-2" />
                      Resume Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={downloadResume} className="w-full" size="lg">
                      <Download className="w-5 h-5 mr-2" />
                      Download Resume
                    </Button>
                    <Button onClick={runATSCheck} variant="outline" className="w-full" size="lg">
                      <Zap className="w-5 h-5 mr-2" />
                      Check ATS Compatibility
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resume Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Template:</span>
                      <span className="font-medium capitalize">{resumeData.template}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Work Experience:</span>
                      <span className="font-medium">{resumeData.experience.length} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Education:</span>
                      <span className="font-medium">{resumeData.education.length} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Skills:</span>
                      <span className="font-medium">{resumeData.skills.length} skills</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case 'ats-report':
        return <ATSReport atsScore={atsScore} atsChecks={atsChecks} onDownload={downloadResume} onUpgrade={onUpgrade} />;

      default:
        return null;
    }
  };

  if (currentStep === 'welcome') {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <img src={(hirevifyLogo as any).src ?? hirevifyLogo} alt="HireVify" className="h-12" />
            </div>
          </div>
        </header>
        <main className="p-6">
          {renderStepContent()}
        </main>
      </div>
    );
  }

  if (currentStep === 'ats-report') {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setCurrentStep('review')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Review
              </Button>
              <img src={(hirevifyLogo as any).src ?? hirevifyLogo} alt="HireVify" className="h-12" />
            </div>
          </div>
        </header>
        <main className="p-6">
          {renderStepContent()}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <header className="bg-card border-b border-border p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={currentStep === 'template' ? onBack : prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 'template' ? 'Back to Dashboard' : 'Previous'}
              </Button>
              <img src={(hirevifyLogo as any).src ?? hirevifyLogo} alt="HireVify" className="h-12" />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Step {getCurrentStepIndex() + 1} of {steps.length}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Resume Builder Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {renderStepContent()}
        </div>
      </main>

      {/* Footer Navigation */}
      {currentStep !== 'welcome' && currentStep !== 'ats-report' && (
        <footer className="bg-card border-t border-border p-6">
          <div className="max-w-7xl mx-auto flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 'template'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button onClick={nextStep}>
              {currentStep === 'review' ? 'Complete Resume' : 'Save & Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}

// Resume Preview Component
function ResumePreview({ resumeData, showFullPreview = false }: { resumeData: ResumeData; showFullPreview?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{resumeData.contactInfo.fullName || 'Your Name'}</h2>
        <div className="text-sm text-gray-600 mt-2 space-y-1">
          {resumeData.contactInfo.email && <div>{resumeData.contactInfo.email}</div>}
          {resumeData.contactInfo.phone && <div>{resumeData.contactInfo.phone}</div>}
          {resumeData.contactInfo.location && <div>{resumeData.contactInfo.location}</div>}
        </div>
      </div>

      {resumeData.summary && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">Professional Summary</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{resumeData.summary}</p>
        </div>
      )}

      {resumeData.experience.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">Work Experience</h3>
          {resumeData.experience.slice(0, showFullPreview ? undefined : 2).map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-gray-900">{exp.jobTitle}</h4>
                <span className="text-sm text-gray-600">
                  {exp.startDate} - {exp.isCurrentJob ? 'Present' : exp.endDate}
                </span>
              </div>
              <p className="text-gray-700 font-medium mb-2">{exp.companyName}</p>
              {exp.description.length > 0 && (
                <ul className="text-sm text-gray-600 space-y-1">
                  {exp.description.slice(0, showFullPreview ? undefined : 2).map((desc, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{desc}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {resumeData.skills.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.slice(0, showFullPreview ? undefined : 8).map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {resumeData.education.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">Education</h3>
          {resumeData.education.map((edu) => (
            <div key={edu.id} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                  <p className="text-gray-700">{edu.university}</p>
                </div>
                <span className="text-sm text-gray-600">{edu.graduationDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Skills Input Component
function SkillsInput({ 
  skills, 
  onAddSkill, 
  onRemoveSkill 
}: {
  skills: Skill[];
  onAddSkill: (name: string, category: 'technical' | 'soft' | 'language') => void;
  onRemoveSkill: (index: number) => void;
}) {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<'technical' | 'soft' | 'language'>('technical');

  const handleAddSkill = () => {
    if (newSkillName.trim()) {
      onAddSkill(newSkillName.trim(), newSkillCategory);
      setNewSkillName('');
    }
  };

  const skillsByCategory = {
    technical: skills.filter(s => s.category === 'technical'),
    soft: skills.filter(s => s.category === 'soft'),
    language: skills.filter(s => s.category === 'language')
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          placeholder="Add a skill..."
          onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
        />
        <Select value={newSkillCategory} onValueChange={(value: any) => setNewSkillCategory(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="soft">Soft Skills</SelectItem>
            <SelectItem value="language">Language</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddSkill}>Add</Button>
      </div>

      {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
        categorySkills.length > 0 && (
          <div key={category}>
            <h4 className="font-medium mb-2 capitalize">{category} Skills</h4>
            <div className="flex flex-wrap gap-2">
              {categorySkills.map((skill, index) => {
                const originalIndex = skills.findIndex(s => s === skill);
                return (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2">
                    {skill.name}
                    <button
                      onClick={() => onRemoveSkill(originalIndex)}
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )
      ))}

      {skills.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No skills added yet</p>
        </div>
      )}
    </div>
  );
}

// ATS Report Component
function ATSReport({ 
  atsScore, 
  atsChecks, 
  onDownload,
  onUpgrade
}: {
  atsScore: number;
  atsChecks: ATSCheck[];
  onDownload: () => void;
  onUpgrade: () => void;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 75) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fail':
        return <X className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <Zap className="w-5 h-5 text-yellow-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">ATS Compatibility Report</h1>
        <p className="text-lg text-muted-foreground">
          Your resume has been analyzed for Applicant Tracking System compatibility
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-6 h-6 text-primary mr-2" />
                Overall ATS Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-center p-6 rounded-lg ${getScoreBackground(atsScore)}`}>
                <div className={`text-4xl font-bold ${getScoreColor(atsScore)} mb-2`}>
                  {atsScore}%
                </div>
                <p className="text-muted-foreground">
                  {atsScore >= 90 ? 'Excellent' : atsScore >= 75 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Checks */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {atsChecks.map((check) => (
                <div key={check.id} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(check.status)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">{check.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{check.description}</p>
                    {check.recommendation && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Tip:</strong> {check.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={onDownload} className="w-full" size="lg">
                <Download className="w-5 h-5 mr-2" />
                Download Resume
              </Button>
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Edit Resume
              </Button>
            </CardContent>
          </Card>

          {/* Premium Upgrade */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <Crown className="w-5 h-5 mr-2" />
                Unlock Premium Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-yellow-700 mb-4">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  AI-Powered Keyword Optimization
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Industry-Specific Templates
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Advanced ATS Analysis
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Custom Formatting Options
                </li>
              </ul>
              <Button onClick={onUpgrade} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                Upgrade Now
              </Button>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Passed Checks:</span>
                <span className="font-medium text-green-600">
                  {atsChecks.filter(c => c.status === 'pass').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Warnings:</span>
                <span className="font-medium text-yellow-600">
                  {atsChecks.filter(c => c.status === 'warning').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failed Checks:</span>
                <span className="font-medium text-red-600">
                  {atsChecks.filter(c => c.status === 'fail').length}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overall Score:</span>
                <span className={`font-bold ${getScoreColor(atsScore)}`}>
                  {atsScore}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}






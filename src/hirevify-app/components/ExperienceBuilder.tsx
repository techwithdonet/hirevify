import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Briefcase, Calendar, CheckCircle, Clock, Star, Users, Zap, DollarSign, Building, MapPin, Play, BookOpen, Award, TrendingUp, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';

interface ExperienceBuilderProps {
  onBack: () => void;
  onUpgrade: () => void;
}

interface TrialProject {
  id: string;
  title: string;
  company: string;
  companySize: string;
  location: string;
  duration: string;
  commitment: string;
  description: string;
  skillsRequired: string[];
  skillsGained: string[];
  paymentType: 'Unpaid' | 'Stipend' | 'Paid';
  payment?: string;
  difficulty: 'Entry Level' | 'Intermediate' | 'Advanced';
  applicants: number;
  mentorIncluded: boolean;
  referenceGuaranteed: boolean;
  category: string;
  postedDate: string;
  requirements: string[];
  deliverables: string[];
  learningOutcomes: string[];
  isSponsored?: boolean;
}

interface ExperienceRecord {
  id: string;
  projectId: string;
  status: 'applied' | 'accepted' | 'in_progress' | 'completed' | 'hired';
  startDate?: string;
  endDate?: string;
  rating?: number;
  feedback?: string;
  referenceUrl?: string;
  portfolioItems?: string[];
  nextOpportunity?: string;
}

const trialProjects: TrialProject[] = [
  {
    id: 'proj-1',
    title: 'Frontend Development - E-commerce Feature',
    company: 'TechStart Solutions',
    companySize: '50-200 employees',
    location: 'Remote',
    duration: '2 weeks',
    commitment: '20-25 hours/week',
    description: 'Build a responsive product comparison feature for our e-commerce platform. You\'ll work with our senior developers to implement modern React components and integrate with existing APIs.',
    skillsRequired: ['React', 'JavaScript', 'CSS', 'REST APIs'],
    skillsGained: ['E-commerce Development', 'Team Collaboration', 'Code Review Process', 'Agile Methodology'],
    paymentType: 'Stipend',
    payment: '$500',
    difficulty: 'Entry Level',
    applicants: 45,
    mentorIncluded: true,
    referenceGuaranteed: true,
    category: 'Frontend Development',
    postedDate: '2024-01-10',
    requirements: ['Basic React knowledge', 'Git/GitBranch experience', 'Available 20+ hours/week'],
    deliverables: ['Functional product comparison component', 'Unit tests', 'Documentation'],
    learningOutcomes: ['Production-level React development', 'Enterprise code standards', 'Team collaboration']
  },
  {
    id: 'proj-2',
    title: 'Data Analysis - Customer Insights Project',
    company: 'Growth Analytics Inc',
    companySize: '20-50 employees',
    location: 'Hybrid - San Francisco',
    duration: '3 weeks',
    commitment: '15-20 hours/week',
    description: 'Analyze customer behavior data to identify growth opportunities. You\'ll work with real datasets and present findings to the executive team.',
    skillsRequired: ['Python', 'Pandas', 'SQL', 'Data Visualization'],
    skillsGained: ['Business Intelligence', 'Executive Presentations', 'Customer Analytics', 'Stakeholder Communication'],
    paymentType: 'Paid',
    payment: '$1,200',
    difficulty: 'Intermediate',
    applicants: 32,
    mentorIncluded: true,
    referenceGuaranteed: true,
    category: 'Data Science',
    postedDate: '2024-01-08',
    requirements: ['Python data analysis experience', 'SQL proficiency', 'Portfolio of previous work'],
    deliverables: ['Data analysis report', 'Interactive dashboard', 'Executive presentation'],
    learningOutcomes: ['Business-focused analytics', 'Executive communication', 'Real-world data challenges'],
    isSponsored: true
  },
  {
    id: 'proj-3',
    title: 'UX Research - Mobile App Redesign',
    company: 'HealthTech Innovations',
    companySize: '100-500 employees',
    location: 'Remote',
    duration: '10 days',
    commitment: '25-30 hours/week',
    description: 'Conduct user research and usability testing for our health tracking mobile app. You\'ll interview users, analyze feedback, and create design recommendations.',
    skillsRequired: ['User Research', 'Figma', 'Usability Testing', 'Interview Skills'],
    skillsGained: ['Healthcare UX', 'Research Methodology', 'Stakeholder Management', 'Design Strategy'],
    paymentType: 'Stipend',
    payment: '$400',
    difficulty: 'Entry Level',
    applicants: 28,
    mentorIncluded: true,
    referenceGuaranteed: true,
    category: 'UX/UI Design',
    postedDate: '2024-01-12',
    requirements: ['Basic UX research knowledge', 'Figma proficiency', 'Strong communication skills'],
    deliverables: ['User research report', 'Usability testing results', 'Design recommendations'],
    learningOutcomes: ['Healthcare domain expertise', 'Research methodology', 'Design thinking process']
  },
  {
    id: 'proj-4',
    title: 'Marketing Analytics - Campaign Optimization',
    company: 'Digital Marketing Pro',
    companySize: '10-50 employees',
    location: 'Remote',
    duration: '2 weeks',
    commitment: '15-20 hours/week',
    description: 'Analyze performance of our digital marketing campaigns across multiple channels. Create optimization recommendations and implement A/B tests.',
    skillsRequired: ['Google Analytics', 'Excel/Sheets', 'Marketing Fundamentals', 'Data Analysis'],
    skillsGained: ['Campaign Management', 'A/B Testing', 'ROI Analysis', 'Marketing Strategy'],
    paymentType: 'Stipend',
    payment: '$300',
    difficulty: 'Entry Level',
    applicants: 38,
    mentorIncluded: true,
    referenceGuaranteed: true,
    category: 'Digital Marketing',
    postedDate: '2024-01-15',
    requirements: ['Google Analytics experience', 'Basic marketing knowledge', 'Analytical mindset'],
    deliverables: ['Campaign analysis report', 'Optimization recommendations', 'A/B test results'],
    learningOutcomes: ['Digital marketing strategy', 'Performance optimization', 'Data-driven decisions']
  },
  {
    id: 'proj-5',
    title: 'Backend API Development - Microservice',
    company: 'CloudNative Systems',
    companySize: '200+ employees',
    location: 'Remote',
    duration: '3 weeks',
    commitment: '25-30 hours/week',
    description: 'Develop a microservice for our cloud platform. You\'ll work with Docker, Kubernetes, and modern CI/CD pipelines while learning enterprise development practices.',
    skillsRequired: ['Node.js', 'Docker', 'APIs', 'Database Design'],
    skillsGained: ['Microservices Architecture', 'Cloud Development', 'DevOps Practices', 'Enterprise Patterns'],
    paymentType: 'Paid',
    payment: '$1,500',
    difficulty: 'Advanced',
    applicants: 18,
    mentorIncluded: true,
    referenceGuaranteed: true,
    category: 'Backend Development',
    postedDate: '2024-01-05',
    requirements: ['Node.js experience', 'Docker knowledge', 'API development skills', 'Cloud platform familiarity'],
    deliverables: ['Functional microservice', 'API documentation', 'Deployment scripts'],
    learningOutcomes: ['Enterprise architecture', 'Cloud-native development', 'DevOps integration'],
    isSponsored: true
  }
];

export function ExperienceBuilder({ onBack, onUpgrade }: ExperienceBuilderProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceRecords, setExperienceRecords] = useState<ExperienceRecord[]>([]);
  const [activeTab, setActiveTab] = useState('available');

  const categories = ['All', 'Frontend Development', 'Backend Development', 'UX/UI Design', 'Data Science', 'Digital Marketing'];

  useEffect(() => {
    // Simulate user's experience records
    setExperienceRecords([
      {
        id: '1',
        projectId: 'proj-1',
        status: 'completed',
        startDate: '2024-01-15',
        endDate: '2024-01-29',
        rating: 4.8,
        feedback: 'Exceptional work! Great attention to detail and excellent communication.',
        referenceUrl: 'https://Link.com/in/mentor-reference',
        portfolioItems: ['React Component Library', 'E-commerce Feature Demo'],
        nextOpportunity: 'Full-time Frontend Developer position'
      },
      {
        id: '2',
        projectId: 'proj-3',
        status: 'in_progress',
        startDate: '2024-02-01'
      }
    ]);
  }, []);

  const filteredProjects = trialProjects.filter(project => {
    const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.skillsRequired.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getUserExperience = (projectId: string) => {
    return experienceRecords.find(er => er.projectId === projectId);
  };

  const applyToProject = (projectId: string) => {
    const project = trialProjects.find(p => p.id === projectId);
    if (project) {
      toast.success(`Applied to ${project.title}! You'll hear back within 48 hours.`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Entry Level': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentBadge = (paymentType: string, payment?: string) => {
    switch (paymentType) {
      case 'Paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">{payment}</Badge>;
      case 'Stipend':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{payment}</Badge>;
      case 'Unpaid':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unpaid</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case 'accepted':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Accepted</Badge>;
      case 'hired':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Hired!</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Applied</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <img src={(hirevifyLogo as any).src ?? hirevifyLogo} alt="HireVify" className="h-16" />
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Briefcase className="w-3 h-3 mr-1" />
              Real Work Experience
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Target className="w-4 h-4 mr-2" />
            Gain Real Experience, No Experience Required
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Experience Builder Program
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Bridge the experience gap with short-term trial projects at real companies. 
            Gain experience, build your portfolio, and earn references that lead to full-time opportunities.
          </p>
          
          {/* Revolutionary Concept Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">Real Experience</div>
              <div className="text-sm text-muted-foreground">No Fake Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">Skills-First</div>
              <div className="text-sm text-muted-foreground">Merit-Based Matching</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">Bridge the Gap</div>
              <div className="text-sm text-muted-foreground">Experience Without Experience</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">Portfolio Ready</div>
              <div className="text-sm text-muted-foreground">Real Work Samples</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Available Projects</TabsTrigger>
            <TabsTrigger value="my-experience">My Experience</TabsTrigger>
            <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search projects, companies, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProjects.map((project) => {
                const userExperience = getUserExperience(project.id);
                return (
                  <Card key={project.id} className="relative">
                    {project.isSponsored && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Star className="w-3 h-3 mr-1" />
                          Sponsored
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="space-y-3">
                        <div>
                          <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Building className="w-4 h-4 mr-1" />
                            {project.company} â€¢ {project.companySize}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-1" />
                            {project.location}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getDifficultyColor(project.difficulty)}>
                            {project.difficulty}
                          </Badge>
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {project.duration}
                          </Badge>
                          {getPaymentBadge(project.paymentType, project.payment)}
                          {userExperience && getStatusBadge(userExperience.status)}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {project.description}
                      </p>

                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Skills Required</div>
                          <div className="flex flex-wrap gap-1">
                            {project.skillsRequired.map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">You'll Gain</div>
                          <div className="flex flex-wrap gap-1">
                            {project.skillsGained.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                {skill}
                              </Badge>
                            ))}
                            {project.skillsGained.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.skillsGained.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <div className="text-muted-foreground">Difficulty</div>
                            <div className="font-semibold text-blue-600">{project.difficulty}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Duration</div>
                            <div className="font-semibold text-green-600">{project.duration}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Type</div>
                            <div className="font-semibold flex items-center">
                              <Star className="w-3 h-3 text-yellow-500 mr-1" />
                              Trial Project
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {project.mentorIncluded && (
                            <div className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              Mentor Included
                            </div>
                          )}
                          {project.referenceGuaranteed && (
                            <div className="flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Reference Guaranteed
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {userExperience?.status === 'completed' ? (
                          <Button variant="outline" className="w-full">
                            <Award className="w-4 h-4 mr-2" />
                            View Experience Record
                          </Button>
                        ) : userExperience?.status === 'in_progress' ? (
                          <Button className="w-full">
                            <Play className="w-4 h-4 mr-2" />
                            Continue Project
                          </Button>
                        ) : userExperience ? (
                          <Button variant="outline" className="w-full" disabled>
                            {getStatusBadge(userExperience.status)}
                          </Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            onClick={() => applyToProject(project.id)}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Apply Now â€¢ {project.applicants} applied
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="my-experience" className="space-y-6">
            {experienceRecords.length > 0 ? (
              <div className="space-y-6">
                {experienceRecords.map((record) => {
                  const project = trialProjects.find(p => p.id === record.projectId);
                  if (!project) return null;

                  return (
                    <Card key={record.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                            <div className="text-sm text-muted-foreground mb-2">
                              {project.company} â€¢ {project.location}
                            </div>
                            {getStatusBadge(record.status)}
                          </div>
                          {record.rating && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary flex items-center">
                                <Star className="w-5 h-5 text-yellow-500 mr-1" />
                                {record.rating}
                              </div>
                              <div className="text-xs text-muted-foreground">Company Rating</div>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-medium text-muted-foreground">Duration</div>
                              <div className="text-sm">
                                {record.startDate && new Date(record.startDate).toLocaleDateString()} - 
                                {record.endDate ? new Date(record.endDate).toLocaleDateString() : 'In Progress'}
                              </div>
                            </div>
                            
                            {record.feedback && (
                              <div>
                                <div className="text-xs font-medium text-muted-foreground">Feedback</div>
                                <div className="text-sm italic">"{record.feedback}"</div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            {record.portfolioItems && (
                              <div>
                                <div className="text-xs font-medium text-muted-foreground">Portfolio Items</div>
                                <div className="space-y-1">
                                  {record.portfolioItems.map((item, index) => (
                                    <div key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {record.nextOpportunity && (
                              <div>
                                <div className="text-xs font-medium text-muted-foreground">Next Opportunity</div>
                                <div className="text-sm font-medium text-green-600">
                                  <TrendingUp className="w-3 h-3 inline mr-1" />
                                  {record.nextOpportunity}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {record.status === 'completed' && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Award className="w-4 h-4 mr-2" />
                                Download Certificate
                              </Button>
                              <Button variant="outline" size="sm">
                                Request Reference
                              </Button>
                              {record.nextOpportunity && (
                                <Button size="sm">
                                  Apply to Full-Time Role
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Experience Yet</h3>
                <p className="text-muted-foreground mb-6">Start building your experience with trial projects</p>
                <Button onClick={() => setActiveTab('available')}>
                  Browse Available Projects
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="how-it-works" className="space-y-8">
            {/* Process Steps */}
            <Card>
              <CardHeader>
                <CardTitle>How the Experience Builder Program Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <h4 className="font-semibold mb-2">Browse & Apply</h4>
                    <p className="text-sm text-muted-foreground">Find projects that match your skills and career goals</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <h4 className="font-semibold mb-2">Get Matched</h4>
                    <p className="text-sm text-muted-foreground">Companies review applications and select candidates</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <h4 className="font-semibold mb-2">Complete Project</h4>
                    <p className="text-sm text-muted-foreground">Work on real projects with mentorship and support</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary font-bold">4</span>
                    </div>
                    <h4 className="font-semibold mb-2">Build Portfolio</h4>
                    <p className="text-sm text-muted-foreground">Gain experience, references, and portfolio pieces</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-primary" />
                    For Candidates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Real Work Experience</div>
                      <div className="text-sm text-muted-foreground">Work on actual business projects with real impact</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Professional References</div>
                      <div className="text-sm text-muted-foreground">Get verified references from industry professionals</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Portfolio Building</div>
                      <div className="text-sm text-muted-foreground">Create tangible work samples for your portfolio</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Pathway to Full-Time</div>
                      <div className="text-sm text-muted-foreground">40% of participants get full-time offers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="w-5 h-5 mr-2 text-primary" />
                    For Companies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Risk-Free Hiring</div>
                      <div className="text-sm text-muted-foreground">Evaluate talent through real work before hiring</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Cost-Effective Projects</div>
                      <div className="text-sm text-muted-foreground">Get work done at a fraction of consulting costs</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Fresh Perspectives</div>
                      <div className="text-sm text-muted-foreground">Access diverse talent with innovative ideas</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Social Impact</div>
                      <div className="text-sm text-muted-foreground">Help bridge the experience gap in tech</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Success Stories */}
            <Card>
              <CardHeader>
                <CardTitle>Success Stories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
                    <h4 className="font-semibold mb-2">Sarah Chen</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      "Completed 3 trial projects and landed a full-time role at a Series B startup. The experience was invaluable!"
                    </p>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Frontend Developer at TechCorp
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
                    <h4 className="font-semibold mb-2">Marcus Johnson</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      "As a career switcher, these projects gave me the confidence and portfolio I needed to transition into UX."
                    </p>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      UX Designer at DesignStudio
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
                    <h4 className="font-semibold mb-2">Alex Rodriguez</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      "The mentorship and real-world experience helped me understand what working in data science actually looks like."
                    </p>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      Data Scientist at Analytics Pro
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="text-center py-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Build Your Experience?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Start your journey from "no experience required" to "experienced professional"
                </p>
                <Button size="lg" onClick={() => setActiveTab('available')}>
                  <Briefcase className="w-5 h-5 mr-2" />
                  Browse Trial Projects
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}








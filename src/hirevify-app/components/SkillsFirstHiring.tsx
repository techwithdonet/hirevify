import { useState } from 'react';
import { ArrowLeft, Target, Users, TrendingUp, Award, CheckCircle, Play, BookOpen, Lightbulb, BarChart3, Filter, Search, Plus, Crown, Zap, Brain, Eye, Download, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface SkillsFirstHiringProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

interface SkillsFramework {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  roles: string[];
  assessmentCount: number;
  isActive: boolean;
}

interface HiringInsight {
  id: string;
  title: string;
  description: string;
  impact: string;
  type: 'strategy' | 'metric' | 'best-practice';
  category: string;
  actionable: boolean;
}

export function SkillsFirstHiring({ onBack, onUpgrade }: SkillsFirstHiringProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Core Skills Frameworks (cleaned of demo data)
  const [skillsFrameworks] = useState<SkillsFramework[]>([
    {
      id: 'frontend-core',
      title: 'Frontend Development Core',
      description: 'Essential skills for modern frontend development roles',
      category: 'Engineering',
      skills: ['JavaScript', 'React', 'TypeScript', 'CSS', 'HTML', 'Git'],
      roles: ['Frontend Developer', 'UI Developer', 'Web Developer'],
      assessmentCount: 0,
      isActive: false
    },
    {
      id: 'backend-core',
      title: 'Backend Development Core',
      description: 'Fundamental skills for backend engineering positions',
      category: 'Engineering',
      skills: ['Node.js', 'API Design', 'Database Design', 'Security', 'Testing'],
      roles: ['Backend Developer', 'Software Engineer', 'API Developer'],
      assessmentCount: 0,
      isActive: false
    },
    {
      id: 'product-core',
      title: 'Product Management Essentials',
      description: 'Key competencies for product management roles',
      category: 'Product',
      skills: ['Product Strategy', 'User Research', 'Analytics', 'Roadmapping', 'Stakeholder Management'],
      roles: ['Product Manager', 'Product Owner', 'Product Analyst'],
      assessmentCount: 0,
      isActive: false
    },
    {
      id: 'design-core',
      title: 'UX/UI Design Fundamentals',
      description: 'Core design skills for user experience roles',
      category: 'Design',
      skills: ['User Research', 'Prototyping', 'Design Systems', 'Figma', 'Usability Testing'],
      roles: ['UX Designer', 'UI Designer', 'Product Designer'],
      assessmentCount: 0,
      isActive: false
    }
  ]);

  // Hiring Insights (educational content, not demo data)
  const hiringInsights: HiringInsight[] = [
    {
      id: 'skills-vs-degrees',
      title: 'Skills vs. Degrees: The Paradigm Shift',
      description: 'Why focusing on demonstrable skills leads to better hiring outcomes than degree requirements.',
      impact: 'Increases candidate pool by 40% while improving hire quality',
      type: 'strategy',
      category: 'Strategy',
      actionable: true
    },
    {
      id: 'assessment-bias',
      title: 'Reducing Unconscious Bias in Hiring',
      description: 'How skills-based assessments help eliminate bias in the hiring process.',
      impact: 'Improves diversity metrics by 35% across technical roles',
      type: 'best-practice',
      category: 'Diversity',
      actionable: true
    },
    {
      id: 'time-to-hire',
      title: 'Accelerating Time-to-Hire',
      description: 'Skills assessments streamline the screening process and reduce interview rounds.',
      impact: 'Reduces average time-to-hire from 45 to 28 days',
      type: 'metric',
      category: 'Efficiency',
      actionable: true
    },
    {
      id: 'candidate-experience',
      title: 'Enhancing Candidate Experience',
      description: 'How transparent skills evaluation improves the candidate journey.',
      impact: 'Increases offer acceptance rate by 25%',
      type: 'best-practice',
      category: 'Experience',
      actionable: true
    }
  ];

  const categories = ['all', 'Engineering', 'Product', 'Design', 'Marketing', 'Sales'];

  const filteredFrameworks = skillsFrameworks.filter(framework => {
    const matchesCategory = selectedCategory === 'all' || framework.category === selectedCategory;
    const matchesSearch = framework.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         framework.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const createSkillsFramework = () => {
    toast.info('Skills framework creation available in Pro plans');
    if (onUpgrade) onUpgrade();
  };

  const activateFramework = (frameworkId: string) => {
    toast.info('Framework activation available in Pro plans');
    if (onUpgrade) onUpgrade();
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Skills-First Hiring
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-4">Transform Your Hiring with Skills-Based Approach</h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
                Move beyond traditional resume screening to focus on what truly matters - the skills candidates can demonstrate. 
                Build better teams faster with data-driven, skills-first hiring strategies.
              </p>
              <div className="flex gap-4">
                <Button onClick={createSkillsFramework} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Skills Framework
                </Button>
                <Button variant="outline" size="lg">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Learn Best Practices
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-64 h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-16 h-16 text-primary/60" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold">Better Quality Hires</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Focus on demonstrable skills rather than credentials to identify candidates who can actually perform the job.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold">Expanded Talent Pool</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Discover qualified candidates from non-traditional backgrounds who have the skills but lack conventional credentials.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold">Faster Hiring Process</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Streamline screening with skills assessments and reduce time spent on unqualified candidates.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-primary" />
            Getting Started with Skills-First Hiring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">1. Define Your Skills Framework</h4>
              <p className="text-sm text-muted-foreground">
                Identify the core skills needed for each role. Focus on must-have technical skills and essential soft skills.
              </p>
              <Button variant="outline" size="sm" onClick={createSkillsFramework}>
                Create Framework
              </Button>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">2. Build Skills Assessments</h4>
              <p className="text-sm text-muted-foreground">
                Create practical assessments that test real-world application of skills rather than theoretical knowledge.
              </p>
              <Button variant="outline" size="sm">
                Build Assessment
              </Button>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">3. Remove Degree Requirements</h4>
              <p className="text-sm text-muted-foreground">
                Audit job descriptions and remove unnecessary degree requirements that don't correlate with job performance.
              </p>
              <Button variant="outline" size="sm">
                Audit Job Posts
              </Button>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">4. Train Your Team</h4>
              <p className="text-sm text-muted-foreground">
                Educate hiring managers on evaluating candidates based on skills demonstration rather than background.
              </p>
              <Button variant="outline" size="sm">
                Access Training
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFrameworks = () => (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Skills Frameworks</h2>
          <p className="text-muted-foreground">Define and manage skills requirements for different roles</p>
        </div>
        <Button onClick={createSkillsFramework}>
          <Plus className="w-4 h-4 mr-2" />
          Create Framework
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search frameworks or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Frameworks Grid */}
      {filteredFrameworks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Skills Frameworks Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'all' ? 
                'No frameworks match your current filters.' :
                'Create your first skills framework to get started with skills-based hiring.'
              }
            </p>
            <Button onClick={createSkillsFramework}>
              <Plus className="w-4 h-4 mr-2" />
              Create Skills Framework
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFrameworks.map((framework) => (
            <Card key={framework.id} className={framework.isActive ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{framework.title}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {framework.category}
                    </Badge>
                  </div>
                  {framework.isActive && (
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {framework.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Core Skills</h5>
                    <div className="flex flex-wrap gap-1">
                      {framework.skills.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {framework.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{framework.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2">Target Roles</h5>
                    <p className="text-xs text-muted-foreground">
                      {framework.roles.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant={framework.isActive ? "outline" : "default"}
                    className="flex-1"
                    onClick={() => activateFramework(framework.id)}
                  >
                    {framework.isActive ? 'Configure' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Hiring Insights & Best Practices</h2>
        <p className="text-muted-foreground">
          Learn from industry research and proven strategies for skills-based hiring
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hiringInsights.map((insight) => (
          <Card key={insight.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {insight.type.replace('-', ' ')}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {insight.category}
                    </Badge>
                  </div>
                </div>
                {insight.actionable && (
                  <Badge className="bg-green-100 text-green-800">
                    Actionable
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {insight.description}
              </p>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <h5 className="text-sm font-medium text-blue-800 mb-1">Impact</h5>
                <p className="text-sm text-blue-700">{insight.impact}</p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Read More
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Download className="w-5 h-5 mb-2 text-primary" />
              <div className="text-left">
                <h5 className="font-medium">Skills-Based Hiring Guide</h5>
                <p className="text-xs text-muted-foreground">Complete implementation guide</p>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <BarChart3 className="w-5 h-5 mb-2 text-primary" />
              <div className="text-left">
                <h5 className="font-medium">Industry Benchmarks</h5>
                <p className="text-xs text-muted-foreground">Compare your metrics</p>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Play className="w-5 h-5 mb-2 text-primary" />
              <div className="text-left">
                <h5 className="font-medium">Video Training Series</h5>
                <p className="text-xs text-muted-foreground">Expert-led workshops</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
            <div>
              <h1 className="text-2xl font-bold text-foreground">Skills-First Hiring</h1>
              <p className="text-sm text-muted-foreground">
                Transform your hiring process with skills-based strategies
              </p>
            </div>
          </div>
          
          <Button onClick={onUpgrade} className="hidden sm:flex">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="frameworks">Skills Frameworks</TabsTrigger>
            <TabsTrigger value="insights">Insights & Best Practices</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{renderOverview()}</TabsContent>
          <TabsContent value="frameworks">{renderFrameworks()}</TabsContent>
          <TabsContent value="insights">{renderInsights()}</TabsContent>
        </Tabs>
      </main>
    </div>
  );
}








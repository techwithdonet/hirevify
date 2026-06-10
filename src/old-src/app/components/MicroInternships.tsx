import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, DollarSign, Users, Star, CheckCircle, Play, Building, MapPin, Zap, Award, Target, TrendingUp, Timer, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import { useAuth } from './AuthProvider';
import hirevifyLogo from 'figma:asset/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';

// Import from separate files
import { microInternships, categories, sortOptions, statsData } from './micro-internships/constants';
import { MicroInternshipsProps, Application } from './micro-internships/types';
import { getDifficultyColor, getStatusBadge, filterInternships, getMockApplications } from './micro-internships/utils';

export function MicroInternships({ onBack, onUpgrade }: MicroInternshipsProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState('available');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    setApplications(getMockApplications());
  }, []);

  const filteredInternships = filterInternships(microInternships, selectedCategory, searchTerm, sortBy);

  const getUserApplication = (internshipId: string) => {
    return applications.find(app => app.internshipId === internshipId);
  };

  const applyToInternship = (internshipId: string) => {
    const internship = microInternships.find(i => i.id === internshipId);
    if (internship) {
      toast.success(`Applied to ${internship.title}! You'll hear back within 24 hours.`);
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
            <img src={hirevifyLogo} alt="HireVify" className="h-12" />
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Timer className="w-3 h-3 mr-1" />
              Quick Experience Wins
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4 mr-2" />
            Rapid Skill Building & Income
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Micro-Internships
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Complete short-term projects (1-5 days) that build your skills, portfolio, and network. 
            Perfect for students, career switchers, and anyone looking to gain quick wins.
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Available Projects</TabsTrigger>
            <TabsTrigger value="my-applications">My Applications</TabsTrigger>
            <TabsTrigger value="about">About Micro-Internships</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by title, company, or skills..."
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
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Internships Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredInternships.map((internship) => {
                const userApp = getUserApplication(internship.id);
                const statusBadge = userApp ? getStatusBadge(userApp.status) : null;
                
                return (
                  <Card key={internship.id} className="relative">
                    {/* Status Badges */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {internship.isFeatured && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {internship.isUrgent && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    
                    <CardHeader>
                      <div className="space-y-3">
                        <div>
                          <CardTitle className="text-lg mb-2 pr-20">{internship.title}</CardTitle>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Building className="w-4 h-4 mr-1" />
                            {internship.company}
                            <Star className="w-3 h-3 ml-2 mr-1 text-yellow-500" />
                            {internship.companyRating}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-1" />
                            {internship.isRemote ? 'Remote' : internship.location}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getDifficultyColor(internship.difficulty)}>
                            {internship.difficulty}
                          </Badge>
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {internship.duration}
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <DollarSign className="w-3 h-3 mr-1" />
                            ${internship.payment}
                          </Badge>
                          {statusBadge && (
                            <Badge className={statusBadge.className}>
                              {statusBadge.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {internship.description}
                      </p>

                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Skills Required</div>
                          <div className="flex flex-wrap gap-1">
                            {internship.skillsRequired.slice(0, 4).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {internship.skillsRequired.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{internship.skillsRequired.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-muted-foreground">Payment</div>
                            <div className="font-semibold text-green-600">${internship.payment}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Applied</div>
                            <div className="font-semibold">{internship.applicants}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {userApp?.status === 'completed' ? (
                          <Button variant="outline" className="w-full">
                            <Award className="w-4 h-4 mr-2" />
                            View Results
                          </Button>
                        ) : userApp?.status === 'accepted' ? (
                          <Button className="w-full">
                            <Play className="w-4 h-4 mr-2" />
                            Start Project
                          </Button>
                        ) : userApp ? (
                          <Button variant="outline" className="w-full" disabled>
                            {statusBadge?.label}
                          </Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            onClick={() => applyToInternship(internship.id)}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Apply Now
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="my-applications" className="space-y-6">
            {applications.length > 0 ? (
              <div className="space-y-6">
                {applications.map((application) => {
                  const internship = microInternships.find(i => i.id === application.internshipId);
                  if (!internship) return null;

                  const statusBadge = getStatusBadge(application.status);

                  return (
                    <Card key={application.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg mb-2">{internship.title}</CardTitle>
                            <div className="text-sm text-muted-foreground mb-2">
                              {internship.company} • ${internship.payment}
                            </div>
                            <Badge className={statusBadge.className}>
                              {statusBadge.label}
                            </Badge>
                          </div>
                          {application.rating && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary flex items-center">
                                <Star className="w-5 h-5 text-yellow-500 mr-1" />
                                {application.rating}
                              </div>
                              <div className="text-xs text-muted-foreground">Rating</div>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">Applied Date</div>
                            <div className="text-sm">{new Date(application.appliedDate).toLocaleDateString()}</div>
                          </div>
                          
                          {application.feedback && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground">Feedback</div>
                              <div className="text-sm italic">"{application.feedback}"</div>
                            </div>
                          )}

                          {application.nextSteps && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground">Next Steps</div>
                              <ul className="text-sm space-y-1">
                                {application.nextSteps.map((step, index) => (
                                  <li key={index} className="flex items-center">
                                    <CheckCircle className="w-3 h-3 text-green-600 mr-2" />
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Timer className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                <p className="text-muted-foreground mb-6">Start applying to micro-internships to build your experience</p>
                <Button onClick={() => setActiveTab('available')}>
                  Browse Available Projects
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="space-y-8">
            {/* About Content */}
            <Card>
              <CardHeader>
                <CardTitle>What are Micro-Internships?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Micro-internships are short-term, project-based work experiences that typically last 1-5 days. 
                  They're designed to give students and career switchers quick wins while building real skills and professional connections.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-primary" />
                      Benefits for You
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        Quick income while learning
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        Real work experience for your resume
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        Professional references
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        Portfolio building
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        Network with companies
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-primary" />
                      How It Works
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">1</span>
                        Browse and apply to projects
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">2</span>
                        Get selected within 24 hours
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">3</span>
                        Complete the project (1-5 days)
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">4</span>
                        Get paid and receive feedback
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="text-center py-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Start Your First Micro-Internship?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join thousands of students and professionals building skills through short-term projects
                </p>
                <Button size="lg" onClick={() => setActiveTab('available')}>
                  <Timer className="w-5 h-5 mr-2" />
                  Browse Projects
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
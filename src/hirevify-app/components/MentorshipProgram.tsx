import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Star, MessageCircle, Calendar, Award, Target, TrendingUp, Clock, BookOpen, CheckCircle, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';

interface MentorshipProgramProps {
  onBack: () => void;
  onUpgrade: () => void;
}

interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  expertise: string[];
  experience: string;
  rating: number;
  totalMentees: number;
  successRate: number;
  bio: string;
  availability: 'High' | 'Medium' | 'Low';
  pricePerSession: number;
  responseTime: string;
  languages: string[];
  sessionFormats: string[];
  isPremium?: boolean;
}

interface MentorshipMatch {
  id: string;
  mentorId: string;
  status: 'pending' | 'matched' | 'active' | 'completed';
  startDate?: string;
  nextSession?: string;
  totalSessions: number;
  progress: {
    skillsDeveloped: string[];
    goalsCompleted: number;
    totalGoals: number;
  };
}

const availableMentors: Mentor[] = [
  {
    id: 'mentor-1',
    name: 'Sarah Chen',
    title: 'Senior Software Engineer',
    company: 'Google',
    expertise: ['React', 'System Design', 'Career Growth', 'Technical Leadership'],
    experience: '8 years',
    rating: 4.9,
    totalMentees: 47,
    successRate: 92,
    bio: 'Passionate about helping developers transition from junior to senior roles. I focus on technical skills, system thinking, and career navigation.',
    availability: 'Medium',
    pricePerSession: 150,
    responseTime: '< 24 hours',
    languages: ['English', 'Mandarin'],
    sessionFormats: ['1-on-1 Video', 'Code Review', 'Career Planning']
  },
  {
    id: 'mentor-2',
    name: 'Marcus Johnson',
    title: 'Product Design Lead',
    company: 'Airbnb',
    expertise: ['UX Design', 'Design Systems', 'User Research', 'Portfolio Building'],
    experience: '10 years',
    rating: 4.8,
    totalMentees: 63,
    successRate: 88,
    bio: 'Helping designers build strong portfolios and land their dream jobs. I cover everything from design fundamentals to interview preparation.',
    availability: 'High',
    pricePerSession: 120,
    responseTime: '< 12 hours',
    languages: ['English', 'Spanish'],
    sessionFormats: ['Portfolio Review', 'Design Critique', 'Interview Prep'],
    isPremium: true
  },
  {
    id: 'mentor-3',
    name: 'Dr. Emily Rodriguez',
    title: 'Data Science Manager',
    company: 'Microsoft',
    expertise: ['Machine Learning', 'Data Analysis', 'Python', 'Career Transition'],
    experience: '12 years',
    rating: 4.9,
    totalMentees: 38,
    successRate: 95,
    bio: 'Former academic turned industry leader. I specialize in helping people transition into data science and advance their technical careers.',
    availability: 'Low',
    pricePerSession: 200,
    responseTime: '< 48 hours',
    languages: ['English', 'Spanish'],
    sessionFormats: ['Technical Mentoring', 'Project Review', 'Career Strategy']
  },
  {
    id: 'mentor-4',
    name: 'Alex Thompson',
    title: 'Marketing Director',
    company: 'HubSpot',
    expertise: ['Digital Marketing', 'Growth Strategy', 'Content Marketing', 'Analytics'],
    experience: '7 years',
    rating: 4.7,
    totalMentees: 52,
    successRate: 87,
    bio: 'Growth-focused marketer with experience scaling startups and enterprises. I help marketers develop strategic thinking and execution skills.',
    availability: 'High',
    pricePerSession: 100,
    responseTime: '< 6 hours',
    languages: ['English'],
    sessionFormats: ['Strategy Sessions', 'Campaign Review', 'Skills Development']
  }
];

export function MentorshipProgram({ onBack, onUpgrade }: MentorshipProgramProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedExpertise, setSelectedExpertise] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [mentorshipMatches, setMentorshipMatches] = useState<MentorshipMatch[]>([]);

  const expertiseAreas = ['All', 'React', 'UX Design', 'Machine Learning', 'Digital Marketing', 'System Design', 'Career Growth'];
  const availabilityOptions = ['All', 'High', 'Medium', 'Low'];

  useEffect(() => {
    // Mock mentorship data
    setMentorshipMatches([
      {
        id: '1',
        mentorId: 'mentor-2',
        status: 'active',
        startDate: '2024-01-15',
        nextSession: '2024-02-20T15:00:00',
        totalSessions: 4,
        progress: {
          skillsDeveloped: ['Portfolio Development', 'Design Systems', 'User Research'],
          goalsCompleted: 3,
          totalGoals: 5
        }
      }
    ]);
  }, []);

  const filteredMentors = availableMentors.filter(mentor => {
    const matchesExpertise = selectedExpertise === 'All' || mentor.expertise.includes(selectedExpertise);
    const matchesAvailability = selectedAvailability === 'All' || mentor.availability === selectedAvailability;
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.expertise.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         mentor.company.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesExpertise && matchesAvailability && matchesSearch;
  });

  const requestMentorship = (mentorId: string, isPremium?: boolean) => {
    if (isPremium) {
      toast.info('This mentor requires a premium subscription!');
      onUpgrade();
      return;
    }

    const mentor = availableMentors.find(m => m.id === mentorId);
    if (mentor) {
      toast.success(`Mentorship request sent to ${mentor.name}! They'll respond within ${mentor.responseTime}.`);
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'High': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'matched': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserMatch = (mentorId: string) => {
    return mentorshipMatches.find(match => match.mentorId === mentorId);
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
            <img src={(hirevifyLogo as any).src ?? hirevifyLogo} alt="HireVify" className="h-12" />
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Users className="w-3 h-3 mr-1" />
              1-on-1 Guidance
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Target className="w-4 h-4 mr-2" />
            Accelerate Your Career Growth
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Mentorship Program
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Get 1-on-1 guidance from industry experts who've been where you want to go. 
            Accelerate your career with personalized mentorship and proven strategies.
          </p>
          
          {/* Success Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">500+</div>
              <div className="text-sm text-muted-foreground">Expert Mentors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">92%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">3.2x</div>
              <div className="text-sm text-muted-foreground">Faster Promotion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">$15k+</div>
              <div className="text-sm text-muted-foreground">Avg Salary Increase</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse Mentors</TabsTrigger>
            <TabsTrigger value="my-mentorship">My Mentorship</TabsTrigger>
            <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by mentor name, company, or expertise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expertiseAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availabilityOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mentors Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredMentors.map((mentor) => {
                const userMatch = getUserMatch(mentor.id);
                return (
                  <Card key={mentor.id} className="relative">
                    {mentor.isPremium && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Star className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                    )}

                    <CardHeader>
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="text-lg font-semibold">
                            {mentor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{mentor.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mb-2">
                            {mentor.title} at {mentor.company}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-500 mr-1" />
                              {mentor.rating}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 text-gray-500 mr-1" />
                              {mentor.totalMentees} mentees
                            </div>
                            <div className="flex items-center">
                              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                              {mentor.successRate}% success
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {mentor.bio}
                      </p>

                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Expertise</div>
                          <div className="flex flex-wrap gap-1">
                            {mentor.expertise.slice(0, 4).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {mentor.expertise.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{mentor.expertise.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <div className="text-muted-foreground">Experience</div>
                            <div className="font-medium">{mentor.experience}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Response</div>
                            <div className="font-medium">{mentor.responseTime}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Price</div>
                            <div className="font-medium">${mentor.pricePerSession}/session</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge className={getAvailabilityColor(mentor.availability)}>
                            {mentor.availability} Availability
                          </Badge>
                          {userMatch && (
                            <Badge className={getStatusColor(userMatch.status)}>
                              {userMatch.status.charAt(0).toUpperCase() + userMatch.status.slice(1)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {userMatch?.status === 'active' ? (
                          <Button className="w-full">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Continue Mentorship
                          </Button>
                        ) : userMatch?.status === 'pending' ? (
                          <Button variant="outline" className="w-full" disabled>
                            Request Pending
                          </Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            onClick={() => requestMentorship(mentor.id, mentor.isPremium)}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Request Mentorship
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="my-mentorship" className="space-y-6">
            {mentorshipMatches.length > 0 ? (
              <div className="space-y-6">
                {mentorshipMatches.map((match) => {
                  const mentor = availableMentors.find(m => m.id === match.mentorId);
                  if (!mentor) return null;

                  return (
                    <Card key={match.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback>
                                {mentor.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{mentor.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {mentor.title} at {mentor.company}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(match.status)}>
                            {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent>
                        {match.status === 'active' && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-semibold mb-3">Progress Overview</h4>
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span>Goals Completed</span>
                                      <span>{match.progress.goalsCompleted}/{match.progress.totalGoals}</span>
                                    </div>
                                    <Progress 
                                      value={(match.progress.goalsCompleted / match.progress.totalGoals) * 100} 
                                      className="h-2" 
                                    />
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted-foreground mb-1">Total Sessions</div>
                                    <div className="text-lg font-semibold">{match.totalSessions}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted-foreground mb-1">Next Session</div>
                                    <div className="text-sm font-medium">
                                      {match.nextSession ? new Date(match.nextSession).toLocaleDateString() : 'Not scheduled'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-3">Skills Developed</h4>
                                <div className="flex flex-wrap gap-2">
                                  {match.progress.skillsDeveloped.map((skill, index) => (
                                    <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Button>
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Message Mentor
                              </Button>
                              <Button variant="outline">
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule Session
                              </Button>
                              <Button variant="outline">
                                <BookOpen className="w-4 h-4 mr-2" />
                                View Resources
                              </Button>
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
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Mentorships</h3>
                <p className="text-muted-foreground mb-6">Connect with a mentor to accelerate your career growth</p>
                <Button onClick={() => setActiveTab('browse')}>
                  Browse Mentors
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="how-it-works" className="space-y-8">
            {/* Process Steps */}
            <Card>
              <CardHeader>
                <CardTitle>How Mentorship Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <h4 className="font-semibold mb-2">Choose Your Mentor</h4>
                    <p className="text-sm text-muted-foreground">Browse expert mentors and find someone who matches your goals</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <h4 className="font-semibold mb-2">Get Matched</h4>
                    <p className="text-sm text-muted-foreground">Connect with your mentor and set up your mentorship goals</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <h4 className="font-semibold mb-2">Regular Sessions</h4>
                    <p className="text-sm text-muted-foreground">Meet regularly for guidance, feedback, and skill development</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary font-bold">4</span>
                    </div>
                    <h4 className="font-semibold mb-2">Achieve Goals</h4>
                    <p className="text-sm text-muted-foreground">Track progress and celebrate career milestones together</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-primary" />
                    What You'll Gain
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Personalized Career Guidance</div>
                      <div className="text-sm text-muted-foreground">Get advice tailored to your specific goals and situation</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Industry Insights</div>
                      <div className="text-sm text-muted-foreground">Learn from someone who's succeeded in your target role</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Skill Development</div>
                      <div className="text-sm text-muted-foreground">Get feedback and guidance on technical and soft skills</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Network Expansion</div>
                      <div className="text-sm text-muted-foreground">Connect with professionals in your field</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                    Success Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Job Placement Success</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Salary Increase</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Skills Improvement</span>
                        <span className="font-medium">96%</span>
                      </div>
                      <Progress value={96} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Career Satisfaction</span>
                        <span className="font-medium">89%</span>
                      </div>
                      <Progress value={89} className="h-2" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-l-4 border-primary pl-4">
                    <p className="text-sm italic mb-3">
                      "My mentor helped me transition from marketing to UX design in just 6 months. 
                      The personalized guidance and portfolio reviews were invaluable."
                    </p>
                    <div className="text-sm">
                      <div className="font-semibold">Jessica Park</div>
                      <div className="text-muted-foreground">UX Designer at Spotify</div>
                      <div className="text-green-600 mt-1">Salary increase: +$25,000</div>
                    </div>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm italic mb-3">
                      "Working with my mentor gave me the confidence and skills to land a senior developer role. 
                      The technical guidance was exactly what I needed."
                    </p>
                    <div className="text-sm">
                      <div className="font-semibold">David Chen</div>
                      <div className="text-muted-foreground">Senior Developer at Netflix</div>
                      <div className="text-green-600 mt-1">Promotion in 8 months</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="text-center py-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Accelerate Your Career?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Connect with expert mentors who can guide you to your next career milestone
                </p>
                <Button size="lg" onClick={() => setActiveTab('browse')}>
                  <Users className="w-5 h-5 mr-2" />
                  Find Your Mentor
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}






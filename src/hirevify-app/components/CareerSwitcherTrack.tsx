import { useState, useEffect } from 'react';
import { ArrowLeft, Target, BookOpen, Award, CheckCircle, Play, Calendar, Users, Clock, Star, Badge as BadgeIcon, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import hirevifyLogo from '../../assets/fcf1f3e4c46a5e1365f68b3abceb946b2f0a4c3c.png';

// Import from separate files
import { learningPaths, successStories, statsData } from './career-switcher/constants';
import { CareerSwitcherTrackProps, UserProgress, LearningPath } from './career-switcher/types';
import { getDifficultyColor, getProgressPercentage, getMockUserProgress } from './career-switcher/utils';

export function CareerSwitcherTrack({ onBack, onUpgrade }: CareerSwitcherTrackProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('paths');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    // Simulate user progress
    setUserProgress(getMockUserProgress());
  }, []);

  const enrollInPath = (pathId: string, isPremium?: boolean) => {
    if (isPremium) {
      toast.info('This is a premium learning path. Upgrade to access!');
      onUpgrade();
      return;
    }

    const path = learningPaths.find(p => p.id === pathId);
    if (path) {
      toast.success(`Enrolled in ${path.title}! Your learning journey begins now.`);
    }
  };

  const continueLearning = () => {
    toast.success('Continuing your learning journey...');
  };

  const getCurrentPath = (): LearningPath | null => {
    if (!userProgress) return null;
    return learningPaths.find(p => p.id === userProgress.pathId) || null;
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
              <BookOpen className="w-3 h-3 mr-1" />
              Structured Learning
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Target className="w-4 h-4 mr-2" />
            Your Career Transformation Journey
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Career Switcher Track
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Make a confident career change with structured learning paths designed for professionals 
            transitioning between industries. Leverage your existing skills while building new ones.
          </p>
          
          {/* Success Stats */}
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
            <TabsTrigger value="paths">Learning Paths</TabsTrigger>
            <TabsTrigger value="progress">My Progress</TabsTrigger>
            <TabsTrigger value="success-stories">Success Stories</TabsTrigger>
          </TabsList>

          <TabsContent value="paths" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Path</h2>
              <p className="text-muted-foreground mb-6">Structured learning paths tailored for career changers</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {learningPaths.map((path) => (
                <Card key={path.id} className="relative">
                  {path.isPremium && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Star className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-lg mb-2 pr-4">{path.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mb-3">{path.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getDifficultyColor(path.difficulty)}>
                        {path.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {path.duration}
                      </Badge>
                      {path.mentorship && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Users className="w-3 h-3 mr-1" />
                          Mentorship
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4 mb-4">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Career Transition</div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">From:</span> {path.fromCareers.slice(0, 2).join(', ')}
                          {path.fromCareers.length > 2 && ` +${path.fromCareers.length - 2} more`}
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-muted-foreground">To:</span> {path.toCareers.join(', ')}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Skills You'll Learn</div>
                        <div className="flex flex-wrap gap-1">
                          {path.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {path.skills.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{path.skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-muted-foreground">Job Placement</div>
                          <div className="font-semibold text-green-600">{path.jobPlacementRate}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Salary</div>
                          <div className="font-semibold">{path.avgSalary}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Enrolled</div>
                          <div className="font-semibold">{path.enrolled.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Rating</div>
                          <div className="font-semibold flex items-center">
                            <Star className="w-3 h-3 text-yellow-500 mr-1" />
                            {path.rating}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {path.modules} modules ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ {path.projects} projects ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Real portfolio pieces
                      </div>
                    </div>

                    <div className="space-y-2">
                      {userProgress?.pathId === path.id ? (
                        <Button className="w-full" onClick={continueLearning}>
                          <Play className="w-4 h-4 mr-2" />
                          Continue Learning
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => enrollInPath(path.id, path.isPremium)}
                          disabled={path.isPremium}
                        >
                          {path.isPremium ? (
                            <>
                              <Star className="w-4 h-4 mr-2" />
                              Upgrade to Access
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-4 h-4 mr-2" />
                              Start Learning Path
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            {userProgress && getCurrentPath() ? (
              <div className="space-y-6">
                {/* Current Path Progress */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{getCurrentPath()?.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">Your current learning journey</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        In Progress
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Overall Progress</h4>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Learning Modules</span>
                              <span>{userProgress.currentModule}/{userProgress.totalModules}</span>
                            </div>
                            <Progress value={(userProgress.currentModule / userProgress.totalModules) * 100} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Projects Completed</span>
                              <span>{userProgress.completedProjects}/{userProgress.totalProjects}</span>
                            </div>
                            <Progress value={(userProgress.completedProjects / userProgress.totalProjects) * 100} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Overall Progress</span>
                              <span>{getProgressPercentage(userProgress)}%</span>
                            </div>
                            <Progress value={getProgressPercentage(userProgress)} className="h-2" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Skills Gained</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {userProgress.skillsGained.map((skill, index) => (
                            <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Next Milestone:</span>
                            <div className="font-medium">{userProgress.nextMilestone}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Estimated Completion:</span>
                            <div className="font-medium">{new Date(userProgress.estimatedCompletion).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button onClick={continueLearning}>
                        <Play className="w-4 h-4 mr-2" />
                        Continue Learning
                      </Button>
                      <Button variant="outline">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Study Time
                      </Button>
                      <Button variant="outline">
                        <Users className="w-4 h-4 mr-2" />
                        Connect with Mentor
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Milestones */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 border border-border rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">4</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Module 4: Advanced Prototyping</h4>
                          <p className="text-sm text-muted-foreground">Learn high-fidelity prototyping techniques</p>
                        </div>
                        <Badge variant="outline">Next</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 p-3 border border-border rounded-lg opacity-75">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Award className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Portfolio Project 3: E-commerce Redesign</h4>
                          <p className="text-sm text-muted-foreground">Complete redesign of an e-commerce platform</p>
                        </div>
                        <Badge variant="outline">Week 12</Badge>
                      </div>

                      <div className="flex items-center gap-4 p-3 border border-border rounded-lg opacity-50">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Final Capstone Project</h4>
                          <p className="text-sm text-muted-foreground">Complete end-to-end UX project for portfolio</p>
                        </div>
                        <Badge variant="outline">Week 16</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Learning Path</h3>
                <p className="text-muted-foreground mb-6">Choose a learning path to start your career transition journey</p>
                <Button onClick={() => setActiveTab('paths')}>
                  Browse Learning Paths
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="success-stories" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Career Transformation Stories</h2>
              <p className="text-muted-foreground mb-6">Real people who successfully changed careers using our structured learning paths</p>
            </div>

            <div className="space-y-6">
              {successStories.map((story) => (
                <Card key={story.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4"></div>
                        <h4 className="font-semibold">{story.name}</h4>
                        <p className="text-sm text-muted-foreground">{story.transition}</p>
                      </div>
                      <div className="md:col-span-2">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Before</div>
                            <div className="font-semibold">{story.before.title}</div>
                            <div className="text-sm">{story.before.salary}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">After</div>
                            <div className="font-semibold">{story.after.title}</div>
                            <div className="text-sm text-green-600">{story.after.salary}</div>
                          </div>
                        </div>
                        <blockquote className="border-l-4 border-primary pl-4 italic text-sm mb-4">
                          "{story.testimonial}"
                        </blockquote>
                        <div className="flex gap-2">
                          <Badge className="bg-green-100 text-green-800 border-green-200">{story.duration}</Badge>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">{story.salaryIncrease}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="text-center py-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Career?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join thousands of professionals who have successfully transitioned to new careers
                </p>
                <Button size="lg" onClick={() => setActiveTab('paths')}>
                  <BookOpen className="w-5 h-5 mr-2" />
                  Start Your Journey
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}








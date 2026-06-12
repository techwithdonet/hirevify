/**
 * AI Interview Coach
 * 
 * Personalized interview preparation system that analyzes job requirements,
 * company culture, and candidate profile to provide tailored coaching,
 * practice questions, and real-time feedback.
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Video, 
  Mic, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Star, 
  Clock, 
  Target, 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Lightbulb,
  Trophy,
  Zap,
  MessageSquare,
  Camera,
  MicOff,
  VideoOff,
  Volume2,
  Settings,
  Download,
  Eye,
  TrendingUp
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';

interface AIInterviewCoachProps {
  onBack: () => void;
  onUpgrade?: () => void;
  jobId?: string;
  jobTitle?: string;
  companyName?: string;
}

interface InterviewQuestion {
  id: string;
  type: 'behavioral' | 'technical' | 'situational' | 'company' | 'role-specific';
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tips: string[];
  sampleAnswer?: string;
  followUpQuestions?: string[];
  timeLimit?: number; // seconds
  evaluationCriteria: string[];
}

interface InterviewSession {
  id: string;
  jobTitle: string;
  companyName: string;
  questions: InterviewQuestion[];
  responses: Array<{
    questionId: string;
    response: string;
    recordingUrl?: string;
    duration: number;
    timestamp: Date;
    aiAnalysis?: {
      score: number;
      strengths: string[];
      improvements: string[];
      keywordMatch: number;
      clarity: number;
      confidence: number;
    };
  }>;
  overallScore: number;
  completedAt?: Date;
}

interface CoachingInsight {
  type: 'strength' | 'improvement' | 'tip' | 'warning';
  category: string;
  title: string;
  description: string;
  actionItems?: string[];
  resources?: string[];
}

export function AIInterviewCoach({ onBack, onUpgrade, jobId, jobTitle, companyName }: AIInterviewCoachProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('preparation');
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [coachingInsights, setCoachingInsights] = useState<CoachingInsight[]>([]);
  const [practiceMode, setPracticeMode] = useState<'text' | 'video' | 'audio'>('text');
  const [sessionHistory, setSessionHistory] = useState<InterviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Mock interview questions database
  const questionBank: InterviewQuestion[] = [
    {
      id: '1',
      type: 'behavioral',
      category: 'Leadership',
      question: 'Tell me about a time when you had to lead a team through a difficult project. How did you handle challenges and ensure success?',
      difficulty: 'medium',
      timeLimit: 120,
      tips: [
        'Use the STAR method (Situation, Task, Action, Result)',
        'Focus on specific examples with measurable outcomes',
        'Highlight your leadership and problem-solving skills',
        'Show how you adapted your leadership style to the team'
      ],
      sampleAnswer: 'In my previous role as a project manager, I led a team of 8 developers through a critical product launch...',
      followUpQuestions: [
        'What would you do differently if you faced a similar situation again?',
        'How did you measure the success of your leadership approach?'
      ],
      evaluationCriteria: ['Clear communication', 'Leadership examples', 'Problem-solving approach', 'Results achieved']
    },
    {
      id: '2',
      type: 'technical',
      category: 'Programming',
      question: 'Explain the concept of closures in JavaScript and provide a practical example of when you would use them.',
      difficulty: 'medium',
      timeLimit: 180,
      tips: [
        'Start with a clear definition',
        'Provide a simple code example',
        'Explain the practical benefits',
        'Mention common use cases like module patterns or event handlers'
      ],
      evaluationCriteria: ['Technical accuracy', 'Clear explanation', 'Practical examples', 'Understanding of concepts']
    },
    {
      id: '3',
      type: 'situational',
      category: 'Problem Solving',
      question: 'You discover a critical bug in production just before a major product launch. Walk me through your approach to handling this situation.',
      difficulty: 'hard',
      timeLimit: 150,
      tips: [
        'Show systematic problem-solving approach',
        'Demonstrate communication skills with stakeholders',
        'Consider both immediate fixes and long-term prevention',
        'Show ability to work under pressure'
      ],
      evaluationCriteria: ['Problem assessment', 'Communication strategy', 'Technical approach', 'Risk management']
    },
    {
      id: '4',
      type: 'company',
      category: 'Culture Fit',
      question: `Why do you want to work at ${companyName || 'this company'}? What do you know about our company culture and values?`,
      difficulty: 'easy',
      timeLimit: 90,
      tips: [
        'Research the company\'s mission and values beforehand',
        'Connect your personal values with the company\'s culture',
        'Show genuine enthusiasm and interest',
        'Mention specific aspects that attract you'
      ],
      evaluationCriteria: ['Company knowledge', 'Cultural alignment', 'Genuine interest', 'Personal connection']
    },
    {
      id: '5',
      type: 'role-specific',
      category: 'Role Understanding',
      question: `Based on your understanding of the ${jobTitle || 'position'}, what do you think will be your biggest challenges in the first 90 days?`,
      difficulty: 'medium',
      timeLimit: 120,
      tips: [
        'Show you\'ve researched the role thoroughly',
        'Identify realistic challenges based on the job description',
        'Explain how you\'d approach overcoming these challenges',
        'Demonstrate proactive thinking'
      ],
      evaluationCriteria: ['Role understanding', 'Realistic expectations', 'Problem-solving mindset', 'Preparation level']
    }
  ];

  useEffect(() => {
    loadSessionHistory();
    generateCoachingInsights();
  }, []);

  const loadSessionHistory = () => {
    // Mock session history
    const mockSessions: InterviewSession[] = [
      {
        id: '1',
        jobTitle: 'Frontend Developer',
        companyName: 'TechCorp',
        questions: questionBank.slice(0, 3),
        responses: [
          {
            questionId: '1',
            response: 'I led a team through a challenging project...',
            duration: 115,
            timestamp: new Date(Date.now() - 86400000),
            aiAnalysis: {
              score: 85,
              strengths: ['Clear structure', 'Good examples'],
              improvements: ['Add more specific metrics', 'Expand on leadership style'],
              keywordMatch: 80,
              clarity: 90,
              confidence: 85
            }
          }
        ],
        overallScore: 82,
        completedAt: new Date(Date.now() - 86400000)
      }
    ];
    setSessionHistory(mockSessions);
  };

  const generateCoachingInsights = () => {
    const insights: CoachingInsight[] = [
      {
        type: 'strength',
        category: 'Communication',
        title: 'Strong Technical Explanations',
        description: 'You consistently provide clear, well-structured technical explanations with good examples.',
        actionItems: ['Continue using the STAR method for behavioral questions', 'Keep providing concrete examples']
      },
      {
        type: 'improvement',
        category: 'Confidence',
        title: 'Reduce Filler Words',
        description: 'You tend to use "um" and "like" frequently, which can impact perceived confidence.',
        actionItems: [
          'Practice speaking more slowly and deliberately',
          'Use brief pauses instead of filler words',
          'Record yourself practicing to build awareness'
        ],
        resources: ['Toastmasters public speaking tips', 'Confidence building exercises']
      },
      {
        type: 'tip',
        category: 'Preparation',
        title: 'Research Company Culture',
        description: 'Your answers would be stronger with more specific company knowledge and cultural references.',
        actionItems: [
          'Read recent company blog posts and news',
          'Check employee reviews on Glassdoor',
          'Look up the interviewer on Link'
        ]
      },
      {
        type: 'warning',
        category: 'Technical Skills',
        title: 'Update on Latest Technologies',
        description: 'Some of your technical examples are from older projects. Consider refreshing with recent technologies.',
        actionItems: [
          'Work on a small project with modern frameworks',
          'Update your portfolio with recent work',
          'Practice explaining new concepts you\'ve learned'
        ]
      }
    ];

    setCoachingInsights(insights);
  };

  const startInterviewSession = async () => {
    setIsLoading(true);
    
    try {
      // Generate personalized questions based on job and candidate profile
      const selectedQuestions = await generatePersonalizedQuestions();
      
      const newSession: InterviewSession = {
        id: Date.now().toString(),
        jobTitle: jobTitle || 'Software Engineer',
        companyName: companyName || 'Tech Company',
        questions: selectedQuestions,
        responses: [],
        overallScore: 0
      };

      setCurrentSession(newSession);
      setCurrentQuestionIndex(0);
      setActiveTab('practice');
      toast.success('Interview session started! Take your time with each question.');
      
    } catch (error) {
      console.error('Failed to start interview session:', error);
      toast.error('Failed to start session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePersonalizedQuestions = async (): Promise<InterviewQuestion[]> => {
    // In a real implementation, this would use AI to select and customize questions
    // based on the job requirements, company culture, and candidate profile
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Select a mix of question types
    const behavioralQuestions = questionBank.filter(q => q.type === 'behavioral').slice(0, 2);
    const technicalQuestions = questionBank.filter(q => q.type === 'technical').slice(0, 2);
    const situationalQuestions = questionBank.filter(q => q.type === 'situational').slice(0, 1);
    const companyQuestions = questionBank.filter(q => q.type === 'company').slice(0, 1);
    
    return [...behavioralQuestions, ...technicalQuestions, ...situationalQuestions, ...companyQuestions];
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: practiceMode === 'video',
        audio: true
      });
      
      setMediaStream(stream);
      
      if (practiceMode === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success(`${practiceMode === 'video' ? 'Video' : 'Audio'} recording started`);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone/camera. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }

      // Process the recording
      setTimeout(() => {
        const recordedBlob = new Blob(recordedChunksRef.current, {
          type: practiceMode === 'video' ? 'video/webm' : 'audio/webm'
        });
        
        const recordingUrl = URL.createObjectURL(recordedBlob);
        processResponse(response, recordingUrl);
      }, 100);
    }
  };

  const processResponse = async (textResponse: string, recordingUrl?: string) => {
    if (!currentSession || currentQuestionIndex >= currentSession.questions.length) return;

    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const currentQuestion = currentSession.questions[currentQuestionIndex];
      const aiAnalysis = await analyzeResponse(textResponse, currentQuestion);
      
      const newResponse = {
        questionId: currentQuestion.id,
        response: textResponse,
        recordingUrl,
        duration: 120, // Mock duration
        timestamp: new Date(),
        aiAnalysis
      };

      setCurrentSession(prev => ({
        ...prev!,
        responses: [...prev!.responses, newResponse]
      }));

      // Move to next question or finish
      if (currentQuestionIndex < currentSession.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setResponse('');
        toast.success('Response analyzed! Ready for the next question.');
      } else {
        // Finish session
        const finalSession = {
          ...currentSession,
          responses: [...currentSession.responses, newResponse],
          overallScore: calculateOverallScore([...currentSession.responses, newResponse]),
          completedAt: new Date()
        };
        
        setCurrentSession(finalSession);
        setSessionHistory(prev => [finalSession, ...prev]);
        setShowResults(true);
        toast.success('Interview session completed! Check your results.');
      }
      
    } catch (error) {
      console.error('Failed to process response:', error);
      toast.error('Failed to analyze response. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeResponse = async (response: string, question: InterviewQuestion) => {
    // Mock AI analysis - in real implementation, this would use NLP and ML models
    const wordCount = response.split(' ').length;
    const hasStructure = response.includes('situation') || response.includes('task') || 
                        response.includes('action') || response.includes('result') ||
                        response.toLowerCase().includes('example');
    
    const keywordMatch = Math.random() * 40 + 60; // 60-100%
    const clarity = wordCount > 50 ? Math.random() * 20 + 80 : Math.random() * 30 + 50;
    const confidence = hasStructure ? Math.random() * 20 + 80 : Math.random() * 30 + 60;
    const score = Math.round((keywordMatch + clarity + confidence) / 3);

    const strengths = [];
    const improvements = [];

    if (hasStructure) {
      strengths.push('Well-structured response using examples');
    }
    if (wordCount > 100) {
      strengths.push('Detailed and comprehensive answer');
    }
    if (clarity > 80) {
      strengths.push('Clear and articulate communication');
    }

    if (wordCount < 50) {
      improvements.push('Provide more detailed examples and context');
    }
    if (!hasStructure && question.type === 'behavioral') {
      improvements.push('Use the STAR method for better structure');
    }
    if (confidence < 70) {
      improvements.push('Practice to sound more confident and decisive');
    }

    return {
      score,
      strengths,
      improvements,
      keywordMatch: Math.round(keywordMatch),
      clarity: Math.round(clarity),
      confidence: Math.round(confidence)
    };
  };

  const calculateOverallScore = (responses: any[]): number => {
    if (responses.length === 0) return 0;
    
    const totalScore = responses.reduce((sum, response) => 
      sum + (response.aiAnalysis?.score || 0), 0);
    
    return Math.round(totalScore / responses.length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'improvement': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'tip': return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  AI Interview Coach
                </h1>
                <p className="text-sm text-muted-foreground">
                  Personalized interview preparation and practice
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {jobTitle && (
                <Badge className="bg-primary/10 text-primary">
                  Preparing for: {jobTitle}
                </Badge>
              )}
              {onUpgrade && (
                <Button onClick={onUpgrade} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preparation">Preparation</TabsTrigger>
            <TabsTrigger value="practice">Practice Interview</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="history">Session History</TabsTrigger>
          </TabsList>

          {/* Preparation Tab */}
          <TabsContent value="preparation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Prep Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Interview Preparation Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="font-medium">Research Phase Complete</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Company background, role requirements, and interviewer profiles analyzed
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-medium">Recommended Prep Time</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          2-3 hours of focused preparation based on your experience level
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <span className="font-medium">Key Areas to Focus</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary">Technical Skills</Badge>
                          <Badge variant="secondary">Leadership Examples</Badge>
                          <Badge variant="secondary">Company Culture Fit</Badge>
                          <Badge variant="secondary">Problem Solving</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Practice Mode Selection */}
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-primary" />
                      Choose Practice Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card 
                        className={`cursor-pointer transition-colors ${practiceMode === 'text' ? 'ring-2 ring-primary border-primary' : ''}`}
                        onClick={() => setPracticeMode('text')}
                      >
                        <CardContent className="p-4 text-center">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h3 className="font-medium mb-1">Text Practice</h3>
                          <p className="text-xs text-muted-foreground">
                            Type your responses for detailed analysis
                          </p>
                        </CardContent>
                      </Card>

                      <Card 
                        className={`cursor-pointer transition-colors ${practiceMode === 'audio' ? 'ring-2 ring-primary border-primary' : ''}`}
                        onClick={() => setPracticeMode('audio')}
                      >
                        <CardContent className="p-4 text-center">
                          <Mic className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h3 className="font-medium mb-1">Audio Practice</h3>
                          <p className="text-xs text-muted-foreground">
                            Record voice responses for speech analysis
                          </p>
                        </CardContent>
                      </Card>

                      <Card 
                        className={`cursor-pointer transition-colors ${practiceMode === 'video' ? 'ring-2 ring-primary border-primary' : ''}`}
                        onClick={() => setPracticeMode('video')}
                      >
                        <CardContent className="p-4 text-center">
                          <Camera className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h3 className="font-medium mb-1">Video Practice</h3>
                          <p className="text-xs text-muted-foreground">
                            Full video simulation with body language analysis
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="mt-6">
                      <Button 
                        onClick={startInterviewSession} 
                        className="w-full" 
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating Personalized Questions...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Start Interview Practice
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Tips Sidebar */}
              <div className="space-y-6">
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg">Quick Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Use the STAR Method</p>
                          <p className="text-muted-foreground text-xs">Situation, Task, Action, Result</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Practice Time Management</p>
                          <p className="text-muted-foreground text-xs">Keep responses 1-2 minutes</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Prepare Questions</p>
                          <p className="text-muted-foreground text-xs">Have 3-5 thoughtful questions ready</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg">Progress Tracking</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Sessions Completed</span>
                          <span>{sessionHistory.length}/10</span>
                        </div>
                        <Progress value={(sessionHistory.length / 10) * 100} />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Average Score</span>
                          <span className={getScoreColor(sessionHistory.length > 0 ? sessionHistory[0]?.overallScore || 0 : 0)}>
                            {sessionHistory.length > 0 ? `${sessionHistory[0]?.overallScore || 0}%` : 'N/A'}
                          </span>
                        </div>
                        <Progress value={sessionHistory.length > 0 ? sessionHistory[0]?.overallScore || 0 : 0} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Practice Interview Tab */}
          <TabsContent value="practice" className="space-y-6">
            {!currentSession ? (
              <Card className="p-12 text-center">
                <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to Practice?</h3>
                <p className="text-muted-foreground mb-6">
                  Start an interview session from the Preparation tab to begin practicing
                </p>
                <Button onClick={() => setActiveTab('preparation')}>
                  Go to Preparation
                </Button>
              </Card>
            ) : showResults ? (
              /* Results View */
              <div className="space-y-6">
                <Card className="p-6 text-center">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Interview Session Complete!</h2>
                  <p className="text-muted-foreground mb-4">
                    You've answered {currentSession.responses.length} questions
                  </p>
                  
                  <div className="flex justify-center items-center gap-4 mb-6">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(currentSession.overallScore)}`}>
                        {currentSession.overallScore}%
                      </div>
                      <p className="text-sm text-muted-foreground">Overall Score</p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => {
                      setCurrentSession(null);
                      setShowResults(false);
                      setCurrentQuestionIndex(0);
                    }}>
                      Practice Again
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('insights')}>
                      View Detailed Analysis
                    </Button>
                  </div>
                </Card>

                {/* Quick Results Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentSession.responses.map((response, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">Question {index + 1}</h4>
                        <Badge className={`${getScoreColor(response.aiAnalysis?.score || 0)} bg-transparent`}>
                          {response.aiAnalysis?.score || 0}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {currentSession.questions[index]?.category}
                      </p>
                      <div className="text-xs">
                        <p className="text-green-600">
                          âœ“ {response.aiAnalysis?.strengths[0] || 'Good response'}
                        </p>
                        <p className="text-orange-600">
                          â†’ {response.aiAnalysis?.improvements[0] || 'Keep practicing'}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              /* Active Interview Session */
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Progress Bar */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Question {currentQuestionIndex + 1} of {currentSession.questions.length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(((currentQuestionIndex + 1) / currentSession.questions.length) * 100)}% Complete
                    </span>
                  </div>
                  <Progress value={((currentQuestionIndex + 1) / currentSession.questions.length) * 100} />
                </Card>

                {/* Current Question */}
                {currentSession.questions[currentQuestionIndex] && (
                  <Card className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Badge className="bg-primary/10 text-primary">
                        {currentSession.questions[currentQuestionIndex].type}
                      </Badge>
                      <Badge variant="outline">
                        {currentSession.questions[currentQuestionIndex].difficulty}
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {currentSession.questions[currentQuestionIndex].timeLimit}s
                      </Badge>
                    </div>

                    <h3 className="text-lg font-semibold mb-4">
                      {currentSession.questions[currentQuestionIndex].question}
                    </h3>

                    {/* Tips */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Tips for this question:
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {currentSession.questions[currentQuestionIndex].tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">â€¢</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Response Area */}
                    <div className="space-y-4">
                      {practiceMode === 'video' && (
                        <div className="relative">
                          <video
                            ref={videoRef}
                            autoPlay
                            muted
                            className="w-full max-w-md mx-auto rounded-lg bg-gray-100"
                          />
                        </div>
                      )}

                      <Textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Type your response here..."
                        rows={6}
                        disabled={isRecording}
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {(practiceMode === 'video' || practiceMode === 'audio') && (
                            <Button
                              onClick={isRecording ? stopRecording : startRecording}
                              variant={isRecording ? "destructive" : "default"}
                              disabled={isAnalyzing}
                            >
                              {isRecording ? (
                                <>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Stop Recording
                                </>
                              ) : (
                                <>
                                  {practiceMode === 'video' ? (
                                    <Camera className="w-4 h-4 mr-2" />
                                  ) : (
                                    <Mic className="w-4 h-4 mr-2" />
                                  )}
                                  Start Recording
                                </>
                              )}
                            </Button>
                          )}

                          {isRecording && (
                            <div className="flex items-center gap-2 text-red-600">
                              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                              <span className="text-sm">Recording...</span>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => processResponse(response)}
                          disabled={(!response.trim() && !isRecording) || isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Analyzing...
                            </>
                          ) : (
                            'Submit Response'
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coaching Insights */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personalized Coaching Insights</h3>
                {coachingInsights.map((insight, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {insight.description}
                        </p>
                        
                        {insight.actionItems && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-foreground mb-1">Action Items:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {insight.actionItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-primary mt-1">â€¢</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {insight.resources && (
                          <div className="flex flex-wrap gap-1">
                            {insight.resources.map((resource, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {resource}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Performance Analytics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance Analytics</h3>
                
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Improvement Trends</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Communication Clarity</span>
                      <div className="flex items-center gap-2">
                        <Progress value={85} className="w-20 h-2" />
                        <span className="text-sm font-medium">85%</span>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Technical Accuracy</span>
                      <div className="flex items-center gap-2">
                        <Progress value={78} className="w-20 h-2" />
                        <span className="text-sm font-medium">78%</span>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Confidence Level</span>
                      <div className="flex items-center gap-2">
                        <Progress value={72} className="w-20 h-2" />
                        <span className="text-sm font-medium">72%</span>
                        <TrendingUp className="w-4 h-4 text-yellow-500" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3">Strengths & Focus Areas</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Top Strengths</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge className="bg-green-100 text-green-800 text-xs">Technical Explanations</Badge>
                        <Badge className="bg-green-100 text-green-800 text-xs">Problem Solving</Badge>
                        <Badge className="bg-green-100 text-green-800 text-xs">Examples</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-orange-600 mb-1">Focus Areas</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge className="bg-orange-100 text-orange-800 text-xs">Confidence</Badge>
                        <Badge className="bg-orange-100 text-orange-800 text-xs">Conciseness</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Session History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Interview Practice History</h3>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>

            {sessionHistory.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Practice Sessions Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start your first interview practice session to track your progress
                </p>
                <Button onClick={() => setActiveTab('preparation')}>
                  Start First Session
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {sessionHistory.map((session) => (
                  <Card key={session.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{session.jobTitle}</h4>
                        <p className="text-sm text-muted-foreground">{session.companyName}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(session.overallScore)}`}>
                          {session.overallScore}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {session.completedAt?.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Questions:</span>
                        <span className="ml-2 font-medium">{session.questions.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="ml-2 font-medium">{session.responses.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-2 font-medium">
                          {Math.round(session.responses.reduce((sum, r) => sum + r.duration, 0) / 60)} min
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end mt-3">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}








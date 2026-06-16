import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Book, Award, Clock, Users, BarChart3, Star, CheckCircle, AlertCircle, Brain, Code, Lightbulb, Target, Plus, Crown, Edit3, Trash2, UserCheck, Settings, Eye, Copy, Calendar, Filter, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/src/lib/supabase';
import { assessmentsService } from '../services/assessmentsService';

interface SkillsAssessmentProps {
  onBack: () => void;
  userType: 'recruiter' | 'candidate';
  onCreateCustomAssessment?: () => void;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'code' | 'essay' | 'true-false';
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimit?: number; // in seconds
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // in minutes
  questions: Question[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  skills: string[];
  passingScore: number;
  createdBy?: string;
  createdAt?: string;
  isActive?: boolean;
  assignedCandidates?: number;
  completionRate?: number;
  averageScore?: number;
}

interface AssessmentResult {
  id: string;
  assessmentId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  score: number;
  timeSpent: number;
  answers: { [questionId: string]: string };
  completedAt: string;
  status: 'completed' | 'in-progress' | 'not-started';
}

interface CandidateAssignment {
  id: string;
  assessmentId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  assignedAt: string;
  dueDate?: string;
  status: 'assigned' | 'completed' | 'overdue';
  remindersSent: number;
}

// Pre-built assessment templates for recruiters to use
const PREDEFINED_ASSESSMENTS: Assessment[] = [
  {
    id: 'react-assessment',
    title: 'React Development Skills',
    description: 'Comprehensive assessment covering React fundamentals, hooks, state management, and advanced patterns.',
    category: 'Frontend Development',
    duration: 60,
    difficulty: 'intermediate',
    skills: ['React', 'JavaScript', 'JSX', 'Hooks', 'State Management'],
    passingScore: 70,
    questions: [], // Would be populated from question bank
    createdBy: 'HireVify',
    createdAt: '2024-01-15',
    isActive: true,
    assignedCandidates: 24,
    completionRate: 85,
    averageScore: 78
  },
  {
    id: 'javascript-assessment',
    title: 'JavaScript Fundamentals',
    description: 'Essential JavaScript concepts including ES6+, async programming, closures, and modern development practices.',
    category: 'Programming Languages',
    duration: 45,
    difficulty: 'beginner',
    skills: ['JavaScript', 'ES6+', 'Async/Await', 'DOM Manipulation'],
    passingScore: 65,
    questions: [],
    createdBy: 'HireVify',
    createdAt: '2024-01-10',
    isActive: true,
    assignedCandidates: 42,
    completionRate: 92,
    averageScore: 71
  },
  {
    id: 'python-assessment',
    title: 'Python Programming',
    description: 'Python fundamentals, data structures, OOP concepts, and common libraries for backend development.',
    category: 'Programming Languages',
    duration: 50,
    difficulty: 'intermediate',
    skills: ['Python', 'OOP', 'Data Structures', 'Libraries'],
    passingScore: 70,
    questions: [],
    createdBy: 'HireVify',
    createdAt: '2024-01-12',
    isActive: true,
    assignedCandidates: 18,
    completionRate: 78,
    averageScore: 74
  },
  {
    id: 'nodejs-assessment',
    title: 'Node.js Backend Development',
    description: 'Server-side JavaScript, Express.js, RESTful APIs, database integration, and backend best practices.',
    category: 'Backend Development',
    duration: 55,
    difficulty: 'advanced',
    skills: ['Node.js', 'Express.js', 'REST APIs', 'Database Design'],
    passingScore: 75,
    questions: [],
    createdBy: 'HireVify',
    createdAt: '2024-01-08',
    isActive: true,
    assignedCandidates: 15,
    completionRate: 67,
    averageScore: 68
  }
];

// Mock candidate assessment results
const MOCK_ASSESSMENT_RESULTS: AssessmentResult[] = [
  {
    id: 'result-1',
    assessmentId: 'react-assessment',
    candidateId: 'candidate-1',
    candidateName: 'Sarah Chen',
    candidateEmail: 'sarah.chen@email.com',
    score: 85,
    timeSpent: 52,
    answers: {},
    completedAt: '2024-01-20T10:30:00Z',
    status: 'completed'
  },
  {
    id: 'result-2',
    assessmentId: 'javascript-assessment',
    candidateId: 'candidate-2',
    candidateName: 'Alex Rodriguez',
    candidateEmail: 'alex.rodriguez@email.com',
    score: 78,
    timeSpent: 41,
    answers: {},
    completedAt: '2024-01-19T14:15:00Z',
    status: 'completed'
  },
  {
    id: 'result-3',
    assessmentId: 'python-assessment',
    candidateId: 'candidate-3',
    candidateName: 'Morgan Taylor',
    candidateEmail: 'morgan.taylor@email.com',
    score: 92,
    timeSpent: 47,
    answers: {},
    completedAt: '2024-01-18T09:45:00Z',
    status: 'completed'
  }
];

// Sample question for candidate assessment taking


export function SkillsAssessment({ onBack, userType, onCreateCustomAssessment }: SkillsAssessmentProps) {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [activeTab, setActiveTab] = useState(userType === 'recruiter' ? 'manage-assessments' : 'available-assessments');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  
  // For candidate assessment taking
  const [isAssessmentActive, setIsAssessmentActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [assessmentStarted, setAssessmentStarted] = useState(false);

  // For recruiter assessment management
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [candidateEmail, setCandidateEmail] = useState('');

  const categories = ['all', 'Frontend Development', 'Backend Development', 'Programming Languages', 'Data Science', 'DevOps', 'Mobile Development'];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setIsLoadingAssessments(true);

        const supabase = createSupabaseBrowserClient();

        const { data, error } = await supabase
          .from('skills_assessments')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          toast.error('Failed to load assessments');
          setAssessments([]);
          return;
        }

        const assessmentIds = (data || []).map((item: any) => item.id).filter(Boolean);

        let questionRows: any[] = [];

        if (assessmentIds.length > 0) {
          const { data: loadedQuestions, error: questionsError } = await supabase
            .from('assessment_questions')
            .select('*')
            .in('assessment_id', assessmentIds)
            .order('sort_order', { ascending: true });

          if (questionsError) {
            console.error('Failed to load assessment questions:', questionsError);
          } else {
            questionRows = loadedQuestions || [];
          }
        }

const mappedAssessments: Assessment[] = (data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          category: item.category || 'General',
          duration: item.duration_minutes,
          difficulty: item.level as 'beginner' | 'intermediate' | 'advanced',
          skills: item.skills || [],
          passingScore: item.passing_score,
          questions: questionRows
            .filter((question: any) => question.assessment_id === item.id)
            .map((question: any, index: number) => ({
              id: question.id || `${item.id}-q-${index}`,
              question: question.question_text || '',
              text: question.question_text || '',
              type: question.question_type || 'multiple_choice',
              options: Array.isArray(question.options) ? question.options : [],
              correctAnswer: question.correct_answer || '',
              correct_answer: question.correct_answer || '',
              points: Number(question.points || 1),
              difficulty: 'medium' as const,
            })),
          createdBy: 'HireVify',
          createdAt: item.createdAt || item.created_at || item.completedAt || item.completed_at || new Date().toISOString(),
          isActive: item.status === 'active',
          assignedCandidates: 0,
          completionRate: 0,
          averageScore: 0,
        }));

        setAssessments(mappedAssessments);
      } catch (error) {
        console.error('Error loading assessments:', error);
        toast.error('Failed to load assessments');
        setAssessments([]);
      } finally {
        setIsLoadingAssessments(false);
      }
    };

    loadAssessments();
  }, []);

  useEffect(() => {
    const loadMyResults = async () => {
      if (!user?.id) {
        setAssessmentResults([]);
        return;
      }

      const { data, error } = await assessmentsService.getMyResults(user.id);

      if (error) {
        setAssessmentResults([]);
        return;
      }

      const mappedResults: AssessmentResult[] = data.map((item: any) => ({
        id: item.id,
        assessmentId: item.assessmentId || item.assessment_id,
        candidateId: item.user_id,
        candidateName: user?.name || 'Candidate',
        candidateEmail: user?.email || '',
        score: item.score || 0,
        timeSpent: Math.round((item.time_spent || 0) / 60),
        answers: item.answers || {},
        completedAt: item.completedAt || item.completed_at || item.createdAt || item.created_at || item.submitted_at || new Date().toISOString(),
        status: item.status || 'completed',
      }));

      setAssessmentResults(mappedResults);
    };

    loadMyResults();
  }, [user?.id]);
  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || assessment.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || assessment.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const currentQuestion = selectedAssessment?.questions?.[currentQuestionIndex];

  const isAssessmentCompleted = (assessmentId: string) => {
    return assessmentResults.some((result: any) => {
      const resultAssessmentId = result.assessmentId || result.assessment_id;
      return String(resultAssessmentId) === String(assessmentId);
    });
  };

  const handleStartAssessment = async (assessment: Assessment) => {
    console.log('Starting assessment:', assessment.id, assessment.title, assessment.questions?.length);
    try {
      const supabaseClient = createSupabaseBrowserClient();

      const { data: loadedQuestions, error } = await supabaseClient
        .from('assessment_questions')
        .select('*')
        .eq('assessment_id', assessment.id)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Failed to load assessment questions:', error);
        toast.error('Failed to load questions for this assessment.');
        alert('Failed to load questions for this assessment.');
        return;
      }

      const questions = (loadedQuestions || []).map((question: any, index: number) => ({
        id: question.id || `${assessment.id}-q-${index}`,
        text: question.question_text || '',
        type: question.question_type || 'multiple_choice',
        options: Array.isArray(question.options) ? question.options : [],
        correctAnswer: question.correct_answer || '',
        correct_answer: question.correct_answer || '',
        points: Number(question.points || 1),
        difficulty: 'medium' as const,
      }));

      if (questions.length === 0) {
        toast.error('No questions added for this assessment yet. Add questions from admin panel first.');
        alert('No questions added for this assessment yet. Please add questions from admin panel first.');
        return;
      }

      const assessmentToStart = {
        ...assessment,
        questions,
      };

      setSelectedAssessment(assessmentToStart);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTimeRemaining(Number(assessment.duration || 45) * 60);
      setAssessmentStarted(true);
      setIsAssessmentActive(true);

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Start assessment failed:', error);
      toast.error('Failed to start assessment.');
      alert('Failed to start assessment. Check console.');
    }
  };
  const handleSubmitAssessment = async () => {
    if (!selectedAssessment || !user) return;

    const totalQuestions = selectedAssessment.questions.length;

    if (totalQuestions === 0) {
      toast.error('No questions found for this assessment.');
      return;
    }

    const normalizeAnswer = (value: any) =>
      String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    const correctAnswers = selectedAssessment.questions.reduce((total, question: any) => {
      const questionId = question.id;
      const selectedAnswer = normalizeAnswer(answers[questionId]);
      const correctAnswer = normalizeAnswer(question.correctAnswer || question.correct_answer);

      const optionIndex = Array.isArray(question.options)
        ? question.options.findIndex((option: any) => normalizeAnswer(option) === selectedAnswer)
        : -1;

      const correctOptionIndex = Array.isArray(question.options)
        ? question.options.findIndex((option: any) => normalizeAnswer(option) === correctAnswer)
        : -1;

      const selectedAsNumber = Number(selectedAnswer);

      const isCorrect =
        selectedAnswer === correctAnswer ||
        (optionIndex !== -1 && correctOptionIndex !== -1 && optionIndex === correctOptionIndex) ||
        (!Number.isNaN(selectedAsNumber) && selectedAsNumber === correctOptionIndex) ||
        (!Number.isNaN(selectedAsNumber) && selectedAsNumber === correctOptionIndex + 1);

      console.log('Answer check:', {
        question: question.text,
        selectedAnswer,
        correctAnswer,
        optionIndex,
        correctOptionIndex,
        isCorrect,
      });

      return isCorrect ? total + 1 : total;
    }, 0);

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const timeSpent = Math.max(0, Number(selectedAssessment.duration || 0) * 60 - Number(timeRemaining || 0));

    const { data, error } = await assessmentsService.saveResult({
      userId: String(user.id),
      assessmentId: selectedAssessment.id,
      score,
      passed: score >= selectedAssessment.passingScore,
      answers,
      timeSpent,
    });

    if (error) {
      toast.error('Failed to save assessment result');
      return;
    }

    const savedResult: any = data || {
      id: crypto.randomUUID(),
      userId: String(user.id),
      assessmentId: selectedAssessment.id,
      score,
      passed: score >= selectedAssessment.passingScore,
      answers,
      timeSpent,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setAssessmentResults(prev => {
      const filtered = prev.filter((result: any) => {
        const sameId = result.id && savedResult.id && String(result.id) === String(savedResult.id);
        const sameAssessment =
          String(result.assessmentId || result.assessment_id) === String(savedResult.assessmentId || savedResult.assessment_id);

        return !sameId && !sameAssessment;
      });

      return [savedResult, ...filtered].filter(Boolean);
    });
    setAssessmentStarted(false);
    setIsAssessmentActive(false);
    setSelectedAssessment(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    toast.success(score >= selectedAssessment.passingScore ? 'Assessment passed!' : 'Assessment completed');
    setActiveTab('my-results');
  };
  const handleAssignAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowAssignDialog(true);
  };

  const handleSendAssignment = () => {
    if (!selectedAssessment || !candidateEmail.trim()) {
      toast.error('Please enter a candidate email address');
      return;
    }

    // Here you would typically make an API call to assign the assessment
    toast.success(`Assessment "${selectedAssessment.title}" assigned to ${candidateEmail}`);
    setShowAssignDialog(false);
    setCandidateEmail('');
    setSelectedAssessment(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Recruiter view - Assessment Management
  const renderRecruiterView = () => (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage-assessments">Manage Assessments</TabsTrigger>
          <TabsTrigger value="results">Assessment Results</TabsTrigger>
          <TabsTrigger value="assignments">Candidate Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="manage-assessments" className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex space-x-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map(difficulty => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty === 'all' ? 'All Levels' : difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={onCreateCustomAssessment} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create Custom Assessment</span>
              </Button>
            </div>
          </div>

          {/* Assessment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssessments.map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-primary" />
                      <Badge className={getDifficultyColor(assessment.difficulty)}>
                        {assessment.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{assessment.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {assessment.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {assessment.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {assessment.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{assessment.skills.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Duration</span>
                      <span>{assessment.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passing Score</span>
                      <span>{assessment.passingScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assigned</span>
                      <span>{assessment.assignedCandidates || 0} candidates</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate</span>
                      <span>{assessment.completionRate || 0}%</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => handleAssignAssessment(assessment)}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Assign to Candidate
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Assessment Results</h3>
            
            {assessmentResults.length === 0 ? (
              <Card className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">No Results Yet</h4>
                <p className="text-muted-foreground">
                  Assessment results will appear here once candidates complete their assessments.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {assessmentResults.map((result, index) => {
                  const assessment = assessments.find(a => a.id === result.assessmentId);
                  return (
                    <Card key={`${result.id || result.assessmentId || (result as any).assessment_id || "result"}-${index}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{result.candidateName}</h4>
                            <p className="text-sm text-muted-foreground">{result.candidateEmail}</p>
                            <p className="text-sm font-medium">{assessment?.title}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <div className={`text-2xl font-bold ${getScoreColor(Number((result as any).score || 0))}`}>
                              {Number((result as any).score || 0)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {result.timeSpent} minutes
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date((result as any).completedAt || (result as any).completed_at || (result as any).createdAt || (result as any).created_at || Date.now()).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center space-x-4">
                          <Progress 
                            value={Number((result as any).score || 0)} 
                            className="flex-1 h-2" 
                          />
                          <Badge 
                            variant={Number((result as any).score || 0) >= (assessment?.passingScore || 70) ? "default" : "destructive"}
                          >
                            {Number((result as any).score || 0) >= (assessment?.passingScore || 70) ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Candidate Assignments</h3>
            
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">Assignment Tracking</h4>
              <p className="text-muted-foreground">
                Track assessment assignments, due dates, and candidate progress here.
              </p>
              <Button className="mt-4" onClick={() => handleAssignAssessment(assessments[0])}>
                <Plus className="w-4 h-4 mr-2" />
                Assign Assessment
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Assessment</DialogTitle>
            <DialogDescription>
              Send "{selectedAssessment?.title}" assessment to a candidate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="candidate-email">Candidate Email</Label>
              <Input
                id="candidate-email"
                type="email"
                placeholder="candidate@example.com"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong>Assessment:</strong> {selectedAssessment?.title}</p>
              <p><strong>Duration:</strong> {selectedAssessment?.duration} minutes</p>
              <p><strong>Passing Score:</strong> {selectedAssessment?.passingScore}%</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendAssignment}>
                Send Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Candidate view - Assessment Taking
  const renderCandidateView = () => {
    if (isAssessmentActive && selectedAssessment) {
      return (
        <div className="space-y-6">
          {/* Assessment Header */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedAssessment.title}</h2>
                <p className="text-muted-foreground">{selectedAssessment.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
                <p className="text-sm text-muted-foreground">Time Remaining</p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Question 1 of 1</span>
                <span>Sample Question</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </div>

          {/* Sample Question */}
          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Badge className={getDifficultyColor((currentQuestion?.difficulty || 'medium'))}>
                      {(currentQuestion?.difficulty || 'medium')}
                    </Badge>
                    <Badge variant="outline">
                      {currentQuestion?.points || 1} points
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{(currentQuestion?.text || '')}</h3>
                </div>

                <RadioGroup 
                  value={answers[(currentQuestion?.id || '')] || ''}
                  onValueChange={(value) => setAnswers(prev => ({ ...prev, [(currentQuestion?.id || '')]: value }))}
                >
                  {currentQuestion?.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" disabled>
                    Previous Question
                  </Button>
                                   <Button 
                    onClick={handleSubmitAssessment}
                    disabled={!answers[(currentQuestion?.id || '')]}
                  >
                    Submit Assessment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available-assessments">Available Assessments</TabsTrigger>
            <TabsTrigger value="my-results">My Results</TabsTrigger>
          </TabsList>

          <TabsContent value="available-assessments" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex space-x-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map(difficulty => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty === 'all' ? 'All Levels' : difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assessment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssessments.map((assessment) => (
                <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-5 h-5 text-primary" />
                        <Badge className={getDifficultyColor(assessment.difficulty)}>
                          {assessment.difficulty}
                        </Badge>
                      </div>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {assessment.duration} min
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{assessment.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {assessment.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {assessment.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {assessment.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{assessment.skills.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Questions</span>
                        <span>{assessment.questions.length > 0 ? assessment.questions.length : 'No questions'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Passing Score</span>
                        <span>{assessment.passingScore}%</span>
                      </div>
                    </div>

                    {isAssessmentCompleted(assessment.id) ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => setActiveTab('my-results')}
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Completed
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleStartAssessment(assessment)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Assessment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

                   <TabsContent value="my-results" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">My Assessment Results</h3>

              {assessmentResults.length === 0 ? (
                <Card className="p-8 text-center">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">No Completed Assessments</h4>
                  <p className="text-muted-foreground">
                    Your assessment results and certificates will appear here once you complete assessments.
                  </p>
                  <Button className="mt-4" onClick={() => setActiveTab('available-assessments')}>
                    <Play className="w-4 h-4 mr-2" />
                    Take Your First Assessment
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {assessmentResults.map((result, index) => {
                    const assessment = assessments.find((a) => a.id === result.assessmentId);
                    const passingScore = assessment?.passingScore || 70;
                    const passed = Number((result as any).score || 0) >= passingScore;

                    return (
                      <Card key={`${result.id || result.assessmentId || (result as any).assessment_id || "result"}-${index}`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {assessment?.title || 'Assessment'}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Completed on {new Date((result as any).completedAt || (result as any).completed_at || (result as any).createdAt || (result as any).created_at || Date.now()).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Time spent: {result.timeSpent} minutes
                              </p>
                            </div>

                            <div className="text-right">
                              <div className={`text-3xl font-bold ${getScoreColor(Number((result as any).score || 0))}`}>
                                {Number((result as any).score || 0)}%
                              </div>
                              <Badge variant={passed ? 'default' : 'destructive'}>
                                {passed ? 'Passed' : 'Failed'}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-4">
                            <Progress value={Number((result as any).score || 0)} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {userType === 'recruiter' ? 'Assessment Management' : 'Skills Assessments'}
                </h1>
                <p className="text-muted-foreground">
                  {userType === 'recruiter' 
                    ? 'Create, assign, and manage skills assessments for candidates'
                    : 'Demonstrate your skills and earn certificates through comprehensive assessments'
                  }
                </p>
              </div>
            </div>
            {userType === 'recruiter' && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-primary/10">
                  <Settings className="w-3 h-3 mr-1" />
                  Management Portal
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {userType === 'recruiter' ? renderRecruiterView() : renderCandidateView()}
      </div>
    </div>
  );
}








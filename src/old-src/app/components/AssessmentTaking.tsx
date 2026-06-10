import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle, CheckCircle, XCircle, Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';

interface Assessment {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  totalQuestions: number;
  passingScore: number;
  skills: string[];
}

interface Question {
  id: string;
  text: string;
  type: 'single-choice' | 'multiple-choice' | 'true-false';
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  skill: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // in seconds
}

interface AssessmentResult {
  id: string;
  assessmentId: string;
  userId: string;
  score: number;
  percentage: number;
  timeSpent: number;
  startedAt: string;
  completedAt: string;
  passed: boolean;
  answers: AssessmentAnswer[];
  skillBreakdown: SkillScore[];
}

interface AssessmentAnswer {
  questionId: string;
  selectedAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number;
}

interface SkillScore {
  skill: string;
  score: number;
  maxScore: number;
  percentage: number;
}

interface AssessmentTakingProps {
  assessment: Assessment;
  onComplete: (result: AssessmentResult) => void;
  onBack: () => void;
}

export function AssessmentTaking({ assessment, onComplete, onBack }: AssessmentTakingProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(assessment.duration * 60); // in seconds
  const [startTime] = useState(new Date());
  const [questionStartTime, setQuestionStartTime] = useState(new Date());
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timerPaused, setTimerPaused] = useState(false);

  // Sample questions data
  const generateQuestions = useCallback((assessment: Assessment): Question[] => {
    const sampleQuestions: Question[] = [
      {
        id: 'q1',
        text: 'What is the primary purpose of React hooks?',
        type: 'single-choice',
        options: [
          'To replace class components entirely',
          'To allow state and lifecycle features in functional components',
          'To improve performance of React applications',
          'To handle routing in React applications'
        ],
        correctAnswer: 'To allow state and lifecycle features in functional components',
        explanation: 'React hooks allow you to use state and other React features without writing a class component.',
        skill: 'React',
        difficulty: 'medium'
      },
      {
        id: 'q2',
        text: 'Which of the following are valid ways to create a React component? (Select all that apply)',
        type: 'multiple-choice',
        options: [
          'Function declaration',
          'Arrow function',
          'Class component',
          'Object literal',
          'Template literal'
        ],
        correctAnswer: ['Function declaration', 'Arrow function', 'Class component'],
        explanation: 'React components can be created using function declarations, arrow functions, or class components.',
        skill: 'React',
        difficulty: 'easy'
      },
      {
        id: 'q3',
        text: 'The useEffect hook runs after every render by default.',
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'By default, useEffect runs after every completed render, both after the first render and after every update.',
        skill: 'React',
        difficulty: 'medium'
      },
      // Add more questions...
    ];

    // Generate more questions based on assessment requirements
    const additionalQuestions = Array.from({ length: assessment.totalQuestions - 3 }, (_, i) => ({
      id: `q${i + 4}`,
      text: `Sample question ${i + 4} for ${assessment.title}`,
      type: ['single-choice', 'multiple-choice', 'true-false'][Math.floor(Math.random() * 3)] as Question['type'],
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: `This is the explanation for question ${i + 4}.`,
      skill: assessment.skills[Math.floor(Math.random() * assessment.skills.length)],
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as Question['difficulty']
    }));

    return [...sampleQuestions, ...additionalQuestions].slice(0, assessment.totalQuestions);
  }, []);

  useEffect(() => {
    // Load questions
    const loadQuestions = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const generatedQuestions = generateQuestions(assessment);
      setQuestions(generatedQuestions);
      setIsLoading(false);
    };
    loadQuestions();
  }, [assessment, generateQuestions]);

  // Timer effect
  useEffect(() => {
    if (isLoading || timerPaused) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, timerPaused]);

  // Track time spent on each question
  useEffect(() => {
    if (questions.length === 0) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    setQuestionStartTime(new Date());

    return () => {
      if (currentQuestion) {
        const timeSpent = Date.now() - questionStartTime.getTime();
        setQuestionTimes(prev => ({
          ...prev,
          [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpent
        }));
      }
    };
  }, [currentQuestionIndex, questions]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const calculateResults = (): AssessmentResult => {
    let correctAnswers = 0;
    const assessmentAnswers: AssessmentAnswer[] = [];
    const skillScores: Record<string, { correct: number; total: number }> = {};

    questions.forEach(question => {
      const userAnswer = answers[question.id];
      let isCorrect = false;

      if (question.type === 'multiple-choice') {
        const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        isCorrect = correctAnswers.length === userAnswers.length &&
                   correctAnswers.every(answer => userAnswers.includes(answer));
      } else {
        isCorrect = userAnswer === question.correctAnswer;
      }

      if (isCorrect) correctAnswers++;

      assessmentAnswers.push({
        questionId: question.id,
        selectedAnswer: userAnswer || '',
        isCorrect,
        timeSpent: questionTimes[question.id] || 0
      });

      // Track skill scores
      if (!skillScores[question.skill]) {
        skillScores[question.skill] = { correct: 0, total: 0 };
      }
      skillScores[question.skill].total++;
      if (isCorrect) {
        skillScores[question.skill].correct++;
      }
    });

    const skillBreakdown: SkillScore[] = Object.entries(skillScores).map(([skill, scores]) => ({
      skill,
      score: scores.correct,
      maxScore: scores.total,
      percentage: Math.round((scores.correct / scores.total) * 100)
    }));

    const percentage = Math.round((correctAnswers / questions.length) * 100);
    const totalTimeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000);

    return {
      id: `result_${Date.now()}`,
      assessmentId: assessment.id,
      userId: 'current-user', // Replace with actual user ID
      score: correctAnswers,
      percentage,
      timeSpent: totalTimeSpent,
      startedAt: startTime.toISOString(),
      completedAt: new Date().toISOString(),
      passed: percentage >= assessment.passingScore,
      answers: assessmentAnswers,
      skillBreakdown
    };
  };

  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    setShowSubmitDialog(false);

    try {
      // Calculate results
      const result = calculateResults();
      
      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onComplete(result);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAnswerStatus = (questionIndex: number) => {
    const question = questions[questionIndex];
    const hasAnswer = answers[question.id] !== undefined && answers[question.id] !== '';
    const isFlagged = flaggedQuestions.has(question.id);
    
    if (isFlagged && hasAnswer) return 'flagged-answered';
    if (isFlagged) return 'flagged';
    if (hasAnswer) return 'answered';
    return 'unanswered';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-success text-success-foreground';
      case 'flagged': return 'bg-warning text-warning-foreground';
      case 'flagged-answered': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground border border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium text-foreground">Loading Assessment...</p>
              <p className="text-muted-foreground">Preparing {assessment.totalQuestions} questions</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium text-foreground">Submitting Assessment...</p>
              <p className="text-muted-foreground">Calculating your results</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{assessment.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-error' : timeRemaining < 600 ? 'text-warning' : 'text-foreground'}`}>
                {formatTime(timeRemaining)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimerPaused(!timerPaused)}
                className="ml-2"
              >
                {timerPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
            </div>
            
            <Button 
              onClick={() => setShowSubmitDialog(true)}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Submit Assessment
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Time Warning */}
        {timeRemaining < 300 && (
          <Alert className="mb-6 border-error bg-error/5">
            <AlertTriangle className="h-4 w-4 text-error" />
            <AlertDescription className="text-error">
              Warning: Only {formatTime(timeRemaining)} remaining! Make sure to submit your answers.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Questions</CardTitle>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Answered: {answeredCount}</span>
                  <span>Remaining: {unansweredCount}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                  {questions.map((_, index) => {
                    const status = getAnswerStatus(index);
                    return (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuestionSelect(index)}
                        className={`h-10 w-10 p-0 text-xs font-medium ${getStatusColor(status)} ${
                          currentQuestionIndex === index ? 'ring-2 ring-primary ring-offset-2' : ''
                        }`}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-warning rounded"></div>
                    <span>Flagged</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Flagged & Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-muted border border-border rounded"></div>
                    <span>Unanswered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {currentQuestion.skill}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${
                        currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800 border-green-200' :
                        currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {currentQuestion.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-relaxed">
                      {currentQuestion.text}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={flaggedQuestions.has(currentQuestion.id) ? 'text-warning' : 'text-muted-foreground'}
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {currentQuestion.type === 'single-choice' && (
                  <RadioGroup
                    value={answers[currentQuestion.id] as string || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
                        <Label 
                          htmlFor={`option-${index}`} 
                          className="flex-1 cursor-pointer leading-relaxed"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'multiple-choice' && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const selectedAnswers = (answers[currentQuestion.id] as string[]) || [];
                      const isChecked = selectedAnswers.includes(option);
                      
                      return (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={`option-${index}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
                              if (checked) {
                                handleAnswerChange(currentQuestion.id, [...currentAnswers, option]);
                              } else {
                                handleAnswerChange(currentQuestion.id, currentAnswers.filter(a => a !== option));
                              }
                            }}
                            className="mt-1"
                          />
                          <Label 
                            htmlFor={`option-${index}`} 
                            className="flex-1 cursor-pointer leading-relaxed"
                          >
                            {option}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === 'true-false' && (
                  <RadioGroup
                    value={answers[currentQuestion.id] as string || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value={option} id={`tf-${index}`} />
                        <Label htmlFor={`tf-${index}`} className="cursor-pointer font-medium">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1} of {questions.length}
              </div>
              
              <Button
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your assessment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-foreground">Questions Answered</p>
                <p className="text-2xl font-bold text-success">{answeredCount}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-foreground">Questions Remaining</p>
                <p className="text-2xl font-bold text-error">{unansweredCount}</p>
              </div>
            </div>
            
            {unansweredCount > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have {unansweredCount} unanswered questions. These will be marked as incorrect.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Continue Assessment
            </Button>
            <Button onClick={handleSubmitAssessment}>
              Submit Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
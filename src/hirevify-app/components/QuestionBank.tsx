import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Filter, Edit, Trash2, Copy, Eye, BookOpen, Tag, Clock, Target, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { toast } from 'sonner';

interface Question {
  id: string;
  text: string;
  type: 'single-choice' | 'multiple-choice' | 'true-false';
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  skill: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  tags: string[];
  createdAt: string;
  createdBy: string;
  isActive: boolean;
  usageCount: number;
}

interface QuestionBankProps {
  onBack: () => void;
}

export function QuestionBank({ onBack }: QuestionBankProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    text: '',
    type: 'single-choice' as Question['type'],
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    skill: '',
    category: '',
    difficulty: 'medium' as Question['difficulty'],
    tags: [] as string[],
    timeLimit: undefined as number | undefined
  });

  // Sample questions data
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
      explanation: 'React hooks allow you to use state and other React features without writing a class component. They were introduced to solve problems with class components and make functional components more powerful.',
      skill: 'React',
      category: 'Frontend Development',
      difficulty: 'medium',
      tags: ['hooks', 'functional-components', 'state'],
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'admin',
      isActive: true,
      usageCount: 127
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
      explanation: 'React components can be created using function declarations, arrow functions, or ES6 class components. Object literals and template literals are not valid ways to create React components.',
      skill: 'React',
      category: 'Frontend Development',
      difficulty: 'easy',
      tags: ['components', 'syntax', 'basics'],
      createdAt: '2024-01-14T15:30:00Z',
      createdBy: 'admin',
      isActive: true,
      usageCount: 89
    },
    {
      id: 'q3',
      text: 'The useEffect hook runs after every render by default.',
      type: 'true-false',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'By default, useEffect runs after every completed render, both after the first render and after every update. You can control this behavior using the dependency array.',
      skill: 'React',
      category: 'Frontend Development',
      difficulty: 'medium',
      tags: ['useEffect', 'hooks', 'lifecycle'],
      createdAt: '2024-01-13T09:15:00Z',
      createdBy: 'admin',
      isActive: true,
      usageCount: 156
    },
    {
      id: 'q4',
      text: 'What is closure in JavaScript?',
      type: 'single-choice',
      options: [
        'A way to close the browser window',
        'A function that has access to variables in its outer scope',
        'A method to stop code execution',
        'A type of loop in JavaScript'
      ],
      correctAnswer: 'A function that has access to variables in its outer scope',
      explanation: 'A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function has returned. This is a fundamental concept in JavaScript.',
      skill: 'JavaScript',
      category: 'Programming Languages',
      difficulty: 'hard',
      tags: ['closure', 'scope', 'functions'],
      createdAt: '2024-01-12T14:20:00Z',
      createdBy: 'admin',
      isActive: true,
      usageCount: 203
    },
    {
      id: 'q5',
      text: 'Which HTTP status code indicates a successful request?',
      type: 'single-choice',
      options: ['200', '404', '500', '301'],
      correctAnswer: '200',
      explanation: '200 OK indicates that the request has succeeded. 404 means not found, 500 indicates server error, and 301 is for permanent redirect.',
      skill: 'HTTP',
      category: 'Backend Development',
      difficulty: 'easy',
      tags: ['http', 'status-codes', 'web'],
      createdAt: '2024-01-11T11:45:00Z',
      createdBy: 'admin',
      isActive: true,
      usageCount: 94
    }
  ];

  useEffect(() => {
    // Simulate loading questions
    const loadQuestions = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setQuestions(sampleQuestions);
      setLoading(false);
    };
    loadQuestions();
  }, []);

  const categories = ['all', ...Array.from(new Set(questions.map(q => q.category)))];
  const skills = ['all', ...Array.from(new Set(questions.map(q => q.skill)))];
  const difficulties = ['all', 'easy', 'medium', 'hard'];
  const types = ['all', 'single-choice', 'multiple-choice', 'true-false'];

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || question.category === selectedCategory;
    const matchesSkill = selectedSkill === 'all' || question.skill === selectedSkill;
    const matchesDifficulty = selectedDifficulty === 'all' || question.difficulty === selectedDifficulty;
    const matchesType = selectedType === 'all' || question.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesSkill && matchesDifficulty && matchesType;
  });

  const resetForm = () => {
    setFormData({
      text: '',
      type: 'single-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      skill: '',
      category: '',
      difficulty: 'medium',
      tags: [],
      timeLimit: undefined
    });
  };

  const handleCreateQuestion = () => {
    setSelectedQuestion(null);
    resetForm();
    setShowCreateDialog(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setFormData({
      text: question.text,
      type: question.type,
      options: question.options,
      correctAnswer: question.correctAnswer as string,
      explanation: question.explanation,
      skill: question.skill,
      category: question.category,
      difficulty: question.difficulty,
      tags: question.tags,
      timeLimit: question.timeLimit
    });
    setShowEditDialog(true);
  };

  const handlePreviewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowPreviewDialog(true);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      toast.success('Question deleted successfully');
    }
  };

  const handleDuplicateQuestion = (question: Question) => {
    const duplicated: Question = {
      ...question,
      id: `q${Date.now()}`,
      text: `${question.text} (Copy)`,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    setQuestions(prev => [duplicated, ...prev]);
    toast.success('Question duplicated successfully');
  };

  const handleSaveQuestion = () => {
    if (!formData.text || !formData.skill || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.options.filter(opt => opt.trim()).length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    if (!formData.correctAnswer) {
      toast.error('Please select the correct answer');
      return;
    }

    const questionData: Question = {
      id: selectedQuestion?.id || `q${Date.now()}`,
      text: formData.text,
      type: formData.type,
      options: formData.options.filter(opt => opt.trim()),
      correctAnswer: formData.correctAnswer,
      explanation: formData.explanation,
      skill: formData.skill,
      category: formData.category,
      difficulty: formData.difficulty,
      tags: formData.tags,
      timeLimit: formData.timeLimit,
      createdAt: selectedQuestion?.createdAt || new Date().toISOString(),
      createdBy: 'current-user',
      isActive: true,
      usageCount: selectedQuestion?.usageCount || 0
    };

    if (selectedQuestion) {
      setQuestions(prev => prev.map(q => q.id === selectedQuestion.id ? questionData : q));
      toast.success('Question updated successfully');
    } else {
      setQuestions(prev => [questionData, ...prev]);
      toast.success('Question created successfully');
    }

    setShowCreateDialog(false);
    setShowEditDialog(false);
    resetForm();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'single-choice': return '◉';
      case 'multiple-choice': return '☐';
      case 'true-false': return '◯';
      default: return '?';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Question Bank</h1>
            <p className="text-muted-foreground">Manage assessment questions and build your question library</p>
          </div>
          <Button onClick={handleCreateQuestion}>
            <Plus className="w-4 h-4 mr-2" />
            Create Question
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-primary mr-4" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{questions.length}</p>
                  <p className="text-sm text-muted-foreground">Total Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-success mr-4" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{questions.filter(q => q.isActive).length}</p>
                  <p className="text-sm text-muted-foreground">Active Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Tag className="w-8 h-8 text-warning mr-4" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{skills.length - 1}</p>
                  <p className="text-sm text-muted-foreground">Skills Covered</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round(questions.reduce((acc, q) => acc + q.usageCount, 0) / questions.length) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Usage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
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
              
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map(skill => (
                    <SelectItem key={skill} value={skill}>
                      {skill === 'all' ? 'All Skills' : skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-full mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-muted rounded w-20"></div>
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-6 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No questions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== 'all' || selectedSkill !== 'all' || selectedDifficulty !== 'all' || selectedType !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating your first question.'
                }
              </p>
              <Button onClick={handleCreateQuestion}>
                <Plus className="w-4 h-4 mr-2" />
                Create Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-mono">{getTypeIcon(question.type)}</span>
                        <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {question.skill}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          {question.category}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-foreground mb-2 line-clamp-2">
                        {question.text}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                        {question.explanation}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {question.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                        {question.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{question.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right text-sm text-muted-foreground mr-4">
                        <p>Used {question.usageCount} times</p>
                        <p>{new Date(question.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreviewQuestion(question)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateQuestion(question)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditQuestion(question)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-error hover:text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Question Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={() => {
        setShowCreateDialog(false);
        setShowEditDialog(false);
        resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedQuestion ? 'Edit Question' : 'Create New Question'}
            </DialogTitle>
            <DialogDescription>
              {selectedQuestion ? 'Update the question details below.' : 'Fill in the details to create a new question.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="question-text">Question Text *</Label>
              <Textarea
                id="question-text"
                placeholder="Enter your question..."
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                className="min-h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question-type">Question Type *</Label>
                <Select value={formData.type} onValueChange={(value: Question['type']) => 
                  setFormData(prev => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-choice">Single Choice</SelectItem>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="true-false">True/False</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty *</Label>
                <Select value={formData.difficulty} onValueChange={(value: Question['difficulty']) => 
                  setFormData(prev => ({ ...prev, difficulty: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Answer Options *</Label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <Input
                    key={index}
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[index] = e.target.value;
                      setFormData(prev => ({ ...prev, options: newOptions }));
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Correct Answer *</Label>
              {formData.type === 'multiple-choice' ? (
                <div className="space-y-2">
                  {formData.options.filter(opt => opt.trim()).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`correct-${index}`}
                        checked={(formData.correctAnswer as string[])?.includes(option) || false}
                        onCheckedChange={(checked) => {
                          const currentAnswers = Array.isArray(formData.correctAnswer) 
                            ? formData.correctAnswer 
                            : [];
                          if (checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              correctAnswer: [...currentAnswers, option] 
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              correctAnswer: currentAnswers.filter(a => a !== option) 
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`correct-${index}`} className="text-sm">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={formData.correctAnswer as string}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: value }))}
                >
                  {formData.options.filter(opt => opt.trim()).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`radio-${index}`} />
                      <Label htmlFor={`radio-${index}`} className="text-sm">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation</Label>
              <Textarea
                id="explanation"
                placeholder="Explain why this is the correct answer..."
                value={formData.explanation}
                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                className="min-h-16"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skill">Skill *</Label>
                <Input
                  id="skill"
                  placeholder="e.g., React, JavaScript"
                  value={formData.skill}
                  onChange={(e) => setFormData(prev => ({ ...prev, skill: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  placeholder="e.g., Frontend Development"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion}>
              {selectedQuestion ? 'Update Question' : 'Create Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Question Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Question Preview</DialogTitle>
          </DialogHeader>
          
          {selectedQuestion && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-mono">{getTypeIcon(selectedQuestion.type)}</span>
                <Badge className={getDifficultyColor(selectedQuestion.difficulty)}>
                  {selectedQuestion.difficulty}
                </Badge>
                <Badge variant="outline">{selectedQuestion.skill}</Badge>
              </div>
              
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-medium text-foreground mb-4">{selectedQuestion.text}</h3>
                
                <div className="space-y-2">
                  {selectedQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                      <span className="text-sm font-mono w-6 text-center">
                        {selectedQuestion.type === 'multiple-choice' ? '☐' : '○'}
                      </span>
                      <span className="text-sm">{option}</span>
                      {(Array.isArray(selectedQuestion.correctAnswer) 
                        ? selectedQuestion.correctAnswer.includes(option)
                        : selectedQuestion.correctAnswer === option
                      ) && (
                        <CheckCircle className="w-4 h-4 text-success ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedQuestion.explanation && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Explanation:</strong> {selectedQuestion.explanation}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex flex-wrap gap-1">
                {selectedQuestion.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}






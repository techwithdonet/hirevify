import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Save, Eye, Play, Trash2, Edit3, Copy, Settings, Brain, Clock, Target, Users, CheckCircle, AlertCircle, ChevronDown, ChevronUp, GripVertical, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';

interface Question {
  id: string;
  type: 'multiple-choice' | 'code' | 'essay' | 'true-false' | 'ranking' | 'matching';
  question: string;
  description?: string;
  options?: string[];
  correctAnswer?: string | string[] | number;
  explanation?: string;
  points: number;
  timeLimit?: number; // in seconds
  difficulty: 'easy' | 'medium' | 'hard';
  skills: string[];
  codeTemplate?: string; // for coding questions
  expectedOutput?: string; // for coding questions
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // total time in minutes
  totalQuestions: number;
  passingScore: number;
  skills: string[];
  instructions: string;
  questions: Question[];
  settings: {
    randomizeQuestions: boolean;
    showCorrectAnswers: boolean;
    allowRetakes: boolean;
    maxAttempts: number;
    proctoring: boolean;
    autoGrade: boolean;
  };
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
}

interface CustomAssessmentBuilderProps {
  onBack: () => void;
  existingAssessment?: Assessment;
  onSave?: (assessment: Assessment) => void;
}

export function CustomAssessmentBuilder({ onBack, existingAssessment, onSave }: CustomAssessmentBuilderProps) {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('basic');
  const [assessment, setAssessment] = useState<Assessment>({
    id: existingAssessment?.id || `assessment_${Date.now()}`,
    title: existingAssessment?.title || '',
    description: existingAssessment?.description || '',
    category: existingAssessment?.category || '',
    difficulty: existingAssessment?.difficulty || 'intermediate',
    duration: existingAssessment?.duration || 60,
    totalQuestions: existingAssessment?.totalQuestions || 0,
    passingScore: existingAssessment?.passingScore || 70,
    skills: existingAssessment?.skills || [],
    instructions: existingAssessment?.instructions || '',
    questions: existingAssessment?.questions || [],
    settings: existingAssessment?.settings || {
      randomizeQuestions: false,
      showCorrectAnswers: true,
      allowRetakes: true,
      maxAttempts: 3,
      proctoring: false,
      autoGrade: true,
    },
    isPublic: existingAssessment?.isPublic || false,
    createdBy: existingAssessment?.createdBy || user?.id || '',
    createdAt: existingAssessment?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: existingAssessment?.status || 'draft'
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    type: 'multiple-choice',
    question: '',
    description: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 1,
    timeLimit: 120,
    difficulty: 'medium',
    skills: [],
    codeTemplate: '',
    expectedOutput: ''
  });

  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const categories = [
    'Frontend Development',
    'Backend Development',
    'Full Stack Development',
    'Mobile Development',
    'Data Science',
    'DevOps & Cloud',
    'Design & UX',
    'Product Management',
    'QA Testing',
    'Cybersecurity',
    'Business Analysis',
    'Project Management'
  ];

  const questionTypes = [
    { value: 'multiple-choice', label: 'Multiple Choice', icon: 'ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“' },
    { value: 'code', label: 'Coding Challenge', icon: '</>' },
    { value: 'essay', label: 'Essay/Long Answer', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â' },
    { value: 'true-false', label: 'True/False', icon: 'ÃƒÂ¢Ã‚ÂÃ¢â‚¬Å“' },
    { value: 'ranking', label: 'Ranking/Ordering', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â ' },
    { value: 'matching', label: 'Matching', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬â€' }
  ];

  const updateAssessment = (updates: Partial<Assessment>) => {
    setAssessment(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
      totalQuestions: updates.questions ? updates.questions.length : prev.totalQuestions
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !assessment.skills.includes(newSkill.trim())) {
      updateAssessment({
        skills: [...assessment.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    updateAssessment({
      skills: assessment.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      toast.error('Question text is required');
      return;
    }

    const questionWithId = {
      ...currentQuestion,
      id: `question_${Date.now()}`,
      skills: currentQuestion.skills.length ? currentQuestion.skills : assessment.skills.slice(0, 2)
    };

    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...assessment.questions];
      updatedQuestions[editingQuestionIndex] = questionWithId;
      updateAssessment({ questions: updatedQuestions });
      setEditingQuestionIndex(null);
    } else {
      updateAssessment({
        questions: [...assessment.questions, questionWithId]
      });
    }

    resetQuestionForm();
    setShowQuestionForm(false);
    toast.success(editingQuestionIndex !== null ? 'Question updated' : 'Question added');
  };

  const editQuestion = (index: number) => {
    const question = assessment.questions[index];
    setCurrentQuestion(question);
    setEditingQuestionIndex(index);
    setShowQuestionForm(true);
    setCurrentTab('questions');
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = assessment.questions.filter((_, i) => i !== index);
    updateAssessment({ questions: updatedQuestions });
    toast.success('Question deleted');
  };

  const duplicateQuestion = (index: number) => {
    const question = assessment.questions[index];
    const duplicatedQuestion = {
      ...question,
      id: `question_${Date.now()}`,
      question: `${question.question} (Copy)`
    };
    const updatedQuestions = [...assessment.questions];
    updatedQuestions.splice(index + 1, 0, duplicatedQuestion);
    updateAssessment({ questions: updatedQuestions });
    toast.success('Question duplicated');
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      id: '',
      type: 'multiple-choice',
      question: '',
      description: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 1,
      timeLimit: 120,
      difficulty: 'medium',
      skills: [],
      codeTemplate: '',
      expectedOutput: ''
    });
  };

  const saveAssessment = () => {
    if (!assessment.title.trim()) {
      toast.error('Assessment title is required');
      setCurrentTab('basic');
      return;
    }

    if (!assessment.category) {
      toast.error('Assessment category is required');
      setCurrentTab('basic');
      return;
    }

    if (assessment.questions.length === 0) {
      toast.error('At least one question is required');
      setCurrentTab('questions');
      return;
    }

    const savedAssessment = {
      ...assessment,
      status: 'draft' as const,
      updatedAt: new Date().toISOString()
    };

    if (onSave) {
      onSave(savedAssessment);
    }

    toast.success('Assessment saved successfully');
  };

  const publishAssessment = () => {
    if (assessment.questions.length < 5) {
      toast.error('At least 5 questions are required to publish');
      return;
    }

    const publishedAssessment = {
      ...assessment,
      status: 'published' as const,
      updatedAt: new Date().toISOString()
    };

    updateAssessment({ status: 'published' });
    
    if (onSave) {
      onSave(publishedAssessment);
    }

    toast.success('Assessment published successfully');
  };

  const previewAssessment = () => {
    if (assessment.questions.length === 0) {
      toast.error('Add questions to preview the assessment');
      return;
    }
    toast.info('Preview functionality would open assessment in test mode');
  };

  const renderQuestionForm = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}
          </CardTitle>
          <Button variant="ghost" onClick={() => setShowQuestionForm(false)}>
            ÃƒÆ’Ã¢â‚¬â€
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Question Type</Label>
            <Select 
              value={currentQuestion.type} 
              onValueChange={(value: any) => setCurrentQuestion(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questionTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Question Text *</Label>
            <Textarea
              value={currentQuestion.question}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Enter your question here..."
              className="min-h-20"
            />
          </div>

          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              value={currentQuestion.description}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional context or instructions..."
              className="min-h-16"
            />
          </div>

          {currentQuestion.type === 'multiple-choice' && (
            <div>
              <Label>Answer Options</Label>
              <div className="space-y-2">
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(currentQuestion.options || [])];
                        newOptions[index] = e.target.value;
                        setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={currentQuestion.correctAnswer === option}
                      onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: option }))}
                      className="w-4 h-4"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentQuestion(prev => ({ 
                    ...prev, 
                    options: [...(prev.options || []), ''] 
                  }))}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {currentQuestion.type === 'code' && (
            <>
              <div>
                <Label>Code Template (Optional)</Label>
                <Textarea
                  value={currentQuestion.codeTemplate}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, codeTemplate: e.target.value }))}
                  placeholder="// Initial code template for candidates..."
                  className="min-h-32 font-mono text-sm"
                />
              </div>
              <div>
                <Label>Expected Output/Solution</Label>
                <Textarea
                  value={currentQuestion.expectedOutput}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, expectedOutput: e.target.value }))}
                  placeholder="Expected output or solution guidelines..."
                  className="min-h-20"
                />
              </div>
            </>
          )}

          {currentQuestion.type === 'true-false' && (
            <div>
              <Label>Correct Answer</Label>
              <Select 
                value={currentQuestion.correctAnswer as string} 
                onValueChange={(value) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select correct answer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Points</Label>
              <Input
                type="number"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                min="1"
                max="10"
              />
            </div>
            <div>
              <Label>Time Limit (seconds)</Label>
              <Input
                type="number"
                value={currentQuestion.timeLimit}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 120 }))}
                min="30"
                max="1800"
              />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select 
                value={currentQuestion.difficulty} 
                onValueChange={(value: any) => setCurrentQuestion(prev => ({ ...prev, difficulty: value }))}
              >
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

          <div>
            <Label>Explanation (Optional)</Label>
            <Textarea
              value={currentQuestion.explanation}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Explanation of the correct answer..."
              className="min-h-16"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={addQuestion} className="flex-1">
            {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
          </Button>
          <Button variant="outline" onClick={() => setShowQuestionForm(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderQuestionsList = () => (
    <div className="space-y-4">
      {assessment.questions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No questions added yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your assessment by adding questions
            </p>
            <Button onClick={() => setShowQuestionForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Questions ({assessment.questions.length})</h3>
              <p className="text-sm text-muted-foreground">
                Total Points: {assessment.questions.reduce((sum, q) => sum + q.points, 0)}
              </p>
            </div>
            <Button onClick={() => setShowQuestionForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>

          <div className="space-y-3">
            {assessment.questions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {questionTypes.find(t => t.value === question.type)?.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {question.points} point{question.points !== 1 ? 's' : ''}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            question.difficulty === 'easy' ? 'text-green-600' :
                            question.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}
                        >
                          {question.difficulty}
                        </Badge>
                      </div>
                      <h4 className="font-medium mb-1">
                        {index + 1}. {question.question}
                      </h4>
                      {question.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {question.description}
                        </p>
                      )}
                      {question.options && question.type === 'multiple-choice' && (
                        <div className="text-sm text-muted-foreground">
                          {question.options.filter(opt => opt.trim()).length} options
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => editQuestion(index)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => duplicateQuestion(index)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteQuestion(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
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
              Back to Assessments
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {existingAssessment ? 'Edit Assessment' : 'Create Assessment'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {assessment.title || 'Build custom skills assessments for your hiring process'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge 
              variant="outline"
              className={assessment.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
            >
              {assessment.status}
            </Badge>
            <Button variant="outline" onClick={previewAssessment}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={saveAssessment}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={publishAssessment} disabled={assessment.questions.length < 5}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="questions">
                  Questions ({assessment.questions.length})
                </TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Assessment Title *</Label>
                        <Input
                          value={assessment.title}
                          onChange={(e) => updateAssessment({ title: e.target.value })}
                          placeholder="e.g., React Developer Assessment"
                        />
                      </div>
                      <div>
                        <Label>Category *</Label>
                        <Select 
                          value={assessment.category} 
                          onValueChange={(value) => updateAssessment({ category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={assessment.description}
                        onChange={(e) => updateAssessment({ description: e.target.value })}
                        placeholder="Describe what this assessment evaluates..."
                        className="min-h-20"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label>Difficulty Level</Label>
                        <Select 
                          value={assessment.difficulty} 
                          onValueChange={(value: any) => updateAssessment({ difficulty: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={assessment.duration}
                          onChange={(e) => updateAssessment({ duration: parseInt(e.target.value) || 60 })}
                          min="15"
                          max="300"
                        />
                      </div>
                      <div>
                        <Label>Passing Score (%)</Label>
                        <Input
                          type="number"
                          value={assessment.passingScore}
                          onChange={(e) => updateAssessment({ passingScore: parseInt(e.target.value) || 70 })}
                          min="50"
                          max="100"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Skills Covered</Label>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {assessment.skills.map(skill => (
                            <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                              {skill} ÃƒÆ’Ã¢â‚¬â€
                            </Badge>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <Input
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                            placeholder="Add a skill..."
                          />
                          <Button onClick={addSkill} variant="outline">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Instructions for Candidates</Label>
                      <Textarea
                        value={assessment.instructions}
                        onChange={(e) => updateAssessment({ instructions: e.target.value })}
                        placeholder="Provide instructions that candidates will see before starting the assessment..."
                        className="min-h-24"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="questions" className="space-y-6">
                {showQuestionForm && renderQuestionForm()}
                {!showQuestionForm && renderQuestionsList()}
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Randomize Questions</Label>
                          <p className="text-sm text-muted-foreground">Questions will appear in random order</p>
                        </div>
                        <Switch
                          checked={assessment.settings.randomizeQuestions}
                          onCheckedChange={(checked) => updateAssessment({
                            settings: { ...assessment.settings, randomizeQuestions: checked }
                          })}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Show Correct Answers</Label>
                          <p className="text-sm text-muted-foreground">Display correct answers after completion</p>
                        </div>
                        <Switch
                          checked={assessment.settings.showCorrectAnswers}
                          onCheckedChange={(checked) => updateAssessment({
                            settings: { ...assessment.settings, showCorrectAnswers: checked }
                          })}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Allow Retakes</Label>
                          <p className="text-sm text-muted-foreground">Candidates can retake the assessment</p>
                        </div>
                        <Switch
                          checked={assessment.settings.allowRetakes}
                          onCheckedChange={(checked) => updateAssessment({
                            settings: { ...assessment.settings, allowRetakes: checked }
                          })}
                        />
                      </div>

                      {assessment.settings.allowRetakes && (
                        <div>
                          <Label>Maximum Attempts</Label>
                          <Input
                            type="number"
                            value={assessment.settings.maxAttempts}
                            onChange={(e) => updateAssessment({
                              settings: { ...assessment.settings, maxAttempts: parseInt(e.target.value) || 3 }
                            })}
                            min="1"
                            max="10"
                            className="w-32"
                          />
                        </div>
                      )}

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-Grade Assessment</Label>
                          <p className="text-sm text-muted-foreground">Automatically calculate scores</p>
                        </div>
                        <Switch
                          checked={assessment.settings.autoGrade}
                          onCheckedChange={(checked) => updateAssessment({
                            settings: { ...assessment.settings, autoGrade: checked }
                          })}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Public Assessment</Label>
                          <p className="text-sm text-muted-foreground">Make available to all recruiters</p>
                        </div>
                        <Switch
                          checked={assessment.isPublic}
                          onCheckedChange={(checked) => updateAssessment({ isPublic: checked })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="p-6 border border-border rounded-lg bg-muted/30">
                        <h2 className="text-xl font-bold mb-2">{assessment.title}</h2>
                        <p className="text-muted-foreground mb-4">{assessment.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-bold">{assessment.questions.length}</div>
                            <div className="text-sm text-muted-foreground">Questions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{assessment.duration}min</div>
                            <div className="text-sm text-muted-foreground">Duration</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{assessment.passingScore}%</div>
                            <div className="text-sm text-muted-foreground">Pass Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{assessment.difficulty}</div>
                            <div className="text-sm text-muted-foreground">Level</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {assessment.skills.map(skill => (
                              <Badge key={skill} variant="secondary">{skill}</Badge>
                            ))}
                          </div>
                        </div>

                        {assessment.instructions && (
                          <div className="p-4 bg-background border border-border rounded">
                            <h4 className="font-semibold mb-2">Instructions:</h4>
                            <p className="text-sm">{assessment.instructions}</p>
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <Button onClick={previewAssessment} size="lg">
                          <Play className="w-5 h-5 mr-2" />
                          Start Assessment Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Completion</span>
                      <span>{Math.round((
                        (assessment.title ? 1 : 0) +
                        (assessment.category ? 1 : 0) +
                        (assessment.questions.length > 0 ? 1 : 0) +
                        (assessment.skills.length > 0 ? 1 : 0)
                      ) / 4 * 100)}%</span>
                    </div>
                    <Progress value={
                      (assessment.title ? 1 : 0) +
                      (assessment.category ? 1 : 0) +
                      (assessment.questions.length > 0 ? 1 : 0) +
                      (assessment.skills.length > 0 ? 1 : 0)
                    } max={4} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      {assessment.title ? <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> : <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />}
                      Basic Information
                    </div>
                    <div className="flex items-center text-sm">
                      {assessment.questions.length > 0 ? <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> : <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />}
                      Questions ({assessment.questions.length})
                    </div>
                    <div className="flex items-center text-sm">
                      {assessment.skills.length > 0 ? <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> : <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />}
                      Skills ({assessment.skills.length})
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Questions</span>
                    <span className="font-medium">{assessment.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Points</span>
                    <span className="font-medium">{assessment.questions.reduce((sum, q) => sum + q.points, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg. Time per Question</span>
                    <span className="font-medium">
                      {assessment.questions.length > 0 ? Math.round(assessment.duration * 60 / assessment.questions.length) : 0}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Skills Covered</span>
                    <span className="font-medium">{assessment.skills.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setCurrentTab('questions')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={previewAssessment}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Assessment
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={saveAssessment}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}








import { useState } from 'react';
import { ArrowLeft, BookOpen, Play, Download, Star, Clock, Users, Award, CheckCircle, TrendingUp, Brain, Target, Lightbulb, BarChart3, Crown, Search, Filter, Eye, ChevronRight, FileText, Video, Monitor, Headphones, ExternalLink, ChevronLeft, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';

interface EmployerEducationProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

interface Slide {
  id: string;
  title: string;
  content: string;
  bulletPoints?: string[];
  example?: string;
  tip?: string;
  image?: string;
}

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  learningOutcomes: string[];
  isCompleted: boolean;
  rating: number;
  enrolledCount: number;
  type: 'video' | 'interactive' | 'document' | 'webinar';
  isNew: boolean;
  isPremium: boolean;
  content: {
    introduction: string;
    chapters: {
      title: string;
      duration: number;
      description: string;
      slides: Slide[];
    }[];
    resources: string[];
    quiz: {
      question: string;
      options: string[];
      correct: number;
      explanation: string;
    }[];
  };
}

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'guide' | 'template' | 'checklist' | 'whitepaper' | 'case-study';
  rating: number;
  fileSize?: string;
  isPremium: boolean;
  content: string;
}

// Content generation functions for realistic resources
const generateSkillsFrameworkTemplate = () => {
  return `SKILLS FRAMEWORK TEMPLATE - CSV Format for Excel Import

=== ROLE ANALYSIS WORKSHEET ===
Role Title,Department,Level,Key Responsibilities,Success Metrics
Software Engineer,Engineering,Mid-Level,"Design and develop software applications, Code review, Bug fixing, Technical documentation","Code quality score >85%, Sprint completion rate >90%, Bug resolution time <2 days"
Product Manager,Product,Senior,"Product strategy, Roadmap planning, Stakeholder management, Market analysis","Feature adoption rate >70%, Time to market <6 months, Customer satisfaction >4.5/5"
Marketing Specialist,Marketing,Junior,"Campaign execution, Content creation, Social media management, Analytics reporting","Campaign ROI >300%, Engagement rate >5%, Lead generation >50/month"

=== SKILLS MAPPING MATRIX ===
Skill Category,Skill Name,Must Have,Should Have,Nice to Have,Can Learn,Assessment Method
Technical,JavaScript,X,,,,"Code challenge, Portfolio review"
Technical,React,X,,,,"Live coding, Previous projects"
Technical,Node.js,,X,,,"Technical interview, Code samples"
Technical,Database Design,,X,,,"System design, SQL queries"
Soft Skills,Communication,X,,,,"Presentation, Written samples"
Soft Skills,Problem Solving,X,,,,"Case studies, Behavioral questions"
Soft Skills,Teamwork,,X,,,"Team exercise, References"
Soft Skills,Leadership,,,X,,"Situational questions, Past examples"

=== COMPETENCY LEVEL DEFINITIONS ===
Level,Description,Years Experience,Key Indicators,Assessment Criteria
Novice,Basic understanding of concepts,0-1 years,"Can perform simple tasks with guidance, Limited experience","Complete basic tasks, Demonstrate fundamental knowledge"
Developing,Growing proficiency,1-3 years,"Can work independently on routine tasks, Some experience","Handle moderate complexity, Show growth potential"
Proficient,Solid competence,3-5 years,"Can handle complex tasks independently, Proven track record","Deliver quality work, Mentor others occasionally"
Advanced,High expertise,5-8 years,"Can solve complex problems, Recognized expert","Lead projects, Innovate solutions"
Expert,Mastery level,8+ years,"Industry recognition, Thought leadership","Set standards, Influence strategy"

This template provides a comprehensive framework for implementing skills-based hiring across your organization.`;
};

const generateInterviewGuide = () => {
  return `STRUCTURED INTERVIEW GUIDE
200+ Pre-Validated Questions for Skills-Based Hiring

=== INTERVIEW SCORING RUBRIC ===
Rating Scale: 1-5 (1=Poor, 2=Below Average, 3=Average, 4=Good, 5=Excellent)

=== TECHNICAL SKILLS QUESTIONS ===
1. Walk me through how you would debug a performance issue in a web application.
2. Explain the difference between synchronous and asynchronous programming.
3. How would you implement user authentication in a web application?
4. Describe your approach to code review and what you look for.
5. How do you ensure your code is maintainable and scalable?

=== BEHAVIORAL QUESTIONS ===
1. Tell me about a time you had to lead a team through a challenging project.
2. Describe a situation where you had to make a difficult decision with limited information.
3. How do you handle conflicts within your team?
4. Tell me about a time you had to give constructive feedback.
5. Describe your approach to delegating tasks effectively.

This comprehensive guide provides everything needed to conduct fair, consistent, and effective skills-based interviews.`;
};

const generateBiasPreventionChecklist = () => {
  return `HIRING BIAS PREVENTION CHECKLIST
Comprehensive Guide to Fair and Inclusive Recruitment

=== JOB POSTING REVIEW ===
ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¡ Remove unnecessary degree requirements
ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¡ Use inclusive language throughout
ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¡ Focus on skills rather than years of experience
ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¡ Include diversity and inclusion statement
ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¡ Specify available accommodations

=== INTERVIEW PROCESS ===
ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¡ Use structured interview format
ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¡ Ask consistent questions to all candidates
ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¡ Form diverse interview panels
ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¡ Document decision-making rationale
ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¡ Provide equal time to all candidates

This checklist ensures fair and inclusive hiring practices throughout your recruitment process.`;
};

export function EmployerEducation({ onBack, onUpgrade }: EmployerEducationProps) {
  const [activeTab, setActiveTab] = useState('modules');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [userProgress, setUserProgress] = useState<{ [moduleId: string]: number }>({});
  
  // Interactive learning states
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [chapterProgress, setChapterProgress] = useState<{ [chapterId: string]: boolean }>({});
  const [showFinalQuiz, setShowFinalQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [questionIndex: number]: number }>({});
  const [quizResults, setQuizResults] = useState<{ [questionIndex: number]: boolean } | null>(null);
  const [showSlideContent, setShowSlideContent] = useState(false);

  // Comprehensive training modules with real slide content
  const trainingModules: TrainingModule[] = [
    {
      id: 'skills-based-hiring-101',
      title: 'Skills-Based Hiring Fundamentals',
      description: 'Master the core principles of skills-based hiring and transform your recruitment process to focus on what candidates can do, not just their credentials.',
      category: 'Fundamentals',
      duration: 45,
      difficulty: 'beginner',
      topics: ['Skills vs. Credentials', 'Building Job Requirements', 'Assessment Design', 'Interview Techniques'],
      learningOutcomes: [
        'Understand the ROI benefits of skills-based hiring',
        'Design job requirements that focus on skills',
        'Create effective skills assessments',
        'Conduct structured skills-focused interviews',
        'Reduce hiring bias and improve diversity'
      ],
      isCompleted: false,
      rating: 4.8,
      enrolledCount: 1247,
      type: 'video',
      isNew: true,
      isPremium: false,
      content: {
        introduction: 'Welcome to Skills-Based Hiring Fundamentals. In this comprehensive course, you\'ll learn how to shift from traditional credential-based hiring to a more effective, inclusive approach that focuses on what candidates can actually do.',
        chapters: [
          {
            title: 'Introduction to Skills-Based Hiring',
            duration: 12,
            description: 'Overview of skills-based hiring principles and benefits',
            slides: [
              {
                id: 'slide-1',
                title: 'What is Skills-Based Hiring?',
                content: 'Skills-based hiring is a recruitment approach that prioritizes a candidate\'s demonstrated abilities and competencies over traditional credentials like degrees or years of experience.',
                bulletPoints: [
                  'Focus on what candidates can DO, not what they HAVE',
                  'Evaluate actual job-relevant skills through practical assessments',
                  'Reduce bias by standardizing evaluation criteria',
                  'Increase diversity by removing credential barriers'
                ]
              },
              {
                id: 'slide-2',
                title: 'The Problem with Traditional Hiring',
                content: 'Traditional credential-based hiring often excludes qualified candidates and perpetuates inequality in the workplace.',
                bulletPoints: [
                  '76% of jobs require a degree, but only 43% actually need one',
                  'Degree requirements eliminate 70% of working adults',
                  'Credentials don\'t predict job performance',
                  'Creates barriers for underrepresented groups'
                ],
                example: 'A software developer role requiring a CS degree might miss excellent self-taught programmers with strong coding skills.'
              },
              {
                id: 'slide-3',
                title: 'Benefits of Skills-Based Hiring',
                content: 'Organizations using skills-based hiring see significant improvements in talent quality, diversity, and retention.',
                bulletPoints: [
                  '5x larger talent pool to choose from',
                  '70% increase in workplace diversity',
                  '25% improvement in employee performance',
                  '40% reduction in turnover rates'
                ],
                tip: 'Companies like IBM, Google, and Apple have removed degree requirements for many roles and seen improved hiring outcomes.'
              }
            ]
          },
          {
            title: 'Designing Skills-Based Job Requirements',
            duration: 15,
            description: 'Learn how to identify and articulate the essential skills for any role',
            slides: [
              {
                id: 'slide-4',
                title: 'Skills Identification Framework',
                content: 'A systematic approach to identifying the skills that truly matter for job success.',
                bulletPoints: [
                  'Analyze top performer behaviors and outcomes',
                  'Map daily tasks to required competencies',
                  'Distinguish between nice-to-have and must-have skills',
                  'Consider both technical and soft skills'
                ]
              },
              {
                id: 'slide-5',
                title: 'Writing Skills-Focused Job Descriptions',
                content: 'Transform traditional job descriptions into skills-focused narratives that attract diverse talent.',
                bulletPoints: [
                  'Lead with outcomes and impact, not requirements',
                  'Use inclusive language that encourages applications',
                  'Specify how skills will be assessed',
                  'Focus on growth potential, not just current abilities'
                ],
                example: 'Instead of "5+ years experience required" write "Demonstrated ability to lead complex projects and deliver results"'
              }
            ]
          }
        ],
        resources: [
          'Skills Matrix Template',
          'Job Description Checklist',
          'Assessment Planning Guide',
          'Interview Question Bank'
        ],
        quiz: [
          {
            question: 'What is the primary benefit of skills-based hiring over traditional credential-based hiring?',
            options: [
              'It\'s faster to implement',
              'It focuses on candidate abilities rather than credentials',
              'It requires less interviewer training',
              'It eliminates the need for background checks'
            ],
            correct: 1,
            explanation: 'Skills-based hiring prioritizes what candidates can actually do rather than their educational background or credentials, leading to better hiring outcomes and increased diversity.'
          },
          {
            question: 'When designing skills assessments, you should:',
            options: [
              'Use only technical tests',
              'Focus on theoretical knowledge',
              'Mirror real work scenarios',
              'Test every possible skill'
            ],
            correct: 2,
            explanation: 'Effective assessments should mirror real work scenarios to predict actual job performance and provide candidates with a realistic preview of the role.'
          }
        ]
      }
    },
    {
      id: 'bias-elimination',
      title: 'Eliminating Bias in Hiring Decisions',
      description: 'Learn to identify and remove unconscious bias from every stage of your hiring process to build more diverse, effective teams.',
      category: 'Diversity & Inclusion',
      duration: 60,
      difficulty: 'intermediate',
      topics: ['Types of Bias', 'Structured Interviews', 'Blind Resume Review', 'Diverse Hiring Panels'],
      learningOutcomes: [
        'Identify 12 common types of hiring bias',
        'Implement structured interview processes',
        'Create bias-free job descriptions and requirements',
        'Build diverse hiring teams and panels',
        'Use data to measure bias reduction'
      ],
      isCompleted: false,
      rating: 4.9,
      enrolledCount: 892,
      type: 'interactive',
      isNew: false,
      isPremium: false,
      content: {
        introduction: 'Unconscious bias affects every hiring decision. This interactive course provides practical strategies to identify, understand, and eliminate bias throughout your recruitment process.',
        chapters: [
          {
            title: 'Understanding Unconscious Bias',
            duration: 15,
            description: 'Types of bias and how they impact hiring decisions',
            slides: [
              {
                id: 'bias-slide-1',
                title: 'What is Unconscious Bias?',
                content: 'Unconscious bias refers to automatic mental associations and judgments that occur without our conscious awareness, affecting our decision-making processes.',
                bulletPoints: [
                  'Also called implicit bias or cognitive bias',
                  'Developed through life experiences and cultural exposure',
                  'Affects everyone, regardless of intentions',
                  'Can lead to unfair hiring decisions'
                ]
              },
              {
                id: 'bias-slide-2',
                title: 'Common Types of Hiring Bias',
                content: 'Understanding different types of bias helps us recognize and address them in our hiring processes.',
                bulletPoints: [
                  'Affinity Bias: Favoring candidates similar to ourselves',
                  'Halo Effect: One positive trait overshadowing others',
                  'Confirmation Bias: Seeking information that confirms initial impressions',
                  'Attribution Bias: Assuming reasons for candidate behavior'
                ],
                example: 'Affinity bias might lead a hiring manager to prefer candidates who attended the same university or share similar hobbies.'
              }
            ]
          },
          {
            title: 'Implementing Bias-Free Processes',
            duration: 20,
            description: 'Practical strategies to reduce bias at each hiring stage',
            slides: [
              {
                id: 'bias-slide-3',
                title: 'Structured Interview Techniques',
                content: 'Standardized approaches that reduce subjective decision-making.',
                bulletPoints: [
                  'Ask all candidates the same core questions',
                  'Use behavioral interview methods (STAR format)',
                  'Score responses using predetermined criteria',
                  'Include diverse interview panel members'
                ]
              }
            ]
          }
        ],
        resources: [
          'Bias Identification Checklist',
          'Structured Interview Guide',
          'Inclusive Language Guide'
        ],
        quiz: [
          {
            question: 'Which is an example of affinity bias in hiring?',
            options: [
              'Preferring candidates from similar backgrounds to your own',
              'Judging a candidate solely on first impressions',
              'Focusing only on recent achievements',
              'Making assumptions based on appearance'
            ],
            correct: 0,
            explanation: 'Affinity bias occurs when we unconsciously favor candidates who are similar to us in background, experiences, or characteristics, which can limit diversity in hiring.'
          }
        ]
      }
    },
    {
      id: 'remote-hiring-excellence',
      title: 'Remote Hiring Excellence',
      description: 'Master the unique challenges and opportunities of hiring for remote and hybrid work environments.',
      category: 'Remote Work',
      duration: 50,
      difficulty: 'intermediate',
      topics: ['Remote Skills Assessment', 'Virtual Interviews', 'Cultural Fit for Remote', 'Onboarding'],
      learningOutcomes: [
        'Identify skills crucial for remote work success',
        'Conduct effective virtual interviews',
        'Assess cultural fit for remote teams',
        'Design inclusive remote onboarding',
        'Build trust and engagement from day one'
      ],
      isCompleted: false,
      rating: 4.7,
      enrolledCount: 634,
      type: 'webinar',
      isNew: true,
      isPremium: false,
      content: {
        introduction: 'Remote hiring requires a different approach. Learn how to identify, evaluate, and onboard remote workers who will thrive in distributed teams.',
        chapters: [
          {
            title: 'Remote Work Skills Assessment',
            duration: 15,
            description: 'Identifying candidates who excel in remote environments',
            slides: [
              {
                id: 'remote-slide-1',
                title: 'Essential Remote Work Skills',
                content: 'Success in remote work requires specific competencies beyond job-related skills.',
                bulletPoints: [
                  'Self-direction and time management',
                  'Written and asynchronous communication',
                  'Digital collaboration proficiency',
                  'Adaptability and problem-solving independence'
                ]
              }
            ]
          }
        ],
        resources: [
          'Remote Skills Checklist',
          'Virtual Interview Guide',
          'Remote Onboarding Plan'
        ],
        quiz: [
          {
            question: 'What is the most important skill for remote work success?',
            options: [
              'Technical expertise',
              'Self-direction and time management',
              'Previous remote experience',
              'Advanced technology skills'
            ],
            correct: 1,
            explanation: 'Self-direction and time management are crucial for remote work success, as employees must manage their work independently without direct supervision.'
          }
        ]
      }
    },
    {
      id: 'data-driven-recruiting',
      title: 'Data-Driven Recruiting Analytics',
      description: 'Transform your hiring process with metrics, analytics, and evidence-based decision making.',
      category: 'Analytics',
      duration: 55,
      difficulty: 'advanced',
      topics: ['Recruiting Metrics', 'Predictive Analytics', 'ROI Analysis', 'Performance Tracking'],
      learningOutcomes: [
        'Define and track key recruiting metrics',
        'Use data to optimize hiring processes',
        'Calculate ROI of recruiting initiatives',
        'Implement predictive hiring models',
        'Create data-driven hiring strategies'
      ],
      isCompleted: false,
      rating: 4.6,
      enrolledCount: 423,
      type: 'interactive',
      isNew: false,
      isPremium: true,
      content: {
        introduction: 'Make better hiring decisions with data. Learn to measure, analyze, and optimize every aspect of your recruiting process using metrics and analytics.',
        chapters: [
          {
            title: 'Essential Recruiting Metrics',
            duration: 18,
            description: 'Key performance indicators for recruiting success',
            slides: [
              {
                id: 'analytics-slide-1',
                title: 'Core Recruiting KPIs',
                content: 'Track these essential metrics to understand your hiring performance.',
                bulletPoints: [
                  'Time to fill: Average days from job posting to offer acceptance',
                  'Cost per hire: Total recruiting costs divided by number of hires',
                  'Quality of hire: New hire performance and retention rates',
                  'Source effectiveness: Which channels bring the best candidates'
                ]
              }
            ]
          }
        ],
        resources: [
          'Recruiting Metrics Dashboard',
          'ROI Calculator Template',
          'Predictive Model Guide'
        ],
        quiz: [
          {
            question: 'Which metric best measures the quality of your hiring process?',
            options: [
              'Time to fill',
              'Cost per hire',
              'New hire performance and retention',
              'Number of applications received'
            ],
            correct: 2,
            explanation: 'New hire performance and retention rates are the best indicators of hiring quality, as they measure long-term success and fit.'
          }
        ]
      }
    },
    {
      id: 'legal-compliance-hiring',
      title: 'Legal Compliance in Modern Hiring',
      description: 'Navigate employment law, regulations, and compliance requirements to protect your organization while hiring effectively.',
      category: 'Legal & Compliance',
      duration: 40,
      difficulty: 'intermediate',
      topics: ['Employment Law', 'EEOC Guidelines', 'Background Checks', 'Documentation'],
      learningOutcomes: [
        'Understand key employment laws and regulations',
        'Ensure EEOC compliance in hiring practices',
        'Implement proper background check procedures',
        'Maintain appropriate hiring documentation',
        'Handle accommodation requests professionally'
      ],
      isCompleted: false,
      rating: 4.5,
      enrolledCount: 567,
      type: 'document',
      isNew: false,
      isPremium: false,
      content: {
        introduction: 'Hiring compliance protects both your organization and candidates. Learn essential legal requirements and best practices for compliant recruiting.',
        chapters: [
          {
            title: 'Employment Law Fundamentals',
            duration: 15,
            description: 'Core legal requirements for fair hiring',
            slides: [
              {
                id: 'legal-slide-1',
                title: 'Key Federal Employment Laws',
                content: 'Understanding the legal framework that governs hiring practices.',
                bulletPoints: [
                  'Title VII: Prohibits discrimination based on race, color, religion, sex, national origin',
                  'ADA: Requires reasonable accommodations for disabilities',
                  'Age Discrimination Act: Protects workers 40 and older',
                  'Equal Pay Act: Requires equal pay for equal work'
                ]
              }
            ]
          }
        ],
        resources: [
          'Compliance Checklist',
          'Interview Question Guidelines',
          'Background Check Process'
        ],
        quiz: [
          {
            question: 'Under the ADA, when can you ask about a candidate\'s disabilities?',
            options: [
              'During the initial interview',
              'Only after making a conditional job offer',
              'When reviewing their resume',
              'You can never ask about disabilities'
            ],
            correct: 1,
            explanation: 'The ADA allows disability-related questions only after making a conditional job offer, and only if job-related and consistent for all candidates.'
          }
        ]
      }
    }
  ];

  // Educational resources with comprehensive, realistic content
  const resources: Resource[] = [
    {
      id: 'skills-framework-template',
      title: 'Skills Framework Template',
      description: 'A comprehensive Excel template for defining skills requirements across different roles. Includes competency levels, assessment criteria, and role mapping worksheets.',
      category: 'Templates',
      type: 'template',
      rating: 4.9,
      fileSize: '2.4 MB',
      isPremium: false,
      content: generateSkillsFrameworkTemplate()
    },
    {
      id: 'interview-guide',
      title: 'Structured Interview Guide',
      description: 'A comprehensive guide with 200+ pre-validated interview questions, evaluation criteria, and scoring rubrics for skills-based interviews.',
      category: 'Guides',
      type: 'guide',
      rating: 4.7,
      fileSize: '1.8 MB',
      isPremium: false,
      content: generateInterviewGuide()
    },
    {
      id: 'bias-checklist',
      title: 'Hiring Bias Prevention Checklist',
      description: 'A step-by-step checklist to identify and eliminate bias at each stage of hiring. Includes practical tips and warning signs to watch for.',
      category: 'Checklists',
      type: 'checklist',
      rating: 4.8,
      fileSize: '850 KB',
      isPremium: false,
      content: generateBiasPreventionChecklist()
    }
  ];

  const categories = ['all', 'Fundamentals', 'Diversity & Inclusion', 'Process Optimization', 'Analytics', 'Remote Work', 'Legal & Compliance'];
  const resourceCategories = ['all', 'Templates', 'Guides', 'Checklists', 'Resources'];

  const filteredModules = trainingModules.filter(module => {
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || module.difficulty === selectedDifficulty;
    return matchesCategory && matchesSearch && matchesDifficulty;
  });

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Reset states when starting a new module
  const startModule = (moduleId: string) => {
    const module = trainingModules.find(m => m.id === moduleId);
    if (!module) return;

    setSelectedModule(module);
    setCurrentChapterIndex(0);
    setCurrentSlideIndex(0);
    setShowFinalQuiz(false);
    setShowSlideContent(true);
    setQuizAnswers({});
    setQuizResults(null);
    setChapterProgress({});
    toast.success(`Starting "${module.title}" training module`);
  };

  const downloadResource = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    // Create appropriate file format based on resource type
    let fileName = resource.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    let mimeType = 'text/plain';
    let fileExtension = '.txt';

    if (resource.type === 'template') {
      mimeType = 'text/csv';
      fileExtension = '.csv';
    }

    const blob = new Blob([resource.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    // Create and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded "${resource.title}" - ${resource.type === 'template' ? 'Ready for Excel import' : 'Complete guide downloaded'}`);
    setSelectedResource(resource);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'interactive': return <Brain className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'webinar': return <Headphones className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateModuleProgress = () => {
    if (!selectedModule) return 0;
    
    const totalChapters = selectedModule.content.chapters.length;
    let completedChapters = 0;
    
    selectedModule.content.chapters.forEach((_, index) => {
      const key = `${selectedModule.id}-chapter-${index}`;
      if (chapterProgress[key]) completedChapters++;
    });
    
    if (completedChapters === totalChapters && selectedModule.isCompleted) {
      return 100;
    }
    
    return (completedChapters / (totalChapters + 1)) * 100;
  };

  const markChapterComplete = () => {
    if (!selectedModule) return;
    
    const key = `${selectedModule.id}-chapter-${currentChapterIndex}`;
    setChapterProgress(prev => ({ ...prev, [key]: true }));
    
    const newProgress = calculateModuleProgress();
    setUserProgress(prev => ({ ...prev, [selectedModule.id]: newProgress }));
    
    const allChaptersComplete = selectedModule.content.chapters.every((_, index) => {
      const chapterKey = `${selectedModule.id}-chapter-${index}`;
      return chapterProgress[chapterKey] || index === currentChapterIndex;
    });
    
    if (allChaptersComplete) {
      setShowSlideContent(false);
      setShowFinalQuiz(true);
      toast.success('All chapters completed! Ready for final assessment.');
    } else {
      setCurrentChapterIndex(prev => prev + 1);
      setCurrentSlideIndex(0);
      toast.success('Chapter completed! Moving to next chapter.');
    }
  };

  const submitFinalQuiz = () => {
    if (!selectedModule) return;
    
    if (Object.keys(quizAnswers).length < selectedModule.content.quiz.length) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    const results: { [questionIndex: number]: boolean } = {};
    let correctCount = 0;
    
    selectedModule.content.quiz.forEach((question, index) => {
      const isCorrect = quizAnswers[index] === question.correct;
      results[index] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setQuizResults(results);
    
    const score = (correctCount / selectedModule.content.quiz.length) * 100;
    const passed = score >= 70;

    if (passed) {
      selectedModule.isCompleted = true;
      const finalProgress = 100;
      setUserProgress(prev => ({ ...prev, [selectedModule.id]: finalProgress }));
      
      toast.success(`Congratulations! Module completed with ${score.toFixed(0)}% score.`);
      
      setTimeout(() => {
        setSelectedModule(null);
        setCurrentChapterIndex(0);
        setCurrentSlideIndex(0);
        setShowFinalQuiz(false);
        setShowSlideContent(false);
        setQuizAnswers({});
        setQuizResults(null);
      }, 3000);
    } else {
      toast.error(`Quiz failed with ${score.toFixed(0)}%. You need 70% to pass. Please review the content and try again.`);
      setTimeout(() => {
        setQuizResults(null);
        setQuizAnswers({});
      }, 3000);
    }
  };

  const renderSlideContent = () => {
    if (!selectedModule || !showSlideContent) return null;

    const currentChapter = selectedModule.content.chapters[currentChapterIndex];
    const currentSlide = currentChapter.slides[currentSlideIndex];
    const isLastSlide = currentSlideIndex === currentChapter.slides.length - 1;
    const isLastChapter = currentChapterIndex === selectedModule.content.chapters.length - 1;

    return (
      <div className="bg-card border rounded-lg p-8">
        <div className="space-y-6">
          {/* Slide Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                Chapter {currentChapterIndex + 1}: {currentChapter.title}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Slide {currentSlideIndex + 1} of {currentChapter.slides.length}
              </span>
            </div>
            <h2 className="text-2xl font-bold">{currentSlide.title}</h2>
          </div>

          {/* Slide Content */}
          <div className="space-y-4">
            <p className="text-base leading-relaxed">{currentSlide.content}</p>
            
            {currentSlide.bulletPoints && currentSlide.bulletPoints.length > 0 && (
              <ul className="space-y-2 ml-4">
                {currentSlide.bulletPoints.map((point, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            )}

            {currentSlide.example && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-blue-800">Example</p>
                    <p className="text-blue-700 text-sm mt-1">{currentSlide.example}</p>
                  </div>
                </div>
              </div>
            )}

            {currentSlide.tip && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <div className="flex items-start space-x-2">
                  <Target className="w-4 h-4 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-green-800">Pro Tip</p>
                    <p className="text-green-700 text-sm mt-1">{currentSlide.tip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (currentSlideIndex > 0) {
                  setCurrentSlideIndex(prev => prev - 1);
                } else if (currentChapterIndex > 0) {
                  setCurrentChapterIndex(prev => prev - 1);
                  const prevChapter = selectedModule.content.chapters[currentChapterIndex - 1];
                  setCurrentSlideIndex(prevChapter.slides.length - 1);
                }
              }}
              disabled={currentChapterIndex === 0 && currentSlideIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="text-center">
              <Progress 
                value={((currentChapterIndex * 10) + ((currentSlideIndex + 1) / currentChapter.slides.length) * 10) / selectedModule.content.chapters.length} 
                className="w-32 mx-auto mb-2" 
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(((currentChapterIndex * 10) + ((currentSlideIndex + 1) / currentChapter.slides.length) * 10) / selectedModule.content.chapters.length)}% Complete
              </p>
            </div>

            <Button
              onClick={() => {
                if (isLastSlide && isLastChapter) {
                  markChapterComplete();
                } else if (isLastSlide) {
                  setCurrentChapterIndex(prev => prev + 1);
                  setCurrentSlideIndex(0);
                } else {
                  setCurrentSlideIndex(prev => prev + 1);
                }
              }}
            >
              {isLastSlide && isLastChapter ? 'Complete Chapter' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderQuizContent = () => {
    if (!selectedModule || !showFinalQuiz) return null;

    return (
      <div className="bg-card border rounded-lg p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Final Assessment</h2>
            <p className="text-muted-foreground">
              Test your knowledge of {selectedModule.title}. You need 70% to pass.
            </p>
          </div>

          <div className="space-y-6">
            {selectedModule.content.quiz.map((question, questionIndex) => (
              <div key={questionIndex} className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-3">
                    Question {questionIndex + 1}: {question.question}
                  </h3>
                  
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-background">
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          value={optionIndex}
                          checked={quizAnswers[questionIndex] === optionIndex}
                          onChange={() => setQuizAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }))}
                          className="w-4 h-4"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>

                  {quizResults && quizResults[questionIndex] !== undefined && (
                    <div className={`mt-3 p-3 rounded ${quizResults[questionIndex] ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <div className="flex items-center space-x-2">
                        {quizResults[questionIndex] ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {quizResults[questionIndex] ? 'Correct!' : 'Incorrect'}
                        </span>
                      </div>
                      <p className="text-sm mt-2">{question.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={submitFinalQuiz}
              disabled={Object.keys(quizAnswers).length < selectedModule.content.quiz.length || quizResults !== null}
              size="lg"
            >
              {quizResults ? 'Quiz Completed' : 'Submit Quiz'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderModuleContent = () => {
    if (!selectedModule) return null;

    return (
      <div className="space-y-6">
        {/* Module Header */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => setSelectedModule(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Modules
            </Button>
            <Badge variant={selectedModule.isCompleted ? "default" : "secondary"}>
              {selectedModule.isCompleted ? 'Completed' : 'In Progress'}
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{selectedModule.title}</h1>
          <p className="text-muted-foreground mb-4">{selectedModule.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{selectedModule.duration} minutes</span>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span>{selectedModule.content.chapters.length} chapters</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{selectedModule.enrolledCount} enrolled</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{Math.round(calculateModuleProgress())}%</span>
            </div>
            <Progress value={calculateModuleProgress()} className="h-2" />
          </div>

          {/* Start/Continue Button */}
          {!showSlideContent && !showFinalQuiz && (
            <Button 
              className="mt-4"
              onClick={() => setShowSlideContent(true)}
            >
              <Play className="w-4 h-4 mr-2" />
              {userProgress[selectedModule.id] > 0 ? 'Continue Learning' : 'Start Learning'}
            </Button>
          )}
        </div>

        {/* Learning Content */}
        {showSlideContent && renderSlideContent()}
        {showFinalQuiz && renderQuizContent()}
      </div>
    );
  };

  const renderResourceViewer = () => {
    if (!selectedResource) return null;

    const dialogDescriptionId = `resource-description-${selectedResource.id}`;

    return (
      <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby={dialogDescriptionId}>
          <DialogHeader>
            <DialogTitle>{selectedResource.title}</DialogTitle>
            <DialogDescription id={dialogDescriptionId}>
              Preview of the downloadable resource content. This {selectedResource.type} contains comprehensive, professional-grade materials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">{selectedResource.description}</p>
            <div className="bg-card p-4 rounded-lg border max-h-96 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{selectedResource.content}</pre>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>File size: {selectedResource.fileSize}</span>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 fill-current text-yellow-500" />
                <span>{selectedResource.rating} rating</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Employer Education Center</h1>
                <p className="text-muted-foreground">Master modern hiring practices with expert-led training and professional resources</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-primary/10">
                <Crown className="w-3 h-3 mr-1" />
                Premium Content Available
              </Badge>
              <Button variant="outline" onClick={onUpgrade}>
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {selectedModule ? renderModuleContent() : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="modules">Training Modules</TabsTrigger>
              <TabsTrigger value="resources">Professional Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search training modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex gap-2">
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
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Training Modules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModules.map((module) => (
                  <Card key={module.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(module.type)}
                          <Badge className={getDifficultyColor(module.difficulty)}>
                            {module.difficulty}
                          </Badge>
                          {module.isNew && (
                            <Badge variant="secondary">New</Badge>
                          )}
                          {module.isPremium && (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              <Crown className="w-3 h-3 mr-1" />
                              Pro
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Star className="w-3 h-3 fill-current text-yellow-500" />
                          <span>{module.rating}</span>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {module.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{module.duration} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{module.content.chapters.length} chapters</span>
                        </div>
                      </div>

                      {/* Progress indicator */}
                      {userProgress[module.id] > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round(userProgress[module.id])}%</span>
                          </div>
                          <Progress value={userProgress[module.id]} className="h-1" />
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button 
                          className="flex-1" 
                          onClick={() => startModule(module.id)}
                          disabled={module.isPremium}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {userProgress[module.id] > 0 ? 'Continue' : 'Start'}
                        </Button>
                        {module.isCompleted && (
                          <Badge variant="secondary" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              {/* Resources Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search professional resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resources Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline">
                          {resource.type}
                        </Badge>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Star className="w-3 h-3 fill-current text-yellow-500" />
                          <span>{resource.rating}</span>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {resource.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{resource.fileSize}</span>
                        <Badge variant="outline" className="text-xs">
                          {resource.type === 'template' ? 'Excel Ready' : 'Professional Grade'}
                        </Badge>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          className="flex-1" 
                          onClick={() => downloadResource(resource.id)}
                          disabled={resource.isPremium}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedResource(resource)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Dialogs */}
      {renderResourceViewer()}
    </div>
  );
}








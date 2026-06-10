/**
 * OpenAI Service Integration for HireVify
 * 
 * Provides AI-powered analysis and generation for interviews, resumes, 
 * career advice, and other intelligent features using OpenAI's API.
 */

interface InterviewQuestion {
  id: string;
  type: 'behavioral' | 'technical' | 'situational' | 'company' | 'role-specific';
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tips: string[];
  evaluationCriteria: string[];
  timeLimit?: number;
}

interface ResponseAnalysis {
  confidence_score: number;
  clarity_score: number;
  content_quality: number;
  strengths: string[];
  improvements: string[];
  overall_feedback: string;
  keywords_used: string[];
  structure_score: number;
}

interface ResumeOptimization {
  ats_score: number;
  improvements: {
    keywords: string[];
    structure: string[];
    content: string[];
  };
  optimized_sections: {
    summary: string;
    experience: string[];
    skills: string[];
  };
  match_percentage: number;
}

interface CareerRecommendation {
  career_paths: Array<{
    title: string;
    match_score: number;
    required_skills: string[];
    timeline: string;
    salary_range: string;
  }>;
  skill_gaps: string[];
  learning_recommendations: string[];
  market_insights: string[];
}

/**
 * OpenAI Service for HireVify AI Features
 */
class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    // In browser environment, API calls should go through server endpoints for security
    if (typeof window !== 'undefined') {
      this.apiKey = 'browser-mode'; // Browser should use server endpoints
    } else {
      // Only access environment variables server-side
      this.apiKey = process.env.OPENAI_API_KEY || '';
      if (!this.apiKey) {
        console.warn('OpenAI API key not found on server. AI features may not work.');
      }
    }
  }

  /**
   * Generate personalized interview questions based on job and candidate profile
   */
  async generateInterviewQuestions(
    jobDescription: string, 
    candidateProfile: any, 
    count: number = 5
  ): Promise<InterviewQuestion[]> {
    if (this.apiKey === 'browser-mode' || this.apiKey === 'demo-mode') {
      return this.generateMockInterviewQuestions(jobDescription, candidateProfile, count);
    }

    try {
      const prompt = `Generate ${count} personalized interview questions for this position:

Job Description: ${jobDescription}

Candidate Profile:
- Skills: ${candidateProfile.skills?.join(', ') || 'Not specified'}
- Experience: ${candidateProfile.experience || 'Not specified'}
- Background: ${candidateProfile.background || 'Not specified'}

Requirements:
- Mix of behavioral, technical, and situational questions
- Tailored to both the role and candidate's background
- Include difficulty level and evaluation criteria
- Provide coaching tips for each question

Format as JSON array with this structure:
{
  "questions": [
    {
      "id": "unique_id",
      "type": "behavioral|technical|situational|company|role-specific",
      "question": "The question text",
      "category": "Category name",
      "difficulty": "easy|medium|hard",
      "tips": ["tip1", "tip2", "tip3"],
      "evaluationCriteria": ["criteria1", "criteria2"],
      "timeLimit": 120
    }
  ]
}`;

      const response = await this.makeOpenAIRequest({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert interview coach and HR professional. Generate thoughtful, relevant interview questions that help assess both technical skills and cultural fit."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result.questions;

    } catch (error) {
      console.error('OpenAI question generation error:', error);
      return this.generateMockInterviewQuestions(jobDescription, candidateProfile, count);
    }
  }

  /**
   * Analyze interview response using AI
   */
  async analyzeVideoResponse(
    transcript: string, 
    question: string, 
    questionType: string = 'general'
  ): Promise<ResponseAnalysis> {
    if (this.apiKey === 'browser-mode' || this.apiKey === 'demo-mode') {
      return this.generateMockResponseAnalysis(transcript, question);
    }

    try {
      const prompt = `Analyze this interview response:

Question: ${question}
Question Type: ${questionType}
Candidate Response: ${transcript}

Provide detailed analysis including:
1. Confidence level (0-100)
2. Clarity of communication (0-100) 
3. Content quality and relevance (0-100)
4. Specific strengths demonstrated
5. Areas for improvement
6. Keywords and industry terms used
7. Response structure quality
8. Overall constructive feedback

Format as JSON:
{
  "confidence_score": 85,
  "clarity_score": 90,
  "content_quality": 80,
  "structure_score": 75,
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "keywords_used": ["keyword1", "keyword2"],
  "overall_feedback": "Detailed constructive feedback paragraph"
}`;

      const response = await this.makeOpenAIRequest({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert interview coach providing constructive, specific feedback to help candidates improve. Be encouraging but honest about areas for growth."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('OpenAI response analysis error:', error);
      return this.generateMockResponseAnalysis(transcript, question);
    }
  }

  /**
   * Generate career advice and recommendations
   */
  async generateCareerAdvice(
    userProfile: any, 
    targetRole: string = '', 
    timeframe: string = '2 years'
  ): Promise<CareerRecommendation> {
    if (this.apiKey === 'browser-mode' || this.apiKey === 'demo-mode') {
      return this.generateMockCareerAdvice(userProfile, targetRole);
    }

    try {
      const prompt = `Provide career guidance for this professional:

Current Profile:
- Current Role: ${userProfile.currentRole || 'Not specified'}
- Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
- Experience Level: ${userProfile.experienceLevel || 'Mid-level'}
- Industry: ${userProfile.industry || 'Technology'}
- Goals: ${targetRole || 'Career advancement'}
- Timeframe: ${timeframe}

Generate:
1. 3-5 career path options with match scores
2. Skill gaps to address
3. Learning recommendations
4. Market insights and opportunities
5. Realistic timelines and salary expectations

Format as JSON:
{
  "career_paths": [
    {
      "title": "Career path title",
      "match_score": 85,
      "required_skills": ["skill1", "skill2"],
      "timeline": "12-18 months",
      "salary_range": "$80k-120k"
    }
  ],
  "skill_gaps": ["gap1", "gap2"],
  "learning_recommendations": ["recommendation1", "recommendation2"],
  "market_insights": ["insight1", "insight2"]
}`;

      const response = await this.makeOpenAIRequest({
        model: "gpt-4",
        messages: [
          {
            role: "system", 
            content: "You are a senior career advisor with deep knowledge of tech industry trends, salary data, and career progression paths. Provide realistic, actionable advice."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('OpenAI career advice error:', error);
      return this.generateMockCareerAdvice(userProfile, targetRole);
    }
  }

  /**
   * Optimize resume for ATS and job matching
   */
  async optimizeResume(
    resumeContent: string, 
    jobDescription: string
  ): Promise<ResumeOptimization> {
    if (this.apiKey === 'browser-mode' || this.apiKey === 'demo-mode') {
      return this.generateMockResumeOptimization(resumeContent, jobDescription);
    }

    try {
      const prompt = `Optimize this resume for the given job description:

Resume Content:
${resumeContent}

Job Description:
${jobDescription}

Analyze and provide:
1. ATS compatibility score (0-100)
2. Job match percentage
3. Missing keywords to add
4. Structure improvements
5. Content enhancements
6. Optimized sections

Format as JSON:
{
  "ats_score": 85,
  "match_percentage": 78,
  "improvements": {
    "keywords": ["keyword1", "keyword2"],
    "structure": ["structure improvement 1"],
    "content": ["content improvement 1"]
  },
  "optimized_sections": {
    "summary": "Optimized professional summary",
    "experience": ["Optimized experience bullet 1", "Optimized experience bullet 2"],
    "skills": ["skill1", "skill2", "skill3"]
  }
}`;

      const response = await this.makeOpenAIRequest({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert resume writer and ATS specialist. Provide specific, actionable recommendations to improve resume performance."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('OpenAI resume optimization error:', error);
      return this.generateMockResumeOptimization(resumeContent, jobDescription);
    }
  }

  /**
   * Analyze resume content for ATS processing
   */
  async analyzeResume(
    resumeText: string,
    analysisType: string = 'general'
  ): Promise<any> {
    if (this.apiKey === 'browser-mode' || this.apiKey === 'demo-mode') {
      return this.generateMockResumeAnalysis(resumeText);
    }

    try {
      const prompt = `Analyze this resume content and provide detailed information:

Resume Content:
${resumeText}

Analysis Type: ${analysisType}

Provide detailed analysis in JSON format:
{
  "personalInfo": {
    "name": "extracted name",
    "email": "extracted email", 
    "phone": "extracted phone",
    "location": "extracted location"
  },
  "summary": "professional summary or objective",
  "skills": {
    "technical": ["technical skills"],
    "soft": ["soft skills"],
    "languages": ["languages"]
  },
  "experience": [
    {
      "company": "company name",
      "position": "job title",
      "duration": "time period",
      "description": "role description"
    }
  ],
  "education": [
    {
      "institution": "school name",
      "degree": "degree type",
      "field": "field of study",
      "year": "graduation year"
    }
  ],
  "analysis": {
    "industryMatch": "detected industry",
    "experienceLevel": "entry/mid/senior/executive",
    "keyStrengths": ["strength 1", "strength 2"],
    "recommendations": ["recommendation 1", "recommendation 2"]
  }
}`;

      const response = await this.makeOpenAIRequest({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert resume analyzer and ATS specialist. Extract and analyze resume information accurately."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('OpenAI resume analysis error:', error);
      return this.generateMockResumeAnalysis(resumeText);
    }
  }

  /**
   * Generate resume content with AI assistance
   */
  async generateResumeContent(prompt: string): Promise<string> {
    if (!this.apiKey || this.apiKey === 'browser-mode' || this.apiKey === 'demo-mode') {
      // Return basic content for demo mode
      return 'AI-generated content is available with OpenAI API integration.';
    }

    try {
      const response = await this.makeOpenAIRequest({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert resume writer and career coach. Generate professional, ATS-optimized content that helps candidates stand out while maintaining authenticity."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();

    } catch (error) {
      console.error('OpenAI resume content generation error:', error);
      return 'Professional content with relevant industry experience and demonstrated expertise.';
    }
  }

  /**
   * Make OpenAI API request with error handling
   */
  private async makeOpenAIRequest(payload: any) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Mock implementations for demo/development mode

  private generateMockInterviewQuestions(jobDescription: string, candidateProfile: any, count: number): InterviewQuestion[] {
    const mockQuestions: InterviewQuestion[] = [
      {
        id: '1',
        type: 'behavioral',
        question: 'Tell me about a challenging project you worked on and how you overcame obstacles.',
        category: 'Problem Solving',
        difficulty: 'medium',
        tips: ['Use the STAR method', 'Be specific about your role', 'Focus on the outcome'],
        evaluationCriteria: ['Problem-solving approach', 'Communication skills', 'Results achieved'],
        timeLimit: 120
      },
      {
        id: '2',
        type: 'technical',
        question: `Explain how you would approach ${jobDescription.includes('React') ? 'state management in a large React application' : 'designing a scalable system architecture'}.`,
        category: 'Technical Knowledge',
        difficulty: 'hard',
        tips: ['Discuss different approaches', 'Mention pros and cons', 'Give concrete examples'],
        evaluationCriteria: ['Technical depth', 'Best practices knowledge', 'Real-world experience'],
        timeLimit: 180
      },
      {
        id: '3',
        type: 'situational',
        question: 'How would you handle a situation where you disagree with your manager on a technical decision?',
        category: 'Leadership & Communication',
        difficulty: 'medium',
        tips: ['Show respect for hierarchy', 'Demonstrate communication skills', 'Focus on data-driven decisions'],
        evaluationCriteria: ['Conflict resolution', 'Professional maturity', 'Communication style'],
        timeLimit: 90
      }
    ];

    return mockQuestions.slice(0, count);
  }

  private generateMockResponseAnalysis(transcript: string, question: string): ResponseAnalysis {
    const wordCount = transcript.split(' ').length;
    const hasStructure = transcript.toLowerCase().includes('situation') || 
                        transcript.toLowerCase().includes('result') ||
                        transcript.toLowerCase().includes('example');

    return {
      confidence_score: Math.min(95, Math.max(60, wordCount * 2 + (hasStructure ? 20 : 0))),
      clarity_score: Math.min(95, Math.max(70, wordCount * 1.5 + (hasStructure ? 15 : 0))),
      content_quality: Math.min(90, Math.max(65, wordCount * 1.8 + (hasStructure ? 25 : 0))),
      structure_score: hasStructure ? Math.max(80, Math.random() * 20 + 80) : Math.max(60, Math.random() * 20 + 60),
      strengths: hasStructure ? 
        ['Well-structured response', 'Good use of examples', 'Clear communication'] :
        ['Relevant content', 'Shows understanding of the topic'],
      improvements: wordCount < 50 ? 
        ['Provide more detailed examples', 'Expand on key points'] :
        ['Consider using the STAR method', 'Add more specific metrics'],
      keywords_used: this.extractKeywords(transcript),
      overall_feedback: `Your response demonstrates ${hasStructure ? 'good structure and' : ''} understanding of the topic. ${wordCount < 50 ? 'Consider providing more detailed examples to strengthen your answer.' : 'The level of detail is appropriate.'} Continue practicing to build confidence in your delivery.`
    };
  }

  private generateMockCareerAdvice(userProfile: any, targetRole: string): CareerRecommendation {
    return {
      career_paths: [
        {
          title: targetRole || 'Senior Software Engineer',
          match_score: 85,
          required_skills: ['React', 'TypeScript', 'System Design', 'Leadership'],
          timeline: '12-18 months',
          salary_range: '$110k-150k'
        },
        {
          title: 'Technical Lead',
          match_score: 78,
          required_skills: ['Architecture Design', 'Team Management', 'Mentoring'],
          timeline: '18-24 months', 
          salary_range: '$130k-170k'
        },
        {
          title: 'Product Manager (Technical)',
          match_score: 72,
          required_skills: ['Product Strategy', 'Data Analysis', 'Stakeholder Management'],
          timeline: '24-36 months',
          salary_range: '$120k-160k'
        }
      ],
      skill_gaps: ['Advanced System Design', 'Cloud Architecture', 'Team Leadership'],
      learning_recommendations: [
        'Complete advanced React patterns course',
        'Study system design fundamentals', 
        'Practice technical leadership scenarios',
        'Build portfolio projects demonstrating scale'
      ],
      market_insights: [
        'High demand for React developers with 3+ years experience',
        'Cloud skills command 20-30% salary premium',
        'Remote work increasing opportunities by 40%',
        'Technical leadership roles growing 25% annually'
      ]
    };
  }

  private generateMockResumeOptimization(resumeContent: string, jobDescription: string): ResumeOptimization {
    return {
      ats_score: 78,
      match_percentage: 82,
      improvements: {
        keywords: ['React', 'TypeScript', 'Agile', 'CI/CD', 'AWS'],
        structure: [
          'Add quantifiable achievements with metrics',
          'Include more technical keywords',
          'Organize skills by relevance to job posting'
        ],
        content: [
          'Emphasize leadership and collaboration experience',
          'Add specific project outcomes and business impact',
          'Include relevant certifications or training'
        ]
      },
      optimized_sections: {
        summary: 'Experienced software engineer with 5+ years developing scalable React applications. Led cross-functional teams to deliver features serving 100k+ users. Expert in TypeScript, modern JavaScript, and cloud architecture.',
        experience: [
          'Developed and maintained React applications serving 50,000+ daily users',
          'Implemented TypeScript migration reducing bugs by 40% and improving developer productivity',
          'Led Agile development team of 5 engineers, delivering features 25% faster than previous quarters'
        ],
        skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'AWS', 'Docker', 'Git', 'Agile/Scrum']
      }
    };
  }

  private generateMockResumeAnalysis(resumeText: string): any {
    return {
      personalInfo: {
        name: "Professional Candidate",
        email: "candidate@email.com",
        phone: "+1-555-123-4567",
        location: "Professional Location, State"
      },
      summary: "Experienced professional with demonstrated expertise in their field",
      skills: {
        technical: ["JavaScript", "React", "Node.js", "Python", "SQL"],
        soft: ["Leadership", "Communication", "Problem Solving", "Team Collaboration"],
        languages: ["English", "Spanish"]
      },
      experience: [
        {
          company: "Technology Company",
          position: "Software Engineer",
          duration: "2020-2024",
          description: "Developed scalable web applications using modern technologies"
        }
      ],
      education: [
        {
          institution: "University",
          degree: "Bachelor's Degree",
          field: "Computer Science",
          year: "2020"
        }
      ],
      analysis: {
        industryMatch: "Technology",
        experienceLevel: "Mid-Level",
        keyStrengths: ["Technical expertise", "Problem solving", "Team collaboration"],
        recommendations: ["Add more quantified achievements", "Include industry certifications"]
      }
    };
  }

  private extractKeywords(text: string): string[] {
    const commonKeywords = [
      'leadership', 'team', 'project', 'development', 'problem', 'solution',
      'experience', 'skills', 'technology', 'process', 'result', 'success'
    ];

    return commonKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }
}

// Export singleton instance
export const aiService = new OpenAIService();
export default aiService;
export type { InterviewQuestion, ResponseAnalysis, ResumeOptimization, CareerRecommendation };
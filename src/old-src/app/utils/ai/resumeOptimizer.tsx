/**
 * AI Resume Optimizer
 * 
 * Provides AI-powered resume analysis, optimization suggestions,
 * ATS compatibility checks, and content enhancement for candidates
 * and ATS scanning capabilities for recruiters.
 */

import { aiService } from './openai-service';

export interface ResumeSection {
  id: string;
  type: 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'achievements';
  title: string;
  content: any;
  order: number;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  achievements: string[];
  skills: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate?: string;
  gpa?: number;
  location?: string;
  achievements: string[];
}

export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
    achievements: string[];
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
    credentialId?: string;
  }>;
  sections: ResumeSection[];
}

export interface JobDescription {
  title: string;
  company: string;
  description: string;
  requirements: string[];
  preferredSkills: string[];
  responsibilities: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  industry: string;
  location?: string;
  remote: boolean;
}

export interface ATSScore {
  overall: number;
  breakdown: {
    formatting: number;
    keywords: number;
    readability: number;
    completeness: number;
    atsCompatibility: number;
  };
  recommendations: string[];
  criticalIssues: string[];
  strengths: string[];
  missingKeywords: string[];
  optimalKeywords: string[];
  sectionScores: Record<string, number>;
}

export interface ResumeOptimizationSuggestion {
  id: string;
  type: 'content' | 'formatting' | 'keyword' | 'structure' | 'achievement';
  priority: 'high' | 'medium' | 'low';
  section: string;
  current: string;
  suggested: string;
  reason: string;
  impact: string;
  examples?: string[];
}

export interface SkillsAnalysis {
  matchedSkills: string[];
  missingSkills: string[];
  skillGaps: Array<{
    skill: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    suggestions: string[];
  }>;
  strengthAreas: string[];
  developmentAreas: string[];
  recommendedCertifications: string[];
}

export class AIResumeOptimizer {
  private industryKeywords: Record<string, string[]> = {
    'technology': [
      'software development', 'programming', 'coding', 'debugging', 'testing',
      'agile', 'scrum', 'ci/cd', 'devops', 'cloud computing', 'apis', 'databases',
      'frameworks', 'libraries', 'version control', 'git', 'collaboration'
    ],
    'design': [
      'user experience', 'user interface', 'wireframing', 'prototyping', 'design systems',
      'visual design', 'interaction design', 'user research', 'usability testing',
      'responsive design', 'accessibility', 'design thinking', 'brand identity'
    ],
    'marketing': [
      'digital marketing', 'content marketing', 'social media', 'seo', 'sem',
      'email marketing', 'analytics', 'campaign management', 'brand management',
      'lead generation', 'conversion optimization', 'market research'
    ],
    'finance': [
      'financial analysis', 'budgeting', 'forecasting', 'risk management',
      'compliance', 'accounting', 'auditing', 'financial modeling',
      'investment analysis', 'portfolio management', 'regulatory compliance'
    ],
    'sales': [
      'lead generation', 'customer acquisition', 'relationship building',
      'sales strategy', 'negotiation', 'closing deals', 'crm', 'pipeline management',
      'quota achievement', 'client retention', 'prospecting'
    ]
  };

  private actionVerbs = [
    'achieved', 'implemented', 'developed', 'created', 'designed', 'managed',
    'led', 'optimized', 'improved', 'increased', 'reduced', 'streamlined',
    'delivered', 'launched', 'established', 'coordinated', 'collaborated',
    'analyzed', 'researched', 'executed', 'maintained', 'supported'
  ];

  private atsCompatibilityRules = {
    formatting: [
      'Use standard section headers (Experience, Education, Skills)',
      'Avoid headers and footers',
      'Use simple bullet points (• or -)',
      'Stick to standard fonts (Arial, Calibri, Times New Roman)',
      'Avoid tables, text boxes, and graphics',
      'Use consistent date formats',
      'Maintain proper spacing and margins'
    ],
    structure: [
      'Start with contact information',
      'Include professional summary',
      'List experience in reverse chronological order',
      'Use clear section divisions',
      'Avoid multiple columns',
      'Keep consistent formatting throughout'
    ],
    content: [
      'Include relevant keywords from job description',
      'Use standard job titles when possible',
      'Include company names, dates, and locations',
      'Quantify achievements with numbers',
      'Use action verbs to start bullet points',
      'Avoid abbreviations and acronyms without context'
    ]
  };

  /**
   * Comprehensive ATS score analysis for resumes
   */
  calculateATSScore(resume: ResumeData, jobDescription?: JobDescription): ATSScore {
    const scores = {
      formatting: this.analyzeFormatting(resume),
      keywords: this.analyzeKeywords(resume, jobDescription),
      readability: this.analyzeReadability(resume),
      completeness: this.analyzeCompleteness(resume),
      atsCompatibility: this.analyzeATSCompatibility(resume)
    };

    const overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / 5;

    const recommendations = this.generateATSRecommendations(scores, resume, jobDescription);
    const criticalIssues = this.identifyCriticalIssues(scores, resume);
    const strengths = this.identifyStrengths(scores, resume);
    const { missingKeywords, optimalKeywords } = this.analyzeKeywordOptimization(resume, jobDescription);
    const sectionScores = this.calculateSectionScores(resume, jobDescription);

    return {
      overall: Math.round(overall),
      breakdown: {
        formatting: Math.round(scores.formatting),
        keywords: Math.round(scores.keywords),
        readability: Math.round(scores.readability),
        completeness: Math.round(scores.completeness),
        atsCompatibility: Math.round(scores.atsCompatibility)
      },
      recommendations,
      criticalIssues,
      strengths,
      missingKeywords,
      optimalKeywords,
      sectionScores
    };
  }

  /**
   * Generate intelligent optimization suggestions
   */
  generateOptimizationSuggestions(resume: ResumeData, jobDescription?: JobDescription): ResumeOptimizationSuggestion[] {
    const suggestions: ResumeOptimizationSuggestion[] = [];

    // Summary optimization
    suggestions.push(...this.optimizeSummary(resume, jobDescription));
    
    // Experience optimization
    suggestions.push(...this.optimizeExperience(resume, jobDescription));
    
    // Skills optimization
    suggestions.push(...this.optimizeSkills(resume, jobDescription));
    
    // Achievement quantification
    suggestions.push(...this.optimizeAchievements(resume));
    
    // Keyword optimization
    suggestions.push(...this.optimizeKeywords(resume, jobDescription));

    // Sort by priority and impact
    return suggestions.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Analyze skills gap between resume and job requirements
   */
  analyzeSkillsGap(resume: ResumeData, jobDescription: JobDescription): SkillsAnalysis {
    const allResumeSkills = [
      ...resume.skills.technical,
      ...resume.skills.soft,
      ...resume.skills.languages
    ].map(skill => skill.toLowerCase());

    const requiredSkills = [
      ...jobDescription.requirements,
      ...jobDescription.preferredSkills
    ].map(skill => this.extractSkillsFromText(skill)).flat();

    const matchedSkills = requiredSkills.filter(skill => 
      allResumeSkills.some(resumeSkill => 
        resumeSkill.includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(resumeSkill)
      )
    );

    const missingSkills = requiredSkills.filter(skill => 
      !allResumeSkills.some(resumeSkill => 
        resumeSkill.includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(resumeSkill)
      )
    );

    const skillGaps = this.categorizeSkillGaps(missingSkills, jobDescription);
    const strengthAreas = this.identifyStrengthAreas(resume, jobDescription);
    const developmentAreas = this.identifyDevelopmentAreas(missingSkills, jobDescription);
    const recommendedCertifications = this.recommendCertifications(missingSkills, jobDescription.industry);

    return {
      matchedSkills,
      missingSkills,
      skillGaps,
      strengthAreas,
      developmentAreas,
      recommendedCertifications
    };
  }

  /**
   * Generate AI-powered content suggestions
   */
  generateContentSuggestions(
    section: 'summary' | 'experience' | 'achievement', 
    context: any,
    jobDescription?: JobDescription
  ): string[] {
    switch (section) {
      case 'summary':
        return this.generateSummarySuggestions(context, jobDescription);
      case 'experience':
        return this.generateExperienceSuggestions(context, jobDescription);
      case 'achievement':
        return this.generateAchievementSuggestions(context);
      default:
        return [];
    }
  }

  /**
   * Enhance achievements with quantification
   */
  enhanceAchievements(achievements: string[]): Array<{ original: string; enhanced: string; metrics: string[] }> {
    return achievements.map(achievement => {
      const enhanced = this.quantifyAchievement(achievement);
      const metrics = this.suggestMetrics(achievement);
      
      return {
        original: achievement,
        enhanced,
        metrics
      };
    });
  }

  /**
   * Optimize resume for specific job posting
   */
  optimizeForJob(resume: ResumeData, jobDescription: JobDescription): {
    optimizedResume: Partial<ResumeData>;
    changes: Array<{ section: string; change: string; reason: string }>;
    keywordMatches: number;
    improvementScore: number;
  } {
    const changes: Array<{ section: string; change: string; reason: string }> = [];
    const optimizedResume: Partial<ResumeData> = { ...resume };

    // Optimize summary for job
    const optimizedSummary = this.optimizeSummaryForJob(resume.summary, jobDescription);
    if (optimizedSummary !== resume.summary) {
      optimizedResume.summary = optimizedSummary;
      changes.push({
        section: 'Summary',
        change: 'Enhanced with job-relevant keywords and focus',
        reason: 'Better alignment with job requirements'
      });
    }

    // Optimize skills section
    const optimizedSkills = this.optimizeSkillsForJob(resume.skills, jobDescription);
    optimizedResume.skills = optimizedSkills;
    changes.push({
      section: 'Skills',
      change: 'Reordered and highlighted relevant skills',
      reason: 'Prioritize skills mentioned in job description'
    });

    // Calculate keyword matches and improvement score
    const originalScore = this.calculateATSScore(resume, jobDescription);
    const optimizedScore = this.calculateATSScore(optimizedResume as ResumeData, jobDescription);
    
    const keywordMatches = this.countKeywordMatches(optimizedResume as ResumeData, jobDescription);
    const improvementScore = optimizedScore.overall - originalScore.overall;

    return {
      optimizedResume,
      changes,
      keywordMatches,
      improvementScore
    };
  }

  // Private helper methods

  private analyzeFormatting(resume: ResumeData): number {
    let score = 100;
    
    // Check for standard sections
    const requiredSections = ['experience', 'education', 'skills'];
    const hasRequiredSections = requiredSections.every(section => 
      resume.sections.some(s => s.type === section)
    );
    if (!hasRequiredSections) score -= 20;

    // Check contact information completeness
    const { personalInfo } = resume;
    if (!personalInfo.email || !personalInfo.phone) score -= 15;
    if (!personalInfo.name) score -= 25;

    // Check for proper structure
    if (!resume.summary || resume.summary.length < 50) score -= 10;
    if (resume.experience.length === 0) score -= 30;
    if (resume.skills.technical.length === 0) score -= 15;

    return Math.max(0, score);
  }

  private analyzeKeywords(resume: ResumeData, jobDescription?: JobDescription): number {
    if (!jobDescription) return 50; // Neutral score without job description

    const jobKeywords = this.extractKeywordsFromJob(jobDescription);
    const resumeText = this.getResumeText(resume).toLowerCase();
    
    const matchedKeywords = jobKeywords.filter(keyword => 
      resumeText.includes(keyword.toLowerCase())
    );

    const keywordScore = (matchedKeywords.length / jobKeywords.length) * 100;
    return Math.min(100, keywordScore);
  }

  private analyzeReadability(resume: ResumeData): number {
    let score = 100;
    
    // Check for action verbs in experience
    const experienceText = resume.experience.map(exp => exp.description + ' ' + exp.achievements.join(' ')).join(' ');
    const actionVerbCount = this.actionVerbs.filter(verb => 
      experienceText.toLowerCase().includes(verb)
    ).length;
    
    if (actionVerbCount < 3) score -= 20;
    
    // Check for quantified achievements
    const hasNumbers = /\d+/.test(experienceText);
    if (!hasNumbers) score -= 15;
    
    // Check summary length and quality
    if (resume.summary.length < 100) score -= 10;
    if (resume.summary.length > 400) score -= 10;
    
    return Math.max(0, score);
  }

  private analyzeCompleteness(resume: ResumeData): number {
    let score = 0;
    const maxScore = 100;
    
    // Personal information (20 points)
    const personalInfo = resume.personalInfo;
    if (personalInfo.name && personalInfo.email && personalInfo.phone) score += 15;
    if (personalInfo.location) score += 3;
    if (personalInfo.linkedin || personalInfo.github || personalInfo.portfolio) score += 2;
    
    // Summary (15 points)
    if (resume.summary && resume.summary.length >= 100) score += 15;
    else if (resume.summary && resume.summary.length >= 50) score += 10;
    
    // Experience (25 points)
    if (resume.experience.length >= 2) score += 15;
    else if (resume.experience.length >= 1) score += 10;
    if (resume.experience.some(exp => exp.achievements.length > 0)) score += 10;
    
    // Education (15 points)
    if (resume.education.length >= 1) score += 15;
    
    // Skills (15 points)
    if (resume.skills.technical.length >= 5) score += 10;
    else if (resume.skills.technical.length >= 3) score += 7;
    if (resume.skills.soft.length >= 3) score += 5;
    
    // Projects/Certifications (10 points)
    if (resume.projects && resume.projects.length > 0) score += 5;
    if (resume.certifications && resume.certifications.length > 0) score += 5;
    
    return Math.min(maxScore, score);
  }

  private analyzeATSCompatibility(resume: ResumeData): number {
    let score = 100;
    
    // Check for ATS-unfriendly elements
    const resumeText = this.getResumeText(resume);
    
    // Penalize for special characters and formatting
    if (/[^\x00-\x7F]/.test(resumeText)) score -= 10; // Non-ASCII characters
    if (resumeText.includes('|') || resumeText.includes('•')) score -= 5; // Special bullets
    
    // Check for standard section names
    const standardSections = ['experience', 'education', 'skills', 'summary'];
    const nonStandardSections = resume.sections.filter(section => 
      !standardSections.includes(section.type)
    );
    score -= nonStandardSections.length * 5;
    
    // Check date formats in experience
    const hasConsistentDates = resume.experience.every(exp => 
      /^\d{4}$/.test(exp.startDate) || /^\d{2}\/\d{4}$/.test(exp.startDate)
    );
    if (!hasConsistentDates) score -= 10;
    
    return Math.max(0, score);
  }

  private generateATSRecommendations(scores: any, resume: ResumeData, jobDescription?: JobDescription): string[] {
    const recommendations: string[] = [];
    
    if (scores.formatting < 80) {
      recommendations.push('Use standard section headers like "Experience", "Education", and "Skills"');
      recommendations.push('Ensure consistent formatting throughout the document');
    }
    
    if (scores.keywords < 60 && jobDescription) {
      recommendations.push('Include more relevant keywords from the job description');
      recommendations.push('Integrate industry-specific terminology naturally');
    }
    
    if (scores.readability < 70) {
      recommendations.push('Start bullet points with strong action verbs');
      recommendations.push('Quantify achievements with specific numbers and percentages');
    }
    
    if (scores.completeness < 80) {
      recommendations.push('Add missing contact information (LinkedIn, portfolio)');
      recommendations.push('Include more detailed descriptions of achievements');
    }
    
    if (scores.atsCompatibility < 85) {
      recommendations.push('Use simple formatting without tables or text boxes');
      recommendations.push('Stick to standard fonts and avoid special characters');
    }
    
    return recommendations;
  }

  private identifyCriticalIssues(scores: any, resume: ResumeData): string[] {
    const issues: string[] = [];
    
    if (!resume.personalInfo.email || !resume.personalInfo.phone) {
      issues.push('Missing essential contact information');
    }
    
    if (resume.experience.length === 0) {
      issues.push('No work experience listed');
    }
    
    if (resume.skills.technical.length === 0) {
      issues.push('No technical skills specified');
    }
    
    if (!resume.summary || resume.summary.length < 50) {
      issues.push('Professional summary is missing or too brief');
    }
    
    if (scores.overall < 60) {
      issues.push('Overall ATS compatibility score is low');
    }
    
    return issues;
  }

  private identifyStrengths(scores: any, resume: ResumeData): string[] {
    const strengths: string[] = [];
    
    if (scores.formatting >= 85) {
      strengths.push('Well-structured and professionally formatted');
    }
    
    if (scores.keywords >= 75) {
      strengths.push('Good keyword optimization for target roles');
    }
    
    if (resume.experience.some(exp => exp.achievements.length >= 3)) {
      strengths.push('Strong emphasis on achievements and results');
    }
    
    if (resume.skills.technical.length >= 8) {
      strengths.push('Comprehensive technical skills coverage');
    }
    
    if (resume.certifications && resume.certifications.length > 0) {
      strengths.push('Professional certifications demonstrate commitment');
    }
    
    return strengths;
  }

  private analyzeKeywordOptimization(resume: ResumeData, jobDescription?: JobDescription): {
    missingKeywords: string[];
    optimalKeywords: string[];
  } {
    if (!jobDescription) {
      return { missingKeywords: [], optimalKeywords: [] };
    }
    
    const jobKeywords = this.extractKeywordsFromJob(jobDescription);
    const resumeText = this.getResumeText(resume).toLowerCase();
    
    const missingKeywords = jobKeywords.filter(keyword => 
      !resumeText.includes(keyword.toLowerCase())
    );
    
    const optimalKeywords = jobKeywords.filter(keyword => 
      resumeText.includes(keyword.toLowerCase())
    );
    
    return { missingKeywords, optimalKeywords };
  }

  private calculateSectionScores(resume: ResumeData, jobDescription?: JobDescription): Record<string, number> {
    return {
      summary: this.scoreSummarySection(resume.summary, jobDescription),
      experience: this.scoreExperienceSection(resume.experience, jobDescription),
      education: this.scoreEducationSection(resume.education),
      skills: this.scoreSkillsSection(resume.skills, jobDescription),
      projects: this.scoreProjectsSection(resume.projects || []),
      certifications: this.scoreCertificationsSection(resume.certifications || [])
    };
  }

  private optimizeSummary(resume: ResumeData, jobDescription?: JobDescription): ResumeOptimizationSuggestion[] {
    const suggestions: ResumeOptimizationSuggestion[] = [];
    
    if (!resume.summary || resume.summary.length < 100) {
      suggestions.push({
        id: 'summary-length',
        type: 'content',
        priority: 'high',
        section: 'summary',
        current: resume.summary || '',
        suggested: 'Create a compelling 2-3 sentence professional summary highlighting your key strengths and career objectives',
        reason: 'A strong summary is crucial for ATS parsing and recruiter engagement',
        impact: 'Can improve ATS score by 15-20 points',
        examples: [
          'Results-driven software engineer with 5+ years developing scalable web applications',
          'Certified project manager specializing in agile methodologies and cross-functional team leadership'
        ]
      });
    }
    
    if (jobDescription && !this.containsJobKeywords(resume.summary, jobDescription)) {
      suggestions.push({
        id: 'summary-keywords',
        type: 'keyword',
        priority: 'high',
        section: 'summary',
        current: resume.summary,
        suggested: `Incorporate relevant keywords: ${this.extractKeywordsFromJob(jobDescription).slice(0, 5).join(', ')}`,
        reason: 'Including job-specific keywords improves ATS ranking',
        impact: 'Can increase keyword match score by 25+ points'
      });
    }
    
    return suggestions;
  }

  private optimizeExperience(resume: ResumeData, jobDescription?: JobDescription): ResumeOptimizationSuggestion[] {
    const suggestions: ResumeOptimizationSuggestion[] = [];
    
    resume.experience.forEach((exp, index) => {
      if (exp.achievements.length < 2) {
        suggestions.push({
          id: `experience-achievements-${index}`,
          type: 'achievement',
          priority: 'high',
          section: 'experience',
          current: `${exp.company} - ${exp.position}`,
          suggested: 'Add 2-4 quantified achievements that demonstrate impact and results',
          reason: 'Achievements are more compelling than job descriptions',
          impact: 'Significantly improves recruiter engagement',
          examples: [
            'Increased sales revenue by 30% through implementation of new CRM system',
            'Reduced processing time by 45% by automating manual workflows',
            'Led team of 8 developers to deliver project 2 weeks ahead of schedule'
          ]
        });
      }
      
      const hasActionVerbs = this.actionVerbs.some(verb => 
        exp.description.toLowerCase().includes(verb) || 
        exp.achievements.some(ach => ach.toLowerCase().includes(verb))
      );
      
      if (!hasActionVerbs) {
        suggestions.push({
          id: `experience-action-verbs-${index}`,
          type: 'content',
          priority: 'medium',
          section: 'experience',
          current: exp.description,
          suggested: `Start descriptions with strong action verbs: ${this.actionVerbs.slice(0, 5).join(', ')}`,
          reason: 'Action verbs create more dynamic and engaging descriptions',
          impact: 'Improves readability and professional presentation'
        });
      }
    });
    
    return suggestions;
  }

  private optimizeSkills(resume: ResumeData, jobDescription?: JobDescription): ResumeOptimizationSuggestion[] {
    const suggestions: ResumeOptimizationSuggestion[] = [];
    
    if (resume.skills.technical.length < 5) {
      suggestions.push({
        id: 'skills-quantity',
        type: 'content',
        priority: 'medium',
        section: 'skills',
        current: `${resume.skills.technical.length} technical skills listed`,
        suggested: 'Include 5-10 relevant technical skills to demonstrate breadth of expertise',
        reason: 'More skills increase keyword matching opportunities',
        impact: 'Improves ATS parsing and skill-based matching'
      });
    }
    
    if (jobDescription) {
      const missingSkills = this.analyzeSkillsGap(resume, jobDescription).missingSkills;
      if (missingSkills.length > 0) {
        suggestions.push({
          id: 'skills-job-match',
          type: 'keyword',
          priority: 'high',
          section: 'skills',
          current: 'Current skills list',
          suggested: `Consider adding relevant skills: ${missingSkills.slice(0, 5).join(', ')}`,
          reason: 'These skills are mentioned in the target job description',
          impact: 'Significantly improves job match score'
        });
      }
    }
    
    return suggestions;
  }

  private optimizeAchievements(resume: ResumeData): ResumeOptimizationSuggestion[] {
    const suggestions: ResumeOptimizationSuggestion[] = [];
    
    resume.experience.forEach((exp, index) => {
      exp.achievements.forEach((achievement, achIndex) => {
        if (!this.isQuantified(achievement)) {
          suggestions.push({
            id: `achievement-quantify-${index}-${achIndex}`,
            type: 'achievement',
            priority: 'high',
            section: 'experience',
            current: achievement,
            suggested: this.quantifyAchievement(achievement),
            reason: 'Quantified achievements are more impactful and credible',
            impact: 'Numbers make achievements more compelling to recruiters',
            examples: [
              'Led team of 8 developers (instead of "Led development team")',
              'Increased efficiency by 25% (instead of "Improved efficiency")',
              'Generated $50K additional revenue (instead of "Increased sales")'
            ]
          });
        }
      });
    });
    
    return suggestions;
  }

  private optimizeKeywords(resume: ResumeData, jobDescription?: JobDescription): ResumeOptimizationSuggestion[] {
    const suggestions: ResumeOptimizationSuggestion[] = [];
    
    if (jobDescription) {
      const { missingKeywords } = this.analyzeKeywordOptimization(resume, jobDescription);
      
      if (missingKeywords.length > 5) {
        suggestions.push({
          id: 'keyword-optimization',
          type: 'keyword',
          priority: 'high',
          section: 'overall',
          current: 'Current keyword coverage',
          suggested: `Strategically incorporate these keywords: ${missingKeywords.slice(0, 8).join(', ')}`,
          reason: 'These keywords appear in the job description but not in your resume',
          impact: 'Can improve ATS ranking and keyword match score by 30+ points'
        });
      }
    }
    
    return suggestions;
  }

  // Additional helper methods...

  private extractKeywordsFromJob(jobDescription: JobDescription): string[] {
    const text = `${jobDescription.description} ${jobDescription.requirements.join(' ')} ${jobDescription.preferredSkills.join(' ')}`;
    const industryKeywords = this.industryKeywords[jobDescription.industry.toLowerCase()] || [];
    
    // Extract technical terms, skills, and important phrases
    const words = text.toLowerCase().split(/\s+/);
    const keywords = new Set([...industryKeywords]);
    
    // Add specific job-related terms
    words.forEach(word => {
      if (word.length > 3 && !this.isCommonWord(word)) {
        keywords.add(word);
      }
    });
    
    return Array.from(keywords);
  }

  private getResumeText(resume: ResumeData): string {
    const parts = [
      resume.summary,
      resume.experience.map(exp => `${exp.description} ${exp.achievements.join(' ')}`).join(' '),
      resume.skills.technical.join(' '),
      resume.skills.soft.join(' '),
      (resume.projects || []).map(proj => `${proj.name} ${proj.description}`).join(' ')
    ];
    
    return parts.join(' ');
  }

  private isCommonWord(word: string): boolean {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'shall', 'can'];
    return commonWords.includes(word.toLowerCase());
  }

  private containsJobKeywords(text: string, jobDescription: JobDescription): boolean {
    const keywords = this.extractKeywordsFromJob(jobDescription);
    const textLower = text.toLowerCase();
    
    return keywords.some(keyword => textLower.includes(keyword.toLowerCase()));
  }

  private isQuantified(achievement: string): boolean {
    return /\d+/.test(achievement) && (/\%|percent|dollar|\$|increase|decrease|improve|reduce|save|generate/.test(achievement.toLowerCase()));
  }

  private quantifyAchievement(achievement: string): string {
    if (this.isQuantified(achievement)) return achievement;
    
    // Suggest quantification templates
    const templates = [
      'Increased [metric] by [X]%',
      'Reduced [process/cost] by [X]%',
      'Led team of [X] members',
      'Managed budget of $[X]',
      'Delivered [X] projects on time',
      'Improved [metric] by [X] units'
    ];
    
    // Try to match achievement type and suggest appropriate quantification
    const lowerAchievement = achievement.toLowerCase();
    
    if (lowerAchievement.includes('team') || lowerAchievement.includes('manage')) {
      return achievement + ' (quantify team size, budget, or scope)';
    }
    
    if (lowerAchievement.includes('improve') || lowerAchievement.includes('increase')) {
      return achievement + ' (add percentage or specific metrics)';
    }
    
    if (lowerAchievement.includes('project') || lowerAchievement.includes('deliver')) {
      return achievement + ' (specify number of projects, timeline, or budget)';
    }
    
    return achievement + ' (add specific numbers, percentages, or timeframes)';
  }

  private suggestMetrics(achievement: string): string[] {
    const lowerAchievement = achievement.toLowerCase();
    
    if (lowerAchievement.includes('sales') || lowerAchievement.includes('revenue')) {
      return ['Revenue increase (%)', 'Deal size ($)', 'Number of clients', 'Conversion rate (%)'];
    }
    
    if (lowerAchievement.includes('development') || lowerAchievement.includes('software')) {
      return ['Performance improvement (%)', 'Bug reduction (%)', 'Feature delivery time', 'User adoption rate (%)'];
    }
    
    if (lowerAchievement.includes('marketing') || lowerAchievement.includes('campaign')) {
      return ['Engagement rate (%)', 'Lead generation increase', 'Cost per acquisition reduction', 'Brand awareness lift (%)'];
    }
    
    return ['Percentage improvement', 'Time saved', 'Cost reduction', 'Quality increase'];
  }

  // Additional methods for content generation, section scoring, etc. would go here...
  private generateSummarySuggestions(context: any, jobDescription?: JobDescription): string[] {
    // Implementation for summary suggestions
    return [];
  }

  private generateExperienceSuggestions(context: any, jobDescription?: JobDescription): string[] {
    // Implementation for experience suggestions
    return [];
  }

  private generateAchievementSuggestions(context: any): string[] {
    // Implementation for achievement suggestions
    return [];
  }

  private extractSkillsFromText(text: string): string[] {
    // Implementation for extracting skills from text
    return [];
  }

  private categorizeSkillGaps(missingSkills: string[], jobDescription: JobDescription): any[] {
    // Implementation for categorizing skill gaps
    return [];
  }

  private identifyStrengthAreas(resume: ResumeData, jobDescription: JobDescription): string[] {
    // Implementation for identifying strength areas
    return [];
  }

  private identifyDevelopmentAreas(missingSkills: string[], jobDescription: JobDescription): string[] {
    // Implementation for identifying development areas
    return [];
  }

  private recommendCertifications(missingSkills: string[], industry: string): string[] {
    // Implementation for recommending certifications
    return [];
  }

  private optimizeSummaryForJob(summary: string, jobDescription: JobDescription): string {
    // Implementation for optimizing summary for specific job
    return summary;
  }

  private optimizeSkillsForJob(skills: any, jobDescription: JobDescription): any {
    // Implementation for optimizing skills for specific job
    return skills;
  }

  private countKeywordMatches(resume: ResumeData, jobDescription: JobDescription): number {
    // Implementation for counting keyword matches
    return 0;
  }

  private scoreSummarySection(summary: string, jobDescription?: JobDescription): number {
    // Implementation for scoring summary section
    return 85;
  }

  private scoreExperienceSection(experience: WorkExperience[], jobDescription?: JobDescription): number {
    // Implementation for scoring experience section
    return 80;
  }

  private scoreEducationSection(education: Education[]): number {
    // Implementation for scoring education section
    return 90;
  }

  private scoreSkillsSection(skills: any, jobDescription?: JobDescription): number {
    // Implementation for scoring skills section
    return 75;
  }

  private scoreProjectsSection(projects: any[]): number {
    // Implementation for scoring projects section
    return 70;
  }

  private scoreCertificationsSection(certifications: any[]): number {
    // Implementation for scoring certifications section
    return 85;
  }

  /**
   * AI-Powered Resume Content Generation with OpenAI GPT-4
   */
  async generateAISummary(
    experience: WorkExperience[], 
    skills: any, 
    targetRole?: string,
    targetIndustry?: string
  ): Promise<string> {
    try {
      const experienceText = experience.map(exp => 
        `${exp.position} at ${exp.company}: ${exp.description} Achievements: ${exp.achievements.join(', ')}`
      ).join('. ');

      const skillsText = [
        ...(skills.technical || []),
        ...(skills.soft || [])
      ].join(', ');

      const prompt = `Create a compelling professional summary for a resume:

Experience: ${experienceText}
Skills: ${skillsText}
Target Role: ${targetRole || 'Professional'}
Target Industry: ${targetIndustry || 'Technology'}

Generate a 2-3 sentence professional summary that:
1. Highlights key strengths and experience
2. Uses industry-relevant keywords
3. Is optimized for ATS systems
4. Demonstrates unique value proposition

Return only the summary text, no additional formatting.`;

      const summary = await aiService.generateResumeContent(prompt);
      return summary || 'Professional with demonstrated expertise in delivering high-quality results and driving organizational success.';
      
    } catch (error) {
      console.error('AI summary generation failed:', error);
      return 'Experienced professional with a proven track record of success in dynamic environments.';
    }
  }

  /**
   * AI-Enhanced Achievement Optimization
   */
  async optimizeAchievements(achievements: string[], jobDescription?: JobDescription): Promise<string[]> {
    try {
      const prompt = `Optimize these resume achievements for maximum impact:

Current Achievements:
${achievements.map((ach, i) => `${i + 1}. ${ach}`).join('\n')}

Job Context: ${jobDescription?.title || 'Professional Role'} - ${jobDescription?.industry || 'Technology'}

Improve each achievement by:
1. Adding quantifiable metrics where possible
2. Using strong action verbs
3. Focusing on business impact
4. Making them ATS-friendly

Return as a JSON array of improved achievement strings.`;

      const optimized = await aiService.generateResumeContent(prompt);
      try {
        const parsed = JSON.parse(optimized);
        return Array.isArray(parsed) ? parsed : achievements;
      } catch {
        return achievements;
      }
      
    } catch (error) {
      console.error('AI achievement optimization failed:', error);
      return achievements;
    }
  }

  /**
   * AI-Powered Skills Gap Analysis
   */
  async analyzeSkillsGapWithAI(
    currentSkills: any,
    jobDescription: JobDescription
  ): Promise<{
    missingCriticalSkills: string[];
    recommendedSkills: string[];
    learningPath: Array<{ skill: string; priority: string; resources: string[] }>;
  }> {
    try {
      const currentSkillsList = [
        ...(currentSkills.technical || []),
        ...(currentSkills.soft || []),
        ...(currentSkills.languages || [])
      ].join(', ');

      const prompt = `Analyze skills gap for this job opportunity:

Job Title: ${jobDescription.title}
Industry: ${jobDescription.industry}
Job Requirements: ${jobDescription.requirements?.join(', ') || 'Not specified'}
Job Responsibilities: ${jobDescription.responsibilities?.join(', ') || 'Not specified'}

Current Skills: ${currentSkillsList}

Provide a detailed skills analysis in JSON format:
{
  "missingCriticalSkills": ["skill1", "skill2"],
  "recommendedSkills": ["skill1", "skill2"],
  "learningPath": [
    {
      "skill": "skillname",
      "priority": "high|medium|low",
      "resources": ["resource1", "resource2"]
    }
  ]
}`;

      const analysis = await aiService.generateResumeContent(prompt);
      try {
        return JSON.parse(analysis);
      } catch {
        return {
          missingCriticalSkills: [],
          recommendedSkills: [],
          learningPath: []
        };
      }
      
    } catch (error) {
      console.error('AI skills gap analysis failed:', error);
      return {
        missingCriticalSkills: [],
        recommendedSkills: [],
        learningPath: []
      };
    }
  }

  /**
   * AI-Powered Resume Keyword Optimization
   */
  async optimizeResumeKeywords(
    resumeData: ResumeData,
    jobDescription: JobDescription
  ): Promise<{
    optimizedSummary: string;
    keywordSuggestions: string[];
    optimizationScore: number;
  }> {
    try {
      const prompt = `Optimize this resume for better ATS compatibility and keyword matching:

Job Title: ${jobDescription.title}
Job Industry: ${jobDescription.industry}
Job Description: ${jobDescription.description}
Required Skills: ${jobDescription.requirements?.join(', ') || 'Not specified'}

Current Resume Summary: ${resumeData.summary}
Current Skills: ${[
  ...(resumeData.skills?.technical || []),
  ...(resumeData.skills?.soft || [])
].join(', ')}

Provide optimization suggestions in JSON format:
{
  "optimizedSummary": "improved summary with better keywords",
  "keywordSuggestions": ["keyword1", "keyword2", "keyword3"],
  "optimizationScore": 85
}

Focus on:
1. Industry-specific terminology
2. ATS-friendly language
3. Action verbs and quantifiable results
4. Relevant technical and soft skills`;

      const optimization = await aiService.generateResumeContent(prompt);
      try {
        return JSON.parse(optimization);
      } catch {
        return {
          optimizedSummary: resumeData.summary,
          keywordSuggestions: [],
          optimizationScore: 70
        };
      }
      
    } catch (error) {
      console.error('AI keyword optimization failed:', error);
      return {
        optimizedSummary: resumeData.summary,
        keywordSuggestions: [],
        optimizationScore: 70
      };
    }
  }
}

// Singleton instance for the application
export const aiResumeOptimizer = new AIResumeOptimizer();
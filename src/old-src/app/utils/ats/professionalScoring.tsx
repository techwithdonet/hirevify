// Professional ATS Scoring Engine
import { ParsedResumeContent } from './documentParser';

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
  sectionScores: {
    summary: number;
    experience: number;
    skills: number;
    education: number;
  };
}

export class ProfessionalATSScorer {
  
  /**
   * Calculate comprehensive ATS score based on parsed content
   */
  calculateATSScore(
    parsedContent: ParsedResumeContent, 
    jobDescription?: string,
    targetIndustry?: string
  ): ATSScore {
    
    const scores = {
      formatting: this.scoreFormatting(parsedContent),
      keywords: this.scoreKeywords(parsedContent, jobDescription, targetIndustry),
      readability: this.scoreReadability(parsedContent),
      completeness: this.scoreCompleteness(parsedContent),
      atsCompatibility: this.scoreATSCompatibility(parsedContent)
    };

    const overall = this.calculateOverallScore(scores);

    return {
      overall,
      breakdown: scores,
      recommendations: this.generateRecommendations(parsedContent, scores),
      criticalIssues: this.identifyCriticalIssues(parsedContent, scores),
      strengths: this.identifyStrengths(parsedContent, scores),
      missingKeywords: this.findMissingKeywords(parsedContent, jobDescription, targetIndustry),
      optimalKeywords: this.findOptimalKeywords(parsedContent, targetIndustry),
      sectionScores: this.scoreSections(parsedContent)
    };
  }

  /**
   * Score document formatting quality
   */
  private scoreFormatting(content: ParsedResumeContent): number {
    const { formatting } = content.extractedData;
    let score = 70; // Base score

    if (formatting.hasHeaders) score += 15;
    if (formatting.hasBulletPoints) score += 10;
    score += formatting.fontConsistency * 5;
    score += formatting.sectionStructure * 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score keyword matching and optimization
   */
  private scoreKeywords(
    content: ParsedResumeContent, 
    jobDescription?: string,
    targetIndustry?: string
  ): number {
    const { keywords } = content.extractedData;
    let score = 60; // Base score

    // Industry-specific keyword bonus
    const industryKeywords = this.getIndustryKeywords(targetIndustry);
    const industryMatches = keywords.filter(k => 
      industryKeywords.some(ik => ik.toLowerCase().includes(k.toLowerCase()))
    );
    score += Math.min(25, industryMatches.length * 3);

    // Job description matching (if provided)
    if (jobDescription) {
      const jdKeywords = this.extractJobDescriptionKeywords(jobDescription);
      const jdMatches = keywords.filter(k => 
        jdKeywords.some(jk => jk.toLowerCase().includes(k.toLowerCase()))
      );
      score += Math.min(15, jdMatches.length * 2);
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score document readability
   */
  private scoreReadability(content: ParsedResumeContent): number {
    const { rawText } = content;
    const words = rawText.split(/\s+/).length;
    const sentences = rawText.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;

    let score = 80; // Base score

    // Optimal range: 15-20 words per sentence
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) {
      score += 10;
    } else if (avgWordsPerSentence < 10 || avgWordsPerSentence > 25) {
      score -= 15;
    }

    // Length considerations
    if (words < 200) score -= 20; // Too short
    if (words > 1000) score -= 10; // Too long

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score resume completeness
   */
  private scoreCompleteness(content: ParsedResumeContent): number {
    const { personalInfo, sections } = content.extractedData;
    let score = 0;

    // Personal info completeness (30 points)
    if (personalInfo.name) score += 10;
    if (personalInfo.email) score += 10;
    if (personalInfo.phone) score += 5;
    if (personalInfo.location) score += 5;

    // Section completeness (70 points)
    if (sections.summary && sections.summary.length > 50) score += 15;
    if (sections.experience.length > 0) score += 25;
    if (sections.education.length > 0) score += 15;
    if (sections.skills.length > 0) score += 15;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score ATS system compatibility
   */
  private scoreATSCompatibility(content: ParsedResumeContent): number {
    const { rawText, extractedData } = content;
    let score = 85; // High base score for text-based parsing

    // Check for ATS-problematic elements
    if (rawText.includes('table') || rawText.includes('column')) score -= 10;
    if (rawText.length < 100) score -= 20; // Too little extractable text
    
    // Bonus for clean structure
    if (extractedData.formatting.hasHeaders) score += 5;
    if (extractedData.personalInfo.email && extractedData.personalInfo.phone) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(scores: Record<string, number>): number {
    const weights = {
      formatting: 0.15,
      keywords: 0.30,
      readability: 0.15,
      completeness: 0.25,
      atsCompatibility: 0.15
    };

    return Math.round(
      Object.entries(scores).reduce((total, [key, score]) => {
        return total + (score * weights[key as keyof typeof weights]);
      }, 0)
    );
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    content: ParsedResumeContent, 
    scores: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    if (scores.formatting < 80) {
      recommendations.push('Improve document formatting with clear section headers');
      recommendations.push('Use consistent bullet points for achievements');
    }

    if (scores.keywords < 75) {
      recommendations.push('Add more industry-relevant keywords');
      recommendations.push('Include technical skills and certifications');
    }

    if (scores.completeness < 80) {
      if (!content.extractedData.personalInfo.phone) {
        recommendations.push('Add contact phone number');
      }
      if (content.extractedData.sections.summary.length < 50) {
        recommendations.push('Include a professional summary section');
      }
    }

    if (scores.readability < 75) {
      recommendations.push('Simplify sentence structure for better readability');
      recommendations.push('Use action verbs and quantified achievements');
    }

    return recommendations.slice(0, 4); // Limit to top 4 recommendations
  }

  /**
   * Identify critical issues
   */
  private identifyCriticalIssues(
    content: ParsedResumeContent, 
    scores: Record<string, number>
  ): string[] {
    const issues: string[] = [];

    if (!content.extractedData.personalInfo.email) {
      issues.push('Missing email address');
    }

    if (content.extractedData.sections.experience.length === 0) {
      issues.push('No work experience section found');
    }

    if (scores.atsCompatibility < 60) {
      issues.push('Document may not be ATS-compatible');
    }

    return issues;
  }

  /**
   * Identify document strengths
   */
  private identifyStrengths(
    content: ParsedResumeContent, 
    scores: Record<string, number>
  ): string[] {
    const strengths: string[] = [];

    if (scores.formatting >= 85) {
      strengths.push('Excellent document formatting');
    }

    if (content.extractedData.keywords.length >= 10) {
      strengths.push('Rich keyword content');
    }

    if (scores.completeness >= 85) {
      strengths.push('Complete professional profile');
    }

    if (content.extractedData.sections.experience.length >= 3) {
      strengths.push('Comprehensive work experience');
    }

    return strengths;
  }

  /**
   * Get industry-specific keywords
   */
  private getIndustryKeywords(industry?: string): string[] {
    const industryKeywords: Record<string, string[]> = {
      'technology': [
        'javascript', 'python', 'react', 'node.js', 'aws', 'docker', 'kubernetes',
        'agile', 'scrum', 'git', 'api', 'microservices', 'cloud', 'devops'
      ],
      'healthcare': [
        'patient care', 'clinical', 'emr', 'hipaa', 'medical terminology',
        'healthcare compliance', 'nursing', 'medical records', 'treatment'
      ],
      'finance': [
        'financial analysis', 'risk management', 'compliance', 'excel',
        'financial modeling', 'accounting', 'audit', 'budget', 'forecasting'
      ],
      'marketing': [
        'digital marketing', 'seo', 'google analytics', 'campaign management',
        'social media', 'content marketing', 'brand management', 'crm'
      ]
    };

    return industryKeywords[industry?.toLowerCase() || 'technology'] || [];
  }

  /**
   * Extract keywords from job description
   */
  private extractJobDescriptionKeywords(jobDescription: string): string[] {
    const words = jobDescription.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !/^(the|and|for|with|that|this|have|will|are|from)$/.test(word));

    // Return most frequent words (simplified approach)
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Find missing important keywords
   */
  private findMissingKeywords(
    content: ParsedResumeContent,
    jobDescription?: string,
    targetIndustry?: string
  ): string[] {
    const currentKeywords = content.extractedData.keywords.map(k => k.toLowerCase());
    const industryKeywords = this.getIndustryKeywords(targetIndustry);
    
    return industryKeywords
      .filter(keyword => !currentKeywords.includes(keyword.toLowerCase()))
      .slice(0, 5);
  }

  /**
   * Find optimal keywords for the resume
   */
  private findOptimalKeywords(
    content: ParsedResumeContent,
    targetIndustry?: string
  ): string[] {
    const currentKeywords = content.extractedData.keywords;
    const industryKeywords = this.getIndustryKeywords(targetIndustry);
    
    return currentKeywords
      .filter(keyword => 
        industryKeywords.some(ik => ik.toLowerCase().includes(keyword.toLowerCase()))
      )
      .slice(0, 8);
  }

  /**
   * Score individual resume sections
   */
  private scoreSections(content: ParsedResumeContent) {
    const { sections } = content.extractedData;
    
    return {
      summary: sections.summary.length > 100 ? 90 : sections.summary.length > 50 ? 75 : 50,
      experience: Math.min(100, sections.experience.length * 25 + 50),
      skills: Math.min(100, sections.skills.length * 10 + 60),
      education: sections.education.length > 0 ? 85 : 40
    };
  }
}

export const professionalATSScorer = new ProfessionalATSScorer();
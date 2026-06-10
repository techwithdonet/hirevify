// Professional Keyword Analysis Engine
export interface KeywordAnalysis {
  extractedKeywords: string[];
  industryMatch: number;
  jobDescriptionMatch: number;
  missingCriticalKeywords: string[];
  keywordDensity: Record<string, number>;
  recommendations: string[];
}

export class ProfessionalKeywordAnalyzer {
  
  private industryKeywordDatabase = {
    'technology': {
      critical: ['javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'git'],
      important: ['docker', 'kubernetes', 'agile', 'scrum', 'api', 'microservices', 'cloud'],
      nice_to_have: ['typescript', 'mongodb', 'redis', 'jenkins', 'terraform', 'ansible']
    },
    'healthcare': {
      critical: ['patient care', 'clinical', 'emr', 'hipaa', 'medical terminology'],
      important: ['healthcare compliance', 'nursing', 'medical records', 'treatment'],
      nice_to_have: ['epic', 'cerner', 'medical billing', 'healthcare analytics']
    },
    'finance': {
      critical: ['financial analysis', 'risk management', 'excel', 'financial modeling'],
      important: ['compliance', 'accounting', 'audit', 'budget', 'forecasting'],
      nice_to_have: ['bloomberg', 'quickbooks', 'sap', 'financial reporting']
    },
    'marketing': {
      critical: ['digital marketing', 'seo', 'google analytics', 'campaign management'],
      important: ['social media', 'content marketing', 'brand management', 'crm'],
      nice_to_have: ['hubspot', 'salesforce', 'adobe creative suite', 'marketing automation']
    }
  };

  /**
   * Analyze keywords against industry standards and job description
   */
  analyzeKeywords(
    resumeText: string,
    industry: string,
    jobDescription?: string
  ): KeywordAnalysis {
    
    const extractedKeywords = this.extractKeywords(resumeText);
    const industryKeywords = this.industryKeywordDatabase[industry.toLowerCase() as keyof typeof this.industryKeywordDatabase];
    
    if (!industryKeywords) {
      throw new Error(`Industry "${industry}" not supported`);
    }

    const industryMatch = this.calculateIndustryMatch(extractedKeywords, industryKeywords);
    const jobDescriptionMatch = jobDescription ? 
      this.calculateJobDescriptionMatch(extractedKeywords, jobDescription) : 0;
    
    const missingCriticalKeywords = this.findMissingCriticalKeywords(
      extractedKeywords, 
      industryKeywords
    );

    return {
      extractedKeywords,
      industryMatch,
      jobDescriptionMatch,
      missingCriticalKeywords,
      keywordDensity: this.calculateKeywordDensity(resumeText, extractedKeywords),
      recommendations: this.generateKeywordRecommendations(
        extractedKeywords,
        industryKeywords,
        missingCriticalKeywords
      )
    };
  }

  /**
   * Extract keywords from resume text using advanced NLP techniques
   */
  private extractKeywords(text: string): string[] {
    const cleanText = text.toLowerCase();
    
    // Technical skills patterns
    const techPatterns = [
      /\b(javascript|js|typescript|ts)\b/g,
      /\b(python|java|c\+\+|c#|php|ruby|go|rust|swift)\b/g,
      /\b(react|angular|vue|svelte|ember)\b/g,
      /\b(node\.?js|express|nest\.?js)\b/g,
      /\b(aws|azure|gcp|google cloud)\b/g,
      /\b(docker|kubernetes|k8s)\b/g,
      /\b(sql|mysql|postgresql|mongodb|redis)\b/g,
      /\b(git|GitBranch|gitlab|bitbucket)\b/g,
      /\b(agile|scrum|kanban|devops|ci\/cd)\b/g
    ];

    // Business skills patterns
    const businessPatterns = [
      /\b(project management|pmp|agile|scrum master)\b/g,
      /\b(financial analysis|budget|forecasting)\b/g,
      /\b(digital marketing|seo|sem|ppc)\b/g,
      /\b(google analytics|adobe analytics)\b/g,
      /\b(salesforce|hubspot|crm)\b/g,
      /\b(excel|powerpoint|word|office 365)\b/g
    ];

    const allPatterns = [...techPatterns, ...businessPatterns];
    const keywords = new Set<string>();

    // Extract using patterns
    allPatterns.forEach(pattern => {
      const matches = cleanText.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.add(match.trim()));
      }
    });

    // Extract common skill words
    const skillWords = [
      'leadership', 'communication', 'problem solving', 'teamwork',
      'analytical', 'creative', 'strategic', 'innovative', 'collaborative'
    ];

    skillWords.forEach(skill => {
      if (cleanText.includes(skill)) {
        keywords.add(skill);
      }
    });

    return Array.from(keywords);
  }

  /**
   * Calculate how well resume matches industry requirements
   */
  private calculateIndustryMatch(
    resumeKeywords: string[],
    industryKeywords: { critical: string[], important: string[], nice_to_have: string[] }
  ): number {
    const criticalMatches = this.countMatches(resumeKeywords, industryKeywords.critical);
    const importantMatches = this.countMatches(resumeKeywords, industryKeywords.important);
    const niceToHaveMatches = this.countMatches(resumeKeywords, industryKeywords.nice_to_have);

    // Weighted scoring
    const criticalScore = (criticalMatches / industryKeywords.critical.length) * 60;
    const importantScore = (importantMatches / industryKeywords.important.length) * 30;
    const niceToHaveScore = (niceToHaveMatches / industryKeywords.nice_to_have.length) * 10;

    return Math.min(100, Math.round(criticalScore + importantScore + niceToHaveScore));
  }

  /**
   * Calculate match with specific job description
   */
  private calculateJobDescriptionMatch(resumeKeywords: string[], jobDescription: string): number {
    const jdKeywords = this.extractKeywords(jobDescription);
    const matches = this.countMatches(resumeKeywords, jdKeywords);
    
    return Math.min(100, Math.round((matches / jdKeywords.length) * 100));
  }

  /**
   * Find critical keywords missing from resume
   */
  private findMissingCriticalKeywords(
    resumeKeywords: string[],
    industryKeywords: { critical: string[], important: string[], nice_to_have: string[] }
  ): string[] {
    const resumeKeywordsLower = resumeKeywords.map(k => k.toLowerCase());
    
    return [
      ...industryKeywords.critical,
      ...industryKeywords.important.slice(0, 3) // Top 3 important
    ].filter(keyword => 
      !resumeKeywordsLower.some(rk => 
        rk.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(rk)
      )
    );
  }

  /**
   * Calculate keyword density for optimization
   */
  private calculateKeywordDensity(text: string, keywords: string[]): Record<string, number> {
    const words = text.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    const density: Record<string, number> = {};

    keywords.forEach(keyword => {
      const occurrences = words.filter(word => 
        word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word)
      ).length;
      
      density[keyword] = (occurrences / totalWords) * 100;
    });

    return density;
  }

  /**
   * Generate keyword optimization recommendations
   */
  private generateKeywordRecommendations(
    resumeKeywords: string[],
    industryKeywords: { critical: string[], important: string[], nice_to_have: string[] },
    missingCriticalKeywords: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (missingCriticalKeywords.length > 0) {
      recommendations.push(
        `Add critical keywords: ${missingCriticalKeywords.slice(0, 3).join(', ')}`
      );
    }

    const criticalMatches = this.countMatches(resumeKeywords, industryKeywords.critical);
    if (criticalMatches < industryKeywords.critical.length * 0.6) {
      recommendations.push('Increase focus on core technical skills');
    }

    const importantMatches = this.countMatches(resumeKeywords, industryKeywords.important);
    if (importantMatches < industryKeywords.important.length * 0.4) {
      recommendations.push('Include more industry-specific tools and methodologies');
    }

    if (resumeKeywords.filter(k => ['leadership', 'communication', 'teamwork'].includes(k)).length < 2) {
      recommendations.push('Add soft skills like leadership and communication');
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Count keyword matches with fuzzy matching
   */
  private countMatches(resumeKeywords: string[], targetKeywords: string[]): number {
    const resumeKeywordsLower = resumeKeywords.map(k => k.toLowerCase());
    
    return targetKeywords.filter(target =>
      resumeKeywordsLower.some(resume => 
        resume.includes(target.toLowerCase()) || 
        target.toLowerCase().includes(resume) ||
        this.calculateSimilarity(resume, target.toLowerCase()) > 0.8
      )
    ).length;
  }

  /**
   * Calculate string similarity for fuzzy matching
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance for string similarity
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export const professionalKeywordAnalyzer = new ProfessionalKeywordAnalyzer();





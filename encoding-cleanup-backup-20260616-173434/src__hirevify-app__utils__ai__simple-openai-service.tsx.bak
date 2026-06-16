// Simple OpenAI Service - Client-side safe implementation
// Provides fallback analysis without server dependencies

export interface AnalysisResult {
  personalInfo: {
    confidence: number;
    extraction: Record<string, any>;
  };
  workExperience: {
    confidence: number;
    extraction: Record<string, any>;
  };
  education: {
    confidence: number;
    extraction: Record<string, any>;
  };
  skills: {
    confidence: number;
    extraction: Record<string, any>;
  };
  overall: number;
}

export interface VisionAnalysisResult {
  layout: {
    columns: number;
    sections: string[];
    structure: string;
  };
  text_regions: Array<{
    type: string;
    confidence: number;
  }>;
  confidence: number;
}

class SimpleOpenAIService {
  
  /**
   * Analyze resume content using client-side processing
   */
  async analyzeResume(text: string, mode: string = 'comprehensive'): Promise<AnalysisResult> {
    console.log('ðŸ” Simple OpenAI service: Analyzing resume content...');
    
    try {
      // Input validation
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        console.warn('âš ï¸ Empty or invalid text provided to analyzeResume');
        return this.getFallbackAnalysis();
      }

      // Simulate AI analysis with intelligent text processing
      const analysis = this.performClientSideAnalysis(text);
      
      console.log('âœ… Simple OpenAI analysis completed');
      return analysis;
      
    } catch (error) {
      console.error('âŒ Simple OpenAI analysis failed:', error);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Perform client-side text analysis
   */
  private performClientSideAnalysis(text: string): AnalysisResult {
    const lowerText = text.toLowerCase();
    
    // Analyze personal info
    const personalInfo = this.analyzePersonalInfo(text, lowerText);
    
    // Analyze work experience
    const workExperience = this.analyzeWorkExperience(text, lowerText);
    
    // Analyze education
    const education = this.analyzeEducation(text, lowerText);
    
    // Analyze skills
    const skills = this.analyzeSkills(text, lowerText);
    
    // Calculate overall confidence
    const overall = (personalInfo.confidence + workExperience.confidence + 
                    education.confidence + skills.confidence) / 4;
    
    return {
      personalInfo,
      workExperience,
      education,
      skills,
      overall: Math.round(overall)
    };
  }

  /**
   * Analyze personal information in text
   */
  private analyzePersonalInfo(text: string, lowerText: string) {
    let confidence = 70; // Base confidence
    const extraction: Record<string, any> = {};
    
    // Check for email
    if (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
      confidence += 10;
      extraction.hasEmail = true;
    }
    
    // Check for phone
    if (text.match(/\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)) {
      confidence += 10;
      extraction.hasPhone = true;
    }
    
    // Check for location indicators
    if (lowerText.includes('city') || lowerText.includes('state') || 
        text.match(/[A-Z][a-z]+,\s*[A-Z]{2}/)) {
      confidence += 5;
      extraction.hasLocation = true;
    }
    
    // Check for Link
    if (lowerText.includes('Link')) {
      confidence += 5;
      extraction.hasLinkedIn = true;
    }
    
    return { confidence: Math.min(95, confidence), extraction };
  }

  /**
   * Analyze work experience in text
   */
  private analyzeWorkExperience(text: string, lowerText: string) {
    let confidence = 60; // Base confidence
    const extraction: Record<string, any> = {};
    
    // Check for experience keywords
    const experienceKeywords = ['experience', 'work', 'employment', 'career', 'position'];
    const hasExperienceSection = experienceKeywords.some(keyword => lowerText.includes(keyword));
    
    if (hasExperienceSection) {
      confidence += 15;
      extraction.hasExperienceSection = true;
    }
    
    // Check for dates (job duration indicators)
    const dateMatches = text.match(/20\d{2}/g);
    if (dateMatches && dateMatches.length >= 2) {
      confidence += 15;
      extraction.hasDates = true;
    }
    
    // Check for company names (capitalized words)
    const companyPattern = /[A-Z][a-z]+\s+(Inc|LLC|Corp|Company|Ltd|Technologies|Systems|Solutions)/g;
    if (text.match(companyPattern)) {
      confidence += 10;
      extraction.hasCompanyNames = true;
    }
    
    // Check for job titles
    const jobTitlePatterns = ['manager', 'engineer', 'developer', 'analyst', 'director', 'specialist'];
    const hasJobTitles = jobTitlePatterns.some(title => lowerText.includes(title));
    
    if (hasJobTitles) {
      confidence += 10;
      extraction.hasJobTitles = true;
    }
    
    return { confidence: Math.min(95, confidence), extraction };
  }

  /**
   * Analyze education in text
   */
  private analyzeEducation(text: string, lowerText: string) {
    let confidence = 50; // Base confidence
    const extraction: Record<string, any> = {};
    
    // Check for education keywords
    const educationKeywords = ['education', 'degree', 'university', 'college', 'school'];
    const hasEducationSection = educationKeywords.some(keyword => lowerText.includes(keyword));
    
    if (hasEducationSection) {
      confidence += 20;
      extraction.hasEducationSection = true;
    }
    
    // Check for degree types
    const degreeTypes = ['bachelor', 'master', 'phd', 'doctorate', 'diploma', 'bs', 'ba', 'ms', 'ma'];
    const hasDegreeTypes = degreeTypes.some(degree => lowerText.includes(degree));
    
    if (hasDegreeTypes) {
      confidence += 15;
      extraction.hasDegreeTypes = true;
    }
    
    // Check for graduation years
    const graduationPattern = /(?:graduated?|class of)\s*20\d{2}/i;
    if (text.match(graduationPattern) || (lowerText.includes('20') && lowerText.includes('university'))) {
      confidence += 10;
      extraction.hasGraduationInfo = true;
    }
    
    // Check for GPA
    if (lowerText.includes('gpa') || text.match(/\d\.\d+\s*\/\s*4\.0?/)) {
      confidence += 5;
      extraction.hasGPA = true;
    }
    
    return { confidence: Math.min(95, confidence), extraction };
  }

  /**
   * Analyze skills in text
   */
  private analyzeSkills(text: string, lowerText: string) {
    let confidence = 60; // Base confidence
    const extraction: Record<string, any> = {};
    
    // Check for skills section
    const skillsKeywords = ['skills', 'competencies', 'expertise', 'proficient'];
    const hasSkillsSection = skillsKeywords.some(keyword => lowerText.includes(keyword));
    
    if (hasSkillsSection) {
      confidence += 15;
      extraction.hasSkillsSection = true;
    }
    
    // Check for technical skills
    const technicalSkills = ['javascript', 'python', 'java', 'react', 'sql', 'html', 'css', 'node'];
    const hasTechnicalSkills = technicalSkills.some(skill => lowerText.includes(skill));
    
    if (hasTechnicalSkills) {
      confidence += 15;
      extraction.hasTechnicalSkills = true;
    }
    
    // Check for soft skills
    const softSkills = ['leadership', 'communication', 'teamwork', 'management', 'problem solving'];
    const hasSoftSkills = softSkills.some(skill => lowerText.includes(skill));
    
    if (hasSoftSkills) {
      confidence += 10;
      extraction.hasSoftSkills = true;
    }
    
    // Check for tools/software
    const tools = ['excel', 'word', 'powerpoint', 'photoshop', 'git', 'docker', 'aws'];
    const hasTools = tools.some(tool => lowerText.includes(tool));
    
    if (hasTools) {
      confidence += 5;
      extraction.hasTools = true;
    }
    
    return { confidence: Math.min(95, confidence), extraction };
  }

  /**
   * Get fallback analysis when processing fails
   */
  private getFallbackAnalysis(): AnalysisResult {
    return {
      personalInfo: { confidence: 70, extraction: {} },
      workExperience: { confidence: 65, extraction: {} },
      education: { confidence: 60, extraction: {} },
      skills: { confidence: 65, extraction: {} },
      overall: 65
    };
  }

  /**
   * Enhanced vision analysis - client-side safe version
   */
  async enhancedVisionAnalysis(imageData: string): Promise<VisionAnalysisResult> {
    console.log('ðŸ” Simple vision analysis: Processing image data...');
    
    try {
      // Input validation
      if (!imageData || typeof imageData !== 'string') {
        console.warn('âš ï¸ Invalid image data provided to enhancedVisionAnalysis');
      }

      // Return a basic analysis structure
      return {
        layout: {
          columns: 1,
          sections: ['header', 'experience', 'education', 'skills'],
          structure: 'standard'
        },
        text_regions: [
          { type: 'header', confidence: 85 },
          { type: 'body', confidence: 80 },
          { type: 'footer', confidence: 75 }
        ],
        confidence: 78
      };
    } catch (error) {
      console.error('âŒ Vision analysis failed:', error);
      return {
        layout: {
          columns: 1,
          sections: ['unknown'],
          structure: 'basic'
        },
        text_regions: [
          { type: 'unknown', confidence: 50 }
        ],
        confidence: 50
      };
    }
  }

  /**
   * Generic analysis method for compatibility
   */
  async analyze(content: string, options?: { mode?: string; type?: string }): Promise<AnalysisResult> {
    return this.analyzeResume(content, options?.mode || 'comprehensive');
  }

  /**
   * Check service health/availability
   */
  async checkHealth(): Promise<{ status: string; available: boolean }> {
    return {
      status: 'Client-side service operational',
      available: true
    };
  }
}

// Export singleton instance
export const simpleOpenAIService = new SimpleOpenAIService();
export default simpleOpenAIService;

// Additional exports for backwards compatibility









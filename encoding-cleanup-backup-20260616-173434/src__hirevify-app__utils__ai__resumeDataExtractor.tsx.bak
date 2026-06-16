/**
 * AI-Powered Resume Data Extraction Service
 * 
 * Uses OpenAI to accurately extract structured data from resume content
 * Handles multiple formats and provides high accuracy extraction
 */

interface ExtractedResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    Link?: string;
    GitBranch?: string;
    portfolio?: string;
  };
  professionalSummary: string;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    certifications: string[];
  };
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
    gpa?: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
  metadata: {
    totalExperience: string;
    careerLevel: 'entry' | 'mid' | 'senior' | 'executive';
    primaryRole: string;
    industries: string[];
  };
}

interface ExtractionResult {
  success: boolean;
  data: ExtractedResumeData | null;
  confidence: number;
  errors: string[];
  processingTime: number;
}

class AIResumeExtractor {
  private readonly EXTRACTION_PROMPT = `
You are an expert ATS (Applicant Tracking System) that extracts structured data from resumes with 95%+ accuracy.

EXTRACTION REQUIREMENTS:
1. Extract ALL available information, even if formatting is poor
2. Use intelligent inference for missing data
3. Standardize dates to MM/YYYY format
4. Categorize skills accurately (technical vs soft)
5. Calculate total experience in years
6. Determine career level based on experience and roles

RESPONSE FORMAT (JSON only):
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@domain.com",
    "phone": "+1-XXX-XXX-XXXX",
    "location": "City, State/Country",
    "Link": "Link.com/in/profile",
    "GitBranch": "GitBranch.com/username",
    "portfolio": "portfolio-url"
  },
  "professionalSummary": "Brief professional summary",
  "skills": {
    "technical": ["JavaScript", "Python", "React"],
    "soft": ["Leadership", "Communication"],
    "languages": ["English", "Spanish"],
    "certifications": ["AWS Certified", "PMP"]
  },
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "description": "Brief role description",
      "achievements": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor's/Master's/PhD",
      "field": "Field of Study",
      "graduationDate": "MM/YYYY",
      "gpa": "3.8/4.0"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": ["Tech1", "Tech2"],
      "url": "project-url"
    }
  ],
  "metadata": {
    "totalExperience": "5 years",
    "careerLevel": "mid",
    "primaryRole": "Software Engineer",
    "industries": ["Technology", "Finance"]
  }
}

IMPORTANT:
- If information is not available, use empty string "" or empty array []
- Infer career level: entry (0-2 years), mid (3-7 years), senior (8-15 years), executive (15+ years)
- Extract phone numbers in any format and standardize
- Find names even if they're in headers, footers, or mixed with other text
- Be aggressive in skill extraction - include variations and related technologies

RESUME CONTENT:
`;

  async extractFromText(resumeText: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    
    try {
      // Clean and prepare the resume text
      const cleanedText = this.cleanResumeText(resumeText);
      
      if (cleanedText.length < 100) {
        return {
          success: false,
          data: null,
          confidence: 0,
          errors: ['Resume text too short or corrupted'],
          processingTime: Date.now() - startTime
        };
      }

      // Call OpenAI for extraction
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: this.EXTRACTION_PROMPT
            },
            {
              role: 'user',
              content: cleanedText
            }
          ],
          model: 'gpt-4',
          temperature: 0.1, // Low temperature for consistent extraction
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const extractedText = result.choices[0]?.message?.content;

      if (!extractedText) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      let extractedData: ExtractedResumeData;
      try {
        extractedData = JSON.parse(extractedText);
      } catch (parseError) {
        // Try to clean up the JSON if it has extra text
        const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse AI response as JSON');
        }
      }

      // Validate and enhance the extracted data
      const validatedData = this.validateAndEnhanceData(extractedData);
      const confidence = this.calculateConfidence(validatedData, cleanedText);

      return {
        success: true,
        data: validatedData,
        confidence,
        errors: [],
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Resume extraction error:', error);
      
      // Fallback to basic extraction if AI fails
      const fallbackData = this.basicExtraction(resumeText);
      
      return {
        success: fallbackData !== null,
        data: fallbackData,
        confidence: fallbackData ? 40 : 0, // Lower confidence for fallback
        errors: [error instanceof Error ? error.message : 'Unknown extraction error'],
        processingTime: Date.now() - startTime
      };
    }
  }

  private cleanResumeText(text: string): string {
    return text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might confuse AI
      .replace(/[^\w\s@.,()+-]/g, ' ')
      // Normalize line breaks
      .replace(/\n+/g, '\n')
      // Trim
      .trim();
  }

  private validateAndEnhanceData(data: ExtractedResumeData): ExtractedResumeData {
    // Ensure all required fields exist
    if (!data.personalInfo) data.personalInfo = {} as any;
    if (!data.skills) data.skills = { technical: [], soft: [], languages: [], certifications: [] };
    if (!data.experience) data.experience = [];
    if (!data.education) data.education = [];
    if (!data.projects) data.projects = [];
    if (!data.metadata) data.metadata = {} as any;

    // Clean and validate email
    if (data.personalInfo.email) {
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
      const emailMatch = data.personalInfo.email.match(emailRegex);
      data.personalInfo.email = emailMatch ? emailMatch[0] : data.personalInfo.email;
    }

    // Clean and validate phone
    if (data.personalInfo.phone) {
      const phoneRegex = /[\d\s\-\(\)\+\.]+/g;
      const phoneMatch = data.personalInfo.phone.match(phoneRegex);
      if (phoneMatch) {
        data.personalInfo.phone = phoneMatch.join('').replace(/\s+/g, '-');
      }
    }

    // Ensure skills are unique and properly categorized
    if (data.skills.technical) {
      data.skills.technical = [...new Set(data.skills.technical.filter(Boolean))];
    }
    if (data.skills.soft) {
      data.skills.soft = [...new Set(data.skills.soft.filter(Boolean))];
    }

    // Calculate total experience if not provided
    if (!data.metadata.totalExperience && data.experience.length > 0) {
      const totalMonths = data.experience.reduce((acc, exp) => {
        const start = this.parseDate(exp.startDate);
        const end = exp.endDate.toLowerCase().includes('present') ? new Date() : this.parseDate(exp.endDate);
        if (start && end) {
          const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
          return acc + Math.max(months, 0);
        }
        return acc;
      }, 0);
      
      const years = Math.floor(totalMonths / 12);
      data.metadata.totalExperience = years > 0 ? `${years} years` : `${totalMonths} months`;
    }

    // Determine career level if not provided
    if (!data.metadata.careerLevel) {
      const experienceYears = this.extractYearsFromExperience(data.metadata.totalExperience);
      if (experienceYears <= 2) data.metadata.careerLevel = 'entry';
      else if (experienceYears <= 7) data.metadata.careerLevel = 'mid';
      else if (experienceYears <= 15) data.metadata.careerLevel = 'senior';
      else data.metadata.careerLevel = 'executive';
    }

    return data;
  }

  private calculateConfidence(data: ExtractedResumeData, originalText: string): number {
    let confidence = 0;

    // Personal info completeness
    if (data.personalInfo.name) confidence += 20;
    if (data.personalInfo.email) confidence += 15;
    if (data.personalInfo.phone) confidence += 10;
    if (data.personalInfo.location) confidence += 5;

    // Skills availability
    if (data.skills.technical.length > 0) confidence += 20;
    if (data.skills.soft.length > 0) confidence += 10;

    // Experience completeness
    if (data.experience.length > 0) confidence += 20;
    if (data.experience.some(exp => exp.achievements.length > 0)) confidence += 5;

    // Education info
    if (data.education.length > 0) confidence += 10;

    // Professional summary
    if (data.professionalSummary && data.professionalSummary.length > 50) confidence += 5;

    return Math.min(confidence, 100);
  }

  private basicExtraction(text: string): ExtractedResumeData | null {
    try {
      // Basic fallback extraction using regex patterns
      const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      const phoneMatch = text.match(/(\+1\s?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);

      return {
        personalInfo: {
          name: nameMatch?.[1] || 'Name not found',
          email: emailMatch?.[0] || 'Email not found',
          phone: phoneMatch?.[0] || 'Phone not found',
          location: 'Location not found'
        },
        professionalSummary: '',
        skills: {
          technical: [],
          soft: [],
          languages: [],
          certifications: []
        },
        experience: [],
        education: [],
        projects: [],
        metadata: {
          totalExperience: 'Unknown',
          careerLevel: 'entry',
          primaryRole: 'Unknown',
          industries: []
        }
      };
    } catch (error) {
      return null;
    }
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Handle MM/YYYY format
    const mmYyyy = dateStr.match(/(\d{1,2})\/(\d{4})/);
    if (mmYyyy) {
      return new Date(parseInt(mmYyyy[2]), parseInt(mmYyyy[1]) - 1);
    }
    
    // Handle YYYY format
    const yyyy = dateStr.match(/(\d{4})/);
    if (yyyy) {
      return new Date(parseInt(yyyy[1]), 0);
    }
    
    return null;
  }

  private extractYearsFromExperience(experienceStr: string): number {
    if (!experienceStr) return 0;
    const match = experienceStr.match(/(\d+)\s*years?/i);
    return match ? parseInt(match[1]) : 0;
  }
}

// Export singleton instance
export const resumeExtractor = new AIResumeExtractor();

// Export types
export type { ExtractedResumeData, ExtractionResult };







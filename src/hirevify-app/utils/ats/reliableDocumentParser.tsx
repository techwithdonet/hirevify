// @ts-nocheck
/**
 * Reliable Document Parser - Simple and Effective
 * 
 * This parser focuses on reliability over complexity.
 * It uses simple, proven patterns that work with real resumes.
 */

export interface ReliableResumeData {
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
  experience: Array<{
    id: string;
    position: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
    achievements: string[];
    skills: string[];
    industry: string;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
    gpa?: string;
    location?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    tools: string[];
    frameworks: string[];
    languages: string[];
  };
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    startDate?: string;
    endDate?: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
  }>;
  extractionMetadata: {
    confidence: number;
    processingMethod: string;
    aiAnalysisUsed: boolean;
    parsingErrors: string[];
    enhancementNotes: string[];
  };
}

export class ReliableDocumentParser {
  
  async parseDocument(file: File): Promise<ReliableResumeData> {
    console.log('ðŸš€ RELIABLE PARSER - Starting document parsing for:', file.name);
    console.log('ðŸ“Š File details:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || 'unknown',
      lastModified: new Date(file.lastModified).toLocaleString()
    });
    
    try {
      // Validate file size (10MB limit for this scanner)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit. Please use a smaller file.');
      }

      // Validate file name
      if (!file.name || file.size === 0) {
        throw new Error('Invalid file: File appears to be empty or corrupted');
      }

      // Step 1: Extract text content
      console.log('ðŸ”„ Starting text extraction...');
      const extractedText = await this.extractTextFromFile(file);
      
      console.log('ðŸ“„ Text extracted successfully, length:', extractedText.length);
      console.log('ðŸ“„ First 200 characters:', extractedText.substring(0, 200));
      
      // Step 2: Parse the extracted text
      console.log('ðŸ”„ Starting resume text parsing...');
      const result = await this.parseResumeText(extractedText);
      
      console.log('âœ… Document parsing completed successfully');
      return result;
      
    } catch (error) {
      console.error('âŒ Document parsing failed:', error);
      
      // Provide specific error messages
      let errorMessage = error.message;
      if (errorMessage.includes('binary data')) {
        errorMessage = 'File format not supported. Please save your resume as a .txt file for best compatibility.';
      } else if (errorMessage.includes('insufficient')) {
        errorMessage = 'File appears to contain very little text. Please ensure your resume has readable content.';
      } else if (errorMessage.includes('timed out')) {
        errorMessage = 'File processing timed out. Please try with a smaller file.';
      }
      
      throw new Error(errorMessage);
    }
  }

  private async extractTextFromFile(file: File): Promise<string> {
    console.log('ðŸ“„ Extracting text from:', file.type || 'unknown', file.name);
    
    try {
      // Try to read the file as text regardless of type
      const text = await this.readTextFile(file);
      
      if (!text || text.length < 10) {
        throw new Error('File contains insufficient readable text');
      }
      
      console.log('âœ… Text extraction successful, length:', text.length);
      return text;
      
    } catch (error) {
      console.error('âŒ Text extraction failed:', error);
      
      // Provide helpful error messages based on file type
      if (file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('PDF files require advanced processing. Please use the Professional ATS Scanner or convert to .txt format.');
      } else if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
        throw new Error('Word documents require advanced processing. Please use the Professional ATS Scanner or save as .txt format.');
      } else if (file.size > 5 * 1024 * 1024) {
        throw new Error('File is too large. Please try a smaller file or convert to .txt format.');
      } else {
        throw new Error('Unable to read file content. Please ensure the file contains readable text and try saving as .txt format.');
      }
    }
  }

  private async readTextFile(file: File): Promise<string> {
    // Try multiple reading strategies
    const strategies = [
      () => this.readWithEncoding(file, 'UTF-8'),
      () => this.readWithEncoding(file, 'ISO-8859-1'),
      () => this.readWithEncoding(file, 'windows-1252'),
      () => this.readAsArrayBuffer(file)
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`ðŸ“„ Trying reading strategy ${i + 1}...`);
        const text = await strategies[i]();
        
        if (text && text.length > 10) {
          const cleaned = this.cleanTextContent(text);
          if (cleaned.length > 10) {
            console.log(`âœ… Successfully read file with strategy ${i + 1}, length:`, cleaned.length);
            return cleaned;
          }
        }
      } catch (error) {
        console.log(`âŒ Strategy ${i + 1} failed:`, error.message);
        // Continue to next strategy
      }
    }

    throw new Error('Unable to read file content with any method');
  }

  private async readWithEncoding(file: File, encoding: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error(`Reading timed out with encoding ${encoding}`));
      }, 10000);
      
      reader.onload = (event) => {
        clearTimeout(timeout);
        const text = event.target?.result as string;
        if (text) {
          resolve(text);
        } else {
          reject(new Error('No text content received'));
        }
      };
      
      reader.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to read with encoding ${encoding}`));
      };
      
      reader.readAsText(file, encoding);
    });
  }

  private async readAsArrayBuffer(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('ArrayBuffer reading timed out'));
      }, 10000);
      
      reader.onload = (event) => {
        clearTimeout(timeout);
        try {
          const buffer = event.target?.result as ArrayBuffer;
          if (!buffer) {
            reject(new Error('No buffer received'));
            return;
          }

          // Try to decode as text
          const decoder = new TextDecoder('utf-8', { fatal: false });
          const text = decoder.decode(buffer);
          
          if (text && text.length > 0) {
            resolve(text);
          } else {
            reject(new Error('No text could be decoded from buffer'));
          }
        } catch (error) {
          reject(new Error('Failed to decode buffer as text'));
        }
      };
      
      reader.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to read as array buffer'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  private cleanTextContent(text: string): string {
    if (!text) return '';

    let cleaned = text;

    // Remove null bytes and other problematic binary characters
    cleaned = cleaned.replace(/\0/g, '');
    
    // Remove other control characters except newlines, tabs, and carriage returns
    cleaned = cleaned.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Remove any remaining non-printable characters but keep basic punctuation
    cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t\u00A0-\uFFFF]/g, '');
    
    // Normalize line endings
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Clean up whitespace but preserve structure
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');
    cleaned = cleaned.replace(/^\s+|\s+$/gm, ''); // Trim each line
    
    // Remove empty lines at start and end
    cleaned = cleaned.replace(/^\n+|\n+$/g, '');
    
    return cleaned;
  }

  private async parseResumeText(text: string): Promise<ReliableResumeData> {
    console.log('ðŸ” PARSING RESUME TEXT');
    
    // Clean the text
    const cleanText = this.cleanText(text);
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract each section
    const personalInfo = this.extractPersonalInfo(cleanText, lines);
    const professionalSummary = this.extractProfessionalSummary(cleanText, lines);
    const experience = this.extractWorkExperience(cleanText, lines);
    const education = this.extractEducation(cleanText, lines);
    const skills = this.extractSkills(cleanText, lines);
    const projects = this.extractProjects(cleanText, lines);
    const certifications = this.extractCertifications(cleanText, lines);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(personalInfo, experience, education, skills);
    
    const result: ReliableResumeData = {
      personalInfo,
      professionalSummary,
      experience,
      education,
      skills,
      projects,
      certifications,
      extractionMetadata: {
        confidence,
        processingMethod: 'Reliable Parser v1.0',
        aiAnalysisUsed: false,
        parsingErrors: [],
        enhancementNotes: [
          'Simple and reliable extraction',
          'Focus on common resume patterns',
          'High success rate with standard formats'
        ]
      }
    };

    console.log('ðŸŽ¯ PARSING COMPLETE:', {
      name: result.personalInfo.name,
      email: result.personalInfo.email,
      experience_count: result.experience.length,
      education_count: result.education.length,
      skills_count: result.skills.technical.length + result.skills.soft.length,
      confidence: result.extractionMetadata.confidence
    });

    return result;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private extractPersonalInfo(text: string, lines: string[]) {
    console.log('ðŸ” Extracting personal info...');
    
    // Name - try multiple simple strategies
    let name = 'Name not found';
    
    // Strategy 1: First non-empty line that looks like a name
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      const words = line.split(/\s+/);
      
      // Simple check: 2-4 words, starts with capital letters, no numbers or @ symbols
      if (words.length >= 2 && words.length <= 4) {
        const looksLikeName = words.every(word => 
          /^[A-Z][a-z]+$/.test(word) && 
          word.length > 1
        );
        
        if (looksLikeName && !line.includes('@') && !line.includes('http') && !line.includes('.com')) {
          name = line;
          break;
        }
      }
    }
    
    // Email - simple and reliable
    const emailMatch = text.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/);
    const email = emailMatch ? emailMatch[0] : 'Email not found';
    
    // Phone - multiple common formats
    const phonePatterns = [
      /\(\d{3}\)\s?\d{3}[-.]?\d{4}/,           // (555) 123-4567
      /\d{3}[-.]?\d{3}[-.]?\d{4}/,              // 555-123-4567
      /\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/, // +1 555 123 4567
      /\d{10}/                                   // 5551234567
    ];
    
    let phone = 'Phone not found';
    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) {
        phone = match[0];
        break;
      }
    }
    
    // Location - simple city, state patterns
    const locationPatterns = [
      /[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\b/,        // City, ST
      /[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+/,  // City, State
    ];
    
    let location = 'Location not found';
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[0].length < 50) {
        location = match[0];
        break;
      }
    }
    
    // Social links
    const linkedinMatch = text.match(/Link\.com\/in\/[a-zA-Z0-9-]+/);
    const Link = linkedinMatch ? linkedinMatch[0] : '';
    
    const githubMatch = text.match(/GitBranch\.com\/[a-zA-Z0-9-]+/);
    const GitBranch = githubMatch ? githubMatch[0] : '';
    
    const portfolioMatch = text.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const portfolio = portfolioMatch ? portfolioMatch[0] : '';

    console.log('âœ… Personal info extracted:', { name, email, phone, location });

    return {
      name,
      email,
      phone,
      location,
      Link,
      GitBranch,
      portfolio
    };
  }

  private extractProfessionalSummary(text: string, lines: string[]): string {
    console.log('ðŸ” Extracting professional summary...');
    
    const summaryKeywords = ['summary', 'objective', 'profile', 'overview', 'about'];
    
    // Find summary section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (summaryKeywords.some(keyword => line.includes(keyword)) && line.length < 50) {
        // Found summary header, get next few lines
        const summaryLines = [];
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          const nextLine = lines[j];
          
          // Stop if we hit another section
          if (this.isSection(nextLine)) break;
          
          if (nextLine.length > 20) {
            summaryLines.push(nextLine);
          }
        }
        
        if (summaryLines.length > 0) {
          const summary = summaryLines.join(' ').substring(0, 500);
          console.log('âœ… Summary found');
          return summary;
        }
      }
    }
    
    // Fallback: look for paragraph-like content near the top
    for (let i = 1; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      
      if (line.length > 100 && line.includes('.') && 
          !line.includes('@') && !line.includes('http')) {
        console.log('âœ… Summary found via content heuristic');
        return line.substring(0, 300);
      }
    }
    
    return 'Professional summary not found';
  }

  private extractWorkExperience(text: string, lines: string[]) {
    console.log('ðŸ” Extracting work experience...');
    
    const experiences = [];
    const experienceKeywords = ['experience', 'employment', 'work history', 'career'];
    
    // Find experience section
    let startIndex = -1;
    let endIndex = lines.length;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (experienceKeywords.some(keyword => line.includes(keyword)) && line.length < 50) {
        startIndex = i + 1;
        break;
      }
    }
    
    if (startIndex > -1) {
      // Find where experience section ends
      const nextSections = ['education', 'skills', 'projects', 'certifications'];
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (nextSections.some(section => line.includes(section)) && line.length < 50) {
          endIndex = i;
          break;
        }
      }
    }
    
    // Extract experience entries
    if (startIndex > -1) {
      const experienceText = lines.slice(startIndex, endIndex).join('\n');
      
      // Pattern for "Position at Company (2020-2023)"
      const jobPattern = /(.+?)\s+at\s+(.+?)\s*(?:\(|\,)?\s*(\d{4})\s*[--]\s*(\d{4}|present)/gi;
      let match;
      let expId = 1;
      
      while ((match = jobPattern.exec(experienceText)) !== null) {
        const position = match[1].trim();
        const company = match[2].trim();
        const startDate = match[3];
        const endDate = match[4];
        const isCurrent = endDate.toLowerCase() === 'present';
        
        experiences.push({
          id: `exp_${expId++}`,
          position,
          company,
          location: '',
          startDate,
          endDate: isCurrent ? '' : endDate,
          isCurrent,
          description: `${position} at ${company}`,
          achievements: [],
          skills: [],
          industry: 'Unknown'
        });
      }
      
      // Alternative pattern for comma-separated format
      if (experiences.length === 0) {
        const altPattern = /([^,\n]+),\s*([^,\n]+),\s*(\d{4})\s*[--]\s*(\d{4}|present)/gi;
        
        while ((match = altPattern.exec(experienceText)) !== null) {
          const position = match[1].trim();
          const company = match[2].trim();
          const startDate = match[3];
          const endDate = match[4];
          const isCurrent = endDate.toLowerCase() === 'present';
          
          experiences.push({
            id: `exp_${expId++}`,
            position,
            company,
            location: '',
            startDate,
            endDate: isCurrent ? '' : endDate,
            isCurrent,
            description: `${position} at ${company}`,
            achievements: [],
            skills: [],
            industry: 'Unknown'
          });
        }
      }
    }
    
    console.log(`âœ… Found ${experiences.length} work experience entries`);
    return experiences;
  }

  private extractEducation(text: string, lines: string[]) {
    console.log('ðŸ” Extracting education...');
    
    const education = [];
    const educationKeywords = ['education', 'academic', 'university', 'college'];
    
    // Find education section
    let startIndex = -1;
    let endIndex = lines.length;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (educationKeywords.some(keyword => line.includes(keyword)) && line.length < 50) {
        startIndex = i + 1;
        break;
      }
    }
    
    if (startIndex > -1) {
      // Find where education section ends
      const nextSections = ['experience', 'skills', 'projects', 'certifications'];
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (nextSections.some(section => line.includes(section)) && line.length < 50) {
          endIndex = i;
          break;
        }
      }
      
      // Look for degree patterns
      const educationLines = lines.slice(startIndex, endIndex);
      const degreePatterns = [
        /bachelor|master|phd|doctorate|associate|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|ph\.?d\.?/i
      ];
      
      let eduId = 1;
      for (let i = 0; i < educationLines.length; i++) {
        const line = educationLines[i];
        
        if (degreePatterns.some(pattern => pattern.test(line))) {
          const institution = educationLines[i + 1] || 'Institution not specified';
          const yearMatch = line.match(/\d{4}/);
          const graduationDate = yearMatch ? yearMatch[0] : '';
          
          education.push({
            id: `edu_${eduId++}`,
            institution,
            degree: line,
            field: '',
            graduationDate,
            location: ''
          });
        }
      }
    }
    
    console.log(`âœ… Found ${education.length} education entries`);
    return education;
  }

  private extractSkills(text: string, lines: string[]) {
    console.log('ðŸ” Extracting skills...');
    
    // Common skill lists
    const technicalSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS',
      'TypeScript', 'Angular', 'Vue', 'C++', 'C#', 'PHP', 'Ruby', 'Go',
      'AWS', 'Docker', 'Kubernetes', 'Git', 'MongoDB', 'PostgreSQL', 'MySQL',
      'Spring', 'Django', 'Flask', 'Express', 'Bootstrap', 'Sass', 'Webpack'
    ];
    
    const softSkills = [
      'Leadership', 'Communication', 'Teamwork', 'Problem Solving',
      'Project Management', 'Critical Thinking', 'Adaptability', 'Creativity',
      'Time Management', 'Collaboration', 'Decision Making'
    ];
    
    const tools = [
      'Visual Studio Code', 'IntelliJ', 'Eclipse', 'Slack', 'Jira', 'Confluence',
      'Figma', 'Adobe', 'Photoshop', 'Illustrator', 'Microsoft Office',
      'Google Workspace', 'Tableau', 'Power BI'
    ];
    
    const frameworks = [
      'React', 'Angular', 'Vue', 'Next.js', 'Nuxt.js', 'Express', 'Django',
      'Flask', 'Spring Boot', 'Laravel', 'Rails', 'ASP.NET'
    ];
    
    const languages = [
      'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
      'Portuguese', 'Italian', 'Russian', 'Arabic', 'Hindi'
    ];
    
    const foundTechnical = [];
    const foundSoft = [];
    const foundTools = [];
    const foundFrameworks = [];
    const foundLanguages = [];
    
    // Search for skills in text
    const lowerText = text.toLowerCase();
    
    technicalSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundTechnical.push(skill);
      }
    });
    
    softSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSoft.push(skill);
      }
    });
    
    tools.forEach(tool => {
      if (lowerText.includes(tool.toLowerCase())) {
        foundTools.push(tool);
      }
    });
    
    frameworks.forEach(framework => {
      if (lowerText.includes(framework.toLowerCase())) {
        foundFrameworks.push(framework);
      }
    });
    
    languages.forEach(language => {
      if (lowerText.includes(language.toLowerCase())) {
        foundLanguages.push(language);
      }
    });
    
    const skills = {
      technical: [...new Set(foundTechnical)],
      soft: [...new Set(foundSoft)],
      tools: [...new Set(foundTools)],
      frameworks: [...new Set(foundFrameworks)],
      languages: [...new Set(foundLanguages)]
    };
    
    console.log('âœ… Skills extracted:', {
      technical: skills.technical.length,
      soft: skills.soft.length,
      tools: skills.tools.length,
      frameworks: skills.frameworks.length,
      languages: skills.languages.length
    });
    
    return skills;
  }

  private extractProjects(text: string, lines: string[]) {
    const projects = [];
    // Simple project extraction - can be enhanced later
    console.log('âœ… Projects extraction (basic implementation)');
    return projects;
  }

  private extractCertifications(text: string, lines: string[]) {
    const certifications = [];
    // Simple certification extraction - can be enhanced later
    console.log('âœ… Certifications extraction (basic implementation)');
    return certifications;
  }

  private isSection(line: string): boolean {
    const sectionKeywords = [
      'experience', 'education', 'skills', 'projects', 'certifications',
      'awards', 'achievements', 'summary', 'objective'
    ];
    
    const lowerLine = line.toLowerCase();
    return line.length < 50 && sectionKeywords.some(keyword => lowerLine.includes(keyword));
  }

  private calculateConfidence(personalInfo: any, experience: any[], education: any[], skills: any): number {
    let score = 0;
    
    // Personal info scoring
    if (personalInfo.name !== 'Name not found') score += 20;
    if (personalInfo.email !== 'Email not found') score += 20;
    if (personalInfo.phone !== 'Phone not found') score += 10;
    if (personalInfo.location !== 'Location not found') score += 10;
    
    // Experience scoring
    if (experience.length > 0) score += 25;
    if (experience.length > 2) score += 5;
    
    // Education scoring
    if (education.length > 0) score += 10;
    
    return Math.min(score, 100);
  }
}









// @ts-nocheck
/**
 * Enhanced PDF Parser - Specialized for Resume Analysis
 * Optimized for accurate data extraction from PDF resumes
 * Takes more time but ensures high accuracy
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export interface PDFTextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL: boolean;
}

export interface PDFPageContent {
  items: PDFTextItem[];
  styles: Record<string, any>;
}

export interface EnhancedPDFContent {
  rawText: string;
  structuredText: {
    lines: string[];
    paragraphs: string[];
    sections: PDFSection[];
  };
  metadata: {
    pageCount: number;
    fonts: string[];
    textItems: number;
    averageFontSize: number;
    documentStructure: 'simple' | 'complex' | 'multi-column';
  };
  extractedData: {
    personalInfo: PersonalInfo;
    sections: ResumeSection[];
    workExperience: WorkExperience[];
    education: Education[];
    skills: Skills;
    certifications: Certification[];
    languages: Language[];
    projects: Project[];
  };
}

export interface PDFSection {
  type: 'header' | 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'other';
  title: string;
  content: string[];
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  Link: string;
  GitBranch: string;
  website: string;
  portfolio: string;
  confidence: number;
}

export interface ResumeSection {
  type: string;
  title: string;
  content: string;
  items: string[];
  confidence: number;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  achievements: string[];
  skills: string[];
  confidence: number;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationDate: string;
  gpa: string;
  honors: string[];
  relevantCoursework: string[];
  confidence: number;
}

export interface Skills {
  technical: string[];
  soft: string[];
  tools: string[];
  frameworks: string[];
  languages: string[];
  confidence: number;
}

export interface Certification {
  name: string;
  issuer: string;
  dateObtained: string;
  expirationDate: string;
  credentialId: string;
  confidence: number;
}

export interface Language {
  name: string;
  proficiency: string;
  confidence: number;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate: string;
  url: string;
  achievements: string[];
  confidence: number;
}

export class EnhancedPDFParser {
  private commonTechnicalSkills = [
    // Programming Languages
    'javascript', 'python', 'java', 'typescript', 'c++', 'c#', 'go', 'rust', 'swift', 'kotlin',
    'php', 'ruby', 'scala', 'perl', 'r', 'matlab', 'dart', 'elixir', 'haskell', 'clojure',
    
    // Web Technologies
    'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'next.js', 'nuxt.js',
    'svelte', 'bootstrap', 'tailwind', 'sass', 'less', 'webpack', 'vite', 'parcel',
    
    // Mobile Development
    'react native', 'flutter', 'ionic', 'xamarin', 'cordova', 'phonegap',
    
    // Backend & APIs
    'django', 'flask', 'spring', 'spring boot', 'laravel', 'symfony', 'rails', 'fastapi',
    'graphql', 'rest', 'soap', 'grpc', 'microservices', 'serverless',
    
    // Databases
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
    'dynamodb', 'firebase', 'supabase', 'prisma', 'sequelize', 'typeorm',
    
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins',
    'GitBranch actions', 'gitlab ci', 'travis ci', 'circleci', 'heroku', 'vercel', 'netlify',
    
    // Tools & IDEs
    'git', 'GitBranch', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack', 'teams',
    'visual studio', 'vscode', 'intellij', 'eclipse', 'sublime', 'atom',
    
    // Testing
    'jest', 'cypress', 'selenium', 'playwright', 'junit', 'pytest', 'mocha', 'chai',
    'testing library', 'enzyme',
    
    // Data & Analytics
    'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'opencv',
    'tableau', 'power bi', 'looker', 'qlik', 'excel', 'google analytics',
    
    // Design & UX
    'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'after effects',
    'invision', 'zeplin', 'principle'
  ];

  private jobTitlePatterns = [
    // Software Engineering
    /\b(senior|junior|lead|principal|staff|sr\.?)\s*(software|web|mobile|full.?stack|front.?end|back.?end|frontend|backend)\s*(engineer|developer|programmer|architect)\b/i,
    /\b(software|web|mobile|application|app)\s*(engineer|developer|programmer|architect)\b/i,
    /\b(full.?stack|fullstack)\s*(engineer|developer|programmer)\b/i,
    
    // Specialized Roles
    /\b(devops|site reliability|sre|platform|infrastructure|cloud|security)\s*(engineer|architect|specialist)\b/i,
    /\b(data|machine learning|ml|ai|artificial intelligence)\s*(engineer|scientist|analyst|architect)\b/i,
    /\b(product|project|program|technical)\s*(manager|lead|director|owner)\b/i,
    /\b(ux|ui|user experience|user interface)\s*(designer|engineer|researcher|lead)\b/i,
    /\b(quality assurance|qa|test|testing)\s*(engineer|analyst|lead|manager)\b/i,
    
    // Business & Management
    /\b(business|systems?|process|operations)\s*(analyst|manager|lead|director)\b/i,
    /\b(sales|marketing|account|customer success)\s*(manager|director|executive|lead|representative|rep)\b/i,
    /\b(human resources|hr|people|talent)\s*(manager|director|specialist|coordinator|business partner)\b/i,
    /\b(finance|financial|accounting|budget)\s*(analyst|manager|director|controller)\b/i,
    
    // Executive Roles
    /\b(chief|head of|vp|vice president|president|director of|manager of)\s*.+/i,
    /\b(ceo|cto|cfo|cmo|coo|ciso|chro)\b/i,
    /\b(founder|co.?founder|owner|partner)\b/i,
    
    // Consultant & Freelance
    /\b(consultant|freelancer|contractor|specialist|advisor|expert)\b/i,
    /\b(senior|lead|principal)\s+(consultant|specialist|advisor)\b/i
  ];

  private companyIndicators = [
    'inc', 'llc', 'corp', 'corporation', 'company', 'co', 'ltd', 'limited',
    'technologies', 'technology', 'tech', 'solutions', 'systems', 'services',
    'group', 'consulting', 'partners', 'associates', 'ventures', 'labs',
    'studio', 'agency', 'firm', 'enterprises', 'holdings', 'capital'
  ];

  private degreePatterns = [
    /\b(bachelor|master|doctorate|doctoral|phd|ph\.?d|associate|diploma|certificate)\b/i,
    /\b(b\.?[sa]\.?|m\.?[sa]\.?|m\.?s\.?|m\.?a\.?|ph\.?d\.?|d\.?phil\.?)\b/i,
    /\b(bs|ba|ms|ma|mba|phd|md|jd|llm)\b/i
  ];

  private fieldOfStudyPatterns = [
    /\b(computer science|cs|software engineering|information technology|it)\b/i,
    /\b(electrical engineering|mechanical engineering|civil engineering|chemical engineering)\b/i,
    /\b(business administration|finance|accounting|economics|marketing|management)\b/i,
    /\b(psychology|sociology|anthropology|political science|international relations)\b/i,
    /\b(mathematics|math|physics|chemistry|biology|statistics|data science)\b/i,
    /\b(english|literature|history|philosophy|communications|journalism)\b/i,
    /\b(art|design|graphic design|fine arts|music|theater|film)\b/i,
    /\b(medicine|nursing|pharmacy|public health|biomedical)\b/i,
    /\b(law|legal studies|criminal justice|paralegal)\b/i
  ];

  /**
   * Parse PDF with enhanced accuracy
   */
  async parsePDFWithAccuracy(file: File): Promise<EnhancedPDFContent> {
    console.log('ðŸ” Starting enhanced PDF parsing for maximum accuracy...');
    const startTime = Date.now();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      console.log(`ðŸ“„ PDF loaded: ${pdf.numPages} pages`);

      // Extract text with detailed positioning information
      const pagesContent: PDFPageContent[] = [];
      let allTextItems: PDFTextItem[] = [];
      let fonts = new Set<string>();

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageContent: PDFPageContent = {
          items: textContent.items as PDFTextItem[],
          styles: textContent.styles
        };
        
        pagesContent.push(pageContent);
        allTextItems = allTextItems.concat(pageContent.items);
        
        // Collect font information
        pageContent.items.forEach(item => {
          if (item.fontName) {
            fonts.add(item.fontName);
          }
        });
      }

      console.log(`ðŸ“Š Extracted ${allTextItems.length} text items from ${pdf.numPages} pages`);

      // Analyze document structure
      const structuredText = this.analyzeDocumentStructure(allTextItems);
      
      // Build comprehensive text representation
      const rawText = allTextItems.map(item => item.str).join(' ');
      
      // Extract sections with advanced pattern matching
      const sections = this.extractSectionsAdvanced(structuredText.lines);
      
      // Extract personal information with multiple strategies
      const personalInfo = this.extractPersonalInfoAdvanced(structuredText.lines, rawText);
      
      // Extract work experience with detailed parsing
      const workExperience = this.extractWorkExperienceAdvanced(sections, structuredText.lines);
      
      // Extract education with comprehensive patterns
      const education = this.extractEducationAdvanced(sections, structuredText.lines);
      
      // Extract skills with industry-specific recognition
      const skills = this.extractSkillsAdvanced(rawText, sections);
      
      // Extract certifications
      const certifications = this.extractCertificationsAdvanced(sections, structuredText.lines);
      
      // Extract languages
      const languages = this.extractLanguagesAdvanced(rawText, sections);
      
      // Extract projects
      const projects = this.extractProjectsAdvanced(sections, structuredText.lines);

      const processingTime = Date.now() - startTime;
      console.log(`âœ… Enhanced PDF parsing completed in ${processingTime}ms`);

      const result: EnhancedPDFContent = {
        rawText,
        structuredText,
        metadata: {
          pageCount: pdf.numPages,
          fonts: Array.from(fonts),
          textItems: allTextItems.length,
          averageFontSize: this.calculateAverageFontSize(allTextItems),
          documentStructure: this.determineDocumentStructure(allTextItems)
        },
        extractedData: {
          personalInfo,
          sections,
          workExperience,
          education,
          skills,
          certifications,
          languages,
          projects
        }
      };

      console.log('ðŸ“‹ Enhanced extraction results:', {
        personalInfo: personalInfo.fullName,
        workExperienceCount: workExperience.length,
        educationCount: education.length,
        skillsCount: skills.technical.length + skills.soft.length,
        certificationsCount: certifications.length
      });

      return result;

    } catch (error) {
      console.error('âŒ Enhanced PDF parsing failed:', error);
      throw new Error(`Enhanced PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private analyzeDocumentStructure(textItems: PDFTextItem[]) {
    // Sort items by vertical position (y-coordinate)
    const sortedItems = [...textItems].sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      return yB - yA; // Higher y values first (top to bottom)
    });

    // Group items into lines based on y-coordinate proximity
    const lines: string[] = [];
    const paragraphs: string[] = [];
    let currentLine = '';
    let currentY = -1;
    const lineThreshold = 2; // pixels
    
    for (const item of sortedItems) {
      const itemY = item.transform[5];
      
      if (currentY === -1 || Math.abs(itemY - currentY) <= lineThreshold) {
        // Same line
        currentLine += (currentLine ? ' ' : '') + item.str;
        currentY = itemY;
      } else {
        // New line
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        currentLine = item.str;
        currentY = itemY;
      }
    }
    
    // Add the last line
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    // Group lines into paragraphs
    let currentParagraph = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '') {
        // Empty line - end of paragraph
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        }
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + line;
      }
    }
    
    // Add the last paragraph
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim());
    }

    return {
      lines: lines.filter(line => line.trim().length > 0),
      paragraphs,
      sections: [] // Will be filled by extractSectionsAdvanced
    };
  }

  private extractSectionsAdvanced(lines: string[]): PDFSection[] {
    const sections: PDFSection[] = [];
    
    const sectionPatterns = {
      summary: /^(summary|profile|overview|objective|about|executive summary|professional summary)/i,
      experience: /^(experience|employment|work history|career|professional experience|work experience)/i,
      education: /^(education|academic|degrees?|qualifications|educational background)/i,
      skills: /^(skills|technical skills|competencies|technologies|expertise|core competencies)/i,
      certifications: /^(certifications?|certificates?|licenses?|credentials?)/i,
      projects: /^(projects?|portfolio|selected projects|key projects)/i,
      awards: /^(awards?|honors?|achievements?|recognition)/i,
      languages: /^(languages?|language proficiency)/i,
      references: /^(references?|referees?)/i,
      other: /^(additional|other|miscellaneous|volunteer|extracurricular)/i
    };

    let currentSection: PDFSection | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check if this line is a section header
      let sectionType: string | null = null;
      for (const [type, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(line)) {
          sectionType = type;
          break;
        }
      }

      if (sectionType) {
        // Save previous section
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          type: sectionType as any,
          title: line,
          content: [],
          confidence: 85,
          startIndex: i,
          endIndex: i
        };
      } else if (currentSection) {
        // Add content to current section
        currentSection.content.push(line);
        currentSection.endIndex = i;
      } else {
        // Content before any section header - might be contact info
        if (i < 10) { // Only consider first 10 lines for contact info
          if (!sections.find(s => s.type === 'contact')) {
            sections.push({
              type: 'contact',
              title: 'Contact Information',
              content: [line],
              confidence: 70,
              startIndex: 0,
              endIndex: i
            });
          } else {
            const contactSection = sections.find(s => s.type === 'contact');
            if (contactSection) {
              contactSection.content.push(line);
              contactSection.endIndex = i;
            }
          }
        }
      }
    }

    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private extractPersonalInfoAdvanced(lines: string[], fullText: string): PersonalInfo {
    console.log('ðŸ‘¤ Extracting personal information with advanced patterns...');
    
    // Look in the first 15 lines for personal info
    const headerLines = lines.slice(0, 15);
    const headerText = headerLines.join(' ');

    // Enhanced email extraction
    const emailPatterns = [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    ];
    
    let email = '';
    for (const pattern of emailPatterns) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        email = matches[0];
        break;
      }
    }

    // Enhanced phone extraction
    const phonePatterns = [
      /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
      /(\+?[1-9]\d{0,3}[-.\s]?)?\(?([0-9]{3,4})\)?[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{4,6})/g,
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g
    ];
    
    let phone = '';
    for (const pattern of phonePatterns) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        phone = matches[0];
        break;
      }
    }

    // Enhanced name extraction
    let fullName = '';
    
    // Strategy 1: Look for lines with 2-4 capitalized words, no symbols
    for (const line of headerLines) {
      const words = line.split(/\s+/).filter(word => word.length > 0);
      if (words.length >= 2 && words.length <= 4) {
        const isNameLike = words.every(word => 
          /^[A-Z][a-z]+$/.test(word) || // Proper case
          /^[A-Z]{2,}$/.test(word) // All caps (initials)
        );
        
        if (isNameLike && !email && !phone && line.length < 50) {
          fullName = line.trim();
          break;
        }
      }
    }

    // Strategy 2: Extract from email if no name found
    if (!fullName && email) {
      const emailPart = email.split('@')[0];
      const nameParts = emailPart.split(/[._-]/);
      if (nameParts.length >= 2) {
        fullName = nameParts.map(part => 
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join(' ');
      }
    }

    // Enhanced location extraction
    const locationPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b/g, // City, State
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, // City, Country
      /\b[A-Z][a-z]+,\s*[A-Z]{2}\s*\d{5}\b/g // City, State ZIP
    ];
    
    let location = '';
    for (const pattern of locationPatterns) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        location = matches[0];
        break;
      }
    }

    // Enhanced Link extraction
    const linkedInPatterns = [
      /(?:Link\.com\/in\/|Link\.com\/pub\/)([a-zA-Z0-9\-]+)/i,
      /(?:in\/|pub\/)([a-zA-Z0-9\-]+)/i
    ];
    
    let Link = '';
    for (const pattern of linkedInPatterns) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        Link = matches[0].includes('Link.com') ? matches[0] : `Link.com/in/${matches[1]}`;
        break;
      }
    }

    // Enhanced GitBranch extraction
    const githubPatterns = [
      /(?:GitBranch\.com\/)([a-zA-Z0-9\-]+)/i,
      /(?:git\s*hub\s*[:\s]\s*)([a-zA-Z0-9\-]+)/i
    ];
    
    let GitBranch = '';
    for (const pattern of githubPatterns) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        GitBranch = matches[0].includes('GitBranch.com') ? matches[0] : `GitBranch.com/${matches[1]}`;
        break;
      }
    }

    // Enhanced website extraction
    const websitePatterns = [
      /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g
    ];
    
    let website = '';
    for (const pattern of websitePatterns) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        // Filter out email domains and common sites
        const filtered = matches.filter(match => 
          !match.includes('@') && 
          !match.includes('Link.com') && 
          !match.includes('GitBranch.com') &&
          !match.includes('gmail.com') &&
          !match.includes('yahoo.com') &&
          !match.includes('outlook.com')
        );
        if (filtered.length > 0) {
          website = filtered[0];
          break;
        }
      }
    }

    const confidence = [fullName, email, phone].filter(field => field.trim().length > 0).length / 3 * 100;

    console.log('âœ… Personal info extracted:', { fullName, email, phone, location, Link, GitBranch, website, confidence });

    return {
      fullName: fullName || 'Name not found',
      email: email || 'Email not found',
      phone: phone || 'Phone not found',
      location: location || 'Location not found',
      Link: Link || '',
      GitBranch: GitBranch || '',
      website: website || '',
      portfolio: '', // Could be enhanced with portfolio pattern matching
      confidence: Math.round(confidence)
    };
  }

  private extractWorkExperienceAdvanced(sections: PDFSection[], lines: string[]): WorkExperience[] {
    console.log('ðŸ’¼ Extracting work experience with advanced patterns...');
    
    const experiences: WorkExperience[] = [];
    
    // Find experience section(s)
    const experienceSections = sections.filter(section => 
      section.type === 'experience' || 
      /experience|employment|work|career/i.test(section.title)
    );

    if (experienceSections.length === 0) {
      console.log('âš ï¸ No experience section found, trying to extract from all content...');
      // Try to find experience patterns in all lines
      return this.extractWorkExperienceFromLines(lines);
    }

    for (const section of experienceSections) {
      console.log(`ðŸ“ Processing experience section: "${section.title}"`);
      
      const sectionExperiences = this.parseExperienceSection(section.content);
      experiences.push(...sectionExperiences);
    }

    console.log(`âœ… Extracted ${experiences.length} work experiences`);
    return experiences;
  }

  private parseExperienceSection(content: string[]): WorkExperience[] {
    const experiences: WorkExperience[] = [];
    let currentExp: Partial<WorkExperience> | null = null;
    
    for (let i = 0; i < content.length; i++) {
      const line = content[i].trim();
      if (!line) continue;

      // Check if this line contains a job title
      if (this.isJobTitle(line)) {
        // Save previous experience
        if (currentExp && currentExp.company && currentExp.position) {
          experiences.push(this.finalizeExperience(currentExp));
        }
        
        // Start new experience
        currentExp = {
          position: line,
          company: '',
          startDate: '',
          endDate: '',
          location: '',
          description: '',
          achievements: [],
          skills: [],
          confidence: 75
        };
      } else if (currentExp && this.isCompanyName(line)) {
        currentExp.company = line;
      } else if (currentExp && this.containsDateRange(line)) {
        const dates = this.extractDateRange(line);
        currentExp.startDate = dates.start;
        currentExp.endDate = dates.end;
      } else if (currentExp && this.isLocation(line)) {
        currentExp.location = line;
      } else if (currentExp && line.length > 20) {
        // Add to description or achievements
        if (this.isAchievement(line)) {
          currentExp.achievements = currentExp.achievements || [];
          currentExp.achievements.push(line);
        } else {
          currentExp.description = (currentExp.description || '') + (currentExp.description ? ' ' : '') + line;
        }
        
        // Extract skills from the line
        const lineSkills = this.extractSkillsFromText(line);
        if (lineSkills.length > 0) {
          currentExp.skills = [...(currentExp.skills || []), ...lineSkills];
        }
      }
    }

    // Add the last experience
    if (currentExp && currentExp.company && currentExp.position) {
      experiences.push(this.finalizeExperience(currentExp));
    }

    return experiences;
  }

  private extractWorkExperienceFromLines(lines: string[]): WorkExperience[] {
    // Fallback method when no clear experience section is found
    const experiences: WorkExperience[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (this.isJobTitle(line)) {
        const experience: WorkExperience = {
          position: line,
          company: 'Company not specified',
          startDate: 'Date not specified',
          endDate: 'Date not specified',
          location: '',
          description: '',
          achievements: [],
          skills: [],
          confidence: 60
        };
        
        // Look for company in next few lines
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (this.isCompanyName(lines[j])) {
            experience.company = lines[j];
            break;
          }
        }
        
        experiences.push(experience);
      }
    }
    
    return experiences;
  }

  private extractEducationAdvanced(sections: PDFSection[], lines: string[]): Education[] {
    console.log('ðŸŽ“ Extracting education with advanced patterns...');
    
    const education: Education[] = [];
    
    // Find education section(s)
    const educationSections = sections.filter(section => 
      section.type === 'education' || 
      /education|academic|degree|university|college/i.test(section.title)
    );

    if (educationSections.length === 0) {
      console.log('âš ï¸ No education section found, trying to extract from all content...');
      return this.extractEducationFromLines(lines);
    }

    for (const section of educationSections) {
      console.log(`ðŸ“š Processing education section: "${section.title}"`);
      
      const sectionEducation = this.parseEducationSection(section.content);
      education.push(...sectionEducation);
    }

    console.log(`âœ… Extracted ${education.length} education entries`);
    return education;
  }

  private parseEducationSection(content: string[]): Education[] {
    const education: Education[] = [];
    let currentEdu: Partial<Education> | null = null;
    
    for (const line of content) {
      if (!line.trim()) continue;

      // Check for degree patterns
      if (this.containsDegree(line)) {
        // Save previous education
        if (currentEdu && currentEdu.institution) {
          education.push(this.finalizeEducation(currentEdu));
        }
        
        // Start new education entry
        const degree = this.extractDegree(line);
        const fieldOfStudy = this.extractFieldOfStudy(line);
        
        currentEdu = {
          degree: degree || line,
          fieldOfStudy: fieldOfStudy || 'Field not specified',
          institution: '',
          graduationDate: '',
          gpa: '',
          honors: [],
          relevantCoursework: [],
          confidence: 75
        };
      } else if (currentEdu && this.isInstitution(line)) {
        currentEdu.institution = line;
      } else if (currentEdu && this.containsGraduationDate(line)) {
        currentEdu.graduationDate = this.extractGraduationDate(line) || '';
      } else if (currentEdu && this.containsGPA(line)) {
        currentEdu.gpa = this.extractGPA(line) || '';
      } else if (currentEdu && this.isHonor(line)) {
        currentEdu.honors = currentEdu.honors || [];
        currentEdu.honors.push(line);
      }
    }

    // Add the last education entry
    if (currentEdu && currentEdu.institution) {
      education.push(this.finalizeEducation(currentEdu));
    }

    return education;
  }

  private extractEducationFromLines(lines: string[]): Education[] {
    const education: Education[] = [];
    
    for (const line of lines) {
      if (this.containsDegree(line) || this.isInstitution(line)) {
        const edu: Education = {
          institution: this.isInstitution(line) ? line : 'Institution not specified',
          degree: this.containsDegree(line) ? this.extractDegree(line) || line : 'Degree not specified',
          fieldOfStudy: this.extractFieldOfStudy(line) || 'Field not specified',
          graduationDate: this.extractGraduationDate(line) || 'Date not specified',
          gpa: '',
          honors: [],
          relevantCoursework: [],
          confidence: 60
        };
        
        education.push(edu);
      }
    }
    
    return education;
  }

  private extractSkillsAdvanced(fullText: string, sections: PDFSection[]): Skills {
    console.log('ðŸ› ï¸ Extracting skills with advanced recognition...');
    
    const skills: Skills = {
      technical: [],
      soft: [],
      tools: [],
      frameworks: [],
      languages: [],
      confidence: 85
    };

    // Find skills section
    const skillsSections = sections.filter(section => 
      section.type === 'skills' || 
      /skills|technical|competencies|technologies/i.test(section.title)
    );

    const textToAnalyze = skillsSections.length > 0 
      ? skillsSections.map(s => s.content.join(' ')).join(' ')
      : fullText;

    // Extract technical skills
    const extractedTechnical = this.extractSkillsFromText(textToAnalyze);
    skills.technical = [...new Set(extractedTechnical)];

    // Extract soft skills
    const softSkillPatterns = [
      'leadership', 'communication', 'teamwork', 'problem solving', 'analytical thinking',
      'creative thinking', 'adaptability', 'time management', 'project management',
      'critical thinking', 'collaboration', 'interpersonal', 'presentation', 'negotiation',
      'decision making', 'strategic thinking', 'innovation', 'mentoring', 'coaching'
    ];

    skills.soft = softSkillPatterns.filter(skill => 
      new RegExp(`\\b${skill.replace(/\s+/g, '\\s+')}\\b`, 'i').test(textToAnalyze)
    );

    // Separate tools and frameworks from technical skills
    const toolKeywords = ['git', 'docker', 'kubernetes', 'jenkins', 'jira', 'confluence'];
    const frameworkKeywords = ['react', 'angular', 'vue', 'express', 'django', 'spring'];

    skills.tools = skills.technical.filter(skill => 
      toolKeywords.some(tool => skill.toLowerCase().includes(tool))
    );

    skills.frameworks = skills.technical.filter(skill => 
      frameworkKeywords.some(framework => skill.toLowerCase().includes(framework))
    );

    // Extract programming languages
    const progLanguages = [
      'javascript', 'python', 'java', 'typescript', 'c++', 'c#', 'go', 'rust', 
      'swift', 'kotlin', 'php', 'ruby', 'scala', 'r'
    ];

    skills.languages = progLanguages.filter(lang => 
      new RegExp(`\\b${lang}\\b`, 'i').test(textToAnalyze)
    );

    console.log('âœ… Skills extracted:', {
      technical: skills.technical.length,
      soft: skills.soft.length,
      tools: skills.tools.length,
      frameworks: skills.frameworks.length,
      languages: skills.languages.length
    });

    return skills;
  }

  private extractCertificationsAdvanced(sections: PDFSection[], lines: string[]): Certification[] {
    console.log('ðŸ† Extracting certifications...');
    
    const certifications: Certification[] = [];
    
    // Find certification sections
    const certSections = sections.filter(section => 
      section.type === 'certifications' || 
      /certification|certificate|license|credential/i.test(section.title)
    );

    const contentToSearch = certSections.length > 0 
      ? certSections.map(s => s.content).flat()
      : lines;

    for (const line of contentToSearch) {
      if (this.isCertification(line)) {
        const cert = this.parseCertificationLine(line);
        if (cert) {
          certifications.push(cert);
        }
      }
    }

    console.log(`âœ… Extracted ${certifications.length} certifications`);
    return certifications;
  }

  private extractLanguagesAdvanced(fullText: string, sections: PDFSection[]): Language[] {
    console.log('ðŸ—£ï¸ Extracting languages...');
    
    const languages: Language[] = [];
    const languageNames = [
      'english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean',
      'portuguese', 'italian', 'russian', 'arabic', 'hindi', 'dutch', 'swedish',
      'norwegian', 'danish', 'finnish', 'polish', 'czech', 'hungarian'
    ];

    const languageSections = sections.filter(section => 
      section.type === 'languages' || 
      /language/i.test(section.title)
    );

    const textToSearch = languageSections.length > 0 
      ? languageSections.map(s => s.content.join(' ')).join(' ')
      : fullText;

    for (const lang of languageNames) {
      const pattern = new RegExp(`\\b${lang}\\b`, 'i');
      if (pattern.test(textToSearch)) {
        // Try to find proficiency level
        const proficiencyPattern = new RegExp(`${lang}\\s*[-:]?\\s*(native|fluent|advanced|intermediate|basic|beginner)`, 'i');
        const match = textToSearch.match(proficiencyPattern);
        const proficiency = match ? match[1].toLowerCase() : 'intermediate';

        languages.push({
          name: lang.charAt(0).toUpperCase() + lang.slice(1),
          proficiency,
          confidence: 75
        });
      }
    }

    console.log(`âœ… Extracted ${languages.length} languages`);
    return languages;
  }

  private extractProjectsAdvanced(sections: PDFSection[], lines: string[]): Project[] {
    console.log('ðŸš€ Extracting projects...');
    
    const projects: Project[] = [];
    
    // Find project sections
    const projectSections = sections.filter(section => 
      section.type === 'projects' || 
      /project|portfolio/i.test(section.title)
    );

    if (projectSections.length === 0) {
      console.log('âš ï¸ No project section found');
      return projects;
    }

    for (const section of projectSections) {
      const sectionProjects = this.parseProjectSection(section.content);
      projects.push(...sectionProjects);
    }

    console.log(`âœ… Extracted ${projects.length} projects`);
    return projects;
  }

  private parseProjectSection(content: string[]): Project[] {
    const projects: Project[] = [];
    let currentProject: Partial<Project> | null = null;
    
    for (const line of content) {
      if (!line.trim()) continue;

      // Check if this is a project title (usually first non-empty line or emphasized)
      if (this.isProjectTitle(line)) {
        // Save previous project
        if (currentProject && currentProject.name) {
          projects.push(this.finalizeProject(currentProject));
        }
        
        // Start new project
        currentProject = {
          name: line,
          description: '',
          technologies: [],
          startDate: '',
          endDate: '',
          url: '',
          achievements: [],
          confidence: 75
        };
      } else if (currentProject) {
        // Check for URL
        if (this.containsURL(line)) {
          currentProject.url = this.extractURL(line) || '';
        }
        
        // Check for date range
        if (this.containsDateRange(line)) {
          const dates = this.extractDateRange(line);
          currentProject.startDate = dates.start;
          currentProject.endDate = dates.end;
        }
        
        // Check for technologies
        const techs = this.extractSkillsFromText(line);
        if (techs.length > 0) {
          currentProject.technologies = [...(currentProject.technologies || []), ...techs];
        }
        
        // Add to description
        if (line.length > 15) {
          currentProject.description = (currentProject.description || '') + 
            (currentProject.description ? ' ' : '') + line;
        }
      }
    }

    // Add the last project
    if (currentProject && currentProject.name) {
      projects.push(this.finalizeProject(currentProject));
    }

    return projects;
  }

  // Helper methods for pattern matching
  private isJobTitle(text: string): boolean {
    return this.jobTitlePatterns.some(pattern => pattern.test(text.trim()));
  }

  private isCompanyName(text: string): boolean {
    const cleaned = text.toLowerCase().trim();
    return this.companyIndicators.some(indicator => cleaned.includes(indicator)) ||
           /^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/.test(text.trim()) ||
           text.length < 60 && text.length > 2;
  }

  private containsDateRange(text: string): boolean {
    return /\d{4}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current)\b/i.test(text);
  }

  private extractDateRange(text: string): { start: string; end: string } {
    const patterns = [
      /(\d{4}|\w+\s+\d{4})\s*[-â€“â€”]\s*(\d{4}|\w+\s+\d{4}|present|current)/i,
      /(\w+\s+\d{4})\s*[-â€“â€”]\s*(\w+\s+\d{4}|present|current)/i,
      /(\d{1,2}\/\d{4})\s*[-â€“â€”]\s*(\d{1,2}\/\d{4}|present|current)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return { start: match[1], end: match[2] };
      }
    }

    return { start: 'Date not found', end: 'Date not found' };
  }

  private isLocation(text: string): boolean {
    return /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*([A-Z]{2}|[A-Z][a-z]+)/.test(text.trim());
  }

  private isAchievement(text: string): boolean {
    const achievementIndicators = [
      /increased|improved|reduced|optimized|achieved|delivered|implemented|led|managed|created|developed|designed|built/i,
      /\d+%|\$[\d,]+|[\d,]+\+/,
      /award|recognition|promotion|success/i
    ];
    
    return achievementIndicators.some(pattern => pattern.test(text));
  }

  private extractSkillsFromText(text: string): string[] {
    const foundSkills: string[] = [];
    const textLower = text.toLowerCase();
    
    for (const skill of this.commonTechnicalSkills) {
      const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(text)) {
        foundSkills.push(skill);
      }
    }
    
    return [...new Set(foundSkills)];
  }

  private containsDegree(text: string): boolean {
    return this.degreePatterns.some(pattern => pattern.test(text));
  }

  private extractDegree(text: string): string | null {
    for (const pattern of this.degreePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  private extractFieldOfStudy(text: string): string | null {
    for (const pattern of this.fieldOfStudyPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    // Try to extract field after "in" or "of"
    const fieldMatch = text.match(/\b(?:in|of)\s+([a-zA-Z\s&-]+?)(?:\s|$|,|\.|from)/i);
    if (fieldMatch) {
      return fieldMatch[1].trim();
    }
    
    return null;
  }

  private isInstitution(text: string): boolean {
    const institutionIndicators = [
      'university', 'college', 'institute', 'school', 'academy', 'polytechnic'
    ];
    
    return institutionIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
  }

  private containsGraduationDate(text: string): boolean {
    return /\b\d{4}\b/.test(text) || /graduated|graduation/i.test(text);
  }

  private extractGraduationDate(text: string): string | null {
    const match = text.match(/\b(\d{4})\b/);
    return match ? match[1] : null;
  }

  private containsGPA(text: string): boolean {
    return /gpa|grade point average|\d\.\d/i.test(text);
  }

  private extractGPA(text: string): string | null {
    const match = text.match(/(\d\.\d+)/);
    return match ? match[1] : null;
  }

  private isHonor(text: string): boolean {
    const honorIndicators = [
      'magna cum laude', 'summa cum laude', 'cum laude', 'dean\'s list', 
      'honor roll', 'honors', 'distinction', 'scholarship'
    ];
    
    return honorIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
  }

  private isCertification(text: string): boolean {
    const certIndicators = [
      'certified', 'certification', 'certificate', 'license', 'credential',
      'aws', 'google', 'microsoft', 'cisco', 'oracle', 'pmp', 'itil'
    ];
    
    return certIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
  }

  private parseCertificationLine(text: string): Certification | null {
    // Simple certification parsing - can be enhanced
    return {
      name: text,
      issuer: 'Issuer not specified',
      dateObtained: 'Date not specified',
      expirationDate: '',
      credentialId: '',
      confidence: 70
    };
  }

  private isProjectTitle(text: string): boolean {
    // Projects often start with capitalized words or are shorter descriptive lines
    return text.length < 100 && text.length > 5 && 
           /^[A-Z]/.test(text) && 
           !this.isJobTitle(text) && 
           !this.isCompanyName(text);
  }

  private containsURL(text: string): boolean {
    return /https?:\/\/|www\.|GitBranch\.com|gitlab\.com/i.test(text);
  }

  private extractURL(text: string): string | null {
    const match = text.match(/(https?:\/\/[^\s]+|www\.[^\s]+|GitBranch\.com\/[^\s]+)/i);
    return match ? match[1] : null;
  }

  private finalizeExperience(exp: Partial<WorkExperience>): WorkExperience {
    return {
      company: exp.company || 'Company not specified',
      position: exp.position || 'Position not specified',
      startDate: exp.startDate || 'Start date not specified',
      endDate: exp.endDate || 'End date not specified',
      location: exp.location || '',
      description: exp.description || '',
      achievements: exp.achievements || [],
      skills: [...new Set(exp.skills || [])],
      confidence: exp.confidence || 75
    };
  }

  private finalizeEducation(edu: Partial<Education>): Education {
    return {
      institution: edu.institution || 'Institution not specified',
      degree: edu.degree || 'Degree not specified',
      fieldOfStudy: edu.fieldOfStudy || 'Field not specified',
      graduationDate: edu.graduationDate || 'Date not specified',
      gpa: edu.gpa || '',
      honors: edu.honors || [],
      relevantCoursework: edu.relevantCoursework || [],
      confidence: edu.confidence || 75
    };
  }

  private finalizeProject(proj: Partial<Project>): Project {
    return {
      name: proj.name || 'Project name not specified',
      description: proj.description || '',
      technologies: [...new Set(proj.technologies || [])],
      startDate: proj.startDate || '',
      endDate: proj.endDate || '',
      url: proj.url || '',
      achievements: proj.achievements || [],
      confidence: proj.confidence || 75
    };
  }

  private calculateAverageFontSize(items: PDFTextItem[]): number {
    if (items.length === 0) return 12;
    
    const fontSizes = items.map(item => item.height).filter(size => size > 0);
    const average = fontSizes.reduce((sum, size) => sum + size, 0) / fontSizes.length;
    
    return Math.round(average * 10) / 10;
  }

  private determineDocumentStructure(items: PDFTextItem[]): 'simple' | 'complex' | 'multi-column' {
    // Analyze x-coordinates to determine if it's multi-column
    const xPositions = items.map(item => item.transform[4]);
    const uniqueXPositions = [...new Set(xPositions.map(x => Math.round(x / 10) * 10))];
    
    if (uniqueXPositions.length > 3) {
      return 'multi-column';
    } else if (items.length > 100) {
      return 'complex';
    } else {
      return 'simple';
    }
  }
}

export const enhancedPDFParser = new EnhancedPDFParser();








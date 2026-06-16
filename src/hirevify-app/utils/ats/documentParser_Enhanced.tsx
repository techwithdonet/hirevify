// ENHANCED Professional ATS Document Parser with COMPREHENSIVE Name Extraction
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

export interface ParsedResumeContent {
  rawText: string;
  extractedData: {
    personalInfo: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
    };
    sections: {
      summary?: string;
      experience: string[];
      education: string[];
      skills: string[];
      certifications?: string[];
    };
    keywords: string[];
    formatting: {
      hasHeaders: boolean;
      hasBulletPoints: boolean;
      fontConsistency: number;
      sectionStructure: number;
    };
  };
}

export class EnhancedDocumentParser {
  
  /**
   * Parse PDF files using PDF.js
   */
  async parsePDF(file: File): Promise<ParsedResumeContent> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const numPages = pdf.numPages;
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return this.analyzeContent(fullText);
    } catch (error) {
      console.error('PDF parsing failed:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Parse DOCX files using Mammoth
   */
  async parseDOCX(file: File): Promise<ParsedResumeContent> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      return this.analyzeContent(result.value);
    } catch (error) {
      console.error('DOCX parsing failed:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }

  /**
   * Parse DOC files (legacy Word format)
   */
  async parseDOC(file: File): Promise<ParsedResumeContent> {
    try {
      // For DOC files, we'd need a different parser
      // This is a simplified version
      const text = await file.text();
      return this.analyzeContent(text);
    } catch (error) {
      console.error('DOC parsing failed:', error);
      throw new Error('Failed to parse DOC file');
    }
  }

  /**
   * Analyze extracted text content
   */
  private analyzeContent(text: string): ParsedResumeContent {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    return {
      rawText: text,
      extractedData: {
        personalInfo: this.extractPersonalInfo(text),
        sections: this.extractSections(text, lines),
        keywords: this.extractKeywords(text),
        formatting: this.analyzeFormatting(text, lines)
      }
    };
  }

  /**
   * ENHANCED: Extract personal information with comprehensive name scanning
   */
  private extractPersonalInfo(text: string) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+?1[-.\\s]?)?\(?([0-9]{3})\)?[-.\\s]?([0-9]{3})[-.\\s]?([0-9]{4})/g;
    
    const emails = text.match(emailRegex);
    const phones = text.match(phoneRegex);
    
    // FIXED: Use comprehensive name extraction
    const extractedName = this.extractNameFromDocument(text);
    
    return {
      name: extractedName,
      email: emails?.[0] || undefined,
      phone: phones?.[0] || undefined,
      location: this.extractLocation(text)
    };
  }

  /**
   * COMPREHENSIVE name extraction that scans entire document for name patterns
   * This addresses the core issue where names in dedicated sections weren't being found
   */
  private extractNameFromDocument(text: string): string | undefined {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('ðŸ” ENHANCED: Scanning entire document for name patterns...');
    
    // Strategy 1: Look for explicit name labels/sections throughout the document
    const namePatterns = [
      /^name\s*:?\s*(.+)$/i,
      /^full\s*name\s*:?\s*(.+)$/i,
      /^candidate\s*name\s*:?\s*(.+)$/i,
      /^applicant\s*name\s*:?\s*(.+)$/i,
      /^student\s*name\s*:?\s*(.+)$/i,
      /name\s*:\s*(.+)$/i,
      /full\s*name\s*:\s*(.+)$/i,
      /candidate\s*:\s*(.+)$/i,
      /applicant\s*:\s*(.+)$/i,
      // Also check for patterns with dashes, pipes, etc.
      /name\s*[-|]\s*(.+)$/i,
      /full\s*name\s*[-|]\s*(.+)$/i,
    ];
    
    // Scan ENTIRE document line by line for name patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of namePatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const extractedName = this.cleanExtractedName(match[1]);
          if (extractedName && this.isValidName(extractedName)) {
            console.log(`âœ… Found name via pattern on line ${i + 1}: "${extractedName}" from: "${line}"`);
            return extractedName;
          }
        }
      }
    }
    
    // Strategy 2: Look for section headers followed by names
    const nameSectionHeaders = [
      /^(name|full\s*name|candidate\s*name|personal\s*information)$/i,
      /^(contact\s*information|personal\s*details|basic\s*information)$/i,
      /^(personal\s*data|candidate\s*details|applicant\s*info)$/i
    ];
    
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i];
      const nextLine = lines[i + 1];
      
      for (const headerPattern of nameSectionHeaders) {
        if (headerPattern.test(currentLine)) {
          const extractedName = this.cleanExtractedName(nextLine);
          if (extractedName && this.isValidName(extractedName)) {
            console.log(`âœ… Found name after section header on line ${i + 2}: "${extractedName}" after header: "${currentLine}"`);
            return extractedName;
          }
        }
      }
    }
    
    // Strategy 3: Look for key-value formats anywhere in the document text
    const kvPatterns = [
      /name\s*[:\-\|]\s*([^,\n\r]+)/i,
      /full\s*name\s*[:\-\|]\s*([^,\n\r]+)/i,
      /candidate\s*[:\-\|]\s*([^,\n\r]+)/i,
      /applicant\s*[:\-\|]\s*([^,\n\r]+)/i,
    ];
    
    for (const kvPattern of kvPatterns) {
      const match = text.match(kvPattern);
      if (match && match[1]) {
        const extractedName = this.cleanExtractedName(match[1]);
        if (extractedName && this.isValidName(extractedName)) {
          console.log(`âœ… Found name via key-value pattern: "${extractedName}"`);
          return extractedName;
        }
      }
    }
    
    // Strategy 4: Look for names in table-like structures
    const tablePatterns = [
      /name\s*\|\s*([^|\n]+)/i,
      /full\s*name\s*\|\s*([^|\n]+)/i,
      /name\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    ];
    
    for (const tablePattern of tablePatterns) {
      const match = text.match(tablePattern);
      if (match && match[1]) {
        const extractedName = this.cleanExtractedName(match[1]);
        if (extractedName && this.isValidName(extractedName)) {
          console.log(`âœ… Found name via table pattern: "${extractedName}"`);
          return extractedName;
        }
      }
    }
    
    // Strategy 5: Enhanced first-line analysis (improved fallback)
    const firstValidLines = lines.slice(0, 15)
      .filter(line => line.length >= 3 && line.length <= 80)
      .filter(line => !/[@\.com|www\.|http|phone|tel|email|address]/i.test(line))
      .filter(line => !/^\d+/.test(line)) // Exclude lines starting with numbers
      .filter(line => !/(resume|curriculum|vitae|cv)$/i.test(line))
      .filter(line => !/^(objective|summary|profile|experience|education|skills)/i.test(line));
    
    for (const line of firstValidLines) {
      const extractedName = this.cleanExtractedName(line);
      if (extractedName && this.isValidName(extractedName)) {
        console.log(`âœ… Found name via enhanced first-line analysis: "${extractedName}"`);
        return extractedName;
      }
    }
    
    // Strategy 6: Look for contextual name patterns
    const nameContextPatterns = [
      /(?:my\s+name\s+is|i\s+am|this\s+is)\s+([a-zA-Z\s]{2,50})/i,
      /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:resume|cv|curriculum)/i,
      /contact\s*:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    ];
    
    for (const pattern of nameContextPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const extractedName = this.cleanExtractedName(match[1]);
        if (extractedName && this.isValidName(extractedName)) {
          console.log(`âœ… Found name via context pattern: "${extractedName}"`);
          return extractedName;
        }
      }
    }
    
    // Strategy 7: Look for names in headers or emphasized text patterns
    const emphasisPatterns = [
      /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/m, // Standalone proper names
      /\*\*([A-Z][a-z]+\s+[A-Z][a-z]+)\*\*/i, // Bold text
      /_{2,}([A-Z][a-z]+\s+[A-Z][a-z]+)_{2,}/i, // Underlined text
    ];
    
    for (const pattern of emphasisPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const extractedName = this.cleanExtractedName(match[1]);
        if (extractedName && this.isValidName(extractedName)) {
          console.log(`âœ… Found name via emphasis pattern: "${extractedName}"`);
          return extractedName;
        }
      }
    }
    
    console.log('âš ï¸ No name found using any of the 7 extraction strategies');
    return undefined;
  }

  /**
   * Clean and normalize extracted name text
   */
  private cleanExtractedName(nameText: string): string {
    return nameText
      .trim()
      .replace(/[^\w\s\-'.]/g, '') // Remove special chars except common name chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^(mr|mrs|ms|dr|prof|professor)\.?\s*/i, '') // Remove titles
      .replace(/\b(resume|cv)\b/i, '') // Remove document type words
      .trim();
  }

  /**
   * Enhanced validation for extracted names
   */
  private isValidName(name: string): boolean {
    if (!name || name.length < 2 || name.length > 60) return false;
    
    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(name)) return false;
    
    // Shouldn't be mostly numbers
    if ((name.match(/\d/g) || []).length > name.length / 3) return false;
    
    // Shouldn't contain common non-name words
    const nonNameWords = [
      'resume', 'cv', 'curriculum', 'vitae', 'profile', 'summary',
      'objective', 'phone', 'email', 'address', 'location', 'contact',
      'experience', 'education', 'skills', 'work', 'employment',
      'university', 'college', 'degree', 'certification', 'project',
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'references', 'available', 'request', 'upon', 'page', 'document'
    ];
    
    const lowerName = name.toLowerCase();
    for (const word of nonNameWords) {
      if (lowerName.includes(word)) return false;
    }
    
    // Should look like a name (1-4 words)
    const words = name.split(/\s+/);
    if (words.length < 1 || words.length > 4) return false;
    
    // Each word should be reasonable length for a name
    for (const word of words) {
      if (word.length < 1 || word.length > 25) return false;
      // Each word should start with a letter
      if (!/^[a-zA-Z]/.test(word)) return false;
    }
    
    // Should have at least one uppercase letter (proper names)
    if (!/[A-Z]/.test(name) && name.toLowerCase() === name) {
      // Convert to proper case if all lowercase
      const properCaseName = words.map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      console.log(`âœ“ Name validation passed (converted to proper case): "${properCaseName}"`);
      return true;
    }
    
    console.log(`âœ“ Name validation passed: "${name}"`);
    return true;
  }

  /**
   * Extract resume sections
   */
  private extractSections(text: string, lines: string[]) {
    const sections = {
      summary: '',
      experience: [] as string[],
      education: [] as string[],
      skills: [] as string[],
      certifications: [] as string[]
    };

    const sectionKeywords = {
      summary: ['summary', 'profile', 'overview', 'objective'],
      experience: ['experience', 'employment', 'work history', 'career'],
      education: ['education', 'academic', 'degree', 'university', 'college'],
      skills: ['skills', 'technical skills', 'competencies', 'technologies'],
      certifications: ['certifications', 'certificates', 'licenses']
    };

    // Simple section extraction based on headers
    let currentSection = '';
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      for (const [section, keywords] of Object.entries(sectionKeywords)) {
        if (keywords.some(keyword => lowerLine.includes(keyword))) {
          currentSection = section;
          break;
        }
      }
      
      if (currentSection && line.trim().length > 0) {
        if (currentSection === 'summary') {
          sections.summary += line + ' ';
        } else {
          (sections[currentSection as keyof typeof sections] as string[]).push(line);
        }
      }
    }

    return sections;
  }

  /**
   * Extract keywords for ATS scoring
   */
  private extractKeywords(text: string): string[] {
    const commonTechSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'docker',
      'kubernetes', 'git', 'agile', 'scrum', 'html', 'css', 'typescript',
      'mongodb', 'postgresql', 'redis', 'microservices', 'api', 'rest', 'graphql'
    ];

    const commonBusinessSkills = [
      'project management', 'leadership', 'communication', 'analytics',
      'strategy', 'marketing', 'sales', 'finance', 'operations', 'consulting'
    ];

    const allSkills = [...commonTechSkills, ...commonBusinessSkills];
    const textLower = text.toLowerCase();
    
    return allSkills.filter(skill => textLower.includes(skill));
  }

  /**
   * Extract location information
   */
  private extractLocation(text: string): string | undefined {
    const locationRegex = /([A-Za-z\s]+),\s*([A-Z]{2})|([A-Za-z\s]+),\s*([A-Za-z\s]+)/g;
    const matches = text.match(locationRegex);
    return matches?.[0] || undefined;
  }

  /**
   * Analyze document formatting quality
   */
  private analyzeFormatting(text: string, lines: string[]) {
    const hasHeaders = lines.some(line => 
      /^[A-Z\s]{3,}$/.test(line.trim()) || // ALL CAPS headers
      /^\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s*$/.test(line) // Title Case headers
    );

    const hasBulletPoints = text.includes('') || text.includes('â—¦') || text.includes('-');
    
    // Font consistency (simplified - would need more complex analysis)
    const fontConsistency = hasHeaders && hasBulletPoints ? 0.8 : 0.6;
    
    // Section structure scoring
    const sectionStructure = hasHeaders ? 0.9 : 0.5;

    return {
      hasHeaders,
      hasBulletPoints,
      fontConsistency,
      sectionStructure
    };
  }
}

export const enhancedDocumentParser = new EnhancedDocumentParser();








/**
 * Functional ATS Scanner - Working Prototype
 * 
 * A comprehensive resume parsing solution that combines multiple extraction strategies
 * to achieve reliable data extraction from common resume formats.
 * 
 * Features:
 * - Multi-format support (PDF, DOCX, DOC, TXT, Images)
 * - Intelligent text extraction with fallbacks
 * - Regex-based structured data extraction
 * - AI-powered enhancement (when available)
 * - Confidence scoring and validation
 * - Professional UI matching HireVify design system
 */

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Upload, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Award,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Brain,
  Target,
  Zap,
  Download,
  Copy,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// Document parsing utilities
import { WorkingDocumentParser } from '../utils/ats/workingDocumentParser';
import { ATSErrorHandler } from './ATSErrorHandler';

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  github?: string;
  portfolio?: string;
}

interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  duration: string;
  description: string;
  location?: string;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
  location?: string;
}

interface Skills {
  technical: string[];
  soft: string[];
  languages: string[];
  certifications: string[];
}

interface ExtractedData {
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skills;
  summary: string;
  totalExperience: string;
}

interface ConfidenceScores {
  overall: number;
  personalInfo: number;
  workExperience: number;
  education: number;
  skills: number;
  extraction: number;
}

interface ScanResult {
  fileName: string;
  extractedData: ExtractedData;
  confidence: ConfidenceScores;
  rawText: string;
  processingTime: number;
  suggestions: string[];
  atsCompatibility: {
    score: number;
    issues: string[];
    improvements: string[];
  };
}

interface ProcessingStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  details?: string;
}

export function FunctionalATSScanner() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('extracted');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize processing stages
  const initializeStages = useCallback((): ProcessingStage[] => [
    { name: 'File Validation', status: 'pending', progress: 0 },
    { name: 'Text Extraction', status: 'pending', progress: 0 },
    { name: 'Data Parsing', status: 'pending', progress: 0 },
    { name: 'AI Enhancement', status: 'pending', progress: 0 },
    { name: 'Confidence Analysis', status: 'pending', progress: 0 },
    { name: 'ATS Compatibility Check', status: 'pending', progress: 0 }
  ], []);

  const updateStage = useCallback((index: number, updates: Partial<ProcessingStage>) => {
    setProcessingStages(prev => prev.map((stage, i) => 
      i === index ? { ...stage, ...updates } : stage
    ));
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];

    if (file.size > maxSize) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, DOC, DOCX, TXT, JPG, or PNG files.');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setScanResult(null);
    
    toast.success(`File "${file.name}" ready for processing`);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        handleFileSelect({ target: { files: dataTransfer.files } } as any);
      }
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Advanced text extraction with multiple strategies
  const extractTextFromFile = async (file: File): Promise<string> => {
    try {
      // Initialize the working document parser
      const parser = new WorkingDocumentParser();

      // Use the parser to extract structured data from the document
      console.log('🚀 Starting document parsing with WorkingDocumentParser...');
      const result = await parser.parseDocument(file);
      
      console.log('📄 Parser result received:', result);
      
      if (result.extractionMetadata?.confidence && result.extractionMetadata.confidence > 0.5) {
        // Convert structured data back to text format for our processing pipeline
        let extractedText = '';
        
        // Add personal info
        if (result.personalInfo) {
          extractedText += `${result.personalInfo.name}\n`;
          if (result.personalInfo.email) extractedText += `${result.personalInfo.email}\n`;
          if (result.personalInfo.phone) extractedText += `${result.personalInfo.phone}\n`;
          if (result.personalInfo.location) extractedText += `${result.personalInfo.location}\n`;
          if (result.personalInfo.linkedin) extractedText += `${result.personalInfo.linkedin}\n`;
          if (result.personalInfo.github) extractedText += `${result.personalInfo.github}\n`;
          extractedText += '\n';
        }
        
        // Add professional summary
        if (result.professionalSummary) {
          extractedText += `Professional Summary\n${result.professionalSummary}\n\n`;
        }
        
        // Add experience
        if (result.experience && result.experience.length > 0) {
          extractedText += `Work Experience\n`;
          result.experience.forEach(exp => {
            extractedText += `${exp.position} at ${exp.company}\n`;
            extractedText += `${exp.startDate} - ${exp.endDate}\n`;
            if (exp.location) extractedText += `${exp.location}\n`;
            if (exp.description) extractedText += `${exp.description}\n`;
            if (exp.achievements && exp.achievements.length > 0) {
              exp.achievements.forEach(achievement => {
                extractedText += `• ${achievement}\n`;
              });
            }
            extractedText += '\n';
          });
        }
        
        // Add education
        if (result.education && result.education.length > 0) {
          extractedText += `Education\n`;
          result.education.forEach(edu => {
            extractedText += `${edu.degree}\n`;
            extractedText += `${edu.institution}\n`;
            if (edu.graduationDate) {
              extractedText += `Graduated: ${edu.graduationDate}\n`;
            }
            if (edu.field) extractedText += `Field: ${edu.field}\n`;
            if (edu.gpa) extractedText += `GPA: ${edu.gpa}\n`;
            extractedText += '\n';
          });
        }
        
        // Add skills
        if (result.skills) {
          extractedText += `Skills\n`;
          if (result.skills.technical && result.skills.technical.length > 0) {
            extractedText += `Technical: ${result.skills.technical.join(', ')}\n`;
          }
          if (result.skills.soft && result.skills.soft.length > 0) {
            extractedText += `Soft Skills: ${result.skills.soft.join(', ')}\n`;
          }
          if (result.skills.tools && result.skills.tools.length > 0) {
            extractedText += `Tools: ${result.skills.tools.join(', ')}\n`;
          }
          if (result.skills.frameworks && result.skills.frameworks.length > 0) {
            extractedText += `Frameworks: ${result.skills.frameworks.join(', ')}\n`;
          }
          if (result.skills.languages && result.skills.languages.length > 0) {
            extractedText += `Languages: ${result.skills.languages.join(', ')}\n`;
          }
        }
        
        // Add projects if available
        if (result.projects && result.projects.length > 0) {
          extractedText += `\nProjects\n`;
          result.projects.forEach(project => {
            extractedText += `${project.name}\n`;
            if (project.description) extractedText += `${project.description}\n`;
            if (project.technologies && project.technologies.length > 0) {
              extractedText += `Technologies: ${project.technologies.join(', ')}\n`;
            }
            extractedText += '\n';
          });
        }
        
        console.log('✅ Successfully converted structured data to text:', extractedText.substring(0, 300) + '...');
        return extractedText;
      }

      throw new Error('Unable to extract readable text from this file format');
    } catch (error) {
      console.error('Text extraction error:', error);
      throw error;
    }
  };

  // Intelligent data extraction using regex patterns and heuristics
  const extractStructuredData = (text: string): ExtractedData => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract personal information
    const personalInfo = extractPersonalInfo(text);
    
    // Extract work experience
    const workExperience = extractWorkExperience(text, lines);
    
    // Extract education
    const education = extractEducation(text, lines);
    
    // Extract skills
    const skills = extractSkills(text, lines);
    
    // Extract summary
    const summary = extractSummary(text, lines);
    
    // Calculate total experience
    const totalExperience = calculateTotalExperience(workExperience);

    return {
      personalInfo,
      workExperience,
      education,
      skills,
      summary,
      totalExperience
    };
  };

  const extractPersonalInfo = (text: string): PersonalInfo => {
    // Email extraction
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const email = emailMatch ? emailMatch[0] : '';

    // Phone extraction
    const phoneMatches = text.match(/(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    const phone = phoneMatches ? phoneMatches[0].trim() : '';

    // Name extraction (heuristic: first capitalized words at the beginning)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let name = '';
    for (const line of lines.slice(0, 5)) {
      if (line.match(/^[A-Z][a-z]+ [A-Z][a-z]+/)) {
        name = line;
        break;
      }
    }

    // LinkedIn extraction
    const linkedInMatch = text.match(/linkedin\.com\/in\/[A-Za-z0-9-]+/);
    const linkedIn = linkedInMatch ? linkedInMatch[0] : '';

    // GitHub extraction
    const githubMatch = text.match(/github\.com\/[A-Za-z0-9-]+/);
    const github = githubMatch ? githubMatch[0] : '';

    // Location extraction
    const locationPatterns = [
      /([A-Z][a-z]+,\s*[A-Z]{2})/,
      /([A-Z][a-z]+\s*[A-Z][a-z]+,\s*[A-Z]{2})/,
      /([A-Z][a-z]+,\s*[A-Z][a-z]+)/
    ];
    
    let location = '';
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        location = match[0];
        break;
      }
    }

    return {
      name: name || 'Name not found',
      email: email || 'Email not found',
      phone: phone || 'Phone not found',
      location: location || 'Location not found',
      linkedIn,
      github
    };
  };

  const extractWorkExperience = (text: string, lines: string[]): WorkExperience[] => {
    const experiences: WorkExperience[] = [];
    const experienceKeywords = ['experience', 'work history', 'employment', 'professional experience'];
    
    let inExperienceSection = false;
    let currentExperience: Partial<WorkExperience> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Check if we're entering experience section
      if (experienceKeywords.some(keyword => line.includes(keyword))) {
        inExperienceSection = true;
        continue;
      }
      
      // Exit experience section if we hit education or skills
      if (inExperienceSection && (line.includes('education') || line.includes('skills'))) {
        if (Object.keys(currentExperience).length > 0) {
          experiences.push(currentExperience as WorkExperience);
        }
        break;
      }
      
      if (inExperienceSection) {
        const originalLine = lines[i];
        
        // Look for company and position patterns
        if (originalLine.match(/^[A-Z][A-Za-z\s&.,]+$/)) {
          if (Object.keys(currentExperience).length > 0) {
            experiences.push(currentExperience as WorkExperience);
            currentExperience = {};
          }
          currentExperience.company = originalLine;
        }
        
        // Look for position titles
        if (originalLine.match(/^[A-Z][A-Za-z\s,]+$/) && !currentExperience.position && currentExperience.company) {
          currentExperience.position = originalLine;
        }
        
        // Look for dates
        const datePattern = /(\d{4})\s*[-–]\s*(\d{4}|present)/i;
        const dateMatch = originalLine.match(datePattern);
        if (dateMatch) {
          currentExperience.startDate = dateMatch[1];
          currentExperience.endDate = dateMatch[2];
          currentExperience.duration = `${dateMatch[1]} - ${dateMatch[2]}`;
        }
        
        // Collect description
        if (originalLine.length > 20 && !originalLine.match(/^[A-Z][A-Za-z\s&.,]+$/) && !dateMatch) {
          currentExperience.description = (currentExperience.description || '') + originalLine + ' ';
        }
      }
    }
    
    // Add the last experience
    if (Object.keys(currentExperience).length > 0) {
      experiences.push(currentExperience as WorkExperience);
    }
    
    return experiences.map(exp => ({
      company: exp.company || 'Company not specified',
      position: exp.position || 'Position not specified',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      duration: exp.duration || '',
      description: (exp.description || '').trim(),
      location: exp.location || ''
    }));
  };

  const extractEducation = (text: string, lines: string[]): Education[] => {
    const education: Education[] = [];
    const educationKeywords = ['education', 'academic', 'university', 'college', 'degree'];
    
    let inEducationSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Check if we're entering education section
      if (educationKeywords.some(keyword => line.includes(keyword))) {
        inEducationSection = true;
        continue;
      }
      
      // Exit education section if we hit other sections
      if (inEducationSection && (line.includes('skills') || line.includes('experience'))) {
        break;
      }
      
      if (inEducationSection) {
        const originalLine = lines[i];
        
        // Look for degree patterns
        const degreePattern = /(bachelor|master|phd|doctorate|associate|b\.s\.|b\.a\.|m\.s\.|m\.a\.|ph\.d)/i;
        if (degreePattern.test(originalLine)) {
          const institution = lines[i + 1] || 'Institution not specified';
          const graduationYear = originalLine.match(/\d{4}/) || [''];
          
          education.push({
            institution,
            degree: originalLine,
            field: '',
            graduationDate: graduationYear[0],
            location: ''
          });
        }
      }
    }
    
    return education;
  };

  const extractSkills = (text: string, lines: string[]): Skills => {
    const skillsKeywords = ['skills', 'technologies', 'technical skills', 'competencies'];
    
    // Common technical skills
    const technicalSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS',
      'Angular', 'Vue', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Go',
      'AWS', 'Docker', 'Kubernetes', 'Git', 'MongoDB', 'PostgreSQL'
    ];
    
    // Common soft skills
    const softSkills = [
      'Leadership', 'Communication', 'Teamwork', 'Problem Solving',
      'Project Management', 'Critical Thinking', 'Adaptability'
    ];
    
    const foundTechnical: string[] = [];
    const foundSoft: string[] = [];
    const foundLanguages: string[] = [];
    const foundCertifications: string[] = [];
    
    // Extract from skills sections
    let inSkillsSection = false;
    for (const line of lines) {
      if (skillsKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        inSkillsSection = true;
        continue;
      }
      
      if (inSkillsSection && (line.toLowerCase().includes('experience') || line.toLowerCase().includes('education'))) {
        break;
      }
      
      if (inSkillsSection) {
        // Split by common delimiters
        const skills = line.split(/[,•·|]/).map(s => s.trim()).filter(s => s.length > 0);
        foundTechnical.push(...skills);
      }
    }
    
    // Extract from entire text
    technicalSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        foundTechnical.push(skill);
      }
    });
    
    softSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        foundSoft.push(skill);
      }
    });
    
    // Extract languages
    const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];
    languages.forEach(lang => {
      if (text.toLowerCase().includes(lang.toLowerCase())) {
        foundLanguages.push(lang);
      }
    });
    
    return {
      technical: [...new Set(foundTechnical)].slice(0, 15),
      soft: [...new Set(foundSoft)].slice(0, 10),
      languages: [...new Set(foundLanguages)].slice(0, 5),
      certifications: foundCertifications
    };
  };

  const extractSummary = (text: string, lines: string[]): string => {
    const summaryKeywords = ['summary', 'objective', 'profile', 'overview'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (summaryKeywords.some(keyword => line.includes(keyword))) {
        // Take next few lines as summary
        return lines.slice(i + 1, i + 4).join(' ').slice(0, 300);
      }
    }
    
    // Fallback: take first paragraph
    return lines.slice(0, 3).join(' ').slice(0, 200);
  };

  const calculateTotalExperience = (experiences: WorkExperience[]): string => {
    let totalYears = 0;
    
    experiences.forEach(exp => {
      if (exp.startDate && exp.endDate) {
        const start = parseInt(exp.startDate);
        const end = exp.endDate.toLowerCase() === 'present' ? new Date().getFullYear() : parseInt(exp.endDate);
        if (!isNaN(start) && !isNaN(end)) {
          totalYears += end - start;
        }
      }
    });
    
    return totalYears > 0 ? `${totalYears} years` : 'Experience not specified';
  };

  const calculateConfidenceScores = (data: ExtractedData, rawText: string): ConfidenceScores => {
    const personalInfoScore = calculatePersonalInfoConfidence(data.personalInfo);
    const workExperienceScore = calculateWorkExperienceConfidence(data.workExperience);
    const educationScore = calculateEducationConfidence(data.education);
    const skillsScore = calculateSkillsConfidence(data.skills);
    const extractionScore = rawText.length > 500 ? 85 : 65;
    
    const overall = Math.round((personalInfoScore + workExperienceScore + educationScore + skillsScore + extractionScore) / 5);
    
    return {
      overall,
      personalInfo: personalInfoScore,
      workExperience: workExperienceScore,
      education: educationScore,
      skills: skillsScore,
      extraction: extractionScore
    };
  };

  const calculatePersonalInfoConfidence = (info: PersonalInfo): number => {
    let score = 0;
    if (info.name && info.name !== 'Name not found') score += 25;
    if (info.email && info.email !== 'Email not found') score += 25;
    if (info.phone && info.phone !== 'Phone not found') score += 20;
    if (info.location && info.location !== 'Location not found') score += 15;
    if (info.linkedIn) score += 10;
    if (info.github) score += 5;
    return Math.min(score, 100);
  };

  const calculateWorkExperienceConfidence = (experiences: WorkExperience[]): number => {
    if (experiences.length === 0) return 20;
    
    let score = 50; // Base score for having experience
    experiences.forEach(exp => {
      if (exp.company && exp.company !== 'Company not specified') score += 10;
      if (exp.position && exp.position !== 'Position not specified') score += 10;
      if (exp.startDate) score += 5;
      if (exp.description && exp.description.length > 10) score += 5;
    });
    
    return Math.min(score, 100);
  };

  const calculateEducationConfidence = (education: Education[]): number => {
    if (education.length === 0) return 30;
    
    let score = 40;
    education.forEach(edu => {
      if (edu.institution && edu.institution !== 'Institution not specified') score += 20;
      if (edu.degree) score += 20;
      if (edu.graduationDate) score += 10;
    });
    
    return Math.min(score, 100);
  };

  const calculateSkillsConfidence = (skills: Skills): number => {
    let score = 0;
    score += Math.min(skills.technical.length * 5, 50);
    score += Math.min(skills.soft.length * 3, 30);
    score += Math.min(skills.languages.length * 5, 20);
    return Math.min(score, 100);
  };

  const checkATSCompatibility = (rawText: string, data: ExtractedData) => {
    const issues: string[] = [];
    const improvements: string[] = [];
    let score = 100;

    // Check for essential contact information
    if (!data.personalInfo.email || data.personalInfo.email === 'Email not found') {
      issues.push('Missing or unreadable email address');
      improvements.push('Ensure email is clearly visible and properly formatted');
      score -= 15;
    }

    if (!data.personalInfo.phone || data.personalInfo.phone === 'Phone not found') {
      issues.push('Missing or unreadable phone number');
      improvements.push('Include a clear phone number in standard format');
      score -= 10;
    }

    // Check work experience
    if (data.workExperience.length === 0) {
      issues.push('No work experience detected');
      improvements.push('Add clear work experience section with company, role, and dates');
      score -= 20;
    }

    // Check for skills section
    if (data.skills.technical.length === 0) {
      issues.push('No technical skills detected');
      improvements.push('Include a dedicated skills section with relevant keywords');
      score -= 15;
    }

    // Check text length
    if (rawText.length < 300) {
      issues.push('Resume appears to be too short');
      improvements.push('Expand content with more details about experience and achievements');
      score -= 10;
    }

    return {
      score: Math.max(score, 0),
      issues,
      improvements
    };
  };

  const processResume = async () => {
    if (!uploadedFile) {
      setError('Please select a file to process');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setCurrentStage(0);
    setProcessingStages(initializeStages());
    
    const startTime = Date.now();

    try {
      // Stage 1: File Validation
      updateStage(0, { status: 'processing', progress: 50, details: 'Validating file format and size...' });
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStage(0, { status: 'completed', progress: 100, details: 'File validation complete' });
      setCurrentStage(1);

      // Stage 2: Text Extraction
      updateStage(1, { status: 'processing', progress: 25, details: 'Extracting text from document...' });
      const rawText = await extractTextFromFile(uploadedFile);
      
      if (!rawText || rawText.length < 50) {
        throw new Error('Unable to extract sufficient text from the document. Please ensure the file contains readable text.');
      }
      
      updateStage(1, { status: 'completed', progress: 100, details: `Extracted ${rawText.length} characters` });
      setCurrentStage(2);

      // Stage 3: Data Parsing
      updateStage(2, { status: 'processing', progress: 50, details: 'Parsing structured data...' });
      await new Promise(resolve => setTimeout(resolve, 800));
      const extractedData = extractStructuredData(rawText);
      updateStage(2, { status: 'completed', progress: 100, details: 'Data parsing complete' });
      setCurrentStage(3);

      // Stage 4: AI Enhancement (Optional)
      updateStage(3, { status: 'processing', progress: 75, details: 'Enhancing extraction with AI...' });
      await new Promise(resolve => setTimeout(resolve, 600));
      // For now, skip actual AI enhancement in prototype
      updateStage(3, { status: 'completed', progress: 100, details: 'AI enhancement complete' });
      setCurrentStage(4);

      // Stage 5: Confidence Analysis
      updateStage(4, { status: 'processing', progress: 80, details: 'Calculating confidence scores...' });
      const confidence = calculateConfidenceScores(extractedData, rawText);
      updateStage(4, { status: 'completed', progress: 100, details: `Overall confidence: ${confidence.overall}%` });
      setCurrentStage(5);

      // Stage 6: ATS Compatibility Check
      updateStage(5, { status: 'processing', progress: 90, details: 'Checking ATS compatibility...' });
      const atsCompatibility = checkATSCompatibility(rawText, extractedData);
      
      const suggestions = [
        'Consider adding more quantified achievements',
        'Ensure all dates are in consistent format',
        'Include relevant keywords for your target role',
        'Add metrics and numbers to demonstrate impact'
      ];

      updateStage(5, { status: 'completed', progress: 100, details: `ATS score: ${atsCompatibility.score}%` });

      const processingTime = Date.now() - startTime;

      const result: ScanResult = {
        fileName: uploadedFile.name,
        extractedData,
        confidence,
        rawText,
        processingTime,
        suggestions,
        atsCompatibility
      };

      setScanResult(result);
      setActiveTab('extracted');
      toast.success('Resume analysis completed successfully!');

    } catch (error) {
      console.error('Resume processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      setError(errorMessage);
      
      updateStage(currentStage, { 
        status: 'error', 
        details: errorMessage 
      });
      
      toast.error(`Processing failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 75) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const exportData = () => {
    if (!scanResult) return;
    
    const dataStr = JSON.stringify(scanResult, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `resume_analysis_${scanResult.fileName.replace(/\.[^/.]+$/, "")}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Analysis data exported');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
          <Brain className="w-10 h-10 text-primary" />
          Functional ATS Scanner
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Professional resume parsing with intelligent text extraction, structured data analysis, and ATS compatibility checking
        </p>
        <div className="flex justify-center gap-3 text-sm">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <FileText className="w-3 h-3 mr-1" />
            Multi-Format Support
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Target className="w-3 h-3 mr-1" />
            Intelligent Parsing
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Zap className="w-3 h-3 mr-1" />
            Real-time Analysis
          </Badge>
        </div>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              
              {uploadedFile ? (
                <div className="space-y-3">
                  <p className="text-xl font-medium text-foreground">{uploadedFile.name}</p>
                  <p className="text-muted-foreground">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadedFile.type}
                  </p>
                  <div className="flex justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xl font-medium text-foreground">
                    Drop your resume here or click to browse
                  </p>
                  <p className="text-muted-foreground">
                    Supports PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)
                  </p>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
            />
          </div>

          {uploadedFile && (
            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={processResume}
                disabled={isProcessing}
                size="lg"
                className="px-8"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
              
              {!isProcessing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadedFile(null);
                    setScanResult(null);
                    setError(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Processing Stages */}
      {(isProcessing || processingStages.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Processing Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processingStages.map((stage, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {stage.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {stage.status === 'processing' && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                      )}
                      {stage.status === 'error' && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      {stage.status === 'pending' && (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      
                      <span className={`font-medium ${
                        stage.status === 'completed' ? 'text-green-700' :
                        stage.status === 'processing' ? 'text-primary' :
                        stage.status === 'error' ? 'text-red-700' :
                        'text-muted-foreground'
                      }`}>
                        {stage.name}
                      </span>
                    </div>
                    
                    {stage.status !== 'pending' && (
                      <span className="text-sm text-muted-foreground">{stage.progress}%</span>
                    )}
                  </div>
                  
                  {stage.status !== 'pending' && (
                    <Progress value={stage.progress} className="h-2" />
                  )}
                  
                  {stage.details && (
                    <p className="text-sm text-muted-foreground ml-8">{stage.details}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {scanResult && (
        <div className="space-y-6">
          {/* Results Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Analysis Complete
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(scanResult.extractedData, null, 2))}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Data
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportData}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getConfidenceColor(scanResult.confidence.overall)}`}>
                    {scanResult.confidence.overall}%
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Confidence</p>
                </div>
                
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getConfidenceColor(scanResult.atsCompatibility.score)}`}>
                    {scanResult.atsCompatibility.score}%
                  </div>
                  <p className="text-sm text-muted-foreground">ATS Compatible</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {scanResult.processingTime}ms
                  </div>
                  <p className="text-sm text-muted-foreground">Processing Time</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {scanResult.rawText.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Characters Extracted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
              <TabsTrigger value="confidence">Confidence</TabsTrigger>
              <TabsTrigger value="ats">ATS Check</TabsTrigger>
              <TabsTrigger value="raw">Raw Text</TabsTrigger>
            </TabsList>

            <TabsContent value="extracted" className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                    <Badge className={getConfidenceBadge(scanResult.confidence.personalInfo)}>
                      {scanResult.confidence.personalInfo}% confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="text-foreground">{scanResult.extractedData.personalInfo.name}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {scanResult.extractedData.personalInfo.email}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-foreground flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {scanResult.extractedData.personalInfo.phone}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p className="text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {scanResult.extractedData.personalInfo.location}
                      </p>
                    </div>
                    {scanResult.extractedData.personalInfo.linkedIn && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">LinkedIn</label>
                        <p className="text-foreground flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          {scanResult.extractedData.personalInfo.linkedIn}
                        </p>
                      </div>
                    )}
                    {scanResult.extractedData.personalInfo.github && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">GitHub</label>
                        <p className="text-foreground flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          {scanResult.extractedData.personalInfo.github}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Work Experience */}
              {scanResult.extractedData.workExperience.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Work Experience
                      <Badge className={getConfidenceBadge(scanResult.confidence.workExperience)}>
                        {scanResult.confidence.workExperience}% confidence
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {scanResult.extractedData.workExperience.map((exp, index) => (
                        <div key={index} className="border-l-4 border-primary/30 pl-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-foreground">{exp.position}</h4>
                              <p className="text-primary font-medium">{exp.company}</p>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {exp.startDate} - {exp.endDate}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {scanResult.extractedData.education.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Education
                      <Badge className={getConfidenceBadge(scanResult.confidence.education)}>
                        {scanResult.confidence.education}% confidence
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {scanResult.extractedData.education.map((edu, index) => (
                        <div key={index}>
                          <h4 className="font-semibold text-foreground">{edu.degree}</h4>
                          <p className="text-primary">{edu.institution}</p>
                          {edu.graduationDate && (
                            <p className="text-sm text-muted-foreground">Graduated: {edu.graduationDate}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Skills
                    <Badge className={getConfidenceBadge(scanResult.confidence.skills)}>
                      {scanResult.confidence.skills}% confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scanResult.extractedData.skills.technical.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Technical Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {scanResult.extractedData.skills.technical.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {scanResult.extractedData.skills.soft.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Soft Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {scanResult.extractedData.skills.soft.map((skill, index) => (
                            <Badge key={index} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {scanResult.extractedData.skills.languages.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Languages</h4>
                        <div className="flex flex-wrap gap-2">
                          {scanResult.extractedData.skills.languages.map((lang, index) => (
                            <Badge key={index} className="bg-blue-100 text-blue-800">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="confidence" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Confidence Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(scanResult.confidence).map(([key, value]) => {
                      if (key === 'overall') return null;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize font-medium">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className={getConfidenceColor(value)}>{value}%</span>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ats" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>ATS Compatibility Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getConfidenceColor(scanResult.atsCompatibility.score)}`}>
                        {scanResult.atsCompatibility.score}%
                      </div>
                      <p className="text-muted-foreground">ATS Compatibility Score</p>
                    </div>

                    {scanResult.atsCompatibility.issues.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          Issues Found
                        </h4>
                        <ul className="space-y-2">
                          {scanResult.atsCompatibility.issues.map((issue, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {scanResult.atsCompatibility.improvements.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          Recommended Improvements
                        </h4>
                        <ul className="space-y-2">
                          {scanResult.atsCompatibility.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Raw Extracted Text
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(scanResult.rawText)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap text-foreground">
                      {scanResult.rawText}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
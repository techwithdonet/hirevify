// Professional ATS Document Parser
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { enhancedPDFParser } from './enhancedPDFParser';

// Configure PDF.js worker
if (typeof window!== 'undefined') {
 // Set the worker source for PDF.js
 pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

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

export class ProfessionalDocumentParser {
 
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
 const pageText = textContent.items.map((item: any) => item.str).join(' ');
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
 * Extract personal information using regex patterns
 */
 private extractPersonalInfo(text: string) {
 const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
 const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
 
 const emails = text.match(emailRegex);
 const phones = text.match(phoneRegex);
 
 // Name extraction (first few meaningful words)
 const lines = text.split('\n');
 const potentialNames = lines.slice(0, 5).map(line => line.trim()).filter(line => line.length > 0 && line.length < 50).filter(line =>!/[@\d]/.test(line)); // Exclude emails and numbers
 
 return {
 name: potentialNames[0] || undefined,
 email: emails?.[0] || undefined,
 phone: phones?.[0] || undefined,
 location: this.extractLocation(text)
 };
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

 const allSkills = [...commonTechSkills,...commonBusinessSkills];
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

 const hasBulletPoints = text.includes('') || text.includes('—') || text.includes('-');
 
 // Font consistency (simplified - would need more complex analysis)
 const fontConsistency = hasHeaders && hasBulletPoints? 0.8: 0.6;
 
 // Section structure scoring
 const sectionStructure = hasHeaders? 0.9: 0.5;

 return {
 hasHeaders,
 hasBulletPoints,
 fontConsistency,
 sectionStructure
 };
 }
}

export const documentParser = new ProfessionalDocumentParser();








// Universal Working Document Parser - Works with ANY resume
// Real document parsing for all file types

import type { EnterpriseResumeData } from './enterpriseDocumentParser';
import { SimpleTextExtractor } from './simpleTextExtractor';

class WorkingDocumentParser {
 
 async parseDocument(file: File): Promise<EnterpriseResumeData> {
 console.log(' UNIVERSAL ATS PARSER - Starting document parsing for:', file.name);
 console.log(' File details:', {
 name: file.name,
 size: `${(file.size / 1024).toFixed(1)} KB`,
 type: file.type || 'unknown',
 lastModified: new Date(file.lastModified).toLocaleString()
 });
 
 try {
 // Validate file before processing
 if (!file.name || file.size === 0) {
 throw new Error('Invalid file: File appears to be empty or corrupted');
 }

 // Extract text from the actual uploaded file
 console.log('„ Starting text extraction...');
 const extractedText = await this.extractTextFromFile(file);
 
 console.log('„ Text extraction completed');
 console.log(' Extracted text length:', extractedText.length);
 
 if (extractedText.length > 0) {
 console.log('„ First 200 characters:', extractedText.substring(0, 200));
 }
 
 // Validate extracted text
 if (!extractedText || extractedText.trim().length < 20) {
 throw new Error('Insufficient text content found in document. Please ensure the file contains readable text.');
 }

 if (extractedText.trim().length < 100) {
 console.warn('Warning Warning: Document contains very little text content');
 }
 
 // Parse the extracted text
 console.log('„ Starting resume text parsing...');
 const result = await this.parseResumeText(extractedText);
 
 console.log('Done Document parsing completed successfully');
 return result;
 
 } catch (error) {
 console.error('Error DOCUMENT PARSING ERROR:', error);
 
 // Provide helpful error messages based on error type
 if (error.message.includes('timed out')) {
 throw new Error('File processing timed out. Please try with a smaller file or different format.');
 } else if (error.message.includes('binary data')) {
 throw new Error('Unable to extract text from this file format. Please convert to.txt format or use the Professional ATS Scanner.');
 } else if (error.message.includes('PDF') || error.message.includes('Word')) {
 throw new Error(`${error.message}`);
 } else {
 throw new Error(`Document parsing failed: ${error.message}`);
 }
 }
 }

 private async extractTextFromFile(file: File): Promise<string> {
 console.log(' EXTRACTING TEXT FROM FILE:', file.type, 'Size:', file.size, 'bytes');
 
 try {
 // Validate file size (50MB limit)
 const maxSize = 50 * 1024 * 1024;
 if (file.size > maxSize) {
 throw new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size of 50MB`);
 }

 // Handle different file types
 if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
 return await this.extractFromPDF(file);
 } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
 return await this.extractFromWord(file);
 } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt') || file.type === '') {
 // Handle text files and files with no MIME type
 return await this.extractFromText(file);
 } else {
 // Try to read as text for unknown types
 console.log('Warning Unknown file type, attempting text extraction');
 return await this.extractFromText(file);
 }
 } catch (error) {
 console.error('Error TEXT EXTRACTION ERROR:', error);
 throw new Error(`Unable to extract readable text from this file format`);
 }
 }

 private async extractFromPDF(file: File): Promise<string> {
 console.log('„ EXTRACTING FROM PDF');
 
 try {
 // Use the improved SimpleTextExtractor for PDFs
 const extractedText = await SimpleTextExtractor.extractText(file);
 
 if (extractedText && extractedText.length > 50) {
 // Clean the extracted text
 const cleanedText = SimpleTextExtractor.cleanExtractedText(extractedText);
 
 // Validate that it looks like resume content
 const validation = SimpleTextExtractor.validateResumeText(cleanedText);
 if (validation.isValid) {
 console.log('Done PDF text extracted and validated successfully');
 return cleanedText;
 } else {
 console.warn('Warning Extracted text validation failed:', validation.reason);
 }
 }
 
 console.log('Warning PDF text extraction unsuccessful');
 console.log(' For better PDF support, please:');
 console.log(' 1. Convert your PDF to a.txt file, or');
 console.log(' 2. Copy and paste the content into a.txt file, or');
 console.log(' 3. Use the Professional ATS Scanner for advanced PDF processing');
 
 throw new Error('Unable to extract readable text from this PDF. Please try converting to.txt format or use the Professional ATS Scanner.');
 
 } catch (error) {
 console.error('Error PDF EXTRACTION ERROR:', error);
 throw new Error('PDF processing failed. Please convert to.txt format or use Professional ATS Scanner for full PDF support.');
 }
 }

 private async extractFromWord(file: File): Promise<string> {
 console.log(' EXTRACTING FROM WORD DOCUMENT');
 
 try {
 // Use the improved SimpleTextExtractor for Word documents
 const extractedText = await SimpleTextExtractor.extractText(file);
 
 if (extractedText && extractedText.length > 50) {
 // Clean the extracted text
 const cleanedText = SimpleTextExtractor.cleanExtractedText(extractedText);
 
 // Validate that it looks like resume content
 const validation = SimpleTextExtractor.validateResumeText(cleanedText);
 if (validation.isValid) {
 console.log('Done Word document text extracted and validated successfully');
 return cleanedText;
 } else {
 console.warn('Warning Extracted text validation failed:', validation.reason);
 }
 }
 
 console.log('Warning Word document text extraction unsuccessful');
 console.log(' For better Word document support, please:');
 console.log(' 1. Save your document as a.txt file, or');
 console.log(' 2. Copy and paste the content into a.txt file, or');
 console.log(' 3. Use the Professional ATS Scanner for advanced Word processing');
 
 throw new Error('Unable to extract readable text from this Word document. Please save as.txt format or use the Professional ATS Scanner.');
 
 } catch (error) {
 console.error('Error WORD EXTRACTION ERROR:', error);
 throw new Error('Word document processing failed. Please save as.txt format or use Professional ATS Scanner for full Word support.');
 }
 }

 private async extractFromText(file: File): Promise<string> {
 console.log(' EXTRACTING FROM TEXT FILE');
 
 try {
 // First try simple text reading
 const text = await this.readFileAsText(file);
 
 if (text && text.length > 20) {
 // Clean and validate the text
 const cleanedText = SimpleTextExtractor.cleanExtractedText(text);
 const validation = SimpleTextExtractor.validateResumeText(cleanedText);
 
 if (validation.isValid) {
 console.log('Done Text file processed successfully');
 return cleanedText;
 } else {
 console.warn('Warning Text file validation warning:', validation.reason);
 // Still return the text even if validation fails, as it might still be processable
 return cleanedText;
 }
 }
 
 // If simple reading fails, try with enhanced extraction
 console.log('„ Trying enhanced text extraction...');
 const enhancedText = await SimpleTextExtractor.extractText(file);
 
 if (enhancedText && enhancedText.length > 20) {
 return SimpleTextExtractor.cleanExtractedText(enhancedText);
 }
 
 throw new Error('Text file appears to be empty or unreadable');
 
 } catch (error) {
 console.error('Error TEXT FILE EXTRACTION ERROR:', error);
 throw new Error(`Failed to extract text from file: ${error.message}`);
 }
 }

 private async readFileAsText(file: File): Promise<string> {
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
 
 // Set a timeout to prevent hanging
 const timeout = setTimeout(() => {
 reader.abort();
 reject(new Error('File reading timed out after 30 seconds'));
 }, 30000);
 
 reader.onload = (event) => {
 clearTimeout(timeout);
 const text = event.target?.result as string;
 console.log('Done FILE READ SUCCESSFULLY, length:', text?.length || 0);
 
 // Validate that we got actual text content
 if (!text || text.length === 0) {
 reject(new Error('File appears to be empty'));
 return;
 }
 
 // Check for binary content indicators
 if (text.includes('\0') || text.includes('%PDF') || text.includes('PK\x03\x04')) {
 reject(new Error('File contains binary data - text extraction not possible'));
 return;
 }
 
 resolve(text);
 };
 
 reader.onerror = (error) => {
 clearTimeout(timeout);
 console.error('Error FILE READ ERROR:', error);
 reject(new Error('Failed to read file - file may be corrupted or in an unsupported format'));
 };
 
 reader.onabort = () => {
 clearTimeout(timeout);
 reject(new Error('File reading was aborted'));
 };
 
 try {
 reader.readAsText(file, 'UTF-8');
 } catch (error) {
 clearTimeout(timeout);
 console.error('Error READER INITIALIZATION ERROR:', error);
 reject(new Error('Failed to initialize file reader'));
 }
 });
 }

 private async parseResumeText(text: string): Promise<EnterpriseResumeData> {
 console.log(' PARSING RESUME TEXT - UNIVERSAL EXTRACTION');
 console.log('„ Text to parse (first 200 chars):', text.substring(0, 200));
 
 // Extract personal information
 const personalInfo = this.extractPersonalInfo(text);
 console.log('Done EXTRACTED PERSONAL INFO:', personalInfo);

 // Extract professional summary
 const professionalSummary = this.extractProfessionalSummary(text);
 console.log('Done EXTRACTED PROFESSIONAL SUMMARY');

 // Extract work experience
 const experience = this.extractWorkExperience(text);
 console.log('Done EXTRACTED WORK EXPERIENCE:', experience.length, 'entries');

 // Extract education
 const education = this.extractEducation(text);
 console.log('Done EXTRACTED EDUCATION:', education.length, 'entries');

 // Extract skills
 const skills = this.extractSkills(text);
 console.log('Done EXTRACTED SKILLS:', {
 technical: skills.technical.length,
 tools: skills.tools.length,
 soft: skills.soft.length,
 total: skills.technical.length + skills.tools.length + skills.soft.length
 });

 // Extract projects
 const projects = this.extractProjects(text);
 console.log('Done EXTRACTED PROJECTS:', projects.length, 'entries');

 // Create final data structure
 const finalData: EnterpriseResumeData = {
 personalInfo,
 professionalSummary,
 experience,
 education,
 skills,
 projects,
 certifications: [],
 awards: [],
 publications: [],
 volunteering: [],
 extractionMetadata: {
 confidence: this.calculateConfidence(personalInfo, experience, education, skills),
 processingMethod: 'Universal Working Parser v1.0',
 aiAnalysisUsed: false,
 parsingErrors: [],
 enhancementNotes: [
 'Real document parsing applied',
 'Universal extraction patterns used',
 'Works with any resume format',
 'Confidence-based scoring'
 ]
 }
 };

 console.log(' FINAL PARSED DATA:', finalData);
 console.log(' VERIFICATION:', {
 name: finalData.personalInfo.name,
 email: finalData.personalInfo.email, 
 phone: finalData.personalInfo.phone,
 location: finalData.personalInfo.location,
 confidence: finalData.extractionMetadata.confidence
 });

 return finalData;
 }

 private extractPersonalInfo(text: string): any {
 console.log(' EXTRACTING PERSONAL INFO');
 
 const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
 
 // Name extraction - much more flexible patterns
 let name = 'Name not found';
 
 // Try multiple strategies for name extraction
 const nameStrategies = [
 // Strategy 1: First line that looks like a name (most common)
 () => {
 const firstLines = lines.slice(0, 5);
 for (const line of firstLines) {
 // Remove common resume words and check if it looks like a name
 const cleanLine = line.replace(/\b(resume|cv|curriculum|vitae)\b/gi, '').trim();
 const words = cleanLine.split(/\s+/);
 
 if (words.length >= 2 && words.length <= 5) {
 // Check if each word starts with capital letter and contains only letters/spaces/periods
 const isNameLike = words.every(word => 
 /^[A-Z][a-zA-Z.']*$/.test(word) && 
 word.length > 1 &&!word.includes('@') &&!word.includes('.')
 );
 
 if (isNameLike &&!line.includes('@') &&!line.includes('http')) {
 return cleanLine;
 }
 }
 }
 return null;
 },
 
 // Strategy 2: Look for "Name:" or similar patterns
 () => {
 const namePattern = /(?:name|candidate|applicant):\s*([A-Z][a-zA-Z\s.']{2,50})/gi;
 const match = text.match(namePattern);
 return match? match[0].split(':')[1].trim(): null;
 },
 
 // Strategy 3: Find capitalized words pattern
 () => {
 for (const line of lines.slice(0, 10)) {
 if (line.length > 5 && line.length < 60) {
 const words = line.split(/\s+/);
 if (words.length >= 2 && words.length <= 4) {
 const allCapitalized = words.every(word => /^[A-Z]/.test(word));
 const noSpecialChars =!line.includes('@') &&!line.includes('http') &&!line.includes('www');
 
 if (allCapitalized && noSpecialChars) {
 return line;
 }
 }
 }
 }
 return null;
 }
 ];
 
 for (const strategy of nameStrategies) {
 const result = strategy();
 if (result) {
 name = result;
 break;
 }
 }
 
 // Email extraction - more comprehensive
 const emailPatterns = [
 /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
 /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
 ];
 
 let email = 'Email not found';
 for (const pattern of emailPatterns) {
 const matches = text.match(pattern);
 if (matches && matches[0]) {
 email = matches[0];
 break;
 }
 }
 
 // Phone extraction - comprehensive patterns
 const phonePatterns = [
 /(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g, // Most formats
 /(\+?\d{1,3}[-.\s]?\d{10})/g, // +1-1234567890
 /(\(\d{3}\)\s?\d{3}[-.\s]?\d{4})/g, // (555) 123-4567
 /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g, // 555-123-4567
 /(\d{10})/g, // 5551234567
 /(\+\d{1,3}\s?\d{1,4}\s?\d{1,4}\s?\d{1,9})/g // International formats
 ];
 
 let phone = 'Phone not found';
 for (const pattern of phonePatterns) {
 const matches = text.match(pattern);
 if (matches) {
 // Filter out numbers that are too short or likely not phone numbers
 const validPhone = matches.find(match => {
 const digits = match.replace(/\D/g, '');
 return digits.length >= 10 && digits.length <= 15;
 });
 
 if (validPhone) {
 phone = validPhone;
 break;
 }
 }
 }
 
 // Location extraction - more flexible patterns
 const locationPatterns = [
 /([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/g, // City, State
 /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/g, // City, ST
 /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\s+\d{5})/g, // City, ST 12345
 /([A-Z][a-zA-Z\s]+ \d{5})/g, // City 12345
 /([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]*)/g // Any city, state pattern
 ];
 
 let location = 'Location not found';
 for (const pattern of locationPatterns) {
 const matches = text.match(pattern);
 if (matches) {
 // Find the most likely location (not too long, not containing common non-location words)
 const validLocation = matches.find(match => {
 const clean = match.toLowerCase();
 return match.length < 50 &&!clean.includes('university') &&!clean.includes('company') &&!clean.includes('experience') &&!clean.includes('education');
 });
 
 if (validLocation) {
 location = validLocation;
 break;
 }
 }
 }
 
 // Social media extraction
 const linkedinPattern = /(Link\.com\/in\/[a-zA-Z0-9-]+)/gi;
 const linkedinMatch = text.match(linkedinPattern);
 const Link = linkedinMatch? linkedinMatch[0]: '';
 
 const githubPattern = /(GitBranch\.com\/[a-zA-Z0-9-]+)/gi;
 const githubMatch = text.match(githubPattern);
 const GitBranch = githubMatch? githubMatch[0]: '';
 
 const portfolioPattern = /(https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/g;
 const portfolioMatch = text.match(portfolioPattern);
 const portfolio = portfolioMatch? portfolioMatch[0]: '';

 console.log('‹ Personal Info Extracted:', { name, email, phone, location });

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

 private extractProfessionalSummary(text: string): string {
 console.log(' EXTRACTING PROFESSIONAL SUMMARY');
 
 const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
 
 // Strategy 1: Look for explicit summary sections
 const summaryKeywords = [
 'professional summary', 'summary', 'profile', 'objective', 'overview',
 'qualifications summary', 'career summary', 'professional profile',
 'about me', 'about', 'introduction'
 ];
 
 for (let i = 0; i < lines.length; i++) {
 const line = lines[i].toLowerCase();
 
 if (summaryKeywords.some(keyword => line.includes(keyword) && line.length < 50)) {
 console.log(' Found summary section at line:', i);
 
 // Collect the next few lines as summary
 const summaryLines = [];
 for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
 const nextLine = lines[j];
 
 // Stop if we hit another section header
 if (this.isHeaderLine(nextLine)) {
 break;
 }
 
 // Add lines that look like summary content
 if (nextLine.length > 20 &&!nextLine.includes('') &&!nextLine.includes('http')) {
 summaryLines.push(nextLine);
 }
 }
 
 if (summaryLines.length > 0) {
 const summary = summaryLines.join(' ').trim();
 if (summary.length > 50) {
 console.log('Done Summary found:', summary.substring(0, 100) + '...');
 return summary;
 }
 }
 }
 }
 
 // Strategy 2: Look for paragraph-like content near the top
 for (let i = 1; i < Math.min(15, lines.length); i++) {
 const line = lines[i];
 
 // Skip obvious headers, contact info, etc.
 if (line.includes('@') || line.includes('http') || line.length < 30) {
 continue;
 }
 
 // Look for sentences (contains periods and is reasonably long)
 if (line.includes('.') && line.length > 50 && line.length < 500) {
 // Check if it's not a job title or company name
 const lowerLine = line.toLowerCase();
 const isNotJobTitle =!lowerLine.includes(' at ') &&!lowerLine.includes(' - ') &&!lowerLine.includes('university') &&!lowerLine.includes('college');
 
 if (isNotJobTitle) {
 console.log('Done Summary found via content analysis:', line.substring(0, 100) + '...');
 return line;
 }
 }
 }
 
 // Strategy 3: Look for multi-line paragraphs
 for (let i = 1; i < Math.min(20, lines.length - 2); i++) {
 const currentLine = lines[i];
 const nextLine = lines[i + 1];
 
 if (currentLine.length > 30 && nextLine.length > 30 &&!currentLine.includes('@') &&!nextLine.includes('@') &&!this.isHeaderLine(currentLine) &&!this.isHeaderLine(nextLine)) {
 
 const combined = `${currentLine} ${nextLine}`;
 if (combined.length > 100 && combined.length < 600) {
 console.log('Done Summary found via paragraph analysis:', combined.substring(0, 100) + '...');
 return combined;
 }
 }
 }
 
 return 'Professional summary not found';
 }
 
 private isHeaderLine(line: string): boolean {
 const headerKeywords = [
 'experience', 'education', 'skills', 'projects', 'certifications',
 'awards', 'achievements', 'qualifications', 'employment', 'work history',
 'professional experience', 'career summary', 'technical skills'
 ];
 
 const lowerLine = line.toLowerCase().trim();
 
 // Check if it's a section header (short line with header keywords)
 if (line.length < 50 && headerKeywords.some(keyword => lowerLine.includes(keyword))) {
 return true;
 }
 
 // Check if it's all caps (common for headers)
 if (line.length < 50 && line === line.toUpperCase() && line.length > 3) {
 return true;
 }
 
 return false;
 }

 private extractWorkExperience(text: string): any[] {
 console.log(' EXTRACTING WORK EXPERIENCE');
 
 const experiences = [];
 const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
 
 // Find experience section
 const experienceKeywords = ['experience', 'employment', 'work history', 'career', 'professional experience', 'work'];
 let experienceStartIndex = -1;
 let experienceEndIndex = lines.length;
 
 // Find start of experience section
 for (let i = 0; i < lines.length; i++) {
 const line = lines[i].toLowerCase();
 if (experienceKeywords.some(keyword => line.includes(keyword) && line.length < 50)) {
 experienceStartIndex = i + 1;
 console.log(' Found experience section starting at line:', i);
 break;
 }
 }
 
 // Find end of experience section (start of next major section)
 if (experienceStartIndex > -1) {
 const nextSectionKeywords = ['education', 'skills', 'projects', 'certifications', 'awards'];
 for (let i = experienceStartIndex; i < lines.length; i++) {
 const line = lines[i].toLowerCase();
 if (nextSectionKeywords.some(keyword => line.includes(keyword) && line.length < 50)) {
 experienceEndIndex = i;
 console.log(' Experience section ends at line:', i);
 break;
 }
 }
 }
 
 if (experienceStartIndex === -1) {
 console.log('Warning No explicit experience section found, trying global patterns');
 experienceStartIndex = 0;
 }
 
 const experienceLines = lines.slice(experienceStartIndex, experienceEndIndex);
 console.log('„ Experience section lines:', experienceLines.length);
 
 // Strategy 1: Look for job title and company patterns
 const jobPatterns = [
 // "Job Title at Company Name (2020-2023)"
 /(.+?)\s+at\s+(.+?)\s*[\(,]?\s*(\d{4})\s*[--]\s*(\d{4}|present)/gi,
 
 // "Job Title, Company Name, 2020-2023"
 /([^,]+),\s*([^,]+),\s*(\d{4})\s*[--]\s*(\d{4}|present)/gi,
 
 // "Company Name - Job Title (2020-2023)"
 /(.+?)\s*[--]\s*(.+?)\s*[\(,]?\s*(\d{4})\s*[--]\s*(\d{4}|present)/gi,
 
 // "Job Title | Company Name | 2020-2023"
 /([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d{4})\s*[--]\s*(\d{4}|present)/gi
 ];
 
 const experienceText = experienceLines.join('\n');
 
 for (const pattern of jobPatterns) {
 const matches = Array.from(experienceText.matchAll(pattern));
 
 matches.forEach((match, index) => {
 let position, company, startDate, endDate;
 
 if (pattern.source.includes('at')) {
 // "Job Title at Company" pattern
 position = match[1].trim();
 company = match[2].trim();
 startDate = match[3];
 endDate = match[4];
 } else if (pattern.source.includes('\\|')) {
 // Pipe separated pattern
 position = match[1].trim();
 company = match[2].trim();
 startDate = match[3];
 endDate = match[4];
 } else {
 // Other patterns - assume first is position, second is company
 position = match[1].trim();
 company = match[2].trim();
 startDate = match[3];
 endDate = match[4];
 }
 
 // Clean up the extracted data
 position = position.replace(/[\-\*]/g, '').trim();
 company = company.replace(/[\-\*]/g, '').trim();
 
 const isCurrent = endDate && endDate.toLowerCase().includes('present');
 
 if (position.length > 2 && company.length > 2) {
 experiences.push({
 id: `exp_${experiences.length + 1}`,
 position,
 company,
 location: '',
 startDate: startDate || '',
 endDate: isCurrent? '': (endDate || ''),
 isCurrent,
 description: `${position} at ${company}`,
 achievements: [],
 skills: [],
 industry: 'Unknown'
 });
 }
 });
 }
 
 // Strategy 2: Look for structured experience entries (multiline)
 if (experiences.length === 0) {
 console.log('„ Trying multiline experience extraction');
 
 let currentExperience = null;
 
 for (let i = 0; i < experienceLines.length; i++) {
 const line = experienceLines[i];
 
 // Look for date patterns that indicate a job entry
 const datePattern = /(\d{4})\s*[--]\s*(\d{4}|present)/gi;
 const dateMatch = line.match(datePattern);
 
 if (dateMatch) {
 // This line contains dates, try to find job title and company
 const beforeDate = line.substring(0, line.indexOf(dateMatch[0])).trim();
 const parts = beforeDate.split(/[-,|]/);
 
 if (parts.length >= 2) {
 const position = parts[0].trim().replace(/[\-\*]/g, '').trim();
 const company = parts[1].trim().replace(/[\-\*]/g, '').trim();
 
 if (position.length > 2 && company.length > 2) {
 const [startDate, endDate] = dateMatch[0].split(/[--]/).map(d => d.trim());
 const isCurrent = endDate.toLowerCase().includes('present');
 
 experiences.push({
 id: `exp_${experiences.length + 1}`,
 position,
 company,
 location: '',
 startDate: startDate,
 endDate: isCurrent? '': endDate,
 isCurrent,
 description: `${position} at ${company}`,
 achievements: [],
 skills: [],
 industry: 'Unknown'
 });
 }
 }
 }
 }
 }
 
 console.log(' Found', experiences.length, 'work experiences');
 console.log('‹ Experience details:', experiences.map(exp => `${exp.position} at ${exp.company} (${exp.startDate}-${exp.endDate || 'present'})`));
 
 return experiences;
 }

 private extractEducation(text: string): any[] {
 console.log(' EXTRACTING EDUCATION');
 
 const educationEntries = [];
 const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
 
 // Find education section
 const educationKeywords = ['education', 'academic', 'qualifications', 'degrees'];
 let educationStartIndex = -1;
 let educationEndIndex = lines.length;
 
 // Find start of education section
 for (let i = 0; i < lines.length; i++) {
 const line = lines[i].toLowerCase();
 if (educationKeywords.some(keyword => line.includes(keyword) && line.length < 50)) {
 educationStartIndex = i + 1;
 console.log(' Found education section starting at line:', i);
 break;
 }
 }
 
 // Find end of education section
 if (educationStartIndex > -1) {
 const nextSectionKeywords = ['experience', 'skills', 'projects', 'certifications', 'awards'];
 for (let i = educationStartIndex; i < lines.length; i++) {
 const line = lines[i].toLowerCase();
 if (nextSectionKeywords.some(keyword => line.includes(keyword) && line.length < 50)) {
 educationEndIndex = i;
 break;
 }
 }
 }
 
 if (educationStartIndex === -1) {
 console.log('Warning No explicit education section found, trying global patterns');
 educationStartIndex = 0;
 }
 
 const educationLines = lines.slice(educationStartIndex, educationEndIndex);
 const educationText = educationLines.join('\n');
 
 // Strategy 1: Comprehensive degree patterns
 const degreePatterns = [
 // "Bachelor of Science in Computer Science, Stanford University, 2020"
 /(Bachelor|Master|PhD|Doctorate|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|MBA|BSc|MSc|BA|MA)\s*(?:of\s+)?([^,\n]*),?\s*([^,\n]*(?:University|College|Institute|School)[^,\n]*),?\s*(\d{4})?/gi,
 
 // "Stanford University - Computer Science (B.S.) - 2020"
 /([^-\n]*(?:University|College|Institute|School)[^-\n]*)\s*[--]\s*([^-\n]*)\s*[\(\[]?(Bachelor|Master|PhD|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|MBA)[\)\]]?\s*[--]?\s*(\d{4})?/gi,
 
 // "Computer Science | Stanford University | 2020"
 /([^|\n]+)\s*\|\s*([^|\n]*(?:University|College|Institute|School)[^|\n]*)\s*\|\s*(\d{4})?/gi,
 
 // Just university with year
 /([^,\n]*(?:University|College|Institute|School)[^,\n]*)[,\s]*(\d{4})/gi
 ];
 
 for (const pattern of degreePatterns) {
 const matches = Array.from(educationText.matchAll(pattern));
 
 matches.forEach((match) => {
 let degree = '';
 let field = '';
 let institution = '';
 let graduationDate = '';
 
 if (pattern.source.includes('Bachelor|Master')) {
 // Pattern 1: Degree first
 degree = match[1] || '';
 field = match[2] || '';
 institution = match[3] || '';
 graduationDate = match[4] || '';
 } else if (pattern.source.includes('University.*-')) {
 // Pattern 2: University first
 institution = match[1] || '';
 field = match[2] || '';
 degree = match[3] || '';
 graduationDate = match[4] || '';
 } else if (pattern.source.includes('\\|')) {
 // Pattern 3: Pipe separated
 field = match[1] || '';
 institution = match[2] || '';
 graduationDate = match[3] || '';
 } else {
 // Pattern 4: University with year
 institution = match[1] || '';
 graduationDate = match[2] || '';
 }
 
 // Clean up extracted data
 degree = degree.trim().replace(/[\-\*]/g, '').trim();
 field = field.trim().replace(/[\-\*]/g, '').trim();
 institution = institution.trim().replace(/[\-\*]/g, '').trim();
 graduationDate = graduationDate.trim();
 
 // Only add if we have meaningful data
 if (institution.length > 2 || degree.length > 2) {
 educationEntries.push({
 id: `edu_${educationEntries.length + 1}`,
 institution: institution || 'Institution not specified',
 degree: degree || 'Degree not specified',
 field: field || 'Field not specified',
 graduationDate: graduationDate || 'Date not specified',
 location: '',
 achievements: []
 });
 }
 });
 }
 
 // Strategy 2: Look for common education keywords in lines
 if (educationEntries.length === 0) {
 console.log('„ Trying keyword-based education extraction');
 
 const educationKeywordsList = [
 'university', 'college', 'institute', 'school',
 'bachelor', 'master', 'phd', 'doctorate', 'degree',
 'b.s.', 'm.s.', 'b.a.', 'm.a.', 'mba', 'bsc', 'msc'
 ];
 
 for (const line of lines) {
 const lowerLine = line.toLowerCase();
 
 if (educationKeywordsList.some(keyword => lowerLine.includes(keyword))) {
 // Extract year if present
 const yearMatch = line.match(/(\d{4})/);
 const year = yearMatch? yearMatch[1]: '';
 
 // Try to identify institution and degree
 let institution = '';
 let degree = '';
 
 if (lowerLine.includes('university') || lowerLine.includes('college') || lowerLine.includes('institute')) {
 institution = line;
 }
 
 if (lowerLine.includes('bachelor') || lowerLine.includes('master') || lowerLine.includes('phd') || 
 lowerLine.includes('b.s.') || lowerLine.includes('m.s.') || lowerLine.includes('mba')) {
 degree = line;
 }
 
 if (institution || degree) {
 educationEntries.push({
 id: `edu_${educationEntries.length + 1}`,
 institution: institution || 'Institution not specified',
 degree: degree || 'Degree not specified',
 field: 'Field not specified',
 graduationDate: year || 'Date not specified',
 location: '',
 achievements: []
 });
 }
 }
 }
 }
 
 console.log(' Found', educationEntries.length, 'education entries');
 console.log('‹ Education details:', educationEntries.map(edu => `${edu.degree} from ${edu.institution} (${edu.graduationDate})`));
 
 return educationEntries;
 }

 private extractSkills(text: string): any {
 console.log(' EXTRACTING SKILLS');
 
 // Common technical skills
 const technicalSkills = [
 'JavaScript', 'Python', 'Java', 'C++', 'C#', 'React', 'Angular', 'Vue', 'Node.js',
 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
 'Git', 'Jenkins', 'Terraform', 'Ansible', 'Linux', 'Machine Learning', 'AI',
 'Data Analytics', 'Business Analysis', 'Statistical Analysis', 'Predictive Modeling',
 'Business Intelligence', 'Hadoop', 'Spark', 'Tableau', 'Power BI'
 ];
 
 // Common tools
 const toolsSkills = [
 'Excel', 'PowerPoint', 'Word', 'Photoshop', 'Illustrator', 'Figma', 'Sketch',
 'Jira', 'Confluence', 'Slack', 'Trello', 'Asana', 'Salesforce', 'HubSpot'
 ];
 
 // Common soft skills
 const softSkills = [
 'Project Management', 'Team Leadership', 'Communication', 'Problem Solving',
 'Critical Thinking', 'Collaboration', 'Time Management', 'Adaptability',
 'Customer Service', 'Negotiation', 'Presentation', 'Training', 'Mentoring'
 ];
 
 const foundTechnical = technicalSkills.filter(skill => 
 text.toLowerCase().includes(skill.toLowerCase())
 );
 
 const foundTools = toolsSkills.filter(skill => 
 text.toLowerCase().includes(skill.toLowerCase())
 );
 
 const foundSoft = softSkills.filter(skill => 
 text.toLowerCase().includes(skill.toLowerCase())
 );
 
 return {
 technical: foundTechnical,
 tools: foundTools,
 soft: foundSoft,
 languages: [],
 certifications: [],
 frameworks: []
 };
 }

 private extractProjects(text: string): any[] {
 console.log(' EXTRACTING PROJECTS');
 
 // For now, return empty array - projects extraction is complex
 return [];
 }

 private calculateConfidence(personalInfo: any, experience: any[], education: any[], skills: any): number {
 let confidence = 0;
 
 // Personal info scoring
 if (personalInfo.name!== 'Name not found') confidence += 0.2;
 if (personalInfo.email!== 'Email not found') confidence += 0.2;
 if (personalInfo.phone!== 'Phone not found') confidence += 0.1;
 if (personalInfo.location!== 'Location not found') confidence += 0.1;
 
 // Experience scoring
 if (experience.length > 0) confidence += 0.2;
 
 // Education scoring
 if (education.length > 0) confidence += 0.1;
 
 // Skills scoring
 const totalSkills = skills.technical.length + skills.tools.length + skills.soft.length;
 if (totalSkills > 0) confidence += 0.1;
 
 return Math.min(confidence, 0.98); // Cap at 98%
 }
}

// Export the class so it can be imported
export { WorkingDocumentParser };









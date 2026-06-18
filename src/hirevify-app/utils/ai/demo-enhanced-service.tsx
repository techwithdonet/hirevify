/**
 * Demo Enhanced AI Service - Fallback for Enhanced ATS Scanner
 * Works without external API keys for demonstration purposes
 */

export interface DemoExtractionResult {
 textContent: string;
 visualAnalysis: any;
 structuredData: any;
 confidence: any;
 processingMetadata: any;
}

class DemoEnhancedService {
 /**
 * Demo resume analysis with simulated AI processing
 */
 async analyzeResumeWithVision(imageData: string, textContent?: string): Promise<DemoExtractionResult> {
 const startTime = Date.now();

 // Simulate processing delay
 await new Promise(resolve => setTimeout(resolve, 2000));

 // Generate demo structured data based on text content
 const demoData = this.generateRealDataFromText(textContent || '');

 return {
 textContent: textContent || '',
 visualAnalysis: this.generateDemoVisualAnalysis(),
 structuredData: demoData,
 confidence: this.generateDemoConfidence(demoData),
 processingMetadata: {
 processingTime: Date.now() - startTime,
 modelsUsed: ['demo-gpt-4-vision', 'demo-text-extractor'],
 qualityScore: 92,
 recommendedActions: ['Manual review recommended for critical fields'],
 potentialIssues: []
 }
 };
 }

 private generateRealDataFromText(textContent: string) {
 // If no text content, return minimal structure
 if (!textContent || textContent.trim().length === 0) {
 return this.generateDemoData('');
 }

 console.log(' Extracting real data from text content:', textContent.substring(0, 200) + '...');

 // Extract basic info from text content using improved regex patterns
 const emailMatch = textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
 const phoneMatches = textContent.match(/(\+?\d{1,3}[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g);
 
 // Better name extraction - look for lines that look like names at the beginning
 const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
 const potentialNames = lines.slice(0, 10).filter(line => {
 // Name should be 2-4 words, each starting with capital, no numbers/symbols
 const words = line.split(/\s+/);
 return words.length >= 2 && words.length <= 4 &&
 words.every(word => /^[A-Z][a-z]+$/.test(word)) &&
 line.length < 60;
 });

 // Extract location - look for patterns like "City, State" or "City, Country"
 const locationMatch = textContent.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
 
 // Extract Link URLs
 const linkedInMatch = textContent.match(/(?:Link\.com\/in\/|Link\.com\/pub\/)([a-zA-Z0-9\-]+)/i);
 
 // Extract GitBranch URLs
 const githubMatch = textContent.match(/(?:GitBranch\.com\/)([a-zA-Z0-9\-]+)/i);
 
 // Extract website URLs
 const websiteMatch = textContent.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g);

 // Extract work experience sections
 const workExperience = this.extractWorkExperience(textContent);
 
 // Extract education
 const education = this.extractEducation(textContent);
 
 // Extract skills
 const skills = this.extractSkills(textContent);
 
 // Extract professional summary
 const summary = this.extractSummary(textContent);

 const extractedData = {
 personalInfo: {
 fullName: potentialNames[0] || this.extractNameFromEmail(emailMatch?.[0]) || 'Name not found',
 email: emailMatch?.[0] || 'Email not found',
 phone: phoneMatches?.[0] || 'Phone not found',
 location: locationMatch?.[0] || 'Location not found',
 Link: linkedInMatch? `Link.com/in/${linkedInMatch[1]}`: '',
 website: websiteMatch?.find(url =>!url.includes('Link') &&!url.includes('GitBranch')) || '',
 GitBranch: githubMatch? `GitBranch.com/${githubMatch[1]}`: '',
 portfolio: ''
 },
 professionalSummary: summary,
 workExperience,
 education,
 skills,
 certifications: this.extractCertifications(textContent),
 projects: this.extractProjects(textContent),
 awards: this.extractAwards(textContent),
 languages: this.extractLanguages(textContent),
 references: []
 };

 console.log('Done Extracted real data:', {
 name: extractedData.personalInfo.fullName,
 email: extractedData.personalInfo.email,
 workExpCount: extractedData.workExperience.length,
 skillsCount: Object.keys(extractedData.skills).length
 });

 return extractedData;
 }

 private extractNameFromEmail(email?: string): string | undefined {
 if (!email) return undefined;
 const namePart = email.split('@')[0];
 return namePart.split('.').map(part => 
 part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
 ).join(' ');
 }

 private extractWorkExperience(text: string): any[] {
 const experiences: any[] = [];
 const lines = text.split('\n').map(line => line.trim());
 
 // Look for experience sections
 const experienceKeywords = ['experience', 'employment', 'work history', 'career', 'professional experience'];
 let inExperienceSection = false;
 let currentExp: any = null;
 
 for (let i = 0; i < lines.length; i++) {
 const line = lines[i];
 const lowerLine = line.toLowerCase();
 
 // Check if we're entering an experience section
 if (experienceKeywords.some(keyword => lowerLine.includes(keyword))) {
 inExperienceSection = true;
 continue;
 }
 
 // Check if we're leaving experience section (entering another major section)
 if (inExperienceSection && ['education', 'skills', 'certifications'].some(keyword => lowerLine.includes(keyword))) {
 if (currentExp) {
 experiences.push(currentExp);
 currentExp = null;
 }
 inExperienceSection = false;
 continue;
 }
 
 if (inExperienceSection && line.length > 0) {
 // Look for job titles and companies
 if (this.looksLikeJobTitle(line)) {
 if (currentExp) {
 experiences.push(currentExp);
 }
 currentExp = {
 position: line,
 company: '',
 startDate: '',
 endDate: '',
 location: '',
 description: '',
 achievements: [],
 skills: [],
 confidence: 85
 };
 } else if (currentExp && this.looksLikeCompanyName(line)) {
 currentExp.company = line;
 } else if (currentExp && this.looksLikeDateRange(line)) {
 const dates = this.extractDateRange(line);
 currentExp.startDate = dates.start;
 currentExp.endDate = dates.end;
 } else if (currentExp && line.length > 20) {
 // Add to description
 currentExp.description += (currentExp.description? ' ': '') + line;
 }
 }
 }
 
 // Add the last experience if exists
 if (currentExp) {
 experiences.push(currentExp);
 }
 
 return experiences.length > 0? experiences: [{
 company: 'Company name not found',
 position: 'Position not found',
 startDate: 'Start date not found',
 endDate: 'End date not found',
 location: '',
 description: 'Job description extracted from resume text',
 achievements: [],
 skills: [],
 confidence: 70
 }];
 }

 private extractEducation(text: string): any[] {
 const education: any[] = [];
 const lines = text.split('\n').map(line => line.trim());
 
 // Look for education keywords
 const educationKeywords = ['education', 'academic', 'degree', 'university', 'college', 'school'];
 let inEducationSection = false;
 
 for (const line of lines) {
 const lowerLine = line.toLowerCase();
 
 if (educationKeywords.some(keyword => lowerLine.includes(keyword))) {
 inEducationSection = true;
 continue;
 }
 
 if (inEducationSection && ['experience', 'skills', 'certifications'].some(keyword => lowerLine.includes(keyword))) {
 inEducationSection = false;
 continue;
 }
 
 if (inEducationSection && line.length > 5) {
 // Look for degree patterns
 if (this.looksLikeDegree(line)) {
 education.push({
 institution: this.extractInstitution(line) || 'Institution not found',
 degree: this.extractDegree(line) || 'Degree not found',
 fieldOfStudy: this.extractFieldOfStudy(line) || 'Field not found',
 graduationDate: this.extractGraduationDate(line) || 'Date not found',
 gpa: '',
 honors: [],
 relevantCoursework: [],
 confidence: 80
 });
 }
 }
 }
 
 return education.length > 0? education: [{
 institution: 'Educational institution not found',
 degree: 'Degree information not found',
 fieldOfStudy: 'Field of study not found',
 graduationDate: 'Graduation date not found',
 gpa: '',
 honors: [],
 relevantCoursework: [],
 confidence: 60
 }];
 }

 private extractSkills(text: string): any {
 const skillsSection = {
 technical: [] as string[],
 soft: [] as string[],
 tools: [] as string[],
 frameworks: [] as string[],
 languages: [] as string[],
 certifications: [] as string[],
 confidence: 85
 };

 // Common technical skills to look for
 const technicalSkills = [
 'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'html', 'css', 'typescript',
 'angular', 'vue', 'php', 'ruby', 'c++', 'c#', 'go', 'rust', 'swift', 'kotlin',
 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'docker', 'kubernetes',
 'aws', 'azure', 'gcp', 'terraform', 'jenkins', 'git', 'GitBranch', 'gitlab'
 ];
 
 const tools = [
 'git', 'docker', 'kubernetes', 'jenkins', 'jira', 'confluence', 'slack', 'figma',
 'adobe', 'photoshop', 'illustrator', 'sketch', 'invision', 'zeplin'
 ];
 
 const frameworks = [
 'react', 'angular', 'vue', 'express', 'django', 'flask', 'spring', 'rails',
 'laravel', 'symfony', 'nextjs', 'nuxtjs', 'gatsby', 'svelte'
 ];

 const textLower = text.toLowerCase();
 
 // Extract technical skills
 technicalSkills.forEach(skill => {
 if (textLower.includes(skill.toLowerCase())) {
 skillsSection.technical.push(skill);
 }
 });
 
 // Extract tools
 tools.forEach(tool => {
 if (textLower.includes(tool.toLowerCase())) {
 skillsSection.tools.push(tool);
 }
 });
 
 // Extract frameworks
 frameworks.forEach(framework => {
 if (textLower.includes(framework.toLowerCase())) {
 skillsSection.frameworks.push(framework);
 }
 });

 // Extract programming languages
 const programmingLanguages = ['javascript', 'python', 'java', 'typescript', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin'];
 programmingLanguages.forEach(lang => {
 if (textLower.includes(lang)) {
 skillsSection.languages.push(lang);
 }
 });

 return skillsSection;
 }

 private extractSummary(text: string): string {
 const lines = text.split('\n').map(line => line.trim());
 
 // Look for summary section
 const summaryKeywords = ['summary', 'profile', 'overview', 'objective', 'about'];
 let inSummarySection = false;
 let summary = '';
 
 for (const line of lines) {
 const lowerLine = line.toLowerCase();
 
 if (summaryKeywords.some(keyword => lowerLine.includes(keyword))) {
 inSummarySection = true;
 continue;
 }
 
 if (inSummarySection && ['experience', 'education', 'skills'].some(keyword => lowerLine.includes(keyword))) {
 break;
 }
 
 if (inSummarySection && line.length > 10) {
 summary += (summary? ' ': '') + line;
 }
 }
 
 return summary || 'Professional summary not found in resume';
 }

 private extractCertifications(text: string): any[] {
 // Simple certification extraction
 const certKeywords = ['certified', 'certification', 'certificate', 'aws', 'google', 'microsoft', 'oracle'];
 const lines = text.split('\n').map(line => line.trim());
 const certifications: any[] = [];
 
 for (const line of lines) {
 if (certKeywords.some(keyword => line.toLowerCase().includes(keyword)) && line.length > 10) {
 certifications.push({
 name: line,
 issuer: 'Issuer not specified',
 dateObtained: 'Date not specified',
 expirationDate: '',
 credentialId: '',
 confidence: 75
 });
 }
 }
 
 return certifications;
 }

 private extractProjects(text: string): any[] {
 // Simple project extraction
 return [];
 }

 private extractAwards(text: string): any[] {
 // Simple awards extraction
 return [];
 }

 private extractLanguages(text: string): any[] {
 const commonLanguages = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'portuguese', 'italian', 'russian'];
 const languages: any[] = [];
 const textLower = text.toLowerCase();
 
 commonLanguages.forEach(lang => {
 if (textLower.includes(lang)) {
 languages.push({
 name: lang.charAt(0).toUpperCase() + lang.slice(1),
 proficiency: 'intermediate',
 confidence: 70
 });
 }
 });
 
 return languages;
 }

 // Helper methods for pattern matching
 private looksLikeJobTitle(text: string): boolean {
 const jobTitlePatterns = [
 /^(senior|junior|lead|principal|staff)?\s*(software|web|mobile|full.?stack|front.?end|back.?end|devops|data|machine learning|ai|product|project|marketing|sales|finance|hr|operations|design|ux|ui)\s*(engineer|developer|analyst|manager|director|specialist|coordinator|consultant|architect|designer|scientist)/i,
 /^(ceo|cto|cfo|vp|vice president|president|founder|co.?founder)/i
 ];
 
 return jobTitlePatterns.some(pattern => pattern.test(text.trim())) && text.length < 80;
 }

 private looksLikeCompanyName(text: string): boolean {
 const companyIndicators = ['inc', 'llc', 'corp', 'company', 'technologies', 'solutions', 'systems', 'group', 'consulting'];
 const textLower = text.toLowerCase();
 
 return (companyIndicators.some(indicator => textLower.includes(indicator)) || 
 /^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/.test(text)) && 
 text.length < 60 && text.length > 2;
 }

 private looksLikeDateRange(text: string): boolean {
 return /\d{4}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current)\b/i.test(text);
 }

 private extractDateRange(text: string): { start: string; end: string } {
 const dateMatch = text.match(/(\d{4}|\w+\s+\d{4})\s*[---]\s*(\d{4}|\w+\s+\d{4}|present|current)/i);
 if (dateMatch) {
 return { start: dateMatch[1], end: dateMatch[2] };
 }
 return { start: 'Date not found', end: 'Date not found' };
 }

 private looksLikeDegree(text: string): boolean {
 const degreePatterns = [
 /bachelor|master|phd|doctorate|associate|diploma/i,
 /b\.?[sa]\.?|m\.?[sa]\.?|ph\.?d\.?/i
 ];
 return degreePatterns.some(pattern => pattern.test(text));
 }

 private extractInstitution(text: string): string | null {
 // Try to extract university/college name
 const institutionMatch = text.match(/(university|college|institute|school)\s+of\s+[\w\s]+|([\w\s]+)\s+(university|college|institute)/i);
 return institutionMatch?.[0] || null;
 }

 private extractDegree(text: string): string | null {
 const degreeMatch = text.match(/(bachelor|master|phd|doctorate|associate|diploma)[\w\s]*/i);
 return degreeMatch?.[0] || null;
 }

 private extractFieldOfStudy(text: string): string | null {
 const fieldMatch = text.match(/in\s+([\w\s]+)|of\s+([\w\s]+)/i);
 return fieldMatch?.[1] || fieldMatch?.[2] || null;
 }

 private extractGraduationDate(text: string): string | null {
 const dateMatch = text.match(/\d{4}/);
 return dateMatch?.[0] || null;
 }

 private generateDemoData(textContent: string) {
 return {
 personalInfo: {
 fullName: 'John Doe',
 email: 'john.doe@email.com',
 phone: '+1-234-567-8900',
 location: 'San Francisco, CA',
 Link: 'Link.com/in/johndoe',
 website: '',
 GitBranch: '',
 portfolio: ''
 },
 professionalSummary: 'Experienced software engineer with expertise in full-stack development.',
 workExperience: [
 {
 company: 'Tech Company Inc.',
 position: 'Senior Software Engineer',
 startDate: '2022-01',
 endDate: 'Present',
 location: 'San Francisco, CA',
 description: 'Lead development of web applications using React and Node.js',
 achievements: ['Improved system performance by 40%', 'Led team of 5 developers'],
 skills: ['JavaScript', 'React', 'Node.js'],
 confidence: 95
 }
 ],
 education: [
 {
 institution: 'University of Technology',
 degree: 'Bachelor of Science',
 fieldOfStudy: 'Computer Science',
 graduationDate: '2020-05',
 gpa: '3.8',
 honors: ['Cum Laude'],
 relevantCoursework: ['Data Structures', 'Algorithms', 'Software Engineering'],
 confidence: 90
 }
 ],
 skills: {
 technical: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL'],
 soft: ['Leadership', 'Communication', 'Problem Solving'],
 tools: ['Git', 'Docker', 'AWS'],
 frameworks: ['React', 'Express', 'Django'],
 languages: ['English', 'Spanish'],
 certifications: ['AWS Certified Developer'],
 confidence: 88
 },
 certifications: [
 {
 name: 'AWS Certified Developer',
 issuer: 'Amazon Web Services',
 dateObtained: '2023-03',
 expirationDate: '2026-03',
 credentialId: 'AWS-DEV-123456',
 confidence: 92
 }
 ],
 projects: [
 {
 name: 'E-commerce Platform',
 description: 'Built a full-stack e-commerce platform with React and Node.js',
 technologies: ['React', 'Node.js', 'MongoDB'],
 startDate: '2023-01',
 endDate: '2023-06',
 url: 'GitBranch.com/johndoe/ecommerce',
 achievements: ['Served 10,000+ users', 'Generated $100K revenue'],
 confidence: 87
 }
 ],
 awards: [],
 languages: [
 {
 name: 'English',
 proficiency: 'native',
 confidence: 95
 }
 ],
 references: []
 };
 }

 private generateDemoVisualAnalysis() {
 return {
 layout: {
 type: 'standard',
 columns: 1,
 hasHeader: true,
 hasFooter: false,
 fontAnalysis: {
 primaryFont: 'Arial',
 fontSize: [10, 12, 14, 16],
 fontWeights: ['normal', 'bold'],
 hierarchy: [
 { level: 1, fontSize: 16, fontWeight: 'bold', usage: 'heading' },
 { level: 2, fontSize: 14, fontWeight: 'bold', usage: 'subheading' },
 { level: 3, fontSize: 12, fontWeight: 'normal', usage: 'body' }
 ]
 },
 spacingAnalysis: {
 lineSpacing: 1.2,
 paragraphSpacing: 12,
 margins: { top: 20, right: 20, bottom: 20, left: 20 },
 consistency: 92
 }
 },
 confidence: 89,
 sections: [
 { type: 'header', content: 'Contact Information', position: { x: 0, y: 0, width: 100, height: 20 }, confidence: 95, importance: 100 },
 { type: 'experience', content: 'Work Experience', position: { x: 0, y: 100, width: 100, height: 200 }, confidence: 92, importance: 90 },
 { type: 'education', content: 'Education', position: { x: 0, y: 320, width: 100, height: 80 }, confidence: 88, importance: 80 },
 { type: 'skills', content: 'Skills', position: { x: 0, y: 420, width: 100, height: 60 }, confidence: 85, importance: 85 }
 ],
 visualElements: [
 { type: 'divider', position: { x: 0, y: 50, width: 100, height: 2 }, description: 'Section separator', confidence: 90 }
 ]
 };
 }

 private generateDemoConfidence(structuredData: any) {
 return {
 overall: 92,
 textExtraction: 95,
 structureAnalysis: 89,
 dataExtraction: 91,
 visualUnderstanding: 88,
 fieldConfidence: {
 personalInfo: 94,
 workExperience: 91,
 education: 89,
 skills: 88,
 certifications: 92,
 projects: 87
 }
 };
 }
}

export const demoEnhancedService = new DemoEnhancedService();
export default demoEnhancedService;








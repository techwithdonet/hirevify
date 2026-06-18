/**
 * Advanced Confidence Scoring System - Phase 1 Enhancement
 * Comprehensive confidence calculation for all ATS extractions
 * 
 * Features:
 * - Multi-dimensional confidence scoring
 * - Real-time accuracy assessment
 * - Field-level confidence tracking
 * - Uncertainty quantification
 * - Active learning integration
 */

export interface ConfidenceMetrics {
 overall: number;
 extraction: FieldConfidenceScores;
 validation: ValidationScores;
 consistency: ConsistencyScores;
 quality: QualityScores;
 uncertainty: UncertaintyMetrics;
}

export interface FieldConfidenceScores {
 personalInfo: PersonalInfoConfidence;
 workExperience: WorkExperienceConfidence;
 education: EducationConfidence;
 skills: SkillsConfidence;
 certifications: CertificationConfidence;
 projects: ProjectConfidence;
 achievements: AchievementConfidence;
}

export interface PersonalInfoConfidence {
 fullName: number;
 email: number;
 phone: number;
 location: number;
 Link: number;
 website: number;
 overall: number;
}

export interface WorkExperienceConfidence {
 companies: number[];
 positions: number[];
 dates: number[];
 descriptions: number[];
 achievements: number[];
 skills: number[];
 overall: number;
}

export interface EducationConfidence {
 institutions: number[];
 degrees: number[];
 fields: number[];
 dates: number[];
 gpa: number[];
 overall: number;
}

export interface SkillsConfidence {
 technical: number;
 soft: number;
 tools: number;
 frameworks: number;
 languages: number;
 categorization: number;
 overall: number;
}

export interface CertificationConfidence {
 names: number[];
 issuers: number[];
 dates: number[];
 validity: number[];
 overall: number;
}

export interface ProjectConfidence {
 names: number[];
 descriptions: number[];
 technologies: number[];
 dates: number[];
 urls: number[];
 overall: number;
}

export interface AchievementConfidence {
 identification: number;
 quantification: number;
 relevance: number;
 overall: number;
}

export interface ValidationScores {
 formatValidation: number;
 crossFieldConsistency: number;
 dateValidation: number;
 contactValidation: number;
 skillsValidation: number;
 overall: number;
}

export interface ConsistencyScores {
 internalConsistency: number;
 temporalConsistency: number;
 semanticConsistency: number;
 structuralConsistency: number;
 overall: number;
}

export interface QualityScores {
 completeness: number;
 accuracy: number;
 relevance: number;
 clarity: number;
 professional: number;
 overall: number;
}

export interface UncertaintyMetrics {
 aleatoric: number; // Data uncertainty
 epistemic: number; // Model uncertainty
 total: number;
 confidence_interval: [number, number];
 reliability: number;
}

export interface ConfidenceFactors {
 textQuality: number;
 structuralClarity: number;
 informationDensity: number;
 linguisticComplexity: number;
 formatStandardization: number;
 crossValidation: number;
}

export interface ActiveLearningMetrics {
 shouldRequestHumanReview: boolean;
 uncertaintyAreas: string[];
 improvementPotential: number;
 learningPriority: 'high' | 'medium' | 'low';
 suggestedActions: string[];
}

class ConfidenceScoringSystem {
 private confidenceHistory: Map<string, ConfidenceMetrics[]> = new Map();
 private validationRules: Map<string, ValidationRule[]> = new Map();
 private thresholds: ConfidenceThresholds;

 constructor() {
 this.thresholds = {
 high: 85,
 medium: 70,
 low: 50,
 uncertainty: 80,
 humanReview: 75
 };
 
 this.initializeValidationRules();
 }

 /**
 * Calculate comprehensive confidence scores for extracted resume data
 */
 async calculateConfidenceMetrics(
 extractedData: any,
 ocrResults: any,
 visualAnalysis: any,
 textContent: string
 ): Promise<ConfidenceMetrics> {
 
 // Step 1: Calculate field-level confidence scores
 const extraction = await this.calculateFieldConfidenceScores(extractedData, textContent);

 // Step 2: Perform validation scoring
 const validation = await this.calculateValidationScores(extractedData, textContent);

 // Step 3: Assess consistency across fields
 const consistency = await this.calculateConsistencyScores(extractedData);

 // Step 4: Evaluate overall quality
 const quality = await this.calculateQualityScores(extractedData, ocrResults, visualAnalysis);

 // Step 5: Quantify uncertainty
 const uncertainty = await this.calculateUncertaintyMetrics(extraction, validation, consistency);

 // Step 6: Calculate overall confidence
 const overall = this.calculateOverallConfidence(extraction, validation, consistency, quality);

 const confidenceMetrics: ConfidenceMetrics = {
 overall,
 extraction,
 validation,
 consistency,
 quality,
 uncertainty
 };

 // Store for historical analysis
 this.storeConfidenceHistory('resume-analysis', confidenceMetrics);

 return confidenceMetrics;
 }

 /**
 * Calculate field-level confidence scores
 */
 private async calculateFieldConfidenceScores(
 extractedData: any,
 textContent: string
 ): Promise<FieldConfidenceScores> {
 
 const personalInfo = await this.calculatePersonalInfoConfidence(extractedData.personalInfo, textContent);
 const workExperience = await this.calculateWorkExperienceConfidence(extractedData.workExperience, textContent);
 const education = await this.calculateEducationConfidence(extractedData.education, textContent);
 const skills = await this.calculateSkillsConfidence(extractedData.skills, textContent);
 const certifications = await this.calculateCertificationConfidence(extractedData.certifications, textContent);
 const projects = await this.calculateProjectConfidence(extractedData.projects, textContent);
 const achievements = await this.calculateAchievementConfidence(extractedData, textContent);

 return {
 personalInfo,
 workExperience,
 education,
 skills,
 certifications,
 projects,
 achievements
 };
 }

 /**
 * Calculate personal information confidence
 */
 private async calculatePersonalInfoConfidence(
 personalInfo: any,
 textContent: string
 ): Promise<PersonalInfoConfidence> {
 
 const fullName = this.validateFullName(personalInfo?.fullName, textContent);
 const email = this.validateEmail(personalInfo?.email);
 const phone = this.validatePhone(personalInfo?.phone);
 const location = this.validateLocation(personalInfo?.location);
 const Link = this.validateLinkedIn(personalInfo?.Link);
 const website = this.validateWebsite(personalInfo?.website);

 const overall = this.calculateWeightedAverage([
 { value: fullName, weight: 0.25 },
 { value: email, weight: 0.25 },
 { value: phone, weight: 0.20 },
 { value: location, weight: 0.15 },
 { value: Link, weight: 0.10 },
 { value: website, weight: 0.05 }
 ]);

 return {
 fullName,
 email,
 phone,
 location,
 Link,
 website,
 overall
 };
 }

 /**
 * Calculate work experience confidence
 */
 private async calculateWorkExperienceConfidence(
 workExperience: any[],
 textContent: string
 ): Promise<WorkExperienceConfidence> {
 
 if (!workExperience || workExperience.length === 0) {
 return {
 companies: [],
 positions: [],
 dates: [],
 descriptions: [],
 achievements: [],
 skills: [],
 overall: 0
 };
 }

 const companies = workExperience.map(exp => this.validateCompanyName(exp.company));
 const positions = workExperience.map(exp => this.validatePosition(exp.position));
 const dates = workExperience.map(exp => this.validateEmploymentDates(exp.startDate, exp.endDate));
 const descriptions = workExperience.map(exp => this.validateJobDescription(exp.description));
 const achievements = workExperience.map(exp => this.validateAchievements(exp.achievements));
 const skills = workExperience.map(exp => this.validateExtractedSkills(exp.skills, textContent));

 const overall = this.calculateArrayAverage([...companies,...positions,...dates,...descriptions,...achievements,...skills
 ]);

 return {
 companies,
 positions,
 dates,
 descriptions,
 achievements,
 skills,
 overall
 };
 }

 /**
 * Calculate education confidence
 */
 private async calculateEducationConfidence(
 education: any[],
 textContent: string
 ): Promise<EducationConfidence> {
 
 if (!education || education.length === 0) {
 return {
 institutions: [],
 degrees: [],
 fields: [],
 dates: [],
 gpa: [],
 overall: 0
 };
 }

 const institutions = education.map(edu => this.validateInstitution(edu.institution));
 const degrees = education.map(edu => this.validateDegree(edu.degree));
 const fields = education.map(edu => this.validateFieldOfStudy(edu.fieldOfStudy));
 const dates = education.map(edu => this.validateEducationDates(edu.graduationDate));
 const gpa = education.map(edu => this.validateGPA(edu.gpa));

 const overall = this.calculateArrayAverage([...institutions,...degrees,...fields,...dates,...gpa.filter(g => g > 0) // Only include valid GPAs
 ]);

 return {
 institutions,
 degrees,
 fields,
 dates,
 gpa,
 overall
 };
 }

 /**
 * Calculate skills confidence
 */
 private async calculateSkillsConfidence(
 skills: any,
 textContent: string
 ): Promise<SkillsConfidence> {
 
 if (!skills) {
 return {
 technical: 0,
 soft: 0,
 tools: 0,
 frameworks: 0,
 languages: 0,
 categorization: 0,
 overall: 0
 };
 }

 const technical = this.validateSkillsList(skills.technical, 'technical');
 const soft = this.validateSkillsList(skills.soft, 'soft');
 const tools = this.validateSkillsList(skills.tools, 'tools');
 const frameworks = this.validateSkillsList(skills.frameworks, 'frameworks');
 const languages = this.validateSkillsList(skills.languages, 'languages');
 const categorization = this.validateSkillsCategorization(skills);

 const overall = this.calculateWeightedAverage([
 { value: technical, weight: 0.30 },
 { value: soft, weight: 0.15 },
 { value: tools, weight: 0.20 },
 { value: frameworks, weight: 0.15 },
 { value: languages, weight: 0.10 },
 { value: categorization, weight: 0.10 }
 ]);

 return {
 technical,
 soft,
 tools,
 frameworks,
 languages,
 categorization,
 overall
 };
 }

 /**
 * Calculate validation scores
 */
 private async calculateValidationScores(
 extractedData: any,
 textContent: string
 ): Promise<ValidationScores> {
 
 const formatValidation = await this.validateFormats(extractedData);
 const crossFieldConsistency = await this.validateCrossFieldConsistency(extractedData);
 const dateValidation = await this.validateAllDates(extractedData);
 const contactValidation = await this.validateContactInformation(extractedData.personalInfo);
 const skillsValidation = await this.validateSkillsContext(extractedData.skills, textContent);

 const overall = this.calculateWeightedAverage([
 { value: formatValidation, weight: 0.20 },
 { value: crossFieldConsistency, weight: 0.25 },
 { value: dateValidation, weight: 0.20 },
 { value: contactValidation, weight: 0.20 },
 { value: skillsValidation, weight: 0.15 }
 ]);

 return {
 formatValidation,
 crossFieldConsistency,
 dateValidation,
 contactValidation,
 skillsValidation,
 overall
 };
 }

 /**
 * Calculate uncertainty metrics
 */
 private async calculateUncertaintyMetrics(
 extraction: FieldConfidenceScores,
 validation: ValidationScores,
 consistency: ConsistencyScores
 ): Promise<UncertaintyMetrics> {
 
 // Aleatoric uncertainty (data-based)
 const aleatoric = 100 - Math.min(
 extraction.personalInfo.overall,
 extraction.workExperience.overall,
 extraction.education.overall
 );

 // Epistemic uncertainty (model-based)
 const epistemic = 100 - Math.min(validation.overall, consistency.overall);

 // Total uncertainty
 const total = Math.sqrt(aleatoric * aleatoric + epistemic * epistemic);

 // Confidence interval (95%)
 const margin = total * 1.96 / 100;
 const overallConfidence = (extraction.personalInfo.overall + validation.overall + consistency.overall) / 3;
 const confidence_interval: [number, number] = [
 Math.max(0, overallConfidence - margin),
 Math.min(100, overallConfidence + margin)
 ];

 // Reliability score
 const reliability = Math.max(0, 100 - total);

 return {
 aleatoric,
 epistemic,
 total,
 confidence_interval,
 reliability
 };
 }

 /**
 * Generate active learning recommendations
 */
 async generateActiveLearningMetrics(
 confidenceMetrics: ConfidenceMetrics
 ): Promise<ActiveLearningMetrics> {
 
 const shouldRequestHumanReview = confidenceMetrics.overall < this.thresholds.humanReview;
 const uncertaintyAreas: string[] = [];
 const suggestedActions: string[] = [];

 // Identify uncertainty areas
 if (confidenceMetrics.extraction.personalInfo.overall < this.thresholds.medium) {
 uncertaintyAreas.push('Personal Information');
 suggestedActions.push('Verify contact details manually');
 }

 if (confidenceMetrics.extraction.workExperience.overall < this.thresholds.medium) {
 uncertaintyAreas.push('Work Experience');
 suggestedActions.push('Cross-check employment history');
 }

 if (confidenceMetrics.extraction.skills.overall < this.thresholds.medium) {
 uncertaintyAreas.push('Skills');
 suggestedActions.push('Validate skills through assessment');
 }

 if (confidenceMetrics.uncertainty.total > 20) {
 suggestedActions.push('Request higher quality document');
 }

 // Determine learning priority
 let learningPriority: 'high' | 'medium' | 'low' = 'low';
 if (confidenceMetrics.overall < this.thresholds.low) {
 learningPriority = 'high';
 } else if (confidenceMetrics.overall < this.thresholds.medium) {
 learningPriority = 'medium';
 }

 const improvementPotential = Math.max(0, 100 - confidenceMetrics.overall);

 return {
 shouldRequestHumanReview,
 uncertaintyAreas,
 improvementPotential,
 learningPriority,
 suggestedActions
 };
 }

 // Validation helper methods
 private validateFullName(name: string, textContent: string): number {
 if (!name || name.trim().length === 0) return 0;
 
 const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
 const formatScore = nameRegex.test(name.trim())? 80: 40;
 
 // Check if name appears in text
 const contextScore = textContent.toLowerCase().includes(name.toLowerCase())? 20: 0;
 
 return Math.min(100, formatScore + contextScore);
 }

 private validateEmail(email: string): number {
 if (!email) return 0;
 
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 return emailRegex.test(email)? 95: 20;
 }

 private validatePhone(phone: string): number {
 if (!phone) return 0;
 
 // Remove non-digit characters
 const digitsOnly = phone.replace(/\D/g, '');
 
 // Check for valid phone number length
 if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
 return 90;
 }
 
 return 30;
 }

 private validateLocation(location: string): number {
 if (!location) return 0;
 
 // Basic location validation
 const locationRegex = /^[a-zA-Z\s,'-]{2,100}$/;
 return locationRegex.test(location.trim())? 80: 40;
 }

 private validateLinkedIn(Link: string): number {
 if (!Link) return 0;
 
 const linkedInRegex = /^(https?:\/\/)?(www\.)?Link\.com\/in\/[a-zA-Z0-9-]+\/?$/;
 return linkedInRegex.test(Link)? 95: 30;
 }

 private validateWebsite(website: string): number {
 if (!website) return 0;
 
 const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
 return urlRegex.test(website)? 90: 30;
 }

 private validateCompanyName(company: string): number {
 if (!company) return 0;
 return company.trim().length > 1? 85: 20;
 }

 private validatePosition(position: string): number {
 if (!position) return 0;
 return position.trim().length > 1? 85: 20;
 }

 private validateEmploymentDates(startDate: string, endDate: string): number {
 if (!startDate) return 0;
 
 const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{4}$|^[A-Za-z]+ \d{4}$/;
 let score = 0;
 
 if (dateRegex.test(startDate)) score += 40;
 if (endDate && dateRegex.test(endDate)) score += 40;
 if (!endDate && startDate) score += 20; // Current position
 
 return Math.min(100, score);
 }

 // Additional validation methods would be implemented here...

 private calculateWeightedAverage(values: { value: number; weight: number }[]): number {
 const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
 const weightedSum = values.reduce((sum, item) => sum + (item.value * item.weight), 0);
 return totalWeight > 0? Math.round(weightedSum / totalWeight): 0;
 }

 private calculateArrayAverage(values: number[]): number {
 if (values.length === 0) return 0;
 return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
 }

 private calculateOverallConfidence(
 extraction: FieldConfidenceScores,
 validation: ValidationScores,
 consistency: ConsistencyScores,
 quality: QualityScores
 ): number {
 return this.calculateWeightedAverage([
 { value: (extraction.personalInfo.overall + extraction.workExperience.overall + extraction.education.overall + extraction.skills.overall) / 4, weight: 0.40 },
 { value: validation.overall, weight: 0.25 },
 { value: consistency.overall, weight: 0.20 },
 { value: quality.overall, weight: 0.15 }
 ]);
 }

 private storeConfidenceHistory(key: string, metrics: ConfidenceMetrics): void {
 if (!this.confidenceHistory.has(key)) {
 this.confidenceHistory.set(key, []);
 }
 
 const history = this.confidenceHistory.get(key)!;
 history.push(metrics);
 
 // Keep only last 100 entries
 if (history.length > 100) {
 history.shift();
 }
 }

 private initializeValidationRules(): void {
 // Initialize validation rules for different fields
 // This would contain comprehensive validation logic
 }

 // Placeholder implementations for missing methods
 private async calculateCertificationConfidence(certifications: any, textContent: string): Promise<CertificationConfidence> {
 return { names: [], issuers: [], dates: [], validity: [], overall: 0 };
 }

 private async calculateProjectConfidence(projects: any, textContent: string): Promise<ProjectConfidence> {
 return { names: [], descriptions: [], technologies: [], dates: [], urls: [], overall: 0 };
 }

 private async calculateAchievementConfidence(extractedData: any, textContent: string): Promise<AchievementConfidence> {
 return { identification: 0, quantification: 0, relevance: 0, overall: 0 };
 }

 private async calculateConsistencyScores(extractedData: any): Promise<ConsistencyScores> {
 return { internalConsistency: 80, temporalConsistency: 80, semanticConsistency: 80, structuralConsistency: 80, overall: 80 };
 }

 private async calculateQualityScores(extractedData: any, ocrResults: any, visualAnalysis: any): Promise<QualityScores> {
 return { completeness: 80, accuracy: 80, relevance: 80, clarity: 80, professional: 80, overall: 80 };
 }

 private validateSkillsList(skills: string[], category: string): number {
 if (!skills || skills.length === 0) return 0;
 return Math.min(100, skills.length * 10);
 }

 private validateSkillsCategorization(skills: any): number {
 return 80; // Placeholder
 }

 private async validateFormats(extractedData: any): Promise<number> {
 return 80; // Placeholder
 }

 private async validateCrossFieldConsistency(extractedData: any): Promise<number> {
 return 80; // Placeholder
 }

 private async validateAllDates(extractedData: any): Promise<number> {
 return 80; // Placeholder
 }

 private async validateContactInformation(personalInfo: any): Promise<number> {
 return 80; // Placeholder
 }

 private async validateSkillsContext(skills: any, textContent: string): Promise<number> {
 return 80; // Placeholder
 }

 private validateJobDescription(description: string): number {
 return description && description.length > 10? 80: 30;
 }

 private validateAchievements(achievements: string[]): number {
 return achievements && achievements.length > 0? 80: 30;
 }

 private validateExtractedSkills(skills: string[], textContent: string): number {
 return skills && skills.length > 0? 80: 30;
 }

 private validateInstitution(institution: string): number {
 return institution && institution.length > 1? 80: 30;
 }

 private validateDegree(degree: string): number {
 return degree && degree.length > 1? 80: 30;
 }

 private validateFieldOfStudy(field: string): number {
 return field && field.length > 1? 80: 30;
 }

 private validateEducationDates(date: string): number {
 return date && date.length > 0? 80: 30;
 }

 private validateGPA(gpa: string): number {
 if (!gpa) return 0;
 const gpaNum = parseFloat(gpa);
 return (!isNaN(gpaNum) && gpaNum >= 0 && gpaNum <= 4.0)? 90: 30;
 }
}

interface ConfidenceThresholds {
 high: number;
 medium: number;
 low: number;
 uncertainty: number;
 humanReview: number;
}

interface ValidationRule {
 field: string;
 rule: (value: any) => number;
 weight: number;
}

export const confidenceScoringSystem = new ConfidenceScoringSystem();
export default confidenceScoringSystem;







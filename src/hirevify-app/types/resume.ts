export interface ResumeSection {
 id: string;
 type: 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'achievements';
 title: string;
 content: unknown;
 order: number;
}

export interface WorkExperience {
 id: string;
 company: string;
 position: string;
 location?: string;
 startDate: string;
 endDate?: string;
 isCurrent: boolean;
 description: string;
 achievements: string[];
 skills: string[];
}

export interface Education {
 id: string;
 institution: string;
 degree: string;
 field: string;
 graduationDate?: string;
 gpa?: number;
 location?: string;
 achievements: string[];
}

export interface ResumeData {
 personalInfo: {
 name: string;
 email: string;
 phone: string;
 location: string;
 Link?: string;
 GitBranch?: string;
 portfolio?: string;
 };
 summary: string;
 experience: WorkExperience[];
 education: Education[];
 skills: {
 technical: string[];
 soft: string[];
 languages: string[];
 };
 projects: Array<{
 id: string;
 name: string;
 description: string;
 technologies: string[];
 link?: string;
 achievements: string[];
 }>;
 certifications: Array<{
 id: string;
 name: string;
 issuer: string;
 date: string;
 expiryDate?: string;
 credentialId?: string;
 }>;
 sections: ResumeSection[];
}

export interface JobDescription {
 title: string;
 company: string;
 description: string;
 requirements: string[];
 preferredSkills: string[];
 responsibilities: string[];
 experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
 industry: string;
 location?: string;
 remote: boolean;
}

export interface ATSScore {
 overall: number;
 breakdown: {
 formatting: number;
 keywords: number;
 readability: number;
 completeness: number;
 atsCompatibility: number;
 };
 recommendations: string[];
 criticalIssues: string[];
 strengths: string[];
 missingKeywords: string[];
 optimalKeywords: string[];
 sectionScores: Record<string, number>;
}

export interface ResumeOptimizationSuggestion {
 id: string;
 type: 'content' | 'formatting' | 'keyword' | 'structure' | 'achievement';
 priority: 'high' | 'medium' | 'low';
 section: string;
 current: string;
 suggested: string;
 reason: string;
 impact: string;
 examples?: string[];
}

export interface SkillsAnalysis {
 matchedSkills: string[];
 missingSkills: string[];
 skillGaps: Array<{
 skill: string;
 importance: 'critical' | 'important' | 'nice-to-have';
 suggestions: string[];
 }>;
 strengthAreas: string[];
 developmentAreas: string[];
 recommendedCertifications: string[];
}

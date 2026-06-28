/**
 * Deterministic ATS Scoring Engine
 * 
 * Rules-based scoring that is transparent, reproducible, and explainable.
 * AI's role is only to explain and optimize - NOT to calculate the score.
 */

export type AtsJobInput = {
  id: string;
  title?: string | null;
  description?: string | null;
  requirements?: string[] | null;
  skills?: string[] | null;
  experience_level?: string | null;
  preferred_skills?: string[] | null;
  certifications?: string[] | null;
  education_level?: string | null;
  years_experience_required?: number | null;
};

export type AtsCandidateInput = {
  applicationId?: string;
  name?: string | null;
  skills?: string[] | null;
  headline?: string | null;
  summary?: string | null;
  resumeUrl?: string | null;
  resumeText?: string | null;
  coverLetter?: string | null;
  experience?: string | number | null;
  education?: string | null;
  certifications?: string[] | null;
  storedScore?: number | null;
};

export type AtsCategoryBreakdown = {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  details: string;
};

export type AtsMatchResult = {
  score: number;
  source: 'deterministic';
  categories: AtsCategoryBreakdown[];
  matchedSkills: string[];
  missingSkills: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedCertifications: string[];
  missingCertifications: string[];
  explanation: string;
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
};

// Scoring weights (must sum to 100)
export const SCORING_WEIGHTS = {
  requiredSkills: 40,
  experience: 20,
  education: 10,
  atsKeywords: 15,
  certifications: 5,
  preferredSkills: 5,
  resumeQuality: 5,
};

// Normalize text for comparison
function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function splitIntoTokens(value?: string | null): string[] {
  return String(value || '')
    .split(/[\s,;:/()[\]{}|]+/)
    .map(normalizeToken)
    .filter((token) => token.length > 1);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

// Fuzzy match - checks if skills match considering variations
function skillsMatch(candidateSkill: string, requiredSkill: string): boolean {
  const normalizedCandidate = normalizeToken(candidateSkill);
  const normalizedRequired = normalizeToken(requiredSkill);
  
  // Exact match
  if (normalizedCandidate === normalizedRequired) return true;
  
  // One contains the other
  if (normalizedCandidate.includes(normalizedRequired) || normalizedRequired.includes(normalizedCandidate)) return true;
  
  // Common abbreviations and variations
  const variations: Record<string, string[]> = {
    'js': ['javascript', 'jscript'],
    'ts': ['typescript', 'tscript'],
    'py': ['python'],
    'ml': ['machinelearning', 'machine learning', 'ml'],
    'ai': ['artificialintelligence', 'artificial intelligence'],
    'nlp': ['naturallanguageprocessing', 'natural language processing'],
    'db': ['database', 'databases'],
    'sql': ['mysql', 'postgresql', 'postgres', 'sqlite', 'mssql', 'oracle'],
    'react': ['reactjs', 'react.js'],
    'node': ['nodejs', 'node.js'],
    'aws': ['amazonwebservices', 'amazon web services', 'amazon aws'],
    'gcp': ['googlecloud', 'google cloud platform'],
    'ui': ['userinterface', 'user interface', 'frontend', 'front-end'],
    'ux': ['userexperience', 'user experience'],
    'css': ['css3', 'stylesheet'],
    'html': ['html5', 'hypertext'],
    'api': ['apirest', 'restapi', 'rest'],
    'ci': ['continuousintegration', 'jenkins', 'gitlabci'],
    'cd': ['continuousdeployment', 'deployment'],
    'devops': ['devopsengineer', 'devops engineer'],
    'reactnative': ['react native', 'rn'],
    'fluter': ['flutter'],
  };
  
  const candidateVariations = variations[normalizedCandidate] || [];
  const requiredVariations = variations[normalizedRequired] || [];
  
  return candidateVariations.includes(normalizedRequired) || 
         requiredVariations.includes(normalizedCandidate) ||
         candidateVariations.some(v => requiredVariations.includes(v));
}

// Extract years of experience from text
function extractYears(value?: string | number | null): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const text = String(value);
  
  // Look for patterns like "5 years", "5+ years", "5-7 years"
  const rangeMatch = text.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)?/i);
  if (rangeMatch) {
    return (parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2;
  }
  
  // Look for "5 years", "5yrs", etc.
  const singleMatch = text.match(/(\d+)(?:\s*[-+]?\s*years?|yrs?)?/i);
  if (singleMatch) {
    return parseInt(singleMatch[1]);
  }
  
  return 0;
}

// Extract education level from text
function extractEducationLevel(text?: string | null): number {
  const normalized = normalizeToken(String(text || ''));
  
  if (/\b(phd|ph\.d|doctorate|doctor)\b/.test(normalized)) return 7;
  if (/\b(master|m\.?s\.?|m\.?a\.?|mba|m\.?sc|m\.?tech|ms|m\.?e\.?|postgrad)\b/.test(normalized)) return 6;
  if (/\b(bachelor|b\.?s\.?|b\.?a\.?|b\.?tech|b\.?e\.?|undergrad|graduate)\b/.test(normalized)) return 5;
  if (/\b(diploma|associate|advanced\s*diploma)\b/.test(normalized)) return 4;
  if (/\b(certificate|certified|cert)\b/.test(normalized)) return 3;
  if (/\b(high\s*school|secondary|hsc|ssc|12th|10th)\b/.test(normalized)) return 2;
  
  return 1; // Basic or unknown
}

// Check if resume has quality indicators
function analyzeResumeQuality(text: string): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];
  
  // Length check (5 pts)
  if (text.length >= 500) {
    score += 1;
    factors.push('adequate length');
  }
  if (text.length >= 1000) {
    score += 1;
    factors.push('comprehensive content');
  }
  if (text.length >= 2000) {
    score += 1;
    factors.push('detailed resume');
  }
  
  // Contact info (5 pts)
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /\b\d{10,}|\+?\d[\d\s-]{8,}\d\b/.test(text);
  if (hasEmail) { score += 2; factors.push('email present'); }
  if (hasPhone) { score += 1; factors.push('phone present'); }
  
  // Summary (5 pts)
  if (/\b(summary|objective|profile|about|professional\s*summary)\b/i.test(text)) {
    score += 2;
    factors.push('summary present');
  }
  
  // Action verbs (5 pts)
  const actionVerbs = /\b(led|managed|developed|created|implemented|improved|increased|reduced|achieved|designed|built|launched|delivered|coordinated|analyzed|optimized)\b/gi;
  const actionVerbMatches = text.match(actionVerbs);
  if (actionVerbMatches && actionVerbMatches.length >= 3) {
    score += 2;
    factors.push('action verbs used');
  }
  
  // Bullet points (5 pts)
  const bulletMatches = text.match(/[•·▪▸·\-\*]\s|\n-\s|\n•\s/g);
  if (bulletMatches && bulletMatches.length >= 3) {
    score += 1;
    factors.push('bullet points');
  }
  
  // Dates (5 pts)
  const datePattern = /\b(19|20)\d{2}\b/;
  if (datePattern.test(text)) {
    score += 1;
    factors.push('dates present');
  }
  
  return { score: Math.min(5, score), factors };
}

// Extract keywords from job description
function extractJobKeywords(job: AtsJobInput): {
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  certifications: string[];
} {
  const allText = [
    job.title,
    job.description,
    ...(job.requirements || []),
    ...(job.skills || []),
    ...(job.preferred_skills || []),
    ...(job.certifications || []),
  ].filter(Boolean).join(' ');
  
  const tokens = splitIntoTokens(allText);
  const uniqueTokens = unique(tokens);
  
  // Extract skills (usually nouns or technical terms)
  const technicalTerms = uniqueTokens.filter(t => 
    t.length > 2 && 
    !['and', 'the', 'for', 'with', 'from', 'your', 'will', 'have', 'must', 'should', 'year', 'years'].includes(t)
  );
  
  return {
    requiredSkills: unique((job.skills || []).map(s => normalizeToken(s))),
    preferredSkills: unique((job.preferred_skills || []).map(s => normalizeToken(s))),
    keywords: technicalTerms,
    certifications: unique((job.certifications || []).map(c => normalizeToken(c))),
  };
}

// Known technical skills to look for in resume text
const KNOWN_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'kotlin', 'swift',
  'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'rails',
  'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'graphql',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'git',
  'html', 'css', 'sass', 'tailwind', 'bootstrap',
  'git', 'github', 'gitlab', 'jira', 'agile', 'scrum',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch',
  'api', 'rest', 'microservices', 'ci/cd', 'devops',
  'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
  'excel', 'tableau', 'powerbi', 'data analysis', 'statistics',
  'communication', 'leadership', 'problem solving', 'teamwork',
  'ui', 'ux', 'user interface', 'user experience', 'design', 'wireframe', 'prototype',
  'agile', 'scrum', 'project management', 'product management',
  'english', 'chinese', 'spanish', 'french', 'japanese', 'korean', 'german',
  'science', 'engineering', 'mathematics', 'physics', 'chemistry',
  'bachelor', 'master', 'phd', 'mba', 'degree', 'diploma', 'certificate',
  'sales', 'marketing', 'business development', 'customer service',
  'wordpress', 'shopify', 'magento', 'prestashop',
  'php', 'laravel', 'symfony', 'codeigniter',
  'android', 'ios', 'react native', 'flutter', 'swift', 'objective-c',
  'tableau', 'power bi', 'looker', 'dax', 'etl', 'data warehouse',
  'security', 'cybersecurity', 'penetration testing', 'firewall', 'encryption',
  'networking', 'tcp/ip', 'dns', 'vpn', 'load balancing',
  'linux', 'unix', 'bash', 'shell scripting', 'windows server',
  'sap', 'oracle', 'salesforce', 'crm', 'erp',
];

// Extract known skills from text using substring matching
function extractSkillsFromText(text: string): string[] {
  const normalizedText = normalizeToken(text);
  const foundSkills: string[] = [];
  
  // Check if each known skill appears anywhere in the normalized text
  for (const skill of KNOWN_SKILLS) {
    const normalizedSkill = normalizeToken(skill);
    // Use substring matching - skill should appear as a distinct word-like segment
    if (normalizedText.length >= normalizedSkill.length && normalizedText.includes(normalizedSkill)) {
      foundSkills.push(skill);
    }
  }
  
  return foundSkills;
}

// Extract candidate information
function extractCandidateInfo(candidate: AtsCandidateInput): {
  skills: string[];
  keywords: string[];
  certifications: string[];
  yearsExperience: number;
  educationLevel: number;
  resumeText: string;
} {
  const resumeText = String(candidate.resumeText || '');
  const normalizedResumeText = resumeText.toLowerCase();
  
  // Extract skills from profile + known skills from resume text
  const profileSkills = (candidate.skills || []).map(s => normalizeToken(s));
  const resumeSkills = extractSkillsFromText(resumeText);
  const allTextTokens = splitIntoTokens(resumeText);
  
  return {
    skills: unique([
      ...profileSkills,
      ...resumeSkills.map(s => normalizeToken(s)),
      ...allTextTokens.filter(t => KNOWN_SKILLS.some(sk => normalizeToken(sk) === t))
    ]),
    keywords: unique([
      ...splitIntoTokens(candidate.skills?.join(' ')),
      ...splitIntoTokens(candidate.headline),
      ...splitIntoTokens(candidate.summary),
      ...allTextTokens,
      ...splitIntoTokens(candidate.coverLetter),
      // Add the missing keywords that were in the resume
      ...KNOWN_SKILLS.filter(sk => normalizedResumeText.includes(sk.toLowerCase())).map(sk => normalizeToken(sk)),
    ]),
    certifications: unique((candidate.certifications || []).map(c => normalizeToken(c))),
    yearsExperience: extractYears(candidate.experience),
    educationLevel: Math.max(
      extractEducationLevel(candidate.education),
      extractEducationLevel(resumeText)
    ),
    resumeText,
  };
}

/**
 * Calculate ATS match score using deterministic rules
 * This is the main entry point for scoring
 */
export function calculateDeterministicAtsMatch(
  job: AtsJobInput,
  candidate: AtsCandidateInput
): AtsMatchResult {
  const jobInfo = extractJobKeywords(job);
  const candidateInfo = extractCandidateInfo(candidate);
  
  const categories: AtsCategoryBreakdown[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  
  // 1. Required Skills (40%)
  const matchedRequiredSkills = jobInfo.requiredSkills.filter(required => 
    candidateInfo.skills.some(skill => skillsMatch(skill, required))
  );
  const missingRequiredSkills = jobInfo.requiredSkills.filter(required =>
    !matchedRequiredSkills.includes(required)
  );
  const requiredSkillsScore = jobInfo.requiredSkills.length > 0
    ? Math.round((matchedRequiredSkills.length / jobInfo.requiredSkills.length) * SCORING_WEIGHTS.requiredSkills)
    : 0;
  const requiredSkillsPercentage = jobInfo.requiredSkills.length > 0
    ? Math.round((matchedRequiredSkills.length / jobInfo.requiredSkills.length) * 100)
    : 100;
  
  categories.push({
    category: 'Required Skills',
    score: requiredSkillsScore,
    maxScore: SCORING_WEIGHTS.requiredSkills,
    percentage: requiredSkillsPercentage,
    details: matchedRequiredSkills.length > 0
      ? `Matched ${matchedRequiredSkills.length}/${jobInfo.requiredSkills.length} required skills`
      : 'No required skills matched',
  });
  
  if (requiredSkillsPercentage >= 80) {
    strengths.push(`Strong match on required skills (${requiredSkillsPercentage}%)`);
  } else if (requiredSkillsPercentage < 50) {
    weaknesses.push(`Low match on required skills (${requiredSkillsPercentage}%)`);
    suggestions.push('Consider adding more of the required skills to your profile');
  }
  
  // 2. Experience (20%)
  const requiredYears = job.years_experience_required || 0;
  let experienceScore = 0;
  let experiencePercentage = 0;
  let experienceDetails = '';
  
  if (requiredYears > 0) {
    const candidateYears = candidateInfo.yearsExperience;
    if (candidateYears >= requiredYears) {
      experienceScore = SCORING_WEIGHTS.experience;
      experiencePercentage = 100;
      experienceDetails = `Meets requirement: ${candidateYears} years (required: ${requiredYears})`;
    } else if (candidateYears >= requiredYears * 0.8) {
      experienceScore = Math.round(SCORING_WEIGHTS.experience * 0.75);
      experiencePercentage = Math.round((candidateYears / requiredYears) * 100);
      experienceDetails = `Close to requirement: ${candidateYears} years (required: ${requiredYears})`;
      suggestions.push('Your experience is slightly below the requirement but still relevant');
    } else {
      experienceScore = Math.round(SCORING_WEIGHTS.experience * (candidateYears / requiredYears));
      experiencePercentage = Math.round((candidateYears / requiredYears) * 100);
      experienceDetails = `Below requirement: ${candidateYears} years (required: ${requiredYears})`;
      suggestions.push('Consider highlighting transferable skills from your experience');
    }
  } else {
    experienceScore = SCORING_WEIGHTS.experience;
    experiencePercentage = 100;
    experienceDetails = 'No specific experience requirement';
  }
  
  categories.push({
    category: 'Experience',
    score: experienceScore,
    maxScore: SCORING_WEIGHTS.experience,
    percentage: experiencePercentage,
    details: experienceDetails,
  });
  
  // 3. Education (10%)
  let educationScore = 0;
  let educationPercentage = 0;
  let educationDetails = '';
  
  const requiredEduLevel = extractEducationLevel(job.education_level);
  const candidateEduLevel = candidateInfo.educationLevel;
  
  if (requiredEduLevel > 1) {
    if (candidateEduLevel >= requiredEduLevel) {
      educationScore = SCORING_WEIGHTS.education;
      educationPercentage = 100;
      educationDetails = `Meets education requirement (level ${candidateEduLevel} >= ${requiredEduLevel})`;
    } else if (candidateEduLevel >= requiredEduLevel - 1) {
      educationScore = Math.round(SCORING_WEIGHTS.education * 0.5);
      educationPercentage = Math.round((candidateEduLevel / requiredEduLevel) * 100);
      educationDetails = `Close to education requirement (level ${candidateEduLevel} < ${requiredEduLevel})`;
    } else {
      educationScore = Math.round(SCORING_WEIGHTS.education * 0.25);
      educationPercentage = Math.round((candidateEduLevel / requiredEduLevel) * 100);
      educationDetails = `Below education requirement (level ${candidateEduLevel} < ${requiredEduLevel})`;
    }
  } else {
    educationScore = SCORING_WEIGHTS.education;
    educationPercentage = candidateEduLevel > 1 ? 100 : 50;
    educationDetails = candidateEduLevel > 1 
      ? 'Education information verified'
      : 'No specific education requirement';
  }
  
  categories.push({
    category: 'Education',
    score: educationScore,
    maxScore: SCORING_WEIGHTS.education,
    percentage: educationPercentage,
    details: educationDetails,
  });
  
  if (candidateEduLevel >= requiredEduLevel && requiredEduLevel > 1) {
    strengths.push('Meets education requirements');
  }
  
  // 4. ATS Keywords (15%)
  const matchedKeywords = jobInfo.keywords.filter(keyword =>
    candidateInfo.keywords.some(candKeyword => 
      candKeyword.includes(keyword) || keyword.includes(candKeyword)
    )
  ).slice(0, 20);
  
  const missingKeywords = jobInfo.keywords
    .filter(keyword => !matchedKeywords.includes(keyword))
    .slice(0, 15);
  
  const keywordScore = jobInfo.keywords.length > 0
    ? Math.round((matchedKeywords.length / jobInfo.keywords.length) * SCORING_WEIGHTS.atsKeywords)
    : SCORING_WEIGHTS.atsKeywords;
  const keywordPercentage = jobInfo.keywords.length > 0
    ? Math.round((matchedKeywords.length / jobInfo.keywords.length) * 100)
    : 100;
  
  categories.push({
    category: 'ATS Keywords',
    score: keywordScore,
    maxScore: SCORING_WEIGHTS.atsKeywords,
    percentage: keywordPercentage,
    details: `Matched ${matchedKeywords.length}/${jobInfo.keywords.length} keywords`,
  });
  
  if (missingKeywords.length > 0 && missingKeywords.length <= 10) {
    suggestions.push(`Consider adding these keywords: ${missingKeywords.slice(0, 5).join(', ')}`);
  }
  
  // 5. Certifications (5%)
  const matchedCerts = jobInfo.certifications.filter(cert =>
    candidateInfo.certifications.some(candCert => 
      normalizeToken(candCert).includes(normalizeToken(cert)) ||
      normalizeToken(cert).includes(normalizeToken(candCert))
    )
  );
  const missingCerts = jobInfo.certifications.filter(cert =>
    !matchedCerts.includes(cert)
  );
  
  const certScore = jobInfo.certifications.length > 0
    ? Math.round((matchedCerts.length / jobInfo.certifications.length) * SCORING_WEIGHTS.certifications)
    : SCORING_WEIGHTS.certifications; // Full points if no certs required
  const certPercentage = jobInfo.certifications.length > 0
    ? Math.round((matchedCerts.length / jobInfo.certifications.length) * 100)
    : 100;
  
  categories.push({
    category: 'Certifications',
    score: certScore,
    maxScore: SCORING_WEIGHTS.certifications,
    percentage: certPercentage,
    details: jobInfo.certifications.length > 0
      ? `Matched ${matchedCerts.length}/${jobInfo.certifications.length} certifications`
      : 'No certifications required',
  });
  
  if (matchedCerts.length > 0) {
    strengths.push(`${matchedCerts.length} relevant certification(s) matched`);
  }
  
  // 6. Preferred Skills (5%)
  const matchedPreferred = jobInfo.preferredSkills.filter(preferred =>
    candidateInfo.skills.some(skill => skillsMatch(skill, preferred))
  );
  const preferredScore = jobInfo.preferredSkills.length > 0
    ? Math.round((matchedPreferred.length / jobInfo.preferredSkills.length) * SCORING_WEIGHTS.preferredSkills)
    : SCORING_WEIGHTS.preferredSkills; // Full points if no preferred skills
  const preferredPercentage = jobInfo.preferredSkills.length > 0
    ? Math.round((matchedPreferred.length / jobInfo.preferredSkills.length) * 100)
    : 100;
  
  categories.push({
    category: 'Preferred Skills',
    score: preferredScore,
    maxScore: SCORING_WEIGHTS.preferredSkills,
    percentage: preferredPercentage,
    details: jobInfo.preferredSkills.length > 0
      ? `Matched ${matchedPreferred.length}/${jobInfo.preferredSkills.length} preferred skills`
      : 'Bonus category',
  });
  
  if (matchedPreferred.length > 0) {
    strengths.push(`Bonus: ${matchedPreferred.length} preferred skill(s) matched`);
  }
  
  // 7. Resume Quality (5%)
  const qualityAnalysis = analyzeResumeQuality(candidateInfo.resumeText);
  const qualityScore = qualityAnalysis.score;
  const qualityPercentage = Math.round((qualityAnalysis.score / 5) * 100);
  
  categories.push({
    category: 'Resume Quality',
    score: qualityScore,
    maxScore: 5,
    percentage: qualityPercentage,
    details: qualityAnalysis.factors.length > 0
      ? qualityAnalysis.factors.join(', ')
      : 'Basic resume structure',
  });
  
  if (qualityAnalysis.factors.length >= 4) {
    strengths.push('Well-formatted resume with quality indicators');
  } else if (qualityAnalysis.factors.length < 2) {
    suggestions.push('Improve your resume structure and formatting');
  }
  
  // Calculate total score
  const totalScore = 
    requiredSkillsScore +
    experienceScore +
    educationScore +
    keywordScore +
    certScore +
    preferredScore +
    qualityScore;
  
  const finalScore = Math.max(0, Math.min(100, totalScore));
  
  // Generate explanation
  const explanation = generateExplanation(finalScore, categories, missingRequiredSkills, missingKeywords, strengths, weaknesses);
  
  return {
    score: finalScore,
    source: 'deterministic',
    categories,
    matchedSkills: matchedRequiredSkills,
    missingSkills: missingRequiredSkills,
    matchedKeywords,
    missingKeywords,
    matchedCertifications: matchedCerts,
    missingCertifications: missingCerts,
    explanation,
    suggestions: unique(suggestions),
    strengths: unique(strengths),
    weaknesses: unique(weaknesses),
  };
}

function generateExplanation(
  score: number,
  categories: AtsCategoryBreakdown[],
  missingSkills: string[],
  missingKeywords: string[],
  strengths: string[],
  weaknesses: string[]
): string {
  const parts: string[] = [];
  
  // Overall assessment
  if (score >= 80) {
    parts.push(`Strong match! You score ${score}% overall.`);
  } else if (score >= 70) {
    parts.push(`Good match. You score ${score}% overall and meet the minimum threshold.`);
  } else if (score >= 50) {
    parts.push(`Partial match. You score ${score}% overall. Improvements needed to reach 70%.`);
  } else {
    parts.push(`Low match. You score ${score}% overall. Significant improvements needed.`);
  }
  
  // Category highlights
  const strongCategories = categories.filter(c => c.percentage >= 80);
  const weakCategories = categories.filter(c => c.percentage < 50);
  
  if (strongCategories.length > 0) {
    parts.push(`Strong areas: ${strongCategories.map(c => `${c.category} (${c.percentage}%)`).join(', ')}.`);
  }
  
  if (weakCategories.length > 0) {
    parts.push(`Areas to improve: ${weakCategories.map(c => c.category).join(', ')}.`);
  }
  
  // Missing skills/keywords
  if (missingSkills.length > 0) {
    parts.push(`Missing required skills: ${missingSkills.slice(0, 5).join(', ')}${missingSkills.length > 5 ? '...' : ''}.`);
  }
  
  if (missingKeywords.length > 0) {
    parts.push(`Missing keywords: ${missingKeywords.slice(0, 5).join(', ')}${missingKeywords.length > 5 ? '...' : ''}.`);
  }
  
  return parts.join(' ');
}

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
  source: 'deterministic' | 'stored' | 'openai' | 'keyword';
  categories?: AtsCategoryBreakdown[];
  matchedSkills?: string[];
  missingSkills?: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedCertifications?: string[];
  missingCertifications?: string[];
  explanation: string;
  suggestions?: string[];
  strengths?: string[];
  weaknesses?: string[];
};

// Import the deterministic scoring engine
import { calculateDeterministicAtsMatch, SCORING_WEIGHTS } from './deterministicAtsService';

export { SCORING_WEIGHTS };

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'in', 'is', 'it', 'of', 'on', 'or', 'our', 'the', 'to', 'with', 'you', 'your',
]);

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.+#-]/g, '').trim();
}

function splitText(value?: string | null) {
  return String(value || '')
    .split(/[\s,;:/()[\]{}|]+/)
    .map(normalizeToken)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

// Legacy function for backward compatibility - now uses deterministic scoring
export function calculateKeywordAtsMatch(job: AtsJobInput, candidate: AtsCandidateInput): AtsMatchResult {
  // Use the new deterministic scoring engine
  return calculateDeterministicAtsMatch(job, candidate);
}

// Legacy function for backward compatibility
export async function enhanceAtsMatchWithOpenAI(
  job: AtsJobInput,
  candidate: AtsCandidateInput,
  fallback: AtsMatchResult,
  token?: string | null
): Promise<AtsMatchResult> {
  // Deterministic scoring is final - AI cannot override it
  // AI's role is only to explain and suggest improvements
  return fallback;
}

// Main scoring function - uses deterministic rules
export async function calculateAtsMatch(
  job: AtsJobInput,
  candidate: AtsCandidateInput,
  token?: string | null
): Promise<AtsMatchResult> {
  // Use deterministic scoring (AI cannot modify the score)
  const result = calculateDeterministicAtsMatch(job, candidate);
  
  // Check for stored score (legacy support)
  const storedScore = Number(candidate.storedScore);
  if (Number.isFinite(storedScore) && storedScore > 0) {
    return {
      ...result,
      score: Math.max(0, Math.min(100, Math.round(storedScore))),
      source: 'stored',
      explanation: `${result.explanation} (Using saved match score: ${storedScore}%)`,
    };
  }
  
  return result;
}

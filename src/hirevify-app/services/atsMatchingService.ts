export type AtsJobInput = {
 id: string;
 title?: string | null;
 description?: string | null;
 requirements?: string[] | null;
 skills?: string[] | null;
 experience_level?: string | null;
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
 storedScore?: number | null;
};

export type AtsMatchResult = {
 score: number;
 matchedKeywords: string[];
 missingKeywords: string[];
 explanation: string;
 source: 'stored' | 'openai' | 'keyword';
};

const STOP_WORDS = new Set([
 'a',
 'an',
 'and',
 'are',
 'as',
 'at',
 'be',
 'by',
 'for',
 'from',
 'in',
 'is',
 'it',
 'of',
 'on',
 'or',
 'our',
 'the',
 'to',
 'with',
 'you',
 'your',
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

// Base score (0–50) from candidate quality signals. Rewards real work history
// and credentials so a strong candidate isn't penalized for missing keywords
// they wouldn't reasonably be expected to spell the same way the job does.
function calculateBaseScore(candidate: AtsCandidateInput): { base: number; signals: string[] } {
  const signals: string[] = [];
  let base = 0;
  const resumeText = String(candidate.resumeText || '').trim();

  // 1. Resume has substantive content (10 pts)
  if (resumeText.length >= 500) {
    base += 10;
    signals.push('resume-content');
  }

  // 2. Work experience detected: job title + date range together (15 pts)
  const dateRangePattern = /(\b(?:19|20)\d{2}\b)\s*[-–—to]+\s*((?:19|20)\d{2}|present|current|now)/i;
  const jobTitlePattern = /\b(engineer|developer|designer|manager|analyst|architect|consultant|specialist|lead|director|coordinator|associate|intern|administrator|officer|technician|advisor|executive|head|chief|principal|researcher|scientist|founder|co-?founder|product|marketing|sales|recruiter|writer|editor)\b/i;
  if (dateRangePattern.test(resumeText) && jobTitlePattern.test(resumeText)) {
    base += 15;
    signals.push('work-experience');
  }

  // 3. Degree / formal education (15 pts)
  const degreePattern = /\b(bachelor|master|phd|doctorate|b\.?\s?sc?\.?|m\.?\s?sc?\.?|b\.?\s?a\.?|m\.?\s?a\.?|b\.?\s?tech|m\.?\s?tech|b\.?\s?e\.?|m\.?\s?e\.?|bs|ms|ma|ba|mba|degree|diploma|bba|llb|llm|md|jd)\b/i;
  if (degreePattern.test(resumeText)) {
    base += 15;
    signals.push('degree');
  }

  // 4. Skills listed (≥3) (5 pts)
  const skills = candidate.skills || [];
  if (skills.length >= 3) {
    base += 5;
    signals.push('skills');
  }

  // 5. Years of experience > 0 (5 pts)
  const yearsRaw = candidate.experience;
  const years = typeof yearsRaw === 'number' ? yearsRaw : Number(String(yearsRaw || '').match(/\d+(?:\.\d+)?/)?.[0] || '');
  if (Number.isFinite(years) && years > 0) {
    base += 5;
    signals.push('years');
  }

  // 6. Has a meaningful summary/headline (5 pts)
  const summaryLength = String(candidate.summary || candidate.headline || '').trim().length;
  if (summaryLength >= 40) {
    base += 5;
    signals.push('summary');
  }

  return { base: Math.min(50, base), signals };
}

function buildRequiredKeywords(job: AtsJobInput) {
 const skillKeywords = (job.skills || []).flatMap((skill) => splitText(skill));
 const requirementKeywords = (job.requirements || []).flatMap((requirement) => splitText(requirement));
 const titleKeywords = splitText(job.title);
 const descriptionKeywords = splitText(job.description);
 const experienceKeywords = splitText(job.experience_level);

 return unique([
 ...skillKeywords,
 ...requirementKeywords,
 ...titleKeywords,
 ...descriptionKeywords.slice(0, 30),
 ...experienceKeywords,
 ]);
}

function buildCandidateKeywords(candidate: AtsCandidateInput) {
 return unique([
 ...(candidate.skills || []).flatMap((skill) => splitText(skill)),
 ...splitText(candidate.headline),
 ...splitText(candidate.summary),
 ...splitText(candidate.resumeText),
 ...splitText(candidate.coverLetter),
 ...splitText(String(candidate.experience || '')),
 ]);
}

export function calculateKeywordAtsMatch(job: AtsJobInput, candidate: AtsCandidateInput): AtsMatchResult {
  const requiredKeywords = buildRequiredKeywords(job);
  const candidateKeywords = buildCandidateKeywords(candidate);
  const candidateSet = new Set(candidateKeywords);
  const matchedKeywords = requiredKeywords.filter((keyword) => candidateSet.has(keyword));
  const missingKeywords = requiredKeywords.filter((keyword) => !candidateSet.has(keyword)).slice(0, 12);
  const requiredSkills = (job.skills || []).map((skill) => skill.toLowerCase().trim()).filter(Boolean);
  const candidateSkills = (candidate.skills || []).map((skill) => skill.toLowerCase().trim()).filter(Boolean);
  const matchedSkills = requiredSkills.filter((skill) =>
  candidateSkills.some((candidateSkill) => candidateSkill.includes(skill) || skill.includes(candidateSkill))
  );

  const keywordScore = requiredKeywords.length > 0
  ? Math.round((matchedKeywords.length / requiredKeywords.length) * 100)
  : 0;
  const skillScore = requiredSkills.length > 0
  ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
  : keywordScore;
  const matchRatio = Math.max(0, Math.min(100, Math.round(keywordScore * 0.55 + skillScore * 0.45)));

  // Quality base (0–50) + keyword bonus (0–50). Base rewards experience, degree,
  // skills, and resume depth so a strong candidate doesn't get penalized for
  // keyword wording. A solid candidate hits the 50% floor from base alone.
  const { base, signals } = calculateBaseScore(candidate);
  const keywordBonus = Math.round((matchRatio / 100) * 50);
  const score = Math.max(0, Math.min(100, base + keywordBonus));

  const explanationParts: string[] = [];
  if (base > 0) {
    explanationParts.push(`Profile quality base ${base}/50 (${signals.join(', ') || 'general signals'})`);
  }
  if (matchRatio > 0) {
    explanationParts.push(`keyword match ${matchRatio}% adds ${keywordBonus}/50`);
  }
  if (explanationParts.length === 0) {
    explanationParts.push('Keyword fallback could not find enough overlap between the job requirements and available candidate data.');
  }
  const explanation = `HireVify fallback scoring: ${explanationParts.join('; ')}.`;

  return {
  score,
  matchedKeywords: unique([...matchedSkills, ...matchedKeywords]).slice(0, 16),
  missingKeywords,
  explanation,
  source: 'keyword',
  };
}

export async function enhanceAtsMatchWithOpenAI(
 job: AtsJobInput,
 candidate: AtsCandidateInput,
 fallback: AtsMatchResult,
 token?: string | null
): Promise<AtsMatchResult> {
 if (!token) return fallback;

 try {
 const response = await fetch('/api/ai/ats-match', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({ job, candidate, fallback }),
 });

 if (!response.ok) return fallback;

 const result = await response.json();
 const score = Number(result?.score);

 if (!Number.isFinite(score)) return fallback;

 return {
 score: Math.max(0, Math.min(100, Math.round(score))),
 matchedKeywords: Array.isArray(result?.matchedKeywords) ? result.matchedKeywords.filter(Boolean).slice(0, 16) : fallback.matchedKeywords,
 missingKeywords: Array.isArray(result?.missingKeywords) ? result.missingKeywords.filter(Boolean).slice(0, 12) : fallback.missingKeywords,
 explanation: typeof result?.explanation === 'string' && result.explanation.trim() ? result.explanation.trim() : fallback.explanation,
 source: 'openai',
 };
 } catch {
 return fallback;
 }
}

export async function calculateAtsMatch(
 job: AtsJobInput,
 candidate: AtsCandidateInput,
 token?: string | null
): Promise<AtsMatchResult> {
 const keywordResult = calculateKeywordAtsMatch(job, candidate);
 const storedScore = Number(candidate.storedScore);

 if (Number.isFinite(storedScore) && storedScore > 0) {
 return {
 ...keywordResult,
 score: Math.max(0, Math.min(100, Math.round(storedScore))),
 source: 'stored',
 explanation: `${keywordResult.explanation} The percentage shown uses the saved application match score.`,
 };
 }

 return enhanceAtsMatchWithOpenAI(job, candidate, keywordResult, token);
}

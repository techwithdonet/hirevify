import { NextRequest, NextResponse } from 'next/server';
import type { AtsCandidateInput, AtsJobInput, AtsMatchResult } from '@/src/hirevify-app/services/atsMatchingService';
import { callConfiguredAI, extractJsonObject } from '@/src/lib/server/aiChat';
import { authorizeAiRequest } from '@/src/lib/server/aiRequest';

export const runtime = 'nodejs';

function sanitizeStringArray(value: unknown) {
 if (!Array.isArray(value)) return [];
 return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 16);
}

function buildPrompt(job: AtsJobInput, candidate: AtsCandidateInput, fallback: AtsMatchResult) {
  return `
You are HireVify's ATS matching analyst. Score the candidate against the job using both keyword/skill match AND profile quality (experience, degree, credentials, resume depth).

Return ONLY valid JSON:
{
  "score": number,
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "explanation": string
}

Scoring rules:
- Profile quality base (0 to 50): award when the candidate shows substantive work history (job titles + date ranges in the resume), a recognized degree (bachelor/master/PhD/MBA/etc.), 3+ listed skills, years of experience, and a meaningful summary. Strong candidates should reach the 50 floor from quality alone.
- Keyword/skill match bonus (0 to 50): scale from the ratio of matched job keywords + required skills vs required. Full match = 50, partial = proportional, zero = 0.
- Final score = base + bonus, capped at 100.
- Do not invent candidate skills, experience, resume content, employers, or credentials.
- Use only the job, candidate, cover letter, resume text, and fallback keyword match below.
- Score must be 0 to 100. Example: a candidate with degree + work experience (base 50) and 2 of 5 keywords (40% match, bonus 20) should score 70.
- If evidence is thin on both axes, score close to the fallback.
- Explanation must be one short recruiter-facing sentence.

Job:
${JSON.stringify(job, null, 2)}

Candidate:
${JSON.stringify(candidate, null, 2)}

Keyword fallback:
${JSON.stringify(fallback, null, 2)}
`;
}

export async function POST(request: NextRequest) {
 try {
 const authorization = await authorizeAiRequest(request, 'ats-match', { requirePremium: true });
 if (!authorization.ok) return authorization.response;

 const body = await request.json();
 const job = body.job as AtsJobInput | undefined;
 const candidate = body.candidate as AtsCandidateInput | undefined;
 const fallback = body.fallback as AtsMatchResult | undefined;

 if (!job || !candidate || !fallback) {
 return NextResponse.json({ error: 'Job, candidate, and fallback are required.' }, { status: 400 });
 }

 const content = await callConfiguredAI({
 purpose: 'ATS matching',
 messages: [
 {
 role: 'system',
 content: 'You are an ATS analyst. Return strict JSON and never fabricate candidate facts.',
 },
 {
 role: 'user',
 content: buildPrompt(job, candidate, fallback),
 },
 ],
 temperature: 0.1,
 maxTokens: 700,
 responseFormatJson: true,
 });

 const parsed = JSON.parse(extractJsonObject(content));
 const score = Number(parsed.score);

 if (!Number.isFinite(score)) {
 return NextResponse.json({ error: 'OpenAI response did not include a numeric score.' }, { status: 502 });
 }

 return NextResponse.json({
 score: Math.max(0, Math.min(100, Math.round(score))),
 matchedKeywords: sanitizeStringArray(parsed.matchedKeywords),
 missingKeywords: sanitizeStringArray(parsed.missingKeywords).slice(0, 12),
 explanation: String(parsed.explanation || fallback.explanation || '').trim(),
 }, { headers: authorization.headers });
 } catch (error) {
 console.error('ATS AI route failed:', error);
 return NextResponse.json(
 { error: error instanceof Error ? error.message : 'ATS AI matching failed.' },
 { status: 500 }
 );
 }
}

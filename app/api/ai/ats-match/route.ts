import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { AtsCandidateInput, AtsJobInput, AtsMatchResult } from '@/src/hirevify-app/services/atsMatchingService';
import { callConfiguredAI, extractJsonObject } from '@/src/lib/server/aiChat';

export const runtime = 'nodejs';

function sanitizeStringArray(value: unknown) {
 if (!Array.isArray(value)) return [];
 return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 16);
}

async function verifySupabaseSession(request: NextRequest) {
 const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

 if (!supabaseUrl || !supabaseAnonKey) {
 return { error: 'Supabase environment variables are missing.', status: 503 };
 }

 if (!bearerToken) {
 return { error: 'No active Supabase session found. Please login again.', status: 401 };
 }

 const supabase = createClient(supabaseUrl, supabaseAnonKey, {
 global: {
 headers: {
 Authorization: `Bearer ${bearerToken}`,
 },
 },
 });

 const { data, error } = await supabase.auth.getUser(bearerToken);

 if (error || !data.user) {
 return { error: 'Invalid Supabase session. Please logout and login again.', status: 401 };
 }

 return { error: null, status: 200 };
}

function buildPrompt(job: AtsJobInput, candidate: AtsCandidateInput, fallback: AtsMatchResult) {
 return `
You are HireVify's ATS matching analyst. Improve the provided deterministic keyword score only when the candidate data supports it.

Return ONLY valid JSON:
{
  "score": number,
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "explanation": string
}

Rules:
- Do not invent candidate skills, experience, resume content, employers, or credentials.
- Use only the job, candidate, cover letter, resume text, and fallback keyword match below.
- Score must be 0 to 100.
- If evidence is thin, keep the score close to the fallback score.
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
 const session = await verifySupabaseSession(request);

 if (session.error) {
 return NextResponse.json({ error: session.error }, { status: session.status });
 }

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
 });
 } catch (error) {
 console.error('ATS AI route failed:', error);
 return NextResponse.json(
 { error: error instanceof Error ? error.message : 'ATS AI matching failed.' },
 { status: 500 }
 );
 }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { AtsCandidateInput, AtsJobInput, AtsMatchResult } from '@/src/hirevify-app/services/atsMatchingService';

export const runtime = 'nodejs';

function extractJson(text: string) {
 const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
 const start = cleaned.indexOf('{');
 const end = cleaned.lastIndexOf('}');

 if (start === -1 || end === -1 || end <= start) {
 throw new Error('OpenAI did not return valid JSON.');
 }

 return cleaned.slice(start, end + 1);
}

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

 const apiKey = process.env.OPENAI_API_KEY;

 if (!apiKey) {
 return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 503 });
 }

 const body = await request.json();
 const job = body.job as AtsJobInput | undefined;
 const candidate = body.candidate as AtsCandidateInput | undefined;
 const fallback = body.fallback as AtsMatchResult | undefined;

 if (!job || !candidate || !fallback) {
 return NextResponse.json({ error: 'Job, candidate, and fallback are required.' }, { status: 400 });
 }

 const response = await fetch('https://api.openai.com/v1/chat/completions', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${apiKey}`,
 },
 body: JSON.stringify({
 model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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
 max_tokens: 700,
 response_format: { type: 'json_object' },
 }),
 });

 const raw = await response.text();
 const json = raw ? JSON.parse(raw) : {};

 if (!response.ok) {
 return NextResponse.json(
 { error: json?.error?.message || 'OpenAI ATS matching failed.' },
 { status: response.status }
 );
 }

 const content = json?.choices?.[0]?.message?.content;

 if (typeof content !== 'string' || !content.trim()) {
 return NextResponse.json({ error: 'OpenAI returned an empty ATS response.' }, { status: 502 });
 }

 const parsed = JSON.parse(extractJson(content));
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
 console.error('ATS OpenAI route failed:', error);
 return NextResponse.json(
 { error: error instanceof Error ? error.message : 'ATS OpenAI matching failed.' },
 { status: 500 }
 );
 }
}

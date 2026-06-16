import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJson(text: string) {
  const cleaned = String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('AI did not return valid JSON.');
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function extractOpenRouterText(json: any) {
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content === 'string') return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        return '';
      })
      .join('\n')
      .trim();
  }

  if (typeof json?.choices?.[0]?.text === 'string') {
    return json.choices[0].text.trim();
  }

  return '';
}

function getOpenRouterModels() {
  const raw = process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL || 'openrouter/free';
  const models = raw.split(',').map((m) => m.trim()).filter(Boolean);
  return models.length ? models : ['openrouter/free'];
}

async function callOpenRouter(prompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing.');
  }

  const models = getOpenRouterModels();
  const maxAttempts = Number(process.env.OPENROUTER_MAX_RETRIES || 4);
  const errors: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://hirevify.vercel.app',
        'X-Title': 'HireVify'
      },
      body: JSON.stringify({
        models,
        messages: [
          {
            role: 'system',
            content:
              'You are HireVify Resume Fix AI. Return only valid JSON. Improve resumes for ATS. Never invent fake jobs, companies, degrees, years, certifications, achievements, or skills.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2200,
        provider: {
          allow_fallbacks: true,
          sort: 'throughput'
        }
      })
    });

    const raw = await response.text();
    let json: any = {};

    try {
      json = raw ? JSON.parse(raw) : {};
    } catch {
      errors.push(`Attempt ${attempt}: invalid OpenRouter JSON wrapper`);
      await sleep(900 * attempt);
      continue;
    }

    if (!response.ok) {
      errors.push(`Attempt ${attempt}: ${json?.error?.message || json?.message || 'OpenRouter failed'}`);
      await sleep(900 * attempt);
      continue;
    }

    const text = extractOpenRouterText(json);

    if (text && !/<pad>/i.test(text)) {
      return text;
    }

    errors.push(`Attempt ${attempt}: empty or invalid AI output`);
    await sleep(900 * attempt);
  }

  throw new Error(`AI rewrite failed after retries. ${errors.join(' | ')}`);
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase environment variables are missing.' }, { status: 503 });
    }

    const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!bearerToken) {
      return NextResponse.json({ error: 'No active Supabase session found. Please login again.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${bearerToken}`
        }
      }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(bearerToken);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Invalid Supabase session. Please logout and login again.' }, { status: 401 });
    }

    const body = await request.json();
    const resumeData = body.resumeData;

    if (!resumeData) {
      return NextResponse.json({ error: 'resumeData is required.' }, { status: 400 });
    }

    const prompt = `
Fix this resume for ATS compatibility and recruiter readability.

Return ONLY valid JSON:
{
  "summary": string,
  "experience": [
    {
      "id": string,
      "jobTitle": string,
      "companyName": string,
      "city": string,
      "state": string,
      "startDate": string,
      "endDate": string,
      "isCurrentJob": boolean,
      "description": string[]
    }
  ],
  "skills": [
    {
      "name": string,
      "category": "technical" | "soft" | "language",
      "proficiency": "beginner" | "intermediate" | "advanced" | "expert"
    }
  ],
  "education": [
    {
      "id": string,
      "degree": string,
      "university": string,
      "city": string,
      "state": string,
      "graduationDate": string,
      "gpa": string
    }
  ]
}

Strict rules:
- Use only the user-provided data.
- Do not invent missing work experience.
- Do not invent missing education.
- Do not invent companies, degrees, dates, certifications, or achievements.
- Improve wording and ATS keywords only when grounded in provided summary, skills, and experience.
- If experience is empty or incomplete, return the same entries cleaned, not fake jobs.
- If education is empty, return empty education.
- Summary must be 2-3 sentences.
- Experience descriptions should be bullet-ready strings.
- Remove corrupted text like <pad>, â€¢, â€¦, Ã, Â.
- No markdown outside JSON.

Resume data:
${JSON.stringify(resumeData, null, 2)}

ATS score:
${JSON.stringify(body.atsScore ?? null)}

ATS checks:
${JSON.stringify(body.atsChecks ?? [], null, 2)}
`;

    const aiText = await callOpenRouter(prompt);
    const fixed = JSON.parse(extractJson(aiText));

    return NextResponse.json({ fixedResume: fixed });
  } catch (error) {
    console.error('Rewrite resume route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI resume rewrite failed.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOpenRouterModels() {
  const configuredModels =
    process.env.OPENROUTER_MODELS ||
    process.env.OPENROUTER_MODEL ||
    'openrouter/free';

  const models = configuredModels
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  return models.length > 0 ? models : ['openrouter/free'];
}

function extractOpenRouterText(json: any) {
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

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

  const text = json?.choices?.[0]?.text;

  if (typeof text === 'string') {
    return text.trim();
  }

  return '';
}

async function callOpenRouter(prompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing. Add it to .env.local and Vercel Environment Variables.');
  }

  const models = getOpenRouterModels();
  const maxAttempts = Number(process.env.OPENROUTER_MAX_RETRIES || 4);
  const errors: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
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
                'You are a resume writing assistant. Return only a concise professional resume summary. Never return empty text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.25,
          max_tokens: 350,
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
        errors.push(`Attempt ${attempt}: OpenRouter returned invalid JSON.`);
        await sleep(900 * attempt);
        continue;
      }

      if (!response.ok) {
        errors.push(
          `Attempt ${attempt}: ${json?.error?.message || json?.message || 'OpenRouter summary generation failed.'}`
        );
        await sleep(900 * attempt);
        continue;
      }

      const summary = extractOpenRouterText(json)
        .replace(/^["']|["']$/g, '')
        .trim();

      if (summary) {
        return summary;
      }

      const finishReason = json?.choices?.[0]?.finish_reason || 'unknown';
      const usedModel = json?.model || models.join(',');
      const completionTokens = json?.usage?.completion_tokens ?? 'unknown';

      errors.push(
        `Attempt ${attempt}: empty response. model=${usedModel}; finish_reason=${finishReason}; completion_tokens=${completionTokens}`
      );

      await sleep(900 * attempt);
    } catch (error) {
      errors.push(
        `Attempt ${attempt}: ${error instanceof Error ? error.message : 'Unknown OpenRouter error.'}`
      );
      await sleep(900 * attempt);
    }
  }

  throw new Error(`OpenRouter returned empty output after retrying. ${errors.join(' | ')}`);
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase environment variables are missing.' },
        { status: 503 }
      );
    }

    const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!bearerToken) {
      return NextResponse.json(
        { error: 'No active Supabase session found. Please login again.' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'Invalid Supabase session. Please logout and login again.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name = String(body.name || 'the candidate');
    const headline = String(body.headline || '');
    const skills = Array.isArray(body.skills) ? body.skills.filter(Boolean) : [];
    const experience = Array.isArray(body.experience) ? body.experience : [];

    const experienceText = experience
      .map((item: any) =>
        `${item.title || item.jobTitle || ''} ${
          item.company || item.companyName ? 'at ' + (item.company || item.companyName) : ''
        }`.trim()
      )
      .filter(Boolean)
      .join('; ');

    const prompt = `
Write a professional resume summary for ${name}.

Return only the final summary text. No bullet points. No markdown. No fake experience. Do not invent employers, degrees, certifications, years of experience, or achievements.

Candidate headline/current summary:
${headline || 'Not provided'}

Skills:
${skills.length ? skills.join(', ') : 'Not provided'}

Experience titles:
${experienceText || 'Not provided'}

Requirements:
- 2 to 3 sentences only.
- ATS-friendly.
- Clear, confident, recruiter-friendly.
- Use only provided facts.
- Never return empty text.
`;

    const summary = await callOpenRouter(prompt);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Generate summary route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI summary generation failed.' },
      { status: 500 }
    );
  }
}

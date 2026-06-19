import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callConfiguredAI } from '@/src/lib/server/aiChat';

export const runtime = 'nodejs';

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

    const summary = (await callConfiguredAI({
      purpose: 'AI summary generation',
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
      maxTokens: 350
    }))
      .replace(/^["']|["']$/g, '')
      .trim();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Generate summary route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI summary generation failed.' },
      { status: 500 }
    );
  }
}

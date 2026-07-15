import { NextRequest, NextResponse } from 'next/server';
import { callConfiguredAI } from '@/src/lib/server/aiChat';
import { authorizeAiRequest } from '@/src/lib/server/aiRequest';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeAiRequest(request, 'generate-summary', { requirePremium: true });
    if (!authorization.ok) return authorization.response;

    const body = await request.json();
    const name = String(body.name || 'the candidate').slice(0, 120);
    const headline = String(body.headline || '').slice(0, 3000);
    const skills = Array.isArray(body.skills) ? body.skills.filter(Boolean).slice(0, 100) : [];
    const experience = Array.isArray(body.experience) ? body.experience.slice(0, 50) : [];

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

    return NextResponse.json({ summary }, { headers: authorization.headers });
  } catch (error) {
    console.error('Generate summary route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI summary generation failed.' },
      { status: 500 }
    );
  }
}

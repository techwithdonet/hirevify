import { NextRequest, NextResponse } from 'next/server';
import { callConfiguredAI, extractJsonObject } from '@/src/lib/server/aiChat';
import { authorizeAiRequest } from '@/src/lib/server/aiRequest';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeAiRequest(request, 'parse-resume', { requirePremium: true });
    if (!authorization.ok) return authorization.response;

    const body = await request.json();
    const rawResumeText = String(body.rawResumeText || '').trim();

    if (!rawResumeText) {
      return NextResponse.json({ error: 'rawResumeText is required.' }, { status: 400 });
    }

    const truncated = rawResumeText.length > 20000 ? `${rawResumeText.slice(0, 20000)}\n\n[Truncated for AI context]` : rawResumeText;

    const prompt = `
Parse the following raw resume text into structured JSON. The candidate uploaded this PDF/DOCX from their profile, so it is the authoritative source for what they actually did.

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

Rules:
- Extract every work experience entry mentioned. If dates are missing, leave them blank but keep the entry.
- Extract every education entry mentioned.
- For description, use the bullet points from the resume (one string per bullet).
- If a city/state isn't present, use empty strings.
- Format startDate/endDate/graduationDate as YYYY-MM when only year+month is visible, or YYYY when only year is visible. If unknown, use empty string.
- proficiency defaults to "intermediate" when unknown.
- category defaults to "technical" for hard skills, "soft" for interpersonal skills, "language" for spoken languages.
- Do not invent jobs, companies, degrees, universities, dates, or skills that aren't in the text.
- Summary should be 2-3 sentences pulled from the existing summary/objective section, or empty string if none exists.
- Remove corrupted text like <pad>, â€¢, â€¦, Ã, Â.

Raw resume text:
${truncated}
`;

    const aiText = await callConfiguredAI({
      purpose: 'AI resume parse',
      messages: [
        {
          role: 'system',
          content:
            'You are HireVify Resume Parse AI. Extract structured data from raw resume text. Return only valid JSON. Never invent facts.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      maxTokens: 3000,
      responseFormatJson: true
    });

    const parsed = JSON.parse(extractJsonObject(aiText));

    return NextResponse.json({ resumeData: parsed }, { headers: authorization.headers });
  } catch (error) {
    console.error('Parse resume route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI resume parsing failed.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callConfiguredAI, extractJsonObject } from '@/src/lib/server/aiChat';

export const runtime = 'nodejs';

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

    const targetJobDescription = String(body.targetJobDescription || body.jobDescription || '').trim();

    const prompt = `
Fix this resume for ATS compatibility and recruiter readability${targetJobDescription ? ' for the provided target job' : ''}.

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
- Use only the user-provided resume data and target job description.
- Do not invent missing work experience.
- Do not invent missing education.
- Do not invent companies, degrees, dates, certifications, achievements, or skills.
- Improve wording and ATS keywords only when grounded in provided summary, skills, experience, education, or the pasted target job.
- If experience is empty or incomplete, return the same entries cleaned, not fake jobs.
- If education is empty, return empty education.
- Summary must be 2-3 sentences.
- Experience descriptions should be bullet-ready strings.
- Remove corrupted text like <pad>, â€¢, â€¦, Ã, Â.
- No markdown outside JSON.

Resume data:
${JSON.stringify(resumeData, null, 2)}

Target job description:
${targetJobDescription || 'Not provided'}

ATS score:
${JSON.stringify(body.atsScore ?? null)}

ATS checks:
${JSON.stringify(body.atsChecks ?? [], null, 2)}
`;

    const aiText = await callConfiguredAI({
      purpose: 'AI resume rewrite',
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
      maxTokens: 2200,
      responseFormatJson: true
    });

    const fixed = JSON.parse(extractJsonObject(aiText));

    return NextResponse.json({ fixedResume: fixed, resumeData: fixed });
  } catch (error) {
    console.error('Rewrite resume route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI resume rewrite failed.' },
      { status: 500 }
    );
  }
}

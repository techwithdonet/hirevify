import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
  ATSScore,
  JobDescription,
  ResumeData,
  ResumeOptimizationSuggestion,
  SkillsAnalysis
} from '@/src/hirevify-app/types/resume';

export const runtime = 'nodejs';

type AIInsight = {
  type: 'suggestion' | 'warning' | 'improvement';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
};

type ResumeAIResponse = {
  atsScore: ATSScore;
  optimizationSuggestions: ResumeOptimizationSuggestion[];
  skillsAnalysis: SkillsAnalysis | null;
  aiInsights: AIInsight[];
};

function extractJson(text: string) {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('AI response did not contain valid JSON.');
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function validateResult(value: Partial<ResumeAIResponse>): ResumeAIResponse {
  if (!value.atsScore || typeof value.atsScore.overall !== 'number') {
    throw new Error('AI response missing atsScore.');
  }

  return {
    atsScore: {
      overall: value.atsScore.overall,
      breakdown: {
        formatting: value.atsScore.breakdown?.formatting ?? 0,
        keywords: value.atsScore.breakdown?.keywords ?? 0,
        readability: value.atsScore.breakdown?.readability ?? 0,
        completeness: value.atsScore.breakdown?.completeness ?? 0,
        atsCompatibility: value.atsScore.breakdown?.atsCompatibility ?? 0
      },
      recommendations: value.atsScore.recommendations ?? [],
      criticalIssues: value.atsScore.criticalIssues ?? [],
      strengths: value.atsScore.strengths ?? [],
      missingKeywords: value.atsScore.missingKeywords ?? [],
      optimalKeywords: value.atsScore.optimalKeywords ?? [],
      sectionScores: value.atsScore.sectionScores ?? {}
    },
    optimizationSuggestions: value.optimizationSuggestions ?? [],
    skillsAnalysis: value.skillsAnalysis ?? null,
    aiInsights: value.aiInsights ?? []
  };
}

function buildPrompt(resumeData: ResumeData, targetJob: JobDescription | null | undefined) {
  return `
You are HireVify's real AI resume analyst. Analyze this candidate resume for ATS compatibility, recruiter readability, keyword match, and job targeting.

Return ONLY valid JSON. No markdown. No explanation outside JSON.

Required JSON shape:
{
  "atsScore": {
    "overall": number,
    "breakdown": {
      "formatting": number,
      "keywords": number,
      "readability": number,
      "completeness": number,
      "atsCompatibility": number
    },
    "recommendations": string[],
    "criticalIssues": string[],
    "strengths": string[],
    "missingKeywords": string[],
    "optimalKeywords": string[],
    "sectionScores": { "summary": number, "experience": number, "education": number, "skills": number, "projects": number, "certifications": number }
  },
  "optimizationSuggestions": [
    {
      "id": string,
      "type": "content" | "formatting" | "keyword" | "structure" | "achievement",
      "priority": "high" | "medium" | "low",
      "section": string,
      "current": string,
      "suggested": string,
      "reason": string,
      "impact": string,
      "examples": string[]
    }
  ],
  "skillsAnalysis": {
    "matchedSkills": string[],
    "missingSkills": string[],
    "skillGaps": [
      {
        "skill": string,
        "importance": "critical" | "important" | "nice-to-have",
        "suggestions": string[]
      }
    ],
    "strengthAreas": string[],
    "developmentAreas": string[],
    "recommendedCertifications": string[]
  },
  "aiInsights": [
    {
      "type": "suggestion" | "warning" | "improvement",
      "title": string,
      "description": string,
      "action": string,
      "priority": "high" | "medium" | "low"
    }
  ]
}

Rules:
- Do not invent candidate experience.
- Do not use fake/demo/sample data.
- Base all suggestions only on the provided resume and target job.
- If target job is empty, analyze general ATS quality.
- Scores must be realistic from 0 to 100.

Resume:
${JSON.stringify(resumeData, null, 2)}

Target job:
${JSON.stringify(targetJob ?? null, null, 2)}
`;
}

async function callGemini(prompt: string) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is missing. Add it to .env.local and Vercel Environment Variables.');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 3500,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error?.message || 'Gemini resume analysis failed.');
  }

  const text = json?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('\n');

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return text;
}

async function callAnthropic(prompt: string) {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is missing. Add it to .env.local and Vercel Environment Variables.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 3500,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error?.message || 'Anthropic resume analysis failed.');
  }

  const text = json?.content?.[0]?.text;

  if (!text || typeof text !== 'string') {
    throw new Error('Anthropic returned an empty response.');
  }

  return text;
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
    const resumeData = body.resumeData as ResumeData | undefined;
    const targetJob = body.targetJob as JobDescription | null | undefined;

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data is required.' },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(resumeData, targetJob);
    const provider = (process.env.AI_PROVIDER || '').toLowerCase();

    let aiText = '';

    if (provider === 'anthropic') {
      aiText = await callAnthropic(prompt);
    } else if (provider === 'gemini') {
      aiText = await callGemini(prompt);
    } else if (process.env.GEMINI_API_KEY) {
      aiText = await callGemini(prompt);
    } else {
      aiText = await callAnthropic(prompt);
    }

    const parsed = JSON.parse(extractJson(aiText));
    const result = validateResult(parsed);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Resume AI route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Resume AI analysis failed.' },
      { status: 500 }
    );
  }
}

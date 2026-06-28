import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callConfiguredAI, extractJsonObject } from '@/src/lib/server/aiChat';

export const runtime = 'nodejs';

/**
 * Resume Optimization API
 * 
 * AI's role is to EXPLAIN and OPTIMIZE - NOT to calculate scores.
 * The scoring engine provides deterministic scores.
 * 
 * Input:
 * - resumeData: structured resume data
 * - rawResumeText: raw CV text for parsing
 * - targetJobDescription: job to optimize for
 * - atsScore: CURRENT deterministic score (from backend)
 * - categories: category breakdown from scoring engine
 * - missingSkills: skills missing from scoring engine
 * - missingKeywords: keywords missing from scoring engine
 * 
 * Output:
 * - optimizedResume: improved resume
 * - analysis: AI explanation of improvements
 * - estimatedImprovement: realistic improvement estimate
 * - changes: list of what was changed
 */
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
    const {
      resumeData,
      rawResumeText,
      targetJobDescription,
      atsScore,
      categories,
      missingSkills,
      missingKeywords,
      strengths,
      weaknesses
    } = body;

    // Phase 1: Parse raw resume text into structured data (if provided)
    let parsedResume = resumeData || {};
    
    if (rawResumeText && rawResumeText.length > 50) {
      try {
        const parsePrompt = `
Parse this raw resume text into structured JSON. Extract ALL available information accurately. Do NOT invent any data.

Return ONLY valid JSON with these exact fields:
{
  "summary": string (professional summary from the resume),
  "experience": [
    {
      "jobTitle": string,
      "companyName": string,
      "city": string,
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
      "proficiency": "intermediate"
    }
  ],
  "education": [
    {
      "degree": string,
      "university": string,
      "graduationDate": string
    }
  ]
}

Rules:
- Extract ONLY real information from the resume text
- Do NOT invent or assume any data not present
- If a field is not found, use empty string or empty array
- Dates can be in any format

Raw resume text:
${rawResumeText.slice(0, 15000)}
`;

        const parseResult = await callConfiguredAI({
          purpose: 'Resume parsing',
          messages: [
            {
              role: 'system',
              content: 'You are a resume parser. Extract ONLY real information. Return only valid JSON. Never invent data.'
            },
            {
              role: 'user',
              content: parsePrompt
            }
          ],
          temperature: 0.1,
          maxTokens: 2500,
          responseFormatJson: true
        });
        
        const parsed = JSON.parse(extractJsonObject(parseResult));
        parsedResume = { ...parsedResume, ...parsed };
      } catch (parseError) {
        console.warn('Resume parsing failed, using provided data:', parseError);
      }
    }

    // Phase 2: Optimize resume for ATS (without calculating scores)
    const missingSkillsList = (missingSkills || []).join(', ');
    const missingKeywordsList = (missingKeywords || []).join(', ');
    
    const optimizationPrompt = `
You are HireVify Resume Optimization AI. Your job is to:
1. EXPLAIN the current weaknesses
2. OPTIMIZE the resume with ATS-friendly improvements
3. ESTIMATE realistic improvement

You do NOT calculate scores. The backend provides deterministic scores.

Return ONLY valid JSON:
{
  "optimizedResume": {
    "summary": string (improved professional summary with ATS keywords - MUST include these keywords if relevant to experience: ${missingKeywordsList || 'None'}),
    "experience": [array - ALL entries with improved bullet points that naturally include ${missingKeywordsList || 'missing keywords'}],
    "skills": [array - MUST include these missing skills: ${missingSkillsList || 'None'}],
    "education": [array - unchanged]
  },
  "analysis": {
    "strengths": string[] (what's working well),
    "weaknesses": string[] (what needs improvement),
    "missingSkills": string[] (skills to highlight based on job requirements),
    "missingKeywords": string[] (keywords to naturally incorporate),
    "improvementTips": string[] (specific suggestions)
  },
  "estimatedImprovement": {
    "minIncrease": number (minimum percentage point increase),
    "maxIncrease": number (maximum percentage point increase),
    "reasoning": string (why this improvement is expected)
  },
  "changes": [
    {
      "section": string,
      "before": string,
      "after": string,
      "reason": string
    }
  ]
}

CRITICAL RULES - FOLLOW THESE EXACTLY:
1. NEVER invent: work experience, certifications, projects, skills, degrees, employers, achievements
2. ONLY rewrite/improve existing information
3. You MUST include these missing keywords in the optimized resume: ${missingKeywordsList || 'None'}
   - Add them to the professional summary naturally
   - Add them to experience bullet points where they fit the actual work
   - Do NOT invent new skills - only rephrase existing ones with the keywords
4. You MUST include these missing skills in the skills section: ${missingSkillsList || 'None'}
5. Estimate improvement realistically (usually 8-15 percentage points when keywords are added)

Target job description:
${targetJobDescription || 'Not provided'}

Current ATS score: ${atsScore || 0}%

Score categories (for reference - do not modify):
${JSON.stringify(categories || [], null, 2)}

Missing skills: ${missingSkillsList || 'None'}
Missing keywords: ${missingKeywordsList || 'None'}
Strengths: ${(strengths || []).join(', ') || 'None identified'}
Weaknesses: ${(weaknesses || []).join(', ') || 'None identified'}

Original resume:
${JSON.stringify(parsedResume, null, 2)}
`;

    const aiText = await callConfiguredAI({
      purpose: 'AI resume optimization',
      messages: [
        {
          role: 'system',
          content: `You are HireVify Resume Optimization AI.
- EXPLAIN: Why the resume is weak in certain areas
- OPTIMIZE: Rewrite existing content for better ATS performance  
- ESTIMATE: Give realistic improvement projections (5-15 points max)
- NEVER invent: experience, certifications, projects, skills, degrees, employers, achievements
- DO improve: wording, keyword placement, formatting suggestions, bullet points`
        },
        {
          role: 'user',
          content: optimizationPrompt
        }
      ],
      temperature: 0.3,
      maxTokens: 4000,
      responseFormatJson: true
    });

    const result = JSON.parse(extractJsonObject(aiText));

    return NextResponse.json({
      optimizedResume: result.optimizedResume || parsedResume,
      analysis: result.analysis || { strengths: [], weaknesses: [], missingSkills: [], missingKeywords: [], improvementTips: [] },
      estimatedImprovement: result.estimatedImprovement || { minIncrease: 5, maxIncrease: 10, reasoning: 'Based on keyword improvements' },
      changes: result.changes || [],
      originalResume: parsedResume,
      note: 'Score is calculated deterministically by the backend. This API only optimizes and explains.'
    });
  } catch (error) {
    console.error('Resume optimization failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI resume optimization failed.' },
      { status: 500 }
    );
  }
}

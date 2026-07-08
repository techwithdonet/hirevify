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
        const parsePrompt = `Extract all info from this resume as JSON: {summary,experience[{title,company,startDate,endDate,description}],skills[{name,category}],education[{degree,university,graduationDate}]}. Invent nothing. Raw: ${rawResumeText.slice(0, 8000)}`;

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
          maxTokens: 2200,
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
    
    const optimizationPrompt = `OPTIMIZE this resume for ATS. Return ONLY valid JSON:
{
  "optimizedResume": {"summary":string,"experience":[],"skills":[],"education":[]},
  "analysis": {"strengths":[],"weaknesses":[],"missingSkills":[],"missingKeywords":[],"improvementTips":[]},
  "estimatedImprovement": {"minIncrease":5,"maxIncrease":12,"reasoning":"keyword additions"},
  "changes": [{"section":"","before":"","after":"","reason":""}]
}
RULES: Never invent data. Only rewrite/improve existing content.
Add missing keywords (${missingKeywordsList || 'None'}) naturally to summary and bullets.
Add missing skills (${missingSkillsList || 'None'}) to skills section.
Original resume: ${JSON.stringify(parsedResume)}
Job desc: ${(targetJobDescription || '').slice(0, 3000)}
Current score: ${atsScore || 0}%. Categories: ${JSON.stringify(categories || [])}`;

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
      maxTokens: 2200,
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

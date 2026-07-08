import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function extractJsonObject(text: string) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not contain valid JSON.");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

function asArray(value: any) {
  return Array.isArray(value) ? value : [];
}

function fallbackOptimizedResume(body: any) {
  const parsed = body?.parsedResume || {};
  const missingKeywords = asArray(body?.missingKeywords).slice(0, 12);

  const existingSkills = asArray(parsed.skills)
    .map((skill: any) => typeof skill === "string" ? skill : skill?.name)
    .filter(Boolean);

  const mergedSkills = Array.from(new Set([...existingSkills, ...missingKeywords]));

  return {
    optimizedResume: {
      summary:
        parsed.summary ||
        "Results-driven professional with experience aligned to the target role, strong technical capabilities, and a proven ability to support business operations, solve problems, and deliver measurable outcomes.",
      experience: asArray(parsed.experience),
      skills: mergedSkills.map((skill) => ({
        name: skill,
        category: "technical",
      })),
      education: asArray(parsed.education),
    },
    estimatedImprovement: {
      minIncrease: 5,
      maxIncrease: 10,
    },
    changes: [
      "Added missing ATS keywords where relevant.",
      "Improved resume structure for ATS readability.",
      "Kept optimization realistic without inventing experience.",
    ],
    projectedScore: body?.currentScore
      ? Math.min(95, Math.max(Number(body.currentScore) + 8, 70))
      : 75,
    projectedCategories: asArray(body?.categories),
    provider: "fallback",
  };
}

function buildPrompt(body: any) {
  const parsedResume = body?.parsedResume || {};
  const currentResumeText =
    body?.currentResumeText ||
    body?.resumeText ||
    body?.cvText ||
    JSON.stringify(parsedResume, null, 2);

  const jobDescription =
    body?.targetJobDescription ||
    body?.jobDescription ||
    body?.description ||
    "";

  const missingKeywords = asArray(body?.missingKeywords);

  return `
You are HireVify Resume Optimization AI.

Return ONLY valid JSON. No markdown. No explanation outside JSON.

Rules:
- Optimize the resume for ATS.
- Do not invent fake companies, fake degrees, fake dates, or fake experience.
- You may improve wording and include relevant missing keywords only when they fit the candidate background.
- Keep output clean and parseable.

Required JSON shape:
{
  "optimizedResume": {
    "summary": "string",
    "experience": [
      {
        "jobTitle": "string",
        "companyName": "string",
        "startDate": "string",
        "endDate": "string",
        "isCurrentJob": false,
        "responsibilities": ["string"]
      }
    ],
    "skills": [
      {
        "name": "string",
        "category": "technical"
      }
    ],
    "education": [
      {
        "degree": "string",
        "university": "string",
        "graduationDate": "string"
      }
    ]
  },
  "estimatedImprovement": {
    "minIncrease": 5,
    "maxIncrease": 15
  },
  "changes": ["string"],
  "projectedScore": 75,
  "projectedCategories": []
}

Current resume:
${currentResumeText}

Target job description:
${jobDescription}

Missing ATS keywords:
${missingKeywords.join(", ")}
`;
}

async function askGemini(prompt: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    contents: prompt,
  });

  return response.text || "";
}

async function askGroq(prompt: string) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You are HireVify Resume Optimization AI. Return only valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.25,
    max_tokens: 1200,
  });

  return response.choices[0]?.message?.content || "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = buildPrompt(body);

  const errors: string[] = [];

  try {
    const text = await askGemini(prompt);
    const result = extractJsonObject(text);

    return NextResponse.json({
      ...fallbackOptimizedResume(body),
      ...result,
      provider: "gemini",
    });
  } catch (error) {
    errors.push(`Gemini failed: ${getErrorMessage(error)}`);
  }

  try {
    const text = await askGroq(prompt);
    const result = extractJsonObject(text);

    return NextResponse.json({
      ...fallbackOptimizedResume(body),
      ...result,
      provider: "groq",
      warning: errors.join(" | "),
    });
  } catch (error) {
    errors.push(`Groq failed: ${getErrorMessage(error)}`);
  }

  return NextResponse.json({
    ...fallbackOptimizedResume(body),
    warning: errors.join(" | "),
  });
}

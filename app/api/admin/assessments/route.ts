import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminSession } from "@/src/lib/server/adminSession";
import { createAdminSupabaseClient } from "@/src/lib/server/adminSupabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const questionSchema = z.object({
  question_text: z.string().trim().min(1).max(2000),
  question_type: z.string().trim().min(1).max(50).default("multiple_choice"),
  options: z.array(z.string().trim().max(500)).max(12).default([]),
  correct_answer: z.string().trim().max(500).default(""),
  points: z.number().int().min(1).max(100).default(1),
});

const assessmentSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).default(""),
  category: z.string().trim().min(1).max(100).default("General"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  duration_minutes: z.number().int().min(5).max(480),
  skills: z.array(z.string().trim().min(1).max(100)).max(50),
  passing_score: z.number().min(0).max(100),
  status: z.enum(["active", "draft", "archived"]),
  questions: z.array(questionSchema).max(200),
});

async function requireAdmin() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for assessment management." },
      { status: 503 },
    );
  }

  const { data: assessments, error } = await supabase
    .from("skills_assessments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (assessments || []).map((item) => item.id).filter(Boolean);
  let questions: Record<string, unknown>[] = [];
  if (ids.length) {
    const result = await supabase
      .from("assessment_questions")
      .select("*")
      .in("assessment_id", ids)
      .order("sort_order", { ascending: true });
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    questions = result.data || [];
  }

  return NextResponse.json({
    assessments: (assessments || []).map((assessment) => {
      const related = questions.filter(
        (question) => question.assessment_id === assessment.id,
      );
      return {
        ...assessment,
        skills: assessment.skills || [],
        questions: related,
        questions_count: related.length,
      };
    }),
  });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = assessmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Assessment data is invalid.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for assessment management." },
      { status: 503 },
    );
  }

  const { id, questions, ...assessment } = parsed.data;
  const payload = {
    ...assessment,
    questions_count: questions.length,
    updated_at: new Date().toISOString(),
  };

  const saved = id
    ? await supabase
        .from("skills_assessments")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("skills_assessments")
        .insert(payload)
        .select("id")
        .single();

  if (saved.error || !saved.data?.id) {
    return NextResponse.json(
      { error: saved.error?.message || "Assessment could not be saved." },
      { status: 500 },
    );
  }

  const assessmentId = saved.data.id;
  const cleared = await supabase
    .from("assessment_questions")
    .delete()
    .eq("assessment_id", assessmentId);
  if (cleared.error) {
    return NextResponse.json({ error: cleared.error.message }, { status: 500 });
  }

  if (questions.length) {
    const inserted = await supabase.from("assessment_questions").insert(
      questions.map((question, index) => ({
        ...question,
        options: question.options.filter(Boolean),
        assessment_id: assessmentId,
        sort_order: index,
        updated_at: new Date().toISOString(),
      })),
    );
    if (inserted.error) {
      return NextResponse.json({ error: inserted.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, id: assessmentId });
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const id = request.nextUrl.searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "A valid assessment id is required." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for assessment management." },
      { status: 503 },
    );
  }

  const questions = await supabase
    .from("assessment_questions")
    .delete()
    .eq("assessment_id", id);
  if (questions.error) {
    return NextResponse.json({ error: questions.error.message }, { status: 500 });
  }

  const assessment = await supabase.from("skills_assessments").delete().eq("id", id);
  if (assessment.error) {
    return NextResponse.json({ error: assessment.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

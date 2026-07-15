import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminSession } from "@/src/lib/server/adminSession";
import { createAdminSupabaseClient } from "@/src/lib/server/adminSupabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

const tableConfig = {
  profiles: { columns: "id,auth_user_id,email,full_name,role,created_at", limit: 1000 },
  candidate_profiles: {
    columns: "id,years_of_experience,experience_summary,skills,resume_url,location,phone,created_at",
    limit: 1000,
  },
  recruiter_profiles: {
    columns: "id,company_name,contact_person,email,industry,location,created_at",
    limit: 1000,
  },
  jobs: { columns: "id,recruiter_id,title,status,has_project,created_at", limit: 1000 },
  applications: {
    columns: "id,job_id,candidate_id,status,match_score,created_at",
    limit: 1000,
  },
  subscriptions: { columns: "*", limit: 1000 },
  skills_assessments: { columns: "*", limit: 500 },
} as const;

async function fetchRows(
  supabase: NonNullable<ReturnType<typeof createAdminSupabaseClient>>,
  table: keyof typeof tableConfig,
) {
  const config = tableConfig[table];
  const run = (columns: string) => {
    let query = supabase.from(table).select(columns).limit(config.limit);
    if (table !== "applications") {
      query = query.order("created_at", { ascending: false });
    }
    return query;
  };

  let { data, error } = await run(config.columns);
  if (error && config.columns !== "*") {
    const fallback = await run("*");
    data = fallback.data;
    error = fallback.error;
  }

  return {
    rows: (data || []) as unknown as Row[],
    warning: error ? `${table}: ${error.message}` : "",
  };
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for the admin panel." },
      { status: 503 },
    );
  }

  const [
    profiles,
    candidateProfiles,
    recruiterProfiles,
    jobs,
    applications,
    subscriptions,
    skillAssessments,
  ] = await Promise.all([
    fetchRows(supabase, "profiles"),
    fetchRows(supabase, "candidate_profiles"),
    fetchRows(supabase, "recruiter_profiles"),
    fetchRows(supabase, "jobs"),
    fetchRows(supabase, "applications"),
    fetchRows(supabase, "subscriptions"),
    fetchRows(supabase, "skills_assessments"),
  ]);

  return NextResponse.json({
    profiles: profiles.rows,
    candidateProfiles: candidateProfiles.rows,
    recruiterProfiles: recruiterProfiles.rows,
    jobs: jobs.rows,
    applications: applications.rows,
    subscriptions: subscriptions.rows,
    assessments: skillAssessments.rows,
    warnings: [
      profiles.warning,
      candidateProfiles.warning,
      recruiterProfiles.warning,
      jobs.warning,
      applications.warning,
      subscriptions.warning,
      skillAssessments.warning,
    ].filter(Boolean),
  });
}

const planUpdateSchema = z.object({
  userId: z.string().uuid(),
  tier: z.enum(["free", "pro"]),
});

export async function PATCH(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = planUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan update." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for plan updates." },
      { status: 503 },
    );
  }

  const { userId, tier } = parsed.data;
  const expiresAt =
    tier === "pro"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      tier,
      status: "active",
      expires_at: expiresAt,
      auto_renew: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, tier, expiresAt });
}

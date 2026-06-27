import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CheckStatus = "connected" | "warning" | "error";

type CheckResult = {
  name: string;
  status: CheckStatus;
  detail: string;
};

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const checks: CheckResult[] = [];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      "";

    const projectId = supabaseUrl
      ? new URL(supabaseUrl).hostname.split(".")[0]
      : "unknown";

    if (!supabaseUrl || !anonKey) {
      checks.push({
        name: "Server environment",
        status: "error",
        detail: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      });

      return NextResponse.json({
        project: {
          projectId,
          supabaseUrl,
          serviceRoleConfigured: Boolean(serviceRoleKey),
        },
        checks,
      });
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`,
      {
        cache: "no-store",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      },
    );

    checks.push({
      name: "Server REST API",
      status: response.ok ? "connected" : "warning",
      detail: response.ok
        ? "Server route connected to Supabase REST successfully."
        : `Server route reached Supabase, but REST returned ${response.status}.`,
    });

    checks.push({
      name: "Server service role",
      status: serviceRoleKey ? "connected" : "warning",
      detail: serviceRoleKey
        ? "Service role key is configured on the server."
        : "Service role key is not configured. This is okay for browser-only MVP checks.",
    });

    return NextResponse.json({
      project: {
        projectId,
        supabaseUrl,
        serviceRoleConfigured: Boolean(serviceRoleKey),
      },
      checks,
    });
  } catch (error) {
    checks.push({
      name: "Server route",
      status: "error",
      detail: error instanceof Error ? error.message : "Unknown server route error.",
    });

    return NextResponse.json(
      {
        project: {
          projectId: "unknown",
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          serviceRoleConfigured: Boolean(
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
              process.env.SUPABASE_SERVICE_ROLE,
          ),
        },
        checks,
      },
      { status: 500 },
    );
  }
}

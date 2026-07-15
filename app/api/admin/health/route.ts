import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasAdminSession } from "@/src/lib/server/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthStatus = "healthy" | "warning" | "error";

type HealthCheck = {
  name: string;
  status: HealthStatus;
  detail: string;
};

const importantTables = [
  "profiles",
  "candidate_profiles",
  "recruiter_profiles",
  "jobs",
  "applications",
  "conversations",
  "messages",
  "notifications",
];

const knownBuckets = ["resumes", "project-files", "job-project-attachments", "chat-attachments"];

function safeError(error: unknown) {
  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    message = [record.message, record.details, record.hint, record.code]
      .map((value) => (typeof value === "string" ? value : ""))
      .filter(Boolean)
      .join(" ");

    if (!message) {
      try {
        message = JSON.stringify(error);
      } catch {
        message = "";
      }
    }
  } else {
    message = String(error || "");
  }

  if (!message || message === "{}") {
    return "permission limited or not readable with current admin health credentials";
  }

  const lower = message.toLowerCase();

  if (lower.includes("api key") && lower.includes("missing")) return "missing API key";
  if (lower.includes("unauthorized") || lower.includes("401") || lower.includes("invalid api key")) return "unauthorized";
  if (lower.includes("rate") || lower.includes("429")) return "rate limited";
  if (lower.includes("fetch failed") || lower.includes("network") || lower.includes("timeout")) return "provider unavailable";
  if (lower.includes("permission") || lower.includes("rls")) return "permission denied";

  return message.slice(0, 160);
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checkedAt = new Date().toISOString();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const errors: string[] = [];

  if (!supabaseUrl || !anonKey) {
    const missing = "Missing Supabase environment variables.";
    return NextResponse.json(
      {
        checkedAt,
        coreServices: {
          database: { name: "Database", status: "error", detail: missing },
          auth: { name: "Auth", status: "error", detail: missing },
          storage: { name: "Storage", status: "error", detail: missing },
          ai: { name: "AI", status: "warning", detail: "AI provider not checked because Supabase config is missing." },
        },
        tables: [],
        storageBuckets: [],
        environment: {
          nextRuntime: "nodejs",
          supabaseConfigured: false,
          aiProvider: process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : process.env.OPENROUTER_API_KEY ? "openrouter" : "none"),
        },
        errors: [missing],
      },
      { status: 503 },
    );
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let database: HealthCheck = { name: "Database", status: "warning", detail: "Not checked." };
  let auth: HealthCheck = { name: "Auth", status: "warning", detail: "Not checked." };
  let storage: HealthCheck = { name: "Storage", status: "warning", detail: "Not checked." };
  let ai: HealthCheck = { name: "AI", status: "warning", detail: "Not checked." };

  try {
    const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
    database = error
      ? { name: "Database", status: "error", detail: safeError(error) }
      : { name: "Database", status: "healthy", detail: "Supabase database responded to a lightweight query." };
    if (error) errors.push(`Database: ${safeError(error)}`);
  } catch (error) {
    database = { name: "Database", status: "error", detail: safeError(error) };
    errors.push(`Database: ${safeError(error)}`);
  }

  try {
    const { error } = await supabase.auth.getSession();
    auth = error
      ? { name: "Auth", status: "warning", detail: safeError(error) }
      : { name: "Auth", status: "healthy", detail: "Supabase auth client is reachable." };
    if (error) errors.push(`Auth: ${safeError(error)}`);
  } catch (error) {
    auth = { name: "Auth", status: "error", detail: safeError(error) };
    errors.push(`Auth: ${safeError(error)}`);
  }

  const tables = await Promise.all(
    importantTables.map(async (table) => {
      try {
        const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
        if (error) {
          const detail = safeError(error);
          if (detail !== "permission denied") {
            errors.push(`${table}: ${detail}`);
          }
          return { name: table, status: "warning" as HealthStatus, rowCount: null, detail };
        }
        return { name: table, status: "healthy" as HealthStatus, rowCount: count ?? 0, detail: "Readable." };
      } catch (error) {
        const detail = safeError(error);
        errors.push(`${table}: ${detail}`);
        return { name: table, status: "error" as HealthStatus, rowCount: null, detail };
      }
    }),
  );

  let availableBuckets: { name: string }[] = [];
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      const detail = safeError(error);
      storage = { name: "Storage", status: "warning", detail };
      if (detail !== "permission denied") {
        errors.push(`Storage: ${detail}`);
      }
    } else {
      availableBuckets = (data || []).map((bucket) => ({ name: bucket.name }));
      storage = { name: "Storage", status: "healthy", detail: `${availableBuckets.length} bucket(s) visible to the admin health route.` };
    }
  } catch (error) {
    storage = { name: "Storage", status: "error", detail: safeError(error) };
    errors.push(`Storage: ${safeError(error)}`);
  }

  const bucketNames = new Set(availableBuckets.map((bucket) => bucket.name));
  const storageBuckets = knownBuckets.map((bucket) => {
    if (bucketNames.has(bucket)) {
      return { name: bucket, bucket, status: "healthy" as HealthStatus, detail: "Bucket exists and is visible." };
    }
    if (storage.status === "warning") {
      return { name: bucket, bucket, status: "warning" as HealthStatus, detail: "Bucket listing is permission limited. Verify bucket exists in Supabase Storage." };
    }
    return { name: bucket, bucket, status: "warning" as HealthStatus, detail: "Bucket missing or not readable with current permissions." };
  });

  const configuredProvider =
    process.env.AI_PROVIDER ||
    (process.env.GEMINI_API_KEY
      ? "gemini"
      : process.env.OPENAI_API_KEY
        ? "openai"
        : process.env.OPENROUTER_API_KEY
          ? "openrouter"
          : "none");
  ai =
    configuredProvider === "none"
      ? { name: "AI", status: "warning", detail: "No AI provider is configured." }
      : {
          name: "AI",
          status: "healthy",
          detail: `${configuredProvider} credentials are configured. No paid test request was sent.`,
        };

  return NextResponse.json({
    checkedAt,
    coreServices: { database, auth, storage, ai },
    tables,
    storageBuckets,
    environment: {
      nextRuntime: "nodejs",
      supabaseConfigured: true,
      aiProvider: configuredProvider,
    },
    errors,
  });
}

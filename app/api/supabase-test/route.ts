import {
  supabase,
  supabaseApiHeaders,
  supabaseFunctionsUrl,
  supabaseProjectId,
  supabaseRestUrl,
  supabaseStorageUrl,
  supabaseUrl,
} from "@/src/lib/supabase";

export const dynamic = "force-dynamic";

type CheckStatus = "connected" | "warning" | "error";

interface CheckResult {
  name: string;
  status: CheckStatus;
  detail: string;
  httpStatus?: number;
}

function classifyHttpStatus(status: number): CheckStatus {
  if (status >= 200 && status < 300) {
    return "connected";
  }

  if (status === 401 || status === 403 || status === 404) {
    return "warning";
  }

  return "error";
}

async function readResponseDetail(response: Response) {
  const body = await response.text().catch(() => "");
  return body.slice(0, 280) || response.statusText;
}

async function checkFetch(
  name: string,
  url: string,
  warningDetail: string,
): Promise<CheckResult> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: supabaseApiHeaders,
    });
    const status = classifyHttpStatus(response.status);

    return {
      name,
      status,
      httpStatus: response.status,
      detail:
        status === "connected"
          ? "Endpoint responded successfully."
          : `${warningDetail} (${await readResponseDetail(response)})`,
    };
  } catch (error) {
    return {
      name,
      status: "error",
      detail: error instanceof Error ? error.message : "Request failed.",
    };
  }
}

export async function GET() {
  const checks: CheckResult[] = [];

  try {
    const { error, status } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    checks.push({
      name: "Supabase JS database client",
      status: error ? "warning" : "connected",
      httpStatus: status,
      detail: error
        ? `Database endpoint reached, but the profiles query returned: ${error.message}`
        : "profiles query completed through @supabase/supabase-js.",
    });
  } catch (error) {
    checks.push({
      name: "Supabase JS database client",
      status: "error",
      detail: error instanceof Error ? error.message : "Database query failed.",
    });
  }

  try {
    const { data, error } = await supabase.auth.getSession();

    checks.push({
      name: "Auth client",
      status: error ? "warning" : "connected",
      detail: error
        ? `Auth endpoint reached, but session lookup returned: ${error.message}`
        : data.session
          ? "Auth session is available on this request."
          : "Auth endpoint reached. No active server-side session for this request.",
    });
  } catch (error) {
    checks.push({
      name: "Auth client",
      status: "error",
      detail: error instanceof Error ? error.message : "Auth check failed.",
    });
  }

  checks.push(
    await checkFetch(
      "REST API",
      `${supabaseRestUrl}/profiles?select=id&limit=1`,
      "REST endpoint reached, but the anonymous key/policies did not allow this request.",
    ),
  );

  checks.push(
    await checkFetch(
      "Storage API",
      `${supabaseStorageUrl}/bucket`,
      "Storage endpoint reached, but bucket listing may require authenticated policies or a service role.",
    ),
  );

  checks.push(
    await checkFetch(
      "Edge Functions API",
      `${supabaseFunctionsUrl}/make-server-d4feca44/public-health-check`,
      "Functions endpoint reached, but this function may be undeployed or protected.",
    ),
  );

  return Response.json({
    project: {
      id: supabaseProjectId,
      url: supabaseUrl,
      restUrl: supabaseRestUrl,
      storageUrl: supabaseStorageUrl,
      functionsUrl: supabaseFunctionsUrl,
      anonKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    checks,
    checkedAt: new Date().toISOString(),
  });
}

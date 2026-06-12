"use client";

import { useEffect, useMemo, useState } from "react";
import {
  supabase,
  supabaseApiHeaders,
  supabaseFunctionsUrl,
  supabaseProjectId,
  supabaseRestUrl,
  supabaseStorageUrl,
  supabaseUrl,
} from "@/src/lib/supabase";

type CheckStatus = "checking" | "connected" | "warning" | "error";

interface CheckResult {
  name: string;
  status: CheckStatus;
  detail: string;
  httpStatus?: number;
}

interface ServerResult {
  project: {
    id: string;
    url: string;
    restUrl: string;
    storageUrl: string;
    functionsUrl: string;
    anonKeyConfigured: boolean;
    serviceRoleConfigured: boolean;
  };
  checks: CheckResult[];
  checkedAt: string;
}

const statusLabel: Record<CheckStatus, string> = {
  checking: "Checking",
  connected: "Connected",
  warning: "Warning",
  error: "Error",
};

const statusClass: Record<CheckStatus, string> = {
  checking: "border-slate-200 bg-slate-50 text-slate-700",
  connected: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-red-200 bg-red-50 text-red-700",
};

function classifyHttpStatus(status: number): CheckStatus {
  if (status >= 200 && status < 300) {
    return "connected";
  }

  if (status === 401 || status === 403 || status === 404) {
    return "warning";
  }

  return "error";
}

async function responseDetail(response: Response) {
  const body = await response.text().catch(() => "");
  return body.slice(0, 220) || response.statusText;
}

async function runFetchCheck(
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
          : `${warningDetail} (${await responseDetail(response)})`,
    };
  } catch (error) {
    return {
      name,
      status: "error",
      detail: error instanceof Error ? error.message : "Request failed.",
    };
  }
}

export default function SupabaseTestPage() {
  const [browserChecks, setBrowserChecks] = useState<CheckResult[]>([
    {
      name: "Browser database client",
      status: "checking",
      detail: "Waiting to query profiles.",
    },
    {
      name: "Browser auth client",
      status: "checking",
      detail: "Waiting to inspect local auth session.",
    },
    {
      name: "Browser REST API",
      status: "checking",
      detail: "Waiting to call REST endpoint.",
    },
    {
      name: "Browser storage API",
      status: "checking",
      detail: "Waiting to call storage endpoint.",
    },
    {
      name: "Browser edge functions API",
      status: "checking",
      detail: "Waiting to call edge function endpoint.",
    },
  ]);
  const [serverResult, setServerResult] = useState<ServerResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const endpoints = useMemo(
    () => [
      { label: "Project", value: supabaseUrl },
      { label: "Project ID", value: supabaseProjectId },
      { label: "REST", value: supabaseRestUrl },
      { label: "Storage", value: supabaseStorageUrl },
      { label: "Functions", value: supabaseFunctionsUrl },
    ],
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function runChecks() {
      const nextChecks: CheckResult[] = [];

      try {
        const { error, status } = await supabase
          .from("profiles")
          .select("id")
          .limit(1);

        nextChecks.push({
          name: "Browser database client",
          status: error ? "warning" : "connected",
          httpStatus: status,
          detail: error
            ? `Database endpoint reached, but profiles query returned: ${error.message}`
            : "profiles query completed through @supabase/supabase-js.",
        });
      } catch (error) {
        nextChecks.push({
          name: "Browser database client",
          status: "error",
          detail: error instanceof Error ? error.message : "Database query failed.",
        });
      }

      try {
        const { data, error } = await supabase.auth.getSession();

        nextChecks.push({
          name: "Browser auth client",
          status: error ? "warning" : "connected",
          detail: error
            ? `Auth endpoint reached, but session lookup returned: ${error.message}`
            : data.session
              ? "Auth session found in browser storage."
              : "Auth endpoint reached. No active browser session.",
        });
      } catch (error) {
        nextChecks.push({
          name: "Browser auth client",
          status: "error",
          detail: error instanceof Error ? error.message : "Auth check failed.",
        });
      }

      nextChecks.push(
        await runFetchCheck(
          "Browser REST API",
          `${supabaseRestUrl}/profiles?select=id&limit=1`,
          "REST endpoint reached, but anonymous policies did not allow this request.",
        ),
      );

      nextChecks.push(
        await runFetchCheck(
          "Browser storage API",
          `${supabaseStorageUrl}/bucket`,
          "Storage endpoint reached, but bucket listing may require authenticated policies.",
        ),
      );

      nextChecks.push(
        await runFetchCheck(
          "Browser edge functions API",
          `${supabaseFunctionsUrl}/make-server-d4feca44/public-health-check`,
          "Functions endpoint reached, but this function may be undeployed or protected.",
        ),
      );

      if (!cancelled) {
        setBrowserChecks(nextChecks);
      }

      try {
        const response = await fetch("/api/supabase-test", {
          cache: "no-store",
        });
                const contentType = response.headers.get("content-type") || "";
        const bodyText = await response.text();

        if (!contentType.includes("application/json")) {
          throw new Error(
            `Server check returned ${response.status} ${contentType || "unknown content type"}: ${bodyText.slice(0, 120)}`
          );
        }

        const payload = JSON.parse(bodyText) as ServerResult;

        if (!response.ok) {
                    const payloadMessage = (payload as { detail?: string; error?: string; message?: string }).detail
            || (payload as { detail?: string; error?: string; message?: string }).error
            || (payload as { detail?: string; error?: string; message?: string }).message
            || "Server check failed.";
          throw new Error(payloadMessage);
        }

        if (!cancelled) {
          setServerResult(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setServerError(
            error instanceof Error ? error.message : "Server check failed.",
          );
        }
      }
    }

    runChecks();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                HireVify Supabase Test
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
                Database, API, auth, storage, and functions checks
              </h1>
            </div>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              localhost:3000/supabase-test
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.label}
                className="rounded-md border border-slate-200 bg-slate-50 p-3"
              >
                <div className="text-xs font-semibold uppercase text-slate-500">
                  {endpoint.label}
                </div>
                <div className="mt-1 break-all text-sm text-slate-800">
                  {endpoint.value || "Not configured"}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <CheckPanel title="Browser Checks" checks={browserChecks} />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">
                Server Route Checks
              </h2>
              {serverResult && (
                <span className="text-xs text-slate-500">
                  {new Date(serverResult.checkedAt).toLocaleString()}
                </span>
              )}
            </div>

            {serverError ? (
              <CheckCard
                check={{
                  name: "Server route",
                  status: "error",
                  detail: serverError,
                }}
              />
            ) : serverResult ? (
              <div className="space-y-3">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  Service role configured:{" "}
                  <span className="font-semibold">
                    {serverResult.project.serviceRoleConfigured ? "yes" : "no"}
                  </span>
                </div>
                {serverResult.checks.map((check) => (
                  <CheckCard key={check.name} check={check} />
                ))}
              </div>
            ) : (
              <CheckCard
                check={{
                  name: "Server route",
                  status: "checking",
                  detail: "Waiting for /api/supabase-test.",
                }}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function CheckPanel({
  title,
  checks,
}: {
  title: string;
  checks: CheckResult[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-950">{title}</h2>
      <div className="space-y-3">
        {checks.map((check) => (
          <CheckCard key={check.name} check={check} />
        ))}
      </div>
    </div>
  );
}

function CheckCard({ check }: { check: CheckResult }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-medium text-slate-950">{check.name}</h3>
        <span
          className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass[check.status]}`}
        >
          {statusLabel[check.status]}
          {check.httpStatus ? ` ${check.httpStatus}` : ""}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{check.detail}</p>
    </div>
  );
}

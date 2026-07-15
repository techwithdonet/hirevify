import "server-only";

import { NextResponse } from "next/server";
import { authenticateSupabaseRequest } from "./supabaseAuth";
import { checkRateLimit, rateLimitHeaders } from "./rateLimit";

const MAX_AI_BODY_BYTES = 256 * 1024;

export async function authorizeAiRequest(
  request: Request,
  action: string,
  options: { requirePremium?: boolean } = {},
) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_AI_BODY_BYTES) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "The request is too large." },
        { status: 413 },
      ),
    };
  }

  const authentication = await authenticateSupabaseRequest(request);
  if (!authentication.ok) return authentication;

  if (options.requirePremium) {
    const { user, supabase } = authentication.auth;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    const possibleUserIds = Array.from(new Set([profile?.id, user.id].filter(Boolean)));
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("tier,status,expires_at")
      .in("user_id", possibleUserIds);
    const now = Date.now();
    const hasPremium = (subscriptions || []).some((subscription) => {
      const expiresAt = subscription.expires_at
        ? new Date(subscription.expires_at).getTime()
        : Number.POSITIVE_INFINITY;
      return (
        subscription.tier === "pro" &&
        subscription.status === "active" &&
        expiresAt > now
      );
    });

    if (!hasPremium) {
      return {
        ok: false as const,
        response: NextResponse.json(
          { error: "This AI feature requires a Pro plan." },
          { status: 403 },
        ),
      };
    }
  }

  const limit = checkRateLimit(`ai:${action}:${authentication.auth.user.id}`, {
    limit: 15,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "AI request limit reached. Please try again later." },
        { status: 429, headers: rateLimitHeaders(limit) },
      ),
    };
  }

  return {
    ok: true as const,
    auth: authentication.auth,
    headers: rateLimitHeaders(limit),
  };
}

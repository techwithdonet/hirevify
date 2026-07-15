import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  isAdminSessionConfigured,
} from "@/src/lib/server/adminSession";
import {
  checkRateLimit,
  getRequestIp,
  rateLimitHeaders,
} from "@/src/lib/server/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = checkRateLimit(`admin-login:${getRequestIp(request)}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  if (!isAdminSessionConfigured()) {
    return NextResponse.json(
      { error: "Admin sessions are not configured on the server." },
      { status: 503, headers: rateLimitHeaders(limit) },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Authentication service is not configured." },
      { status: 503, headers: rateLimitHeaders(limit) },
    );
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || username.length > 80 || !password || password.length > 256) {
    return NextResponse.json(
      { error: "Enter a valid admin username and password." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc("verify_admin_panel_login", {
    p_username: username,
    p_password: password,
  });

  if (error || data !== true) {
    return NextResponse.json(
      { error: "Invalid admin username or password." },
      { status: 401, headers: rateLimitHeaders(limit) },
    );
  }

  const response = NextResponse.json(
    { success: true },
    { headers: rateLimitHeaders(limit) },
  );
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return response;
}

import "server-only";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type AuthenticatedRequest = {
  user: User;
  accessToken: string;
  supabase: SupabaseClient;
};

type AuthenticationResult =
  | { ok: true; auth: AuthenticatedRequest }
  | { ok: false; response: NextResponse };

export async function authenticateSupabaseRequest(
  request: Request,
): Promise<AuthenticationResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication service is not configured." },
        { status: 503 },
      ),
    };
  }

  const accessToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  if (!accessToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Please sign in to use this feature." },
        { status: 401 },
      ),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your session is no longer valid. Please sign in again." },
        { status: 401 },
      ),
    };
  }

  return { ok: true, auth: { user: data.user, accessToken, supabase } };
}

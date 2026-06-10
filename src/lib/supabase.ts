import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";

const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing required Supabase environment variable: ${name}`);
  }

  return value;
}

function getProjectId(url: string) {
  try {
    return new URL(url).hostname.split(".")[0] || "";
  } catch {
    return "";
  }
}

export const supabaseUrl = requireEnv(
  envSupabaseUrl,
  "NEXT_PUBLIC_SUPABASE_URL",
);
export const supabaseAnonKey = requireEnv(
  envSupabaseAnonKey,
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
);
export const supabaseProjectId = getProjectId(supabaseUrl);
export const supabaseRestUrl = `${supabaseUrl}/rest/v1`;
export const supabaseStorageUrl = `${supabaseUrl}/storage/v1`;
export const supabaseFunctionsUrl = `${supabaseUrl}/functions/v1`;
export const supabaseApiHeaders = {
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
};

const isBrowser = typeof window !== "undefined";
let browserClient: SupabaseClient | null = null;

export function createSupabaseClient(
  options?: SupabaseClientOptions<"public">,
) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
      flowType: "pkce",
      storage: isBrowser ? window.localStorage : undefined,
      storageKey: "hirevify-auth-token",
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "X-Client-Info": "hirevify-next",
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    ...options,
  });
}

export function createSupabaseBrowserClient() {
  if (!isBrowser) {
    return createSupabaseClient();
  }

  if (!browserClient) {
    browserClient = createSupabaseClient();
  }

  return browserClient;
}

export function resetSupabaseBrowserClient() {
  browserClient = null;
}

export function isSupabaseBrowserClientInitialized() {
  return browserClient !== null;
}

export function getSupabaseBrowserClientInstance() {
  return createSupabaseBrowserClient();
}

export const supabase = createSupabaseBrowserClient();

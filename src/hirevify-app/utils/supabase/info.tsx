import {
  supabaseAnonKey,
  supabaseFunctionsUrl,
  supabaseProjectId,
  supabaseRestUrl,
  supabaseStorageUrl,
  supabaseUrl,
} from "@/src/lib/supabase";

export const projectId = supabaseProjectId;
export const publicAnonKey = supabaseAnonKey;
export const projectUrl = supabaseUrl;
export const restApiUrl = supabaseRestUrl;
export const storageApiUrl = supabaseStorageUrl;
export const functionsApiUrl = supabaseFunctionsUrl;
export const makeServerFunctionName = "make-server-d4feca44";
export const apiBaseUrl = `${functionsApiUrl}/${makeServerFunctionName}`;

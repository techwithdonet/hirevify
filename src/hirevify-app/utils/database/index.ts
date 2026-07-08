import { supabaseProvider } from "./supabaseProvider";

export const db = supabaseProvider;

export type {
  DatabaseProvider,
  DbFilter,
  DbResult,
  DbSelectOptions,
} from "./databaseProvider";

import { DatabaseProvider, DbFilter, DbResult, DbSelectOptions } from "./databaseProvider";
import { getSupabaseBrowserClient } from "./supabaseClient";

function applyFilters(query: any, filters?: DbFilter[]) {
  if (!filters || filters.length === 0) {
    return query;
  }

  for (const filter of filters) {
    query = query.eq(filter.column, filter.value);
  }

  return query;
}

export const supabaseProvider: DatabaseProvider = {
  async select<T>(table: string, options?: DbSelectOptions): Promise<DbResult<T[]>> {
    const supabase = getSupabaseBrowserClient();

    let query = supabase.from(table).select(options?.columns || "*");

    query = applyFilters(query, options?.filters);

    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? true,
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as T[], error: null };
  },

  async selectOne<T>(table: string, options?: DbSelectOptions): Promise<DbResult<T | null>> {
    const supabase = getSupabaseBrowserClient();

    let query = supabase
      .from(table)
      .select(options?.columns || "*")
      .limit(1)
      .maybeSingle();

    query = applyFilters(query, options?.filters);

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as T | null, error: null };
  },

  async insert<T>(table: string, payload: Record<string, unknown>): Promise<DbResult<T>> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as T, error: null };
  },

  async upsert<T>(
    table: string,
    payload: Record<string, unknown> | Record<string, unknown>[],
    conflictColumns?: string
  ): Promise<DbResult<T[]>> {
    const supabase = getSupabaseBrowserClient();

    const query = conflictColumns
      ? supabase.from(table).upsert(payload, { onConflict: conflictColumns }).select()
      : supabase.from(table).upsert(payload).select();

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as T[], error: null };
  },

  async update<T>(
    table: string,
    payload: Record<string, unknown>,
    filters: DbFilter[]
  ): Promise<DbResult<T[]>> {
    const supabase = getSupabaseBrowserClient();

    let query = supabase.from(table).update(payload).select();

    query = applyFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as T[], error: null };
  },

  async remove<T>(table: string, filters: DbFilter[]): Promise<DbResult<T[]>> {
    const supabase = getSupabaseBrowserClient();

    let query = supabase.from(table).delete().select();

    query = applyFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as T[], error: null };
  },
};

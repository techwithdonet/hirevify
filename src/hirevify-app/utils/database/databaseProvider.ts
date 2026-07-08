export type DbFilter = {
  column: string;
  value: string | number | boolean | null;
};

export type DbOrder = {
  column: string;
  ascending?: boolean;
};

export type DbSelectOptions = {
  columns?: string;
  filters?: DbFilter[];
  order?: DbOrder;
  limit?: number;
};

export type DbResult<T> = {
  data: T | null;
  error: string | null;
};

export interface DatabaseProvider {
  select<T>(
    table: string,
    options?: DbSelectOptions
  ): Promise<DbResult<T[]>>;

  selectOne<T>(
    table: string,
    options?: DbSelectOptions
  ): Promise<DbResult<T | null>>;

  insert<T>(
    table: string,
    payload: Record<string, unknown>
  ): Promise<DbResult<T>>;

  upsert<T>(
    table: string,
    payload: Record<string, unknown> | Record<string, unknown>[],
    conflictColumns?: string
  ): Promise<DbResult<T[]>>;

  update<T>(
    table: string,
    payload: Record<string, unknown>,
    filters: DbFilter[]
  ): Promise<DbResult<T[]>>;

  remove<T>(
    table: string,
    filters: DbFilter[]
  ): Promise<DbResult<T[]>>;
}

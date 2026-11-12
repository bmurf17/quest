import type { PostgrestError } from "@supabase/supabase-js";

export interface QueryResult<T> {
  data: T;
  error: PostgrestError | null;
}

/**
 * Unwraps a Supabase query result, throwing the database error if present.
 * Intended for `.then(unwrapQuery)` chains where an error must abort the
 * surrounding operation instead of silently returning partial data.
 */
export function unwrapQuery<T>({ data, error }: QueryResult<T>): T {
  if (error) throw error;
  return data;
}

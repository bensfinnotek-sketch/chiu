import { createSupabaseProvider } from "../database/supabaseProvider.ts";
import type { DatabaseContext, RepositoryResult } from "../database/provider.ts";

export type LearningTable =
  | "lessons"
  | "vocabulary"
  | "grammar"
  | "mistakes"
  | "reviews"
  | "conversations"
  | "conversation_messages"
  | "progress"
  | "streaks"
  | "achievements"
  | "subscriptions"
  | "usage";

export async function listUserRows<T = any>(ctx: DatabaseContext, table: LearningTable): Promise<RepositoryResult<T[]>> {
  const provider = createSupabaseProvider(ctx.accessToken);
  if (!provider) return { data: null, error: "DATABASE_NOT_CONFIGURED" };
  try {
    const data = await provider.query<T[]>(table, "select", {
      filters: [{ column: "user_id", value: ctx.userId }],
    });
    return { data: data || [] };
  } catch (error: any) {
    return { data: null, error: error?.message || `${table.toUpperCase()}_READ_FAILED` };
  }
}

export async function insertUserRow<T = any>(ctx: DatabaseContext, table: LearningTable, values: Record<string, unknown>): Promise<RepositoryResult<T>> {
  const provider = createSupabaseProvider(ctx.accessToken);
  if (!provider) return { data: null, error: "DATABASE_NOT_CONFIGURED" };
  try {
    const data = await provider.query<T>(table, "insert", { values: { ...values, user_id: ctx.userId } });
    return { data };
  } catch (error: any) {
    return { data: null, error: error?.message || `${table.toUpperCase()}_WRITE_FAILED` };
  }
}

export async function updateUserRow<T = any>(ctx: DatabaseContext, table: LearningTable, id: string, values: Record<string, unknown>): Promise<RepositoryResult<T>> {
  const provider = createSupabaseProvider(ctx.accessToken);
  if (!provider) return { data: null, error: "DATABASE_NOT_CONFIGURED" };
  try {
    const data = await provider.query<T>(table, "update", {
      values: { ...values, updated_at: new Date().toISOString() },
      filters: [{ column: "id", value: id }, { column: "user_id", value: ctx.userId }],
    });
    return { data };
  } catch (error: any) {
    return { data: null, error: error?.message || `${table.toUpperCase()}_WRITE_FAILED` };
  }
}

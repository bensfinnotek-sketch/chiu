import { createSupabaseProvider } from "../database/supabaseProvider.ts";
import type { DatabaseContext, RepositoryResult } from "../database/provider.ts";

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  nativeLanguage: string;
  targetLanguage: string;
  level: string;
  hskLevel: number;
  goals: string[];
  createdAt: string;
  updatedAt: string;
}

function mapProfile(row: any): UserRecord {
  return {
    id: row.id,
    email: row.email || "",
    displayName: row.display_name || "",
    avatar: row.avatar || null,
    nativeLanguage: row.native_language || "vi",
    targetLanguage: row.target_language || "zh-CN",
    level: row.level || "new",
    hskLevel: Number(row.hsk_level || 1),
    goals: Array.isArray(row.goals) ? row.goals : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserProfile(ctx: DatabaseContext): Promise<RepositoryResult<UserRecord>> {
  const provider = createSupabaseProvider(ctx.accessToken);
  if (!provider) return { data: null, error: "DATABASE_NOT_CONFIGURED" };
  try {
    const row = await provider.query<any>("profiles", "select", {
      filters: [{ column: "id", value: ctx.userId }],
      single: true,
    });
    return { data: row ? mapProfile(row) : null };
  } catch (error: any) {
    return { data: null, error: error?.message || "PROFILE_READ_FAILED" };
  }
}

export async function upsertUserProfile(
  ctx: DatabaseContext,
  input: Partial<Omit<UserRecord, "id" | "createdAt" | "updatedAt">>
): Promise<RepositoryResult<UserRecord>> {
  const provider = createSupabaseProvider(ctx.accessToken);
  if (!provider) return { data: null, error: "DATABASE_NOT_CONFIGURED" };
  try {
    const values = {
      id: ctx.userId,
      email: input.email || undefined,
      display_name: input.displayName || undefined,
      avatar: input.avatar ?? undefined,
      native_language: input.nativeLanguage || "vi",
      target_language: input.targetLanguage || "zh-CN",
      level: input.level || "new",
      hsk_level: input.hskLevel || 1,
      goals: input.goals || [],
      updated_at: new Date().toISOString(),
    };
    const row = await provider.query<any>("profiles", "insert", { values, single: true });
    return { data: mapProfile(row) };
  } catch (error: any) {
    return { data: null, error: error?.message || "PROFILE_WRITE_FAILED" };
  }
}

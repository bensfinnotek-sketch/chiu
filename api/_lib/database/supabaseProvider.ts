import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseProvider } from "./provider.ts";

const url = () => process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim() || "";
const anonKey = () => process.env.SUPABASE_ANON_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim() || "";
const serviceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

export function createSupabaseProvider(accessToken?: string | null): SupabaseProvider | null {
  const baseUrl = url();
  const key = serviceRoleKey() || anonKey();
  if (!baseUrl || !key) return null;
  const options: Record<string, unknown> = { auth: { persistSession: false, autoRefreshToken: false } };
  if (accessToken && !serviceRoleKey()) options.global = { headers: { Authorization: `Bearer ${accessToken}` } };
  return new SupabaseProvider(createClient(baseUrl, key, options));
}

export class SupabaseProvider implements DatabaseProvider {
  readonly kind = "supabase" as const;
  readonly configured = true;
  constructor(private readonly client: SupabaseClient) {}

  async query<T = unknown>(table: string, operation: "select" | "insert" | "update" | "delete" | "upsert", input: any): Promise<T> {
    let query: any = this.client.from(table);
    if (operation === "select") {
      query = query.select(input?.columns || "*");
      for (const filter of input?.filters || []) query = query.eq(filter.column, filter.value);
      if (input?.single) query = query.maybeSingle();
    } else if (operation === "insert") {
      query = query.insert(input.values).select(input.columns || "*");
      if (input.single !== false) query = query.single();
    } else if (operation === "upsert") {
      query = query.upsert(input.values, { onConflict: input.onConflict, ignoreDuplicates: false }).select(input.columns || "*");
      if (input.single !== false) query = query.single();
    } else if (operation === "update") {
      query = query.update(input.values);
      for (const filter of input?.filters || []) query = query.eq(filter.column, filter.value);
      query = query.select(input.columns || "*");
      if (input.single !== false) query = query.maybeSingle();
    } else {
      query = query.delete();
      for (const filter of input?.filters || []) query = query.eq(filter.column, filter.value);
      if (input.select) query = query.select(input.select);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as T;
  }
}

export function databaseProviderConfigured(): boolean {
  return Boolean(url() && (serviceRoleKey() || anonKey()));
}

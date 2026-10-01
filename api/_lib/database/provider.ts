export interface DatabaseProvider {
  readonly kind: "supabase" | "postgres" | "none";
  readonly configured: boolean;
  query<T = unknown>(table: string, operation: "select" | "insert" | "update" | "delete", input: unknown): Promise<T>;
}

export interface DatabaseContext {
  userId: string;
  accessToken?: string | null;
}

export type RepositoryResult<T> = {
  data: T | null;
  error?: string;
};

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("Database provider is not configured. Local/demo mode remains available.");
    this.name = "DatabaseNotConfiguredError";
  }
}

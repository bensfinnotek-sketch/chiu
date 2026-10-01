import type { DatabaseProvider } from "./provider.ts";

export interface PostgresExecutor {
  query<T = unknown>(sql: string, values?: unknown[]): Promise<{ rows: T[] }>;
}

/**
 * Direct PostgreSQL adapter boundary.
 *
 * The application intentionally does not bundle a specific PostgreSQL driver here.
 * A deployment can inject node-postgres, postgres.js, Neon, or another PostgreSQL
 * driver through this tiny executor contract without changing repositories.
 */
export class PostgresProvider implements DatabaseProvider {
  readonly kind = "postgres" as const;
  readonly configured = true;

  constructor(private readonly executor: PostgresExecutor) {}

  async query<T = unknown>(table: string, operation: "select" | "insert" | "update" | "delete" | "upsert", input: any): Promise<T> {
    if (!/^[a-z_][a-z0-9_]*$/.test(table)) throw new Error("Invalid table name");
    if (operation !== "select") throw new Error("Direct Postgres writes must be implemented by a deployment-specific repository adapter.");
    const filters = (input?.filters || []).filter((item: any) => /^[a-z_][a-z0-9_]*$/.test(item.column));
    const where = filters.length ? " where " + filters.map((item: any) => `${item.column} = $${filters.indexOf(item) + 1}`).join(" and ") : "";
    const values = filters.map((item: any) => item.value);
    const result = await this.executor.query<T>(`select ${input?.columns || "*"} from ${table}${where}`, values);
    return (input?.single ? result.rows[0] ?? null : result.rows) as T;
  }
}

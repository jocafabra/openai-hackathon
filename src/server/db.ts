import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

const DEFAULT_TENANT_ID = "default";

declare global {
  var milesAiPool: Pool | undefined;
  var milesAiSchemaPromise: Promise<void> | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  return new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
}

export const db = globalThis.milesAiPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.milesAiPool = db;
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS tenants (
    id text PRIMARY KEY,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS cases (
    id uuid PRIMARY KEY,
    tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'ARCHIVED')),
    data_mode text NOT NULL DEFAULT 'mock' CHECK (data_mode IN ('mock', 'live')),
    is_mock boolean NOT NULL DEFAULT true,
    input jsonb NOT NULL,
    latest_result jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS cases_tenant_status_idx ON cases (tenant_id, status, updated_at DESC)`,
  `CREATE TABLE IF NOT EXISTS promotion_events (
    id uuid PRIMARY KEY,
    tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_id text NOT NULL,
    payload jsonb NOT NULL,
    observed_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, external_id)
  )`,
  `CREATE TABLE IF NOT EXISTS strategy_runs (
    id uuid PRIMARY KEY,
    tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    promotion_event_id uuid REFERENCES promotion_events(id) ON DELETE SET NULL,
    trigger text NOT NULL CHECK (trigger IN ('MANUAL', 'PROMOTION', 'MONITOR')),
    run_key text NOT NULL,
    input_snapshot jsonb NOT NULL,
    result jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (case_id, run_key)
  )`,
  `CREATE INDEX IF NOT EXISTS strategy_runs_case_idx ON strategy_runs (case_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS opportunities (
    id uuid PRIMARY KEY,
    tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    promotion_event_id uuid REFERENCES promotion_events(id) ON DELETE SET NULL,
    dedupe_key text NOT NULL,
    kind text NOT NULL DEFAULT 'TRANSFER_BONUS',
    status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'DISMISSED', 'COMPLETED')),
    title text NOT NULL,
    summary text NOT NULL,
    savings_brl numeric(14,2),
    result jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, dedupe_key)
  )`,
  `CREATE INDEX IF NOT EXISTS opportunities_tenant_status_idx ON opportunities (tenant_id, status, created_at DESC)`,
];

export async function ensureDatabase(): Promise<void> {
  if (!globalThis.milesAiSchemaPromise) {
    globalThis.milesAiSchemaPromise = (async () => {
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock($1)", [812_026_819]);
        for (const statement of schemaStatements) {
          await client.query(statement);
        }
        await client.query(
          `INSERT INTO tenants (id, name) VALUES ($1, $2)
           ON CONFLICT (id) DO NOTHING`,
          [tenantId(), "Workspace MilesAI"],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        globalThis.milesAiSchemaPromise = undefined;
        throw error;
      } finally {
        client.release();
      }
    })();
  }

  await globalThis.milesAiSchemaPromise;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  await ensureDatabase();
  return db.query<T>(text, values);
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  await ensureDatabase();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function tenantId(): string {
  return process.env.MILESAI_TENANT_ID?.trim() || DEFAULT_TENANT_ID;
}

export async function closeDatabase(): Promise<void> {
  globalThis.milesAiSchemaPromise = undefined;
  globalThis.milesAiPool = undefined;
  await db.end();
}

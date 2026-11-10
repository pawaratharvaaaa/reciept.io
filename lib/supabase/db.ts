import { Pool } from "pg";

let pool: Pool | null = null;

export function getDatabasePool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_POOL_URL ||
      process.env.DATABASE_URL ||
      "postgresql://postgres.bsspsgukpzgsgwjwnidv:RadhaKinjalAtharvaPawar@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
    });
  }

  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getDatabasePool();
  const res = await p.query(text, params);
  return res.rows;
}

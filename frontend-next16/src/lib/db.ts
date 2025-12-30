import { Pool, QueryResult, QueryResultRow } from "pg";
import { env } from "./env";

const connectionString = `postgresql://${env.DB_USER}:${env.DB_PASS}@${env.DB_HOST}:${env.DB_PORT}/auscpidb`;

// Use connection pool for better performance with serverless functions
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Neon uses valid SSL certs but pooler may have issues
  },
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout for Neon
});

// Query helper with automatic connection management
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// For components that need direct pool access
export default pool;

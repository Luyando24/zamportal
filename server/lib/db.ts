import "./env.js";
import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

// Database connection pool
// Use DATABASE_URL for Supabase/Production, fallback to individual params for local
const connectionString = process.env.DATABASE_URL;

if (connectionString) {
  console.log("🐘 Connecting to Database via DATABASE_URL");
} else {
  console.warn("⚠️ DATABASE_URL not found. Falling back to individual DB parameters (might fail on Vercel).");
}

const pool = new Pool(
  connectionString 
    ? { 
        connectionString, 
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'flova_db',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
);

// Optional Read Replica Pool
const readOnlyConnectionString = process.env.READ_ONLY_DATABASE_URL;
const readPool = readOnlyConnectionString 
  ? new Pool({ 
      connectionString: readOnlyConnectionString, 
      ssl: { rejectUnauthorized: false },
      max: 20
    }) 
  : pool; // Fallback to primary if no read replica is configured

if (readOnlyConnectionString) {
  console.log("📖 Read Replica enabled via READ_ONLY_DATABASE_URL");
}

// Helper function to execute queries
// Automatically routes to read replica if isRead is true
export async function query(text: string, params?: any[], isRead: boolean = false): Promise<any> {
  const start = Date.now();
  try {
    const targetPool = isRead ? readPool : pool;
    const res = await targetPool.query(text, params);
    const duration = Date.now() - start;
    // console.log('executed query', { text, duration, rows: res.rowCount, isRead });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to execute transactions
export async function transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// NRC hashing utilities for patient lookup
export function hashNrc(nrc: string): string {
  const fixedSalt = process.env.NRC_SALT || 'flova_nrc_salt_2024';
  return bcrypt.hashSync(nrc + fixedSalt, 10);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

export { pool };
export default pool;
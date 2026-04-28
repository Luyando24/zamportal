import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const { Client } = pg;

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/zamportal"
  });

  try {
    await client.connect();
    console.log("Connected to database...");

    const sqlPath = path.resolve(process.cwd(), 'db/dynamic_forms.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Running migration: dynamic_forms.sql");
    await client.query(sql);
    console.log("Migration completed successfully!");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

runMigration();

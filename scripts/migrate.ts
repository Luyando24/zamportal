import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  const client = await pool.connect();
  try {
    const fileName = process.argv[2] || 'mobile_schema.sql';
    console.log(`Running migration: ${fileName}...`);
    const schemaPath = path.join(process.cwd(), 'db', fileName);
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon to run multiple statements if needed, 
    // but pg pool.query can often handle multiple statements.
    await client.query(sql);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

import { query } from "../server/lib/db";

async function setupSuggestions() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS service_suggestions (
        id SERIAL PRIMARY KEY,
        user_query TEXT NOT NULL,
        suggested_service TEXT,
        description TEXT,
        crafted_message TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("service_suggestions table ready");
  } catch (err) {
    console.error("Setup error:", err);
  }
}

setupSuggestions();

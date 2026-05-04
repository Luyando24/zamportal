const { Client } = require('pg');

async function checkSettings() {
  const client = new Client({
    connectionString: "postgresql://postgres.stofrjkiypnqwyjzvzgx:0aw7cuTf9XBbitGO@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
  });
  await client.connect();
  try {
    const res = await client.query("SELECT * FROM system_settings");
    console.log(res.rows);
  } catch (err) {
    console.error("Error fetching system_settings:", err.message);
    try {
      const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      console.log("Available tables:", tables.rows.map(r => r.table_name));
    } catch (e) {}
  }
  await client.end();
}

checkSettings();

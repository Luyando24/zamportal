
import { query } from "../server/lib/db";

async function run() {
  const res = await query("SELECT id, title, portal_id FROM services");
  console.log(JSON.stringify(res.rows, null, 2));
}

run().catch(console.error);

import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env and .env.local
// This must be imported at the very top of the entry point
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config();
dotenv.config({ path: envPath, override: true });

console.log("Environment configuration:");
console.log("- Path:", envPath);
console.log("- NEXT_PUBLIC_SUPABASE_URL present:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("- DATABASE_URL present:", !!process.env.DATABASE_URL);

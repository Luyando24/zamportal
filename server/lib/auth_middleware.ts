import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    console.log(`Auth Middleware: Verifying token... (Header present: ${!!authHeader})`);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error(`Auth Middleware: Supabase error or no user. Error: ${JSON.stringify(error)}`);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    console.log(`Auth Middleware: Success! User ID: ${user.id}`);
    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Authentication failed" });
  }
};

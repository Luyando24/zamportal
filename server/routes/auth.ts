import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  LoginRequest,
  AuthSession,
  RegisterStaffRequest as RegisterRequest,
  RegisterStaffResponse as RegisterResponse,
} from "@shared/api";
import { query } from "../lib/db.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { identifier, password }: LoginRequest = req.body;
    console.log(`Login attempt for identifier: ${identifier}`);
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase credentials missing in environment variables!");
      return res.status(500).json({ error: "Server configuration error: Supabase keys missing." });
    }
    
    // 1. Attempt login via Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: identifier,
      password: password
    });

    if (error) {
      console.log(`Supabase login error for ${identifier}:`, error.message);
      // If it fails, maybe they used NRC? 
      const userRes = await query('SELECT email FROM users WHERE nrc = $1', [identifier]);
      if (userRes.rows.length > 0) {
        const email = userRes.rows[0].email;
        console.log(`NRC found, attempting login with email: ${email}`);
        const { data: nrcData, error: nrcError } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password
        });
        
        if (nrcError) {
          console.log(`NRC-based login error:`, nrcError.message);
          return res.status(401).json({ error: "Invalid credentials" });
        }
        
        const user = nrcData.user;
        if (!user) throw new Error("User object missing in Supabase response");

        const session: AuthSession = {
          userId: user.id,
          role: (user.app_metadata.role as any) || 'user',
          tokens: {
            accessToken: nrcData.session?.access_token || "",
            refreshToken: nrcData.session?.refresh_token,
            expiresInSec: nrcData.session?.expires_in || 3600,
          },
        };
        console.log(`Login successful for ${identifier} (NRC)`);
        return res.json(session);
      }
      
      return res.status(401).json({ error: error.message || "Invalid credentials" });
    }
    
    const user = data.user;
    if (!user) throw new Error("User object missing in Supabase response");

    console.log(`Auth.Login: Authenticated ${identifier}. Supabase ID: ${user.id}`);

    // 2. Fetch user profile from local DB including portal slug if assigned
    let profileRes = await query(`
      SELECT u.role, u.portal_id, p.slug as portal_slug
      FROM users u
      LEFT JOIN portals p ON u.portal_id = p.id
      WHERE u.id = $1
    `, [user.id]);
    
    if (profileRes.rows.length === 0) {
      console.log(`Auth.Login: User ${user.id} missing from local DB. Syncing...`);
      const { first_name, last_name, nrc } = user.user_metadata || {};
      const { role, portal_id } = user.app_metadata || {};
      
      await query(
        `INSERT INTO users (id, email, nrc, password_hash, role, first_name, last_name, is_active, portal_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO UPDATE SET 
           id = EXCLUDED.id,
           nrc = EXCLUDED.nrc,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           role = EXCLUDED.role,
           portal_id = EXCLUDED.portal_id,
           updated_at = now()`,
        [user.id, user.email, nrc || '', 'SUPABASE_AUTH', role || 'user', first_name || 'User', last_name || 'New', true, portal_id || null]
      );
      
      // Re-fetch profile
      profileRes = await query(`
        SELECT u.role, u.portal_id, p.slug as portal_slug
        FROM users u
        LEFT JOIN portals p ON u.portal_id = p.id
        WHERE u.id = $1
      `, [user.id]);
    }
    
    const profile = profileRes.rows[0];
    console.log(`Auth.Login: Profile lookup for ${user.id}:`, profile);

    const session: AuthSession = {
      userId: user.id,
      role: profile?.role || (user.app_metadata.role as any) || 'user',
      portalSlug: profile?.portal_slug || (user.app_metadata.portal_slug as string),
      tokens: {
        accessToken: data.session?.access_token || "",
        refreshToken: data.session?.refresh_token,
        expiresInSec: data.session?.expires_in || 3600,
      },
    };
    
    console.log(`Login successful for ${identifier}. Portal: ${profile?.portal_slug || 'System Admin'}`);
    res.json(session);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      nrc,
      role = "user",
      portal_id
    }: RegisterRequest & { portal_id?: string } = req.body;
    
    // 1. Create user in Supabase
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName, nrc },
      app_metadata: { role, nrc, portal_id }
    });
    
    if (error) throw error;
    
    const user = data.user;

    // 2. Sync to local users table for queries/joins
    await query(
      `INSERT INTO users (id, email, nrc, password_hash, role, first_name, last_name, is_active, portal_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO UPDATE SET 
         nrc = EXCLUDED.nrc,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         role = EXCLUDED.role,
         portal_id = EXCLUDED.portal_id,
         updated_at = now()`,
      [user.id, email, nrc, 'SUPABASE_AUTH', role, firstName, lastName, true, portal_id]
    );
    
    const response: RegisterResponse = {
      userId: user.id,
      hospitalId: "", 
    };
    
    res.status(201).json(response);
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
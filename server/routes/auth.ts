import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  LoginRequest,
  AuthSession,
  RegisterStaffRequest as RegisterRequest,
  RegisterStaffResponse as RegisterResponse,
} from "@shared/api";
import { query, hashPassword, verifyPassword } from "../lib/db";

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;
    
    // Find user by email
    const result = await query(
      'SELECT id, email, password_hash, role, first_name, last_name, is_active FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    if (!user.is_active) {
      return res.status(401).json({ error: "Account is inactive" });
    }
    
    const session: AuthSession = {
      userId: user.id,
      role: user.role,
      tokens: {
        accessToken: `token_${user.id}`,
        expiresInSec: 3600,
      },
    };
    
    res.json(session);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role = "user",
    }: RegisterRequest = req.body;
    
    // Check if email already exists
    const existingUserResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    // Create user
    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    
    await query(
      `INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, email, passwordHash, role, firstName, lastName, true]
    );
    
    const response: RegisterResponse = {
      userId,
      hospitalId: "", // Legacy support
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};
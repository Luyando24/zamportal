-- Add passport_number support to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS passport_number TEXT UNIQUE;

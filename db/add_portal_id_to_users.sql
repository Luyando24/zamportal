-- Add portal_id to users table to support institutional admin routing
ALTER TABLE users ADD COLUMN IF NOT EXISTS portal_id UUID REFERENCES portals(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_users_portal_id ON users(portal_id);

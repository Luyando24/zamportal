-- Migration to support user-specific module entries (e.g., for employee self-service)
ALTER TABLE module_entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Create index for faster lookups of user-owned records
CREATE INDEX IF NOT EXISTS idx_module_entries_user_id ON module_entries(user_id);

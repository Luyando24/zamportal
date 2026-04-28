-- Expand the permitted roles in the users table to support tiered administration
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('user', 'admin', 'super_admin', 'institutional_admin'));

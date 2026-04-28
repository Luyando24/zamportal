-- Update users.portal_id constraint to CASCADE delete
-- This ensures that when an institution is deleted, its users are also removed from the local database

ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_portal_id_fkey;

ALTER TABLE users 
ADD CONSTRAINT users_portal_id_fkey 
FOREIGN KEY (portal_id) 
REFERENCES portals(id) 
ON DELETE CASCADE;

-- Fix the foreign key constraint on service_applications.form_id to support cascading deletes
-- This allows services and their sub-services to be deleted even if they have existing applications

-- 1. Find the constraint name (usually automatically generated if not specified)
-- But we can just drop it if we know the column name and table.
-- In PostgreSQL, we usually need the name. 
-- Based on previous migration, it might be 'service_applications_form_id_fkey'

ALTER TABLE service_applications 
DROP CONSTRAINT IF EXISTS service_applications_form_id_fkey;

-- 2. Re-add the constraint with ON DELETE CASCADE
ALTER TABLE service_applications 
ADD CONSTRAINT service_applications_form_id_fkey 
FOREIGN KEY (form_id) 
REFERENCES portal_service_forms(id) 
ON DELETE CASCADE;

-- Migration to support multiple forms (sub-services) per service
-- This allows one service (e.g. NRC) to have multiple service paths (e.g. Renewal, Replacement)

-- 1. Remove the unique constraint that limited us to one form per service per portal
ALTER TABLE portal_service_forms DROP CONSTRAINT IF EXISTS portal_service_forms_portal_id_service_id_key;

-- 2. Add form_name to distinguish between different forms/sub-services
ALTER TABLE portal_service_forms ADD COLUMN IF NOT EXISTS form_name TEXT NOT NULL DEFAULT 'Main Application';

-- 3. Add a slug for cleaner URL handling of sub-services
ALTER TABLE portal_service_forms ADD COLUMN IF NOT EXISTS form_slug TEXT;

-- 4. Update existing records to have a meaningful slug if missing
UPDATE portal_service_forms SET form_slug = 'default' WHERE form_slug IS NULL;

-- 5. Add a unique constraint on (portal_id, service_id, form_slug) to prevent duplicate sub-services
ALTER TABLE portal_service_forms ADD CONSTRAINT portal_service_forms_portal_service_slug_unique UNIQUE(portal_id, service_id, form_slug);

-- 6. Add form_id to service_applications to track which sub-service was used
ALTER TABLE service_applications ADD COLUMN IF NOT EXISTS form_id UUID REFERENCES portal_service_forms(id);

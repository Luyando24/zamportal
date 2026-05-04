-- Add portal_id to services to allow for institutional ownership and cascading deletes
ALTER TABLE services ADD COLUMN IF NOT EXISTS portal_id UUID REFERENCES portals(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_services_portal_id ON services(portal_id);

COMMENT ON COLUMN services.portal_id IS 'If set, this service belongs exclusively to the specified portal/institution.';

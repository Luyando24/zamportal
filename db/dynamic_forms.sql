-- Schema for Dynamic Service Forms and Enhanced Applications

-- Dynamic Form Definitions for Portal Services
CREATE TABLE IF NOT EXISTS portal_service_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  form_definition JSONB NOT NULL, -- Array of field objects {id, label, type, required, options, etc.}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(portal_id, service_id)
);

-- Update service_applications to link with portals
ALTER TABLE service_applications ADD COLUMN IF NOT EXISTS portal_id UUID REFERENCES portals(id) ON DELETE CASCADE;

-- Add attachment support for service applications (Media Types)
CREATE TABLE IF NOT EXISTS application_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES service_applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for portal-specific application tracking
CREATE INDEX IF NOT EXISTS idx_applications_portal ON service_applications(portal_id);

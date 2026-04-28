-- Multi-Portal Management Schema

-- Portals Table
CREATE TABLE IF NOT EXISTS portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  theme_config JSONB DEFAULT '{
    "primaryColor": "#006400",
    "secondaryColor": "#FFD700",
    "fontFamily": "Inter"
  }',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Portal Services Mapping
CREATE TABLE IF NOT EXISTS portal_services (
  portal_id UUID REFERENCES portals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (portal_id, service_id)
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_portals_slug ON portals(slug);
CREATE INDEX IF NOT EXISTS idx_portal_services_portal ON portal_services(portal_id);

-- Schema for ZamPortal Mobile App Services and Applications

-- Portal Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  nrc TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service Categories (e.g., Citizens, Businesses, Health & Wellness)
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT, -- Lucide or Ionicons icon name
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Government Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE,
  service_provider TEXT, -- Government institution providing the service
  metadata JSONB, -- Additional info like requirements, processing time, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service Applications
CREATE TABLE IF NOT EXISTS service_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'completed')),
  form_data JSONB NOT NULL, -- Submitted form data
  tracking_number TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Life Scenarios (e.g., "Starting a Business", "Having a Baby")
CREATE TABLE IF NOT EXISTS life_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mapping services to life scenarios
CREATE TABLE IF NOT EXISTS service_life_scenarios (
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES life_scenarios(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, scenario_id)
);

-- Optimization Indices

-- Services Performance
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_popular ON services(is_popular) WHERE is_popular = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
-- GIN index for search on title and description if using pg_trgm
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_services_search_title ON services USING gin (title gin_trgm_ops);

-- Applications Performance
CREATE INDEX IF NOT EXISTS idx_applications_user ON service_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON service_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON service_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_tracking ON service_applications(tracking_number);

-- Scenarios Performance
CREATE INDEX IF NOT EXISTS idx_life_scenarios_slug ON life_scenarios(slug);
CREATE INDEX IF NOT EXISTS idx_service_life_scenarios_scenario ON service_life_scenarios(scenario_id);

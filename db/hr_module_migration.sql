-- Migration to support per-portal modules and HR Management module
-- 1. Add portal_id to module_entries to isolate data between institutions
ALTER TABLE module_entries ADD COLUMN IF NOT EXISTS portal_id UUID REFERENCES portals(id) ON DELETE CASCADE;

-- 2. Create portal_modules table to track enabled/disabled state per institution
CREATE TABLE IF NOT EXISTS portal_modules (
  portal_id UUID REFERENCES portals(id) ON DELETE CASCADE,
  module_slug TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (portal_id, module_slug)
);

-- 3. Seed the HR Management module into system_modules
INSERT INTO system_modules (name, slug, description, icon, schema_definition)
VALUES (
  'HR Management', 
  'hr-management', 
  'Comprehensive human resource management system for tracking employees, positions, and departmental assignments.', 
  'users', 
  '[
    {"id": "full_name", "label": "Full Name", "type": "text", "required": true},
    {"id": "employee_id", "label": "Employee ID", "type": "text", "required": true},
    {"id": "nrc", "label": "NRC Number", "type": "text", "required": true},
    {"id": "position", "label": "Position/Title", "type": "text", "required": true},
    {"id": "department", "label": "Department", "type": "select", "required": true, "options": ["Administration", "Finance", "Operations", "Technical", "Legal", "Human Resources"]},
    {"id": "join_date", "label": "Date of Joining", "type": "date", "required": true},
    {"id": "status", "label": "Employment Status", "type": "select", "required": true, "options": ["Active", "On Leave", "Suspended", "Terminated"]}
  ]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  schema_definition = EXCLUDED.schema_definition,
  description = EXCLUDED.description;

-- 4. Enable HR Management for all existing portals by default
INSERT INTO portal_modules (portal_id, module_slug, is_enabled)
SELECT id, 'hr-management', TRUE FROM portals
ON CONFLICT DO NOTHING;

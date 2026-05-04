-- Migration to add the Institutional AI Advisor module
-- This registers the AI advisor as a system module so it can be managed (enabled/disabled) per portal.

-- 1. Seed the Institutional AI module into system_modules
INSERT INTO system_modules (name, slug, description, icon, schema_definition)
VALUES (
  'Institutional AI Advisor', 
  'institutional-ai', 
  'A conversational AI expert specialized in this institution''s domain. Can analyze documents, summarize reports, and assist with administrative drafting.', 
  'sparkles', 
  '[]'::jsonb -- AI advisor doesn't use schema-based data entry
) ON CONFLICT (slug) DO UPDATE SET 
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- 2. Enable Institutional AI for all existing portals by default
INSERT INTO portal_modules (portal_id, module_slug, is_enabled)
SELECT id, 'institutional-ai', TRUE FROM portals
ON CONFLICT (portal_id, module_slug) DO UPDATE SET is_enabled = TRUE;

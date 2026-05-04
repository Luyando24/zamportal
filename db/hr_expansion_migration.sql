-- Migration to expand HR module with Leave Management and Performance Reviews
-- 1. Add category to system_modules
ALTER TABLE system_modules ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Update existing HR Management
UPDATE system_modules SET category = 'HR' WHERE slug = 'hr-management';

-- 3. Seed Leave Management
INSERT INTO system_modules (name, slug, singular_entity, description, icon, category, schema_definition)
VALUES (
  'Leave Management',
  'leave-management',
  'Leave Request',
  'Track and manage staff leave applications, approvals, and balances.',
  'calendar',
  'HR',
  '[
    {"id": "employee_name", "label": "Employee Name", "type": "text", "required": true},
    {"id": "leave_type", "label": "Leave Type", "type": "select", "required": true, "options": ["Annual", "Sick", "Maternity", "Study", "Compassionate"]},
    {"id": "start_date", "label": "Start Date", "type": "date", "required": true},
    {"id": "end_date", "label": "End Date", "type": "date", "required": true},
    {"id": "reason", "label": "Reason", "type": "textarea", "required": true},
    {"id": "status", "label": "Status", "type": "select", "required": true, "options": ["Pending", "Approved", "Rejected"]}
  ]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  schema_definition = EXCLUDED.schema_definition,
  category = EXCLUDED.category;

-- 4. Seed Performance Reviews
INSERT INTO system_modules (name, slug, singular_entity, description, icon, category, schema_definition)
VALUES (
  'Performance Reviews',
  'performance-reviews',
  'Review',
  'Annual and quarterly staff performance assessments and goal tracking.',
  'activity',
  'HR',
  '[
    {"id": "employee_name", "label": "Employee Name", "type": "text", "required": true},
    {"id": "review_period", "label": "Review Period", "type": "text", "required": true},
    {"id": "rating", "label": "Performance Rating", "type": "select", "required": true, "options": ["Excellent", "Good", "Satisfactory", "Needs Improvement"]},
    {"id": "feedback", "label": "Manager Feedback", "type": "textarea", "required": true},
    {"id": "goals", "label": "Next Period Goals", "type": "textarea", "required": true}
  ]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  schema_definition = EXCLUDED.schema_definition,
  category = EXCLUDED.category;

-- 5. Enable for existing portals
INSERT INTO portal_modules (portal_id, module_slug, is_enabled)
SELECT id, 'leave-management', TRUE FROM portals
ON CONFLICT DO NOTHING;

INSERT INTO portal_modules (portal_id, module_slug, is_enabled)
SELECT id, 'performance-reviews', TRUE FROM portals
ON CONFLICT DO NOTHING;

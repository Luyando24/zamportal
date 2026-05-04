-- Add singular_entity to system_modules for better UI labeling
ALTER TABLE system_modules ADD COLUMN IF NOT EXISTS singular_entity TEXT;

-- Update HR Management module with singular entity name
UPDATE system_modules 
SET singular_entity = 'Employee'
WHERE slug = 'hr-management';

-- Add service_provider column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_provider TEXT;

-- Update existing services with default providers (optional but helpful)
UPDATE services SET service_provider = 'Department of National Registration, Passport and Citizenship' WHERE slug = 'nrc';
UPDATE services SET service_provider = 'Patents and Companies Registration Agency (PACRA)' WHERE slug = 'business-reg';
UPDATE services SET service_provider = 'Road Transport and Safety Agency (RTSA)' WHERE slug = 'drivers-license';
UPDATE services SET service_provider = 'Zambia Revenue Authority (ZRA)' WHERE slug = 'tax-payers';
UPDATE services SET service_provider = 'Ministry of Education' WHERE slug = 'students';

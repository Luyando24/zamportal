-- Enable status history tracking
CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES service_applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Remove old status constraint to allow more granular statuses
ALTER TABLE service_applications DROP CONSTRAINT IF EXISTS service_applications_status_check;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_status_history_application ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON application_status_history(created_at DESC);


CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_model TEXT NOT NULL DEFAULT 'openai',
  available_models TEXT[] DEFAULT ARRAY['openai', 'gemini', 'groq', 'claude'],
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initialize with Groq as default since it's the current selection in Admin
INSERT INTO ai_settings (default_model, available_models)
SELECT 'groq', ARRAY['openai', 'gemini', 'groq', 'claude']
WHERE NOT EXISTS (SELECT 1 FROM ai_settings);

-- Insert default development API key if it doesn't exist
INSERT INTO api_keys (key, name, rate_limit, is_active)
VALUES ('dev_key_porta_futuri_2024', 'Development Key', 100, true)
ON CONFLICT (key) DO NOTHING;

-- Ensure RLS policies for api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read API keys
CREATE POLICY "Authenticated users can read API keys" ON api_keys
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy for authenticated users to manage API keys
CREATE POLICY "Authenticated users can manage API keys" ON api_keys
  FOR ALL
  USING (auth.role() = 'authenticated');
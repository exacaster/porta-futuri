-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read API keys" ON api_keys;
DROP POLICY IF EXISTS "Authenticated users can manage API keys" ON api_keys;

-- Temporarily disable RLS to ensure we can access the table
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;

-- Insert default API key if it doesn't exist
INSERT INTO api_keys (key, name, rate_limit, is_active)
VALUES ('dev_key_porta_futuri_2024', 'Development Key', 100, true)
ON CONFLICT (key) DO NOTHING;

-- For development/testing, allow all operations without RLS
-- In production, you would want to re-enable RLS with proper policies
-- ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Alternative: Create permissive policies for development
-- Uncomment these lines if you want to use RLS in development:
/*
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON api_keys
  FOR ALL
  USING (true)
  WITH CHECK (true);
*/
-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT,
  rate_limit INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  session_id TEXT,
  customer_data JSONB DEFAULT '{}',
  context_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  minute_bucket TIMESTAMPTZ,
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recommendation logs table
CREATE TABLE IF NOT EXISTS recommendation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  query TEXT,
  recommendations JSONB,
  response_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  fallback_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert test API key
INSERT INTO api_keys (key, name, rate_limit, is_active)
VALUES ('test-api-key-123456789', 'Test API Key', 100, true)
ON CONFLICT (key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_api_key_minute ON rate_limits(api_key_id, minute_bucket);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_session ON recommendation_logs(session_id);
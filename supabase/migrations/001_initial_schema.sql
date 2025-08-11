-- Initial schema migration for Porta Futuri AI Add-On

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  rate_limit INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0
);

CREATE INDEX idx_api_keys_key ON api_keys(key) WHERE is_active = true;
CREATE INDEX idx_api_keys_domain ON api_keys(domain) WHERE domain IS NOT NULL;

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  customer_data JSONB,
  product_catalog_hash TEXT,
  context_data JSONB,
  recommendations_cache JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 minutes',
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_sessions_session_id ON sessions(session_id) WHERE is_active = true;
CREATE INDEX idx_sessions_api_key ON sessions(api_key_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE is_active = true;

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  minute_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
  request_count INTEGER DEFAULT 0,
  UNIQUE(api_key_id, minute_bucket)
);

CREATE INDEX idx_rate_limits_bucket ON rate_limits(api_key_id, minute_bucket DESC);

-- Recommendation logs
CREATE TABLE IF NOT EXISTS recommendation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  query TEXT,
  recommendations JSONB NOT NULL,
  response_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  fallback_used BOOLEAN DEFAULT false,
  clicked_product_ids TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recommendation_logs_session ON recommendation_logs(session_id);
CREATE INDEX idx_recommendation_logs_created ON recommendation_logs(created_at DESC);

-- Widget configuration
CREATE TABLE IF NOT EXISTS widget_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  theme JSONB DEFAULT '{}',
  position TEXT DEFAULT 'bottom-right',
  features JSONB DEFAULT '{"chat": true, "profile": true}',
  custom_css TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_widget_configs_api_key ON widget_configs(api_key_id);

-- CSV uploads tracking
CREATE TABLE IF NOT EXISTS csv_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('products', 'customer', 'context')),
  file_hash TEXT NOT NULL,
  row_count INTEGER,
  file_size_bytes INTEGER,
  processing_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_csv_uploads_session ON csv_uploads(session_id);
CREATE INDEX idx_csv_uploads_hash ON csv_uploads(file_hash);

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widget_configs_updated_at BEFORE UPDATE ON widget_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert development API key
INSERT INTO api_keys (key, name, domain, rate_limit)
VALUES ('dev_key_porta_futuri_2024', 'Development Key', 'localhost', 1000)
ON CONFLICT (key) DO NOTHING;

-- Grant permissions (adjust based on your Supabase auth setup)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
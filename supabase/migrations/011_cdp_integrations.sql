-- Migration: 011_cdp_integrations.sql
-- Purpose: Create tables for Customer Data Platform (CDP) integrations with Exacaster CVM
-- Created: 2025-08-13

-- 1. Create CDP integrations table for storing provider configurations
CREATE TABLE IF NOT EXISTS cdp_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'exacaster',
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  credentials_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  test_status TEXT DEFAULT 'untested' CHECK (test_status IN ('untested', 'success', 'failed')),
  last_tested_at TIMESTAMPTZ,
  last_error TEXT,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create CDP request logs table for tracking API calls
CREATE TABLE IF NOT EXISTS cdp_request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES cdp_integrations(id) ON DELETE CASCADE,
  customer_id TEXT,
  request_url TEXT,
  response_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS policies for security
ALTER TABLE cdp_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdp_request_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for cdp_integrations
-- Only authenticated admin users can view integrations
CREATE POLICY "Admin users can view integrations"
  ON cdp_integrations
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Only super admins can create integrations
CREATE POLICY "Super admins can create integrations"
  ON cdp_integrations
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND is_active = true 
      AND role = 'super_admin'
    )
  );

-- Only super admins can update integrations
CREATE POLICY "Super admins can update integrations"
  ON cdp_integrations
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND is_active = true 
      AND role = 'super_admin'
    )
  );

-- Only super admins can delete integrations
CREATE POLICY "Super admins can delete integrations"
  ON cdp_integrations
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND is_active = true 
      AND role = 'super_admin'
    )
  );

-- 5. Create RLS policies for cdp_request_logs
-- Admin users can view logs
CREATE POLICY "Admin users can view CDP logs"
  ON cdp_request_logs
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Service role can insert logs (for Edge Functions)
CREATE POLICY "Service role can insert CDP logs"
  ON cdp_request_logs
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
  );

-- 6. Create indexes for performance
CREATE INDEX idx_cdp_integrations_provider ON cdp_integrations(provider);
CREATE INDEX idx_cdp_integrations_active ON cdp_integrations(is_active);
CREATE INDEX idx_cdp_request_logs_integration ON cdp_request_logs(integration_id, created_at DESC);
CREATE INDEX idx_cdp_request_logs_customer ON cdp_request_logs(customer_id, created_at DESC);
CREATE INDEX idx_cdp_request_logs_created ON cdp_request_logs(created_at DESC);

-- 7. Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_cdp_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for automatic timestamp updates
CREATE TRIGGER update_cdp_integrations_timestamp
    BEFORE UPDATE ON cdp_integrations
    FOR EACH ROW
    EXECUTE PROCEDURE update_cdp_integrations_updated_at();

-- 9. Add support for storing encrypted credentials using Supabase Vault
-- Note: This requires Supabase Vault extension to be enabled
-- The actual encryption/decryption will be handled at the application level

-- 10. Insert default integration (inactive by default)
INSERT INTO cdp_integrations (
  provider,
  name,
  config,
  is_active,
  test_status
) VALUES (
  'exacaster',
  'Exacaster CVM Platform',
  '{
    "api_url": "https://customer360.exacaster.com/courier/api/v1",
    "workspace_id": "",
    "resource_id": ""
  }'::jsonb,
  false,
  'untested'
) ON CONFLICT DO NOTHING;

-- 11. Grant necessary permissions to service role for Edge Functions
GRANT ALL ON cdp_integrations TO service_role;
GRANT ALL ON cdp_request_logs TO service_role;

COMMENT ON TABLE cdp_integrations IS 'Stores CDP provider configurations and credentials';
COMMENT ON TABLE cdp_request_logs IS 'Logs all CDP API requests for monitoring and debugging';
COMMENT ON COLUMN cdp_integrations.credentials_encrypted IS 'Encrypted credentials stored using Supabase Vault';
COMMENT ON COLUMN cdp_integrations.test_status IS 'Status of the last connection test: untested, success, or failed';
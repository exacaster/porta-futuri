-- Safe seed for default admin user
-- Only inserts if not already exists

-- Insert default super admin user only if not exists
INSERT INTO admin_users (
  email,
  role,
  permissions,
  is_active,
  is_email_verified,
  created_at
) VALUES (
  'egidijus@exacaster.com',
  'super_admin',
  '{
    "products": ["read", "write", "delete"],
    "users": ["read", "write", "delete"],
    "settings": ["read", "write"],
    "api_keys": ["read", "write", "delete"],
    "audit_logs": ["read"]
  }'::jsonb,
  true,
  true,
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  is_active = true,
  permissions = EXCLUDED.permissions
WHERE admin_users.role != 'super_admin'; -- Only update if not already super_admin
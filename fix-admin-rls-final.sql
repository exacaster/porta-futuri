-- Fix RLS policies for admin_users table
-- This ensures authenticated users can read their own admin user record

-- First, check if RLS is enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can read their own admin record" ON admin_users;
DROP POLICY IF EXISTS "Service role has full access to admin_users" ON admin_users;
DROP POLICY IF EXISTS "Authenticated users can update their own admin record" ON admin_users;

-- Create new policies
-- 1. Allow authenticated users to read their own admin record
CREATE POLICY "Authenticated users can read their own admin record" 
ON admin_users FOR SELECT 
TO authenticated
USING (
  auth.email() = email AND is_active = true
);

-- 2. Allow authenticated users to update specific fields in their own record
CREATE POLICY "Authenticated users can update their own admin record" 
ON admin_users FOR UPDATE 
TO authenticated
USING (auth.email() = email)
WITH CHECK (auth.email() = email);

-- 3. Service role has full access (for backend operations)
CREATE POLICY "Service role has full access to admin_users" 
ON admin_users FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the admin user exists
SELECT email, role, is_active 
FROM admin_users 
WHERE email = 'egidijus@exacaster.com';

-- Make sure the user is active
UPDATE admin_users 
SET is_active = true 
WHERE email = 'egidijus@exacaster.com';
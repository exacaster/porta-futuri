-- Migration to properly link Auth user with admin_users table
-- This assumes you've already created the user in Supabase Auth

-- Step 1: Get the Auth user ID for egidijus@exacaster.com
-- You need to run this in Supabase SQL Editor to get the actual user ID
DO $$
DECLARE
    auth_user_id UUID;
BEGIN
    -- Get the user ID from auth.users table
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'egidijus@exacaster.com'
    LIMIT 1;

    IF auth_user_id IS NOT NULL THEN
        -- Delete any existing admin_users entry with different ID
        DELETE FROM admin_users 
        WHERE email = 'egidijus@exacaster.com' 
        AND id != auth_user_id;

        -- Insert or update the admin user with the correct Auth ID
        INSERT INTO admin_users (
            id,  -- Use the same ID as Auth user
            email,
            role,
            permissions,
            is_active,
            is_email_verified,
            created_at
        ) VALUES (
            auth_user_id,  -- This links to Auth user
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
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            role = 'super_admin',
            permissions = EXCLUDED.permissions,
            is_active = true,
            is_email_verified = true,
            updated_at = NOW();

        RAISE NOTICE 'Admin user linked successfully with Auth ID: %', auth_user_id;
    ELSE
        RAISE NOTICE 'Auth user not found. Please create user in Supabase Authentication first.';
    END IF;
END $$;

-- Step 2: Create a helper function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admin_users 
        WHERE email = user_email 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
-- =============================================================================
-- PeteMart Seed Data — V2 Auth Demo Accounts (Email+Password)
-- Agent 07c: Backend Database Engineer
-- Version: v2.0.0 (2026-05-31)
-- =============================================================================
-- This seed script adds demo accounts that use the new email+password auth.
-- These accounts have auth_provider = 'email' to distinguish them from
-- the existing phone OTP-based accounts.
--
-- Usage:
--   psql -d <db_url> -f 12-auth-v2-seed.sql
-- =============================================================================

BEGIN;

-- =============================================================================
-- Helper function to seed email+password demo users
-- =============================================================================
CREATE OR REPLACE FUNCTION seed_email_demo_user(
    p_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'customer',
    p_password TEXT DEFAULT 'Demo@123'
) RETURNS VOID AS $$
BEGIN
    -- Insert into auth.users (skip if already exists)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
        p_id,
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        jsonb_build_object(
            'full_name', p_name,
            'role', p_role,
            'phone', p_phone,
            'auth_provider', 'email'
        ),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert/update profile
    INSERT INTO profiles (id, email, phone, name, role, auth_provider)
    VALUES (p_id, p_email, p_phone, p_name, p_role::user_role, 'email')
    ON CONFLICT (id) DO UPDATE
        SET auth_provider = 'email',
            email = EXCLUDED.email,
            name = EXCLUDED.name;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Demo Customer Accounts
-- =============================================================================
-- These users sign up with email+password and have auth_provider = 'email'

-- Priya Sharma - Regular customer for testing checkout flow
SELECT seed_email_demo_user(
    '00000000-0000-0000-0000-000000000001',
    'priya@example.com',
    'Priya Sharma',
    '+91-9900112010',
    'customer',
    'Demo@123'
);

-- Ramesh Kumar - Customer for testing order history
SELECT seed_email_demo_user(
    '00000000-0000-0000-0000-000000000002',
    'ramesh@example.com',
    'Ramesh Kumar',
    '+91-9900112011',
    'customer',
    'Demo@123'
);

-- Ananya Patel - Admin/merchant onboarding tester
SELECT seed_email_demo_user(
    '00000000-0000-0000-0000-000000000003',
    'ananya@petemart.com',
    'Ananya Patel',
    '+91-9900112012',
    'customer',
    'Demo@123'
);

-- =============================================================================
-- Demo Merchant Account
-- =============================================================================
SELECT seed_email_demo_user(
    '00000000-0000-0000-0000-000000000004',
    'ravi.merchant@example.com',
    'Ravi Shankar',
    '+91-9900112013',
    'merchant',
    'Demo@123'
);

-- =============================================================================
-- Demo Admin Account
-- =============================================================================
SELECT seed_email_demo_user(
    '00000000-0000-0000-0000-000000000005',
    'admin@petemart.com',
    'PeteMart System Admin',
    '+91-9900112014',
    'admin',
    'Admin@456'
);

-- =============================================================================
-- Cleanup
-- =============================================================================
DROP FUNCTION IF EXISTS seed_email_demo_user;

-- =============================================================================
-- Verify
-- =============================================================================
SELECT 'V2 Demo Accounts Created:' AS info;
SELECT id, email, name, role, auth_provider, 
       CASE WHEN password_hash IS NOT NULL THEN 'has_password' ELSE 'no_password' END AS password_status
FROM profiles
WHERE auth_provider = 'email'
ORDER BY role, email;

COMMIT;

-- =============================================================================
-- END OF SEED SCRIPT
-- =============================================================================

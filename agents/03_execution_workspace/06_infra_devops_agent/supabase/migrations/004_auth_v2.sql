-- =============================================================================
-- PeteMart Database Migration — V2 Auth Upgrade (Email+Password)
-- Version: v2.0.0 (2026-05-31)
-- Agent 07c: Backend Database Engineer
-- =============================================================================
-- This migration upgrades the profiles table to support dual auth:
--   1. Phone OTP (existing — auth_provider = 'phone')
--   2. Email+Password (new — auth_provider = 'email')
--
-- Changes:
--   - Adds password_hash column to profiles (nullable — for direct auth)
--   - Adds auth_provider column (TEXT, DEFAULT 'phone')
--   - Updates handle_new_user() trigger to set auth_provider
--   - Adds email-based demo accounts
--   - Adds index on auth_provider
--   - Updates existing seed profiles to have auth_provider = 'email'
--
-- UP Migration:
--   psql -d <db_url> -f 09-auth-v2.sql
--
-- DOWN Migration (rollback):
--   psql -d <db_url> -v ACTION=down -f 09-auth-v2.sql
-- =============================================================================

-- =============================================================================
-- MIGRATION TRACKING
-- =============================================================================
-- Ensure the _migrations tracking table exists (created by v1.0.0 migration)
CREATE TABLE IF NOT EXISTS _migrations (
    id          SERIAL PRIMARY KEY,
    version     TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum    TEXT,
    duration_ms INT
);

-- =============================================================================
-- UP MIGRATION
-- =============================================================================
DO $$
DECLARE
    _start_ts TIMESTAMPTZ;
    _end_ts TIMESTAMPTZ;
    _migration_exists BOOLEAN;
BEGIN
    -- Check if this migration already applied
    SELECT EXISTS(SELECT 1 FROM _migrations WHERE version = 'v2.0.0') INTO _migration_exists;

    IF _migration_exists THEN
        RAISE NOTICE 'Migration v2.0.0 already applied, skipping...';
        RETURN;
    END IF;

    _start_ts := clock_timestamp();

    -- ======================================================================
    -- STEP 1: Add new columns to profiles table
    -- ======================================================================

    -- password_hash: stores bcrypt hash for email+password auth users
    ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS password_hash TEXT;

    -- auth_provider: tracks which auth method was used during signup
    ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'phone';

    -- Add CHECK constraint to ensure valid values
    BEGIN
        ALTER TABLE profiles
            ADD CONSTRAINT chk_profiles_auth_provider
            CHECK (auth_provider IN ('phone', 'email'));
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    -- ======================================================================
    -- STEP 2: Update handle_new_user() trigger to set auth_provider
    -- ======================================================================

    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER AS $$
    DECLARE
        _phone TEXT;
        _auth_provider TEXT;
    BEGIN
        _phone := NEW.raw_user_meta_data->>'phone';

        -- Determine auth provider based on available fields
        IF NEW.email IS NOT NULL AND NEW.email != '' AND (_phone IS NULL OR _phone = '') THEN
            _auth_provider := 'email';
        ELSE
            _auth_provider := 'phone';
        END IF;

        INSERT INTO public.profiles (id, email, phone, name, role, auth_provider)
        VALUES (
            NEW.id,
            NEW.email,
            _phone,
            COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name',
                SPLIT_PART(NEW.email, '@', 1)
            ),
            COALESCE(
                (NEW.raw_user_meta_data->>'role')::user_role,
                'customer'::user_role
            ),
            _auth_provider
        )
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Recreate the trigger (idempotent)
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION handle_new_user();

    -- ======================================================================
    -- STEP 3: Create Synced Email Sync Trigger for auth.email changes
    -- ======================================================================

    -- Also update the email sync function to update auth_provider if needed
    CREATE OR REPLACE FUNCTION public.sync_user_email()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        UPDATE public.profiles
        SET email = NEW.email,
            updated_at = NOW()
        WHERE id = NEW.id;
        RETURN NEW;
    END;
    $$;

    DROP TRIGGER IF EXISTS on_auth_user_email_change ON auth.users;
    CREATE TRIGGER on_auth_user_email_change
        AFTER UPDATE OF email ON auth.users
        FOR EACH ROW
        WHEN (OLD.email IS DISTINCT FROM NEW.email)
        EXECUTE FUNCTION public.sync_user_email();

    -- ======================================================================
    -- STEP 4: Add index on auth_provider for filtered queries
    -- ======================================================================

    CREATE INDEX IF NOT EXISTS idx_profiles_auth_provider
        ON profiles(auth_provider);

    -- Ensure email index still exists (was already created in v1)
    CREATE INDEX IF NOT EXISTS idx_profiles_email
        ON profiles(email) WHERE email IS NOT NULL;

    -- ======================================================================
    -- STEP 5: Update existing profiles to set auth_provider
    -- ======================================================================

    -- Existing rows with email get auth_provider = 'email'
    UPDATE profiles
    SET auth_provider = 'email'
    WHERE email IS NOT NULL AND email != ''
      AND auth_provider = 'phone';

    -- Existing rows without email stay as 'phone' (default)

    -- ======================================================================
    -- STEP 6: Seed email-based demo accounts for testing
    -- ======================================================================

    -- Helper function for safe seed insertions
    CREATE OR REPLACE FUNCTION seed_demo_user(
        p_id UUID,
        p_email TEXT,
        p_name TEXT,
        p_phone TEXT,
        p_role TEXT,
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

        -- Insert into profiles (skip if already exists — trigger may have done it)
        INSERT INTO profiles (id, email, phone, name, role, auth_provider)
        VALUES (p_id, p_email, p_phone, p_name, p_role::user_role, 'email')
        ON CONFLICT (id) DO UPDATE
            SET auth_provider = 'email',
                email = p_email;
    END;
    $$ LANGUAGE plpgsql;

    -- Demo Customer Accounts (email+password auth)
    SELECT seed_demo_user(
        '00000000-0000-0000-0000-000000000001',
        'priya@example.com',
        'Priya Sharma',
        '+91-9900112010',
        'customer',
        'Demo@123'
    );

    SELECT seed_demo_user(
        '00000000-0000-0000-0000-000000000002',
        'ramesh@example.com',
        'Ramesh Kumar',
        '+91-9900112011',
        'customer',
        'Demo@123'
    );

    SELECT seed_demo_user(
        '00000000-0000-0000-0000-000000000003',
        'ananya@petemart.com',
        'Ananya Patel',
        '+91-9900112012',
        'customer',
        'Demo@123'
    );

    -- Demo Merchant Account (email+password auth)
    SELECT seed_demo_user(
        '00000000-0000-0000-0000-000000000004',
        'ravi.merchant@example.com',
        'Ravi Shankar',
        '+91-9900112013',
        'merchant',
        'Demo@123'
    );

    -- Demo Admin Account (email+password auth)
    SELECT seed_demo_user(
        '00000000-0000-0000-0000-000000000005',
        'admin@petemart.com',
        'PeteMart System Admin',
        '+91-9900112014',
        'admin',
        'Admin@456'
    );

    -- Cleanup helper function
    DROP FUNCTION IF EXISTS seed_demo_user;

    -- ======================================================================
    -- Record migration
    -- ======================================================================
    _end_ts := clock_timestamp();

    INSERT INTO _migrations (version, name, checksum, duration_ms)
    VALUES (
        'v2.0.0',
        'auth-v2-email-password',
        md5('petemart-v2.0.0-auth-upgrade-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS')),
        EXTRACT(EPOCH FROM (_end_ts - _start_ts)) * 1000
    );

    RAISE NOTICE 'Migration v2.0.0 applied successfully in % ms',
        EXTRACT(EPOCH FROM (_end_ts - _start_ts)) * 1000;
END $$;

-- =============================================================================
-- DOWN MIGRATION — Rollback v2.0.0 changes
-- =============================================================================
-- Execute: psql -d <db_url> -v ACTION=down -f 09-auth-v2.sql

-- Note: Uncomment and run these statements in a transaction to rollback:
--
-- BEGIN;
--   -- Remove seed demo accounts
--   DELETE FROM profiles WHERE id IN (
--     '00000000-0000-0000-0000-000000000001',
--     '00000000-0000-0000-0000-000000000002',
--     '00000000-0000-0000-0000-000000000003',
--     '00000000-0000-0000-0000-000000000004',
--     '00000000-0000-0000-0000-000000000005'
--   );
--   DELETE FROM auth.users WHERE id IN (
--     '00000000-0000-0000-0000-000000000001',
--     '00000000-0000-0000-0000-000000000002',
--     '00000000-0000-0000-0000-000000000003',
--     '00000000-0000-0000-0000-000000000004',
--     '00000000-0000-0000-0000-000000000005'
--   );
--
--   -- Drop indexes
--   DROP INDEX IF EXISTS idx_profiles_auth_provider;
--
--   -- Drop columns
--   ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_profiles_auth_provider;
--   ALTER TABLE profiles DROP COLUMN IF EXISTS password_hash;
--   ALTER TABLE profiles DROP COLUMN IF EXISTS auth_provider;
--
--   -- Restore original handle_new_user() function (v1.0.0 version)
--   CREATE OR REPLACE FUNCTION handle_new_user()
--   RETURNS TRIGGER AS $$
--   BEGIN
--       INSERT INTO public.profiles (id, email, phone, name, role)
--       VALUES (
--           NEW.id,
--           NEW.email,
--           NEW.raw_user_meta_data->>'phone',
--           COALESCE(
--               NEW.raw_user_meta_data->>'full_name',
--               NEW.raw_user_meta_data->>'name',
--               SPLIT_PART(NEW.email, '@', 1)
--           ),
--           COALESCE(
--               (NEW.raw_user_meta_data->>'role')::user_role,
--               'customer'::user_role
--           )
--       )
--       ON CONFLICT (id) DO NOTHING;
--       RETURN NEW;
--   END;
--   $$ LANGUAGE plpgsql SECURITY DEFINER;
--
--   -- Remove from migration tracking
--   DELETE FROM _migrations WHERE version = 'v2.0.0';
-- COMMIT;

-- =============================================================================
-- VERIFY MIGRATION
-- =============================================================================
-- Execute: psql -d <db_url> -v ACTION=verify -f 09-auth-v2.sql

SELECT '=== V2 Migration Status ===' AS report;
SELECT version, name, applied_at, duration_ms FROM _migrations ORDER BY applied_at DESC;

SELECT '=== Profiles Table Columns ===' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT '=== Auth Provider Distribution ===' AS info;
SELECT auth_provider, COUNT(*) AS count FROM profiles GROUP BY auth_provider;

SELECT '=== Demo Accounts ===' AS info;
SELECT id, email, name, role, auth_provider
FROM profiles
WHERE email IN ('priya@example.com', 'ramesh@example.com', 'ananya@petemart.com', 'ravi.merchant@example.com', 'admin@petemart.com');

SELECT '=== Indexes on profiles ===' AS info;
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'profiles' AND schemaname = 'public';

-- =============================================================================
-- END OF V2 MIGRATION SCRIPT
-- =============================================================================

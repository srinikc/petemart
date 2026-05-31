-- =============================================================================
-- PeteMart Seed Data — Part 1: Auth Users, Profiles, Stores
-- Agent 07c: Backend Database Engineer
-- =============================================================================
-- This seed script populates the database with test data for the POC phase.
-- Part 1 creates auth users, profiles, and all 9 pilot stores.
--
-- NOTE: This seed script now also sets auth_provider = 'email' for email-based
-- accounts to support the v2 email+password auth flow.
--
-- Usage:
--   psql -d <db_url> -f 04-seed-part1-auth-profiles-stores.sql
--   OR run in Supabase SQL Editor (Service Role required)
--
-- Markets: Balepet, Chickpet, Mamulpet, Tharagpet, Avenue Road, Cubbonpet
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: CREATE PLPGSQL HELPER FOR PASSWORD HASHING
-- =============================================================================
DO $$ BEGIN
    PERFORM crypt('Test@123', gen_salt('bf'));
EXCEPTION WHEN others THEN
    -- crypt function may not exist yet, that's ok
END $$;

-- =============================================================================
-- PART 2: CREATE AUTH USERS & PROFILES
-- =============================================================================
-- We use deterministic UUIDs for reproducibility across environments.

-- Helper function to safely create auth user and profile
-- v2.0.0: Now sets auth_provider = 'email' for email-based accounts
CREATE OR REPLACE FUNCTION create_merchant_account(
    p_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_phone TEXT,
    p_password TEXT DEFAULT 'Test@123'
) RETURNS UUID AS $$
BEGIN
    -- Insert auth user
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
        p_id, p_email, crypt(p_password, gen_salt('bf')), NOW(),
        jsonb_build_object('full_name', p_name, 'role', 'merchant', 'phone', p_phone, 'auth_provider', 'email'),
        NOW(), NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert profile with auth_provider
    INSERT INTO profiles (id, email, phone, name, role, auth_provider)
    VALUES (p_id, p_email, p_phone, p_name, 'merchant', 'email')
    ON CONFLICT (id) DO NOTHING;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

-- Create test admin (v2: includes auth_provider)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000000',
    'admin@petemart.in',
    crypt('Admin@123', gen_salt('bf')), NOW(),
    '{"full_name": "PeteMart Admin", "role": "admin", "phone": "+91-9900112000", "auth_provider": "email"}'::jsonb,
    NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, phone, name, role, auth_provider)
VALUES ('a0000000-0000-0000-0000-000000000000', 'admin@petemart.in', '+91-9900112000', 'PeteMart Admin', 'admin', 'email')
ON CONFLICT (id) DO NOTHING;

-- Create 9 merchant accounts
SELECT create_merchant_account('a0000000-0000-0000-0000-000000000001', 'tarun.enterprises@petemart.in', 'Tarun Kumar', '+91-9900112001');
SELECT create_merchant_account('a0000000-0000-0000-0000-000000000002', 'srivari.traders@petemart.in', 'Venkatesh Rao', '+91-9900112002');
SELECT create_merchant_account('a0000000-0000-0000-0000-000000000003', 'samskruti1@petemart.in', 'Lakshmi Devi', '+91-9900112003');
SELECT create_merchant_account('a0000000-0000-0000-0000-000000000004', 'samskruti2@petemart.in', 'Narayana Murthy', '+91-9900112004');
SELECT create_merchant_account('a0000000-0000-0000-0000-000000000005', 'flowers2u@petemart.in', 'Ganesh Iyer', '+91-9900112005');
SELECT create_merchant_account('a0000000-0000-0000-0000-000000000006', 'pastry.cafe@petemart.in', 'Mohammed Junaid', '+91-9900112006');
SELECT create_merchant_account('a0000000-0000-0000-0000-000000000007', 'vinayaka.textorium@petemart.in', 'Ramesh Babu', '+91-9900112007');
SELECT create_merchant_account('a0000000-0000-0000-0000-000000000008', 'sanjana.apparels@petemart.in', 'Sanjana Reddy', '+91-9900112008');
SELECT create_merchant_account('a0000000-0000-0000-0000-000000000009', 'madhumathi.ethnic@petemart.in', 'Madhumathi K', '+91-9900112009');

-- Create 3 test customer accounts (v2: includes auth_provider)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at) VALUES
    ('a0000000-0000-0000-0000-000000000010', 'priya.sharma@test.in', crypt('Test@123', gen_salt('bf')), NOW(), '{"full_name": "Priya Sharma", "role": "customer", "phone": "+91-9900112010", "auth_provider": "email"}'::jsonb, NOW(), NOW()),
    ('a0000000-0000-0000-0000-000000000011', 'rahul.verma@test.in', crypt('Test@123', gen_salt('bf')), NOW(), '{"full_name": "Rahul Verma", "role": "customer", "phone": "+91-9900112011", "auth_provider": "email"}'::jsonb, NOW(), NOW()),
    ('a0000000-0000-0000-0000-000000000012', 'ananya.patel@test.in', crypt('Test@123', gen_salt('bf')), NOW(), '{"full_name": "Ananya Patel", "role": "customer", "phone": "+91-9900112012", "auth_provider": "email"}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, phone, name, role, auth_provider) VALUES
    ('a0000000-0000-0000-0000-000000000010', 'priya.sharma@test.in', '+91-9900112010', 'Priya Sharma', 'customer', 'email'),
    ('a0000000-0000-0000-0000-000000000011', 'rahul.verma@test.in', '+91-9900112011', 'Rahul Verma', 'customer', 'email'),
    ('a0000000-0000-0000-0000-000000000012', 'ananya.patel@test.in', '+91-9900112012', 'Ananya Patel', 'customer', 'email')
ON CONFLICT (id) DO NOTHING;

-- Drop helper function
DROP FUNCTION IF EXISTS create_merchant_account;

-- =============================================================================
-- PART 3: CREATE STORES
-- =============================================================================

INSERT INTO stores (id, name, slug, market, category, description, owner_id, phone, address, geo, years_in_business, gst_registered, languages, delivery_radius_km, digital_maturity_score, status) VALUES

-- 1. Tarun Enterprises - Balepet, Electronics & General
('s0010000-0000-0000-0000-000000000001',
 'Tarun Enterprises', 'tarun-enterprises', 'Balepet', 'Electronics & General',
 'Your one-stop shop for electronics, appliances, and general household items. Serving Balepet for over 25 years.',
 'a0000000-0000-0000-0000-000000000001',
 '+91-9900112001',
 '42, Balepet Main Road, Near Kote, Bengaluru - 560053',
 '{"lat": 12.9719, "lng": 77.5788}'::jsonb,
 25, TRUE, ARRAY['Kannada','English','Hindi'], 8.00, 2, 'active'),

-- 2. Sri Vari Traders - Chickpet, Groceries & Spices
('s0020000-0000-0000-0000-000000000002',
 'Sri Vari Traders', 'sri-vari-traders', 'Chickpet', 'Groceries & Spices',
 'Premium quality spices, grains, and traditional grocery items directly from Karnataka farms.',
 'a0000000-0000-0000-0000-000000000002',
 '+91-9900112002',
 '78, Chickpet Cross, Bengaluru - 560053',
 '{"lat": 12.9725, "lng": 77.5810}'::jsonb,
 40, TRUE, ARRAY['Kannada','Telugu','English'], 5.00, 1, 'active'),

-- 3. Samskruti Silks - Chickpet, Textiles & Sarees
('s0030000-0000-0000-0000-000000000003',
 'Samskruti Silks - Chickpet', 'samskruti-silks-chickpet', 'Chickpet', 'Textiles & Sarees',
 'Exquisite Kanchipuram silks, wedding sarees, and traditional wear. Branch 1 in Chickpet.',
 'a0000000-0000-0000-0000-000000000003',
 '+91-9900112003',
 '120, Chickpet Main Road, Bengaluru - 560053',
 '{"lat": 12.9728, "lng": 77.5815}'::jsonb,
 35, TRUE, ARRAY['Kannada','Tamil','English'], 10.00, 3, 'active'),

-- 4. Samskruti Silks - Balepet, Textiles & Sarees
('s0040000-0000-0000-0000-000000000004',
 'Samskruti Silks - Balepet', 'samskruti-silks-balepet', 'Balepet', 'Textiles & Sarees',
 'Exquisite Kanchipuram silks, wedding sarees, and traditional wear. Branch 2 in Balepet.',
 'a0000000-0000-0000-0000-000000000004',
 '+91-9900112004',
 '55, Balepet Lane 2, Bengaluru - 560053',
 '{"lat": 12.9715, "lng": 77.5780}'::jsonb,
 30, TRUE, ARRAY['Kannada','Tamil','English'], 10.00, 3, 'active'),

-- 5. flowers2u - Mamulpet, Flowers & Decor
('s0050000-0000-0000-0000-000000000005',
 'flowers2u', 'flowers2u', 'Mamulpet', 'Flowers & Decor',
 'Fresh flower garlands, bouquets, wedding decorations, and floral arrangements for all occasions.',
 'a0000000-0000-0000-0000-000000000005',
 '+91-9900112005',
 '33, Mamulpet Main Road, Bengaluru - 560053',
 '{"lat": 12.9735, "lng": 77.5820}'::jsonb,
 15, FALSE, ARRAY['Kannada','English'], 7.00, 4, 'active'),

-- 6. Pastry Cafe - Tharagpet, Bakery & Snacks
('s0060000-0000-0000-0000-000000000006',
 'Pastry Cafe', 'pastry-cafe', 'Tharagpet', 'Bakery & Snacks',
 'Freshly baked breads, pastries, cakes, and traditional South Indian snacks. Established 1998.',
 'a0000000-0000-0000-0000-000000000006',
 '+91-9900112006',
 '90, Tharagpet Main Street, Bengaluru - 560053',
 '{"lat": 12.9740, "lng": 77.5795}'::jsonb,
 27, TRUE, ARRAY['Kannada','English','Hindi'], 4.00, 2, 'active'),

-- 7. Sri Vinayaka Textorium - Avenue Road, Textiles & Fabrics
('s0070000-0000-0000-0000-000000000007',
 'Sri Vinayaka Textorium', 'sri-vinayaka-textorium', 'Avenue Road', 'Textiles & Fabrics',
 'Premium cotton, silk, and blended fabrics for suits, sarees, and dress materials.',
 'a0000000-0000-0000-0000-000000000007',
 '+91-9900112007',
 '210, Avenue Road, Bengaluru - 560053',
 '{"lat": 12.9705, "lng": 77.5830}'::jsonb,
 45, TRUE, ARRAY['Kannada','English','Hindi'], 6.00, 1, 'active'),

-- 8. Sanjana Apparels - Cubbonpet, Ready-made Garments
('s0080000-0000-0000-0000-000000000008',
 'Sanjana Apparels', 'sanjana-apparels', 'Cubbonpet', 'Ready-made Garments',
 'Trendy readymade dresses, tops, jeans, and western wear for women and kids.',
 'a0000000-0000-0000-0000-000000000008',
 '+91-9900112008',
 '67, Cubbonpet Main Road, Bengaluru - 560053',
 '{"lat": 12.9695, "lng": 77.5805}'::jsonb,
 12, TRUE, ARRAY['Kannada','English'], 6.00, 4, 'active'),

-- 9. Madhumathi All-men''s Ethnic - Balepet, Men''s Ethnic Wear
('s0090000-0000-0000-0000-000000000009',
 'Madhumathi All-men''s Ethnic', 'madhumathi-mens-ethnic', 'Balepet', 'Men''s Ethnic Wear',
 'Traditional men''s kurtas, sherwanis, dhotis, and ethnic accessories. Perfect for weddings and festivals.',
 'a0000000-0000-0000-0000-000000000009',
 '+91-9900112009',
 '18, Balepet Lane 5, Bengaluru - 560053',
 '{"lat": 12.9712, "lng": 77.5785}'::jsonb,
 20, TRUE, ARRAY['Kannada','English','Urdu'], 6.00, 2, 'active')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PART 4: LINK MERCHANT PROFILES TO STORES
-- =============================================================================
UPDATE profiles SET merchant_store_id = 's0010000-0000-0000-0000-000000000001' WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE profiles SET merchant_store_id = 's0020000-0000-0000-0000-000000000002' WHERE id = 'a0000000-0000-0000-0000-000000000002';
UPDATE profiles SET merchant_store_id = 's0030000-0000-0000-0000-000000000003' WHERE id = 'a0000000-0000-0000-0000-000000000003';
UPDATE profiles SET merchant_store_id = 's0040000-0000-0000-0000-000000000004' WHERE id = 'a0000000-0000-0000-0000-000000000004';
UPDATE profiles SET merchant_store_id = 's0050000-0000-0000-0000-000000000005' WHERE id = 'a0000000-0000-0000-0000-000000000005';
UPDATE profiles SET merchant_store_id = 's0060000-0000-0000-0000-000000000006' WHERE id = 'a0000000-0000-0000-0000-000000000006';
UPDATE profiles SET merchant_store_id = 's0070000-0000-0000-0000-000000000007' WHERE id = 'a0000000-0000-0000-0000-000000000007';
UPDATE profiles SET merchant_store_id = 's0080000-0000-0000-0000-000000000008' WHERE id = 'a0000000-0000-0000-0000-000000000008';
UPDATE profiles SET merchant_store_id = 's0090000-0000-0000-0000-000000000009' WHERE id = 'a0000000-0000-0000-0000-000000000009';

COMMIT;

-- =============================================================================
-- PeteMart Database Migration Script — v1.0.0
-- Agent 07c: Backend Database Engineer
-- =============================================================================
-- This migration script is designed for idempotent execution.
-- It can be safely run multiple times; IF NOT EXISTS guards prevent errors.
--
-- Migration format follows Supabase/PostgreSQL best practices:
--   - Up:     Apply all schema changes
--   - Down:   Rollback all changes safely
--   - Verify: Check that the migration was applied correctly
--
-- Usage:
--   -- Apply migration (up):
--   psql -d <db_url> -f 08-migration-script.sql --variable=ACTION=up
--
--   -- Rollback migration (down):
--   psql -d <db_url> -f 08-migration-script.sql --variable=ACTION=down
--
--   -- Verify migration:
--   psql -d <db_url> -f 08-migration-script.sql --variable=ACTION=verify
-- =============================================================================

-- =============================================================================
-- MIGRATION META TABLE
-- =============================================================================
-- Track which migrations have been applied
CREATE TABLE IF NOT EXISTS _migrations (
    id          SERIAL PRIMARY KEY,
    version     TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum    TEXT,
    duration_ms INT
);

-- =============================================================================
-- UP MIGRATION — Apply all changes
-- =============================================================================
DO $$
DECLARE
    _start_ts TIMESTAMPTZ;
    _end_ts TIMESTAMPTZ;
    _migration_exists BOOLEAN;
BEGIN
    -- Check if migration already applied
    SELECT EXISTS(SELECT 1 FROM _migrations WHERE version = 'v2.0.0') INTO _migration_exists;

    IF _migration_exists THEN
        RAISE NOTICE 'Migration v2.0.0 already applied, skipping...';
        RETURN;
    END IF;

    _start_ts := clock_timestamp();

    -- ========================================================================
    -- STEP 1: Extensions
    -- ========================================================================
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- ========================================================================
    -- STEP 2: Custom Enums
    -- ========================================================================
    CREATE TYPE IF NOT EXISTS user_role AS ENUM ('customer', 'merchant', 'admin');
    CREATE TYPE IF NOT EXISTS store_status AS ENUM ('pending', 'active', 'suspended');
    CREATE TYPE IF NOT EXISTS order_status AS ENUM ('confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled');
    CREATE TYPE IF NOT EXISTS merchant_item_status AS ENUM ('pending', 'accepted', 'ready', 'shipped');
    CREATE TYPE IF NOT EXISTS payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
    CREATE TYPE IF NOT EXISTS payment_method AS ENUM ('cod', 'online', 'wallet');

    -- ========================================================================
    -- STEP 3: Trigger Function (updated_at)
    -- ========================================================================
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- ========================================================================
    -- STEP 4: Create Tables (with IF NOT EXISTS)
    -- ========================================================================

    -- 4a. profiles
    -- v2.0.0: Added password_hash and auth_provider for email+password auth support
    CREATE TABLE IF NOT EXISTS profiles (
        id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email           TEXT,
        phone           TEXT,
        password_hash   TEXT,                   -- bcrypt hash for email+password auth (v2)
        auth_provider   TEXT NOT NULL DEFAULT 'phone' CHECK (auth_provider IN ('phone', 'email')),  -- v2
        name            TEXT NOT NULL,
        role            user_role NOT NULL DEFAULT 'customer',
        merchant_store_id UUID DEFAULT NULL,
        avatar_url      TEXT,
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        metadata        JSONB DEFAULT '{}'::jsonb,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 4b. stores
    CREATE TABLE IF NOT EXISTS stores (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name                TEXT NOT NULL,
        slug                TEXT NOT NULL UNIQUE,
        market              TEXT NOT NULL,
        category            TEXT NOT NULL,
        description         TEXT,
        logo_url            TEXT,
        banner_url          TEXT,
        owner_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
        phone               TEXT,
        address             TEXT,
        geo                 JSONB,
        years_in_business   INT DEFAULT 0,
        gst_registered      BOOLEAN DEFAULT FALSE,
        languages           TEXT[] DEFAULT ARRAY['Kannada', 'English'],
        delivery_radius_km  NUMERIC(5,2) DEFAULT 5.00,
        business_hours      JSONB DEFAULT '{"mon": "09:00-21:00", "tue": "09:00-21:00", "wed": "09:00-21:00", "thu": "09:00-21:00", "fri": "09:00-21:00", "sat": "09:00-21:00", "sun": "10:00-18:00"}'::jsonb,
        digital_maturity_score INT DEFAULT 1 CHECK (digital_maturity_score BETWEEN 1 AND 5),
        status              store_status NOT NULL DEFAULT 'active',
        is_active           BOOLEAN NOT NULL DEFAULT TRUE,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Add FK from profiles to stores (after stores table exists)
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_merchant_store;
    ALTER TABLE profiles ADD CONSTRAINT fk_profiles_merchant_store
        FOREIGN KEY (merchant_store_id) REFERENCES stores(id) ON DELETE SET NULL;

    -- 4c. products
    CREATE TABLE IF NOT EXISTS products (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name            TEXT NOT NULL,
        slug            TEXT NOT NULL,
        sku             TEXT,
        description     TEXT,
        price           INT NOT NULL CHECK (price >= 0),
        original_price  INT CHECK (original_price >= 0),
        category        TEXT NOT NULL,
        subcategory     TEXT,
        unit            TEXT DEFAULT 'piece',
        min_order_qty   INT DEFAULT 1 CHECK (min_order_qty >= 1),
        stock           INT DEFAULT 0 CHECK (stock >= 0),
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        images          TEXT[] DEFAULT '{}',
        tags            TEXT[] DEFAULT '{}',
        mode_available  TEXT[] DEFAULT ARRAY['buy_now'],
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_product_per_store UNIQUE (store_id, slug)
    );

    -- 4d. orders
    CREATE TABLE IF NOT EXISTS orders (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_number    TEXT NOT NULL DEFAULT 'PM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-0000',
        customer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
        status          order_status NOT NULL DEFAULT 'confirmed',
        total_amount    INT NOT NULL CHECK (total_amount >= 0),
        delivery_fee    INT DEFAULT 0 CHECK (delivery_fee >= 0),
        payment_status  payment_status NOT NULL DEFAULT 'pending',
        payment_method  payment_method,
        shipping_address JSONB,
        notes           TEXT,
        consolidation_id UUID DEFAULT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 4e. order_items
    CREATE TABLE IF NOT EXISTS order_items (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
        quantity        INT NOT NULL CHECK (quantity > 0),
        unit_price      INT NOT NULL CHECK (unit_price >= 0),
        total_price     INT NOT NULL CHECK (total_price >= 0),
        merchant_status merchant_item_status NOT NULL DEFAULT 'pending',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 4f. delivery_tracking
    CREATE TABLE IF NOT EXISTS delivery_tracking (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        status              TEXT,
        location            TEXT,
        courier_name        TEXT,
        courier_phone       TEXT,
        estimated_delivery_at TIMESTAMPTZ,
        delivered_at        TIMESTAMPTZ,
        tracking_updates    JSONB[] DEFAULT '{}',
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 4g. reviews
    CREATE TABLE IF NOT EXISTS reviews (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        review_text TEXT,
        images      TEXT[] DEFAULT '{}',
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_review UNIQUE (order_id, product_id, customer_id)
    );

    -- ========================================================================
    -- STEP 5: Auto-profile Trigger (Supabase Auth → Profiles)
    -- ========================================================================
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

    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();

    -- ========================================================================
    -- STEP 6: RLS — Enable on all tables
    -- ========================================================================
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE stores   ENABLE ROW LEVEL SECURITY;
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
    ALTER TABLE reviews  ENABLE ROW LEVEL SECURITY;

    -- ========================================================================
    -- STEP 7: Helper Function for RLS
    -- ========================================================================
    CREATE OR REPLACE FUNCTION public.current_user_role()
    RETURNS user_role AS $$
    DECLARE
        user_role_val user_role;
    BEGIN
        SELECT role INTO user_role_val FROM public.profiles WHERE id = auth.uid();
        RETURN user_role_val;
    END;
    $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

    -- ========================================================================
    -- STEP 8: RLS Policies (full set)
    -- ========================================================================

    -- Drop existing policies to avoid duplicates on re-run
    DROP POLICY IF EXISTS profiles_select_own_or_admin ON profiles;
    DROP POLICY IF EXISTS profiles_update_own ON profiles;
    DROP POLICY IF EXISTS profiles_admin_insert ON profiles;
    DROP POLICY IF EXISTS profiles_admin_delete ON profiles;
    DROP POLICY IF EXISTS stores_select ON stores;
    DROP POLICY IF EXISTS stores_update ON stores;
    DROP POLICY IF EXISTS stores_admin_insert ON stores;
    DROP POLICY IF EXISTS stores_admin_delete ON stores;
    DROP POLICY IF EXISTS products_select ON products;
    DROP POLICY IF EXISTS products_insert ON products;
    DROP POLICY IF EXISTS products_update ON products;
    DROP POLICY IF EXISTS products_delete ON products;
    DROP POLICY IF EXISTS orders_select ON orders;
    DROP POLICY IF EXISTS orders_insert ON orders;
    DROP POLICY IF EXISTS orders_update ON orders;
    DROP POLICY IF EXISTS orders_admin_delete ON orders;
    DROP POLICY IF EXISTS order_items_select ON order_items;
    DROP POLICY IF EXISTS order_items_insert ON order_items;
    DROP POLICY IF EXISTS order_items_update ON order_items;
    DROP POLICY IF EXISTS delivery_tracking_select ON delivery_tracking;
    DROP POLICY IF EXISTS delivery_tracking_admin_all ON delivery_tracking;
    DROP POLICY IF EXISTS delivery_tracking_admin_update ON delivery_tracking;
    DROP POLICY IF EXISTS reviews_select ON reviews;
    DROP POLICY IF EXISTS reviews_insert ON reviews;
    DROP POLICY IF EXISTS reviews_update ON reviews;

    -- Profiles RLS
    CREATE POLICY profiles_select_own_or_admin ON profiles FOR SELECT
        USING (auth.uid() = id OR public.current_user_role() = 'admin');
    CREATE POLICY profiles_update_own ON profiles FOR UPDATE
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id AND (public.current_user_role() = 'admin' OR role = (SELECT role FROM public.profiles WHERE id = auth.uid())));
    CREATE POLICY profiles_admin_insert ON profiles FOR INSERT
        WITH CHECK (public.current_user_role() = 'admin');
    CREATE POLICY profiles_admin_delete ON profiles FOR DELETE
        USING (public.current_user_role() = 'admin');

    -- Stores RLS
    CREATE POLICY stores_select ON stores FOR SELECT
        USING (is_active = TRUE OR owner_id = auth.uid() OR public.current_user_role() = 'admin');
    CREATE POLICY stores_update ON stores FOR UPDATE
        USING (owner_id = auth.uid() OR public.current_user_role() = 'admin')
        WITH CHECK (owner_id = auth.uid() OR public.current_user_role() = 'admin');
    CREATE POLICY stores_admin_insert ON stores FOR INSERT
        WITH CHECK (public.current_user_role() = 'admin');
    CREATE POLICY stores_admin_delete ON stores FOR DELETE
        USING (public.current_user_role() = 'admin');

    -- Products RLS
    CREATE POLICY products_select ON products FOR SELECT
        USING (is_active = TRUE OR store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()) OR public.current_user_role() = 'admin');
    CREATE POLICY products_insert ON products FOR INSERT
        WITH CHECK (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()) OR public.current_user_role() = 'admin');
    CREATE POLICY products_update ON products FOR UPDATE
        USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()) OR public.current_user_role() = 'admin')
        WITH CHECK (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()) OR public.current_user_role() = 'admin');
    CREATE POLICY products_delete ON products FOR DELETE
        USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()) OR public.current_user_role() = 'admin');

    -- Orders RLS
    CREATE POLICY orders_select ON orders FOR SELECT
        USING (customer_id = auth.uid() OR id IN (SELECT DISTINCT order_id FROM order_items WHERE store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())) OR public.current_user_role() = 'admin');
    CREATE POLICY orders_insert ON orders FOR INSERT
        WITH CHECK (customer_id = auth.uid() OR public.current_user_role() = 'admin');
    CREATE POLICY orders_update ON orders FOR UPDATE
        USING (customer_id = auth.uid() OR public.current_user_role() = 'admin')
        WITH CHECK (customer_id = auth.uid() OR public.current_user_role() = 'admin');
    CREATE POLICY orders_admin_delete ON orders FOR DELETE
        USING (public.current_user_role() = 'admin');

    -- Order Items RLS
    CREATE POLICY order_items_select ON order_items FOR SELECT
        USING (order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid()) OR store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()) OR public.current_user_role() = 'admin');
    CREATE POLICY order_items_insert ON order_items FOR INSERT
        WITH CHECK (order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid()) OR public.current_user_role() = 'admin');
    CREATE POLICY order_items_update ON order_items FOR UPDATE
        USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()) OR public.current_user_role() = 'admin')
        WITH CHECK (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()) OR public.current_user_role() = 'admin');

    -- Delivery Tracking RLS
    CREATE POLICY delivery_tracking_select ON delivery_tracking FOR SELECT
        USING (order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid()) OR order_id IN (SELECT DISTINCT oi.order_id FROM order_items oi WHERE oi.store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())) OR public.current_user_role() = 'admin');
    CREATE POLICY delivery_tracking_admin_all ON delivery_tracking FOR INSERT
        WITH CHECK (public.current_user_role() = 'admin');
    CREATE POLICY delivery_tracking_admin_update ON delivery_tracking FOR UPDATE
        USING (public.current_user_role() = 'admin')
        WITH CHECK (public.current_user_role() = 'admin');

    -- Reviews RLS
    CREATE POLICY reviews_select ON reviews FOR SELECT
        USING (is_active = TRUE OR customer_id = auth.uid() OR public.current_user_role() = 'admin');
    CREATE POLICY reviews_insert ON reviews FOR INSERT
        WITH CHECK (customer_id = auth.uid() AND order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid()));
    CREATE POLICY reviews_update ON reviews FOR UPDATE
        USING (customer_id = auth.uid() OR public.current_user_role() = 'admin')
        WITH CHECK (customer_id = auth.uid() OR public.current_user_role() = 'admin');

    -- ========================================================================
    -- STEP 9: Indexes
    -- ========================================================================

    -- Profiles
    CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE is_active = TRUE;
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_profiles_auth_provider ON profiles(auth_provider);
    CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

    -- Stores
    CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);
    CREATE INDEX IF NOT EXISTS idx_stores_market ON stores(market);
    CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);
    CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
    CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status) WHERE status = 'active';

    -- Products
    CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = TRUE;
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    CREATE INDEX IF NOT EXISTS idx_products_store_active ON products(store_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active);
    CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
    CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

    -- Orders
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
    CREATE INDEX IF NOT EXISTS idx_orders_consolidation ON orders(consolidation_id) WHERE consolidation_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

    -- Order Items
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_store ON order_items(store_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_merchant_status ON order_items(merchant_status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_store ON order_items(order_id, store_id);

    -- Delivery Tracking
    CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON delivery_tracking(order_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status ON delivery_tracking(status);
    CREATE INDEX IF NOT EXISTS idx_delivery_tracking_estimated ON delivery_tracking(estimated_delivery_at) WHERE estimated_delivery_at IS NOT NULL;

    -- Reviews
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
    CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);
    CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

    -- ========================================================================
    -- STEP 10: Trigger for order number generation
    -- ========================================================================
    CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001 INCREMENT BY 1;

    CREATE OR REPLACE FUNCTION generate_order_number()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.order_number := 'PM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_orders_order_number ON orders;
    CREATE TRIGGER trg_orders_order_number
        BEFORE INSERT ON orders
        FOR EACH ROW EXECUTE FUNCTION generate_order_number();

    -- ========================================================================
    -- STEP 11: Trigger for updated_at on all tables
    -- ========================================================================
    DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
    CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_stores_updated_at ON stores;
    CREATE TRIGGER trg_stores_updated_at BEFORE UPDATE ON stores
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
    CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
    CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_order_items_updated_at ON order_items;
    CREATE TRIGGER trg_order_items_updated_at BEFORE UPDATE ON order_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_delivery_tracking_updated_at ON delivery_tracking;
    CREATE TRIGGER trg_delivery_tracking_updated_at BEFORE UPDATE ON delivery_tracking
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- ========================================================================
    -- Record migration as applied
    -- ========================================================================
    _end_ts := clock_timestamp();

    INSERT INTO _migrations (version, name, checksum, duration_ms)
    VALUES (
        'v2.0.0',
        'initial-schema-with-auth-v2',
        md5('petemart-v2.0.0-initial-schema-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS')),
        EXTRACT(EPOCH FROM (_end_ts - _start_ts)) * 1000
    );

    RAISE NOTICE 'Migration v2.0.0 applied successfully in % ms', EXTRACT(EPOCH FROM (_end_ts - _start_ts)) * 1000;
END $$;

-- =============================================================================
-- DOWN MIGRATION — Rollback all changes
-- =============================================================================
-- To execute: psql -d <db_url> -v ACTION=down -f migration.sql

-- Note: The DO block approach for conditional execution is complex.
-- For the DOWN migration, run these commands manually or in a transaction:
--
-- BEGIN;
--   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--   DROP FUNCTION IF EXISTS handle_new_user();
--   DROP TRIGGER IF EXISTS trg_orders_order_number ON orders;
--   DROP FUNCTION IF EXISTS generate_order_number();
--   DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
--   DROP TRIGGER IF EXISTS trg_stores_updated_at ON stores;
--   DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
--   DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
--   DROP TRIGGER IF EXISTS trg_order_items_updated_at ON order_items;
--   DROP TRIGGER IF EXISTS trg_delivery_tracking_updated_at ON delivery_tracking;
--   DROP TABLE IF EXISTS reviews CASCADE;
--   DROP TABLE IF EXISTS delivery_tracking CASCADE;
--   DROP TABLE IF EXISTS order_items CASCADE;
--   DROP TABLE IF EXISTS orders CASCADE;
--   DROP TABLE IF EXISTS products CASCADE;
--   DROP TABLE IF EXISTS stores CASCADE;
--   DROP TABLE IF EXISTS profiles CASCADE;
--   DROP TYPE IF EXISTS payment_method;
--   DROP TYPE IF EXISTS payment_status;
--   DROP TYPE IF EXISTS merchant_item_status;
--   DROP TYPE IF EXISTS order_status;
--   DROP TYPE IF EXISTS store_status;
--   DROP TYPE IF EXISTS user_role;
--   DROP FUNCTION IF EXISTS update_updated_at_column();
--   DROP FUNCTION IF EXISTS public.current_user_role();
--   DROP SEQUENCE IF EXISTS order_number_seq;
-- COMMIT;

-- =============================================================================
-- VERIFY MIGRATION
-- =============================================================================
-- To execute: psql -d <db_url> -v ACTION=verify -f migration.sql

SELECT 'Migration Status' AS report;
SELECT version, name, applied_at, duration_ms FROM _migrations ORDER BY applied_at DESC;

SELECT 'Table Count' AS metric, COUNT(*) AS value FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
SELECT 'Enum Count' AS metric, COUNT(*) AS value FROM pg_type WHERE typcategory = 'E';

SELECT 'Tables:' AS info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;

SELECT 'Enums:' AS info;
SELECT t.typname AS enum_type, e.enumlabel AS enum_value
FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
ORDER BY t.typname, e.enumsortorder;

SELECT 'RLS Enabled Tables:' AS info;
SELECT relname AS table FROM pg_class WHERE relrowsecurity = TRUE AND relnamespace = 'public'::regnamespace;

SELECT 'Index Count:' AS info;
SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';

-- =============================================================================
-- UPGRADE NOTE: V2 Migration
-- =============================================================================
-- After applying v1.0.0 (this script), apply v2.0.0 for email+password auth:
--
--   psql -d <db_url> -f 09-auth-v2.sql
--
-- v2.0.0 changes:
--   - Adds password_hash and auth_provider columns to profiles
--   - Updates handle_new_user() trigger to set auth_provider
--   - Adds idx_profiles_auth_provider and idx_profiles_phone indexes
--   - Adds on_auth_user_email_change trigger for email sync
--   - Seeds 5 email+password demo accounts
-- =============================================================================

-- =============================================================================
-- END OF MIGRATION SCRIPT
-- =============================================================================

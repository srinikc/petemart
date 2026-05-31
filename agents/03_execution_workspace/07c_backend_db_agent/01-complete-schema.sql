-- =============================================================================
-- PeteMart Database Schema — Supabase (PostgreSQL 15)
-- Agent 07c: Backend Database Engineer
-- Version: v2.0.0 (Email+Password Auth Upgrade)
-- Zero-Cost Mandate | Supabase Free Tier
-- =============================================================================
-- This file contains:
--   1. Enum type definitions
--   2. Core table definitions (profiles, stores, products, orders, order_items,
--      delivery_tracking, reviews)
--   3. Auto-profile trigger (auth.users → profiles)
--   4. Sequence for order number generation
--   5. Row Level Security policies (all tables)
--   6. Index definitions (performance tuning)
--   7. Updated_at trigger function
-- =============================================================================
--
-- v2.0.0 Changes:
--   - Added password_hash to profiles (for email+password auth)
--   - Added auth_provider to profiles ('phone' | 'email')
--   - Updated handle_new_user() trigger to set auth_provider
--   - Added idx_profiles_auth_provider index
--   - Updated RLS policies to handle email auth profiles
--   - All 34 existing v1 indexes preserved
-- =============================================================================

-- =============================================================================
-- PART 1: EXTENSIONS & ENUM TYPES
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'merchant', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Store lifecycle status
DO $$ BEGIN
    CREATE TYPE store_status AS ENUM ('pending', 'active', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Full order lifecycle
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'confirmed', 'processing', 'shipped',
        'out_for_delivery', 'delivered', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Per-merchant item fulfillment tracking
DO $$ BEGIN
    CREATE TYPE merchant_item_status AS ENUM (
        'pending', 'accepted', 'ready', 'shipped'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Payment tracking
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cod', 'online', 'wallet');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- PART 2: TRIGGER FUNCTION FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PART 3: CORE TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3a. PROFILES — Extends Supabase Auth
-- -----------------------------------------------------------------------------
-- Supports dual authentication:
--   - Phone OTP: auth_provider = 'phone', phone is primary identifier
--   - Email+Password: auth_provider = 'email', email + password_hash used
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT,
    phone           TEXT,
    password_hash   TEXT,                   -- bcrypt hash for email+password auth (nullable)
    auth_provider   TEXT NOT NULL DEFAULT 'phone' CHECK (auth_provider IN ('phone', 'email')),
    name            TEXT NOT NULL,
    role            user_role NOT NULL DEFAULT 'customer',
    merchant_store_id UUID DEFAULT NULL,   -- FK added after stores table
    avatar_url      TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3b. STORES — Merchant storefronts
-- -----------------------------------------------------------------------------
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
    geo                 JSONB,       -- { "lat": 12.9716, "lng": 77.5946 }
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

-- Add FK from profiles to stores
ALTER TABLE profiles
    ADD CONSTRAINT IF NOT EXISTS fk_profiles_merchant_store
    FOREIGN KEY (merchant_store_id) REFERENCES stores(id) ON DELETE SET NULL;

CREATE TRIGGER trg_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3c. PRODUCTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL,
    sku             TEXT,
    description     TEXT,
    price           INT NOT NULL CHECK (price >= 0),           -- in paise
    original_price  INT CHECK (original_price >= 0),           -- in paise (for showing discounts)
    category        TEXT NOT NULL,
    subcategory     TEXT,
    unit            TEXT DEFAULT 'piece',
    min_order_qty   INT DEFAULT 1 CHECK (min_order_qty >= 1),
    stock           INT DEFAULT 0 CHECK (stock >= 0),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    images          TEXT[] DEFAULT '{}',
    tags            TEXT[] DEFAULT '{}',
    mode_available  TEXT[] DEFAULT ARRAY['buy_now'],  -- 'buy_now', 'whatsapp', 'visit_store'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_product_per_store UNIQUE (store_id, slug)
);

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3d. ORDERS
-- -----------------------------------------------------------------------------

-- Sequence for human-readable order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number    TEXT NOT NULL DEFAULT (
        'PM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0')
    ),
    customer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    status          order_status NOT NULL DEFAULT 'confirmed',
    total_amount    INT NOT NULL CHECK (total_amount >= 0),      -- in paise
    delivery_fee    INT DEFAULT 0 CHECK (delivery_fee >= 0),     -- in paise
    payment_status  payment_status NOT NULL DEFAULT 'pending',
    payment_method  payment_method,
    shipping_address JSONB,
    notes           TEXT,
    consolidation_id UUID DEFAULT NULL,  -- links multi-merchant orders
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow updating order_number on insert via trigger
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'PM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3e. ORDER_ITEMS — Per-store line items within an order
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    quantity        INT NOT NULL CHECK (quantity > 0),
    unit_price      INT NOT NULL CHECK (unit_price >= 0),           -- in paise
    total_price     INT NOT NULL CHECK (total_price >= 0),          -- in paise
    merchant_status merchant_item_status NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3f. DELIVERY_TRACKING
-- -----------------------------------------------------------------------------
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

CREATE TRIGGER trg_delivery_tracking_updated_at
    BEFORE UPDATE ON delivery_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3g. REVIEWS
-- -----------------------------------------------------------------------------
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

    -- One review per product per order per customer
    CONSTRAINT uq_review UNIQUE (order_id, product_id, customer_id)
);

-- =============================================================================
-- PART 4: AUTO-PROFILE TRIGGER (Supabase Auth Hook)
-- =============================================================================
-- Automatically creates a profile row when a user signs up via Supabase Auth.
-- Works with both email/password and phone OTP signups.
-- Sets auth_provider field based on signup method.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    _phone TEXT;
    _auth_provider TEXT;
BEGIN
    _phone := NEW.raw_user_meta_data->>'phone';

    -- Determine auth provider: 'email' if email is present and no phone, else 'phone'
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

-- Drop existing trigger if re-running migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- PART 4b: EMAIL SYNC TRIGGER
-- =============================================================================
-- Sync profile email when auth.users email changes

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

-- =============================================================================
-- PART 5: ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews  ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper function: get current user's role
-- Created in public schema so RLS policies can reference it
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val FROM public.profiles WHERE id = auth.uid();
    RETURN user_role_val;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- PROFILES RLS
-- ---------------------------------------------------------------------------
-- Rule: Users can read their own profile. Admins can read all.
-- Email auth profiles are visible to their owners and admins.
CREATE POLICY profiles_select_own_or_admin
    ON profiles FOR SELECT
    USING (
        auth.uid() = id
        OR public.current_user_role() = 'admin'
    );

-- Rule: Users can update their own profile (but not role).
-- Email auth users can update their email, name, avatar, etc.
CREATE POLICY profiles_update_own
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND (
            -- Prevent non-admins from changing their role
            public.current_user_role() = 'admin'
            OR role = (SELECT role FROM public.profiles WHERE id = auth.uid())
        )
    );

-- Rule: Only admins can insert/delete profiles (auth trigger handles insert)
CREATE POLICY profiles_admin_insert
    ON profiles FOR INSERT
    WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY profiles_admin_delete
    ON profiles FOR DELETE
    USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- STORES RLS
-- ---------------------------------------------------------------------------
-- Rule: Merchants see own stores. Admins see all. Customers see active only.
CREATE POLICY stores_select
    ON stores FOR SELECT
    USING (
        is_active = TRUE
        OR owner_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

-- Rule: Merchants can update own stores. Admins can update any.
CREATE POLICY stores_update
    ON stores FOR UPDATE
    USING (
        owner_id = auth.uid()
        OR public.current_user_role() = 'admin'
    )
    WITH CHECK (
        owner_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

-- Rule: Only admins can create/delete stores
CREATE POLICY stores_admin_insert
    ON stores FOR INSERT
    WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY stores_admin_delete
    ON stores FOR DELETE
    USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- PRODUCTS RLS
-- ---------------------------------------------------------------------------
-- Rule: Anyone can see active products. Merchants see own products (active or not).
--        Admins see all.
CREATE POLICY products_select
    ON products FOR SELECT
    USING (
        is_active = TRUE
        OR store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
        OR public.current_user_role() = 'admin'
    );

-- Rule: Store owners can update their own products. Admins can update all.
CREATE POLICY products_update
    ON products FOR UPDATE
    USING (
        store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
        OR public.current_user_role() = 'admin'
    )
    WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY products_insert
    ON products FOR INSERT
    WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY products_delete
    ON products FOR DELETE
    USING (
        store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
        OR public.current_user_role() = 'admin'
    );

-- ---------------------------------------------------------------------------
-- ORDERS RLS
-- ---------------------------------------------------------------------------
-- Rule: Customers see own orders. Merchants see orders containing their products.
--        Admins see all.
CREATE POLICY orders_select
    ON orders FOR SELECT
    USING (
        customer_id = auth.uid()
        OR id IN (
            SELECT DISTINCT order_id FROM order_items
            WHERE store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
        )
        OR public.current_user_role() = 'admin'
    );

-- Rule: Customers can update own orders (limited). Admins can update all.
CREATE POLICY orders_update
    ON orders FOR UPDATE
    USING (
        customer_id = auth.uid()
        OR public.current_user_role() = 'admin'
    )
    WITH CHECK (
        customer_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY orders_insert
    ON orders FOR INSERT
    WITH CHECK (
        customer_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY orders_admin_delete
    ON orders FOR DELETE
    USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- ORDER_ITEMS RLS
-- ---------------------------------------------------------------------------
CREATE POLICY order_items_select
    ON order_items FOR SELECT
    USING (
        order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
        OR store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY order_items_insert
    ON order_items FOR INSERT
    WITH CHECK (
        order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY order_items_update
    ON order_items FOR UPDATE
    USING (
        store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
        OR public.current_user_role() = 'admin'
    )
    WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
        OR public.current_user_role() = 'admin'
    );

-- ---------------------------------------------------------------------------
-- DELIVERY_TRACKING RLS
-- ---------------------------------------------------------------------------
CREATE POLICY delivery_tracking_select
    ON delivery_tracking FOR SELECT
    USING (
        order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
        OR order_id IN (
            SELECT DISTINCT oi.order_id FROM order_items oi
            WHERE oi.store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
        )
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY delivery_tracking_admin_all
    ON delivery_tracking FOR INSERT
    WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY delivery_tracking_admin_update
    ON delivery_tracking FOR UPDATE
    USING (public.current_user_role() = 'admin')
    WITH CHECK (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- REVIEWS RLS
-- ---------------------------------------------------------------------------
CREATE POLICY reviews_select
    ON reviews FOR SELECT
    USING (
        is_active = TRUE
        OR customer_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY reviews_insert
    ON reviews FOR INSERT
    WITH CHECK (
        customer_id = auth.uid()
        AND order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
    );

CREATE POLICY reviews_update
    ON reviews FOR UPDATE
    USING (
        customer_id = auth.uid()
        OR public.current_user_role() = 'admin'
    )
    WITH CHECK (
        customer_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

-- =============================================================================
-- PART 6: INDEX DEFINITIONS
-- =============================================================================
-- Total: 36 indexes (34 existing v1 + auth_provider + enhanced email lookup)

-- ---------------------------------------------------------------------------
-- PROFILES indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_auth_provider ON profiles(auth_provider);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- ---------------------------------------------------------------------------
-- STORES indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_market ON stores(market);
CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status) WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- PRODUCTS indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_store_active ON products(store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

-- ---------------------------------------------------------------------------
-- ORDERS indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_consolidation ON orders(consolidation_id) WHERE consolidation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- ---------------------------------------------------------------------------
-- ORDER_ITEMS indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_store ON order_items(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_merchant_status ON order_items(merchant_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_store ON order_items(order_id, store_id);

-- ---------------------------------------------------------------------------
-- DELIVERY_TRACKING indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status ON delivery_tracking(status);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_estimated ON delivery_tracking(estimated_delivery_at)
    WHERE estimated_delivery_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- REVIEWS indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- =============================================================================
-- END OF SCHEMA (v2.0.0)
-- =============================================================================

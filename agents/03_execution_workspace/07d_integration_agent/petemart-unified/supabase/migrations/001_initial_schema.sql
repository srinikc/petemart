-- =============================================================================
-- PeteMart — Initial Database Schema
-- Version: 001 (2026-05-30)
-- =============================================================================
-- This migration creates the foundational tables for the PeteMart platform:
--   profiles, merchants, products, categories, orders, cart, payments, reviews
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM Types
CREATE TYPE user_role AS ENUM ('customer', 'merchant', 'admin', 'delivery_partner');
CREATE TYPE merchant_status AS ENUM ('pending', 'active', 'suspended', 'inactive');
CREATE TYPE order_status AS ENUM (
    'pending', 'confirmed', 'preparing', 'ready_for_pickup',
    'out_for_delivery', 'delivered', 'cancelled', 'refunded'
);
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('card', 'upi', 'cod', 'wallet');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    phone           TEXT,
    full_name       TEXT,
    avatar_url      TEXT,
    role            user_role NOT NULL DEFAULT 'customer',
    preferred_language TEXT DEFAULT 'en',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Merchants
CREATE TABLE merchants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_name   TEXT NOT NULL,
    business_type   TEXT,
    description     TEXT,
    logo_url        TEXT,
    cover_image_url TEXT,
    status          merchant_status NOT NULL DEFAULT 'pending',
    digital_readiness TEXT,
    address_line1   TEXT,
    address_line2   TEXT,
    city            TEXT NOT NULL,
    locality        TEXT,
    state           TEXT NOT NULL DEFAULT 'Karnataka',
    pincode         TEXT,
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    delivery_radius_km INTEGER DEFAULT 5,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    opening_time    TIME DEFAULT '09:00',
    closing_time    TIME DEFAULT '21:00',
    is_open         BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT,
    image_url       TEXT,
    parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    unit            TEXT DEFAULT 'piece',
    stock_quantity  INTEGER DEFAULT 0,
    is_available    BOOLEAN DEFAULT true,
    images          TEXT[] DEFAULT '{}',
    tags            TEXT[] DEFAULT '{}',
    attributes      JSONB DEFAULT '{}',
    is_featured     BOOLEAN DEFAULT false,
    preparation_time_minutes INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(merchant_id, slug)
);

-- Cart
CREATE TABLE cart_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL DEFAULT 1,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Orders
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number    TEXT NOT NULL UNIQUE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    merchant_id     UUID REFERENCES merchants(id) ON DELETE SET NULL,
    status          order_status NOT NULL DEFAULT 'pending',
    subtotal        DECIMAL(10,2) NOT NULL,
    delivery_fee    DECIMAL(10,2) DEFAULT 0,
    platform_fee    DECIMAL(10,2) DEFAULT 0,
    discount        DECIMAL(10,2) DEFAULT 0,
    total           DECIMAL(10,2) NOT NULL,
    delivery_address JSONB,
    delivery_notes  TEXT,
    contact_phone   TEXT,
    payment_status  payment_status NOT NULL DEFAULT 'pending',
    payment_method  payment_method,
    is_multi_merchant BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,
    total_price     DECIMAL(10,2) NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title           TEXT,
    body            TEXT,
    images          TEXT[] DEFAULT '{}',
    is_verified     BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id, order_id)
);

-- Indexes for performance
CREATE INDEX idx_merchants_owner ON merchants(owner_id);
CREATE INDEX idx_merchants_locality ON merchants(locality);
CREATE INDEX idx_merchants_city ON merchants(city);
CREATE INDEX idx_products_merchant ON products(merchant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_available ON products(is_available) WHERE is_available = true;
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_merchant ON orders(merchant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =============================================================================
-- PeteMart — Row Level Security Policies
-- Version: 002 (2026-05-30)
-- =============================================================================
-- Enables RLS on all tables and defines granular access policies.
-- Auth helpers: auth.uid() = current user, auth.jwt() -> 'role' for role check
-- =============================================================================

-- ── Enable RLS on all tables ────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ── Profiles ────────────────────────────────────────────────────────────────
-- Users can read any public profile
CREATE POLICY "Profiles are publicly readable"
    ON profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Only users can insert their own profile (trigger-based from auth)
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
    ON profiles FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- ── Merchants ───────────────────────────────────────────────────────────────
-- Anyone can read active merchants
CREATE POLICY "Active merchants are publicly readable"
    ON merchants FOR SELECT
    USING (status = 'active' OR auth.uid() = owner_id);

-- Merchants can update their own merchant record
CREATE POLICY "Merchants can update own merchant"
    ON merchants FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Merchants can create their own merchant record
CREATE POLICY "Merchants can create own merchant"
    ON merchants FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Admins can manage all merchants
CREATE POLICY "Admins manage all merchants"
    ON merchants FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- ── Products ────────────────────────────────────────────────────────────────
-- Anyone can read available products
CREATE POLICY "Products are publicly readable"
    ON products FOR SELECT
    USING (is_available = true OR auth.uid() IN (
        SELECT owner_id FROM merchants WHERE id = products.merchant_id
    ));

-- Merchants can manage their own products
CREATE POLICY "Merchants manage own products"
    ON products FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT owner_id FROM merchants WHERE id = merchant_id
    ));

CREATE POLICY "Merchants update own products"
    ON products FOR UPDATE
    USING (auth.uid() IN (
        SELECT owner_id FROM merchants WHERE id = merchant_id
    ))
    WITH CHECK (auth.uid() IN (
        SELECT owner_id FROM merchants WHERE id = merchant_id
    ));

CREATE POLICY "Merchants delete own products"
    ON products FOR DELETE
    USING (auth.uid() IN (
        SELECT owner_id FROM merchants WHERE id = merchant_id
    ));

-- ── Categories ──────────────────────────────────────────────────────────────
-- Everyone can read categories
CREATE POLICY "Categories are publicly readable"
    ON categories FOR SELECT
    USING (true);

-- Admins only for write
CREATE POLICY "Admins manage categories"
    ON categories FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- ── Cart Items ──────────────────────────────────────────────────────────────
-- Users manage their own cart
CREATE POLICY "Users manage own cart"
    ON cart_items FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── Orders ──────────────────────────────────────────────────────────────────
-- Users can see their own orders
CREATE POLICY "Users view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

-- Merchants can see orders for their products
CREATE POLICY "Merchants view relevant orders"
    ON orders FOR SELECT
    USING (merchant_id IN (
        SELECT id FROM merchants WHERE owner_id = auth.uid()
    ));

-- Users can create orders
CREATE POLICY "Users create orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can manage all orders
CREATE POLICY "Admins manage all orders"
    ON orders FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- ── Order Items ─────────────────────────────────────────────────────────────
-- Order items inherit visibility from orders
CREATE POLICY "Users view own order items"
    ON order_items FOR SELECT
    USING (order_id IN (
        SELECT id FROM orders WHERE user_id = auth.uid()
    ));

CREATE POLICY "Merchants view own order items"
    ON order_items FOR SELECT
    USING (merchant_id IN (
        SELECT id FROM merchants WHERE owner_id = auth.uid()
    ));

-- ── Reviews ─────────────────────────────────────────────────────────────────
-- Reviews are publicly readable
CREATE POLICY "Reviews are publicly readable"
    ON reviews FOR SELECT
    USING (true);

-- Users can create reviews for their own orders
CREATE POLICY "Users create reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users update own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── Helper function: get current user role ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
    SELECT COALESCE(
        (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()),
        'anonymous'
    );
$$;

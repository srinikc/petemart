-- =============================================================================
-- PeteMart — Row Level Security Policies
-- Version: 002 (2026-05-30)
-- =============================================================================
-- Enables RLS on all tables and defines granular access policies.
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles — public read, self-edit, admin-full
CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Merchants — active public read, owner-edit, admin-full
CREATE POLICY "Active merchants are publicly readable" ON merchants FOR SELECT USING (status = 'active' OR auth.uid() = owner_id);
CREATE POLICY "Merchants can update own merchant" ON merchants FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Merchants can create own merchant" ON merchants FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins manage all merchants" ON merchants FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Products — public read, merchant-own write
CREATE POLICY "Products are publicly readable" ON products FOR SELECT USING (is_available = true OR auth.uid() IN (SELECT owner_id FROM merchants WHERE id = products.merchant_id));
CREATE POLICY "Merchants manage own products" ON products FOR INSERT WITH CHECK (auth.uid() IN (SELECT owner_id FROM merchants WHERE id = merchant_id));
CREATE POLICY "Merchants update own products" ON products FOR UPDATE USING (auth.uid() IN (SELECT owner_id FROM merchants WHERE id = merchant_id)) WITH CHECK (auth.uid() IN (SELECT owner_id FROM merchants WHERE id = merchant_id));
CREATE POLICY "Merchants delete own products" ON products FOR DELETE USING (auth.uid() IN (SELECT owner_id FROM merchants WHERE id = merchant_id));

-- Categories — public read, admin write
CREATE POLICY "Categories are publicly readable" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON categories FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Cart — user-own manage
CREATE POLICY "Users manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders — user-own, merchant-relevant, admin-all
CREATE POLICY "Users view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Merchants view relevant orders" ON orders FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE owner_id = auth.uid()));
CREATE POLICY "Users create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all orders" ON orders FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Order items — inherit visibility
CREATE POLICY "Users view own order items" ON order_items FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
CREATE POLICY "Merchants view own order items" ON order_items FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE owner_id = auth.uid()));

-- Reviews — public read, user-own write
CREATE POLICY "Reviews are publicly readable" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- PeteMart — Seed Data for Development & POC
-- =============================================================================
-- Seeds 8 pilot merchants in Balepet and Chickpet markets with sample
-- products, categories, and admin profile.
-- =============================================================================

-- ── Categories ──────────────────────────────────────────────────────────────
INSERT INTO categories (id, name, slug, description, sort_order) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Traditional Wear', 'traditional-wear', 'Silk sarees, kurtas, lehengas, and ethnic menswear', 1),
    ('c0000000-0000-0000-0000-000000000002', 'Textiles & Fabrics', 'textiles-fabrics', 'Pure silk, cotton, linen, and handloom fabrics', 2),
    ('c0000000-0000-0000-0000-000000000003', 'Food & Sweets', 'food-sweets', 'Traditional sweets, savories, and packaged snacks', 3),
    ('c0000000-0000-0000-0000-000000000004', 'Flowers & Garlands', 'flowers-garlands', 'Fresh flowers, wedding garlands, and floral decorations', 4),
    ('c0000000-0000-0000-0000-000000000005', 'Home & Decor', 'home-decor', 'Pooja items, home decor, and traditional artifacts', 5),
    ('c0000000-0000-0000-0000-000000000006', 'Bakery & Confectionery', 'bakery-confectionery', 'Cakes, pastries, cookies, and fresh bread', 6)
ON CONFLICT (slug) DO NOTHING;

-- ── Test Admin Profile (password-based, auth handled by Supabase) ───────────
-- NOTE: In local dev, create user via Supabase auth UI first, then run:
-- INSERT INTO profiles (id, email, role) VALUES ('<auth_user_id>', 'admin@petemart.com', 'admin');

-- ── Merchants (8 POC pilot merchants) ───────────────────────────────────────
-- These are placeholders; in production, owner_id must reference auth.users
INSERT INTO merchants (id, owner_id, business_name, business_type, description, status, digital_readiness, city, locality, delivery_radius_km, opening_time, closing_time)
VALUES
    ('m1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Tarun Enterprises', 'Textile Wholesale', 'Premium silk and cotton textile wholesaler in Chickpet', 'active', 'has_website', 'Bengaluru', 'Chickpet', 10, '09:00', '20:00'),
    ('m1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Sri Vari Traders', 'General Store', 'Traditional provisions, pooja items, and daily essentials', 'active', 'none', 'Bengaluru', 'Balepet', 5, '08:00', '21:00'),
    ('m1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Samskruti Silks (Main)', 'Silk Saree Showroom', 'Pure Kanchipuram, Mysore, and Banarasi silk sarees', 'active', 'has_instagram', 'Bengaluru', 'Chickpet', 8, '09:30', '21:00'),
    ('m1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'Samskruti Silks (Branch)', 'Silk Saree Showroom', 'Samskruti Silks branch — exclusive wedding collection', 'active', 'has_instagram', 'Bengaluru', 'Avenue Road', 8, '09:30', '21:00'),
    ('m1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'Flowers2U', 'Florist', 'Fresh flower arrangements, wedding garlands, and event decorations', 'active', 'has_website', 'Bengaluru', 'Mamulpet', 7, '06:00', '22:00'),
    ('m1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'Pastry Cafe', 'Bakery & Cafe', 'Artisanal cakes, fresh pastries, and gourmet coffee', 'active', 'has_instagram', 'Bengaluru', 'Cubbonpet', 5, '07:00', '22:00'),
    ('m1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'Sri Vinayaka Textorium', 'Textile & Tailoring', 'Custom tailoring, suit fabrics, and traditional menswear', 'active', 'none', 'Bengaluru', 'Tharagpet', 5, '09:00', '20:30'),
    ('m1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'Madhumathi All-Men Ethnic', 'Mens Ethnic Wear', 'Complete men''s ethnic wear: kurtas, sherwanis, dhotis, and accessories', 'active', 'has_instagram', 'Bengaluru', 'Raja Market', 6, '09:30', '21:00')
ON CONFLICT DO NOTHING;

-- ── Sanjana Apparels (not in merchant table yet, add separately)
INSERT INTO merchants (id, owner_id, business_name, business_type, description, status, digital_readiness, city, locality)
VALUES
    ('m1000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'Sanjana Apparels', 'Women''s Fashion', 'Trendy women''s wear, fusion wear, and accessories', 'active', 'none', 'Bengaluru', 'Chickpet')
ON CONFLICT DO NOTHING;

-- ── Sample Products ─────────────────────────────────────────────────────────
INSERT INTO products (merchant_id, category_id, name, slug, description, price, unit, stock_quantity, is_available, tags, preparation_time_minutes)
VALUES
    -- Tarun Enterprises (Textiles)
    ('m1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Mysore Silk Fabric (6 yards)', 'mysore-silk-fabric-6yards', 'Pure Mysore silk fabric with gold zari border, 6 yards', 4500.00, 'piece', 25, true, ARRAY['silk', 'mysore', 'zari', 'wedding'], NULL),
    ('m1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Cotton Linen Blend (per meter)', 'cotton-linen-blend-per-meter', 'Premium cotton-linen blend fabric, breathable and comfortable', 650.00, 'meter', 100, true, ARRAY['cotton', 'linen', 'summer'], NULL),

    -- Samskruti Silks Main
    ('m1000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Kanchipuram Silk Saree', 'kanchipuram-silk-saree', 'Pure Kanchipuram silk saree with traditional temple border', 12500.00, 'piece', 10, true, ARRAY['kanchipuram', 'silk', 'wedding', 'traditional'], NULL),
    ('m1000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Banarasi Georgette Saree', 'banarasi-georgette-saree', 'Lightweight Banarasi georgette saree with intricate floral pattern', 8500.00, 'piece', 15, true, ARRAY['banarasi', 'georgette', 'party-wear'], NULL),

    -- Flowers2U
    ('m1000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 'Traditional Rose Garland', 'traditional-rose-garland', 'Fresh red rose garland with jasmine accents, approx 3 feet', 350.00, 'piece', 50, true, ARRAY['rose', 'garland', 'wedding', 'fresh'], 15),
    ('m1000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 'Mixed Marigold Garland', 'mixed-marigold-garland', 'Fresh yellow and orange marigold garland for pooja and events', 150.00, 'piece', 100, true, ARRAY['marigold', 'garland', 'pooja', 'fresh'], 10),

    -- Pastry Cafe
    ('m1000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'Belgian Chocolate Cake (1 lb)', 'belgian-chocolate-cake-1lb', 'Rich Belgian chocolate cake with chocolate ganache layer', 850.00, 'piece', 5, true, ARRAY['chocolate', 'cake', 'birthday', 'eggless-option'], 30),
    ('m1000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'Mixed Fruit Pastry (Box of 6)', 'mixed-fruit-pastry-box-6', 'Assorted fresh fruit pastries with cream topping', 450.00, 'box', 20, true, ARRAY['fruit', 'pastry', 'cream', 'fresh'], 20),

    -- Sri Vinayaka Textorium
    ('m1000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'Premium Cotton Kurta Fabric (2.5m)', 'premium-cotton-kurta-fabric', 'High-quality cotton fabric for custom kurta tailoring, 2.5 meters', 1200.00, 'piece', 30, true, ARRAY['cotton', 'kurta', 'tailoring', 'mens'], NULL),

    -- Madhumathi All-Men Ethnic
    ('m1000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'Designer Silk Kurta with Churidar', 'designer-silk-kurta-churidar', 'Royal blue silk kurta with embroidered neckline, includes churidar', 3500.00, 'set', 10, true, ARRAY['silk', 'kurta', 'festival', 'wedding'], NULL),
    ('m1000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'Classic White Cotton Kurta', 'classic-white-cotton-kurta', 'Handloom white cotton kurta with minimal design, regular fit', 1800.00, 'piece', 20, true, ARRAY['cotton', 'kurta', 'casual', 'handloom'], NULL)
ON CONFLICT DO NOTHING;

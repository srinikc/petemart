-- =============================================================================
-- PeteMart Supplemental Products — Brings total to 273
-- Agent 07c: Backend Database Engineer
-- =============================================================================
-- Adds 3 extra products to reach exactly 273 total.
-- +1 to Pastry Cafe, +1 to Vinayaka Textorium, +1 to Madhumathi
-- =============================================================================

BEGIN;

-- +1 for Pastry Cafe (store 6) — now 31 products
INSERT INTO products (store_id, name, slug, sku, description, price, original_price, category, subcategory, unit, min_order_qty, stock, is_active, images, tags, mode_available) VALUES
('s0060000-0000-0000-0000-000000000006',
 'Bread - Garlic Cheese 400g', 'bread-garlic-cheese-400g', 'PC-BK-031',
 'Garlic cheese bread loaf 400g. Loaded with cheese and garlic butter.',
 4499, 5999, 'Bakery', 'Breads', 'loaf', 1, 35, TRUE,
 ARRAY['https://images.unsplash.com/photo-1555507036-ab1f4038024a'],
 ARRAY['bread','garlic','cheese','savory'], ARRAY['buy_now','whatsapp','visit_store']);

-- +1 for Sri Vinayaka Textorium (store 7) — now 31 products
INSERT INTO products (store_id, name, slug, sku, description, price, original_price, category, subcategory, unit, min_order_qty, stock, is_active, images, tags, mode_available) VALUES
('s0070000-0000-0000-0000-000000000007',
 'Cotton Silk Fabric - Kanchipuram Border 1M', 'cotton-silk-fabric-kanchipuram-border-1m', 'SVT-FB-031',
 'Cotton silk fabric with Kanchipuram style border 1 meter. Temple border design.',
 54900, 69900, 'Textiles', 'Fabrics', 'meter', 2, 80, TRUE,
 ARRAY['https://images.unsplash.com/photo-1583391733956-6c78276447ef'],
 ARRAY['cotton-silk','kanchipuram','border','fabric'], ARRAY['buy_now','whatsapp','visit_store']);

-- +1 for Madhumathi All-men''s Ethnic (store 9) — now 29 products
INSERT INTO products (store_id, name, slug, sku, description, price, original_price, category, subcategory, unit, min_order_qty, stock, is_active, images, tags, mode_available) VALUES
('s0090000-0000-0000-0000-000000000009',
 'Men''s Ethnic Sandals - Brown Leather', 'mens-ethnic-sandals-brown-leather', 'MA-ME-029',
 'Brown leather ethnic sandals for men. Handcrafted, cushioned sole, traditional design.',
 79900, 99900, 'Men''s Ethnic Wear', 'Footwear', 'pair', 1, 25, TRUE,
 ARRAY['https://images.unsplash.com/photo-1583391733956-6c78276447ef'],
 ARRAY['sandals','leather','brown','ethnic','men'], ARRAY['buy_now','whatsapp','visit_store']);

COMMIT;

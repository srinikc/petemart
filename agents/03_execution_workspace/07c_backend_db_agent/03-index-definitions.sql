-- =============================================================================
-- PeteMart Index Definitions — Performance Tuning Guide
-- Agent 07c: Backend Database Engineer
-- =============================================================================
-- All indexes are already created in 01-complete-schema.sql.
-- This file documents the indexing strategy for performance review.
-- =============================================================================

-- =============================================================================
-- INDEXING STRATEGY
-- =============================================================================
-- 1. Foreign Key indexes on all FK columns (JOIN performance)
-- 2. Selective/partial indexes on status columns (filtered queries)
-- 3. Composite indexes for common query patterns
-- 4. GIN indexes on array/jsonb columns
-- 5. Descending indexes on time-series columns (latest-first queries)
-- 6. Unique indexes for business constraints
-- =============================================================================

-- =============================================================================
-- TABLE: profiles
-- =============================================================================
-- Expected query patterns:
--   - Lookup by ID (PK, indexed by default)
--   - Filter by role (admin panel)
--   - Lookup by email (login/auth flows)

CREATE INDEX idx_profiles_role ON profiles(role) WHERE is_active = TRUE;
CREATE INDEX idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;

-- =============================================================================
-- TABLE: stores
-- =============================================================================
-- Expected query patterns:
--   - List stores by market (homepage browsing)
--   - List stores by category (filtering)
--   - Find store by slug (URL routing)
--   - Find stores by owner (merchant dashboard)
--   - Find active stores only (customer browsing)

CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_market ON stores(market);
CREATE INDEX idx_stores_category ON stores(category);
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_status ON stores(status) WHERE status = 'active';

-- =============================================================================
-- TABLE: products
-- =============================================================================
-- Expected query patterns:
--   - List products by store (storefront page)
--   - List products by category (category browsing)
--   - List products by subcategory (drill-down)
--   - Search products (full text — search handled by pg_trgm or external)
--   - Filter by price range (sorting/filtering)
--   - Filter by active status (inventory management)
--   - Products with tags (featured/organic/etc.)
--   - Recent products (new arrivals)

CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_subcategory ON products(subcategory);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_store_active ON products(store_id, is_active);
CREATE INDEX idx_products_category_active ON products(category, is_active);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_created ON products(created_at DESC);

-- =============================================================================
-- TABLE: orders
-- =============================================================================
-- Expected query patterns:
--   - List orders by customer (order history)
--   - List orders by status (fulfillment pipeline)
--   - List orders by date (reporting)
--   - Find by consolidation_id (multi-merchant orders)
--   - Find by order_number (customer service lookup)
--   - Filter by payment_status (reconciliation)

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX idx_orders_consolidation ON orders(consolidation_id) WHERE consolidation_id IS NOT NULL;
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE UNIQUE INDEX idx_orders_order_number ON orders(order_number);

-- =============================================================================
-- TABLE: order_items
-- =============================================================================
-- Expected query patterns:
--   - List items for an order (order detail page)
--   - Find items by product (inventory reporting)
--   - Find items by store (merchant dashboard)
--   - Filter by merchant_status (fulfillment tracking)

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_store ON order_items(store_id);
CREATE INDEX idx_order_items_merchant_status ON order_items(merchant_status);
CREATE INDEX idx_order_items_order_store ON order_items(order_id, store_id);

-- =============================================================================
-- TABLE: delivery_tracking
-- =============================================================================
-- Expected query patterns:
--   - Find tracking by order (customer tracking page)
--   - Find tracking by status (operations dashboard)
--   - Find pending deliveries (dispatch planning)

CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX idx_delivery_tracking_status ON delivery_tracking(status);
CREATE INDEX idx_delivery_tracking_estimated ON delivery_tracking(estimated_delivery_at)
    WHERE estimated_delivery_at IS NOT NULL;

-- =============================================================================
-- TABLE: reviews
-- =============================================================================
-- Expected query patterns:
--   - List reviews for a product (product page)
--   - List reviews by a customer (profile page)
--   - Filter by rating (sorting)
--   - Recent reviews (homepage social proof)

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_product_rating ON reviews(product_id, rating);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

-- =============================================================================
-- PERFORMANCE NOTES
-- =============================================================================
-- Total indexes: ~35
-- Estimated overhead: ~15-25% of table size (acceptable for read-heavy workloads)
--
-- Index maintenance considerations:
--   - PostgreSQL automatically maintains indexes during write operations
--   - For bulk inserts, consider dropping non-critical indexes first:
--     DROP INDEX IF EXISTS idx_products_tags;  -- GIN indexes are expensive to maintain
--   - Rebuild after bulk operations:
--     REINDEX TABLE products;
--
-- Query optimization tips:
--   - Use EXPLAIN ANALYZE to verify index usage:
--     EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = '<uuid>';
--   - For full-text search on products, consider adding:
--     CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
--   - For geo-spatial queries on stores, consider PostGIS extension

-- =============================================================================
-- END OF INDEX REFERENCE
-- =============================================================================

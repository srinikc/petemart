# PeteMart — Full Product Architecture Blueprint

**Document Version:** 1.0  
**Author:** Architect Agent (Senior Enterprise Solution Architect)  
**Status:** Final  
**Date:** 2026-06-15  
**Derived From:** PRD v2.0, Business Revenue Model v1.4, prd_config.json

---

## Table of Contents

1. [Architecture Overview & Philosophy](#1-architecture-overview--philosophy)
2. [System Context (C4 Level 1)](#2-system-context-c4-level-1)
3. [Container Architecture (C4 Level 2)](#3-container-architecture-c4-level-2)
4. [Component Architecture (C4 Level 3)](#4-component-architecture-c4-level-3)
5. [Technology Stack](#5-technology-stack)
6. [API Strategy & Contract Catalog](#6-api-strategy--contract-catalog)
7. [Data Architecture](#7-data-architecture)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Security Framework](#9-security-framework)
10. [Scaling Strategy (5,000+ Merchants, Multi-City)](#10-scaling-strategy)
11. [Integration Architecture](#11-integration-architecture)
12. [Testing Architecture](#12-testing-architecture)
13. [Cost Model — Full Production](#13-cost-model--full-production)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Architecture Overview & Philosophy

### Guiding Principles
1. **API-First Design** — All capabilities exposed via RESTful/gRPC APIs before UI
2. **Event-Driven Core** — Asynchronous message-driven architecture for order processing, notifications, analytics
3. **Cloud-Native** — Containerized microservices on Kubernetes, auto-scaling, multi-region readiness
4. **Offline-First Mobile** — React Native apps with local-first data sync for delivery partners
5. **Security by Design** — Zero-trust network policy, encrypted at rest/transit, PCI-DSS compliant payment
6. **Cost-Aware Scaling** — Tiered infrastructure matching growth phases (8 → 500 → 5,000+ merchants)

### Architecture Style: **Modular Monolith → Event-Driven Microservices**

```
Phase 1 (8 merchants): Modular monolith on Vercel + Supabase
Phase 2 (500 merchants): Microservices with message queue
Phase 3 (5,000+ merchants): Full event-driven microservices + Kubernetes
```

### Key Architectural Decisions (ADRs)

| ADR ID | Decision | Rationale |
|--------|----------|-----------|
| ADR-001 | Next.js 14 App Router for web | SSR/SSG hybrid for SEO, React Server Components for perf |
| ADR-002 | React Native for mobile (iOS/Android) | Code sharing, Expo managed workflow, hot reload |
| ADR-003 | Supabase (PostgreSQL) as primary DB | Real-time subscriptions, Row Level Security, PostGIS for geo |
| ADR-004 | RabbitMQ / Redis for message queue | Lightweight, proven, cost-effective at Phase 1-2 |
| ADR-005 | Razorpay as sole payment gateway | Indian market leader, UPI/card/net banking, escrow support |
| ADR-006 | AWS EKS (Kubernetes) for Phase 3 | Multi-region, auto-scaling, service mesh (Istio) |
| ADR-007 | Cloudflare CDN + WAF | Edge caching, DDoS protection, SSL termination |
| ADR-008 | Bullion rates via IBJA/IndiaBulls API | Real-time gold/silver rates for jewellery |
| ADR-009 | Jitsi as embedded video call | Open-source WebRTC, self-hosted, no per-minute cost |
| ADR-010 | ShipRocket for national shipping | Pan-India logistics integration, 18,000+ pin codes |

---

## 2. System Context (C4 Level 1)

```mermaid
C4Context
  title System Context diagram for PeteMart

  Person(customer, "Priya (Customer)", "Browses products, places orders, tracks delivery")
  Person(merchant, "Ramesh (Merchant)", "Manages store, products, views analytics")
  Person(courier, "Vinay (Courier)", "Receives pickup/delivery assignments")
  Person(admin, "Ananya (Admin)", "Manages platform, onboarding, moderation")
  Person(b2bbuyer, "Deepa (B2B Buyer)", "Bulk orders, wholesale negotiation")

  System(petemart, "PeteMart Platform", "Hyperlocal commerce marketplace")

  System_Ext(razorpay, "Razorpay", "Payment Gateway, Escrow")
  System_Ext(whatsapp, "WhatsApp Business API", "Messaging, Enquiries")
  System_Ext(googlemaps, "Google Maps API", "Geo, Directions, Places")
  System_Ext(shiprocket, "ShipRocket", "National Shipping")
  System_Ext(jitsi, "Jitsi (Self-hosted)", "Video Calls")
  System_Ext(bullion, "IBJA/IndiaBulls", "Live Bullion Rates")
  System_Ext(cloudflare, "Cloudflare", "CDN, WAF, DNS")
  System_Ext(supabase, "Supabase", "PostgreSQL, Auth, Storage")
  System_Ext(openai, "OpenAI API", "AI Try-On, Recommendation")
  System_Ext(redis, "Redis / RabbitMQ", "Caching, Message Queue")
  System_Ext(sentry, "Sentry", "Error Monitoring")
  System_Ext(amplitude, "Amplitude / Mixpanel", "Analytics")

  Rel(customer, petemart, "Uses Web/Mobile App")
  Rel(merchant, petemart, "Uses Merchant Dashboard")
  Rel(courier, petemart, "Uses Courier App")
  Rel(admin, petemart, "Uses Admin Console")
  Rel(b2bbuyer, petemart, "Uses Web/Mobile + WhatsApp")

  Rel(petemart, razorpay, "Process payments")
  Rel(petemart, whatsapp, "Send notifications, deep links")
  Rel(petemart, googlemaps, "Geo-coding, navigation")
  Rel(petemart, shiprocket, "National shipping labels")
  Rel(petemart, jitsi, "Video call rooms")
  Rel(petemart, bullion, "Fetch live rates")
  Rel(petemart, cloudflare, "CDN, edge caching")
  Rel(petemart, supabase, "Database, auth, file storage")
  Rel(petemart, openai, "AI image processing")
  Rel(petemart, redis, "Cache, job queue")
  Rel(petemart, sentry, "Error tracking")
  Rel(petemart, amplitude, "User analytics")
```

---

## 3. Container Architecture (C4 Level 2)

```mermaid
C4Container
  title Container diagram for PeteMart Platform

  Person(customer, "Customer", "Priya")
  Person(merchant, "Merchant", "Ramesh")
  Person(courier, "Courier", "Vinay")
  Person(admin, "Admin", "Ananya")

  System_Boundary(petemart_platform, "PeteMart Platform") {
    Container(web_app, "Web Application", "Next.js 14, React, Tailwind", "Responsive web app for customers, merchants, admin")
    Container(mobile_app, "Mobile Application", "React Native (Expo)", "iOS/Android apps for customers & couriers")
    Container(api_gateway, "API Gateway", "Kong / AWS API Gateway", "Rate limiting, auth, routing, request validation")
    
    Container_Boundary(microservices, "Microservices (Node.js/Go)") {
      Container(auth_svc, "Auth Service", "Node.js + Supabase Auth", "OTP, JWT, SSO, RBAC")
      Container(catalog_svc, "Catalog Service", "Node.js", "Products, categories, search, inventory")
      Container(order_svc, "Order Service", "Go", "Cart, checkout, order lifecycle, multi-store")
      Container(payment_svc, "Payment Service", "Node.js + Razorpay", "Payments, refunds, escrow, settlements")
      Container(delivery_svc, "Delivery Service", "Go", "Zone calc, routing, courier assignment, tracking")
      Container(merchant_svc, "Merchant Service", "Node.js", "Onboarding, subscriptions, microsites, analytics")
      Container(admin_svc, "Admin Service", "Node.js", "Config, moderation, reports, feature flags")
      Container(notification_svc, "Notification Service", "Node.js", "Push, email, SMS, WhatsApp notifications")
      Container(ai_svc, "AI Service", "Python (FastAPI)", "Virtual try-on, recommendations, image processing")
      Container(analytics_svc, "Analytics Service", "Python + ClickHouse", "Real-time metrics, merchant dashboards, reports")
    }
    
    Container(message_queue, "Message Queue", "RabbitMQ / Redis", "Async job processing, event bus")
    Container(cache, "Cache Layer", "Redis Cluster", "Session cache, rate limiter, API cache")
    Container(database, "Primary Database", "Supabase PostgreSQL", "Transactional data, PostGIS for geo")
    Container(dwh, "Data Warehouse", "ClickHouse / BigQuery", "Analytics, reporting, OLAP")
    Container(object_store, "Object Store", "Supabase Storage / S3", "Product images, try-on results, videos")
    Container(search, "Search Engine", "MeiliSearch / Typesense", "Full-text search, faceted filters")
  }

  System_Ext(razorpay, "Razorpay", "Payment Gateway")
  System_Ext(whatsapp, "WhatsApp API", "Messaging")
  System_Ext(googlemaps, "Google Maps", "Geo services")
  System_Ext(shiprocket, "ShipRocket", "National shipping")
  System_Ext(jitsi, "Jitsi Server", "Video calls")
  System_Ext(bullion_api, "IBJA API", "Bullion rates")
  System_Ext(openai_api, "OpenAI / SD", "AI image gen")
  System_Ext(cloudflare, "Cloudflare", "CDN + WAF")
  System_Ext(sentry, "Sentry", "Error monitoring")

  Rel(customer, web_app, "Uses", "HTTPS")
  Rel(customer, mobile_app, "Uses", "HTTPS")
  Rel(merchant, web_app, "Uses", "HTTPS")
  Rel(courier, mobile_app, "Uses", "HTTPS")
  Rel(admin, web_app, "Uses", "HTTPS")

  Rel(web_app, api_gateway, "API calls", "REST/GraphQL")
  Rel(mobile_app, api_gateway, "API calls", "REST/GraphQL")
  Rel(api_gateway, auth_svc, "Auth routes", "gRPC/REST")
  Rel(api_gateway, catalog_svc, "Catalog routes", "gRPC/REST")
  Rel(api_gateway, order_svc, "Order routes", "gRPC/REST")
  Rel(api_gateway, payment_svc, "Payment routes", "gRPC/REST")
  Rel(api_gateway, delivery_svc, "Delivery routes", "gRPC/REST")
  Rel(api_gateway, merchant_svc, "Merchant routes", "gRPC/REST")
  Rel(api_gateway, admin_svc, "Admin routes", "gRPC/REST")
  Rel(api_gateway, notification_svc, "Notification routes", "gRPC/REST")
  Rel(api_gateway, ai_svc, "AI routes", "REST")
  Rel(api_gateway, analytics_svc, "Analytics routes", "REST")

  Rel(catalog_svc, database, "Read/Write")
  Rel(order_svc, database, "Read/Write")
  Rel(payment_svc, database, "Read/Write")
  Rel(delivery_svc, database, "Read/Write")
  Rel(merchant_svc, database, "Read/Write")
  Rel(admin_svc, database, "Read/Write")
  
  Rel(catalog_svc, search, "Index/Search")
  Rel(order_svc, message_queue, "Publish events")
  Rel(payment_svc, message_queue, "Publish events")
  Rel(delivery_svc, message_queue, "Publish events")
  Rel(notification_svc, message_queue, "Consume events")
  Rel(analytics_svc, message_queue, "Consume events")
  Rel(catalog_svc, cache, "Cache products")
  Rel(order_svc, cache, "Cache cart")
  
  Rel(payment_svc, razorpay, "Payment API")
  Rel(notification_svc, whatsapp, "WhatsApp API")
  Rel(delivery_svc, googlemaps, "Maps API")
  Rel(delivery_svc, shiprocket, "Shipping API")
  Rel(ai_svc, openai_api, "Image API")
  Rel(catalog_svc, bullion_api, "Rate fetch")
  Rel(web_app, jitsi, "Video call")
  Rel(mobile_app, jitsi, "Video call")
```

---

## 4. Component Architecture (C4 Level 3)

### 4.1 Catalog Service Components

```mermaid
C4Component
  title Component diagram for Catalog Service

  Container_Boundary(catalog, "Catalog Service") {
    Component(api, "REST API Layer", "Express.js", "CRUD endpoints for products, categories, merchants")
    Component(search_engine, "Search Engine", "MeiliSearch", "Full-text search with faceted filters")
    Component(geo_index, "Geo Index", "PostGIS + Redis Geo", "Spatial queries for nearby merchants")
    Component(cache_mgr, "Cache Manager", "Redis", "Product cache, rate cache, category tree")
    Component(bullion_fetcher, "Bullion Rate Fetcher", "Cron Job", "Fetch IBJA rates every 5 min")
    Component(inventory_mgr, "Inventory Manager", "Node.js", "Stock tracking, MOQ enforcement")
    Component(image_proc, "Image Processor", "Sharp + Cloudinary", "Thumbnail generation, optimization")
    Component(event_pub, "Event Publisher", "RabbitMQ", "Publish product.created, price.changed")
  }
```

### 4.2 Order Service Components

```mermaid
C4Component
  title Component diagram for Order Service

  Container_Boundary(order, "Order Service") {
    Component(cart_mgr, "Cart Manager", "Go", "Multi-merchant cart, pricing, consolidation fee calc")
    Component(checkout_flow, "Checkout Engine", "Go", "Address validation, delivery zone, slot selection")
    Component(order_lifecycle, "Order Lifecycle", "Go", "Order state machine: created → confirmed → picked → delivered")
    Component(pricing_engine, "Pricing Engine", "Go", "B2B/B2C pricing, commission calc, tiered rates")
    Component(splitter, "Order Splitter", "Go", "Split consolidated order into merchant sub-orders")
    Component(dispute_mgr, "Dispute Manager", "Go", "Returns, refunds, resolution workflows")
    Component(event_pub, "Event Publisher", "RabbitMQ", "Publish order.created, order.delivered, payment.failed")
  }
```

### 4.3 Delivery Service Components

```mermaid
C4Component
  title Component diagram for Delivery Service

  Container_Boundary(delivery, "Delivery Service") {
    Component(zone_mgr, "Zone Manager", "Go", "Zone-based delivery fee calculation")
    Component(route_opt, "Route Optimizer", "Go + OR-Tools", "Multi-stop pickup route optimization")
    Component(courier_mgr, "Courier Manager", "Go", "Courier assignment, availability, ratings")
    Component(tracking_svc, "Tracking Service", "Go + WebSocket", "Real-time GPS tracking, ETA")
    Component(shiprocket_int, "ShipRocket Integration", "Node.js", "National shipping label generation, tracking")
    Component(microhub_mgr, "Micro-Hub Manager", "Go", "Consolidation hub assignment, handoff tracking")
    Component(event_consumer, "Event Consumer", "RabbitMQ", "Consume order.created for dispatch triggering")
  }
```

---

## 5. Technology Stack

### 5.1 Frontend Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Web Framework | Next.js | 14.x | React Server Components, SSR, App Router |
| UI Library | React | 18.x | Component architecture |
| Styling | Tailwind CSS | 3.x | Utility-first styling |
| Component Library | shadcn/ui + Radix | Latest | Accessible, composable UI primitives |
| State Management | Zustand + TanStack Query | Latest | Client state + server state |
| Form Handling | React Hook Form + Zod | Latest | Form validation |
| Mobile Framework | React Native (Expo) | 50.x | iOS/Android native apps |
| PWA | Next.js PWA | Latest | Installable web app |

### 5.2 Backend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Primary API | Node.js (Express/Fastify) | Business logic microservices |
| High-Performance Services | Go (Gin/Fiber) | Order, delivery, payment services |
| AI Services | Python (FastAPI) | Virtual try-on, recommendations |
| API Gateway | Kong / AWS API Gateway | Rate limiting, auth, routing |
| GraphQL Layer | Apollo GraphQL (optional) | Aggregated data fetching |

### 5.3 Data Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary Database | Supabase PostgreSQL | Transactions, auth, real-time |
| Data Warehouse | ClickHouse (self-hosted/cloud) | Analytics, merchant reports |
| Cache | Redis Cluster | Session, rate limiting, product cache |
| Search | MeiliSearch / Typesense | Full-text search, faceted filters |
| Message Queue | RabbitMQ | Async event processing |
| Object Storage | Supabase Storage / AWS S3 | Images, videos |
| CDN | Cloudflare | Edge caching, image optimization |

### 5.4 DevOps & Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Container Orchestration | AWS EKS (Kubernetes) | Microservice deployment |
| CI/CD | GitHub Actions | Build, test, deploy pipeline |
| IaC | Terraform | Infrastructure as Code |
| Monitoring | Sentry + Grafana + Prometheus | Error tracking, metrics |
| Logging | ELK Stack / Grafana Loki | Centralized logging |
| DNS + Security | Cloudflare | CDN, WAF, DDoS protection |
| Secrets Management | AWS Secrets Manager / Doppler | API keys, credentials |

---

## 6. API Strategy & Contract Catalog

### 6.1 API Design Principles

- **RESTful** for CRUD operations (`/api/v1/products`, `/api/v1/orders`)
- **GraphQL** for complex aggregations (merchant dashboard, admin reports)
- **WebSocket** for real-time tracking (delivery GPS, order status)
- **gRPC** for inter-service communication (high-performance internal APIs)
- **OpenAPI 3.0** for contract-first API documentation
- **Rate Limiting**: 100 req/min per user, 1000 req/min per merchant, 5000 req/min per admin

### 6.2 API Endpoint Catalog

#### Customer-Facing APIs

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/v1/auth/otp` | POST | Send login OTP | None |
| `/api/v1/auth/verify` | POST | Verify OTP, get JWT | None |
| `/api/v1/categories` | GET | List product categories | Optional |
| `/api/v1/markets` | GET | List Pete markets | Optional |
| `/api/v1/merchants` | GET | List/search merchants | Optional |
| `/api/v1/merchants/:id` | GET | Merchant detail + products | Optional |
| `/api/v1/merchants/:id/microsite` | GET | Merchant microsite data | Optional |
| `/api/v1/products` | GET | Search/filter products | Optional |
| `/api/v1/products/:id` | GET | Product detail | Optional |
| `/api/v1/products/:id/tryon` | POST | Process virtual try-on | Required |
| `/api/v1/bullion/rates` | GET | Live gold/silver rates | Optional |
| `/api/v1/cart` | GET/POST/PUT/DELETE | Cart operations | Required |
| `/api/v1/checkout` | POST | Initiate checkout | Required |
| `/api/v1/orders` | GET/POST | List/create orders | Required |
| `/api/v1/orders/:id` | GET | Order detail + tracking | Required |
| `/api/v1/orders/:id/payment` | POST | Process payment | Required |
| `/api/v1/delivery/zones` | GET | Check delivery eligibility | Optional |
| `/api/v1/reviews` | GET/POST | Product/merchant reviews | Required |
| `/api/v1/coupons/validate` | POST | Validate promo code | Required |
| `/api/v1/referrals` | POST | Create referral | Required |

#### Merchant-Facing APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/merchant/products` | CRUD | Product management |
| `/api/v1/merchant/orders` | GET | Incoming orders |
| `/api/v1/merchant/orders/:id/status` | PATCH | Update order status |
| `/api/v1/merchant/analytics` | GET | Sales & performance metrics |
| `/api/v1/merchant/subscription` | GET/PUT | Plan management |
| `/api/v1/merchant/payouts` | GET | Settlement history |
| `/api/v1/merchant/modes` | GET/PUT | Interaction mode configuration |

#### Admin-Facing APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/merchants` | CRUD | Merchant management |
| `/api/v1/admin/merchants/:id/approve` | POST | Approve store |
| `/api/v1/admin/analytics` | GET | Platform-wide analytics |
| `/api/v1/admin/feature-flags` | CRUD | Feature toggle management |
| `/api/v1/admin/config` | GET/PUT | Dynamic platform config |
| `/api/v1/admin/reviews/moderation` | GET/PUT | Review moderation queue |
| `/api/v1/admin/white-label` | PUT | White-label theming |

#### Courier-Facing APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/courier/orders` | GET | Assigned pickups/deliveries |
| `/api/v1/courier/orders/:id/status` | PATCH | Update delivery status |
| `/api/v1/courier/orders/:id/location` | PUT | Update GPS location |
| `/api/v1/courier/payouts` | GET | Earnings & settlement |

### 6.3 Webhook Catalog

| Event | Trigger | Destination | Format |
|-------|---------|-------------|--------|
| `order.placed` | Order created | Merchant dashboard (real-time) | JSON |
| `order.picked_up` | Courier picked up | Customer notification | JSON |
| `order.delivered` | Delivery confirmed | Merchant + Customer | JSON |
| `payment.received` | Payment confirmed | Merchant settlement | JSON |
| `payment.failed` | Payment declined | Customer notification | JSON |
| `merchant.approved` | Admin approved store | Merchant welcome email | JSON |
| `subscription.renewed` | Auto-renewal | Merchant invoice | JSON |
| `review.submitted` | Customer review | Admin moderation queue | JSON |

---

## 7. Data Architecture

### 7.1 Entity Relationship Diagram (Core)

```mermaid
erDiagram
    MERCHANT ||--o{ PRODUCT : has
    MERCHANT ||--o{ ORDER : receives
    MERCHANT ||--|| SUBSCRIPTION : subscribed
    MERCHANT ||--o{ PAYOUT : gets
    MERCHANT {
        uuid id PK
        string store_name
        string market_area
        jsonb location
        string[] active_modes
        string subscription_tier
        boolean is_approved
        timestamp created_at
    }
    
    PRODUCT ||--o{ ORDER_ITEM : contains
    PRODUCT ||--o{ PRODUCT_IMAGE : has
    PRODUCT ||--o{ REVIEW : receives
    PRODUCT {
        uuid id PK
        uuid merchant_id FK
        string name
        string description
        decimal price
        string mode_type
        string category
        jsonb attributes
        int stock
        int moq
        jsonb variants
        boolean is_active
    }
    
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER ||--o{ CART : has
    CUSTOMER ||--o{ REVIEW : writes
    CUSTOMER {
        uuid id PK
        string phone
        string email
        jsonb saved_addresses
        string preferred_language
        decimal loyalty_points
        timestamp created_at
    }
    
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--|| PAYMENT : has
    ORDER ||--|| DELIVERY : has
    ORDER {
        uuid id PK
        uuid customer_id FK
        string order_type
        string status
        decimal total_amount
        decimal commission
        decimal delivery_fee
        decimal consolidation_fee
        jsonb merchant_breakdown
        timestamp created_at
    }
    
    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        uuid merchant_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }
    
    PAYMENT {
        uuid id PK
        uuid order_id FK
        string razorpay_order_id
        string razorpay_payment_id
        decimal amount
        string status
        string method
        jsonb gateway_response
    }
    
    DELIVERY {
        uuid id PK
        uuid order_id FK
        uuid courier_id FK
        string zone
        string status
        jsonb tracking_path
        decimal distance_km
        timestamp estimated_delivery
        timestamp actual_delivery
    }
    
    SUBSCRIPTION {
        uuid id PK
        uuid merchant_id FK
        string plan
        string status
        decimal amount
        date start_date
        date next_billing_date
    }
    
    PAYOUT {
        uuid id PK
        uuid merchant_id FK
        uuid payment_id FK
        decimal amount
        decimal commission_deducted
        string status
        timestamp scheduled_date
    }
    
    REVIEW {
        uuid id PK
        uuid product_id FK
        uuid customer_id FK
        int rating
        string comment
        jsonb images
        string moderation_status
        timestamp created_at
    }
    
    CART {
        uuid id PK
        uuid customer_id FK
        jsonb items
        jsonb delivery_estimate
        timestamp expires_at
    }
```

### 7.2 Database Schema — Supabase PostgreSQL

**Estimated Database Size at Scale (5,000 merchants):**
- Merchants: 5,000 rows (~10 MB)
- Products: 500,000 rows (100 avg per merchant) (~500 MB)
- Customers: 100,000 rows (~100 MB)
- Orders: 5M rows (1,000 avg per merchant/year) (~5 GB)
- Order Items: 15M rows (~10 GB)
- Payments: 5M rows (~5 GB)
- Reviews: 250,000 rows (~250 MB)
- Sessions/Cache: ~1 GB (Redis)

**Total Estimated Storage: ~22 GB + media assets (S3: ~500 GB)**

### 7.3 Data Flow — Order Processing

```mermaid
sequenceDiagram
    participant Customer
    participant WebApp as Web/Mobile App
    participant Gateway as API Gateway
    participant OrderSvc as Order Service
    participant PaymentSvc as Payment Service
    participant DeliverySvc as Delivery Service
    participant MerchantSvc as Merchant Service
    participant MQ as RabbitMQ
    participant DB as PostgreSQL
    participant Razorpay

    Customer->>WebApp: Add items to cart (multi-merchant)
    WebApp->>Gateway: POST /api/v1/cart/items
    Gateway->>OrderSvc: Forward request
    OrderSvc->>DB: Save cart items
    OrderSvc-->>WebApp: Cart updated

    Customer->>WebApp: Proceed to checkout
    WebApp->>Gateway: POST /api/v1/checkout
    Gateway->>OrderSvc: Forward request
    OrderSvc->>OrderSvc: Calculate delivery fee (zone-based)
    OrderSvc->>OrderSvc: Apply consolidation surcharge
    OrderSvc->>OrderSvc: Calculate commission (B2B/B2C)
    OrderSvc-->>WebApp: Order summary with pricing

    Customer->>WebApp: Confirm & pay
    WebApp->>Gateway: POST /api/v1/orders/:id/payment
    Gateway->>OrderSvc: Forward
    OrderSvc->>PaymentSvc: Initiate payment
    PaymentSvc->>Razorpay: Create order
    Razorpay-->>WebApp: Payment widget (redirect)
    Customer->>Razorpay: Complete payment
    Razorpay->>PaymentSvc: Webhook (payment.captured)
    PaymentSvc->>MQ: Publish payment.received
    PaymentSvc->>DB: Update payment status

    OrderSvc->>MQ: Consume payment.received
    OrderSvc->>OrderSvc: Split order by merchant
    OrderSvc->>DB: Update order status to confirmed
    OrderSvc->>MQ: Publish order.placed

    DeliverySvc->>MQ: Consume order.placed
    DeliverySvc->>DeliverySvc: Assign zone & courier
    DeliverySvc->>DeliverySvc: Optimize pickup route
    DeliverySvc->>DB: Create delivery record
    DeliverySvc->>MQ: Publish courier.assigned

    MerchantSvc->>MQ: Consume order.placed
    MerchantSvc-->>Merchant: Push notification (new order)

    Note over Customer,WebApp: Real-time tracking via WebSocket
    DeliverySvc-->>WebApp: Courier GPS coordinates (WebSocket)
```

---

## 8. Infrastructure & Deployment

### 8.1 Deployment Architecture (Phase 3 — Production at Scale)

```mermaid
C4Deployment
  title Deployment diagram for PeteMart Production

  Deployment_Node(cdn, "Cloudflare CDN", "Global Edge") {
    Container(static_assets, "Static Assets", "Next.js SSG, Images, Videos")
    Container(waf, "WAF", "Web Application Firewall")
  }

  Deployment_Node(dns, "Cloudflare DNS", "Global") {
    Container(dns_record, "petemart.in", "DNS Management")
  }

  Deployment_Node(aws, "AWS Cloud (ap-south-1)", "Mumbai Region") {
    Deployment_Node(vpc, "VPC", "10.0.0.0/16") {
      Deployment_Node(eks, "EKS Cluster", "Kubernetes 1.28") {
        Container(api_gw, "API Gateway", "Kong Ingress")
        Container(auth_pod, "Auth Service", "2-4 pods, 1 CPU each")
        Container(catalog_pod, "Catalog Service", "4-8 pods, 2 CPU each")
        Container(order_pod, "Order Service", "4-8 pods, 2 CPU each")
        Container(payment_pod, "Payment Service", "2-4 pods, 1 CPU each")
        Container(delivery_pod, "Delivery Service", "2-4 pods, 2 CPU each")
        Container(merchant_pod, "Merchant Service", "2-4 pods, 1 CPU each")
        Container(admin_pod, "Admin Service", "1-2 pods, 1 CPU each")
        Container(notification_pod, "Notification Service", "2-4 pods, 1 CPU each")
        Container(ai_pod, "AI Service", "2-4 pods, 4 GPU each")
        Container(analytics_pod, "Analytics Service", "2-4 pods, 2 CPU each")
      }

      Deployment_Node(data_layer, "Data Layer") {
        Container(postgres, "PostgreSQL", "Supabase / RDS: db.r6g.xlarge")
        Container(redis, "Redis Cluster", "ElastiCache: cache.r6g.large x3")
        Container(rabbitmq, "RabbitMQ", "Amazon MQ: mq.m5.large x2")
        Container(clickhouse, "ClickHouse", "Self-hosted: 2 x c5.2xlarge")
        Container(meilisearch, "MeiliSearch", "Self-hosted: 1 x c5.xlarge")
      }

      Deployment_Node(storage, "Object Storage") {
        Container(s3_bucket, "S3 Buckets", "Product images, try-on results")
        Container(supabase_storage, "Supabase Storage", "User uploads, temp files")
      }
    }
  }

  Deployment_Node(external, "External Services") {
    Container(razorpay_sys, "Razorpay", "Payment processing")
    Container(whatsapp_sys, "WhatsApp API", "Meta Cloud API")
    Container(shiprocket_sys, "ShipRocket", "National shipping")
    Container(jitsi_sys, "Jitsi Meet", "Self-hosted on AWS EC2")
    Container(openai_sys, "OpenAI API", "AI image processing")
  }

  Rel(static_assets, api_gw, "API calls")
  Rel(waf, api_gw, "Filtered traffic")
  Rel(api_gw, auth_pod, "Route")
  Rel(api_gw, catalog_pod, "Route")
  Rel(api_gw, order_pod, "Route")
  Rel(api_gw, payment_pod, "Route")
  Rel(api_gw, delivery_pod, "Route")
  Rel(catalog_pod, postgres, "Read/Write")
  Rel(catalog_pod, redis, "Cache")
  Rel(catalog_pod, meilisearch, "Search index")
  Rel(order_pod, postgres, "Read/Write")
  Rel(order_pod, rabbitmq, "Publish events")
  Rel(delivery_pod, rabbitmq, "Consume/publish")
  Rel(payment_pod, razorpay_sys, "Payment API")
  Rel(notification_pod, whatsapp_sys, "WhatsApp API")
  Rel(delivery_pod, shiprocket_sys, "Shipping API")
  Rel(ai_pod, openai_sys, "AI API calls")
```

### 8.2 Scaling Strategy

| Phase | Merchants | Infrastructure | Monthly Cost (INR) |
|-------|-----------|----------------|-------------------|
| Phase 0 (POC) | 8 | Supabase Free + Vercel Hobby + Railway | ₹0 |
| Phase 1 (Launch) | 100 | Supabase Pro + Vercel Pro + Railway Pro | ₹15,000 |
| Phase 2 (Growth) | 500 | AWS EKS (small) + RDS + ElastiCache | ₹1,20,000 |
| Phase 3 (Scale) | 2,000 | AWS EKS (med) + RDS Multi-AZ + Redis Cluster | ₹4,50,000 |
| Phase 4 (Vision) | 5,000+ | AWS EKS (large) + Multi-region + Auto-scale | ₹12,00,000 |

### 8.3 Multi-City Expansion Strategy

```mermaid
graph LR
    A[Bangalore Pete Markets] --> B[Phase 1: Mysore]
    A --> C[Phase 1: Tumkur]
    A --> D[Phase 1: Kolar]
    B --> E[Phase 2: Chennai]
    C --> F[Phase 2: Hyderabad]
    D --> G[Phase 2: Coimbatore]
    E --> H[Phase 3: Mumbai]
    F --> I[Phase 3: Delhi NCR]
    G --> J[Phase 3: Kolkata]
    
    style A fill:#4CAF50,color:white
    style B fill:#2196F3,color:white
    style C fill:#2196F3,color:white
    style D fill:#2196F3,color:white
    style E fill:#FF9800,color:white
    style F fill:#FF9800,color:white
    style G fill:#FF9800,color:white
    style H fill:#9C27B0,color:white
    style I fill:#9C27B0,color:white
    style J fill:#9C27B0,color:white
```

---

## 9. Security Framework

### 9.1 Authentication & Authorization

| Layer | Mechanism | Implementation |
|-------|-----------|----------------|
| Customer | OTP-based (phone) + JWT | Supabase Auth + Phone Auth |
| Merchant | OTP + Email + JWT | Supabase Auth + RBAC |
| Admin | Email/Password + 2FA | Supabase Auth + TOTP |
| Courier | Phone OTP + limited JWT | Supabase Auth + Role-based |
| API Keys | HMAC-signed tokens | For third-party integrations |
| Session | Redis-based + JWT refresh | 7-day expiry, rotate refresh tokens |

### 9.2 Authorization (RBAC)

| Role | Permissions |
|------|------------|
| `customer` | Browse, search, cart, checkout, review, track |
| `b2b_buyer` | Customer + bulk pricing, MOQ negotiation |
| `merchant` | Product CRUD, order management, analytics, payouts |
| `courier` | View assignments, update status, GPS tracking |
| `admin` | Full platform management, moderation, config |
| `super_admin` | All + infra config, billing, audit logs |

### 9.3 Data Security

- **At Rest**: AES-256 encryption (PostgreSQL pgcrypto + S3 SSE-S3)
- **In Transit**: TLS 1.3 (all APIs, WebSocket WSS)
- **PII**: Phone numbers, addresses encrypted at column level
- **Payment**: PCI-DSS compliant via Razorpay (no raw card data stored)
- **Audit Logs**: All admin/merchant actions logged to `audit_log` table

### 9.4 API Security

- Rate limiting: Kong API Gateway (100 req/min per IP/user)
- JWT validation at gateway level
- CORS restricted to `*.petemart.in`
- SQL injection prevention via parameterized queries (Supabase)
- XSS prevention via Content-Security-Policy headers
- DDoS protection via Cloudflare WAF

### 9.5 Compliance

| Regulation | Applicability | Measure |
|-----------|---------------|---------|
| IT Act 2000 (India) | All user data | Data localization, consent |
| DPDP Act 2023 (India) | PII of Indian citizens | Data processing agreement |
| PCI-DSS | Payment data | Razorpay compliance (SAQ A) |
| GDPR (if EU users) | Customer data | Privacy policy, data export |

---

## 10. Scaling Strategy (5,000+ Merchants, Multi-City)

### 10.1 Horizontal Scaling Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU > 70% | 5 min average | Add pod (HPA) |
| Memory > 75% | 5 min average | Add pod (HPA) |
| Request latency > 500ms | 1 min avg | Add pod + check queries |
| Queue depth > 10,000 | RabbitMQ | Add consumer pods |
| DB connections > 80% | Supabase/RDS | Add read replicas |
| Search index > 10M docs | MeiliSearch | Shard index |

### 10.2 Database Scaling

- **Phase 1-2**: Supabase Pro (8 GB RAM, 8 CPU) — single instance
- **Phase 3**: AWS RDS PostgreSQL — Multi-AZ with read replicas (x2)
- **Phase 4**: Amazon Aurora PostgreSQL — Serverless v2, auto-scale
- **Sharding**: By city/region at Phase 4

### 10.3 Caching Strategy

| Cache Type | TTL | Storage | Technology |
|-----------|-----|---------|------------|
| Product detail | 5 min | Redis | Key-value |
| Category tree | 1 hour | Redis | Sorted sets |
| Merchant list | 10 min | Redis | Hash |
| Bullion rates | 5 min | Redis | String (atomic update) |
| Session data | 7 days | Redis | Key-value with expiry |
| API rate limit | 1 min | Redis | Sorted sets (sliding window) |
| Static assets | 1 day | Cloudflare CDN | Edge cache |
| Product images | 7 days | Cloudflare + S3 | Optimized variants |

### 10.4 Multi-Region Deployment (Phase 4+)

```mermaid
graph TB
    subgraph "Region 1: ap-south-1 (Mumbai)"
        A1[EKS Cluster]
        B1[RDS Primary]
        C1[Redis Primary]
    end
    
    subgraph "Region 2: ap-southeast-1 (Singapore)"
        A2[EKS Cluster]
        B2[RDS Read Replica]
        C2[Redis Replica]
    end
    
    subgraph "Region 3: eu-west-1 (Ireland)"
        A3[EKS Cluster]
        B3[RDS Read Replica]
        C3[Redis Replica]
    end
    
    D[Cloudflare Global Load Balancer] --> A1
    D --> A2
    D --> A3
    
    B1 -.->|Cross-Region Replication| B2
    B1 -.->|Cross-Region Replication| B3
```

---

## 11. Integration Architecture

### 11.1 Razorpay Integration

```mermaid
sequenceDiagram
    participant OrderSvc
    participant PaymentSvc
    participant Razorpay
    participant Webhook

    OrderSvc->>PaymentSvc: Create payment (order_id, amount, merchant_id)
    PaymentSvc->>Razorpay: POST /orders (amount, currency, receipt)
    Razorpay-->>PaymentSvc: razorpay_order_id, payment_url
    PaymentSvc-->>OrderSvc: Payment initiation details
    OrderSvc-->>Frontend: Payment widget initialization
    
    Frontend->>Razorpay: User completes payment (UPI/Card/NetBanking)
    Razorpay->>Razorpay: Process payment
    
    Note over Razorpay,Webhook: Asynchronous callback
    Razorpay-->>Webhook: POST /api/v1/webhooks/razorpay
    Webhook->>PaymentSvc: Verify signature (HMAC SHA256)
    PaymentSvc->>PaymentSvc: Update payment status
    PaymentSvc->>OrderSvc: Notify payment received
    PaymentSvc->>MerchantSvc: Initiate settlement
    
    alt Payment Captured
        OrderSvc->>OrderSvc: Confirm order
        PaymentSvc->>OrderSvc: Calculate commission
        PaymentSvc->>PaymentSvc: Hold merchant payout (escrow)
    else Payment Failed
        OrderSvc->>OrderSvc: Cancel order
        PaymentSvc->>Frontend: Notify failure reason
    end
```

### 11.2 WhatsApp Cloud API Integration

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant WhatsApp as WhatsApp Cloud API
    participant Merchant

    Note over Frontend: Mode B: User clicks "Enquire on WhatsApp"
    Frontend->>Backend: GET /api/v1/whatsapp/link?product_id=X&merchant_id=Y
    Backend->>Backend: Generate deep-link URL
    Backend-->>Frontend: wa.me/91XXXXXXXXXX?text=Template_Message
    
    Frontend->>Frontend: Open WhatsApp with deep-link
    Frontend->>WhatsApp: User sends message to merchant
    
    Note over Backend: Track engagement (opt-in)
    Frontend->>Backend: POST /api/v1/whatsapp/click (product_id, merchant_id)
    Backend->>Backend: Log click event for analytics
    
    Note over WhatsApp,Merchant: Off-platform negotiation
    
    alt Order via WhatsApp
        Merchant->>Merchant: Create manual order in dashboard
        Merchant->>Backend: POST /api/v1/merchant/orders (customer_details, items)
        Backend->>Backend: Create order, trigger payment request
        Backend->>WhatsApp: Send payment link to customer
    end
```

### 11.3 ShipRocket Integration (National Shipping)

```mermaid
sequenceDiagram
    participant OrderSvc
    participant DeliverySvc
    participant ShipRocket
    participant Courier

    Note over OrderSvc: Order marked for national shipping
    DeliverySvc->>ShipRocket: POST /api/v1/external/orders/create
    ShipRocket-->>DeliverySvc: shipment_id, awb_number, label_url
    
    DeliverySvc->>DeliverySvc: Store AWB, generate tracking URL
    DeliverySvc-->>OrderSvc: Tracking info available
    
    loop Every 30 min
        DeliverySvc->>ShipRocket: GET /api/v1/external/orders/track (awb)
        ShipRocket-->>DeliverySvc: Current status, location, ETA
        DeliverySvc->>DeliverySvc: Update tracking in database
        DeliverySvc->>Frontend: Push notification (status update)
    end
    
    Courier->>Courier: Deliver package to customer
    ShipRocket->>DeliverySvc: Webhook (delivered)
    DeliverySvc->>OrderSvc: Mark order as delivered
```

### 11.4 Jitsi Video Call Integration

```mermaid
sequenceDiagram
    participant Customer
    participant Frontend
    participant Backend
    participant Jitsi as Jitsi Server
    participant Merchant

    Customer->>Frontend: Book video call
    Frontend->>Backend: POST /api/v1/videocall/book (merchant_id, slot)
    Backend->>Backend: Validate merchant availability
    Backend-->>Frontend: Booking confirmed, room URL
    
    Backend->>Merchant: Notification (push/WhatsApp)
    
    Note over Customer,Merchant: At scheduled time
    Customer->>Frontend: Click "Join Call"
    Frontend->>Jitsi: Create/join room (JWT authenticated)
    
    Merchant->>Jitsi: Join room
    
    Note over Jitsi: WebRTC peer-to-peer (TURN server fallback)
    Customer->>Merchant: Live product demonstration
    Merchant->>Customer: Show product details, negotiate
    
    Customer->>Frontend: Place order during/after call
```

### 11.5 AI Virtual Try-On Integration

```mermaid
sequenceDiagram
    participant Frontend
    participant Gateway
    participant AISvc as AI Service
    participant Cache as Redis Cache
    participant OpenAI

    Frontend->>Gateway: POST /api/v1/products/:id/tryon (image, product_id)
    Gateway->>AISvc: Forward request with image
    
    AISvc->>AISvc: Validate image quality (face/body detection)
    AISvc->>Cache: Check if try-on result cached (product_id + user_hash)
    
    alt Cache Hit
        Cache-->>AISvc: Return cached try-on image
    else Cache Miss
        AISvc->>AISvc: Preprocess image (crop, resize, normalize)
        AISvc->>OpenAI: Generate try-on (DALL-E 3 / Stable Diffusion)
        OpenAI-->>AISvc: Generated image
        AISvc->>AISvc: Post-process (blend, refine, overlay)
        AISvc->>Cache: Store result (TTL: 24 hours)
    end
    
    AISvc-->>Gateway: Try-on result URL
    Gateway-->>Frontend: Display try-on overlay
    
    Note over Frontend: User can adjust variant, color, size
    Frontend->>Gateway: POST /api/v1/products/:id/tryon (variant_id)
    Gateway->>AISvc: Re-render with variant
```

---

## 12. Testing Architecture

### 12.1 Multi-Layer Testing Strategy

```mermaid
graph TB
    subgraph "Unit Tests"
        A1[Jest - Frontend Components]
        A2[Jest/Vitest - Backend Services]
        A3[Pytest - AI/ML Services]
    end
    
    subgraph "Integration Tests"
        B1[Supertest - API Endpoints]
        B2[TestContainers - DB Integration]
        B3[Cypress - E2E Web Flows]
        B4[Detox - Mobile E2E Tests]
    end
    
    subgraph "Performance Tests"
        C1[k6 - Load Testing]
        C2[Artillery - API Stress Test]
        C3[Lighthouse - Web Perf Audit]
    end
    
    subgraph "Security Tests"
        D1[OWASP ZAP - DAST]
        D2[Snyk - Dependency Scan]
        D3[ESLint Plugin Security]
    end
    
    subgraph "Acceptance Tests"
        E1[Cucumber - BDD Tests]
        E2[Playwright - Visual Regression]
        E3[Manual QA - Exploratory]
    end
    
    A1 --> B3
    A2 --> B1
    A2 --> B2
    B1 --> C1
    B3 --> E2
    C1 --> D1
    B2 --> E1
    
    style A1 fill:#4CAF50
    style A2 fill:#4CAF50
    style B1 fill:#2196F3
    style B3 fill:#2196F3
    style C1 fill:#FF9800
    style D1 fill:#f44336
    style E1 fill:#9C27B0
```

### 12.2 Testing Framework Details

| Test Type | Tool | Scope | Frequency | CI/CD Gate |
|-----------|------|-------|-----------|------------|
| Unit (Frontend) | Jest + React Testing Library | Components, hooks, utils | Every commit | Required |
| Unit (Backend) | Vitest/Jest | Service logic, models | Every commit | Required |
| API Integration | Supertest + TestContainers | Endpoints, DB | Every PR | Required |
| E2E (Web) | Cypress / Playwright | Critical user flows | Every PR | Required |
| E2E (Mobile) | Detox / Maestro | Native flows | Daily build | Required |
| Load Test | k6 | API endpoints, checkout | Weekly | Warning |
| Security Scan | OWASP ZAP + Snyk | All endpoints, deps | Weekly | Required |
| Visual Regression | Percy / Chromatic | UI components | Every PR | Warning |
| BDD | Cucumber + Gherkin | Feature validation | Sprint end | Required |

### 12.3 CI/CD Pipeline

```mermaid
graph LR
    A[Git Push] --> B[GitHub Actions Trigger]
    B --> C[Lint & Type Check]
    C --> D[Unit Tests]
    D --> E[Build Stage]
    E --> F[Integration Tests]
    F --> G[Security Scan]
    G --> H[Deploy to Staging]
    H --> I[E2E Tests on Staging]
    I --> J[Performance Check]
    J --> K[Deploy to Production]
    K --> L[Smoke Tests on Prod]
    L --> M[Health Check & Monitoring]

    style A fill:#333,color:white
    style D fill:#4CAF50,color:white
    style F fill:#2196F3,color:white
    style J fill:#FF9800,color:white
    style K fill:#f44336,color:white
    style M fill:#9C27B0,color:white
```

---

## 13. Cost Model — Full Production

### 13.1 Monthly Infrastructure Cost (Phase 3: 2,000 merchants)

| Category | Service | Configuration | Monthly Cost (USD) | Monthly Cost (INR) |
|----------|---------|---------------|--------------------|--------------------|
| **Compute** | AWS EKS (Kubernetes) | 6 x t3.medium (2 vCPU, 4 GB) | $360 | ₹30,000 |
| **Compute** | AWS EKS (AI/GPU) | 2 x g4dn.xlarge (GPU) | $650 | ₹54,000 |
| **Database** | AWS RDS PostgreSQL | db.r6g.large (2 vCPU, 16 GB) | $250 | ₹20,800 |
| **Database** | RDS Read Replica | db.r6g.large x 2 | $500 | ₹41,600 |
| **Cache** | AWS ElastiCache Redis | cache.r6g.large x 3 | $350 | ₹29,000 |
| **Queue** | Amazon MQ (RabbitMQ) | mq.m5.large x 2 | $400 | ₹33,300 |
| **Storage** | AWS S3 | 500 GB + CDN transfer | $50 | ₹4,200 |
| **CDN** | Cloudflare Pro | $20/month | $20 | ₹1,660 |
| **Search** | MeiliSearch (self-hosted) | 1 x c5.xlarge | $85 | ₹7,000 |
| **Analytics** | ClickHouse (self-hosted) | 2 x c5.2xlarge | $340 | ₹28,300 |
| **Monitoring** | Sentry + Grafana | Pro plan + self-hosted | $100 | ₹8,300 |
| **CI/CD** | GitHub Actions | 2,000 min/month | $20 | ₹1,660 |
| **Email** | SendGrid / AWS SES | 100K emails/month | $20 | ₹1,660 |
| **SMS** | Twilio / MSG91 | 50K SMS/month | $150 | ₹12,500 |
| **WhatsApp** | Meta Cloud API | 100K conversations | $200 | ₹16,600 |
| **Maps** | Google Maps API | 100K requests/month | $50 | ₹4,200 |
| **AI** | OpenAI API | Try-on + recommendations | $500 | ₹41,600 |
| **ShipRocket** | Shipping API | 5K shipments/month | $100 | ₹8,300 |
| **Reserve** | Buffer/Overhead | 20% buffer | $800 | ₹66,600 |

| **Total (Phase 3)** | | | **~$4,945** | **~₹4,11,000** |

### 13.2 Annual Infrastructure Cost Projection

| Phase | Monthly Cost (INR) | Annual Cost (INR) |
|-------|--------------------|--------------------|
| Phase 0 (POC — 8 merchants) | ₹0 | ₹0 |
| Phase 1 (Launch — 100 merchants) | ₹15,000 | ₹1,80,000 |
| Phase 2 (Growth — 500 merchants) | ₹1,20,000 | ₹14,40,000 |
| Phase 3 (Scale — 2,000 merchants) | ₹4,11,000 | ₹49,32,000 |
| Phase 4 (Vision — 5,000+ merchants) | ₹12,00,000 | ₹1,44,00,000 |

### 13.3 Annual Operational Cost (Non-Infra)

| Category | Year 1 (INR) | Year 2 (INR) |
|----------|-------------|-------------|
| Engineering Team (8-12 members) | ₹1,20,00,000 | ₹1,50,00,000 |
| Design Team (2 members) | ₹18,00,000 | ₹24,00,000 |
| Operations (3 members) | ₹18,00,000 | ₹24,00,000 |
| Marketing | ₹12,00,000 | ₹36,00,000 |
| Legal & Compliance | ₹3,00,000 | ₹5,00,000 |
| Office & Admin | ₹6,00,000 | ₹9,00,000 |
| **Total Ops** | **₹1,77,00,000** | **₹2,48,00,000** |

### 13.4 Revenue Projection vs Cost

| Phase | Monthly GMV (INR) | Revenue (INR) | Infra Cost (INR) | Ops Cost (INR) | Net (INR) |
|-------|-------------------|--------------|------------------|----------------|-----------|
| POC (8 merchants) | ₹5,00,000 | ₹15,000 | ₹0 | ₹3,00,000 | -₹2,85,000 |
| Launch (100) | ₹50,00,000 | ₹1,50,000 | ₹15,000 | ₹5,00,000 | -₹3,65,000 |
| Growth (500) | ₹3,00,00,000 | ₹9,00,000 | ₹1,20,000 | ₹10,00,000 | -₹2,20,000 |
| Scale (2,000) | ₹15,00,00,000 | ₹45,00,000 | ₹4,11,000 | ₹20,00,000 | ₹20,89,000 |
| Vision (5,000) | ₹50,00,00,000 | ₹1,50,00,000 | ₹12,00,000 | ₹40,00,000 | ₹98,00,000 |

---

## 14. Implementation Roadmap

### Phase 0 (POC): Weeks 1-6 — 8 Merchants

| Week | Milestone | Deliverables |
|------|-----------|-------------|
| 1-2 | Foundation | Supabase setup, Next.js boilerplate, API skeleton, auth |
| 3-4 | Core Features | Product catalog, merchant microsite, Mode B/C, cart |
| 5-6 | Checkout & Launch | Mode A checkout, Razorpay integration, 8 merchants live |

### Phase 1 (Launch): Months 2-4 — 100 Merchants

| Month | Milestone | Deliverables |
|-------|-----------|-------------|
| 2 | Merchant Dashboard | Full onboarding flow, subscription management, analytics |
| 3 | Mobile Apps | React Native iOS/Android (customer), courier app |
| 4 | Delivery Network | Zone-based delivery, multi-store consolidation, courier app |

### Phase 2 (Growth): Months 5-8 — 500 Merchants

| Month | Milestone | Deliverables |
|-------|-----------|-------------|
| 5 | AI Features | Virtual try-on (apparel + jewellery), recommendations |
| 6 | Advanced Commerce | Bulk ordering, ShipRocket integration, B2B workflows |
| 7 | Admin Platform | Feature flags, white-label, review moderation, dynamic config |
| 8 | Performance | Kubernetes migration, Redis clustering, MeiliSearch, CDN |

### Phase 3 (Scale): Months 9-14 — 2,000 Merchants

| Month | Milestone | Deliverables |
|-------|-----------|-------------|
| 9-10 | Infrastructure | Full EKS deployment, auto-scaling, multi-AZ RDS |
| 11-12 | Advanced Features | Video calls (Jitsi), live bullion rates, Pete Street VR |
| 13-14 | Multi-City | Mysore/Tumkur expansion, regional settings, local support |

### Phase 4 (Vision): Months 15-24 — 5,000+ Merchants

| Quarter | Milestone | Deliverables |
|---------|-----------|-------------|
| Q1 2028 | Scale Operations | Pan-India expansion, multiple cities, regional teams |
| Q2 2028 | Advanced AI | Live bazaar streaming, co-shopping, AR virtual walk |
| Q3 2028 | Ecosystem | Third-party integrations, API marketplace for developers |
| Q4 2028 | Enterprise | White-label franchise model, enterprise SLAs, dedicated support |

---

## Appendix A: ADR Log

| ADR | Decision | Rationale | Date |
|-----|----------|-----------|------|
| ADR-001 | Next.js 14 App Router | SSR/SSG hybrid, RSC for perf | 2026-06-10 |
| ADR-002 | React Native (Expo) | Code sharing, hot reload, managed | 2026-06-10 |
| ADR-003 | Supabase PostgreSQL + Row Level Security | Real-time, auth, geo | 2026-06-10 |
| ADR-004 | RabbitMQ over Kafka | Simpler ops, sufficient throughput | 2026-06-10 |
| ADR-005 | Razorpay single PG | Indian market, UPI, escrow | 2026-06-10 |
| ADR-006 | AWS EKS (Phase 3) | Multi-region, Istio, mature | 2026-06-10 |
| ADR-007 | Cloudflare CDN + WAF | Edge, DDoS, SSL, cost-effective | 2026-06-10 |
| ADR-008 | IBJA/IndiaBulls for bullion | Official Indian bullion rates | 2026-06-10 |
| ADR-009 | Jitsi self-hosted | Zero per-minute cost, open source | 2026-06-10 |
| ADR-010 | MeiliSearch > Algolia | Self-hosted, cost control at scale | 2026-06-10 |
| ADR-011 | ClickHouse > BigQuery | Self-hosted analytics, cost at scale | 2026-06-10 |
| ADR-012 | Go for order/payment services | Performance, concurrency | 2026-06-10 |

## Appendix B: Architecture Quality Attributes

| Attribute | Target | Measure |
|-----------|--------|---------|
| Availability | 99.9% (Phase 3+), 99.5% (Phase 1-2) | Uptime monitoring |
| Performance | P95 < 200ms API, < 2s page load | Lighthouse, APM |
| Scalability | 5,000 merchants, 100K customers, 1M orders/month | Load testing |
| Security | OWASP Top 10 compliant | ZAP scans, penetration testing |
| Maintainability | < 4 hours incident resolution | PagerDuty, runbooks |
| Cost Efficiency | < 10% of GMV on infra | FinOps dashboards |

---

*End of Full Product Architecture Blueprint*
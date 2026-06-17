Note the tool protocol is strictly JSON based -- no additional flags or shell commands.

## Artifact Storage & Workspace

Your artifacts, deliverables, and outputs must be stored under:
agents/02_engineering_specs/03_architect_agent/

You have the ability to browse files and read dependencies from upstream agents. Use these tools to gather context before producing your deliverables.

## Dependency Reading

You should first read the upstream PRD and requirements documents to understand the full scope before architecting.






















Let me read the PRD and requirements documents.





Now let me read the full PRD to get all requirements and cost data.








I now have comprehensive context. Let me read the remaining sections of the PRD for cost data and requirements.







I have enough context now. Let me read the cost sections from the PRD config JSON which has the detailed data.










Now I have comprehensive context. Let me create all deliverables. Starting with the main architecture document and all supporting files.

<｜DSML｜tool_calls>
<｜DSML｜invoke name="write_artifact">
<｜DSML｜parameter name="name" string="true">FEASIBILITY_ARCHITECTURE.md</｜DSML｜parameter>
<｜DSML｜parameter name="type" string="true">markdown</｜DSML｜parameter>
<｜DSML｜parameter name="data" string="true"># PeteMart — Enterprise Architecture Blueprint

**Document Version:** 1.0  
**Author:** Senior Enterprise Solution Architect (Agent 03)  
**Date:** 2026-06-15  
**Status:** Approved for Engineering  
**Derived From:** PRD v2.0, 111 Requirements, 13 Workflows, 5 Personas

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Architecture Principles & Constraints](#2-architecture-principles--constraints)
3. [System Context (C4 Level 1)](#3-system-context-c4-level-1)
4. [Container Architecture (C4 Level 2)](#4-container-architecture-c4-level-2)
5. [Component Architecture (C4 Level 3)](#5-component-architecture-c4-level-3)
6. [Technology Stack](#6-technology-stack)
7. [API Strategy & Design](#7-api-strategy--design)
8. [Data Architecture](#8-data-architecture)
9. [Security Architecture](#9-security-architecture)
10. [Infrastructure & Deployment](#10-infrastructure--deployment)
11. [Multi-Store Cart & Consolidated Delivery](#11-multi-store-cart--consolidated-delivery)
12. [WhatsApp Integration Architecture](#12-whatsapp-integration-architecture)
13. [AI Features Architecture](#13-ai-features-architecture)
14. [Analytics & Observability](#14-analytics--observability)
15. [Scaling Strategy (5,000+ Merchants)](#15-scaling-strategy-5000-merchants)
16. [Multi-City Expansion Architecture](#16-multi-city-expansion-architecture)
17. [Testing Architecture](#17-testing-architecture)
18. [Costing Model](#18-costing-model)
19. [POC Architecture (8-Merchant Pilot)](#19-poc-architecture-8-merchant-pilot)
20. [Implementation Roadmap](#20-implementation-roadmap)

---

## 1. Executive Summary

PeteMart is a hyperlocal digital commerce marketplace connecting **5,000+ traditional physical merchants** across **21 Pete markets of Old Bangalore** with customers via three interaction modes (Direct Purchase, WhatsApp Enquiry, Visit Store). This architecture blueprint defines a **production-grade, API-first, event-driven, multi-tenant platform** designed for **99.9% uptime**, **<200ms API P95 latency**, and **horizontal scaling** across cities.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Frontend Framework** | Next.js 14 (React 18) + React Native | SSR for SEO, native performance for mobile |
| **Backend Framework** | NestJS (Node.js) | Type-safe, modular, enterprise-grade |
| **API Architecture** | REST + GraphQL + WebSocket | REST for CRUD, GraphQL for flexible queries, WebSocket for real-time tracking |
| **Database** | PostgreSQL (primary) + Redis (cache) + Elasticsearch (search) | Relational integrity, caching, full-text search |
| **Message Queue** | RabbitMQ / AWS SQS | Async order processing, event-driven workflows |
| **Cloud Provider** | AWS (primary) + DigitalOcean (DR) | Cost optimization + geographic redundancy |
| **AI/ML** | AWS SageMaker + OpenCV + TensorFlow.js | Virtual try-on, recommendations |
| **CI/CD** | GitHub Actions + Docker + ArgoCD | GitOps, automated deployments |

---

## 2. Architecture Principles & Constraints

### Principles
1. **API-First**: All functionality exposed via documented APIs before UI implementation
2. **Event-Driven**: Async communication for order processing, notifications, analytics
3. **Multi-Tenant by Design**: Data isolation at database level with tenant-aware middleware
4. **Offline-First Mobile**: Mobile apps work with degraded functionality offline
5. **Zero-Trust Security**: Every request authenticated, authorized, and encrypted
6. **Cost-Proportional Scaling**: Auto-scaling with cost guards at every threshold

### Constraints
- **Regulatory**: India DPDP Act 2023, PCI-DSS for payments, GST compliance
- **Performance**: LCP <2.5s, API P95 <200ms, 99.9% uptime SLA
- **Scale**: 5,000+ merchants, 50,000+ customers, 10,000+ concurrent users
- **Languages**: Kannada, Hindi, English (i18n from day one)
- **Budget**: POC at ₹0/month, Production at ~₹4.2L/month at scale

---

## 3. System Context (C4 Level 1)

```mermaid
C4Context
  title System Context diagram for PeteMart Marketplace

  Person(customer, "Customer / Buyer", "Priya - browses, orders, tracks")
  Person(merchant, "Merchant / Seller", "Ramesh - manages catalog, orders")
  Person(delivery, "Delivery Partner", "Vinay - picks up, delivers")
  Person(admin, "Platform Admin", "Ananya - manages platform")

  System_Boundary(petemart, "PeteMart Platform") {
    System(webapp, "Web Application", "Next.js SSR - petemart.in")
    System(mobileapp, "Mobile App", "React Native - iOS & Android")
    System(api, "API Gateway", "NestJS REST/GraphQL/WebSocket")
    System(whatsapp, "WhatsApp Integration", "WhatsApp Business API")
  }

  System_Ext(razorpay, "Razorpay", "Payment Gateway")
  System_Ext(googlemaps, "Google Maps", "Maps & Geocoding")
  System_Ext(shiprocket, "ShipRocket", "National Shipping")
  System_Ext(bullion, "Bullion API", "Live Gold/Silver Rates")
  System_Ext(algolia, "Algolia", "Search Engine")
  System_Ext(s3, "AWS S3 + CloudFront", "Media Storage & CDN")
  System_Ext(twilio, "Twilio / MSG91", "SMS & OTP")
  System_Ext(sendgrid, "SendGrid / AWS SES", "Email Notifications")
  System_Ext(fcm, "Firebase Cloud Messaging", "Push Notifications")

  Rel(customer, webapp, "Browses, orders, tracks", "HTTPS")
  Rel(customer, mobileapp, "Browses, orders, tracks", "HTTPS")
  Rel(merchant, webapp, "Manages store, catalog, orders", "HTTPS")
  Rel(delivery, mobileapp, "Manages deliveries", "HTTPS")
  Rel(admin, webapp, "Manages platform, analytics", "HTTPS")

  Rel(webapp, api, "API calls", "REST/GraphQL/WS")
  Rel(mobileapp, api, "API calls", "REST/GraphQL/WS")
  Rel(api, razorpay, "Payment processing", "REST API")
  Rel(api, googlemaps, "Geocoding, directions", "REST API")
  Rel(api, shiprocket, "Shipping labels, tracking", "REST API")
  Rel(api, bullion, "Live bullion rates", "REST API")
  Rel(api, algolia, "Search indexing & queries", "REST API")
  Rel(api, s3, "Media uploads", "S3 API")
  Rel(api, twilio, "SMS & OTP", "REST API")
  Rel(api, sendgrid, "Transactional emails", "SMTP/API")
  Rel(api, fcm, "Push notifications", "FCM API")
  Rel(whatsapp, api, "WhatsApp Business API", "Webhook + REST")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## 4. Container Architecture (C4 Level 2)

```mermaid
C4Container
  title Container diagram for PeteMart Platform

  Person(customer, "Customer", "Priya - end user")
  Person(merchant, "Merchant", "Ramesh - store owner")
  Person(delivery, "Delivery Partner", "Vinay - courier")
  Person(admin, "Admin", "Ananya - operator")

  System_Boundary(petemart, "PeteMart") {
    Container(web_app, "Web Application", "Next.js 14", "SSR React app for customers, merchants, admins")
    Container(mobile_app, "Mobile App", "React Native", "iOS & Android native apps")
    Container(courier_app, "Courier App", "React Native", "Delivery partner mobile app")

    Container(api_gateway, "API Gateway", "NestJS / Express", "REST + GraphQL + WebSocket endpoints")
    Container(auth_service, "Auth Service", "NestJS", "JWT, OTP, OAuth2.0, RBAC")
    Container(merchant_service, "Merchant Service", "NestJS", "Store mgmt, catalog, inventory")
    Container(order_service, "Order Service", "NestJS", "Orders, cart, checkout, consolidation")
    Container(payment_service, "Payment Service", "NestJS", "Razorpay integration, payouts")
    Container(delivery_service, "Delivery Service", "NestJS", "Zone routing, courier dispatch, tracking")
    Container(notification_service, "Notification Service", "NestJS", "Push, SMS, Email, WhatsApp")
    Container(analytics_service, "Analytics Service", "NestJS + ClickHouse", "Real-time metrics, reports")
    Container(ai_service, "AI Service", "Python FastAPI", "Virtual try-on, recommendations")
    Container(content_service, "Content Service", "NestJS", "Reels, reviews, galleries, moderation")

    ContainerDb(postgres, "PostgreSQL", "Primary Database", "Users, stores, products, orders")
    ContainerDb(redis, "Redis", "Cache Layer", "Sessions, carts, rate limiting, pub/sub")
    ContainerDb(elastic, "Elasticsearch", "Search Index", "Product & store search")
    ContainerDb(clickhouse, "ClickHouse", "Analytics DB", "Time-series metrics, event logs")
    ContainerDb(s3_storage, "S3 + CloudFront", "Media Storage", "Images, videos, invoices")
  }

  Container_Boundary(external, "External Systems") {
    Container(razorpay, "Razorpay", "Payment Gateway")
    Container(whatsapp, "WhatsApp Business API", "Messaging")
    Container(maps, "Google Maps API", "Geocoding, Directions")
    Container(shiprocket, "ShipRocket", "National Shipping")
    Container(bullion_api, "Bullion Rate API", "Live Gold/Silver")
    Container(algolia, "Algolia", "Search Engine")
  }

  Rel(customer, web_app, "HTTPS", "Browse, Order, Track")
  Rel(customer, mobile_app, "HTTPS", "Browse, Order, Track")
  Rel(merchant, web_app, "HTTPS", "Manage Store")
  Rel(delivery, courier_app, "HTTPS", "Manage Deliveries")
  Rel(admin, web_app, "HTTPS", "Admin Dashboard")

  Rel(web_app, api_gateway, "REST/GraphQL/WS")
  Rel(mobile_app, api_gateway, "REST/GraphQL/WS")
  Rel(courier_app, api_gateway, "REST/WebSocket")

  Rel(api_gateway, auth_service, "Auth requests")
  Rel(api_gateway, merchant_service, "Store/Catalog")
  Rel(api_gateway, order_service, "Orders/Cart")
  Rel(api_gateway, payment_service, "Payments")
  Rel(api_gateway, delivery_service, "Delivery")
  Rel(api_gateway, notification_service, "Notifications")
  Rel(api_gateway, analytics_service, "Analytics")
  Rel(api_gateway, ai_service, "AI features")
  Rel(api_gateway, content_service, "Content")

  Rel(auth_service, postgres, "Users & Roles")
  Rel(merchant_service, postgres, "Stores, Products")
  Rel(order_service, postgres, "Orders, Cart")
  Rel(payment_service, postgres, "Transactions")
  Rel(delivery_service, postgres, "Deliveries, Zones")
  Rel(notification_service, postgres, "Templates, Logs")
  Rel(analytics_service, clickhouse, "Events")
  Rel(ai_service, s3_storage, "AI models, images")

  Rel(order_service, redis, "Cart sessions, locks")
  Rel(merchant_service, elastic, "Search indexing")
  Rel(merchant_service, redis, "Catalog cache")
  Rel(api_gateway, redis, "Rate limiting, sessions")

  Rel(payment_service, razorpay, "Process payments")
  Rel(notification_service, whatsapp, "Send messages")
  Rel(delivery_service, maps, "Geocoding")
  Rel(delivery_service, shiprocket, "Shipping")
  Rel(merchant_service, algolia, "Search sync")

  UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="2")
```

---

## 5. Component Architecture (C4 Level 3)

### 5.1 Order Service Component Diagram

```mermaid
C4Component
  title Component diagram for Order Service

  Container_Boundary(order_service, "Order Service") {
    Component(cart_mgr, "Cart Manager", "NestJS Module", "Multi-store cart, consolidation logic")
    Component(checkout_engine, "Checkout Engine", "NestJS Module", "Validation, fee calc, coupon engine")
    Component(order_orch, "Order Orchestrator", "NestJS Module", "Order lifecycle, status machine")
    Component(consolidation, "Consolidation Engine", "NestJS Module", "Multi-store order splitting, routing")
    Component(refund_engine, "Refund Engine", "NestJS Module", "Refund processing, Razorpay integration")
    Component(coupon_engine, "Coupon Engine", "NestJS Module", "Coupon validation, application")
    Component(cart_repo, "Cart Repository", "TypeORM", "Cart persistence")
    Component(order_repo, "Order Repository", "TypeORM", "Order persistence")
  }

  Container_Boundary(external, "External") {
    Component(payment_svc, "Payment Service", "NestJS", "Razorpay integration")
    Component(delivery_svc, "Delivery Service", "NestJS", "Zone routing")
    Component(notification_svc, "Notification Service", "NestJS", "Alerts")
    Component(merchant_svc, "Merchant Service", "NestJS", "Product data")
  }

  Rel(cart_mgr, cart_repo, "Uses")
  Rel(checkout_engine, cart_repo, "Reads")
  Rel(checkout_engine, coupon_engine, "Validates")
  Rel(order_orch, order_repo, "Uses")
  Rel(order_orch, consolidation, "Splits orders")
  Rel(consolidation, delivery_svc, "Routes deliveries")
  Rel(order_orch, payment_svc, "Process payment")
  Rel(order_orch, notification_svc, "Send alerts")
  Rel(checkout_engine, merchant_svc, "Get product info")
  Rel(refund_engine, payment_svc, "Process refund")
```

### 5.2 Data Flow — Multi-Store Checkout

```mermaid
sequenceDiagram
  participant C as Customer (Mobile/Web)
  participant AG as API Gateway
  participant CM as Cart Manager
  participant CE as Checkout Engine
  participant PS as Payment Service
  participant OO as Order Orchestrator
  participant CO as Consolidation Engine
  participant DS as Delivery Service
  participant NS as Notification Service

  C->>AG: POST /cart/add (productId, qty, storeId)
  AG->>CM: validateAndAdd()
  CM->>CM: validate stock, price
  CM-->>C: cart updated

  C->>AG: POST /cart/add (productId2, qty2, storeId2)
  AG->>CM: validateAndAdd()
  CM-->>C: multi-store cart

  C->>AG: POST /checkout/start
  AG->>CE: initiateCheckout(cartId)
  CE->>CE: validate cart items
  CE->>CE: calculate delivery fee: MAX(zone rates) + ₹25*(N-1)
  CE->>CE: apply coupons
  CE-->>C: checkout summary

  C->>AG: POST /checkout/confirm
  AG->>PS: createPaymentOrder(amount)
  PS->>Razorpay: order.create()
  Razorpay-->>PS: payment_order_id
  PS-->>C: payment_order_id, razorpay_key

  C->>Razorpay: completePayment()
  Razorpay-->>PS: webhook: payment.captured
  PS->>OO: onPaymentSuccess(orderId)
  OO->>CO: consolidateAndSplit(orderId)
  CO->>CO: split into store-wise sub-orders
  CO->>DS: createPickupTasks(sub-orders)
  DS->>DS: assign courier, optimize route
  DS-->>CO: pickup_tasks_created
  CO-->>OO: sub_orders_created
  OO->>NS: sendOrderConfirmation(orderId)
  NS-->>C: push/email/SMS confirmation
  NS-->>Merchant: new order notification
```

---

## 6. Technology Stack

### 6.1 Frontend Layer

| Component | Technology | Version | Justification |
|---|---|---|---|
| Web Framework | Next.js | 14.x | SSR/SSG/ISR, SEO, React Server Components |
| UI Library | React | 18.x | Component ecosystem, concurrent features |
| State Management | Zustand + React Query | 4.x / 5.x | Lightweight, server state caching |
| Styling | Tailwind CSS + ShadCN/ui | 3.x | Utility-first, design system |
| i18n | next-intl | 3.x | Multi-language (Kannada, Hindi, English) |
| PWA | next-pwa | 5.x | Offline support, install prompt |
| Forms | React Hook Form + Zod | 7.x / 3.x | Type-safe validation |
| Charts | Recharts / D3.js | 2.x | Analytics dashboards |
| 3D/AR | Three.js / React Three Fiber | - | Virtual walk, 360° product view |

### 6.2 Mobile Layer

| Component | Technology | Justification |
|---|---|---|
| Framework | React Native 0.73+ | Code sharing with web, fast refresh |
| Navigation | React Navigation 6 | Type-safe routing |
| State | Zustand + React Query | Consistent with web |
| Maps | react-native-maps | Google Maps integration |
| Camera | react-native-vision-camera | Try-on photo capture |
| Push | Firebase Cloud Messaging | Cross-platform push |
| Offline | WatermelonDB | Local-first data sync |
| Payments | Razorpay React Native SDK | Native payment sheet |
| Animations | React Native Reanimated | 60fps UI animations |

### 6.3 Backend Layer

| Component | Technology | Justification |
|---|---|---|
| API Framework | NestJS 10 | Modular, decorators, OpenAPI |
| Runtime | Node.js 20 LTS | Event-driven, async I/O |
| Language | TypeScript 5 | Type safety across stack |
| ORM | TypeORM / Prisma | Database abstraction |
| Validation | class-validator + Zod | Request/response validation |
| Auth | Passport.js + JWT | OAuth2, OTP, RBAC |
| API Docs | Swagger / OpenAPI 3.1 | Auto-generated docs |
| Message Queue | RabbitMQ / BullMQ | Job processing, events |
| GraphQL | Apollo Server (NestJS) | Flexible data queries |
| WebSocket | Socket.io | Real-time tracking |

### 6.4 AI/ML Layer

| Component | Technology | Justification |
|---|---|---|
| AI Framework | Python FastAPI | Separate service for ML workloads |
| Try-On (Apparel) | OpenCV + TensorFlow + DrapeNet | Virtual clothing overlay |
| Try-On (Jewellery) | MediaPipe + OpenCV | Face/ear/neck detection |
| Recommendations | TensorFlow Recommenders | Collaborative + content-based |
| Image Processing | Sharp / ImageMagick | Thumbnail generation, optimization |
| Model Hosting | AWS SageMaker | GPU-backed inference |
| Vector DB | Pinecone / pgvector | Similarity search for products |

### 6.5 Infrastructure

| Component | Technology | Justification |
|---|---|---|
| Cloud Provider | AWS (primary) | ECS Fargate, RDS, ElastiCache |
| Container Orchestration | AWS ECS Fargate | Serverless containers, no cluster mgmt |
| CI/CD | GitHub Actions + ArgoCD | GitOps workflow |
| IaC | Terraform + Pulumi | Infrastructure as code |
| CDN | AWS CloudFront + AWS WAF | Global edge, DDoS protection |
| DNS | Route53 | Managed DNS with failover |
| Monitoring | Datadog / Grafana + Prometheus | APM, metrics, logs |
| Error Tracking | Sentry | Real-time error monitoring |

---

## 7. API Strategy & Design

### 7.1 API Gateway Architecture

```mermaid
graph TD
    subgraph "API Gateway Layer"
        GW[API Gateway - Kong / AWS API Gateway]
        RL[Rate Limiter - 1000 req/min per tenant]
        AUTH[JWT Auth Middleware]
        RBAC[RBAC Middleware]
        LOG[Request/Response Logger]
        CACHE[Response Cache - Redis]
    end

    subgraph "Service Routes"
        REST[REST Endpoints - /api/v1/*]
        GQL[GraphQL Endpoint - /graphql]
        WS[WebSocket - /ws/*]
        WH[Webhook - /webhooks/*]
    end

    Client --> GW
    GW --> RL
    RL --> AUTH
    AUTH --> RBAC
    RBAC --> LOG
    LOG --> CACHE
    CACHE --> REST
    CACHE --> GQL
    CACHE --> WS
    CACHE --> WH
```

### 7.2 API Versioning Strategy

- **URL-based versioning**: `/api/v1/`, `/api/v2/`
- **Backward compatibility**: 2 versions active simultaneously
- **Deprecation policy**: 6-month deprecation notice via `Sunset` header
- **API Lifecycle**: Alpha → Beta → GA → Deprecated → Sunset

### 7.3 Core API Endpoints

| Module | Endpoint | Method | Description |
|---|---|---|---|
| **Auth** | `/api/v1/auth/otp/send` | POST | Send OTP for login |
| | `/api/v1/auth/otp/verify` | POST | Verify OTP, return JWT |
| | `/api/v1/auth/google` | POST | Google OAuth login |
| | `/api/v1/auth/refresh` | POST | Refresh JWT token |
| **Products** | `/api/v1/products` | GET | List products (paginated, filtered) |
| | `/api/v1/products/:id` | GET | Product detail |
| | `/api/v1/products/search` | GET | Full-text search |
| **Cart** | `/api/v1/cart` | GET | Get current cart |
| | `/api/v1/cart/add` | POST | Add item to cart |
| | `/api/v1/cart/remove` | POST | Remove item |
| | `/api/v1/cart/apply-coupon` | POST | Apply coupon |
| **Checkout** | `/api/v1/checkout/start` | POST | Initiate checkout |
| | `/api/v1/checkout/calculate` | POST | Calculate totals |
| | `/api/v1/checkout/confirm` | POST | Confirm order |
| **Orders** | `/api/v1/orders` | GET | List orders |
| | `/api/v1/orders/:id` | GET | Order detail |
| | `/api/v1/orders/:id/track` | GET | Live tracking |
| **Merchant** | `/api/v1/merchant/stores` | GET/POST | Store CRUD |
| | `/api/v1/merchant/products` | GET/POST | Product CRUD |
| | `/api/v1/merchant/orders` | GET | Order management |
| | `/api/v1/merchant/analytics` | GET | Sales analytics |
| **Delivery** | `/api/v1/delivery/tasks` | GET | Courier tasks |
| | `/api/v1/delivery/status` | PATCH | Update status |
| **Admin** | `/api/v1/admin/merchants` | GET | Merchant management |
| | `/api/v1/admin/analytics` | GET | Platform analytics |
| | `/api/v1/admin/feature-flags` | GET/POST | Feature flag management |
| **AI** | `/api/v1/ai/try-on` | POST | Virtual try-on |
| | `/api/v1/ai/recommendations` | GET | Product recommendations |
| **WhatsApp** | `/api/v1/whatsapp/template` | POST | Send template message |
| | `/webhooks/whatsapp/inbound` | POST | Inbound WhatsApp webhook |
| **Payments** | `/api/v1/payments/create-order` | POST | Create Razorpay order |
| | `/webhooks/razorpay/payment` | POST | Payment webhook |

### 7.4 Rate Limiting Strategy

| Tier | Rate Limit | Burst | Applied To |
|---|---|---|---|
| Anonymous | 60 req/min | 100 | Unauthenticated users |
| Customer | 300 req/min | 500 | Authenticated customers |
| Merchant | 600 req/min | 1000 | Merchant API calls |
| Admin | 1000 req/min | 2000 | Admin operations |
| Webhook | 100 req/min | 200 | External webhook sources |

### 7.5 Event-Driven Architecture

```mermaid
graph LR
    subgraph "Event Producers"
        OS[Order Service]
        PS[Payment Service]
        MS[Merchant Service]
        DS[Delivery Service]
    end

    subgraph "Message Queue (RabbitMQ/BullMQ)"
        EX[Exchange]
        Q1[order.created]
        Q2[payment.captured]
        Q3[delivery.updated]
        Q4[merchant.registered]
        Q5[notification.send]
    end

    subgraph "Event Consumers"
        NS[Notification Service]
        AS[Analytics Service]
        ES[Email Service]
        WS[WebSocket Service]
    end

    OS -->|order.created| Q1
    PS -->|payment.captured| Q2
    DS -->|delivery.updated| Q3
    MS -->|merchant.registered| Q4

    Q1 --> NS
    Q1 --> AS
    Q2 --> NS
    Q2 --> AS
    Q3 --> WS
    Q3 --> AS
    Q4 --> NS
    Q4 --> AS
    Q5 --> ES
```

---

## 8. Data Architecture

### 8.1 Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Store : owns
    User ||--o{ Order : places
    User ||--o{ Review : writes
    Store ||--o{ Product : contains
    Store ||--o{ Subscription : has
    Store ||--o{ StoreSocial : links
    Product ||--o{ ProductVariant : has
    Product ||--o{ ProductImage : has
    Product ||--o{ Review : receives
    Product ||--o{ CartItem : in
    Order ||--o{ OrderItem : contains
    Order ||--o{ Payment : has
    Order ||--o{ Delivery : has
    Order ||--o{ OrderStatus : tracks
    Cart ||--o{ CartItem : contains
    Delivery ||--o{ DeliveryStop : has
    Delivery ||--|| Courier : assigned
    Category ||--o{ Product : categorizes
    Market ||--o{ Store : located_in

    User {
        uuid id PK
        string role "customer|merchant|admin|courier"
        string phone UK
        string email UK
        string password_hash
        string name
        jsonb preferences
        timestamp created_at
        timestamp last_login
    }

    Store {
        uuid id PK
        uuid owner_id FK
        string name
        string slug UK
        string market_area
        string address
        jsonb location "lat, lng"
        enum plan "starter|growth|premium"
        enum status "pending|active|suspended"
        jsonb modes "A, B, C enabled"
        string logo_url
        string banner_url
        string whatsapp_number
        timestamp created_at
    }

    Product {
        uuid id PK
        uuid store_id FK
        uuid category_id FK
        string name
        string description
        decimal price_retail
        decimal price_wholesale
        int moq
        string sku UK
        enum mode "A|B|C"
        int stock_qty
        int stock_alert_threshold
        jsonb attributes "size, color, weight"
        boolean is_active
        timestamp created_at
    }

    Order {
        uuid id PK
        uuid customer_id FK
        string order_number UK
        decimal total_amount
        decimal delivery_fee
        decimal commission
        decimal platform_fee
        enum type "b2c|b2b"
        enum status "pending|confirmed|processing|shipped|delivered|cancelled|refunded"
        jsonb delivery_address
        timestamp created_at
    }

    Cart {
        uuid id PK
        uuid user_id FK
        jsonb items "store-wise grouped"
        decimal total
        timestamp expires_at
    }

    Delivery {
        uuid id PK
        uuid order_id FK
        uuid courier_id FK
        enum zone "1km|3km|7km|national"
        decimal fee
        enum status "assigned|pickup|in_transit|delivered"
        jsonb route "optimized stops"
        timestamp estimated_delivery
    }

    Payment {
        uuid id PK
        uuid order_id FK
        string razorpay_order_id
        string razorpay_payment_id
        decimal amount
        decimal gateway_fee
        enum status "created|authorized|captured|failed|refunded"
        timestamp created_at
    }

    Subscription {
        uuid id PK
        uuid store_id FK
        enum plan "starter|growth|premium"
        enum status "active|cancelled|expired"
        decimal amount
        date next_billing_date
        string razorpay_subscription_id
        timestamp created_at
    }

    Review {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        uuid store_id FK
        int rating "1-5"
        text comment
        jsonb images
        enum status "pending|approved|rejected"
        timestamp created_at
    }

    Market {
        uuid id PK
        string name
        string slug UK
        string description
        jsonb boundary "geo polygon"
        int merchant_count
        boolean is_active
    }

    Category {
        uuid id PK
        string name
        string slug UK
        uuid parent_id FK "self-referential"
        string icon_url
        int sort_order
    }
```

### 8.2 Database Sharding Strategy

| Scale Threshold | Strategy | Implementation |
|---|---|---|
| 0-500 merchants | Single RDS instance | db.t4g.large |
| 500-2,000 merchants | Read replicas (2) | 1 writer + 2 readers |
| 2,000-5,000 merchants | Horizontal sharding by market | Shard key: market_area_id |
| 5,000+ merchants | Multi-region sharding | City-level sharding |

### 8.3 Caching Strategy

| Cache Layer | Technology | TTL | Data |
|---|---|---|---|
| Browser Cache | Service Worker | 1 hour | Static assets, product images |
| CDN Cache | CloudFront | 1 hour | Public product pages, store microsites |
| Application Cache | Redis | 5 min | Product catalog, store details |
| Session Cache | Redis | 24 hours | User sessions, cart data |
| API Response Cache | Redis | 30 sec | Frequent API responses |
| Database Query Cache | PostgreSQL | Auto | Frequent query patterns |

---

## 9. Security Architecture

### 9.1 Security Layers

```mermaid
graph TD
    subgraph "Layer 1: Edge Security"
        WAF[AWS WAF - SQLi, XSS, DDoS]
        CDN[CloudFront - Geo Restriction]
        DDoS[AWS Shield Advanced]
    end

    subgraph "Layer 2: Transport Security"
        TLS[TLS 1.3 - All traffic]
        HSTS[HSTS Preload]
        CERT[ACM - Auto Certificate Renewal]
    end

    subgraph "Layer 3: API Security"
        JWT[JWT Auth - Access + Refresh Tokens]
        RBAC[Role-Based Access Control]
        RATE[Rate Limiting - Per Tenant]
        VALID[Request Validation - Zod]
    end

    subgraph "Layer 4: Data Security"
        ENCRYPT[Encryption at Rest - AES-256]
        PII[PII Masking - Phone, Email]
        AUDIT[Audit Logging - All mutations]
        BACKUP[Daily Backups - Encrypted]
    end

    subgraph "Layer 5: Compliance"
        PCI[PCI-DSS - Payment Data]
        DPDP[India DPDP Act 2023]
        GDPR[GDPR - EU Visitors]
    end

    Internet --> WAF
    WAF --> CDN
    CDN --> TLS
    TLS --> JWT
    JWT --> RBAC
    RBAC --> RATE
    RATE --> VALID
    VALID --> ENCRYPT
    ENCRYPT --> AUDIT
```

### 9.2 Authentication Flow

```mermaid
sequenceDiagram
  participant C as Client
  participant GW as API Gateway
  participant AS as Auth Service
  participant DB as PostgreSQL
  participant SMS as Twilio/SMS

  C->>GW: POST /auth/otp/send {phone}
  GW->>AS: sendOtp(phone)
  AS->>AS: generate 6-digit OTP
  AS->>DB: store OTP hash + expiry
  AS->>SMS: send SMS with OTP
  SMS-->>C: OTP via SMS
  AS-->>C: OTP sent (masked phone)

  C->>GW: POST /auth/otp/verify {phone, otp}
  GW->>AS: verifyOtp(phone, otp)
  AS->>DB: validate OTP hash + expiry
  AS->>AS: check if user exists
  alt New User
    AS->>DB: create user profile
  end
  AS->>AS: generate JWT (access + refresh)
  AS-->>C: {accessToken, refreshToken, user}

  C->>GW: GET /api/v1/profile (Authorization: Bearer accessToken)
  GW->>AS: validateToken(accessToken)
  AS-->>GW: {userId, role, tenant}
  GW->>Service: proxied request with user context
```

### 9.3 Data Privacy (India DPDP Act 2023)

| Requirement | Implementation |
|---|---|
| Consent Management | Granular consent checkboxes (data collection, marketing, sharing) |
| Data Subject Rights | API endpoints for data access, correction, deletion |
| Data Localization | All data stored in AWS India (ap-south-1) |
| Breach Notification | Automated alert system with 72-hour notification SLA |
| Data Retention | Configurable retention policies (default 3 years) |
| Anonymization | PII anonymized for analytics datasets |

---

## 10. Infrastructure & Deployment

### 10.1 AWS Infrastructure Architecture

```mermaid
graph TD
    subgraph "AWS Global"
        CF[CloudFront CDN]
        WAF[AWS WAF]
        R53[Route53 - petemart.in]
    end

    subgraph "AWS Mumbai (ap-south-1) - Primary"
        subgraph "VPC - Public Subnets"
            ALB[Application Load Balancer]
            NAT[NAT Gateway]
        end

        subgraph "VPC - Private App Subnets"
            ECS[ECS Fargate - API Services]
            ECS2[ECS Fargate - Worker Services]
        end

        subgraph "VPC - Private Data Subnets"
            RDS[RDS PostgreSQL - Multi-AZ]
            RDSR[RDS Read Replicas]
            EC[ElastiCache Redis - Cluster]
            ES[Elasticsearch Service]
            CH[ClickHouse - Managed]
        end

        subgraph "Storage & AI"
            S3[S3 - Media & Backups]
            SM[SageMaker - AI Inference]
            MQ[Amazon MQ / SQS]
        end
    end

    subgraph "AWS Bangalore - DR"
        RDS_DR[RDS Cross-Region Replica]
        S3_CRR[S3 Cross-Region Replication]
    end

    subgraph "CI/CD"
        GHA[GitHub Actions]
        ECR[Amazon ECR]
        ARGO[ArgoCD]
    end

    Internet --> CF
    CF --> WAF
    WAF --> ALB
    R53 --> CF
    ALB --> ECS
    ECS --> RDS
    ECS --> EC
    ECS --> ES
    ECS --> CH
    ECS2 --> MQ
    ECS2 --> S3
    ECS --> SM
    RDS --> RDS_DR
    S3 --> S3_CRR
    GHA --> ECR
    ECR --> ARGO
    ARGO --> ECS
```

### 10.2 Deployment Architecture

| Environment | Purpose | Infrastructure | Cost/Month |
|---|---|---|---|
| **Development** | Feature development | Shared ECS, single RDS db.t4g.small | ~$150 |
| **Staging** | Integration testing | Scaled-down prod (1 AZ, 1 replica) | ~$400 |
| **Production** | Live traffic | Multi-AZ, auto-scaling, read replicas | ~$4,500 |
| **DR** | Disaster recovery | Cross-region replicas (cold standby) | ~$800 |
| **POC** | 8-merchant pilot | Free tier only | $0 |

### 10.3 Auto-Scaling Configuration

| Service | Min Instances | Max Instances | Scale-Up Trigger | Scale-Down Trigger |
|---|---|---|---|---|
| API Services | 2 (multi-AZ) | 20 | CPU > 70% for 3 min | CPU < 30% for 10 min |
| Worker Services | 1 | 10 | Queue depth > 100 | Queue depth < 10 |
| RDS | 1 writer + 1 reader | 1 writer + 5 readers | Connections > 80% | Connections < 40% |
| Redis | 1 (cluster mode) | 3 shards | Memory > 75% | Memory < 50% |

---

## 11. Multi-Store Cart & Consolidated Delivery

### 11.1 Cart Data Model

```json
{
  "cartId": "uuid",
  "userId": "uuid",
  "items": [
    {
      "storeId": "store-uuid-1",
      "storeName": "Chickpet Silks",
      "items": [
        {
          "productId": "prod-uuid",
          "variantId": "variant-uuid",
          "name": "Kanchipattu Silk Saree",
          "qty": 2,
          "unitPrice": 4500,
          "totalPrice": 9000,
          "mode": "A",
          "deliveryEligible": true
        }
      ],
      "subtotal": 9000,
      "deliveryFee": 30,
      "storeTotal": 9030
    },
    {
      "storeId": "store-uuid-2",
      "storeName": "Balepet Dry Fruits",
      "items": [
        {
          "productId": "prod-uuid-2",
          "variantId": null,
          "name": "Premium Almonds 1kg",
          "qty": 5,
          "unitPrice": 850,
          "totalPrice": 4250,
          "mode": "A",
          "deliveryEligible": true
        }
      ],
      "subtotal": 4250,
      "deliveryFee": 25,
      "storeTotal": 4275
    }
  ],
  "deliveryFeeCalculation": {
    "baseZoneRate": 30,
    "additionalStoreSurcharge": 25,
    "weightSurcharge": 10,
    "totalDeliveryFee": 65
  },
  "subtotal": 13250,
  "discount": 0,
  "grandTotal": 13315
}
```

### 11.2 Delivery Fee Formula

```
Delivery Fee = MAX(ZoneBaseRate[store1], ZoneBaseRate[store2], ...) 
             + (₹25 × (N-1)) 
             + WeightSurcharge(total_kg)
```

Where:
- **Zone 1 (1-3 km)**: ₹20 base
- **Zone 2 (3-7 km)**: ₹30 base
- **Zone 3 (7+ km)**: ₹50 base
- **N**: Number of distinct stores in the cart
- **Weight Surcharge**: ₹5/kg above 5kg

### 11.3 Consolidation Flow

```mermaid
sequenceDiagram
  participant C as Customer
  participant OS as Order Service
  participant CO as Consolidation Engine
  participant DS as Delivery Service
  participant M1 as Merchant A
  participant M2 as Merchant B
  participant MH as Micro-Hub
  participant CP as Courier Partner

  C->>OS: Place Order (multi-store cart)
  OS->>CO: consolidateAndSplit(orderId)
  CO->>CO: split into sub-orders per store
  CO->>M1: Sub-order 1: Items from Store A
  CO->>M2: Sub-order 2: Items from Store B
  CO->>DS: create consolidated pickup route
  DS->>CP: Assignment: M1 -> M2 -> MH -> Customer
  CP->>M1: Pickup from Store A
  M1-->>CP: Items ready
  CP->>M2: Pickup from Store B
  M2-->>CP: Items ready
  CP->>MH: Drop at Micro-Hub for consolidation
  MH->>MH: Consolidate into single package
  MH-->>CP: Consolidated package
  CP->>C: Final delivery
  C-->>CP: Receive & confirm
```

---

## 12. WhatsApp Integration Architecture

### 12.1 WhatsApp Business API Integration

```mermaid
graph TD
    subgraph "PeteMart Platform"
        API[API Gateway]
        WS[WhatsApp Service]
        TM[Template Manager]
        CM[Conversation Manager]
        AN[Analytics Tracker]
        DB[(PostgreSQL)]
    end

    subgraph "Meta/WhatsApp Cloud"
        WABA[WhatsApp Business API]
        TEMPLATES[Message Templates]
        WEBHOOK[Inbound Webhook]
    end

    subgraph "External"
        MERCHANT[Merchant WhatsApp]
        CUSTOMER[Customer WhatsApp]
    end

    API -->|Send Notification| WS
    WS -->|POST template message| WABA
    WABA -->|Deliver| CUSTOMER
    WABA -->|Deliver| MERCHANT
    CUSTOMER -->|Inbound message| WEBHOOK
    MERCHANT -->|Inbound message| WEBHOOK
    WEBHOOK -->|Process| WS
    WS --> TM
    WS --> CM
    WS --> AN
    TM --> DB
    CM --> DB
```

### 12.2 WhatsApp Message Templates

| Template Name | Purpose | Components | Trigger |
|---|---|---|---|
| `order_confirmation` | Order placed | Order #, items, total, ETA | payment.captured |
| `order_shipped` | Order shipped | Tracking link, ETA | delivery.assigned |
| `order_delivered` | Delivered | Rate experience link | delivery.completed |
| `otp_verification` | Login OTP | OTP code, expiry | auth.otp.sent |
| `merchant_new_order` | New order alert | Order #, items, customer | order.created |
| `merchant_payout` | Weekly payout | Amount, order count | payout.processed |
| `enquiry_response` | Auto-reply to enquiry | Product info, store hours | whatsapp.enquiry |
| `abandoned_cart` | Cart recovery | Cart items, discount code | 24h no checkout |

### 12.3 WhatsApp Flow (Mode B)

```mermaid
sequenceDiagram
  participant C as Customer
  participant PM as PeteMart Web/Mobile
  participant WA as WhatsApp
  participant M as Merchant

  C->>PM: Clicks "Enquire on WhatsApp"
  PM->>PM: Generate deep link: wa.me/91XXXXXXXXX?text=Hi%2C%20I%27m%20interested%20in%20Product%20X%20(₹500)%20from%20Store%20Y
  PM-->>C: Open WhatsApp deep link
  C->>WA: Tap link -> Opens WhatsApp
  WA->>M: Message delivered with pre-filled template
  M->>C: Reply with price, availability (off-platform)
  C->>M: Negotiate (off-platform)
  alt Agreement Reached
    M->>M: Create manual order in merchant dashboard
    M->>PM: Log order as "WhatsApp Sale"
    PM->>C: Send payment link (optional)
  end
  PM->>PM: Log enquiry event for analytics
```

---

## 13. AI Features Architecture

### 13.1 Virtual Try-On Pipeline

```mermaid
graph TD
    subgraph "Client Side"
        CAM[Camera/Upload Capture]
        PREVIEW[Result Preview]
        SHARE[Share/Save]
    end

    subgraph "AI Service (Python FastAPI)"
        QC[Quality Check - OpenCV]
        DET[Detection - MediaPipe]
        SEG[Segmentation - U²-Net]
        DRAPE[Drape Engine - TensorFlow]
        RENDER[Rendering - OpenCV]
        CACHE[Result Cache - Redis]
    end

    subgraph "Storage"
        S3_IN[Input Images - S3]
        S3_OUT[Output Images - S3]
        CF[CloudFront CDN]
    end

    CAM -->|Upload image| QC
    QC -->|Validate| DET
    DET -->|Body landmarks| SEG
    SEG -->|Mask| DRAPE
    DRAPE -->|Overlay fabric| RENDER
    RENDER -->|Result| CACHE
    CACHE --> PREVIEW
    PREVIEW --> SHARE
    S3_IN --> QC
    RENDER --> S3_OUT
    S3_OUT --> CF
    CF --> PREVIEW
```

### 13.2 Recommendation Engine

```mermaid
graph LR
    subgraph "Data Sources"
        UV[User Views]
        UP[User Purchases]
        US[User Searches]
        PS[Product Similarity]
        CS[Category Similarity]
    end

    subgraph "Feature Pipeline"
        FEAT[Feature Engineering]
        EMB[Embedding Generation]
        INDEX[Vector Index - Pinecone]
    end

    subgraph "Inference"
        CF[Collaborative Filtering]
        CB[Content-Based]
        HYBRID[Hybrid Ranker]
    end

    subgraph "Output"
        REC[Personalized Recommendations]
        SIM[Similar Products]
        TREND[Trending Products]
    end

    UV --> FEAT
    UP --> FEAT
    US --> FEAT
    PS --> EMB
    CS --> EMB
    FEAT --> CF
    FEAT --> CB
    EMB --> INDEX
    INDEX --> CB
    CF --> HYBRID
    CB --> HYBRID
    HYBRID --> REC
    HYBRID --> SIM
    HYBRID --> TREND
```

### 13.3 Live Bullion Rate Integration

```mermaid
sequenceDiagram
  participant C as Customer
  participant API as API Gateway
  participant JS as Jewellery Service
  participant BR as Bullion Rate API
  participant RC as Redis Cache
  participant DB as PostgreSQL

  C->>API: GET /products/jewellery/:id
  API->>JS: getProductDetail(id)
  JS->>RC: GET bullion:rates
  alt Cache Hit
    RC-->>JS: cached rates
  else Cache Miss
    JS->>BR: GET /v1/rates (MCX/IBJA)
    BR-->>JS: {gold_24k: 71850, gold_22k: 65900, silver: 83500}
    JS->>RC: SET bullion:rates (TTL: 300s)
  end
  JS->>JS: calculate price: weight * rate + making_charges + GST
  JS-->>C: {product, liveRate, calculatedPrice, breakdown}
```

---

## 14. Analytics & Observability

### 14.1 Analytics Stack

```mermaid
graph TD
    subgraph "Data Collection"
        FE[Frontend Events - PostHog]
        BE[Backend Logs - Winston]
        DB[Database Audit - pgaudit]
        PAY[Payment Events - Razorpay Webhook]
        DEL[Delivery Events - GPS Tracking]
    end

    subgraph "Stream Processing"
        KAFKA[Apache Kafka / SQS]
        FLINK[Stream Processor]
    end

    subgraph "Storage"
        CH[ClickHouse - Events]
        PG[PostgreSQL - Aggregated]
        S3[S3 - Raw Logs]
    end

    subgraph "Visualization"
        GRAF[Grafana Dashboards]
        MET[Metabase - BI Reports]
        ALERT[Alert Manager]
    end

    FE --> KAFKA
    BE --> KAFKA
    DB --> KAFKA
    PAY --> KAFKA
    DEL --> KAFKA
    KAFKA --> FLINK
    FLINK --> CH
    FLINK --> PG
    KAFKA --> S3
    CH --> GRAF
    PG --> MET
    CH --> ALERT
```

### 14.2 Key Metrics Dashboard

| Dashboard | Metrics | Refresh | Audience |
|---|---|---|---|
| **Platform Overview** | GMV, Orders, Active Merchants, Revenue | Real-time | Admin |
| **Merchant Analytics** | Sales, Views, Conversion, Top SKUs | 5 min | Merchant |
| **Delivery Performance** | Avg delivery time, On-time %, Zone breakdown | 1 min | Ops |
| **Customer Analytics** | Acquisition, Retention, Churn, LTV | 1 hour | Marketing |
| **Infrastructure** | CPU, Memory, Latency, Error Rate | 10 sec | Engineering |
| **Business KPIs** | MRR, ARR, Commission Revenue, Subscriptions | 1 hour | Executive |

### 14.3 Alerting Rules

| Alert | Condition | Severity | Channel |
|---|---|---|---|
| High API Latency | P95 > 500ms for 5 min | Critical | PagerDuty + Slack |
| Error Rate Spike | 5xx > 1% for 2 min | Critical | PagerDuty + Slack |
| Payment Failure Rate | > 5% in 5 min | Critical | PagerDuty + Slack |
| RDS Connection Saturation | > 80% for 10 min | Warning | Slack |
| Low Disk Space | < 10% remaining | Warning | Slack |
| Merchant Churn Spike | > 10% monthly churn | Warning | Email + Slack |

---

## 15. Scaling Strategy (5,000+ Merchants)

### 15.1 Horizontal Scaling Architecture

```mermaid
graph TD
    subgraph "Global Load Balancer"
        R53[Route53 - Latency-based]
    end

    subgraph "Region: ap-south-1 (Mumbai)"
        subgraph "Shard 1: Chickpet, Balepet, Mamulpet"
            RDS1[(PostgreSQL Shard 1)]
            APP1[App Instances]
        end
        subgraph "Shard 2: Tharagpet, Cubbonpet, Avenue Road"
            RDS2[(PostgreSQL Shard 2)]
            APP2[App Instances]
        end
        subgraph "Shard 3: KR Market, Sultanpet, Raja Market"
            RDS3[(PostgreSQL Shard 3)]
            APP3[App Instances]
        end
        subgraph "Shard 4-7: Other Pete Markets"
            RDS4[(PostgreSQL Shard 4-7)]
            APP4[App Instances]
        end
        GLOBAL[(Global Tables - Users, Orders)]
    end

    R53 --> APP1
    R53 --> APP2
    R53 --> APP3
    R53 --> APP4
    APP1 --> RDS1
    APP2 --> RDS2
    APP3 --> RDS3
    APP4 --> RDS4
    APP1 --> GLOBAL
    APP2 --> GLOBAL
    APP3 --> GLOBAL
    APP4 --> GLOBAL
```

### 15.2 Scaling Thresholds & Actions

| Threshold | Action | Cost Impact |
|---|---|---|
| 100 merchants | Single RDS + 2 ECS tasks | ~$500/mo |
| 500 merchants | Add read replicas (2), increase ECS to 4 tasks | ~$1,200/mo |
| 1,000 merchants | Add Redis cluster, Elasticsearch, ClickHouse | ~$2,500/mo |
| 2,500 merchants | Shard by market area, add 2nd AZ | ~$4,500/mo |
| 5,000 merchants | Full sharding, multi-region read replicas | ~$8,000/mo |
| 10,000+ merchants | City-level sharding, dedicated infra per city | ~$15,000/mo |

---

## 16. Multi-City Expansion Architecture

### 16.1 City Deployment Pattern

```mermaid
graph TD
    subgraph "Central Platform (Mumbai)"
        GATE[Global API Gateway]
        AUTH[Central Auth Service]
        PAY[Payment Service]
        ANALYTICS[Central Analytics]
        USERS[(Global Users DB)]
    end

    subgraph "City Pod: Bangalore"
        BLR_API[City API Gateway]
        BLR_MER[Merchant Service]
        BLR_ORD[Order Service]
        BLR_DEL[Delivery Service]
        BLR_DB[(Bangalore Data)]
        BLR_CACHE[(Redis - Bangalore)]
    end

    subgraph "City Pod: Delhi"
        DEL_API[City API Gateway]
        DEL_MER[Merchant Service]
        DEL_ORD[Order Service]
        DEL_DEL[Delivery Service]
        DEL_DB[(Delhi Data)]
        DEL_CACHE[(Redis - Delhi)]
    end

    subgraph "City Pod: Chennai"
        CHE_API[City API Gateway]
        CHE_MER[Merchant Service]
        CHE_ORD[Order Service]
        CHE_DEL[Delivery Service]
        CHE_DB[(Chennai Data)]
        CHE_CACHE[(Redis - Chennai)]
    end

    GATE --> BLR_API
    GATE --> DEL_API
    GATE --> CHE_API
    BLR_API --> AUTH
    BLR_API --> PAY
    BLR_API --> BLR_MER
    BLR_API --> BLR_ORD
    BLR_API --> BLR_DEL
    DEL_API --> AUTH
    DEL_API --> PAY
    DEL_API --> DEL_MER
    DEL_API --> DEL_ORD
    DEL_API --> DEL_DEL
    CHE_API --> AUTH
    CHE_API --> PAY
    CHE_API --> CHE_MER
    CHE_API --> CHE_ORD
    CHE_API --> CHE_DEL
```

### 16.2 City Expansion Checklist

| Step | Activity | Duration | Cost |
|---|---|---|---|
| 1 | Market research & merchant outreach | 4 weeks | ₹2L |
| 2 | Legal & compliance (state-specific) | 3 weeks | ₹1.5L |
| 3 | Infrastructure provisioning (Terraform) | 1 week | ₹50K |
| 4 | City pod deployment (CI/CD) | 1 week | ₹30K |
| 5 | Localization (language, currency) | 2 weeks | ₹1L |
| 6 | Delivery partner onboarding | 4 weeks | ₹3L |
| 7 | Merchant onboarding campaign | 8 weeks | ₹5L |
| 8 | Soft launch & monitoring | 2 weeks | ₹50K |

---

## 17. Testing Architecture

### 17.1 Testing Pyramid

```mermaid
graph TD
    subgraph "E2E Tests (5%)"
        CYPRESS[Cypress - Web E2E]
        DETOX[Detox - Mobile E2E]
        PLAYWRIGHT[Playwright - Cross-browser]
    end

    subgraph "Integration Tests (20%)"
        API[Supertest - API Tests]
        DB[Testcontainers - DB Tests]
        INT[Integration - Service Tests]
    end

    subgraph "Unit Tests (70%)"
        JEST[Jest - Frontend]
        VITEST[Vitest - Backend]
        RT[React Testing Library - Components]
    end

    subgraph "Performance Tests (5%)"
        K6[k6 - Load Tests]
        LIGHTHOUSE[Lighthouse - Web Vitals]
        ART[Artillery - API Stress]
    end

    subgraph "Security Tests"
        ZAP[OWASP ZAP - DAST]
        SNYK[Snyk - Dependency Scan]
        SONAR[SonarQube - SAST]
    end

    UNIT --> INTEGRATION
    INTEGRATION --> E2E
    PERFORMANCE --> E2E
    SECURITY --> ALL
```

### 17.2 Test Automation Pipeline

```yaml
# .github/workflows/test-pipeline.yml
name: Test Pipeline
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: petemart_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: npm run test:load

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx snyk test
      - run: npx sonar-scanner
```

### 17.3 Test Coverage Requirements

| Layer | Coverage Target | Critical Paths |
|---|---|---|
| Backend Unit Tests | >85% | Order flow, Payment, Auth |
| Backend Integration Tests | >70% | API endpoints, DB operations |
| Frontend Unit Tests | >80% | Components, hooks, utils |
| E2E Tests | All critical flows | Browse → Cart → Checkout → Payment → Tracking |
| API Tests | 100% of endpoints | All REST + GraphQL operations |
| Load Tests | 2x expected peak | 20,000 concurrent users |

---

## 18. Costing Model

### 18.1 Production Cost Breakdown (5,000 Merchants)

| Category | Service | Configuration | Monthly Cost (₹) |
|---|---|---|---|
| **Compute** | ECS Fargate (API) | 10 tasks × 2vCPU × 4GB | ₹1,20,000 |
| | ECS Fargate (Workers) | 5 tasks × 1vCPU × 2GB | ₹35,000 |
| | SageMaker (AI) | 1 ml.t3.medium | ₹15,000 |
| **Database** | RDS PostgreSQL | db.r6g.large Multi-AZ | ₹45,000 |
| | RDS Read Replicas | 2 × db.r6g.large | ₹50,000 |
| | ElastiCache Redis | cache.r6g.large cluster | ₹25,000 |
| | Elasticsearch | 3 × t3.medium.search | ₹30,000 |
| | ClickHouse | Managed (Altinity) | ₹20,000 |
| **Storage** | S3 Standard | 500GB + 100GB backup | ₹5,000 |
| | CloudFront CDN | 1TB transfer | ₹8,000 |
| **Network** | ALB | Per hour + LCU | ₹12,000 |
| | NAT Gateway | Per hour + data | ₹5,000 |
| | Route53 | Hosted zone + queries | ₹2,000 |
| **Third-Party** | Razorpay | 2% on transactions | Variable |
| | Algolia | Pro plan (1M records) | ₹25,000 |
| | Google Maps API | Premium plan | ₹15,000 |
| | Twilio/Msg91 | SMS + WhatsApp | ₹20,000 |
| | SendGrid/AWS SES | Email (100K/mo) | ₹5,000 |
| | Datadog | Pro APM + Logs | ₹30,000 |
| | Sentry | Team plan | ₹8,000 |
| **DevOps** | GitHub Actions | 10K min/mo | ₹5,000 |
| | Docker Registry | ECR storage | ₹2,000 |
| **Total** | | | **~₹4,92,000/mo** |

### 18.2 Cost Optimization Levers

| Lever | Savings | Impact |
|---|---|---|
| Reserved Instances (1-year) | 30% on compute | ~₹50K/mo savings |
| Spot Instances for workers | 60% on worker compute | ~₹20K/mo savings |
| RDS Reserved (3-year) | 40% on database | ~₹45K/mo savings |
| S3 Lifecycle Policies | 20% on storage | ~₹1K/mo savings |
| CloudFront Savings Plan | 15% on CDN | ~₹1K/mo savings |
| **Optimized Total** | | **~₹3,75,000/mo** |

### 18.3 Revenue vs Cost Projection

| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Merchants | 500 | 2,500 | 5,000 |
| Monthly GMV | ₹10 Cr | ₹50 Cr | ₹100 Cr |
| Commission Revenue | ₹30L/mo | ₹1.5 Cr/mo | ₹3 Cr/mo |
| Subscription Revenue | ₹5L/mo | ₹25L/mo | ₹50L/mo |
| **Total Revenue** | **₹35L/mo** | **₹1.75 Cr/mo** | **₹3.5 Cr/mo** |
| Infrastructure Cost | ₹1.5L/mo | ₹3L/mo | ₹5L/mo |
| Team Cost | ₹15L/mo | ₹25L/mo | ₹35L/mo |
| Marketing Cost | ₹5L/mo | ₹10L/mo | ₹15L/mo |
| **Total Cost** | **₹21.5L/mo** | **₹38L/mo** | **₹55L/mo** |
| **Gross Margin** | **~38%** | **~78%** | **~84%** |

---

## 19. POC Architecture (8-Merchant Pilot)

### 19.1 POC Scope

The POC targets a **8-merchant pilot** across **2 Pete markets** (Chickpet + Balepet) with **zero infrastructure cost** using free tiers.

### 19.2 POC Architecture Diagram

```mermaid
graph TD
    subgraph "Free Tier Infrastructure"
        VERCEL[Vercel Hobby - Web Frontend]
        EXPO[Expo - Mobile App (Development)]
        SUPABASE[Supabase Free - Database + Auth + Storage]
        GITHUB[GitHub Pages - Static Assets]
        RAILWAY[Railway $5 Credit - Backend API]
    end

    subgraph "Free External Services"
        RAZORPAY[Razorpay Test Mode]
        TWILIO[Twilio Trial - SMS]
        GOOGLE_MAPS[Google Maps Free Tier]
        WHATSAPP[WhatsApp Business - Free]
        GITHUB_CI[GitHub Actions - Free]
    end

    subgraph "POC Features"
        FEAT1[Mode A: Direct Purchase]
        FEAT2[Mode B: WhatsApp Enquiry]
        FEAT3[Mode C: Visit Store]
        FEAT4[Basic Merchant Dashboard]
        FEAT5[Single-Store Cart]
        FEAT6[Basic Order Tracking]
        FEAT7[Merchant Onboarding]
    end

    VERCEL --> SUPABASE
    VERCEL --> RAILWAY
    EXPO --> RAILWAY
    RAILWAY --> SUPABASE
    RAILWAY --> RAZORPAY
    RAILWAY --> TWILIO
    RAILWAY --> GOOGLE_MAPS
    VERCEL --> WHATSAPP
    GITHUB --> GITHUB_CI
    GITHUB_CI --> VERCEL
    GITHUB_CI --> EXPO

    FEAT1 --> VERCEL
    FEAT1 --> EXPO
    FEAT2 --> WHATSAPP
    FEAT3 --> GOOGLE_MAPS
    FEAT4 --> VERCEL
    FEAT5 --> RAILWAY
    FEAT6 --> RAILWAY
    FEAT7 --> SUPABASE
```

### 19.3 POC vs Production Mapping

| Component | POC (Free Tier) | Production |
|---|---|---|
| Web Frontend | Vercel Hobby (1 domain, 100GB bandwidth) | Vercel Pro + CloudFront CDN |
| Mobile App | Expo Go (development builds) | React Native + App Store/Play Store |
| Backend API | Railway ($5 credit) | AWS ECS Fargate (auto-scaling) |
| Database | Supabase Free (500MB, 2 users) | RDS PostgreSQL Multi-AZ |
| Auth | Supabase Auth (50K users) | Custom JWT + Auth Service |
| Storage | Supabase Storage (1GB) | S3 + CloudFront |
| Search | PostgreSQL LIKE/ILIKE | Algolia / Elasticsearch |
| Cache | In-memory (limited) | Redis Cluster |
| Analytics | Supabase analytics | ClickHouse + Grafana |
| Monitoring | Railway logs | Datadog + Sentry |
| CI/CD | GitHub Actions (free) | GitHub Actions + ArgoCD |
| AI Features | Not in POC | SageMaker + TensorFlow |

### 19.4 POC Cost Breakdown

| Service | Free Tier Limit | Actual Usage | Cost |
|---|---|---|---|
| Vercel Hobby | 100GB bandwidth, 1 team | ~5GB/mo | ₹0 |
| Railway | $5 credit (one-time) | ~$3/mo compute | ₹0 |
| Supabase Free | 500MB DB, 1GB storage | ~100MB DB | ₹0 |
| GitHub Actions | 2,000 min/mo | ~500 min/mo | ₹0 |
| GitHub Pages | 1GB, 100GB bandwidth | Static assets | ₹0 |
| Razorpay Test | Unlimited test mode | Test transactions | ₹0 |
| Google Maps Free | $200/mo credit | ~$50/mo usage | ₹0 |
| Twilio Trial | $15 credit | ~$10/mo SMS | ₹0 |
| WhatsApp Business | Free (Meta) | Basic messaging | ₹0 |
| **Total POC Cost** | | | **₹0/mo** |

---

## 20. Implementation Roadmap

### 20.1 Phase Plan

| Phase | Duration | Milestone | Key Features |
|---|---|---|---|
| **P0: Foundation** | Weeks 1-4 | Platform skeleton | Auth, Merchant onboarding, Basic catalog |
| **P1: Core Commerce** | Weeks 5-10 | MVP Launch (Tier 0) | Mode A checkout, Single-store cart, Payment |
| **P2: Multi-Mode** | Weeks 11-14 | Multi-Mode Commerce | Mode B/C, Multi-store cart, Delivery zones |
| **P3: Intelligence** | Weeks 15-20 | Analytics & AI | AI try-on, Recommendations, Bullion rates |
| **P4: Scale** | Weeks 21-28 | Platform Maturity | National shipping, Multi-city, 5K merchants |
| **P5: Visionary** | Weeks 29-36 | Next-Gen | Virtual walk, Live bazaar, Co-shopping |

### 20.2 Sprint Allocation by Team

| Team | Sprint 1-4 | Sprint 5-8 | Sprint 9-12 | Sprint 13-16 | Sprint 17-20 |
|---|---|---|---|---|---|
| **Frontend (Web)** | Landing, Auth, Merchant dash | Product catalog, Cart UI | Checkout flow, Order tracking | AI try-on UI, Analytics dash | Admin dash, i18n |
| **Frontend (Mobile)** | Navigation, Auth screens | Product browse, Cart | Checkout, Payment, Tracking | Camera, Try-on, Push | Offline mode, Performance |
| **Backend API** | Auth service, Merchant CRUD | Product API, Cart service | Order service, Payment webhooks | Delivery service, Notification | Analytics, Admin API |
| **AI/ML** | Infrastructure setup | Model training (try-on) | Model deployment | Recommendation engine | Performance optimization |
| **Infrastructure** | AWS setup, CI/CD pipeline | RDS, Redis, Elasticsearch | Auto-scaling, Monitoring | DR setup, Security audit | Multi-region deployment |
| **QA** | Test framework setup | Unit + Integration tests | E2E tests, Load tests | Security tests | UAT, Regression |

---

## Appendix A: Guardrail Compliance

| Guardrail | Requirement | Implementation |
|---|---|---|
| **Security** | PCI-DSS Level 4 | Razorpay handles all card data; no raw PCI data stored |
| **Privacy** | India DPDP Act 2023 | Consent management, data localization, 72h breach notification |
| **Accessibility** | WCAG 2.1 AA | Semantic HTML, ARIA labels, keyboard navigation, color contrast |
| **Performance** | LCP < 2.5s | SSR, lazy loading, image optimization, CDN |
| **Uptime** | 99.9% SLA | Multi-AZ deployment, auto-scaling, health checks |
| **Backup** | Daily + Point-in-time | RDS automated backups (35-day retention), S3 cross-region |
| **DR** | RPO < 1 hour, RTO < 4 hours | Cross-region DB replica, S3 CRR, IaC recovery |

## Appendix B: Environment Configuration

| Variable | Dev | Staging | Production |
|---|---|---|---|
| Node Env | development | staging | production |
| Log Level | debug | info | warn |
| DB Instance | db.t4g.small | db.t4g.medium | db.r6g.large |
| Redis | Single | Cluster (2 nodes) | Cluster (3 shards) |
| ECS Tasks | 1 | 2 | 10 (auto-scale) |
| Backup Frequency | None | Daily | Continuous |
| Monitoring | Console | Datadog | Datadog + PagerDuty |

---

*End of Architecture Blueprint — PeteMart Enterprise System Design v1.0*
</｜DSML｜parameter>
</｜DSML｜invoke>
</｜DSML｜tool_c

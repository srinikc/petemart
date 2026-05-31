# PeteMart — Architecture Diagrams

**Generated:** 2026-05-30 | **Tooling:** Mermaid.js + PlantUML | **Source:** Open-source, embeddable

---

## 1. System Context Diagram (C4 Level 1)

> Diagram type: `mermaid` — C4 System Context
> Shows: PeteMart platform interacting with 5 user types and 5 external systems

```mermaid
C4Context
  title System Context diagram for PeteMart Hyperlocal Commerce Platform

  Person(customer, "Customer / B2B Buyer", "End-user browsing and purchasing from Pete merchants via Web, Mobile, or WhatsApp")
  Person(merchant, "Pete Merchant", "Physical store owner managing their digital storefront")
  Person(delivery, "Delivery Partner", "Courier partner handling pickups and deliveries")
  Person(admin, "Platform Admin", "PeteMart operator managing merchants, orders, and platform config")
  Person(stitch_designer, "UI Designer (Agent 07a)", "Uses Google Stitch to generate UI screens programmatically")

  System_Boundary(petemart, "PeteMart Platform") {
    System(web_app, "Web Application", "Next.js 15 + shadcn/ui — Customer Marketplace, Merchant Dashboard, Admin Console")
    System(mobile_app, "Mobile Application", "Expo React Native — Customer App (iOS/Android)")
    System(courier_app, "Courier App", "Expo React Native — Delivery Partner App")
    System(backend, "Backend Services", "Supabase (Postgres + Auth + Storage + Realtime) + Edge Functions + Next.js API")
  }

  System_Ext(razorpay, "Razorpay", "Payment Gateway — Checkout, Subaccounts, Route API")
  System_Ext(whatsapp, "WhatsApp Business API", "Deep links, message templates, click tracking")
  System_Ext(google_maps, "Google Maps Platform", "Geocoding, Directions, Distance Matrix, Maps Embed")
  System_Ext(gemini, "Google Gemini API", "AI/ML — Virtual Try-On, Review Moderation, Search")
  System_Ext(shiprocket, "ShipRocket", "Pan-India shipping — Labels, Tracking, COD")
  System_Ext(bullion_api, "Bullion Rate API", "Live gold/silver rates from IBJA/MCX")
  System_Ext(stitch, "Google Stitch", "AI-powered UI generation tool — MCP SDK integration")

  Rel(customer, web_app, "Browses, orders, tracks via HTTPS")
  Rel(customer, mobile_app, "Browses, orders, scans QR via HTTPS")
  Rel(customer, whatsapp, "Enquires about products")
  Rel(merchant, web_app, "Manages catalog and orders")
  Rel(delivery, courier_app, "Receives pickup routes, updates status")
  Rel(admin, web_app, "Approves merchants, monitors platform")
  Rel(stitch_designer, stitch, "Generates UI screens programmatically via @google/stitch-sdk")

  Rel(web_app, backend, "REST API calls /api/v1/*")
  Rel(mobile_app, backend, "REST API calls /api/v1/*")
  Rel(courier_app, backend, "REST API + WebSocket (Supabase Realtime)")
  Rel(backend, razorpay, "Payment processing + settlement via Razorpay API")
  Rel(backend, whatsapp, "Deep link generation + click tracking")
  Rel(backend, google_maps, "Geocoding + distance matrix + maps embed")
  Rel(backend, gemini, "AI inference for try-on + moderation")
  Rel(backend, shiprocket, "Shipping label generation + tracking")
  Rel(backend, bullion_api, "Fetch live gold/silver rates")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

**Alternative Mermaid.js C4-style block diagram (more readable in docs):**

```mermaid
graph TB
    subgraph "External Actors"
        C[Customer / B2B Buyer]
        M[Pete Merchant]
        D[Delivery Partner]
        A[Platform Admin]
        S[UI Designer / Agent 07a]
    end

    subgraph "PeteMart Platform"
        subgraph "Frontend"
            WEB[Web App<br/>Next.js + shadcn/ui]
            MOB[Mobile App<br/>Expo React Native]
            COU[Courier App<br/>Expo React Native]
        end
        subgraph "Backend"
            API[API Gateway<br/>Vercel + Next.js API]
            SUP[Supabase<br/>PostgreSQL + Auth + Storage + Realtime]
        end
    end

    subgraph "External Systems"
        RZ[Razorpay]
        WA[WhatsApp Business API]
        GM[Google Maps]
        GE[Google Gemini AI]
        SR[ShipRocket]
        BA[Bullion Rate API]
        ST[Google Stitch]
    end

    C -->|Browse, Order| WEB
    C -->|Browse, QR| MOB
    C -->|Enquire| WA
    M -->|Manage Store| WEB
    D -->|Pickup, Deliver| COU
    A -->|Admin| WEB
    S -->|Generate UI| ST

    WEB -->|REST API| API
    MOB -->|REST API| API
    COU -->|REST + WS| API
    API -->|Queries| SUP

    API -->|Payments| RZ
    API -->|Deep Links| WA
    API -->|Geocode| GM
    API -->|AI Inference| GE
    API -->|Shipping| SR
    API -->|Rates| BA
    ST -->|DESIGN.md, React| WEB
```

---

## 2. Container Diagram (C4 Level 2)

> Diagram type: `mermaid` — Container decomposition
> Shows: All containers within PeteMart with technology stack and interactions

```mermaid
graph TB
    subgraph "PeteMart Platform Containers"
        subgraph "Presentation Layer"
            NEXTJS["Next.js 15 App<br/>shadcn/ui + Tailwind<br/>Vercel Hobby"]
            EXPO["Expo React Native App<br/>NativeWind + Tamagui<br/>Expo Go / EAS"]
            COURIER["Courier Expo App<br/>React Native<br/>Expo Go"]
            STITCH_DESIGN["Google Stitch<br/>stitch.withgoogle.com<br/>@google/stitch-sdk"]
        end

        subgraph "API Layer"
            API_GW["API Gateway<br/>Next.js Middleware<br/>Rate Limiting + Auth + CORS"]
            ROUTES["API Routes<br/>/api/v1/*<br/>Product, Order, Cart etc."]
            EDGE_FN["Supabase Edge Functions<br/>Deno Runtime<br/>Delivery, Payment, AI"]
        end

        subgraph "Data Layer"
            PG["Supabase PostgreSQL<br/>35 Tables<br/>RLS + Indexes"]
            REDIS["Redis Cache<br/>Upstash Free<br/>Products, Sessions, Rates"]
            STORAGE["Supabase Storage<br/>S3-compatible<br/>Images, Media"]
            REALTIME["Supabase Realtime<br/>WebSocket<br/>Order Tracking, GPS"]
        end

        subgraph "External Integrations"
            RAZORPAY["Razorpay<br/>Checkout + Route API"]
            WHATSAPP["WhatsApp Business<br/>Cloud API"]
            GOOGLE_MAPS["Google Maps<br/>Geocode + Matrix"]
            GEMINI["Gemini AI<br/>Vision + NLP"]
            BULLION["Bullion API<br/>IBJA/MCX"]
            SHIPROCKET["ShipRocket<br/>Shipping API"]
        end
    end

    NEXTJS -->|Server Actions| API_GW
    EXPO -->|HTTPS| API_GW
    COURIER -->|HTTPS + WS| API_GW
    STITCH_DESIGN -->|.tsx + DESIGN.md| NEXTJS

    API_GW -->|Auth Check| EDGE_FN
    API_GW -->|Route| ROUTES
    ROUTES -->|CRUD| PG
    ROUTES -->|Cache| REDIS
    ROUTES -->|Files| STORAGE
    EDGE_FN -->|DB Ops| PG
    EDGE_FN -->|WebSocket| REALTIME

    ROUTES -->|Payment| RAZORPAY
    ROUTES -->|Deep Link| WHATSAPP
    ROUTES -->|Geo| GOOGLE_MAPS
    EDGE_FN -->|AI| GEMINI
    EDGE_FN -->|Rates| BULLION
    EDGE_FN -->|Labels| SHIPROCKET

    classDef presentation fill:#e1f5fe,stroke:#0288d1
    classDef api fill:#f3e5f5,stroke:#7b1fa2
    classDef data fill:#e8f5e9,stroke:#2e7d32
    classDef external fill:#fff3e0,stroke:#e65100
    classDef design fill:#fce4ec,stroke:#c62828

    class NEXTJS,EXPO,COURIER presentation
    class API_GW,ROUTES,EDGE_FN api
    class PG,REDIS,STORAGE,REALTIME data
    class RAZORPAY,WHATSAPP,GOOGLE_MAPS,GEMINI,BULLION,SHIPROCKET external
    class STITCH_DESIGN design
```

---

## 3. Data Flow Diagram — Order Lifecycle (End-to-End)

> Diagram type: `mermaid` — Sequence diagram
> Shows: Full order lifecycle from browse to delivery for Mode A (Direct Purchase)

```mermaid
sequenceDiagram
    participant C as Customer
    participant W as Web/Mobile Frontend
    participant A as API Gateway
    participant P as Product Service
    participant O as Order Service
    participant D as Delivery Service
    participant PY as Payment Service
    participant RZ as Razorpay
    participant N as Notification Service
    participant CR as Courier App

    Note over C,CR: MODE A — Direct Purchase Flow

    C->>W: Browse products
    W->>A: GET /api/v1/products?market=Chickpet
    A->>P: Query products
    P-->>A: Product list (JSON)
    A-->>W: Products with mode badges
    W-->>C: Display product grid

    C->>W: Add to Cart (3 items from 2 merchants)
    W->>A: POST /api/v1/cart/add
    A->>O: Validate + store cart item
    O-->>A: Cart updated
    A-->>W: Cart badge count + delivery estimate

    C->>W: Proceed to Checkout
    W->>A: POST /api/v1/checkout/calculate
    A->>D: Calculate delivery fee
    D->>D: Zone calc + weight + consolidation (₹25 × 1 extra store)
    D-->>A: Fee breakdown
    A-->>W: Order summary with fee details

    C->>W: Place Order (Razorpay)
    W->>A: POST /api/v1/checkout/place
    A->>PY: Create Razorpay order
    PY->>RZ: razorpay.orders.create()
    RZ-->>PY: order_id + payment link
    PY-->>A: Payment initialization
    A-->>W: Redirect to Razorpay checkout

    C->>RZ: Complete UPI/Card payment
    RZ-->>PY: Webhook: payment.captured
    PY->>PY: Verify signature + amount
    PY->>O: Update order status to CONFIRMED
    O->>O: Split order by merchant (consolidation_id)
    O->>N: Trigger notifications
    N->>C: SMS/Email: "Order Confirmed"
    N->>CR: Push: "New pickup available"

    O->>D: Assign courier (zone-based)
    D-->>CR: Pickup route: Merchant A → Merchant B → Micro-Hub
    CR->>CR: GPS location broadcast (30s intervals)
    CR->>CR: Status updates (Picked Up, Consolidated, In Transit)

    CR->>C: Delivery completed
    CR->>O: Update status to DELIVERED
    O->>D: Start settlement timer (T+3)
    D->>N: Notify customer
    N->>C: Push: "Order delivered! Rate your experience"

    Note over O,PY: Settlement (T+3 days later)
    O->>PY: Trigger payout calculation
    PY->>RZ: Razorpay Route API transfer
    RZ-->>PY: Settlement to merchant bank
    O->>N: Notify merchant of settlement
```

**Alternative Data Flow Diagram (PlantUML style in Mermaid):**

```mermaid
flowchart TD
    subgraph "Customer Journey"
        A1[Browse Products] --> A2[Add to Cart]
        A2 --> A3[Proceed to Checkout]
        A3 --> A4[Enter Address]
        A4 --> A5[Apply Coupon]
        A5 --> A6[Place Order]
        A6 --> A7[Pay via Razorpay]
    end

    subgraph "Backend Processing"
        B1[Validate Cart] --> B2[Calculate Delivery Fee]
        B2 --> B3[Create Order Records]
        B3 --> B4[Split by Merchant]
        B4 --> B5[Send Notifications]
        B5 --> B6[Assign Courier]
        B6 --> B7[Track Delivery]
        B7 --> B8[Process Settlement]
    end

    subgraph "Database State Changes"
        D1[cart_items: ACTIVE] --> D2[orders: PENDING]
        D2 --> D3[payments: CAPTURED]
        D3 --> D4[orders: CONFIRMED]
        D4 --> D5[orders: PACKING]
        D5 --> D6[orders: PICKED_UP]
        D6 --> D7[orders: IN_TRANSIT]
        D7 --> D8[orders: DELIVERED]
        D8 --> D9[payouts: SETTLED]
    end

    A6 --> B1
    A7 --> B3
    B1 --> D1
    B3 --> D2
    B5 --> D4
    B6 --> D5
    B7 --> D7
    B8 --> D9
```

---

## 4. Deployment Diagram

> Diagram type: `mermaid` — Deployment topology (FREE TIER)
> Shows: Zero-cost deployment across Vercel Hobby + Supabase Free + Railway + GitHub Pages

```mermaid
graph TB
    subgraph "Internet"
        DNS["DNS: petemart-poc.vercel.app"]
    end

    subgraph "Vercel Hobby (FREE)"
        CDN["Vercel Edge Network<br/>Global CDN"]
        NEXT["Next.js 15 App<br/>• Customer Pages (/) <br/>• Merchant Dashboard (/merchant)<br/>• Admin Console (/admin)<br/>• API Routes (/api/v1/*)<br/>• Edge Functions"]
        SW["Service Worker<br/>PWA + Offline Cache"]
        ANALYTICS["Vercel Analytics<br/>Web Vitals + Speed Insights"]
    end

    subgraph "Supabase Free (FREE)"
        PG["PostgreSQL 15<br/>500MB Database<br/>35 Tables + RLS"]
        AUTH["Supabase Auth<br/>Phone OTP + JWT<br/>50K Users"]
        STORAGE["Supabase Storage<br/>1GB + Image CDN<br/>RLS Buckets"]
        REALTIME["Supabase Realtime<br/>200 Concurrent<br/>WebSocket Channels"]
        EDGE["Edge Functions<br/>Deno Runtime<br/>500K Invocations/mo"]
    end

    subgraph "Railway (FREE — $5 Credit)"
        CRON["Cron Jobs<br/>• Bullion Rate Fetcher<br/>• Session Cleanup"]
        WORKER["Background Workers<br/>• Email Queue<br/>• Analytics Aggregation"]
    end

    subgraph "External Services (FREE TIERS)"
        RZ["Razorpay<br/>Test Mode"]
        WA["WhatsApp<br/>Business API<br/>Free: 1K Conversations"]
        GM["Google Maps<br/>$200 Monthly Credit<br/>Then Pay-as-you-go"]
        GE["Google Gemini<br/>Free: 60 req/min<br/>1,500/day"]
        BA["Bullion API<br/>Free Tier"]
        GH["GitHub Pages<br/>Static Docs<br/>petemart.github.io"]
    end

    subgraph "Development Tools"
        STITCH["Google Stitch<br/>stitch.withgoogle.com<br/>550 Free Generations/mo"]
        GIT["GitHub<br/>Actions CI<br/>Source Control"]
    end

    DNS --> CDN
    CDN --> NEXT
    CDN --> SW
    NEXT -->|Database| PG
    NEXT -->|Auth| AUTH
    NEXT -->|Files| STORAGE
    NEXT -->|WebSocket| REALTIME
    NEXT -->|Serverless| EDGE

    NEXT -->|Payments| RZ
    NEXT -->|WhatsApp Deep Links| WA
    NEXT -->|Geocoding + Directions| GM
    EDGE -->|AI Inference| GE
    EDGE -->|Live Rates| BA
    CRON -->|Scheduled Tasks| EDGE

    GIT -->|git push → auto-deploy| NEXT
    STITCH -->|.tsx + DESIGN.md| NEXT

    NEXT -.->|Error Tracking| SENTRY((Sentry Free<br/>5K Errors/mo))
    NEXT -.->|Uptime| BETTERSTACK((Better Stack<br/>Free Pinger))

    classDef free fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    classDef external fill:#fff3e0,stroke:#e65100,color:#bf360c
    classDef tool fill:#e1f5fe,stroke:#0288d1,color:#01579b

    class CDN,NEXT,SW,ANALYTICS,PG,AUTH,STORAGE,REALTIME,EDGE free
    class RZ,WA,GM,GE,BA,GH,SENTRY,BETTERSTACK external
    class STITCH,GIT tool
```

---

## 5. POC Scope Diagram

> Diagram type: `mermaid` — POC vs Production scope
> Shows: Which containers/components are built in POC (green) vs deferred (grey)

```mermaid
graph TB
    subgraph "PeteMart POC Scope — 8 Merchant Pilot"
        subgraph "BUILT in POC (48 Requirements)"
            POC_WEB["✅ Web Frontend<br/>Next.js + shadcn/ui<br/>20 Stitch-generated screens"]
            POC_API["✅ API Routes<br/>15 Core Endpoints<br/>Rate Limited"]
            POC_AUTH["✅ Auth (Phone OTP)<br/>Supabase Auth"]
            POC_PRODUCT["✅ Product Catalog<br/>PgFTS Search<br/>8 Merchant Seed Data"]
            POC_CART["✅ Multi-Store Cart<br/>Checkout Flow<br/>Delivery Calc"]
            POC_PAY["✅ Razorpay Test<br/>Payment Mock<br/>Basic Webhooks"]
            POC_MERCHANT["✅ Merchant Dashboard<br/>Catalog + Orders<br/>Basic Analytics"]
            POC_ADMIN["✅ Admin Console<br/>Merchant Approval<br/>Order Monitor"]
            POC_WA["✅ WhatsApp Deep Link<br/>Click Tracking"]
            POC_MAPS["✅ Google Maps<br/>Directions + Geocode"]
            POC_DB["✅ PostgreSQL Schema<br/>15 Core Tables<br/>RLS Enabled"]
            POC_ORDER["✅ Order Engine<br/>Basic State Machine<br/>Courier Assignment"]
            POC_CACHE["✅ In-Memory Cache<br/>Basic Performance"]
            POC_STITCH["✅ Google Stitch<br/>UI Generation Pipeline"]
        end

        subgraph "DEFERRED to Post-POC (55 Requirements)"
            DEF_IOS["⏳ Native iOS App<br/>→ Use Expo Go/PWA Instead"]
            DEF_ANDROID["⏳ Native Android App<br/>→ Use Expo Go/PWA Instead"]
            DEF_I18N["⏳ Multi-Language i18n<br/>→ English Only for POC"]
            DEF_AI["⏳ AI Virtual Try-On<br/>→ Tier 3 Feature"]
            DEF_JEWEL["⏳ Jewellery Bullion Rates<br/>→ Tier 3 Feature"]
            DEF_REVIEW["⏳ Review & Rating System<br/>→ Tier 2 Feature"]
            DEF_WHITE["⏳ White-Label Engine<br/>→ Tier 3 Feature"]
            DEF_SHIP["⏳ ShipRocket Shipping<br/>→ Tier 2 Feature"]
            DEF_SUB["⏳ Subscription Engine<br/>→ Tier 1 Feature"]
            DEF_PROMO["⏳ Coupon/Promo Engine<br/>→ Tier 2 Feature"]
            DEF_ANALYTICS["⏳ Full Analytics Pipeline<br/>→ Tier 2 Feature"]
            DEF_FEATURE["⏳ Feature Flag Dashboard<br/>→ Tier 1 Feature"]
            DEF_CI["⏳ CI/CD Pipeline<br/>→ Manual Deploy for POC"]
            DEF_DR["⏳ Disaster Recovery<br/>→ Supabase Backups"]
            DEF_VISION["⏳ Virtual Walk / Live Bazaar / Co-Shopping<br/>→ Tier 4 Visionary"]
        end
    end

    POC_DB --- DEF_IOS
    POC_WEB --- DEF_ANDROID

    classDef built fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    classDef deferred fill:#f5f5f5,stroke:#9e9e9e,color:#616161,stroke-dasharray: 5 5

    class POC_WEB,POC_API,POC_AUTH,POC_PRODUCT,POC_CART,POC_PAY,POC_MERCHANT,POC_ADMIN,POC_WA,POC_MAPS,POC_DB,POC_ORDER,POC_CACHE,POC_STITCH built
    class DEF_IOS,DEF_ANDROID,DEF_I18N,DEF_AI,DEF_JEWEL,DEF_REVIEW,DEF_WHITE,DEF_SHIP,DEF_SUB,DEF_PROMO,DEF_ANALYTICS,DEF_FEATURE,DEF_CI,DEF_DR,DEF_VISION deferred
```

---

## 6. Additional Diagrams

### 6.1 Google Stitch Integration Pipeline

```mermaid
graph LR
    subgraph "UI Agent (07a) Pipeline"
        PROMPT["Natural Language<br/>Prompts"] --> STITCH["Google Stitch<br/>@google/stitch-sdk"]
        STITCH --> GEN["stitch.generate()"]
        STITCH --> DESIGN["stitch.design()"]
        STITCH --> EXPORT["stitch.export()"]
    end

    subgraph "Outputs"
        GEN --> REACT["React .tsx Components<br/>30+ Screens"]
        DESIGN --> TOKENS["DESIGN.md<br/>Design Tokens"]
        EXPORT --> HTML["HTML/CSS<br/>Fallback"]
        EXPORT --> SCREENSHOTS["Screenshots<br/>PNG Review"]
        EXPORT --> ACCESS["Accessibility<br/>Audit Report"]
    end

    subgraph "Consumed By"
        REACT --> DEV[Agent 07a/07d<br/>Integration & UI Dev]
        TOKENS --> STYLES["Tailwind Config<br/>shadcn/ui Theme"]
        SCREENSHOTS --> REVIEW["Human Review<br/>Gate Check"]
    end

    classDef stitch fill:#fce4ec,stroke:#c62828,color:#4a0000
    classDef output fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    classDef consumer fill:#e1f5fe,stroke:#0288d1,color:#01579b

    class STITCH,GEN,DESIGN,EXPORT stitch
    class REACT,TOKENS,HTML,SCREENSHOTS,ACCESS output
    class DEV,STYLES,REVIEW consumer
```

### 6.2 WhatsApp Integration Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant W as Web/Mobile UI
    participant API as WhatsApp API
    participant WA as WhatsApp App
    participant M as Merchant
    participant LOG as Analytics Log

    C->>W: Clicks "Enquire on WhatsApp" on product
    W->>API: GET /api/v1/whatsapp/deeplink?product=X&merchant=Y
    API->>API: Generate wa.me URL with product + merchant context
    API-->>W: Deep link URL + click event logged
    API->>LOG: INSERT into whatsapp_click_log

    W->>WA: window.open("https://wa.me/9199...?text=Hi...")
    Note over WA: WhatsApp opens with pre-filled message
    WA->>M: Customer enquiry delivered

    Note over C,M: Off-platform negotiation happens here

    M->>WA: Send quote / product details
    C->>WA: Accept quote
    M->>M: Create manual order in merchant dashboard (optional)

    Note over API,LOG: Analytics (later)
    LOG->>LOG: Increment merchant's WhatsApp enquiry counter
```

### 6.3 Consolidated Delivery Flow

```mermaid
flowchart TD
    subgraph "Multi-Store Order"
        C[Customer places order<br/>Items from 3 merchants]
    end

    subgraph "Pickup Phase"
        C1[Courier reaches<br/>Merchant A<br/>Chickpet]
        C2[Courier reaches<br/>Merchant B<br/>Chickpet]
        C3[Courier reaches<br/>Merchant C<br/>Raja Market]
    end

    subgraph "Consolidation Phase"
        HUB[Micro-Hub<br/>Chickpet Central]
        PACK[Items consolidated<br/>into single package]
    end

    subgraph "Delivery Phase"
        LAST[Last-mile delivery<br/>to Customer]
    end

    subgraph "Fee Calculation"
        FEE["Delivery Fee = MAX(Zone Rate) + (₹25 × (N-1)) + Weight Surcharge<br/>Example: 3 merchants, Zone 2 → ₹70 + (₹25 × 2) + ₹10 = ₹130"]
    end

    C --> C1
    C --> C2
    C --> C3
    C1 --> HUB
    C2 --> HUB
    C3 --> HUB
    HUB --> PACK
    PACK --> LAST
    C -.->|Triggers| FEE
```

---

## 7. Component Relationship Matrix

| Frontend Screen | Backend Service | Database Table | External Integration | Google Stitch? |
|---|---|---|---|---|
| Landing Page | Product Service, Merchant Service | markets, merchants | — | ✅ Yes |
| Product Search | Search Engine (PgFTS) | products | — | ✅ Yes |
| Product Detail | Product Service | products, product_variants | — | ✅ Yes |
| Cart | Cart Service | cart_items | — | ✅ Yes |
| Checkout | Order Service, Payment Service | orders, order_items | Razorpay | ✅ Yes |
| Order Tracking | Order Service, Realtime | orders, order_status_log | Google Maps (GPS) | ✅ Yes |
| Merchant Microsite | Merchant Service, Product Service | merchants, products | WhatsApp (deep link) | ✅ Yes |
| Merchant Dashboard | Merchant Service, Analytics | merchants, orders, payouts | — | ✅ Yes |
| Admin Console | Admin Service, Analytics | merchants, orders, config | — | ✅ Yes |
| AI Try-On | AI Service (Gemini) | try_on_cache | Google Gemini | ❌ (Custom) |
| Jewellery w/ Bullion | Bullion Service | jewellery_details, bullion_rates | Bullion API | ❌ (Custom) |
| Review System | Review Service | reviews, review_moderation | — | ✅ Yes |
| Courier App | Delivery Service, Realtime | courier_routes, courier_gps_log | Google Maps (Nav) | ❌ (Custom) |
| Virtual Walk | Virtual Street CMS | virtual_storefronts | — | ❌ (Custom) |
| Configuration UI | Config Service | feature_flags, dynamic_config | — | ✅ Yes |

---

*End of DIAGRAMS.md — All diagrams are open-source (Mermaid.js) and can be rendered in any Mermaid-compatible viewer (GitHub, Notion, Mermaid Live Editor)*

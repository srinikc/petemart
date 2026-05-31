# PeteMart — POC Architecture & Scope Document

**Version:** 1.0 | **Date:** 2026-05-30 | **Target:** 8 Merchant Pilot | **Cost:** ₹0/month

---

## 1. Executive Summary

The PeteMart POC targets **9 merchants** (8 unique + 1 branch) across **Chickpet and Balepet** markets in Old Bangalore. Built entirely on **free tiers** (Supabase Free, Vercel Hobby, Railway $5 credit, Expo Go, GitHub Pages), the POC delivers **48 of 103 total requirements (47%)** — covering all **P0-Critical** features needed to demonstrate the core three-mode interaction framework.

**POC Duration:** 6–8 weeks | **Team:** 2–3 developers | **Total Cost: ₹0/month**

---

## 2. POC Tech Stack (₹0/month)

| Layer | Technology | Free Tier Limits | POC Usage |
|---|---|---|---|
| **UI Design** | Google Stitch (stitch.withgoogle.com) | 350 std + 200 pro gens/mo | ~40 gens total |
| **Web Hosting** | Vercel Hobby (petemart-poc.vercel.app) | 100GB BW, 100 builds/day | << 1GB/mo |
| **Mobile** | Expo Go (local testing only) | Unlimited local dev | 3 devices testing |
| **Database** | Supabase Free | 500MB DB, 5GB BW, 50K users | ~5MB for 8 merchants |
| **Auth** | Supabase Auth (phone OTP) | 50K users | ~20 test users |
| **Storage** | Supabase Storage | 1GB, image transforms | ~50MB product images |
| **Realtime** | Supabase Realtime | 200 concurrent | ~5 conns for POC |
| **API Hosting** | Vercel (same as web) | Included | Included |
| **Edge Functions** | Supabase Edge Functions | 500K invocations/mo | << 1K/mo |
| **Payments** | Razorpay Test Mode | Unlimited test transactions | ~50 test orders |
| **AI** | Google Gemini Free | 60 req/min, 1,500/day | ~100 req/day |
| **Notifications** | WhatsApp Business Free | 1,000 conversations/mo | ~20 conversations |
| **Monitoring** | Vercel Analytics + Sentry Free | 5K errors/mo | Minimal |
| **CI/CD** | GitHub Actions Free | 2,000 min/mo | << 100 min/mo |
| **Docs** | GitHub Pages | Unlimited static | Architecture docs |

---

## 3. Pilot Merchants — Digital Readiness Assessment

| Merchant | Market | Category | Digital Readiness | Existing Online | Instagram | Google Maps | WhatsApp Business | POC Modes |
|---|---|---|---|---|---|---|---|---|
| Tarun Enterprises | Chickpet | Textiles Wholesale | **Low** | ❌ No website | ❌ No IG | ❌ Not listed | ❌ Personal only | B, C |
| Sri Vari Traders | Balepet | Outdoor Equipment | **Low** | ❌ No website | ❌ No IG | ✅ Listed | ❌ Personal only | A, B |
| Samskruti Silks (Store 1) | Chickpet | Silk Sarees | **Medium** | ❌ No website | ✅ Instagram (5K) | ✅ Listed | ✅ Business (active) | A, B, C |
| Samskruti Silks (Branch) | Chickpet | Silk Sarees | **Medium** | ❌ No website | ✅ Instagram (shared) | ✅ Listed | ✅ Business (shared) | A, B, C |
| flowers2u | Balepet | Florist | **Low** | ❌ No website | ❌ No IG | ✅ Listed | ❌ Personal only | A, B |
| The Pastry Cafe | Balepet | Bakery & Cafe | **Medium** | ❌ Own website (static) | ✅ Instagram (2K) | ✅ Listed | ❌ Personal only | A, C |
| Sri Vinayaka Textorium | Balepet | Textiles & Fabrics | **Low** | ❌ No website | ❌ No IG | ❌ Not listed | ❌ Personal only | B, C |
| Sanjana Apparels | Balepet | Apparel & Clothing | **Medium** | ❌ No website | ✅ Facebook page | ✅ Listed | ✅ Business (limited) | A, B, C |
| Madhumathi All-men's Ethnic | Balepet | Men's Ethnic Wear | **Low** | ❌ No website | ❌ No IG | ✅ Listed | ❌ Personal only | A, B, C |

**Digital Readiness Scoring:**
- **High**: Has e-commerce website + active social media + WhatsApp Business + Google Maps
- **Medium**: Has social media presence + Google Maps listing (partial digital footprint)
- **Low**: No online presence beyond personal WhatsApp (fully offline)

**Conversion Strategy:** Low-readiness merchants will require concierge onboarding assistance (catalog photography, store facade photos, Google Maps claim assistance).

---

## 4. Requirements Covered in POC (48 of 103)

### 4.1 UI/UX Requirements (12 of 24)

| Req ID | Feature | Implementation | Stitch Screens |
|---|---|---|---|
| REQ-UI-001 | Landing Page with Pete Tapestry | Interactive market carousel for Chickpet & Balepet | 2 gens |
| REQ-UI-002 | Product Catalog & Search | PgFTS search across 9 merchants, facet filters | 2 gens |
| REQ-UI-003 | Mode A Product Card & Cart | "Buy Now" CTA, multi-merchant cart | 2 gens |
| REQ-UI-004 | Mode B WhatsApp Button | "Enquire on WhatsApp" deep link | 1 gen |
| REQ-UI-005 | Mode C Visit Store Interface | Store facade + "Get Directions" → Google Maps | 1 gen |
| REQ-UI-006 | Multi-Store Checkout Flow | Consolidated cart, delivery fee calc, Razorpay | 2 gens |
| REQ-UI-007 | Order Tracking Dashboard | Status timeline, basic order history | 1 gen |
| REQ-UI-008 | Merchant Store Microsite | `/shop/slug` per merchant, QR code download | 2 gens |
| REQ-UI-011 | Merchant Onboarding Dashboard | OTP verification + business details form | 2 gens |
| REQ-UI-012 | Admin Console (Basic) | Merchant approval, basic order monitoring | 2 gens |
| REQ-UI-021 | Review Interface (Basic) | Star rating + text comment (no moderation) | 1 gen |
| — | PWA Install Prompt | Next.js PWA service worker | 0 gens |

### 4.2 API Requirements (8 of 13)

| Req ID | Feature | Endpoint |
|---|---|---|
| REQ-API-001 | Product Catalog API | `GET/POST/PUT /api/v1/products` |
| REQ-API-002 | Order Management API | `GET/POST/PUT /api/v1/orders` |
| REQ-API-003 | Payment Gateway API | Razorpay test mode integration |
| REQ-API-004 | WhatsApp Deep-Linking API | `GET /api/v1/whatsapp/deeplink` |
| REQ-API-005 | Google Maps Integration | `GET /api/v1/directions`, geocoding |
| REQ-API-006 | User Auth & Profile API | Supabase Auth OTP + JWT |
| REQ-API-007 | Delivery Tracking API (Basic) | Status tracking without GPS |
| REQ-API-008 | Merchant Management API | `GET/POST/PUT /api/v1/merchants` |

### 4.3 Backend/Data Requirements (12 of 26)

| Req ID | Feature | Implementation |
|---|---|---|
| REQ-BE-001 | Database Schema & Data Models | 15 core tables (users, merchants, products, orders, etc.) |
| REQ-BE-002 | Order Processing Engine | 6-state simplified state machine |
| REQ-BE-003 | Multi-Store Consolidation Engine | Basic grouping + fee calculation |
| REQ-BE-006 | Notification Engine (Basic) | SMS via Supabase + email |
| REQ-BE-007 | Delivery/Logistics Engine | Zone-based courier assignment logic |
| REQ-BE-009 | Search & Discovery Engine | PostgreSQL Full-Text Search |
| REQ-BE-010 | Caching & Performance Layer | In-memory + Supabase query caching |
| REQ-BE-011 | Merchant Catalog Management | Product CRUD, basic CSV upload |
| REQ-BE-015 | GST/TCS Compliance (Basic) | Invoice number generation |
| REQ-BE-016 | MOQ & Bulk Order | Min order qty validation |
| REQ-BE-020 | Dynamic Merchant Registry | Merchant CRUD with status |
| REQ-BE-022 | Geo-Hierarchy (Basic) | Market + merchant hierarchy |

### 4.4 Commerce Requirements (4 of 10)

| Req ID | Feature | Implementation |
|---|---|---|
| REQ-COM-002 | Transaction Fee Processing | Commission calculation logic |
| REQ-COM-004 | Delivery Fee Calculator | Zone + weight + consolidation formula |
| REQ-COM-006 | Merchant Payout Calculation | Basic payout calculation (manual trigger) |
| REQ-COM-008 | Payment Escrow (Basic) | Hold period tracking |

### 4.5 Infrastructure/Security Requirements (6 of 11)

| Req ID | Feature | Implementation |
|---|---|---|
| REQ-INFRA-001 | Cloud Infrastructure Provisioning | Supabase Free + Vercel Hobby |
| REQ-INFRA-003 | Monitoring & Observability | Sentry Free + Vercel Analytics |
| REQ-INFRA-004 | Security & Encryption Framework | HTTPS, JWT, RLS |
| REQ-INFRA-006 | API Gateway & Rate Limiting | Next.js middleware (basic) |
| REQ-INFRA-008 | SSL/TLS & Secrets Management | Vercel SSL + env variables |
| REQ-INFRA-010 | Modular Merchant De/Bboarding | DB-driven merchant lifecycle |

### 4.6 Performance Requirements (2 of 3)

| Req ID | Feature | Implementation |
|---|---|---|
| REQ-PERF-001 | Performance Baseline | Target LCP < 2.5s, API < 300ms |
| REQ-PERF-002 | Horizontal Scalability | Stateless app layer design |

### 4.7 Maintenance Requirements (2 of 5)

| Req ID | Feature | Implementation |
|---|---|---|
| REQ-MAINT-001 | Patch Management | Dependabot for npm |
| REQ-MAINT-003 | Observability (Basic) | Sentry error tracking |

### 4.8 DR Requirements (1 of 4)

| Req ID | Feature | Implementation |
|---|---|---|
| REQ-DR-003 | Automated Backup | Supabase daily backups (included) |

### 4.9 Funnels Requirements (1 of 4)

| Req ID | Feature | Implementation |
|---|---|---|
| REQ-FUNNEL-004 | PWA | Next.js PWA service worker |

---

## 5. Requirements NOT in POC (55 Deferred)

### Tier 1 — Month 1 Post-Launch (14 reqs)

| Req ID | Feature | Deferral Reason |
|---|---|---|
| REQ-UI-009 | Native iOS App | Expo Go + PWA sufficient |
| REQ-UI-010 | Native Android App | Expo Go + PWA sufficient |
| REQ-UI-013 | Multi-Language / i18n | English-only for pilot |
| REQ-API-009 | Notification & SMS API | Basic email notifications |
| REQ-BE-005 | Payment Reconciliation | Manual reconciliation |
| REQ-MAINT-002 | Zero-Downtime Deployment | Manual deploy acceptable |
| REQ-DR-001 | DR Plan & RPO/RTO | Supabase backups suffice |
| REQ-COM-001 | Subscription Plan Management | Free trial for pilot |
| REQ-INFRA-002 | CI/CD Pipeline | Manual deploy acceptable |
| REQ-DR-003 | Point-in-Time Recovery | Supabase PITR (paid feature) |
| REQ-API-011 | Mode Switching API | Hard-coded modes |
| REQ-BE-004 | Subscription & Billing Engine | Not needed for free pilot |
| REQ-BE-008 | Analytics Data Pipeline | Basic SQL queries |
| REQ-API-010 | Analytics & Reporting API | Basic SQL queries |

### Tier 2 — Quarter 2 (18 reqs)

| Req ID | Feature | Deferral Reason |
|---|---|---|
| REQ-UI-007 | Full Order Tracking Dashboard | Basic version in POC |
| REQ-UI-014 | Merchant Sales Analytics | Basic counters sufficient |
| REQ-BE-012 | Product Review & Rating System | Core workflow first |
| REQ-BE-013 | Dispute Resolution & Support | Manual process for pilot |
| REQ-BE-014 | Offline-First Mobile | Not needed for web-first |
| REQ-BE-025 | Review Moderation Engine | Manual moderation |
| REQ-COM-003 | Value-Added Services Billing | Free pilot, no billing |
| REQ-COM-005 | Revenue Dashboard & Audit Trail | Basic SQL reports |
| REQ-COM-007 | Coupon & Promo Engine | Not needed for launch |
| REQ-COM-009 | Trust-Building Features | Tier 2 scope |
| REQ-COM-010 | National Shipping (ShipRocket) | Hyperlocal only |
| REQ-FUNNEL-001 | Multi-Channel Acquisition | Manual onboarding |
| REQ-FUNNEL-002 | Guest Browsing | Phone capture at checkout |
| REQ-FUNNEL-003 | Loyalty Program | Not needed for pilot |
| REQ-MAINT-002 | Zero-Downtime Deployments | Manual acceptable |
| REQ-INFRA-009 | PCI DSS Compliance | Razorpay handles it |
| REQ-BE-024 | Hybrid Delivery Orchestrator | Hyperlocal only |
| REQ-API-013 | ShipRocket API | Hyperlocal only |

### Tier 3 — Quarter 3 (14 reqs)

| Req ID | Feature | Deferral Reason |
|---|---|---|
| REQ-UI-015 | AI Virtual Try-On (Apparel) | Visionary feature |
| REQ-UI-016 | AI Virtual Try-On (Jewellery) | Visionary feature |
| REQ-UI-017 | Jewellery w/ Bullion Rates | No jewellery merchants |
| REQ-UI-018 | White-Label Branding Engine | Single brand for POC |
| REQ-UI-019 | Multi-City Geographic Selector | Bangalore only |
| REQ-UI-020 | Admin Configuration Dashboard | Manual config |
| REQ-BE-018 | Virtual Try-On Engine (AI) | Visionary feature |
| REQ-BE-019 | Jewellery Inventory Mgmt | No jewellery merchants |
| REQ-BE-021 | Dynamic Configuration Service | Env vars + DB config |
| REQ-BE-023 | City/State Onboarding | Bangalore only |
| REQ-DATA-001 | Customer Data / Consent Mgmt | Basic privacy policy |
| REQ-DATA-002 | Usage Pattern Analytics | Basic page views |
| REQ-API-012 | Live Bullion Rate API | No jewellery merchants |
| REQ-PERF-003 | Load Testing Suite | Manual perf test |

### Tier 4 — Visionary (9 reqs)

| Req ID | Feature | Deferral Reason |
|---|---|---|
| REQ-UI-022 | Pete Street Virtual Walk | Future / visionary |
| REQ-UI-023 | Live Bazaar | Future / visionary |
| REQ-UI-024 | Shop Together Co-Shopping | Future / visionary |
| REQ-BE-026 | Virtual Street CMS | Future / visionary |
| REQ-DATA-003 | Data Licensing Framework | Future / visionary |
| REQ-MAINT-004 | License Scanning | Future / visionary |
| REQ-MAINT-005 | System Health Dashboard | Future / visionary |
| REQ-DR-002 | Multi-AZ Failover | Future / visionary |
| REQ-DR-004 | DR Testing Program | Future / visionary |

---

## 6. POC Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Web-first, mobile later** | PWA + Expo Go | 8 merchants don't need native apps; PWA covers Android users; iOS via Expo Go for internal testing |
| **No i18n for POC** | English only | Pilot merchants are English/Kannada bilingual; Kannada text is hardcoded where needed |
| **Manual merchant onboarding** | Admin creates merchant profiles | 9 merchants can be seeded manually; automated onboarding wizard can be built for scale |
| **Basic order tracking** | Status timeline without live GPS | GPS tracking requires courier app; basic status updates suffice for POC |
| **No AI features** | Manual product descriptions | AI features deferred to Tier 3; POC uses curated seed data |
| **Razorpay test mode** | No real payments | Test API keys avoid compliance overhead; transaction flow proven for investor demo |
| **Single admin** | No RBAC for POC | Simple `admin@petemart.com` for demo purposes |

---

## 7. POC Data Model (15 Core Tables)

The POC uses a simplified 15-table schema (full production schema has 35 tables):

```sql
-- Core POC Tables (15)
1. users             -- Customer & merchant user accounts
2. merchants         -- Store profiles with modes and status
3. markets           -- Pete market areas (Chickpet, Balepet)
4. products          -- Product catalog with pricing and mode badges
5. product_images    -- Product photos
6. orders            -- Order header with payment status
7. order_items       -- Individual line items per order
8. cart_items        -- Shopping cart state
9. payments          -- Razorpay transaction records
10. delivery_zones   -- Zone-based delivery rate configuration
11. courier_assignments -- Courier orders
12. notifications    -- In-app notification log
13. reviews          -- Product star ratings
14. whatsapp_log     -- WhatsApp click tracking
15. merchant_analytics -- Basic view/click/order counters
```

---

## 8. POC Directory Structure

```
petemart-poc/
├── web/                          # Next.js 15 Application
│   ├── app/
│   │   ├── page.tsx             # Landing Page w/ Pete Tapestry
│   │   ├── shop/[slug]/         # Merchant Microsite
│   │   ├── cart/                # Shopping Cart
│   │   ├── checkout/            # Checkout Flow
│   │   ├── orders/              # Order History
│   │   ├── tracking/[id]/       # Order Tracking
│   │   ├── merchant/            # Merchant Dashboard
│   │   │   ├── dashboard/       # Overview
│   │   │   ├── products/        # Catalog Management
│   │   │   ├── orders/          # Order Management
│   │   │   └── settings/        # Store Settings
│   │   └── admin/               # Admin Console
│   │       ├── merchants/       # Merchant Approvals
│   │       └── orders/          # Order Monitor
│   ├── components/              # shadcn/ui components
│   │   ├── ui/                  # Base UI components
│   │   └── pete/                # PeteMart-specific components
│   ├── lib/
│   │   ├── supabase/            # Supabase client + helpers
│   │   ├── stitch/               # Google Stitch integration
│   │   └── utils/               # Utilities
│   ├── api/
│   │   └── v1/                  # API Routes
│   └── styles/                  # Tailwind + DESIGN.md tokens
│
├── mobile/                      # Expo React Native App
│   └── app/                     # Expo Router pages
│
├── supabase/
│   ├── migrations/              # Database migrations
│   ├── seed.sql                 # 9-merchant seed data
│   └── functions/               # Edge Functions
│
├── docs/                        # GitHub Pages documentation
│   └── architecture/            # Architecture diagrams
│
└── .github/workflows/           # GitHub Actions CI
```

---

## 9. POC Success Criteria

| Metric | Target | Measurement |
|---|---|---|
| Merchant onboarding | 9/9 merchants with live store profile | Admin dashboard count |
| Product catalog | ≥20 products per merchant | Database query |
| Mode A orders | ≥10 test orders completed | Order service log |
| Mode B enquiries | ≥5 WhatsApp deep links clicked | whatsapp_log table |
| Mode C directions | ≥5 "Get Directions" clicks | Merchant analytics |
| Multi-store orders | ≥3 orders with items from 2+ merchants | Consolidation log |
| Page load time | LCP < 2.5s on 4G | Lighthouse report |
| API response time | P95 < 300ms | Vercel Analytics |
| Error rate | < 1% API errors | Sentry dashboard |
| Uptime | > 99% | Vercel status |

---

## 10. POC Installation & Launch Guide

### Prerequisites
- Node.js 20+
- npm/pnpm
- Supabase account (free)
- Vercel account (free)
- GitHub account (free)
- Google Stitch account (free)
- Razorpay test account (free)

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/org/petemart-poc
cd petemart-poc

# 2. Install dependencies
cd web && npm install

# 3. Set up Supabase
# - Create project in Supabase dashboard
# - Run migrations: supabase db push
# - Seed data: supabase db seed

# 4. Set environment variables
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# Fill in: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (test mode)

# 5. Run development server
npm run dev
# → http://localhost:3000

# 6. Generate UI screens with Google Stitch
npm run stitch:generate
# → Generates React components from stitch prompts

# 7. Deploy to Vercel
npm run vercel:deploy
# → https://petemart-poc.vercel.app
```

---

*End of POC_SCOPE.md*

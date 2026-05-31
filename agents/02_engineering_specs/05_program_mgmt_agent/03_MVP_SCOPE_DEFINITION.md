# PeteMart — MVP Scope Definition

**Document Version:** 1.0  
**Author:** Agent 05 — Senior Agile Program Manager & Scrum Master  
**Date:** 2026-05-30  
**Target:** Tier 0 Launch MVP (Sprints 1-6, Days 1-12)  

---

## 1. MVP Definition: "The PeteMart Promise"

**Strategic Statement:**  
The MVP enables a customer to browse products from real Pete merchants, add items from multiple stores to a single cart, pay via UPI, and get delivery — all while allowing merchants to onboard, manage their catalog, and receive orders.

**Three Verticals Validated by MVP:**

| Vertical | Customer | Merchant | Admin |
|----------|----------|----------|-------|
| **Discovery** | Browse markets, search products | Create store microsite | Approve merchants |
| **Commerce** | Multi-store cart, checkout, pay | View orders, manage catalog | Monitor platform |
| **Fulfillment** | Track orders, receive delivery | Update order status | Manage delivery zones |

---

## 2. MVP Boundaries — What's IN / What's OUT

### ✅ IN SCOPE — MVP (Days 1-12, Sprints 1-6)

**Customer-Facing Features:**
- Phone OTP registration and login (no email-password)
- Landing page with Pete Tapestry (21 markets)
- Product search with autocomplete and filters
- Product detail page with images, price, mode badges
- Multi-merchant shopping cart
- Consolidated checkout with delivery fee calculation
- Razorpay payment (UPI, Card, NetBanking)
- Order confirmation and basic tracking (status timeline)
- Order history page
- WhatsApp deep link (Mode B) for product enquiry
- Store visit interface (Mode C) with Google Maps directions
- Guest browsing (register at checkout)

**Merchant-Facing Features:**
- Registration wizard (phone → business details → plan → modes)
- Bank details entry + cancelled cheque upload
- Razorpay subaccount creation
- Store microsite at `petemart.in/{shop-slug}`
- Product CRUD (add/edit/delete)
- Bulk CSV product upload
- Order management (view, mark status)
- GST invoice generation per order
- Dashboard overview (orders, revenue, products count)
- Real-time order alerts
- Basic inventory management (stock tracking)

**Admin-Facing Features:**
- Email+password + OTP login
- Merchant approval queue (one-click approve/reject)
- Platform dashboard (merchants, orders, revenue)
- Feature flag management with kill switch
- Admin configuration dashboard (delivery zones, rates)
- City selector (Bangalore only at MVP)

**Infrastructure:**
- Supabase Free (PostgreSQL, Auth, Storage, Realtime)
- Vercel Hobby (Next.js hosting)
- CI/CD via GitHub Actions
- HTTPS/TLS everywhere
- Row-Level Security (RLS) for data isolation
- Role-based access control (Customer, Merchant, Admin)
- Persona-aware navigation (different nav bars)

### ❌ OUT OF SCOPE — Post-MVP (Tier 1+)

**Deferred to Tier 1 (Days 13-14):**
- Native mobile apps (iOS/Android) — PWA sufficient
- Multi-language (i18n) — English-only at MVP
- Admin revenue reports — basic counters only
- Push notifications — email/SMS at MVP
- Zero-downtime deployments — manual deploy at MVP
- Point-in-time recovery — Supabase backups suffice

**Deferred to Tier 2 (Days 15-16):**
- Product reviews and ratings
- Review moderation queue
- Promo/coupon engine
- Loyalty points program
- Offline-first mobile
- Zero-downtime deploys
- National shipping (ShipRocket)
- Payment escrow (T+3 hold)

**Deferred to Tier 3 (Days 17-18):**
- AI Virtual Try-On (apparel & jewellery)
- Live bullion rates
- Jewellery dynamic pricing calculator
- Multi-city expansion (Bangalore only)
- White-label branding engine
- Analytics data pipeline
- Video call appointments
- 360° product rotation

**Deferred to Tier 4 (Days 19-22):**
- Pete Street Virtual Walk
- Live Bazaar streaming
- Shop Together co-shopping
- Data licensing framework

---

## 3. MVP Pilot Merchants (9)

| Merchant | Market | Category | MVP Modes | Key Products |
|----------|--------|----------|-----------|-------------|
| Tarun Enterprises | Chickpet | Textiles Wholesale | B, C | Cotton fabrics, suitings |
| Sri Vari Traders | Balepet | Outdoor Equipment | A, B | Camping gear, sports equipment |
| Samskruti Silks (Store 1) | Chickpet | Silk Sarees | A, B, C | Kanjivaram, Mysore silk sarees |
| Samskruti Silks (Branch) | Chickpet | Silk Sarees | A, B, C | Wedding sarees, half-sarees |
| flowers2u | Balepet | Florist | A, B | Bouquets, floral arrangements |
| The Pastry Cafe | Balepet | Bakery & Cafe | A, C | Cakes, pastries, savories |
| Sri Vinayaka Textorium | Balepet | Textiles | B, C | Dress materials, linens |
| Sanjana Apparels | Balepet | Apparel | A, B, C | Readymade garments, kids wear |
| Madhumathi Men's Ethnic | Balepet | Men's Wear | A, B, C | Kurtas, sherwanis, dhotis |

**Digital Readiness at MVP:**
- 3 merchants with Medium readiness (have Instagram/Google Maps)
- 6 merchants with Low readiness (fully offline)
- PeteMart provides: catalog photography, store photos, Google Maps listing assistance

---

## 4. MVP Customer Journeys (End-to-End)

### Journey 1: Discover & Buy (Mode A) — Priya
```
Guest → Landing Page → Select Balepet Market → Browse Pastry Cafe → 
View Product Detail → Add to Cart → Continue Shopping → 
Add from Samskruti Silks → View Cart (Consolidated) → 
Checkout → Enter Address → Select UPI → Pay via Razorpay → 
Order Confirmed → Track Order → Receive Delivery
```

### Journey 2: Enquire via WhatsApp (Mode B) — Deepa (B2B)
```
Guest → Search "silk sarees" → View Samskruti Silks Microsite → 
Click "Enquire on WhatsApp" → WhatsApp Opens (pre-filled message) → 
Negotiate Price → Complete Offline → PeteMart Logs Enquiry
```

### Journey 3: Visit Store (Mode C) — Priya (High-Value)
```
Guest → Browse Tarun Enterprises → View Product → 
Click "Visit Store" → See Store Facade + Hours → 
Click "Get Directions" → Google Maps Opens → Visit Physically → 
Complete Purchase Offline
```

### Journey 4: Merchant Onboarding — Ramesh
```
Visit petemart.in/sell → Enter Phone → OTP Verify → 
Fill Business Details → Select Growth Plan → Choose Modes → 
Enter Bank Details → Upload Cheque → Upload 3 Products → 
Submit for Approval → Admin Approves → Microsite Live → 
SMS with Store URL → QR Code Download
```

### Journey 5: Admin Operations — Ananya
```
Login → Dashboard Overview → Review Merchant Queue → 
Approve Ramesh's Store → Monitor Orders → Configure Delivery Zones → 
Toggle Feature Flag → Export Report
```

---

## 5. MVP Success Criteria

| Metric | Target | How We Measure |
|--------|--------|---------------|
| **Merchant Onboarded** | 9/9 with live stores | Admin dashboard count |
| **Products per Merchant** | ≥20 products | Database count |
| **Mode A Orders** | ≥10 test orders | Order service logs |
| **Mode B Enquiries** | ≥5 WhatsApp clicks | whatsapp_log table |
| **Mode C Clicks** | ≥5 "Get Directions" clicks | Analytics events |
| **Multi-Store Orders** | ≥3 orders (2+ merchants) | Consolidation log |
| **Page Load (LCP)** | <2.5s | Lighthouse CI |
| **API P95** | <300ms | Vercel Analytics |
| **Error Rate** | <1% | Sentry |
| **Uptime** | 99%+ | Vercel Status |
| **Sprint Velocity** | 40 pts/sprint | Story points completed |

---

## 6. MVP Release Criteria (QA Gate)

| Criteria | Minimum Threshold | Verification Method |
|----------|------------------|-------------------|
| Unit test coverage | 80%+ lines | Vitest/Istanbul |
| E2E critical path | 100% pass | Playwright |
| API endpoint tests | 100% pass | Supertest |
| No P0/P1 defects | 0 open | QA verification |
| Security scan | No critical/high | Dependabot + Snyk |
| LCP (mobile 3G) | <3.0s | Lighthouse CI |
| Accessibility | WCAG 2.1 AA | Stitch + axe-core |
| Cross-browser | Chrome, Firefox, Safari, Edge | Manual verification |

---

## 7. MVP Demo Script (For Investor/Stakeholder Demo)

**Demo Flow (15 minutes):**

| Step | Screen | Action | Speaker Notes |
|------|--------|--------|---------------|
| 1 | Landing Page | Open petemart.vercel.app | "Welcome to PeteMart — your Pete market, at home" |
| 2 | Market Grid | Click Chickpet market | "We have 21 Pete markets digitized" |
| 3 | Merchant List | Click Samskruti Silks | "Each merchant gets a branded microsite" |
| 4 | Product Grid | Browse silk sarees | "Three modes: Buy Now, WhatsApp Enquiry, Visit Store" |
| 5 | Product Detail | Click a saree | "Full details: price, images, mode options" |
| 6 | Add to Cart | Click "Add to Cart" | "Added to multi-merchant cart" |
| 7 | Cart | View cart | "Items from multiple stores in one cart" |
| 8 | Checkout | Click checkout | "Consolidated delivery fee calculation" |
| 9 | Payment | Complete test payment | "Razorpay — UPI, Card, NetBanking" |
| 10 | Confirmation | Order confirmed | "Order placed, tracking available" |
| 11 | Merchant Onboard | Show registration | "Merchant onboarded in <15 minutes" |
| 12 | Merchant Dashboard | Show orders | "Real-time order management" |
| 13 | Admin Dashboard | Show analytics | "Full platform control" |

---

## 8. MVP Technical Stack (Zero-Cost)

| Layer | Technology | Free Tier Limits | MVP Usage |
|-------|-----------|-----------------|-----------|
| **Web Frontend** | Next.js 15 + shadcn/ui + Tailwind | Vercel Hobby: 100GB BW | <1GB/mo |
| **Mobile** | Expo Go (testing only) | Unlimited local dev | 3 devices |
| **Database** | Supabase PostgreSQL | 500MB DB | ~10MB |
| **Auth** | Supabase Auth | 50K users | ~100 users |
| **Storage** | Supabase Storage | 1GB | ~50MB images |
| **Realtime** | Supabase Realtime | 200 concurrent | ~10 connections |
| **API** | Next.js API Routes | Included in Vercel | Included |
| **Payments** | Razorpay Test Mode | Unlimited | ~50 test txns |
| **AI** | N/A (deferred) | — | — |
| **CI/CD** | GitHub Actions | 2000 min/mo | ~50 min/mo |
| **Monitoring** | Sentry Free + Vercel Analytics | 5K errors/mo | Minimal |
| **Domain** | `petemart-poc.vercel.app` | Free subdomain | Core URL |
| **Total Cost** | **₹0/month** | | |

---

## 9. MVP Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| Merchant tech literacy too low | Medium | High | Concierge onboarding service | Field Executive |
| Razorpay subaccount creation fails | Low | High | Manual fallback with bank transfer | Backend Team |
| Delivery zone calc incorrect | Medium | Medium | Seed with simple zone config, validate | API Team |
| Cart consolidation logic bugs | Medium | High | Extensive unit tests + demo | QA Agent |
| OTP delivery failure (SMS) | Low | Medium | Email fallback, retry mechanism | Backend Team |
| Supabase free tier limits hit | Low | Medium | Monitor usage, upgrade if needed | DevOps Agent |
| Mobile responsiveness issues | Medium | Medium | Mobile-first design + testing | UI Agent |

---

*End of MVP Scope Definition*

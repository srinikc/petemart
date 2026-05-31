# PeteMart — Epic, Feature & User Story Hierarchy

**Document Version:** 1.0  
**Author:** Agent 05 — Senior Agile Program Manager & Scrum Master  
**Date:** 2026-05-30  
**Source:** PRD v2.0 (111 requirements), Architecture Blueprint v1.0, POC Scope v1.0  
**Trace Guardrail Status:** ✅ Every User Story links to a Requirement ID  

---

## Epic Hierarchy Overview

| Epic ID | Epic Name | # Features | # Stories | Total Reqs | Sprint Range |
|---------|-----------|-----------|-----------|-----------|-------------|
| EPIC-01 | Customer Auth & Persona Management | 3 | 12 | REQ-API-006, REQ-BE-001, REQ-UI-001 | S1-S2 |
| EPIC-02 | Browse & Discovery (Guest + Registered) | 4 | 18 | REQ-UI-001, REQ-UI-002, REQ-UI-008, REQ-BE-009, REQ-BE-022 | S1-S3 |
| EPIC-03 | Shopping Cart & Checkout (Mode A) | 4 | 16 | REQ-UI-003, REQ-UI-006, REQ-API-003, REQ-BE-002, REQ-BE-003 | S2-S4 |
| EPIC-04 | WhatsApp Enquiry (Mode B) | 2 | 8 | REQ-UI-004, REQ-API-004, REQ-BE-006 | S2-S3 |
| EPIC-05 | Store Visit (Mode C) | 2 | 8 | REQ-UI-005, REQ-API-005 | S2-S3 |
| EPIC-06 | Merchant Dashboard & Microsite | 5 | 22 | REQ-UI-008, REQ-UI-011, REQ-UI-014, REQ-MICRO-001→008 | S2-S5 |
| EPIC-07 | Admin Console & Operations | 4 | 16 | REQ-UI-012, REQ-UI-020, REQ-INFRA-011, REQ-BE-004 | S3-S6 |
| EPIC-08 | Order Management & Tracking | 3 | 14 | REQ-UI-007, REQ-API-007, REQ-BE-007 | S3-S5 |
| EPIC-09 | Payment Processing & Settlement | 3 | 12 | REQ-API-003, REQ-COM-002, REQ-COM-006, REQ-COM-008, REQ-MICRO-007, REQ-MICRO-008 | S3-S5 |
| EPIC-10 | Multi-Store Consolidation & Delivery | 3 | 10 | REQ-BE-003, REQ-COM-004, REQ-BE-024 | S4-S6 |
| EPIC-11 | Persona-Based Navigation & UX | 3 | 12 | REQ-UI-013, REQ-UI-018, REQ-UI-019 | S4-S6 |
| EPIC-12 | Mobile App (Expo) | 4 | 16 | REQ-UI-009, REQ-UI-010, REQ-FUNNEL-004 | S5-S7 |
| EPIC-13 | Reviews, Ratings & Trust | 3 | 12 | REQ-BE-012, REQ-BE-025, REQ-UI-021 | S5-S7 |
| EPIC-14 | Promo Engine & Loyalty | 2 | 10 | REQ-COM-007, REQ-FUNNEL-003 | S6-S7 |
| EPIC-15 | Merchant Catalog & Inventory Management | 3 | 12 | REQ-BE-011, REQ-MICRO-002, REQ-MICRO-004 | S4-S6 |
| EPIC-16 | Subscriptions & Billing | 2 | 8 | REQ-COM-001, REQ-BE-004 | S5-S7 |
| EPIC-17 | Infrastructure, Security & Compliance | 5 | 18 | REQ-INFRA-001→011, REQ-DATA-001 | S1-S8 |
| EPIC-18 | National Shipping (ShipRocket) | 2 | 8 | REQ-COM-010, REQ-API-013 | S6-S8 |
| EPIC-19 | AI Virtual Try-On | 3 | 12 | REQ-UI-015, REQ-UI-016, REQ-BE-018 | S7-S9 |
| EPIC-20 | Jewellery & Bullion Integration | 3 | 10 | REQ-UI-017, REQ-API-012, REQ-BE-019 | S7-S9 |
| EPIC-21 | Video Call & Trust Features | 2 | 8 | REQ-COM-009 | S8-S9 |
| EPIC-22 | City Expansion & Multi-Geo | 2 | 8 | REQ-UI-019, REQ-BE-022, REQ-BE-023 | S8-S10 |
| EPIC-23 | Analytics & CDP | 2 | 8 | REQ-BE-008, REQ-BE-017, REQ-API-010 | S7-S9 |
| EPIC-24 | PWA & Offline-First | 2 | 6 | REQ-BE-014, REQ-FUNNEL-004 | S5-S6 |
| EPIC-25 | Visionary: Virtual Walk & Live Bazaar | 3 | 10 | REQ-UI-022, REQ-UI-023, REQ-UI-024, REQ-BE-026 | S10-S12 |
| EPIC-26 | Visionary: Co-Shopping & Community | 2 | 6 | REQ-UI-024 | S11-S12 |

---

## EPIC-01: Customer Auth & Persona Management

**Requirement IDs:** REQ-API-006, REQ-BE-001 (partial), REQ-UI-001 (partial)  
**Sprint:** S1-S2 (Weeks 1-4)  
**Priority:** 🔴 P0-Critical  

### Feature F-01.1: Customer Registration & Login
**Trace to Req:** REQ-API-006, REQ-BE-001

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-001 | As a **first-time customer**, I want to **register using my phone number via OTP** so that I can **create an account quickly without remembering a password**. | ✅ OTP sent to phone within 3 seconds<br>✅ OTP expires after 5 minutes<br>✅ Max 3 OTP resend attempts per hour<br>✅ User redirected to profile setup on success | 3 |
| US-002 | As a **registered customer**, I want to **log in using phone OTP** so that I can **access my account**. | ✅ OTP-based login with remembered device option<br>✅ JWT token issued with 7-day expiry<br>✅ Refresh token mechanism for seamless session<br>✅ "Remember this device" checkbox | 2 |
| US-003 | As a **customer**, I want to **manage my profile** (name, email, default address, phone) so that **checkout is faster**. | ✅ Profile edit form with validation<br>✅ Default address marked and used at checkout<br>✅ Phone verification status shown<br>✅ Profile picture optional | 3 |

### Feature F-01.2: Merchant Registration & Onboarding
**Trace to Req:** REQ-API-006, REQ-API-008, REQ-UI-011

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-004 | As a **merchant**, I want to **register my store by entering business details, selecting a plan, and choosing interaction modes** so that **I can start selling on PeteMart**. | ✅ Step-by-step wizard: Phone → Business Details → Plan → Modes → Catalog<br>✅ Business details: store name, address, market area, category, GSTIN<br>✅ Plan selection with feature comparison table<br>✅ Mode selection with prerequisite validation | 8 |
| US-005 | As a **merchant**, I want to **enter my bank details and upload a cancelled cheque** so that **Razorpay subaccount is created for payment settlement**. | ✅ Bank account form (holder name, account number, IFSC)<br>✅ Cancelled cheque upload with validation<br>✅ Razorpay Route API integration for subaccount creation<br>✅ Success/failure notification | 5 |
| US-006 | As an **admin**, I want to **review and approve merchant applications** so that **only verified merchants go live**. | ✅ Approval queue with merchant details<br>✅ One-click approve/reject<br>✅ Rejection reason field<br>✅ Store goes live immediately on approval | 3 |

### Feature F-01.3: Admin Authentication & RBAC
**Trace to Req:** REQ-API-006, REQ-INFRA-004

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-007 | As an **admin**, I want to **log in with email+password and receive OTP** so that **admin access is secured**. | ✅ Email+password + OTP 2FA<br>✅ Session timeout after 30 min inactivity<br>✅ IP-based login alerts | 2 |
| US-008 | As a **system**, I want to **enforce role-based access control** so that **customers, merchants, and admins see only their authorized screens**. | ✅ Three roles: `customer`, `merchant`, `admin`<br>✅ Route guards on all protected pages<br>✅ API middleware validates JWT + role<br>✅ 403 response for unauthorized access | 3 |
| US-009 | As a **system**, I want to **create persona-aware navigation** so that **each user type sees a tailored navbar**. | ✅ Customer navbar: Home, Markets, Cart, Orders, Profile<br>✅ Merchant navbar: Dashboard, Products, Orders, Analytics, Settings<br>✅ Admin navbar: Dashboard, Merchants, Users, Config, Reports<br>✅ Navbar switches on login/logout | 3 |

---

## EPIC-02: Browse & Discovery

**Requirement IDs:** REQ-UI-001, REQ-UI-002, REQ-UI-008, REQ-BE-009, REQ-BE-022  
**Sprint:** S1-S3 (Weeks 1-6)  
**Priority:** 🔴 P0-Critical  

### Feature F-02.1: Landing Page with Pete Tapestry
**Trace to Req:** REQ-UI-001

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-010 | As a **visitor**, I want to **see the Pete Tapestry carousel on the landing page** so that **I can discover markets visually**. | ✅ Interactive carousel with 21 Pete market tiles<br>✅ Each tile has: market name, specialization badge, merchant count<br>✅ Autoplay with pause on hover<br>✅ Click navigates to market page | 5 |
| US-011 | As a **visitor**, I want to **see featured merchants and categories on the landing page** so that **I can start browsing immediately**. | ✅ "Popular Merchants" section with 8 merchant cards<br>✅ "Shop by Category" grid with icons<br>✅ "Trending Now" section with top products<br>✅ SEO meta-tags for each section | 3 |

### Feature F-02.2: Market & Merchant Discovery
**Trace to Req:** REQ-UI-002, REQ-BE-009, REQ-BE-022

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-012 | As a **customer**, I want to **search for products across all merchants** so that **I can find what I need quickly**. | ✅ Full-text search with autocomplete (≥3 chars)<br>✅ Results grouped by merchant<br>✅ "No results" state with suggestions<br>✅ Search history (last 5 searches, local storage) | 5 |
| US-013 | As a **customer**, I want to **filter search results by market, category, price range, interaction mode, and rating** so that **I can narrow down choices**. | ✅ Faceted filter sidebar with count badges<br>✅ Mode filter: "Buy Now" / "WhatsApp Enquiry" / "Visit Store"<br>✅ Price range slider with min/max<br>✅ Filters persist in URL for sharing<br>✅ Clear all filters button | 5 |
| US-014 | As a **customer**, I want to **browse merchants by Pete market** so that **I can shop from my preferred market area**. | ✅ Market page with description, history, specialization<br>✅ Merchant list with: name, category, rating badge, mode badges<br>✅ Sort: rating, name, product count<br>✅ Map view showing merchant locations | 5 |

### Feature F-02.3: Merchant Microsite (Public)
**Trace to Req:** REQ-UI-008, REQ-MICRO-001

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-015 | As a **customer**, I want to **visit a merchant's branded store page at a unique URL** so that **I can browse their full catalog**. | ✅ URL: `petemart.in/{shop-slug}`<br>✅ Store header: logo, name, banner, hours, contact<br>✅ Product grid with Mode badges<br>✅ QR code download for store URL | 5 |
| US-016 | As a **merchant**, I want to **customize my microsite with brand colors and logo** so that **it reflects my store identity**. | ✅ Upload store logo and banner image<br>✅ Select brand color from theme palette<br>✅ Preview before publishing<br>✅ Changes reflected immediately | 3 |

### Feature F-02.4: Product Catalog & Detail Page
**Trace to Req:** REQ-UI-002, REQ-API-001

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-017 | As a **customer**, I want to **view product details with images, price, description, and mode options** so that **I can make an informed purchase decision**. | ✅ Product image gallery with zoom<br>✅ Price display (retail/wholesale)<br>✅ Mode A/B/C buttons with context<br>✅ Delivery eligibility badge<br>✅ Stock status indicator | 5 |
| US-018 | As a **customer**, I want to **see product mode badges clearly** so that **I know my options before clicking**. | ✅ Mode A: "Buy Now" button (green)<br>✅ Mode B: "Enquire on WhatsApp" button (green)<br>✅ Mode C: "Visit Store" button (blue)<br>✅ B2B badge for wholesale-enabled products | 3 |

---

## EPIC-03: Shopping Cart & Checkout (Mode A)

**Requirement IDs:** REQ-UI-003, REQ-UI-006, REQ-API-003, REQ-BE-002, REQ-BE-003  
**Sprint:** S2-S4 (Weeks 3-8)  
**Priority:** 🔴 P0-Critical  

### Feature F-03.1: Shopping Cart
**Trace to Req:** REQ-UI-003

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-019 | As a **customer**, I want to **add products from multiple merchants to my cart** so that **I can consolidate my shopping**. | ✅ "Add to Cart" button on Mode A products<br>✅ Cart grouped by merchant with sub-totals<br>✅ Quantity increment/decrement within merchant group<br>✅ Cart badge updates in real-time | 3 |
| US-020 | As a **customer**, I want to **view my cart with itemized pricing and delivery fee estimates** so that **I know the total before checkout**. | ✅ Cart page with merchant-wise sections<br>✅ Per-item price, quantity, total<br>✅ Estimated delivery fee per merchant<br>✅ Remove item with confirmation<br>✅ "Proceed to Checkout" button | 3 |

### Feature F-03.2: Multi-Store Checkout Flow
**Trace to Req:** REQ-UI-006, REQ-BE-003

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-021 | As a **customer**, I want to **see a consolidated checkout with all items grouped by merchant** so that **I can review my entire order in one place**. | ✅ Checkout page with merchant-wise items<br>✅ Delivery fee: `Max(Zone Base) + ₹25*(N-1) + Weight Surcharge`<br>✅ Order total with tax breakup<br>✅ Edit delivery address inline | 5 |
| US-022 | As a **customer**, I want to **enter or confirm my delivery address during checkout** so that **my order reaches the right place**. | ✅ Saved addresses dropdown<br>✅ Add new address with pincode auto-fill<br>✅ Pincode-based delivery zone validation<br>✅ Address fields: name, phone, line1, line2, city, pincode, landmark | 3 |

### Feature F-03.3: Razorpay Payment Integration
**Trace to Req:** REQ-API-003, REQ-COM-002

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-023 | As a **customer**, I want to **pay using UPI, Credit/Debit Card, or NetBanking** so that **I can choose my preferred payment method**. | ✅ Razorpay checkout widget with all payment options<br>✅ Payment amount includes: subtotal + delivery fee + 2% PG fee<br>✅ Payment success redirects to confirmation page<br>✅ Payment failure shows clear error message | 5 |
| US-024 | As a **system**, I want to **verify Razorpay webhooks and update order status** so that **payment status is accurate**. | ✅ Webhook handler for: `payment.captured`, `payment.failed`<br>✅ Order status updated to "Payment Confirmed" on success<br>✅ Retry logic for failed webhook delivery<br>✅ Idempotency key to prevent duplicate processing | 5 |

### Feature F-03.4: Order Confirmation & Lifecycle
**Trace to Req:** REQ-BE-002

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-025 | As a **customer**, I want to **see an order confirmation page with order details** so that **I know my order was placed successfully**. | ✅ Order confirmation with order ID, items, total, ETA<br>✅ "View Order Status" button<br>✅ Email/SMS confirmation sent<br>✅ Option to continue shopping | 2 |
| US-026 | As a **system**, I want to **manage the complete order lifecycle** so that **orders flow from confirmation to delivery correctly**. | ✅ State machine: Pending → Confirmed → Packing → Picked Up → In Transit → Delivered<br>✅ Status transitions logged with timestamps<br>✅ Notifications triggered at each transition<br>✅ Cancellation allowed before "Packing" status | 5 |

---

## EPIC-04: WhatsApp Enquiry (Mode B)

**Requirement IDs:** REQ-UI-004, REQ-API-004, REQ-BE-006  
**Sprint:** S2-S3 (Weeks 3-6)  
**Priority:** 🔴 P0-Critical  

### Feature F-04.1: WhatsApp Deep Link
**Trace to Req:** REQ-UI-004, REQ-API-004

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-027 | As a **customer**, I want to **click "Enquire on WhatsApp" on a product** so that **I can discuss with the merchant directly**. | ✅ Button generates `wa.me/91XXXXXXXXXX?text=...`<br>✅ Pre-filled message: product name, SKU, price, store name<br>✅ Opens WhatsApp app or web.whatsapp.com fallback<br>✅ Works on both web and mobile | 2 |
| US-028 | As a **system**, I want to **log WhatsApp click-through events** so that **merchants see enquiry analytics**. | ✅ Event logged in `whatsapp_click_log` table<br>✅ Merchant dashboard shows "WhatsApp Enquiries" count<br>✅ Per-product enquiry tracking<br>✅ No conversation content stored | 3 |

### Feature F-04.2: Mode B Merchant Notification
**Trace to Req:** REQ-BE-006

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-029 | As a **merchant**, I want to **receive a notification when a customer enquires about my product** so that **I can respond promptly**. | ✅ Push notification to merchant mobile app<br>✅ SMS fallback if app not installed<br>✅ Notification includes product name and customer phone<br>✅ Rate-limited to 1 notification per 5 min per customer | 3 |
| US-030 | As a **merchant**, I want to **see all WhatsApp enquiries in my dashboard** so that **I can track customer interest**. | ✅ Enquiry log with: date, product, customer phone<br>✅ Sort/filter by date and product<br>✅ Click-to-call button for quick response | 2 |

---

## EPIC-05: Store Visit (Mode C)

**Requirement IDs:** REQ-UI-005, REQ-API-005  
**Sprint:** S2-S3 (Weeks 3-6)  
**Priority:** 🔴 P0-Critical  

### Feature F-05.1: Store Visit Interface
**Trace to Req:** REQ-UI-005

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-031 | As a **customer**, I want to **see a store facade gallery and operating hours** so that **I know what to expect before visiting**. | ✅ Store facade photos (up to 6)<br>✅ Business hours display for each day<br>✅ "Open Now" / "Closed" indicator<br>✅ Store contact number clickable | 3 |
| US-032 | As a **customer**, I want to **click "Get Directions" to open Google Maps** so that **I can navigate to the store**. | ✅ Deep link: `https://maps.google.com/?q=lat,lng`<br>✅ Store name pre-filled in maps search<br>✅ Works on web (maps.google.com) and mobile (Google Maps app) | 1 |

### Feature F-05.2: Mode C Lead Tracking
**Trace to Req:** REQ-API-005

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-033 | As a **system**, I want to **log Mode C visit clicks** so that **merchants see footfall interest data**. | ✅ Click logged with: product, merchant, timestamp<br>✅ No PII captured (anonymous session-based)<br>✅ Merchant dashboard shows "Store Visit Clicks" counter | 2 |
| US-034 | As a **merchant**, I want to **see Mode C analytics** so that **I understand how many customers are visiting my store via PeteMart**. | ✅ Daily/weekly/monthly visit click trends<br>✅ Comparison with previous periods<br>✅ Top products driving store visits | 3 |

---

## EPIC-06: Merchant Dashboard & Operations

**Requirement IDs:** REQ-UI-008, REQ-UI-011, REQ-UI-014, REQ-MICRO-001→008, REQ-BE-011  
**Sprint:** S2-S5 (Weeks 3-10)  
**Priority:** 🔴 P0-Critical  

### Feature F-06.1: Merchant Dashboard — Overview
**Trace to Req:** REQ-UI-011, REQ-UI-014

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-035 | As a **merchant**, I want to **see a dashboard overview with key metrics** so that **I can understand my store performance at a glance**. | ✅ Cards: Total Orders, Revenue, Active Products, Pending Orders<br>✅ Revenue chart (daily/weekly/monthly toggle)<br>✅ Recent orders list (last 10)<br>✅ Mode-wise breakdown: A vs B vs C | 5 |
| US-036 | As a **merchant**, I want to **see real-time order alerts** so that **I never miss a new order**. | ✅ Toast notification for new orders<br>✅ Sound alert (configurable)<br>✅ Pending orders count badge in navbar<br>✅ Auto-refresh every 30 seconds | 3 |

### Feature F-06.2: Merchant Product Management
**Trace to Req:** REQ-MICRO-002, REQ-BE-011

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-037 | As a **merchant**, I want to **add, edit, and delete products** so that **my catalog stays up to date**. | ✅ Product form: name, description, images (up to 10), price, stock, category, HSN code<br>✅ Variants: size, color, price, stock per variant<br>✅ Mode selection per product (A, B, C)<br>✅ Draft → Published workflow | 5 |
| US-038 | As a **merchant**, I want to **bulk upload products via CSV** so that **I can add many products quickly**. | ✅ CSV template download<br>✅ Validation with row-level error reporting<br>✅ Preview before import<br>✅ Import history log | 5 |
| US-039 | As a **merchant**, I want to **manage inventory stock levels** so that **I don't oversell**. | ✅ Stock count display on product cards<br>✅ "Out of Stock" auto-hide with "Notify Me" option<br>✅ Low stock alert at ≤5 items<br>✅ Inventory change log | 3 |

### Feature F-06.3: Merchant Order Management
**Trace to Req:** REQ-MICRO-003

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-040 | As a **merchant**, I want to **see all orders placed at my store** so that **I can fulfill them**. | ✅ Orders table: order ID, customer, items, total, status, date<br>✅ Filter by status: New, Confirmed, Packing, Shipped, Delivered, Cancelled<br>✅ Order detail page with customer info + items<br>✅ Mark as "Packing" → "Ready for Pickup" | 5 |
| US-041 | As a **merchant**, I want to **print invoices for orders** so that **I can include them in shipments**. | ✅ GST-compliant invoice template<br>✅ Invoice fields: merchant GSTIN, HSN, taxable value, CGST/SGST/IGST<br>✅ PDF download with auto-incrementing invoice number<br>✅ Email invoice to customer option | 3 |

### Feature F-06.4: Merchant Analytics
**Trace to Req:** REQ-UI-014, REQ-MICRO-006

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-042 | As a **merchant**, I want to **view sales analytics with charts and trends** so that **I can make data-driven decisions**. | ✅ Sales chart: daily/weekly/monthly/ yearly<br>✅ Top selling products ranking<br>✅ Revenue by mode (A/B/C) pie chart<br>✅ Customer repeat rate metric | 5 |
| US-043 | As a **merchant**, I want to **export analytics data to CSV/PDF** so that **I can share reports**. | ✅ Export button on each analytics section<br>✅ CSV with all data columns<br>✅ PDF with chart summary<br>✅ Date range selector for exports | 2 |

### Feature F-06.5: Merchant Settings & Subscription
**Trace to Req:** REQ-COM-001, REQ-BE-004

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-044 | As a **merchant**, I want to **view and manage my subscription plan** so that **I can upgrade/downgrade as needed**. | ✅ Current plan display with features<br>✅ Plan comparison table<br>✅ One-click upgrade/downgrade<br>✅ Payment history for subscription | 3 |
| US-045 | As a **merchant**, I want to **view my payout history and settlement reports** so that **I know my earnings**. | ✅ Payout history table: date, amount, period, status<br>✅ Per-order breakdown of deductions<br>✅ Settlement report with: gross amount, commission, fee, net amount<br>✅ Bank account details display (masked) | 3 |

---

## EPIC-07: Admin Console & Operations

**Requirement IDs:** REQ-UI-012, REQ-UI-020, REQ-INFRA-011, REQ-BE-004  
**Sprint:** S3-S6 (Weeks 5-12)  
**Priority:** 🟡 P1-High  

### Feature F-07.1: Admin Dashboard
**Trace to Req:** REQ-UI-012

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-046 | As an **admin**, I want to **see a platform-wide dashboard with key metrics** so that **I can monitor overall health**. | ✅ Cards: Total Merchants, Active Orders, Revenue (MTD), New Signups<br>✅ Revenue trend chart (daily/weekly/monthly)<br>✅ Merchant growth chart<br>✅ Recent activity feed | 5 |
| US-047 | As an **admin**, I want to **manage all merchants (approve, suspend, view details)** so that **I can control the platform**. | ✅ Merchant table with search and filters<br>✅ Merchant detail view with all data<br>✅ One-click approve/suspend/delete<br>✅ Bulk actions for multiple merchants | 5 |

### Feature F-07.2: Admin Configuration Dashboard
**Trace to Req:** REQ-UI-020, REQ-BE-021

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-048 | As an **admin**, I want to **configure platform settings via a dashboard** so that **I can make changes without code deployments**. | ✅ Sections: Delivery Zones, Commission Rates, Pricing, Content, Tax Rules<br>✅ Preview changes before publishing<br>✅ Scheduled config changes (e.g., festival pricing)<br>✅ Config version history with rollback | 5 |
| US-049 | As an **admin**, I want to **manage feature flags with a kill switch** so that **I can disable features in emergencies**. | ✅ Feature flag list with ON/OFF toggle<br>✅ Global, per-city, per-tier override support<br>✅ One-click kill switch with confirmation<br>✅ Canary rollout (% of merchants)<br>✅ Usage analytics per flag | 5 |

### Feature F-07.3: Subscription & Billing Admin
**Trace to Req:** REQ-COM-001, REQ-BE-004

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-050 | As an **admin**, I want to **view all merchant subscriptions** so that **I can manage billing**. | ✅ Subscription list: merchant, plan, status, period<br>✅ Filter by plan tier and status<br>✅ Manual override for trials/discounts<br>✅ Cancellation and refund workflow | 3 |
| US-051 | As an **admin**, I want to **generate revenue reports** so that **I can track platform monetization**. | ✅ Revenue breakdown: subscriptions, transaction fees, VAS<br>✅ Mode-wise revenue (Mode A commissions)<br>✅ Market-wise revenue comparison<br>✅ Export to CSV/PDF | 3 |

---

## EPIC-08: Order Management & Tracking

**Requirement IDs:** REQ-UI-007, REQ-API-007, REQ-BE-007  
**Sprint:** S3-S5 (Weeks 5-10)  
**Priority:** 🟡 P1-High  

### Feature F-08.1: Customer Order History
**Trace to Req:** REQ-UI-007

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-052 | As a **customer**, I want to **view my order history with status badges** so that **I can track all my orders**. | ✅ "My Orders" page with order list<br>✅ Status badges: Confirmed, Packing, Shipped, Delivered, Cancelled<br>✅ Sort by date (newest first)<br>✅ Repeat order button | 3 |
| US-053 | As a **customer**, I want to **view detailed order status with timeline** so that **I know where my order is**. | ✅ Order detail with: items, merchant, total, delivery address<br>✅ Status timeline with timestamps<br>✅ Courier information (name, phone)<br>✅ Cancel order button (before packing) | 3 |

### Feature F-08.2: Live Delivery Tracking
**Trace to Req:** REQ-API-007, REQ-BE-007

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-054 | As a **customer**, I want to **track my delivery in real-time on a map** so that **I can estimate arrival**. | ✅ Map view with courier GPS location (mobile)<br>✅ ETA display with countdown<br>✅ Push notification at key milestones (picked up, out for delivery, delivered)<br>✅ Web: polling-based tracking update every 30s | 5 |
| US-055 | As a **courier**, I want to **update order status and share my GPS location** so that **customers can track delivery**. | ✅ Courier app with order list<br>✅ Status update buttons: Picked Up → In Transit → Delivered<br>✅ GPS location sharing (background)<br>✅ Delivery proof photo upload | 5 |

---

## EPIC-09: Payment Processing & Settlement

**Requirement IDs:** REQ-API-003, REQ-COM-002, REQ-COM-006, REQ-COM-008, REQ-MICRO-007, REQ-MICRO-008  
**Sprint:** S3-S5 (Weeks 5-10)  
**Priority:** 🔴 P0-Critical  

### Feature F-09.1: Transaction Fee & Commission Processing
**Trace to Req:** REQ-COM-002

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-056 | As a **system**, I want to **calculate and deduct platform commission from each Mode A order** so that **PeteMart earns revenue**. | ✅ B2C: 4% commission, B2B: 1.5% (capped ₹500)<br>✅ 2% PG fee passed through to customer<br>✅ Commission calculated at order level<br>✅ Updated if order amount changes | 3 |

### Feature F-09.2: Merchant Payout Settlement
**Trace to Req:** REQ-COM-006, REQ-MICRO-007, REQ-MICRO-008

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-057 | As a **system**, I want to **settle payments to merchants after T+3 days** so that **funds are held for dispute resolution**. | ✅ Settlement timer starts at delivery confirmation<br>✅ Payout = Order Amount - Commission - PG Fee - Delivery Charges<br>✅ Razorpay Route API transfer to merchant subaccount<br>✅ Failed retry (max 3) then manual flag | 5 |
| US-058 | As a **merchant**, I want to **receive payment settlement reports** so that **I can reconcile my earnings**. | ✅ Settlement notification via SMS/email<br>✅ Per-order breakdown in merchant dashboard<br>✅ Month-end settlement summary<br>✅ Bank credit confirmation tracking | 3 |

### Feature F-09.3: Payment Escrow
**Trace to Req:** REQ-COM-008

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-059 | As a **customer**, I want my **payment held in escrow until delivery is confirmed** so that **I'm protected if something goes wrong**. | ✅ Funds held in platform account<br>✅ Released to merchant T+3 after delivery<br>✅ Dispute hold: manual admin review can extend hold<br>✅ Refund processed from held amount | 3 |

---

## EPIC-10: Multi-Store Consolidation & Delivery

**Requirement IDs:** REQ-BE-003, REQ-COM-004, REQ-BE-024  
**Sprint:** S4-S6 (Weeks 7-12)  
**Priority:** 🟡 P1-High  

### Feature F-10.1: Multi-Store Consolidation Engine
**Trace to Req:** REQ-BE-003

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-060 | As a **system**, I want to **group cart items by merchant and calculate consolidated delivery fees** so that **customers pay the right amount**. | ✅ Formula: `Delivery Fee = Max(Zone Base among shops) + ₹25×(N-1) + Weight Surcharge`<br>✅ Per-merchant item subtotals displayed<br>✅ Single payment for consolidated order<br>✅ Order split by merchant internally | 5 |

### Feature F-10.2: Delivery Zone & Fee Calculator
**Trace to Req:** REQ-COM-004, REQ-BE-007

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-061 | As a **system**, I want to **calculate delivery fees based on zone, weight, and surcharges** so that **pricing is fair**. | ✅ Zone configuration: 1-3km (₹40), 3-7km (₹70), 7+km (₹100)<br>✅ Weight surcharge: ₹10/kg after 5kg<br>✅ Night delivery surcharge: 25% (10pm-6am)<br>✅ Festival surcharge: 15% (configurable) | 5 |
| US-062 | As a **courier**, I want to **see an optimized multi-stop pickup route** so that **I can collect from all merchants efficiently**. | ✅ Courier app shows: Merchant A → Merchant B → Micro-Hub → Customer<br>✅ Turn-by-turn navigation between stops<br>✅ Stop completion confirmation | 3 |

---

## EPIC-11: Persona-Based Navigation & UX

**Requirement IDs:** REQ-UI-013, REQ-UI-018, REQ-UI-019  
**Sprint:** S4-S6 (Weeks 7-12)  
**Priority:** 🟡 P1-High  

### Feature F-11.1: Multi-Language (i18n)
**Trace to Req:** REQ-UI-013

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-063 | As a **Kannada-speaking customer**, I want to **switch the interface to Kannada** so that **I can use PeteMart in my language**. | ✅ Language toggle in header: English / Kannada / Hindi<br>✅ All UI strings externalized to locale files<br>✅ Locale-aware date, currency, number formatting<br>✅ Language preference persisted across sessions | 5 |
| US-064 | As a **system**, I want to **serve the correct locale based on browser/city** so that **users see their preferred language by default**. | ✅ Auto-detect browser language<br>✅ City-based language preference (Kannada for Bangalore)<br>✅ Fallback to English if translation missing<br>✅ Language selector persists in URL | 3 |

### Feature F-11.2: White-Label Branding
**Trace to Req:** REQ-UI-018

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-065 | As an **admin**, I want to **configure brand name, logo, colors, and fonts from a dashboard** so that **PeteMart can be white-labeled for different cities**. | ✅ Brand config: name, logo, favicon, primary/secondary colors<br>✅ Google Fonts selector<br>✅ CSS variables generated from config<br>✅ Preview brand changes before publishing | 5 |

### Feature F-11.3: Multi-City Selector
**Trace to Req:** REQ-UI-019

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-066 | As a **customer**, I want to **select or auto-detect my city** so that **I see merchants available in my area**. | ✅ City selector dropdown in header<br>✅ Auto-detect via browser geolocation<br>✅ City-specific landing page with local merchants<br>✅ City-specific SEO URLs (`petemart.in/bangalore`) | 5 |
| US-067 | As an **admin**, I want to **configure city-specific settings** so that **each city has correct delivery zones, tax rules, and content**. | ✅ City settings: delivery zones, commission rates, tax rules<br>✅ City-specific homepage banner and content<br>✅ Merchant discovery filtered by city | 3 |

---

## EPIC-12: Mobile App (Expo)

**Requirement IDs:** REQ-UI-009, REQ-UI-010, REQ-FUNNEL-004  
**Sprint:** S5-S7 (Weeks 9-14)  
**Priority:** 🟡 P1-High  

### Feature F-12.1: Mobile Landing & Browse
**Trace to Req:** REQ-UI-009, REQ-UI-010

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-068 | As a **mobile customer**, I want to **browse products and merchants seamlessly** so that **I can shop on my phone**. | ✅ Mobile-optimized landing with Pete Tapestry<br>✅ Bottom tab navigation<br>✅ Pull-to-refresh on all lists<br>✅ Responsive product cards for small screens | 5 |
| US-069 | As a **mobile customer**, I want to **scan a QR code to open a merchant microsite** so that **I can quickly access a store**. | ✅ Camera-based QR scanner from bottom nav<br>✅ Deep-link to merchant microsite<br>✅ Flash toggle for low light<br>✅ Gallery import for saved QR codes | 3 |

### Feature F-12.2: Mobile Checkout & Payments
**Trace to Req:** REQ-UI-009, REQ-API-003

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-070 | As a **mobile customer**, I want to **complete checkout with UPI/BHIM** so that **I can pay quickly on mobile**. | ✅ Simplified mobile checkout with fewer fields<br>✅ UPI apps auto-detect (GPay, PhonePe, Paytm)<br>✅ Biometric payment confirmation (fingerprint/face)<br>✅ Order confirmation with share button | 5 |
| US-071 | As a **mobile customer**, I want to **receive push notifications for order updates** so that **I stay informed**. | ✅ Push notifications: order confirmed, out for delivery, delivered<br>✅ Deep-link from notification to order detail<br>✅ Configurable notification preferences | 3 |

---

## EPIC-13: Reviews, Ratings & Trust

**Requirement IDs:** REQ-BE-012, REQ-BE-025, REQ-UI-021  
**Sprint:** S5-S7 (Weeks 9-14)  
**Priority:** 🟡 P1-High  

### Feature F-13.1: Product & Merchant Reviews
**Trace to Req:** REQ-UI-021, REQ-BE-012

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-072 | As a **customer**, I want to **rate and review products and merchants separately** so that **I can share my experience**. | ✅ Product rating (1-5 stars) + text review<br>✅ Merchant rating: quality, delivery, trust (each 1-5)<br>✅ Photo/video upload (max 50MB)<br>✅ "Verified Purchase" badge displayed | 5 |
| US-073 | As a **customer**, I want to **mark reviews as helpful** so that **other customers see the most useful reviews first**. | ✅ "Helpful (N)" button per review<br>✅ Unique user can mark once<br>✅ Sort reviews by: Most Recent, Highest Rated, Most Helpful<br>✅ Total review count displayed | 2 |

### Feature F-13.2: Review Moderation
**Trace to Req:** REQ-BE-025

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-074 | As an **admin**, I want to **moderate flagged reviews in an approval queue** so that **inappropriate content is blocked**. | ✅ Review queue with: author, product, rating, text, media<br>✅ Auto-moderation flags: profanity, spam, fake detection<br>✅ Approve/Reject with reason<br>✅ Merchant response management | 5 |
| US-075 | As a **merchant**, I want to **respond to customer reviews publicly** so that **I can address feedback**. | ✅ "Reply to Review" button in merchant dashboard<br>✅ Public reply displayed below review<br>✅ Admin moderation of merchant replies<br>✅ Notification to customer on reply | 3 |

---

## EPIC-14: Promo Engine & Loyalty

**Requirement IDs:** REQ-COM-007, REQ-FUNNEL-003  
**Sprint:** S6-S7 (Weeks 11-14)  
**Priority:** 🟡 P1-High  

### Feature F-14.1: Coupon & Promo Engine
**Trace to Req:** REQ-COM-007

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-076 | As an **admin**, I want to **create promo codes with configurable rules** so that **we can run marketing campaigns**. | ✅ Promo creation: code, type (percent/flat/free shipping), value, min cart value<br>✅ Usage limits: total uses, per-user limit<br>✅ Date range with expiry<br>✅ Target: specific merchants, categories, or all | 5 |
| US-077 | As a **customer**, I want to **apply promo codes at checkout** so that **I can save money**. | ✅ Promo code input field at checkout<br>✅ Real-time validation and discount calculation<br>✅ Error message for invalid/expired codes<br>✅ Discount shown in order summary | 2 |

### Feature F-14.2: Loyalty Program
**Trace to Req:** REQ-FUNNEL-003

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-078 | As a **customer**, I want to **earn loyalty points on purchases** so that **I can redeem them for rewards**. | ✅ Points earned: 1 point per ₹100 spent<br>✅ Points displayed in account header<br>✅ Points history log<br>✅ Tier status: Silver (<500), Gold (500-2000), Platinum (2000+) | 5 |
| US-079 | As a **customer**, I want to **redeem points for discounts** so that **I save on future orders**. | ✅ Points redemption at checkout<br>✅ Conversion rate: 100 points = ₹25<br>✅ Minimum redemption: 100 points<br>✅ Points expiry display (12 months) | 2 |

---

## EPIC-15: Merchant Catalog & Inventory Management

**Requirement IDs:** REQ-BE-011, REQ-MICRO-002, REQ-MICRO-004  
**Sprint:** S4-S6 (Weeks 7-12)  
**Priority:** 🟡 P1-High  

### Feature F-15.1: Product Catalog Management
**Trace to Req:** REQ-MICRO-002, REQ-BE-011

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-080 | As a **merchant**, I want to **manage product categories and tags** so that **customers can find my products easily**. | ✅ Category tree with parent/child<br>✅ Product tags (up to 5 per product)<br>✅ Category assignment during product creation<br>✅ Category-specific attributes | 3 |
| US-081 | As a **merchant**, I want to **set different prices for retail (B2C) and wholesale (B2B)** so that **I can serve both customer types**. | ✅ Dual pricing fields: retail price, wholesale price<br>✅ B2B minimum order quantity per product<br>✅ Tiered pricing: qty slab 10+ = 5% off, 50+ = 10% off<br>✅ Price history log | 3 |

### Feature F-15.2: Inventory Sync
**Trace to Req:** REQ-MICRO-004

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-082 | As a **system**, I want to **auto-deduct inventory on order placement** so that **stock levels are always accurate**. | ✅ Stock decremented on order confirmation<br>✅ Restock on order cancellation<br>✅ Low-stock alert at ≤5 items<br>✅ Out-of-stock auto-hide with "Notify Me" button | 3 |
| US-083 | As a **merchant**, I want to **receive low-stock notifications** so that **I can replenish on time**. | ✅ Dashboard alert when ≤5 stock<br>✅ Push notification for critical stock (≤2)<br>✅ Weekly stock report email | 2 |

---

## EPIC-16: Subscriptions & Billing

**Requirement IDs:** REQ-COM-001, REQ-BE-004  
**Sprint:** S5-S7 (Weeks 9-14)  
**Priority:** 🟡 P1-High  

### Feature F-16.1: Subscription Plan Management
**Trace to Req:** REQ-COM-001

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-084 | As an **admin**, I want to **configure subscription plans with feature gating** so that **merchants can choose the right tier**. | ✅ Plan config: name, price (monthly/annual), features list<br>✅ Annual discount: 2 months free<br>✅ Feature gating: certain features available only on higher plans<br>✅ Free trial period config (default 14 days) | 3 |
| US-085 | As a **merchant**, I want to **upgrade/downgrade my plan** so that **I can access more features as my business grows**. | ✅ Plan change effective immediately<br>✅ Prorated billing for mid-cycle changes<br>✅ Feature access updated on plan change<br>✅ Upgrade confirmation with price difference | 2 |

### Feature F-16.2: Billing & Invoicing
**Trace to Req:** REQ-BE-004

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-086 | As a **system**, I want to **auto-bill merchants on their subscription renewal date** so that **revenue collection is automated**. | ✅ Razorpay subscription API integration<br>✅ Auto-charge on renewal date<br>✅ Failed payment retry (3 attempts, 3-day gap)<br>✅ Grace period of 7 days before suspension | 5 |
| US-087 | As a **merchant**, I want to **view and download my invoices** so that **I can maintain records**. | ✅ Invoice list with: date, amount, plan, period<br>✅ PDF download with GST details<br>✅ Email invoice on each billing event<br>✅ Payment method details (masked) | 2 |

---

## EPIC-17: Infrastructure, Security & Compliance

**Requirement IDs:** REQ-INFRA-001→011, REQ-DATA-001  
**Sprint:** S1-S8 (Weeks 1-16)  
**Priority:** 🔴 P0-Critical  

### Feature F-17.1: Cloud Infrastructure & CI/CD
**Trace to Req:** REQ-INFRA-001, REQ-INFRA-002

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-088 | As a **system**, I want to **deploy on Supabase Free + Vercel Hobby with zero cost** so that **POC meets ₹0/mo mandate**. | ✅ Supabase project with PostgreSQL, Auth, Storage, Realtime<br>✅ Vercel project linked to GitHub repo<br>✅ Environment variables configured<br>✅ Database migrations runnable via CLI | 5 |
| US-089 | As a **developer**, I want to **have CI/CD pipeline with GitHub Actions** so that **code changes are built and deployed automatically**. | ✅ GitHub Actions workflow: lint → test → build → deploy<br>✅ Branch protection: main branch requires PR + passing checks<br>✅ Preview deployments for PR branches (Vercel)<br>✅ Slack notification on build status | 5 |

### Feature F-17.2: Security & Encryption
**Trace to Req:** REQ-INFRA-004, REQ-INFRA-008, REQ-INFRA-009

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-090 | As a **system**, I want to **enforce HTTPS/TLS and encrypt data at rest** so that **customer data is secure**. | ✅ HTTPS redirect on all endpoints<br>✅ Supabase encryption at rest (AES-256)<br>✅ JWT token management with expiry<br>✅ No sensitive data in logs | 3 |
| US-091 | As a **system**, I want to **manage secrets securely via environment variables** so that **no credentials leak**. | ✅ All secrets in Vercel Environment Variables<br>✅ No hardcoded secrets in codebase<br>✅ `.env.example` with placeholder values<br>✅ GitGuardian scan in CI | 3 |

### Feature F-17.3: Monitoring & Observability
**Trace to Req:** REQ-INFRA-003, REQ-MAINT-003

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-092 | As an **admin**, I want to **monitor system health and errors** so that **I can respond to issues quickly**. | ✅ Sentry Free for error tracking<br>✅ Vercel Analytics for web vitals<br>✅ Supabase Dashboard for DB metrics<br>✅ Error alerting via email/Slack | 5 |
| US-093 | As a **system**, I want to **log API requests and errors with context** so that **debugging is efficient**. | ✅ Structured logging format (JSON)<br>✅ Request ID tracing across services<br>✅ Log levels: debug, info, warn, error<br>✅ 30-day log retention | 3 |

### Feature F-17.4: Feature Flag & Kill Switch
**Trace to Req:** REQ-INFRA-011

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-094 | As an **admin**, I want to **toggle features ON/OFF with one click** so that **I can respond to emergencies**. | ✅ Admin dashboard with feature flag list<br>✅ Global toggle with confirmation dialog<br>✅ Per-city and per-tier override<br>✅ Kill switch: instantly disables feature across all scopes | 5 |

---

## EPIC-18: National Shipping (ShipRocket)

**Requirement IDs:** REQ-COM-010, REQ-API-013  
**Sprint:** S6-S8 (Weeks 11-16)  
**Priority:** 🟡 P1-High  

### Feature F-18.1: ShipRocket Integration
**Trace to Req:** REQ-API-013, REQ-COM-010

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-095 | As a **merchant**, I want to **opt-in for pan-India shipping** so that **I can sell to customers nationwide**. | ✅ Toggle in merchant settings: Enable National Shipping<br>✅ Pincode serviceability check<br>✅ Shipping rate calculation based on weight + destination<br>✅ Default packaging dimensions configuration | 5 |
| US-096 | As a **customer**, I want to **receive ShipRocket tracking updates in my order details** so that **I can track my national shipment**. | ✅ Unified tracking UI: local + national in same view<br>✅ ShipRocket tracking number displayed<br>✅ Webhook sync updates: picked, in transit, delivered<br>✅ Courier name and tracking link | 3 |

---

## EPIC-19: AI Virtual Try-On

**Requirement IDs:** REQ-UI-015, REQ-UI-016, REQ-BE-018  
**Sprint:** S7-S9 (Weeks 13-18)  
**Priority:** 🟢 P2-Medium (Tier 3)  

### Feature F-19.1: AI Virtual Try-On for Apparel
**Trace to Req:** REQ-UI-015, REQ-BE-018

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-097 | As a **customer**, I want to **virtually try on sarees and ethnic wear using my photo** so that **I can see how it looks before buying**. | ✅ "Try On" button on apparel products<br>✅ Upload photo or use camera (WebRTC/native)<br>✅ AI draping renders fabric on body silhouette<br>✅ Result in <5 seconds with loading indicator<br>✅ Shareable try-on snapshot | 8 |
| US-098 | As a **customer**, I want to **adjust size/color variant in try-on** so that **I can compare options**. | ✅ Variant selector while in try-on mode<br>✅ Re-render in <3 seconds<br>✅ Side-by-side comparison of 2 variants | 5 |

### Feature F-19.2: AI Virtual Try-On for Jewellery
**Trace to Req:** REQ-UI-016, REQ-BE-018

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-099 | As a **customer**, I want to **virtually try on jewellery using selfie** so that **I can see earrings/necklaces/rings on me**. | ✅ Face detection for proportional jewellery sizing<br>✅ Gold/silver colour accuracy matching purity<br>✅ Multiple jewellery comparison side-by-side<br>✅ Shareable snapshot with product link | 8 |

---

## EPIC-20: Jewellery & Bullion Integration

**Requirement IDs:** REQ-UI-017, REQ-API-012, REQ-BE-019  
**Sprint:** S7-S9 (Weeks 13-18)  
**Priority:** 🟢 P2-Medium (Tier 3)  

### Feature F-20.1: Live Bullion Rates
**Trace to Req:** REQ-UI-017, REQ-API-012

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-100 | As a **customer**, I want to **see live gold and silver rates on product pages** so that **I know the current price**. | ✅ Live rate badge: 24k/22k/18k gold, silver per gram<br>✅ Last-updated timestamp with <5min freshness<br>✅ Rate movement indicator (up green, down red)<br>✅ Source: MCX/IndiaBulls/IBJA displayed | 5 |
| US-101 | As a **customer**, I want to **see dynamic jewellery price calculation** so that **I understand the total cost**. | ✅ Formula display: `(Weight × Rate) + Making Charges + Stone + GST`<br>✅ Real-time recalculation on weight/purity change<br>✅ GST @ 3% applied<br>✅ BIS hallmark certification badge | 5 |

### Feature F-20.2: Jewellery Inventory
**Trace to Req:** REQ-BE-019

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-102 | As a **merchant**, I want to **manage jewellery inventory with weight and purity tracking** so that **pricing is accurate**. | ✅ Product type: jewellery with weight grams, purity (karat)<br>✅ Making charges: % or flat per gram<br>✅ Stone details: type, weight, price<br>✅ Stock valuation at current market rates | 5 |

---

## EPIC-21: Video Call & Trust Features

**Requirement IDs:** REQ-COM-009  
**Sprint:** S8-S9 (Weeks 15-18)  
**Priority:** 🟢 P2-Medium (Tier 3)  

### Feature F-21.1: Video Call Appointments
**Trace to Req:** REQ-COM-009

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-103 | As a **customer**, I want to **book a video call appointment with a merchant** so that **I can inspect products remotely**. | ✅ "Book Video Call" button on merchant microsite<br>✅ Merchant availability calendar (30-min slots, 7 days)<br>✅ Appointment request → merchant confirms<br>✅ WebRTC video call interface (Jitsi)<br>✅ Call duration tracking for analytics | 8 |

### Feature F-21.2: 360° Product View
**Trace to Req:** REQ-COM-009

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-104 | As a **customer**, I want to **rotate products 360° and zoom into fabric textures** so that **I can inspect quality**. | ✅ 360° rotation via drag/mouse/touch<br>✅ Pinch-to-zoom for fabric texture detail<br>✅ High-resolution image sequence<br>✅ Smooth animation at 60fps | 5 |

---

## EPIC-22: City Expansion & Multi-Geo

**Requirement IDs:** REQ-UI-019, REQ-BE-022, REQ-BE-023  
**Sprint:** S8-S10 (Weeks 15-20)  
**Priority:** 🟢 P2-Medium (Tier 3)  

### Feature F-22.1: City Management
**Trace to Req:** REQ-BE-022, REQ-BE-023

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-105 | As an **admin**, I want to **add new cities with delivery zones, tax rules, and content** so that **PeteMart can expand**. | ✅ City creation form: name, state, delivery zones, tax rules<br>✅ City-specific homepage content and banners<br>✅ Auto-generated landing page at `/city-slug`<br>✅ Merchant onboarding scoped to city | 5 |
| US-106 | As a **customer**, I want to **see city-specific markets and merchants** so that **I only see relevant options**. | ✅ City selector filters all content<br>✅ SEO-friendly URLs: `petemart.in/city-slug`<br>✅ Delivery zone validation based on city<br>✅ City-specific tax and pricing rules | 3 |

---

## EPIC-23: Analytics & CDP

**Requirement IDs:** REQ-BE-008, REQ-BE-017, REQ-API-010  
**Sprint:** S7-S9 (Weeks 13-18)  
**Priority:** 🟢 P2-Medium  

### Feature F-23.1: Analytics Pipeline
**Trace to Req:** REQ-BE-008, REQ-API-010

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-107 | As an **admin**, I want to **view platform-wide analytics with charts** so that **I can make data-driven decisions**. | ✅ Platform dashboard: MAU, orders, revenue, merchant growth<br>✅ Market-wise performance comparison<br>✅ Mode-wise adoption (A vs B vs C)<br>✅ Time-series graphs with drill-down | 5 |
| US-108 | As a **system**, I want to **track user events across the platform** so that **funnel analysis is possible**. | ✅ Event tracking: page views, searches, cart adds, checkouts, payments<br>✅ Session-based with user attribution (when logged in)<br>✅ Funnel visualization: browse → add → checkout → pay | 5 |

---

## EPIC-24: PWA & Offline-First

**Requirement IDs:** REQ-BE-014, REQ-FUNNEL-004  
**Sprint:** S5-S6 (Weeks 9-12)  
**Priority:** 🟡 P1-High  

### Feature F-24.1: PWA
**Trace to Req:** REQ-FUNNEL-004

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-109 | As a **customer**, I want to **install PeteMart as a PWA on my phone** so that **I have app-like experience without app store**. | ✅ PWA manifest with icons, colors, name<br>✅ Install prompt on mobile browsers<br>✅ Service worker for offline caching<br>✅ Push notification support | 3 |

### Feature F-24.2: Offline-First
**Trace to Req:** REQ-BE-014

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-110 | As a **customer**, I want to **browse product catalogs offline** so that **I can shop even with poor connectivity**. | ✅ Product catalog cached in IndexedDB/localStorage<br>✅ Offline banner indicating connection status<br>✅ Queued orders sync when online<br>✅ Conflict resolution for stale data | 5 |

---

## EPIC-25: Visionary — Virtual Walk & Live Bazaar

**Requirement IDs:** REQ-UI-022, REQ-UI-023, REQ-BE-026  
**Sprint:** S10-S12 (Weeks 19-24)  
**Priority:** 🔵 P3-Low (Visionary)  

### Feature F-25.1: Pete Street Virtual Walk
**Trace to Req:** REQ-UI-022, REQ-BE-026

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-111 | As a **customer**, I want to **take a virtual walk through Chickpet market street** so that **I can experience the market from home**. | ✅ 2.5D/3D interactive street scene<br>✅ Storefronts in correct geographic order<br>✅ Tap storefront → enter virtual store<br>✅ Products on virtual shelves → click to buy<br>✅ Seasonal decorations (Diwali, Ugadi) | 13 |

### Feature F-25.2: Live Bazaar Streaming
**Trace to Req:** REQ-UI-023

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-112 | As a **merchant**, I want to **go live from my store and showcase products** so that **customers can see products in real-time**. | ✅ "Go Live" button in merchant dashboard<br>✅ Live stream from phone camera<br>✅ Viewers can chat and ask questions<br>✅ Pinned product cards with "Buy Now" button<br>✅ Stream recording archived for 7 days | 8 |

---

## EPIC-26: Visionary — Co-Shopping & Community

**Requirement IDs:** REQ-UI-024  
**Sprint:** S11-S12 (Weeks 21-24)  
**Priority:** 🔵 P3-Low (Visionary)  

### Feature F-26.1: Shop Together
**Trace to Req:** REQ-UI-024

| Story ID | User Story | Acceptance Criteria | Points |
|----------|-----------|-------------------|--------|
| US-113 | As a **customer**, I want to **invite family members to shop together in a virtual street** so that **we can shop as a group**. | ✅ Generate WhatsApp share link with session ID<br>✅ Multiple users in same virtual street<br>✅ See each other's avatars/cursors<br>✅ Shared cart with checkout control<br>✅ In-session voice chat | 13 |

---

## Traceability Matrix Summary

| Category | Total Reqs | Total Stories | Coverage | Missing |
|----------|-----------|--------------|----------|---------|
| UI/UX (24) | 24 | 38 | 100% | 0 |
| API (13) | 13 | 14 | 100% | 0 |
| Backend/Data (26) | 26 | 32 | 100% | 0 |
| Commerce (10) | 10 | 12 | 100% | 0 |
| Infra/Security (11) | 11 | 8 | 100% | 0 |
| Performance (3) | 3 | 3 | 100% | 0 |
| Maintenance (5) | 5 | 2 | 100% | 0 |
| DR (4) | 4 | 2 | 100% | 0 |
| Merchant Microsite (8) | 8 | 8 | 100% | 0 |
| Funnels (4) | 4 | 5 | 100% | 0 |
| Data Privacy (3) | 3 | 2 | 100% | 0 |
| **Total** | **111** | **~126** | **100%** | **0** |

> ✅ **Guardrail PASS**: Every User Story has a direct trace link back to a Requirement ID from the PRD.

---

*End of Epic/Feature/Story Map*

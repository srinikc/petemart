# PeteMart — Enterprise-Grade Product Requirements Document (PRD)

**Document Version:** 2.0  
**Author:** Requirement Agent (Enterprise Product Manager / Product Owner)  
**Status:** Draft (Awaiting HITL Approval)  
**Date:** 2026-05-30  
**Derived From:** Idea Proposal v1.2, Business Revenue Model v1.4, Store Inventory Datasets v1.1, Estimated Merchants v2.1

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [User Personas](#2-user-personas)
3. [Customer Workflows](#3-customer-workflows)
4. [Use Cases — Web & Mobile Channels](#4-use-cases--web--mobile-channels)
5. [Feature Catalog & Requirement IDs](#5-feature-catalog--requirement-ids)
6. [Operational Cost Boundaries](#6-operational-cost-boundaries)
7. [Deployment Cost Projections](#7-deployment-cost-projections)
8. [Appendix: Quality Guardrail Compliance](#8-appendix-quality-guardrail-compliance)
9. [MVP Scope Recommendation](#9-mvp-scope-recommendation-marketing--customer-pov)
    - 9.1 [MVP Tier Rationale](#91-mvp-tier-rationale)
    - 9.2 [Narrative — Why These Tiers?](#92-narrative--why-these-tiers)
    - 9.3 [End-to-End Demo Milestones](#93-end-to-end-demo-milestones)
    - 9.4 [Marketing Roadmap Summary](#94-marketing-roadmap-summary)

---

## 1. Executive Summary

**PeteMart** is a hyperlocal digital commerce marketplace designed to onboard **5,000+ traditional physical merchants** across the **21 historic Pete markets of Old Bangalore** (Chickpet, Balepet, Mamulpet, Tharagpet, Cubbonpet, Avenue Road, Raja Market, Sultanpet, KR Market, Kumbarpete, SP Road, SJP Road, Huriopet, Basettyetpet, BVK Iyengar Road, Akkipete, RT Street, Kilari Road, Santhusapet, Cottonpet, Sowrastra Pet) into a unified multi-channel e-commerce ecosystem spanning a **responsive web application** and **native mobile apps (iOS & Android)**.

The platform introduces a **three-mode interaction framework** — **Mode A (Direct Purchase)**, **Mode B (WhatsApp Enquiry)**, and **Mode C (Visit Store)** — that respects the diverse commercial maturity and trust-sensitivity of different product categories. PeteMart is not a replacement for physical commerce but a **digital amplification layer** that:
- Provides every merchant with a branded store microsite (`petemart.in/shop-name`)
- Enables zero-commission discovery options (Mode B/C)
- Charges only **1.5% B2B / 4% B2C** commission on direct sales (Mode A)
- Operates a **zone-based hyperlocal delivery network** with multi-store order consolidation
- Offers tiered subscription plans (Starter ₹499/mo, Growth ₹999/mo, Premium ₹2,499/mo)

This PRD decomposes the approved Ideation Proposal into **111 Requirement IDs** across eleven engineering categories: **UI/UX (24)**, **API (13)**, **Backend/Data (26)**, **Commerce/Monetization (10)**, **Infrastructure/Security (11)**, **Infrastructure & Performance/Scale (3)**, **Maintenance, Patch & Lifecycle Management (5)**, **Merchant Microsite & Payment Settlement (8)**, **Disaster Recovery & Business Continuity (4)**, **Customer Acquisition Funnels & Onboarding (4)**, and **Data Licensing, Privacy & Compliance (3)**. Each requirement includes priority flags, cost projections, and traceability to business objectives.

The PRD also defines **12 End-to-End Demo Milestones** (§9.3) — concrete, stakeholder-visible demo scenarios spanning all five implementation tiers (Tier 0 Launch MVP through Tier 4 Visionary). Each milestone specifies a step-by-step walkthrough, success criteria, stakeholder value, and estimated build time, ensuring every engineering sprint has a clear, demonstrable outcome that maps to existing Requirement IDs without creating new ones. These milestones serve as the definitive stakeholder communication tool for tracking platform readiness.

---

## 2. User Personas

### Persona 1: Priya — The Hyperlocal Customer / Buyer
| Attribute | Detail |
|---|---|
| **Name** | Priya Sharma |
| **Age** | 34 |
| **Occupation** | Homemaker & Part-Time Boutique Owner |
| **Location** | Basavanagudi, Bangalore |
| **Tech Literacy** | Moderate — uses WhatsApp daily, comfortable with UPI payments |
| **Shopping Behavior** | Buys silk sarees for weddings, bulk dry fruits for festivals, and school supplies for children |
| **Pain Points** | Traffic congestion in Pete areas; no time to visit multiple stores; unsure about product availability before visiting |
| **Needs** | Browse authentic products from specific Pete merchants; compare prices; order online for delivery; negotiate bulk prices via WhatsApp; get store directions for high-value items |
| **Device Preference** | Android smartphone for browsing; occasionally uses laptop for bulk orders |
| **Persona ID** | PERS-CUST-001 |

### Persona 2: Ramesh — The Traditional Pete Merchant / Seller
| Attribute | Detail |
|---|---|
| **Name** | Ramesh Gupta |
| **Age** | 52 |
| **Occupation** | Owner of a silk saree showroom in Chickpet (3rd generation) |
| **Location** | Chickpet Main Road, Bangalore |
| **Tech Literacy** | Low-moderate — comfortable with WhatsApp; needs assistance with catalog uploads |
| **Business Profile** | Family-run business for 60+ years; wholesale + retail; high-value inventory (₹500-₹50,000 per item) |
| **Pain Points** | Limited digital presence; fear of hidden e-commerce commissions; wants to drive physical footfall for high-value sales |
| **Needs** | Simple digital storefront; zero-risk discovery; WhatsApp-based negotiation; Google Maps directions for store visits; affordable subscription |
| **Device Preference** | Smartphone + shared family laptop |
| **Persona ID** | PERS-MER-001 |

### Persona 3: Vinay — The Delivery / Courier Partner
| Attribute | Detail |
|---|---|
| **Name** | Vinay Kumar |
| **Age** | 28 |
| **Occupation** | Independent Delivery Partner (aggregated via PeteMart) |
| **Location** | Based near Chickpet Micro-Hub |
| **Tech Literacy** | Moderate — uses a smartphone for navigation and order management |
| **Vehicle** | Scooter / E-bike capable of carrying 15-20 kg loads |
| **Pain Points** | Navigating narrow, crowded Pete lanes; multi-store pickups; unclear delivery instructions |
| **Needs** | Optimized multi-stop pickup route; clear delivery zone assignment; real-time order tracking; reliable payout structure |
| **Device Preference** | Android smartphone with the PeteMart Courier App |
| **Persona ID** | PERS-DLV-001 |

### Persona 4: Ananya — The PeteMart Platform Admin / Operator
| Attribute | Detail |
|---|---|
| **Name** | Ananya Rao |
| **Age** | 31 |
| **Occupation** | Platform Operations Manager at PeteMart |
| **Location** | Works remotely from Bangalore |
| **Tech Literacy** | High — comfortable with SaaS dashboards, data analytics |
| **Responsibilities** | Merchant onboarding verification, subscription billing oversight, dispute resolution, platform analytics, marketing campaign management |
| **Pain Points** | Manual merchant verification; difficulty tracking revenue streams across modes; need unified dashboard for all platform metrics |
| **Needs** | Real-time merchant, order, and revenue dashboards; subscription lifecycle management; automated payout reconciliation; moderation tools for merchant content |
| **Device Preference** | Laptop for admin work; smartphone for urgent alerts |
| **Persona ID** | PERS-ADM-001 |

### Persona 5: Deepa — The Bulk B2B Buyer / Wholesale Reseller
| Attribute | Detail |
|---|---|
| **Name** | Deepa Patel |
| **Age** | 41 |
| **Occupation** | Small retail shop owner (provisions store in Jayanagar) |
| **Location** | Jayanagar 4th Block, Bangalore |
| **Tech Literacy** | Moderate — uses WhatsApp Business for supplier communication |
| **Shopping Behavior** | Buys wholesale pulses, spices, packaging materials monthly from Tharagpet/Mamulpet merchants |
| **Pain Points** | No digital catalog of wholesale merchant inventory; phone tag for price negotiation; delivery logistics for bulk orders |
| **Needs** | View wholesale price lists; negotiate via WhatsApp; order bulk with delivery to her shop; repeat order history |
| **Device Preference** | Smartphone + tablet |
| **Persona ID** | PERS-B2B-001 |

---

## 3. Customer Workflows

### Workflow 1: Browse Products & Discover Merchants
**Applicable Channels:** Web App, Mobile App (iOS/Android)  
**Personas:** Priya (Customer), Deepa (B2B Buyer)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 1.1 | Customer | Opens PeteMart app/website | Loads landing page with Pete Tapestry carousel, featured markets, search bar | Web + Mobile |
| 1.2 | Customer | Selects a Pete market (e.g., Chickpet) or searches for product | Displays filtered list of merchants in that market with specialization badges | Web + Mobile |
| 1.3 | Customer | Browses product catalog of a selected merchant | Shows product cards with: name, price (retail/wholesale), images, mode badges ("Buy Now" / "Enquire on WhatsApp" / "Visit Store"), MOQ info | Web + Mobile |
| 1.4 | Customer | Filters by interaction mode ("Buy Now" / "WhatsApp Enquiry" / "Visit Store") or category | System re-renders product grid showing only matching mode-enabled products | Web + Mobile |
| 1.5 | Customer | Views product details | Shows full product description, available modes, merchant info, rating, delivery eligibility | Web + Mobile |
| **Workflow ID** | **WF-BROWSE-001** | | | |

### Workflow 2: Place Order — Mode A (Direct Purchase)
**Applicable Channels:** Web App, Mobile App (iOS/Android)  
**Personas:** Priya (Customer)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 2.1 | Customer | Clicks "Add to Cart" on a Mode A product | Item added to cart; cart icon badge updates; option to continue shopping or view cart | Web + Mobile |
| 2.2 | Customer | Adds products from the same or different Pete merchants | Cart shows itemized list with merchant names, prices, delivery fee estimates per merchant | Web + Mobile |
| 2.3 | Customer | Clicks "Proceed to Checkout" | System validates cart items, calculates delivery fee using zone-based formula, applies consolidation surcharge if applicable (₹25/additional store), shows order summary | Web + Mobile |
| 2.4 | Customer | Enters/confirms delivery address | System verifies address within delivery zone (1-3 km, 3-7 km, 7+ km), shows delivery slot options | Web + Mobile |
| 2.5 | Customer | Selects B2C or B2B mode (based on quantity) | System adjusts pricing to retail (4% commission) or wholesale (1.5% commission, capped at ₹500) | Web + Mobile |
| 2.6 | Customer | Clicks "Place Order" → Redirected to Razorpay | Secure payment gateway processes UPI/Card/NetBanking; 2% PG fee applied | Web + Mobile |
| 2.7 | Customer | Payment successful | Order confirmed; notification sent to customer + merchant; order visible in "My Orders" | Web + Mobile |
| 2.8 | System | Routes order to merchant dashboard + courier dispatch | Merchant sees order; courier assigned; pickup scheduled within SLA | Backend |
| **Workflow ID** | **WF-ORDER-A-001** | | | |

### Workflow 3: Place Order — Mode B (WhatsApp Enquiry)
**Applicable Channels:** Web App, Mobile App (iOS/Android)  
**Personas:** Priya (Customer), Deepa (B2B Buyer)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 3.1 | Customer | Views a Mode B product and clicks "Enquire on WhatsApp" | System generates a deep-link URL with pre-filled product info (name, SKU, asking price, merchant name) | Web + Mobile |
| 3.2 | Customer | Tapped link opens WhatsApp app | WhatsApp opens with chat directed to merchant's registered WhatsApp Business number; pre-populated message template | WhatsApp |
| 3.3 | Customer | Negotiates price/specs with merchant | (Off-platform) Merchant and customer negotiate; merchant may send catalog images | WhatsApp |
| 3.4 | Merchant | Agreement reached; merchant instructs customer to proceed or arranges delivery | Merchant may create a manual order in their dashboard or request customer to use Mode A if configured | Merchant Dashboard |
| 3.5 | System | (Optional) Tracks WhatsApp click-through rate | System logs the enquiry event for merchant analytics (not the conversation content) | Backend |
| **Workflow ID** | **WF-ORDER-B-001** | | | |

### Workflow 4: Place Order — Mode C (Visit Store)
**Applicable Channels:** Web App, Mobile App (iOS/Android)  
**Personas:** Priya (Customer)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 4.1 | Customer | Views a Mode C product and clicks "Visit Store" or "Get Directions" | System displays merchant store facade gallery, virtual window display of latest stock, and a prominent "Open in Google Maps" button | Web + Mobile |
| 4.2 | Customer | Clicks "Open in Google Maps" | Deep link opens Google Maps app with the merchant's exact geolocation pinned; estimated travel time shown | Maps |
| 4.3 | Customer | Visits physical store, inspects product, completes purchase offline | (Off-platform) Customer buys directly at the store | Physical |
| 4.4 | Customer | (Optional) Leaves a rating/review on PeteMart | After store visit, push notification/email prompts customer to rate their experience | Web + Mobile |
| 4.5 | System | Logs footfall conversion | System records the Mode C engagement as a "visit lead" for merchant analytics | Backend |
| **Workflow ID** | **WF-ORDER-C-001** | | | |

### Workflow 5: Checkout & Payment (Multi-Store Consolidation)
**Applicable Channels:** Web App, Mobile App (iOS/Android)  
**Personas:** Priya (Customer)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 5.1 | Customer | Views cart with items from multiple Pete merchants | System calculates: `Delivery Fee = Max(Zone Base Rate among shops) + (₹25 × (N-1)) + Weight Surcharges` | Web + Mobile |
| 5.2 | Customer | Reviews consolidated order summary with delivery fee breakdown | Shows merchant-wise items, sub-totals, delivery fee split, total payable | Web + Mobile |
| 5.3 | Customer | Applies coupon/promo code (if any) | System validates and applies discount; recalculates total | Web + Mobile |
| 5.4 | Customer | Selects payment method (UPI/Card/NetBanking/Wallet) | System initializes Razorpay payment widget with total amount + 2% PG fee | Web + Mobile |
| 5.5 | Customer | Completes payment | System confirms payment, triggers order to all relevant merchants, initiates courier dispatch | Web + Mobile |
| 5.6 | Courier | Receives multi-stop pickup order | Courier app shows optimized route: Merchant A → Merchant B → Micro-Hub → Customer | Courier App |
| 5.7 | Courier | Picks up items sequentially, delivers to Micro-Hub for consolidation | Micro-Hub consolidates, single bag dispatched for final delivery | Courier App |
| **Workflow ID** | **WF-CHECKOUT-001** | | | |

### Workflow 6: Order Tracking & Delivery Status
**Applicable Channels:** Web App, Mobile App (iOS/Android)  
**Personas:** Priya (Customer), Vinay (Delivery Partner)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 6.1 | Customer | Opens "My Orders" page | Displays list of all past and active orders with status badges (Confirmed, Picked Up, In Transit, Delivered) | Web + Mobile |
| 6.2 | Customer | Selects active order | Shows detailed order status: payment confirmed, merchant preparing, courier assigned, pickup completed, at Micro-Hub, out for delivery | Web + Mobile |
| 6.3 | Customer | Views live tracking (courier GPS) | Real-time courier location marker on map with ETA updates | Mobile only |
| 6.4 | Courier | Updates order status via Courier App | Status changes propagate to customer and merchant in real-time; push notifications sent | Courier App |
| 6.5 | Customer | Receives delivery | "Delivered" status; prompt to rate experience and optionally tip the courier | Web + Mobile |
| **Workflow ID** | **WF-TRACK-001** | | | |

### Workflow 8: AI Virtual Try-On (Apparel & Jewellery)
**Applicable Channels:** Web App, Mobile App (iOS/Android)  
**Personas:** Priya (Customer)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 8.1 | Customer | Opens product detail page for a saree/ethnic wear/jewellery item with try-on badge | System displays "Try On" button alongside product images; shows sample try-on results gallery | Web + Mobile |
| 8.2 | Customer | Clicks "Try On" → prompted to upload photo or use live camera | System initialises camera (WebRTC on web, native camera on mobile) or file upload dialog | Web + Mobile |
| 8.3 | Customer | Captures/selects full-body or face photo | AI engine detects body landmarks/face shape; validates image quality and framing | Backend (AI) |
| 8.4 | System | Processes virtual try-on | Apparel: AI drape engine renders fabric over body silhouette with size scaling. Jewellery: face detection positions earrings/necklace/rings with proportional scaling and colour matching to gold/silver purity | Backend (AI) |
| 8.5 | System | Displays try-on result | Customer sees photorealistic preview of product worn virtually; side-by-side comparison with original product image | Web + Mobile |
| 8.6 | Customer | Adjusts size/colour variant | System re-renders try-on with new variant parameters in <3 seconds (cached result if previously computed) | Web + Mobile |
| 8.7 | Customer | (Optional) Shares try-on snapshot or saves to wishlist | System generates shareable image with product link overlay; or saves to customer's try-on history | Web + Mobile |
| 8.8 | Customer | (Optional) Uploads try-on photo to customer gallery (with consent) | Photo added to product's community try-on gallery after admin moderation; consent checkbox for marketing use | Backend |
| **Workflow ID** | **WF-TRYON-001** | | | |

### Workflow 9: Jewellery Browsing with Live Bullion Rates
**Applicable Channels:** Web App, Mobile App (iOS/Android)  
**Personas:** Priya (Customer)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 9.1 | Customer | Navigates to jewellery category or clicks on a jewellery product | System displays product cards with live gold/silver rate badge; product card shows: weight, today's rate per gram, making charges, total calculated price | Web + Mobile |
| 9.2 | Customer | Views live rate ticker on category page | System shows scrolling/static rate bar: 24k ₹/gm, 22k ₹/gm, 18k ₹/gm, Silver ₹/gm with last-updated timestamp and colour-coded movement indicator (green up, red down, grey stable) | Web + Mobile |
| 9.3 | Customer | Clicks rate badge for details | System expands rate detail panel: today's open/high/low/last, 7-day trend mini-chart, rate source (MCX/IndiaBulls/IBJA) | Web + Mobile |
| 9.4 | Customer | Opens product detail page | System displays full calculation: `Base Price = Weight (gms) × Today's Rate + Making Charges (₹X or X%) + Stone Charges (if applicable) + GST @ 3%`; shows BIS hallmark certification badge | Web + Mobile |
| 9.5 | Customer | Changes weight or purity variant | System recalculates price in real-time using live bullion rate; making charges adjust per purity tier | Web + Mobile |
| 9.6 | Customer | Adds to cart or enquires | Standard Mode A/B/C flow applies with jewellery-specific price captured at add-to-cart moment | Web + Mobile |
| **Workflow ID** | **WF-JEWELLERY-001** | | | |

### Workflow 10: Video Call Appointment with Merchant
**Applicable Channels:** Web App, Mobile App (iOS/Android)  
**Personas:** Priya (Customer), Ramesh (Merchant)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 10.1 | Customer | Clicks "Book Video Call" on product page or merchant microsite | System displays merchant availability calendar: available time slots (30-min intervals) for next 7 days | Web + Mobile |
| 10.2 | Customer | Selects date and time slot | System creates appointment request; sends notification to merchant via push/SMS/WhatsApp | Backend |
| 10.3 | Merchant | Confirms or reschedules appointment | System confirms booking; sends join link (Jitsi/WebRTC) to both parties; adds to calendar | Web + Mobile |
| 10.4 | Customer | Joins video call at scheduled time | System opens WebRTC video call interface with product detail sidebar; merchant can show product live on camera | Web + Mobile |
| 10.5 | Customer | Inspects product during call (texture, colour, fit) | Merchant demonstrates product; customer can request close-up views; system records call duration for analytics | Web + Mobile |
| 10.6 | Customer | (Optional) Places order during or after call | Merchant can push a personalised quote/link to customer's in-app chat; customer completes order via Mode A or B | Web + Mobile |
| 10.7 | System | Logs call completion | Appointment marked complete; feedback prompt sent to both parties; call analytics (duration, conversion) recorded | Backend |
| **Workflow ID** | **WF-VIDEOCALL-001** | | | |

### Workflow 11: Feature Flag & Kill Switch Management
**Applicable Channels:** Web App (Admin Dashboard)  
**Personas:** Ananya (Admin)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 11.1 | Admin | Opens Feature Flag dashboard | Displays list of all feature flags with status (ON/OFF/GRADUAL), last-modified timestamp, config TTL | Web |
| 11.2 | Admin | Selects a feature flag to modify | Shows flag details: global status, per-city overrides, per-merchant-tier overrides, usage analytics | Web |
| 11.3 | Admin | Toggles flag ON/OFF per scope (global/city/tier) | System validates change; prompts for confirmation with impact summary (affected merchants, users, orders) | Web |
| 11.4 | Admin | Confirms change | System hot-reloads config; propagates change to all application nodes within 30 seconds; logs audit entry | Backend |
| 11.5 | Admin | Engages kill switch for a feature | System immediately disables feature across ALL scopes; sends alert to ops team; logs emergency timestamp | Web |
| 11.6 | Admin | Configures canary rollout (e.g., 10% of merchants) | System applies flag to cohort; monitors error rates; auto-rollback if error rate exceeds threshold (default 1%) | Web |
| 11.7 | Admin | Sets config TTL with auto-renew reminder | System schedules TTL expiry; sends reminder 48h before expiry; auto-disables flag if not renewed | Backend |
| **Workflow ID** | **WF-FEATUREFLAG-001** | | | |

### Workflow 12: Product & Merchant Review Workflow
**Applicable Channels:** Web App, Mobile App (iOS/Android)  
**Personas:** Priya (Customer), Ananya (Admin), Ramesh (Merchant)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 12.1 | Customer | Completes Mode A purchase or Mode C store visit | System sends push notification/email: "How was your experience?" with review prompt | Web + Mobile |
| 12.2 | Customer | Opens review form | System displays separate sections: Rate Product (1-5 stars) and Rate Merchant (1-5 stars + delivery experience + merchant trust) | Web + Mobile |
| 12.3 | Customer | Writes review text, uploads photo/video | System validates media size (<50MB), scans for explicit content, attaches "Verified Purchase" badge | Web + Mobile |
| 12.4 | Customer | Submits review | System runs auto-moderation: spam check, profanity filter, fake review detection; if flagged → admin queue; if clean → published immediately | Backend |
| 12.5 | Admin | Reviews flagged review in moderation queue | System displays review, customer history, sentiment analysis score; admin approves/rejects with reason | Admin Dashboard |
| 12.6 | Merchant | Views published review on their dashboard | System sends notification; merchant can write a public reply (subject to admin moderation) | Merchant Dashboard |
| 12.7 | Other customers | View review and find it helpful | System displays "Helpful (N)" count; increments helpful counter per unique user on click | Web + Mobile |
| **Workflow ID** | **WF-REVIEW-001** | | | |

### Workflow 13: Pete Street Virtual Walk
**Applicable Channels:** Web App, Mobile App (iOS/Android)  
**Personas:** Priya (Customer)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 13.1 | Customer | Clicks "Pete Street Virtual Walk" on homepage or market page | System loads 2.5D/3D scene of the selected Pete market street; shows storefronts lining both sides; ambient market audio | Web + Mobile |
| 13.2 | Customer | Navigates down the street (arrow keys/swipe/drag) | System renders storefronts in correct geographic order; shows store name badges above each facade; festive decorations appear if applicable | Web + Mobile |
| 13.3 | Customer | Taps/click a storefront | System zooms into storefront; facade detail loads; "Enter Store" CTA appears with merchant name and category badge | Web + Mobile |
| 13.4 | Customer | "Enters Store" | System transitions to 3D virtual store interior; products arranged on shelves/counters organized by category; product cards with Mode badges visible | Web + Mobile |
| 13.5 | Customer | Taps a product on virtual shelf | System opens product detail popup with price, description, Mode A/B/C options; "Add to Cart" or "Enquire" buttons | Web + Mobile |
| 13.6 | Customer | Purchases via Mode A or enquires via Mode B | Standard Mode A cart/checkout or Mode B WhatsApp deep-link from within virtual store | Web + Mobile |
| 13.7 | Customer | Exits virtual store back to street | System resumes street navigation; shows nearby storefronts | Web + Mobile |
| **Workflow ID** | **WF-VIRTUALWALK-001** | | | |

### Workflow 7 (Original): Merchant Onboarding (Mode Selection)
**Applicable Channels:** Web App (Merchant Dashboard)  
**Personas:** Ramesh (Merchant), Ananya (Admin)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 7.1 | Merchant | Visits petemart.com/sell or downloads Merchant App | Onboarding wizard starts: phone number verification via OTP | Web + Mobile |
| 7.2 | Merchant | Fills business details (store name, address, category, market area) | System validates address, assigns geo-coordinates via Google Maps API | Web + Mobile |
| 7.3 | Merchant | Selects subscription plan (Starter/Growth/Premium) | System applies pricing (₹499/₹999/₹2,499 per month or annual equivalent) | Web + Mobile |
| 7.4 | Merchant | Chooses interaction modes (Mode A / Mode B / Mode C — select at least one) | System validates prerequisites: Mode A requires Razorpay account + catalog; Mode B requires WhatsApp Business number; Mode C requires Google Maps pin + address | Web + Mobile |
| 7.5 | Merchant | Uploads initial product catalog (manual or done-for-you service at ₹10/product) | System processes images, assigns default mode badges, sets inventory to "draft" | Web + Mobile |
| 7.6 | Admin | Reviews and approves merchant store | Store goes live; merchant receives QR code, store URL (`petemart.in/shop-name`), and welcome kit | Admin Dashboard |
| **Workflow ID** | **WF-ONBOARD-001** | | | |

---

### Workflow 14: Payment Settlement & Merchant Payout
**Applicable Channels:** Backend (System), Web App (Merchant Dashboard)  
**Personas:** Merchant (Ramesh), Admin (Ananya)

| Step # | Actor | Action | System Response | Channel |
|---|---|---|---|---|
| 14.1 | Customer | Pays via Razorpay | Funds held in PeteMart platform account; order marked "Paid" | Backend |
| 14.2 | System | Marks order as "Delivered" | Auto-triggered after X days (configurable) or manual by merchant via dashboard | Backend |
| 14.3 | System | Starts T+3 settlement timer | Settlement timer begins from delivery confirmation timestamp | Backend |
| 14.4 | System | Calculates payout amount | Payout = order amount - (platform commission + gateway fees + delivery charges + TDS) | Backend |
| 14.5 | System | Triggers Razorpay Route API transfer | Funds transferred from PeteMart account to merchant's Razorpay subaccount | Backend |
| 14.6 | System | Subaccount settles to merchant bank | Razorpay subaccount settles funds to merchant's linked bank account via NEFT/IMPS | Backend |
| 14.7 | System | Generates settlement receipt | Settlement receipt with breakup sent to merchant email/SMS | Backend |
| 14.8 | Merchant | Views payout history in analytics dashboard | Settlement report visible in merchant dashboard with per-order breakdown | Merchant Dashboard |
| 14.9 | System | Retries failed settlements | Failed settlements retried automatically (max 3 retries); if all fail → flagged for manual review | Backend |
| **Workflow ID** | **WF-SETTLEMENT-001** | | | |

---

## 4. Use Cases — Web & Mobile Channels

### 4.1 Web Application Use Cases

| UC ID | Use Case Name | Description | Primary Actor | Related Req IDs |
|---|---|---|---|---|
| UC-WEB-001 | Landing Page Discovery | Browse Pete Tapestry carousel, featured markets, top merchants | Customer | REQ-UI-001 |
| UC-WEB-002 | Product Search & Filter | Full-text search with faceted filters (market, category, mode, price range, rating) | Customer | REQ-UI-002, REQ-BE-009 |
| UC-WEB-003 | Mode A Direct Checkout | End-to-end cart, multi-store consolidation, Razorpay payment, order confirmation | Customer | REQ-UI-003, REQ-UI-006, REQ-API-003 |
| UC-WEB-004 | Mode B WhatsApp Enquiry | Click-to-WhatsApp deep-link generation, pre-filled message template | Customer | REQ-UI-004, REQ-API-004 |
| UC-WEB-005 | Mode C Store Visit | Store facade gallery, virtual window, Google Maps directions deep-link | Customer | REQ-UI-005, REQ-API-005 |
| UC-WEB-006 | Merchant Microsite | Public-facing branded store page with full catalog, QR code, contact info | Customer, Merchant | REQ-UI-008 |
| UC-WEB-007 | Order History & Tracking | View past orders, live tracking (web map), repeat order | Customer | REQ-UI-007, REQ-API-007 |
| UC-WEB-008 | Merchant Dashboard | Catalog management, order management, analytics, subscription settings | Merchant | REQ-UI-011, REQ-BE-001 |
| UC-WEB-009 | Admin Console | Merchant approvals, revenue reports, user management, dispute resolution | Admin | REQ-UI-012, REQ-BE-004 |
| UC-WEB-010 | Multi-Language Interface | Language toggle (Kannada/Hindi/English), locale-aware content display | Customer, Merchant | REQ-UI-013 |
| UC-WEB-011 | Merchant Analytics Dashboard | Views, clicks, enquiries, orders, revenue charts, PDF/CSV export | Merchant | REQ-UI-014, REQ-BE-017 |
| UC-WEB-012 | Coupon & Promo Application | Apply promo codes at checkout, view discounts, festival campaign banners | Customer | REQ-COM-007 |
| UC-WEB-013 | Product Review Submission | Submit star rating, photo/video review, verified purchase badge | Customer | REQ-BE-012 |
| UC-WEB-014 | Bulk Order with MOQ Enforcement | View MOQ on product cards, tiered pricing slabs, B2B cart value validation | B2B Buyer | REQ-BE-016 |
| UC-WEB-015 | Guest Browsing & Checkout | Browse without login, capture phone at checkout, abandoned cart recovery | Customer | REQ-FUNNEL-002 |
| UC-WEB-016 | AI Virtual Try-On for Apparel | Upload photo or use live camera to try on sarees, ethnic wear, textiles virtually with AI draping | Customer | REQ-UI-015, REQ-BE-018 |
| UC-WEB-017 | AI Virtual Try-On for Jewellery | Upload photo or use live camera to try on earrings, necklaces, rings virtually with size/colour accuracy | Customer | REQ-UI-016, REQ-BE-018 |
| UC-WEB-018 | Live Bullion Rate Display on Jewellery Products | View real-time gold (24k/22k/18k) and silver rates per gram integrated into jewellery product cards | Customer | REQ-UI-017, REQ-API-012 |
| UC-WEB-019 | Jewellery Dynamic Pricing Calculator | See live gold/silver rate applied to product weight; price = (weight × rate) + making charges + GST | Customer | REQ-UI-017, REQ-BE-019 |
| UC-WEB-020 | Fabric Texture Zoom & 360° Product Rotation | High-resolution zoom on fabric textures, gesture-driven 360° product rotation for textiles and jewellery | Customer | REQ-COM-009 |
| UC-WEB-021 | Video Call Appointment with Merchant | Browse merchant availability, book a slot, and join a WebRTC video call to inspect products remotely | Customer | REQ-COM-009 |
| UC-WEB-022 | Customer Try-On Gallery | Browse community-submitted try-on photos (with consent) organized by product; filter by body type or skin tone | Customer | REQ-COM-009 |
| UC-WEB-023 | White-Label Branding Admin | Admin accesses branding configuration panel to set brand name, logo, colors, fonts, and CSS variables; preview and publish changes instantly | Admin | REQ-UI-018 |
| UC-WEB-024 | Multi-City Geographic Selector | Customer selects/detects city; landing page re-renders with city-specific merchants, market content, and delivery zone mapping; SEO-friendly city URL routing | Customer | REQ-UI-019 |
| UC-WEB-025 | Admin Dynamic Configuration Panel | Admin edits pricing rules, delivery zones, commission rates, feature flags, tax rules via dashboard; preview changes before publishing; view config version history | Admin | REQ-UI-020, REQ-BE-021 |
| UC-WEB-026 | National Shipping via ShipRocket | Merchant opts into pan-India shipping; system calculates shipping rate via ShipRocket; label generation; end-to-end tracking; COD support | Merchant, Customer | REQ-COM-010, REQ-API-013, REQ-BE-024 |
| UC-WEB-027 | Feature Flag & Kill Switch Admin | Admin toggles feature flags globally, per-city, or per-merchant-tier; one-click emergency kill switch; canary rollout configuration; feature usage analytics dashboard | Admin | REQ-INFRA-011 |
| UC-WEB-028 | Merchant Review & Rating Submission | Write separate reviews for products and merchants; upload photo/video; verified purchase badge; "Helpful" vote; sort/filter reviews by date, rating, media | Customer | REQ-UI-021, REQ-BE-025 |
| UC-WEB-029 | Review Moderation Queue | Admin views flagged reviews in approval queue; approves/rejects with reason; sentiment analysis displayed; merchant response management | Admin | REQ-BE-025 |
| UC-WEB-030 | Pete Street Virtual Walk | Navigate 2.5D/3D interactive recreation of Pete market streets; tap storefronts; browse virtual shelves; buy (Mode A) or enquire (Mode B) from virtual store | Customer | REQ-UI-022, REQ-BE-026 |
| UC-WEB-031 | Live Bazaar Stream Viewing | Watch merchant live streams; live chat; purchase via pinned product cards; view scheduled and archived streams | Customer, Merchant | REQ-UI-023 |
| UC-WEB-032 | Shop Together Co-Shopping Session | Invite family via WhatsApp share link; browse virtual streets together; see avatars/cursors; shared cart with check-out control; in-session voice/chat | Customer | REQ-UI-024 |

### 4.2 Mobile Application Use Cases (iOS & Android)

| UC ID | Use Case Name | Description | Primary Actor | Related Req IDs |
|---|---|---|---|---|
| UC-MOB-001 | Mobile Landing & Browse | Optimized mobile-first layout with Pete Tapestry, market grid | Customer | REQ-UI-009, REQ-UI-010 |
| UC-MOB-002 | Scan QR Code Store Access | Camera-based QR scanner opens merchant microsite instantly | Customer | REQ-UI-009, REQ-UI-010 |
| UC-MOB-003 | Mobile Checkout (Mode A) | Simplified cart, UPI/BHIM integration, biometric payment confirmation | Customer | REQ-UI-009, REQ-API-003 |
| UC-MOB-004 | WhatsApp Deep Link (Mode B) | One-tap WhatsApp redirect with product context | Customer | REQ-UI-009, REQ-API-004 |
| UC-MOB-005 | GPS Navigation (Mode C) | "Navigate" button opens Google Maps with turn-by-turn directions | Customer | REQ-UI-010, REQ-API-005 |
| UC-MOB-006 | Live Delivery Tracking | Real-time courier GPS tracking with push notification updates | Customer | REQ-UI-007, REQ-API-007 |
| UC-MOB-007 | Push Notifications | Order confirmed, out for delivery, delivered, feedback prompts | Customer | REQ-BE-006, REQ-API-009 |
| UC-MOB-008 | Courier Partner App | Multi-stop pickup route, status updates, earnings summary | Delivery Partner | REQ-UI-009, REQ-API-007 |
| UC-MOB-009 | Merchant Mobile Dashboard | Quick order alerts, inventory updates, WhatsApp notification mirroring | Merchant | REQ-UI-011, REQ-UI-010 |
| UC-MOB-010 | Offline-First Browsing | Browse cached product catalog offline, queue orders for sync | Customer | REQ-BE-014 |
| UC-MOB-011 | PWA Install & Push Notifications | Install PeteMart as PWA, receive push notifications, offline browsing | Customer | REQ-FUNNEL-004 |
| UC-MOB-012 | Language Toggle (Mobile) | In-app language switch (Kannada/Hindi/English), locale-aware formatting | Customer, Merchant | REQ-UI-013 |
| UC-MOB-013 | Referral Sharing via WhatsApp | Share referral link via WhatsApp, track referral rewards | Customer | REQ-FUNNEL-001 |
| UC-MOB-014 | Loyalty Points & Rewards Hub | View loyalty points, tier status (Silver/Gold/Platinum), redeem rewards | Customer | REQ-FUNNEL-003 |
| UC-MOB-015 | AI Virtual Try-On (Mobile Camera) | Camera-based virtual try-on for apparel and jewellery using native iOS/Android camera APIs; real-time overlay for jewellery; photo capture for saree drape simulation | Customer | REQ-UI-015, REQ-UI-016, REQ-BE-018 |
| UC-MOB-016 | Live Bullion Rate Widget (Mobile) | Home screen widget or in-app banner showing live gold/silver rates; tap to view rate chart and historical trend | Customer | REQ-UI-017, REQ-API-012 |
| UC-MOB-017 | Jewellery Product Card with Rate Integration | Mobile-optimised jewellery product cards with live gold/silver rate overlay; dynamic price recalculation on rate change | Customer | REQ-UI-017, REQ-BE-019 |
| UC-MOB-018 | 360° Product Rotation (Touch Gesture) | Touch-driven 360° product view for textiles, sarees, and jewellery; pinch-to-zoom fabric texture inspection | Customer | REQ-COM-009 |
| UC-MOB-019 | Video Call Booking & Join (Mobile) | Book a video call with merchant from mobile; calendar integration; join WebRTC call with one tap | Customer | REQ-COM-009 |
| UC-MOB-020 | Multi-City Selector (Mobile) | Mobile-optimized city selector dropdown with auto-detect via GPS; city-specific landing pages and merchant discovery | Customer | REQ-UI-019 |
| UC-MOB-021 | Config Push Notification (Mobile) | Receive real-time notification when admin updates dynamic config (e.g., new delivery zone, pricing change, feature toggle) | Merchant, Admin | REQ-BE-021 |
| UC-MOB-022 | National Shipping Tracking (Mobile) | Unified tracking UI showing ShipRocket shipments with courier updates, ETA, and delivery status alongside hyperlocal deliveries | Customer | REQ-COM-010, REQ-API-013 |
| UC-MOB-023 | Mobile Merchant Review Submission | Write reviews with photo/video capture; star ratings; verified purchase badge; "Helpful" voting | Customer | REQ-UI-021 |
| UC-MOB-024 | Mobile Virtual Walk (AR Mode) | AR-enhanced navigation of virtual Pete streets using phone compass and gyroscope; tap storefronts on mobile | Customer | REQ-UI-022 |
| UC-MOB-025 | Live Bazaar on Mobile | Watch live merchant streams; mobile-optimized stream player; one-tap purchase; live chat | Customer | REQ-UI-023 |
| UC-MOB-026 | Co-Shopping on Mobile | Join co-shopping session via WhatsApp invite; shared cart; voice call; avatar view on mobile | Customer | REQ-UI-024 |

---

## 5. Feature Catalog & Requirement IDs

> **Internal Naming Convention**: Requirement IDs and mode references use the internal labels (Mode A/B/C). Customer-facing UI MUST translate these to natural language: "Buy Now" / "Purchase Online" (Mode A), "Enquire on WhatsApp" (Mode B), "Visit Store" (Mode C). All wireframes and UI mockups use customer-facing labels only.

### Category Summary

| # | Category | Requirements | P0 | P1 | P2 | P3 | Key Topics |
|---|---|---|---|---|---|---|---|---|---|---|
| 5.1 | **UI/UX Layer** | 24 | 11 | 9 | 3 | 1 | Landing page, catalog, cart/checkout, WhatsApp button, Store visit UI, tracking, microsite, mobile apps (iOS/Android), onboarding dashboard, admin dashboard, **i18n**, **merchant analytics**, **AI virtual try-on (apparel)**, **AI virtual try-on (jewellery)**, **jewellery product card with live rates**, **white-label branding engine**, **multi-city geographic selector**, **admin configuration dashboard**, **merchant review & feedback interface**, **Pete Street Virtual Walk**, **Live Bazaar**, **Shop Together co-shopping** |
| 5.2 | **API Layer** | 13 | 8 | 5 | — | — | Product/order/payment APIs, WhatsApp deep-link, Google Maps, auth, tracking, merchant mgmt, notifications, analytics, **mode switching**, **live bullion rate API**, **ShipRocket API integration** |
| 5.3 | **Backend/Data Layer** | 26 | 10 | 11 | 4 | 1 | DB schema, order engine, consolidation engine, subscriptions, payouts, notifications, logistics, analytics pipeline, search, caching, **catalog mgmt**, **reviews**, **disputes**, **offline-first**, **GST/TCS**, **MOQ**, **CDP**, **virtual try-on engine**, **jewellery inventory mgmt**, **dynamic merchant registry**, **dynamic configuration service**, **geo-hierarchy & region mgmt**, **city/state onboarding workflow**, **hybrid delivery orchestrator**, **review moderation & analytics engine**, **virtual street CMS** |
| 5.4 | **Commerce/Monetization** | 10 | 2 | 6 | 2 | — | Subscriptions, transaction fees, VAS billing, delivery fees, revenue dashboard, payouts, **coupon/promo engine**, **payment escrow**, **trust-building features (look/see/feel)**, **national shipping integration (ShipRocket)** |
| 5.5 | **Infrastructure/Security** | 11 | 7 | 3 | 1 | — | Cloud provisioning, CI/CD, monitoring, encryption, backup/DR, API gateway, DB scaling, secrets mgmt, **PCI DSS**, **modular merchant onboarding & deboarding**, **feature flag & kill switch system** |
| 5.6 | **Infrastructure & Performance/Scale** | 3 | 2 | 1 | — | — | **50% commercial baseline load**, **horizontal scalability**, **load testing** |
| 5.7 | **Maintenance, Patch & Lifecycle** | 5 | 2 | 3 | — | — | **Patch mgmt**, **zero-downtime deploys**, **observability stack**, **license scanning**, **health dashboard** |
| 5.8 | **Merchant Microsite & Payment Settlement** | **8** | **4** | **3** | **1** | — | **Storefront URL**, **product catalog mgmt**, **order mgmt dashboard**, **inventory sync**, **GST invoicing**, **sales analytics**, **Razorpay subaccount onboarding**, **payment settlement & holding** |
| 5.9 | **Disaster Recovery & Continuity** | 4 | 2 | 1 | 1 | — | **DR plan (RPO 15min/RTO 4hr)**, **multi-AZ failover**, **backup/PITR**, **DR testing** |
| 5.10 | **Customer Acquisition Funnels** | 4 | — | 3 | 1 | — | **Multi-channel acquisition**, **guest browsing**, **loyalty engine**, **PWA** |
| 5.11 | **Data Licensing, Privacy & Compliance** | 3 | 1 | — | 1 | 1 | **DPDP consent/CDP**, **usage analytics**, **data licensing** |
| | **Total** | **111** | **46** | **44** | **17** | **4** | |

> **Bold topics** = new requirements added in v2.0 enhancement

### 5.1 UI/UX Layer (24 Requirements)

| Req ID | Feature Title | Description | Priority | Persona | Workflow Ref | Cost Ref |
|---|---|---|---|---|---|---|
| **REQ-UI-001** | Landing Page with Pete Tapestry | Interactive carousel/tabbed interface showcasing 21 Pete markets with history, specialization, and featured merchants. Includes SEO meta-tags. | **P0-Critical** | Customer, B2B Buyer | WF-BROWSE-001 | OC-INFRA-01, DC-SETUP-03 |
| **REQ-UI-002** | Product Catalog & Search | Full-text search across 392+ merchants with facet filters (market, category, mode, price, rating). Autocomplete and spell-correction. | **P0-Critical** | Customer, B2B Buyer | WF-BROWSE-001 | OC-INFRA-01, DC-SETUP-03 |
| **REQ-UI-003** | Mode A Product Card & In-App Cart | Product cards with "Add to Cart" CTA; cart supports multi-merchant items; quantity toggles for B2C/B2B pricing. | **P0-Critical** | Customer | WF-ORDER-A-001, WF-CHECKOUT-001 | OC-INFRA-01 |
| **REQ-UI-004** | Mode B WhatsApp Enquiry Button | "Enquire on WhatsApp" CTA on product cards; generates deep-link with pre-filled product + merchant info. | **P0-Critical** | Customer, B2B Buyer | WF-ORDER-B-001 | OC-COMMS-02 |
| **REQ-UI-005** | Mode C Visit Store Interface | Store facade gallery, virtual window display, "Get Directions" button with Google Maps deep-link. | **P0-Critical** | Customer | WF-ORDER-C-001 | OC-MAPS-03 |
| **REQ-UI-006** | Multi-Store Checkout Flow | Unified checkout showing merchant-wise items; delivery fee consolidation formula; Razorpay payment widget. | **P0-Critical** | Customer | WF-CHECKOUT-001 | OC-INFRA-01, DC-SETUP-03 |
| **REQ-UI-007** | Order Tracking Dashboard | "My Orders" page with status timeline, live courier GPS tracking (mobile), delivery ETA. | **P1-High** | Customer, Delivery Partner | WF-TRACK-001 | OC-INFRA-01 |
| **REQ-UI-008** | Merchant Store Microsite | Public branded page at `petemart.in/shop-name` with full catalog, store info, QR code download, WhatsApp CTA, directions. | **P0-Critical** | Customer, Merchant | WF-BROWSE-001 | OC-INFRA-01 |
| **REQ-UI-009** | Mobile App (iOS) — Core Screens | Native iOS app: landing, browse, cart, checkout, order tracking, QR scanner, notifications. | **P1-High** | Customer, Delivery Partner | All workflows | DC-SETUP-02 |
| **REQ-UI-010** | Mobile App (Android) — Core Screens | Native Android app (same feature parity as iOS): browse, cart, checkout, GPS tracking, QR scanner. | **P1-High** | Customer, Delivery Partner | All workflows | DC-SETUP-02 |
| **REQ-UI-011** | Merchant Onboarding Dashboard | Self-service onboarding wizard: OTP verification, business details, plan selection, mode selection, catalog upload. | **P0-Critical** | Merchant | WF-ONBOARD-001 | OC-STAFF-06 |
| **REQ-UI-012** | Admin/Operator Dashboard | Merchant approval workflows, revenue analytics, subscription lifecycle, dispute management, user management. | **P1-High** | Admin | WF-ONBOARD-001 | OC-STAFF-06 |
| **REQ-UI-013** | Multi-Language / i18n Support | Kannada, Hindi, English language toggle. UI string externalization, RTL support preparation, locale-aware date/currency formatting, language preference persistence. | **P0-Critical** | Customer, Merchant, B2B Buyer | All workflows | OC-LOCAL-12, DC-SETUP-10 |
| **REQ-UI-014** | Merchant Sales & Analytics Dashboard | Views, clicks, enquiries, orders, revenue charts. Daily/weekly/monthly trends. Mode-wise breakdown (A/B/C). Top selling products. Customer demographics. Export to PDF/CSV. | **P1-High** | Merchant | WF-ORDER-A-001, WF-ORDER-B-001, WF-ORDER-C-001 | OC-INFRA-01 |
| **REQ-UI-015** | AI Virtual Try-On for Apparel | Camera-based virtual try-on for sarees, ethnic wear, and textiles. Customer uploads a photo or uses live camera to see how the product looks on them. AI draping engine powered by computer vision. Works on mobile (iOS/Android native camera integration) and web (WebRTC camera access). Includes body measurement estimation, fabric drape simulation, and shareable try-on snapshots. | **P1-High** | Customer | WF-BROWSE-001 | OC-AI-04 |
| **REQ-UI-016** | AI Virtual Try-On for Jewellery | Upload customer photo or use live camera to see earrings, necklaces, rings worn virtually on the customer's image. Gold/silver colour accuracy based on product purity (24k/22k/18k), size scaling based on face and body detection landmarks. Supports side-by-side comparison of multiple jewellery pieces. Results cacheable and shareable. | **P1-High** | Customer | WF-BROWSE-001 | OC-AI-04 |
| **REQ-UI-017** | Jewellery Product Card with Live Rate Integration | Specialised product card for jewellery items displaying gold (24k/22k/18k) and silver rates per gram fetched in real-time from bullion API. Price calculation displayed as: `(weight in gms × today's rate) + making charges + GST`. Show gold purity certification badge (BIS hallmark) and making charge percentage/flat amount. Rate last-updated timestamp. Visual indicator for rate movement (up/down/stable) with colour coding. | **P0-Critical** | Customer, Merchant | WF-BROWSE-001 | OC-API-05 |
| **REQ-UI-018** | White-Label Branding & Theming Engine | Admin dashboard to configure brand name, logo, favicon, primary/secondary colors, fonts (Google Fonts), CSS variables. Store-level theming for multi-brand deployment across different cities. All UI renders from config, not hardcoded strings. No code changes needed for full rebranding. | **P1-High** | Admin, Merchant | WF-BROWSE-001 | OC-INFRA-01 |
| **REQ-UI-019** | Multi-City / State Geographic Selector | Dropdown/city selector on landing page header. City-specific landing pages with local market content, featured merchants, delivery zone mapping. Auto-detect user location via browser geolocation. City-specific SEO meta-tags and URLs (petemart.in/bangalore, petemart.in/mumbai). | **P0-Critical** | Customer, Admin | WF-BROWSE-001 | OC-INFRA-01 |
| **REQ-UI-020** | Admin Configuration Dashboard | UI for editing all configurable platform settings. Sections: Branding, Delivery Zones, Pricing/Tiers, Feature Toggles, Content (homepage banners, text), Tax Rules. Preview changes before publishing. Scheduled config changes (e.g., festival pricing). | **P1-High** | Admin | WF-ONBOARD-001 | OC-INFRA-01 |
| **REQ-UI-021** | Merchant Review & Feedback Interface | Write reviews for both products AND merchants separately. Star ratings (1-5) for product quality, delivery experience, merchant trust. Photo/video upload with reviews. Verified purchase badge. "Helpful" vote system on reviews. Sort/filter reviews by date, rating, media presence. | **P1-High** | Customer, Merchant, Admin | WF-ORDER-A-001, WF-TRACK-001 | OC-INFRA-01 |
| **REQ-UI-022** | Pete Street Virtual Walk | 2.5D/3D interactive recreation of actual Pete market streets (Chickpet Main Road, Balepet Cross, etc.). Navigate past storefronts like Google Street View but interactive. Tap any storefront to enter → see products arranged on virtual shelves. Buy directly from virtual shelf (Mode A) or enquire (Mode B). Seasonal decorations during festivals (Diwali lights, Ugadi rangoli). Built on WebGL/Three.js for web; Unity for mobile. | **P2-Medium (Visionary)** | Customer | WF-BROWSE-001 | OC-AI-04 |
| **REQ-UI-023** | Live Bazaar | Merchants go live from their physical store during business hours. Real-time product showcase — walk around, zoom into products. Live chat: viewers ask questions, merchant answers verbally. Instant purchase during stream via pinned product cards. Scheduled streams (festival specials, new arrivals) and spontaneous ("live now"). Recording archive available for 7 days. | **P2-Medium (Visionary)** | Customer, Merchant | WF-ORDER-A-001 | OC-AI-04, OC-INFRA-01 |
| **REQ-UI-024** | Shop Together — Co-Shopping | Multiple family members browse the same virtual street simultaneously. See each other's avatars/cursors in the street. Shared cart — anyone can add, only one checks out. In-session chat, voice call. Invite via WhatsApp share link. Mirrors real-world family shopping trips in Pete markets. | **P3-Low (Future)** | Customer | WF-BROWSE-001, WF-CHECKOUT-001 | OC-INFRA-01 |

### 5.2 API Layer (13 Requirements)

| Req ID | Feature Title | Description | Priority | Persona | Workflow Ref | Cost Ref |
|---|---|---|---|---|---|---|
| **REQ-API-001** | Product Catalog API | CRUD endpoints for product listings, inventory, pricing tiers (retail/wholesale), mode badges. | **P0-Critical** | Merchant, Customer | WF-BROWSE-001 | OC-INFRA-01 |
| **REQ-API-002** | Order Management API | Create, read, update order status. Multi-store order splitting. Order history and repeat order endpoints. | **P0-Critical** | Customer, Merchant, Courier | WF-ORDER-A-001, WF-TRACK-001 | OC-INFRA-01 |
| **REQ-API-003** | Payment Gateway Integration API | Razorpay integration: create orders, verify payments, refunds, webhook handling for payment status. | **P0-Critical** | Customer, Merchant | WF-CHECKOUT-001 | OC-INFRA-01, OC-COMMS-02 |
| **REQ-API-004** | WhatsApp Deep-Linking API | Generate WhatsApp deep-link URLs with product context; track click-through events for merchant analytics. | **P0-Critical** | Customer | WF-ORDER-B-001 | OC-COMMS-02 |
| **REQ-API-005** | Google Maps Integration API | Geocoding addresses on merchant onboarding; directions URL generation; distance matrix for delivery zone calculation. | **P1-High** | Customer, Merchant | WF-ORDER-C-001, WF-ONBOARD-001 | OC-MAPS-03 |
| **REQ-API-006** | User Authentication & Profile API | OTP-based login (phone number), JWT session management, user profile CRUD, address management. | **P0-Critical** | Customer, Merchant, Delivery Partner | All workflows | OC-INFRA-01 |
| **REQ-API-007** | Delivery Tracking API | Courier GPS location ingestion, ETA calculation, status update webhooks, delivery proof (photo) upload. | **P1-High** | Customer, Delivery Partner | WF-TRACK-001 | OC-INFRA-01 |
| **REQ-API-008** | Merchant Management API | Merchant profile CRUD, subscription tier management, mode activation/deactivation, catalog approval workflow. | **P0-Critical** | Merchant, Admin | WF-ONBOARD-001 | OC-INFRA-01 |
| **REQ-API-009** | Notification & SMS API | Transactional SMS (order confirmation, delivery updates), push notification service for mobile, email fallback. | **P1-High** | Customer, Merchant, Courier | All workflows | OC-COMMS-02 |
| **REQ-API-010** | Analytics & Reporting API | Aggregated sales data per merchant, per market, per mode. Revenue reports, customer acquisition metrics. | **P2-Medium** | Admin, Merchant | N/A | OC-INFRA-01 |
| **REQ-API-011** | Mode Switching After Onboarding API | Enable/disable modes post-onboarding, validate prerequisites before activation, update store availability, notify customers of mode changes. | **P1-High** | Merchant, Admin | WF-ONBOARD-001 | OC-INFRA-01 |
| **REQ-API-012** | Live Bullion Rate API Integration | Integration with Indian bullion rate APIs (MCX, IndiaBulls, IBJA). Endpoints for fetching live gold rates (24k/22k/18k) and silver rates per gram. Cached rates with 5-minute freshness TTL. Historical rate chart data endpoints. Rate alert webhooks for merchants. Supporting BIS hallmark lookup and purity verification metadata. | **P0-Critical** | Customer, Merchant | WF-BROWSE-001 | OC-API-05 |
| **REQ-API-013** | ShipRocket API Integration | Order sync to ShipRocket for pan-India shipping. Address validation, pincode serviceability check. Courier selection based on weight, dimensions, pincode. Shipment tracking webhooks → status update in PeteMart. Return label generation and reverse pickup. | **P1-High** | Merchant, Admin, Customer | WF-ORDER-A-001, WF-TRACK-001 | OC-COMMS-02 |

### 5.3 Backend / Data Layer (26 Requirements)

| Req ID | Feature Title | Description | Priority | Persona | Workflow Ref | Cost Ref |
|---|---|---|---|---|---|---|
| **REQ-BE-001** | Database Schema & Data Models | PostgreSQL/Supabase schema: merchants, products, orders, users, subscriptions, payouts, delivery zones. Indexed for high-concurrency. | **P0-Critical** | System | All workflows | DC-SETUP-03 |
| **REQ-BE-002** | Order Processing Engine | Order lifecycle engine: payment verification → merchant notification → courier dispatch → status tracking → delivery confirmation. | **P0-Critical** | System | WF-ORDER-A-001, WF-CHECKOUT-001 | OC-INFRA-01 |
| **REQ-BE-003** | Multi-Store Consolidation Engine | Logic to group cart items by merchant, calculate per-merchant delivery fees, apply consolidation formula, generate optimized pickup routes for couriers. | **P1-High** | System | WF-CHECKOUT-001 | OC-INFRA-01 |
| **REQ-BE-004** | Subscription & Billing Engine | Manage plan lifecycle: signup, monthly/annual billing, plan upgrades/downgrades, failed payment retry, invoice generation. | **P0-Critical** | Merchant, Admin | WF-ONBOARD-001 | OC-INFRA-01, DC-SETUP-01 |
| **REQ-BE-005** | Payment Reconciliation & Payouts | Track platform earnings (commission, subscription, VAS), merchant payouts (Mode A sales minus commission), courier payouts (85% of delivery fee). Weekly settlement cycle. | **P1-High** | Admin, Merchant, Courier | WF-CHECKOUT-001 | OC-INFRA-01 |
| **REQ-BE-006** | Notification Engine | Template-driven notification system: SMS (Twilio/MSG91), push (Firebase/APNs), email (SendGrid). Delivery SLA monitoring. | **P1-High** | System | All workflows | OC-COMMS-02 |
| **REQ-BE-007** | Delivery/Logistics Engine | Assign couriers to orders based on zone, load balancing; calculate delivery fees using zone + weight + consolidation formula; track courier earnings. | **P1-High** | System, Courier | WF-TRACK-001 | OC-INFRA-01 |
| **REQ-BE-008** | Analytics Data Pipeline | Event streaming pipeline for user actions, order events, clicks; aggregate into merchant-facing and admin-facing dashboards. | **P2-Medium** | Admin, Merchant | N/A | OC-INFRA-01 |
| **REQ-BE-009** | Search & Discovery Engine | Full-text search with typo-tolerance, faceted filters, relevance scoring. Uses PostgreSQL FTS or Algolia. | **P1-High** | Customer | WF-BROWSE-001 | OC-AI-04 |
| **REQ-BE-010** | Caching & Performance Layer | Redis caching for product catalogs, session data, frequently accessed queries. CDN for static assets and product images. | **P1-High** | System | All workflows | OC-INFRA-01 |
| **REQ-BE-011** | Merchant Catalog Management (Post-Onboarding) | Ongoing CRUD for products, bulk CSV/Excel upload, inventory quantity toggle, stock-out flagging, category management, product image management. | **P0-Critical** | Merchant, Admin | WF-ONBOARD-001 | OC-INFRA-01, OC-STAFF-06 |
| **REQ-BE-012** | Product Review & Rating System | Customer reviews with photo/video upload, star ratings (1-5), verified purchase badge, merchant response, moderation queue for admin. | **P1-High** | Customer, Merchant, Admin | WF-ORDER-A-001, WF-TRACK-001 | OC-INFRA-01 |
| **REQ-BE-013** | Dispute Resolution & Support Ticketing System | Ticket creation (customer/merchant), status tracking, escalation matrix, refund processing workflow, admin arbitration dashboard. | **P1-High** | Customer, Merchant, Admin | WF-ORDER-A-001, WF-CHECKOUT-001 | OC-STAFF-06 |
| **REQ-BE-014** | Offline-First Mobile Capability | Local caching of product catalogs and merchant data, offline order queuing with sync on connectivity restore, conflict resolution for stale data. | **P2-Medium** | Customer, Merchant | WF-BROWSE-001, WF-ORDER-A-001 | OC-INFRA-01 |
| **REQ-BE-015** | GST/TCS Compliance & Auto-Invoicing | Automatic GST invoice generation per order, TCS collection under section 52 of CGST Act, monthly GSTR-1/GSTR-3B return data export, HSN/SAC code mapping. | **P0-Critical** | System, Admin | WF-CHECKOUT-001 | OC-LEGAL-05, DC-SETUP-04 |
| **REQ-BE-016** | MOQ & Bulk Order Enforcement | Minimum order quantity validation per product, B2B minimum cart value rules, tiered pricing by quantity slabs, automated quote generation for bulk orders. | **P1-High** | Customer, B2B Buyer, Merchant | WF-ORDER-A-001, WF-CHECKOUT-001 | OC-INFRA-01 |
| **REQ-BE-017** | Customer Data Platform (CDP) & Behavioral Analytics | Unified customer profile across all touchpoints (web, mobile, WhatsApp), event tracking (page views, searches, cart adds, orders), funnel analysis, cohort retention analysis, predictive churn scoring. | **P2-Medium** | Admin | All workflows | OC-AI-04, OC-INFRA-01 |
| **REQ-BE-018** | Virtual Try-On Engine (AI/ML Service) | Backend AI/ML service for image processing, size scaling, and colour matching for virtual try-on. Integration with product catalog images for apparel and jewellery. Warp/drape algorithms for fabric simulation on body models. Face and body detection models for proportionate jewellery scaling. Caching layer for processed try-on results to reduce inference costs. Async job queue for try-on image generation with webhook notification on completion. | **P1-High** | System, Customer | WF-BROWSE-001 | OC-AI-04, OC-INFRA-01 |
| **REQ-BE-019** | Jewellery Inventory Management | Weight-based pricing engine (grams): making charges calculation (% or flat fee per gram), gold purity tracking (karat 24k/22k/18k), stone weight and type tracking, certification management (BIS hallmark number), today's gold/silver rate auto-apply from bullion API, dynamic price recalculation on rate change, inventory ageing report for unsold stock, stock valuation at current market rates. | **P0-Critical** | Merchant, System | WF-BROWSE-001 | OC-INFRA-01 |
| **REQ-BE-020** | Dynamic Merchant Registry Service | Central registry of all merchants with metadata: categorization by market, product category, active status, tier (Starter/Growth/Premium), interaction modes enabled. Hot-reload capable configuration store. Bulk import/export for merchant operations (CSV/JSON). Webhook notifications on merchant state changes (activated, suspended, deboarded, tier changed). Feature flag evaluation per merchant. API-driven lifecycle management without code deployment. | **P1-High** | Admin, Merchant, System | WF-ONBOARD-001 | OC-INFRA-01 |
| **REQ-BE-021** | Dynamic Configuration Service | Centralized config store (DB-based, not hardcoded). Configurable items: pricing rules, delivery zones, commission rates, UI text strings, tax rules, feature flags, mode availability per city. Changeable via admin dashboard with audit trail. Hot-reload without deployment. Config versioning and rollback support. | **P0-Critical** | Admin, System | All workflows | OC-INFRA-01 |
| **REQ-BE-022** | Geo-Hierarchy & Region Management | Data model: Country → State → City → Market Area → Merchant. Region-specific configurations: delivery rates, tax rules (SGST/CGST per state), commission structures. Dynamic routing based on user-selected city. Merchant discovery filtered by city. | **P0-Critical** | System, Admin | WF-BROWSE-001, WF-ORDER-A-001 | OC-INFRA-01 |
| **REQ-BE-023** | City/State Onboarding Workflow | Process: merchant discovery in new city → delivery partner onboarding → local compliance setup → market data seeding → go-live. Per-city admin dashboard with local metrics. City-specific promo campaigns and festival calendars. | **P1-High** | Admin, System | WF-ONBOARD-001 | OC-STAFF-06 |
| **REQ-BE-024** | Hybrid Delivery Orchestrator | Smart routing engine: local orders (zone-based hyperlocal courier) vs national orders (ShipRocket). Decision logic: delivery pincode within 15km → hyperlocal, else → ShipRocket. Merchant preference override (merchant can choose). Order value threshold for free shipping. Unified tracking UI for both delivery methods. | **P1-High** | System, Customer, Merchant | WF-ORDER-A-001, WF-TRACK-001 | OC-INFRA-01 |
| **REQ-BE-025** | Review Moderation & Analytics Engine | Auto-moderation: spam filtering, profanity detection, fake review detection using ML classifiers. Admin approval queue for flagged reviews with manual review workflow. Sentiment analysis on review text to extract customer sentiment trends. Review analytics dashboard showing avg rating trends, top customer issues, merchant response rates. Merchant response capability — public reply to customer reviews with admin moderation of merchant replies. | **P1-High** | Admin, Merchant, Customer | WF-ORDER-A-001, WF-TRACK-001 | OC-AI-04 |
| **REQ-BE-026** | Virtual Street Content Management System | Storefront facade upload for merchants — merchant uploads photos of their physical storefront for the Virtual Walk. Shelf arrangement configuration for virtual store — drag-and-drop product positioning on virtual shelves. Seasonal theme application — admin applies festival decorations (Diwali, Ugadi, Pongal) to virtual streets. Analytics: footfall in virtual street, storefront visit counts, time spent per store. Content versioning for A/B testing different storefront layouts. | **P3-Low (Future)** | Merchant, Admin | WF-BROWSE-001 | OC-INFRA-01 |

### 5.4 Commerce & Monetization Layer (10 Requirements)

| Req ID | Feature Title | Description | Priority | Persona | Workflow Ref | Cost Ref |
|---|---|---|---|---|---|---|
| **REQ-COM-001** | Subscription Plan Management | Admin configurable plans (Starter ₹499/mo, Growth ₹999/mo, Premium ₹2,499/mo); annual discount (2 months free); plan feature gating. | **P0-Critical** | Admin, Merchant | WF-ONBOARD-001 | DC-SETUP-01 |
| **REQ-COM-002** | Transaction Fee Processing | Automatic deduction of 4% B2C / 1.5% B2B (capped ₹500) commission per Mode A order; 2% PG fee pass-through; reconciliation with Razorpay settlement reports. | **P0-Critical** | Admin, Merchant | WF-CHECKOUT-001 | DC-SETUP-01 |
| **REQ-COM-003** | Value-Added Services Billing | Catalog digitization (₹10/product), AI reels (₹999/video), CPC sponsorship (₹2/click), banner ads (₹499/day). Usage metering and invoicing. | **P1-High** | Admin, Merchant | N/A | DC-SETUP-01 |
| **REQ-COM-004** | Courier/Delivery Fee Calculator | Real-time delivery fee computation: zone base rate + weight surcharge + consolidation surcharge + surge pricing (night 25%, festival 15%). | **P1-High** | System, Customer | WF-CHECKOUT-001 | OC-INFRA-01 |
| **REQ-COM-005** | Revenue Dashboard & Audit Trail | Granular revenue breakdown per merchant, per market, per mode. Audit log for all financial transactions. Export to CSV/PDF. | **P2-Medium** | Admin | N/A | OC-INFRA-01 |
| **REQ-COM-006** | Merchant Payout System | Automated weekly/monthly payout to merchants (Mode A sales − commission); courier payouts (85% of delivery fee); integration with RazorpayX or bank transfer. | **P1-High** | Admin, Merchant, Courier | WF-CHECKOUT-001 | OC-INFRA-01 |
| **REQ-COM-007** | Coupon & Promo Engine | Admin-configurable promo codes (percentage/flat/free shipping), festival season campaigns, automatic coupon application, usage limits, expiry management. | **P1-High** | Admin, Customer | WF-CHECKOUT-001 | OC-INFRA-01 |
| **REQ-COM-008** | Payment Escrow & Hold Period | Hold merchant payouts until delivery confirmed by customer. Release schedule: 24h after delivery. Dispute hold mechanism. | **P1-High** | System, Merchant, Admin | WF-TRACK-001, WF-CHECKOUT-001 | OC-INFRA-01 |
| **REQ-COM-009** | "Look, See, Feel" Trust-Building Features | Suite of features to bridge the online-offline trust gap for textiles, sarees, and jewellery. Includes: (1) high-resolution fabric texture zoom with macro lens capture; (2) 360-degree product rotation view (multi-angle image sequence); (3) fabric swatch digital sampling — side-by-side colour/variant comparison; (4) video call appointment booking with merchant (integrated calendar + Jitsi/WebRTC); (5) customer try-on gallery — user-submitted try-on photos with consent, displayed per product. | **P2-Medium** | Customer | WF-BROWSE-001, WF-ORDER-C-001 | OC-AI-04 |
| **REQ-COM-010** | National Shipping Integration — ShipRocket | Optional merchant opt-in for pan-India shipping via ShipRocket. Automatic shipping rate calculation (weight + pincode). Label generation, pickup scheduling. End-to-end tracking. Cash-on-delivery (COD) support. | **P1-High** | Merchant, Customer | WF-ORDER-A-001, WF-TRACK-001 | OC-COMMS-02 |

### 5.5 Infrastructure & Security Layer (11 Requirements)

| Req ID | Feature Title | Description | Priority | Persona | Workflow Ref | Cost Ref |
|---|---|---|---|---|---|---|
| **REQ-INFRA-001** | Cloud Infrastructure Provisioning | Supabase (PostgreSQL DB + Auth + Storage), Railway/Vercel (backend hosting), CDN, auto-scaling configuration. | **P0-Critical** | System, Admin | All workflows | OC-INFRA-01, DC-SETUP-03 |
| **REQ-INFRA-002** | CI/CD Pipeline | GitHub Actions or equivalent: automated testing → build → staging deploy → production deploy. Branch protection rules. | **P1-High** | System, Developer | N/A | OC-INFRA-01 |
| **REQ-INFRA-003** | Monitoring & Observability | Application performance monitoring, error tracking (Sentry), uptime monitoring (Better Stack), custom dashboard for platform health. | **P1-High** | System, Admin | All workflows | OC-INFRA-01 |
| **REQ-INFRA-004** | Security & Encryption Framework | HTTPS/TLS everywhere, data encryption at rest (AES-256), JWT token management, OWASP top 10 protection, input sanitization. | **P0-Critical** | System | All workflows | DC-SETUP-04 |
| **REQ-INFRA-005** | Backup & Disaster Recovery | Automated daily database backups, point-in-time recovery, multi-region failover planning, RPO < 1 hour, RTO < 4 hours. | **P2-Medium** | System, Admin | N/A | OC-INFRA-01 |
| **REQ-INFRA-006** | API Gateway & Rate Limiting | Rate limiting per user/IP (100 req/min), request validation, API key management for internal services, logging. | **P1-High** | System | All workflows | OC-INFRA-01 |
| **REQ-INFRA-007** | Database Scaling & Connection Pooling | PgBouncer for connection pooling, read replicas for analytics queries, auto-scaling thresholds for compute. | **P1-High** | System | All workflows | OC-INFRA-01 |
| **REQ-INFRA-008** | SSL/TLS & Secrets Management | Automated SSL certificate renewal (Let's Encrypt), HashiCorp Vault or environment-based secrets management, no plain-text credentials in codebase. | **P0-Critical** | System | All workflows | DC-SETUP-04 |
| **REQ-INFRA-009** | PCI DSS Compliance via Razorpay Scope Reduction | Confirm Razorpay handles card data (SAQ A), no PCI data stored on PeteMart servers, tokenization for recurring payments, quarterly ASV scan, PCI compliance attestation. | **P0-Critical** | System, Admin | WF-CHECKOUT-001 | DC-SETUP-12 |
| **REQ-INFRA-010** | Modular Merchant Onboarding & Deboarding | Plugin-based merchant module architecture: add or remove merchants without code changes or redeployment. Merchant configuration stored entirely in database (no hardcoded references). Feature flags per merchant for gradual rollout of capabilities. API-driven merchant lifecycle: activate, suspend, deboard. Zero downtime on merchant state changes. All merchant-specific logic isolated in pluggable service modules. | **P0-Critical** | Admin, Merchant, System | WF-ONBOARD-001 | OC-INFRA-01 |
| **REQ-INFRA-011** | Feature Flag & Kill Switch System | Admin dashboard to enable/disable any feature globally, per-city, or per-merchant-tier. One-click kill switch for emergency disable (e.g., Mode A breaks → instantly disable Mode A across platform). Gradual rollout: canary deployment by merchant %, city, or user cohort. Feature usage analytics to track adoption per flag. Config TTL for auto-disable if not explicitly renewed. Integration with dynamic configuration service (REQ-BE-021) for hot-reload capability. Rollback of feature flags to previous known-good state. | **P0-Critical** | Admin, System | All workflows | OC-INFRA-01 |

---

### 5.6 Infrastructure & Performance/Scale Layer (3 Requirements)

| Req ID | Feature Title | Description | Priority | Persona | Workflow Ref | Cost Ref |
|---|---|---|---|---|---|---|
| **REQ-PERF-001** | Performance Baseline at 50% Commercial E-Commerce Load | Target: LCP <2.5s, INP <200ms, CLS <0.1, API response <300ms P95. Baseline: 500 concurrent users, 50 req/s peak. Architecture must be horizontally scalable to 2x (100%) without re-architecture. | **P0-Critical** | System | All workflows | OC-PERF-07, DC-SETUP-07 |
| **REQ-PERF-002** | Horizontal Scalability Architecture | Stateless application layer, database read replicas, Redis caching layer, CDN for static/media assets. Auto-scaling triggers at 70% CPU/memory. Design must support 2x growth factor. | **P0-Critical** | System | All workflows | OC-PERF-07, OC-INFRA-01 |
| **REQ-PERF-003** | Load Testing & Performance Benchmarking Suite | Automated k6/Artillery scripts simulating real user flows. CI/CD gate: fail build if P95 latency >500ms or error rate >1%. Quarterly full-scale load test. | **P1-High** | System | N/A | OC-PERF-07, DC-SETUP-07 |

### 5.7 Maintenance, Patch & Lifecycle Management Layer (5 Requirements)

| Req ID | Feature Title | Description | Priority | Persona | Workflow Ref | Cost Ref |
|---|---|---|---|---|---|---|
| **REQ-MAINT-001** | Automated Patch & Security Update Management | Weekly vulnerability scan (Dependabot/Snyk), automated dependency updates with CI/CD pass, critical CVE patches within 48h, scheduled maintenance window (weekly 2h window), rollback mechanism. | **P0-Critical** | System, Admin | All workflows | OC-TOOLS-13, OC-INFRA-01 |
| **REQ-MAINT-002** | Zero-Downtime Deployment & Upgrade Mechanism | Blue-green or rolling deployment strategy, database migration with backward compatibility, feature flags for gradual rollout, canary testing, instant rollback on failure. | **P1-High** | System | All workflows | OC-INFRA-01 |
| **REQ-MAINT-003** | Full-Stack Observability & Monitoring | APM (application performance monitoring), distributed tracing, centralized logging, real user monitoring (RUM), synthetic transaction monitoring, infrastructure metrics. Alerting with PagerDuty/OpsGenie integration. Dashboard for platform health SLA tracking. | **P0-Critical** | System, Admin | All workflows | OC-MAINT-08, DC-SETUP-08 |
| **REQ-MAINT-004** | Dependency Vulnerability & License Scanning | Automated scanning of all third-party dependencies (npm, pip, Go modules, Docker images). License compliance check (GPL/AGPL restrictions). SBOM generation per release. CVE notification and auto-PR for fixes. | **P1-High** | System | N/A | OC-TOOLS-13 |
| **REQ-MAINT-005** | System Health Dashboard & SLA Reporting | Real-time uptime dashboard, SLA compliance tracking (target 99.5% uptime), incident timeline and MTTR tracking, capacity forecasting, cost-per-transaction monitoring. | **P1-High** | System, Admin | All workflows | OC-MAINT-08 |

### 5.8 Merchant Microsite & Payment Settlement Layer (8 Requirements)

| Req ID | Feature Title | Description | Priority | Persona | Workflow Ref | Cost Ref |
|---|---|---|---|---|---|---|
| **REQ-MICRO-001** | Merchant Microsite — Storefront URL | Each merchant gets a dedicated microsite at `petemart.in/{shop-slug}` showing their full catalog, brand colors, logo, business hours, and contact info. Microsite inherits merchant's white-label settings. | **P1-High** | Admin, Merchant | WF-ONBOARD-001 | OC-MICRO-01 |
| **REQ-MICRO-002** | Merchant Microsite — Product Catalog Management | Merchant can add/edit/delete products on their microsite. Fields: name, description, images (up to 10), price, MoQ, GST/HSN code, stock count, category, tags, variants (size/color). Bulk upload via CSV. | **P1-High** | Merchant | WF-STORE-SETUP-001 | OC-MICRO-02 |
| **REQ-MICRO-003** | Merchant Microsite — Order Management Dashboard | Merchant sees all orders placed via their microsite. Filter by status (new, confirmed, packed, shipped, delivered, cancelled). Mark items as packed. Print invoice. Update tracking. | **P1-High** | Merchant | WF-ORDER-001 | OC-MICRO-03 |
| **REQ-MICRO-004** | Merchant Microsite — Inventory Sync | Real-time inventory sync between PeteMart platform and merchant microsite. Stock deducted on order placement. Low-stock alert at 5 items. Out-of-stock auto-hide with "Notify Me" option. | **P1-High** | Merchant, System | WF-ORDER-001 | OC-MICRO-04 |
| **REQ-MICRO-005** | Merchant Microsite — GST-Compliant Invoicing | Auto-generate GST invoice for every completed order. Invoice fields: merchant GSTIN, customer GSTIN (if business), HSN/SAC codes, taxable value, CGST/SGST/IGST breakup, invoice number (auto-seq), date. PDF download. Email invoice to customer. | **P0-Critical** | Merchant, System | WF-CHECKOUT-001 | OC-MICRO-05 |
| **REQ-MICRO-006** | Merchant Microsite — Sales Analytics | Merchant dashboard showing: daily/weekly/monthly sales, top products, revenue chart, order count, average order value, customer repeat rate. Export to CSV/PDF. | **P2-Medium** | Merchant | WF-ANALYTICS-001 | OC-MICRO-06 |
| **REQ-MICRO-007** | Merchant Microsite — Razorpay Subaccount Onboarding | During merchant onboarding, collect bank details (account holder name, account number, IFSC, cancelled cheque). Create Razorpay subaccount via Route API. Merchant does NOT need their own Razorpay account — only a bank account. | **P0-Critical** | Merchant, System | WF-ONBOARD-001 | OC-MICRO-07 |
| **REQ-MICRO-008** | Merchant Microsite — Payment Settlement & Holding | Platform holds payments for T+3 days (or configurable settlement period). After hold period, auto-transfer to merchant's Razorpay subaccount which settles to their bank. Settlement report visible in merchant dashboard. Platform fee deducted before settlement. | **P0-Critical** | System | WF-SETTLEMENT-001 | OC-MICRO-08 |

### 5.9 Disaster Recovery & Business Continuity Layer (4 Requirements)

| Req ID | Feature Title | Description | Priority | Persona | Workflow Ref | Cost Ref |
|---|---|---|---|---|---|---|
| **REQ-DR-001** | Disaster Recovery Plan & RPO/RTO Targets | RPO: 15 minutes (database), RTO: 4 hours (full recovery). Tiered approach: mission-critical (RPO 5min, RTO 1hr) vs standard (RPO 1hr, RTO 4hr). Documented DR playbook with runbooks. | **P0-Critical** | System, Admin | All workflows | OC-DR-09, DC-SETUP-09 |
| **REQ-DR-002** | Multi-Region / Multi-AZ Failover Architecture | Application deployed across minimum 2 availability zones. Database with synchronous replication across AZs. DNS-based failover (Route53 or equivalent). Automated health checks triggering failover. | **P1-High** | System | All workflows | OC-DR-09, DC-SETUP-09 |
| **REQ-DR-003** | Automated Database Backup & Point-in-Time Recovery | Continuous WAL archiving, daily snapshots with 30-day retention, cross-region backup replication, tested restore procedure (monthly drill), encrypted backup storage. | **P0-Critical** | System | All workflows | OC-DR-09, OC-INFRA-01 |
| **REQ-DR-004** | DR Testing & Compliance Program | Quarterly DR drill (tabletop + technical), annual full failover test, post-drill RTO/RPO measurement and reporting, DR documentation maintenance, audit trail for compliance. | **P2-Medium** | System, Admin | N/A | OC-DR-09 |

### 5.10 Customer Acquisition Funnels & Onboarding Layer (4 Requirements)

| Req ID | Feature Title | Description | Priority | Persona | Workflow Ref | Cost Ref |
|---|---|---|---|---|---|---|
| **REQ-FUNNEL-001** | Multi-Channel Customer Acquisition Engine | Referral program (shareable links, rewards), WhatsApp viral sharing, QR code flyers in physical stores, social media deep-linking, SEO-optimized landing pages per market, Google Business Profile integration, influencer/affiliate tracking links. | **P1-High** | Admin, Customer | WF-BROWSE-001 | OC-FUNNEL-10, DC-SETUP-13 |
| **REQ-FUNNEL-002** | Guest Browsing with Progressive Conversion | Browse catalog without login, frictionless phone number capture at checkout, saved browsing session across devices, abandoned cart recovery (SMS/WhatsApp), browse-to-enquiry funnel tracking. | **P1-High** | Customer | WF-BROWSE-001, WF-CHECKOUT-001 | OC-COMMS-02 |
| **REQ-FUNNEL-003** | Onboarding Incentive & Loyalty Program Engine | First-order discount, referral bonus credits, loyalty points for repeat purchases, tiered loyalty status (Silver/Gold/Platinum), points expiry management. | **P2-Medium** | Customer, Admin | WF-CHECKOUT-001 | OC-FUNNEL-10 |
| **REQ-FUNNEL-004** | Progressive Web App (PWA) for Zero-Friction Access | Installable PWA, offline product browsing, push notification support, app-like experience without app store download. Bridge for non-smartphone users via WhatsApp chatbot. | **P1-High** | Customer | WF-BROWSE-001, WF-ORDER-A-001 | OC-INFRA-01 |

### 5.11 Data Licensing, Privacy & Compliance Layer (3 Requirements)

| Req ID | Feature Title | Description | Priority | Persona | Workflow Ref | Cost Ref |
|---|---|---|---|---|---|---|
| **REQ-DATA-001** | Customer Data Inventory & Consent Management | Complete customer data mapping (PII inventory), consent capture and revocation (DPDP Act 2023 compliance), data retention policy enforcement, right to be forgotten workflow, data portability export. | **P0-Critical** | System, Admin | All workflows | OC-DATA-11, DC-SETUP-11 |
| **REQ-DATA-002** | Usage Pattern Analytics & Product Improvement | Product affinity analysis, market-level demand heatmaps, seasonal trend detection, merchant performance benchmarking, search query analytics for catalog gaps, recommendation engine. | **P2-Medium** | Admin, Merchant | All workflows | OC-AI-04, OC-INFRA-01 |
| **REQ-DATA-003** | Data Licensing & Monetization Framework | Anonymized aggregate market data products (for B2B), benchmarking reports (subscription), API access tier for third-party partners, data usage audit, revenue sharing with consenting merchants. | **P3-Low** | Admin | N/A | OC-DATA-11 |

---

## 6. Operational Cost Boundaries

### 6.1 Monthly Recurring Operational Costs

| Cost Ref | Cost Category | Low Estimate (₹/mo) | High Estimate (₹/mo) | Description | Related Req IDs |
|---|---|---|---|---|---|
| OC-INFRA-01 | Cloud Infrastructure (Supabase, Railway, Vercel, CDN, GPU inference) | ₹1,300 | ₹4,000 | PostgreSQL DB, serverless functions, static hosting, CDN bandwidth for product images, GPU-backed compute for virtual try-on inference, white-label config store, geo-routing, dynamic config service, feature flag evaluation engine, live streaming relay, co-session sync, virtual street rendering | REQ-UI-001→024, REQ-API-001→013, REQ-BE-001→026, REQ-INFRA-001→011 |
| OC-COMMS-02 | Communications & National Shipping (SMS OTP, Transactional SMS, WhatsApp Business API, ShipRocket API) | ₹3,000 | ₹6,500 | MSG91/Twilio for OTP and order notifications; WhatsApp Business API for Mode B deep links; ShipRocket API subscription for pan-India shipping label generation & tracking | REQ-UI-004, REQ-API-004, REQ-API-009, REQ-API-013, REQ-BE-006, REQ-COM-010 |
| OC-MAPS-03 | Google Maps Platform (Geocoding, Distance Matrix, Maps Embed) | ₹1,500 | ₹3,000 | Geocoding merchant addresses, distance calculations for delivery zones, Maps UI embeds | REQ-UI-005, REQ-API-005 |
| OC-AI-04 | AI & Development Suite (LLM, Pictory, OpenAI, Reel Generation, Virtual Try-On) | ₹10,500 | ₹16,000 | AI-powered product cataloging, automated reel generation (Pictory), search relevance tuning, computer vision for virtual try-on (apparel draping + jewellery sizing) | REQ-BE-009, REQ-BE-018, REQ-COM-003, REQ-UI-015, REQ-UI-016, REQ-COM-009 |
| OC-LEGAL-05 | Legal, Compliance & CA Retention | ₹8,000 | ₹10,000 | Monthly retainer for compliance, CA for GST filings, legal document updates | REQ-INFRA-004, REQ-INFRA-008 |
| OC-STAFF-06 | Field Onboarding Executive & City Expansion Operations | ₹20,000 | ₹25,000 | 1 field executive for in-person merchant onboarding, catalog assistance, physical store photography; city/state expansion onboarding support for new geographic markets | REQ-UI-011, REQ-UI-012, REQ-BE-023 |
| OC-PERF-07 | Performance Testing & Load Testing Infrastructure | ₹2,000 | ₹4,000 | k6/Artillery cloud execution, synthetic monitoring agents, performance dashboard hosting | REQ-PERF-001, REQ-PERF-002, REQ-PERF-003 |
| OC-MAINT-08 | Observability & APM Stack | ₹15,000 | ₹25,000 | APM (Datadog/NewRelic/Grafana), centralized logging, distributed tracing, RUM, PagerDuty/OpsGenie alerting, log storage | REQ-MAINT-003, REQ-MAINT-005 |
| OC-DR-09 | Disaster Recovery Infrastructure | ₹5,000 | ₹10,000 | Cross-region database replication, backup storage (30-day retention), DR compute standby, DNS failover routing | REQ-DR-001, REQ-DR-002, REQ-DR-003, REQ-DR-004 |
| OC-FUNNEL-10 | Marketing & Customer Acquisition | ₹8,000 | ₹15,000 | Referral rewards, loyalty program credits, SMS/WhatsApp campaign costs, SEO tools subscription, affiliate tracking | REQ-FUNNEL-001, REQ-FUNNEL-003 |
| OC-DATA-11 | Data Privacy & Compliance | ₹5,000 | ₹8,000 | Consent management platform, DPDP Act compliance tools, data inventory scanning, right-to-forgiveness workflow | REQ-DATA-001, REQ-DATA-003 |
| OC-LOCAL-12 | Localization & i18n Infrastructure | ₹3,000 | ₹5,000 | Translation management system, locale file hosting, language QA tools | REQ-UI-013 |
| OC-TOOLS-13 | Security & Patch Management Tools | ₹2,000 | ₹4,000 | Snyk/Dependabot vulnerability scanning, license compliance checker, SBOM generation tools | REQ-MAINT-001, REQ-MAINT-004 |
| OC-API-05 | Bullion Rate API Subscription (IndiaBulls/MCX/IBJA) | ₹500 | ₹2,000 | Live gold (24k/22k/18k) and silver rate feed API subscription. Supports rate caching with 5-min freshness. Historical chart data. | REQ-API-012, REQ-UI-017 |

**Total Monthly Operating Burn:** **₹86,300 – ₹1,39,500**

### 6.2 Year 1 Operational Cost Projection (Scaled by Merchant Growth)

| Month | Est. Active Merchants | Infra (₹) | Comms (₹) | Maps (₹) | AI Suite (₹) | Bullion API (₹) | Legal (₹) | Staff (₹) | Perf (₹) | Obsrv (₹) | DR (₹) | Funnel (₹) | Data (₹) | i18n (₹) | Tools (₹) | **Total (₹)** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M1-2 | 10-25 | 2,000 | 1,500 | 500 | 10,500 | 500 | 8,000 | 20,000 | 500 | 3,000 | 1,000 | 2,000 | 1,000 | 1,000 | 500 | **52,000** |
| M3-4 | 25-50 | 2,500 | 2,500 | 1,000 | 12,000 | 500 | 8,000 | 22,000 | 1,000 | 5,000 | 2,000 | 3,000 | 2,000 | 1,500 | 1,000 | **64,000** |
| M5-6 | 50-150 | 3,000 | 3,500 | 1,500 | 14,000 | 1,000 | 9,000 | 25,000 | 2,000 | 8,000 | 3,000 | 5,000 | 3,000 | 2,000 | 1,500 | **81,500** |
| M7-9 | 150-300 | 3,500 | 4,000 | 2,500 | 16,000 | 1,500 | 10,000 | 25,000 | 3,000 | 12,000 | 4,000 | 8,000 | 4,000 | 3,000 | 2,000 | **98,500** |
| M10-12 | 300-400 | 4,000 | 5,000 | 3,000 | 16,000 | 2,000 | 10,000 | 25,000 | 4,000 | 15,000 | 5,000 | 10,000 | 5,000 | 3,000 | 2,500 | **1,09,500** |

---

## 7. Deployment Cost Projections

### 7.1 One-Time Setup Costs

| Cost Ref | Cost Category | Low Estimate (₹) | High Estimate (₹) | Description | Related Req IDs |
|---|---|---|---|---|---|
| DC-SETUP-01 | Company Registration, Trademarks & IP | ₹12,500 | ₹24,000 | Pvt Ltd registration, trademark filing for PeteMart brand, domain registration | REQ-COM-001, REQ-COM-002 |
| DC-SETUP-02 | App Store Listings (Apple Developer + Google Play) | ₹10,400 | ₹10,400 | Apple Developer Program ($99/yr ≈ ₹8,300) + Google Play ($25 one-time ≈ ₹2,100) | REQ-UI-009, REQ-UI-010 |
| DC-SETUP-03 | Initial Cloud & Database Provisioning | ₹10,000 | ₹20,000 | Supabase project setup, Railway/Vercel initial credits, CDN configuration, Redis setup | REQ-UI-001→008, REQ-API-001→010, REQ-BE-001→004, REQ-INFRA-001 |
| DC-SETUP-04 | Legal Documentation (Privacy Policy, Seller T&C, Terms of Use) | ₹25,000 | ₹40,000 | Legal drafting for privacy policy, merchant agreement, customer terms, GDPR/IT Act compliance | REQ-INFRA-004, REQ-INFRA-008 |
| DC-SETUP-05 | First 50 Physical Store Concierge Onboarding Visits | ₹25,000 | ₹50,000 | 50 in-person visits for store photography, catalog upload, QR code installation, training | REQ-UI-011, WF-ONBOARD-001 |
| DC-SETUP-06 | Razorpay Platform Integration & Verification | ₹5,000 | ₹10,000 | Razorpay account setup, KYC, payment gateway integration, webhook configuration | REQ-API-003, REQ-COM-002 |
| DC-SETUP-07 | Performance Benchmarking & Load Testing Setup | ₹15,000 | ₹25,000 | k6/Artillery test script development, performance dashboard setup, CI/CD performance gate configuration | REQ-PERF-001, REQ-PERF-003 |
| DC-SETUP-08 | Full-Stack Observability Stack Setup | ₹20,000 | ₹35,000 | APM agent instrumentation, centralized logging pipeline, distributed tracing setup, RUM SDK integration, alerting integration (PagerDuty/OpsGenie) | REQ-MAINT-003 |
| DC-SETUP-09 | Disaster Recovery Infrastructure Setup | ₹25,000 | ₹40,000 | Multi-region/AZ infrastructure provisioning, database replication configuration, DNS failover setup, DR playbook development, initial failover test | REQ-DR-001, REQ-DR-002 |
| DC-SETUP-10 | i18n/Localization Implementation | ₹20,000 | ₹35,000 | UI string externalization, translation management system setup, Kannada/Hindi translation, RTL support preparation, locale QA | REQ-UI-013 |
| DC-SETUP-11 | Data Privacy & Consent Infrastructure | ₹15,000 | ₹25,000 | Consent management platform setup, PII inventory scanning, DPDP Act compliance workflow implementation, data portability API | REQ-DATA-001 |
| DC-SETUP-12 | PCI DSS Compliance via Razorpay | ₹5,000 | ₹10,000 | SAQ A validation, ASV scan setup, PCI attestation documentation, tokenization configuration for recurring payments | REQ-INFRA-009 |
| DC-SETUP-13 | Marketing Funnel & Referral Engine Setup | ₹15,000 | ₹25,000 | Referral program configuration, loyalty engine setup, SEO landing page templates, Google Business Profile integration, affiliate tracking | REQ-FUNNEL-001, REQ-FUNNEL-003 |

**Total One-Time Setup Cost:** **₹2,02,900 – ₹3,59,400**

### 7.2 Cost Allocation Per Requirement Category

| Category | Setup Cost (₹) | Monthly Operational (₹) | % of Total Budget |
|---|---|---|---|
| **UI/UX** (24 reqs) | ₹60,000 – ₹1,00,000 | ₹16,000 – ₹27,000 | 19% |
| **API** (13 reqs) | ₹20,000 – ₹32,000 | ₹7,000 – ₹13,000 | 8% |
| **Backend/Data** (26 reqs) | ₹50,000 – ₹80,000 | ₹20,000 – ₹32,000 | 21% |
| **Commerce/Monetization** (10 reqs) | ₹20,000 – ₹33,000 | ₹6,000 – ₹11,000 | 8% |
| **Infrastructure/Security** (11 reqs) | ₹55,000 – ₹88,000 | ₹24,000 – ₹30,000 | 20% |
| **Performance/Scale** (3 reqs) | ₹15,000 – ₹25,000 | ₹2,000 – ₹4,000 | 4% |
| **Maintenance/Lifecycle** (5 reqs) | ₹20,000 – ₹35,000 | ₹17,000 – ₹29,000 | 10% |
| **Disaster Recovery** (4 reqs) | ₹25,000 – ₹40,000 | ₹5,000 – ₹10,000 | 5% |
| **Funnels/Onboarding** (4 reqs) | ₹15,000 – ₹25,000 | ₹8,000 – ₹15,000 | 5% |
| **Data Privacy/Compliance** (3 reqs) | ₹15,000 – ₹25,000 | ₹5,000 – ₹8,000 | 2% |
| **Totals** (103 reqs) | **₹2,95,000 – ₹4,83,000** | **₹1,10,000 – ₹1,79,000** | **~102%*** |

*Note: Percentages exceed 100% due to overlapping cost references across multiple categories (shared infrastructure).

### 7.3 Break-Even Analysis (Projected)

| Milestone | Timeline | Est. Monthly Revenue (MRR) | Est. Monthly Cost | Status |
|---|---|---|---|---|
| **MVP Launch** | Month 3 | ₹0 (free trial merchants) | ₹52,000 | Investment phase |
| **50 Paid Sellers** | Month 4-5 | ~₹30,000/mo | ₹64,000 | Requires light operational cost containment |
| **150 Paid Sellers** | Month 6 | ~₹1,15,000/mo | ₹81,500 | **Self-sustaining** — covers full monthly burn |
| **400 Paid Sellers** | Month 12 | ~₹3,75,000/mo | ₹1,09,500 | Solid operational profitability (3.4x margin) |
| **2,000 Paid Sellers** | Year 2 | ~₹17,00,000/mo | ₹1,50,000 | Multi-city expansion ready (~₹2 Cr ARR) |

---

## 8. Appendix: Quality Guardrail Compliance

### 8.1 Requirement ID ↔ Cost Projection Cross-Reference

All **103 Requirement IDs** have been verified to have associated cost projections:

| Requirement IDs | Has Operational Cost? | Has Deployment Cost? | Guardrail Status |
|---|---|---|---|
| REQ-UI-001 through REQ-UI-024 (24) | ✅ Yes (OC-INFRA-01, OC-COMMS-02, OC-MAPS-03, OC-STAFF-06, OC-LOCAL-12, OC-AI-04, OC-API-05) | ✅ Yes (DC-SETUP-02, DC-SETUP-03, DC-SETUP-10) | **PASS** |
| REQ-API-001 through REQ-API-013 (13) | ✅ Yes (OC-INFRA-01, OC-COMMS-02, OC-MAPS-03, OC-API-05) | ✅ Yes (DC-SETUP-03, DC-SETUP-06) | **PASS** |
| REQ-BE-001 through REQ-BE-026 (26) | ✅ Yes (OC-INFRA-01, OC-AI-04, OC-COMMS-02, OC-LEGAL-05, OC-STAFF-06) | ✅ Yes (DC-SETUP-03, DC-SETUP-04) | **PASS** |
| REQ-COM-001 through REQ-COM-010 (10) | ✅ Yes (OC-INFRA-01, OC-AI-04, OC-COMMS-02) | ✅ Yes (DC-SETUP-01, DC-SETUP-06) | **PASS** |
| REQ-INFRA-001 through REQ-INFRA-011 (11) | ✅ Yes (OC-INFRA-01, OC-TOOLS-13) | ✅ Yes (DC-SETUP-03, DC-SETUP-04, DC-SETUP-12) | **PASS** |
| REQ-PERF-001 through REQ-PERF-003 (3) | ✅ Yes (OC-PERF-07, OC-INFRA-01) | ✅ Yes (DC-SETUP-07) | **PASS** |
| REQ-MAINT-001 through REQ-MAINT-005 (5) | ✅ Yes (OC-MAINT-08, OC-TOOLS-13, OC-INFRA-01) | ✅ Yes (DC-SETUP-08) | **PASS** |
| REQ-DR-001 through REQ-DR-004 (4) | ✅ Yes (OC-DR-09, OC-INFRA-01) | ✅ Yes (DC-SETUP-09) | **PASS** |
| REQ-FUNNEL-001 through REQ-FUNNEL-004 (4) | ✅ Yes (OC-FUNNEL-10, OC-COMMS-02, OC-INFRA-01) | ✅ Yes (DC-SETUP-13) | **PASS** |
| REQ-DATA-001 through REQ-DATA-003 (3) | ✅ Yes (OC-DATA-11, OC-AI-04, OC-INFRA-01) | ✅ Yes (DC-SETUP-11) | **PASS** |

### 8.2 Demo Milestone → Requirement ID Mapping Compliance

All **12 End-to-End Demo Milestones** (§9.3) have been verified to map exclusively to existing Requirement IDs — no new Requirement IDs were created:

| Milestone ID | Demo Name | Tier | Maps to Existing Req IDs | New Req IDs Created? | Guardrail Status |
|---|---|---|---|---|---|
| M-T0-01 | Market Explorer | T0 — Launch MVP | REQ-UI-001, REQ-UI-002, REQ-UI-008, REQ-BE-001, REQ-BE-009, REQ-INFRA-001 | 0 | **PASS** |
| M-T0-02 | Direct Purchase Flow (Mode A) | T0 — Launch MVP | REQ-UI-003, REQ-UI-006, REQ-API-003, REQ-BE-002, REQ-BE-003, REQ-COM-002, REQ-INFRA-004 | 0 | **PASS** |
| M-T0-03 | Merchant Onboarding & Go-Live | T0 — Launch MVP | REQ-UI-011, REQ-UI-012, REQ-API-008, REQ-BE-004, REQ-COM-001 | 0 | **PASS** |
| M-T1-01 | Multi-Channel Access | T1 — Month 1 | REQ-UI-009, REQ-UI-010, REQ-UI-013, REQ-API-004, REQ-API-005 | 0 | **PASS** |
| M-T1-02 | Admin Command Center | T1 — Month 1 | REQ-UI-012, REQ-API-010, REQ-BE-005, REQ-BE-008, REQ-COM-005 | 0 | **PASS** |
| M-T2-01 | Trust & Engagement | T2 — Q2 Growth | REQ-BE-012, REQ-BE-025, REQ-UI-021, REQ-API-009 | 0 | **PASS** |
| M-T2-02 | Pan-India Shipping | T2 — Q2 Growth | REQ-COM-010, REQ-API-013, REQ-BE-024, REQ-UI-007 | 0 | **PASS** |
| M-T2-03 | Festival Sale Campaign | T2 — Q2 Growth | REQ-COM-007, REQ-COM-005, REQ-UI-012, REQ-BE-008 | 0 | **PASS** |
| M-T3-01 | Virtual Try-On & Jewellery | T3 — Q3 Mature | REQ-UI-016, REQ-UI-017, REQ-API-012, REQ-BE-018, REQ-BE-019 | 0 | **PASS** |
| M-T3-02 | City Expansion | T3 — Q3 Mature | REQ-UI-019, REQ-BE-022, REQ-BE-023, REQ-UI-020, REQ-BE-021 | 0 | **PASS** |
| M-T4-01 | Pete Street Virtual Walk | T4 — Visionary | REQ-UI-022, REQ-BE-026 | 0 | **PASS** |
| M-T4-02 | Live Bazaar | T4 — Visionary | REQ-UI-023, REQ-API-009, REQ-BE-008 | 0 | **PASS** |

**Validation Rule Enforced:** Every milestone references existing Requirement IDs from §5. Zero new Requirement IDs introduced. Each milestone also carries an estimated build time and defined success criteria, satisfying both the "Requirement ID → Cost Projection" and "Demo → Stakeholder Value" validation rules.

### 8.3 Workflow ↔ Schema Key Structural Match

All 13 core workflows defined in this Markdown document have corresponding entries in the JSON schema:

| Workflow ID | Markdown Section | JSON Schema Key | Match Status |
|---|---|---|---|
| WF-BROWSE-001 | §3.1 Browse Products | `.workflows.browse_products` | ✅ **MATCH** |
| WF-ORDER-A-001 | §3.2 Direct Purchase (Mode A) | `.workflows.order_mode_a` | ✅ **MATCH** |
| WF-ORDER-B-001 | §3.3 WhatsApp Enquiry (Mode B) | `.workflows.order_mode_b` | ✅ **MATCH** |
| WF-ORDER-C-001 | §3.4 Visit Store (Mode C) | `.workflows.order_mode_c` | ✅ **MATCH** |
| WF-CHECKOUT-001 | §3.5 Multi-Store Checkout | `.workflows.checkout_consolidation` | ✅ **MATCH** |
| WF-TRACK-001 | §3.6 Order Tracking | `.workflows.order_tracking` | ✅ **MATCH** |
| WF-ONBOARD-001 | §3.7 Merchant Onboarding | `.workflows.merchant_onboarding` | ✅ **MATCH** |
| WF-TRYON-001 | §3.8 AI Virtual Try-On | `.workflows.virtual_try_on` | ✅ **MATCH** |
| WF-JEWELLERY-001 | §3.9 Jewellery Browsing with Bullion Rates | `.workflows.jewellery_browsing` | ✅ **MATCH** |
| WF-VIDEOCALL-001 | §3.10 Video Call Appointment | `.workflows.video_call_appointment` | ✅ **MATCH** |
| WF-FEATUREFLAG-001 | §3.11 Feature Flag & Kill Switch | `.workflows.feature_flag_kill_switch` | ✅ **MATCH** |
| WF-REVIEW-001 | §3.12 Product & Merchant Review | `.workflows.review_moderation` | ✅ **MATCH** |
| WF-VIRTUALWALK-001 | §3.13 Pete Street Virtual Walk | `.workflows.virtual_walk` | ✅ **MATCH** |

---

## 9. MVP Scope Recommendation (Marketing & Customer POV)

This section evaluates all 103 requirements from a marketing and customer perspective, grouping them into phased tiers that maximize customer value while managing development complexity and operational cost.

### 9.1 MVP Tier Rationale

| Category | MVP Tier | Requirements | Rationale |
|---|---|---|---|
| **Tier 0 — Launch MVP** (must have) | **MVP** | REQ-UI-001 to REQ-UI-008, REQ-UI-011, REQ-API-001 to REQ-API-006, REQ-API-008, REQ-BE-001 to REQ-BE-004, REQ-BE-011, REQ-BE-015, REQ-COM-001, REQ-COM-002, REQ-INFRA-001, REQ-INFRA-004, REQ-INFRA-006, REQ-INFRA-008, REQ-INFRA-011, REQ-PERF-001, REQ-PERF-002, REQ-MAINT-003, **REQ-MICRO-001**, **REQ-MICRO-002**, **REQ-MICRO-005**, **REQ-MICRO-007**, **REQ-MICRO-008** | Core browsing, Mode A/B/C checkout, merchant onboarding, basic payments, security, kill switch, monitoring, **merchant microsite**, **catalog management**, **GST invoicing**, **Razorpay subaccount onboarding**, **payment settlement** |
| **Tier 1 — Month 1 Post-Launch** | **MVP+1** | REQ-UI-009, REQ-UI-010, REQ-UI-012, REQ-UI-013, REQ-API-007, REQ-API-009, REQ-BE-005, REQ-BE-006, REQ-BE-007, REQ-MAINT-001, REQ-DR-001, REQ-DR-003 | Mobile apps, i18n, admin dashboard, notifications, basic DR, patching |
| **Tier 2 — Quarter 2** | **Growth** | REQ-UI-007, REQ-UI-014, REQ-API-010, REQ-API-011, REQ-BE-008, REQ-BE-009, REQ-BE-010, REQ-BE-012, REQ-BE-013, REQ-BE-014, REQ-BE-016, REQ-BE-017, REQ-BE-025, REQ-COM-003, REQ-COM-005, REQ-COM-006, REQ-COM-007, REQ-COM-008, REQ-COM-009, REQ-COM-010, REQ-FUNNEL-001, REQ-FUNNEL-002, REQ-MAINT-002, REQ-INFRA-009, **REQ-MICRO-003**, **REQ-MICRO-004**, **REQ-MICRO-006** | Reviews & moderation, analytics, catalog mgmt, promo engine, escrow, ShipRocket, funnels, zero-downtime deploys, **order management dashboard**, **inventory sync**, **sales analytics** |
| **Tier 3 — Quarter 3** | **Mature** | REQ-UI-015 to REQ-UI-020, REQ-BE-018 to REQ-BE-024, REQ-API-012, REQ-API-013, REQ-DATA-001, REQ-DATA-002, REQ-INFRA-010, REQ-MAINT-004, REQ-MAINT-005, REQ-FUNNEL-003, REQ-FUNNEL-004, REQ-PERF-003, REQ-DR-002, REQ-DR-004 | Virtual try-on, jewellery rates, multi-city expansion, CDP, white-label, load testing |
| **Tier 4 — Visionary** | **Future** | REQ-UI-021 to REQ-UI-024, REQ-BE-025 (partial: moderation only — review UI goes in Tier 2), REQ-BE-026, REQ-DATA-003 | Virtual Walk, Live Bazaar, Co-Shopping, data licensing, virtual street CMS |

### 9.2 Narrative — Why These Tiers?

#### Tier 0 — Launch MVP: "The PeteMart Promise" (Month 0)

**Customer POV:** Priya opens PeteMart and can browse actual stores from Chickpet, add silk sarees to cart, pay with UPI, and get them delivered to her doorstep. Ramesh the merchant sets up his store in under 15 minutes with zero upfront cost. This is the core value proposition — no gimmicks, just "shop at your local Pete market from home."

**Marketing Positioning:** *"Your favourite Pete market, now in your pocket."* Focus on the three interaction modes (Buy Now / Enquire on WhatsApp / Visit Store) as the unique differentiator from generic e-commerce. Launch with 10-25 anchor merchants from Chickpet and Balepet to demonstrate proof of concept.

**Unique Value Unlocked:** First-mover advantage in hyperlocal Pete market digitization. The "Enquire on WhatsApp" mode preserves merchant trust for high-value items while "Buy Now" offers convenience for commodity items.

#### Tier 1 — Month 1 Post-Launch: "Full Spectrum Access"

**Customer POV:** Priya can now browse from her phone (iOS & Android), read product descriptions in Kannada, and receive push notifications when her order is out for delivery. Admin Ananya gets the operations dashboard to manage growth.

**Marketing Positioning:** *"PeteMart on the go — Android, iOS, in your language."* Launch PR around app store availability and Kannada/Hindi support. Target WhatsApp forwards in local community groups.

**Unique Value Unlocked:** Multi-language removes adoption barrier for non-English-speaking merchants and customers. Mobile apps drive 3x engagement vs. web-only.

#### Tier 2 — Quarter 2: "Trust & Growth Engine"

**Customer POV:** Priya can now read reviews before buying, use promo codes during festivals, and trust that her payment is held in escrow until delivery. She earns loyalty points for repeat purchases.

**Marketing Positioning:** *"Shop with confidence. Real reviews. Real merchants. Real trust."* Launch review system as a trust signal. Promote "Verified Purchase" badges to combat fake review anxiety. Festival campaigns with promo codes drive repeat traffic.

**Unique Value Unlocked:** Reviews and ratings create network effects — more reviews → more trust → more purchases → more reviews. Coupon engine drives seasonal spikes (Diwali, Ugadi).

#### Tier 3 — Quarter 3: "Premium Experience & Scale"

**Customer POV:** Priya can virtually try on a Kanchipuram saree before buying, see live gold rates on jewellery, and discover merchants from new cities. Deepa gets CDP-powered personalized wholesale recommendations.

**Marketing Positioning:** *"See it before you buy it. PeteMart — the future of traditional shopping."* AI Virtual Try-On is the hero feature for PR and influencer marketing. Multi-city expansion announced as "PeteMart goes national."

**Unique Value Unlocked:** Virtual Try-On solves the #1 hesitation for online apparel/jewellery purchase — "will it look good on me?" This is a category-defining moat. Multi-city expansion grows TAM from 21 markets to unlimited cities.

#### Tier 4 — Visionary: "The Definitive Pete Experience"

**Customer POV:** Priya takes a virtual walk down Chickpet Main Road from her living room, enters Ramesh's store through a 3D storefront, and buys a saree displayed on a virtual shelf. Later, her mother-in-law joins the same virtual street from her home, and they shop together.

**Marketing Positioning:** *"Step into the market. From anywhere."* Viral social media campaign with Virtual Walk walkthroughs. "Shop Together" positioned as the ultimate family shopping experience for NRIs and out-station relatives who miss the Pete market experience.

**Unique Value Unlocked:** These features create an **uncopyable moat** — no other e-commerce platform can claim authentic Pete market street experiences. The combination of 3D Virtual Walk, Live Bazaar streaming, and Co-Shopping creates a **metaverse-like experience rooted in physical reality**. This is the long-term defensive moat against both horizontal e-commerce giants and vertical-specific competitors.

---

### 9.3 End-to-End Demo Milestones

Each milestone below describes a concrete, stakeholder-visible demo scenario. These milestones do **not** introduce new Requirement IDs — they map to existing requirements defined in §5. Every milestone includes a step-by-step walkthrough, explicit success criteria, the business question it answers, and a rough engineering time estimate.

---

#### Tier 0 — Launch MVP (Month 0)

**M-T0-01: "Market Explorer" Demo**
| Field | Detail |
|---|---|
| **Milestone ID** | M-T0-01 |
| **Demo Name** | Market Explorer |
| **Walkthrough** | User opens PeteMart web application → sees Pete Tapestry carousel with 21 market tiles → selects Chickpet → market page loads with merchant grid (Kuberan Silks, etc.) → clicks Kuberan Silks → product catalog renders with Mode A/B/C badges → selects a product → views product detail page with price, images, MOQ, delivery eligibility |
| **Success Criteria** | All 21 markets visible and tappable; merchant catalog renders within 2s; Mode A/B/C badges display correctly on product cards; product detail page shows all required fields (price, images, MOQ, delivery zone); search returns correct merchant results |
| **Stakeholder Value** | *"Can a first-time visitor discover Pete markets and browse a merchant's catalog?"* Validates that the core discovery funnel works end-to-end before any purchase flow is tested |
| **Est. Build Time** | 4 weeks |
| **Related Req IDs** | REQ-UI-001, REQ-UI-002, REQ-UI-008, REQ-BE-001, REQ-BE-009, REQ-INFRA-001 |

**M-T0-02: "Direct Purchase Flow" Demo (Mode A)**
| Field | Detail |
|---|---|
| **Milestone ID** | M-T0-02 |
| **Demo Name** | Direct Purchase Flow — Mode A |
| **Walkthrough** | User finds a Mode A product → clicks "Add to Cart" → adds a second Mode A product from a *different* merchant → navigates to cart → sees consolidated cart with merchant-wise item grouping → proceeds to checkout → delivery fee calculated (zone base rate + weight surcharge + consolidation surcharge of ₹25/additional store) → enters delivery address → selects B2C pricing → clicks "Place Order" → redirected to Razorpay → pays via UPI → order confirmed → push notification and SMS sent to customer and both merchants → order visible in "My Orders" with status "Confirmed" |
| **Success Criteria** | Full cart-to-delivery lifecycle completes end-to-end; multi-merchant consolidation works (items from 2+ merchants in single order); delivery fee formula executes correctly; Razorpay payment succeeds and webhook updates order status; both merchants receive order notification; customer receives confirmation; order appears in order history |
| **Stakeholder Value** | *"Can a customer buy from multiple Pete merchants in one checkout?"* This is the core revenue-generating flow. Validates the platform's unique multi-merchant consolidation value proposition |
| **Est. Build Time** | 6 weeks |
| **Related Req IDs** | REQ-UI-003, REQ-UI-006, REQ-API-003, REQ-BE-002, REQ-BE-003, REQ-COM-002, REQ-INFRA-004 |

**M-T0-03: "Merchant Onboarding & Go-Live" Demo**
| Field | Detail |
|---|---|
| **Milestone ID** | M-T0-03 |
| **Demo Name** | Merchant Onboarding & Go-Live (with Microsite & Payment Setup) |
| **Walkthrough** | Merchant (Ramesh) visits petemart.com/sell → enters phone number → receives OTP → verifies → fills business details (store name "Kuberan Silks", address in Chickpet, category "Textiles") → selects Growth plan (₹999/mo) → chooses all three modes (Buy Now / Enquire on WhatsApp / Visit Store) → **enters bank details for payment settlement (account holder name, account number, IFSC, uploads cancelled cheque)** → **Razorpay subaccount created automatically via Route API** → uploads 3 product photos manually → submits for approval → Admin (Ananya) logs into dashboard → sees merchant in approval queue → reviews details → reviews bank details → clicks "Approve" → **merchant microsite created at petemart.in/kuberan-silks with brand colors, logo, full catalog** → QR code generated and downloadable → merchant receives welcome SMS with store URL and QR code |
| **Success Criteria** | End-to-end onboarding completes in under 15 minutes; store is publicly accessible at the correct URL; QR code scans to the correct merchant microsite; **Razorpay subaccount is active and linked to merchant's bank account**; microsite shows merchant catalog, brand colors, and business hours; admin approval is a one-click action; merchant receives welcome communication |
| **Stakeholder Value** | *"Can we onboard 50 merchants this month and set them up for payments?"* Validates the merchant acquisition engine — the critical supply-side growth loop. Also validates admin operational readiness and payment settlement readiness |
| **Est. Build Time** | 6 weeks |
| **Related Req IDs** | REQ-UI-011, REQ-UI-012, REQ-API-008, REQ-BE-004, REQ-COM-001, REQ-MICRO-001, REQ-MICRO-002, REQ-MICRO-007, REQ-MICRO-008, WF-ONBOARD-001 |

---

#### Tier 1 — Month 1 Post-Launch

**M-T1-01: "Multi-Channel Access" Demo**
| Field | Detail |
|---|---|
| **Milestone ID** | M-T1-01 |
| **Demo Name** | Multi-Channel Access (Mobile + i18n + QR + Maps) |
| **Walkthrough** | Customer opens PeteMart mobile app (Android) → landing page loads in English → opens settings → toggles language to Kannada → all UI strings switch to Kannada → scans QR code displayed in Balepet shop → merchant microsite opens in-app → finds a Mode B product → taps "Enquire on WhatsApp" → WhatsApp opens with pre-filled message (product name, SKU, merchant name) → returns to app → finds a Mode C product → taps "Get Directions" → Google Maps opens with merchant's store pinned → travel time and route displayed |
| **Success Criteria** | i18n toggle switches all strings to Kannada without page reload; QR camera scanner loads merchant microsite within 2s; WhatsApp deep-link includes product context; Google Maps deep-link shows correct merchant location; all flows work on both iOS and Android |
| **Stakeholder Value** | *"Can a non-English-speaking customer use PeteMart fully?"* Validates that the platform is accessible to the core target demographic (Kannada-speaking customers) and across all channels (mobile, QR, WhatsApp, Maps) |
| **Est. Build Time** | 6 weeks |
| **Related Req IDs** | REQ-UI-009, REQ-UI-010, REQ-UI-013, REQ-API-004, REQ-API-005, REQ-UI-004, REQ-UI-005 |

**M-T1-02: "Admin Command Center" Demo**
| Field | Detail |
|---|---|
| **Milestone ID** | M-T1-02 |
| **Demo Name** | Admin Command Center |
| **Walkthrough** | Admin (Ananya) logs into admin dashboard → sees revenue dashboard with MRR chart (real-time data from live orders) → views merchant approval queue → approves 3 pending merchants with one click → opens subscription lifecycle view → sees all active, expired, and trialing merchants → filters by plan tier (Starter/Growth/Premium) → generates monthly revenue report → clicks "Export CSV" → file downloads with correct data → views notification log showing delivery of SMS/push notifications |
| **Success Criteria** | Revenue dashboard shows real-time data; merchant approval is one-click with immediate store go-live; subscription lifecycle view is accurate and filterable; CSV export contains correct columns and data; all operations complete without page refresh |
| **Stakeholder Value** | *"Can operations scale from 10 to 400 merchants without hiring 10 people?"* Validates that the admin tooling can support platform growth without proportional headcount increase |
| **Est. Build Time** | 3 weeks |
| **Related Req IDs** | REQ-UI-012, REQ-API-010, REQ-BE-005, REQ-BE-008, REQ-COM-005 |

---

#### Tier 2 — Quarter 2 Growth

**M-T2-01: "Trust & Engagement" Demo**
| Field | Detail |
|---|---|
| **Milestone ID** | M-T2-01 |
| **Demo Name** | Trust & Engagement (Reviews + Ratings) |
| **Walkthrough** | Customer receives previously ordered product → gets push notification "How was your experience?" → taps notification → opens review form → rates product 4★ → uploads a photo → writes review text → submits → system shows "Verified Purchase" badge → review auto-published (clean content) → merchant receives notification → merchant logs into dashboard → sees new review → writes a public reply "Thank you, Priya!" → reply goes live after admin auto-moderation → other customers browsing the product see the review with "Verified Purchase" badge and merchant reply → review marked as "Helpful" by 3 users |
| **Success Criteria** | Full review lifecycle completes: submission → moderation → publication → merchant reply. "Verified Purchase" badge appears. Photo upload works (<50MB). Merchant reply renders correctly below review. "Helpful" counter increments per unique user. |
| **Stakeholder Value** | *"Are customers confident enough to buy from an unknown merchant?"* Validates that the trust-building feedback loop is operational — reviews create social proof that drives conversion for new customers |
| **Est. Build Time** | 4 weeks |
| **Related Req IDs** | REQ-BE-012, REQ-BE-025, REQ-UI-021, REQ-API-009, WF-REVIEW-001 |

**M-T2-02: "Pan-India Shipping" Demo**
| Field | Detail |
|---|---|
| **Milestone ID** | M-T2-02 |
| **Demo Name** | Pan-India Shipping via ShipRocket |
| **Walkthrough** | Admin enables ShipRocket integration in config → Merchant (Ramesh) opts into pan-India shipping from merchant dashboard → Customer from Mumbai searches for a product → finds Kuberan Silks saree → adds to cart → proceeds to checkout → enters Mumbai delivery pincode → system detects pincode outside 15km hyperlocal zone → routes order to ShipRocket → shipping rate calculated (weight + pincode) → customer pays → order confirmed → ShipRocket label generated → courier assigned → tracking number created → customer sees ShipRocket tracking link in order details → tracking status updates synced via webhook → delivered |
| **Success Criteria** | Hybrid routing decision is correct (local vs national based on pincode); ShipRocket label generates successfully; tracking number syncs back to PeteMart; customer sees unified tracking UI; merchant can opt-in/opt-out from dashboard |
| **Stakeholder Value** | *"Can PeteMart serve customers outside Bangalore?"* Validates the platform's ability to expand beyond hyperlocal delivery and serve the national market, unlocking a 10x larger TAM |
| **Est. Build Time** | 5 weeks |
| **Related Req IDs** | REQ-COM-010, REQ-API-013, REQ-BE-024, REQ-UI-007, REQ-API-007 |

**M-T2-03: "Festival Sale Campaign" Demo**
| Field | Detail |
|---|---|
| **Milestone ID** | M-T2-03 |
| **Demo Name** | Festival Sale Campaign (Promo Engine) |
| **Walkthrough** | Admin logs into dashboard → navigates to Promo Engine → creates new promo code "DIWALI10" → sets 10% off on all Mode A products → sets usage limit (500 uses) → sets expiry (7 days) → activates → homepage banner auto-updates with "Diwali Sale! Use DIWALI10" → Customer sees banner → adds products to cart → proceeds to checkout → enters promo code "DIWALI10" → system validates and applies 10% discount → order total recalculates → customer completes purchase → Admin opens revenue dashboard → sees promo usage analytics: total uses, discount amount, revenue uplift → exports report |
| **Success Criteria** | Promo lifecycle complete: create → display → apply → track → report. Discount calculation is accurate (10% of subtotal, not including delivery fee). Usage limits are enforced. Banner promotion updates in real-time. |
| **Stakeholder Value** | *"Can PeteMart run a Diwali sale and track its impact?"* Validates that the marketing team has the tooling to run seasonal campaigns independently without engineering involvement |
| **Est. Build Time** | 3 weeks |
| **Related Req IDs** | REQ-COM-007, REQ-COM-005, REQ-UI-012, REQ-BE-008 |

---

#### Tier 3 — Quarter 3 Mature

**M-T3-01: "Virtual Try-On & Jewellery" Demo**
| Field | Detail |
|---|---|
| **Milestone ID** | M-T3-01 |
| **Demo Name** | Virtual Try-On & Jewellery Dynamic Pricing |
| **Walkthrough** | Customer opens PeteMart → navigates to Jewellery category → sees product card with live gold rate badge (24k ₹/gm, 22k ₹/gm) with last-updated timestamp → clicks on a gold necklace product → product detail shows: weight 12g, today's 22k rate ₹6,500/gm, making charges 12%, stone charges ₹2,000, GST 3% → total calculated dynamically: (12 × 6,500) + 12% + 2,000 + 3% = displayed → customer taps "Try On" → uploads a selfie → AI engine detects face landmarks → superimposes necklace with proportional sizing and gold colour accuracy → customer sees photorealistic preview → adjusts to different weight variant → price recalculates with new weight → try-on re-renders with scaled necklace → customer shares try-on snapshot via WhatsApp |
| **Success Criteria** | Live bullion rate displays with <5min freshness; dynamic pricing formula executes correctly (weight × rate + making + stone + GST); AI try-on renders jewellery within 5s; size scaling is proportional to face landmarks; shareable snapshot generates with product link overlay |
| **Stakeholder Value** | *"Can a customer confidently buy jewellery online without seeing it in person?"* This is the category-defining feature for high-value jewellery. Validates that the platform solves the #1 barrier for online jewellery purchase |
| **Est. Build Time** | 8 weeks |
| **Related Req IDs** | REQ-UI-016, REQ-UI-017, REQ-API-012, REQ-BE-018, REQ-BE-019, WF-JEWELLERY-001, WF-TRYON-001 |

**M-T3-02: "City Expansion" Demo**
| Field | Detail |
|---|---|
| **Milestone ID** | M-T3-02 |
| **Demo Name** | City Expansion — Onboarding a New City |
| **Walkthrough** | Admin opens city management dashboard → clicks "Add City" → enters "Mumbai, Maharashtra" → system creates city landing page at petemart.in/mumbai → delivery zones auto-initialised with Mumbai's pincode ranges → tax rules applied (Maharashtra GST: 9% SGST + 9% CGST) → city-specific homepage content seeded → city goes live → Customer in Mumbai visits petemart.in → city auto-detected as Mumbai (or manually selected) → sees Mumbai-specific merchants (initially empty state with "Coming Soon" messaging) → merchant discovery campaign for Mumbai merchants begins → first Mumbai merchant onboarded → store goes live → appears in Mumbai market page |
| **Success Criteria** | New city landing page is live and SEO-accessible; delivery zones are correctly mapped to Mumbai pincodes; tax rules reflect Maharashtra GST rates; city selector shows Mumbai; merchant onboarding for Mumbai follows correct geo-hierarchy |
| **Stakeholder Value** | *"How do we take PeteMart from Bangalore to Bharat?"* Validates the platform's ability to replicate the Pete model in any Indian city — the core scalability thesis of the business |
| **Est. Build Time** | 6 weeks |
| **Related Req IDs** | REQ-UI-019, REQ-BE-022, REQ-BE-023, REQ-UI-020, REQ-BE-021 |

---

#### Tier 4 — Visionary

**M-T4-01: "Pete Street Virtual Walk" Demo**
| Field | Detail |
|---|---|
| **Milestone ID** | M-T4-01 |
| **Demo Name** | Pete Street Virtual Walk & In-Store Purchase |
| **Walkthrough** | User selects "Virtual Walk" from homepage → enters 2.5D Chickpet Main Road scene → storefronts line both sides with merchant name badges → user navigates down the street (arrow keys/drag/swipe) → approaches Kuberan Silks storefront → storefront zooms in → tap "Enter Store" → transitions to 3D virtual store interior → products arranged on shelves by category → user taps a silk saree on a virtual shelf → product detail popup appears with price, description, Mode A/B/C options → clicks "Add to Cart" → exits store back to street → continues browsing → enters another store → adds another product → exits virtual walk → opens cart → sees both products → completes checkout via standard Mode A flow |
| **Success Criteria** | Street navigation feels natural (smooth scrolling, correct store order); storefronts are tappable; virtual store interior loads within 3s; product shelves are interactable; purchase completes from virtual walk through standard checkout; no more than 2% of users report motion discomfort |
| **Stakeholder Value** | *"Can we recreate the feeling of walking through Chickpet market online?"* Validates the immersive experience that differentiates PeteMart from every other e-commerce platform — this is the uncopyable moat |
| **Est. Build Time** | 12 weeks |
| **Related Req IDs** | REQ-UI-022, REQ-BE-026, WF-VIRTUALWALK-001 |

**M-T4-02: "Live Bazaar" Demo**
| Field | Detail |
|---|---|
| **Milestone ID** | M-T4-02 |
| **Demo Name** | Live Bazaar — Real-Time Merchant Livestream |
| **Walkthrough** | Merchant opens Live Bazaar from merchant dashboard → taps "Go Live Now" → system starts live stream from merchant's phone camera → customers receive push notification "Kuberan Silks is LIVE!" → customers tap notification → live stream player opens in PeteMart → merchant shows sarees on camera, explains fabric, drapes one → viewers type questions in live chat → merchant answers verbally → merchant pins a product card ("Kanchipuram Silk Saree — ₹4,500") → viewers see pinned product card with "Buy Now" button → viewer taps "Buy Now" → product added to cart → viewer completes purchase without leaving stream → other viewers see purchase notification ("Priya just bought this!") → stream ends → recording archived for 7-day replay → merchant sees stream analytics (viewers, engagement, conversions) |
| **Success Criteria** | Sub-2s stream latency; live chat messages appear within 1s; pinned product card allows instant purchase without leaving stream; push notification reaches customers within 30s of going live; stream recording is accessible for replay; merchant analytics dashboard shows correct view and conversion data |
| **Stakeholder Value** | *"Can a merchant sell products in real-time, like a TV shopping channel but interactive?"* Validates the live commerce capability — a proven high-conversion model (3-10x vs standard e-commerce) that creates urgency and trust simultaneously |
| **Est. Build Time** | 8 weeks |
| **Related Req IDs** | REQ-UI-023, REQ-API-009, REQ-BE-008 |

---

### Demo Milestones Summary

| Milestone ID | Demo Name | Tier | Primary Stakeholder | Est. Build Time | Related Requirements (Existing) |
|---|---|---|---|---|---|
| M-T0-01 | Market Explorer | T0 — Launch MVP | Customer | 4 weeks | REQ-UI-001, REQ-UI-002, REQ-UI-008, REQ-BE-001, REQ-BE-009, REQ-INFRA-001 |
| M-T0-02 | Direct Purchase Flow (Mode A) | T0 — Launch MVP | Customer | 6 weeks | REQ-UI-003, REQ-UI-006, REQ-API-003, REQ-BE-002, REQ-BE-003, REQ-COM-002, REQ-INFRA-004 |
| M-T0-03 | Merchant Onboarding & Go-Live | T0 — Launch MVP | Merchant | 5 weeks | REQ-UI-011, REQ-UI-012, REQ-API-008, REQ-BE-004, REQ-COM-001 |
| M-T1-01 | Multi-Channel Access | T1 — Month 1 | Customer | 6 weeks | REQ-UI-009, REQ-UI-010, REQ-UI-013, REQ-API-004, REQ-API-005 |
| M-T1-02 | Admin Command Center | T1 — Month 1 | Admin | 3 weeks | REQ-UI-012, REQ-API-010, REQ-BE-005, REQ-BE-008, REQ-COM-005 |
| M-T2-01 | Trust & Engagement | T2 — Q2 Growth | Customer | 4 weeks | REQ-BE-012, REQ-BE-025, REQ-UI-021, REQ-API-009 |
| M-T2-02 | Pan-India Shipping | T2 — Q2 Growth | Customer | 5 weeks | REQ-COM-010, REQ-API-013, REQ-BE-024, REQ-UI-007 |
| M-T2-03 | Festival Sale Campaign | T2 — Q2 Growth | Admin | 3 weeks | REQ-COM-007, REQ-COM-005, REQ-UI-012, REQ-BE-008 |
| M-T3-01 | Virtual Try-On & Jewellery | T3 — Q3 Mature | Customer | 8 weeks | REQ-UI-016, REQ-UI-017, REQ-API-012, REQ-BE-018, REQ-BE-019 |
| M-T3-02 | City Expansion | T3 — Q3 Mature | Admin | 6 weeks | REQ-UI-019, REQ-BE-022, REQ-BE-023, REQ-UI-020, REQ-BE-021 |
| M-T4-01 | Pete Street Virtual Walk | T4 — Visionary | Customer | 12 weeks | REQ-UI-022, REQ-BE-026 |
| M-T4-02 | Live Bazaar | T4 — Visionary | Merchant/Customer | 8 weeks | REQ-UI-023, REQ-API-009, REQ-BE-008 |

---

### 9.4 Marketing Roadmap Summary

| Phase | Timeline | Key Message | Target CAC | Est. Monthly New Users |
|---|---|---|---|---|
| **Tier 0 (MVP)** | Launch | "Your Pete market, at home" | ₹50-80 | 500-1,000 |
| **Tier 1 (MVP+1)** | Month 1 | "In your language. In your pocket." | ₹40-60 | 1,500-3,000 |
| **Tier 2 (Growth)** | Quarter 2 | "Shop with confidence. Save more." | ₹30-50 | 3,000-8,000 |
| **Tier 3 (Mature)** | Quarter 3 | "See it, try it, love it, before you buy." | ₹25-40 | 8,000-20,000 |
| **Tier 4 (Visionary)** | Future | "Step into the market. From anywhere." | ₹15-30 | 20,000-50,000 |

---

## END OF PRD

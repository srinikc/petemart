# PeteMart — Product Requirements Document v1.0
**Date:** May 2026 | **Status:** Draft

## 1. Executive Summary
PeteMart is a scalable multi-tenant e-commerce marketplace for 5,000+ wholesale and retail businesses across 14 Bangalore pete market areas. Three portals serve three roles: Customer, Store Owner, and Admin.

## 2. Goals & KPIs
| Goal | KPI | Year-1 Target |
|---|---|---|
| Merchant onboarding | Stores live | 500 |
| Buyer acquisition | Registered customers | 50,000 |
| GMV | Gross merchandise value | ₹10 Cr/month |
| Platform revenue | MRR | ₹1.5 Cr/month |
| Merchant retention | Monthly churn | <10% |

## 3. User Roles
- **Customer** — retail/wholesale buyer: browse, buy, track, review
- **Store Owner** — merchant: catalog, inventory, orders, reels, social, analytics
- **Admin** — PeteMart ops: onboarding, billing, moderation, platform analytics

## 4. Customer Portal — User Flow
### 4.1 Onboarding
- Landing page: hero search, area selector, featured stores, reel feed, trending categories
- Auth: mobile OTP, Google OAuth, email+password
- Profile: name, delivery addresses, category preferences

### 4.2 Browse & Search
- Typeahead search: product, store, category, area
- Filters: area, category, price, rating, stock status, wholesale/retail toggle
- Category & store pages: grid/list, sort by price/rating/new/popular
- Product detail: images, reel/video, description, retail+wholesale pricing, stock, seller info, reviews

### 4.3 Cart & Checkout
- Multi-store cart, quantity edit, price breakdown
- Address: saved/new/GPS autofill
- Payment: UPI, cards, wallets, net banking, COD (Razorpay)
- GST-inclusive order summary, coupon apply

### 4.4 Post-Order
- WhatsApp + SMS order confirmation
- Real-time tracking: placed → confirmed → packed → shipped → delivered
- Return/refund: reason + photo upload
- Rating & review after delivery
- One-tap reorder

### 4.5 Account
- Order history, wishlist, saved stores, loyalty points
- Notification preferences, support ticket

## 5. Store Owner Portal — User Flow
### 5.1 Onboarding
- Register: business name, owner, mobile, email, area, category
- KYC: Aadhaar/GSTIN/shop license upload
- Store setup: logo, banner, tagline, WhatsApp, Instagram, YouTube, Facebook links
- Subscription: Starter / Growth / Premium via Razorpay auto-billing

### 5.2 Catalog Management
- Add/edit product: name, description, images (10 max), reel/video, category, tags
- Pricing: retail price, wholesale price, MOQ, GST %
- Variants: size, color, weight, packaging
- Bulk import: CSV/Excel
- Statuses: active, draft, out-of-stock, archived

### 5.3 Inventory Management
- Stock per SKU/variant, low-stock alerts (configurable threshold)
- Adjustment log: restock, damage, return
- Dashboard: total SKUs, stock value, low-stock list, dead-stock list

### 5.4 Order Management
- New orders queue: accept/reject (configurable auto-accept)
- Order detail: buyer, items, address, payment status, delivery mode
- Status updates: confirmed → packed → dispatched → delivered
- PDF invoice + packing slip, bulk actions
- Returns: approve/reject, trigger refund

### 5.5 Social & Content (Reels)
- Upload reel: video, tag products, caption, schedule
- Social links: Instagram, YouTube, Facebook, WhatsApp Business
- Content calendar for scheduled posts
- WhatsApp catalog sync (v2)

### 5.6 Promotions & Campaigns
- Discounts: % off, flat off, BOGO, free shipping
- Coupon codes with validity + usage limits
- Sponsored listings (CPC) on marketplace
- Flash sales with countdown
- Loyalty cashback points config

### 5.7 Analytics & Projections
- KPIs: sales, orders, AOV, conversion, top SKUs, repeat buyers
- Charts: daily/weekly/monthly trends
- Product performance: views → cart → orders → revenue per SKU
- Customer insights: new vs repeat, top buyers, geography
- Revenue projection: 30/60/90-day forecast
- Export: CSV/PDF

### 5.8 Payouts
- T+2 or weekly settlement, order-wise breakdown, platform fee deducted
- Bank account management, GST invoice from PeteMart

## 6. Admin Portal — User Flow
### 6.1 Merchant Management
- Onboarding queue, approval/rejection, store directory (filter by area/plan/status)
- Manual suspend/reinstate, bulk merchant communications

### 6.2 Customer Management
- Directory, flag/block abusive accounts, escalated support resolution

### 6.3 Catalog Moderation
- Flagged product review queue, approve/reject, edit taxonomy

### 6.4 Order & Dispute Management
- Cross-store order view, buyer-seller dispute resolution, fraud alerts

### 6.5 Billing & Subscriptions
- Subscription status per merchant, MRR/ARR/churn dashboard, invoice management

### 6.6 Platform Analytics
- GMV, orders, revenue; top stores/categories/areas; customer acquisition; uptime

### 6.7 Content & Promotions
- Homepage banners, featured store slots, platform-wide sale events, push campaigns

## 7. Key Integrations
| Integration | Purpose | Provider |
|---|---|---|
| Payment Gateway | UPI, cards, wallets, EMI | Razorpay |
| WhatsApp Business | Order alerts, catalog | Meta / Interakt |
| SMS/OTP | Auth, notifications | MSG91 / Twilio |
| Email | Transactional, marketing | SendGrid / AWS SES |
| Shipping | Courier integrations | Shiprocket / Dunzo |
| Social Media | Reel/post links | Instagram Graph API |
| Maps | Store locator, address autofill | Google Maps API |
| Search | Product & store search | Algolia / Elasticsearch |
| Storage | Images, videos, invoices | AWS S3 + CloudFront |
| Analytics | Behaviour tracking | Mixpanel / Amplitude |

## 8. Core Data Model
| Entity | Key Fields |
|---|---|
| User | id, role, name, mobile, email, auth_provider |
| Store | id, owner_id, name, slug, area, plan, logo, banner, social_handles, status |
| Product | id, store_id, name, images, reel_url, category, price_retail, price_wholesale, moq, stock |
| Order | id, customer_id, store_id, items[], status, total, payment_id, address |
| Inventory | id, product_id, variant_id, stock_qty, alert_threshold |
| Payment | id, order_id, gateway, amount, status, settled_at |
| Subscription | id, store_id, plan, billing_cycle, next_due, status |
| Reel | id, store_id, video_url, caption, tagged_products[], scheduled_at |
| Promotion | id, store_id, type, value, code, valid_from, valid_to |

## 9. Tech Stack
| Layer | Technology |
|---|---|
| Web Frontend | React 18 + Next.js 14 |
| Mobile App | React Native (iOS + Android) |
| Backend API | Node.js + NestJS |
| Database | PostgreSQL + Redis |
| Search | Algolia / Elasticsearch |
| Storage | AWS S3 + CloudFront |
| Payments | Razorpay |
| Auth | JWT + OTP + Google OAuth |
| Notifications | FCM + Twilio + SendGrid |
| Infrastructure | AWS ECS/Fargate, Auto-scaling |
| CI/CD | GitHub Actions + Docker |
| Monitoring | Sentry + Datadog |

## 10. Monetization
| Revenue Stream | Model | Rate |
|---|---|---|
| Starter Subscription | Monthly SaaS | ₹2,999–₹4,999/mo |
| Growth Subscription | Monthly SaaS | ₹7,500–₹12,500/mo |
| Premium Subscription | Monthly SaaS | ₹20,000+/mo |
| Transaction Commission | % of GMV | 1.5–4% |
| Onboarding Fee | One-time | ₹1,999–₹4,999 |
| Catalog Digitization | Per product | ₹5–₹15/product |
| Reel Creation Service | Per reel | ₹500–₹2,000 |
| Sponsored Listings | CPC/Monthly | ₹500–₹5,000/mo |
| Homepage Banner Ads | Monthly slot | ₹2,000–₹10,000/mo |
| Premium Analytics Add-on | Monthly | ₹1,500/mo |

## 11. Phased Rollout
| Phase | Timeline | Scope |
|---|---|---|
| MVP v1 | Month 1–3 | 50 stores, 5 categories, web, Chickpet/RT Street |
| v1.5 | Month 4–5 | All 14 areas, reels, social handles, 15 categories |
| v2.0 | Month 6–8 | Mobile apps, promotions engine, advanced analytics |
| v2.5 | Month 9–12 | AI recommendations, WhatsApp commerce, B2B flows |
| v3.0 | Year 2 | Multi-city expansion |

## 12. Non-Functional Requirements
| Requirement | Target |
|---|---|
| Uptime | 99.9% SLA |
| Page load (LCP) | <2.5s |
| API P95 response | <200ms |
| Concurrent users | 10,000+ |
| Security | HTTPS, PCI-DSS, India DPDP Act |
| Accessibility | WCAG 2.1 AA |

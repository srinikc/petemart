# PeteMart POC — Launch Guide

> **Agent 04: Prototype / POC Agent**
> Zero-cost functional Proof of Concept for the PeteMart hyper-local e-commerce platform.
> 9 pilot storefronts × 3 interaction modes = 27 unique shopping experiences.

---

## 📋 Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | ≥ 18.17.0 | LTS recommended |
| npm | ≥ 9.x | Ships with Node.js |
| Git | Any | For cloning |
| Web Browser | Modern | Chrome/Firefox/Edge |

**No paid services required.** Everything runs on:
- **Vercel Hobby** (free) for deployment — or local dev
- **Zero external API costs** — WhatsApp uses `wa.me` links (free), Maps uses Google Maps URLs (no API key needed for links)
- **Supabase Free** — prepared schema but not required for POC runtime (all data is static TypeScript)

---

## 🚀 Quick Start (5 minutes)

### 1. Navigate to POC directory

```bash
cd agents/02_engineering_specs/04_prototype_agent/petemart-poc
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run development server

```bash
npm run dev
```

### 4. Open in browser

Visit: **http://localhost:3000**

You should see the PeteMart landing page with the hero section "Bringing Old Bangalore's Pete Markets to Your Doorstep."

---

## 🗺️ POC Site Map

```
/                            ← Landing page (hero, market explorer, merchant grid, featured products)
/shop/{slug}                 ← Merchant microsite (products grid + 3 mode buttons per product)
/product/{id}                ← Product detail page (full 3-mode actions)
/cart                        ← Multi-store shopping cart
/checkout                    ← Checkout flow (address → payment → confirm)
/orders                      ← Order history
/tracking/{id}               ← Order tracking with timeline
/merchant/dashboard          ← Merchant dashboard (per-store)
/merchant/products           ← Merchant product inventory table
/merchant/orders             ← Merchant order management
/admin                       ← Admin console (overview, merchants, orders, analytics)
/api/v1/merchants            ← API: list/filter merchants
/api/v1/products             ← API: list/filter/search products
/api/v1/orders               ← API: create/list orders
```

---

## 🧪 How to Test All 3 Interaction Modes

### Mode A: Direct Purchase (🛒 Buy Now)

1. Go to any merchant microsite (`/shop/tarun-enterprises`)
2. Click **"Buy Now"** on any product card
3. The product is added to cart; click **Cart** in the header
4. Review multi-store cart, adjust quantities
5. Click **"Proceed to Checkout"**
6. Fill delivery address → Continue → Select payment → Review → **Place Order**
7. View order confirmation with tracking ID

### Mode B: WhatsApp Enquiry (💬 Enquire on WhatsApp)

1. Go to any merchant microsite
2. Click **"Enquire on WhatsApp"** on any product card
3. A new tab opens with `wa.me` link pre-populated:
   > `I'm interested in {product_name} from PeteMart — {merchant_name}`
4. Send the message to start a conversation with the merchant

### Mode C: Visit Store (📍 Visit Store)

1. Go to any merchant microsite
2. Click **"Visit Store — Get Directions"**
3. Google Maps opens with directions to the merchant's location in Chickpet/Balepet

---

## 🧩 Pilot Merchants (9 Storefronts)

| # | Store ID | Name | Market | Category | Products |
|---|----------|------|--------|----------|----------|
| 1 | STORE-TARUN-001 | Tarun Enterprises | Chickpet | Textiles & Apparel | 34 |
| 2 | STORE-SRI-002 | Sri Vari Traders | Balepet | Outdoor Clothing & Equipment | 18 |
| 3 | STORE-SAMSKRUTI1-003 | Samskruti Silks - Store 1 | Chickpet | Silk Sarees | 34 |
| 4 | STORE-SAMSKRUTI2-004 | Samskruti Silks - Branch | Chickpet | Silk Sarees | 28 |
| 5 | STORE-FLOWERS-005 | flowers2u | Balepet | Florist & Fresh Flowers | 35 |
| 6 | STORE-PASTRY-006 | The Pastry Cafe | Balepet | Bakery & Cafe | 60 |
| 7 | STORE-VINAYAKA-007 | Sri Vinayaka Textorium | Balepet | Textiles & Apparel | 24 |
| 8 | STORE-SANJANA-008 | Sanjana Apparels (India) | Balepet | Apparel & Clothing | 20 |
| 9 | STORE-MADHUMATHI-009 | Madhumathi All-men's Ethnic | Balepet | Men's Ethnic Wear | 20 |
| | | **Total** | | | **273** |

---

## 📊 Merchant Digital Readiness (Conversion Potential)

The POC tags each merchant with a `digital_maturity_score` (1-5) that reflects their existing online footprint:

| Score | Meaning | Merchants |
|-------|---------|-----------|
| 5 | Full digital presence (website + Instagram + WhatsApp Business) | — |
| 4 | Strong digital presence | — |
| 3 | Moderate (has website or Instagram) | The Pastry Cafe |
| 2 | Minimal digital footprint | Samskruti Silks (both), Sanjana Apparels |
| 1 | No digital presence | Tarun Enterprises, Sri Vari Traders, flowers2u, Sri Vinayaka Textorium, Madhumathi All-men's Ethnic |

**Insight**: 5/9 merchants (56%) have maturity score 1 — full digital onboarding potential.
The Pastry Cafe (score 3) is the most digitally ready with existing website + Instagram.

---

## 💻 Tech Stack (Zero Cost)

| Component | Technology | Cost |
|-----------|-----------|------|
| Framework | Next.js 15 (App Router) | Free |
| Language | TypeScript | Free |
| Styling | Tailwind CSS | Free |
| UI Icons | Emoji + SVG | Free |
| Deployment | Vercel Hobby `*.vercel.app` | Free |
| Database | Supabase Free `*.supabase.co` | $0 (schema ready, not required for runtime) |
| WhatsApp | `wa.me` deep links | Free (no API key) |
| Maps | Google Maps URL links | Free (no API key) |
| Payment | Cash on Delivery + simulated Razorpay | Free (test mode) |
| AI Features | DeepSeek (via Opencode) | Free during POC |
| Version Control | GitHub | Free |

---

## 🔐 Zero-Cost Verification Checklist

- [ ] No custom domains used — only `localhost:3000` for dev
- [ ] No paid API keys required in `.env.local`
- [ ] WhatsApp links use `wa.me` protocol (no WhatsApp Business API cost)
- [ ] Maps links use `maps.google.com` URLs (no Google Maps API cost)
- [ ] All merchants, products, and orders are synthetic/client-side
- [ ] No database connection required for basic functionality
- [ ] All 3 interaction modes work without external service dependencies
- [ ] Digital readiness data helps gauge merchant conversion potential

---

## 🧪 Verification Script

```bash
# From the petemart-poc directory:

# 1. Install
npm install

# 2. Type check
npx tsc --noEmit

# 3. Lint
npm run lint

# 4. Build (production)
npm run build

# 5. Start production server
npm start
# Visit http://localhost:3000
```

Expected output from `npm run build`:
```
✓ Compiled successfully
✓ Linting and checking passed
✓ Ready in XXXXms
```

---

## 🚢 Deploy to Vercel (Free)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy from petemart-poc directory
vercel --prod

# 3. Your POC will be live at:
# https://petemart-poc.vercel.app
```

No custom domain needed — the `*.vercel.app` subdomain is free.

---

## 📁 File Structure

```
04_prototype_agent/
├── data/
│   ├── merchants.json              ← 9 merchant profiles with digital_readiness
│   ├── products-tarun.json         ← Tarun Enterprises (34 products)
│   ├── products-srivari.json       ← Sri Vari Traders (18)
│   ├── products-samskruti1.json    ← Samskruti Silks Store 1 (34)
│   ├── products-samskruti2.json    ← Samskruti Silks Branch (28)
│   ├── products-flowers.json       ← flowers2u (35)
│   ├── products-pastry.json        ← The Pastry Cafe (60)
│   ├── products-vinayaka.json      ← Sri Vinayaka Textorium (24)
│   ├── products-sanjana.json       ← Sanjana Apparels (20)
│   ├── products-madhumathi.json    ← Madhumathi All-men's Ethnic (20)
│   └── products-combined.json      ← All 273 products combined
├── LAUNCH_GUIDE.md                 ← This file
└── petemart-poc/
    ├── app/                        ← Next.js 15 App Router
    │   ├── page.tsx                ← Landing page
    │   ├── layout.tsx              ← Root layout (header/footer)
    │   ├── globals.css             ← Design system
    │   ├── shop/[slug]/page.tsx    ← Merchant microsite
    │   ├── product/[id]/page.tsx   ← Product detail
    │   ├── cart/page.tsx           ← Shopping cart
    │   ├── checkout/page.tsx       ← Checkout flow
    │   ├── orders/page.tsx         ← Order history
    │   ├── tracking/[id]/page.tsx  ← Order tracking
    │   ├── merchant/               ← Merchant dashboard (3 pages)
    │   ├── admin/page.tsx          ← Admin console
    │   └── api/v1/                 ← REST API routes
    ├── lib/
    │   └── data/
    │       ├── merchants.ts        ← Merchant types + data + helpers
    │       └── products.ts         ← Product types + all 273 products
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── next.config.js
    └── postcss.config.js
```

---

## ✅ Quality Guardrail Verification

| Guardrail | Status | How to Verify |
|-----------|--------|--------------|
| All 9 merchant storefronts render | ✅ | Visit `/shop/tarun-enterprises` through `/shop/madhumathi-all-mens-ethnic` |
| All 273 products display | ✅ | Check each merchant microsite product count matches expected |
| Mode A: Direct Purchase works | ✅ | Add product → Cart → Checkout → Place Order |
| Mode B: WhatsApp Enquiry opens | ✅ | Click WhatsApp button → `wa.me` opens with pre-filled message |
| Mode C: Visit Store opens maps | ✅ | Click Visit Store → Google Maps opens with directions |
| Multi-store cart works | ✅ | Add items from different merchants → cart groups by store |
| Digital readiness field exists | ✅ | Check merchant dashboard or admin → Digital Readiness Matrix |
| Zero cost (no paid services) | ✅ | No API keys, no custom domains, no paid tiers |
| Synthetic data is well-formed | ✅ | All JSON arrays have valid structure |
| Build compiles without errors | ✅ | Run `npm run build` |

---

## ✋ Halt Point

**This POC is complete and ready for Human-In-The-Loop review.**

Please review:
1. Open `http://localhost:3000` and navigate all 9 storefronts
2. Test all 3 interaction modes on each storefront
3. Verify the admin console > Digital Readiness Matrix
4. Check that the WhatsApp pre-filled message includes the product name and merchant name
5. Confirm multi-store cart groups items by merchant
6. Verify zero-cost compliance (no paid service dependencies)

**Next steps after approval:**
- Agent 5 (Program Mgmt): Agile sprint planning for full product build
- Agent 6 (DevOps): CI/CD pipeline and production infrastructure
- Agents 7a-7d: Full UI, API, Backend, and Integration implementation

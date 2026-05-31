# PeteMart — Release Notes v1.0.0-poc

**Release Date**: 2026-05-30  
**Build**: `petemart-unified v1.0.0-poc`  
**Phase**: POC Pilot (8 merchants)  

---

## What's Included

PeteMart is a hyper-local e-commerce platform connecting traditional Bangalore markets (Chickpet, Balepet, Mamulpet, Tharagpet, Cubbonpet, Avenue Road, Raja Market) to digital commerce. This POC release targets 8 pilot merchants in the Balepet and Chickpet areas.

### Customer Experience
| Feature | Description |
|---------|-------------|
| 🏬 **Market Browsing** | Explore 5 markets with detailed descriptions and specialization info |
| 🏪 **Merchant Storefronts** | View 9 merchants with their products, ratings, and business hours |
| 🛍️ **Product Catalog** | 13 products across 6 categories with images, prices, and descriptions |
| 🔍 **Product Search** | Search products by name, filter by category |
| 🛒 **Shopping Cart** | Add/remove products, adjust quantities, in-memory persistence |
| 💳 **Checkout** | Review order, select delivery address, choose payment method |
| 📋 **Order Management** | View order history, track order status |
| 🔐 **Phone OTP Auth** | Simple phone-based authentication with role-based redirects |
| 📱 **Responsive Design** | Works on desktop and mobile browsers |
| 💬 **WhatsApp Enquiry** | Direct WhatsApp links for merchant communication |

### Merchant Portal
| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Overview of store performance, recent orders |
| 📦 **Product Management** | Add/edit products, manage inventory |
| 📋 **Order Management** | View incoming orders, update order status |
| 📈 **Analytics** | Sales trends and product performance |
| 🔗 **QR Code Generator** | Generate QR codes linking to storefront |
| ⚙️ **Settings** | Store profile and business hours configuration |

### Admin Portal
| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Platform-wide KPIs (total merchants, orders, revenue) |
| 🏪 **Merchant Management** | View/approve/pending merchants |
| 📋 **Order Oversight** | View all orders across the platform |
| 📈 **Analytics** | Platform growth metrics and trends |
| ⚙️ **Configuration** | Platform settings and parameters |

### Technical Features
| Feature | Description |
|---------|-------------|
| ⚡ **Next.js 15.5 App Router** | Modern React framework with server components |
| 🎨 **Tailwind CSS v3** | Utility-first responsive design system |
| 🔧 **TypeScript** | Full type safety across the entire codebase |
| 🧪 **64 Automated Tests** | Unit + API integration test suite |
| 🔒 **Security Headers** | CORS, HSTS, XSS protection, rate limiting |
| 🗄️ **Supabase Integration** | PostgreSQL schema with RLS policies ready |
| 📱 **Mobile Responsive** | Adaptive layout for all screen sizes |
| 🌐 **i18n Ready** | Localization framework with English strings |

---

## POC Pilot Merchants

| # | Merchant | Market | Category | Status |
|---|----------|--------|----------|--------|
| 1 | Samskruti Silks | Chickpet | Silk Sarees | ✅ Active |
| 2 | Samskruti Silks (Branch) | Chickpet | Silk Sarees | ✅ Active |
| 3 | The Pastry Cafe | Balepet | Bakery & Cafe | ✅ Active |
| 4 | flowers2u | Balepet | Florist | ✅ Active |
| 5 | Tarun Enterprises | Chickpet | Textiles Wholesale | ✅ Active |
| 6 | Sri Vinayaka Textorium | Balepet | Textiles & Fabrics | ✅ Active |
| 7 | Sanjana Apparels (India) | Balepet | Apparel | ✅ Active |
| 8 | Madhumathi All-men's Ethnic | Balepet | Men's Ethnic Wear | ⏳ Pending |
| 9 | Sri Vari Traders | Balepet | Outdoor Equipment | ⏳ Pending |

---

## Supported Markets

| Market | Specialization | Merchants |
|--------|---------------|-----------|
| Chickpet | Textiles, Silk, Sarees | 118 |
| Balepet | Household, Florists, Bakery, Textiles | 85 |
| Raja Market | Jewellery, Gold, Silver, Crafts | 62 |
| Mamulpet | Wholesale, Spices, Dry Fruits | 94 |
| Cubbonpet | Electronics, Hardware, Tools | 73 |

---

## System Requirements

| Requirement | Minimum |
|-------------|---------|
| **Node.js** | 18.0+ (24.x recommended) |
| **npm** | 9.0+ |
| **Browser** | Chrome 90+, Firefox 88+, Safari 14+ |
| **Storage** | 500 MB disk space |
| **Memory** | 4 GB RAM (development) |

---

## Installation & Quick Start

```bash
# Clone and navigate
cd petemart-agentic-framework/agents/03_execution_workspace/07d_integration_agent/petemart-unified

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local

# Start development server
npm run dev
# Opens at http://localhost:3000 (or port 3458 if configured)
```

---

## Known Limitations (See `04_KNOWN_LIMITATIONS.md` for full details)

- In-memory data storage (cart/checkout lost on restart)
- Mock JWT authentication (not real Supabase Auth)
- No payment gateway integration (COD/WhatsApp only)
- No visual regression testing
- No automated load testing
- Single-server deployment (no horizontal scaling)

---

## Bugs Fixed in This Release

| ID | Issue | Severity |
|----|-------|----------|
| DEF-001 | Next.js 15 async route params (4 routes) | Medium |
| DEF-002 | Product image URL type mismatch | Medium |
| DEF-003 | Cart/checkout state isolation (separate maps) | Medium |
| DEF-004 | OrderStatus missing `in_transit` and `completed` | Medium |

## Known Issues in This Release

- **API Test TC-API-19**: Sequential cart-to-checkout test in test harness has auth token propagation issue. Manual E2E flow works correctly.
- **Server restart**: In-memory cart and order data is lost on server restart. Migrate to Supabase-backed persistence for production.

---

## Architecture Overview

```
┌────────────────────────────────────────────┐
│           Next.js 15 App Router            │
│                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Customer │  │ Merchant │  │  Admin   │ │
│  │  Portal  │  │  Portal  │  │  Portal  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │              │             │       │
│  ┌────┴──────────────┴─────────────┴────┐  │
│  │         API Routes (21 routes)        │  │
│  │  Auth │ Markets │ Products │ Cart    │  │
│  │  Orders │ Tracking │ Admin │ Merchant │  │
│  └────────────────┬─────────────────────┘  │
│                   │                        │
│  ┌────────────────┴─────────────────────┐  │
│  │     Supabase DB (PostgreSQL)         │  │
│  │  8 Tables | 22 RLS Policies          │  │
│  │  13 Indexes | 3 Migration Files      │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

---

## Rollback Procedure

```bash
# For Vercel deployment:
vercel rollback --scope petemart --prod

# For local deployment:
git checkout <previous-tag>
npm install
npm run build
npm start
```

---

## Support Contacts

| Role | Contact |
|------|---------|
| **Technical Issues** | DevOps Agent (Agent 06) |
| **QA Concerns** | QA Agent (Agent 08) |
| **Product Questions** | Program Manager (Agent 05) |
| **Deployment Issues** | Production Agent (Agent 09) |

---

*Prepared by Agent 09 — Production Release Coordinator*  
*Framework: petemart-agentic-framework*  
*© 2026 PeteMart — All Rights Reserved*

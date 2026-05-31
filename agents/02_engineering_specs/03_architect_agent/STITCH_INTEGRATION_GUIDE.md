# Google Stitch Integration Guide — PeteMart UI Generation Pipeline

**Document for:** Agent 07a (UI Agent) | **Version:** 1.0 | **Date:** 2026-05-30

---

## 1. Overview

Google Stitch (`stitch.withgoogle.com`) is designated as the **PRIMARY UI design and prototyping tool** for PeteMart. The UI Agent (07a) uses the MCP SDK (`@google/stitch-sdk`) to programmatically generate all merchant-facing and admin-facing screens.

### SDK Installation
```bash
npm install @google/stitch-sdk
```

### Authentication
```typescript
import { Stitch } from '@google/stitch-sdk';

const stitch = new Stitch({
  apiKey: process.env.STITCH_API_KEY,
  project: 'petemart-poc'
});
```

---

## 2. Stitch API Methods

### 2.1 `stitch.design()` — Design System Generation

Generates a complete design system from natural language description:

```typescript
const designSystem = await stitch.design({
  prompt: `PeteMart design system for a hyperlocal Indian e-commerce marketplace.
    Colors: Indian Gold (#C8A45C), Deep Burgundy (#6B1D3A), Cream (#FFF8EE)
    Typography: Inter font family, 4px base grid system
    Mode indicators: Green (#2E7D32) for Buy Now, WhatsApp Green (#25D366) for Enquire,
    Blue (#1976D2) for Visit Store
    Theme: Warm, traditional Indian aesthetic with modern UX patterns`,
  tokens: ['colors', 'typography', 'spacing', 'breakpoints']
});

// Output: DESIGN.md, Tailwind config, CSS variables
```

### 2.2 `stitch.generate()` — Screen Component Generation

Generates React/HTML components from natural language prompts:

```typescript
const landingPage = await stitch.generate({
  prompt: `PeteMart landing page with:
    - Header: logo, city selector dropdown (Bangalore), search bar, login button
    - Hero section: "Pete Tapestry" interactive carousel showing Chickpet, Balepet, 
      Raja Market with historical descriptions
    - "Shop by Market" grid: card-based market listings with specialization badges
    - "Featured Merchants" horizontal scroll section
    - Footer with links, social media, QR code download
    Mobile-responsive, Kannada/Hindi/English language toggle placeholder`,
  format: 'react-tsx',
  screens: ['mobile', 'tablet', 'desktop'],
  theme: 'petemart-design-system' // Reference to design() output
});

// Output: LandingPage.tsx, LandingPage.png (screenshot), DESIGN.md snippet
```

### 2.3 `stitch.export()` — Full Export

```typescript
const exportResult = await stitch.export({
  screens: [landingPage.id, merchantMicrosite.id, cartPage.id, checkoutPage.id],
  formats: ['react-tsx', 'html-css', 'design-tokens', 'screenshots'],
  accessibilityReport: true
});

// Output:
// - /stitch-exports/components/*.tsx  (React components)
// - /stitch-exports/design/DESIGN.md  (Design tokens)
// - /stitch-exports/screenshots/*.png (Visual review)
// - /stitch-exports/accessibility.json (A11y audit)
```

### 2.4 `stitch.prototype()` — Interactive Prototype

```typescript
const prototype = await stitch.prototype({
  name: 'PeteMart Customer Flow',
  screens: [
    { id: landingPage.id, name: 'Landing' },
    { id: merchantMicrosite.id, name: 'Merchant Store' },
    { id: productDetail.id, name: 'Product Detail' },
    { id: cartPage.id, name: 'Cart' },
    { id: checkoutPage.id, name: 'Checkout' },
    { id: orderConfirmation.id, name: 'Order Confirmation' },
    { id: orderTracking.id, name: 'Tracking' }
  ],
  links: [
    { from: 'Landing', action: 'click merchant', to: 'Merchant Store' },
    { from: 'Merchant Store', action: 'click product', to: 'Product Detail' },
    { from: 'Product Detail', action: 'click add to cart', to: 'Cart' },
    { from: 'Cart', action: 'click checkout', to: 'Checkout' },
    { from: 'Checkout', action: 'click pay', to: 'Order Confirmation' },
    { from: 'Order Confirmation', action: 'click track', to: 'Tracking' }
  ]
});

// Output: Interactive prototype URL for stakeholder review
```

---

## 3. Screen Generation Prompts (POC — 18 Screens)

### POC Screens — Prompt Library

| # | Screen | Stitch Prompt |
|---|---|---|
| 1 | **Customer Landing Page** | "PeteMart landing page: header with logo 'PeteMart' in Indian Gold (#C8A45C), city selector (Bangalore), search bar with placeholder 'Search products across 8 Pete stores...', login/register button. Hero: 'Pete Tapestry' carousel with slides for Chickpet (textiles), Balepet (household), showing market name, historical fact, and 'Explore' CTA. Below: 'Shop by Market' grid with 2 market cards. Section: 'Featured Merchants Today' horizontal scroll with store cards showing name, category badge, mode indicators. Footer with tagline 'Bringing Old Bangalore's Pete Markets to Your Doorstep.' Responsive: mobile-first, tablet 2-col, desktop 3-col." |
| 2 | **Market Explorer** | "PeteMart market explorer for Chickpet market: header with market name 'Chickpet - The Textile Heart of Bangalore', description blurb about 118 textile wholesalers. Sort: Relevance, Rating, Distance. Filter sidebar: Category (Silk, Cotton, Bridal), Price Range, Mode Available. Merchant cards with store image, name, distance from center, category, rating stars, and mode badges (Buy Now / Enquire on WhatsApp / Visit Store). Pagination at bottom." |
| 3 | **Merchant Store Microsite** | "PeteMart merchant store page for 'Samskruti Silks': header with store name, logo, banner image showing saree collection. Info bar: rating (4.8★), years in business (18), location (Chickpet Main Road), distance (2.3 km). Tabs: Products, About, Reviews. Product grid with cards showing: product image, name, price (₹1,200-₹45,000), mode badge (Buy Now / Enquire on WhatsApp / Visit Store color-coded), MOQ badge if applicable. Floating 'Enquire on WhatsApp' button. Footer: QR code, share button, operating hours." |
| 4 | **Product Detail Page** | "PeteMart product detail for a Kanjivaram Silk Saree: hero image gallery (thumbnails below), zoom on hover. Product info: name 'Kanjivaram Silk Saree - Gold Zari', price '₹32,500', MRP strikethrough, you save ₹2,500. Variant selector: Color (Red/Green/Blue), Size (Free). Trust badges: BIS Hallmark, Pure Silk, 18yr Store. Mode buttons: 'Buy Now' (green), 'Enquire on WhatsApp' (WhatsApp green), 'Visit Store' (blue). Delivery info: 'Ships within PeteMart zone 2 (3-7 km) | Est. delivery 2-4 hours'. Fabric description, care instructions. Accordion: Reviews (4.7★, 23 ratings)." |
| 5 | **Shopping Cart** | "PeteMart shopping cart with items from 2 merchants. Header: 'My Cart (4 items)'. Grouped by merchant: 'Samskruti Silks - Chickpet' (2 items) and 'The Pastry Cafe - Balepet' (2 items). Each item: image thumbnail, name, quantity +/- selector, unit price, total. Merchant subtotal shown. Delivery section: 'Your delivery zone: Zone 2 (3-7 km) | Base delivery: ₹70 | +1 extra store surcharge: ₹25 | Total delivery: ₹95'. Order total: subtotal + delivery. Promo code input. 'Proceed to Checkout' button. 'Continue Shopping' link." |
| 6 | **Checkout Page** | "PeteMart checkout page. Address section: saved addresses dropdown, 'Add New Address' form (name, phone, pincode, address line, city, state). Order summary: items grouped by merchant, prices, delivery fee breakdown. Payment section: 'Secure payment via Razorpay' badge. Payment methods: UPI (QR code), Credit/Debit Card, Net Banking, Wallet. 'Place Order' button with total amount. Note: 'Your payment is held securely until delivery confirmation'." |
| 7 | **Order Confirmation** | "PeteMart order confirmation page. Large checkmark animation. 'Order Placed Successfully!' Order ID: PM-20260530-001. Estimated delivery: 'Today, 4:30-6:30 PM'. Items summary (collapsible). 'Track Order' button (primary CTA). 'Continue Shopping' link. Share on WhatsApp button. Tip: 'Keep your phone handy - we'll send live delivery updates!'" |
| 8 | **Order Tracking** | "PeteMart order tracking page. Order ID: PM-20260530-001. Status: 'Out for Delivery'. Visual timeline: ✅ Order Confirmed → ✅ Picked Up → ✅ Consolidated → 🔄 In Transit → ⬜ Delivered. Live tracking: address on mini-map (placeholder map). Current courier location indicator. ETA: 'Arriving in ~30 mins'. Courier info: name, vehicle, photo. Delivery instructions input. 'Call Courier' button. 'Mark as Received' button." |
| 9 | **Merchant Dashboard** | "PeteMart merchant dashboard for store owner. Sidebar: Dashboard, Orders, Products, Analytics, Settings. Main: KPI cards (Today's Orders: 12, Revenue Today: ₹34,500, Pending: 3, Enquiries: 8). Recent orders table: Order ID, Customer, Items, Total, Status, Actions (View, Update Status). 'New Order Alert' banner with sound. Quick actions: 'Add Product', 'Update Hours', 'Print QR Code'." |
| 10 | **Admin Console** | "PeteMart admin console. Sidebar: Dashboard, Merchants, Orders, Revenue, Config, Users. Main: Overview KPI cards (Total Merchants: 9, Active: 7, Pending Approval: 2, Revenue MTD: ₹1,85,000). Merchant approval queue: merchant name, registration date, documents status, 'Approve' / 'Reject' buttons. Recent orders monitoring table with real-time status badges. Revenue chart: daily/weekly/monthly toggle." |
| 11 | **Merchant Onboarding Wizard** | "PeteMart merchant onboarding wizard - Step 1 of 4. Header: 'Welcome! Set up your digital store in 5 minutes'. Progress bar (5 steps). Step 1: Phone verification - country code dropdown (+91), phone number input, 'Send OTP' button. Clean design with helper text: 'We'll send a one-time password to your WhatsApp number'. Brand logo and 'Secure' badge visible." |
| 12 | **Merchant Product Management** | "PeteMart product management page for merchant. Header: 'Your Products (24)'. Search bar with 'Filter by status: Active/Draft/Out of Stock'. Product table: Image, Name, SKU, Price, Stock, Status toggle (Active/Draft), Actions (Edit, Delete). 'Add Product' button. Pagination. Bulk actions: 'Export CSV', 'Bulk Upload'. Inline stock warning for items < 5." |
| 13 | **Multi-Store Checkout (Breakdown)** | "PeteMart checkout showing consolidated multi-store breakdown. Split view: Left - 'Your Items from 3 Stores'. Each store card: store name, items with prices, store subtotal. Right - 'Delivery Summary': Base fee (Zone 2: ₹70), Extra stores (2 × ₹25), Weight surcharge (₹10). Total delivery: ₹130. Grand total below. 'Place Order for ₹X,XXX' button at bottom. Trust message: 'All items delivered together in one package'." |
| 14 | **PWA Install Prompt** | "PeteMart install prompt overlay: 'Get the best experience with PeteMart app'. Phone mockup showing app features. 'Install App' button (prominent), 'Maybe Later' link. Bottom sheet design. Features list: Live tracking, Faster checkout, Offline browsing, Push notifications." |
| 15 | **Review & Rating** | "PeteMart review popup: 'How was your experience with Samskruti Silks?' Star rating (5 stars interactive). Product rating + Merchant rating (separate). Text input: 'Tell us about your experience...' (150 char limit). Photo upload button (up to 3). 'Submit Review' button. Verified Purchase badge shown. Thank you message on submit." |

---

## 4. DESIGN.md Output Example

When Stitch generates screens, it outputs a `DESIGN.md` file with structured design tokens. Here's what the Integration Agent (07d) will receive:

```markdown
# PeteMart Design System — AUTO-GENERATED by Google Stitch

## Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| --pm-primary | #C8A45C | Primary brand color, buttons, links |
| --pm-primary-dark | #A8893A | Hover states |
| --pm-secondary | #6B1D3A | Headers, accents |
| --pm-background | #FFF8EE | Page backgrounds |
| --pm-surface | #FFFFFF | Cards, modals |
| --pm-text | #2D2D2D | Body text |
| --pm-text-secondary | #666666 | Secondary text |
| --pm-mode-a | #2E7D32 | Mode A (Buy Now) badge |
| --pm-mode-b | #25D366 | Mode B (WhatsApp) badge |
| --pm-mode-c | #1976D2 | Mode C (Visit Store) badge |
| --pm-success | #4CAF50 | Success states |
| --pm-warning | #FF9800 | Warning states |
| --pm-error | #F44336 | Error states |
| --pm-border | #E0E0E0 | Borders, dividers |

## Typography
| Token | Value | Usage |
|-------|-------|-------|
| --pm-font-family | 'Inter', system-ui, sans-serif | All text |
| --pm-font-h1 | 700 2.5rem/1.2 | Page titles |
| --pm-font-h2 | 700 2rem/1.3 | Section headers |
| --pm-font-h3 | 600 1.5rem/1.4 | Card titles |
| --pm-font-body | 400 1rem/1.5 | Body text |
| --pm-font-body-lg | 400 1.125rem/1.6 | Larger body |
| --pm-font-small | 400 0.875rem/1.4 | Captions, metadata |
| --pm-font-tiny | 400 0.75rem/1.3 | Badges, timestamps |
| --pm-font-button | 600 1rem/1 | Button text |

## Spacing (4px Grid)
| Token | Value |
|-------|-------|
| --pm-space-1 | 4px |
| --pm-space-2 | 8px |
| --pm-space-3 | 12px |
| --pm-space-4 | 16px |
| --pm-space-5 | 24px |
| --pm-space-6 | 32px |
| --pm-space-8 | 48px |
| --pm-space-10 | 64px |

## Radius
| Token | Value |
|-------|-------|
| --pm-radius-sm | 4px |
| --pm-radius-md | 8px |
| --pm-radius-lg | 12px |
| --pm-radius-xl | 16px |
| --pm-radius-full | 9999px |

## Breakpoints
| Name | Min Width |
|------|-----------|
| Mobile | 0px |
| Tablet | 768px |
| Desktop | 1024px |
| Wide | 1440px |

## Shadow
| Token | Value |
|-------|-------|
| --pm-shadow-sm | 0 1px 2px rgba(0,0,0,0.05) |
| --pm-shadow-md | 0 4px 6px rgba(0,0,0,0.07) |
| --pm-shadow-lg | 0 10px 15px rgba(0,0,0,0.1) |
```

---

## 5. Integration with Next.js + shadcn/ui

The generated Stitch components integrate with the Tailwind + shadcn/ui stack:

```typescript
// 1. Stitch exports DESIGN.md tokens
// 2. Map DESIGN.md → Tailwind CSS config

// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        'pm-primary': '#C8A45C',
        'pm-primary-dark': '#A8893A',
        'pm-secondary': '#6B1D3A',
        'pm-background': '#FFF8EE',
        'pm-surface': '#FFFFFF',
        'pm-mode-a': '#2E7D32',
        'pm-mode-b': '#25D366',
        'pm-mode-c': '#1976D2',
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '24px',
        '6': '32px',
        '8': '48px',
        '10': '64px',
      },
    }
  }
};

// 3. Apply to shadcn/ui theme provider
// components/theme-provider.tsx
// Wrap with: <ThemeProvider attribute="class" defaultTheme="light">
```

---

## 6. Pipeline Automation Script

The UI Agent (07a) will run this script to generate all screens:

```typescript
// scripts/generate-ui.mts
import { Stitch } from '@google/stitch-sdk';
import fs from 'fs/promises';

const stitch = new Stitch({
  apiKey: process.env.STITCH_API_KEY,
  project: 'petemart-poc'
});

async function generatePeteMartUI() {
  // Step 1: Generate Design System
  console.log('🎨 Generating design system...');
  const designSystem = await stitch.design({
    prompt: `PeteMart design system: warm Indian gold (#C8A45C), 
      deep burgundy (#6B1D3A), cream (#FFF8EE), Inter font, 4px grid`
  });
  
  // Save DESIGN.md
  await fs.writeFile('design-system/DESIGN.md', designSystem.markdown);
  
  // Step 2: Generate POC Screens
  const screens = [
    { name: 'LandingPage', prompt: '...' },
    { name: 'MerchantMicrosite', prompt: '...' },
    // ... all 18 POC screens
  ];
  
  for (const screen of screens) {
    console.log(`🖥️ Generating ${screen.name}...`);
    const result = await stitch.generate({
      prompt: screen.prompt,
      format: 'react-tsx',
      theme: designSystem.id
    });
    
    await fs.writeFile(
      `components/stitch/${screen.name}.tsx`, 
      result.component
    );
    console.log(`✅ ${screen.name} generated`);
  }
  
  // Step 3: Create Prototype
  console.log('🔗 Creating interactive prototype...');
  const prototype = await stitch.prototype({
    name: 'PeteMart POC v1.0',
    screens: screens.map(s => ({ name: s.name })),
    links: [
      { from: 'LandingPage', action: 'click merchant', to: 'MerchantMicrosite' },
      // ... define all screen transitions
    ]
  });
  
  console.log(`📎 Prototype URL: ${prototype.url}`);
  console.log('✅ UI generation complete!');
}

generatePeteMartUI().catch(console.error);
```

---

## 7. Monthly Budget Tracking

| Generation Type | Monthly Limit | POC Usage | Buffer |
|---|---|---|---|
| **Standard Generations** | 350 | ~30 (18 screens + iterations) | 320 |
| **Pro Generations** | 200 | ~10 (detailed screens + prototypes) | 190 |
| **Total** | 550 | ~40 | 510+ |

The POC uses ~40 generations out of 550 available. Agent 07a has ample capacity for iteration and refinement.

---

*End of STITCH_INTEGRATION_GUIDE.md*

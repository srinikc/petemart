# PeteMart — User Guide & Quick Start

**Version**: v1.0.0-poc  
**Date**: 2026-05-30  

---

## What is PeteMart?

PeteMart is a hyper-local e-commerce platform connecting traditional Bangalore markets with digital commerce. Think of it as a digital marketplace for your neighborhood physical stores — starting with Chickpet and Balepet in Old Bangalore.

**For Customers**: Browse products from your favorite local shops, order online, and get delivery or visit in person.

**For Merchants**: Get a digital storefront, manage products and orders, and reach customers who prefer shopping online.

**For Admins**: Oversee the platform, approve merchants, and track growth.

---

## Quick Start (5 Minutes)

### Step 1: Open the App
```
http://localhost:3458
```

### Step 2: Log In
Click "Login" in the top-right corner and use one of these demo accounts:

| I want to be... | Phone Number | OTP |
|-----------------|-------------|-----|
| 🛍️ **A Customer** | `9999999999` | `123456` |
| 🏪 **A Merchant** | `8888888888` | `123456` |
| ⚙️ **An Admin** | `7777777777` | `123456` |

### Step 3: Start Exploring
- **Customer**: Browse markets → Visit stores → Add items to cart → Checkout
- **Merchant**: View dashboard → Manage products → Process orders
- **Admin**: See platform metrics → Approve merchants → View analytics

---

## For Customers

### Finding Products
1. **From the Home page**: Click on any market card (Chickpet, Balepet, etc.)
2. **Browse merchants**: Each market shows its stores
3. **View products**: Click a store to see their catalog
4. **Search**: Use the search bar to find specific items

### Placing an Order
1. Find a product and click "Add to Cart"
2. Go to Cart (top-right icon) to review your items
3. Click "Proceed to Checkout"
4. Select your delivery address
5. Choose payment method (COD for now)
6. Confirm order — you'll get an order ID!

### Tracking Your Order
- Go to "My Orders" to see all your orders
- Click any order for details
- Click "Track" to see delivery status

### Mode Badges Explained
| Badge | Meaning |
|-------|---------|
| **A** | 🛵 Order Online & Get Delivered |
| **B** | 💬 Enquire on WhatsApp |
| **C** | 🏪 Visit Store in Person |

---

## For Merchants (Ramesh Kumar — Samskruti Silks)

### Dashboard
Your dashboard shows:
- Total products listed
- Orders received
- Revenue summary
- Recent activity

### Managing Products
1. Go to **Products** in the sidebar
2. View all your listed products
3. Click **Add Product** to list something new
4. Edit or delete existing products

### Processing Orders
1. Go to **Orders** in the sidebar
2. View incoming customer orders
3. Update order status: Confirmed → Preparing → In Transit → Delivered

### Your Storefront
Your public store page is at:
```
/shop/samskruti-silks
```
Share this link with customers! They can also scan your QR code (available in the QR tab).

---

## For Admins (Ananya Gupta)

### Dashboard
Your admin dashboard shows:
- Total merchants on platform
- Total orders processed
- Platform revenue
- User registrations

### Managing Merchants
1. Go to **Merchants** in the sidebar
2. View all merchants and their status
3. Use **Approvals** to approve pending merchants

### Analytics
Track platform growth with:
- Merchant signup trends
- Order volume over time
- Revenue by merchant

---

## Demo Walkthrough Script

### "Show me the full customer journey"

```
1. Open → http://localhost:3458
2. See the landing page with 5 market cards
3. Click "Chickpet" → See market details and merchants
4. Click "Samskruti Silks" → Browse silk sarees
5. Click "Kanjivaram Silk Saree" → See product details
6. Click "Login" → Enter 9999999999 → Enter OTP 123456
7. Go back to the saree → Click "Add to Cart"
8. Click cart icon → See item in cart
9. Click "Proceed to Checkout" → Review → Confirm
10. See order confirmation!
11. Go to "My Orders" → See the new order
12. Click "Track" → See delivery timeline
```

---

## Test Drive Scenarios

### 5-Minute Demo

| Time | Action | What to Show |
|------|--------|--------------|
| 0:00 | Open app | Landing page with Bangalore markets |
| 0:30 | Browse Chickpet | Market detail, merchant listings |
| 1:00 | View Samskruti Silks | Storefront, product grid |
| 1:30 | Login as Customer | OTP auth flow |
| 2:00 | Add product to cart | Cart functionality |
| 2:30 | Checkout | Order confirmation |
| 3:00 | View order | Order history |
| 3:30 | Login as Merchant | Merchant dashboard |
| 4:00 | View products/orders | Merchant tools |
| 4:30 | Login as Admin | Platform overview |
| 5:00 | Q&A | Discuss features & roadmap |

---

## Product Modes

PeteMart supports three modes of shopping to accommodate different merchant capabilities:

| Mode | Icon | Description | Example Use |
|------|------|-------------|-------------|
| **A — Delivery** | 🛵 | Order online, get it delivered | Pastry Cafe delivers cakes |
| **B — WhatsApp** | 💬 | Enquire via WhatsApp, arrange pickup | flowers2u takes WhatsApp orders |
| **C — Visit** | 🏪 | Visit the physical store | Browse in person, pay at store |

Products may support one, two, or all three modes. Look for the mode badges on product cards.

---

## Marketplace Data

### Markets
| Market | Famous For |
|--------|-----------|
| Chickpet | Textiles, Silk Sarees |
| Balepet | Household, Florists, Bakery |
| Raja Market | Jewellery, Crafts |
| Mamulpet | Wholesale, Spices |
| Cubbonpet | Electronics, Hardware |

### Pilot Merchants
| Store | Category | Market |
|-------|----------|--------|
| Samskruti Silks | Premium Silk Sarees | Chickpet |
| The Pastry Cafe | Bakery & Pastries | Balepet |
| flowers2u | Fresh Flowers | Balepet |
| Sanjana Apparels | Clothing | Balepet |
| Madhumathi Ethnic | Men's Ethnic Wear | Balepet |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Page not loading** | Ensure server is running: `npm run dev` in petemart-unified |
| **Login not working** | Use one of: 9999999999, 8888888888, 7777777777 with OTP 123456 |
| **Cart empty after refresh** | Known limitation (in-memory storage). Add items again. |
| **Images not showing** | POC uses placeholder paths. Actual images coming in v1.1 |
| **404 on a page** | The server may need restarting. Run `npm run build` then `npm run dev` |

---

## Tech Stack (For Developers)

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15.5 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v3 + Radix UI |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Phone OTP (mock for POC) |
| **Testing** | Vitest + Testing Library |
| **Deployment** | Vercel Hobby (free) |

---

## Give Feedback

Found a bug? Have a suggestion? PeteMart is in active development and your feedback is valuable.

Share your feedback with:
- **Technical issues**: Report to the DevOps team
- **Feature requests**: Share with the Product team
- **General feedback**: Talk to your PeteMart representative

---

*Thank you for being part of the PeteMart pilot! We're excited to bring Old Bangalore's markets to the digital world.*

*— The PeteMart Team*

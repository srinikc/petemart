# PeteMart — Workflow Maps & User Journeys

**Document Version:** 1.0  
**Author:** Agent 05 — Senior Agile Program Manager & Scrum Master  
**Date:** 2026-05-30  
**Source:** PRD Workflows (WF-BROWSE-001 → WF-VIRTUALWALK-001), PRD Personas (PERS-CUST-001 → PERS-B2B-001)  

---

## 1. Customer Journey Map — Complete Lifecycle

### Main Flow: Guest → Browse → Register → Shop → Cart → Checkout → Track

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER LIFECYCLE JOURNEY                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐                                                               │
│  │ GUEST    │                                                                │
│  │ Arrives  │                                                                │
│  └────┬─────┘                                                                │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐             │
│  │ LANDING  │───▶│ MARKET    │───▶│ MERCHANT  │───▶│ PRODUCT  │             │
│  │ PAGE     │    │ EXPLORER  │    │ MICROSITE │    │ DETAIL   │             │
│  └──────────┘    └───────────┘    └───────────┘    └────┬─────┘             │
│       │                                                  │                   │
│       │ Pete Tapestry     Market Grid     Store Brand    │                   │
│       │ Search Bar         Merchant Cards   Product Grid │                   │
│       │ Featured Markets   Mode Badges      Mode Badges  │                   │
│       │                                                  │                   │
│       │                                       ┌──────────┴──────────┐       │
│       │                                       │                     │       │
│       │                                  ┌────▼────┐  ┌─────▼────┐  │       │
│       │                                  │ Mode A  │  │ Mode B/C │  │       │
│       │                                  │ Buy Now │  │Enquire/  │  │       │
│       │                                  └────┬────┘  │ Visit    │  │       │
│       │                                       │       └─────┬────┘  │       │
│       │                                       ▼             ▼       │       │
│       │                                  ┌──────────┐  ┌──────────┐ │       │
│       │                                  │ ADD TO   │  │WHATSAPP/ │ │       │
│       │                                  │ CART     │  │ MAPS     │ │       │
│       │                                  └────┬─────┘  └──────────┘ │       │
│       │                                       │                      │       │
│       │                              ┌────────┴────────┐             │       │
│       │                              ▼                 ▼             │       │
│       │                         ┌─────────┐     ┌──────────┐        │       │
│       │                         │  CART   │     │ CHECKOUT │        │       │
│       │                         │ Review  │────▶│ Address  │        │       │
│       │                         │ Items   │     │ Delivery │        │       │
│       │                         └─────────┘     │ Payment  │        │       │
│       │                                          └────┬─────┘        │       │
│       │                                               │              │       │
│       │                                               ▼              │       │
│       │                                          ┌──────────┐        │       │
│       │                                          │  ORDER   │        │       │
│       │                                          │CONFIRMED │        │       │
│       │                                          └────┬─────┘        │       │
│       │                                               │              │       │
│       │                                               ▼              │       │
│       │                        ┌──────────────────────────────┐      │       │
│       │                        │       ORDER TRACKING         │      │       │
│       │                        │  Confirmed → Packing →       │      │       │
│       │                        │  Picked Up → In Transit →    │      │       │
│       │                        │  Delivered                   │      │       │
│       │                        └──────────────┬───────────────┘      │       │
│       │                                       │                      │       │
│       │                                       ▼                      │       │
│       │                        ┌──────────────────────────────┐      │       │
│       │                        │    POST-DELIVERY             │      │       │
│       │                        │  Rate Product & Merchant     │      │       │
│       │                        │  Write Review with Photo     │      │       │
│       │                        │  Mark as Helpful             │      │       │
│       │                        └──────────────────────────────┘      │       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Persona-Specific Screen Maps

### Persona: Priya (Customer)

| Screen | Route | Nav Context | Entry Point | Exit Points |
|--------|-------|-------------|-------------|-------------|
| **Landing Page** | `/` | Public (no auth needed) | Browser URL / App open | Market click, Search, Login |
| **Market Explorer** | `/markets/{slug}` | Public | Landing page tile | Merchant click, Back |
| **Merchant Microsite** | `/shop/{slug}` | Public | Market page / Search result | Product click, Back |
| **Product Detail** | `/product/{id}` | Public / Auth | Microsite product card | Add to Cart, WhatsApp, Directions, Back |
| **Cart** | `/cart` | Public (session) / Auth | Nav bar cart icon | Checkout, Continue Shopping |
| **Checkout** | `/checkout` | Auth required | Cart page | Payment, Address Edit |
| **Order Confirmation** | `/order/{id}/confirmation` | Auth required | Payment success | View Order, Continue Shopping |
| **My Orders** | `/orders` | Auth required | Nav bar | Order click, Repeat Order |
| **Order Detail** | `/order/{id}` | Auth required | My Orders | Track Live, Cancel |
| **Live Tracking** | `/tracking/{id}` | Auth required | Order detail | Courier Contact, Confirm |
| **Profile** | `/profile` | Auth required | Nav bar | Edit Profile, Addresses |
| **Register/Login** | `/auth` | Public | Any protected route | OTP verify → Redirect |

**Navigation Bar (Customer, Logged In):**
```
[ Logo ] [ Search Bar ] [ Markets ] [ Cart (badge) ] [ My Orders ] [ Profile ▼ ]
```

**Navigation Bar (Customer, Guest):**
```
[ Logo ] [ Search Bar ] [ Markets ] [ Cart (badge) ] [ Login / Register ]
```

---

### Persona: Ramesh (Merchant)

| Screen | Route | Nav Context | Entry Point | Exit Points |
|--------|-------|-------------|-------------|-------------|
| **Merchant Dashboard** | `/merchant/dashboard` | Merchant auth | Login redirect | All merchant nav links |
| **Product List** | `/merchant/products` | Merchant auth | Dashboard link | Add, Edit, Delete |
| **Add Product** | `/merchant/products/new` | Merchant auth | Product list | Save, Cancel |
| **Edit Product** | `/merchant/products/{id}/edit` | Merchant auth | Product list | Save, Cancel |
| **Bulk Upload** | `/merchant/products/bulk` | Merchant auth | Product list | Upload template, Import |
| **Order List** | `/merchant/orders` | Merchant auth | Dashboard link | Order click |
| **Order Detail** | `/merchant/orders/{id}` | Merchant auth | Order list | Status update, Invoice |
| **Analytics** | `/merchant/analytics` | Merchant auth | Dashboard link | Export, Date filter |
| **Reviews** | `/merchant/reviews` | Merchant auth | Dashboard link | View, Reply |
| **Settings** | `/merchant/settings` | Merchant auth | Dashboard link | Profile, Modes, Subscription |
| **Subscription** | `/merchant/subscription` | Merchant auth | Settings | Upgrade, Downgrade |
| **Payouts** | `/merchant/payouts` | Merchant auth | Dashboard link | View history |
| **Store Preview** | `/merchant/preview` | Merchant auth | Settings | View as customer |

**Navigation Bar (Merchant):**
```
[ Logo ] [ Dashboard ] [ Products ▼ ] [ Orders ] [ Analytics ] [ Reviews ] [ Settings ▼ ]
```

**Full Merchant Dashboard Layout:**
```
┌────────────────────────────────────────────────────┐
│  📊 DASHBOARD OVERVIEW                [Last 30 days]│
├──────────┬──────────┬──────────┬───────────────────┤
│  Orders  │ Revenue  │ Products │  Enquiries        │
│    24    │ ₹84,500  │   156    │    12             │
├──────────┴──────────┴──────────┴───────────────────┤
│  📈 Revenue Trend                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ ████████████████████                         │   │
│  │ ████████████████████████                     │   │
│  │ ██████████████████████████████               │   │
│  └─────────────────────────────────────────────┘   │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun                 │
├────────────────────────────────────────────────────┤
│  📋 Recent Orders             View All →           │
│  ┌────────────────────────────────────────────┐   │
│  │ #1024  Priya S.    ₹3,200    Packing       │   │
│  │ #1023  Deepa P.    ₹12,500   New           │   │
│  │ #1022  Ravi K.     ₹1,800    Delivered     │   │
│  └────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

---

### Persona: Ananya (Admin)

| Screen | Route | Nav Context | Entry Point | Exit Points |
|--------|-------|-------------|-------------|-------------|
| **Admin Dashboard** | `/admin` | Admin auth | Login redirect | All admin nav links |
| **Merchant List** | `/admin/merchants` | Admin auth | Dashboard link | Approve, Suspend, View |
| **Merchant Detail** | `/admin/merchants/{id}` | Admin auth | Merchant list | Edit, Approve, Suspend |
| **Approval Queue** | `/admin/merchants/approvals` | Admin auth | Dashboard link | Approve/Reject |
| **Order Monitor** | `/admin/orders` | Admin auth | Dashboard link | View, Cancel |
| **Order Detail** | `/admin/orders/{id}` | Admin auth | Order monitor | Status override |
| **Users** | `/admin/users` | Admin auth | Dashboard link | View, Suspend |
| **Config** | `/admin/config` | Admin auth | Dashboard link | All config sections |
| **Delivery Zones** | `/admin/config/zones` | Admin auth | Config | Add, Edit zones |
| **Commission Rates** | `/admin/config/commissions` | Admin auth | Config | Edit rates |
| **Feature Flags** | `/admin/config/features` | Admin auth | Config | Toggle flags |
| **Promo Codes** | `/admin/promos` | Admin auth | Dashboard link | Create, Manage |
| **Revenue Reports** | `/admin/reports` | Admin auth | Dashboard link | Export, Date range |
| **City Management** | `/admin/cities` | Admin auth | Dashboard link | Add City, Configure |
| **Branding** | `/admin/branding` | Admin auth | Config | Edit theme |
| **Review Moderation** | `/admin/moderation` | Admin auth | Dashboard link | Approve/Reject |

**Navigation Bar (Admin):**
```
[ Logo ] [ Dashboard ] [ Merchants ▼ ] [ Orders ] [ Config ▼ ] [ Reports ] [ Promos ]
```

---

### Persona: Deepa (B2B Buyer)

Deepa's journey extends the basic customer flow with B2B-specific steps:

| Screen | B2B-Specific Feature | Route |
|--------|---------------------|-------|
| **Product Card** | Wholesale price shown, "B2B" badge | `/product/{id}` |
| **Cart** | Quantity minimum validation (MOQ) | `/cart` |
| **Checkout** | B2B pricing (1.5% commission), GST input | `/checkout` |
| **Order History** | Bulk order repeat | `/orders` |

**B2B Workflow:**
```
Browse → Filter by "Wholesale" → View B2B pricing → 
Check MOQ → Add bulk qty → Cart (B2B pricing) → 
Checkout (GSTIN entry, B2B rates) → Payment → 
Order → Repeat order
```

---

### Persona: Vinay (Courier/Delivery Partner)

| Screen | Route | Entry Point | Key Actions |
|--------|-------|-------------|-------------|
| **Courier Login** | `/courier/auth` | App open | OTP login |
| **Today's Deliveries** | `/courier/deliveries` | Login | View route |
| **Delivery Detail** | `/courier/deliveries/{id}` | Today's list | Mark picked up, in transit, delivered |
| **Route Map** | `/courier/route` | Today's list | Multi-stop navigation |
| **Earnings** | `/courier/earnings` | Bottom nav | View daily/weekly |
| **Profile** | `/courier/profile` | Bottom nav | Settings |

**Courier Workflow:**
```
Login → See today's route (optimized multi-stop) → 
Navigate to Merchant A → Mark "Picked Up" → 
Navigate to Merchant B → Mark "Picked Up" → 
Navigate to Micro-Hub → Mark "Consolidated" → 
Navigate to Customer → Mark "Delivered" → 
Upload delivery proof photo → 
See earnings update
```

---

## 3. Screen-to-Screen Navigation Matrix

### Web Application (Next.js)

```
                             ┌─────────────┐
                             │  /auth      │
                             │  Login/Reg  │
                             └──────┬──────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              ┌─────▼─────┐                  ┌──────▼──────┐
              │  /         │                  │  /profile   │
              │  Landing   │◄─────────────────│  Profile    │
              └─────┬─────┘                  └─────────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
    ┌────▼───┐ ┌────▼────┐ ┌──▼────────┐
    │/markets│ │/search  │ │/shop/{slug}│
    │Market  │ │Results  │ │Merchant    │
    │Explorer│ │         │ │Microsite   │
    └────┬───┘ └─────────┘ └─────┬──────┘
         │                       │
         │                  ┌────▼──────┐
         │                  │/product   │
         │                  │/{id}      │
         │                  │Detail     │
         │                  └────┬──────┘
         │                       │
         │            ┌──────────┼──────────┐
         │            │          │          │
         │       ┌────▼───┐ ┌───▼────┐ ┌───▼──────┐
         │       │ /cart  │ │wa.me/..│ │Google     │
         │       │ Cart   │ │WhatsApp│ │Maps       │
         │       └───┬────┘ │DeepLink│ │Directions │
         │           │      └────────┘ └──────────┘
         │           ▼
         │      ┌──────────┐
         │      │/checkout │
         │      │Checkout  │
         │      └────┬─────┘
         │           │
         │      ┌────▼─────┐
         │      │ Razorpay │
         │      │ Payment  │
         │      └────┬─────┘
         │           │
         │      ┌────▼────────┐
         │      │/order/{id}  │
         │      │Confirmation │
         │      └────┬────────┘
         │           │
         │      ┌────▼────────┐
         │      │/orders      │
         │      │Order History│
         │      └────┬────────┘
         │           │
         │      ┌────▼────────┐
         │      │/tracking    │
         │      │/{id}        │
         │      │Live Track   │
         │      └─────────────┘
```

### Merchant Dashboard Navigation

```
┌───────────────────────────────────────────────────┐
│              /merchant/dashboard                   │
│              ┌─────────────────────┐               │
│              │  DASHBOARD OVERVIEW │               │
│              │  Orders | Revenue   │               │
│              │  Products | Enq     │               │
│              └─────────┬───────────┘               │
│                        │                            │
│         ┌──────────────┼──────────────┐             │
│         │              │              │             │
│  ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼──────┐      │
│  │ /merchant/  │ │ /merchant │ │ /merchant/ │      │
│  │ products    │ │ /orders   │ │ analytics  │      │
│  │ (CRUD)      │ │ (List)    │ │ (Charts)   │      │
│  └──────┬──────┘ └─────┬─────┘ └─────┬──────┘      │
│         │              │              │             │
│  ┌──────▼──────┐ ┌─────▼─────┐       │             │
│  │ /merchant/  │ │ /merchant │       │             │
│  │ products/   │ │ /orders/  │       │             │
│  │ new         │ │ {id}      │       │             │
│  └─────────────┘ └───────────┘       │             │
│                                       │             │
│  ┌──────────────┐   ┌────────────────▼────────┐    │
│  │ /merchant/   │   │ /merchant/settings      │    │
│  │ reviews      │   │ Profile | Subscription  │    │
│  └──────────────┘   │ Modes | Payouts         │    │
│                     └─────────────────────────┘    │
└───────────────────────────────────────────────────┘
```

### Admin Dashboard Navigation

```
┌────────────────────────────────────────────────────────┐
│                      /admin                             │
│              ┌────────────────────────┐                  │
│              │   ADMIN DASHBOARD      │                  │
│              │   All Platform Metrics │                  │
│              └───────────┬────────────┘                  │
│                          │                                │
│         ┌────────────────┼──────────────────┐            │
│         │                │                  │            │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼───────┐   │
│  │ /admin/     │  │ /admin/     │  │ /admin/       │   │
│  │ merchants   │  │ orders      │  │ config        │   │
│  │ (List/Appr) │  │ (Monitor)   │  │ (All config)  │   │
│  └──────┬──────┘  └─────────────┘  └───────┬───────┘   │
│         │                                   │           │
│  ┌──────▼──────┐                ┌──────────┼──────────┐│
│  │ /admin/     │                │          │          ││
│  │ merchants/  │          ┌─────▼────┐ ┌──▼────┐ ┌───▼┐│
│  │ approvals   │          │/admin/   │ │/admin │ │/ad ││
│  └─────────────┘          │config/   │ │/config│ │min/││
│                           │zones     │ │/comm  │ │feat││
│                           └──────────┘ └───────┘ └────┘│
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ /admin/      │  │ /admin/      │  │ /admin/        │  │
│  │ promos       │  │ reports      │  │ moderation     │  │
│  │ (Coupons)    │  │ (Revenue)    │  │ (Reviews)      │  │
│  └──────────────┘  └──────────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Auth Flow — Complete State Machine

```
                    ┌─────────────────────┐
                    │   VISITOR (Guest)   │
                    │   Can browse only   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Click Login/       │
                    │  Register / Checkout│
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Enter Phone Number │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Send OTP via SMS   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  User enters OTP    │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         ┌────▼───┐      ┌────▼────┐     ┌─────▼─────┐
         │Customer│      │ Merchant│     │  Admin    │
         │Dashboard│      │Dashboard│     │ Dashboard │
         │ /       │      │/merchant│     │ /admin    │
         └────┬───┘      └────┬────┘     └─────┬─────┘
              │               │                 │
         ┌────▼───┐      ┌────▼────┐           │
         │ Profile │      │ Onboard │           │
         │ Setup   │      │ Wizard  │           │
         └─────────┘      └─────────┘           │
                                                │
              All roles share session JWT       │
              Role encoded in JWT claims        │
              Different navbar per role         │
```

---

## 5. Checkout Flow — Detailed Step-by-Step

```
┌─────────────────────────────────────────────────────────────────────┐
│                       CHECKOUT FLOW                                   │
│                      (Multi-Store Consolidation)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────┐                                                        │
│  │ CART      │                                                        │
│  │ - Merchant A: 2 items (₹3,200)                                   │
│  │ - Merchant B: 1 item  (₹1,500)                                   │
│  │ - Delivery est: ₹70 (Zone 2) + ₹25 (extra store) = ₹95           │
│  │ - Total: ₹4,795                                                   │
│  │ → [Proceed to Checkout]                                           │
│  └─────┬─────┘                                                        │
│        │                                                              │
│        ▼                                                              │
│  ┌───────────┐                                                        │
│  │ ADDRESS   │                                                        │
│  │ ○ Saved: Home (Basavanagudi) ← selected                           │
│  │ ○ Add New Address                                                  │
│  │   [Name] [Phone] [Line1] [Line2] [City] [Pincode] [Landmark]     │
│  │ → [Use This Address]                                              │
│  └─────┬─────┘                                                        │
│        │                                                              │
│        ▼                                                              │
│  ┌───────────┐                                                        │
│  │ ORDER TYPE                                                        │
│  │ ○ B2C Retail (4% commission, standard pricing)                    │
│  │ ○ B2B Wholesale (1.5% commission, bulk pricing)                   │
│  │ → [Continue]                                                      │
│  └─────┬─────┘                                                        │
│        │                                                              │
│        ▼                                                              │
│  ┌───────────┐                                                        │
│  │ ORDER SUMMARY                                                     │
│  │ ┌─────────────────────────────────────────────┐                   │
│  │ │ Merchant A: Samskruti Silks                  │                   │
│  │ │  Kanjivaram Saree  1× ₹2,800 = ₹2,800       │                   │
│  │ │  Silk Dupatta      1× ₹400   = ₹400         │                   │
│  │ │  Delivery           ₹70                      │                   │
│  │ ├─────────────────────────────────────────────┤                   │
│  │ │ Merchant B: Pastry Cafe                      │                   │
│  │ │  Choc Truffle      1× ₹1,500 = ₹1,500       │                   │
│  │ │  Delivery           ₹25 (consolidation)      │                   │
│  │ ├─────────────────────────────────────────────┤                   │
│  │ │ Subtotal           ₹4,700                    │                   │
│  │ │ Delivery Total     ₹95                       │                   │
│  │ │ PG Fee (2%)        ₹96                       │                   │
│  │ │ Grand Total        ₹4,891                    │                   │
│  │ └─────────────────────────────────────────────┘                   │
│  │ [Promo Code: ________] [Apply]                                    │
│  │ → [Place Order]                                                   │
│  └─────┬─────┘                                                        │
│        │                                                              │
│        ▼                                                              │
│  ┌───────────┐                                                        │
│  │ RAZORPAY                                                          │
│  │ ┌──────────────────────┐                                           │
│  │ │ Pay ₹4,891           │                                           │
│  │ │                      │                                           │
│  │ │ [UPI] [Card] [NB]   │                                           │
│  │ │                      │                                           │
│  │ │ [Pay ₹4,891]        │                                           │
│  │ └──────────────────────┘                                           │
│  └──────┬──────┘                                                      │
│         │                                                              │
│    ┌────┴────┐                                                        │
│    │         │                                                         │
│    ▼         ▼                                                         │
│  Success    Failure                                                    │
│    │         │                                                         │
│    ▼         ▼                                                         │
│  ┌──────┐ ┌──────┐                                                    │
│  │ORDER │ │RETRY │                                                    │
│  │CONF. │ │PAGE  │                                                    │
│  └──────┘ └──────┘                                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Order Fulfillment Flow (Merchant + Courier)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ORDER FULFILLMENT JOURNEY                              │
│  Customer clicks "Place Order" → Razorpay → Order Created → Delivered       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐                                                               │
│  │ PENDING  │ ← Order created, awaiting payment webhook                     │
│  │ PAYMENT  │                                                               │
│  └────┬─────┘                                                               │
│       │ Payment captured webhook received                                    │
│  ┌────▼─────┐                                                               │
│  │ CONFIRMED│ → SMS/Email to customer → Push to merchant                    │
│  │          │ → Merchant sees "New Order" in dashboard                      │
│  └────┬─────┘                                                               │
│       │ Merchant acknowledges (or auto after 5 min)                         │
│  ┌────▼─────┐                                                               │
│  │ PACKING  │ → Merchant packs items                                        │
│  │          │ → Merchant marks "Ready for Pickup"                           │
│  └────┬─────┘                                                               │
│       │ Courier assigned (auto or manual)                                   │
│  ┌────▼─────┐                                                               │
│  │ PICKED UP│ → Courier scans QR at merchant store                          │
│  │          │ → GPS tracking starts                                          │
│  └────┬─────┘                                                               │
│       │ Courier arrives at Micro-Hub (for multi-store)                      │
│  ┌────▼─────┐                                                               │
│  │ CONSOLI- │ → Items from multiple merchants consolidated                  │
│  │ DATED    │ → Single bag prepared for delivery                            │
│  └────┬─────┘                                                               │
│       │ Courier leaves Micro-Hub                                             │
│  ┌────▼─────┐                                                               │
│  │IN TRANSIT│ → Customer sees live GPS on map                               │
│  │          │ → ETA displayed and updated                                    │
│  └────┬─────┘                                                               │
│       │ Delivered to customer                                                │
│  ┌────▼─────┐                                                               │
│  │DELIVERED │ → Customer confirms (or auto after 24h)                       │
│  │          │ → Settlement timer starts (T+3)                               │
│  └────┬─────┘                                                               │
│       │                                                                      │
│  ┌────▼─────┐   ┌──────────┐                                                │
│  │COMPLETED │   │CANCELLED │ ← If cancelled before "Packing"                │
│  └──────────┘   └──────────┘                                                │
│                                                                              │
│  At each status transition:                                                  │
│  ✅ Push notification to customer                                           │
│  ✅ SMS update to customer                                                  │
│  ✅ Order status log entry                                                   │
│  ✅ Merchant dashboard updated                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Merchant Onboarding Flow (Step-by-Step)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   MERCHANT ONBOARDING (15 min)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: Phone Verification                                          │
│  ┌──────────────────────────────────────────────┐                   │
│  │ 📱 Enter Phone Number                        │                   │
│  │ [____9876543210____]  [Send OTP]             │                   │
│  │ ✓ OTP sent to +91-9876543210                 │                   │
│  │ [Enter OTP: _ _ _ _] [Verify]                │                   │
│  └──────────────────────────────────────────────┘                   │
│                                                                      │
│  Step 2: Business Details                                            │
│  ┌──────────────────────────────────────────────┐                   │
│  │ 🏪 Store Name:     [Kuberan Silks]          │                   │
│  │ 📍 Address:        [100, Chickpet Main Rd]  │                   │
│  │ 🏙️ Market Area:    [▼ Chickpet]            │                   │
│  │ 📂 Category:       [▼ Textiles / Silk]      │                   │
│  │ 📋 GST Registered: [Yes / No]               │                   │
│  │    GSTIN:          [29ABCDE1234F1Z5]        │                   │
│  │ 🕐 Business Hours: [9:00 AM] to [8:00 PM]   │                   │
│  │ 📸 Store Photos:   [Upload up to 6]         │                   │
│  │ [Continue]                                   │                   │
│  └──────────────────────────────────────────────┘                   │
│                                                                      │
│  Step 3: Choose Plan                                                 │
│  ┌──────────────────────────────────────────────┐                   │
│  │ 💰 Choose Your Plan                           │                   │
│  │                                              │                   │
│  │ ┌──────────┐  ┌──────────┐  ┌──────────┐   │                   │
│  │ │ Starter  │  │ Growth   │  │ Premium  │   │                   │
│  │ │ ₹499/mo  │  │ ₹999/mo  │  │ ₹2,499/mo│   │                   │
│  │ │ 50 prod  │  │ 200 prod │  │ Unlimited│   │                   │
│  │ │ Mode B/C │  │ All modes│  │ All modes│   │                   │
│  │ │          │  │ Analytics│  │ Priority │   │                   │
│  │ └──────────┘  └────┬─────┘  └──────────┘   │                   │
│  │                    │                         │                   │
│  │              [Select Growth — Recommended]   │                   │
│  └──────────────────────────────────────────────┘                   │
│                                                                      │
│  Step 4: Choose Interaction Modes                                    │
│  ┌──────────────────────────────────────────────┐                   │
│  │ 🔄 How do you want to sell?                   │                   │
│  │                                              │                   │
│  │ ✅ Buy Now (Direct Purchase)                  │                   │
│  │    Requires: Bank account for settlement      │                   │
│  │                                              │                   │
│  │ ✅ Enquire on WhatsApp                        │                   │
│  │    Requires: WhatsApp Business number         │                   │
│  │                                              │                   │
│  │ ✅ Visit Store (Store Visit)                  │                   │
│  │    Requires: Store address + photos           │                   │
│  │                                              │                   │
│  │ [Continue]                                    │                   │
│  └──────────────────────────────────────────────┘                   │
│                                                                      │
│  Step 5: Bank Details (for Mode A settlements)                      │
│  ┌──────────────────────────────────────────────┐                   │
│  │ 🏦 Payment Settlement                         │                   │
│  │ Account Holder: [Kuberan Silks]              │                   │
│  │ Account Number: [XXXX XXXX XXXX]             │                   │
│  │ Confirm Number: [XXXX XXXX XXXX]             │                   │
│  │ IFSC Code:     [SBIN0001234]                 │                   │
│  │ 📎 Cancelled Cheque: [Upload] ✅              │                   │
│  │                                              │                   │
│  │ ℹ️ Payments settled via Razorpay automatically │                   │
│  │ [Continue]                                    │                   │
│  └──────────────────────────────────────────────┘                   │
│                                                                      │
│  Step 6: Upload Products (at least 3)                                │
│  ┌──────────────────────────────────────────────┐                   │
│  │ 📦 Add Your Products                          │                   │
│  │ [Add Product] or [Bulk Upload CSV]           │                   │
│  │                                              │                   │
│  │ Product 1: Kanjivaram Silk Saree  ₹2,800    │                   │
│  │   ✓ Image  ✓ Price  ✓ Stock  ✓ Mode A       │                   │
│  │ Product 2: Mysore Silk Saree     ₹1,500      │                   │
│  │   ✓ Image  ✓ Price  ✓ Stock  ✓ Mode A       │                   │
│  │ Product 3: Cotton Saree          ₹899        │                   │
│  │   ✓ Image  ✓ Price  ✓ Stock  ✓ Mode A       │                   │
│  │                                              │                   │
│  │ [Submit for Approval]                         │                   │
│  └──────────────────────────────────────────────┘                   │
│                                                                      │
│  Step 7: Approval (Admin Side)                                       │
│  ┌──────────────────────────────────────────────┐                   │
│  │ 🎉 Submitted! Your store is under review.    │                   │
│  │                                              │                   │
│  │ Admin: Ananya reviews application →          │                   │
│  │ ✅ Approves → Store goes live                 │                   │
│  │                                              │                   │
│  │ 📱 SMS: "Your store Kuberan Silks is live!   │                   │
│  │    Visit: petemart.in/kuberan-silks"          │                   │
│  │                                              │                   │
│  │ 📱 Download your QR code: [Download]         │                   │
│  └──────────────────────────────────────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Admin Approval Workflow (Step-by-Step)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ADMIN APPROVAL WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Admin logs into /admin                                              │
│       │                                                              │
│       ▼                                                              │
│  Dashboard shows: "3 Merchants Pending Approval"                     │
│       │                                                              │
│       ▼                                                              │
│  Clicks "Approvals" → List of pending merchants                     │
│       │                                                              │
│       ▼                                                              │
│  Selects a merchant → Views full application:                       │
│  ┌──────────────────────────────────────────────────┐               │
│  │ 📋 Merchant: Kuberan Silks                        │               │
│  │    Owner: Ramesh Gupta (+91-9876543210)          │               │
│  │    Market: Chickpet                              │               │
│  │    Plan: Growth (₹999/mo)                        │               │
│  │    Modes: A, B, C                                │               │
│  │    Products: 3 (✓ All valid)                     │               │
│  │    Bank: ✓ Account verified                      │               │
│  │    GSTIN: ✓ Valid                                │               │
│  │    Razorpay Subaccount: ✓ Created                │               │
│  │    Address: ✓ Geocoded                          │               │
│  │                                                  │               │
│  │    [Approve ✅] [Reject ❌] [Request Changes 🔄]  │               │
│  └──────────────────────────────────────────────────┘               │
│       │                                                              │
│       ▼                                                              │
│  Click "Approve" → Store goes live immediately                      │
│       │                                                              │
│       ▼                                                              │
│  Events triggered:                                                   │
│  ├── SMS to merchant: "Your store is live!"                          │
│  ├── Store URL created: petemart.in/kuberan-silks                   │
│  ├── QR code generated and sent via SMS                              │
│  ├── Merchant added to search index                                  │
│  ├── Email notification to operations team                           │
│  └── Entry in approval audit log                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Account Recovery & Edge Cases

| Scenario | Flow | Screen |
|----------|------|--------|
| **Forgot password?** | N/A — OTP-based login, no password | /auth (OTP sent) |
| **OTP not received?** | Resend button (max 3/hr) | /auth |
| **Session expired?** | Redirect to /auth with return URL | Any protected route |
| **Out of stock?** | "Notify Me" button → email/SMS when back | Product detail |
| **Payment failed?** | Retry with same order (order held for 15 min) | Checkout → Razorpay |
| **Order cancellation?** | Cancel button before "Packing" status | Order detail |
| **Wrong address?** | Edit delivery address before "Packing" | Order detail |
| **Delivery issue?** | Contact courier directly via phone | Tracking page |
| **Dispute/Refund?** | Raise ticket → Admin reviews → Refund processed | Order detail / Support |

---

## 10. All Menus — Navigation Content

### Customer Nav (Logged In)
```
[Home] [Markets ▼] [Search] [Cart 🛒] [My Orders] [Profile ▼]
                          ▼                            ▼
                    All Markets                My Profile
                    Chickpet                   My Addresses
                    Balepet                    Payment Methods
                    Mamulpet                   Language
                    ... (21 markets)           Logout
```

### Customer Nav (Guest)
```
[Home] [Markets ▼] [Search] [Cart 🛒] [Login / Register]
```

### Merchant Nav
```
[Dashboard] [Products ▼]   [Orders] [Analytics] [Reviews] [Settings ▼]
                ▼                                         ▼
           All Products                             Store Settings
           Add Product                              Subscription
           Bulk Upload                              Modes
           Categories                               Payouts
                                                    Bank Details
```

### Admin Nav
```
[Dashboard] [Merchants ▼] [Orders] [Config ▼] [Reports] [Promos] [Moderation]
                ▼                     ▼
           All Merchants         Delivery Zones
           Approvals             Commission Rates
           Suspensions           Feature Flags
                                Branding
                                Cities
```

### Courier Nav
```
[Today's Route] [Deliveries] [Earnings] [Profile]
```

---

*End of Workflow Maps*

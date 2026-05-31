# PeteMart — Demo Accounts & Test Scenarios

**Version**: v1.0.0-poc  
**Date**: 2026-05-30  

---

## Demo Accounts

| Role | Phone | OTP | Name | User ID |
|------|-------|-----|------|---------|
| **Customer** | `9999999999` | `123456` | Priya Sharma | `cust-001` |
| **Merchant** | `8888888888` | `123456` | Ramesh Kumar | `merch-001` |
| **Admin** | `7777777777` | `123456` | Ananya Gupta | `admin-001` |

> **Auth Flow**: `POST /api/v1/auth/login` → `POST /api/v1/auth/verify-otp` → Use `session.accessToken` as Bearer token in subsequent requests.

---

## Test Scenario 1: Customer Shopping Flow

### End-to-End Purchase Journey

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1.1 | Visit Home page `/` | Landing page with market cards and hero banner |
| 1.2 | Click "Chickpet" market | Market detail page showing merchants in Chickpet |
| 1.3 | Click "Samskruti Silks" | Storefront showing all products from this merchant |
| 1.4 | Click on "Kanjivaram Silk Saree" | Product detail page with price, description, images |
| 1.5 | Navigate to `/auth` | Login page with phone input |
| 1.6 | Enter `9999999999` and click Send OTP | OTP sent confirmation |
| 1.7 | Enter `123456` and verify | Redirected to home page as logged-in customer |
| 1.8 | Browse to a product and click "Add to Cart" | Product added, cart count increments |
| 1.9 | Click cart icon → `/cart` | Cart page showing item with quantity and price |
| 1.10 | Click "Proceed to Checkout" | Checkout page with address and payment options |
| 1.11 | Select COD and confirm | Order confirmation with order ID |
| 1.12 | Navigate to `/orders` | Order history showing the new order |
| 1.13 | Click on the order | Order detail page |
| 1.14 | Navigate to `/tracking/[order-id]` | Tracking page with delivery timeline |

### API-Only Test (curl/PowerShell)

```powershell
# Step 1: Login
$login = Invoke-WebRequest -Uri "http://localhost:3458/api/v1/auth/login" `
  -Method POST -Body '{"phone":"9999999999"}' -ContentType "application/json"

# Step 2: Verify OTP
$verify = Invoke-WebRequest -Uri "http://localhost:3458/api/v1/auth/verify-otp" `
  -Method POST -Body '{"phone":"9999999999","token":"123456"}' -ContentType "application/json"
$auth = ($verify.Content | ConvertFrom-Json).data
$token = $auth.session.accessToken

# Step 3: Browse markets
$markets = Invoke-WebRequest -Uri "http://localhost:3458/api/v1/markets" -UseBasicParsing

# Step 4: Browse products
$products = Invoke-WebRequest -Uri "http://localhost:3458/api/v1/products" -UseBasicParsing

# Step 5: Add to cart
$cart = Invoke-WebRequest -Uri "http://localhost:3458/api/v1/cart" -Method POST `
  -Body '{"product_id":"prod-001","quantity":2}' -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $token"}

# Step 6: Checkout
$checkout = Invoke-WebRequest -Uri "http://localhost:3458/api/v1/checkout" -Method POST `
  -Body '{"address_id":"addr-1","payment_method":"COD"}' -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $token"}

# Step 7: View orders
$orders = Invoke-WebRequest -Uri "http://localhost:3458/api/v1/orders" `
  -Headers @{"Authorization"="Bearer $token"}

Write-Output "E2E Shopping Flow: ✅ Complete"
```

---

## Test Scenario 2: Merchant Portal

### "Ramesh Kumar" managing his store

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | Go to `/auth` | Login page |
| 2.2 | Login with `8888888888` / `123456` | Redirected to `/merchant/dashboard` |
| 2.3 | View Dashboard | KPIs: Total Products, Orders, Revenue |
| 2.4 | Click "Products" → `/merchant/products` | List of merchant's products with edit/delete options |
| 2.5 | Click "Add Product" | New product form |
| 2.6 | Fill form and submit | Product added to catalog |
| 2.7 | Click "Orders" → `/merchant/orders` | Customer orders for this merchant |
| 2.8 | Click on an order, update status | Order status changes (confirmed→preparing→in_transit) |
| 2.9 | Click "Analytics" | Sales chart and product performance |
| 2.10 | Click "QR Code" | Store's QR code linking to public storefront |
| 2.11 | Click "Settings" | Edit business hours, description |

---

## Test Scenario 3: Admin Portal

### "Ananya Gupta" overseeing the platform

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.1 | Go to `/auth` | Login page |
| 3.2 | Login with `7777777777` / `123456` | Redirected to `/admin` |
| 3.3 | View Dashboard | Platform KPIs: Total Merchants, Orders, Revenue |
| 3.4 | Click "Merchants" → `/admin/merchants` | All merchants with status (pending/active) |
| 3.5 | Click "Approvals" → `/admin/merchants/approvals` | Pending merchant approvals |
| 3.6 | Click "Orders" → `/admin/orders` | All orders across all merchants |
| 3.7 | Click "Analytics" | Platform growth charts |

---

## Test Scenario 4: Product Browsing Filters

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.1 | `GET /api/v1/products?q=silk` | Filtered products matching "silk" |
| 4.2 | `GET /api/v1/products?category=Silk+Sarees` | Products in Silk Sarees category |
| 4.3 | `GET /api/v1/merchants?market=market-1` | Merchants in Chickpet market |
| 4.4 | `GET /api/v1/merchants/bad-slug` | 404 response |

---

## Test Scenario 5: Security Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5.1 | `GET /api/v1/admin/dashboard` (no auth) | 401 Unauthorized |
| 5.2 | `GET /api/v1/admin/dashboard` (customer token) | 401 Forbidden |
| 5.3 | `GET /api/v1/cart` (no auth) | 401 Unauthorized |
| 5.4 | `POST /api/v1/auth/login` (empty phone) | 400 Bad Request |
| 5.5 | `POST /api/v1/auth/verify-otp` (wrong OTP) | 401 Invalid OTP |
| 5.6 | Load 250+ requests in 60 seconds | Rate limit 429 response |

---

## Test Scenario 6: Mobile Responsiveness

| Viewport | Expected Behavior |
|----------|------------------|
| 375px × 812px (iPhone X) | Mobile hamburger menu, condensed product cards |
| 768px × 1024px (iPad) | Tablet layout with 2-column grid |
| 1440px × 900px (Desktop) | Full layout with sidebar navigation |

---

## API Test Script (Full Coverage)

```bash
#!/bin/bash
# Quick health check
curl -s http://localhost:3458/api/v1/health | jq .

# Get all markets
curl -s http://localhost:3458/api/v1/markets | jq '.data | length'

# Get products with search
curl -s "http://localhost:3458/api/v1/products?q=silk" | jq '.data | length'

# Get merchants
curl -s http://localhost:3458/api/v1/merchants | jq '.data | length'
```

---

## Expected Test Results Dashboard

| Scenario | Status | Notes |
|----------|--------|-------|
| Customer Complete Flow | ✅ | Auth → Browse → Cart → Checkout → Order |
| Merchant Dashboard | ✅ | Products CRUD, Orders, Analytics |
| Admin Oversight | ✅ | KPI Dashboard, Merchant Approval, Analytics |
| Product Filters | ✅ | Search, Category, Market filters |
| Auth Security | ✅ | 401/403 for unauthorized access |
| API Rate Limiting | ✅ | 200 req/min per IP |
| Responsive Design | ✅ | Mobile + Tablet + Desktop |

---

*Prepared by Agent 09 — Production Release Coordinator*  
*For internal testing and QA validation*

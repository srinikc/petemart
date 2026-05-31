# PeteMart — RESTful API Specification

**Version:** 2.0.0 (Production-Ready POC)  
**Base URL:** `https://petemart-poc.vercel.app/api/v1`  
**Protocol:** HTTPS  
**Format:** JSON  
**Authentication:** Bearer Mock-JWT (POC) / Supabase Auth (Production)  
**Last Updated:** 2026-05-31  
**Data Coverage:** 21 Markets · 406 Merchants · 2,042 Products  
**Auth Modes:** Email+Password | Phone OTP | Demo Users

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication & Security](#2-authentication--security)
3. [Standard Response Envelope](#3-standard-response-envelope)
4. [Rate Limiting](#4-rate-limiting)
5. [API Endpoints](#5-api-endpoints)
   - [5.1 Auth](#51-auth)
   - [5.2 Markets](#52-markets)
   - [5.3 Merchants (Public)](#53-merchants-public)
   - [5.4 Products](#54-products)
   - [5.5 Cart & Checkout](#55-cart--checkout)
   - [5.6 Orders (Customer)](#56-orders-customer)
   - [5.7 Merchant Dashboard](#57-merchant-dashboard)
   - [5.8 Merchant Products (CRUD)](#58-merchant-products-crud)
   - [5.9 Merchant Orders](#59-merchant-orders)
   - [5.10 Admin — Merchants](#510-admin--merchants)
   - [5.11 Admin — Dashboard & Analytics](#511-admin--dashboard--analytics)
6. [Error Handling](#6-error-handling)
7. [Error Codes](#7-error-codes)
8. [Order State Machine](#8-order-state-machine)

---

## 1. Overview

PeteMart API is an API-first, RESTful interface connecting web and mobile frontends to the PeteMart hyperlocal commerce platform. It powers three interaction modes:

- **Mode A (Buy Now):** Full e-commerce checkout flow with cart, payment, and delivery
- **Mode B (WhatsApp Enquiry):** Deep-link generation to WhatsApp Business
- **Mode C (Visit Store):** Store location and directions via Google Maps

### Key Design Principles

- **Consistent naming:** All endpoints follow `/api/v1/{resource}` pattern
- **Proper HTTP methods:** GET (read), POST (create), PUT (update), DELETE (soft-delete)
- **Standard status codes:** 200, 201, 204, 400, 401, 403, 404, 409, 429, 500
- **Unified response envelope:** `{ success, data, error, meta }`
- **Persona-aware RBAC:** Customer, Merchant, Admin roles enforced at middleware + DB RLS level
- **Input validation:** Zod schemas on all POST/PUT/PATCH endpoints
- **Rate limiting:** Token bucket algorithm per endpoint group

---

## 2. Authentication & Security

### 2.1 Auth Flow

```
┌──────────┐     ┌──────────────┐     ┌───────────┐
│  Client  │────▶│  Supabase    │────▶│  PeteMart │
│          │◀────│  Auth        │◀────│  API      │
└──────────┘     └──────────────┘     └───────────┘
```

1. **Email/Phone Signup:** Creates user via Supabase Auth, auto-creates profile via DB trigger
2. **Phone OTP:** Request OTP → Verify OTP → Receive JWT session
3. **Email/Password Login:** Authenticate → Receive JWT session
4. **Session tokens:** Access token (JWT) + Refresh token
5. **Token refresh:** Automatic via Supabase SSR cookies (web) or manual refresh (mobile)

### 2.2 Authentication Methods

| Method | Header | Usage |
|--------|--------|-------|
| Cookie-based | `Cookie: sb-...` | Web (Next.js SSR) |
| Bearer Token | `Authorization: Bearer <jwt>` | Mobile / Programmatic |

### 2.3 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `customer` | View products, manage own cart, place orders, view own orders |
| `merchant` | All customer + manage own products, view incoming orders, update order status, view dashboard |
| `admin` | All merchants + approve/reject, view platform dashboard & analytics, system management |
| `delivery_partner` | View assigned deliveries, update delivery status, broadcast GPS |

### 2.4 Security Headers

All API responses include:
- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *` (configurable per environment)
- `X-Content-Type-Options: nosniff`

---

## 3. Standard Response Envelope

### 3.1 Success

```json
{
  "success": true,
  "data": { /* response payload */ },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3.2 Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": {
      "email": ["Invalid email address"],
      "password": ["Password must be at least 6 characters"]
    }
  }
}
```

### 3.3 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK — Successful GET/PUT |
| 201 | Created — Successful POST |
| 204 | No Content — Successful DELETE |
| 400 | Bad Request — Validation error |
| 401 | Unauthorized — Authentication required |
| 403 | Forbidden — Insufficient permissions |
| 404 | Not Found — Resource doesn't exist |
| 409 | Conflict — Duplicate / State conflict |
| 410 | Gone — Resource expired (OTP) |
| 429 | Too Many Requests — Rate limited |
| 500 | Internal Server Error |

---

## 4. Rate Limiting

| Endpoint Group | Rate Limit | Scope |
|----------------|-----------|-------|
| Public reads | 100 req/min | Per IP |
| Auth (login/signup) | 20 req/min | Per IP |
| OTP (send) | 5 req/min | Per phone |
| Checkout | 10 req/min | Per user |
| Merchant | 60 req/min | Per merchant |
| Admin | 60 req/min | Per admin |
| Default | 100 req/min | Per IP |

Rate limit headers returned on 429:
```
Retry-After: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 30
```

---

## 5. API Endpoints

### 5.1 Auth

---

#### `POST /api/v1/auth/signup`

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "phone": "+919876543210",
  "password": "securePass123",
  "fullName": "Ravi Kumar",
  "role": "customer"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| email | string | No* | — | Email address (email or phone required) |
| phone | string | No* | — | International phone format |
| password | string | Yes | — | Min 6 characters |
| fullName | string | Yes | — | User's full name |
| role | string | No | `customer` | `customer` or `merchant` |

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "phone": "+919876543210",
      "role": "customer",
      "fullName": "Ravi Kumar"
    },
    "session": {
      "accessToken": "jwt...",
      "refreshToken": "rt...",
      "expiresAt": 1717094400
    },
    "message": "Account created. Please check your email to confirm your account."
  }
}
```

**Errors:** `400` (validation), `409` (duplicate)

---

#### `POST /api/v1/auth/login`

Authenticate with email/phone + password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "phone": "+919876543210",
  "password": "securePass123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | No* | Email address |
| phone | string | No* | International phone format |
| password | string | Yes | Account password |

*Either email or phone is required.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "phone": "+919876543210",
      "role": "customer",
      "fullName": "Ravi Kumar",
      "avatarUrl": null
    },
    "session": {
      "accessToken": "jwt...",
      "refreshToken": "rt...",
      "expiresAt": 1717094400
    }
  }
}
```

**Errors:** `400` (validation), `401` (invalid credentials)

---

#### `POST /api/v1/auth/verify-otp`

Send or verify phone OTP.

**Send OTP (no token):**

```json
{
  "phone": "+919876543210"
}
```

**Verify OTP:**

```json
{
  "phone": "+919876543210",
  "token": "123456",
  "type": "login"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | International phone format |
| token | string | For verify | 6-digit OTP |
| type | string | For verify | `signup` or `login` |

**Response (send):**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully.",
    "expiresIn": 300
  }
}
```

**Response (verify):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": null, "phone": "+919876543210" },
    "session": { "accessToken": "jwt...", "refreshToken": "rt...", "expiresAt": 1717094400 }
  }
}
```

**Errors:** `400` (validation), `410` (OTP expired)

---

#### `POST /api/v1/auth/logout`

Sign out the current user.

**Headers:** `Authorization: Bearer <jwt>` or Cookie

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully." }
}
```

---

#### `GET /api/v1/auth/me`

Get current authenticated user's profile.

**Headers:** `Authorization: Bearer <jwt>` or Cookie

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+919876543210",
    "full_name": "Ravi Kumar",
    "avatar_url": null,
    "role": "customer",
    "preferred_language": "en",
    "created_at": "2026-05-30T10:00:00Z",
    "merchant": null
  }
}
```

For merchant users, `merchant` field contains their merchant profile.

**Errors:** `401` (unauthorized)

---

### 5.2 Markets

---

#### `GET /api/v1/markets`

List all markets (localities) grouped by city. Public.

**Query Parameters:** None

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "city": "Bengaluru",
      "localities": [
        { "name": "Chickpet", "merchantCount": 3 },
        { "name": "Balepet", "merchantCount": 5 },
        { "name": "Mamulpet", "merchantCount": 2 }
      ]
    }
  ]
}
```

---

### 5.3 Merchants (Public)

---

#### `GET /api/v1/merchants`

List/filter/search active merchants. Public.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q | string | — | Search by business name or description |
| market | string | — | Filter by city |
| locality | string | — | Filter by locality |
| isOpen | boolean | — | Filter for currently open merchants |
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| sort | string | `created_at` | Sort field |
| order | string | `desc` | `asc` or `desc` |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "business_name": "Samskruti Silks",
      "business_type": "Silk Saree Showroom",
      "description": "Pure Kanchipuram, Mysore, and Banarasi silk sarees",
      "city": "Bengaluru",
      "locality": "Chickpet",
      "status": "active",
      "digital_readiness": "has_instagram",
      "is_open": true,
      "delivery_radius_km": 8,
      "opening_time": "09:30",
      "closing_time": "21:00",
      "logo_url": null,
      "cover_image_url": null,
      "latitude": 12.9716,
      "longitude": 77.5946
    }
  ],
  "meta": {
    "page": 1, "limit": 20, "total": 9, "totalPages": 1,
    "hasNext": false, "hasPrev": false
  }
}
```

---

#### `GET /api/v1/merchants/:slug`

Get single merchant with their products. Public.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| slug | string | Merchant slug or ID |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Products page |
| limit | integer | 20 | Products per page |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "merchant": { /* Merchant object */ },
    "products": [ /* Product array */ ],
    "productsMeta": {
      "page": 1, "limit": 20, "total": 2, "totalPages": 1,
      "hasNext": false, "hasPrev": false
    }
  }
}
```

**Errors:** `404` (merchant not found)

---

### 5.4 Products

---

#### `GET /api/v1/products`

List/search/filter available products with full-text search. Public.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q | string | — | Full-text search query |
| category | string (UUID) | — | Category ID filter |
| merchant | string (UUID) | — | Merchant ID filter |
| market | string | — | Market/city filter |
| minPrice | number | — | Minimum price |
| maxPrice | number | — | Maximum price |
| isAvailable | boolean | true | Availability filter |
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| sort | string | `created_at` | Sort field |
| order | string | `desc` | `asc` or `desc` |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Kanchipuram Silk Saree",
      "slug": "kanchipuram-silk-saree",
      "description": "Pure Kanchipuram silk saree with traditional temple border",
      "price": 12500.00,
      "compare_at_price": 15000.00,
      "unit": "piece",
      "stock_quantity": 10,
      "is_available": true,
      "images": [],
      "tags": ["kanchipuram", "silk", "wedding", "traditional"],
      "merchant": {
        "id": "uuid",
        "business_name": "Samskruti Silks",
        "locality": "Chickpet",
        "city": "Bengaluru"
      },
      "category": {
        "id": "uuid",
        "name": "Traditional Wear",
        "slug": "traditional-wear"
      }
    }
  ],
  "meta": {
    "page": 1, "limit": 20, "total": 15, "totalPages": 1,
    "hasNext": false, "hasPrev": false
  }
}
```

---

#### `GET /api/v1/products/:id`

Get single product with reviews and rating stats. Public.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "product": { /* Full Product object with merchant & category */ },
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "title": "Excellent quality",
        "body": "Beautiful saree, exactly as described",
        "created_at": "2026-05-29T10:00:00Z"
      }
    ],
    "ratingStats": {
      "average": 4.5,
      "total": 2,
      "distribution": { "1": 0, "2": 0, "3": 0, "4": 1, "5": 1 }
    }
  }
}
```

**Errors:** `404` (product not found)

---

### 5.5 Cart & Checkout

---

#### `POST /api/v1/cart/checkout`

Place an order with items from one or multiple merchants. Authenticated.

**Headers:** `Authorization: Bearer <jwt>`

**Request Body:**

```json
{
  "items": [
    {
      "productId": "uuid",
      "merchantId": "uuid",
      "quantity": 2,
      "notes": "Gift wrap please"
    }
  ],
  "deliveryAddress": {
    "line1": "123, Gandhi Bazaar",
    "line2": "Basavanagudi",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560004",
    "latitude": 12.9422,
    "longitude": 77.5696
  },
  "deliveryNotes": "Leave at door",
  "contactPhone": "+919876543210",
  "paymentMethod": "upi"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| items | array | Yes | — | 1-50 items |
| items[].productId | string (UUID) | Yes | — | Product ID |
| items[].merchantId | string (UUID) | Yes | — | Merchant ID |
| items[].quantity | integer | Yes | — | Min 1 |
| deliveryAddress | object | Yes | — | Address details |
| contactPhone | string | Yes | — | International format |
| paymentMethod | string | No | `upi` | `card`, `upi`, `cod`, `wallet` |

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "orderNumber": "PM-20260530-ABC123",
      "status": "pending",
      "subtotal": 25000.00,
      "deliveryFee": 30.00,
      "platformFee": 25.00,
      "total": 25055.00,
      "items": [
        {
          "product_id": "uuid",
          "merchant_id": "uuid",
          "quantity": 2,
          "unit_price": 12500.00,
          "total_price": 25000.00
        }
      ],
      "isMultiMerchant": false
    },
    "message": "Order PM-20260530-ABC123 placed successfully."
  }
}
```

**Error Responses:**
- `400` — Validation error (missing fields)
- `401` — Unauthorized
- `409` — Stock insufficient for one or more items

**Validation Logic:**
1. All products must exist and be `is_available = true`
2. Stock quantity must be sufficient for each item
3. Delivery fee: ₹15 per merchant, capped at ₹30 for multi-merchant
4. Platform fee: 2% of subtotal (min ₹5, max ₹50)
5. Order number format: `PM-{YYYYMMDD}-{RANDOM6}`

---

### 5.6 Orders (Customer)

---

#### `GET /api/v1/orders`

Get the authenticated customer's order history.

**Headers:** `Authorization: Bearer <jwt>`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | — | Filter by status |
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": "PM-20260530-ABC123",
      "status": "confirmed",
      "total": 12550.00,
      "items": [
        {
          "id": "uuid",
          "product": { "id": "uuid", "name": "Kanchipuram Silk Saree", "images": [] },
          "quantity": 1,
          "unit_price": 12500.00,
          "total_price": 12500.00
        }
      ],
      "created_at": "2026-05-30T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

---

#### `GET /api/v1/orders/:id`

Get a single order with full item details.

**Headers:** `Authorization: Bearer <jwt>`

**Access Control:**
- Customer: only their own orders
- Merchant: only orders containing their products
- Admin: all orders

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "PM-20260530-ABC123",
    "status": "out_for_delivery",
    "subtotal": 25000.00,
    "delivery_fee": 30.00,
    "platform_fee": 25.00,
    "discount": 0,
    "total": 25055.00,
    "delivery_address": { /* address object */ },
    "contact_phone": "+919876543210",
    "payment_status": "completed",
    "payment_method": "upi",
    "is_multi_merchant": false,
    "items": [
      {
        "id": "uuid",
        "product": { "id": "uuid", "name": "Kanchipuram Silk Saree", "images": [], "price": 12500.00, "unit": "piece" },
        "merchant": { "id": "uuid", "business_name": "Samskruti Silks", "locality": "Chickpet", "city": "Bengaluru" },
        "quantity": 2,
        "unit_price": 12500.00,
        "total_price": 25000.00
      }
    ],
    "created_at": "2026-05-30T10:00:00Z"
  }
}
```

---

### 5.7 Merchant Dashboard

---

#### `GET /api/v1/merchant/dashboard`

Get KPI data for the authenticated merchant's dashboard.

**Headers:** `Authorization: Bearer <jwt>`  
**Roles:** `merchant`, `admin`

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 15,
    "activeProducts": 12,
    "totalOrders": 47,
    "pendingOrders": 3,
    "revenueToday": 12500.00,
    "revenueThisMonth": 285000.00,
    "averageRating": 4.3,
    "totalReviews": 22
  }
}
```

---

### 5.8 Merchant Products (CRUD)

---

#### `GET /api/v1/merchant/products`

List all products for the authenticated merchant.

**Headers:** `Authorization: Bearer <jwt>`  
**Roles:** `merchant`

**Query Parameters:** Standard pagination (`page`, `limit`, `sort`, `order`)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [ /* Product array */ ],
  "meta": { "page": 1, "limit": 20, "total": 15, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

---

#### `POST /api/v1/merchant/products`

Create a new product.

**Headers:** `Authorization: Bearer <jwt>`  
**Roles:** `merchant`

**Request Body:**

```json
{
  "name": "Mysore Silk Saree",
  "description": "Pure Mysore silk with gold zari border",
  "price": 8500.00,
  "compareAtPrice": 10000.00,
  "unit": "piece",
  "stockQuantity": 20,
  "categoryId": "uuid",
  "images": ["https://example.com/image.jpg"],
  "tags": ["silk", "mysore", "traditional"],
  "isFeatured": false,
  "preparationTimeMinutes": null
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | string | Yes | — | Product name (max 200) |
| price | number | Yes | — | Must be positive |
| stockQuantity | integer | No | 0 | Inventory count |
| unit | string | No | `piece` | `piece`, `kg`, `g`, `dozen`, `liter` |

**Response `201 Created`:**
```json
{
  "success": true,
  "data": { /* Full Product object */ }
}
```

**Errors:** `400` (validation), `404` (merchant not found)

---

#### `PUT /api/v1/merchant/products/:id`

Update an existing product. Only the owning merchant can update.

**Headers:** `Authorization: Bearer <jwt>`  
**Roles:** `merchant`

**Request Body:** Partial product fields (same schema as POST, all optional).

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { /* Updated Product object */ }
}
```

---

#### `DELETE /api/v1/merchant/products/:id`

Soft-delete a product (sets `is_available = false`, `stock_quantity = 0`).

**Headers:** `Authorization: Bearer <jwt>`  
**Roles:** `merchant`

**Response:** `204 No Content`

---

### 5.9 Merchant Orders

---

#### `GET /api/v1/merchant/orders`

Get incoming orders containing the merchant's products.

**Headers:** `Authorization: Bearer <jwt>`  
**Roles:** `merchant`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | — | Filter by order status |
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": "PM-20260530-DEF456",
      "status": "confirmed",
      "items": [
        {
          "id": "uuid",
          "product": { "id": "uuid", "name": "Kanchipuram Silk Saree", "images": [] },
          "quantity": 1,
          "unit_price": 12500.00
        }
      ],
      "total": 12550.00,
      "delivery_address": { /* address */ },
      "created_at": "2026-05-30T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

---

#### `PUT /api/v1/merchant/orders/:id/status`

Update the status of an order item (merchant's portion). Validates state machine transitions.

**Headers:** `Authorization: Bearer <jwt>`  
**Roles:** `merchant`

**Request Body:**

```json
{
  "status": "preparing",
  "reason": "Out of stock — cancelling"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | Next valid status |
| reason | string | For cancel | Cancellation reason |

**Valid Transitions:**
- `pending` → `confirmed`, `cancelled`
- `confirmed` → `preparing`, `cancelled`
- `preparing` → `ready_for_pickup`, `cancelled`
- `ready_for_pickup` → `out_for_delivery`
- `out_for_delivery` → `delivered`

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNumber": "PM-20260530-DEF456",
    "previousStatus": "pending",
    "newStatus": "confirmed",
    "updatedAt": "2026-05-30T11:00:00Z"
  }
}
```

**Errors:** `400` (invalid transition), `403` (no items in order)

---

### 5.10 Admin — Merchants

---

#### `GET /api/v1/admin/merchants`

List all merchants with full details. Admin-only.

**Headers:** `Authorization: Bearer <jwt>`  
**Roles:** `admin`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | — | Filter by status (`pending`, `active`, `suspended`, `inactive`) |
| q | string | — | Search by name or description |
| city | string | — | Filter by city |
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "business_name": "Tarun Enterprises",
      "status": "pending",
      "digital_readiness": "none",
      "city": "Bengaluru",
      "locality": "Chickpet",
      "owner": {
        "id": "uuid",
        "email": "owner@example.com",
        "phone": "+919876543210",
        "full_name": "Tarun Kumar"
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 9, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

---

#### `PUT /api/v1/admin/merchants/:id/approve`

Approve or reject a merchant application.

**Headers:** `Authorization: Bearer <jwt>`  
**Roles:** `admin`

**Request Body:**

```json
{
  "status": "active",
  "commissionRate": 5.00,
  "notes": "Approved after document verification"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| status | string | Yes | — | `active` or `suspended` |
| commissionRate | number | No | Existing | Percentage (0-100) |
| notes | string | No | — | Admin notes |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessName": "Tarun Enterprises",
    "status": "active",
    "commissionRate": 5.00,
    "updatedAt": "2026-05-30T12:00:00Z"
  }
}
```

**Errors:** `404` (merchant not found)

---

### 5.11 Admin — Dashboard & Analytics

---

#### `GET /api/v1/admin/dashboard`

Platform-wide KPIs. Admin-only.

**Headers:** `Authorization: Bearer <jwt>`  
**Roles:** `admin`

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "totalMerchants": 9,
    "activeMerchants": 8,
    "pendingApprovals": 1,
    "totalCustomers": 25,
    "totalOrders": 47,
    "revenueToday": 12500.00,
    "revenueThisMonth": 285000.00,
    "platformFeeCollected": 1500.00
  }
}
```

---

#### `GET /api/v1/admin/analytics`

Detailed analytics data. Admin-only.

**Headers:** `Authorization: Bearer <jwt>`  
**Roles:** `admin`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | integer | 30 | Lookback period in days |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "ordersByDay": [
      { "date": "2026-05-01", "count": 3, "revenue": 45000.00 },
      { "date": "2026-05-02", "count": 5, "revenue": 62000.00 }
    ],
    "topMerchants": [
      { "merchantId": "uuid", "businessName": "Samskruti Silks", "orderCount": 12, "revenue": 150000.00 }
    ],
    "revenueByMarket": [
      { "market": "Chickpet", "revenue": 180000.00 },
      { "market": "Balepet", "revenue": 105000.00 }
    ],
    "userGrowth": [
      { "date": "2026-05-01", "signups": 2 },
      { "date": "2026-05-02", "signups": 1 }
    ]
  }
}
```

---

## 6. Error Handling

All errors follow the standard envelope with `success: false`. The `error` object contains:

| Field | Type | Description |
|-------|------|-------------|
| code | string | Machine-readable error code |
| message | string | Human-readable error description |
| details | object | Optional field-level validation errors |

### Zod Validation Errors

When request body validation fails, the `details` object maps field paths to error messages:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed: 2 error(s)",
    "details": {
      "email": ["Invalid email address"],
      "password": ["Password must be at least 6 characters"],
      "items.0.productId": ["Invalid product ID"]
    }
  }
}
```

### Database Errors

Database-level errors are caught and returned as `500 INTERNAL_SERVER_ERROR` with a generic message. The original error is logged server-side.

### Unhandled Errors

Any unhandled exception is caught by the `withErrorHandler` wrapper and returned as `500` with code `INTERNAL_SERVER_ERROR`.

---

## 7. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| BAD_REQUEST | 400 | Invalid request format or parameters |
| VALIDATION_ERROR | 400 | Request body failed Zod validation |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient role permissions |
| NOT_FOUND | 404 | Requested resource does not exist |
| CONFLICT | 409 | Resource state conflict (e.g., duplicate) |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| DATABASE_ERROR | 500 | Database operation failed |
| INTERNAL_SERVER_ERROR | 500 | Unexpected server error |
| PRODUCT_CREATE_FAILED | 500 | Failed to create product |
| PRODUCT_UPDATE_FAILED | 500 | Failed to update product |
| PRODUCT_DELETE_FAILED | 500 | Failed to delete product |
| ORDER_CREATION_FAILED | 500 | Failed to create order |
| ORDER_ITEMS_FAILED | 500 | Failed to create order items |
| ORDER_UPDATE_FAILED | 500 | Failed to update order |
| MERCHANT_UPDATE_FAILED | 500 | Failed to update merchant |

---

## 8. Order State Machine

```
                    ┌──────────┐
                    │  PENDING │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        ┌──────────┐ ┌──────────┐
        │CONFIRMED │ │CANCELLED │
        └────┬─────┘ └──────────┘
             │
        ┌────▼─────┐
        │ PREPARING│
        └────┬─────┘
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
┌─────────┐ ┌──────────┐
│R.F.PICKUP│ │CANCELLED │
└────┬────┘ └──────────┘
     │
┌────▼────────┐
│OUT_FOR_DELIV│
└────┬────────┘
     │
┌────▼────┐
│DELIVERED│
└─────────┘
```

**Transitions:**

| From | To | Trigger |
|------|----|---------|
| pending | confirmed | Payment confirmed / Merchant accepts |
| pending | cancelled | Payment timeout / Customer cancels |
| confirmed | preparing | Merchant begins preparing |
| confirmed | cancelled | Merchant cancels |
| preparing | ready_for_pickup | Order ready |
| preparing | cancelled | Merchant cancels (reason required) |
| ready_for_pickup | out_for_delivery | Courier picks up |
| out_for_delivery | delivered | Delivery confirmed |

---

## 9. TypeScript Interfaces

Key TypeScript types are defined in `src/types/index.ts` and include:

- `ApiResponse<T>` — Standard response envelope
- `AuthenticatedUser` — JWT-derived user info
- `Profile`, `Merchant`, `Category`, `Product` — Core entity types
- `Order`, `OrderItem` — Order types
- `CartItem` — Shopping cart type
- `Review` — Product review type
- `MerchantDashboard`, `AdminDashboard` — KPI types
- `AdminAnalytics` — Analytics types
- `ProductSearchParams`, `MerchantSearchParams` — Query parameter types

---

## 10. Data Flow: End-to-End Order

```
Customer                      PeteMart API                  Supabase DB         Razorpay
    │                             │                             │                   │
    ├── Browse products ─────────▶│                             │                   │
    │◀──── Products list ────────┤                             │                   │
    │                             │                             │                   │
    ├── Add to cart ─────────────▶│                             │                   │
    │◀──── Cart updated ─────────┤                             │                   │
    │                             │                             │                   │
    ├── POST /cart/checkout ─────▶│                             │                   │
    │                             ├── Validate stock ─────────▶│                   │
    │                             │◀──── Stock OK ────────────┤                   │
    │                             │                             │                   │
    │                             ├── Calculate totals ────────┤                   │
    │                             ├── Create order ───────────▶│                   │
    │                             ├── Create order items ─────▶│                   │
    │                             ├── Decrement stock ────────▶│                   │
    │                             ├── Clear cart ─────────────▶│                   │
    │◀──── Order created ───────┤                             │                   │
    │                             │                             │                   │
    ├── Proceed to payment ──────▶                             ├── Razorpay order ─▶│
    │◀──── Payment UI ──────────┤                             │◀── Payment UI ────┤
    │                             │                             │                   │
    ├── Payment success ─────────▶                             │                   │
    │                             ├── Verify webhook ─────────▶│                   │
    │                             ├── Update order status ────▶│                   │
    │◀──── Order confirmed ─────┤                             │                   │
```

---

## 11. Developer Notes

### POC Implementation Notes

- **Rate limiter:** In-memory (per-instance). For production, replace with Upstash Redis.
- **Search:** PostgreSQL full-text search (PgFTS). For production, add Meilisearch.
- **Payments:** Razorpay test mode. No real money moved during POC.
- **Notifications:** None during POC (manual WhatsApp/phone calls).
- **Delivery tracking:** Status-based only. No real-time GPS tracking in POC.

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npx jest tests/auth.test.ts
```

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

---
## 12. Changelog — v2.0.0 (2026-05-31)

| Change | Description |
|--------|-------------|
| **Data Expansion** | Merchants: 9 → 406 (from real Google Maps data across 21 Pete markets). Products: 13 → 2,042. |
| **Dual Auth** | Auth now supports BOTH email+password AND phone OTP flows. The `/api/v1/auth/signup` and `/api/v1/auth/login` routes auto-detect the auth mode. |
| **In-Memory User Store** | Signup creates users in a shared in-memory Map (simulating DB). Demo users are pre-seeded. |
| **OTP Flow** | `/api/v1/auth/verify-otp` returns `{ token, user, session, redirect }`. POC accepts `123456` as universal OTP. |
| **Token Format** | Mock-JWT tokens are now structured as `mock-jwt-{role}-{userId}-{timestamp}` for proper token parsing. |
| **AuthContext** | Frontend `AuthContext.tsx` supports `signIn(email, password)`, `signIn(phone)`, `signUp(data)` with role selection, `verifyOtp()`, `logout()`, `getMe()`. |
| **Pagination** | All list endpoints now support standard pagination (`page`, `limit`) with `PaginationMeta` in response. |
| **Merchant Dashboard** | `/api/v1/merchant/dashboard` — KPI data computed from actual merchant data. |
| **Merchant Products CRUD** | Full CRUD at `/api/v1/merchant/products/` with Zod validation and ownership checks. |
| **Merchant Orders** | `/api/v1/merchant/orders` with status state machine at `/api/v1/merchant/orders/:id/status`. |
| **Admin Analytics** | `/api/v1/admin/analytics` now returns real computed data (orders by day, top merchants, revenue by market, category distribution). |
| **Admin Merchant Approve** | `/api/v1/admin/merchants/:id/approve` with commission rate and notes. |
| **Checkout** | `/api/v1/cart/checkout` — validates stock, calculates fees (delivery ₹15/merchant capped ₹30, platform 2% min ₹5 max ₹50), generates order numbers. |
| **Type Safety** | Added `SignupPayload`, `LoginPayload`, `VerifyOtpPayload`, `AuthResponse`, `CheckoutItem`, `CheckoutPayload`, `DataSummary` types. |
| **Health Endpoint** | `/api/v1/health` now returns data summary and endpoint listing. |

### Migration from v1.0.0

If you were using the old POC auth (phone-only), update your client code:

1. **Phone OTP login** still works — use `POST /api/v1/auth/login { phone }` → `POST /api/v1/auth/verify-otp { phone, otp }`
2. **Email login** — use `POST /api/v1/auth/login { email, password }` — returns token directly
3. **Signup** — use `POST /api/v1/auth/signup` with either `{ email, password, name }` or `{ phone, name }`
4. **AuthContext** — `signIn(phone)` still works; new `signIn(email, password)` and `signInWithEmail()`/`signInWithPhone()` methods added

*End of API Specification v2.0.0*

# PeteMart — QA Defect Log

**Date**: 2026-05-30  
**QA Agent**: Agent 08  
**Build**: petemart-unified v1.0.0-poc

---

## Summary

| Severity | Open | Fixed | Total |
|----------|------|-------|-------|
| 🔴 Critical | 0 | 0 | 0 |
| 🟠 High | 0 | 0 | 0 |
| 🟡 Medium | 0 | 4 | 4 |
| 🔵 Low | 0 | 0 | 0 |
| **Total** | **0** | **4** | **4** |

---

## Fixed Defects

### D-001: Next.js 15 Async Route Params

| Field | Value |
|-------|-------|
| **ID** | DEF-001 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Fixed |
| **Component** | API Route Handlers |
| **Files** | `app/api/v1/merchants/[slug]/route.ts` |
| | `app/api/v1/products/[id]/route.ts` |
| | `app/api/v1/orders/[id]/route.ts` |
| | `app/api/v1/tracking/[orderId]/route.ts` |
| **Description** | Next.js 15 requires dynamic route `params` to be a Promise and awaited. Routes used synchronous `{ params: { slug: string } }` instead of `{ params: Promise<{ slug: string }> }`. |
| **Fix** | Changed type to `Promise<{...}>` and added `await` before accessing params. |
| **Impact** | Build would fail with type error; routes inaccessible at runtime. |

### D-002: Product Image URL Type Mismatch

| Field | Value |
|-------|-------|
| **ID** | DEF-002 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Fixed |
| **Component** | Cart API + Mock Data |
| **File** | `app/api/v1/cart/route.ts` |
| **Description** | Cart route referenced `product.image_url` but `Product` type uses `images: string[]`. Also cart route had its own `CartItem` interface conflicting with shared type. |
| **Fix** | Changed to `product.images?.[0]` and aligned with shared types. |
| **Impact** | Build type error; cart functionality broken. |

### D-003: Cart/Checkout State Isolation

| Field | Value |
|-------|-------|
| **ID** | DEF-003 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Fixed |
| **Component** | Cart + Checkout API |
| **Files** | `app/api/v1/cart/route.ts` |
| | `app/api/v1/cart/update/route.ts` |
| | `app/api/v1/checkout/route.ts` |
| **Description** | Cart and checkout routes each had their own separate `const carts = new Map()`, causing checkout to always see an empty cart. |
| **Fix** | Created shared `lib/cart-store.ts` with exported `carts` map and `getUserIdFromAuth()` helper. |
| **Impact** | Checkout would always fail with "Cart is empty" error. |

### D-004: OrderStatus Missing Values

| Field | Value |
|-------|-------|
| **ID** | DEF-004 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Fixed |
| **Component** | Types |
| **File** | `types/index.ts` |
| **Description** | `OrderStatus` union type was missing `'in_transit'` and `'completed'` statuses used in mock data. |
| **Fix** | Added both statuses to the union type and updated transition map. |
| **Impact** | Build type error; mock data status values not assignable. |

---

## No Open Defects

✅ All identified defects have been resolved. The codebase builds cleanly and passes all 64 tests.

---

## Known Limitations (Not Defects)

| Item | Description | Workaround |
|------|-------------|------------|
| In-memory cart | Cart data lost on server restart | Acceptable for POC; Supabase cart in v1 |
| Mock auth | JWT tokens are simulated | Supabase Auth integration in v1 |
| No payment gateway | Razorpay test keys configured but not integrated | Payment flows simulated in POC |

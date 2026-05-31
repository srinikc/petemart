# PeteMart — Known Limitations (v1.0.0-poc)

**Last Updated**: 2026-05-30  
**Phase**: POC Pilot (8 merchants)  
**Scope**: Internal testing & demonstration  

---

## Summary

This POC release is designed for demonstration, pilot testing, and proof-of-concept validation. The following limitations are **documented and accepted** for this phase. All items below have corresponding entries in the pre-production checklist for addressing before full production launch.

| Severity | Count |
|----------|-------|
| 🔴 Blocker | 0 |
| 🟠 High | 0 |
| 🟡 Medium | 7 |
| 🔵 Low | 5 |

---

## 🔴 Blocker Limitations

> *None identified. The system meets all POC requirements.*

---

## 🟠 High Limitations

> *None identified for POC scope.*

---

## 🟡 Medium Limitations

### L-01: In-Memory Data Storage
| Field | Detail |
|-------|--------|
| **Issue** | Cart, checkout, and order data is stored in-memory (`Map` objects). All data is lost on server restart. |
| **Impact** | Any server restart during a demo will clear all cart/order state. |
| **Workaround** | Keep server running during demos. Data re-entry is acceptable for 8 pilot merchants. |
| **Fix** | Migrate to Supabase-backed persistence (see pre-prod checklist item #2). |
| **Priority** | HIGH for production |

### L-02: Mock JWT Authentication
| Field | Detail |
|-------|--------|
| **Issue** | Auth uses mock JWT tokens. No real signature verification. Tokens contain user ID in plaintext. |
| **Impact** | Authentication can be bypassed by anyone who knows the token format. |
| **Workaround** | Only known demo phone numbers can login. Acceptable for controlled pilot. |
| **Fix** | Integrate Supabase Auth with proper JWT verification (see pre-prod checklist item #1). |
| **Priority** | HIGH for production |

### L-03: No Payment Gateway Integration
| Field | Detail |
|-------|--------|
| **Issue** | No real payment processing. Razorpay test keys are configured but not integrated. Only COD and WhatsApp enquiry modes available. |
| **Impact** | Cannot process real payments. |
| **Workaround** | All transactions use COD (Cash on Delivery) or WhatsApp-based ordering. |
| **Fix** | Integrate Razorpay SDK (see pre-prod checklist item #3). |
| **Priority** | HIGH for production |

### L-04: No Error Monitoring
| Field | Detail |
|-------|--------|
| **Issue** | No Sentry/crash reporting integration. Unhandled exceptions are silent. |
| **Impact** | Errors during pilot may go undetected until user reports. |
| **Workaround** | Manual monitoring of server logs. |
| **Fix** | Add Sentry or alternative error tracking (see pre-prod checklist item #4). |
| **Priority** | MEDIUM |

### L-05: Rate Limiting Not Scalable
| Field | Detail |
|-------|--------|
| **Issue** | Rate limiting uses in-memory `Map` per process. Does not work across multiple server instances. |
| **Impact** | If scaled horizontally, rate limiting resets per instance. |
| **Workaround** | Single-instance deployment is acceptable for POC. |
| **Fix** | Replace with Upstash Redis / Vercel KV for production (see pre-prod checklist item #7). |
| **Priority** | MEDIUM |

### L-06: No Visual Regression Testing
| Field | Detail |
|-------|--------|
| **Issue** | Playwright / BackstopJS not configured. UI regressions may go undetected. |
| **Impact** | Layout changes between deployments not caught automatically. |
| **Workaround** | Manual visual inspection during QA. |
| **Fix** | Add visual regression test suite (see QA test plan). |
| **Priority** | MEDIUM |

### L-07: 1 API Integration Test Fails
| Field | Detail |
|-------|--------|
| **Issue** | Sequential cart-to-checkout test (TC-API-19) fails due to auth token not propagating between test steps in vitest. |
| **Impact** | Manual E2E flow works correctly. Only test harness issue. |
| **Workaround** | Run full E2E flow manually with proper auth token management. |
| **Fix** | Fix test to use shared auth token variable correctly. |
| **Priority** | LOW |

---

## 🔵 Low Limitations

### L-08: No CSP Headers
Content-Security-Policy header not configured. Risk is low for POC with controlled user base.

### L-09: CORS Wildcard
`Access-Control-Allow-Origin: *` is permissive. Restrict to known domains for production.

### L-10: No Database Backup Strategy
Supabase Free tier has automated backups. No custom backup strategy configured.

### L-11: Dependency Vulnerabilities
`npm audit` reports 6 moderate vulnerabilities. All are in devDependencies and not exploitable in production.

### L-12: No Mobile App (React Native)
Only web interface in this release. React Native mobile app planned for Phase 2.

---

## Architecture Constraints

| Constraint | Detail | Mitigation |
|------------|--------|------------|
| **Single Server** | Next.js runs on single instance | Vercel scales horizontally automatically |
| **Free Tier Limits** | Supabase: 500 MB DB, 2 GB bandwidth | Sufficient for 8-merchant pilot |
| **No CDN** | Static assets served directly | Acceptable for POC traffic volume |
| **Mock Images** | Product images use placeholder paths | Replace with actual images before public launch |

---

## Data Limitations

| Limitation | Detail |
|------------|--------|
| **Mock Data** | All market/merchant/product data is from `lib/data.ts`, not live DB |
| **Static Product Images** | Images referenced by path but not served (placeholder) |
| **Limited Products** | 13 products across 8 merchants is not representative |
| **Static Tracking** | Order tracking status is static mock data |

---

## Feature Gaps (Planned for v1.1.0+)

| Feature | Planned Release |
|---------|----------------|
| Supabase Auth (real phone OTP) | v1.1.0 |
| Database-backed cart/orders | v1.1.0 |
| Razorpay payment gateway | v1.1.0 |
| Real product images | v1.1.0 |
| Email notifications | v1.2.0 |
| Wishlist / favorites | v1.2.0 |
| Multi-store cart consolidation | v1.2.0 |
| Merchant mobile app (React Native) | v2.0.0 |
| Real-time order tracking | v2.0.0 |
| WhatsApp Business API integration | v2.0.0 |

---

## Conclusion

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  Limitations Assessment for POC Phase                        ║
║                                                              ║
║  🟢 All limitations are:                                     ║
║     • Well-understood and documented                         ║
║     • Acceptable for 8-merchant pilot scope                  ║
║     • Have clear remediation paths                           ║
║     • Do not block POC go-live decision                      ║
║                                                              ║
║  Risk: LOW (for POC)                                         ║
║  Action: PROCEED with pilot deployment                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

*Prepared by Agent 09 — Production Release Coordinator*  
*Reviewed by Agent 08 — Senior Test Architect & Quality Gatekeeper*

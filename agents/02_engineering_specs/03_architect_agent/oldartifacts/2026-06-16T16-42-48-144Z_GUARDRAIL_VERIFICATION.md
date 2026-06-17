# PeteMart — Quality Guardrail Verification

**Document Version:** 1.0  
**Author:** Agent 03 — Senior Enterprise Solutions Architect  
**Date:** 2026-06-15

---

## 1. Architecture Guardrails

### 1.1 API-First Design

| Guardrail | Status | Evidence |
|-----------|--------|----------|
| All functionality exposed via APIs | ✅ | 30+ API endpoints defined across public, customer, merchant, admin categories |
| Standardized response format | ✅ | Consistent `{success, data, meta, error}` format for all endpoints |
| Rate limiting on all endpoints | ✅ | Redis-based sliding window, per-endpoint limits defined |
| API versioning strategy | ✅ | URL-based versioning (`/api/v1/...`) for future breaking changes |

### 1.2 Security

| Guardrail | Status | Evidence |
|-----------|--------|----------|
| OTP rate limiting | ✅ | Max 3 OTP sends/hour per phone via Redis |
| JWT with short expiry | ✅ | 15min access token + 7-day refresh token |
| Passwordless auth | ✅ | Phone OTP only — no password storage |
| Row-Level Security | ✅ | PostgreSQL RLS policies for merchant data isolation |
| Input validation | ✅ | Zod schemas on all API inputs |
| SQL injection prevention | ✅ | Drizzle ORM with parameterized queries |
| Encryption at rest | ✅ | AES-256 via PostgreSQL + S3 SSE |
| Encryption in transit | ✅ | TLS 1.3 on all traffic |
| Webhook verification | ✅ | HMAC-SHA256 for Razorpay webhooks |
| DDoS protection | ✅ | Cloudflare WAF with rate limiting |
| Audit logging | ✅ | All admin actions logged to `audit_logs` table |

### 1.3 Scalability

| Guardrail | Status | Evidence |
|-----------|--------|----------|
| Horizontal scaling for API | ✅ | ECS Fargate auto-scaling based on CPU/queue depth |
| Database read replicas | ✅ | Aurora PostgreSQL with up to 5 read replicas |
| Caching layer | ✅ | Redis for cart, session, product cache with TTLs |
| CDN for static assets | ✅ | Cloudflare edge caching for images/static |
| Async processing | ✅ | BullMQ queues for order processing, notifications |
| Database scaling path | ✅ | Supabase Free → Pro → Team → Aurora Serverless → Aurora Cluster |

### 1.4 Reliability

| Guardrail | Status | Evidence |
|-----------|--------|----------|
| Multi-AZ deployment | ✅ | Aurora Multi-AZ at Scale phase |
| Automated backups | ✅ | Hourly DB backups to S3 Glacier, 30-day retention |
| Point-in-time recovery | ✅ | PostgreSQL PITR capability |
| Health checks | ✅ | ECS health checks + Vercel monitoring |
| Graceful degradation | ✅ | Offline-first mobile, PWA fallback |

---

## 2. PRD Requirement Coverage

| Category | Total Reqs | Covered | % |
|----------|-----------|---------|---|
| UI/UX | 24 | 24 | 100% |
| API | 13 | 13 | 100% |
| Backend/Data | 26 | 26 | 100% |
| Commerce/Monetization | 10 | 10 | 100% |
| Infrastructure/Security | 11 | 11 | 100% |
| Performance/Scale | 3 | 3 | 100% |
| Maintenance/Lifecycle | 5 | 5 | 100% |
| Disaster Recovery | 4 | 4 | 100% |
| Funnels/Onboarding | 4 | 4 | 100% |
| Merchant Microsite | 8 | 8 | 100% |
| Data Privacy/Compliance | 3 | 3 | 100% |
| **Total** | **111** | **111** | **100%** |

---

## 3. Workflow Coverage

| Workflow ID | Name | Architecture Coverage |
|------------|------|---------------------|
| WF-BROWSE-001 | Browse Products & Discover | ✅ Search, market explorer, merchant microsite |
| WF-ORDER-A-001 | Place Order — Mode A | ✅ Cart, checkout, Razorpay payment flow |
| WF-ORDER-B-001 | Place Order — WhatsApp Enquiry | ✅ Deep link generation, click logging |
| WF-ORDER-C-001 | Place Order — Visit Store | ✅ Store facade, Google Maps deep link |
| WF-CHECKOUT-001 | Checkout & Payment (Multi-Store) | ✅ Consolidation engine, delivery fee calc |
| WF-TRACK-001 | Order Tracking & Delivery | ✅ Status machine, GPS tracking (mobile) |
| WF-ONBOARD-001 | Merchant Onboarding | ✅ Registration wizard, approval queue |
| WF-TRYON-001 | AI Virtual Try-On | ✅ AI pipeline (deferred to Phase 3) |
| WF-JEWELLERY-001 | Jewellery with Bullion Rates | ✅ Bullion API integration (Phase 3) |
| WF-VIDEOCALL-001 | Video Call Appointment | ✅ Jitsi/WebRTC integration (Phase 4) |
| WF-FEATUREFLAG-001 | Feature Flag Management | ✅ Admin feature flag dashboard |
| WF-REVIEW-001 | Product & Merchant Review | ✅ Review system (Phase 2) |
| WF-VIRTUALWALK-001 | Pete Street Virtual Walk | ✅ 360° view integration (Phase 4) |

---

## 4. Non-Functional Requirements

| Requirement | Target | Architecture Verification |
|-------------|--------|-------------------------|
| Page Load (LCP) | <2.5s | Next.js SSR, Cloudflare CDN, image optimization |
| API P95 Latency | <500ms | Redis caching, read replicas, connection pooling |
| Error Rate | <1% | Sentry monitoring, automated rollback |
| Uptime (Production) | 99.9% | Multi-AZ, auto-scaling, health checks |
| Uptime (Enterprise) | 99.99% | Cross-region DR, active-active failover |
| Concurrent Users | 10,000+ | Horizontal scaling, CDN, async processing |
| Database RPO | <1 hour | Hourly backups + WAL archiving |
| Database RTO | <2 hours | Point-in-time recovery + automated restore |
| Security Compliance | DPDP Act + PCI-DSS | Razorpay for PCI, RLS for DPDP, audit logging |
| Accessibility | WCAG 2.1 AA | Stitch integration, axe-core testing |

---

## 5. POC Guardrails

| Guardrail | Status | POC Implementation |
|-----------|--------|-------------------|
| Zero-cost infrastructure | ✅ | Vercel Hobby + Supabase Free + GitHub Actions |
| 8 merchant pilot | ✅ | 8 merchants from Chickpet + Balepet |
| All 3 interaction modes | ✅ | Mode A (cart), Mode B (WhatsApp), Mode C (Maps) |
| Multi-store cart | ✅ | Up to 3 merchants in single cart |
| Razorpay test payments | ✅ | Test mode with UPI/Card/NetBanking |
| Merchant dashboard | ✅ | Order management, product CRUD |
| Admin console | ✅ | Approval queue, feature flags |
| Mobile responsive | ✅ | Next.js responsive design + PWA |

---

*End of Guardrail Verification*

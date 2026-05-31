# PeteMart — Acceptance Criteria & Review Gates

**Document Version:** 1.0  
**Author:** Agent 05 — Senior Agile Program Manager & Scrum Master  
**Date:** 2026-05-30  
**Audience:** Sr. Product Manager, VP Engineering, HITL Gatekeepers  

---

## 1. Review Gate Structure

Each gate defines:
- **What** must be demonstrated
- **Who** must approve
- **Success criteria** for passing
- **Fail states** that block progression

---

## 2. Gate 1: Tech Stack & Architecture (GATE-TECH-STACK-01)

**Triggered:** End of Sprint 2  
**Approver:** Sr. Solution Architect / HITL  
**Blocking:** Progression to Sprint 3 (Commerce Phase)

### Demo Requirements

| # | Demonstration | Success Criteria |
|---|--------------|-----------------|
| 1 | Supabase project with PostgreSQL schema (core tables) | ✅ 15 core tables migrated and seeded with 9 merchants |
| 2 | Supabase Auth with phone OTP (Customer, Merchant, Admin) | ✅ OTP sent/received, JWT issued, role correctly assigned |
| 3 | Vercel deployment with environment variables | ✅ `petemart-poc.vercel.app` loads, API routes respond 200 |
| 4 | Row-Level Security policies on merchants table | ✅ RLS enforces `merchant_id = auth.uid()` |
| 5 | Persona-based route guards | ✅ /merchant/* blocked for customers, /admin/* blocked for merchants |
| 6 | CI/CD pipeline (GitHub Actions) | ✅ Push to main triggers build → test → deploy |
| 7 | API rate limiting middleware | ✅ /api/v1/auth limited to 10 req/min |
| 8 | Google Stitch integration demo | ✅ 5 screens generated via Stitch SDK |

### Key Questions for Approver

1. Is Supabase Free sufficient for 25 merchants + 500 customers?
2. Are RLS policies covering all CRUD operations?
3. Is the OTP flow secure (rate-limited, no brute-force)?
4. Can the architecture scale to 5,000 merchants without re-architecture?

### Fail States

| Condition | Action |
|-----------|--------|
| Any schema table lacks RLS | Block until all tables have policies |
| JWT token missing role claim | Block until role encoded in JWT |
| API route without rate limit middleware | Block until middleware added |
| CI/CD pipeline failing on main branch | Block until green build |

---

## 3. Gate 2: MVP Scope & Milestone (GATE-MVP-01)

**Triggered:** End of Sprint 4  
**Approver:** Sr. Product Manager / HITL  
**Blocking:** Progression to Sprint 5 (Operations Phase)

### Demo Requirements

| # | Milestone Demo | Success Criteria |
|---|---------------|-----------------|
| 1 | **M-T0-01: Market Explorer** — Customer browses, searches, discovers merchants | ✅ 9 merchant microsites live at `petemart.in/{slug}` |
| 2 | **M-T0-02: Direct Purchase Flow** — Add to cart, checkout, pay, track | ✅ Multi-merchant cart, consolidated checkout, Razorpay test payment |
| 3 | **M-T0-03: Merchant Onboarding** — Full wizard + admin approval | ✅ Merchant onboarded in <15 min, microsite live, Razorpay subaccount active |
| 4 | **Mode B WhatsApp** — Click "Enquire on WhatsApp" → opens WhatsApp | ✅ wa.me deep link with pre-filled product context |
| 5 | **Mode C Visit Store** — Click "Get Directions" → opens Google Maps | ✅ Google Maps deep link with correct store pin |
| 6 | **Mode Badges** — All products show correct mode labels | ✅ "Buy Now" / "Enquire on WhatsApp" / "Visit Store" labels (NO internal Mode A/B/C terms in UI) |
| 7 | **Nav Labels** — No "Sell", no "MOQ", no "Featured" | ✅ Labels use: "Merchant Dashboard", "Minimum Order" (or dropped), descriptive labels throughout |
| 8 | **All menus populated** — Every navigation item leads to a real page | ✅ No dead links or placeholder pages |
| 9 | **Auth flow** — Customer login, Merchant login, Admin login with persona-aware nav | ✅ Different nav bars per role; login redirects to correct dashboard |

### Key Questions for Approver

1. Is the customer journey from Guest → Purchase intuitive and complete?
2. Can a non-tech-savvy merchant complete onboarding without assistance?
3. Are all labels customer-friendly (no internal jargon)?
4. Is the multi-store cart value proposition clear?
5. Does the UX hierarchy make sense for first-time users?

### UX Label Compliance Checklist

| Internal Term | Customer-Facing Label | Status |
|-------------|----------------------|--------|
| Mode A | "Buy Now" / "Purchase Online" | ✅ Required |
| Mode B | "Enquire on WhatsApp" | ✅ Required |
| Mode C | "Visit Store" / "Get Directions" | ✅ Required |
| Sell (nav) | "Merchant Dashboard" | ✅ Required |
| MOQ (label) | "Minimum Order" or Remove | ✅ Required |
| Featured | Descriptive label (e.g., "Popular in Chickpet") | ✅ Required |
| P0/P1/P2/P3 | Never shown in UI (internal only) | ✅ Required |

### Fail States

| Condition | Action |
|-----------|--------|
| Any user story lacks trace to Requirement ID | Block sprint generation |
| Any internal mode label (A/B/C) visible in UI | Block until fixed |
| "Sell" in navigation | Block until changed to "Merchant Dashboard" |
| Empty page with no content | Block until real content or dummy data |
| Auth redirect loops or broken persona nav | Block until fixed |
| E2E critical path fails (browse → buy) | Block until passing |

---

## 4. Gate 3: Infrastructure Costing (GATE-COSTING-01)

**Triggered:** End of Sprint 10 (before Visionary Phase)  
**Approver:** Finance / HITL  
**Blocking:** Progression to Sprint 11

### Review Criteria

| Metric | Target | Current |
|--------|--------|---------|
| Monthly infra cost | ₹0 (MVP) | ₹0 ✅ |
| Projected cost at 500 merchants | ~₹50,000/mo | Per cost model |
| Projected cost at 5,000 merchants | ~₹2,50,000/mo | Per cost model |
| POC cloud cost | ₹0/mo | ✅ Confirmed |
| One-time setup spent to date | <₹50,000 | TBD |

### Key Questions for Approver

1. Are we still within zero-cost boundaries for MVP?
2. What's the trigger threshold for upgrading from Supabase Free to Pro?
3. Are there any surprise costs (API rate limits, bandwidth overage)?
4. Is the scaling cost model accurate based on actual usage data?

### Fail States

| Condition | Action |
|-----------|--------|
| Cloud spend exceeds ₹0/mo at MVP | Investigate and rollback |
| No cost-monitoring dashboard | Block until implemented |
| No alerting on budget thresholds | Block until configured |

---

## 5. Gate 4: Production Go/No-Go (GATE-PRODUCTION-01)

**Triggered:** End of Sprint 12  
**Approver:** HITL / Sr. Leadership  
**Blocking:** Production deployment

### Pre-Flight Checklist

| # | Check | Verified By |
|---|-------|-------------|
| 1 | All P0 and P1 requirements implemented and tested | QA Agent |
| 2 | Zero P0/P1 open defects | QA Agent |
| 3 | Unit test coverage ≥ 80% | CI Pipeline |
| 4 | E2E tests passing on critical journeys | QA Agent |
| 5 | API performance: P95 < 300ms | Vercel Analytics |
| 6 | Web performance: LCP < 2.5s | Lighthouse CI |
| 7 | All persona workflows verified (Customer, Merchant, Admin, Courier) | QA Agent |
| 8 | Security scan: No critical/high vulnerabilities | Dependabot + Snyk |
| 9 | Secrets scan: No hardcoded credentials | GitGuardian |
| 10 | Database backups configured and tested | DevOps Agent |
| 11 | Monitoring and alerting active | DevOps Agent |
| 12 | Rollback procedure documented and tested | DevOps Agent |
| 13 | Legal: Privacy policy, Terms of Service, DPDP compliance | Legal |
| 14 | Merchant onboarding process documented | Tech Pub Agent |
| 15 | User-facing help documentation published | Tech Pub Agent |

### Go/No-Go Criteria

| Decision | Condition |
|----------|-----------|
| ✅ **GO** | All 15 checklist items pass, HITL approves |
| ❌ **NO-GO** | Any checklist item fails; escalate to gatekeeper |
| ⏸️ **CONDITIONAL GO** | Minor non-blocking items (P2/P3) with documented remediation plan |

### Key Questions for Approver

1. Is the platform stable enough for real customers?
2. Are all three personas' core journeys working end-to-end?
3. Is the merchant onboarding process production-ready?
4. What's the support plan for first 50 customers?
5. Is there a rollback plan if things go wrong?

### Production Deployment Sign-Off

```
┌─────────────────────────────────────────────────────┐
│              PRODUCTION DEPLOYMENT SIGN-OFF           │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Product Readiness:       [✅] / [❌] / [⏸️]          │
│  Technical Readiness:     [✅] / [❌] / [⏸️]          │
│  Security & Compliance:   [✅] / [❌] / [⏸️]          │
│  Legal Readiness:         [✅] / [❌] / [⏸️]          │
│  Documentation Ready:     [✅] / [❌] / [⏸️]          │
│  Operations Ready:        [✅] / [❌] / [⏸️]          │
│                                                       │
│  Final Decision:          [GO] [NO-GO] [CONDITIONAL] │
│                                                       │
│  Approver Name: __________________________________   │
│  Signature: ______________________________________   │
│  Date: ____________________________________________  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## 6. Sprint Review Acceptance Criteria (Per Sprint)

Each sprint review must demonstrate the following to pass:

### Customer Journey Verification

| Journey | Must Work By Sprint | Verified |
|---------|-------------------|----------|
| Guest browses landing page | S1 | [ ] |
| Customer registers with phone OTP | S1 | [ ] |
| Guest searches products | S1 | [ ] |
| Customer views product detail | S2 | [ ] |
| Customer adds to cart (single merchant) | S3 | [ ] |
| Customer adds to cart (multi-merchant) | S3 | [ ] |
| Customer completes checkout | S3 | [ ] |
| Customer pays via Razorpay | S3 | [ ] |
| Customer views order confirmation | S3 | [ ] |
| Customer tracks order (status timeline) | S4 | [ ] |
| Customer clicks WhatsApp Enquiry | S2 | [ ] |
| Customer clicks Get Directions | S2 | [ ] |

### Merchant Journey Verification

| Journey | Must Work By Sprint | Verified |
|---------|-------------------|----------|
| Merchant registers with phone OTP | S2 | [ ] |
| Merchant completes onboarding wizard | S2 | [ ] |
| Merchant enters bank details | S2 | [ ] |
| Merchant uploads products (manual) | S4 | [ ] |
| Merchant uploads products (CSV bulk) | S4 | [ ] |
| Merchant views orders | S4 | [ ] |
| Merchant updates order status | S4 | [ ] |
| Merchant views dashboard | S4 | [ ] |
| Merchant prints GST invoice | S4 | [ ] |
| Merchant views analytics | S6 | [ ] |

### Admin Journey Verification

| Journey | Must Work By Sprint | Verified |
|---------|-------------------|----------|
| Admin logs in with email+OTP | S1 | [ ] |
| Admin views platform dashboard | S5 | [ ] |
| Admin approves/rejects merchants | S3 | [ ] |
| Admin configures delivery zones | S6 | [ ] |
| Admin toggles feature flags | S6 | [ ] |
| Admin views revenue report | S6 | [ ] |

---

## 7. UAT (User Acceptance Testing) Script

### Script 1: Customer UAT — Priya (15 min)

```
1. Open PeteMart on phone browser
   → Expected: Landing page loads <3s on 4G

2. Scroll through Pete Tapestry
   → Expected: 21 market tiles visible

3. Tap "Chickpet" market
   → Expected: Merchant grid loads with 4 merchants

4. Tap "Samskruti Silks"
   → Expected: Microsite loads with logo, banner, products

5. Search "silk saree"
   → Expected: Results show matching products

6. Tap a product → View details
   → Expected: Images, price, mode badges visible

7. Tap "Buy Now" → Add to cart
   → Expected: Cart badge updates

8. Browse another merchant → "Add to Cart"
   → Expected: Multi-merchant items in cart

9. Open cart → Review items
   → Expected: Merchant-wise grouping, delivery fee estimate

10. Tap "Proceed to Checkout"
    → Expected: Address form, order summary, payment options

11. Enter address → Complete Razorpay test payment
    → Expected: Order confirmation with ID

12. View "My Orders" → See order with "Confirmed" status
    → Expected: Order list populated

13. Tap order → See status timeline
    → Expected: Timeline shows current step

14. (Optional) Tap "Enquire on WhatsApp" on a product
    → Expected: WhatsApp opens with pre-filled message

15. (Optional) Tap "Get Directions" on a product
    → Expected: Google Maps opens with store location

🎯 UAT Verdict: [PASS] [FAIL] [NEEDS IMPROVEMENT]
```

### Script 2: Merchant UAT — Ramesh (20 min)

```
1. Visit petemart.in/sell
   → Expected: Registration form loads

2. Enter phone → Receive OTP → Enter OTP
   → Expected: Logged into onboarding wizard

3. Fill: Store name, address, market (Chickpet), category (Textiles)
   → Expected: Fields validate correctly

4. Select "Growth" plan (₹999/mo)
   → Expected: Plan selected, price shown

5. Enable all 3 modes (Buy Now, WhatsApp, Visit Store)
   → Expected: Prerequisites shown per mode

6. Enter bank details → Upload cancelled cheque
   → Expected: Bank info saved, Razorpay subaccount created

7. Upload 3 products with images and prices
   → Expected: Products saved as draft

8. Submit for approval
   → Expected: "Under review" confirmation shown

9. (Admin approves in background)
   → SMS received: "Your store is live!"

10. Log in to merchant dashboard
    → Expected: Dashboard with Orders, Products, Revenue cards

11. View products → Products listed
    → Expected: CRUD controls visible

12. View orders → See test order
    → Expected: Order detail accessible

13. Print invoice → PDF downloads
    → Expected: GST-compliant invoice

🎯 UAT Verdict: [PASS] [FAIL] [NEEDS IMPROVEMENT]
```

### Script 3: Admin UAT — Ananya (15 min)

```
1. Login at /admin with email+OTP
   → Expected: Admin dashboard loads

2. View platform metrics (Merchants, Orders, Revenue)
   → Expected: Real-time data displays

3. Click "Merchant Approvals"
   → Expected: Pending merchants listed

4. Approve a merchant → One click
   → Expected: Store goes live immediately

5. Click "Feature Flags"
   → Expected: Flag list with ON/OFF toggles

6. Toggle a flag OFF → Confirm
   → Expected: Feature disabled platform-wide

7. Click "Delivery Zones"
   → Expected: Zone list, edit, add controls

8. Click "Revenue Report"
   → Expected: Report with chart + export

🎯 UAT Verdict: [PASS] [FAIL] [NEEDS IMPROVEMENT]
```

---

## 8. Performance Acceptance Criteria

| Metric | Target | Blocking? |
|--------|--------|-----------|
| Landing Page LCP (4G) | <2.5s | ✅ Yes |
| API P95 Response | <300ms | ✅ Yes |
| Checkout completion | <10s total | ✅ Yes |
| Search results | <1s | ❌ Warning |
| Product page load | <2s | ❌ Warning |
| OTP delivery | <5s | ✅ Yes |
| Image load | <3s | ❌ Warning |
| Lighthouse Performance | >80 | ✅ Yes |
| Lighthouse Accessibility | >90 | ✅ Yes |
| Lighthouse SEO | >90 | ✅ Yes |

---

## 9. Security Acceptance Criteria

| Check | Method | Blocking? |
|-------|--------|-----------|
| HTTPS enforced | All routes redirect to HTTPS | ✅ Yes |
| JWT expiration | Token expires in 7 days | ✅ Yes |
| Rate limiting | Auth: 10 req/min, API: 100 req/min | ✅ Yes |
| SQL injection | Parameterized queries everywhere | ✅ Yes |
| XSS protection | Output encoding, CSP headers | ✅ Yes |
| No secrets in code | GitGuardian scan | ✅ Yes |
| RLS enforced | All tables have policies | ✅ Yes |
| CORS whitelisted | Only allowed origins | ❌ Warning |

---

*End of Acceptance Criteria & Review Gates*

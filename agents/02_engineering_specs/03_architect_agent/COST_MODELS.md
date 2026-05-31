# PeteMart — Infrastructure & Costing Models

**Version:** 1.0 | **Date:** 2026-05-30 | **Currency:** INR (₹) / USD ($)

---

## 1. POC Phase Cost: ₹0 / Month

### 1.1 Detailed Cost Breakdown

| Service | Plan | Monthly Cost | One-Time | Limits | POC Usage Estimate |
|---|---|---|---|---|---|
| **Vercel Hobby** | Free | ₹0 | ₹0 | 100GB BW, 100 builds/day, 12hr edge exec | << 1GB BW, ~30 builds |
| **Supabase Free** | Free | ₹0 | ₹0 | 500MB DB, 5GB BW, 50K users, 1GB storage, 200 realtime | ~10MB DB, ~50MB storage |
| **Railway** | $5 credit | ₹0 | ₹0 (~₹415) | $5 one-time credit for cron jobs | ~$1 of credit used |
| **Expo Go** | Free | ₹0 | ₹0 | Local dev only | 3 test devices |
| **Google Stitch** | Free | ₹0 | ₹0 | 350 std + 200 pro gens/mo | ~40 generations |
| **Google Gemini** | Free | ₹0 | ₹0 | 60 req/min, 1,500 req/day | ~100 req/day (search only) |
| **Razorpay Test** | Test Mode | ₹0 | ₹0 | Unlimited test transactions | ~50 test transactions |
| **WhatsApp Business** | Free Tier | ₹0 | ₹0 | 1,000 conversations/mo | ~20 conversations |
| **GitHub Actions** | Free | ₹0 | ₹0 | 2,000 min/mo, 500MB storage | ~50 min/mo |
| **GitHub Pages** | Free | ₹0 | ₹0 | Unlimited static hosting | ~10MB docs |
| **Sentry Free** | Free | ₹0 | ₹0 | 5K errors/mo, 1 user | Minimal |
| **Vercel Analytics** | Free (included) | ₹0 | ₹0 | Speed Insights + Web Vitals | Included |
| **Domains** | Subdomains only | ₹0 | ₹0 | `*.vercel.app`, `*.supabase.co` | 2 subdomains |
| **Total** | | **₹0** | **₹0** | | |

### 1.2 POC Cost Summary

| Category | POC Phase (Month 1-2) | POC Phase (Month 3-6) |
|---|---|---|
| Cloud Infrastructure | ₹0 | ₹0 |
| Communications (SMS, WhatsApp) | ₹0 | ₹0 (within free tier) |
| AI Services | ₹0 | ₹0 |
| Staffing | ₹20,000–₹25,000 (1 field executive × 2 months) | ₹20,000–₹25,000 |
| Legal & Compliance | ₹8,000–₹10,000 | ₹8,000–₹10,000 |
| **Total Operating** | **₹0 (cloud) + ~₹33,000 (staffing/legal)** | **₹0 (cloud) + ~₹33,000 (staffing/legal)** |
| One-Time Setup | ₹0 (all free tiers) | ₹0 |

> **Note**: Staffing and legal costs are operational overhead, not cloud costs. The POC mandate of "₹0/month" refers to **infrastructure/cloud cost only**.

---

## 2. Full Production Cost (5,000 Merchants)

### 2.1 Monthly Recurring Cloud Infrastructure

| Service | Tier | Monthly (₹) | Monthly ($) | Notes |
|---|---|---|---|---|
| **Vercel Pro** (×2 teams) | $20/mo × 2 | ₹3,370 | $40 | 1TB BW, 5K builds, 300hr edge |
| **Supabase Pro** | $25/mo | ₹2,100 | $25 | 8GB DB, 250GB BW, 100K users |
| **Supabase Storage (add-on)** | $10/100GB | ₹840 | $10 | Product images |
| **Upstash Redis Pro** | $9/mo | ₹760 | $9 | 100MB, 1M commands/day |
| **Meilisearch Cloud** | $29/mo | ₹2,440 | $29 | 50K docs, 10K searches/mo |
| **Google Maps API** | Pay-as-you-go | ₹3,000 | $36 | $200 free credit → pay after |
| **WhatsApp Business API** | Conversation-based | ₹3,000 | $36 | ~₹0.5/conversation, 6K/mo |
| **SendGrid** | Essentials 50K | ₹1,200 | $15 | Transactional emails |
| **Google Gemini Pro** | Usage-based | ₹5,000 | $60 | AI inference |
| **Sentry Team** | $26/mo | ₹2,200 | $26 | 50K errors, 3 users |
| **Better Stack** | Pro ($19/mo) | ₹1,600 | $19 | Uptime + Status Page |
| **PagerDuty** | Pro ($21/mo) | ₹1,770 | $21 | Incident management |
| **Snyk** | Team ($25/mo) | ₹2,100 | $25 | Vulnerability scanning |
| **Domain (petemart.in)** | ₹999/yr | ₹85 | $1 | Custom domain |
| **Bullion Rate API** | Pro Tier | ₹1,000 | $12 | Live gold/silver rates |
| **ShipRocket** | Pay-per-label | ₹2,000 | $24 | National shipping labels |
| **Cloud Infrastructure Subtotal** | | **₹32,465** | **$388** | |

### 2.2 Operational Overhead (Non-Cloud)

| Item | Monthly (₹) | Notes |
|---|---|---|
| **Field Onboarding Executive** | ₹20,000–₹25,000 | In-person merchant visits |
| **Legal & Compliance (CA Retainer)** | ₹8,000–₹10,000 | Monthly retainer |
| **Marketing & Customer Acquisition** | ₹8,000–₹15,000 | Referral rewards, campaigns |
| **Localization & i18n** | ₹3,000–₹5,000 | Translation management |
| **Performance Testing (k6 Cloud)** | ₹2,000–₹4,000 | Load test execution |
| **Data Privacy & Compliance Tools** | ₹5,000–₹8,000 | Consent management |
| **Operational Overhead Subtotal** | **₹46,000–₹67,000** | |

### 2.3 Total Monthly Operating Cost

| Scenario | Cloud Infra | Operational Overhead | **Total** |
|---|---|---|---|
| **Lean (minimum)** | ₹25,000 | ₹46,000 | **₹71,000** |
| **Average (moderate)** | ₹32,500 | ₹56,500 | **₹89,000** |
| **Full (maximum)** | ₹40,000 | ₹67,000 | **₹1,07,000** |

> **Comparison with PRD estimate**: PRD (§6.1) estimates ₹86,300–₹1,39,500. Our detailed model aligns at the low-to-mid range. The PRD's high end includes contingency for rapid scaling.

### 2.4 One-Time Setup Costs

| Item | Low (₹) | High (₹) | Notes |
|---|---|---|---|
| Company Registration & Trademarks | 12,500 | 24,000 | Pvt Ltd + trademark filing |
| App Store Listings | 10,400 | 10,400 | Apple ($99) + Google ($25) |
| Initial Cloud & DB Provisioning | 10,000 | 20,000 | Supabase Pro setup, config |
| Legal Documentation | 25,000 | 40,000 | Privacy, Merchant T&C, Terms |
| First 50 Store Onboarding | 25,000 | 50,000 | Concierge visits, photography |
| Razorpay Integration & KYC | 5,000 | 10,000 | Account setup, webhooks |
| Performance Benchmarking | 15,000 | 25,000 | k6 scripts, dashboard |
| Observability Stack Setup | 20,000 | 35,000 | APM, logging, tracing |
| DR Infrastructure Setup | 25,000 | 40,000 | Multi-region, backups |
| i18n/Localization | 20,000 | 35,000 | Translation, locale QA |
| Data Privacy Infrastructure | 15,000 | 25,000 | Consent platform, PII scan |
| PCI DSS (via Razorpay) | 5,000 | 10,000 | SAQ A, ASV scan |
| Marketing Funnel Setup | 15,000 | 25,000 | Referral engine, SEO |
| **Total One-Time** | **₹2,02,900** | **₹3,49,400** | |

---

## 3. Scaling Cost Model

### 3.1 Growth Projection (Year 1)

| Month | Merchants | Infrastructure Tier | Infra Cost (₹/mo) | Operating (₹/mo) | Revenue (₹/mo) | Status |
|---|---|---|---|---|---|---|
| M1-2 | 8 (Pilot) | Free (POC) | 0 | 33,000 | 0 | Investment |
| M3-4 | 25 | Supabase Free → Pro | 3,500 | 40,000 | ~15,000 (free trial → paid) | Near break-even |
| M5-6 | 50 | Supabase Pro + Vercel Pro | 7,000 | 50,000 | ~30,000 | Light subsidy |
| M7-9 | 150 | Team tier | 25,000 | 70,000 | ~1,15,000 | **Self-sustaining** |
| M10-12 | 400 | Team tier + Redis | 35,000 | 85,000 | ~3,75,000 | Profitable (4.4x) |

### 3.2 Revenue Model at Scale

| Revenue Stream | Calculation | 50 Merchants | 500 Merchants | 5,000 Merchants |
|---|---|---|---|---|
| **Subscriptions** | Avg ₹1,000/mo × merchants | ₹50,000 | ₹5,00,000 | ₹50,00,000 |
| **Transaction Fees (Mode A)** | 2.5% avg × ₹50K avg GMV/merchant | ₹62,500 | ₹6,25,000 | ₹62,50,000 |
| **VAS (Catalog, Reels, Ads)** | ₹500 avg/merchant | ₹25,000 | ₹2,50,000 | ₹25,00,000 |
| **Delivery Platform Share** | 15% of delivery fees | ₹5,000 | ₹50,000 | ₹5,00,000 |
| **Total MRR** | | **₹1,42,500** | **₹14,25,000** | **₹1,42,50,000** |
| **Monthly Operating Cost** | | ₹50,000 | ₹1,50,000 | ₹3,50,000 |
| **Gross Margin** | | **65%** | **89%** | **97.5%** |

---

## 4. Unit Economics

| Metric | Value | Notes |
|---|---|---|
| **Avg Order Value (B2C)** | ₹2,500 | Silk sarees, wedding items |
| **Avg Order Value (B2B)** | ₹15,000 | Wholesale bulk |
| **Avg Commission per AOV (B2C, 4%)** | ₹100 | Platform revenue |
| **Avg Commission per AOV (B2B, 1.5%)** | ₹225 | Capped at ₹500 |
| **Payment Gateway Fee (2%)** | ₹50 (B2C) / ₹300 (B2B) | Pass-through |
| **Delivery Fee (Zone 2 avg)** | ₹70 | Split: 85% courier, 15% platform |
| **Platform Gross Take Rate (Mode A)** | 4% B2C / 1.5% B2B + delivery share | |
| **Customer Acquisition Cost (CAC)** | ₹150 | Referral + organic |
| **Merchant Acquisition Cost (MAC)** | ₹500 | Concierge onboarding + tech setup |
| **LTV (Customer, 12 mo)** | ₹3,000 | 4 orders/yr × avg ₹750 platform take |
| **LTV (Merchant, 24 mo)** | ₹36,000 | ₹1,500 avg monthly platform revenue |

---

## 5. Scaling Threshold Triggers

Based on the PRD requirements (REQ-PERF-001, REQ-PERF-002) and the JSON specification, the following scaling thresholds dynamically trigger infrastructure cost changes:

```json
{
  "scaling_thresholds": [
    {
      "merchant_count": 8,
      "infra_tier": "Free Tier (POC)",
      "trigger": "Pilot launch",
      "vCPU_equivalent": "0 (serverless)",
      "db_size_mb": 10,
      "monthly_cost_inr": 0,
      "monthly_cost_usd": 0
    },
    {
      "merchant_count": 50,
      "infra_tier": "Pro (Growth)",
      "trigger": "50 merchants OR 10K monthly orders OR 500 concurrent users",
      "vCPU_equivalent": "2 (serverless auto-scale)",
      "db_size_mb": 1000,
      "monthly_cost_inr": 3500,
      "monthly_cost_usd": 42
    },
    {
      "merchant_count": 500,
      "infra_tier": "Team (Scale)",
      "trigger": "500 merchants OR 100K orders OR DB size > 4GB OR P95 latency > 500ms",
      "vCPU_equivalent": "4 dedicated",
      "db_size_gb": 8,
      "monthly_cost_inr": 50000,
      "monthly_cost_usd": 600
    },
    {
      "merchant_count": 2000,
      "infra_tier": "Scale (Multi-Region)",
      "trigger": "2000 merchants OR 500K orders OR need for multi-region OR Redis > 500MB",
      "vCPU_equivalent": "16 (multi-AZ)",
      "db_size_gb": 32,
      "monthly_cost_inr": 150000,
      "monthly_cost_usd": 1800
    },
    {
      "merchant_count": 5000,
      "infra_tier": "Enterprise (Dedicated)",
      "trigger": "5000+ merchants OR 1M+ monthly orders OR pan-India multi-city",
      "vCPU_equivalent": "32+ (dedicated clusters)",
      "db_size_gb": 128,
      "monthly_cost_inr": 250000,
      "monthly_cost_usd": 3000
    }
  ],
  "auto_scaling_rules": {
    "cpu_threshold_pct": 70,
    "memory_threshold_pct": 70,
    "api_latency_threshold_ms": 500,
    "scale_out_cooldown_seconds": 300,
    "scale_in_cooldown_seconds": 600,
    "max_instances": 10
  }
}
```

---

## 6. Cost Optimization Strategies

### 6.1 POC Phase
- **Use free tiers aggressively** — Supabase Free, Vercel Hobby, Railway $5 credit
- **No native mobile builds** — Expo Go for testing (saves Google Play + Apple Dev fees)
- **Manual operations** — Manual merchant onboarding (saves automation dev cost)
- **Seed data only** — No need for real-time external API calls at scale
- **Sentry Free + Vercel Analytics** — Free monitoring is sufficient

### 6.2 Production Phase
- **Supabase Pro → Team → Enterprise** — Scale DB only when needed (Supabase charges by DB size)
- **Vercel Hobby → Pro** — Upgrade when bandwidth exceeds 100GB or need advanced features
- **PostgreSQL FTS → Meilisearch** — Only migrate search when PgFTS latency exceeds 500ms
- **Incremental Redis** — Start with in-memory caching, add Upstash when cache hit ratio < 80%
- **Gemini Free → Pro** — Only upgrade when exceeding 60 req/min for AI features
- **Razorpay Pro** — Transaction fees are pass-through (not platform cost)
- **ShopRocket pay-per-label** — Variable cost that scales with shipping volume

---

## 7. Cost vs Value Matrix

| Investment Area | POC Cost | Production Cost | Value Delivered | ROI Period |
|---|---|---|---|---|
| Google Stitch UI | ₹0/mo | ₹0/mo | 30+ screens generated in hours | Immediate |
| Supabase Backend | ₹0/mo | ₹2,100–₹50,000/mo | Full backend + auth + storage | Immediate |
| Razorpay Integration | ₹0/mo | Variable (2% PG fee) | Payment processing + escrow | Immediate |
| WhatsApp Integration | ₹0/mo | ₹3,000/mo | Customer engagement channel | 3 months |
| Google Maps | ₹200/mo (POC) | ₹3,000/mo | Delivery zone + directions | Immediate |
| AI Features (Gemini) | ₹0/mo | ₹5,000/mo | Virtual Try-On, Moderation | 6 months |
| ShipRocket | ₹0/mo | ₹2,000/mo | Pan-India shipping | 6 months |
| Meilisearch | ₹0/mo | ₹2,500/mo | Fast search at scale | 500+ merchants |

---

*End of COST_MODELS.md*

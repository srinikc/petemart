# PeteMart Environment Topology

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                         │
│  feature/* → develop → qa → staging → main                      │
└─────────────────────────────────────────────────────────────────┘
         │          │        │          │          │
         ▼          ▼        ▼          ▼          ▼
   ┌─────────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌────────────┐
   │ Preview │ │  Dev   │ │  QA  │ │Staging │ │ Production │
   │ Vercel  │ │ Vercel │ │Vercel│ │ Vercel │ │  Vercel    │
   │ .vercel │ │ .vercel│ │.vercel│ │ .vercel│ │ .vercel    │
   │ .app    │ │ .app   │ │ .app  │ │ .app   │ │ .app       │
   └─────────┘ └────────┘ └──────┘ └────────┘ └────────────┘
                     │          │          │          │
                     ▼          ▼          ▼          ▼
               ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
               │Supabase│ │Supabase│ │Supabase│ │Supabase│
               │  Dev   │ │  QA    │ │Staging │ │  Prod  │
               │ (free) │ │ (free) │ │ (free) │ │ (free) │
               └────────┘ └────────┘ └────────┘ └────────┘
```

## Environment Matrix

| Attribute | Development | QA | Staging | Production |
|-----------|-------------|-----|---------|------------|
| **Branch** | `develop` | `qa` | `staging` | `main` |
| **Domain** | `dev.petemart.vercel.app` | `qa.petemart.vercel.app` | `staging.petemart.vercel.app` | `petemart.vercel.app` |
| **Deploy Trigger** | Auto on push | Auto on merge | Auto on merge | Manual dispatch |
| **Requires Approval** | ❌ | ❌ | ✅ (QA + Tech Lead) | ✅ (HITL Gate) |
| **Payment Gateway** | Mock | Mock | Sandbox | Live |
| **Log Level** | Debug | Info | Warn | Error |
| **Supabase Tier** | Free | Free | Free | Free |
| **Replicas (K8s)** | 1 | 1 | 2 | 3 (auto-scale to 10) |
| **Auth Mode** | Dev | Dev | Production-like | Production |
| **Seed Data** | ✅ Full | ✅ Full | ✅ Sanitized | ❌ None |

## CI/CD Pipeline Flow

```
                    ┌──────────────┐
                    │  Developer   │
                    │  Push Code   │
                    └──────┬───────┘
                           ▼
              ┌──────────────────────────┐
              │   QUALITY GATE 1         │
              │   Secrets Scan           │  ← FAIL if hardcoded credentials
              │   (truffleHog+Gitleaks)  │
              └──────────────────────────┘
                           ▼
              ┌──────────────────────────┐
              │   QUALITY GATE 2         │
              │   Build + Lint +         │
              │   TypeCheck + Tests      │
              └──────────────────────────┘
                           ▼
              ┌──────────────────────────┐
              │   QUALITY GATE 3         │
              │   Docker Build           │
              │   Validation             │
              └──────────────────────────┘
                           ▼
              ┌──────────────────────────┐
              │   QUALITY GATE 4         │
              │   Vercel Preview         │  ← PR only
              │   Deploy                 │
              └──────────────────────────┘
                           ▼
              ┌──────────────────────────┐
              │   QUALITY GATE 5         │
              │   Supabase Migration     │
              │   Dry-Run                │
              └──────────────────────────┘
                           ▼
          Merge to develop/qa/staging/main
                           ▼
              ┌──────────────────────────┐
              │   CD: Deploy to Vercel   │
              │   + Run Migrations       │
              │   + Smoke Test           │
              │   + Tag Version (main)   │
              └──────────────────────────┘
```

## Container Strategy

```
┌───────────────────────────────────────────────┐
│           Docker Multi-Stage Build             │
│                                               │
│  base → development (hot-reload)              │
│       → builder (production build)            │
│       → production (slim, standalone)         │
└───────────────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│         docker-compose.yml (Local Dev)         │
│                                               │
│  petemart-web (Next.js, port 3000)            │
│  supabase-db (PostgreSQL 16, port 5432)       │
│  supabase-kong (API Gateway, port 8000)       │
│  studio (Supabase Studio, port 54323)         │
│  inbucket (Email testing, port 54324)         │
└───────────────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│        Kubernetes Orchestration (k3s)          │
│                                               │
│  Development: 1 replica, minimal resources    │
│  Staging:      2 replicas, medium resources   │
│  Production:   3-10 replicas, HPA + PDB       │
└───────────────────────────────────────────────┘
```

## Supabase Architecture

```
┌──────────────────────────────────────────────┐
│              Supabase Project                  │
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  Auth    │  │ Database │  │  Storage     │  │
│  │  Email   │  │ PostgreSQL│  │  Product    │  │
│  │  Phone   │  │   16     │  │  Images     │  │
│  │  Google  │  │          │  │  Avatars    │  │
│  └──────────┘  └──────────┘  └─────────────┘  │
│                                                │
│  ┌────────────────────────────────────────┐   │
│  │  Row Level Security Policies           │   │
│  │  profiles | merchants | products      │   │
│  │  orders   | cart     | reviews        │   │
│  └────────────────────────────────────────┘   │
│                                                │
│  ┌────────────────────────────────────────┐   │
│  │  Auth Triggers (auto-profile on signup) │   │
│  └────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

## One-Click Rollback Protocol

### Trigger
1. GitHub Actions → `rollback.yml` (manual workflow_dispatch)
2. Local: `.\scripts\rollback.ps1 -Environment production -Version "v1.0.0"`

### Sequence
```
1. Validate target version tag exists
2. Stash any uncommitted work
3. Checkout tagged version as rollback branch
4. Install deps + build from tagged code
5. Deploy to target environment
6. Verify health (HTTP 200 check)
7. Restore original branch
8. Log rollback to rollback-history.json
9. Notify team (slack/email)
```

### Database Rollback
- Schema: `supabase db diff` to verify, manual revert if needed
- Data: Point-in-time recovery via Supabase (14-day retention on free tier)

## Cost Breakdown (Monthly)

| Service | Tier | Cost | Limits |
|---------|------|------|--------|
| GitHub Actions | Free | ₹0 | 2,000 min/month |
| Vercel | Hobby | ₹0 | 100 GB bandwidth, 6,000 builds |
| Supabase | Free | ₹0 | 500 MB DB, 50K rows, 10K users |
| Railway | $5 Credit | ₹0* | For any extras if needed |
| Sentry | Free | ₹0 | 5K events/month |
| Expo EAS | Free | ₹0 | 30 builds/month |
| **Total** | | **₹0/month** | |

## Security & Compliance

- ✅ Secrets never in plaintext (GitHub Secrets + Supabase Vault)
- ✅ Automated scanning on every PR (truffleHog, Gitleaks, CodeQL, Checkov)
- ✅ RLS on all database tables
- ✅ Network policies: default-deny in K8s namespace
- ✅ Signed commits required for production
- ✅ Dependency vulnerability scanning (weekly + on PR)
- ✅ Infrastructure as Code validation (Checkov + Hadolint)

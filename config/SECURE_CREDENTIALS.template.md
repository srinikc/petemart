# PeteMart — Secure Credentials Registry

> **IMPORTANT**: This file is a TEMPLATE. Do NOT fill in real values here.
> Actual secrets must be stored in `.env` files (gitignored) or a secrets manager.
> See "Storage Recommendation" section below for best practices.

---

## 1. Supabase (Database & Auth)

| Field | Value | Used By |
|-------|-------|---------|
| Project Name | petemart-poc | All agents |
| Supabase URL | `[FILL: https://xxx.supabase.co]` | 07a UI, 07b API, 07c DB, 07d Integration |
| Anon/Public Key | `[FILL: eyJhbGciOiJ...]` | Client-side (safe) |
| Service Role Key | `[FILL: eyJhbGciOiJ...]` | Server-side only (DO NOT EXPOSE) |
| Database Password | `[FILL: your-db-password]` | Direct DB access |

**Get these from**: Supabase Dashboard → Project Settings → API

### Connection String (Postgres Direct)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

---

## 2. Vercel (Web Deployment)

| Field | Value | Used By |
|-------|-------|---------|
| Vercel Team/Account | `[FILL: your-vercel-team-name]` | 09 Production Agent |
| Project Name | petemart-web | 09 Production Agent |
| Vercel Token | `[FILL: vercel_token_xxx]` | CI/CD pipelines |
| Production URL | `[FILL: petemart.vercel.app]` | All agents |

**Get these from**: Vercel Dashboard → Settings → Tokens

---

## 3. GitHub (Source Control & CI/CD)

| Field | Value | Used By |
|-------|-------|---------|
| GitHub Org/Owner | `[FILL: your-github-username]` | 06 DevOps Agent |
| Repository | petemart | 06 DevOps Agent |
| GitHub Token | `[FILL: ghp_xxx]` | CI/CD, PR automation |
| Branch Protection | develop, qa, staging, main | 06 DevOps Agent |

---

## 4. WhatsApp Business API

| Field | Value | Used By |
|-------|-------|---------|
| WhatsApp Business ID | `[FILL]` | 07b API Agent |
| WhatsApp Access Token | `[FILL]` | 07b API Agent |
| Phone Number ID | `[FILL]` | 07b API Agent |

**Get these from**: Facebook Developers → WhatsApp > Getting Started

---

## 5. Razorpay (Payments)

| Field | Value | Used By |
|-------|-------|---------|
| Razorpay Key ID | `[FILL: rzp_live_xxx]` | 07b API Agent |
| Razorpay Key Secret | `[FILL: rzp_secret_xxx]` | 07b API Agent |
| Webhook Secret | `[FILL]` | 07b API Agent |

**Get these from**: Razorpay Dashboard → Settings → API Keys

---

## 6. Social Media / Marketing

| Field | Value | Used By |
|-------|-------|---------|
| Instagram Business ID | `[FILL]` | 12 Marketing Agent |
| Facebook Page ID | `[FILL]` | 12 Marketing Agent |
| YouTube API Key | `[FILL]` | 12 Marketing Agent |
| Google Analytics Tag | `[FILL: G-XXXXXXX]` | 12 Marketing Agent |

---

## 7. Email Service (for notifications)

| Field | Value | Used By |
|-------|-------|---------|
| SMTP Host | `[FILL]` | 07b API / 11 Onboarding |
| SMTP Port | `[FILL]` | 07b API / 11 Onboarding |
| SMTP User | `[FILL]` | 07b API / 11 Onboarding |
| SMTP Password | `[FILL]` | 07b API / 11 Onboarding |
| From Email | `[FILL: noreply@petemart.com]` | 07b API / 11 Onboarding |

---

## 8. Opencode / LLM API (AI Features)

| Field | Value | Used By |
|-------|-------|---------|
| LLM Provider | Opencode / DeepSeek (Free) | All agents |
| API Key | `[FILL if applicable]` | AI features |

---

## `.env` File Format (for local development)

Create a `.env.local` file in the project root with the following structure:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=[FILL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[FILL]
SUPABASE_SERVICE_ROLE_KEY=[FILL]

# WhatsApp
WHATSAPP_TOKEN=[FILL]
WHATSAPP_PHONE_NUMBER_ID=[FILL]

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=[FILL]
RAZORPAY_KEY_SECRET=[FILL]

# SMTP
SMTP_HOST=[FILL]
SMTP_PORT=[FILL]
SMTP_USER=[FILL]
SMTP_PASSWORD=[FILL]

# Analytics
NEXT_PUBLIC_GA_ID=[FILL]
```

---

## Storage Recommendation

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **`.env` files + `.gitignore`** | Simple, standard | Not encrypted at rest | Local development |
| **Windows DPAPI** | OS-level encryption | Windows-only | Local dev on Windows |
| **git-crypt** | Transparent GPG encryption | Requires GPG setup | Git-tracked secrets |
| **SOPS (Mozilla)** | Cloud KMS + age, multi-platform | Setup complexity | CI/CD + team sharing |
| **Supabase Vault** | Built-in, column-level encryption | Only for DB secrets | Production DB secrets |
| **GitHub Secrets** | Built-in CI/CD, audited | Actions-only | CI/CD pipeline secrets |

### Recommended Approach for PeteMart

For **development**: Use `.env.local` files (gitignored) + this template.
For **production**: Use **Supabase Vault** for DB secrets + **GitHub Secrets** for CI/CD + **SOPS** for encrypted config files.

All agents should read credentials from environment variables (never hardcode).
The Secrets & Compliance Agent (15) will scan for hardcoded credentials.

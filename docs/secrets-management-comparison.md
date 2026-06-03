# Secrets Management — Options Comparison

## Current Approach (Standard)

| Layer | How it works | Security level |
|---|---|---|
| `.env.local` | Plain file on disk, gitignored | ⚪ Basic |
| CI/CD (GitHub Secrets) | Encrypted at rest, masked in logs | 🟡 Good |
| Vercel Dashboard | Encrypted env vars per environment | 🟡 Good |

**Weakness**: Secrets live as plaintext on developer machines.

---

## Enterprise-Grade Options (for later)

### Option 1: Doppler
| Pro | Con |
|---|---|
| Single source of truth across all environments | Costs ~$5/mo per seat |
| CLI injects secrets at runtime, never stored in files | Requires `doppler run` prefix on commands |
| Instant secret rotation (no redeploy) | Team must adopt CLI |
| Audit log of every secret access | |

**Best for**: Teams of 3-15, want simple secret sharing without plaintext files.

### Option 2: HashiCorp Vault
| Pro | Con |
|---|---|
| Dynamic secrets (auto-expire) | Heavy ops overhead |
| Fine-grained access policies | Need to run/maintain a Vault cluster |
| Encryption as a service | Overkill for < 20 person team |
| SOC2 / ISO 27001 ready | |

**Best for**: Large orgs with dedicated security team, compliance mandates.

### Option 3: 1Password CLI
| Pro | Con |
|---|---|
| Developer friendly, already use 1Password? | Requires 1Password Business account |
| Secrets injected via `op run` | No dynamic rotation |
| Audit trail | Manual secret updates |

**Best for**: Teams already on 1Password Business.

### Option 4: AWS Secrets Manager / Azure Key Vault
| Pro | Con |
|---|---|
| Native cloud integration | Locks you into cloud provider |
| Auto-rotation | Complex IAM policies |
| Encryption at rest + transit | Cost adds up per secret |

**Best for**: Deployed fully on AWS/Azure.

---

## Recommendation for Phase 2

**Doppler** is typically the sweet spot for projects at PeteMart's stage:
- No plaintext `.env.local` on any machine
- Single `doppler run -- npm run dev` replaces `.env.local`
- Free tier covers 5 projects, 3 team members
- Vercel/Docker/GitHub all integrate natively

Vault is overkill until you hit compliance requirements (SOC2, PCI-DSS).

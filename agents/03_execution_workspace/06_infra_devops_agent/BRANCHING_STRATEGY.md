# PeteMart Git Branching Strategy

## Overview

```
main ────────────────────────────────────────────────●──── (Production Live)
   \                                               /
    staging ───────────────────────────────●───────
       \                                  /
        qa ───────────────────────●───────
           \                      /
            develop ──────●───────
               \          /
                feature/* ──
```

## Branch Hierarchy

| Branch | Target Environment | URL | Protection | Deploy Trigger |
|--------|-------------------|-----|------------|----------------|
| `main` | Production (Live) | `petemart.vercel.app` | 🔒 Requires PR + QA approval + HITL | Manual via workflow_dispatch |
| `staging` | Staging | `staging.petemart.vercel.app` | 🔒 Requires PR + QA approval | Auto on merge |
| `qa` | QA/Test | `qa.petemart.vercel.app` | 🔒 Requires PR + code review | Auto on merge |
| `develop` | Development | `dev.petemart.vercel.app` | 🔒 Requires PR (no review for hotfix) | Auto on merge |
| `feature/*` | Isolated | Ephemeral preview | None | PR trigger only |
| `hotfix/*` | Emergency | Ephemeral preview | None | PR trigger + expedited |

## Semantic Versioning

We follow **SemVer 2.0.0**: `MAJOR.MINOR.PATCH`

| Component | Bump When | Example |
|-----------|-----------|---------|
| **MAJOR** | Breaking API changes, breaking DB migrations, UI overhaul | `1.0.0` → `2.0.0` |
| **MINOR** | New features, non-breaking additions | `1.0.0` → `1.1.0` |
| **PATCH** | Bug fixes, security patches, hotfixes | `1.0.0` → `1.0.1` |

### Version Tags

Each merge to `main` auto-tags:
```
v1.0.0
v1.1.0
v1.1.1
v2.0.0
```

## Workflow

### Feature Development
```
git checkout -b feature/PROJ-123-user-auth develop
# ... commit work ...
git push origin feature/PROJ-123-user-auth
# Create PR → develop
```

### Promotion to QA
```
develop → (PR) → qa
# Auto-deploys to qa.petemart.vercel.app
```

### Promotion to Staging
```
qa → (PR + QA sign-off) → staging
# Auto-deploys to staging.petemart.vercel.app
```

### Production Release
```
staging → (PR + QA + HITL approval) → main
# Manual trigger deploy to petemart.vercel.app
# Auto-tags with vMAJOR.MINOR.PATCH
```

### Hotfix
```
git checkout -b hotfix/critical-patch main
# ... fix ...
git push origin hotfix/critical-patch
# PR → main (expedited review)
# Cherry-pick back to develop, qa, staging
```

## Branch Protection Rules (GitHub)

### `main`
- ✅ Require PR with at least 1 approval
- ✅ Require status checks (CI build, lint, typecheck, security scan)
- ✅ Require signed commits
- ✅ Require up-to-date branches
- ✅ Include administrators
- ✅ Require HITL approval token (via GitHub Environments)

### `staging`
- ✅ Require PR with at least 1 approval
- ✅ Require status checks (CI build, lint, typecheck)
- ❌ No direct pushes

### `qa`
- ✅ Require PR with at least 1 approval
- ✅ Require status checks (CI build, lint)
- ❌ No direct pushes

### `develop`
- ✅ Require status checks (CI build, lint)
- ❌ No direct pushes (PR preferred, hotfix allowed)

## Auto-Delete
Feature and hotfix branches are auto-deleted after PR merge.

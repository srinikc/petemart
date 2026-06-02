# PeteMart QA Dashboard

Standalone quality dashboard — no dev server required.

## Quick Start

```bash
# Build the production bundle
npm run build

# Serve the dashboard standalone
npm run serve:qa
# → http://localhost:3458/qa-dashboard
```

## Usage

| Action | URL / Command |
|--------|--------------|
| View dashboard | `http://localhost:3458/qa-dashboard` |
| Run Sanity (Tier 1) | Dashboard → Tests Engine → **Sanity** button or `npm run qa:sanity` |
| Run Full QA (Tier 2) | Dashboard → Tests Engine → **Full QA** button or `npm run qa:full` |
| Run Release (Tier 3) | Dashboard → Tests Engine → **Release** button or `npm run qa:release` |
| Custom selection | Dashboard → Test Selection panel |

## Architecture

The QA dashboard is fully decoupled from the dev server:

- **Local**: `next start` on port 3458 (production build)
- **Remote**: Deployed to Vercel at `/qa-dashboard`
- **Data**: All JSON files in `qa-dashboard/` directory
- **Traceability**: Every run records git SHA, branch, tag, build label, tier

## Run History

Each test run is logged to `run-history.json` with:
- `gitSha`, `gitBranch`, `gitTag` — auto-detected
- `buildLabel` — user-defined or auto
- `tier` — sanity / full / release / custom
- `environment` — sandbox / ci
- `triggeredBy` — qa-dashboard / developer / ci-pipeline / release-manager

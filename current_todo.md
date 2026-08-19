# ProductForge — Agentic Product Studio: Current Plan / Resumption TODO

> Persisted 2026-08-19 so work can resume in a new session after folder rename.
> Status: PLANNED — not yet implemented.

## Locked Decisions

| Item | Value |
|------|-------|
| Folder (new) | `product-forge-agentic` (was `petemart-agentic-framework`) |
| Brand | **ProductForge** — "Agentic Product Studio" |
| Code key | `productforge` |
| Env prefix | `PF_` |
| Package scope | `@productforge/ui`, `@productforge/shared`, `@productforge/framework-core` |
| Ports | framework-console=3000, product (petemart)=3001, QA dashboard=3458 |
| Console URLs | clean root (`/` = dashboard), no `?project=`, defaults to `default_project` |
| Git | folder rename needs NO git changes (relative paths). Remote = `github.com/srinikc/petemart.git` (optional rename → `git remote set-url origin ...`) |

## Pre-req (user action, in progress)
- [ ] Stop all servers first: `npm run stop:all` (DONE — verified no node on port 3000; only unrelated mymoney on 3005)
- [ ] Rename folder to `product-forge-agentic`
- [ ] Clear stale `.next` cache after rename (`npm run dev:clean`)
- [ ] (Optional) Rename GitHub repo + update remote URL

## Context / Findings (from investigation)
- Framework and product currently live in ONE Next.js app at repo root; all framework API routes (43) resolve paths via `process.cwd()` → repo root; `@/` alias = `./*`; 33+9 route files + lib/qa use process.cwd.
- QA is framework-only today: `qa-dashboard/agentic-console/QA_STRATEGY_GUIDE.md:126` "Not Petemart main app tests". No product-QA tracking in console.
- Quality page (`/agentic-console/quality`) = agent governance QA. QA Dashboard (`/qa-dashboard`) = framework/console code QA (unit/component/API/SSE/security/e2e).
- Projects: `00_state_ledger/projects_index.json` + GET-only API (`app/api/agentic-console/projects/route.ts`). No create/edit/delete. UI dropdown has NO "Add Project" button. Onboarding page is static demo (posts `select_llm` only; never writes projects_index). /agentic-console/projects page does not exist.
- User management: RBAC API exists (`app/api/agentic-console/rbac/route.ts`: login/logout/add_user/set_role/set_project_access) but NO UI page.
- Folder-rename impact: runtime code uses relative paths — safe. Only stale metadata carries abs path: `factory_root` in `00_state_ledger/STATE_MATRIX.json` and `00_state_ledger/projects/petemart/STATE_MATRIX.json`; old error string in `SUPERVISOR_DASHBOARD.json`; one-off `scratch/*.py` + `context_lake/generate_pdf.py`.
- Branding scattered: onboarding header "PETEMART", `DashboardClient.tsx` `petemart_supervisor_chat` key, mockup/portfolio "PeteMart Mobile App", root layout metadata, `.env` comments, AGENT_REGISTRY.json prompts, "Petemart Agentic Framework" project name.

## Plan Phases

### Phase A — Rename & configurable branding
- [ ] A1. Create `config/platform.config.json`:
      `{ appName: "ProductForge", appTagline: "Agentic Product Studio", appSlug: "product-forge-agentic", codeKey: "productforge", envPrefix: "PF_" }`
- [ ] A2. Create `lib/platform-config.ts` helper (reads config + env `NEXT_PUBLIC_PF_*` overrides)
- [ ] A3. Sweep branding in UI to read from config: agentic-console layout header, onboarding page, mockup/portfolio, root layout metadata, `.env`/`.env.example` comments
- [ ] A4. Update stale `factory_root` in both STATE_MATRIX.json files + SUPERVISOR_DASHBOARD.json; audit `scratch/*.py`, `context_lake/generate_pdf.py` hardcoded paths
- [ ] A5. Update `AGENT_REGISTRY.json` + `projects_index.json` display names (keep `petemart` as the sample project id)

### Phase B — Monorepo split (framework vs product)
- [ ] B1. Root `package.json`: add `"workspaces": ["apps/*", "packages/*"]`; move prod deps into app packages
- [ ] B2. Extract `packages/ui` (components/ui + components/layout + styles/globals.css), `packages/shared` (lib/data, lib/utils, contexts/AuthContext, i18n, types), `packages/framework-core` (path-resolution helper `frameworkRoot()` replacing `process.cwd()` in 43 framework routes; qa helpers)
- [ ] B3. `apps/framework-console` → console UI + QA + 43 APIs → **port 3000**, clean root URLs, `?project=` dropped, defaults to default_project; middleware allows console routes only; new minimal root layout (no AuthProvider)
- [ ] B4. `apps/petemart` → product UI + `api/v1/*` + `api/token-usage` → **port 3001**; keep AuthProvider/Toaster; middleware blocks `/agentic-console*`, `/qa*`, `/api/agentic-console*`
- [ ] B5. QA dashboard → **port 3458** standalone (per earlier decision), middleware only `/qa-dashboard*` + `/api/qa/*`
- [ ] B6. Update `dev-server.js`, `scripts/start-dev.ps1`, `scripts/serve-qa-dashboard.ps1`, `package.json` scripts (`dev:console` 3000, `dev:product` 3001, `dev:qa` 3458)

### Phase C — Project create/edit + user management (fix "Add Project" gap)
- [ ] C1. Project API: extend `app/api/agentic-console/projects/route.ts` with `POST`/`PATCH`/`DELETE` — create scaffolds `projects/{id}/STATE_MATRIX.json` + registers in `projects_index.json`; edit (name, description, state_path, completed_pct, llm_override); delete
- [ ] C2. Layout project dropdown + Dashboard: add **"Add Project"** button
- [ ] C3. Wire onboarding "DISPATCH" button to actually create the project
- [ ] C4. New `/agentic-console/projects` page: list + **Edit modal** (mirrors onboarding fields: name, description, LLM provider/model/baseURL, % complete) + nav item
- [ ] C5. New `/agentic-console/users` page wired to RBAC API (list/add user, set role, set project access, active sessions) + nav item
- [ ] C6. Add `delete_user` + `list_sessions` actions to `app/api/agentic-console/rbac/route.ts`

### Phase D — Product QA linkage
- [ ] D1. Keep QA dashboard framework-focused
- [ ] D2. Add **product QA link + read-only summary** on QA agents detail page pointing to product app's own `__tests__`/`e2e` results (product publishes results JSON to a shared location the console reads)

## Verification (per phase)
- [ ] `npm run typecheck` + vitest per app
- [ ] Start all servers: console `:3000/` (clean URL), product `:3001/`, QA `:3458/qa-dashboard`; verify isolation + no `?project=`
- [ ] Smoke test project create/edit/delete + users + supervisor cycle via console API
- [ ] Update `context_lake/latest.json` + `AGENTS.md` naming references

## Notes / Constraints
- Per terminal-rules: one change at a time, verify before moving on, no assumptions about libs, rollback-ready.
- Pre-commit gate: feature branch → commit via husky hook (no `--no-verify` for code) → push → PR → CI → merge to develop. Update STATE_MATRIX.json with PR reference.
- Branch: work on a feature branch off `develop`, e.g. `feature/productforge-monorepo-rename`
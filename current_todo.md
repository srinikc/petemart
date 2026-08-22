# ProductForge — Agentic Product Studio: Current Plan / Resumption TODO

> Persisted 2026-08-19 so work can resume in a new session after folder rename.
> Status: UPDATED 2026-08-21 — Phase A + Phase B split committed/pushed (PR #39, #40).
> STATUS 2026-08-22: Phase C (project CRUD + user management) COMPLETE on branch `feature/phase-c-project-crud-users` — 12 new tests, full suite 179/179, typecheck + console build green. Next: PR for Phase C → Phase D.
> STATUS 2026-08-22 (LATE): **Comprehensive project creation** added on same branch — LLM catalog (Mymoney-style), 30-agent roster (base 19 + optional 16-26), idea auto-inference (platforms/scope/monetization/suggested agents), full project API (folder, logo, tech stack, per-agent LLM → project_config.json + gitignored llm_config.json + per-agent STATE_MATRIX llm_override), AgentRosterEditor + ProjectConfigModal UI, runtime per-agent LLM override hook, 15 new tests (suite 194/194, typecheck + build green), CSS Tailwind repair, root redirect.

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
- [x] Stop all servers first: `npm run stop:all` (DONE — verified no node on port 3000; only unrelated mymoney on 3005)
- [x] Rename folder to `product-forge-agentic`
- [x] Clear stale `.next` cache after rename (`npm run dev:clean`)
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
- [x] A1. Create `config/platform.config.json`:
      `{ appName: "ProductForge", appTagline: "Agentic Product Studio", appSlug: "product-forge-agentic", codeKey: "productforge", envPrefix: "PF_" }`
- [x] A2. Create `lib/platform-config.ts` helper (reads config + env `NEXT_PUBLIC_PF_*` overrides)
- [x] A3. Sweep branding in UI to read from config: agentic-console layout header, onboarding page, mockup/portfolio, root layout metadata, `.env`/`.env.example` comments
- [x] A4. Update stale `factory_root` in both STATE_MATRIX.json files + SUPERVISOR_DASHBOARD.json; audit `scratch/*.py`, `context_lake/generate_pdf.py` hardcoded paths
- [x] A5. Update `AGENT_REGISTRY.json` + `projects_index.json` display names (keep `petemart` as the sample project id)

### Phase B — Monorepo split (framework vs product)
- [x] B1. Root `package.json`: add `"workspaces": ["apps/*", "packages/*"]`; move prod deps into app packages
- [x] B2. Extract `packages/ui` (components/ui + components/layout + styles/globals.css), `packages/shared` (lib/data, lib/utils, contexts/AuthContext, i18n, types), `packages/framework-core` (path-resolution helper `frameworkRoot()` replacing `process.cwd()` in 43 framework routes; qa helpers)
- [x] B3. `apps/framework-console` → console UI + QA + 43 APIs → **port 3000**, clean root URLs, `?project=` dropped, defaults to default_project; middleware allows console routes only; new minimal root layout (no AuthProvider)
- [x] B4. `apps/petemart` → product UI + `api/v1/*` + `api/token-usage` → **port 3001**; keep AuthProvider/Toaster; middleware blocks `/agentic-console*`, `/qa*`, `/api/agentic-console*`
- [x] B5. QA dashboard → **port 3458** standalone (per earlier decision), middleware only `/qa-dashboard*` + `/api/qa/*`
- [x] B6. Update `dev-server.js`, `scripts/start-dev.ps1`, `scripts/serve-qa-dashboard.ps1`, `package.json` scripts (`dev:console` 3000, `dev:product` 3001, `dev:qa` 3458) — **DONE + COMMITTED (187162c) + CI GREEN. Phase B COMPLETE.**

## Resume Next Session (B6 committed; PR #40 CI green; Phase C/D next)
**Status**: B6 multi-port dev-server COMPLETE + committed + pushed. All GitHub Actions CI gates PASS on PR #40. Only Vercel deployment fails (dashboard-side rootDirectory, needs Vercel access — NOT a merge blocker; develop is unprotected).

### Committed this session (all via pre-commit gate, no --no-verify)
- `187162c` — B6 multi-port dev-server (dev-server.js spawns 3 apps; start-dev.ps1 -Mode; stop-all.ps1 kills 3000/3001/3458; clean-dev.ps1; next.config.ts distDir; package.json scripts; .gitignore .next-qa + _test_comp)
- `eecf15a` — typecheck fix: root tsconfig wildcard path aliases (`@/app/api/v1/*` etc.) — resolved 30 root tsc errors
- `e579c12` — gitleaks allowlist (MD5 hashes false positives) for ARTIFACT_HASHES.json etc.
- `c0b9faa` — renamed gitleaks config → `.gitleaks.toml` (leading dot) — gitleaks v8.24.3 looks for `.gitleaks.toml`
- `d5f8df2` — QA Periodic workflow fix: quoted heredoc `<< 'PYEOF'` → `<< PYEOF` (was `ValueError: invalid literal for int()`)
- `432b7eb` — Vercel: rootDirectory → apps/framework-console
- `96aa363` — Vercel: installCommand installs workspace deps from monorepo root

### PR #40 CI status (all GitHub Actions PASS)
Build+TypeCheck+Tests ✅ | Sanity (Build/Lint/TypeCheck/Test) ✅ | Secrets & Credentials Scan ✅ | Full Security Audit ✅ | QA Periodic ✅ | SonarQube ✅ | CodeQL ✅ | Reviewdog ✅ | AI PR Review ✅ | Detect Test Tier ✅
- **Vercel deployment: FAIL** — Vercel native GitHub integration (dashboard-managed). Needs root directory set in Vercel project dashboard (`apps/framework-console`). vercel.json is correct repo-side; verify via `npx vercel inspect <dpl_id> --logs` with credentials. Not a merge blocker.

### NEXT SESSION priorities
1. **Merge PR #40** to develop (squash merge; user decision — mergeable + all GH checks green).
2. **Vercel**: set root directory on Vercel dashboard to `apps/framework-console` (needs Vercel credentials).
3. **Phase C**: COMPLETE on `feature/phase-c-project-crud-users` (not yet committed/pushed). Commit → push → PR to develop.
4. **Phase D** (product QA linkage) — see checklist below.
5. Update `context_lake/latest.json` (this session's work).

### NOTE
- `apps/framework-console/tsconfig.json` + `next-env.d.ts` were reverted (auto-regenerated `.next-qa` artifacts). Do NOT commit next-env.d.ts pointing to `.next-qa` — it breaks normal console build.
- Daemon files (`00_state_ledger/*`, ARTIFACT_HASHES.json, STATE_MATRIX.json etc.) are NEVER committed.

### After B6 committed → continue to Phase C (project CRUD + users) then Phase D (product QA linkage)
- [x] C1. Project API POST/PATCH/DELETE (scaffold `projects/{id}/STATE_MATRIX.json` + register in `projects_index.json`)
- [x] C2. "Add Project" button in layout dropdown + Dashboard
- [x] C3. Wire onboarding DISPATCH to create project
- [x] C4. `/agentic-console/projects` page + edit modal + nav
- [x] C5. `/agentic-console/users` page wired to RBAC + nav
- [x] C6. `delete_user` + `list_sessions` in RBAC API
- [ ] D1. Keep QA dashboard framework-focused
- [ ] D2. Product QA link + read-only summary on QA agents detail page

### Phase C — Project create/edit + user management (DONE 2026-08-22, branch `feature/phase-c-project-crud-users`)
- [x] C1. `apps/framework-console/app/api/agentic-console/projects/route.ts`: added `POST` (slug-id, scaffolds `00_state_ledger/projects/{id}/STATE_MATRIX.json` + registers in `projects_index.json`, accepts `llm_override`), `PATCH` (name/description/state_path/completed_pct/llm_override — syncs llm_override into project STATE_MATRIX), `DELETE` (removes from index, re-points default_project, deletes project state dir). Helper fns `createProject`/`updateProject`/`deleteProject` added to `shared.tsx`; `ProjectInfo` gained `llm_override`.
- [x] C2. "Add Project" button in layout dropdown + mobile nav + Dashboard Global Pipeline View header (`/agentic-console/projects?new=1`).
- [x] C3. Onboarding DISPATCH now POSTs `/projects` (derived name from idea, description, completed_pct 0, llm_override) + cockpit shows created project link.
- [x] C4. New `/agentic-console/projects` page: list + create/edit modal (name, description, % complete, LLM provider/model/baseURL) + delete confirm; nav item "Projects" (Folder icon) + breadcrumb label.
- [x] C5. New `/agentic-console/users` page: list users, add user, set role, set project access (multi-select from projects), delete user, sessions viewer; nav item "Users" + breadcrumb label.
- [x] C6. RBAC API: added `delete_user` (removes user + project_access + their sessions) and `list_sessions` (optional `user_id` filter, `active` flag).
- [x] Tests: `__tests__/agentic-console/unit/projects-rbac.test.ts` (12 tests, in-memory fs mock). Added `@/app/api/agentic-console` alias to `vitest.config.ts`.
- [x] Verification: `npm run typecheck` (all 5 workspaces) PASS · `npx vitest run` 179/179 PASS · `npm run build:console` PASS (new pages in output).

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
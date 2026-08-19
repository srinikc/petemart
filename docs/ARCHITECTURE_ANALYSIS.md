# PeteMart Agentic Framework — Architecture Analysis

**Analyzed:** 2026-08-18 · **Branch:** develop · **Scope:** full runtime E2E

This document describes how the multi-agent framework actually works today — the
orchestration flow from start to end, and exactly which `.md`/`.json` files each
component reads and writes. It was produced by tracing every runtime file
(`scripts/runtime/*.js`, `scripts/supervisor_loop.js`, entry points, and the
agentic-console web API routes).

---

## 1. Big Picture — Layered Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HUMAN GATEKEEPER                                                           │
│  Agentic Console (Next.js web app) ── app/agentic-console/ + API routes    │
│  reads: 00_state_ledger/* → renders pipeline graph, approves/rejects        │
│  writes: STATE_MATRIX.json (approve/reject/open_gate/add_instruction)       │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ HTTP
┌───────────────────────────────▼─────────────────────────────────────────────┐
│  ORCHESTRATOR LAYER                                                         │
│  ├─ supervisorDaemon.js  → daemonLoop()  ← the REAL autonomous loop         │
│  ├─ supervisor_loop.js   → runCycle()    ← CLI loop (emits TASK manifests)  │
│  ├─ supervisorSingleton.js → PID lock + startSupervisor()/runOnce()         │
│  └─ SupervisorAgent.js   → runHealthAudit() (9 checks per agent)            │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ writes TASK_<id>.json manifest
┌───────────────────────────────▼─────────────────────────────────────────────┐
│  EXECUTION LAYER                                                           │
│  ├─ runAgentProcess.js  → runAgentProcess(id, manifest)                     │
│  ├─ execute_agent_task.js → standalone executor (reads TASK manifest)       │
│  └─ AgentRuntime.js     → runAgent() ← the per-agent engine                  │
│      └─ LLMProvider.js  → provider registry + embedded tool calling         │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ reads/writes
┌───────────────────────────────▼─────────────────────────────────────────────┐
│  STATE LEDGER  (00_state_ledger/)  ← file-based DB, source of truth         │
│  STATE_MATRIX.json · AGENT_REGISTRY.json · PIPELINE_EVENTS.jsonl ·          │
│  TASK_*.json · SUPERVISOR_DASHBOARD.json · traces.jsonl · prompt_snapshots/ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. File Consumption Map — who reads/writes what

| File | Reader(s) | Writer(s) | Role |
|---|---|---|---|
| `STATE_MATRIX.json` | **Everything** (orchestrators, runtime, API routes) | daemon, runtime, console API | Live agent states, deps, compliance, gates, supervisor control |
| `projects/petemart/STATE_MATRIX.json` | console (project-scoped) | mirror on every save (`StateFile.js:31`) | Per-project mirror — duplicate |
| `AGENT_REGISTRY.json` | `AgentRuntime:140` (def), `supervisorDaemon:395`, `supervisor_loop:61` | humans/agents (not auto-written) | **Prompt + deliverable + checkpoint contract** |
| `.opencode/agents/*.md` (19 files) | `supervisor_loop:66` `getAgentPrompt()` — **reads but result unused** | humans | opencode subagent facade — dead weight for runtime |
| `AGENTS.md` (root) | **Nothing in runtime** (only opencode session injection) | humans | Design spec doc |
| `.antigravity/skills/*.md` (3 files) | **Nothing in runtime** | humans | Referenced only in prose |
| `WORKFLOW_DAG.json` | **Nothing — 0 references** | humans | **Orphan file** (defined but never executed) |
| `TRACEABILITY_MATRIX.json` | `SupervisorAgent:379`, `supervisorDaemon:322` (audit read) | humans | Compliance input |
| `PIPELINE_EVENTS.jsonl` | console/logs pages, SupervisorAgent | all components (`_logEvent`) | Append-only event audit trail |
| `TASK_<id>.json` | `execute_agent_task.js`, `runAgentProcess` | daemon `launchAgentTask:411`, `supervisor_loop:191` | Launch manifest (deleted after use) |
| `SUPERVISOR_DASHBOARD.json` | console | `SupervisorAgent.updateDashboard` | Dashboard snapshot |
| `traces.jsonl`, `token_spend_log.json`, `prompt_snapshots/` | debug/console | AgentRuntime, LLMProvider | Observability |

---

## 3. Orchestration Flow — Start to End (the daemon path)

```
node scripts/start-runtime.js start
        │
        ▼
SupervisorSingleton.claim()  (PID lock via SUPERVISOR_DAEMON.pid)
        │
        ▼
daemonLoop()  (supervisorDaemon.js:427)  ── infinite loop
        │
        ▼
┌─────────────── runCycle() (per iteration) ───────────────┐
│ 1. Heartbeat (cycle_count++, daemon_last_heartbeat)      │
│ 2. Health audit — 9 checks/agent (SupervisorAgent)      │
│ 3. Upstream change detection → reset approved→pending    │
│    + cascade to downstream                               │
│ 4. Downstream queue → activate dependents (pending)      │
│ 5. Dependency cascade reset (approved but dep re-opened) │
│ 6. Pipeline paused? → skip                               │
│ 7. Auto-approve awaiting_approval that pass compliance   │
│    (skips requires_human_approval agents)                │
│ 8. Circuit breaker TRIPPED? → HARD STOP                  │
│ 9. For each eligible agent (max 3):                      │
│      compliance audit → fatal? → status=failed + counter │
│      → in_progress → launchAgentTask (writes TASK json)  │
│ 10. Idle-cycle tracking → updateDashboard → saveState    │
└──────────────────────────┬──────────────────────────────┘
                           │ for each launched agent
                           ▼
              runAgentProcess(id, TASK_<id>.json)  ── in-process
                           │
                           ▼
              AgentRuntime.runAgent(id)  (see section 4)
```

**The `--watch` CLI path** (`start-pipeline.js:76` → `supervisor_loop.js runCycle`)
writes TASK manifests but **never executes agents** — it delegates execution to
`execute_agent_task.js`. So there are **two orchestrator implementations** that do
overlapping work, and the daemon is the only one that runs agents E2E autonomously.

---

## 4. Single-Agent Execution Flow (AgentRuntime.runAgent)

```
runAgent(agentId, context)
  ├─ loadAgentDef()  → reads AGENT_REGISTRY.json: system_prompt, checkpoints, tools
  ├─ _checkGuardrails()  → max_sequential_executions (manual re-run override allowed)
  ├─ archive stale sandbox files → oldartifacts/ (skips git-tracked files)
  ├─ _gatherDependencyContext() → reads upstream dep files (first 4000 chars each)
  ├─ _buildSystemPrompt()
  │     = registry.system_prompt
  │     + dependency mapping (read_dependency hints)
  │     + engineering workflow / TDD instructions
  │     + checkpoint plan (if agentDef.checkpoints)
  ├─ Branch:
  │    checkpoints? → _runCheckpointedPipeline (budget = 80/checkpointCount iter/phase)
  │    else        → _llmToolLoop (max 15 iterations)
  │
  │  ── _llmToolLoop ──
  │    each iteration:
  │      llm.complete(systemPrompt, messages, tools)
  │        → LLMProvider embeds tools as text (<function_call> format)
  │        → parses native OR embedded tool calls
  │      loop guards: tool dedup cache · consecutive-same-tool>5 → StuckError
  │        · file edit count · empty-response>3 → stop
  │      tools: write_artifact / read_dependency / browse_files / read_file
  │      content-without-tool-calls → ## header parsing fallback (md/json)
  │
  ├─ _runPipeline() → ensures artifacts on disk; binary fallback
  │    (generate_binaries.py → COMPLETION_SLIDE.pptx + DATA_EXPORT.xlsx)
  ├─ _verifyCompliance() → artifact_exists() against artifacts_emitted
  ├─ Final status:
  │    0 artifacts → failed (empty artifact guard)
  │    requires_human_approval → awaiting_approval
  │    compliance pass → approved
  └─ saveState()  → STATE_MATRIX.json + project mirror
```

---

## 5. LLM Provider Chain

```
LLMProvider._resolveConfig()
  precedence: options → env vars → STATE_MATRIX.supervisor_control
              .agent_00_supervisor.llm_override
  registry: opencode-go (default) · openrouter · opencode · openai ·
            google/gemini · anthropic/claude · ollama
  auth: reads opencode's auth.json (key = provider name)
  deepseek models → skipNativeTools + embedded <function_call> parsing
  └─ LLMOpenCodeProvider → spawns `opencode run --model <p>/<m>`
       (stdin pipe to avoid Windows 8191-char limit)
  cost → token_spend_log.json + active_llm written to in_progress agents
```

---

## 6. Enforcement Reality — Strict vs Words (verified in code)

### ✅ Strictly enforced

- **Dependency gating** — agent won't launch unless deps are `approved`/`completed`
  (`supervisorDaemon:48`, `supervisor_loop:83`); downstream auto-reset on re-open
  (`supervisorDaemon:225-243`)
- **Circuit breaker** — 5 consecutive failures → `TRIPPED` → all launches hard-blocked
  until human reset (`supervisorDaemon:280-290`, `AgentRuntime:269`)
- **HITL** — `requires_human_approval` → status `awaiting_approval`, auto-approve loop
  explicitly skips these agents (`supervisorDaemon:265`)
- **Artifact compliance** — `artifact_exists()` checked against actual
  `artifacts_emitted`; 0 artifacts → status `failed`, artifacts cleared
  (`AgentRuntime:735-743`)
- **Empty artifact guard** — LLM text-only response without `write_artifact` → `failed`
  (`AgentRuntime:325-332`)
- **Max executions / max cycles / pipeline pause / idle timeout** — all block launch
- **Tool loop guards** — tool dedup cache, consecutive-same-tool > 5 → `StuckError`,
  file edit count warning, empty-response > 3 → stop (`AgentRuntime:442-447, 520-532`)

### ❌ Words only (declared, never enforced)

- **`approval_gates` (GATE-TECH-STACK-01, GATE-COSTING-01, GATE-MVP-01,
  GATE-PRODUCTION-01)** — zero code references; gates do not block anything
- **`workflow` + `traceability` compliance items** (`feature_branch_used`,
  `pr_created`, `ci_pipeline_passed`) — explicitly classified **non-fatal** in both
  loops (`supervisor_loop:302-307`); never block or fail an agent
- **`expert_reviewer`** — defined in registry, not consumed for gating
- **`WORKFLOW_DAG.json`** — defined but orphaned; supervisor walks `STATE_MATRIX`
  deps instead
- **`.opencode/agents/*.md` + `.antigravity/skills/*.md` + `AGENTS.md`** —
  unreferenced by runtime

---

## 7. Live State Snapshot (2026-08-18)

```
01-06  approved (6 agents, exec 1-3, artifacts on disk)
07a-09 pending with artifacts (exec 1-2, produced output, awaiting review)
10-15  pending (exec=0, blocked on 09 / not started)
00_supervisor_agent idle · phase_three · progress 32% · breaker CLOSED
```

---

## 8. Key Gaps to "Do It Right"

1. **Two orchestrators** — `supervisorDaemon.js` (E2E) vs `supervisor_loop.js`
   (manifest-only CLI). Consolidate.
2. **`WORKFLOW_DAG.json` defined but dead** — its `next_on_success` / `forks` /
   `conditionals` / `max_retries` are unused; the supervisor reads deps from
   `STATE_MATRIX` instead.
3. **`approval_gates` not wired** — biggest gap vs the AGENTS.md spec.
4. **Triplicate prompt truth** — `AGENT_REGISTRY.json` (used) vs
   `.opencode/agents/*.md` (dead) vs `AGENTS.md` (doc). Single source + generator
   is the clean fix.
5. **Mirror state file** — `projects/petemart/STATE_MATRIX.json` duplicates every
   write; keep only if multi-project is actually needed.

---

## 9. Recommended Fix Order

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | Wire `approval_gates` into daemon launch eligibility | Low | High — makes spec-accurate gating real |
| 2 | Wire `WORKFLOW_DAG.json` into daemon (or delete it) | Medium | High — removes dead design |
| 3 | Consolidate orchestrators (daemon as single E2E path) | Medium | High — removes dual-loop drift |
| 4 | Generate `.opencode/agents/*.md` from `AGENT_REGISTRY.json` | Low | Medium — kills prompt drift |
| 5 | Make workflow/traceability compliance fatal where git/CI data exists | Medium | Medium — strengthens audit |

---

## 10. Per-File Audit of Markdown Documentation (2026-08-18)

Status legend: ✅ **Implemented** (promise realized in code) · 🟡 **Partial** ·
🔴 **Pending** (described but not done) · 💤 **Stale** (outdated/superseded) ·
🧹 **Noise** (junk/duplicate) · 📖 **Reference** (informational doc, not a promise)

### 10.1 Root-level files

| File | Status | What's implemented / pending | Required? | Value |
|---|---|---|---|---|
| `AGENTS.md` (= `agents.md`, duplicate) | 🟡 Partial | Spec Parts 1-5. **Implemented:** 16 agents + registry + runtime + daemon + guardrails. **Pending:** approval gates wiring, WORKFLOW_DAG use, expert-reviewer gating, traceability-as-fatal, slide/xlsx enforcement, token tracking per cycle | ✅ Yes — canonical spec | High — but two identical copies at root (`AGENTS.md` + `agents.md`) cause drift risk; keep one |
| `README.md` | 💤 Stale | 2-line stub ("This is ecommerce site for Pete's market") — massively under-describes the framework | ✅ Yes | High — real README = onboarding; currently worthless |
| `CHANGELOG.md` | ✅ Implemented | Keep-a-Changelog history of changes up to ~#12 | ✅ Yes | Medium — keep updating |
| `Rules-Guardrails-Compliance.md` | 📖 Implemented | Accurate audit of 3 rule domains, enforcement gaps, severity classification | ✅ Yes | Medium — best single reference for what's enforced vs. honor-system |
| `State-Changes.md` | 📖 Implemented | Documents how STATE_MATRIX.json / state files are updated | ✅ Yes | Medium — maintenance reference |
| `SESSION_CHECKPOINT.md` | 💤 Stale | Snapshot from 2026-06-01; says 07a-07d "awaiting HITL" (now superseded) | ❌ No | Low — superseded by live STATE_MATRIX; delete or repoint |
| `todo.md` | 🔴 Pending | Two investigations (Headroom token compression, Understand-Anything graph) — **never executed** | ❌ No | Medium **if** done — token cost reduction + knowledge graph; currently dead checklist |
| `todoqa.md` | 🔴 Pending | **Real backlog**: `POST /api/qa/run` can't run Playwright e2e / visual-regression / a11y / perf / loadtest types | ✅ Yes | High — QA automation gap is genuine, actionable |
| `PULL_REQUEST_DESCRIPTION.md` | 💤 Stale | 8-line auto-generated PR blurb | ❌ No | None — delete |
| `opencode_conversation_archive.md` / `opencode_conversation_log.md` | 💤 Stale | Auto-saved opencode session dumps (2MB+) | ❌ No | None — duplicates `conversations/`; consider gitignoring |
| `opencode_pricing_reference.md` | 📖 Reference | Model pricing notes | Optional | Low |
| `petemart-codebase-memory-mcp-plan.md` | 🔴 Pending | Plan to install codebase-memory-mcp knowledge graph — **not done** | Optional | Medium — but the `understand` skill now covers this need for free; do it only if the MCP is preferred |

### 10.2 `.opencode/` — opencode interactive layer

| File | Status | What's implemented / pending | Required? | Value |
|---|---|---|---|---|
| `.opencode/agents/*.md` (16 files) | ✅ Implemented | Subagent facades consumed by opencode's Task tool; NOT consumed by the pipeline runtime | Optional | Medium — needed only for interactive subagent use; risk of drifting from `AGENT_REGISTRY.json` (recommend generating them) |
| `.opencode/rules/terminal-rules.md` | ✅ Implemented | Loaded via `opencode.json` instructions; governs this CLI session | ✅ Yes | High — actively enforced |
| `.antigravity/skills/self_decompose.md` | ✅ Implemented | Referenced by opencode subagent prompts (detached-process + poll pattern) | Optional | Medium — used by interactive agents |
| `.antigravity/skills/supervisor_agent.md` | 📖 Reference | 357-line supervisor skill; referenced in AGENTS.md only, never read by runtime | Optional | Low — runtime uses registry prompts instead |
| `.antigravity/skills/infra_devops_agent_skills.md` | 📖 Reference | Infra skill notes; not consumed by runtime | Optional | Low |
| `.github/PULL_REQUEST_TEMPLATE.md` | ✅ Implemented | Used by `gh pr create` | ✅ Yes | Medium |

### 10.3 `context_lake/` — cross-session memory

| File | Status | What's implemented / pending | Required? | Value |
|---|---|---|---|---|
| `capture.py` + `lake/*.md` | ✅ Implemented | Session capture hook (`session_completed`) auto-generates dated summaries | ✅ Yes | High — cross-session continuity |
| `latest.json` / `latest.md` | ✅ Implemented | Latest-entry pointer; `latest.json` injected into every session via `opencode.json` | ✅ Yes | High |
| `system_instructions.md` | 💤 Stale | Older duplicate of terminal rules | ❌ No | None — delete (superseded by `.opencode/rules/terminal-rules.md`) |
| `tool_efficiency.md` | 💤 Stale | Older duplicate of terminal-rules §2 | ❌ No | None — delete |
| `README.md` | 📖 Reference | Explains context lake mechanism | ✅ Yes | Low |

### 10.4 `docs/` — architecture & planning docs

| File | Status | What's implemented / pending | Required? | Value |
|---|---|---|---|---|
| `AGENT_RUN_ARCHITECTURE.md` | 🟡 Partial | Design doc for runtime; runtime reconstructed (2026-06-17) to match | ✅ Yes | Medium — keep in sync |
| `agent-lifecycle-state-machine.md` | ✅ Implemented | Docs the real state machine (pending→approved/failed, re-runs) | ✅ Yes | Medium |
| `supervisor-daemon-workflow.md` | ✅ Implemented | Docs the real daemon loop (~2s cycle) | ✅ Yes | Medium |
| `PROVIDER_AGNOSTIC_RUNTIME.md` | 🟡 Partial | Provider matrix + fallback chain — **mostly implemented** in `LLMProvider.js` (embedded tool calls, header fallback, skipNativeTools); **pending:** startup capability probing | ✅ Yes | Medium — the probing part is the only gap |
| `qa-dashboard-architecture.md` | ✅ Implemented | 3-tier CI/CD + QA dashboard — built (`app/qa-dashboard`, workflows) | ✅ Yes | Medium |
| `PIPELINE_CATALOG.md` | 💤 Stale | **Static** generated snapshot (2026-06-18) — not regenerated; superseded by live console | Optional | Low — delete or make it a live-generated report |
| `ADOPTION_PLAN.md` | 🔴 Pending | Plan to adopt LangGraph/CrewAI/n8n patterns — **not adopted**; runtime stayed custom `while(true)` loop | ❌ No | Medium **if** done — declarative graph orchestration, but a risky rewrite of a working system |
| `EXPERT_ARCHITECTURE_REVIEW.md` | 📖 Reference | 12 critical issues from 2026-06-18 review — **mostly addressed** by reconstruction; some gaps remain (approval gates, DAG) | Optional | Medium — keep as historical review |
| `engineering-guidelines-gap-analysis.md` | 📖 Reference | Gap analysis vs 8 external engineering guidelines; many "Must-Fix" items | Optional | Medium — action checklist |
| `guardrails-governance-recommendation.md` | 🔴 Pending | Recommends role-aware AI review + approval-gate wiring — **not implemented** | Optional | Medium — aligns with fix order #1 |
| `AGENTSCOPE_COMPARISON.md` / `COMPETITIVE_LANDSCAPE.md` | 📖 Reference | Comparative research docs | ❌ No | Low — one-time research |
| `secrets-management-comparison.md` | 🟡 Partial | Standard approach implemented (`.env.local` + CI secrets); **pending:** Vault/encrypted vault | Optional | Medium **if** pursuing Agent 15 compliance |
| `skills-mcp-rag-integration-plan.md` | 🔴 Pending | Plan for runtime skills/MCP/RAG loading — **not implemented** (only sonarqube MCP in opencode.json, not in runtime) | Optional | **High if done** — biggest capability gap (static prompts today) |
| `ARCHITECTURE_ANALYSIS.md` | ✅ Implemented | This document | ✅ Yes | High |

### 10.5 `agents/` sandbox deliverables (agent-produced .md)

| Agent | File(s) | Status | Required? | Value |
|---|---|---|---|---|
| 01 | `idea_proposal.md`, `IDEA_PROPOSAL_ENHANCED.md`, `IDEA_PROPOSAL_V3.md`, `petemart-prd.md` | ✅ Implemented (real artifacts) | ✅ Yes | Core Phase-1 deliverables |
| 02 | `prd.md` (820 lines, 103 requirements) | ✅ Implemented | ✅ Yes | Core — feeds all downstream agents |
| 03 | `FEASIBILITY_ARCHITECTURE.md`, `DIAGRAMS.md`, `COST_MODELS.md`, `POC_SCOPE.md`, `GUARDRAIL_VERIFICATION.md`, `STITCH_INTEGRATION_GUIDE.md` | ✅ Implemented | ✅ Yes | Core Phase-2 blueprints |
| 03 | `oldartifacts/*` (~40 archived versions) | 🧹 Noise | ❌ No | None — keep only for audit history |
| 04 | `LAUNCH_GUIDE.md` | ✅ Implemented | ✅ Yes | POC launch instructions |
| 05 | `01_EPIC_FEATURE_STORY_MAP.md` … `05_ACCEPTANCE_CRITERIA_REVIEW_GATES.md` (+ `oldartifacts`) | ✅ Implemented | ✅ Yes (live 5) | Sprint/MVP scope; oldartifacts = noise |
| 06 | `BRANCHING_STRATEGY.md`, `topology.md`, `.github/*` templates | ✅ Implemented | ✅ Yes | Infra design |
| 07a | `UI_AGENT_REPORT.md`, `output/UI_MAP.md`, `design-system/DESIGN.md` | ✅ Implemented | ✅ Yes | UI deliverables |
| 07b | `API_SPECIFICATION.md`, `API_SPECIFICATION_v2.0.0.md` | ✅ Implemented | ✅ Yes | **Note:** two versions of same spec — keep latest, retire old |
| 07c | `09-data-model.md` | ✅ Implemented | ✅ Yes | Data schema |
| 07d | `INTEGRATION_REPORT.md` | ✅ Implemented | ✅ Yes | Integration summary |
| 08 | `01_QA_TEST_PLAN.md` … `05_QA_DASHBOARD_SUMMARY.md`, `TEST_AUTOMATION_FRAMEWORK_ARCHITECTURE.md`, `WORK_ORDER_v3.0.md` | ✅ Implemented | ✅ Yes | QA deliverables |
| 09 | `01_DEPLOYMENT_REPORT.md` … `06_USER_GUIDE.md` | ✅ Implemented | ✅ Yes | Production deliverables |
| 12 | `MARKETING_STRATEGY.md` | ✅ Implemented | ✅ Yes | Marketing asset |
| `null/`, `test_compliance_agent/` | `simple.md`, `test.md`, `good_output_*.md` | 🧹 Noise | ❌ No | None — test-run leftovers; delete |

### 10.6 Other directories

| File | Status | What's implemented / pending | Required? | Value |
|---|---|---|---|---|
| `idea-research/petemart-prd.md` | 📖 Reference | Research-phase PRD input | Optional | Low — superseded by agent-02 `prd.md` |
| `qa-dashboard/README.md` + `agentic-console/QA_STRATEGY_GUIDE.md` | ✅ Implemented | QA dashboard usage docs | ✅ Yes | Medium |
| `config/SECURE_CREDENTIALS.template.md` | ✅ Implemented | Template for local secrets layout | ✅ Yes | Medium — used by secrets workflow |
| `backup/` (300+ `README n.md`, `README_v3.md`, `ROADMAP.md`, `SECURITY*.md`, `template*.md`, `STITCH_INTEGRATION_GUIDE.md`, `todoqa.md`, …) | 🧹 Noise | Massive pile of auto-generated/duplicate backups | ❌ No | None — delete or move off-repo; this is repo bloat |
| `conversations/` (~90 session dumps) | 🧹 Noise | opencode autosave conversation archives | ❌ No | None — should be gitignored |

### 10.7 Summary of true pending work (across all .md files)

| # | Pending item | Where declared | Value if done |
|---|---|---|---|
| 1 | Wire `approval_gates` into daemon launch | `AGENTS.md`, `guardrails-governance-recommendation.md` | High — makes spec-accurate gating real |
| 2 | Runtime Skills/MCP/RAG loading | `skills-mcp-rag-integration-plan.md` | High — biggest capability gap |
| 3 | Playwright e2e/visual/a11y/perf in `POST /api/qa/run` | `todoqa.md` | High — closes QA automation gap |
| 4 | Provider capability probing at startup | `PROVIDER_AGNOSTIC_RUNTIME.md` | Medium |
| 5 | Headroom token compression / cost savings | `todo.md` | Medium |
| 6 | Secrets vault (Vault/encrypted) | `secrets-management-comparison.md` | Medium |
| 7 | Workflow/traceability compliance → fatal | `Rules-Guardrails-Compliance.md` | Medium |

---

## 11. External Review — Google Gemini Feedback (2026-08-18)

Source: `gemini_agentic_framework_feedback.txt`. All claims re-verified against the
current code before inclusion.

### 11.1 Feedback points vs. my analysis — coverage matrix

| # | Gemini claim | Verdict (code-verified) | Covered by my §1-9? | Where |
|---|---|---|---|---|
| 1 | **Split-brain execution paths** — `supervisorDaemon.js` (true daemon, E2E in-process via `runAgentProcess.js`) vs `supervisor_loop.js` (CLI, writes TASK manifests, delegates to `execute_agent_task.js`); both emit `TASK_<id>.json` → state desync + file-access deadlock risk | ✅ **TRUE** — confirmed: `supervisorDaemon.js:450` launches via `runAgentProcess`, `supervisor_loop.js:191` writes manifests only | ✅ Yes | §8.1, §3 |
| 2 | **4,000-char context blind spot** — `_gatherDependencyContext` reads only first 4,000 chars of upstream files → downstream agents (02, 03) hallucinate on truncated data | ✅ **TRUE** — `AgentRuntime.js:902` does `full.slice(0, 4000)`; **NEW finding for me** | ❌ No | — |
| 3 | **Passive gating loophole** — `supervisor_loop:302-307` marks `workflow`/`traceability` compliance **non-fatal**, logging `--no-verify` cheats but letting execution pass | ✅ **TRUE** — exact filter verified at `supervisor_loop.js:301-307`; `workflow_enforcement` in STATE_MATRIX records real violations (PRs #2-13 all flagged `--no-verify` / direct-commit) | ✅ Yes | §6 |
| 4 | **Triplicate source fragmentation** — runtime uses `AGENT_REGISTRY.json`; `.opencode/agents/*.md` and `AGENTS.md` are dead files | ✅ **TRUE** — confirmed 0 runtime refs | ✅ Yes | §8.4 |
| 5 | **Orphaned `WORKFLOW_DAG.json`** — defined (18 nodes with `conditionals`/`forks`/`next_on_success`/`next_on_failure`/`max_retries`) but never executed | ✅ **TRUE** — 0 references anywhere in runtime; loop walks STATE_MATRIX deps instead | ✅ Yes | §8.2 |
| 6 | **Manifest-engine mismatch / concurrency deadlock** — `LLMOpenCodeProvider` spawns external `opencode run --model` via stdin pipe → cannot handle concurrent multi-agent processes without file deadlocks | ⚠️ **PLAUSIBLE, UNTESTED** — spawn confirmed (`LLMOpenCodeProvider.js:33-53`); daemon launches up to 3 concurrent agents, each spawning an `opencode` CLI that reads/writes shared opencode state → real risk | ❌ No (noted spawn, not the concurrency hazard) | — |
| 7 | **Bonus — `read_dependency` tool is even worse** (800-char preview) | ✅ **TRUE** — `AgentRuntime.js:803` slices to 800 chars | ❌ No | — |
| 8 | Context expansion fix → 64,000 chars | ⚠️ **Over-broad** — 64K/file × N deps can blow the 131K window; better: chunked/selective reads | ❌ No | — |

### 11.2 What my §9 analysis already covered (no change needed)

Points 1, 3, 4, 5 were already identified in my audit:
- **Split-brain orchestrators** — §8.1 + recommended consolidation (#3 in fix order)
- **Non-fatal compliance** — §6 "Words only" + #5 in fix order
- **Triplicate prompts** — §8.4 + #4 in fix order
- **Orphaned WORKFLOW_DAG** — §8.2 + #2 in fix order

### 11.3 What Gemini added that I missed

| # | New finding | Evidence | Fix |
|---|---|---|---|
| A | **4,000-char dependency truncation** | `AgentRuntime.js:902` `full.slice(0, 4000)` | Raise to a windowed/chunked read (e.g., 16-32K/file with `[truncated …]` pointer + `read_dependency` tool to fetch more); or chunk + summarize |
| B | **800-char `read_dependency` tool** | `AgentRuntime.js:803` | Same treatment — expand preview, allow paging/offset reads |
| C | **Concurrent `opencode` CLI spawn hazard** | `LLMOpenCodeProvider.js:33-53` | Either serialize agent execution (sync pool, not parallel), or switch deepseek path to a stateful HTTP provider to avoid N concurrent CLI processes |
| D | **`workflow_enforcement` violations already recorded in STATE_MATRIX** — the data for fatal gating already exists | `STATE_MATRIX.json → supervisor_control.workflow_enforcement` (PRs #2-13) | Wire this into compliance: if `pr_tracking.pr_list` shows `--no-verify`/direct-commit on a release branch → FATAL (not warning) |

### 11.4 Critique of the proposed `supervisor_unified_core.js` blueprint

Gemini's solution direction is sound (single orchestrator, DAG traversal, fatal gating,
single source of truth), but the provided code has **4 defects** — do not copy verbatim:

| # | Bug in blueprint | Correct form in this repo |
|---|---|---|
| 1 | Reads `stateMatrix.workflow_enforcement` — **wrong path** | Real path is `stateMatrix.supervisor_control.workflow_enforcement` |
| 2 | Mirror write to `projects/petemart/STATE_MATRIX.json` — **missing `00_state_ledger/` prefix** | Real mirror: `00_state_ledger/projects/petemart/STATE_MATRIX.json` |
| 3 | `generateSingleSourcePrompts()` overwrites `.opencode/agents/*.md` with `# role + system_prompt` — **would destroy opencode subagent frontmatter** (YAML `description`/`mode`/`permission` needed by opencode's Task tool) | Generate full valid frontmatter, or generate to a neutral dir and symlink |
| 4 | `extractExpandedDependencyContext` at 64,000 chars/file | Window-aware read (16-32K) + `read_dependency` paging; 64K×deps overflows the 131K window |

### 11.5 How to leverage this feedback — prioritized action plan

| Priority | Action | Fixes Gemini point(s) | Status |
|---|---|---|---|
| P0 | Wire `workflow_enforcement` into compliance as **fatal** — detect `--no-verify`/direct-commit from `pr_tracking` → trip circuit breaker | 3, D | 🔴 Pending — #1 fix candidate |
| P0 | Fix dependency-context truncation (4K → windowed 16-32K) + `read_dependency` 800-char cap | 2, 7, A, B | 🔴 Pending — #2 fix candidate |
| P1 | Consolidate orchestrators into one E2E path (keep daemon, deprecate `supervisor_loop` manifest-only path) | 1 | 🔴 Pending — #3 fix candidate |
| P1 | Wire `WORKFLOW_DAG.json` traversal (or delete it) | 5 | 🔴 Pending — #4 fix candidate |
| P2 | Investigate concurrent `opencode` spawns — serialize or move deepseek to HTTP provider | 6, C | 🔴 Pending — risk check before scaling |
| P2 | Generate `.opencode/agents/*.md` from `AGENT_REGISTRY.json` (with valid frontmatter) | 4 | 🔴 Pending — #5 fix candidate |

**Net assessment**: Gemini independently confirmed 4 of my 5 identified gaps and added
**3 genuinely new findings** (context truncation at 4K, the 800-char tool cap, and the
concurrency hazard) plus pointed out that the compliance-violation data already exists
in STATE_MATRIX — making the "words-only → fatal" upgrade cheap to implement.

---

## 12. Tech Stack: Framework (built-with) vs. Product (built-by-the-framework)

**Review date**: 2026-08-19. This section separates the stack the agentic framework itself is
**built with** (verified from package.json + scripts/) from the stack the framework **uses to
build products** (decided by Agent 03 Architect per PRD, not hardcoded).

### 12.1 Framework tech stack (built-with) — verified from code

The framework is a **Node.js monorepo** (package name `petemart-unified`) wrapping a
Next.js console app. No separate runtime dependencies — the agents run in-process on the
same Node runtime.

| Layer | Stack | Evidence |
|-------|-------|----------|
| Runtime | Node.js (CommonJS, no build step) | `scripts/runtime/*.js` `require()` |
| Orchestration | 4 runtime modules: AgentRuntime, SupervisorDaemon, SupervisorSingleton, SupervisorAgent | `scripts/runtime/` |
| LLM layer | Provider-agnostic: LLMProvider (registry) + per-provider backends (OpenAI-compatible HTTP, Google, Anthropic, Ollama, opencode CLI) + LLMFallback chain | `scripts/runtime/LLM*.js` |
| Console UI | Next.js 15 (App Router) + React 19 + TypeScript | `app/`, package.json |
| Console UI kit | Tailwind CSS + Radix UI + shadcn/ui + lucide-react + recharts + @xyflow/react (graph) + sonner | package.json deps |
| State/forms | react-hook-form + zod (console forms), class-variance-authority, clsx, tailwind-merge | package.json deps |
| Database | Supabase (PostgreSQL) — `@supabase/supabase-js` + `@supabase/ssr`; 3 migrations (schema/RLS/auth) | `supabase/migrations/` |
| State ledger | JSON files on disk (`00_state_ledger/`) — atomic dual-write via StateFile.js | `00_state_ledger/STATE_MATRIX.json` |
| Testing | Vitest + Testing Library (unit), Playwright (e2e/visual/a11y), Jest, SuperTest, Lighthouse, k6 | package.json devDeps + `npm run test` / `qa:*` / `e2e:*` / `loadtest:k6` |
| CI/CD | Husky pre-commit/pre-push hooks, GitHub Actions (ci, deploy, security-scan, pr-agent, code-review), Docker, Vercel, Railway, Supabase | `.husky/`, `.github/workflows/` |
| Code quality | ESLint + TypeScript (tsc --noEmit), SonarQube Cloud (MCP), Reviewdog, CodeQL, Gitleaks | `opencode.json`, workflows |
| Diagramming (documents) | Mermaid.js + PlantUML (source text in .md deliverables) | Agent 03 deliverables |

### 12.2 Product tech stack (built-by-the-framework) — decided by Agent 03, NOT hardcoded

Confirmed: **the product stack is an Agent 03 (Architect) deliverable, not a framework
constant.** It lives in `agents/02_engineering_specs/03_architect_agent/FEASIBILITY_ARCHITECTURE.json`
(`architecture.ui_stack`, `architecture.infrastructure`, etc.) and the mirrored
`FEASIBILITY_ARCHITECTURE.md`. The framework never hardcodes it — `AGENT_REGISTRY.json`
only instructs Agent 03 to "recommend a robust, high-performance UI stack" and it is produced
fresh from the PRD per project. Current recommendation for the PeteMart product (informational
only — a new project would get a new recommendation from its own Architect run):

| Layer | Product stack (Agent 03 output) |
|-------|--------------------------------|
| Web | React 18 + Next.js 14 App Router; Tailwind + Radix + shadcn/ui; Zustand + TanStack Query; Framer Motion; RHF + Zod; Vitest + Testing Library + MSW |
| Mobile | React Native 0.76 + Expo 51; Expo Router; Tamagui; WatermelonDB; react-native-maps; EAS Update; Detox + Jest |
| API | API-First REST (versioned); API gateway with rate limiting; gRPC between services; service mesh |
| Backend services | NestJS (WhatsApp bridge), Node.js services, Go components (from testing/pyramid) |
| Data | PostgreSQL 16 (RDS Multi-AZ), Redis (ElastiCache, 4-layer caching), MongoDB/Elasticsearch/Kafka (auxiliary) |
| Infra (prod) | AWS ap-south-1, EKS Kubernetes, ECS Fargate, Terraform IaC, ArgoCD, CloudFront + Cloudflare, PgBouncer |
| Payments/Comms | Razorpay/Stripe, Twilio (WhatsApp/SMS), SendGrid, Expo Push + Firebase |
| Observability | OpenTelemetry + Prometheus + Grafana + Loki + Jaeger + PagerDuty |
| POC path (zero-cost) | Supabase Free + Vercel Hobby + Railway (\ credit) + GitHub Pages + Expo — ₹0/month |

**Design principle**: The product stack is an **output artifact** (Agent 03 → FEASIBILITY_ARCHITECTURE.*,
HITL-gated via `GATE-TECH-STACK-01`). The framework stack is **fixed runtime** (this repo's
package.json/scripts). They are deliberately decoupled — the framework can be reused to build
any product stack because nothing in `scripts/runtime` or `AGENT_REGISTRY.json` assumes
the product's specific stack.

### 12.3 Framework runtime vs. opencode layer (decoupling scope)

| Concern | Framework runtime (kept) | opencode layer (removable) |
|---------|--------------------------|-----------------------------|
| Prompts | `AGENT_REGISTRY.json` → `AgentRuntime._buildSystemPrompt` | `.opencode/agents/*.md` (path-string only, never read as content) |
| LLM backend | HTTP providers (LLMOpenAIProvider/Google/Anthropic/Ollama) + config from `llm_config.json`/env | opencode CLI spawn (LLMOpenCodeProvider), `~/.local/share/opencode/auth.json`, `LLMFallback` CLI probes |
| Usage tracking | `00_state_ledger/token_spend_log.json` (native, written by LLMProvider) | `track_usage.py` reading opencode SQLite DB (temporary) |
| Docs/config | `00_state_ledger/*.json`, scripts/, supabase/ | `AGENTS.md`, `opencode.json`, `.opencode/rules`, `context_lake/`, `conversations/` |
| Console | `app/` (Next.js, reads state ledger — opencode-independent) | n/a |

**Verdict**: The framework's runtime/E2E path is nearly opencode-independent today. Only 5
references block full decoupling (LLMProvider auth + CLI fallbacks, LLMOpenCodeProvider,
LLMFallback CLI spawns, track_usage.py DB reads, and the cosmetic `prompt_source` strings).
Section 12.4 tracks the planned changes.

### 12.4 Planned changes: opencode decoupling + onboarding LLM config (Section 13 will record implementation)

1. `supabase/migrations/004_llm_config.sql` — `project_settings` table (provider, model, base_url, api_key encrypted via pgcrypto, created_at).
2. `app/api/agentic-console/pipeline/route.ts` — `select_llm` writes DB + gitignored `00_state_ledger/llm_config.json` (no plaintext keys in committed STATE_MATRIX).
3. `scripts/runtime/LLMProvider.js` — auth from `llm_config.json` + env vars only; CLI fallback becomes a hard, descriptive error.
4. Delete `scripts/runtime/LLMOpenCodeProvider.js` (opencode-go/openrouter already served by LLMOpenAIProvider over HTTP).
5. `scripts/runtime/LLMFallback.js` — replace all `spawn('opencode', ...)` (probe/health/call) with HTTP equivalents.
6. `scripts/track_usage.py` — opencode SQLite reads kept temporarily; later switch to `token_spend_log.json` (native framework tracking).
7. `.gitignore` — add `00_state_ledger/llm_config.json`.

---

## 13. Framework Data Store — Complete Inventory & DB Rationale

**Review date**: 2026-08-19. Q: "Are we using a DB for the framework (transactions/agent
details/context)? Do we need one?" **A: No DB today — everything is flat files on disk under
`00_state_ledger/`. A DB is needed ONLY for two things that must not live in git (LLM config
keys) and that customers will query (token usage).**

### 13.1 Current data store — full inventory (measured 2026-08-19)

**Core state (`00_state_ledger/`, ~57 files, ~34 MB total)**

| File | Role | Writer / Reader |
|------|------|-----------------|
| `STATE_MATRIX.json` (99 KB) | Master state: agent statuses, pipeline control, guardrails, approval gates, compliance checklists | StateFile.js (atomic dual-write with `projects/petemart/` copy) |
| `AGENT_REGISTRY.json` (32 KB) | Agent definitions: system prompts, deliverables, workspace roots, checkpoints, tools | AgentRuntime (loadAgentDef :140), supervisor_loop |
| `WORKFLOW_DAG.json` (11 KB) | 18-node DAG (phases, pools, dependencies, conditionals, next_on_*) | **Orphaned** — 0 runtime refs |
| `TRACEABILITY_MATRIX.json` (9 KB) | Requirement-ID ownership per agent | Supervisor compliance (words-only today) |
| `AGENT_TEMPLATES.json` (13 KB) | Template prompts per agent | — |
| `EXECUTION_PLAN.json` (13 KB) | Plan/decomposition metadata | — |
| `EVAL_RULES.json` (21 KB) | Per-agent guardrail fail/validation rules | — |
| `tool_registry.json` (17 KB) | Tool schemas | AgentRuntime |
| `MCP_SERVERS.json` (9 KB) | MCP server registry | — |
| `rbac_config.json` / `escalation_matrix.json` / `A2A_TYPES.json` | Auth/escalation/agent-to-agent types | — |
| `SUPERVISOR_DASHBOARD.json` (52 KB) | Dashboard snapshot | SupervisorDaemon |
| `ARTIFACT_HASHES.json` (14 KB) | Artifact integrity hashes | Compliance checks |

**Events / logs (append-only JSONL)**

| File | Size | Purpose |
|------|------|---------|
| `PIPELINE_EVENTS.jsonl` | **31.5 MB** | Every pipeline event (agent lifecycle, gates, approvals) — largest file |
| `traces.jsonl` | 745 KB | Action traces (API routes, reruns, cascades) |
| `AGENT_MESSAGES.jsonl` / `debates.jsonl` / `subtasks.jsonl` / `jira_sync_log.jsonl` / `SUPERVISOR_COMMANDS.jsonl` / `SUPERVISOR_RESPONSES.jsonl` | 0–8 KB | Agent comms, commands, sync |
| `AGENT_RUN_*.log` (5 files) | 1–161 KB | Per-agent run stdout captures |

**Per-agent memory & snapshots (`00_state_ledger/` subdirs)**

| Path | Size | Purpose |
|------|------|---------|
| `memory_store/*.json{,l}` (4 files) | 0.6–27 KB | Per-agent persistent memory/context |
| `prompt_snapshots/` (**175 files, 121 for agent 03**) | — | Every prompt+response (audit/replay) — biggest growth risk |
| `projects/petemart/STATE_MATRIX.json` + `PIPELINE_EVENTS.jsonl` | 99 KB | Per-project mirror of root state |

**Usage tracking**

| Path | Purpose |
|------|---------|
| `token_spend_log.json` (34 B) | Native cost log (month→$), written by `LLMProvider._logTokenUsage` |
| `agent_token_usage_log.csv` (29 lines) | Session-level usage CSV (fed by `track_usage.py` ← opencode SQLite, temporary) |

**Non-runtime data (opencode layer)**

| Path | Purpose | Needed? |
|------|---------|---------|
| `context_lake/` (38 files) | opencode session memory/instructions | No (assistant-only) |
| `conversations/` (73 files) | opencode autosave dumps | No |
| `.opencode/agents/*.md` (19 files) | opencode agent defs | No (runtime uses AGENT_REGISTRY) |

### 13.2 Why no DB today is correct

- The state ledger is a **single-process, low-volume, human-in-the-loop pipeline** (max 3
  concurrent agents). JSON files + atomic rename are adequate, auditable (git), and zero-ops.
- `PIPELINE_EVENTS.jsonl` at 31.5 MB is the only growth concern; `prompt_snapshots/` (175
  files, mostly agent 03 reruns) grows fastest. Both are **fine for single-project scale** today.

### 13.3 What the DB migration is FOR (purpose clarification)

The Supabase migration (`004`) is **NOT** for framework transactions/state — those stay in the
JSON ledger. It exists for exactly two reasons the flat-file ledger cannot serve:

1. **LLM config & keys** (`project_settings` table): onboarding will capture provider/model/
   base_url/api_key. Keys **must not** be committed to git as plaintext (today `select_llm`
   writes `apiKey` into `STATE_MATRIX.json` — a real secret leak). A DB (RLS-protected,
   pgcrypto-encrypted) is the correct home; the runtime syncs a gitignored `llm_config.json`.
2. **Token usage** (`token_usage` table): customers must see per-agent LLM spend. Today it's a
   34-byte JSON + a 29-line CSV fed by opencode's SQLite. Native DB storage replaces the opencode
   dependency and supports dashboards/audits at any scale.

**Explicitly NOT migrated now**: agent states, events, prompts, memory — the flat ledger stays
until volume or multi-tenant access makes it painful (prompt_snapshots + PIPELINE_EVENTS are the
first candidates, and only if needed).

### 13.4 Migration scope (proposed)

- `004_llm_config.sql` → `project_settings` (provider, model, base_url, api_key pgcrypto-encrypted, timestamps) + `token_usage` (agent_id, provider, model, tokens_in/out, cost, run timestamp).
- Runtime keeps reading `00_state_ledger/llm_config.json` (gitignored, synced at onboarding) — no DB dependency in the agent runtime path.

---

## 14. Which Features Need an LLM — and When

**Review date**: 2026-08-19. This section maps every runtime feature that calls the LLM,
when it fires, and what happens if no LLM/key is configured. Verified against call sites in
scripts/runtime/ and scripts/.

### 14.1 LLM call sites (runtime)

| # | Feature | Where | When it fires | LLM needed? |
|---|---------|-------|---------------|-------------|
| 1 | **Agent execution (core)** | AgentRuntime.runAgent → _llmToolLoop (AgentRuntime.js:251,378,409 → complete at :480) | Every time any agent (01–15) is launched: eligibility check passes → build system prompt → _llmToolLoop (up to 15 iterations, each an LLM call) | **YES — hard requirement** |
| 2 | **Checkpointed pipeline** | AgentRuntime._runCheckpointedPipeline (:369) → same _llmToolLoop per checkpoint | Agents with checkpoints (e.g. 03 architect had 2-phase plans): one _llmToolLoop per checkpoint | **YES — hard requirement** |
| 3 | **Supervisor health check** | SupervisorAgent._checkLLMHealth (SupervisorAgent.js:188-213) | Daemon dashboard/health endpoint on each status poll | **Config only** — LLMProvider.fromEnv() + initialize(); no inference call. Fails "healthy:false" if no key, but pipeline still runs |
| 4 | **Direct agent run (API/CLI)** | SupervisorAgent.runAgent (:398) / start-runtime.js:118 | --agent=<id> CLI, rerun via console, daemon in-process runs | **YES — same as #1** |
| 5 | **LLM fallback chain** | LLMFallback (LLMFallback.js) | Only if imported — currently **no consumers** (dead module, kept for future) | **YES** if wired up |

### 14.2 What does NOT need an LLM (deterministic, runs without any key)

- **Supervisor orchestration** — eligibility, dependency gating, circuit breaker, state
  transitions, HITL gates, compliance artifact checks, empty-artifact guard, cascade resets
  (supervisorDaemon.js, supervisor_loop.js, SupervisorAgent.js): all pure state-machine
  logic, zero LLM calls.
- **Approval gates / HITL** (checkApprovalGates, waiting_approval flow) — human-driven.
- **Console + dashboard** (pp/agentic-console/*, pp/api/agentic-console/*) — reads JSON
  state ledger; only gent-detail needs a prompt (now from AGENT_REGISTRY, no LLM call).
- **QA engine** (pp/api/qa/run/*, Vitest/Playwright suites) — test execution, no LLM.
- **Infra / DevOps / FinOps / Secrets scanners** (06, 14, 15) — scripted checks.
- **	rack_usage.py** — token accounting only.
- **Pre-commit hooks** (.husky/*) — AI review step is DeepSeek via a *separate* hook
  (code-review.cjs), not the runtime LLM; runs only on git commit.

### 14.3 When each feature needs the LLM (trigger timeline)

`
Pipeline start (no LLM)
   ├─ Supervisor eligibility scan ──────────────── NO LLM
   ├─ Agent becomes eligible → launched
   │    ├─ Build system prompt (AGENT_REGISTRY) ── NO LLM
   │    └─ _llmToolLoop ────────────────────────── YES — 1..15 LLM calls (tools: read_dependency,
   │         write_artifact, etc.), one loop per checkpoint if agent has checkpoints
   ├─ Empty-artifact guard / compliance audit ──── NO LLM
   ├─ HITL gate (awaiting_approval) ────────────── NO LLM (human)
   └─ Next cycle (supervisor) ──────────────────── NO LLM
Daemon health poll ─────────────────────────────── Config check only (no inference)
`

### 14.4 Impact of the opencode-decoupling (current state)

- With no key configured, **agent execution (#1, #2, #4) now fails fast with a clear error**
  ("No API key for X. Set apiKey in 00_state_ledger/llm_config.json or LLM_API_KEY env") instead
  of silently spawning the opencode CLI. Everything else (orchestration, dashboard, QA, hooks)
  continues to work.
- LLM is invoked **only during actual agent runs** — a freshly-configured project that never
  launches an agent consumes zero LLM tokens.
- Rule of thumb: **1 agent run ≈ 1–15 LLM calls** (tool-loop iterations); checkpointed agents
  multiply that per checkpoint. Token usage is logged natively to 	oken_spend_log.json.

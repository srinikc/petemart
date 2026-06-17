# Rules, Guardrails & Compliance Reference

## Three Rule Domains

The project has three distinct domains with different rule sets, enforcement mechanisms, and audit paths:

| Domain | Components | Rules defined in | Enforcement type |
|--------|-----------|-----------------|------------------|
| **Project Agents** (01-15) | Autonomous LLM agents that produce deliverables | `AGENTS.md` per-agent sections, Agent 0, AgentRuntime.js | **Programmatic** — hooks, CI, Agent 0 state machine |
| **Supervisor Agent** (00) | Orchestrator that dispatches and audits agents | `AGENTS.md` Agent 0 section, SupervisorAgent.js | **Programmatic** — self-enforced, pipeline control |
| **Terminal Sessions** | opencode AI assistant in CLI | `opencode.json`, `system_instructions.md`, `tool_efficiency.md`, `AGENTS.md` Dev Workflow | **Manual** — honor system, human gatekeeper calls violations |

---

## Domain A — Project Agents (01-15)

### A1. Per-Agent Quality Guardrails

**Source**: `AGENTS.md` per-agent sections  
**Applies to**: Each specific agent  
**Audited by**: Agent 0 (Supervisor) via `compliance_checklist` items  
**Enforcement**: Programmatic — Agent 0 blocks execution if fail state met

Each agent has two guardrails:

| Guardrail | Check | When triggered | Consequence |
|-----------|-------|----------------|-------------|
| **Fail State** | Reject execution if condition met | Before agent launch by Agent 0 | Agent marked `failed`, execution blocked |
| **Validation Rule** | Verify output contract matches spec | After agent completes, pre-approval | Agent marked `failed` or `awaiting_approval` with notes |

#### Agent-specific Fail States & Validation Rules

| Agent ID | Fail State (blocks launch) | Validation Rule (blocks approval) |
|----------|---------------------------|-----------------------------------|
| 01_ideation_agent | Output lacks cost-of-delivery or monetization schemas | All named markets explicitly represented in inventory JSON |
| 02_requirement_agent | Any Requirement ID lacks operational/deployment cost projection | User workflows in .md match schema keys in .json contract |
| 03_architect_agent | Missing multi-layer testing arch OR no API gateway with rate limiting OR no diagrams | Scale thresholds in JSON match cost config |
| 04_prototype_agent | Verification script fails to launch OR malformed sample data | POC interface matches core architecture design |
| 05_program_mgmt_agent | Any User Story lacks traceable PRD Requirement ID | No unmapped dependencies or deadlocks in timeline JSON |
| 06_infra_devops_agent | Hardcoded secrets/tokens/credentials in plain text | Docker/K8s config parses without syntax errors |
| 07a_ui_agent | Unit tests < 80% coverage OR overlapping layout elements | Every screen has matching help string in translation mapping |
| 07b_api_agent | API endpoint signature deviates from architecture schema | All routes pass input sanitization + payload size validation |
| 07c_backend_db_agent | Migration scripts lack rollback OR non-indexed primary table queries | Connection timeout + pool params match auto-scaling criteria |
| 07d_integration_agent | E2E connection timeouts OR crypto handshake fails | No debugging flags or unencrypted connections in build |
| 08_qa_agent | Coverage below threshold OR critical visual layout shift | No high-severity defect open on release candidate branch |
| 09_production_agent | Deployment generates unhandled server errors OR missing HITL sign-off | All endpoints return HTTP 200 before release |
| 10_tech_pub_agent | UI paths lack help document OR break localization key mapping | Hyperlinks/screenshots/install scripts match production build |
| 11_customer_onboarding_agent | New account lacks billing model OR merchant profile schema | Support interface parses logs into JSON matching defect format |
| 12_marketing_agent | Missing public routing tags OR analytics trackers OR SEO params | No campaign trigger when auto-scaling bottleneck active |
| 13_maintenance_agent | Patch degrades system performance OR bypasses DevOps pipeline | Valid signed human auth token required before merge to production |
| 14_finops_agent | Spend outpaces budget by >15% | Cost tracking ledger matches billing metrics to resource IDs |
| 15_secrets_compliance_agent | Unprotected authentication variables detected | All credentials in isolated secrets manager / encrypted vault |

---

### A2. Universal Pre-Commit Code Review Gate

**Source**: `AGENTS.md` lines 274-325  
**Applies to**: Agents 7a, 7b, 7c, 7d, 8, 11, 12, 13 (code-generating agents)  
**Audited by**: `.husky/pre-commit` hook  
**Enforcement**: Programmatic — commit rejected if any step fails

**Steps in order**:
1. `git add <files>`
2. **AI Code Review** (DeepSeek via pre-commit hook) — staged diff checked for logic errors, security, quality
3. **TypeScript Check** — `tsc --noEmit` full project
4. **Unit Tests** — `npm test` (all 45+ tests)
5. Commit succeeds → push feature branch → PR → CI

**Bypass rule**: `--no-verify` ONLY for infrastructure setup (husky init, tooling config). NEVER for code changes.

**Agent instruction**: Each code agent MUST stage, commit (hook runs auto), fix if blocked, retry, then push + PR.

---

### A3. Feature Branch Workflow Enforcement

**Source**: `AGENTS.md` lines 328-420  
**Applies to**: Agents 07a-07d, 08, 09, 10, 11, 12, 13, 14, 15, AND opencode AI assistant  
**Audited by**: 
- `.husky/pre-push` hook (blocks direct push to develop/main)
- GitHub branch protection (server-side)
- Agent 0 `SUP-003` to `SUP-007`

**Workflow**:
```
develop → feature/<agent-id>-<brief-desc> → commits (pre-commit hook runs) → push → PR → CI → code review → squash merge to develop
```

**Compliance `compliance_checklist` items** (in STATE_MATRIX.json):
| Check ID | What it verifies | Added by |
|----------|-----------------|----------|
| `*_feature_branch_used` | Work was on feature branch off develop, not develop/main | Agent 0 via SUP-003 |
| `*_pr_created` | PR opened targeting develop, merged after CI passed | Agent 0 via SUP-003 |
| `*_ci_pipeline_passed` | GitHub Actions CI build succeeded before merge | Agent 0 via SUP-003 |

**Agent 0 enforcement rules**:
- `SUP-003`: code agents use feature branch → PR → CI → merge
- `SUP-004`: pre-push hook in place
- `SUP-005`: PR template exists
- `SUP-006`: CI triggers on PRs
- `SUP-007`: opencode/AI assistant follows same workflow

---

### A4. Requirements Traceability

**Source**: `AGENTS.md` lines 424-478  
**Applies to**: All agents (01-15)  
**Audited by**: Agent 0 via `TRACEABILITY_MATRIX.json`  
**Enforcement**: Programmatic — `compliance_checklist` items per agent

| Check ID | What it verifies |
|----------|-----------------|
| `SUP-008` | Agent 0 validates traceability for all agents against TRACEABILITY_MATRIX.json |
| `SUP-009` | Agent 0 verifies each agent consumed upstream artifacts before producing output |
| `SUP-010` | TRACEABILITY_MATRIX.json exists and covers all 15 agents |
| `*_traceability` | Per agent: artifacts reference correct PRD requirement IDs |
| `*_input_from_upstream` | Per agent: upstream dependency artifacts were consumed |

**Input/output chain**:
```
PRD(02) → Architect(03) → UI(07a)  ─┐
                           → API(07b) ─┤ → Integration(07d) → QA(08) → Prod(09)
                           → DB(07c)  ─┘
```

---

### A5. Universal Agent Output Requirements

**Source**: `AGENTS.md` lines 481-536  
**Applies to**: ALL agents (00-15) upon task completion  
**Audited by**: Agent 0 — verifies artifacts exist before marking `completed`

| Requirement | File naming | Method |
|------------|------------|--------|
| Completion slide (.pptx) | `[agent_id]_COMPLETION_SLIDE.pptx` | `python-pptx` or `officegen` |
| Data export (.xlsx, data-heavy) | `[agent_id]_DATA_EXPORT.xlsx` | `openpyxl` or `exceljs` |
| Token consumption logging | `agent_token_usage_log.csv` (project root) | `python scripts/track_usage.py` |

**Validation chain**: Agent 0 verifies slide + Excel files exist in `artifacts_emitted` array before marking `completed`. Token log must have entries for agent's session.

---

### A6. Automated Code Review Pipeline (Post-PR)

**Source**: `AGENTS.md` lines 539-589  
**Applies to**: Every PR against develop, qa, staging, main  
**Audited by**: GitHub Actions + PR-Agent + SonarQube + Reviewdog  
**Enforcement**: Programmatic — CI gates block merge

| Tool | Checks | Triggers |
|------|--------|----------|
| **PR-Agent** (Qodo/CodiumAI) | AI-powered PR review (logic, security, quality) | PR opened/synchronized |
| **SonarQube Cloud** | Static code analysis (bugs, vulnerabilities, code smells) | PR opened/synchronized |
| **Reviewdog** | ESLint + TypeScript lint (comments on added lines) | PR opened/synchronized |
| **CI Pipeline** | Build, test, typecheck, Docker validation | PR + push |
| **Security Scan** | CodeQL SAST, dependency audit, secrets scan, IaC scan | PR + weekly schedule |

**Required secrets**: `DEEPSEEK_API_KEY`, `SONAR_TOKEN`, `GITHUB_TOKEN`

---

### A7. Context Chunking & Consolidation

**Source**: `AGENTS.md` lines 592-639  
**Applies to**: ALL LLM-driven agents (01-15) that process upstream dependency artifacts  
**Audited by**: Agent 0 validates checkpoints exist for PRD-sized dependencies  
**Enforcement**: `AgentRuntime.js` auto-selects `_runCheckpointedPipeline` when `checkpoints.length > 0`

**Checkpointed pipeline**:
1. Phase 1: full prompt + dependency context → LLM analyzes, saves
2. Phases 2+: stripped prompt + previous phase summary (500 chars) → generate artifacts
3. Final phase: consolidation, slide, data export

**Enforcement**: Agent 0 checks deliverable files exist post-pipeline. `compliance_checklist` verifies.

---

### A8. QA Periodic Runs

**Source**: `AGENTS.md` lines 643-649  
**Applies to**: Project QA  
**Audited by**: GitHub Actions schedule (Mon/Wed/Fri 6 AM)  
**Enforcement**: Auto-creates issue if pass rate < 80%

---

## Domain B — Supervisor Agent (00)

### B1. Supervisor Compliance Audit

**Source**: `AGENTS.md` lines 14-22, Agent 0 system prompt  
**Applies to**: Agent 0 before launching ANY worker agent  
**Audited by**: Self-enforced (Agent 0 reads STATE_MATRIX.json)  
**Enforcement**: Programmatic — agent not launched if audit fails

**Checks before launching agent**:
1. All required `artifacts_emitted` present on disk and non-empty
2. Code reviews completed (check-in integrity)
3. Tests executed and passed
4. Agent's `execution_count` within limits
5. If re-executing due to dependency re-open → downstream agents also re-queued

**On failure**: Set agent status to `failed`, log reason in `last_error`, notify human gatekeeper. No auto-retry.

---

### B2. Supervisor Loop Guardrails

**Source**: `AGENTS.md` Agent 0 section  
**Applies to**: Supervisor orchestration loop  
**Enforcement**: Self-enforced in `supervisor_loop.js` / `supervisorDaemon.js`

| Guardrail | Value | Effect |
|-----------|-------|--------|
| Max sequential executions per agent | 3 | After 3rd, agent blocked until reset |
| Max total cycles lifetime | 100 | Pipeline halts after 100 cycles |
| Circuit breaker | 5 consecutive failures | Trips → all execution blocked until human reset |
| Cooldown between cycles | 5 seconds | Minimum delay between dispatch cycles |
| Max concurrent agents (sync pool) | 3 | No more than 3 agents in parallel |
| Token budget per cycle | ~100K estimated | Logged via `track_usage.py` after each cycle |

---

### B3. Approval Gates (HITL)

**Source**: `AGENTS.md` Agent 0 section  
**Applies to**: Specific agents trigger gates that require human sign-off  
**Audited by**: Human gatekeeper via Dashboard UI

| Gate ID | Triggered by | What requires approval |
|---------|-------------|----------------------|
| GATE-TECH-STACK-01 | Agent 3 (Architect) | Tech stack & architecture |
| GATE-COSTING-01 | Agent 3 (Architect) | Infrastructure costing & account setup |
| GATE-MVP-01 | Agent 5 (Program Mgmt) | MVP scope & milestone definition |
| GATE-PRODUCTION-01 | Agent 9 (Production) | Production deployment Go/No-Go |

---

### B4. Expert Reviewer Integration

**Source**: `AGENTS.md` Agent 0 section  
**Applies to**: Every agent after compliance passes  
**Audited by**: Mapped Senior Industry role per agent  
**Enforcement**: If feedback contains blocker severity → Supervisor halts, alerts human gatekeeper

**Flow**: Agent completes → Supervisor runs compliance → Compliance passes → Expert reviewer engaged → Reviewer feedback captured in agent state → If blocker → halt.

---

### B5. Supervisor State Machine Rules

**Source**: `SupervisorAgent.js`, `supervisor_loop.js`  
**Applies to**: Agent 0 dispatch loop  
**Enforcement**: Programmatic

**Eligibility rules** (agent must pass ALL to be dispatched):
1. All dependencies have status `approved` (not just `completed`)
2. Circuit breaker is `CLOSED`
3. Max executions not exceeded
4. Pipeline not paused
5. Agent not disabled

**Validation rule before marking approved**: ALL items in `compliance_checklist` must pass. Dashboard shows ✅/❌ per item.

**Dependency re-open rule**: If a dependency was re-opened for changes, downstream agents must also be re-executed.

---

## Domain C — Terminal Sessions (opencode AI Assistant)

### C1. Token Conservation & Brevity Rules

**Source**: `.opencode/rules/terminal-rules.md` Section 1 (loaded via opencode.json `instructions`)  
**Applies to**: AI assistant responses in CLI  
**Audited by**: Human gatekeeper (no programmatic enforcement)

| Rule | Requirement |
|------|------------|
| **R1: Response Length** | Max 4 lines per response unless user asks for detail |
| **R2: No Fluff** | No greetings, sign-offs, "Sure", "Okay", "Let me", "I'll". No re-stating question. No summaries. |
| **R3: Code Diffs Only** | Never output full file contents. Use `diff` blocks with only changed lines. |
| **R4: Read Minimum** | Read only line range needed. Never read entire files unless required. |
| **R5: Say Less** | Answer exact question. No preamble, context, or explanation. 1-2 lines max unless asked. |
| **R6: Dev Workflow** | One change at a time. One fix, one test. Rollback preparedness. Dependency trace. Discuss before implementing. Cross-session memory. |

**Enforcement enforcement**: Manual — human gatekeeper calls violations immediately.

---

### C2. Tool Efficiency Rules

**Source**: `.opencode/rules/terminal-rules.md` Section 2 (loaded via opencode.json `instructions`)  
**Applies to**: AI assistant tool usage  
**Audited by**: Human gatekeeper (no programmatic enforcement)

| Category | Rule |
|----------|------|
| **File Reads** | Read first 30 lines before editing. Use grep to find specific code, then read offset:limit (±10 lines). Never read full files unless <100 lines. Batch parallel reads. |
| **Bash** | Don't dump full file content. Prefer targeted queries. Chain dependent commands. |
| **Agents (task)** | Pass focused prompts with file paths. Don't dump full file contents. Specify exact artifact paths. |

---

### C3. HARD RULE: 4-line Response Limit

**Source**: `opencode.json` `instructions` array (inline) + `.opencode/rules/terminal-rules.md` Section 1  
**Applies to**: AI assistant  
**Audited by**: Human gatekeeper

"HARD RULE: Maximum 4 response lines. No greetings. No summaries. No pleasantries. Start answering immediately. This is enforced — violations are non-compliance."

---

### C4. Development Workflow (HARD RULES) 1-11

**Source**: `AGENTS.md` lines 653-755 (full text for project agents), `.opencode/rules/terminal-rules.md` Section 3 (for AI assistant)  
**Applies to**: ALL code changes (agents + AI assistant) — Rule 10 is AI assistant ONLY  
**Audited by**: Agent 0 claims enforcement for project agents; human gatekeeper for AI assistant

| Rule | Description | Applies to | Enforced by |
|------|-------------|-----------|-------------|
| R1: One Change at a Time | 1 logical unit per cycle (function, bug fix, feature) | All code changes | Honor system / human gatekeeper |
| R2: Verify Before Moving On | Syntax check → module load → existing tests → if runtime, minimal agent run | All code changes | Honor system / human gatekeeper |
| R3: No Cascading Fixes | Revert first, understand, fix in isolation | All code changes | Honor system / human gatekeeper |
| R4: One Fix, One Test | Write/identify reproducing test, apply fix, run it, run all tests | Bug fixes | Honor system / human gatekeeper |
| R5: State & Context Discipline | Read STATE_MATRIX.json first, check run status, update compliance fields, log in `context_lake/latest.json` | Runtime code changes | Honor system / human gatekeeper |
| R6: No Assumptions About Libraries | Check package.json + existing imports before using any library | All code changes | Honor system / human gatekeeper |
| R7: Rollback Preparedness | Know rollback plan, `git diff` before, `git diff` after, `git checkout` if failed | Runtime code changes | Honor system / human gatekeeper |
| R9: Dependency Trace & E2E | Trace callers AND downstream, fix all paths, run full workflow | All changes | Honor system / human gatekeeper |
| R10: Discuss Before Implementing | List changes → get go-ahead → code one at a time | **AI assistant ONLY** | Human gatekeeper calls violations |
| R11: Cross-Session Memory | Update `context_lake/latest.json` after each cycle. Update Dev Workflow if lessons learned. | All sessions | Honor system / human gatekeeper |

**Note**: Rule 8 intentionally skipped (numbered as-is from AGENTS.md).

---

## Compliance Audit Flow Summary

```
┌───────────────────────────────────────────────────────┐
│                    AGENT LAUNCH                        │
│  Supervisor checks: dependency status, circuit breaker,│
│  execution count, pipeline pause, agent disabled flag  │
└──────────┬────────────────────────────────────────────┘
           │ PASS
           ▼
┌───────────────────────────────────────────────────────┐
│              PER-AGENT QUALITY GUARDRAIL                │
│  Fail State check (blocks launch if condition met)     │
└──────────┬────────────────────────────────────────────┘
           │ PASS
           ▼
┌───────────────────────────────────────────────────────┐
│              AGENT EXECUTION                            │
│  Runs checkpointed pipeline (if checkpoints defined)   │
│  Pre-commit gate: AI review → tsc → tests (code agents)│
│  Feature branch + PR workflow enforced via hooks       │
└──────────┬────────────────────────────────────────────┘
           │ COMPLETE
           ▼
┌───────────────────────────────────────────────────────┐
│              SUPERVISOR COMPLIANCE AUDIT                │
│  1. artifacts_emitted exist and non-empty              │
│  2. Code reviews completed                             │
│  3. Tests passed                                       │
│  4. execution_count within limits                      │
│  5. feature_branch_used() ✓                           │
│  6. pr_created_and_merged() ✓                         │
│  7. ci_pipeline_passed() ✓                            │
│  8. requirements_traceability() ✓                     │
│  9. input_from_upstream_agents() ✓                    │
│  10. deliverable_matches_spec() ✓                     │
└──────────┬────────────────────────────────────────────┘
           │ PASS
           ▼
┌───────────────────────────────────────────────────────┐
│              EXPERT REVIEWER                            │
│  Senior role reviews output, captures feedback         │
└──────────┬────────────────────────────────────────────┘
           │ PASS (no blocker)
           ▼
┌───────────────────────────────────────────────────────┐
│              APPROVAL GATE (if HITL required)           │
│  Human-in-the-loop sign-off via Dashboard UI           │
└──────────┬────────────────────────────────────────────┘
           │ APPROVED
           ▼
┌───────────────────────────────────────────────────────┐
│              AGENT MARKED APPROVED                      │
│  State updated, downstream dependencies unlocked       │
│  Token usage logged via track_usage.py                 │
└───────────────────────────────────────────────────────┘
```

---

## Compliance Severity Classification

Source: `scripts/supervisor_loop.js` lines 447-452  
Applies to: All `compliance_checklist` items in STATE_MATRIX.json

| Type | Severity | Behavior |
|------|----------|----------|
| `required` (not workflow/traceability) | **FATAL** | Agent auto-failed, blocked, human notified |
| `workflow` | **NON-FATAL** | Agent passes but flag raised for human review |
| `traceability` | **NON-FATAL** | Agent passes but flag raised for human review |

---

## Enforcement Gap Summary

| What's missing | Current state | Impact |
|---------------|--------------|--------|
| Dev Workflow Rules 1-9, 11 — no `compliance_checklist` items exist | Only honor system for project agents AND AI assistant | Rules routinely violated, no consequences |
| Terminal session rules — no pre-tool validation | Text files only, no runtime check | Response length, fluff, read limit violations |
| Agent 0 "counts response lines" (threatened in system_instructions.md) | Never implemented | Empty threat |
| Cross-session rule enforcement | context_lake/latest.json records violations but no auto-correction | Same mistakes repeated |


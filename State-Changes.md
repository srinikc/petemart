# State Files — Reference & Update Patterns

## File Inventory

| # | File | Purpose | Updated by | Read by | Schema |
|---|------|---------|-----------|---------|--------|
| 1 | `00_state_ledger/STATE_MATRIX.json` (root) | Canonical state of all agents, supervisor control, pipeline config, compliance checklists | AgentRuntime, execute_agent_task, start-pipeline, runAgentProcess, SupervisorAgent, approve API, agents API | ALL agents, ALL API routes, DashboardClient, supervisorDaemon, supervisorSingleton | `{project_metadata, supervisor_control, pipeline_control, agent_states, work_log}` |
| 2 | `00_state_ledger/projects/petemart/STATE_MATRIX.json` | Per-project state mirror (subset of root) | Auto-synced from root by AgentRuntime, runAgentProcess, agents API, execute_agent_task | project-scoped API routes (state, sla, health, events) | Same schema as root (subset) |
| 3 | `00_state_ledger/AGENT_REGISTRY.json` | Agent definitions: role, system prompt, workspace, deliverables, tools, checkpoints | Static (edits only) | AgentRuntime, SupervisorAgent | `{global_guardrails, agents: {agent_id: {role, system_prompt, workspace_root, deliverables, hitl_gate, checkpoints, tools}}}` |
| 4 | `00_state_ledger/TRACEABILITY_MATRIX.json` | Maps agents to PRD requirement IDs | Static (edits only) | supervisor_loop.js (compliance checks) | `{traceability_metadata, agent_requirement_mapping: {agent_id: {input_from, output_requirements}}}` |
| 5 | `00_state_ledger/EXECUTION_PLAN.json` | Tracks P0-P4 tasks across sessions | Human (manual edits) | AI assistant (session resume) | `{_help, metadata, phases: [{name, items: [{id, title, status}]}]}` |
| 6 | `00_state_ledger/CHANGE_REQUEST.json` | Immutable change history ledger | AgentRuntime (append only) | None (archive) | `{ledger_metadata, active_requests: [{request_id, agent_id, event_type, status}]}` |
| 7 | `00_state_ledger/WORKFLOW_DAG.json` | Directed Acyclic Graph — defines agent dependencies, phase, pool, next_on_success/failure | Static (edits only) | pipeline API route, test files | `{nodes: {agent_id: {id, phase, pool, dependencies, next_on_success, ...}}}` |
| 8 | `00_state_ledger/SUPERVISOR_DASHBOARD.json` | Pipeline summary: phase, circuit breaker, agent counts, eligible agents | start-runtime.js (init), supervisor operations | supervisor API route, Dashboard UI | `{pipeline_phase, circuit_breaker, summary, eligible_agents, agents: [{}]}` |
| 9 | `00_state_ledger/SUPERVISOR_NOTIFICATION.json` | Failure/error notifications from agent executions | run-tests.js (append) | None (archive) | `[{notification_id, agent_source, event_type, tier, ...}]` |
| 10 | `00_state_ledger/PIPELINE_EVENTS.jsonl` | Append-only event log (agent state changes, compliance, LLM iterations, artifacts) | AgentRuntime._logEvent, SupervisorAgent, supervisorSingleton, supervisorDaemon | events API route, lifecycle API route | JSONL — one JSON object per line, `{type, agent_id, timestamp, ...}` |
| 11 | `00_state_ledger/token_spend_log.json` | Monthly token spending total (USD) | LLMProvider (append) | None (monitoring) | `{"YYYY-MM": total_cost}` |
| 12 | `00_state_ledger/projects_index.json` | Maps project IDs to their STATE_MATRIX.json paths | Static (edits only) | projects API route | `{default_project, projects: {id: {name, state_path, ...}}}` |
| 13 | `00_state_ledger/A2A_TYPES.json` | Agent-to-Agent communication type definitions | Static | AgentRuntime | Schema definitions |
| 14 | `00_state_ledger/AGENT_TEMPLATES.json` | Agent template definitions | Static | Scaffolding | Template definitions |
| 15 | `00_state_ledger/CODE_REVIEW_SCHEMA.json` | Code review format schema | Static | Code review process | Schema definitions |
| 16 | `00_state_ledger/EVAL_RULES.json` | Evaluation rules for agent output | Static | AgentRuntime._evalRules | `{rules: [{id, message, condition}]}` |
| 17 | `00_state_ledger/MCP_SERVERS.json` | MCP server configurations | Static | MCP integration | Server configs |
| 18 | `00_state_ledger/rbac_config.json` | Role-based access control config | Static | API routes | RBAC rules |
| 19 | `00_state_ledger/tool_registry.json` | Tool definitions available to agents | Static | AgentRuntime | Tool definitions |
| 20 | `00_state_ledger/escalation_matrix.json` | Escalation rules for failures | Static | SupervisorAgent | Escalation rules |
| 21 | `00_state_ledger/jira_agent_mapping.json` | Jira ↔ Agent mapping | Static | Jira integration | Mapping rules |
| 22 | `00_state_ledger/memory_store/*.json` | Per-agent memory: run history, artifacts, usage | AgentRuntime (append) | AgentRuntime (read on init) | `{agentId, history: [{runId, timestamp, status, artifacts, usage}]}` |
| 23 | `00_state_ledger/prompt_snapshots/*/result.json` | Prompt snapshots for debugging | AgentRuntime (write at each LLM call) | Developer debugging | `{prompt, response, usage}` |

---

## Update Pattern Details

### 1. Root STATE_MATRIX.json — Canonical State

**Schema**:
```json
{
  "project_metadata": { "project_name", "version", "total_agents", ... },
  "supervisor_control": {
    "agent_00_supervisor": { "status", "current_action", "dispatch_queue", "cycle_count", ... },
    "stuck_agent_monitor": { "enabled", "timeout_threshold_ms", ... },
    "workflow_enforcement": { "feature_branch_required", "pr_tracking", ... },
    "loop_guardrails": { "max_consecutive", "circuit_breaker", "cooldown_seconds", ... },
    "approval_gates": { "gate_definitions": [...] },
    "pipeline_strategy": { "pool_scheduling", "max_concurrency", ... }
  },
  "pipeline_control": { "last_sync_timestamp" },
  "agent_states": {
    "01_ideation_agent": {
      "agent_id", "phase", "pool", "status", "dependencies",
      "requires_human_approval", "approved", "role",
      "artifacts_emitted", "last_activity_timestamp",
      "execution_count", "consecutive_failures",
      "compliance_checklist": [...],
      "last_error", "step_label",
      "last_run_duration_ms", "last_run_id", "run_id"
    },
    ...
  },
  "work_log": [...]
}
```

**Writers** (in order of frequency):
| File | What it updates | When | Syncs to project? |
|------|---------------|------|-------------------|
| `AgentRuntime.js` (lines 997-1012) | `agent_states[agentId]` status, artifacts, execution_count, last_error | After agent completes (success/fail/error) | YES — writes both root + project/ STATE_MATRIX |
| `runAgentProcess.js` (lines 47-54) | `agent_states[agentId]` status → `in_progress` | Before agent starts | YES — writes both root + project/ |
| `execute_agent_task.js` (lines 407-442) | Full agent state update (status, artifacts, compliance) | After task execution | YES — writes both root + project/ |
| `start-pipeline.js` (lines 105-110) | `agent_states` initial status, `supervisor_control` | Pipeline init | NO — root only |
| `supervisor_loop.js` (via SupervisorAgent) | State transitions, compliance flags | Each supervisor cycle | NO — root via SupervisorAgent |
| `app/api/.../agents/route.ts` (lines 112-114) | Agent state via REST API (manual override) | On API call (POST/PUT) | YES — writes both |
| `app/api/.../approve/route.ts` | Sets `approved: true`, updates status | On HITL approval | YES — writes both |
| `app/api/.../state/route.ts` | Reads only — no writes | N/A | N/A |
| `app/api/.../pipeline/route.ts` | Pipeline commands (start/pause/resume/stop) | On API call | YES — writes both |

**Read-only consumers**:
- ALL dashboard API routes (state, agents, agent-detail, sla, health, events, monitor, agent-lifecycle, jira)
- ALL dashboard UI components (DashboardClient, agents/page, agents/[id]/page, operations/page, quality/page)
- `supervisorDaemon.js` — polls every 5s for dispatch decisions
- `supervisorSingleton.js` — reads state for cooldown/status
- `TraceLogger.js` — reads state for context
- `LLMProvider.js` — reads state for agent context
- All test files

**Update trigger**: Agent completes execution → `_updateState` in AgentRuntime.js writes atomic update. Supervisor cycle loop polls and dispatches.

---

### 2. Project STATE_MATRIX.json — Per-Project Mirror

**Location**: `00_state_ledger/projects/petemart/STATE_MATRIX.json`

**Relationship to root**: Mirror/snapshot of root STATE_MATRIX.json scoped to a project. `projects_index.json` maps project ID → state_path.

**Writers**: Same as root — AgentRuntime.js, runAgentProcess.js, execute_agent_task.js, agents API, approve API, pipeline API all write to BOTH root AND project paths.

**Sync pattern**: When root is written, the writer also writes the project path using `path.replace('STATE_MATRIX.json', 'projects/petemart/STATE_MATRIX.json')`. The root is always canonical; project is a copy-for-scoping.

**Read-only consumers**: Project-scoped API routes (state with `?project=`, sla, health, events, agent-detail).

---

### 3. AGENT_REGISTRY.json — Static Agent Definitions

**Schema**:
```json
{
  "global_guardrails": { "output_contract", "required_extensions", "state_router", "change_history", "universal_law" },
  "agents": {
    "agent_id": {
      "role", "system_prompt", "workspace_root",
      "deliverables": { "human_readable", "structured_data" },
      "human_in_the_loop_gate": bool,
      "checkpoints": [{ "name", "instruction" }],
      "tools": [{ "type", "function": { "name", "description", "parameters" } }]
    }
  }
}
```

**Writers**: Static file — edited directly, never written at runtime.
**Readers**: AgentRuntime.js (reads agent def on init), SupervisorAgent (reads role/prompt).

---

### 4. TRACEABILITY_MATRIX.json — Agent ↔ Requirement Mapping

**Writers**: Static file — edited directly.
**Readers**: `supervisor_loop.js` lines 39, 172, 447 (compliance checks).

**Compliance checks performed**: `SUP-008` (Agent 0 validates all agents), `SUP-009` (upstream artifacts consumed), `SUP-010` (file exists).

---

### 5. PIPELINE_EVENTS.jsonl — Append-Only Event Log

**Schema**: One JSON object per line:

Event types emitted by `_logEvent` in AgentRuntime.js:
| Event type | When emitted | Data |
|-----------|-------------|------|
| `agent_started` | Agent launches | `{agent_id, run_id, llm, context}` |
| `agent_llm_error` | LLM call fails | `{agent_id, run_id, llm, error, is_balance_error}` |
| `agent_empty_result` | LLM returns empty | `{agent_id, run_id, llm, error}` |
| `agent_runtime_error` | Runtime exception | `{agent_id, run_id, error}` |
| `agent_cancelled` | User aborts | `{agent_id, reason}` |
| `agent_state_change` | State transitions | `{agent_id, from, to, status, notes, ...}` |
| `agent_awaiting_approval` | HITL gate reached | `{agent_id}` |
| `guardrail_blocked` | Guardrail check fails | `{agent_id, run_id, reason}` |
| `circuit_breaker_tripped` | Consecutive failures exceed limit | `{agent_id, reason}` |
| `compliance_failed` | Compliance audit fails | `{agent_id, run_id, items}` |
| `checkpoint_start` | Checkpoint phase begins | `{agent_id, phase, totalPhases, name}` |
| `checkpoint_complete` | Checkpoint phase ends | `{agent_id, phase, totalPhases, name, duration}` |
| `step_label` | Current execution step | `{agent_id, run_id, label}` |
| `artifact_writing` | Artifact being written | `{agent_id, run_id, artifact}` |
| `artifact_generation_start` | Artifact batch begins | `{agent_id, run_id, artifact_count}` |
| `artifact_generation_done` | Artifact batch ends | `{agent_id, run_id, artifact_count, duration_ms}` |
| `llm_iteration` | LLM iteration details | `{agent_id, iteration, type, usage, ...}` |
| `llm_iteration_error` | LLM iteration error | `{agent_id, iteration, error}` |
| `llm_cache_hit` | LLM result cache hit | `{agent_id, cache_key}` |
| `eval_rule_failed` | Eval rule violation | `{agent_id, rule, message}` |

**Writers**: AgentRuntime.js (line 1067 `_logEvent`), supervisorDaemon.js, supervisorSingleton.js, SupervisorAgent.js
**Readers**: events API route (`app/api/agentic-console/events/route.ts`), supervisor_loop.js

**Update pattern**: `_logEvent` uses `fs.appendFileSync` — always appends, never rewrites. File grows unbounded (~9300 lines currently).

---

### 6. CHANGE_REQUEST.json — Immutable Change History

**Location**: `00_state_ledger/CHANGE_REQUEST.json`

**Schema**: `{ledger_metadata, active_requests: [{request_id, agent_id, event_type, description, trigger, status, completed_at}]}`

**Writer**: `AgentRuntime.js` line 956 — appends after state transition.
**Readers**: None at runtime (historical archive).

---

### 7. WORKFLOW_DAG.json — Dependency Graph

**Schema**: `{version, description, nodes: {agent_id: {id, phase, pool, dependencies, conditionals, forks, next_on_success, next_on_failure, allow_skip, max_retries}}}`

**Writers**: Static file.
**Readers**: `pipeline/route.ts` (DAG), test files.

---

### 8. SUPERVISOR_DASHBOARD.json — Pipeline Summary

**Schema**: `{pipeline_phase, pipeline_paused, cycle_count, circuit_breaker, summary: {total_agents, completed, in_progress, pending, ...}, eligible_agents: [{id, role, phase}], agents: [{id, status, role, phase, ...}]}`

**Writer**: `start-runtime.js` line 124 (initializes on start).
**Reader**: `supervisor/route.ts` (GET) → returns to Dashboard UI.

**Note**: Not updated continuously — written once on init. The UI reads from this but live state comes from STATE_MATRIX.json directly via `state/route.ts`.

---

### 9. SUPERVISOR_NOTIFICATION.json — Failure Notifications

**Schema**: `[{notification_id, agent_source, event_type, timestamp, tier, failed_count, defect_ids, ...}]`

**Writer**: `run-tests.js` line 212 (appends test failure notifications).
**Readers**: None at runtime (archive).

---

### 10. token_spend_log.json — Monthly Cost Tracking

**Schema**: `{"YYYY-MM": total_cost_usd}`

**Writer**: `LLMProvider.js` line 5 — appends cost after each LLM call.
**Readers**: FinOps agent, dashboard.

---

### 11. Execution Plan (EXECUTION_PLAN.json)

**Writers**: Human-edited manually.
**Readers**: AI assistant (on session start to determine what to work on next).

**Not a runtime state file** — it's a human-readable task tracker for cross-session continuity.

---

### 12. memory_store/*.json — Per-Agent Run History

**Location**: `00_state_ledger/memory_store/{agent_id}.json`

**Writer**: AgentRuntime.js (`_saveMemory`) — appends run history after each execution.
**Readers**: AgentRuntime.js (`_loadMemory`) — reads agent's past runs on init.

**Schema**: `{agentId, history: [{runId, timestamp, status, duration, artifacts: [], contentPreview, usage: {prompt_tokens, completion_tokens, ...}}]}`

---

### 13. prompt_snapshots/*/result.json — LLM Call Snapshots

**Location**: `00_state_ledger/prompt_snapshots/{run_id}/result.json`

**Writer**: AgentRuntime.js — writes prompt & response on each LLM iteration.
**Readers**: Development/debugging only.

---

## Key Sync Patterns

### Root ↔ Project STATE_MATRIX.json Sync

```
Writes always go to BOTH paths:
  Root:   00_state_ledger/STATE_MATRIX.json
  Project: 00_state_ledger/projects/{project}/STATE_MATRIX.json

Sync mechanism (AgentRuntime.js lines 997-1012):
  rootPath = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json')
  projPath = rootPath.replace('STATE_MATRIX.json', 'projects/petemart/STATE_MATRIX.json')
  fs.writeFileSync(rootPath, ...)
  fs.writeFileSync(projPath, ...)

Same pattern in: runAgentProcess.js, execute_agent_task.js, agents API, approve API, pipeline API
```

### Read Precedence

```
API routes with ?project= parameter:
  1. Check 00_state_ledger/projects/{project}/STATE_MATRIX.json
  2. If not found, fallback to root 00_state_ledger/STATE_MATRIX.json

API routes without ?project=:
  Always read 00_state_ledger/STATE_MATRIX.json
```

---

## Runtime Writers Summary

| Process/File | State files it writes | When it writes |
|-------------|----------------------|----------------|
| `AgentRuntime.js` | STATE_MATRIX.json (root+proj), PIPELINE_EVENTS.jsonl, CHANGE_REQUEST.json, memory_store/*, prompt_snapshots/* | After agent completes, after LLM call, on state transition |
| `runAgentProcess.js` | STATE_MATRIX.json (root+proj) | Before agent starts (set in_progress) |
| `execute_agent_task.js` | STATE_MATRIX.json (root+proj) | After task execution |
| `supervisorDaemon.js` | PIPELINE_EVENTS.jsonl | On agent dispatch, errors |
| `supervisorSingleton.js` | PIPELINE_EVENTS.jsonl | On pipeline events |
| `SupervisorAgent.js` | PIPELINE_EVENTS.jsonl, STATE_MATRIX.json | On compliance checks, state transitions |
| `start-pipeline.js` | STATE_MATRIX.json (root only) | On pipeline init |
| `start-runtime.js` | SUPERVISOR_DASHBOARD.json | On startup |
| `LLMProvider.js` | token_spend_log.json | On each LLM call |
| `run-tests.js` | SUPERVISOR_NOTIFICATION.json | On test failures |
| `app/api/.../agents/route.ts` | STATE_MATRIX.json (root+proj) | On REST API state mutation |
| `app/api/.../approve/route.ts` | STATE_MATRIX.json (root+proj) | On HITL approval |
| `app/api/.../pipeline/route.ts` | STATE_MATRIX.json (root+proj) | On pipeline command |

---

## Static Files (never written at runtime)

| File | Last meaningful edit | How to update |
|------|--------------------|---------------|
| `AGENT_REGISTRY.json` | Manual | Edit directly |
| `TRACEABILITY_MATRIX.json` | Manual | Edit directly |
| `WORKFLOW_DAG.json` | Manual | Edit directly |
| `A2A_TYPES.json` | Manual | Edit directly |
| `AGENT_TEMPLATES.json` | Manual | Edit directly |
| `CODE_REVIEW_SCHEMA.json` | Manual | Edit directly |
| `EVAL_RULES.json` | Manual | Edit directly |
| `MCP_SERVERS.json` | Manual | Edit directly |
| `rbac_config.json` | Manual | Edit directly |
| `tool_registry.json` | Manual | Edit directly |
| `escalation_matrix.json` | Manual | Edit directly |
| `jira_agent_mapping.json` | Manual | Edit directly |
| `projects_index.json` | Manual | Edit directly |
| `EXECUTION_PLAN.json` | Human-edited | Manual edit |


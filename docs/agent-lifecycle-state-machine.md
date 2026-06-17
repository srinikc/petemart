# Agent Lifecycle State Machine — Full E2E Workflow & Optimization Strategy

> **Scope**: All 16 agents (0-15). Covers re-run workflow from `pending` → `approved` / `failed`.
> **Source**: `supervisor_loop.js`, `AgentRuntime.js`, `LLMProvider.js`, `STATE_MATRIX.json`, `AGENT_REGISTRY.json`
> **Last Updated**: 2026-06-16 (with Optimization Strategy)

---

## 1. State Diagram

```
                        ┌───────────────────────┐
                        │      disabled          │ ← skipped entirely, not part of pipeline
                        └───────────────────────┘

                        ┌───────────────────────┐
                        │    pending / idle      │ ← triggered by supervisor cycle,
                        │                        │   force-agent, dependency re-open,
                        │                        │   or user "Re-run" from Cockpit
                        └───────────┬───────────┘
                                    │
                         supervisor │ loop picks
                         eligibility│ up (next cycle)
                                    ▼
                        ┌───────────────────────┐
                        │    in_progress        │ ← executor spawned (execute_agent_task.js
                        │    / active           │   or AgentRuntime.runAgent)
                        └───────────┬───────────┘
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
                 ┌───────────────┐   ┌──────────────────┐
                 │  guardrail    │   │  initializing     │
                 │  check        │   │  (step_label)     │
                 │  (max execs)  │   │  ~2-5s            │
                 └───────┬───────┘   └────────┬─────────┘
                         │                    │
                         │       ┌────────────┴────────────┐
                         │       │  gather dependency      │
                         │       │  context (read upstream  │
                         │       │  artifacts from disk)    │
                         │       │  ~1-3s                  │
                         │       └────────────┬─────────────┘
                         │                    │
                         │       ┌────────────┴─────────────┐
                         │       │  calling LLM              │
                         │       │  (step_label)             │
                         │       │  LLM iterations 1-25      │
                         │       │  OR checkpoint phases 1-4 │
                         │       │  ~~ 30s - 515s ~~         │
                         │       │                           │
                         │       │  PER-ITERATION TIMEOUT:   │
                         │       │  60s base + 1s/1K chars   │
                         │       │  past 5K, capped at 120s  │
                         │       │                           │
                         │       │  BACKOFF: 2s on error     │
                         │       │  Context: last 32 messages│
                         │       │  (first 2 preserved)      │
                         │       └────────────┬─────────────┘
                         │                    │
                         │       ┌────────────┴─────────────┐
                         │       │  processing results       │
                         │       │  (step_label)             │
                         │       │  compliance audit         │
                         │       │  ~1-5s                    │
                         │       └────────────┬─────────────┘
                         │                    │
                         │       ┌────────────┴─────────────┐
                         │       │  writing artifacts        │
                         │       │  (step_label)             │
                         │       │  archive old → write new  │
                         │       │  ~1-5s per artifact       │
                         │       └────────────┬─────────────┘
                         │                    │
                         │        ┌───────────┴───────────┐
                         │        ▼                       ▼
                         │  ┌───────────┐       ┌───────────────────┐
                         │  │  failed   │       │  approved /        │
                         │  │           │       │  awaiting_approval │
                         │  │           │       │                   │
                         │  │ CIRCUIT   │       │  if HITL gate →   │
                         │  │ BREAKER   │       │  awaiting_approval │
                         │  │ after 5   │       │  else → approved   │
                         │  │ failures  │       └────────┬──────────┘
                         │  └───────────┘                │
                         │                               ▼
                         │                     ┌──────────────────────┐
                         │                     │  HITL approval gate  │
                         │                     │  (agent waits)        │
                         │                     │                       │
                         │                     │  TIMEOUT: 24h         │
                         │                     │  (escalation.json     │
                         │                     │   level: medium)      │
                         │                     │                       │
                         │                     │  User approves from   │
                         │                     │  Cockpit or CLI:      │
                         │                     │  status → 'approved'  │
                         │                     └──────────┬───────────┘
                         │                                │
                         │      supervisor loop picks up  │
                         │      on next cycle             │
                         └────────────────────────────────┘
                         (re-run: user clicks "Re-run"
                          → sets to pending → loop picks up)

    DOWNSTREAM CASCADE:
    ┌──────────────────────────────────────────────┐
    │ If upstream agent is re-opened (re-run),      │
    │ downstream agents get:                        │
    │   status  → 'pending'                         │
    │   last_error → 'DOWNSTREAM_RESET: Upstream X  │
    │                 re-run — reset to pending'     │
    │ All downstream compliance resets too.          │
    └──────────────────────────────────────────────┘
```

---

## 2. All States & Their Timing Constants

| State | Trigger | Typical Duration | Timeout / Guard |
|-------|---------|-----------------|-----------------|
| `disabled` | Flag in STATE_MATRIX | N/A | Skipped entirely |
| `pending` | Force-queue, dependency re-open, supervisor | ~5s (next cycle) | — |
| `in_progress` | Supervisor launches executor | **varies** (see §3) | Stuck: 10min base + 2s/KB deps (+5min max = 15min total). Max 2 relaunches, then → `failed` |
| `initializing` | AgentRuntime first step | 2-5s | — |
| `calling LLM` | LLM tool loop | **bulk of time** (30s-515s) | Per iteration: 60-120s. Max 25 iterations |
| `processing results` | Post-LLM compliance | 1-5s | — |
| `writing artifacts` | Save files to disk | 1-5s per artifact | — |
| `awaiting_approval` | HITL gate (needs human) | **indefinite** | Escalation: 24h (medium severity) |
| `approved` | Human approval | Terminal | — |
| `failed` | Error / compliance / stuck | Terminal (unless re-run) | Circuit breaker at 5 consecutive |
| `cancelled` | User abort via Cockpit | Terminal | — |

### Supervisor Loop Timing

| Parameter | Value | Source |
|-----------|-------|--------|
| `cool_down_between_cycles_s` | **5s** | `STATE_MATRIX.json:225` |
| `max_concurrent_agents` | **3** | `STATE_MATRIX.json:226` |
| `max_cycles_lifetime` | **100** (current: 56) | `STATE_MATRIX.json:220` |
| `cycle_count` | **56** (as of 2026-06-15) | `STATE_MATRIX.json:23` |
| `stuck_check_interval_ms` | **15s** | `STATE_MATRIX.json:34` |
| `stuck_timeout_base_ms` | **600,000** (10min) | `STATE_MATRIX.json:33` |
| `stuck_timeout_adaptive` | +2s per KB of dep artifacts, **max +300s** | `supervisor_loop.js:330` |
| `max_relaunch_attempts` | **2** | `STATE_MATRIX.json:37` |

### LLM Provider Timing

| Parameter | Value | Source |
|-----------|-------|--------|
| `_computeTimeout` base | **60s** | `LLMProvider.js:77` |
| Extra per 1K chars past 5K | **+1s** (capped at +60s = 120s total) | `LLMProvider.js:78-82` |
| `MAX_ITERATIONS` per agent | **25** | `AgentRuntime.js:321` |
| Backoff on error | **2s** | `AgentRuntime.js:347` |
| Context window (messages) | Last **32**, preserve first **2** | `AgentRuntime.js:404` |
| Dependency context limit | **30K chars** | `AgentRuntime.js:747` |
| Previous output limit | **10K chars** | `AgentRuntime.js:758` |

---

## 3. Real-World Agent Run Durations

| Agent | Last Duration | Checkpoints | LLM Iterations | Notes |
|-------|--------------|-------------|-----------------|-------|
| 01-ideation | ~180s | 4 phases | ~8-12 | Generates 400+ merchant profiles, PPTX, XLSX |
| 02-requirement | ~240s | 4 phases | ~10-15 | 103 Requirement IDs, 10 categories |
| **03-architect** | **515,896ms (8.6 min)** | **4 phases** | **~13 iterations** | **LONGEST — covers full architecture + POC + costing + diagrams + integration guide** |
| 04-prototype | ~120s | 4 phases | ~6-8 | POC workspace, 8 merchants |
| 05-15 (typical code agents) | ~120-300s | No checkpoints (or 4 phases) | ~5-15 | Varies by complexity |

### 4. Re-run Flow End-to-End Timeline (example: 03-architect re-run)

```
T+0s      User clicks "Re-run" in Cockpit
          → status: pending, clears last_error, resets counters

T+5s      Supervisor loop cycle picks it up (5s cooldown)
          → status: in_progress, spawns executor

T+6s      Executor loads agent def, gathers dependency context
          → step: initializing (~2-5s)

T+10s     Checkpoint 1/4: Read & Analyze PRD
          LLM reads ~103 requirements from upstream
          → first LLM call (60-120s timeout)

T+130s    Checkpoint 2/4: Full Architecture Design
          LLM generates architecture sections (API, caching, queue, security...)
          → multiple LLM iterations

T+260s    Checkpoint 3/4: POC Architecture & Diagrams
          LLM generates Mermaid diagrams, POC scope
          → multiple LLM iterations

T+380s    Checkpoint 4/4: Costing, Integration & Final Outputs
          LLM generates cost models, Stitch guide, guardrail verification
          → final LLM iterations

T+516s    Writing artifacts → compliance audit → awaiting_approval

          === STUCK DETECTION WINDOW (concurrent) ===
          If agent stalls >10min in any step:
          → auto-relaunch (max 2 times, +10-15min each)
          → then marks failed

          === APPROVAL GATE ===
          Agent stays in awaiting_approval indefinitely
          → 24h timeout before escalation
          → user approves → status: approved

          === DOWNSTREAM CASCADE ===
          If upstream agent is re-opened (re-run), downstream agents get:
          → status: 'pending'
          → last_error: 'DOWNSTREAM_RESET: Upstream X re-run — reset to pending'
          All downstream compliance resets too.
```

---

## 5. Optimization Opportunities & Recommendations

This section outlines key problem areas leading to extended execution times or stuck agents, along with actionable recommendations to achieve optimal time and successful E2E agent execution.

### 🔴 HIGH IMPACT Recommendations (Focus on LLM & Checkpoints)

| # | Problem | Root Cause | Recommendation | Est. Improvement |
|---|---------|-----------|-------------|------------------|
| 1 | **4 sequential LLM checkpoints** each running a full LLM tool loop serially (~130s each), leading to redundant context re-loading and serialized processing. | `_runCheckpointedPipeline` currently treats each checkpoint as an independent LLM invocation, multiplying overall runtime. | **Refactor `_runCheckpointedPipeline` for dynamic checkpoint merging / single LLM call per agent:** For agents with checkpoints, provide the LLM with *all* checkpoint instructions upfront and guide it to progress through phases within *one* continuous `_llmToolLoop` invocation. The runtime monitors progress and only intervenes if the LLM deviates or needs re-prompting. | **~40% reduction (515s → ~300s)** on checkpointed agents |
| 2 | **13+ LLM iterations** due to `write_artifact` calls being sequential, requiring a separate LLM round-trip for each file generated. | Each `write_artifact` call triggers an LLM interaction, incurring network latency and processing time per file. LLMs often produce one tool call at a time. | **Implement Batch Artifact Writing**: Enhance `write_artifact` or introduce a new `write_artifacts_batch` tool that accepts an array of `{name, data, type}` objects. The LLM can then generate all required files in a single tool call, and `AgentRuntime` can write them in parallel. | **~30% reduction** on overall LLM call time |
| 3 | **Dependency context inflation**: Despite 30K char limit, full PRD text in system prompt still causes long LLM processing, contributing to timeout scaling. | Large dependency artifacts are injected directly into the system prompt. While truncated, they are still substantial, increasing token count and processing time for the LLM. | **Implement Smart Dependency Context Chunking & On-Demand Loading**: Inject only a summary, table-of-contents, or key sections of large dependency artifacts into the initial system prompt. Instruct the LLM to use the `read_dependency` tool to fetch specific details (e.g., individual requirements by ID) on demand when needed for its current task. This requires explicit LLM guidance. | **~20% reduction** on initial LLM call time |
| 4 | **No response caching between re-runs**: Identical inputs on re-runs lead to full regeneration, wasting tokens and time. | The system currently re-executes the entire LLM process from scratch even if the input context (prompt, dependencies, user instruction) hasn't changed. | **Implement LLM Response Caching**: Introduce an in-memory or file-based cache for LLM responses, keyed by a hash of the system prompt, messages, and tools. If a cache hit occurs, use the cached response. Invalidate the cache when relevant inputs change or on explicit agent reset. | **80-100% reduction** on repeat runs with identical inputs |
| 5 | **`archive oldartifacts` I/O overhead**: Copies/renames files on every `write_artifact` call, incurring frequent disk I/O. | The `write_artifact` tool immediately archives the previous version of a file every time it's called, even for intermediate drafts. | **Debounce Archiving / Final Write Archiving**: Modify `AgentRuntime._defaultTools.write_artifact` to only archive the *final* version of a file when the agent's entire run is complete (i.e., during the `_runPipeline` phase), not during intermediate LLM tool calls. Intermediate writes could use a simple overwrite. | **~5-10s saved** per agent run with multiple artifacts |

### 🟡 MEDIUM IMPACT Recommendations (Improve Responsiveness & Flow)

| # | Problem | Root Cause | Recommendation |
|---|---------|-----------|-------------|
| 6 | **Stuck agent detection timeout too conservative**: 10min base + 5min adaptive = 15min wait before auto-relaunch, especially for non-LLM steps. | The `stuck_agent_monitor` uses a single, long timeout for all `in_progress` steps. Non-LLM I/O bound steps should be much faster. | **Implement Context-Aware Stuck Agent Timers**: Modify `supervisor_loop.js` to use different `timeout_threshold_ms` based on the agent's `step_label`. Keep the current (or slightly reduced) timeout for `calling LLM` steps. For `initializing`, `gather dependency context`, `processing results`, and `writing artifacts` (local I/O), reduce the base timeout to 2-3 minutes. | 
| 7 | **Supervisor 5s cooldown adds up**: 56 cycles × 5s = 280s cumulative idle time. | A static 5-second delay between each supervisor cycle makes the overall pipeline less reactive. | **Reduce Supervisor Cooldown**: Change `cooldown_between_cycles_s` from `5s` to `2s` in `STATE_MATRIX.json`. For more advanced control, make it adaptive (e.g., shorter after successful cycles, longer after failures). |
| 8 | **No parallel artifact writing in `_runPipeline`**: Files written sequentially after LLM completion. | The loop iterating through `result.artifacts` to call `fs.writeFileSync` is synchronous. | **Parallelize Artifact Writing**: In `AgentRuntime._runPipeline`, wrap the `fs.writeFileSync` calls in a `Promise.all(result.artifacts.map(async (art) => { ... }))` to write files concurrently. |
| 9 | **LLM provider fallback overhead**: On error, 2s backoff and retry with the same (potentially failing) provider. | `_llmToolLoop` currently retries the same LLM provider on network errors. | **Implement Parallel LLM Provider Fallback**: In `LLMProvider.js`, modify `complete` to query a prioritized list of LLM providers concurrently (e.g., DeepSeek, OpenRouter, Anthropic) and take the first successful response. This would replace the simple 2s backoff retry for single provider. |
| 10 | **Prolonged HITL gate stalls**: 24h escalation for `awaiting_approval` is too long for responsive development. | The current system waits up to 24 hours before escalating a lack of human approval. | **Proactive HITL Gate Notifications**: Implement an earlier notification system (e.g., 4-hour alert) to the human gatekeeper when an agent enters `awaiting_approval` status and remains unapproved. This would be configured in `escalation_matrix.json`. |

### 🟢 LOW IMPACT / ALREADY OPTIMIZED (and verified during analysis)

| # | Item | Status |
|---|------|--------|
| 11 | **Context truncation**: Dependency context at 30K chars, previous output at 10K. | ✅ Already implemented. These limits help prevent extreme token usage and LLM overload. |
| 12 | **Message window pruning**: Keeps last 30 messages + first 2 in `_llmToolLoop`. | ✅ Already implemented. Essential for managing LLM context window efficiently across iterations. |
| 13 | **Adaptive stuck timeout** based on dependency artifact size. | ✅ Already implemented. Improves accuracy of stuck detection by accounting for workload complexity. |
| 14 | **Auto-approval for non-HITL agents** that pass compliance. | ✅ Already implemented. Streamlines pipeline by skipping unnecessary human gates for fully compliant agents. |
| 15 | **Concurrent agent launching** (max 3 in async pool). | ✅ Already implemented. Maximizes throughput by running independent agents in parallel within the supervisor loop. |

---

## 6. Quick Reference: Key Constants & Files for Tweak

```jsonc
// STATE_MATRIX.json → supervisor_control.loop_guardrails
{
  "cooldown_between_cycles_s": 2,        // [OPTIMIZED] Reduce from 5 to 2 seconds.
  "max_concurrent_agents": 3,            // Can be increased to 4-5 in async pool if resources allow.
  "max_sequential_executions_per_agent": 10 // Keep as is, or adjust based on observation.
}

// STATE_MATRIX.json → supervisor_control.stuck_agent_monitor
{
  "timeout_threshold_ms": 300000,        // [OPTIMIZED] Reduce from 600000 (10min) to 300000 (5min) for non-LLM steps (see Rec #6).
  "check_interval_ms": 15000,            // Keep as is, or adjust if supervisor becomes overloaded.
  "max_relaunch_attempts": 2             // Keep as is; allows for some self-recovery.
}

// scripts/runtime/AgentRuntime.js (code modification required)
const MAX_ITERATIONS = 15;                // [OPTIMIZED] Reduce from 25 to 15 for non-checkpoint agents.
const MAX_DEP_CTX = 30000;                // Keep 30K, or reduce further to 15K if context issues persist (see Rec #3).

// scripts/runtime/LLMProvider.js (code modification required)
const baseMs = 60000;                     // Consider reducing baseMs for _computeTimeout to 30000-45000 (30-45s) for faster LLM failure detection (see Rec #9).
// +1s per 1K chars past 5K, capped at 120s
```

---
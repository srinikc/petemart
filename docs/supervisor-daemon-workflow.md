# Supervisor Daemon Workflow

## Overview

The supervisor daemon (`scripts/runtime/supervisorDaemon.js`) runs as a background loop within the Next.js dev server process. It is auto-started by `dev-server.js` on boot and can be stopped/started via the dashboard UI (Start/Stop buttons).

## Cycle Loop

Every ~2 seconds, `daemonLoop()` calls `runCycle()`:

```
runCycle()
  │
  ├─ 1. Read STATE_MATRIX.json
  │
  ├─ 2. Write daemon heartbeat + status
  │
  ├─ 3. Validate dependency chain
  │     For every agent with status approved/completed/awaiting_approval:
  │     If any upstream dependency is NOT approved/completed:
  │       → Reset agent to pending
  │       → Log dependency_cascade_reset event
  │
  ├─ 4. Check pipeline paused? → skip
  │
  ├─ 5. Auto-approve awaiting_approval agents
  │     For each agent in awaiting_approval:
  │       If compliance audit passes (allPassed):
  │         → Set to in_progress, create task manifest
  │
  ├─ 6. Find eligible agents (getEligibleAgents)
  │     Filters agents where:
  │     - status = pending
  │     - NOT disabled
  │     - execution_count < max (3)
  │     - NOT failed, NOT in_progress, NOT active
  │     - dependenciesMet() = true (all upstream approved/completed)
  │     - circuit breaker NOT tripped
  │
  ├─ 7. Circuit breaker tripped? → skip
  │
  ├─ 8. No eligible agents?
  │     If ALL agents done → log pipeline_complete
  │     Else → log no_eligible_agents
  │
  ├─ 9. For each eligible agent (max concurrent = 3):
  │     a. Compliance has fatal failures?
  │        → Set status = failed, increment consecutive_failures
  │        → If consecutive_failures >= 5 → trip circuit breaker
  │     b. requires_human_approval?
  │        → Set status = awaiting_approval
  │     c. Otherwise:
  │        → Set status = in_progress
  │        → Create task manifest file
  │
  ├─ 10. Track idle cycles
  │      If no agents launched AND no eligible agents:
  │        → Increment idle_cycles
  │        → If idle_cycles >= 50 (max_idle_cycles):
  │          → Log max_idle_cycles_reached
  │          → Show "Idle timeout" in current_action
  │      Else:
  │        → Reset idle_cycles to 0
  │
  └─ 11. Save state, update dashboard
```

## Guardrails

| Guardrail | Threshold | Effect |
|-----------|-----------|--------|
| Consecutive agent failures | 5 | Circuit breaker trips → all agent execution blocked |
| Max executions per agent | 3 | Agent won't be re-launched after 3 attempts |
| Max concurrent agents | 3 | Only 3 agents run simultaneously in sync pool |
| Idle cycle timeout | 50 cycles (~100s) | Warning logged, status shows idle timeout |
| Cycle timeout | 60 seconds | If runCycle hangs >60s, it's treated as error, daemon continues |
| Dependency chain validation | Every cycle | Inconsistent states auto-corrected |

## Agent Statuses

| Status | Meaning | Set by |
|--------|---------|--------|
| `pending` | In queue, waiting to run | Initial state, daemon cascade reset |
| `in_progress` | Currently executing | Daemon on launch |
| `active` | Currently executing (alt) | API routes |
| `awaiting_approval` | Done but needs HITL sign-off | Daemon (if requires_human_approval) |
| `approved` | Passed all gates | API approve route |
| `completed` | Finished successfully | AgentRuntime |
| `failed` | Execution or compliance failed | Daemon, AgentRuntime |
| `cancelled` | Cancelled by user | API cancel route |
| `idle` | Not yet in pipeline | Initial state for supervisor |

## Dependency Chain

Agents declare dependencies in STATE_MATRIX.json:

```
03_architect_agent ──► 04_prototype_agent ──► 05_program_mgmt
                                                   │
                                           ┌───────┴───────┐
                                       07a_ui          07b_api
                                           │               │
                                           └───────┬───────┘
                                                07d_integration
                                                      │
                                                   08_qa
                                                      │
                                                   09_prod ──► 10..15
```

`dependenciesMet()` checks every dependency is `approved` or `completed`. Dependency chain validation (step 3) runs every cycle to auto-correct any inconsistent states.

## Events Logged to PIPELINE_EVENTS.jsonl

| Event | When |
|-------|------|
| `dependency_cascade_reset` | Agent reset due to upstream dep not met |
| `auto_launched` | Agent auto-approved and launched |
| `agent_awaiting_approval` | Agent moved to awaiting_approval |
| `agent_launched` | Agent started |
| `compliance_failed` | Agent compliance audit failed |
| `circuit_breaker_tripped` | Circuit breaker activated |
| `circuit_breaker_active` | Cycle skipped due to tripped breaker |
| `max_idle_cycles_reached` | Daemon idle for 50+ consecutive cycles |
| `pipeline_complete` | All agents processed |
| `no_eligible_agents` | No agents ready to run |

## Daemon Health Detection

The daemon writes `daemon_last_heartbeat` (timestamp) at the start of every cycle. The dashboard checks:

```
if (daemon_last_heartbeat exists && Date.now() - heartbeat < 30000)
  → "Daemon: Running" (green dot)
else
  → "Daemon: Stopped" (red dot) + Start button shown
```

If the daemon process crashes, the heartbeat goes stale within 30 seconds and the UI shows Stopped. Clicking Start calls `start_supervisor` which relaunches the daemon loop.

## Auto-Approve

The daemon automatically approves agents in `awaiting_approval` status if they pass the compliance audit. However, the compliance audit checks all checklist items including `workflow` and `traceability` types, which currently evaluate to `false` in `_auditAll()`. This means auto-approve rarely triggers in practice — most agents require manual HITL approval.

# Adoption Plan — Borrow from Open Source, Keep Petemart Unique

> **Date**: 2026-06-18
> **Goal**: Fix agent runtime by adopting proven patterns from LangGraph, CrewAI, n8n, and AgentScope — while keeping Petemart's compliance/audit/traceability layer completely intact.

---

## Part 1: LangGraph StateGraph — What Is It?

### Not Proprietary — MIT Licensed + Academic Standard

| Question | Answer |
|----------|--------|
| **License** | **MIT** — free to use, modify, embed, distribute. No restrictions. |
| **Is it "industry standard"?** | **Yes** — LangGraph is the most widely adopted agent orchestration runtime (35k★, used by Klarna, Replit, Elastic in production). The StateGraph pattern is derived from **Google's Pregel** (2010 SOSP best paper) and **Apache Beam** — both battle-tested at Google scale. |
| **Is there a JS/TS version?** | **Yes** — [`langgraphjs`](https://github.com/langchain-ai/langgraphjs) is the official JavaScript/TypeScript port. Same MIT license, same API. Runs in Node.js — our stack. |
| **Lock-in risk?** | **None** — StateGraph is a design pattern, not a proprietary protocol. If you stop using LangGraph, you keep the graph structure and port to any framework. |
| **Competing standards?** | **CrewAI Flows** (event-driven), **n8n nodes** (visual DAGs), **Temporal** (durable workflows). But LangGraph is the dominant runtime for LLM-native state machines. |

### LangGraph StateGraph in One Diagram

```mermaid
flowchart LR
    subgraph LangGraph["LangGraph StateGraph"]
        direction TB
        A[StateGraph<br/>Typed State] --> B[add_node<br/>market_research]
        A --> C[add_node<br/>requirement_analysis]
        A --> D[add_node<br/>architecture]
        B --> E[add_edge<br/>market_research → req]
        C --> F[add_conditional_edges<br/>req → arch or redo]
        E --> G[compiled graph]
        F --> G
        G --> H[graph.invoke<br/>or graph.astream]
    end
    
    subgraph Petemart["Today's Petemart"]
        I[daemonLoop<br/>while(true)]
        J[runCycle<br/>state file I/O]
        K[AgentRuntime<br/>_llmToolLoop]
        I --> J --> K
    end
```

**Petemart's daemon loop** is imperative (`while(true) { read file; process; write file; sleep }`). **LangGraph** is declarative (`graph = StateGraph(); graph.add_node(...); graph.compile(); graph.invoke(state)`). The library handles state persistence, checkpointing, streaming, and error recovery.

---

## Part 2: What to Adopt vs. Keep

### Keep 100% — Petemart's Unique Layer (Untouched)

```
src/petemart/
├── compliance/          ← KEEP: Agent 0 compliance audit engine
│   ├── AuditEngine.js       — runs compliance_checklist per agent
│   ├── TraceabilityMatrix   — validates artifacts → PRD IDs
│   └── GateManager.js       — approval gates (TECH-STACK, COSTING, etc.)
├── review/              ← KEEP: Expert reviewer system
│   └── ExpertReviewer.js    — maps agents → industry roles
├── governance/          ← KEEP: Feature branch enforcement
│   ├── PreCommitHook.js
│   └── PRTemplateValidator.js
├── output/              ← KEEP: Universal output requirements
│   ├── SlideGenerator.js    — .pptx per agent
│   └── ExcelGenerator.js    — .xlsx per agent
├── tracking/            ← KEEP: Token & cost tracking
│   ├── TokenTracker.js
│   └── FinOpsAgent.js
└── domain/              ← KEEP: Hyper-local e-commerce specialization
    └── BangaloreMarkets.js  — 21 Pete markets, 400+ merchants
```

### Replace — Agent Runtime (Broken Today)

```
scripts/
├── supervisorDaemon.js    ← REPLACE with LangGraph StateGraph
├── supervisor_loop.js     ← REPLACE with LangGraph compiled graph
├── AgentRuntime.js        ← REPLACE _llmToolLoop with LangGraph ReAct
├── LLMProvider.js         ← KEEP (works fine, abstraction is solid)
├── LLMOpenAIProvider.js   ← KEEP
└── LLMOpenCodeProvider.js ← KEEP
```

### Add — New Infrastructure (Missing Today)

```
scripts/
├── state/                ← NEW: SQLite-based state persistence
│   ├── StateManager.js       — atomic writes, concurrent readers
│   └── migrations/           — schema evolution
├── queue/                ← NEW: Message queue for parallel execution
│   └── AgentQueue.js         — BullMQ or in-process EventEmitter
└── tools/                ← NEW: Tool registry with MCP support
    ├── ToolRegistry.js        — discoverable, typed tool definitions
    └── MCPServer.js           — MCP protocol for external tools
```

---

## Part 3: Key Changes — Ranked by Impact

### P0 — Fix Agent Execution (Broken Today)

| # | Change | From (Current) | To (Adopt) | Framework Source | Effort |
|---|--------|---------------|------------|------------------|--------|
| 1 | **Orchestration engine** | `supervisorDaemon.js` polling loop | LangGraph StateGraph (JS) — compiled graph with typed state, edges, nodes | LangGraph | 1 week |
| 2 | **State persistence** | `STATE_MATRIX.json` file I/O | **SQLite** (via `better-sqlite3`) with WAL mode — atomic transactions, concurrent readers, crash-safe | LangGraph pattern | 2 days |
| 3 | **Agent execution loop** | `_llmToolLoop()` custom 15-iter loop | LangGraph `AgentExecutor` with ReAct pattern — built-in streaming, checkpoint, error recovery | LangGraph | 3 days |
| 4 | **Parallel execution** | Sequential `await` in for-loop | **BullMQ** (Redis-backed) or in-process `EventEmitter` — fire-and-forget agent dispatch | n8n pattern | 2 days |
| 5 | **Error handling** | ~37 empty `catch {}` blocks | Structured error taxonomy — `{code, severity, message, retryable}` + DLQ | n8n | 1 day |

### P1 — Agent Design & Output Quality

| # | Change | From (Current) | To (Adopt) | Framework Source | Effort |
|---|--------|---------------|------------|------------------|--------|
| 6 | **Agent identity** | Monolithic `system_prompt` string | Structured `role` + `goal` + `backstory` fields (CrewAI pattern) | CrewAI | 1 day |
| 7 | **Output validation** | `artifact_exists()` file check | **Zod** schemas (TypeScript-native) — validate every JSON artifact against typed schema | CrewAI | 2 days |
| 8 | **Context budgeting** | Full dependency files (up to 50KB each) | Selective context injection — max 30KB, summarize oversized artifacts | CrewAI | 1 day |
| 9 | **Tool registry** | 4 hardcoded handlers | `BaseTool` class + `ToolRegistry` — discoverable, typed, credential-aware | n8n + CrewAI | 2 days |

### P2 — Observability & Security

| # | Change | From (Current) | To (Adopt) | Framework Source | Effort |
|---|--------|---------------|------------|------------------|--------|
| 10 | **Streaming** | `PIPELINE_EVENTS.jsonl` append-only | **SSE stream** via EventEmitter — real-time dashboard updates | AgentScope | 2 days |
| 11 | **Event traceability** | Custom TraceLogger (JSONL append) | **OpenTelemetry** — industry-standard spans, LangSmith/Grafana compatible | LangGraph | 1 day |
| 12 | **Workspace isolation** | Flat sandbox directories | Optional DockerWorkspace per agent — file system isolation | AgentScope | 3 days |
| 13 | **Permission system** | Agent 15 secret scanning only | 5-mode permission engine (DEFAULT/EXPLORE/BYPASS/etc.) + rule-based tool control | AgentScope | 3 days |

### P3 — Nice to Have

| # | Change | From (Current) | To (Adopt) | Framework Source | Effort |
|---|--------|---------------|------------|------------------|--------|
| 14 | **MCP integration** | Not present | MCP client for external tool discovery | AgentScope | 2 days |
| 15 | **Human-in-the-loop** | File edit + poll (2s delay) | LangGraph `interrupt()` + `Command(resume=...)` — instant, state-preserving | LangGraph | 2 days |
| 16 | **Credential management** | Hardcoded env vars | Credential registry with encrypted storage per provider | n8n | 2 days |
| 17 | **YAML config separation** | Monolithic `AGENT_REGISTRY.json` | Per-agent YAML files (`config/agents/*.yaml`) — separate prompts from infra config | CrewAI | 1 day |

---

## Part 4: Architecture After Adoption

```
┌─────────────────────────────────────────────────────────────────┐
│                    PETEMART UNIQUE LAYER                         │
│  (Compliance Audit, Traceability, Approval Gates, Expert Review,│
│   Domain Specialization, Universal Outputs, FinOps, Governance) │
│                                                                 │
│  These files remain 100% unchanged:                             │
│  ├── compliance/   ─── Agent 0 compliance engine                │
│  ├── review/       ─── Expert reviewer mappings                 │
│  ├── governance/   ─── Feature branch enforcement               │
│  ├── output/       ─── .pptx / .xlsx generators                 │
│  ├── tracking/     ─── Token & cost tracking                    │
│  └── domain/       ─── Bangalore market data                    │
├─────────────────────────────────────────────────────────────────┤
│                    ORCHESTRATION LAYER (NEW)                     │
│                                                                 │
│  LangGraph StateGraph replaces supervisorDaemon.js:             │
│                                                                 │
│  const pipeline = new StateGraph(PipelineState)                 │
│    .addNode('health_audit', compliance.runAudit)                │
│    .addNode('eligibility', supervisor.getEligible)              │
│    .addNode('dispatch', supervisor.launchAgents)                │
│    .addEdge(Start, 'health_audit')                              │
│    .addConditionalEdges('health_audit', routeBasedOnHealth)     │
│    .compile()                                                   │
│                                                                 │
│  pipeline.invoke(initialState, {                                │
│    recursionLimit: 100,                                         │
│    threadId: 'pipeline-main'                                    │
│  })                                                             │
│                                                                 │
│  Benefits:                                                      │
│  ✅ No polling — event-driven execution                         │
│  ✅ Built-in checkpoint/restore — crash-safe                    │
│  ✅ Subgraph composition — modular agent teams                   │
│  ✅ Streaming events — real-time dashboard                       │
│  ✅ Interrupt-based HITL — no file editing                      │
├─────────────────────────────────────────────────────────────────┤
│                    AGENT RUNTIME LAYER (HYBRID)                  │
│                                                                 │
│  LangGraph AgentExecutor replaces _llmToolLoop:                 │
│  ├── Structured ReAct loop (not custom 15-iter loop)            │
│  ├── Built-in tool calling with error recovery                  │
│  ├── Token tracking hooks → Petemart's FinOps layer             │
│  └── Streaming events → Petemart's compliance layer             │
│                                                                 │
│  ToolRegistry (NEW) replaces hardcoded handlers:                │
│  ├── Petemart-specific tools (write_artifact, etc.)             │
│  │   + MCP-discoverable external tools                          │
│  │   + CrewAI-pattern typed schemas                             │
│  └── Credential manager (n8n pattern)                           │
│                                                                 │
│  LLMProvider (KEPT) — still routes to OpenAI/openCode           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    STATE & INFRASTRUCTURE (NEW)                  │
│                                                                 │
│  SQLite (better-sqlite3) replaces STATE_MATRIX.json:            │
│  ├── Atomic transactions — no corruption on crash               │
│  ├── WAL mode — concurrent readers                              │
│  ├── LangGraph checkpointer — auto-checkpoint per step          │
│  └── State written in parallel to STATE_MATRIX.json for         │
│      backward compatibility and dashboard                       │
│                                                                 │
│  BullMQ (optional) for parallel agent execution:                │
│  ├── Queue agents instead of sequential await                   │
│  ├── Retry with exponential backoff                             │
│  └── Dead letter queue for failed agents                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Migration Strategy — Zero-Downtime

The migration is incremental. Petemart keeps working at every step.

```
Week 1: Foundation (Keep old daemon running in parallel)
  ├── 1a. Install: @langchain/langgraphjs, better-sqlite3, bullmq (if Redis available)
  ├── 1b. Write: StateManager — wraps SQLite with same API as getState/saveState
  ├── 1c. Write: LangGraph compatibility layer — old daemon calls new graph
  └── 1d. Test: Run both daemons side-by-side, compare outputs

Week 2: Orchestration Migration
  ├── 2a. Port: daemonLoop.runCycle() → LangGraph StateGraph nodes
  ├── 2b. Port: getEligibleAgents → graph conditional edges
  ├── 2c. Port: launchAgentTask → graph node with BullMQ push
  ├── 2d. Remove: old supervisorDaemon.js
  └── 2e. Test: Full pipeline run, verify all 16 agents complete

Week 3: Agent Runtime Migration  
  ├── 3a. Port: _llmToolLoop → LangGraph AgentExecutor
  ├── 3b. Add: interrupt() for HITL (replaces awaiting_approval polling)
  ├── 3c. Add: ToolRegistry with typed schemas
  ├── 3d. Remove: old AgentRuntime.js (or keep as fallback)
  └── 3e. Test: Re-run agents 01-05, verify artifacts identical

Week 4: Polish
  ├── 4a. Error taxonomy + DLQ
  ├── 4b. OpenTelemetry tracing
  ├── 4c. SSE streaming for dashboard
  └── 4d. Full regression: all 16 agents + compliance audits pass
```

### Rollback Plan

```bash
# If anything breaks, switch back in 2 commands:
git checkout -- scripts/runtime/   # restore old runtime
node scripts/start-pipeline.js --watch  # back to polling daemon
```

The old code stays in the repo until Week 4. Zero risk of permanent breakage.

---

## Part 6: Summary — What Changes, What Doesn't

| | Stays Same | Changes |
|---|-----------|---------|
| **Petemart core files** | `00_state_ledger/`, `AGENTS.md`, `.github/workflows/`, `config/` | — |
| **Compliance audit** | Agent 0 compliance_checklist engine | Runs as LangGraph middleware instead of post-hoc |
| **Traceability** | TRACEABILITY_MATRIX.json | Still validated by Agent 0 after each agent completes |
| **Approval gates** | GATE-TECH-STACK-01, etc. | Triggered via LangGraph `interrupt()` instead of file polling |
| **Expert review** | Expert reviewer mappings | Still triggered after compliance passes |
| **Supervisor daemon** | — | Replaced by LangGraph StateGraph (same logic, declarative) |
| **Agent runtime** | — | _llmToolLoop → LangGraph AgentExecutor |
| **State file** | — | STATE_MATRIX.json → SQLite (JSON kept for backward compat) |
| **Agent execution** | — | Sequential → parallel via BullMQ |
| **HITL** | — | File edit + poll → interrupt() + Command(resume) |
| **Error handling** | — | Empty catches → structured errors + DLQ |
| **Output validation** | — | File-exists → Zod schema validation |
| **Tool system** | — | 4 handlers → ToolRegistry + MCP |
| **Streaming** | — | JSONL file → SSE via EventEmitter |
| **LLM provider** | LLMProvider.js | Unchanged (still routes to OpenAI/openCode) |
| **Output generators** | SlideGenerator, ExcelGenerator | Unchanged |
| **Domain data** | Bangalore markets, merchant profiles | Unchanged |

### Bottom Line

> **~20% of Petemart's code changes** (the agent runtime and state management).  
> **~80% stays exactly the same** (compliance, traceability, gates, reviews, domain logic, output generators).  
> All Petemart-unique features — **the moat** — are untouched and enhanced by a reliable runtime underneath.

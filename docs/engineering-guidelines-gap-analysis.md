# Engineering Guidelines — Gap Analysis & Action Items

Sources: LangChain Harness Engineering, ThoughtWorks Agentic SDLC, Martin Fowler LLM Engineering Practices, QuantumBlack/McKinsey Agentic Workflows, CodeRabbit Agentic SDLC, EPAM ADLC, Barun Saha KodeAgent, Microsoft Engineering Playbook, Google Engineering Practices

---

## Master Status Table

| # | Category | Total Items | ✅ Done | ❌ Missing | 🔴 Must-Fix | 🟡 Should-Fix | 🟢 Nice-to-Have |
|---|----------|------------|---------|-----------|-------------|---------------|-----------------|
| 1 | Development Workflow & Code Discipline | 9 | 9 | 0 | — | — | — |
| 2 | Harness Engineering (LangChain) | 6 | 2 | 4 | 0 | 2 | 2 |
| 3 | Loop Detection & Error Recovery (KodeAgent) | 4 | 4 | 0 | 0 | 0 | 0 |
| 4 | Actor-Critic / Dual-Agent (QuantumBlack) | 4 | 1 | 3 | 0 | 2 | 1 |
| 5 | Deterministic Pre/Post Gates (QuantumBlack) | 3 | 1 | 2 | 0 | 2 | 0 |
| 6 | State Isolation & Context (Industry) | 3 | 0 | 3 | 0 | 3 | 0 |
| 7 | Spec-Driven Development (QuantumBlack) | 3 | 1 | 2 | 0 | 0 | 2 |
| 8 | Testing & Evaluation (Fowler, CodeRabbit) | 5 | 2 | 3 | 0 | 1 | 2 |
| 9 | Governance & Observability (ThoughtWorks) | 5 | 3 | 2 | 0 | 1 | 1 |
| 10 | Knowledge Network & Memory (ThoughtWorks) | 4 | 0 | 4 | 0 | 0 | 4 |
| 11 | Microsoft Engineering Playbook | 6 | 3 | 3 | 0 | 1 | 2 |
| 12 | Google Engineering Practices | 4 | 1 | 3 | 0 | 1 | 2 |
| 13 | Prompt & Code Design Discipline (Fowler) | 4 | 0 | 4 | 0 | 1 | 3 |
| 14 | EPAM ADLC (Phases & Governance) | 3 | 0 | 3 | 0 | 1 | 2 |
| **Total** | | **63** | **26** | **37** | **0** | **15** | **22** |

---

## Category-by-Category Detail

### 1. Development Workflow & Code Discipline (AGENTS.md)

| # | Item | Source | Status | Implemented Where |
|---|------|--------|--------|-------------------|
| 1.1 | One change at a time | AGENTS.md Rule 1 | ✅ | AGENTS.md |
| 1.2 | Verify before moving on | AGENTS.md Rule 2 | ✅ | AGENTS.md |
| 1.3 | No cascading fixes | AGENTS.md Rule 3 | ✅ | AGENTS.md |
| 1.4 | One fix, one test | AGENTS.md Rule 4 | ✅ | AGENTS.md |
| 1.5 | State & context discipline | AGENTS.md Rule 5 | ✅ | AGENTS.md |
| 1.6 | No assumptions about libraries | AGENTS.md Rule 6 | ✅ | AGENTS.md |
| 1.7 | Rollback preparedness | AGENTS.md Rule 7 | ✅ | AGENTS.md |
| 1.8 | Cross-session memory | AGENTS.md Rule 8 | ✅ | context_lake/ |
| 1.9 | Dependency trace & E2E validation | AGENTS.md Rule 9 | ✅ | AGENTS.md |

### 2. Harness Engineering (LangChain)

| # | Item | Source | Status | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 2.1 | Build-Verify Loop | LangChain | ✅ | _buildSystemPrompt in AgentRuntime.js |
| 2.2 | Loop Detection Middleware | LangChain | ✅ | _llmToolLoop in AgentRuntime.js |
| 2.3 | Context Engineering | LangChain | ❌ | 1h | 🟡 |
| 2.4 | Self-Verification Prompting | LangChain | ❌ | 0.5h | 🟡 |
| 2.5 | Reasoning Sandwich | LangChain | ❌ | Config | 🟢 |
| 2.6 | Trace Analyzer Skill | LangChain | ❌ | 3h | 🟢 |

### 3. Loop Detection & Error Recovery (Barun Saha KodeAgent)

| # | Item | Source | Status | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 3.1 | Consecutive Same-Tool Call Detection | KodeAgent | ✅ | _llmToolLoop in AgentRuntime.js |
| 3.2 | Tool Deduplication (cache results) | KodeAgent | ✅ | _llmToolLoop in AgentRuntime.js |
| 3.3 | Tool Timeout (Promise.race) | KodeAgent | ✅ | _llmToolLoop in AgentRuntime.js |
| 3.4 | Proactive Termination on Loop Exceeded | KodeAgent | ✅ | _llmToolLoop in AgentRuntime.js |

### 4. Actor-Critic / Dual-Agent Architecture (QuantumBlack, ThoughtWorks)

| # | Item | Source | Status | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 4.1 | Dedicated Critic Agent | QuantumBlack | ❌ | 2h | 🟡 |
| 4.2 | Agent Skills (SKILL.md modules) | QuantumBlack | ❌ | 2h | 🟢 |
| 4.3 | Cap Iterations at 3-5 per checkpoint | QuantumBlack | ❌ | 1h | 🟡 |
| 4.4 | Human-on-the-Loop (autonomous gates) | ThoughtWorks | ✅ | — | — |

### 5. Deterministic Pre/Post Gates (QuantumBlack, Microsoft)

| # | Item | Source | Status | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 5.1 | Pre-Event Schema Gate | QuantumBlack | ❌ | 1h | 🟡 |
| 5.2 | Post-Event Structural Validation | QuantumBlack | ❌ | 1h | 🟡 |
| 5.3 | Pre-Commit Gate (husky: review → tsc → tests) | AGENTS.md | ✅ | — | — |

### 6. State Isolation & Context Management (Industry, QuantumBlack)

| # | Item | Source | Status | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 6.1 | Wipe Context After N Consecutive Failures | Industry | ❌ | 0.5h | 🟡 |
| 6.2 | Limit Error History in Context (max 2 errors) | Industry | ❌ | 0.5h | 🟡 |
| 6.3 | Git Reset After 3 Consecutive Failures | Industry | ❌ | 0.5h | 🟡 |

### 7. Spec-Driven Development (QuantumBlack, GitHub SpecKit)

| # | Item | Source | Status | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 7.1 | Structured Specs with Frontmatter | QuantumBlack | ❌ | 3h | 🟢 |
| 7.2 | Folder Conventions as Workflow Contracts | QuantumBlack | ❌ | 1h | 🟢 |
| 7.3 | Git as State Store (branch = feature, commit = phase) | QuantumBlack | ✅ | — | — |

### 8. Testing & Evaluation (Fowler, CodeRabbit, EPAM)

| # | Item | Source | Status | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 8.1 | Example-Based Tests (Open-Closed) | Fowler | ❌ | 2h | 🟢 |
| 8.2 | Auto-Evaluator Tests (LLM-as-a-Judge) | Fowler | ❌ | 3h | 🟡 |
| 8.3 | Adversarial Testing (prompt injection, PII) | Fowler | ❌ | 2h | 🟢 |
| 8.4 | Test-Driven Generation (write test first) | Industry | ✅ | _buildSystemPrompt in AgentRuntime.js |
| 8.5 | Golden Dataset for Regression | EPAM | ❌ | 2h | 🟢 |

### 9. Governance & Observability (ThoughtWorks, CodeRabbit, EPAM)

| # | Item | Source | Status | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 9.1 | Audit Trail (PIPELINE_EVENTS + verbose logs) | ThoughtWorks | ✅ | — | — |
| 9.2 | Quality Gates w/ Metrics (QG-AC-01–10) | CodeRabbit | ✅ | — | — |
| 9.3 | Decision Rationale Logging (why, not just what) | ThoughtWorks | ❌ | 0.5h | 🟡 |
| 9.4 | Quality Gates Wired into Supervisor | CodeRabbit | ❌ | 2h | 🟢 |
| 9.5 | Behavioral Drift Monitoring | EPAM | ❌ | 3h | 🟢 |

### 10. Knowledge Network & Memory (ThoughtWorks, QuantumBlack)

| # | Item | Source | Status | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 10.1 | Persistent Project Context (.sdlc/context/) | QuantumBlack | ❌ | 1h | 🟢 |
| 10.2 | Assumption Logging (write_assumption tool) | QuantumBlack | ❌ | 1h | 🟢 |
| 10.3 | Dedicated Knowledge Agent | QuantumBlack | ❌ | 3h | 🟢 |
| 10.4 | Feedback Loop: Corrections → Knowledge Base | ThoughtWorks | ❌ | 2h | 🟢 |

### 11. Prompt & Code Design Discipline (Fowler, EPAM)

| # | Item | Source | Status | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 11.1 | Refactoring Prompts (treat prompts as code) | Fowler | ❌ | 0.5h | 🟡 |
| 11.2 | Separation of Concerns in Agent Code | Fowler | ✅ | — | — |
| 11.3 | Ethical Guidelines for Agent Behavior | Fowler | ❌ | 1h | 🟢 |
| 11.4 | Human-Agent Responsibility Mapping | EPAM | ❌ | 2h | 🟢 |

### 12. Microsoft Engineering Playbook

| # | Item | Source | Status | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 12.1 | Engineering Fundamentals Checklist | Microsoft | ❌ | 1h | 🟢 |
| 12.2 | Code Reviews (structured process) | Microsoft | ✅ | — | — |
| 12.3 | CI/CD (GitHub Actions) | Microsoft | ✅ | — | — |
| 12.4 | Automated Testing (Vitest, 307 tests) | Microsoft | ✅ | — | — |
| 12.5 | Observability (logs, metrics, traces) | Microsoft | ✅ | — | — |
| 12.6 | Security Scanning in Pipeline | Microsoft | ❌ | 2h | 🟡 |

### 13. Google Engineering Practices

| # | Item | Source | Status | Effort | Priority |
|---|------|--------|--------|--------|----------|
| 13.1 | Code Reviewer's Guide (design → correctness → tests → style) | Google | ❌ | 1h | 🟢 |
| 13.2 | Change Author's Guide (why not how, small CLs, tests) | Google | ✅ | — | 🟢 |
| 13.3 | CL Size (single-purpose changes) | Google | ✅ | — | — |
| 13.4 | Every Change Must Include Tests | Google | ❌ | 0.5h | 🟡 |

---

## 🔴 Were Must-Fix (Now Implemented ✅)

All 7 critical items were implemented on 2026-06-16 in `AgentRuntime.js`:

| # | Item | Fix | File | Status |
|---|------|-----|------|--------|
| 3.1 | Consecutive Same-Tool Call Detection | Track (tool_name + args_hash) consecutive count. Nudge at 3. Hard stop at 5. | `_llmToolLoop` in AgentRuntime.js | ✅ |
| 3.2 | Tool Deduplication | Cache Map<(tool_name, args_hash), result>. Return cached on duplicate. | `_llmToolLoop` in AgentRuntime.js | ✅ |
| 3.3 | Tool Timeout | Promise.race([handler_call, timeout_promise]) per tool invocation (60s). | `_llmToolLoop` in AgentRuntime.js | ✅ |
| 3.4 | Proactive Termination | After 5 same-tool calls, throw StuckError instead of retrying. | `_llmToolLoop` in AgentRuntime.js | ✅ |
| 2.1 | Build-Verify Prompt Injection | Injected into system prompt: PLAN → TEST FIRST → BUILD → VERIFY → NO EXIT WITHOUT VERIFICATION. | `_buildSystemPrompt` in AgentRuntime.js | ✅ |
| 2.2 | Loop Detection Middleware | Track per-file edit counts across iterations. Nudge after 3 edits to same file. | `_llmToolLoop` in AgentRuntime.js | ✅ |
| 8.4 | Test-Driven Generation | Injected into system prompt: write the test/assertion BEFORE implementing logic. | `_buildSystemPrompt` in AgentRuntime.js | ✅ |

**Total implemented: 7/7 ✅**

## 🟡 Should-Fix (This Sprint)

| # | Item | Effort |
|---|------|--------|
| 2.3 | Context Engineering (auto-inject dir + tools on agent start) | 1h |
| 2.4 | Self-Verification Prompting (aggressive testing instructions) | 0.5h |
| 4.1 | Dedicated Critic Agent (second LLM to audit output) | 2h |
| 4.3 | Cap iterations at 3-5 per checkpoint | 1h |
| 5.1 | Pre-Event Schema Gate (inject contract before LLM generates) | 1h |
| 5.2 | Post-Event Structural Validation (validate artifacts after LLM) | 1h |
| 6.1 | Wipe Context After 3 Consecutive Failures | 0.5h |
| 6.2 | Limit Error History in Context (max 2 errors) | 0.5h |
| 6.3 | Git Reset After 3 Consecutive Failures | 0.5h |
| 8.2 | Auto-Evaluator Tests (LLM-as-a-Judge) | 3h |
| 9.3 | Decision Rationale Logging (why, not just what) | 0.5h |
| 12.6 | Security Scanning in Pipeline | 2h |
| 13.4 | Every Change Must Include Tests (enforcement) | 0.5h |

**Total 🟡 effort: ~13h**

## 🟢 Nice-to-Have

| # | Item | Effort |
|---|------|--------|
| 2.5 | Reasoning Sandwich | Config |
| 2.6 | Trace Analyzer Skill | 3h |
| 4.2 | Agent Skills (SKILL.md modules) | 2h |
| 7.1 | Structured Specs with Frontmatter | 3h |
| 7.2 | Folder Conventions as Workflow Contracts | 1h |
| 8.1 | Example-Based Tests | 2h |
| 8.3 | Adversarial Testing | 2h |
| 8.5 | Golden Dataset for Regression | 2h |
| 9.4 | Quality Gates Wired into Supervisor | 2h |
| 9.5 | Behavioral Drift Monitoring | 3h |
| 10.1 | Persistent Project Context (.sdlc/context/) | 1h |
| 10.2 | Assumption Logging | 1h |
| 10.3 | Dedicated Knowledge Agent | 3h |
| 10.4 | Feedback Loop: Corrections → Knowledge Base | 2h |
| 11.1 | Refactoring Prompts as Code | 0.5h |
| 11.3 | Ethical Guidelines | 1h |
| 11.4 | Human-Agent Responsibility Mapping | 2h |
| 12.1 | Engineering Fundamentals Checklist | 1h |
| 13.1 | Code Reviewer's Guide | 1h |

**Total 🟢 effort: ~31.5h**

---

## Legend

| Priority | Meaning | Action |
|----------|---------|--------|
| 🔴 | Blocks agent from running successfully | Fix before next agent run |
| 🟡 | Prevents common failure modes | Fix this sprint |
| 🟢 | Improves quality and maintainability | Nice-to-have |
| ✅ | Already implemented | Maintain |

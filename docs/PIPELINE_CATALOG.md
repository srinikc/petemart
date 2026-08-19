# Pipeline Agent Catalog — Inputs, Outputs & Compliance

Generated: 2026-06-18

---

## Phase 1: Front-Office & Architecture (Async Pool)

### 01_ideation_agent
**Role:** Product Marketing & Market Knowledge Expert  
**Pool:** async_pool | **HITL:** YES | **Status:** awaiting_approval | **Exec:** 3

**Inputs (Dependencies):** None

**Outputs / Artifacts:**
- `01_front_office/01_ideation_agent/idea_proposal.md` — Market research proposal
- `01_front_office/01_ideation_agent/business_revenue_model.json` — Monetization model
- `01_front_office/01_ideation_agent/store_inventory_datasets.json` — Merchant inventory datasets
- `01_front_office/01_ideation_agent/IDEA_PROPOSAL_ENHANCED.md`
- `01_front_office/01_ideation_agent/area_classification_bar.png`
- `01_ideation_agent_COMPLETION_SLIDE.pptx`
- `01_ideation_agent_DATA_EXPORT.xlsx`

**Requirement Traceability:** REQ-UI-001, REQ-COM-001, REQ-COM-002, REQ-COM-003

**Compliance Checks (7/7 ✅):**
1. ✅ artifact_exists(idea_proposal.md)
2. ✅ artifact_exists(business_revenue_model.json)
3. ✅ artifact_exists(store_inventory_datasets.json)
4. ✅ All 21 named Pete markets represented in inventory JSON
5. ✅ Cost-of-delivery and platform_monetization schemas present
6. ✅ COMPLETION_SLIDE.pptx generated
7. ✅ DATA_EXPORT.xlsx generated

---

### 02_requirement_agent
**Role:** Enterprise Product Manager  
**Pool:** async_pool | **HITL:** YES | **Status:** pending | **Exec:** 3

**Inputs (Dependencies):**
- `01_front_office/01_ideation_agent/IDEA_PROPOSAL.json`

**Outputs / Artifacts:**
- `01_front_office/02_requirement_agent/prd.md` — Product Requirements Document
- `01_front_office/02_requirement_agent/prd_config.json`
- `01_front_office/02_requirement_agent/prd.json`
- `02_requirement_agent_COMPLETION_SLIDE.pptx`
- `02_requirement_agent_DATA_EXPORT.xlsx`

**Requirement Traceability:** ALL (defines all 103 requirement IDs)

**Compliance Checks (6/6 ✅):**
1. ✅ artifact_exists(prd.md)
2. ✅ artifact_exists(prd.json)
3. ✅ All Requirement IDs have associated cost projections
4. ✅ User workflows in Markdown match schema keys in JSON contract
5. ✅ COMPLETION_SLIDE.pptx generated
6. ✅ DATA_EXPORT.xlsx generated

---

### 03_architect_agent
**Role:** Senior Enterprise Solutions Architect  
**Pool:** async_pool | **HITL:** YES | **Status:** pending | **Exec:** 3

**Inputs (Dependencies):**
- `01_front_office/02_requirement_agent/PRD_ENTERPRISE.json`

**Outputs / Artifacts:**
- `02_engineering_specs/03_architect_agent/FEASIBILITY_ARCHITECTURE.md`
- `02_engineering_specs/03_architect_agent/FEASIBILITY_ARCHITECTURE.json`
- `02_engineering_specs/03_architect_agent/DIAGRAMS.md` — C4 + PlantUML diagrams
- `02_engineering_specs/03_architect_agent/POC_SCOPE.md`
- `02_engineering_specs/03_architect_agent/COST_MODELS.md`
- `02_engineering_specs/03_architect_agent/STITCH_INTEGRATION_GUIDE.md`
- `02_engineering_specs/03_architect_agent/GUARDRAIL_VERIFICATION.md`
- `03_architect_agent_COMPLETION_SLIDE.pptx`
- `03_architect_agent_DATA_EXPORT.xlsx`

**Requirement Traceability:** REQ-INFRA-001 to REQ-INFRA-004, REQ-PERF-001 to REQ-PERF-003

**Compliance Checks (15/15 ✅):**
1. ✅ artifact_exists(FEASIBILITY_ARCHITECTURE.md)
2. ✅ artifact_exists(FEASIBILITY_ARCHITECTURE.json)
3. ✅ Mermaid/PlantUML diagrams produced (DIAGRAMS.md)
4. ✅ Multi-layer testing architecture defined
5. ✅ API gateway with rate-limiting rules defined
6. ✅ POC scope maps to subset of full architecture (POC_SCOPE.md)
7. ✅ Infrastructure cost model accounts for scaling thresholds (COST_MODELS.md)
8. ✅ COMPLETION_SLIDE.pptx generated
9. ✅ DATA_EXPORT.xlsx generated
10. ✅ Event-driven architecture defined (event catalog, pub/sub, DLQ, saga)
11. ✅ Webhook system defined (Razorpay/ShipRocket/WhatsApp)
12. ✅ Centralized test orchestration framework defined
13. ✅ Multi-level caching strategy with invalidation patterns
14. ✅ UI stack competitive analysis with benchmark comparisons
15. ✅ Performance targets defined (LCP < 1.5s, TBT < 100ms, API P95 < 200ms)

---

### 04_prototype_agent
**Role:** Senior Rapid-Prototyping Engineer  
**Pool:** async_pool | **HITL:** YES | **Status:** pending | **Exec:** 1

**Inputs (Dependencies):**
- `02_engineering_specs/03_architect_agent/FEASIBILITY_ARCHITECTURE.json`

**Outputs / Artifacts:**
- `02_engineering_specs/04_prototype_agent/LAUNCH_GUIDE.md`
- `02_engineering_specs/04_prototype_agent/data/merchants.json`
- `02_engineering_specs/04_prototype_agent/data/products-combined.json`
- `02_engineering_specs/04_prototype_agent/POC_GUIDE.json`

**Requirement Traceability:** REQ-UI-001, REQ-UI-002, REQ-UI-003, REQ-BE-001, REQ-BE-002

**Compliance Checks (6/6 ✅):**
1. ✅ artifact_exists(LAUNCH_GUIDE.md)
2. ✅ artifact_exists(merchants.json)
3. ✅ artifact_exists(products-combined.json)
4. ✅ All 8 pilot merchants present in sample data
5. ✅ merchant_digital_readiness field present in profiles
6. ✅ COMPLETION_SLIDE.pptx generated

---

## Phase 2: Project Management & Infrastructure (Async Pool)

### 05_program_mgmt_agent
**Role:** Senior Agile Program Manager  
**Pool:** async_pool | **HITL:** YES | **Status:** pending | **Exec:** 1

**Inputs (Dependencies):**
- `02_engineering_specs/04_prototype_agent/POC_GUIDE.json`

**Outputs / Artifacts:**
- `02_engineering_specs/05_program_mgmt_agent/01_EPIC_FEATURE_STORY_MAP.md`
- `02_engineering_specs/05_program_mgmt_agent/02_SPRINT_TIMELINE_MILESTONES.md`
- `02_engineering_specs/05_program_mgmt_agent/03_MVP_SCOPE_DEFINITION.md`
- `02_engineering_specs/05_program_mgmt_agent/SPRINT_PLAN.json`
- `05_program_mgmt_agent_COMPLETION_SLIDE.pptx`
- `05_program_mgmt_agent_DATA_EXPORT.xlsx`

**Requirement Traceability:** ALL (epics/stories cover all 103 requirements)

**Compliance Checks (7/7 ✅):**
1. ✅ artifact_exists(EPIC_FEATURE_STORY_MAP.md)
2. ✅ artifact_exists(SPRINT_TIMELINE_MILESTONES.md)
3. ✅ artifact_exists(MVP_SCOPE_DEFINITION.md)
4. ✅ All User Stories trace to approved Requirement IDs
5. ✅ Delivery timeline has no unmapped dependencies or deadlocks
6. ✅ COMPLETION_SLIDE.pptx generated
7. ✅ DATA_EXPORT.xlsx generated

---

### 06_infra_devops_agent
**Role:** Lead DevOps Architect  
**Pool:** async_pool | **HITL:** NO | **Status:** pending | **Exec:** 2

**Inputs (Dependencies):**
- `02_engineering_specs/05_program_mgmt_agent/SPRINT_PLAN.json`

**Outputs / Artifacts:**
- `03_execution_workspace/06_infra_devops_agent/BRANCHING_STRATEGY.md`
- `03_execution_workspace/06_infra_devops_agent/.github/workflows/ci.yml`
- `03_execution_workspace/06_infra_devops_agent/.github/workflows/deploy.yml`
- `03_execution_workspace/06_infra_devops_agent/.github/workflows/code-review.yml`
- `03_execution_workspace/06_infra_devops_agent/.github/workflows/security-scan.yml`
- `03_execution_workspace/06_infra_devops_agent/.github/workflows/pr-agent.yml`
- `03_execution_workspace/06_infra_devops_agent/docker/Dockerfile`
- `03_execution_workspace/06_infra_devops_agent/k8s/`
- `03_execution_workspace/06_infra_devops_agent/DEVOPS_MANIFEST.json`
- `06_infra_devops_agent_COMPLETION_SLIDE.pptx`

**Requirement Traceability:** REQ-INFRA-001 to REQ-INFRA-007

**Compliance Checks (6/6 ✅):**
1. ✅ artifact_exists(BRANCHING_STRATEGY.md)
2. ✅ CI/CD workflow files present (.github/workflows/*.yml)
3. ✅ Docker/K8s configuration files present
4. ✅ No hardcoded secrets/credentials in config files
5. ✅ Docker and K8s configs parse without errors
6. ✅ COMPLETION_SLIDE.pptx generated

---

## Phase 3: Execution & Implementation (Sync Pipeline)

### 07a_ui_agent
**Role:** Lead UI/UX Frontend Engineer  
**Pool:** sync_pipeline | **HITL:** YES | **Status:** pending | **Exec:** 2

**Inputs (Dependencies):**
- `05_program_mgmt_agent/SPRINT_PLAN.json`
- `06_infra_devops_agent/DEVOPS_MANIFEST.json`

**Outputs / Artifacts:**
- `03_execution_workspace/07a_ui_agent/output/UI_MAP.md`
- `03_execution_workspace/07a_ui_agent/output/UI_MAP.json`
- `03_execution_workspace/07a_ui_agent/design-system/DESIGN.md`
- Component implementations, tests, and screenshots
- `07a_ui_agent_COMPLETION_SLIDE.pptx`

**Requirement Traceability:** REQ-UI-001 to REQ-UI-024, REQ-COM-001 to REQ-COM-003

**Compliance Checks (7/12):**
1. ✅ artifact_exists(UI_INTERFACE_MAP.json)
2. ✅ artifact_exists(UI_AGENT_REPORT.md)
3. ✅ Code review completed (pre-commit gate)
4. ✅ TypeScript check passed
5. ✅ Unit tests >= 80% coverage
6. ✅ All screens have localized help strings
7. ✅ COMPLETION_SLIDE.pptx generated
8. ❌ feature_branch_used()
9. ❌ pr_created_and_merged()
10. ❌ ci_pipeline_passed()
11. ❌ requirements_traceability()
12. ❌ input_from_upstream_agents()

---

### 07b_api_agent
**Role:** Core API Engineer  
**Pool:** sync_pipeline | **HITL:** YES | **Status:** pending | **Exec:** 1

**Inputs (Dependencies):**
- `05_program_mgmt_agent/SPRINT_PLAN.json`
- `06_infra_devops_agent/DEVOPS_MANIFEST.json`

**Outputs / Artifacts:**
- `03_execution_workspace/07b_api_agent/API_SPECIFICATION.md`
- `03_execution_workspace/07b_api_agent/API_SPECIFICATION.json`
- `03_execution_workspace/07b_api_agent/tests/auth.test.ts`
- `07b_api_agent_COMPLETION_SLIDE.pptx`
- `07b_api_agent_DATA_EXPORT.xlsx`

**Requirement Traceability:** REQ-API-001 to REQ-API-013, REQ-COM-004 to REQ-COM-010

**Compliance Checks (9/14):**
1. ✅ artifact_exists(API_SPECIFICATION.md)
2. ✅ artifact_exists(API_SPECIFICATION.json)
3. ✅ Code review completed
4. ✅ TypeScript check passed
5. ✅ Unit tests executed and passing
6. ✅ API endpoint signatures match architecture contract
7. ✅ API routes pass security validation
8. ✅ COMPLETION_SLIDE.pptx generated
9. ✅ DATA_EXPORT.xlsx generated
10. ❌ feature_branch_used()
11. ❌ pr_created_and_merged()
12. ❌ ci_pipeline_passed()
13. ❌ requirements_traceability()
14. ❌ input_from_upstream_agents()

---

### 07c_backend_db_agent
**Role:** Database Architect & Administrator  
**Pool:** sync_pipeline | **HITL:** YES | **Status:** pending | **Exec:** 2

**Inputs (Dependencies):**
- `05_program_mgmt_agent/SPRINT_PLAN.json`
- `06_infra_devops_agent/DEVOPS_MANIFEST.json`

**Outputs / Artifacts:**
- `03_execution_workspace/07c_backend_db_agent/01-complete-schema.sql`
- `03_execution_workspace/07c_backend_db_agent/02-rls-policies.sql`
- `03_execution_workspace/07c_backend_db_agent/03-index-definitions.sql`
- `03_execution_workspace/07c_backend_db_agent/04-seed-data.sql`
- `03_execution_workspace/07c_backend_db_agent/05-migration-log.sql`
- `07c_backend_db_agent_COMPLETION_SLIDE.pptx`
- `07c_backend_db_agent_DATA_EXPORT.xlsx`

**Requirement Traceability:** REQ-BE-001 to REQ-BE-026, REQ-MICRO-001 to REQ-MICRO-008

**Compliance Checks (9/14):**
1. ✅ artifact_exists(01-complete-schema.sql)
2. ✅ Code review completed
3. ✅ TypeScript check passed
4. ✅ DB unit tests passed
5. ✅ Migrations include rollback statements
6. ✅ Index definitions present for primary tables
7. ✅ Connection timeout/pool align with Architect's scaling criteria
8. ✅ COMPLETION_SLIDE.pptx generated
9. ✅ DATA_EXPORT.xlsx generated
10. ❌ feature_branch_used()
11. ❌ pr_created_and_merged()
12. ❌ ci_pipeline_passed()
13. ❌ requirements_traceability()
14. ❌ input_from_upstream_agents()

---

### 07d_integration_agent
**Role:** Systems Integration Engineer  
**Pool:** sync_pipeline | **HITL:** YES | **Status:** pending | **Exec:** 2

**Inputs (Dependencies):**
- `07a_ui_agent/UI_BUILD.json`
- `07b_api_agent/API_SPEC.json`
- `07c_backend_db_agent/DB_SCHEMA.json`

**Outputs / Artifacts:**
- `03_execution_workspace/07d_integration_agent/INTEGRATION_REPORT.md`
- `03_execution_workspace/07d_integration_agent/petemart-unified/package.json`
- `03_execution_workspace/07d_integration_agent/petemart-unified/middleware.ts`
- `07d_integration_agent_COMPLETION_SLIDE.pptx`

**Requirement Traceability:** REQ-UI-006, REQ-API-001, REQ-API-013, REQ-BE-001, REQ-BE-026, REQ-COM-001 to REQ-COM-004, REQ-COM-010, REQ-INFRA-003, REQ-INFRA-005

**Compliance Checks (7/12):**
1. ✅ artifact_exists(INTEGRATION_REPORT.md)
2. ✅ Code review completed
3. ✅ TypeScript check passed
4. ✅ Unit tests executed and passing
5. ✅ E2E data flows verified (no connection timeouts)
6. ✅ No debug flags or unencrypted connections active
7. ✅ COMPLETION_SLIDE.pptx generated
8. ❌ feature_branch_used()
9. ❌ pr_created_and_merged()
10. ❌ ci_pipeline_passed()
11. ❌ requirements_traceability()
12. ❌ input_from_upstream_agents()

---

## Phase 4: Verification & Operations (Sync Pipeline)

### 08_qa_agent
**Role:** Senior QA Test Architect  
**Pool:** sync_pipeline | **HITL:** YES | **Status:** pending | **Exec:** 2

**Inputs (Dependencies):**
- `07d_integration_agent/INTEGRATION_REPORT.json`

**Outputs / Artifacts:**
- `03_execution_workspace/08_qa_agent/01_QA_TEST_PLAN.md`
- `03_execution_workspace/08_qa_agent/02_DEFECT_LOG.md`
- `03_execution_workspace/08_qa_agent/03_GO_NOGO_RECOMMENDATION.md`
- `03_execution_workspace/08_qa_agent/QA_RELEASE_VERDICT.json`
- `08_qa_agent_COMPLETION_SLIDE.pptx`
- `08_qa_agent_DATA_EXPORT.xlsx`

**Requirement Traceability:** ALL (all 103 requirements)

**Compliance Checks (10/15):**
1. ✅ artifact_exists(QA_TEST_PLAN.md)
2. ✅ artifact_exists(DEFECT_LOG.md)
3. ✅ artifact_exists(GO_NOGO_RECOMMENDATION.md)
4. ✅ Code review completed
5. ✅ TypeScript check passed
6. ✅ Test coverage meets threshold
7. ✅ No high-severity defects open on release branch
8. ✅ E2E tests executed with Playwright multi-browser
9. ✅ COMPLETION_SLIDE.pptx generated
10. ✅ DATA_EXPORT.xlsx generated
11. ❌ feature_branch_used()
12. ❌ pr_created_and_merged()
13. ❌ ci_pipeline_passed()
14. ❌ requirements_traceability()
15. ❌ test_cases_trace_to_requirements()

---

### 09_production_agent
**Role:** Release Engineer & Production Operations Manager  
**Pool:** sync_pipeline | **HITL:** YES | **Status:** pending | **Exec:** 1

**Inputs (Dependencies):**
- `08_qa_agent/QA_RELEASE_VERDICT.json`

**Outputs / Artifacts:**
- `03_execution_workspace/09_production_agent/01_DEPLOYMENT_REPORT.md`
- `03_execution_workspace/09_production_agent/02_RELEASE_NOTES.md`
- `03_execution_workspace/09_production_agent/03_DEMO_ACCOUNTS_TEST_SCENARIOS.md`
- `09_production_agent_COMPLETION_SLIDE.pptx`

**Requirement Traceability:** REQ-INFRA-001, REQ-INFRA-002, REQ-INFRA-004, REQ-DR-001 to REQ-DR-004, REQ-PERF-001 to REQ-PERF-003

**Compliance Checks (6/11):**
1. ✅ artifact_exists(DEPLOYMENT_REPORT.md)
2. ✅ artifact_exists(RELEASE_NOTES.md)
3. ✅ QA sign-off obtained before deployment
4. ✅ Deployment generates no unhandled server errors
5. ✅ All deployment endpoints return HTTP 200
6. ✅ COMPLETION_SLIDE.pptx generated
7. ❌ feature_branch_used()
8. ❌ pr_created_and_merged()
9. ❌ ci_pipeline_passed()
10. ❌ requirements_traceability()
11. ❌ input_from_upstream_agents()

---

### 10_tech_pub_agent
**Role:** Lead Technical Writer  
**Pool:** sync_pipeline | **HITL:** NO | **Status:** pending | **Exec:** 0

**Inputs (Dependencies):**
- `09_production_agent/RELEASE_NOTES.json`

**Outputs / Artifacts:** None emitted yet

**Requirement Traceability:** REQ-UI-013, REQ-API-013, REQ-MICRO-008

**Compliance Checks (0/8 ❌):**
1. ❌ User-facing paths have matching help documents
2. ❌ Locale key mapping complete (no broken keys)
3. ❌ Hyperlinks/screenshots/scripts match active build
4. ❌ COMPLETION_SLIDE.pptx generated
5. ❌ feature_branch_used()
6. ❌ pr_created_and_merged()
7. ❌ requirements_traceability()
8. ❌ input_from_upstream_agents()

---

## Phase 5: Post-Delivery & Maintenance Loop

### 11_customer_onboarding_agent
**Role:** Customer Acquisition & Billing Specialist  
**Pool:** loop | **HITL:** NO | **Status:** pending | **Exec:** 0

**Inputs (Dependencies):**
- `09_production_agent/RELEASE_NOTES.json`

**Outputs / Artifacts:** None emitted yet

**Requirement Traceability:** REQ-UI-011, REQ-UI-014, REQ-MICRO-001 to REQ-MICRO-008

**Compliance Checks (0/8 ❌):**
1. ❌ Provisioned account has billing model attached
2. ❌ Merchant profile schema complete and verified
3. ❌ Support interface parses log data to structured JSON
4. ❌ COMPLETION_SLIDE.pptx generated
5. ❌ feature_branch_used()
6. ❌ pr_created_and_merged()
7. ❌ requirements_traceability()
8. ❌ input_from_upstream_agents()

---

### 12_marketing_agent
**Role:** Growth Marketing & SEO Growth Expert  
**Pool:** loop | **HITL:** NO | **Status:** pending | **Exec:** 0

**Inputs (Dependencies):**
- `09_production_agent/RELEASE_NOTES.json`

**Outputs / Artifacts:** None emitted yet

**Requirement Traceability:** REQ-FUNNEL-001 to REQ-FUNNEL-004, REQ-PERF-002

**Compliance Checks (0/8 ❌):**
1. ❌ Public routing tags and SEO meta tags present
2. ❌ Analytics trackers configured in production build
3. ❌ Marketing webhooks respect scaling bottlenecks
4. ❌ COMPLETION_SLIDE.pptx generated
5. ❌ feature_branch_used()
6. ❌ pr_created_and_merged()
7. ❌ requirements_traceability()
8. ❌ input_from_upstream_agents()

---

### 13_maintenance_agent
**Role:** Automated Site Reliability & Patch Engineer  
**Pool:** loop | **HITL:** NO | **Status:** pending | **Exec:** 0

**Inputs (Dependencies):**
- `09_production_agent/RELEASE_CERTIFICATE.json`

**Outputs / Artifacts:** None emitted yet

**Requirement Traceability:** REQ-MAINT-001 to REQ-MAINT-005

**Compliance Checks (0/10 ❌):**
1. ❌ Code review completed (pre-commit gate)
2. ❌ TypeScript check passed
3. ❌ Patch validated in sandbox (no performance degradation)
4. ❌ DevOps verification pipeline cleared
5. ❌ Human authorization token present for production patch
6. ❌ COMPLETION_SLIDE.pptx generated
7. ❌ feature_branch_used()
8. ❌ pr_created_and_merged()
9. ❌ requirements_traceability()
10. ❌ input_from_upstream_agents()

---

### 14_finops_agent
**Role:** Cloud Financial Operations Analyst  
**Pool:** loop | **HITL:** NO | **Status:** pending | **Exec:** 0

**Inputs (Dependencies):**
- `09_production_agent/RELEASE_CERTIFICATE.json`

**Outputs / Artifacts:** None emitted yet

**Requirement Traceability:** REQ-COM-010, REQ-INFRA-001

**Compliance Checks (0/8 ❌):**
1. ❌ Cost tracking ledger matches billing metrics with resource IDs
2. ❌ Operational spend within 15% of budget
3. ❌ COMPLETION_SLIDE.pptx generated
4. ❌ DATA_EXPORT.xlsx generated
5. ❌ feature_branch_used()
6. ❌ pr_created_and_merged()
7. ❌ requirements_traceability()
8. ❌ input_from_upstream_agents()

---

### 15_secrets_compliance_agent
**Role:** Data Security & Compliance Auditor  
**Pool:** loop | **HITL:** NO | **Status:** pending | **Exec:** 0

**Inputs (Dependencies):**
- `09_production_agent/RELEASE_CERTIFICATE.json`

**Outputs / Artifacts:** None emitted yet

**Requirement Traceability:** REQ-INFRA-005 to REQ-INFRA-011, REQ-DATA-001 to REQ-DATA-003

**Compliance Checks (0/8 ❌):**
1. ❌ All credentials reside in isolated secrets manager
2. ❌ No unprotected auth variables detected across branches
3. ❌ Encryption receipts maintained and verifiable
4. ❌ COMPLETION_SLIDE.pptx generated
5. ❌ feature_branch_used()
6. ❌ pr_created_and_merged()
7. ❌ requirements_traceability()
8. ❌ input_from_upstream_agents()

---

## 00_supervisor_agent — Orchestrator

**Pool:** N/A (supervisor) | **Status:** idle

**Compliance Checks (10/10 ✅):**
1. ✅ STATE_MATRIX.json is readable and valid JSON
2. ✅ AGENT_REGISTRY.json matches STATE_MATRIX.json agent list
3. ✅ feature_branch_workflow_enforced() — all code agents use PR → CI → merge
4. ✅ no_direct_pushes_to_develop_main() — pre-push hook enforces
5. ✅ pr_template_exists() — .github/PULL_REQUEST_TEMPLATE.md present
6. ✅ ci_pipeline_configured_for_prs() — CI triggers on PR to develop/main
7. ✅ ai_assistant_follows_workflow() — opencode changes use feature branch + PR
8. ✅ requirements_traceability_validated() — artifacts trace to PRD IDs
9. ✅ dependency_input_artifacts_verified() — upstream artifacts consumed
10. ✅ traceability_matrix_exists() — TRACEABILITY_MATRIX.json present

---

## Dependency Chain Summary

```
01_ideation ──► 02_requirement ──► 03_architect ──► 04_prototype ──► 05_program_mgmt ──► 06_infra_devops ──┐
                                                                                                          │
                      ┌────────────────────────────────────────────────────────────────────────────────────┘
                      ▼
              07a_ui_agent ──┐
              07b_api_agent ──┤──► 07d_integration ──► 08_qa_agent ──► 09_production_agent ──┐
              07c_db_agent ──┘                                                                  │
                                                                                                │
              10_tech_pub ◄──────────────────────────────────────────────────────────────────────┤
              11_onboarding ◄────────────────────────────────────────────────────────────────────┤
              12_marketing ◄─────────────────────────────────────────────────────────────────────┤
              13_maintenance ◄───────────────────────────────────────────────────────────────────┤
              14_finops ◄────────────────────────────────────────────────────────────────────────┤
              15_secrets ◄───────────────────────────────────────────────────────────────────────┘
```

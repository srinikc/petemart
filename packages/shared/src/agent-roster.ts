// Agent roster for ProductForge — base 16 agents (00-15) + suggested optional
// agents (16-26) for full E2E product development, deployment, operations,
// sustainment and growth. Used by the onboarding form, the idea-driven agent
// suggestion engine and the project creation API.
//
// `recommended` model IDs MUST exist in the matching provider's models[] in
// ./llm-catalog so the per-agent dropdown can pre-select the recommended option.

export interface AgentRosterEntry {
  id: string;
  role: string;
  short_role: string;
  phase: string; // system | phase_one .. phase_five | post_launch
  phase_label: string;
  pool: 'async' | 'sync';
  base: boolean; // part of the base 16
  optional: boolean; // suggested/optional agent the user can accept or skip
  description: string;
  dependencies: string[]; // agent ids that must finish first
  artifacts: string[]; // relative artifact paths this agent emits
  consumers: string[]; // agent ids that consume this agent's artifacts
  recommended: { provider: string; model: string; reason: string };
}

const PHASE_LABELS: Record<string, string> = {
  system: 'System',
  phase_one: 'Phase 1: Front-Office & Architecture',
  phase_two: 'Phase 2: Project Mgmt & Infrastructure',
  phase_three: 'Phase 3: Execution & Implementation',
  phase_four: 'Phase 4: Verification & Quality',
  phase_five: 'Phase 5: Post-Delivery & Maintenance',
  post_launch: 'Post-Launch / Operations',
};

function entry(a: Omit<AgentRosterEntry, 'phase_label'>): AgentRosterEntry {
  return { ...a, phase_label: PHASE_LABELS[a.phase] };
}

export const AGENT_ROSTER: AgentRosterEntry[] = [
  entry({
    id: '00_supervisor_agent', role: 'Senior Program Manager — Pipeline Orchestrator & Compliance Auditor',
    short_role: 'Orchestrator & Supervisor', phase: 'system', pool: 'async', base: true, optional: false,
    description: 'Reads STATE_MATRIX.json, enforces dependency chains, pool scheduling, loop guardrails, HITL gates and compliance audits. Does NOT make product decisions — escalates to the human gatekeeper.',
    dependencies: [], artifacts: ['00_state_ledger/STATE_MATRIX.json', '00_state_ledger/SUPERVISOR_DASHBOARD.json'], consumers: ['01_ideation_agent', '02_requirement_agent', '03_architect_agent', '04_prototype_agent', '05_program_mgmt_agent', '06_infra_devops_agent', '07a_ui_agent', '07b_api_agent', '07c_backend_db_agent', '07d_integration_agent', '08_qa_agent', '09_production_agent', '10_tech_pub_agent', '11_customer_onboarding_agent', '12_marketing_agent', '13_maintenance_agent', '14_finops_agent', '15_secrets_compliance_agent', '16_product_analyst_agent', '17_ux_designer_agent', '18_mobile_engineer_agent', '19_appsec_engineer_agent', '20_perf_sre_agent', '21_data_analytics_agent', '22_customer_success_agent', '23_growth_experiment_agent', '24_legal_privacy_agent', '25_product_evolution_agent', '26_content_seo_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-reasoner', reason: 'Deep orchestration, compliance audits & dependency checks — needs strong structured reasoning.' },
  }),
  entry({
    id: '01_ideation_agent', role: 'Product Marketing Manager & Hyper-Local Retail Economics Specialist',
    short_role: 'Ideation & Market Research', phase: 'phase_one', pool: 'async', base: true, optional: false,
    description: 'Deep market research, unique value proposition, costing framework and monetization models. Generates synthetic store/inventory datasets when direct data is unavailable.',
    dependencies: [], artifacts: ['agents/01_front_office/01_ideation_agent/idea_proposal.md', 'agents/01_front_office/01_ideation_agent/business_revenue_model.json'], consumers: ['02_requirement_agent', '16_product_analyst_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Market research + persuasive product narratives — strong writing & synthesis.' },
  }),
  entry({
    id: '16_product_analyst_agent', role: 'Market Validation & Pricing Analyst',
    short_role: 'Market Validation & Pricing', phase: 'phase_one', pool: 'async', base: false, optional: true,
    description: 'TAM/SAM/SOM sizing, competitive benchmarking, pricing research and market validation to confirm the idea has a viable market before PRD work begins.',
    dependencies: ['01_ideation_agent'], artifacts: ['agents/01_front_office/16_product_analyst_agent/market_validation.json'], consumers: ['02_requirement_agent', '03_architect_agent', '12_marketing_agent', '14_finops_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Market sizing & pricing analysis — analytical writing and synthesis.' },
  }),
  entry({
    id: '02_requirement_agent', role: 'Enterprise Product Manager / Product Owner',
    short_role: 'Requirements & PRD', phase: 'phase_one', pool: 'async', base: true, optional: false,
    description: 'Translates the approved idea into an enterprise-grade PRD with unique Requirement IDs, priorities, user personas, workflows, use cases and operational/deployment cost boundaries.',
    dependencies: ['01_ideation_agent', '16_product_analyst_agent'], artifacts: ['agents/01_front_office/02_requirement_agent/prd.md', 'agents/01_front_office/02_requirement_agent/prd.json'], consumers: ['03_architect_agent', '05_program_mgmt_agent', '10_tech_pub_agent', '24_legal_privacy_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Structured PRD authoring with cost mapping — precise, schema-driven output.' },
  }),
  entry({
    id: '03_architect_agent', role: 'Senior Enterprise Solution Architect',
    short_role: 'Architecture & Design', phase: 'phase_one', pool: 'async', base: true, optional: false,
    description: 'End-to-end technical feasibility: full product architecture + POC architecture, API-first strategy, caching, message queues, security framework, diagrams and infra/software/API/DB cost models. Triggers GATE-TECH-STACK-01 and GATE-COSTING-01 (budget confirmation after cost models).',
    dependencies: ['02_requirement_agent'], artifacts: ['agents/02_engineering_specs/03_architect_agent/FEASIBILITY_ARCHITECTURE.md', 'agents/02_engineering_specs/03_architect_agent/COST_MODELS.json'], consumers: ['04_prototype_agent', '05_program_mgmt_agent', '06_infra_devops_agent', '07a_ui_agent', '07b_api_agent', '07c_backend_db_agent', '17_ux_designer_agent', '18_mobile_engineer_agent', '20_perf_sre_agent', '14_finops_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-opus-4-6', reason: 'Complex architecture + costing feasibility — frontier reasoning.' },
  }),
  entry({
    id: '17_ux_designer_agent', role: 'UX/UI Designer — Design System & Accessibility',
    short_role: 'UX/UI Design System', phase: 'phase_one', pool: 'async', base: false, optional: true,
    description: 'Produces the design system, wireframes, design tokens and accessibility (a11y) guidance consumed by the UI engineer so visual design is consistent before implementation.',
    dependencies: ['03_architect_agent'], artifacts: ['agents/02_engineering_specs/17_ux_designer_agent/design_system.json'], consumers: ['04_prototype_agent', '07a_ui_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Design systems, tokens & accessibility guidance — creative + structured output.' },
  }),
  entry({
    id: '04_prototype_agent', role: 'Senior Prototyping Engineer / Concept Verification',
    short_role: 'Prototype / POC', phase: 'phase_one', pool: 'async', base: true, optional: false,
    description: 'Builds a functional, zero-cost POC workspace with sample data and an install/launch guide, matching the architecture blueprint, and halts for human validation before production coding.',
    dependencies: ['03_architect_agent'], artifacts: ['agents/02_engineering_specs/04_prototype_agent/POC_WORKSPACE/'], consumers: ['05_program_mgmt_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'Fast code generation for launchable POC — speed + cost efficiency.' },
  }),
  entry({
    id: '05_program_mgmt_agent', role: 'Senior Agile Program Manager & Scrum Master',
    short_role: 'Program & Sprint Mgmt', phase: 'phase_two', pool: 'async', base: true, optional: false,
    description: 'Decomposes scope into Epics/Features/User Stories/Tasks mapped across UI/API/backend, defines MVP workflows, SDLC timeline, milestones, sprint KPIs and Jira board population.',
    dependencies: ['02_requirement_agent', '04_prototype_agent', '03_architect_agent'], artifacts: ['agents/02_engineering_specs/05_program_mgmt_agent/sprint_map.json'], consumers: ['06_infra_devops_agent', '07a_ui_agent', '07b_api_agent', '07c_backend_db_agent', '08_qa_agent', '09_production_agent', '23_growth_experiment_agent', '25_product_evolution_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Epic/story decomposition & sprint planning — structured planning.' },
  }),
  entry({
    id: '06_infra_devops_agent', role: 'DevOps Systems Architect & Core Supply Chain Engine',
    short_role: 'Infra & DevOps', phase: 'phase_two', pool: 'async', base: true, optional: false,
    description: 'Git branching strategy, Docker/K8s containerization, CI/CD pipelines, automated upgrades, rollback protocol and skills/tooling sync into the skills directory.',
    dependencies: ['03_architect_agent', '05_program_mgmt_agent'], artifacts: ['agents/03_execution_workspace/06_infra_devops_agent/pipeline_config.json'], consumers: ['09_production_agent', '13_maintenance_agent', '14_finops_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'Docker/K8s/CI-CD code & configs — coding-heavy, cost-efficient.' },
  }),
  entry({
    id: '07a_ui_agent', role: 'Frontend & Mobile Interface Engineer',
    short_role: 'UI / Frontend Engineer', phase: 'phase_three', pool: 'sync', base: true, optional: false,
    description: 'High-fidelity responsive wireframes, modular HTML/component CSS, mobile UI modules and per-feature unit tests, with embedded help documentation on every screen.',
    dependencies: ['03_architect_agent', '17_ux_designer_agent'], artifacts: ['agents/03_execution_workspace/07a_ui_agent/'], consumers: ['07d_integration_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'React/Next + RN component code — fast codegen with low cost.' },
  }),
  entry({
    id: '18_mobile_engineer_agent', role: 'Mobile (React Native / Expo) Engineer',
    short_role: 'Mobile Engineer', phase: 'phase_three', pool: 'sync', base: false, optional: true,
    description: 'Owns the mobile surface when the product targets iOS/Android: Expo/React Native implementation, app-store certificates and device-level QA, feeding the integration agent.',
    dependencies: ['03_architect_agent', '07a_ui_agent'], artifacts: ['agents/03_execution_workspace/18_mobile_engineer_agent/'], consumers: ['07d_integration_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'React Native/Expo code — fast codegen, low cost.' },
  }),
  entry({
    id: '07b_api_agent', role: 'Interface Connection / API Engineer',
    short_role: 'API Engineer', phase: 'phase_three', pool: 'sync', base: true, optional: false,
    description: 'Production-grade RESTful API specs, mock endpoints to unblock frontend, then secure data-routing code with unit tests per endpoint.',
    dependencies: ['03_architect_agent'], artifacts: ['agents/03_execution_workspace/07b_api_agent/'], consumers: ['07d_integration_agent', '19_appsec_engineer_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'REST/API implementation — coding-heavy, cost-efficient.' },
  }),
  entry({
    id: '07c_backend_db_agent', role: 'Data Infrastructure & Storage Engineer',
    short_role: 'Backend / Database', phase: 'phase_three', pool: 'sync', base: true, optional: false,
    description: 'Database provisioning, schemas, indexes, caching and queue patterns, schema migrations with rollback, and database unit tests.',
    dependencies: ['03_architect_agent'], artifacts: ['agents/03_execution_workspace/07c_backend_db_agent/'], consumers: ['07d_integration_agent', '19_appsec_engineer_agent', '21_data_analytics_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'Schema, migrations & index code — coding-heavy, cost-efficient.' },
  }),
  entry({
    id: '21_data_analytics_agent', role: 'Data & Analytics Engineer',
    short_role: 'Analytics & Funnels', phase: 'phase_three', pool: 'sync', base: false, optional: true,
    description: 'Defines the events schema, analytics pipeline, funnels, cohorts and product dashboards so the product is measurable from day one. Feeds marketing, growth, support and product evolution.',
    dependencies: ['07c_backend_db_agent'], artifacts: ['agents/03_execution_workspace/21_data_analytics_agent/analytics_schema.json'], consumers: ['11_customer_onboarding_agent', '12_marketing_agent', '16_product_analyst_agent', '23_growth_experiment_agent', '25_product_evolution_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'SQL/events pipeline code — coding-heavy, cost-efficient.' },
  }),
  entry({
    id: '19_appsec_engineer_agent', role: 'Application Security (AppSec) Engineer',
    short_role: 'AppSec Engineer', phase: 'phase_three', pool: 'sync', base: false, optional: true,
    description: 'Bakes security INTO the product — authentication, RLS, encryption, input validation — and runs penetration tests. Complements Agent 15 (which only audits committed secrets).',
    dependencies: ['07b_api_agent', '07c_backend_db_agent'], artifacts: ['agents/03_execution_workspace/19_appsec_engineer_agent/security_implementation.json'], consumers: ['07d_integration_agent', '15_secrets_compliance_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Security reasoning, auth/RLS design — careful analysis.' },
  }),
  entry({
    id: '07d_integration_agent', role: 'Systems Assembly / Integration Engineer',
    short_role: 'Integration Engineer', phase: 'phase_three', pool: 'sync', base: true, optional: false,
    description: 'Stitches UI + API + database into a functional end-to-end package, audits security guidelines and commits the verified assembly.',
    dependencies: ['07a_ui_agent', '07b_api_agent', '07c_backend_db_agent', '18_mobile_engineer_agent', '19_appsec_engineer_agent'], artifacts: ['agents/03_execution_workspace/07d_integration_agent/'], consumers: ['08_qa_agent', '20_perf_sre_agent', '09_production_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'Integration wiring code — coding-heavy, cost-efficient.' },
  }),
  entry({
    id: '20_perf_sre_agent', role: 'Performance & SRE Engineer',
    short_role: 'Performance / SRE', phase: 'phase_four', pool: 'sync', base: false, optional: true,
    description: 'Load/stress testing, performance budgets, and observability setup (APM, logging, alerting) so the product performs under load and is monitorable in production.',
    dependencies: ['07d_integration_agent'], artifacts: ['agents/03_execution_workspace/20_perf_sre_agent/sre_playbook.json'], consumers: ['08_qa_agent', '13_maintenance_agent', '09_production_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'Load tests & SRE configs — scripting-heavy, cost-efficient.' },
  }),
  entry({
    id: '08_qa_agent', role: 'Senior Test Architect & Quality Gatekeeper',
    short_role: 'QA / Test Architect', phase: 'phase_four', pool: 'sync', base: true, optional: false,
    description: 'End-to-end QA plan, automated test suites (functional/integration/API/regression/stress/visual), traceability to epics, defect tagging and Go/No-Go recommendation.',
    dependencies: ['07d_integration_agent', '20_perf_sre_agent'], artifacts: ['agents/03_execution_workspace/08_qa_agent/'], consumers: ['09_production_agent', '13_maintenance_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Test planning + defect analysis — careful reasoning.' },
  }),
  entry({
    id: '24_legal_privacy_agent', role: 'Legal & Privacy Compliance Agent',
    short_role: 'Legal & Privacy', phase: 'phase_four', pool: 'async', base: false, optional: true,
    description: 'ToS, privacy policy (GDPR / India DPDP), data-processing agreements and legal compliance pack, produced before launch and maintained afterwards.',
    dependencies: ['02_requirement_agent', '10_tech_pub_agent'], artifacts: ['agents/03_execution_workspace/24_legal_privacy_agent/legal_pack.json'], consumers: ['09_production_agent', '15_secrets_compliance_agent', '10_tech_pub_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-opus-4-6', reason: 'Legal precision & compliance reasoning — frontier reasoning.' },
  }),
  entry({
    id: '09_production_agent', role: 'Release & Deployment Coordinator',
    short_role: 'Production / Release', phase: 'phase_four', pool: 'sync', base: true, optional: false,
    description: 'Manages Staging/Live builds, verifies QA sign-off, runs production deploys, aggregates release report and publishes launch documentation. Triggers GATE-PRODUCTION-01.',
    dependencies: ['08_qa_agent', '06_infra_devops_agent'], artifacts: ['agents/03_execution_workspace/09_production_agent/'], consumers: ['10_tech_pub_agent', '11_customer_onboarding_agent', '12_marketing_agent', '13_maintenance_agent', '14_finops_agent', '22_customer_success_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Release coordination & risk assessment — careful judgment.' },
  }),
  entry({
    id: '10_tech_pub_agent', role: 'Technical Documentation & Localization Specialist',
    short_role: 'Tech Documentation', phase: 'phase_five', pool: 'async', base: true, optional: false,
    description: 'Context-aware help files, i18n/localization, installation guides, operational handbooks and release notes for every deployment.',
    dependencies: ['02_requirement_agent', '07a_ui_agent', '07b_api_agent'], artifacts: ['agents/03_execution_workspace/10_tech_pub_agent/'], consumers: ['12_marketing_agent', '24_legal_privacy_agent', '26_content_seo_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Docs + localization — precise writing.' },
  }),
  entry({
    id: '11_customer_onboarding_agent', role: 'CRM & Operations Specialist',
    short_role: 'Customer Onboarding', phase: 'phase_five', pool: 'async', base: true, optional: false,
    description: 'Customer acquisition pipelines, account/merchant provisioning, billing/tracking dashboard and a web-accessible support interface that routes defects to Jira.',
    dependencies: ['09_production_agent', '07c_backend_db_agent'], artifacts: ['agents/03_execution_workspace/11_customer_onboarding_agent/'], consumers: ['22_customer_success_agent', '13_maintenance_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'CRM/support flows — coding-heavy, cost-efficient.' },
  }),
  entry({
    id: '22_customer_success_agent', role: 'Customer Success & Support Triage Agent',
    short_role: 'Customer Success', phase: 'post_launch', pool: 'async', base: false, optional: true,
    description: 'Support ticket triage, onboarding flows, NPS/churn analysis and retention programs on top of the support intake built by Agent 11.',
    dependencies: ['11_customer_onboarding_agent', '09_production_agent'], artifacts: ['agents/03_execution_workspace/22_customer_success_agent/support_runs.json'], consumers: ['25_product_evolution_agent', '13_maintenance_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'Support triage + retention analysis — cost-efficient.' },
  }),
  entry({
    id: '12_marketing_agent', role: 'Growth & Social Media Marketing Automation Specialist',
    short_role: 'Marketing & Social', phase: 'phase_five', pool: 'async', base: true, optional: false,
    description: 'Automated social assets (Instagram, Facebook, YouTube, WhatsApp), campaign architectures, SEO strategy with meta-tag injection, and real-time traffic monitoring. Social channels always-on.',
    dependencies: ['09_production_agent', '10_tech_pub_agent', '21_data_analytics_agent'], artifacts: ['agents/03_execution_workspace/12_marketing_agent/campaigns.json'], consumers: ['23_growth_experiment_agent', '26_content_seo_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Social copy & campaign creative — strong writing.' },
  }),
  entry({
    id: '26_content_seo_agent', role: 'Content Marketing & SEO Publisher (WordPress/Blog)',
    short_role: 'Content & SEO Publisher', phase: 'post_launch', pool: 'async', base: false, optional: true,
    description: 'Owned-content channels: WordPress/blog publishing, product usage guides, case studies and SEO articles that turn product usage into search traffic. Suggested only for content-driven ideas.',
    dependencies: ['10_tech_pub_agent', '12_marketing_agent'], artifacts: ['agents/03_execution_workspace/26_content_seo_agent/content_calendar.json'], consumers: ['12_marketing_agent', '23_growth_experiment_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'Blog/SEO content at volume — cost-efficient writing.' },
  }),
  entry({
    id: '23_growth_experiment_agent', role: 'Growth & Experimentation Agent',
    short_role: 'Growth / A-B Testing', phase: 'post_launch', pool: 'async', base: false, optional: true,
    description: 'A/B tests, conversion optimization, pricing experiments and channel experiments to grow activation/retention post-launch.',
    dependencies: ['12_marketing_agent', '21_data_analytics_agent'], artifacts: ['agents/03_execution_workspace/23_growth_experiment_agent/experiment_matrix.json'], consumers: ['25_product_evolution_agent', '12_marketing_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Experiment design & analysis — analytical reasoning.' },
  }),
  entry({
    id: '13_maintenance_agent', role: 'Autonomous Remediation & Healing Agent',
    short_role: 'Maintenance / Patching', phase: 'phase_five', pool: 'async', base: true, optional: false,
    description: 'Monitors logs/exception tracks, isolates errors, formulates fixes, validates patches in sandbox, proposes upgrades and writes recommendations to the state ledger for human approval.',
    dependencies: ['09_production_agent', '20_perf_sre_agent'], artifacts: ['agents/03_execution_workspace/13_maintenance_agent/patch_history.json'], consumers: ['25_product_evolution_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'Hotfix code generation — fast + cost-efficient.' },
  }),
  entry({
    id: '14_finops_agent', role: 'Cloud Cost Optimization Guardrail',
    short_role: 'FinOps / Cost', phase: 'phase_five', pool: 'async', base: true, optional: false,
    description: 'Monitors infra scaling, cloud spend and LLM token consumption against the architecture cost model; writes constraint flags to pause non-essential workflows if budget is exceeded.',
    dependencies: ['06_infra_devops_agent', '09_production_agent'], artifacts: ['agents/03_execution_workspace/14_finops_agent/cost_tracking.json'], consumers: ['16_product_analyst_agent'],
    recommended: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', reason: 'Cost math + budget analysis — cost-efficient.' },
  }),
  entry({
    id: '15_secrets_compliance_agent', role: 'Secrets Management & Compliance Security Auditor',
    short_role: 'Security Compliance', phase: 'phase_five', pool: 'async', base: true, optional: false,
    description: 'Scans repos/containers/env configs for exposed keys, DB strings and compliance variances; rejects commits with unprotected credentials and flags offending agents.',
    dependencies: ['07d_integration_agent', '09_production_agent', '19_appsec_engineer_agent', '24_legal_privacy_agent'], artifacts: ['agents/03_execution_workspace/15_secrets_compliance_agent/encryption_receipts.json'], consumers: ['13_maintenance_agent', '09_production_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Security audit & compliance reasoning — careful analysis.' },
  }),
  entry({
    id: '25_product_evolution_agent', role: 'Product Evolution & Roadmap Agent',
    short_role: 'Product Evolution', phase: 'post_launch', pool: 'async', base: false, optional: true,
    description: 'Synthesizes support feedback, analytics, experiments and defects into a vNext roadmap with prioritized features and backlog for the program-management agent.',
    dependencies: ['22_customer_success_agent', '23_growth_experiment_agent', '13_maintenance_agent', '21_data_analytics_agent'], artifacts: ['agents/03_execution_workspace/25_product_evolution_agent/roadmap_vnext.json'], consumers: ['05_program_mgmt_agent', '12_marketing_agent'],
    recommended: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', reason: 'Roadmap synthesis from multiple signals — analytical reasoning.' },
  }),
];

export const AGENT_ROSTER_BY_ID: Record<string, AgentRosterEntry> = Object.fromEntries(
  AGENT_ROSTER.map((a) => [a.id, a])
);

export const BASE_AGENT_IDS = AGENT_ROSTER.filter((a) => a.base).map((a) => a.id);
export const OPTIONAL_AGENT_IDS = AGENT_ROSTER.filter((a) => a.optional).map((a) => a.id);

export function agentRosterEntry(id: string): AgentRosterEntry | undefined {
  return AGENT_ROSTER_BY_ID[id];
}

// List of option groups for the suggestion engine: optional agents ordered by phase.
export const OPTIONAL_AGENTS_BY_PHASE = Object.entries(
  AGENT_ROSTER
    .filter((a) => a.optional)
    .reduce<Record<string, AgentRosterEntry[]>>((acc, a) => {
      (acc[a.phase] = acc[a.phase] || []).push(a);
      return acc;
    }, {})
).map(([phase, agents]) => ({ phase, agents }));
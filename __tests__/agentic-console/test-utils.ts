// ── Agentic Console Shared Test Utilities ──────────────────────────────

export interface ComplianceCheck {
  id: string;
  check: string;
  type: string;
  required: boolean;
  passed: boolean;
}

export interface ExpertReviewer {
  role_title: string;
  industry_jd_reference: string;
  review_status: 'pending' | 'in_progress' | 'completed';
  review_triggered_by?: string;
  review_feedback?: string[];
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  sign_off_required: boolean;
  sign_off_granted: boolean;
}

export interface AgentState {
  agent_id: string;
  phase: string;
  pool: string;
  status: string;
  dependencies: string[];
  requires_human_approval: boolean;
  approved: boolean;
  role: string;
  expert_reviewer?: ExpertReviewer;
  approval_gate_triggers?: string[];
  last_artifact_emitted: string | string[];
  artifacts_emitted: string[];
  last_activity_timestamp: string;
  execution_count: number;
  last_run_duration_ms?: number;
  compliance_checklist: ComplianceCheck[];
  notes?: string;
}

export interface ApprovalGate {
  gate_id: string;
  name: string;
  triggered_by: string;
  description: string;
  status: string;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
}

export interface PipelineControl {
  current_phase: string;
  active_agents: string[];
  is_pipeline_paused: boolean;
  stuck_agent_check_enabled: boolean;
  stuck_agent_timeout_ms: number;
  last_sync_timestamp: string;
  dashboard_summary: {
    total_agents: number;
    agents_completed: number;
    agents_in_progress: number;
    agents_pending: number;
    agents_awaiting_review: number;
    agents_failed: number;
    overall_progress_pct: number;
    last_milestone: string;
    last_updated: string;
  };
  session_trace_id: string;
}

export interface StateMatrix {
  project_metadata: {
    project_name: string;
    version: string;
    factory_root: string;
    total_agents: number;
    supervisor_agent_version: string;
  };
  supervisor_control: {
    agent_00_supervisor: {
      status: string;
      current_action: string;
      next_agent_to_dispatch: string;
      dispatch_queue: string[];
      last_cycle_timestamp: string;
      cycle_count: number;
      max_cycles_before_break: number;
      cool_down_seconds: number;
      last_error: string | null;
      llm_provider: string;
      llm_model: string;
      budget_exceeded: boolean;
    };
    stuck_agent_monitor: {
      enabled: boolean;
      timeout_threshold_ms: number;
      check_interval_ms: number;
      auto_kill_on_stuck: boolean;
      auto_relaunch_on_stuck: boolean;
      max_relaunch_attempts: number;
      stuck_agents_detected: string[];
    };
    workflow_enforcement: Record<string, any>;
  };
  approval_gates: ApprovalGate[];
  pipeline_control: PipelineControl;
  agent_states: Record<string, AgentState>;
}

export interface AgentRegistry {
  $schema: string;
  global_guardrails: Record<string, any>;
  agents: Record<string, any>;
}

// ── Factory Functions ───────────────────────────────────────────────────

export function createMockAgentState(
  agentId: string,
  overrides?: Partial<AgentState>
): AgentState {
  return {
    agent_id: agentId,
    phase: 'phase_one',
    pool: agentId.startsWith('00') ? 'system' : 'async_pool',
    status: 'pending',
    dependencies: [],
    requires_human_approval: true,
    approved: false,
    role: 'Mock Role',
    last_artifact_emitted: '',
    artifacts_emitted: [],
    last_activity_timestamp: new Date().toISOString(),
    execution_count: 0,
    compliance_checklist: [
      { id: `${agentId.toUpperCase().replace(/^(\d{2}).*/, '$1')}-001`, check: 'Mock compliance check', type: 'artifact', required: true, passed: false },
    ],
    ...overrides,
  };
}

export function createMockStateMatrix(
  overrides?: Partial<StateMatrix>
): StateMatrix {
  const base: StateMatrix = {
    project_metadata: {
      project_name: 'PeteMart',
      version: '2.0',
      factory_root: 'C:/mock/factory/root',
      total_agents: 16,
      supervisor_agent_version: '1.0',
    },
    supervisor_control: {
      agent_00_supervisor: {
        status: 'active',
        current_action: 'Pipeline healthy — awaiting dispatch',
        next_agent_to_dispatch: '10_tech_pub_agent',
        dispatch_queue: ['10_tech_pub_agent', '11_customer_onboarding_agent', '12_marketing_agent'],
        last_cycle_timestamp: new Date().toISOString(),
        cycle_count: 56,
        max_cycles_before_break: 100,
        cool_down_seconds: 5,
        last_error: null,
        llm_provider: 'opencode',
        llm_model: 'deepseek-v4-flash',
        budget_exceeded: false,
      },
      stuck_agent_monitor: {
        enabled: true,
        timeout_threshold_ms: 600000,
        check_interval_ms: 15000,
        auto_kill_on_stuck: true,
        auto_relaunch_on_stuck: true,
        max_relaunch_attempts: 2,
        stuck_agents_detected: [],
      },
      workflow_enforcement: {
        feature_branch_required: true,
        direct_push_blocked: true,
        pr_required_before_merge: true,
        ci_must_pass_before_merge: true,
        applies_to_agents: ['07a', '07b', '07c', '07d', '08', '09', '10', '11', '12', '13', '14', '15'],
        applies_to_ai_assistant: true,
        enforced_at: '2026-06-04T13:00:00Z',
      },
    },
    approval_gates: [
      {
        gate_id: 'GATE-TECH-STACK-01',
        name: 'Tech Stack Selection & Evaluation',
        triggered_by: '03_architect_agent',
        description: 'Architecture blueprint defines tech stack.',
        status: 'approved',
        approved: true,
        approved_by: 'Human Gatekeeper (Mock)',
        approved_at: '2026-06-01T12:00:00Z',
        notes: 'Approved with mock changes.',
      },
      {
        gate_id: 'GATE-COSTING-01',
        name: 'Infrastructure Costing & Account Setup',
        triggered_by: '03_architect_agent',
        description: 'Cloud provider selection, pricing tier evaluation.',
        status: 'approved',
        approved: true,
        approved_by: 'Human Gatekeeper (Mock)',
        approved_at: '2026-06-01T12:00:00Z',
        notes: 'Approved.',
      },
      {
        gate_id: 'GATE-MVP-01',
        name: 'MVP Scope Definition',
        triggered_by: '05_program_mgmt_agent',
        description: 'Formal MVP boundary drawn.',
        status: 'approved',
        approved: true,
        approved_by: 'Human Gatekeeper (Mock)',
        approved_at: '2026-06-01T12:00:00Z',
        notes: 'MVP scope approved.',
      },
      {
        gate_id: 'GATE-PRODUCTION-01',
        name: 'Production Deployment Go/No-Go',
        triggered_by: '09_production_agent',
        description: 'Final sign-off before production rollout.',
        status: 'pending',
        approved: false,
      },
    ],
    pipeline_control: {
      current_phase: 'phase_one',
      active_agents: [],
      is_pipeline_paused: false,
      stuck_agent_check_enabled: true,
      stuck_agent_timeout_ms: 600000,
      last_sync_timestamp: new Date().toISOString(),
      dashboard_summary: {
        total_agents: 19,
        agents_completed: 5,
        agents_in_progress: 0,
        agents_pending: 7,
        agents_awaiting_review: 5,
        agents_failed: 0,
        overall_progress_pct: 28,
        last_milestone: 'Mock milestone',
        last_updated: new Date().toISOString(),
      },
      session_trace_id: 'mock-session-trace',
    },
    agent_states: {},
  };
  return { ...base, ...overrides };
}

export function createMockAgentRegistry(
  overrides?: Partial<AgentRegistry>
): AgentRegistry {
  return {
    $schema: 'https://opencode.ai',
    global_guardrails: {
      output_contract: 'dual_format_strict',
      required_extensions: ['.md', '.json'],
      state_router: '00_state_ledger/STATE_MATRIX.json',
      change_history: '00_state_ledger/CHANGE_REQUEST.json',
      universal_law: {
        version: '1.0',
        rule: 'Supervisor-Only Orchestration',
        description: 'Agent 0 is the sole entity authorized to launch, orchestrate, monitor, and verify any worker agent (1-15).',
      },
    },
    agents: {
      '01_ideation_agent': { role: 'Product Marketing & Market Knowledge Expert' },
      '02_requirement_agent': { role: 'Enterprise Product Manager / Product Owner' },
      '03_architect_agent': { role: 'Senior Enterprise Solution Architect' },
      '04_prototype_agent': { role: 'Senior Prototyping Engineer / Concept Verification Engine' },
      '05_program_mgmt_agent': { role: 'Senior Agile Program Manager & Scrum Master' },
      '06_infra_devops_agent': { role: 'DevOps Systems Architect & Core Supply Chain Automation Engine' },
    },
    ...overrides,
  };
}

export function createMockSupervisorDashboard() {
  return {
    total_agents: 19,
    agents_completed: 5,
    agents_in_progress: 0,
    agents_pending: 7,
    agents_awaiting_review: 5,
    agents_failed: 0,
    overall_progress_pct: 28,
    last_milestone: '03_architect_agent COMPLETED: Full product architecture. Awaiting HITL approval.',
    last_updated: new Date().toISOString(),
  };
}

// ── Sample Data ─────────────────────────────────────────────────────────

export const SAMPLE_AGENTS = [
  '00_supervisor_agent',
  '01_ideation_agent',
  '02_requirement_agent',
  '03_architect_agent',
  '04_prototype_agent',
  '05_program_mgmt_agent',
] as const;

export const SAMPLE_STATE_MATRIX: StateMatrix = (() => {
  const matrix = createMockStateMatrix();
  matrix.agent_states['00_supervisor_agent'] = createMockAgentState('00_supervisor_agent', {
    phase: 'system',
    pool: 'system',
    status: 'idle',
    requires_human_approval: false,
    approved: true,
    role: 'Senior Program Manager / Pipeline Orchestrator & Compliance Auditor',
    execution_count: 56,
  });
  matrix.agent_states['01_ideation_agent'] = createMockAgentState('01_ideation_agent', {
    status: 'approved',
    dependencies: [],
    approved: true,
    role: 'Product Marketing Manager & Hyper-Local Retail Economics Specialist',
    last_artifact_emitted: '01_front_office/01_ideation_agent/estimated_merchants.json',
    artifacts_emitted: [
      '01_front_office/01_ideation_agent/idea_proposal.md',
      '01_front_office/01_ideation_agent/business_revenue_model.json',
      '01_front_office/01_ideation_agent/store_inventory_datasets.json',
      '01_front_office/01_ideation_agent/01_ideation_agent_COMPLETION_SLIDE.pptx',
    ],
    execution_count: 2,
    expert_reviewer: {
      role_title: 'Senior Product Marketing Manager',
      industry_jd_reference: 'GTM Strategy Lead / Retail Economics Specialist',
      review_status: 'completed',
      review_feedback: ['Market research covers all 21 Pete markets. Approved by human gatekeeper.'],
      reviewed_by: 'Human Gatekeeper (Mock)',
      reviewed_at: '2026-06-01T12:00:00Z',
      sign_off_required: true,
      sign_off_granted: true,
    },
  });
  matrix.agent_states['02_requirement_agent'] = createMockAgentState('02_requirement_agent', {
    status: 'approved',
    dependencies: ['01_ideation_agent'],
    approved: true,
    role: 'Enterprise Product Manager / Product Owner',
    artifacts_emitted: [
      'agents/01_front_office/02_requirement_agent/prd.md',
      'agents/01_front_office/02_requirement_agent/prd_config.json',
      'agents/02_requirement_agent/02_requirement_agent_COMPLETION_SLIDE.pptx',
      'agents/02_requirement_agent/02_requirement_agent_DATA_EXPORT.xlsx',
    ],
    execution_count: 3,
  });
  matrix.agent_states['03_architect_agent'] = createMockAgentState('03_architect_agent', {
    status: 'failed',
    dependencies: ['02_requirement_agent'],
    approved: true,
    role: 'Senior Enterprise Solution Architect',
    approval_gate_triggers: ['GATE-TECH-STACK-01', 'GATE-COSTING-01'],
    last_artifact_emitted: [],
    artifacts_emitted: [],
    execution_count: 3,
    last_run_duration_ms: 42000,
  });
  matrix.agent_states['04_prototype_agent'] = createMockAgentState('04_prototype_agent', {
    status: 'pending',
    dependencies: ['03_architect_agent'],
    approved: false,
    role: 'Senior Prototyping Engineer / Concept Verification Engine',
    artifacts_emitted: [],
    execution_count: 0,
  });
  return matrix;
})();

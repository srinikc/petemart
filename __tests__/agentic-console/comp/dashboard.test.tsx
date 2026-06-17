import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AgenticConsoleDashboard from '@/app/agentic-console/DashboardClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/agentic-console',
  useSearchParams: () => new URLSearchParams('project=petemart'),
  useParams: () => ({}),
}));

function createMockResponse(data: any, ok = true) {
  return { ok, json: () => Promise.resolve(data), status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Error' };
}

const mockState = {
  stateMatrix: {
    agent_states: {
      '00_supervisor_agent': { agent_id: '00_supervisor_agent', phase: 'system', pool: 'async_pool', status: 'approved', role: 'Senior Program Manager', execution_count: 12, dependencies: [], requires_human_approval: false, approved: true, compliance_checklist: [], artifacts_emitted: [], notes: '', last_activity_timestamp: null, last_error: null, expert_reviewer: null },
      '01_ideation_agent': { agent_id: '01_ideation_agent', phase: 'phase_one', pool: 'async_pool', status: 'completed', role: 'Product Marketing Manager', execution_count: 1, dependencies: [], requires_human_approval: false, approved: true, compliance_checklist: [{ id: 'chk-1', check: 'Artifact exists', type: 'artifact', required: true, passed: true }], artifacts_emitted: ['report.md'], notes: '', last_activity_timestamp: null, last_error: null, expert_reviewer: null },
      '02_requirement_agent': { agent_id: '02_requirement_agent', phase: 'phase_one', pool: 'async_pool', status: 'awaiting_approval', role: 'Product Owner', execution_count: 2, dependencies: ['01_ideation_agent'], requires_human_approval: true, approved: false, compliance_checklist: [{ id: 'chk-2', check: 'PRD complete', type: 'test', required: true, passed: true }], artifacts_emitted: [], notes: '', last_activity_timestamp: null, last_error: null, expert_reviewer: null },
      '03_architect_agent': { agent_id: '03_architect_agent', phase: 'phase_one', pool: 'async_pool', status: 'failed', role: 'Enterprise Solution Architect', execution_count: 1, dependencies: ['02_requirement_agent'], requires_human_approval: false, approved: false, compliance_checklist: [], artifacts_emitted: [], notes: '', last_activity_timestamp: null, last_error: 'Timeout exceeded', expert_reviewer: null },
      '07a_ui_agent': { agent_id: '07a_ui_agent', phase: 'phase_three', pool: 'sync_pool', status: 'active', role: 'Frontend Engineer', execution_count: 3, dependencies: ['03_architect_agent'], requires_human_approval: false, approved: false, compliance_checklist: [], artifacts_emitted: [], notes: '', last_activity_timestamp: null, last_error: null, expert_reviewer: null, current_step: 2, steps_total: 5, step_label: 'Building components', estimated_remaining_ms: 120000 },
    },
    pipeline_control: { is_pipeline_paused: false, dashboard_summary: { total_agents: 5, agents_completed: 1, agents_in_progress: 1, agents_pending: 1, agents_awaiting_review: 1, agents_awaiting_input: 0, agents_failed: 1, overall_progress_pct: 20, last_milestone: '' } },
    supervisor_control: { approval_gates: [{ gate_id: 'GATE-01', name: 'Test Gate', triggered_by: '02_requirement_agent', description: '', status: 'open', approved: false }], agent_00_supervisor: { cycle_count: 3, max_cycles_before_break: 100, last_cycle_timestamp: new Date().toISOString(), status: 'idle' }, loop_guardrails: {} },
  },
};

describe('AgenticConsoleDashboard', () => {
  beforeEach(() => {
    global.EventSource = vi.fn(() => ({ addEventListener: vi.fn(), close: vi.fn() })) as any;
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockState));
      if (url.includes('/api/agentic-console/escalation')) return Promise.resolve(createMockResponse({ active_escalations: [] }));
      if (url.includes('/api/agentic-console/sla')) return Promise.resolve(createMockResponse({ aggregate: { overdue_count: 1, on_track_count: 4 } }));
      if (url.includes('/api/agentic-console/pipeline')) return Promise.resolve(createMockResponse({ ok: true }));
      if (url.includes('/api/agentic-console/approve')) return Promise.resolve(createMockResponse({ ok: true }));
      return Promise.resolve(createMockResponse({}));
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially when no initialState', () => {
    render(<AgenticConsoleDashboard />);
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeTruthy();
  });

  it('renders dashboard with initialState and shows progress ring', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      expect(screen.getAllByText(/40%/).length).toBeGreaterThan(0);
    });
  });

  it('renders phase columns with correct labels', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      expect(screen.getByText(/Phase 1/)).toBeInTheDocument();
      expect(screen.getByText(/Phase 3/)).toBeInTheDocument();
    });
  });

  it('renders agent cards inside phase columns', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      expect(screen.getByText('01 ideation')).toBeInTheDocument();
      expect(screen.getByText('02 requirement')).toBeInTheDocument();
      expect(screen.getByText('03 architect')).toBeInTheDocument();
    });
  });

  it('shows awaiting approval status badge', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      expect(screen.getAllByText(/Awaiting/).length).toBeGreaterThan(0);
    });
  });

  it('shows running active agent with step info', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      expect(screen.getByText('RUNNING')).toBeInTheDocument();
      expect(screen.getByText('2/5')).toBeInTheDocument();
    });
  });

  it('shows attention bar for awaiting agent', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      expect(screen.getByText('Attention Required')).toBeInTheDocument();
    });
  });

  it('opens flyout panel on agent card click', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      expect(screen.getByText('02 requirement')).toBeInTheDocument();
    });
    act(() => { fireEvent.click(screen.getByText('02 requirement')); });
    await waitFor(() => {
      expect(screen.getByText('02_requirement_agent')).toBeInTheDocument();
    });
  });

  it('flyout panel shows Approve/Reject buttons for awaiting agents', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      expect(screen.getByText('02 requirement')).toBeInTheDocument();
    });
    act(() => { fireEvent.click(screen.getByText('02 requirement')); });
    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });
  });

  it('shows supervisor chat modal trigger', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      const chatBtn = screen.getByText('Chat');
      expect(chatBtn).toBeInTheDocument();
    });
  });

  it('shows SSE connection status indicator as LIVE', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      const liveIndicators = screen.getAllByText('LIVE');
      expect(liveIndicators.length).toBeGreaterThan(0);
    });
  });

  it('shows instrument bar with agent counts', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      // liveSummary computes 2 completed (00_supervisor + 01_ideation) from 5 agents
      const doneButtons = screen.getAllByText('done');
      expect(doneButtons.length).toBeGreaterThan(0);
    });
  });

  it('shows empty phase column when no agents present', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      const noAgents = screen.getAllByText('No agents');
      expect(noAgents.length).toBeGreaterThan(0);
    });
  });

  it('handles empty state — no agents at all', async () => {
    const emptyState = {
      stateMatrix: {
        agent_states: {},
        pipeline_control: { is_pipeline_paused: false, dashboard_summary: { total_agents: 0, agents_completed: 0, agents_in_progress: 0, agents_pending: 0, agents_awaiting_review: 0, agents_awaiting_input: 0, agents_failed: 0, overall_progress_pct: 0, last_milestone: '' } },
        supervisor_control: { approval_gates: [], agent_00_supervisor: { cycle_count: 0, max_cycles_before_break: 100, status: 'idle' }, loop_guardrails: {} },
      },
    };
    render(<AgenticConsoleDashboard initialState={emptyState} />);
    await waitFor(() => {
      const noAgentElements = screen.getAllByText('No agents');
      expect(noAgentElements.length).toBeGreaterThan(0);
    });
  });

  it('shows error state via SLA overdue indicator', async () => {
    render(<AgenticConsoleDashboard initialState={mockState} />);
    await waitFor(() => {
      const slaIndicators = screen.getAllByText('SLA');
      expect(slaIndicators.length).toBeGreaterThan(0);
    });
  });
});

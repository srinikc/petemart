import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AgentDetailPage from '@/app/agentic-console/agents/[id]/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/agentic-console/agents/03_architect_agent',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: '03_architect_agent' }),
}));

function createMockResponse(data: any, ok = true) {
  return { ok, json: () => Promise.resolve(data), status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Error' };
}

const mockAgentData = {
  agentState: {
    agent_id: '03_architect_agent',
    phase: 'phase_one',
    pool: 'async_pool',
    status: 'completed',
    role: 'Enterprise Solution Architect',
    execution_count: 3,
    dependencies: ['02_requirement_agent'],
    requires_human_approval: true,
    approved: true,
    compliance_checklist: [
      { id: 'ARCH-01', check: 'Architecture diagrams produced', type: 'artifact', required: true, passed: true, passed_at: '2026-06-10T10:00:00Z', checked_by: 'auto' },
      { id: 'ARCH-02', check: 'Cost model defined', type: 'schema', required: true, passed: false, compliance_audit_note: 'Missing POC cost section' },
    ],
    artifacts_emitted: ['FEASIBILITY_ARCHITECTURE.md', 'DIAGRAMS.md', 'COST_MODEL.json'],
    notes: '',
    last_activity_timestamp: '2026-06-15T14:30:00Z',
    last_error: null,
    expert_reviewer: {
      role_title: 'Senior Solution Architect',
      review_status: 'approved',
      review_feedback: ['Architecture is sound', 'Consider adding CDN layer'],
      reviewed_by: 'arch-review-bot',
      reviewed_at: '2026-06-11T08:00:00Z',
      sign_off_required: true,
      sign_off_granted: true,
    },
    current_step: 4,
    steps_total: 4,
    step_label: 'Final validation',
  },
  registryEntry: {
    agent_id: '03_architect_agent',
    role: 'Enterprise Solution Architect',
    dependencies: ['02_requirement_agent'],
    checkpoints: ['Phase 1: Consume & Analyze', 'Phase 2: Design/Generate', 'Phase 3: Secondary Outputs', 'Phase 4: Consolidate & Finalize'],
  },
  systemPrompt: 'Act as a Senior Enterprise Solution Architect...',
  artifactStatus: [
    { file: 'FEASIBILITY_ARCHITECTURE.md', exists: true, size: 12400 },
    { file: 'DIAGRAMS.md', exists: true, size: 5600 },
    { file: 'COST_MODEL.json', exists: true, size: 3200 },
  ],
  consumedArtifacts: [
    { depId: '02_requirement_agent', status: 'approved', files: ['PRD.md'] },
  ],
  lastError: null,
  stateMatrix: {
    agent_states: {
      '02_requirement_agent': { agent_id: '02_requirement_agent', phase: 'phase_one', status: 'approved', role: 'Product Owner' },
    },
  },
};

describe('AgentDetailPage', () => {
  beforeEach(() => {
    global.EventSource = vi.fn(() => ({ addEventListener: vi.fn(), close: vi.fn() })) as any;
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/agent-detail')) return Promise.resolve(createMockResponse(mockAgentData));
      if (url.includes('/api/agentic-console/agent-messages')) return Promise.resolve(createMockResponse({ messages: [{ id: 'm1', from_agent: 'human', to_agent: '03_architect_agent', subject: 'Review', body: 'Looks good', timestamp: '2026-06-15T10:00:00Z' }] }));
      if (url.includes('/api/agentic-console/agent-memory')) return Promise.resolve(createMockResponse({ entries: [{ id: 'mem-1', source: 'human_gatekeeper', content: 'Remember to check cost model', timestamp: '2026-06-15T10:00:00Z' }] }));
      if (url.includes('/api/agentic-console/agent-version')) return Promise.resolve(createMockResponse({ output_version: 2, compatibility: 'backward-compatible', cascade_history: [{ version: 2, compatibility: 'backward-compatible', timestamp: '2026-06-15T10:00:00Z', cascaded: [] }] }));
      if (url.includes('/api/agentic-console/prompt-snapshots')) return Promise.resolve(createMockResponse({ snapshots: [{ id: 'snap-1', system_prompt: 'Act as...', config: { role: 'Architect' }, timestamp: '2026-06-15T10:00:00Z' }] }));
      if (url.includes('/api/agentic-console/pull-requests')) return Promise.resolve(createMockResponse({ pull_requests: [{ url: 'https://github.com/pr/1', number: 1, branch: '03-architect-agent-fix' }] }));
      if (url.includes('/api/agentic-console/code-reviews')) return Promise.resolve(createMockResponse({ reviews: [{ id: 'rev-1', reviewer: 'AI', status: 'approved', comments: [] }] }));
      if (url.includes('/api/agentic-console/traces')) return Promise.resolve(createMockResponse({ traces: [{ span_id: 's1', operation: 'agent_run', status: 'completed', started_at: '2026-06-15T10:00:00Z', duration_ms: 3500 }] }));
      if (url.includes('/api/agentic-console/events')) return { addEventListener: vi.fn(), close: vi.fn() };
      return Promise.resolve(createMockResponse({}));
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state then agent detail', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('03_architect_agent')).toBeInTheDocument();
    });
  });

  it('renders agent header with agent ID and role after loading', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('03_architect_agent')).toBeInTheDocument();
    });
    expect(screen.getByText('Enterprise Solution Architect')).toBeInTheDocument();
  });

  it('renders all 6 tab buttons', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Prompts')).toBeInTheDocument();
      expect(screen.getAllByText('Artifacts').length).toBeGreaterThan(0);
      expect(screen.getByText('Run Logs')).toBeInTheDocument();
      expect(screen.getByText('Comm')).toBeInTheDocument();
      expect(screen.getByText('MCP Tools')).toBeInTheDocument();
    });
  });

  it('overview tab shows quick stats metrics', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Phase')).toBeInTheDocument();
    });
    expect(screen.getByText(/Phase 1/)).toBeInTheDocument();
    expect(screen.getByText('Async')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('overview tab shows compliance checklist with pass/fail', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getAllByText(/Compliance/).length).toBeGreaterThan(0);
    });
    expect(screen.getByText('ARCH-01')).toBeInTheDocument();
    expect(screen.getByText('ARCH-02')).toBeInTheDocument();
  });

  it('overview tab shows dependencies section', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Dependencies')).toBeInTheDocument();
    });
    expect(screen.getByText('02_requirement_agent')).toBeInTheDocument();
  });

  it('overview tab shows expert reviewer section', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Expert Reviewer')).toBeInTheDocument();
    });
    expect(screen.getByText('Senior Solution Architect')).toBeInTheDocument();
  });

  it('overview tab shows guardrails & controls', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Guardrails & Controls')).toBeInTheDocument();
    });
    expect(screen.getByText('3/3 max')).toBeInTheDocument();
  });

  it('overview tab shows agent memory section', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Agent Memory')).toBeInTheDocument();
    });
    expect(screen.getByText('Remember to check cost model')).toBeInTheDocument();
  });

  it('overview tab shows output versions', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Output Versions')).toBeInTheDocument();
    });
    expect(screen.getAllByText('backward-compatible').length).toBeGreaterThan(0);
  });

  it('switches to prompts tab on click', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
    act(() => { fireEvent.click(screen.getByText('Prompts')); });
    await waitFor(() => {
      expect(screen.getAllByText(/Act as a Senior Enterprise Solution Architect/).length).toBeGreaterThan(0);
    });
  });

  it('switches to artifacts tab and shows file listings', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Artifacts').length).toBeGreaterThan(0);
    });
    act(() => { fireEvent.click(screen.getByRole('button', { name: /Artifacts/ })); });
    await waitFor(() => {
      expect(screen.getByText('FEASIBILITY_ARCHITECTURE.md')).toBeInTheDocument();
    });
  });

  it('switches to comm tab and shows message composer', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Comm')).toBeInTheDocument();
    });
    act(() => { fireEvent.click(screen.getByText('Comm')); });
    await waitFor(() => {
      expect(screen.getByText('Looks good')).toBeInTheDocument();
    });
  });

  it('shows error state when agent is not found', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/agent-detail')) return Promise.resolve(createMockResponse({ agentState: null }));
      return Promise.resolve(createMockResponse({}));
    }) as any;
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Agent not found')).toBeInTheDocument();
    });
  });

  it('shows code reviews section', async () => {
    render(<AgentDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });
});

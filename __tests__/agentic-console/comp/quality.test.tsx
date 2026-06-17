import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import QualityPage from '@/app/agentic-console/quality/page';

const mockUseSearchParams = vi.hoisted(() => vi.fn(() => new URLSearchParams()));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/agentic-console/quality',
  useSearchParams: mockUseSearchParams,
  useParams: () => ({}),
}));

const mockStateData = {
  stateMatrix: {
    agent_states: {
      '00_supervisor_agent': {
        agent_id: '00_supervisor_agent', status: 'approved', phase: 'system',
        execution_count: 3, requires_human_approval: false, role: 'Senior Program Manager', notes: '',
        last_error: null, pool: 'system', dependencies: [], approved: true,
        compliance_checklist: [], artifacts_emitted: [], last_activity_timestamp: '2026-06-15T10:00:00Z', expert_reviewer: null,
      },
      '01_ideation_agent': {
        agent_id: '01_ideation_agent', status: 'failed', phase: 'phase_one',
        execution_count: 5, requires_human_approval: true, role: 'Product Marketing Manager', notes: 'Needs review',
        last_error: 'Output schema mismatch', pool: 'async', dependencies: [], approved: false,
        compliance_checklist: [], artifacts_emitted: [], last_activity_timestamp: null, expert_reviewer: null,
      },
      '05_program_mgmt_agent': {
        agent_id: '05_program_mgmt_agent', status: 'awaiting_approval', phase: 'phase_two',
        execution_count: 2, requires_human_approval: true, role: 'Senior Agile PM', notes: '',
        last_error: null, pool: 'async', dependencies: [], approved: false,
        compliance_checklist: [], artifacts_emitted: [], last_activity_timestamp: null, expert_reviewer: null,
      },
    },
    supervisor_control: {
      loop_guardrails: {
        max_sequential_executions_per_agent: 3,
        max_total_cycles_lifetime: 100,
        circuit_breaker_threshold: 5,
      },
      workflow_enforcement: {
        feature_branch_required: true,
        direct_push_blocked: true,
        pr_required_before_merge: true,
        pr_tracking: { pr_list: [{ number: 1, title: 'test', branch: 'feature/test', merged_at: '2026-06-01T00:00:00Z', ai_assistant_compliant: true, violations: [] }] },
      },
      pipeline_strategy: {
        halt_at_approval_gates: true,
        halt_at_expert_review: false,
        halt_at_production_deployment: true,
      },
    },
  },
};

const mockReviewsData = {
  reviews: [
    { agent_id: '07a_ui_agent', reviewer_role: 'Sr. Frontend Engineer', findings_count: 3, fixes_count: 3, pr_number: 12, review_gate_passed: true, fix_gate_passed: true },
    { agent_id: '07b_api_agent', reviewer_role: 'Sr. Backend Engineer', findings_count: 5, fixes_count: 4, pr_number: 13, review_gate_passed: true, fix_gate_passed: false },
  ],
};

const mockQaResults = {
  summary: {
    totalTests: 150, passed: 135, failed: 10, passRate: 90,
    qualityGatesPassed: 3, qualityGatesTotal: 4,
    totalDefects: 12, openDefects: 5, fixedDefects: 7,
    durationMs: 45000, lastUpdated: '2026-06-15T10:00:00Z',
  },
  testTypes: [
    { id: 'unit', name: 'Unit Tests', total: 50, passed: 48, failed: 1, blocked: 1, status: 'implemented' },
    { id: 'component', name: 'Component Tests', total: 30, passed: 30, failed: 0, blocked: 0, status: 'implemented' },
    { id: 'integration', name: 'Integration Tests', total: 25, passed: 20, failed: 3, blocked: 2, status: 'implemented' },
    { id: 'e2e', name: 'E2E Tests', total: 20, passed: 12, failed: 6, blocked: 2, status: 'partial' },
    { id: 'security', name: 'Security Tests', total: 15, passed: 15, failed: 0, blocked: 0, status: 'implemented' },
    { id: 'load', name: 'Load Tests', total: 10, passed: 10, failed: 0, blocked: 0, status: 'implemented' },
  ],
  qualityGates: [
    { id: 'gate-unit', name: 'Unit Test Gate', status: 'pass', description: 'All unit tests must pass' },
    { id: 'gate-integration', name: 'Integration Gate', status: 'pass', description: 'API integration tests pass' },
    { id: 'gate-e2e', name: 'E2E Gate', status: 'fail', description: 'End-to-end flow validation' },
    { id: 'gate-security', name: 'Security Gate', status: 'pass', description: 'No critical vulnerabilities' },
  ],
};

function createMockResponse(data: any, ok = true) {
  return { ok, json: () => Promise.resolve(data), status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Error' };
}

describe('QualityPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
      if (url.includes('/api/qa/reviews')) return Promise.resolve(createMockResponse(mockReviewsData));
      if (url.includes('/api/qa/results')) return Promise.resolve(createMockResponse(mockQaResults));
      return Promise.resolve(createMockResponse({}));
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    render(<QualityPage />);
    expect(screen.getByText(/Loading Quality Dashboard/i)).toBeInTheDocument();
  });

  it('renders KPI cards with correct data after loading', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Total Tests').length).toBeGreaterThan(0);
    expect(screen.getByText('135')).toBeInTheDocument();
    expect(screen.getAllByText('Passed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getAllByText('Pass Rate').length).toBeGreaterThan(0);
    expect(screen.getByText('3/4')).toBeInTheDocument();
    expect(screen.getByText('Gates Passed')).toBeInTheDocument();
    expect(screen.getAllByText('12').length).toBeGreaterThan(0);
    expect(screen.getByText('Defects')).toBeInTheDocument();
  });

  it('renders Go/No-Go badge with correct decision', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('NO-GO')).toBeInTheDocument();
    });

    const badge = screen.getByText('NO-GO');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('span')).toHaveClass('bg-red-100');
    expect(screen.getByText(/3\/4 quality gates passed/i)).toBeInTheDocument();
  });

  it('renders Release Go/No-Go Status section', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Release Go / No-Go Status')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Coverage Summary')).toBeInTheDocument();
  });

  it('shows Test Coverage Summary metrics', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Types Implemented')).toBeInTheDocument();
    });

    expect(screen.getByText(/5\/6/)).toBeInTheDocument();
    expect(screen.getByText('Open Defects')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Fixed Defects')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
  });

  it('renders quality gates list', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Unit Test Gate')).toBeInTheDocument();
    });

    expect(screen.getByText('Integration Gate')).toBeInTheDocument();
    expect(screen.getByText('E2E Gate')).toBeInTheDocument();
    expect(screen.getByText('Security Gate')).toBeInTheDocument();
    expect(screen.getByText('All unit tests must pass')).toBeInTheDocument();
  });

  it('renders requirement quality status table', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Requirement Quality Status')).toBeInTheDocument();
    });

    expect(screen.getByText('REQ-UI')).toBeInTheDocument();
    expect(screen.getByText('REQ-API')).toBeInTheDocument();
    expect(screen.getByText('REQ-BE')).toBeInTheDocument();
    expect(screen.getByText('REQ-COM')).toBeInTheDocument();
    expect(screen.getByText('REQ-INFRA')).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
  });

  it('switches to Test Results tab on click', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Results')).toBeInTheDocument();
    });

    act(() => { fireEvent.click(screen.getByText('Test Results')); });

    await waitFor(() => {
      expect(screen.getByText('Test Results by Type')).toBeInTheDocument();
    });

    expect(screen.getByText('Unit Tests')).toBeInTheDocument();
    expect(screen.getByText('Component Tests')).toBeInTheDocument();
    expect(screen.getByText('Integration Tests')).toBeInTheDocument();
    expect(screen.getByText('E2E Tests')).toBeInTheDocument();
    expect(screen.getByText('Security Tests')).toBeInTheDocument();
    expect(screen.getByText('Load Tests')).toBeInTheDocument();
  });

  it('renders test types table with pass/fail/blocked counts', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Results')).toBeInTheDocument();
    });

    act(() => { fireEvent.click(screen.getByText('Test Results')); });

    await waitFor(() => {
      expect(screen.getByText('Unit Tests')).toBeInTheDocument();
    });

    const unitRow = screen.getByText('Unit Tests').closest('tr');
    expect(unitRow).toBeTruthy();
    expect(unitRow!.textContent).toContain('50');
    expect(unitRow!.textContent).toContain('48');
    expect(unitRow!.textContent).toContain('1');

    const e2eRow = screen.getByText('E2E Tests').closest('tr');
    expect(e2eRow).toBeTruthy();
    expect(e2eRow!.textContent).toContain('20');
    expect(e2eRow!.textContent).toContain('12');
    expect(e2eRow!.textContent).toContain('6');
    expect(e2eRow!.textContent).toContain('2');
  });

  it('renders pipeline guardrails in test tab', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Results')).toBeInTheDocument();
    });

    act(() => { fireEvent.click(screen.getByText('Test Results')); });

    await waitFor(() => {
      expect(screen.getByText('Pipeline Guardrails')).toBeInTheDocument();
    });

    expect(screen.getByText(/Max exec\/agent/)).toBeInTheDocument();
    expect(screen.getAllByText(/3/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Max cycles/)).toBeInTheDocument();
    expect(screen.getAllByText(/100/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Circuit breaker/)).toBeInTheDocument();
    expect(screen.getByText(/5 failures/)).toBeInTheDocument();

    expect(screen.getByText(/Feature branch/)).toBeInTheDocument();
    expect(screen.getAllByText(/✅/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Direct push blocked/)).toBeInTheDocument();
    expect(screen.getByText(/PR required/)).toBeInTheDocument();

    expect(screen.getByText(/Approval gates/)).toBeInTheDocument();
    expect(screen.getByText(/Expert review/)).toBeInTheDocument();
    expect(screen.getByText(/Production deploy/)).toBeInTheDocument();
  });

  it('switches to Defects tab on click', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Defects & Reviews')).toBeInTheDocument();
    });

    act(() => { fireEvent.click(screen.getByText('Defects & Reviews')); });

    await waitFor(() => {
      expect(screen.getByText('Code Review Status')).toBeInTheDocument();
    });

    expect(screen.getByText(/07a_ui_agent/)).toBeInTheDocument();
    expect(screen.getByText(/07b_api_agent/)).toBeInTheDocument();
  });

  it('renders defect summary KPIs in defects tab', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Defects & Reviews')).toBeInTheDocument();
    });

    act(() => { fireEvent.click(screen.getByText('Defects & Reviews')); });

    await waitFor(() => {
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    expect(screen.getByText('Fixed')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders code review table with review and fix gates', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Defects & Reviews')).toBeInTheDocument();
    });

    act(() => { fireEvent.click(screen.getByText('Defects & Reviews')); });

    await waitFor(() => {
      expect(screen.getByText('Code Review Status')).toBeInTheDocument();
    });

    expect(screen.getByText(/Sr. Frontend Engineer/)).toBeInTheDocument();
    expect(screen.getByText(/Sr. Backend Engineer/)).toBeInTheDocument();
    expect(screen.getByText(/#12/)).toBeInTheDocument();
    expect(screen.getByText(/#13/)).toBeInTheDocument();
    expect(screen.getByText(/Agent 0 enforced/)).toBeInTheDocument();
  });

  it('renders open items in defects tab', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Defects & Reviews')).toBeInTheDocument();
    });

    act(() => { fireEvent.click(screen.getByText('Defects & Reviews')); });

    await waitFor(() => {
      expect(screen.getByText('Open Items Awaiting Action')).toBeInTheDocument();
    });

    expect(screen.getByText('01_ideation_agent')).toBeInTheDocument();
    expect(screen.getByText('Output schema mismatch')).toBeInTheDocument();
    expect(screen.getByText('05_program_mgmt_agent')).toBeInTheDocument();
  });

  it('opens agent detail modal on view details click', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Defects & Reviews')).toBeInTheDocument();
    });

    act(() => { fireEvent.click(screen.getByText('Defects & Reviews')); });

    await waitFor(() => {
      expect(screen.getAllByText('View details →').length).toBeGreaterThan(0);
    });

    act(() => { fireEvent.click(screen.getAllByText('View details →')[0]); });

    await waitFor(() => {
      const titles = screen.getAllByText('01_ideation_agent');
      expect(titles.length).toBe(2);
    });

    expect(screen.getByText('Product Marketing Manager')).toBeInTheDocument();
    expect(screen.getAllByText('Output schema mismatch').length).toBeGreaterThan(0);
    expect(screen.getByText(/Executions/)).toBeInTheDocument();
    expect(screen.getAllByText(/5/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Needs review/).length).toBeGreaterThan(0);
  });

  it('closes agent detail modal on backdrop click', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Defects & Reviews')).toBeInTheDocument();
    });

    act(() => { fireEvent.click(screen.getByText('Defects & Reviews')); });

    await waitFor(() => {
      expect(screen.getAllByText('View details →').length).toBeGreaterThan(0);
    });

    act(() => { fireEvent.click(screen.getAllByText('View details →')[0]); });

    const modalTitle = await screen.findAllByText('01_ideation_agent');
    expect(modalTitle.length).toBe(2);

    const modalOverlay = modalTitle[0].closest('[class*="fixed"]');
    if (modalOverlay) {
      act(() => { fireEvent.click(modalOverlay); });
      await waitFor(() => {
        expect(screen.queryByText('×')).not.toBeInTheDocument();
      });
    }
  });

  it('closes agent modal with close button', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Defects & Reviews')).toBeInTheDocument();
    });

    act(() => { fireEvent.click(screen.getByText('Defects & Reviews')); });

    await waitFor(() => {
      expect(screen.getAllByText('View details →').length).toBeGreaterThan(0);
    });

    act(() => { fireEvent.click(screen.getAllByText('View details →')[0]); });

    const closeBtn = screen.getByText('×');
    expect(closeBtn).toBeInTheDocument();

    act(() => { fireEvent.click(closeBtn); });

    await waitFor(() => {
      expect(screen.queryByText('Product Marketing Manager')).not.toBeInTheDocument();
    });
  });

  it('KPI cards navigate to correct tabs on click', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Total Tests').length).toBeGreaterThan(0);
    });

    const kpiGrid = document.querySelector('.grid-cols-2');
    const kpiCards = kpiGrid?.querySelectorAll('[class*="cursor-pointer"]');
    if (kpiCards && kpiCards.length > 0) {
      act(() => { fireEvent.click(kpiCards[0]); });
    }

    await waitFor(() => {
      expect(screen.getByText('Test Results by Type')).toBeInTheDocument();
    });
  });

  it('renders link to full QA dashboard', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText(/Full QA Dashboard/)).toBeInTheDocument();
    });

    const links = screen.getAllByText(/Full QA Dashboard/);
    expect(links.length).toBeGreaterThan(0);
    links.forEach(link => {
      expect(link.closest('a')).toHaveAttribute('href', '/agentic-console/qa-dashboard');
    });
  });

  it('shows dashboard back button', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    const backBtn = screen.getByText('Dashboard');
    expect(backBtn).toBeInTheDocument();
  });

  it('renders req quality status table legend', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText(/Green ≥ 90/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Yellow 70-89/)).toBeInTheDocument();
    expect(screen.getByText(/Red < 70/)).toBeInTheDocument();
  });

  it('shows empty state when no QA results are available', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
      if (url.includes('/api/qa/reviews')) return Promise.resolve(createMockResponse({ reviews: [] }));
      if (url.includes('/api/qa/results')) return Promise.resolve(createMockResponse({}));
      return Promise.resolve(createMockResponse({}));
    }) as any;

    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText(/QA results not available/)).toBeInTheDocument();
    });
  });

  it('shows PENDING badge when no gates are configured', async () => {
    const noGatesData = {
      ...mockQaResults,
      qualityGates: [],
      summary: { ...mockQaResults.summary, qualityGatesPassed: 0, qualityGatesTotal: 0 },
    };

    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
      if (url.includes('/api/qa/reviews')) return Promise.resolve(createMockResponse(mockReviewsData));
      if (url.includes('/api/qa/results')) return Promise.resolve(createMockResponse(noGatesData));
      return Promise.resolve(createMockResponse({}));
    }) as any;

    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    expect(screen.getByText(/No gates configured/)).toBeInTheDocument();
  });

  it('shows GO badge when all gates pass', async () => {
    const allPassData = {
      ...mockQaResults,
      qualityGates: mockQaResults.qualityGates.map(g => ({ ...g, status: 'pass' })),
    };

    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
      if (url.includes('/api/qa/reviews')) return Promise.resolve(createMockResponse(mockReviewsData));
      if (url.includes('/api/qa/results')) return Promise.resolve(createMockResponse(allPassData));
      return Promise.resolve(createMockResponse({}));
    }) as any;

    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('GO')).toBeInTheDocument();
    });
  });

  it('shows empty test types state', async () => {
    const emptyTestTypes = { ...mockQaResults, testTypes: [] };

    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
      if (url.includes('/api/qa/reviews')) return Promise.resolve(createMockResponse(mockReviewsData));
      if (url.includes('/api/qa/results')) return Promise.resolve(createMockResponse(emptyTestTypes));
      return Promise.resolve(createMockResponse({}));
    }) as any;

    render(<QualityPage />);
    await waitFor(() => { expect(screen.getByText('Test Results')).toBeInTheDocument(); });
    act(() => { fireEvent.click(screen.getByText('Test Results')); });

    await waitFor(() => {
      expect(screen.getByText(/No test type data available/)).toBeInTheDocument();
    });
  });

  it('shows empty reviews state', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
      if (url.includes('/api/qa/reviews')) return Promise.resolve(createMockResponse({ reviews: [] }));
      if (url.includes('/api/qa/results')) return Promise.resolve(createMockResponse(mockQaResults));
      return Promise.resolve(createMockResponse({}));
    }) as any;

    render(<QualityPage />);
    await waitFor(() => { expect(screen.getByText('Defects & Reviews')).toBeInTheDocument(); });
    act(() => { fireEvent.click(screen.getByText('Defects & Reviews')); });

    await waitFor(() => {
      expect(screen.getByText(/No code review data available/)).toBeInTheDocument();
    });
  });

  it('shows resolved items state when no open items', async () => {
    const resolvedState = {
      ...mockStateData,
      stateMatrix: {
        ...mockStateData.stateMatrix,
        agent_states: {
          '00_supervisor_agent': { ...mockStateData.stateMatrix.agent_states['00_supervisor_agent'] },
        },
      },
    };

    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(resolvedState));
      if (url.includes('/api/qa/reviews')) return Promise.resolve(createMockResponse({ reviews: [] }));
      if (url.includes('/api/qa/results')) return Promise.resolve(createMockResponse(mockQaResults));
      return Promise.resolve(createMockResponse({}));
    }) as any;

    render(<QualityPage />);
    await waitFor(() => { expect(screen.getByText('Defects & Reviews')).toBeInTheDocument(); });
    act(() => { fireEvent.click(screen.getByText('Defects & Reviews')); });

    await waitFor(() => {
      expect(screen.getByText(/All agents resolved/)).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;

    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText(/Loading Quality Dashboard/i)).toBeInTheDocument();
    });
  });

  it('handles empty state matrix gracefully', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse({ stateMatrix: null }));
      if (url.includes('/api/qa/reviews')) return Promise.resolve(createMockResponse(mockReviewsData));
      if (url.includes('/api/qa/results')) return Promise.resolve(createMockResponse(mockQaResults));
      return Promise.resolve(createMockResponse({}));
    }) as any;

    render(<QualityPage />);
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  it('passes project query param to state API', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('project=test-proj'));

    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('project=test-proj'), expect.anything());

    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it('renders quality gates with correct descriptions', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Unit Test Gate')).toBeInTheDocument();
    });

    expect(screen.getByText('All unit tests must pass')).toBeInTheDocument();
    expect(screen.getByText('API integration tests pass')).toBeInTheDocument();
    expect(screen.getByText('End-to-end flow validation')).toBeInTheDocument();
  });

  it('shows PASS/PARTIAL/N/A badges in test types', async () => {
    render(<QualityPage />);

    await waitFor(() => { expect(screen.getByText('Test Results')).toBeInTheDocument(); });
    act(() => { fireEvent.click(screen.getByText('Test Results')); });

    await waitFor(() => {
      const passBadges = screen.getAllByText('PASS');
      expect(passBadges.length).toBeGreaterThan(0);
      const partialBadges = screen.getAllByText('PARTIAL');
      expect(partialBadges.length).toBeGreaterThan(0);
    });
  });

  it('displays correct count in Test Coverage Summary', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Types Implemented')).toBeInTheDocument();
    });

    const summarySection = screen.getByText('Test Coverage Summary').closest('div');
    expect(summarySection?.textContent).toContain('5/6');
  });

  it('renders all three tab buttons', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      const kpiTab = screen.getByText('Quality KPIs');
      const testTab = screen.getByText('Test Results');
      const defectsTab = screen.getByText('Defects & Reviews');
      expect(kpiTab).toBeInTheDocument();
      expect(testTab).toBeInTheDocument();
      expect(defectsTab).toBeInTheDocument();
    });
  });

  it('renders KPI tab as active by default', async () => {
    render(<QualityPage />);

    await waitFor(() => {
      const kpiTab = screen.getByText('Quality KPIs');
      expect(kpiTab.className).toContain('text-indigo-700');
      expect(kpiTab.className).toContain('border-indigo-600');
    });
  });
});

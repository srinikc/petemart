import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import OperationsPage from '@/app/agentic-console/operations/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/agentic-console/operations',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
}));

const mockStateData = {
  stateMatrix: {
    supervisor_control: {
      workflow_enforcement: {
        feature_branch_required: true,
        direct_push_blocked: true,
        pr_required_before_merge: true,
        pr_tracking: {
          pr_list: [
            { number: 1, title: 'feat: initial setup', branch: 'feature/setup', merged_at: '2026-06-01T00:00:00Z', ai_assistant_compliant: true, violations: [] },
            { number: 2, title: 'feat: add auth', branch: 'feature/auth', merged_at: '2026-06-02T00:00:00Z', ai_assistant_compliant: true, violations: [] },
          ],
        },
      },
    },
  },
};

const mockTokenData = {
  sessions: [
    { timestamp: '2026-06-10T10:00:00Z', tokens_input: 50000, tokens_output: 10000 },
    { timestamp: '2026-06-11T10:00:00Z', tokens_input: 60000, tokens_output: 15000 },
    { timestamp: '2026-06-12T10:00:00Z', tokens_input: 75000, tokens_output: 20000 },
  ],
  summary: {
    total_sessions: 3,
    total_tokens_input: 185000,
    total_tokens_output: 45000,
    total_cost: 0.89,
    agent_chart: [
      { name: 'Supervisor', tokens_input: 80000, tokens_output: 20000 },
      { name: 'Ideation', tokens_input: 65000, tokens_output: 15000 },
      { name: 'QA Agent', tokens_input: 40000, tokens_output: 10000 },
    ],
  },
};

const mockBranchData = {
  branches: [
    { name: 'develop', status: 'active', lastCommit: '2026-06-15', health: 'green' },
    { name: 'feature/quality-dashboard', status: 'active', lastCommit: '2026-06-14', health: 'green' },
    { name: 'feature/health-monitoring', status: 'stale', lastCommit: '2026-06-01', health: 'amber' },
    { name: 'feature/conflict-branch', status: 'conflict', lastCommit: '2026-06-10', health: 'red' },
  ],
};

const mockPrData = {
  pull_requests: [
    { number: 42, title: 'feat: quality dashboard', branch: 'feature/quality-dashboard', state: 'MERGED', ci_status: 'success', review_status: 'approved', merged_at: '2026-06-14T12:00:00Z', url: 'https://github.com/owner/repo/pull/42' },
    { number: 43, title: 'fix: health page timeout', branch: 'feature/health-fix', state: 'OPEN', ci_status: 'pending', review_status: 'pending', merged_at: null, url: 'https://github.com/owner/repo/pull/43' },
    { number: 44, title: 'WIP: operations refactor', branch: 'feature/ops-refactor', state: 'OPEN', ci_status: 'failure', review_status: 'changes_requested', merged_at: null, url: 'https://github.com/owner/repo/pull/44' },
  ],
};

const mockJiraData = {
  configured: true,
  total: 5,
  issues: [
    { id: 'PROJ-101', summary: 'Setup CI/CD pipeline', type: 'Task', status: 'done', priority: 'High', assignee: 'Dev Team', updated: '2026-06-12T00:00:00Z', url: 'https://jira.example.com/browse/PROJ-101' },
    { id: 'PROJ-102', summary: 'Implement user auth', type: 'Story', status: 'in_progress', priority: 'Highest', assignee: 'Backend Team', updated: '2026-06-15T00:00:00Z', url: 'https://jira.example.com/browse/PROJ-102' },
    { id: 'PROJ-103', summary: 'Write API docs', type: 'Task', status: 'todo', priority: 'Low', assignee: 'Tech Writer', updated: '2026-06-10T00:00:00Z', url: 'https://jira.example.com/browse/PROJ-103' },
  ],
};

function createMockResponse(data: any, ok = true) {
  return { ok, json: () => Promise.resolve(data), status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Error' };
}

describe('OperationsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
      if (url.includes('/api/token-usage')) return Promise.resolve(createMockResponse(mockTokenData));
      if (url.includes('/api/agentic-console/branches')) return Promise.resolve(createMockResponse(mockBranchData));
      if (url.includes('/api/agentic-console/pull-requests')) return Promise.resolve(createMockResponse(mockPrData));
      if (url.includes('/api/agentic-console/jira')) return Promise.resolve(createMockResponse(mockJiraData));
      return Promise.resolve(createMockResponse({}));
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    render(<OperationsPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders operations page after data loads', async () => {
    render(<OperationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Token Usage & Cost')).toBeInTheDocument();
    });
  });

  it('renders TOC navigation', async () => {
    render(<OperationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Token Usage')).toBeInTheDocument();
    });

    expect(screen.getByText('Branches')).toBeInTheDocument();
    expect(screen.getByText('Pull Requests')).toBeInTheDocument();
    expect(screen.getByText('Jira')).toBeInTheDocument();
  });

  it('renders dashboard back button', async () => {
    render(<OperationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Token Usage Section', () => {
    it('renders token usage KPI cards', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Token Usage & Cost')).toBeInTheDocument();
      });

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
      expect(screen.getByText(/0.2M/)).toBeInTheDocument();
      expect(screen.getByText('Input')).toBeInTheDocument();
      expect(screen.getByText(/0.0M/)).toBeInTheDocument();
      expect(screen.getByText('Output')).toBeInTheDocument();
      expect(screen.getByText(/\$0.89/)).toBeInTheDocument();
      expect(screen.getByText('Cost')).toBeInTheDocument();
    });

    it('shows session period information', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Period/)).toBeInTheDocument();
      });
    });

    it('renders by-agent chart view by default', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/By Agent/)).toBeInTheDocument();
      });

      const chart = screen.getByTestId('bar-chart');
      expect(chart).toBeInTheDocument();
      const bars = screen.getAllByTestId('bar');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('switches to timeline view on tab click', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Timeline')).toBeInTheDocument();
      });

      act(() => { fireEvent.click(screen.getByText('Timeline')); });

      await waitFor(() => {
        const areaChart = screen.getByTestId('area-chart');
        expect(areaChart).toBeInTheDocument();
      });
    });

    it('switches back to agent view', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Timeline')).toBeInTheDocument();
      });

      act(() => { fireEvent.click(screen.getByText('Timeline')); });

      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });

      act(() => { fireEvent.click(screen.getByText('By Agent')); });

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Branches Section', () => {
    it('renders branch health table', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Branches Health & Status')).toBeInTheDocument();
      });

      expect(screen.getByText('develop')).toBeInTheDocument();
      expect(screen.getAllByText('feature/quality-dashboard').length).toBeGreaterThan(0);
      expect(screen.getByText('feature/health-monitoring')).toBeInTheDocument();
      expect(screen.getByText('feature/conflict-branch')).toBeInTheDocument();
    });

    it('displays branch health badges', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('GREEN').length).toBeGreaterThan(0);
      });

      expect(screen.getByText('AMBER')).toBeInTheDocument();
      expect(screen.getByText('RED')).toBeInTheDocument();
    });

    it('shows branch status and last commit', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('active').length).toBeGreaterThan(0);
      });

      expect(screen.getByText('stale')).toBeInTheDocument();
      expect(screen.getByText('conflict')).toBeInTheDocument();
    });
  });

  describe('Pull Requests Section', () => {
    it('renders PR tracking section', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Pull Request History/)).toBeInTheDocument();
      });

      expect(screen.getByText(/3 total/)).toBeInTheDocument();
    });

    it('displays PR details in table', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getByText('#42')).toBeInTheDocument();
      });

      expect(screen.getAllByText('MERGED').length).toBeGreaterThan(0);
      expect(screen.getAllByText('OPEN').length).toBeGreaterThan(0);
      expect(screen.getByText(/feat: quality dashboard/)).toBeInTheDocument();
      expect(screen.getByText(/fix: health page timeout/)).toBeInTheDocument();
    });

    it('shows CI status icons', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('approved').length).toBeGreaterThan(0);
      });

      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('changes_requested')).toBeInTheDocument();
    });

    it('renders external links for PRs', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        const openLinks = screen.getAllByText('Open');
        expect(openLinks.length).toBeGreaterThan(0);
        openLinks.forEach(link => {
          expect(link.closest('a')).toHaveAttribute('href', expect.stringContaining('github.com'));
          expect(link.closest('a')).toHaveAttribute('target', '_blank');
        });
      });
    });
  });

  describe('Jira Section', () => {
    it('renders Jira issues section with count', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Jira Issues \(5\)/)).toBeInTheDocument();
      });
    });

    it('displays Jira issue details', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getByText('PROJ-101')).toBeInTheDocument();
      });

      expect(screen.getByText('PROJ-102')).toBeInTheDocument();
      expect(screen.getByText('PROJ-103')).toBeInTheDocument();
      expect(screen.getByText(/Setup CI\/CD pipeline/)).toBeInTheDocument();
      expect(screen.getByText(/Implement user auth/)).toBeInTheDocument();
      expect(screen.getByText(/Write API docs/)).toBeInTheDocument();
    });

    it('shows issue types, priorities and assignees', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Task').length).toBeGreaterThan(0);
      });

      expect(screen.getByText('Story')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Highest')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Dev Team')).toBeInTheDocument();
      expect(screen.getByText('Backend Team')).toBeInTheDocument();
      expect(screen.getByText('Tech Writer')).toBeInTheDocument();
    });

    it('renders Jira issue links', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        const issueLink = screen.getByText('PROJ-101');
        expect(issueLink.closest('a')).toHaveAttribute('href', expect.stringContaining('jira.example.com'));
        expect(issueLink.closest('a')).toHaveAttribute('target', '_blank');
      });
    });

    it('uses StatusBadge for Jira issue statuses', async () => {
      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getByText('DONE')).toBeInTheDocument();
      });

      expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
      expect(screen.getByText('TODO')).toBeInTheDocument();
    });
  });

  describe('Empty and Error States', () => {
    it('shows no branch data message', async () => {
      global.fetch = vi.fn((url: string) => {
        if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
        if (url.includes('/api/token-usage')) return Promise.resolve(createMockResponse(mockTokenData));
        if (url.includes('/api/agentic-console/branches')) return Promise.resolve(createMockResponse({ branches: [] }));
        if (url.includes('/api/agentic-console/pull-requests')) return Promise.resolve(createMockResponse(mockPrData));
        if (url.includes('/api/agentic-console/jira')) return Promise.resolve(createMockResponse(mockJiraData));
        return Promise.resolve(createMockResponse({}));
      }) as any;

      render(<OperationsPage />);
      await waitFor(() => {
        expect(screen.getByText(/No branch data/)).toBeInTheDocument();
      });
    });

    it('shows no PR data message', async () => {
      global.fetch = vi.fn((url: string) => {
        if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
        if (url.includes('/api/token-usage')) return Promise.resolve(createMockResponse(mockTokenData));
        if (url.includes('/api/agentic-console/branches')) return Promise.resolve(createMockResponse(mockBranchData));
        if (url.includes('/api/agentic-console/pull-requests')) return Promise.resolve(createMockResponse({ pull_requests: [] }));
        if (url.includes('/api/agentic-console/jira')) return Promise.resolve(createMockResponse(mockJiraData));
        return Promise.resolve(createMockResponse({}));
      }) as any;

      render(<OperationsPage />);
      await waitFor(() => {
        expect(screen.getByText(/No PR data available/)).toBeInTheDocument();
      });
    });

    it('shows jira not configured message', async () => {
      const unconfiguredJira = { issues: [], configured: false };
      global.fetch = vi.fn((url: string) => {
        if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
        if (url.includes('/api/token-usage')) return Promise.resolve(createMockResponse(mockTokenData));
        if (url.includes('/api/agentic-console/branches')) return Promise.resolve(createMockResponse(mockBranchData));
        if (url.includes('/api/agentic-console/pull-requests')) return Promise.resolve(createMockResponse(mockPrData));
        if (url.includes('/api/agentic-console/jira')) return Promise.resolve(createMockResponse(unconfiguredJira));
        return Promise.resolve(createMockResponse({}));
      }) as any;

      render(<OperationsPage />);
      await waitFor(() => {
        expect(screen.getByText('Jira not configured.')).toBeInTheDocument();
      });
    });

    it('shows jira error message', async () => {
      const errorJira = { issues: [], configured: true, error: 'Failed to authenticate with Jira API' };
      global.fetch = vi.fn((url: string) => {
        if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
        if (url.includes('/api/token-usage')) return Promise.resolve(createMockResponse(mockTokenData));
        if (url.includes('/api/agentic-console/branches')) return Promise.resolve(createMockResponse(mockBranchData));
        if (url.includes('/api/agentic-console/pull-requests')) return Promise.resolve(createMockResponse(mockPrData));
        if (url.includes('/api/agentic-console/jira')) return Promise.resolve(createMockResponse(errorJira));
        return Promise.resolve(createMockResponse({}));
      }) as any;

      render(<OperationsPage />);
      await waitFor(() => {
        expect(screen.getByText('Failed to authenticate with Jira API')).toBeInTheDocument();
      });
    });

    it('shows no jira issues found message', async () => {
      const emptyJira = { configured: true, total: 0, issues: [] };
      global.fetch = vi.fn((url: string) => {
        if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
        if (url.includes('/api/token-usage')) return Promise.resolve(createMockResponse(mockTokenData));
        if (url.includes('/api/agentic-console/branches')) return Promise.resolve(createMockResponse(mockBranchData));
        if (url.includes('/api/agentic-console/pull-requests')) return Promise.resolve(createMockResponse(mockPrData));
        if (url.includes('/api/agentic-console/jira')) return Promise.resolve(createMockResponse(emptyJira));
        return Promise.resolve(createMockResponse({}));
      }) as any;

      render(<OperationsPage />);
      await waitFor(() => {
        expect(screen.getByText(/No Jira issues found/)).toBeInTheDocument();
      });
    });

    it('shows no token usage data message', async () => {
      const emptyToken = { sessions: [], summary: { total_sessions: 0, total_tokens_input: 0, total_tokens_output: 0, total_cost: 0 } };
      global.fetch = vi.fn((url: string) => {
        if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
        if (url.includes('/api/token-usage')) return Promise.resolve(createMockResponse(emptyToken));
        if (url.includes('/api/agentic-console/branches')) return Promise.resolve(createMockResponse(mockBranchData));
        if (url.includes('/api/agentic-console/pull-requests')) return Promise.resolve(createMockResponse(mockPrData));
        if (url.includes('/api/agentic-console/jira')) return Promise.resolve(createMockResponse(mockJiraData));
        return Promise.resolve(createMockResponse({}));
      }) as any;

      render(<OperationsPage />);
      await waitFor(() => {
        expect(screen.getByText(/No token usage data yet/)).toBeInTheDocument();
      });
    });

    it('handles fetch errors gracefully', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;

      render(<OperationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });
  });
});

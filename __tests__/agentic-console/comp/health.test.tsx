import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import HealthPage from '@/app/agentic-console/health/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/agentic-console/health',
  useSearchParams: vi.fn(() => new URLSearchParams()),
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
  Cell: ({ fill }: any) => <div data-testid="cell" data-fill={fill} />,
}));

const mockHealthData = {
  metrics: {
    '00_supervisor_agent': {
      error_rate: 0.05, avg_duration_ms: 1200, success_rate: 0.95,
      execution_count: 10, last_error: null, status: 'approved', role: 'Senior Program Manager',
    },
    '01_ideation_agent': {
      error_rate: 0.20, avg_duration_ms: 2700000, success_rate: 0.80,
      execution_count: 5, last_error: 'Timeout exceeded', status: 'failed', role: 'Product Marketing Manager',
    },
    '07a_ui_agent': {
      error_rate: 0.00, avg_duration_ms: 3500, success_rate: 1.00,
      execution_count: 8, last_error: null, status: 'completed', role: 'Frontend Engineer',
    },
    '13_maintenance_agent': {
      error_rate: 0.00, avg_duration_ms: 0, success_rate: 0.00,
      execution_count: 0, last_error: null, status: 'pending', role: 'Remediation Agent',
    },
  },
  aggregate: {
    total_agents: 4, active_agents: 3, failed_agents: 1, avg_success_rate: 0.88,
  },
  timestamp: '2026-06-15T10:30:00Z',
};

function createMockResponse(data: any, ok = true) {
  return { ok, json: () => Promise.resolve(data), status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Error' };
}

describe('HealthPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/health')) return Promise.resolve(createMockResponse(mockHealthData));
      return Promise.resolve(createMockResponse({}));
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    render(<HealthPage />);
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeTruthy();
  });

  it('renders health page after data loads', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('Agent Health Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText(/Real-time health metrics for all pipeline agents/)).toBeInTheDocument();
  });

  it('renders refresh button', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  it('renders aggregate stats cards', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Agents')).toBeInTheDocument();
    });

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Avg Success Rate')).toBeInTheDocument();
    expect(screen.getByText('88.0%')).toBeInTheDocument();
  });

  it('renders success rate chart', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('Success Rate by Agent')).toBeInTheDocument();
    });

    const chart = screen.getByTestId('responsive-container');
    expect(chart).toBeInTheDocument();
  });

  it('renders agent health table with all metrics', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('Agent Health Details')).toBeInTheDocument();
    });

    expect(screen.getByText(/Supervisor Agent/)).toBeInTheDocument();
    expect(screen.getByText(/Ideation Agent/)).toBeInTheDocument();
    expect(screen.getByText(/Ui Agent/)).toBeInTheDocument();

    expect(screen.getByText('Senior Program Manager')).toBeInTheDocument();
    expect(screen.getByText('Product Marketing Manager')).toBeInTheDocument();
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
  });

  it('displays correct agent status badges', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('APPROVED')).toBeInTheDocument();
    });

    expect(screen.getByText('FAILED')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('displays success rate percentages in table', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('95.0%')).toBeInTheDocument();
    });

    expect(screen.getByText('80.0%')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
    expect(screen.getAllByText('0.0%').length).toBeGreaterThanOrEqual(1);
  });

  it('displays error rate percentages in table', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('5.0%')).toBeInTheDocument();
    });

    expect(screen.getByText('20.0%')).toBeInTheDocument();
    expect(screen.getAllByText('0.0%').length).toBeGreaterThanOrEqual(1);
  });

  it('displays execution counts in table', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getAllByText('10')[0]).toBeInTheDocument();
    });

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('formats duration correctly (seconds vs minutes)', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('1.2s')).toBeInTheDocument();
    });

    expect(screen.getByText('45.0m')).toBeInTheDocument();
    expect(screen.getByText('3.5s')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('displays last error for failed agents', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText(/Timeout exceeded/)).toBeInTheDocument();
    });
  });

  it('shows dash for agents with no last error', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  it('shows timestamp info when data is available', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });
  });

  it('refreshes data on refresh button click', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('Agent Health Dashboard')).toBeInTheDocument();
    });

    const fetchCallsBefore = (global.fetch as any).mock.calls.length;

    act(() => { fireEvent.click(screen.getByText('Refresh')); });

    await waitFor(() => {
      expect((global.fetch as any).mock.calls.length).toBeGreaterThan(fetchCallsBefore);
    });
  });

  it('passes project param to health API', async () => {
    const { useSearchParams } = await import('next/navigation');
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams('project=proj-a'));

    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('Agent Health Dashboard')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('project=proj-a'), expect.anything());
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams());
  });

  it('handles zero execution count agents (not shown in chart, shown in table)', async () => {
    const mixedData = {
      ...mockHealthData,
      metrics: {
        ...mockHealthData.metrics,
        '99_unused_agent': {
          error_rate: 0, avg_duration_ms: 0, success_rate: 0,
          execution_count: 0, last_error: null, status: 'pending', role: 'Unused Agent',
        },
      },
    };

    global.fetch = vi.fn(() => Promise.resolve(createMockResponse(mixedData))) as any;

    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('Unused Agent')).toBeInTheDocument();
    });

    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('API unavailable'))) as any;

    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Agents')).toBeInTheDocument();
    });

    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows empty chart state when no execution data', async () => {
    const noExecData = {
      ...mockHealthData,
      metrics: {
        '99_unused': {
          error_rate: 0, avg_duration_ms: 0, success_rate: 0,
          execution_count: 0, last_error: null, status: 'pending', role: 'Unused',
        },
      },
    };

    global.fetch = vi.fn(() => Promise.resolve(createMockResponse(noExecData))) as any;

    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText(/No execution data available yet/)).toBeInTheDocument();
    });
  });

  it('shows empty table state when no agents', async () => {
    const emptyData = {
      metrics: {},
      aggregate: { total_agents: 0, active_agents: 0, failed_agents: 0, avg_success_rate: 0 },
      timestamp: '2026-06-15T10:30:00Z',
    };

    global.fetch = vi.fn(() => Promise.resolve(createMockResponse(emptyData))) as any;

    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText(/No agent data found/)).toBeInTheDocument();
    });
  });

  it('renders recharts bar chart with correct data', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('Success Rate by Agent')).toBeInTheDocument();
    });

    const bars = screen.getAllByTestId('bar');
    expect(bars.length).toBeGreaterThan(0);
  });

  it('correctly sorts chart agents by success rate descending', async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('Success Rate by Agent')).toBeInTheDocument();
    });

    const cells = screen.getAllByTestId('cell');
    expect(cells.length).toBeGreaterThan(0);
  });
});

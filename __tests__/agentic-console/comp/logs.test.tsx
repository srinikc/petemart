import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import LogsPage from '@/app/agentic-console/logs/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/agentic-console/logs',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

function createMockResponse(data: any, ok = true) {
  return { ok, json: () => Promise.resolve(data), status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Error' };
}

const mockLogsData = {
  logs: [
    { type: 'agent_started', agent_id: '03_architect_agent', timestamp: '2026-06-15T10:00:00Z', llm: 'deepseek-v4', label: 'Analyzing requirements' },
    { type: 'agent_completed', agent_id: '03_architect_agent', timestamp: '2026-06-15T10:05:00Z', duration: 300000, artifact_count: 3 },
    { type: 'agent_llm_error', agent_id: '07a_ui_agent', timestamp: '2026-06-15T11:00:00Z', error: 'Token limit exceeded' },
    { type: 'step_label', agent_id: '07a_ui_agent', timestamp: '2026-06-15T11:01:00Z', label: 'Building component library' },
  ],
};

const mockTokenData = {
  header: 'session_id,agent,model,tokens_input,tokens_output,cost',
  rows: [
    ['s1', '03_architect_agent', 'deepseek-v4', '1200', '800', '$0.002'],
    ['s2', '07a_ui_agent', 'deepseek-v4', '3400', '2100', '$0.005'],
  ],
};

const mockStateData = {
  stateMatrix: {
    agent_states: {
      '00_supervisor_agent': {},
      '01_ideation_agent': {},
      '02_requirement_agent': {},
      '03_architect_agent': {},
      '04_prototype_agent': {},
    },
  },
};

describe('LogsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/logs')) return Promise.resolve(createMockResponse(mockLogsData));
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
      return Promise.resolve(createMockResponse({}));
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all 5 log tabs', async () => {
    render(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText('Pipeline Events')).toBeInTheDocument();
      expect(screen.getByText('Execution Traces')).toBeInTheDocument();
      expect(screen.getByText('Token Usage')).toBeInTheDocument();
      expect(screen.getByText('Agent Run Logs')).toBeInTheDocument();
      expect(screen.getByText('Server Logs')).toBeInTheDocument();
    });
  });

  it('renders auto-refresh toggle checkbox', async () => {
    render(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText('Auto-refresh')).toBeInTheDocument();
    });
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('renders pipeline events logs with entries', async () => {
    render(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText('4 events loaded (newest first)')).toBeInTheDocument();
    });
    expect(screen.getByText(/agent started/)).toBeInTheDocument();
    expect(screen.getByText(/agent completed/)).toBeInTheDocument();
    expect(screen.getByText(/agent llm error/)).toBeInTheDocument();
  });

  it('displays agent filter dropdown when Agent Run Logs tab is selected', async () => {
    render(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText('Pipeline Events')).toBeInTheDocument();
    });
    act(() => { fireEvent.click(screen.getByText('Agent Run Logs')); });
    await waitFor(() => {
      expect(screen.getByText('Agent:')).toBeInTheDocument();
    });
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows empty state for server logs tab', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/logs')) return Promise.resolve(createMockResponse({ files: [] }));
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
      return Promise.resolve(createMockResponse({}));
    }) as any;
    render(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText('Server Logs')).toBeInTheDocument();
    });
    act(() => { fireEvent.click(screen.getByText('Server Logs')); });
    await waitFor(() => {
      expect(screen.getByText('No server logs yet.')).toBeInTheDocument();
    });
  });

  it('displays error state when fetch fails', async () => {
    global.fetch = vi.fn(() => Promise.resolve(createMockResponse({}, false))) as any;
    render(<LogsPage />);
    await waitFor(() => {
      expect(screen.getAllByText(/HTTP 500/).length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when no events exist', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/logs')) return Promise.resolve(createMockResponse({ logs: [] }));
      if (url.includes('/api/agentic-console/state')) return Promise.resolve(createMockResponse(mockStateData));
      return Promise.resolve(createMockResponse({}));
    }) as any;
    render(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText('No pipeline events yet.')).toBeInTheDocument();
    });
  });

  it('shows refresh button', async () => {
    render(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });
});

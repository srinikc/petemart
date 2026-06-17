import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import McpRegistryPage from '@/app/agentic-console/mcp/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/agentic-console/mcp',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

function createMockResponse(data: any, ok = true) {
  return { ok, json: () => Promise.resolve(data), status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Error' };
}

const mockServers = [
  {
    id: 'filesystem', name: 'Local Filesystem', type: 'local', status: 'available',
    tools: [
      { name: 'read_file', description: 'Read file contents from disk' },
      { name: 'write_file', description: 'Write content to a file' },
      { name: 'search_files', description: 'Search for files by pattern' },
    ],
    used_by: ['01_ideation_agent', '02_requirement_agent', '03_architect_agent'],
    docs_url: 'https://docs.example.com/filesystem',
  },
  {
    id: 'github', name: 'GitHub API', type: 'remote', status: 'configured',
    tools: [
      { name: 'create_pr', description: 'Create a pull request' },
      { name: 'list_issues', description: 'List repository issues' },
    ],
    used_by: ['07a_ui_agent', '07b_api_agent'],
  },
  {
    id: 'web-search', name: 'Web Search', type: 'built-in', status: 'unavailable',
    tools: [
      { name: 'web_search', description: 'Search the web' },
    ],
    used_by: ['all'],
  },
];

const mockAgentMapping = {
  '01_ideation_agent': ['filesystem', 'web-search'],
  '02_requirement_agent': ['filesystem'],
  '03_architect_agent': ['filesystem'],
  '07a_ui_agent': ['github'],
  '07b_api_agent': ['github', 'web-search'],
};

describe('McpRegistryPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/mcp-servers')) return Promise.resolve(createMockResponse({ servers: mockServers, agentToMcpMapping: mockAgentMapping }));
      return Promise.resolve(createMockResponse({}));
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders MCP server list with correct count', async () => {
    render(<McpRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText(/3 MCP servers/)).toBeInTheDocument();
    });
    expect(screen.getByText(/6 tools/)).toBeInTheDocument();
    expect(screen.getByText(/5 agents mapped/)).toBeInTheDocument();
  });

  it('renders status badges for each server (connected/disconnected/error)', async () => {
    render(<McpRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('available')).toBeInTheDocument();
      expect(screen.getByText('configured')).toBeInTheDocument();
      expect(screen.getByText('unavailable')).toBeInTheDocument();
    });
  });

  it('displays tool counts per server', async () => {
    render(<McpRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('3 tools')).toBeInTheDocument();
      expect(screen.getByText('2 tools')).toBeInTheDocument();
      expect(screen.getByText('1 tools')).toBeInTheDocument();
    });
  });

  it('renders agent mapping table with correct data', async () => {
    render(<McpRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Agent-to-MCP Mapping')).toBeInTheDocument();
    });
    // These agent IDs appear in server cards AND the mapping table, so use getAllByText
    expect(screen.getAllByText('01_ideation_agent').length).toBeGreaterThan(0);
    expect(screen.getAllByText('07a_ui_agent').length).toBeGreaterThan(0);
    expect(screen.getAllByText('07b_api_agent').length).toBeGreaterThan(0);
  });

  it('shows empty state when no servers returned', async () => {
    global.fetch = vi.fn(() => Promise.resolve(createMockResponse({ servers: [], agentToMcpMapping: {} }))) as any;
    render(<McpRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText(/0 MCP servers/)).toBeInTheDocument();
    });
  });
});

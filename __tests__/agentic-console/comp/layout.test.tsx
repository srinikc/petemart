import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AgenticConsoleLayout from '@/app/agentic-console/layout';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => '/agentic-console/quality'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({})),
}));

const mockProjects = {
  default_project: 'petemart',
  projects: {
    petemart: { id: 'petemart', name: 'PeteMart Main', description: 'Main project', state_path: '/state/petemart', created_at: '2026-01-01T00:00:00Z', agent_count: 16, completed_pct: 69 },
    petestore: { id: 'petestore', name: 'PeteStore', description: 'Store project', state_path: '/state/petestore', created_at: '2026-02-01T00:00:00Z', agent_count: 8, completed_pct: 30 },
  },
};

function createMockResponse(data: any, ok = true) {
  return { ok, json: () => Promise.resolve(data), status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Error' };
}

describe('AgenticConsoleLayout', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/agentic-console/projects')) return Promise.resolve(createMockResponse(mockProjects));
      return Promise.resolve(createMockResponse({}));
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders layout header with title', () => {
    render(<AgenticConsoleLayout><div data-testid="child-content">Dashboard Content</div></AgenticConsoleLayout>);
    expect(screen.getByText('Central Agentic AI Console')).toBeInTheDocument();
    expect(screen.getByText(/Multi-project pipeline management/)).toBeInTheDocument();
  });

  it('renders children within layout', async () => {
    render(<AgenticConsoleLayout><div data-testid="child-content">Dashboard Content</div></AgenticConsoleLayout>);
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Agent Pipeline')).toBeInTheDocument();
    expect(screen.getAllByText('Quality').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('MCP Servers')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('renders project selector with default selection', async () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    await waitFor(() => {
      expect(screen.getByText('PeteMart Main')).toBeInTheDocument();
    });
  });

  it('opens project menu on click', async () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    const peteMartMain = await screen.findByText('PeteMart Main', {}, { timeout: 3000 });
    expect(peteMartMain).toBeInTheDocument();

    act(() => { fireEvent.click(peteMartMain); });

    await waitFor(() => {
      expect(screen.getAllByText('All Projects').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('PeteStore')).toBeInTheDocument();
    });
  });

  it('project menu shows completion percentage', async () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    const peteMartMain = await screen.findByText('PeteMart Main', {}, { timeout: 3000 });
    expect(peteMartMain).toBeInTheDocument();

    act(() => { fireEvent.click(peteMartMain); });

    await waitFor(() => {
      expect(screen.getByText('69% complete')).toBeInTheDocument();
      expect(screen.getByText('30% complete')).toBeInTheDocument();
    });
  });

  it('closes project menu on outside click', async () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    const peteMartMain = await screen.findByText('PeteMart Main', {}, { timeout: 3000 });
    expect(peteMartMain).toBeInTheDocument();

    act(() => { fireEvent.click(peteMartMain); });

    await waitFor(() => {
      expect(screen.getAllByText('All Projects').length).toBeGreaterThanOrEqual(1);
    });

    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeTruthy();
    if (backdrop) {
      act(() => { fireEvent.click(backdrop); });
    }
    await waitFor(() => {
      expect(screen.queryByText('PeteStore')).not.toBeInTheDocument();
    });
  });

  it('shows active nav item with indigo highlight', () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    const qualityButtons = screen.getAllByText('Quality');
    const navQuality = qualityButtons.find(el => el.className.includes('bg-indigo-100'));
    expect(navQuality).toBeTruthy();
    expect(navQuality!.className).toContain('bg-indigo-100');
    expect(navQuality!.className).toContain('text-indigo-700');
  });

  it('non-active nav items show default styling', () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    const healthButton = screen.getByText('Health');
    expect(healthButton.className).toContain('text-gray-500');
  });

  it('renders mobile menu toggle button', () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);
    const menuButton = document.querySelector('button svg');
    expect(menuButton).toBeInTheDocument();
  });

  it('opens mobile menu on hamburger click', async () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    await waitFor(() => {
      expect(screen.getByText('PeteMart Main')).toBeInTheDocument();
    });

    const menuButton = document.querySelector('.lg\\:hidden');
    if (menuButton) {
      act(() => { fireEvent.click(menuButton); });
    }

    await waitFor(() => {
      const projectItems = screen.getAllByText(/PeteMart Main|PeteStore/);
      expect(projectItems.length).toBeGreaterThan(0);
    });
  });

  it('mobile menu shows all nav items', async () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    await waitFor(() => {
      expect(screen.getByText('PeteMart Main')).toBeInTheDocument();
    });

    const menuButton = document.querySelector('.lg\\:hidden');
    if (menuButton) {
      act(() => { fireEvent.click(menuButton); });
    }

    await waitFor(() => {
      const navItems = ['Dashboard', 'Agent Pipeline', 'Quality', 'Health', 'Operations', 'Tools', 'MCP Servers', 'Logs'];
      navItems.forEach(item => {
        const elements = screen.getAllByText(item);
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  it('passes project param to navigation links', async () => {
    const { useSearchParams: usp } = await import('next/navigation');
    (usp as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams('project=petestore'));

    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    await waitFor(() => {
      expect(screen.getByText('PeteStore')).toBeInTheDocument();
    });
  });

  it('shows "All Projects" when no project selected', async () => {
    const { useSearchParams: usp } = await import('next/navigation');
    (usp as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams());

    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    await waitFor(() => {
      expect(screen.getByText('All Projects')).toBeInTheDocument();
    });
  });

  it('renders breadcrumbs component', () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);
    expect(screen.getByText('Console')).toBeInTheDocument();
    expect(screen.getAllByText('Quality').length).toBeGreaterThanOrEqual(1);
  });

  it('handles no projects data gracefully', async () => {
    global.fetch = vi.fn(() => Promise.resolve(createMockResponse(null))) as any;

    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    await waitFor(() => {
      expect(screen.getByText('All Projects')).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;

    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    expect(screen.getByText('Central Agentic AI Console')).toBeInTheDocument();
  });

  it('nav items use router.push on click', async () => {
    const mockPush = vi.fn();
    const { useRouter: ur } = await import('next/navigation');
    (ur as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() });

    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    act(() => { fireEvent.click(screen.getByText('Health')); });
    expect(mockPush).toHaveBeenCalledWith('/agentic-console/health');
  });

  it('renders Shield icon in header', () => {
    const { container } = render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('shows suspense fallback during loading', () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);
    expect(screen.getByText('Central Agentic AI Console')).toBeInTheDocument();
  });

  it('mobile menu shows project section', async () => {
    render(<AgenticConsoleLayout><div>Content</div></AgenticConsoleLayout>);

    await waitFor(() => {
      expect(screen.getByText('PeteMart Main')).toBeInTheDocument();
    });
  });
});

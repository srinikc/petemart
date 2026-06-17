import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Breadcrumbs from '@/app/agentic-console/breadcrumbs';

let mockPathname = '/agentic-console/quality';
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
  useParams: () => ({}),
}));

describe('Breadcrumbs', () => {
  afterEach(() => {
    mockPathname = '/agentic-console/quality';
    mockSearchParams = new URLSearchParams();
  });

  it('returns null on root agentic-console path', () => {
    mockPathname = '/agentic-console';
    const { container } = render(<Breadcrumbs />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null on exact path match', () => {
    mockPathname = '/agentic-console';
    const { container } = render(<Breadcrumbs />);
    expect(container.firstChild).toBeNull();
  });

  it('renders breadcrumbs for quality sub-page', () => {
    mockPathname = '/agentic-console/quality';
    render(<Breadcrumbs />);
    expect(screen.getByText('Console')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
  });

  it('renders breadcrumbs for health sub-page', () => {
    mockPathname = '/agentic-console/health';
    render(<Breadcrumbs />);
    expect(screen.getByText('Console')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  it('renders breadcrumbs for operations sub-page', () => {
    mockPathname = '/agentic-console/operations';
    render(<Breadcrumbs />);
    expect(screen.getByText('Console')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
  });

  it('renders breadcrumbs for agents pipeline page', () => {
    mockPathname = '/agentic-console/agents';
    render(<Breadcrumbs />);
    expect(screen.getByText('Console')).toBeInTheDocument();
    expect(screen.getByText('Agent Pipeline')).toBeInTheDocument();
  });

  it('renders breadcrumbs for tools page', () => {
    mockPathname = '/agentic-console/tools';
    render(<Breadcrumbs />);
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('renders breadcrumbs for mcp servers page', () => {
    mockPathname = '/agentic-console/mcp';
    render(<Breadcrumbs />);
    expect(screen.getByText('MCP Servers')).toBeInTheDocument();
  });

  it('last crumb is a span (not a link)', () => {
    mockPathname = '/agentic-console/quality';
    render(<Breadcrumbs />);
    const lastCrumb = screen.getByText('Quality');
    expect(lastCrumb.tagName).toBe('SPAN');
  });

  it('non-last crumbs are links', () => {
    mockPathname = '/agentic-console/quality';
    render(<Breadcrumbs />);
    const consoleLink = screen.getByText('Console');
    expect(consoleLink.tagName).toBe('A');
    expect(consoleLink).toHaveAttribute('href', '/agentic-console');
  });

  it('correct href for nested sub-pages', () => {
    mockPathname = '/agentic-console/quality';
    render(<Breadcrumbs />);
    const consoleLink = screen.getByText('Console');
    expect(consoleLink).toHaveAttribute('href', '/agentic-console');
  });

  it('includes project param in links when present', () => {
    mockPathname = '/agentic-console/quality';
    mockSearchParams = new URLSearchParams('project=test-proj');
    render(<Breadcrumbs />);
    const consoleLink = screen.getByText('Console');
    expect(consoleLink).toHaveAttribute('href', '/agentic-console?project=test-proj');
  });

  it('renders nav with aria-label', () => {
    mockPathname = '/agentic-console/health';
    render(<Breadcrumbs />);
    const nav = screen.getByLabelText('Breadcrumb');
    expect(nav).toBeInTheDocument();
  });

  it('renders chevron separators between crumbs', () => {
    mockPathname = '/agentic-console/quality';
    const { container } = render(<Breadcrumbs />);
    const chevrons = container.querySelectorAll('svg');
    expect(chevrons.length).toBeGreaterThan(0);
  });

  it('handles unknown segments with label generation', () => {
    mockPathname = '/agentic-console/unknown-page';
    render(<Breadcrumbs />);
    expect(screen.getByText('Unknown Page')).toBeInTheDocument();
  });

  it('handles deep nesting paths', () => {
    mockPathname = '/agentic-console/agents/detail/00_supervisor';
    render(<Breadcrumbs />);
    expect(screen.getByText('Console')).toBeInTheDocument();
    expect(screen.getByText('Agent Pipeline')).toBeInTheDocument();
  });

  it('applies truncation classes to links and spans', () => {
    mockPathname = '/agentic-console/quality';
    render(<Breadcrumbs />);
    const consoleLink = screen.getByText('Console');
    expect(consoleLink.className).toContain('truncate');
    const qualitySpan = screen.getByText('Quality');
    expect(qualitySpan.className).toContain('truncate');
  });
});

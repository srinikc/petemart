import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import PipelineGraph, { calculateLayout } from '@/app/agentic-console/pipeline-graph';
import { PHASE_ORDER, PHASE_LABELS, PHASE_COLORS } from '@/app/agentic-console/shared';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/agentic-console',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const mockAgentStates: Record<string, any> = {
  '00_supervisor_agent': { agent_id: '00_supervisor_agent', phase: 'system', pool: 'async_pool', status: 'approved', role: 'Senior Program Manager', execution_count: 12, dependencies: [], requires_human_approval: false, approved: true, compliance_checklist: [], artifacts_emitted: [], notes: '', last_activity_timestamp: null, last_error: null, expert_reviewer: null },
  '01_ideation_agent': { agent_id: '01_ideation_agent', phase: 'phase_one', pool: 'async_pool', status: 'completed', role: 'Product Marketing Manager', execution_count: 1, dependencies: [], requires_human_approval: false, approved: true, compliance_checklist: [{ id: 'c1', check: 'A', type: 'artifact', required: true, passed: true }], artifacts_emitted: ['r.md'], notes: '', last_activity_timestamp: null, last_error: null, expert_reviewer: null },
  '02_requirement_agent': { agent_id: '02_requirement_agent', phase: 'phase_one', pool: 'async_pool', status: 'awaiting_approval', role: 'Product Owner', execution_count: 2, dependencies: ['01_ideation_agent'], requires_human_approval: true, approved: false, compliance_checklist: [{ id: 'c2', check: 'B', type: 'test', required: true, passed: false }], artifacts_emitted: [], notes: '', last_activity_timestamp: null, last_error: null, expert_reviewer: null },
  '03_architect_agent': { agent_id: '03_architect_agent', phase: 'phase_one', pool: 'async_pool', status: 'pending', role: 'Enterprise Solution Architect', execution_count: 0, dependencies: ['02_requirement_agent'], requires_human_approval: false, approved: false, compliance_checklist: [], artifacts_emitted: [], notes: '', last_activity_timestamp: null, last_error: null, expert_reviewer: null },
  '07a_ui_agent': { agent_id: '07a_ui_agent', phase: 'phase_three', pool: 'sync_pool', status: 'active', role: 'Frontend Engineer', execution_count: 3, dependencies: ['03_architect_agent'], requires_human_approval: false, approved: false, compliance_checklist: [], artifacts_emitted: [], notes: '', last_activity_timestamp: null, last_error: null, expert_reviewer: null },
};

describe('PipelineGraph', () => {
  const onAgentClick = vi.fn();

  beforeEach(() => {
    onAgentClick.mockClear();
  });

  it('renders nodes with agent short names', () => {
    render(<PipelineGraph agentStates={mockAgentStates} onAgentClick={onAgentClick} />);
    expect(screen.getByText('00')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('07a')).toBeInTheDocument();
  });

  it('renders SVG dependency edges', () => {
    const { container } = render(<PipelineGraph agentStates={mockAgentStates} onAgentClick={onAgentClick} />);
    const edges = container.querySelectorAll('path');
    expect(edges.length).toBeGreaterThan(0);
  });

  it('renders phase column headers with correct labels', () => {
    render(<PipelineGraph agentStates={mockAgentStates} onAgentClick={onAgentClick} />);
    expect(screen.getAllByText(/Front-Office/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Execution/).length).toBeGreaterThan(0);
  });

  it('calls onAgentClick when a node is clicked', () => {
    render(<PipelineGraph agentStates={mockAgentStates} onAgentClick={onAgentClick} />);
    act(() => { fireEvent.click(screen.getByText('01')); });
    expect(onAgentClick).toHaveBeenCalledWith('01_ideation_agent');
  });

  it('handles empty graph state gracefully', () => {
    const { container } = render(<PipelineGraph agentStates={{}} onAgentClick={onAgentClick} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(screen.queryByText('00')).toBeNull();
  });

  it('calculateLayout returns correct structure', () => {
    const layout = calculateLayout(mockAgentStates);
    expect(layout.positions).toBeDefined();
    expect(layout.edges).toBeDefined();
    expect(layout.phaseCols).toBeDefined();
    expect(layout.positions['01_ideation_agent']).toBeDefined();
    expect(layout.edges.length).toBeGreaterThan(0);
  });
});

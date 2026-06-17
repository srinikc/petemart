import { describe, it, expect } from 'vitest';
import { calculateLayout } from '@/app/agentic-console/pipeline-graph';
import type { AgentState } from '@/app/agentic-console/shared';

function makeAgent(overrides: Partial<AgentState> = {}): AgentState {
  return {
    agent_id: 'test_agent',
    phase: 'phase_one',
    pool: 'async',
    status: 'pending',
    dependencies: [],
    requires_human_approval: false,
    approved: false,
    role: 'Test Agent',
    execution_count: 0,
    compliance_checklist: [],
    artifacts_emitted: [],
    notes: '',
    last_activity_timestamp: null,
    last_error: null,
    expert_reviewer: null,
    ...overrides,
  };
}

describe('calculateLayout()', () => {
  it('returns empty positions and edges for empty agents', () => {
    const result = calculateLayout({});
    // Supervisor position is always added even with empty input
    expect(Object.keys(result.positions)).toEqual(['00_supervisor_agent']);
    expect(result.positions['00_supervisor_agent']).toEqual({ x: 0, y: -200 });
    expect(result.edges).toEqual([]);
    expect(result.phaseCols).toEqual([]);
  });

  it('returns layout for a single agent', () => {
    const agents: Record<string, AgentState> = {
      '01_ideation_agent': makeAgent({ agent_id: '01_ideation_agent', phase: 'phase_one', role: 'Ideation Agent' }),
    };
    const result = calculateLayout(agents);
    const pos = result.positions['01_ideation_agent'];
    expect(pos).toBeDefined();
    expect(typeof pos.x).toBe('number');
    expect(typeof pos.y).toBe('number');
  });

  it('places agents in correct phase columns', () => {
    const agents: Record<string, AgentState> = {
      '01_ideation_agent': makeAgent({ agent_id: '01_ideation_agent', phase: 'phase_one', role: 'Ideation' }),
      '02_requirement_agent': makeAgent({ agent_id: '02_requirement_agent', phase: 'phase_one', role: 'Requirement' }),
      '03_architect_agent': makeAgent({ agent_id: '03_architect_agent', phase: 'phase_two', role: 'Architect' }),
    };
    const result = calculateLayout(agents);
    expect(result.phaseCols.length).toBe(2);
    const phaseOneCol = result.phaseCols.find(c => c.phase === 'phase_one');
    const phaseTwoCol = result.phaseCols.find(c => c.phase === 'phase_two');
    expect(phaseOneCol).toBeDefined();
    expect(phaseTwoCol).toBeDefined();
    expect(phaseOneCol!.agents.length).toBe(2);
    expect(phaseTwoCol!.agents.length).toBe(1);
  });

  it('returns phases in correct order', () => {
    const agents: Record<string, AgentState> = {
      '03_architect_agent': makeAgent({ agent_id: '03_architect_agent', phase: 'phase_two', role: 'Architect' }),
      '01_ideation_agent': makeAgent({ agent_id: '01_ideation_agent', phase: 'phase_one', role: 'Ideation' }),
      '08_qa_agent': makeAgent({ agent_id: '08_qa_agent', phase: 'phase_four', role: 'QA' }),
    };
    const result = calculateLayout(agents);
    const phaseOrder = result.phaseCols.map(c => c.phase);
    expect(phaseOrder).toEqual(['phase_one', 'phase_two', 'phase_four']);
  });

  it('positions agents within same phase at different y values', () => {
    const agents: Record<string, AgentState> = {
      '01_ideation_agent': makeAgent({ agent_id: '01_ideation_agent', phase: 'phase_one', role: 'A' }),
      '02_requirement_agent': makeAgent({ agent_id: '02_requirement_agent', phase: 'phase_one', role: 'B' }),
    };
    const result = calculateLayout(agents);
    const posA = result.positions['01_ideation_agent'];
    const posB = result.positions['02_requirement_agent'];
    expect(posA.y).not.toBe(posB.y);
  });

  it('positions supervisor above first phase column', () => {
    const agents: Record<string, AgentState> = {
      '00_supervisor_agent': makeAgent({ agent_id: '00_supervisor_agent', phase: 'system', role: 'Supervisor' }),
      '01_ideation_agent': makeAgent({ agent_id: '01_ideation_agent', phase: 'phase_one', role: 'Ideation' }),
    };
    const result = calculateLayout(agents);
    const supPos = result.positions['00_supervisor_agent'];
    const agentPos = result.positions['01_ideation_agent'];
    expect(supPos).toBeDefined();
    expect(supPos.y).toBeLessThan(agentPos.y);
  });

  it('generates dependency edges between agents', () => {
    const agents: Record<string, AgentState> = {
      '01_ideation_agent': makeAgent({ agent_id: '01_ideation_agent', phase: 'phase_one', role: 'Ideation' }),
      '02_requirement_agent': makeAgent({
        agent_id: '02_requirement_agent', phase: 'phase_one', role: 'Requirement',
        dependencies: ['01_ideation_agent'],
      }),
    };
    const result = calculateLayout(agents);
    expect(result.edges.length).toBe(1);
    expect(result.edges[0].from).toBe('01_ideation_agent');
    expect(result.edges[0].to).toBe('02_requirement_agent');
    expect(result.edges[0].path).toContain('M');
    expect(result.edges[0].path).toContain('C');
  });

  it('generates cross-phase dependency edges', () => {
    const agents: Record<string, AgentState> = {
      '03_architect_agent': makeAgent({ agent_id: '03_architect_agent', phase: 'phase_two', role: 'Architect' }),
      '04_prototype_agent': makeAgent({
        agent_id: '04_prototype_agent', phase: 'phase_two', role: 'Prototype',
        dependencies: ['03_architect_agent'],
      }),
    };
    const result = calculateLayout(agents);
    expect(result.edges.length).toBe(1);
    expect(result.edges[0].from).toBe('03_architect_agent');
    expect(result.edges[0].to).toBe('04_prototype_agent');
  });

  it('does not create edges for supervisor dependencies', () => {
    const agents: Record<string, AgentState> = {
      '00_supervisor_agent': makeAgent({ agent_id: '00_supervisor_agent', phase: 'system', role: 'Supervisor', dependencies: ['01_ideation_agent'] }),
      '01_ideation_agent': makeAgent({ agent_id: '01_ideation_agent', phase: 'phase_one', role: 'Ideation' }),
    };
    const result = calculateLayout(agents);
    const supervisorEdges = result.edges.filter(e => e.from === '00_supervisor_agent');
    expect(supervisorEdges.length).toBe(0);
  });

  it('skips edges for missing dependency targets', () => {
    const agents: Record<string, AgentState> = {
      '02_requirement_agent': makeAgent({
        agent_id: '02_requirement_agent', phase: 'phase_one', role: 'Requirement',
        dependencies: ['nonexistent_agent'],
      }),
    };
    const result = calculateLayout(agents);
    expect(result.edges.length).toBe(0);
  });

  it('skips phases with no agents', () => {
    const agents: Record<string, AgentState> = {
      '01_ideation_agent': makeAgent({ agent_id: '01_ideation_agent', phase: 'phase_one', role: 'Ideation' }),
      '08_qa_agent': makeAgent({ agent_id: '08_qa_agent', phase: 'phase_four', role: 'QA' }),
    };
    const result = calculateLayout(agents);
    const phaseNames = result.phaseCols.map(c => c.phase);
    expect(phaseNames).toEqual(['phase_one', 'phase_four']);
    expect(phaseNames).not.toContain('phase_two');
    expect(phaseNames).not.toContain('phase_three');
    expect(phaseNames).not.toContain('phase_five');
  });

  it('returns node dimension constants', () => {
    const agents: Record<string, AgentState> = {
      '01_ideation_agent': makeAgent({ agent_id: '01_ideation_agent', phase: 'phase_one', role: 'Ideation' }),
    };
    const result = calculateLayout(agents);
    expect(result.NODE_W).toBe(200);
    expect(result.NODE_H).toBe(130);
    expect(result.ROW_GAP).toBe(100);
    expect(result.COL_GAP).toBe(220);
  });

  it('handles multiple agents with complex dependencies across phases', () => {
    const agents: Record<string, AgentState> = {
      '01_ideation_agent': makeAgent({ agent_id: '01_ideation_agent', phase: 'phase_one', role: 'Ideation' }),
      '02_requirement_agent': makeAgent({
        agent_id: '02_requirement_agent', phase: 'phase_one', role: 'Requirement',
        dependencies: ['01_ideation_agent'],
      }),
      '03_architect_agent': makeAgent({
        agent_id: '03_architect_agent', phase: 'phase_two', role: 'Architect',
        dependencies: ['02_requirement_agent'],
      }),
      '04_prototype_agent': makeAgent({
        agent_id: '04_prototype_agent', phase: 'phase_two', role: 'Prototype',
        dependencies: ['03_architect_agent'],
      }),
      '07a_ui_agent': makeAgent({
        agent_id: '07a_ui_agent', phase: 'phase_three', role: 'UI Agent',
        dependencies: ['03_architect_agent', '04_prototype_agent'],
      }),
    };
    const result = calculateLayout(agents);
    expect(result.positions['01_ideation_agent']).toBeDefined();
    expect(result.positions['02_requirement_agent']).toBeDefined();
    expect(result.positions['03_architect_agent']).toBeDefined();
    expect(result.positions['04_prototype_agent']).toBeDefined();
    expect(result.positions['07a_ui_agent']).toBeDefined();
    // Edges: 01→02, 02→03, 03→04, 03→07a, 04→07a = 5 total
    expect(result.edges.length).toBe(5);
  });
});

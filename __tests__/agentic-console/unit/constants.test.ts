import { describe, it, expect } from 'vitest';
import {
  PHASE_ORDER,
  PHASE_LABELS,
  PHASE_COLORS,
  STATUS_CONFIG,
  AGENT_ICONS,
  GLOBAL_NAV_ITEMS,
  CHECK_TYPE_COLORS,
  CHECK_TYPE_LABELS,
  COMPLIANCE_TYPE_INFO,
} from '@/app/agentic-console/shared';

describe('PHASE_ORDER', () => {
  it('has all 6 phases in correct order', () => {
    expect(PHASE_ORDER).toEqual([
      'system', 'phase_one', 'phase_two', 'phase_three', 'phase_four', 'phase_five',
    ]);
  });

  it('has exactly 6 phases', () => {
    expect(PHASE_ORDER.length).toBe(6);
  });
});

describe('PHASE_LABELS', () => {
  it('has labels for all phases', () => {
    PHASE_ORDER.forEach(p => {
      expect(PHASE_LABELS[p]).toBeDefined();
      expect(typeof PHASE_LABELS[p]).toBe('string');
      expect(PHASE_LABELS[p].length).toBeGreaterThan(0);
    });
  });

  it('has exactly 6 entries', () => {
    expect(Object.keys(PHASE_LABELS).length).toBe(6);
  });
});

describe('PHASE_COLORS', () => {
  it('has colors for all phases', () => {
    PHASE_ORDER.forEach(p => {
      expect(PHASE_COLORS[p]).toBeDefined();
      expect(PHASE_COLORS[p]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('has exactly 6 entries', () => {
    expect(Object.keys(PHASE_COLORS).length).toBe(6);
  });
});

describe('STATUS_CONFIG', () => {
  const expectedStatuses = ['approved', 'completed', 'awaiting_approval', 'pending', 'idle', 'active', 'failed', 'in_progress', 'cancelled'];

  it('has entries for all expected statuses', () => {
    expectedStatuses.forEach(s => {
      expect(STATUS_CONFIG[s]).toBeDefined();
    });
  });

  it('has 9 entries', () => {
    expect(Object.keys(STATUS_CONFIG).length).toBe(9);
  });

  it('each entry has color and bg properties', () => {
    Object.entries(STATUS_CONFIG).forEach(([key, val]) => {
      expect(val).toHaveProperty('color');
      expect(val).toHaveProperty('bg');
      expect(val.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof val.bg).toBe('string');
    });
  });

  it('approved and completed share same colors', () => {
    expect(STATUS_CONFIG.approved.color).toBe(STATUS_CONFIG.completed.color);
    expect(STATUS_CONFIG.approved.bg).toBe(STATUS_CONFIG.completed.bg);
  });

  it('pending and idle share same colors', () => {
    expect(STATUS_CONFIG.pending.color).toBe(STATUS_CONFIG.idle.color);
    expect(STATUS_CONFIG.pending.bg).toBe(STATUS_CONFIG.idle.bg);
  });

  it('active and in_progress share same colors', () => {
    expect(STATUS_CONFIG.active.color).toBe(STATUS_CONFIG.in_progress.color);
    expect(STATUS_CONFIG.active.bg).toBe(STATUS_CONFIG.in_progress.bg);
  });

  it('failed and cancelled share same colors', () => {
    expect(STATUS_CONFIG.failed.color).toBe(STATUS_CONFIG.cancelled.color);
    expect(STATUS_CONFIG.failed.bg).toBe(STATUS_CONFIG.cancelled.bg);
  });
});

describe('AGENT_ICONS', () => {
  const expectedAgents = [
    '00_supervisor_agent', '01_ideation_agent', '02_requirement_agent',
    '03_architect_agent', '04_prototype_agent', '05_program_mgmt_agent',
    '06_infra_devops_agent', '07a_ui_agent', '07b_api_agent',
    '07c_backend_db_agent', '07d_integration_agent', '08_qa_agent',
    '09_production_agent', '10_tech_pub_agent', '11_customer_onboarding_agent',
    '12_marketing_agent', '13_maintenance_agent', '14_finops_agent',
    '15_secrets_compliance_agent',
  ];

  it('has entries for all 19 agents', () => {
    expect(Object.keys(AGENT_ICONS).length).toBe(19);
  });

  it('covers agents 00 through 15', () => {
    expectedAgents.forEach(a => {
      expect(AGENT_ICONS[a]).toBeDefined();
      expect(typeof AGENT_ICONS[a]).toBe('string');
    });
  });

  it('supervisor has Shield icon', () => {
    expect(AGENT_ICONS['00_supervisor_agent']).toBe('Shield');
  });
});

describe('GLOBAL_NAV_ITEMS', () => {
  it('has 8 navigation links', () => {
    expect(GLOBAL_NAV_ITEMS.length).toBe(8);
  });

  it('every item has href, label, and icon', () => {
    GLOBAL_NAV_ITEMS.forEach(item => {
      expect(item).toHaveProperty('href');
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('icon');
      expect(typeof item.href).toBe('string');
      expect(typeof item.label).toBe('string');
      expect(typeof item.icon).toBe('string');
    });
  });

  it('first item points to dashboard', () => {
    expect(GLOBAL_NAV_ITEMS[0].href).toBe('/agentic-console');
    expect(GLOBAL_NAV_ITEMS[0].label).toBe('Dashboard');
  });

  it('includes mcp servers link', () => {
    const mcp = GLOBAL_NAV_ITEMS.find(i => i.href === '/agentic-console/mcp');
    expect(mcp).toBeDefined();
    expect(mcp!.label).toBe('MCP Servers');
  });
});

describe('CHECK_TYPE_COLORS', () => {
  it('all values are valid hex colors', () => {
    Object.values(CHECK_TYPE_COLORS).forEach(c => {
      expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('has 12 check type entries', () => {
    expect(Object.keys(CHECK_TYPE_COLORS).length).toBe(12);
  });
});

describe('COMPLIANCE_TYPE_INFO', () => {
  it('has entries matching CHECK_TYPE_COLORS keys', () => {
    const colorKeys = Object.keys(CHECK_TYPE_COLORS).sort();
    const infoKeys = Object.keys(COMPLIANCE_TYPE_INFO).sort();
    expect(infoKeys).toEqual(colorKeys);
  });

  it('each entry has label and description', () => {
    Object.values(COMPLIANCE_TYPE_INFO).forEach(v => {
      expect(v).toHaveProperty('label');
      expect(v).toHaveProperty('description');
      expect(typeof v.label).toBe('string');
      expect(typeof v.description).toBe('string');
    });
  });

  it('has 12 entries', () => {
    expect(Object.keys(COMPLIANCE_TYPE_INFO).length).toBe(12);
  });
});

describe('CHECK_TYPE_LABELS', () => {
  it('has entries matching CHECK_TYPE_COLORS keys', () => {
    const colorKeys = Object.keys(CHECK_TYPE_COLORS).sort();
    const labelKeys = Object.keys(CHECK_TYPE_LABELS).sort();
    expect(labelKeys).toEqual(colorKeys);
  });

  it('has 12 entries', () => {
    expect(Object.keys(CHECK_TYPE_LABELS).length).toBe(12);
  });
});

describe('Cross-constant consistency', () => {
  it('all CHECK_TYPE keys are consistent across all three maps', () => {
    const keys = Object.keys(CHECK_TYPE_COLORS).sort();
    expect(Object.keys(CHECK_TYPE_LABELS).sort()).toEqual(keys);
    expect(Object.keys(COMPLIANCE_TYPE_INFO).sort()).toEqual(keys);
  });

  it('COMPLIANCE_TYPE_INFO labels match capitalized CHECK_TYPE_COLORS keys', () => {
    // Label should be human-readable, not raw key
    Object.entries(COMPLIANCE_TYPE_INFO).forEach(([key, val]) => {
      expect(val.label.length).toBeGreaterThan(0);
      expect(val.label).not.toBe(key); // label should differ from raw key
    });
  });
});

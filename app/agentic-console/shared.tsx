'use client';

import React from 'react';

// ── Types ──
export type AgentState = {
    agent_id: string;
    phase: string;
    pool: string;
    status: string;
    dependencies: string[];
    requires_human_approval: boolean;
    approved: boolean;
    role: string;
    execution_count: number;
    compliance_checklist: ComplianceCheck[];
    artifacts_emitted: string[];
    notes: string;
    last_activity_timestamp: string | null;
    last_error: string | null;
    expert_reviewer: ExpertReview | null;
    approval_gate_triggers?: string[];
};

export type ComplianceCheck = {
    id: string;
    check: string;
    type: string;
    required: boolean;
    passed: boolean;
};

export type ExpertReview = {
    role_title: string;
    review_status: string;
    review_feedback: string[];
    reviewed_by: string | null;
    reviewed_at: string | null;
    sign_off_required: boolean;
    sign_off_granted: boolean;
};

export type ApprovalGate = {
    gate_id: string;
    name: string;
    triggered_by: string;
    description: string;
    status: string;
    approved: boolean;
    approved_by?: string;
    approved_at?: string;
    notes?: string;
};

export type DashboardSummary = {
    total_agents: number;
    agents_completed: number;
    agents_in_progress: number;
    agents_pending: number;
    agents_awaiting_review: number;
    agents_failed: number;
    overall_progress_pct: number;
    last_milestone: string;
};

// ── Constants ──
export const PHASE_ORDER = ['system', 'phase_one', 'phase_two', 'phase_three', 'phase_four', 'phase_five'];
export const PHASE_LABELS: Record<string, string> = {
    system: 'System',
    phase_one: 'Phase 1: Front-Office & Architecture',
    phase_two: 'Phase 2: Project Mgmt & Infrastructure',
    phase_three: 'Phase 3: Execution & Implementation',
    phase_four: 'Phase 4: Verification & Quality',
    phase_five: 'Phase 5: Post-Delivery & Maintenance',
};
export const PHASE_COLORS: Record<string, string> = {
    system: '#6366F1', phase_one: '#3B82F6', phase_two: '#8B5CF6',
    phase_three: '#EC4899', phase_four: '#14B8A6', phase_five: '#64748B',
};
export const PHASE_DESCRIPTIONS: Record<string, string> = {
    phase_one: 'Market research, PRD creation, architecture design, and POC validation',
    phase_two: 'Sprint planning, story mapping, DevOps pipeline, and CI/CD setup',
    phase_three: 'UI, API, backend database implementation, and system integration',
    phase_four: 'QA automation, E2E testing, production deployment prep',
    phase_five: 'Documentation, merchant onboarding, marketing, maintenance, FinOps, security',
};

export const CHECK_TYPE_COLORS: Record<string, string> = {
    artifact: '#3B82F6', test: '#8B5CF6', code_review: '#F59E0B', security: '#DC2626',
    schema: '#14B8A6', data_completeness: '#EC4899', workflow: '#6366F1', traceability: '#F97316',
    validation: '#84CC16', quality: '#06B6D4', system_health: '#64748B', architecture: '#E11D48',
};

export const CHECK_TYPE_LABELS: Record<string, string> = {
    artifact: 'Required files & deliverables exist on disk and are non-empty',
    test: 'Unit/E2E tests executed without failures with coverage thresholds',
    code_review: 'AI + human code review completed; pre-commit gate cleared',
    security: 'No unprotected credentials, secrets in vault, encryption active',
    schema: 'Output structures match AGENT_REGISTRY.json contract definitions',
    data_completeness: 'All required data fields, markets, merchants present in output',
    workflow: 'Feature branch → PR → CI → merge workflow was followed',
    traceability: 'Artifacts reference specific PRD requirement IDs from TRACEABILITY_MATRIX.json',
    validation: 'Deployment endpoints return HTTP 200, no timeout errors',
    quality: 'Defect threshold met; no high-severity bugs open on release branch',
    system_health: 'State files readable, agent registry matches state matrix',
    architecture: 'Multi-layer testing, API gateway, rate limiting defined',
};

export const COMPLIANCE_TYPE_INFO: Record<string, { label: string; description: string }> = {
    artifact: { label: 'Artifact', description: 'Required output files and deliverables' },
    test: { label: 'Test', description: 'Unit/E2E test pass and coverage' },
    code_review: { label: 'Code Review', description: 'AI + human review clearance' },
    security: { label: 'Security', description: 'Secrets, credentials, encryption checks' },
    schema: { label: 'Schema', description: 'Output matches JSON contract' },
    data_completeness: { label: 'Data Completeness', description: 'All required data fields present' },
    workflow: { label: 'Workflow', description: 'Feature branch/PR/CI compliance' },
    traceability: { label: 'Traceability', description: 'Links to PRD requirement IDs' },
    validation: { label: 'Validation', description: 'Endpoint health, no timeouts' },
    quality: { label: 'Quality', description: 'Defect threshold, bug severity gate' },
    system_health: { label: 'System Health', description: 'State files valid and consistent' },
    architecture: { label: 'Architecture', description: 'Multi-layer testing, API gateway, rate limiting' },
};

export const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
    approved: { color: '#16A34A', bg: 'bg-green-100 text-green-700' },
    completed: { color: '#16A34A', bg: 'bg-green-100 text-green-700' },
    awaiting_approval: { color: '#F59E0B', bg: 'bg-amber-100 text-amber-700' },
    pending: { color: '#6B7280', bg: 'bg-gray-100 text-gray-500' },
    idle: { color: '#6B7280', bg: 'bg-gray-100 text-gray-500' },
    active: { color: '#3B82F6', bg: 'bg-blue-100 text-blue-700' },
    failed: { color: '#DC2626', bg: 'bg-red-100 text-red-700' },
    in_progress: { color: '#3B82F6', bg: 'bg-blue-100 text-blue-700' },
};

export const AGENT_ICONS: Record<string, string> = {
    '00_supervisor_agent': 'Shield', '01_ideation_agent': 'Lightbulb', '02_requirement_agent': 'FileText',
    '03_architect_agent': 'Layout', '04_prototype_agent': 'Truck', '05_program_mgmt_agent': 'GitMerge',
    '06_infra_devops_agent': 'Server', '07a_ui_agent': 'Monitor', '07b_api_agent': 'Code',
    '07c_backend_db_agent': 'Database', '07d_integration_agent': 'Layers', '08_qa_agent': 'Activity',
    '09_production_agent': 'Globe', '10_tech_pub_agent': 'BookOpen', '11_customer_onboarding_agent': 'UserCheck',
    '12_marketing_agent': 'Camera', '13_maintenance_agent': 'Settings', '14_finops_agent': 'Coins',
    '15_secrets_compliance_agent': 'Lock',
};

export const GLOBAL_NAV_ITEMS = [
    { href: '/agentic-console', label: 'Dashboard', icon: 'Activity' },
    { href: '/agentic-console/agents', label: 'Agent Pipeline', icon: 'Bot' },
    { href: '/agentic-console/quality', label: 'Quality', icon: 'Shield' },
    { href: '/agentic-console/operations', label: 'Operations', icon: 'Settings' },
    { href: '/agentic-console/mcp', label: 'MCP Registry', icon: 'Server' },
];

// ── Helper Components ──

export function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg}`}>
            {status.toUpperCase().replace('_', ' ')}
        </span>
    );
}

export function ProgressRing({ pct, size = 80 }: { pct: number; size?: number }) {
    const stroke = size * 0.08;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const color = pct >= 80 ? '#16A34A' : pct >= 50 ? '#F59E0B' : '#DC2626';
    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
            <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
                className="text-lg font-bold fill-current" transform={`rotate(90, ${size / 2}, ${size / 2})`}>
                {Math.round(pct)}%
            </text>
        </svg>
    );
}

// ── Page TOC Component ──
export function PageTOC({ sections, currentPage }: { sections: { id: string; label: string }[]; currentPage: string }) {
    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav className="flex items-center gap-1 flex-wrap">
            {sections.map(s => (
                <button key={s.id} onClick={() => scrollTo(s.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-md hover:bg-indigo-50 hover:text-indigo-700 text-gray-500 whitespace-nowrap transition-colors">
                    {s.label}
                </button>
            ))}
        </nav>
    );
}

// ── Data fetching helper ──
export async function fetchWithTimeout(url: string, ms = 10000) {
    const ctrl = new AbortController();
    return Promise.race([
        fetch(url, { signal: ctrl.signal }),
        new Promise<never>((_, reject) => setTimeout(() => { ctrl.abort(); reject('timeout'); }, ms)),
    ]);
}
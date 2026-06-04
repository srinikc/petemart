'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  CheckCircle, XCircle, AlertCircle, Clock, ChevronDown, ChevronRight,
  Search, RefreshCw, ExternalLink, Loader2, Shield,
  Bot, UserCheck, DollarSign, GitMerge, FileText, Activity,
  Layout, Database, Code, Layers, Globe, Lock, Settings, Server,
  Coins, BookOpen, Truck, Camera, Monitor, Lightbulb,
} from 'lucide-react';
import mermaid from 'mermaid';

type AgentState = {
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

type ComplianceCheck = {
  id: string;
  check: string;
  type: string;
  required: boolean;
  passed: boolean;
};

type ExpertReview = {
  role_title: string;
  review_status: string;
  review_feedback: string[];
  reviewed_by: string | null;
  reviewed_at: string | null;
  sign_off_required: boolean;
  sign_off_granted: boolean;
};

type ApprovalGate = {
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

type DashboardSummary = {
  total_agents: number;
  agents_completed: number;
  agents_in_progress: number;
  agents_pending: number;
  agents_awaiting_review: number;
  agents_failed: number;
  overall_progress_pct: number;
  last_milestone: string;
};

type TokenSummary = {
  sessions: any[];
  summary: {
    total_sessions: number;
    total_tokens_input: number;
    total_tokens_output: number;
    total_cost: number;
    by_agent: Record<string, { sessions: number; tokens_input: number; tokens_output: number; cost: number }>;
    agent_chart: { name: string; tokens_input: number; tokens_output: number; cost: number }[];
  };
};

const PHASE_ORDER = ['system', 'phase_one', 'phase_two', 'phase_three', 'phase_four', 'phase_five'];
const PHASE_LABELS: Record<string, string> = {
  system: 'System',
  phase_one: 'Phase 1: Front-Office & Architecture',
  phase_two: 'Phase 2: Project Mgmt & Infrastructure',
  phase_three: 'Phase 3: Execution & Implementation',
  phase_four: 'Phase 4: Verification & Quality',
  phase_five: 'Phase 5: Post-Delivery & Maintenance',
};
const PHASE_COLORS: Record<string, string> = {
  system: '#6366F1',
  phase_one: '#3B82F6',
  phase_two: '#8B5CF6',
  phase_three: '#EC4899',
  phase_four: '#14B8A6',
  phase_five: '#64748B',
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  approved: { color: '#16A34A', bg: 'bg-green-100 text-green-700', icon: CheckCircle },
  completed: { color: '#16A34A', bg: 'bg-green-100 text-green-700', icon: CheckCircle },
  awaiting_approval: { color: '#F59E0B', bg: 'bg-amber-100 text-amber-700', icon: Clock },
  pending: { color: '#6B7280', bg: 'bg-gray-100 text-gray-500', icon: Clock },
  idle: { color: '#6B7280', bg: 'bg-gray-100 text-gray-500', icon: Clock },
  active: { color: '#3B82F6', bg: 'bg-blue-100 text-blue-700', icon: Activity },
  failed: { color: '#DC2626', bg: 'bg-red-100 text-red-700', icon: XCircle },
  in_progress: { color: '#3B82F6', bg: 'bg-blue-100 text-blue-700', icon: Loader2 },
};

const AGENT_ICONS: Record<string, React.ElementType> = {
  '00_supervisor_agent': Shield,
  '01_ideation_agent': Lightbulb,
  '02_requirement_agent': FileText,
  '03_architect_agent': Layout,
  '04_prototype_agent': Truck,
  '05_program_mgmt_agent': GitMerge,
  '06_infra_devops_agent': Server,
  '07a_ui_agent': Monitor,
  '07b_api_agent': Code,
  '07c_backend_db_agent': Database,
  '07d_integration_agent': Layers,
  '08_qa_agent': Activity,
  '09_production_agent': Globe,
  '10_tech_pub_agent': BookOpen,
  '11_customer_onboarding_agent': UserCheck,
  '12_marketing_agent': Camera,
  '13_maintenance_agent': Settings,
  '14_finops_agent': Coins,
  '15_secrets_compliance_agent': Lock,
};

const CHECK_TYPE_COLORS: Record<string, string> = {
  artifact: '#3B82F6',
  test: '#8B5CF6',
  code_review: '#F59E0B',
  security: '#DC2626',
  schema: '#14B8A6',
  data_completeness: '#EC4899',
  workflow: '#6366F1',
  traceability: '#F97316',
  validation: '#84CC16',
  quality: '#06B6D4',
  system_health: '#64748B',
  architecture: '#E11D48',
};

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg}`}>
      <cfg.icon size={12} />
      {status.toUpperCase().replace('_', ' ')}
    </span>
  );
}

function ProgressRing({ pct, size = 80 }: { pct: number; size?: number }) {
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

function AgentDetailModal({ agent, onClose, onApprove, onReject }: {
  agent: AgentState;
  onClose: () => void;
  onApprove: (id: string, feedback: string) => void;
  onReject: (id: string, feedback: string) => void;
}) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const agentId = agent.agent_id;

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(agentId, feedback);
    setLoading(false);
  };
  const handleReject = async () => {
    setLoading(true);
    await onReject(agentId, feedback);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{agentId}</h2>
            <p className="text-sm text-gray-500">{agent.role}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Phase:</span> <span className="font-medium">{PHASE_LABELS[agent.phase]}</span></div>
            <div><span className="text-gray-500">Status:</span> <StatusBadge status={agent.status} /></div>
            <div><span className="text-gray-500">Pool:</span> <span className="font-medium">{agent.pool}</span></div>
            <div><span className="text-gray-500">Executions:</span> <span className="font-medium">{agent.execution_count}</span></div>
            <div><span className="text-gray-500">Dependencies:</span> <span className="font-medium">{agent.dependencies.join(', ') || 'None'}</span></div>
            <div><span className="text-gray-500">HITL Required:</span> <span className={agent.requires_human_approval ? 'text-amber-600' : 'text-green-600'}>{agent.requires_human_approval ? 'Yes' : 'No'}</span></div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Last Activity</h3>
            <p className="text-sm text-gray-600">{agent.last_activity_timestamp || 'Never'}</p>
          </div>

          {agent.expert_reviewer && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Expert Reviewer</h3>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-gray-500">Role:</span> {agent.expert_reviewer.role_title}</p>
                <p><span className="text-gray-500">Status:</span> {agent.expert_reviewer.review_status}</p>
                {agent.expert_reviewer.reviewed_by && <p><span className="text-gray-500">Reviewed by:</span> {agent.expert_reviewer.reviewed_by}</p>}
                {agent.expert_reviewer.review_feedback?.length > 0 && (
                  <div className="mt-2">
                    <span className="text-gray-500">Feedback:</span>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                      {agent.expert_reviewer.review_feedback.map((fb, i) => <li key={i}>{fb}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {agent.approval_gate_triggers && agent.approval_gate_triggers.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Approval Gates Triggered</h3>
              <div className="flex flex-wrap gap-2">
                {agent.approval_gate_triggers.map(g => (
                  <span key={g} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{g}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-sm mb-2">Compliance Checklist ({agent.compliance_checklist.filter(c => c.passed).length}/{agent.compliance_checklist.length})</h3>
            <div className="max-h-60 overflow-y-auto space-y-1 text-sm">
              {agent.compliance_checklist.map(c => (
                <div key={c.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-gray-50">
                  {c.passed ? <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    : <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />}
                  <div>
                    <span className="text-xs font-mono text-gray-400">{c.id}</span>
                    <span className="ml-1 text-gray-700">{c.check.split('—')[0].trim()}</span>
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${CHECK_TYPE_COLORS[c.type] ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                      style={{ backgroundColor: CHECK_TYPE_COLORS[c.type] || '#E5E7EB', color: CHECK_TYPE_COLORS[c.type] ? 'white' : '#4B5563' }}>{c.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Artifacts Emitted ({agent.artifacts_emitted.length})</h3>
            <div className="max-h-32 overflow-y-auto">
              {agent.artifacts_emitted.length > 0 ? (
                <ul className="text-xs space-y-1">
                  {agent.artifacts_emitted.map((a, i) => (
                    <li key={i} className="font-mono text-gray-600 truncate">{a}</li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-400 italic">None yet</p>}
            </div>
          </div>

          {agent.notes && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Notes</h3>
              <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">{agent.notes}</p>
            </div>
          )}

          {agent.last_error && (
            <div>
              <h3 className="font-semibold text-sm mb-2 text-red-600">Last Error</h3>
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{agent.last_error}</p>
            </div>
          )}

          {agent.requires_human_approval && agent.status === 'awaiting_approval' && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-2">Human-in-the-Loop Action</h3>
              <div className="space-y-3">
                <textarea
                  className="w-full border rounded-lg p-2 text-sm"
                  rows={3}
                  placeholder="Optional feedback / review notes..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Approve & Sign Off
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgenticConsole() {
  const [state, setState] = useState<any>(null);
  const [tokenData, setTokenData] = useState<TokenSummary | null>(null);
  const [reviewData, setReviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [diagramSvg, setDiagramSvg] = useState<string | null>(null);
  const [diagramError, setDiagramError] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  const fetchState = useCallback(async () => {
    let done = false;
    setTimeout(() => { if (!done) { done = true; setLoading(false); } }, 12000);
    try {
      const [stateRes, tokenRes] = await Promise.all([
        fetch('/api/agentic-console/state'),
        fetch('/api/token-usage'),
      ]);
      if (!done) {
        const stateData = await stateRes.json();
        const tokenData_ = await tokenRes.json();
        setState(stateData);
        setTokenData(tokenData_);
      }
    } catch (e) {
      console.error('Failed to fetch state:', e);
    } finally {
      if (!done) { done = true; setLoading(false); }
    }
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  useEffect(() => {
    let mounted = true;
    async function render() {
      try {
        const { svg } = await mermaid.render('mermaid-svg-' + renderKey, MERMAID_DEF);
        if (mounted) setDiagramSvg(svg);
      } catch {
        if (mounted) setDiagramError(true);
      }
    }
    render();
    return () => { mounted = false; };
  }, [renderKey]);

  const retryDiagram = () => { setDiagramError(false); setDiagramSvg(null); setRenderKey(k => k + 1); };

  const handleApprove = async (agentId: string, feedback: string) => {
    setActionLoading(agentId);
    try {
      await fetch('/api/agentic-console/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, action: 'approve', feedback }),
      });
      setSelectedAgent(null);
      await fetchState();
    } catch (e) {
      console.error('Approve failed:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (agentId: string, feedback: string) => {
    setActionLoading(agentId);
    try {
      await fetch('/api/agentic-console/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, action: 'reject', feedback }),
      });
      setSelectedAgent(null);
      await fetchState();
    } catch (e) {
      console.error('Reject failed:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGateApprove = async (gateId: string) => {
    setActionLoading(gateId);
    try {
      await fetch('/api/agentic-console/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: gateId, action: 'open_gate' }),
      });
      await fetchState();
    } catch (e) {
      console.error('Gate approve failed:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAgents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const agentStates: Record<string, AgentState> = state?.stateMatrix?.agent_states || {};
  const summary: DashboardSummary = state?.stateMatrix?.pipeline_control?.dashboard_summary || {
    total_agents: 16, agents_completed: 8, agents_in_progress: 0, agents_pending: 5,
    agents_awaiting_review: 2, agents_failed: 0, overall_progress_pct: 69, last_milestone: '',
  };
  const gates: ApprovalGate[] = state?.stateMatrix?.supervisor_control?.approval_gates || [];
  const loopGuardrails = state?.stateMatrix?.supervisor_control?.loop_guardrails || {};
  const workflowEnforcement = state?.stateMatrix?.supervisor_control?.workflow_enforcement || {};
  const contextLake = state?.contextLake?.latestEntry;

  const sortedAgentEntries = useMemo(() => {
    return Object.entries(agentStates)
      .map(([k, v]) => ({ ...v, agent_id: k }))
      .sort((a, b) => {
        const pi = PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase);
        if (pi !== 0) return pi;
        return a.agent_id.localeCompare(b.agent_id);
      });
  }, [agentStates]);

  const filteredAgents = useMemo(() => {
    return sortedAgentEntries.filter(a => {
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (filterPhase !== 'all' && a.phase !== filterPhase) return false;
      if (searchQuery && !a.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) && !a.role.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [sortedAgentEntries, filterStatus, filterPhase, searchQuery]);

  const totalComplianceItems = useMemo(() => {
    let total = 0, passed = 0;
    Object.values(agentStates).forEach((a: AgentState) => {
      a.compliance_checklist?.forEach(c => {
        total++;
        if (c.passed) passed++;
      });
    });
    return { total, passed, pct: total > 0 ? Math.round((passed / total) * 100) : 0 };
  }, [agentStates]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(agentStates).forEach((a: AgentState) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [agentStates]);

  mermaid.initialize({
    theme: 'base',
    themeVariables: {
      primaryColor: '#3B82F6', primaryTextColor: '#1F2937', primaryBorderColor: '#93C5FD',
      lineColor: '#9CA3AF', secondaryColor: '#F3F4F6', tertiaryColor: '#EFF6FF',
    },
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
  });

  const MERMAID_DEF = `graph TB
    subgraph P1["Phase 1: Front-Office & Architecture"]
        A1["01 Ideation"] --> A2["02 Requirements"]
        A2 --> A3["03 Architect"]
        A3 --> A4["04 Prototype/POC"]
    end
    subgraph P2["Phase 2: Project Mgmt & Infra"]
        A4 --> A5["05 Program Mgmt"]
        A5 --> A6["06 Infra/DevOps"]
    end
    subgraph P3["Phase 3: Execution & Implementation"]
        A6 --> A7a["07a UI Agent"]
        A6 --> A7b["07b API Agent"]
        A6 --> A7c["07c Backend DB"]
        A7a & A7b & A7c --> A7d["07d Integration"]
    end
    subgraph P4["Phase 4: Verification & Quality"]
        A7d --> A8["08 QA Agent"]
        A8 --> A9["09 Production"]
    end
    subgraph P5["Phase 5: Post-Delivery & Maintenance"]
        A9 --> A10["10 Tech Pub"]
        A9 --> A11["11 Customer Onboard"]
        A9 --> A12["12 Marketing"]
        A9 --> A13["13 Maintenance"]
        A9 --> A14["14 FinOps"]
        A9 --> A15["15 Secrets/Compliance"]
    end
    A0["00 Supervisor (Orchestrator)"] -.-> P1
    A0 -.-> P2
    A0 -.-> P3
    A0 -.-> P4
    A0 -.-> P5`;

  const PIE_COLORS = ['#16A34A', '#F59E0B', '#6B7280', '#3B82F6', '#DC2626', '#8B5CF6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading Agentic Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-indigo-600" />
            <div>
              <h1 className="text-lg font-bold">PeteMart Agentic Console</h1>
              <p className="text-xs text-gray-500">Agentic AI Project Management Dashboard — v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchState} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <RefreshCw size={14} /> Refresh
            </button>
            <a href="/qa-dashboard" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <ExternalLink size={14} /> QA Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ── Section 1: Overall Status ── */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <ProgressRing pct={summary.overall_progress_pct} size={96} />
              <div>
                <h2 className="text-xl font-bold">Project Completion</h2>
                <p className="text-sm text-gray-500 mt-1">{summary.last_milestone}</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4 text-center">
              <div><div className="text-2xl font-bold text-green-600">{summary.agents_completed}</div><div className="text-xs text-gray-500">Completed</div></div>
              <div><div className="text-2xl font-bold text-amber-500">{summary.agents_awaiting_review}</div><div className="text-xs text-gray-500">Awaiting Review</div></div>
              <div><div className="text-2xl font-bold text-blue-500">{summary.agents_in_progress}</div><div className="text-xs text-gray-500">In Progress</div></div>
              <div><div className="text-2xl font-bold text-gray-400">{summary.agents_pending}</div><div className="text-xs text-gray-500">Pending</div></div>
              <div><div className="text-2xl font-bold text-red-500">{summary.agents_failed}</div><div className="text-xs text-gray-500">Failed</div></div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Workflow Diagram ── */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">Agentic AI Workflow — 15-Agent Pipeline</h2>
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto min-h-[250px] flex items-center justify-center">
            {diagramSvg ? (
              <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />
            ) : diagramError ? (
              <div className="text-center py-8 text-gray-400">
                <AlertCircle size={32} className="mx-auto mb-2" />
                <p className="text-sm">Diagram render failed</p>
                <button onClick={retryDiagram} className="mt-2 text-xs text-blue-600 hover:underline">Retry</button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                <span className="text-sm">Rendering diagram...</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">Dependencies flow left-to-right across 5 phases. Agent 0 (Supervisor) orchestrates all agents.</p>
        </section>

        {/* ── Section 3: Agent Grid ── */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Agent Pipeline ({filteredAgents.length}/{sortedAgentEntries.length})</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Search agents..."
                  className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-48"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <select className="border rounded-lg text-sm px-3 py-1.5" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="awaiting_approval">Awaiting Approval</option>
                <option value="pending">Pending</option>
                <option value="idle">Idle</option>
                <option value="active">Active</option>
                <option value="failed">Failed</option>
              </select>
              <select className="border rounded-lg text-sm px-3 py-1.5" value={filterPhase} onChange={e => setFilterPhase(e.target.value)}>
                <option value="all">All Phases</option>
                <option value="phase_one">Phase 1</option>
                <option value="phase_two">Phase 2</option>
                <option value="phase_three">Phase 3</option>
                <option value="phase_four">Phase 4</option>
                <option value="phase_five">Phase 5</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {filteredAgents.map(a => {
              const passedCount = a.compliance_checklist?.filter(c => c.passed).length || 0;
              const totalCount = a.compliance_checklist?.length || 0;
              const AgentIcon = AGENT_ICONS[a.agent_id] || Bot;
              const phaseColor = PHASE_COLORS[a.phase] || '#6B7280';
              const isExpanded = expandedAgents.has(a.agent_id);

              return (
                <div key={a.agent_id} className="border rounded-lg hover:shadow-sm transition-shadow">
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => toggleExpand(a.agent_id)}
                  >
                    <button className="text-gray-400 shrink-0">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: phaseColor }} />
                    <AgentIcon size={20} className="text-gray-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{a.agent_id}</span>
                        <span className="text-xs text-gray-400 truncate">{a.role}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={a.status} />
                        <span className="text-xs text-gray-400">{PHASE_LABELS[a.phase]}</span>
                        <span className="text-xs text-gray-400">• {a.execution_count} runs</span>
                        <span className="text-xs text-gray-400">• {passedCount}/{totalCount} compliance</span>
                      </div>
                    </div>
                    {a.requires_human_approval && a.status === 'awaiting_approval' && (
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedAgent(a); }}
                        className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-100 flex items-center gap-1 shrink-0"
                      >
                        <UserCheck size={14} /> HITL Required
                      </button>
                    )}
                    {a.last_error && <XCircle size={14} className="text-red-400 shrink-0" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 py-3 bg-gray-50/50">
                      {/* Compliance checklist */}
                      {a.compliance_checklist && a.compliance_checklist.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-gray-500 mb-1.5">Compliance Checklist</h4>
                          <div className="grid grid-cols-2 gap-1">
                            {a.compliance_checklist.map(c => (
                              <div key={c.id} className="flex items-center gap-1.5 text-xs">
                                {c.passed
                                  ? <CheckCircle size={12} className="text-green-500 shrink-0" />
                                  : <XCircle size={12} className="text-red-400 shrink-0" />}
                                <span className="truncate text-gray-600">{c.check.split('—')[0].trim()}</span>
                                <span className="px-1 py-0.5 rounded text-[10px] text-white"
                                  style={{ backgroundColor: CHECK_TYPE_COLORS[c.type] || '#9CA3AF' }}>{c.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Artifacts */}
                      {a.artifacts_emitted && a.artifacts_emitted.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-gray-500 mb-1.5">Artifacts ({a.artifacts_emitted.length})</h4>
                          <div className="flex flex-wrap gap-1">
                            {a.artifacts_emitted.map((art, i) => (
                              <span key={i} className="text-[11px] font-mono bg-white border px-1.5 py-0.5 rounded text-gray-600 truncate max-w-[200px]">{art.split('/').pop()}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Dependencies */}
                      {a.dependencies && a.dependencies.length > 0 && (
                        <div className="text-xs text-gray-400">
                          <span className="font-semibold">Depends on:</span> {a.dependencies.join(', ')}
                        </div>
                      )}
                      {/* Notes */}
                      {a.notes && (
                        <div className="mt-2 text-xs text-gray-500 italic">{a.notes.slice(0, 200)}{a.notes.length > 200 ? '...' : ''}</div>
                      )}
                      {/* View Details button */}
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedAgent(a); }}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >View full details →</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 4: Compliance Summary ── */}
        <section className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Compliance Overview</h2>
            <div className="text-center mb-4">
              <ProgressRing pct={totalComplianceItems.pct} size={80} />
              <p className="text-sm text-gray-500 mt-2">{totalComplianceItems.passed}/{totalComplianceItems.total} checks passing</p>
            </div>
            <div className="space-y-2">
              {Object.entries(CHECK_TYPE_COLORS).slice(0, 8).map(([type, color]) => {
                const items = Object.values(agentStates).flatMap((a: AgentState) =>
                  a.compliance_checklist?.filter(c => c.type === type) || []
                );
                const passed = items.filter(c => c.passed).length;
                return (
                  <div key={type} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="capitalize w-24 text-gray-600">{type.replace('_', ' ')}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${items.length > 0 ? (passed / items.length) * 100 : 0}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-gray-400 w-16 text-right">{passed}/{items.length}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Section 5: Agent Status Pie ── */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Agent Status Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={2} dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend formatter={(value: string) => <span className="text-xs capitalize">{value.replace('_', ' ')}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* ── Section 6: Loop Guardrails ── */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Pipeline Guardrails</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Max executions/agent</span><span className="font-medium">{loopGuardrails.max_sequential_executions_per_agent || 3}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Max total cycles</span><span className="font-medium">{loopGuardrails.max_total_cycles_lifetime || 100}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Circuit breaker threshold</span><span className="font-medium">{loopGuardrails.circuit_breaker_threshold || 5}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cooldown between cycles</span><span className="font-medium">{loopGuardrails.cooldown_between_cycles_s || 5}s</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Max concurrent agents</span><span className="font-medium">{loopGuardrails.max_concurrent_agents || 3}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cycle count</span><span className="font-medium">{state?.stateMatrix?.supervisor_control?.cycle_count || 0}</span></div>
              {loopGuardrails.circuit_breaker_tripped_at && (
                <div className="text-red-600 font-medium text-xs mt-2">⚠ Circuit breaker tripped at {loopGuardrails.circuit_breaker_tripped_at}</div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between"><span className="text-gray-500">Feature branch required</span><span className={workflowEnforcement.feature_branch_required ? 'text-green-600' : 'text-red-600'}>{workflowEnforcement.feature_branch_required ? '✅ Yes' : '❌ No'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Direct push blocked</span><span className={workflowEnforcement.direct_push_blocked ? 'text-green-600' : 'text-red-600'}>{workflowEnforcement.direct_push_blocked ? '✅ Yes' : '❌ No'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">PR required before merge</span><span className={workflowEnforcement.pr_required_before_merge ? 'text-green-600' : 'text-red-600'}>{workflowEnforcement.pr_required_before_merge ? '✅ Yes' : '❌ No'}</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 7: Approval Gates ── */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">Approval Gates</h2>
          <div className="grid grid-cols-4 gap-4">
            {gates.map(g => (
              <div key={g.gate_id} className={`border rounded-lg p-4 ${g.approved ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {g.approved ? <CheckCircle size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-amber-500" />}
                  <h3 className="font-medium text-sm">{g.name}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-2">{g.description}</p>
                <div className="text-xs space-y-1">
                  <p><span className="text-gray-400">Triggered by:</span> {g.triggered_by}</p>
                  <p><span className="text-gray-400">Status:</span> <span className={g.approved ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>{g.status.toUpperCase()}</span></p>
                  {g.approved_by && <p><span className="text-gray-400">Approved by:</span> {g.approved_by}</p>}
                  {g.approved_at && <p><span className="text-gray-400">At:</span> {new Date(g.approved_at).toLocaleDateString()}</p>}
                  {g.notes && <p className="italic mt-1">"{g.notes}"</p>}
                </div>
                {!g.approved && (
                  <button
                    onClick={() => handleGateApprove(g.gate_id)}
                    disabled={actionLoading === g.gate_id}
                    className="mt-3 w-full bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-50"
                  >{actionLoading === g.gate_id ? 'Approving...' : 'Approve Gate'}</button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 8: Token & Cost ── */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">Token Usage & Cost</h2>
          {tokenData && tokenData.summary.total_sessions > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{tokenData.summary.total_sessions}</div>
                  <div className="text-xs text-blue-500">Sessions</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-700">{(tokenData.summary.total_tokens_input / 1000000).toFixed(1)}M</div>
                  <div className="text-xs text-indigo-500">Input Tokens</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-700">{(tokenData.summary.total_tokens_output / 1000000).toFixed(1)}M</div>
                  <div className="text-xs text-purple-500">Output Tokens</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-700">${tokenData.summary.total_cost.toFixed(2)}</div>
                  <div className="text-xs text-amber-500">Total Cost</div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tokenData.summary.agent_chart || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="tokens_input" fill="#6366F1" name="Input Tokens" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tokens_output" fill="#8B5CF6" name="Output Tokens" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No token usage data yet. Track usage by running <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">python scripts/track_usage.py</code></p>
            </div>
          )}
        </section>

        {/* ── Section 9: Context Lake ── */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">Context Lake</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3 text-sm">
              <p className="text-gray-600">
                <strong>Context Lake</strong> is a snapshot engine that periodically captures the full project state — git state, agent configs, state files, conversation summaries, and recent commits — into timestamped entries under <code className="bg-gray-100 px-1 rounded text-xs">context_lake/lake/</code>.
              </p>
              <p className="text-gray-600">It runs every 2 minutes via the OpenCode hook system (<code className="bg-gray-100 px-1 rounded text-xs">capture.py</code>) and stores each snapshot in a date-organized directory structure for full traceability.</p>
              {contextLake && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="font-medium text-sm">Latest Entry</p>
                  <p className="text-xs text-gray-500 mt-1">Window: {contextLake.window_name || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Captured: {contextLake.captured_at ? new Date(contextLake.captured_at).toLocaleString() : 'N/A'}</p>
                  <p className="text-xs text-gray-500">Git: {contextLake.git_branch || 'N/A'} @ {contextLake.git_sha || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Agents tracked: {contextLake.agent_count || 19}</p>
                </div>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-3">CAPTURE FLOW</h3>
              <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
{`[Timer] --2min--> [capture.py]
   │
   ▼
Read git log + branch + HEAD
Read state files (STATE_MATRIX*)
Read agent configs
Read recent conversations
   │
   ▼
Write to context_lake/lake/
  YYYY-MM-DD/
    HH-MM-SS_window/
      manifest.md
      context.json
   │
   ▼
Update context_lake/latest.json
Update context_lake/latest.md`}
              </pre>
            </div>
          </div>
        </section>

        {/* ── Section 10: Open Items / Issues ── */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">Open Items & Notes</h2>
          <div className="space-y-3">
            {Object.entries(agentStates)
              .filter(([, a]: [string, any]) => a.notes)
              .map(([id, a]: [string, any]) => (
                <details key={id} className="border rounded-lg">
                  <summary className="px-4 py-2 cursor-pointer text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                    <FileText size={14} className="text-gray-400" />
                    {id}
                    {a.status === 'awaiting_approval' && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">PENDING</span>}
                    {a.status === 'pending' && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">NOT STARTED</span>}
                    {a.last_error && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">ERROR</span>}
                  </summary>
                  <div className="px-4 pb-3 text-sm text-gray-600">{a.notes}</div>
                </details>
              ))}
          </div>
        </section>

        {/* ── Section 11: PR Tracking ── */}
        {workflowEnforcement.pr_tracking && workflowEnforcement.pr_tracking.pr_list?.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Pull Request History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Title</th>
                    <th className="pb-2 pr-4">Branch</th>
                    <th className="pb-2 pr-4">Merged</th>
                    <th className="pb-2">Compliant</th>
                  </tr>
                </thead>
                <tbody>
                  {workflowEnforcement.pr_tracking.pr_list.map((pr: any) => (
                    <tr key={pr.number} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-4 font-mono text-xs">#{pr.number}</td>
                      <td className="py-2 pr-4">{pr.title}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{pr.branch}</td>
                      <td className="py-2 pr-4 text-xs">{pr.merged_at ? new Date(pr.merged_at).toLocaleDateString() : '-'}</td>
                      <td className="py-2">{pr.ai_assistant_compliant ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-400" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* ── Agent Detail Modal ── */}
      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

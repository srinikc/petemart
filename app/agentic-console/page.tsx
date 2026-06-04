'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, XCircle, AlertCircle, Clock, Loader2, Shield, Settings, Layout,
  Bot, GitMerge, Activity, ExternalLink, RefreshCw, Bookmark, FileText, GitBranch,
  AlertTriangle, ArrowRight, Info,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// Import shared
import {
  AgentState, ApprovalGate, DashboardSummary, ComplianceCheck,
  StatusBadge, ProgressRing, PageTOC, fetchWithTimeout,
  PHASE_ORDER, PHASE_COLORS, PHASE_LABELS, PHASE_DESCRIPTIONS,
  CHECK_TYPE_COLORS, CHECK_TYPE_LABELS, COMPLIANCE_TYPE_INFO,
  AGENT_ICONS as AGENT_ICONS_MAP,
} from './shared';

const DASHBOARD_TOC_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'workflow', label: 'Pipeline Flow' },
  { id: 'gates', label: 'Approval Gates' },
  { id: 'compliance', label: 'Compliance' },
];

// ── Phase Flow Diagram (compact, shows only agent badges per phase) ──
function PhaseFlowDiagram({ agentsByPhase }: { agentsByPhase: Record<string, AgentState[]> }) {
  const phases = PHASE_ORDER.filter(p => p !== 'system');
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-start gap-3 min-w-[900px] p-2">
        {phases.map((phase, idx) => {
          const agents = agentsByPhase[phase] || [];
          const completed = agents.filter(a => a.status === 'approved' || a.status === 'completed').length;
          const color = PHASE_COLORS[phase] || '#6B7280';
          return (
            <React.Fragment key={phase}>
              <div className="flex-1 min-w-[160px]">
                <div className="rounded-lg border-2 p-3" style={{ borderColor: color }}>
                  <div className="text-[11px] font-bold mb-1 truncate" style={{ color }}>
                    Phase {idx + 1}: {PHASE_LABELS[phase].split(':')[1]?.trim()}
                  </div>
                  <div className="text-[9px] text-gray-400 mb-2 line-clamp-1">{PHASE_DESCRIPTIONS[phase]}</div>
                  <div className="flex flex-wrap gap-1">
                    {agents.map(a => {
                      const isDone = a.status === 'approved' || a.status === 'completed';
                      const isActive = a.status === 'active' || a.status === 'in_progress';
                      const isAwaiting = a.status === 'awaiting_approval';
                      const shortId = a.agent_id.replace('_agent', '').replace(/^0+/, '');
                      return (
                        <div key={a.agent_id}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium"
                          style={{
                            backgroundColor: isDone ? '#ECFDF5' : isActive ? '#EFF6FF' : isAwaiting ? '#FFFBEB' : '#F9FAFB',
                            color: isDone ? '#16A34A' : isActive ? '#3B82F6' : isAwaiting ? '#F59E0B' : '#6B7280',
                          }}
                        >
                          {shortId}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-1.5 text-[9px] text-gray-400 font-medium">{completed}/{agents.length} completed</div>
                </div>
              </div>
              {idx < phases.length - 1 && (
                <div className="flex items-center pt-10 shrink-0"><ArrowRight size={16} className="text-gray-300" /></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 text-[9px] text-gray-500 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-100 border border-green-500" /> Done</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-100 border border-blue-500" /> Active</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-100 border border-amber-500" /> Awaiting</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-100 border border-gray-500" /> Pending</span>
        <span className="text-[9px] text-gray-400 ml-1">Agent 00 (Supervisor) orchestrates all phases.</span>
      </div>
    </div>
  );
}

export default function AgenticConsoleDashboard() {
  const router = useRouter();
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadState = useCallback(async () => {
    let done = false;
    setTimeout(() => { if (!done) { done = true; setLoading(false); } }, 10000);
    try {
      const res = await fetchWithTimeout('/api/agentic-console/state');
      if (!done) {
        setState(res.ok ? await res.json() : null);
      }
    } catch (e) {
      console.error('Fetch failed:', e);
    } finally {
      if (!done) { done = true; setLoading(false); }
    }
  }, []);

  useEffect(() => { loadState(); }, [loadState]);

  const agentStates: Record<string, AgentState> = state?.stateMatrix?.agent_states || {};
  const summary: DashboardSummary = state?.stateMatrix?.pipeline_control?.dashboard_summary || {
    total_agents: 16, agents_completed: 8, agents_in_progress: 0, agents_pending: 5,
    agents_awaiting_review: 2, agents_failed: 0, overall_progress_pct: 69, last_milestone: '',
  };
  const gates: ApprovalGate[] = state?.stateMatrix?.supervisor_control?.approval_gates || [];

  // Extended gates (4 formal + 4 expert review checkpoints)
  const extendedGates = useMemo(() => {
    const allGates = [...gates];
    const existingIds = new Set(gates.map(g => g.gate_id));
    [
      { gate_id: 'CHECKPOINT-EXPERT-REVIEW-01', name: 'Phase 1 Expert Review', triggered_by: 'supervisor', description: 'Expert review of Ideation, Requirements, Architect, and Prototype outputs', status: allGates.filter(g => g.approved).length >= 2 ? 'approved' : 'pending', approved: allGates.filter(g => g.approved).length >= 2 },
      { gate_id: 'CHECKPOINT-EXPERT-REVIEW-02', name: 'Phase 2 Expert Review', triggered_by: 'supervisor', description: 'Expert review of Program Mgmt and DevOps artifacts', status: gates.find(g => g.gate_id === 'GATE-MVP-01')?.approved ? 'approved' : 'pending', approved: gates.find(g => g.gate_id === 'GATE-MVP-01')?.approved || false },
      { gate_id: 'CHECKPOINT-EXPERT-REVIEW-03', name: 'Phase 3 Code Gate', triggered_by: 'supervisor', description: 'Pre-commit code review gate for UI, API, DB, and Integration agents', status: 'pending', approved: false },
      { gate_id: 'CHECKPOINT-EXPERT-REVIEW-04', name: 'Phase 4 QA Sign-off', triggered_by: 'supervisor', description: 'QA test pass, defect closure, and Go/No-Go recommendation', status: 'pending', approved: false },
    ].forEach(cg => { if (!existingIds.has(cg.gate_id)) allGates.push(cg); });
    return allGates;
  }, [gates]);

  // Compliance breakdown
  const complianceByType = useMemo(() => {
    const byType: Record<string, { total: number; passed: number }> = {};
    Object.values(agentStates).forEach((a: AgentState) =>
      a.compliance_checklist?.forEach(c => {
        if (!byType[c.type]) byType[c.type] = { total: 0, passed: 0 };
        byType[c.type].total++;
        if (c.passed) byType[c.type].passed++;
      })
    );
    return byType;
  }, [agentStates]);

  const totalCompliance = useMemo(() => {
    let total = 0, passed = 0;
    Object.values(complianceByType).forEach(v => { total += v.total; passed += v.passed; });
    return { total, passed, pct: total > 0 ? Math.round((passed / total) * 100) : 0 };
  }, [complianceByType]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(agentStates).forEach((a: AgentState) => counts[a.status] = (counts[a.status] || 0) + 1);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [agentStates]);
  const PIE_COLORS = ['#16A34A', '#F59E0B', '#6B7280', '#3B82F6', '#DC2626', '#8B5CF6'];

  // Phase groupings for the flow diagram
  const agentsByPhase = useMemo(() => {
    const grouped: Record<string, AgentState[]> = {};
    PHASE_ORDER.forEach(phase => (grouped[phase] = []));
    Object.entries(agentStates).map(([k, v]) => ({ ...v, agent_id: k })).forEach(a => grouped[a.phase]?.push(a));
    return grouped;
  }, [agentStates]);

  const sortedAgentEntries = useMemo(() =>
    Object.entries(agentStates).map(([k, v]) => ({ ...v, agent_id: k })).sort((a, b) => {
      const pi = PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase);
      return pi !== 0 ? pi : a.agent_id.localeCompare(b.agent_id);
    }), [agentStates]);

  if (loading) {
    return (
      <div className="text-center py-20"><Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-4" /><p className="text-gray-500">Loading Dashboard...</p></div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page-level TOC */}
      <div className="bg-white rounded-xl shadow-sm border p-3 sticky top-16 z-40 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 mr-2">Dashboard:</span>
        <PageTOC sections={DASHBOARD_TOC_SECTIONS} currentPage="dashboard" />
        <span className="text-[10px] text-gray-400 ml-auto">4 sections · 16 agents · 8 gates</span>
      </div>

      {/* ═══ Section 1: Overview ═══ */}
      <section id="overview" className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-3">Project Completion Overview</h2>
        <p className="text-xs text-gray-500 mb-4">
          Pipeline tracks <strong>16 agents</strong> across <strong>5 phases</strong> from ideation to security compliance.
          Agent 0 (Supervisor) orchestrates the pipeline, enforces dependency chains, and audits compliance.
          {summary.agents_awaiting_review > 0 && (
            <span className="ml-2 text-amber-600 font-medium">⚠ {summary.agents_awaiting_review} agent(s) awaiting human approval.</span>
          )}
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-gray-50">
            <ProgressRing pct={summary.overall_progress_pct} size={110} />
            <div className="text-center">
              <div className="text-lg font-bold">{summary.overall_progress_pct}% Overall</div>
              <p className="text-[10px] text-gray-500 mt-1">{summary.last_milestone?.slice(0, 60)}...</p>
            </div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-3 sm:grid-cols-6 gap-3">
            <div className="bg-green-50 rounded-lg p-2.5 text-center border border-green-200">
              <div className="text-xl font-bold text-green-600">{summary.agents_completed}</div>
              <div className="text-[9px] text-green-500">Complete</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-2.5 text-center border border-amber-200">
              <div className="text-xl font-bold text-amber-500">{summary.agents_awaiting_review}</div>
              <div className="text-[9px] text-amber-500">Awaiting</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2.5 text-center border border-blue-200">
              <div className="text-xl font-bold text-blue-500">{summary.agents_in_progress}</div>
              <div className="text-[9px] text-blue-500">In Prog</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2.5 text-center border border-gray-200">
              <div className="text-xl font-bold text-gray-400">{summary.agents_pending}</div>
              <div className="text-[9px] text-gray-400">Pending</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2.5 text-center border border-red-200">
              <div className="text-xl font-bold text-red-500">{summary.agents_failed}</div>
              <div className="text-[9px] text-red-500">Failed</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-2.5 text-center border border-indigo-200">
              <div className="text-xl font-bold text-indigo-600">{summary.total_agents}</div>
              <div className="text-[9px] text-indigo-500">Total</div>
            </div>
          </div>
        </div>
        {/* Quick nav cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <button onClick={() => router.push('/agentic-console/agents')}
            className="border rounded-lg p-3 text-left hover:shadow-md transition-shadow hover:border-indigo-200">
            <Bot size={18} className="text-indigo-600 mb-1" />
            <div className="text-sm font-medium">Agent Pipeline</div>
            <div className="text-[10px] text-gray-500">View 5 phase frames with agent details →</div>
          </button>
          <button onClick={() => router.push('/agentic-console/quality')}
            className="border rounded-lg p-3 text-left hover:shadow-md transition-shadow hover:border-indigo-200">
            <Shield size={18} className="text-amber-600 mb-1" />
            <div className="text-sm font-medium">Code Review & Guardrails</div>
            <div className="text-[10px] text-gray-500">Review gates, open items, guardrails →</div>
          </button>
          <button onClick={() => router.push('/agentic-console/operations')}
            className="border rounded-lg p-3 text-left hover:shadow-md transition-shadow hover:border-indigo-200">
            <Settings size={18} className="text-gray-600 mb-1" />
            <div className="text-sm font-medium">Operations</div>
            <div className="text-[10px] text-gray-500">Token usage, branches, PR history →</div>
          </button>
        </div>
      </section>

      {/* ═══ Section 2: Pipeline Flow ═══ */}
      <section id="workflow" className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layout size={20} className="text-indigo-600" />
            <h2 className="text-lg font-bold">Agentic AI Pipeline Flow — 5 Phases</h2>
          </div>
          <button onClick={() => router.push('/agentic-console/agents')}
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
            View detailed breakdown <ArrowRight size={12} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Pipeline flows left to right. Currently <strong>{summary.agents_completed}/{summary.total_agents}</strong> agents completed ({summary.overall_progress_pct}%).
        </p>
        <PhaseFlowDiagram agentsByPhase={agentsByPhase} />
        <div className="mt-3 grid grid-cols-5 gap-2">
          {PHASE_ORDER.filter(p => p !== 'system').map((phase, idx) => (
            <div key={phase} className="text-center p-2 rounded-lg" style={{ backgroundColor: PHASE_COLORS[phase] + '15' }}>
              <div className="text-[9px] font-bold" style={{ color: PHASE_COLORS[phase] }}>Phase {idx + 1}</div>
              <div className="text-[8px] text-gray-500">{PHASE_LABELS[phase].split(':')[1]?.trim()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Section 3: Approval Gates ═══ */}
      <section id="gates" className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={20} className="text-amber-600" />
          <h2 className="text-lg font-bold">Approval Gates & Checkpoints</h2>
          <span className="text-[10px] text-gray-400 ml-auto">
            {extendedGates.filter(g => g.approved).length} approved · {extendedGates.filter(g => !g.approved).length} pending
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          <strong>4 formal gates</strong> (Tech Stack, Costing, MVP, Production) defined in STATE_MATRIX.json + <strong>4 expert review checkpoints</strong>. Agent 0 blocks pipeline until each gate is approved.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {extendedGates.map(g => (
            <div key={g.gate_id} className={`border rounded-lg p-3 ${g.approved ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {g.approved ? <CheckCircle size={14} className="text-green-600" /> : <AlertCircle size={14} className="text-amber-500" />}
                <h3 className="font-medium text-[10px]">{g.name}</h3>
              </div>
              <p className="text-[9px] text-gray-500 line-clamp-2 mb-1">{g.description}</p>
              <div className="text-[9px] text-gray-400">Status: <span className={g.approved ? 'text-green-600' : 'text-amber-600'}>{g.status.toUpperCase()}</span></div>
              {g.approved_by && <div className="text-[9px] text-gray-400">By: {g.approved_by}</div>}
              {g.notes && <div className="text-[8px] text-gray-400 italic mt-0.5 line-clamp-1">{g.notes}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Section 4: Compliance Dashboard ═══ */}
      <section id="compliance" className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={20} className="text-green-600" />
          <h2 className="text-lg font-bold">Compliance Dashboard</h2>
          <span className="text-[10px] text-gray-400 ml-auto">{totalCompliance.pct}% · {totalCompliance.passed}/{totalCompliance.total} checks</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Compliance checks are defined per agent in STATE_MATRIX.json. Agent 0 (Supervisor) runs these checks before marking any agent as "approved". Each row below shows a check type with hover details.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Overall score + pie */}
          <div className="space-y-3">
            <div className="text-center">
              <ProgressRing pct={totalCompliance.pct} size={90} />
              <p className="text-[10px] text-gray-400 mt-1">Overall compliance score</p>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i] || '#6B7280'} />)}
                </Pie>
                <Legend formatter={(value: string) => <span className="text-[9px] capitalize">{value.replace('_', ' ')}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Middle: Compliance by type breakdown */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-semibold text-gray-500 mb-1.5">Compliance by Check Type</h3>
            {Object.entries(CHECK_TYPE_COLORS).map(([type, color]) => {
              const data = complianceByType[type];
              if (!data) return null;
              const pct = data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0;
              const info = COMPLIANCE_TYPE_INFO[type];
              return (
                <div key={type} className="group relative">
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="w-20 truncate text-gray-600">{info?.label || type.replace('_', ' ')}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-gray-400 w-12 text-right text-[9px]">{data.passed}/{data.total}</span>
                  </div>
                  <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-10 bg-gray-800 text-white text-[9px] px-2 py-1.5 rounded shadow-lg w-48">
                    <p className="font-medium mb-0.5">{info?.label || type}</p>
                    <p className="opacity-80">{info?.description || CHECK_TYPE_LABELS[type] || type}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Per-agent compliance */}
          <div>
            <h3 className="text-[10px] font-semibold text-gray-500 mb-1.5">Agent Compliance</h3>
            <div className="max-h-60 overflow-y-auto space-y-0.5">
              {sortedAgentEntries.map(a => {
                const passed = a.compliance_checklist?.filter(c => c.passed).length || 0;
                const total = a.compliance_checklist?.length || 0;
                const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
                if (total === 0) return null;
                return (
                  <div key={a.agent_id} className="flex items-center gap-2 text-[9px] hover:bg-gray-50 rounded px-1 py-0.5 cursor-pointer"
                    onClick={() => router.push('/agentic-console/agents')}>
                    <div className={`w-1.5 h-1.5 rounded-full ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <span className="font-mono w-24 truncate">{a.agent_id}</span>
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right">{passed}/{total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
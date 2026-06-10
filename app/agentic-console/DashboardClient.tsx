'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, XCircle, AlertCircle, Loader2, Shield,
  Bot, Activity, ExternalLink, RefreshCw, FileText,
  AlertTriangle, ArrowRight, X, Radio, Monitor, Code, Database,
  Layers, Server, Globe, BookOpen, UserCheck, Camera, Settings,
  Coins, Lock, Lightbulb, Layout, Truck, GitMerge, Bell,
} from 'lucide-react';

import {
  AgentState, ApprovalGate, DashboardSummary, ComplianceCheck,
  ProgressRing, fetchWithTimeout,
  PHASE_ORDER, PHASE_COLORS, PHASE_LABELS,
  CHECK_TYPE_COLORS, COMPLIANCE_TYPE_INFO,
  AGENT_ICONS as AGENT_ICONS_MAP,
} from './shared';

const STATUS_DOT: Record<string, { color: string; label: string; pulse?: boolean; glow?: boolean }> = {
  approved: { color: '#16A34A', label: 'Done' },
  completed: { color: '#16A34A', label: 'Done' },
  active: { color: '#3B82F6', label: 'Running', pulse: true },
  in_progress: { color: '#3B82F6', label: 'Running', pulse: true },
  awaiting_approval: { color: '#F59E0B', label: 'Awaiting', glow: true },
  awaiting_input: { color: '#8B5CF6', label: 'Needs Input', pulse: true },
  pending: { color: '#9CA3AF', label: 'Pending' },
  idle: { color: '#9CA3AF', label: 'Idle' },
  failed: { color: '#DC2626', label: 'Failed', pulse: true },
  blocked: { color: '#DC2626', label: 'Blocked', pulse: true },
};

type CriticalAction = { agentId: string; label: string; type: 'approve' | 'fix' | 'rerun'; severity: 'high' | 'medium' | 'low' };

type ActivityEntry = {
  id: string; agentId: string; action: string; detail: string;
  type: 'state_change' | 'approval' | 'error' | 'info' | 'scheduling';
  severity: 'info' | 'success' | 'warning' | 'error'; timestamp: number;
};

function StatusDot({ status, size = 8 }: { status: string; size?: number }) {
  const cfg = STATUS_DOT[status] || STATUS_DOT.pending;
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${cfg.pulse ? 'animate-pulse' : ''}`}
      style={{
        width: size, height: size, backgroundColor: cfg.color,
        boxShadow: cfg.glow ? `0 0 6px ${cfg.color}80` : 'none',
      }}
    />
  );
}

function AgentMiniCard({
  agent, flashing, onClick,
}: {
  agent: AgentState & { agent_id: string };
  flashing: boolean;
  onClick: () => void;
}) {
  const cfg = STATUS_DOT[agent.status] || STATUS_DOT.pending;
  const shortId = agent.agent_id.replace('_agent', '').split('_').join(' ');
  const shortRole = agent.role.split('/')[0].replace('&', 'and').trim();
  const awaiting = agent.status === 'awaiting_approval';
  const needsInput = agent.status === 'awaiting_input';
  const failed = agent.status === 'failed' || agent.status === 'blocked';
  const active = agent.status === 'active' || agent.status === 'in_progress';
  const done = agent.status === 'approved' || agent.status === 'completed';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border px-2.5 py-2 transition-all hover:shadow-sm active:scale-[0.97] ${flashing ? 'ring-2 ring-blue-400 ring-offset-1 animate-pulse' : ''
        }         ${awaiting ? 'border-amber-200 bg-amber-50/40 live-glow-amber' :
          needsInput ? 'border-purple-200 bg-purple-50/40 live-glow-amber' :
          failed ? 'border-red-200 bg-red-50/40 live-glow-red' :
            active ? 'border-blue-200 bg-blue-50/30 live-pulse-blue' :
              done ? 'border-green-200 bg-green-50/40' :
                'border-gray-200 bg-white'
        }`}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={agent.status} size={8} />
        <span className="text-[12px] font-bold font-mono truncate" style={{ color: cfg.color }}>
          {shortId}
        </span>
        {awaiting && <span className="ml-auto text-[9px] text-amber-500 font-semibold shrink-0 animate-pulse">⚠ Awaiting</span>}
        {needsInput && <span className="ml-auto text-[9px] text-purple-500 font-semibold shrink-0 animate-pulse">⌨ Input</span>}
        {active && <Loader2 size={10} className="ml-auto text-blue-500 animate-spin shrink-0" />}
        {done && <span className="ml-auto text-[9px] text-green-600 shrink-0">✓ Done</span>}
        {!awaiting && !needsInput && !active && !done && <span className="ml-auto text-[9px] text-gray-400 shrink-0">{STATUS_DOT[agent.status]?.label || agent.status}</span>}
      </div>
      <div className="text-[10px] text-gray-500 leading-tight mt-0.5 pl-[22px] break-words">{shortRole}</div>
    </button>
  );
}

function AgentIcon({ agentId }: { agentId: string }) {
  const iconKey = AGENT_ICONS_MAP[agentId] || 'Bot';
  const icons: Record<string, React.ReactNode> = {
    Shield: <Shield size={10} />, Bot: <Bot size={10} />, Activity: <Activity size={10} />,
    FileText: <FileText size={10} />, CheckCircle: <CheckCircle size={10} />,
  };
  return <>{icons[iconKey] || icons.Bot}</>;
}

export default function AgenticConsoleDashboard({ initialState }: { initialState?: any }) {
  const router = useRouter();
  const [state, setState] = useState<any>(initialState || null);
  const [loading, setLoading] = useState(!initialState);
  const [selectedFlyoutAgent, setSelectedFlyoutAgent] = useState<string | null>(null);
  const [flyoutInstruction, setFlyoutInstruction] = useState('');
  const [flyoutInputs, setFlyoutInputs] = useState<Record<string, string>>({});
  const [flyoutActionLoading, setFlyoutActionLoading] = useState<string | null>(null);
  const [flashAgentIds, setFlashAgentIds] = useState<Set<string>>(new Set());
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now());
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const prevStatuses = useRef<Record<string, string>>({});
  const prevApproved = useRef<Record<string, boolean>>({});
  const flashTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const actCounter = useRef(0);
  const activityRef = useRef<HTMLDivElement>(null);

  const addActivity = useCallback((agentId: string, action: string, detail: string, type: ActivityEntry['type'], severity: ActivityEntry['severity']) => {
    actCounter.current++;
    const entry: ActivityEntry = { id: `act-${actCounter.current}`, agentId, action, detail, type, severity, timestamp: Date.now() };
    setActivities(prev => [entry, ...prev].slice(0, 20));
  }, []);

  const flashAgent = useCallback((agentId: string) => {
    setFlashAgentIds(prev => new Set(prev).add(agentId));
    const existing = flashTimers.current.get(agentId);
    if (existing) clearTimeout(existing);
    flashTimers.current.set(agentId, setTimeout(() => {
      setFlashAgentIds(prev => { const next = new Set(prev); next.delete(agentId); return next; });
      flashTimers.current.delete(agentId);
    }, 2000));
  }, []);

  // SSE connection for live updates
  useEffect(() => {
    const es = new EventSource('/api/agentic-console/events?poll=4000');
    let reconnectTimer: ReturnType<typeof setTimeout>;

    es.addEventListener('state_snapshot', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.stateMatrix) setState(data);
        setLastHeartbeat(Date.now());
        setLiveConnected(true);
      } catch { }
    });

    es.addEventListener('state_update', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (!data.stateMatrix) return;
        const newState = data.stateMatrix;
        const newAgentStates = newState.agent_states || {};

        // Diff against previous to detect changes + generate activities
        setState((prev: any) => {
          const prevStates = prev?.stateMatrix?.agent_states || prev?.agent_states || {};
          const changes: { id: string; from: string; to: string }[] = [];
          Object.entries(newAgentStates).forEach(([id, agent]: [string, any]) => {
            const prevAgent = prevStates[id];
            if (prevAgent) {
              if (prevAgent.status !== agent.status) {
                changes.push({ id, from: prevAgent.status, to: agent.status });
              }
            }
          });

          if (changes.length > 0) {
            for (const c of changes) {
              flashAgent(c.id);
              const short = c.id.replace('_agent', '').replace(/^0+/, '');
              if (c.to === 'awaiting_approval') {
                addActivity(c.id, `${short} awaiting approval`, `${short} completed compliance checks, needs human sign-off`, 'approval', 'warning');
              } else if (c.to === 'approved' || c.to === 'completed') {
                addActivity(c.id, `${short} approved ✓`, `${short} passed all gates and approved`, 'state_change', 'success');
              } else if (c.to === 'failed') {
                addActivity(c.id, `${short} failed ✗`, `${short} encountered an error`, 'error', 'error');
              } else if (c.to === 'active' || c.to === 'in_progress') {
                addActivity(c.id, `${short} running ▶`, `${short} started execution`, 'state_change', 'info');
              } else {
                addActivity(c.id, `${short}: ${c.from} → ${c.to}`, `State transition`, 'state_change', 'info');
              }
            }
          }

          return data;
        });
        setLastHeartbeat(Date.now());
      } catch { }
    });

    es.addEventListener('events', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (Array.isArray(data)) {
          data.forEach((evt: any) => {
            const short = (evt.agent_id || '').replace('_agent', '').replace(/^0+/, '');
            if (evt.type === 'agent_awaiting_approval') {
              addActivity(evt.agent_id, `${short} awaiting approval`, evt.notes?.slice(0, 80) || '', 'approval', 'warning');
              flashAgent(evt.agent_id);
            } else if (evt.type === 'compliance_failed') {
              addActivity(evt.agent_id, `${short} compliance failed`, evt.notes?.slice(0, 80) || '', 'error', 'error');
              flashAgent(evt.agent_id);
            }
          });
        }
      } catch { }
    });

    es.addEventListener('keepalive', () => {
      setLastHeartbeat(Date.now());
      setLiveConnected(true);
    });

    es.onerror = () => {
      setLiveConnected(false);
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => { }, 5000);
    };

    return () => { es.close(); clearTimeout(reconnectTimer); };
  }, [addActivity, flashAgent]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-scroll activity feed
  useEffect(() => {
    if (activityRef.current) activityRef.current.scrollTop = 0;
  }, [activities]);

  const loadState = useCallback(async () => {
    let done = false;
    setTimeout(() => { if (!done) { done = true; setLoading(false); } }, 10000);
    try {
      const res = await fetchWithTimeout('/api/agentic-console/state');
      if (!done) {
        const json = res.ok ? await res.json() : null;
        setState(json);
        setLiveConnected(true);
      }
    } catch { } finally {
      if (!done) { done = true; setLoading(false); }
    }
  }, []);

  useEffect(() => { loadState(); }, [loadState]);

  // Re-fetch state when page becomes visible or restored from bfcache
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadState(); };
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) loadState(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [loadState]);

  // Clear flyout inputs on agent change
  useEffect(() => {
    setFlyoutInputs({});
    setFlyoutInstruction('');
  }, [selectedFlyoutAgent]);

  // Safety check: if state loaded but has no agent_states, retry once
  useEffect(() => {
    if (loading || !state) return;
    const hasAgents = !!state?.stateMatrix?.agent_states || !!state?.agent_states;
    if (!hasAgents) {
      const timer = setTimeout(() => loadState(), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, state, loadState]);

  const handleFlyoutAction = async (action: string) => {
    const agentId = selectedFlyoutAgent;
    if (!agentId) return;
    setFlyoutActionLoading(action);
    try {
      const body: any = { agentId, action, feedback: flyoutInstruction || `${action} via Cockpit` };
      if (action === 'provide-input') {
        const agent = agentStates[agentId];
        const inputs = (agent as any)?.pending_inputs || [];
        const values: Record<string, string> = {};
        inputs.forEach((p: { key: string }, i: number) => {
          const val = flyoutInputs[`${agentId}-${i}`];
          if (val) values[p.key] = val;
        });
        body.inputs = values;
      }
      const endpoint = action === 'rerun' ? '/api/agentic-console/pipeline' : '/api/agentic-console/approve';
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { setTimeout(() => window.location.reload(), 1000); }
    } catch { }
    setFlyoutActionLoading(null);
  };

  const matrix = state?.stateMatrix || state;
  const agentStates: Record<string, AgentState> = matrix?.agent_states || {};
  const pipelineControl = matrix?.pipeline_control || {};
  const supervisorControl = matrix?.supervisor_control || {};
  const summary: DashboardSummary = pipelineControl?.dashboard_summary || {
    total_agents: 16, agents_completed: 8, agents_in_progress: 0, agents_pending: 5,
    agents_awaiting_review: 2, agents_awaiting_input: 0, agents_failed: 0, overall_progress_pct: 69, last_milestone: '',
  };
  const gates: ApprovalGate[] = supervisorControl?.approval_gates || [];
  const supervisor = agentStates['00_supervisor_agent'];
  const circuitBreaker = supervisorControl?.loop_guardrails;
  const isPaused = pipelineControl?.is_pipeline_paused;

  // ── LIVE COMPUTED SUMMARY ──
  const liveSummary = useMemo((): DashboardSummary => {
    const entries = Object.entries(agentStates);
    const completed = entries.filter(([, v]) => v.status === 'approved' || v.status === 'completed').length;
    const inProgress = entries.filter(([, v]) => v.status === 'active' || v.status === 'in_progress').length;
    const awaiting = entries.filter(([, v]) => v.status === 'awaiting_approval').length;
    const needsInput = entries.filter(([, v]) => v.status === 'awaiting_input').length;
    const failed = entries.filter(([, v]) => v.status === 'failed' || v.status === 'blocked').length;
    const pending = entries.filter(([, v]) => v.status === 'pending' || v.status === 'idle').length;
    const total = entries.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total_agents: total,
      agents_completed: completed,
      agents_in_progress: inProgress,
      agents_pending: pending,
      agents_awaiting_review: awaiting,
      agents_awaiting_input: needsInput,
      agents_failed: failed,
      overall_progress_pct: pct,
      last_milestone: summary.last_milestone,
    };
  }, [agentStates, summary.last_milestone]);

  // Use live if available, else fallback to static
  const effectiveSummary: DashboardSummary = liveSummary.total_agents > 0 ? liveSummary : summary;

  // Agent grouped by phase
  const agentsByPhase = useMemo(() => {
    const grouped: Record<string, (AgentState & { agent_id: string })[]> = {};
    PHASE_ORDER.forEach(p => grouped[p] = []);
    Object.entries(agentStates).forEach(([k, v]) => {
      const a = { ...v, agent_id: k };
      if (grouped[a.phase]) grouped[a.phase].push(a);
    });
    return grouped;
  }, [agentStates]);

  // Phase completion stats
  const phaseStats = useMemo(() => {
    const stats: Record<string, { total: number; done: number; active: number; awaiting: number }> = {};
    PHASE_ORDER.forEach(p => {
      const agents = agentsByPhase[p] || [];
      stats[p] = {
        total: agents.length,
        done: agents.filter(a => a.status === 'approved' || a.status === 'completed').length,
        active: agents.filter(a => a.status === 'active' || a.status === 'in_progress').length,
        awaiting: agents.filter(a => a.status === 'awaiting_approval').length,
      };
    });
    return stats;
  }, [agentsByPhase]);

  // Awaiting and failed agent lists
  const awaitingAgentList = useMemo(() => {
    return Object.entries(agentStates)
      .filter(([, v]) => v.status === 'awaiting_approval')
      .map(([k]) => k);
  }, [agentStates]);

  const inputNeededAgentList = useMemo(() => {
    return Object.entries(agentStates)
      .filter(([, v]) => v.status === 'awaiting_input')
      .map(([k]) => k);
  }, [agentStates]);

  const failedAgentList = useMemo(() => {
    return Object.entries(agentStates)
      .filter(([, v]) => v.status === 'failed' || v.status === 'blocked')
      .map(([k]) => k);
  }, [agentStates]);

  // Enhanced critical action that counts ALL agents
  const criticalAction = useMemo((): (CriticalAction & { count?: number; allIds?: string[] }) | null => {
    if (awaitingAgentList.length > 0) {
      const first = awaitingAgentList[0];
      const remaining = awaitingAgentList.length - 1;
      return {
        agentId: first,
        label: remaining > 0
          ? `${awaitingAgentList.length} agents awaiting approval`
          : `${first} awaiting approval`,
        type: 'approve',
        severity: 'high',
        count: awaitingAgentList.length,
        allIds: awaitingAgentList,
      };
    }
    if (inputNeededAgentList.length > 0) {
      const first = inputNeededAgentList[0];
      const remaining = inputNeededAgentList.length - 1;
      return {
        agentId: first,
        label: remaining > 0
          ? `${inputNeededAgentList.length} agents need input`
          : `${first} needs input`,
        type: 'fix',
        severity: 'medium',
        count: inputNeededAgentList.length,
        allIds: inputNeededAgentList,
      };
    }
    if (failedAgentList.length > 0) {
      const first = failedAgentList[0];
      const remaining = failedAgentList.length - 1;
      return {
        agentId: first,
        label: remaining > 0
          ? `${failedAgentList.length} agents need attention`
          : `${first} needs attention`,
        type: 'fix',
        severity: 'high',
        count: failedAgentList.length,
        allIds: failedAgentList,
      };
    }
    return null;
  }, [awaitingAgentList, failedAgentList]);

  const sortedAgentEntries = useMemo(() =>
    Object.entries(agentStates).map(([k, v]) => ({ ...v, agent_id: k })).sort((a, b) => {
      const pi = PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase);
      return pi !== 0 ? pi : a.agent_id.localeCompare(b.agent_id);
    }), [agentStates]);

  const activePhase = useMemo(() => {
    for (const p of PHASE_ORDER) {
      const s = phaseStats[p];
      if (!s || p === 'system') continue;
      if (s.awaiting > 0 || s.active > 0 || (s.done < s.total)) return p;
    }
    return PHASE_ORDER[1];
  }, [phaseStats]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-base text-gray-500">Loading Dashboard...</p>
      </div>
    );
  }

  const displayPhases = PHASE_ORDER.filter(p => p !== 'system');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100 gap-2 p-2">
      <style>{`
        @keyframes glow-pulse { 0%,100% { box-shadow:0 0 4px rgba(59,130,246,0.3); } 50% { box-shadow:0 0 12px rgba(59,130,246,0.6); } }
        @keyframes glow-amber { 0%,100% { box-shadow:0 0 4px rgba(245,158,11,0.3); } 50% { box-shadow:0 0 12px rgba(245,158,11,0.6); } }
        @keyframes glow-red { 0%,100% { box-shadow:0 0 4px rgba(220,38,38,0.3); } 50% { box-shadow:0 0 12px rgba(220,38,38,0.6); } }
        .live-pulse-blue { animation: glow-pulse 2s ease-in-out infinite; }
        .live-glow-amber { animation: glow-amber 2s ease-in-out infinite; }
        .live-glow-red { animation: glow-red 1.5s ease-in-out infinite; }
        .activity-enter { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>

      {/* ═══ Instrument Bar — Live Computed Summary ═══ */}
      <div className="bg-white rounded-xl shadow-sm border px-4 py-2.5 flex items-center gap-4 shrink-0 z-40">
        <div className="flex items-center gap-2.5 shrink-0">
          <ProgressRing pct={effectiveSummary.overall_progress_pct} size={34} />
          <div><div className="text-sm font-bold">{effectiveSummary.overall_progress_pct}%</div><div className="text-[10px] text-gray-400">Pipeline</div></div>
        </div>
        <div className="w-px h-7 bg-gray-200" />
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-500" /><span className="font-medium">{effectiveSummary.agents_completed}</span><span className="text-gray-400 text-[11px]">done</span></span>
          {effectiveSummary.agents_in_progress > 0 && <span className="flex items-center gap-1.5"><Loader2 size={12} className="text-blue-500 animate-spin" /><span className="font-medium text-blue-600">{effectiveSummary.agents_in_progress}</span><span className="text-gray-400 text-[11px]">active</span></span>}
          {effectiveSummary.agents_awaiting_review > 0 && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200"><AlertCircle size={12} className="text-amber-500 animate-pulse" /><span className="font-bold text-amber-600">{effectiveSummary.agents_awaiting_review}</span><span className="text-[11px] text-amber-500">awaiting</span></span>}
          {(effectiveSummary as any).agents_awaiting_input > 0 && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200"><Loader2 size={12} className="text-purple-500 animate-pulse" /><span className="font-bold text-purple-600">{(effectiveSummary as any).agents_awaiting_input}</span><span className="text-[11px] text-purple-500">input</span></span>}
          {effectiveSummary.agents_failed > 0 && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-200"><XCircle size={12} className="text-red-500" /><span className="font-bold text-red-600">{effectiveSummary.agents_failed}</span><span className="text-[11px] text-red-500">failed</span></span>}
        </div>
        <div className="w-px h-7 bg-gray-200" />
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <Shield size={13} />
          <span>{gates.filter(g => g.approved).length}/{gates.length} gates</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2.5 text-[11px]">
          <span className={`flex items-center gap-1.5 ${liveConnected ? 'text-green-600' : 'text-red-500'}`}>
            <span className={`w-2 h-2 rounded-full ${liveConnected ? 'bg-green-500 pulse-dot' : 'bg-red-500'}`} />
            {liveConnected ? 'LIVE' : 'OFFLINE'}
          </span>
          {isPaused && <span className="flex items-center gap-1 text-amber-600 font-bold">⏸ PAUSED</span>}
          <button onClick={() => window.location.reload()} className="text-gray-300 hover:text-gray-500"><RefreshCw size={13} /></button>
          <div ref={notifRef} className="relative">
            <button onClick={() => setNotifOpen(o => !o)} className={`relative p-1.5 rounded-lg transition-all hover:bg-gray-100 ${notifOpen ? 'bg-gray-100' : ''}`}>
              <Bell size={14} className={notifOpen ? 'text-indigo-600' : 'text-gray-400'} />
              {(effectiveSummary.agents_awaiting_review + (effectiveSummary as any).agents_awaiting_input + effectiveSummary.agents_failed) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center">
                  {effectiveSummary.agents_awaiting_review + (effectiveSummary as any).agents_awaiting_input + effectiveSummary.agents_failed}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 border-b bg-gray-50 text-[11px] font-bold text-gray-700 flex items-center gap-2">
                  <Bell size={12} /> Alerts
                </div>
                <div className="max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {awaitingAgentList.map(id => (
                    <div key={id} className="px-3 py-2 border-b last:border-0 hover:bg-amber-50 cursor-pointer text-[11px] flex items-center gap-2"
                      onClick={() => { router.push(`/agentic-console/agents/${id}`); setNotifOpen(false); }}>
                      <AlertCircle size={12} className="text-amber-500 shrink-0 animate-pulse" />
                      <span className="font-medium truncate">{id.replace('_agent', '').replace(/^0+/, '')}</span>
                      <span className="ml-auto text-amber-600 font-semibold text-[10px]">Awaiting</span>
                    </div>
                  ))}
                  {inputNeededAgentList.map(id => {
                    const agent = agentStates[id];
                    const inputs = agent?.pending_inputs || [];
                    return (
                      <div key={id} className="px-3 py-2 border-b last:border-0 hover:bg-purple-50 cursor-pointer text-[11px] flex items-center gap-2"
                        onClick={() => { setSelectedFlyoutAgent(id); setNotifOpen(false); }}>
                        <Loader2 size={12} className="text-purple-500 shrink-0 animate-pulse" />
                        <span className="font-medium truncate">{id.replace('_agent', '').replace(/^0+/, '')}</span>
                        <span className="ml-auto text-purple-600 font-semibold text-[10px]">{inputs.length} input{inputs.length > 1 ? 's' : ''}</span>
                      </div>
                    );
                  })}
                  {failedAgentList.map(id => (
                    <div key={id} className="px-3 py-2 border-b last:border-0 hover:bg-red-50 cursor-pointer text-[11px] flex items-center gap-2"
                      onClick={() => { router.push(`/agentic-console/agents/${id}`); setNotifOpen(false); }}>
                      <XCircle size={12} className="text-red-500 shrink-0" />
                      <span className="font-medium truncate">{id.replace('_agent', '').replace(/^0+/, '')}</span>
                      <span className="ml-auto text-red-600 font-semibold text-[10px]">Failed</span>
                    </div>
                  ))}
                  {effectiveSummary.agents_awaiting_review + (effectiveSummary as any).agents_awaiting_input + effectiveSummary.agents_failed === 0 && (
                    <div className="px-3 py-6 text-center text-[11px] text-gray-400">
                      <CheckCircle size={16} className="mx-auto mb-1.5 text-green-400" />
                      No alerts — all agents nominal
                    </div>
                  )}
                </div>
                <div className="px-3 py-1.5 border-t bg-gray-50 text-[10px] text-gray-400 text-center">
                  {effectiveSummary.agents_completed} completed · {effectiveSummary.agents_in_progress} active
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Pipeline Flow Container ═══ */}
      <div className="bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden flex-1 min-h-0">
        {/* ═══ Agent 00 Supervisor Banner ═══ */}
        <div className="bg-gradient-to-r from-indigo-900/5 to-indigo-700/5 border-b border-indigo-200 shrink-0">
          <div className="flex items-center px-4 py-2 gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
              <Shield size={16} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
              <span className="text-[12px] font-bold text-indigo-900">Agent 00 — Supervisor / Orchestrator</span>
              <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">Sr. Program Manager</span>
              <StatusDot status={supervisor?.status || 'idle'} size={7} />
              <span className="text-[10px] text-indigo-600 font-medium capitalize">{supervisor?.status || 'idle'}</span>
              <span className="text-[9px] text-indigo-400">· Cycles: {supervisor?.execution_count || 0}/3</span>
              <span className={`text-[9px] ${circuitBreaker?.circuit_breaker_tripped_at ? 'text-red-500 font-bold' : 'text-green-600'}`}>
                Circuit: {circuitBreaker?.circuit_breaker_tripped_at ? 'TRIPPED' : 'Closed'}
              </span>
              <span className="text-[9px] text-indigo-400">· {Math.floor((Date.now() - lastHeartbeat) / 1000)}s ago</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className={`flex items-center gap-1 ${liveConnected ? 'text-green-600' : 'text-red-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${liveConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {liveConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ Orchestrator Status + NOW / Live Feed Row ═══ */}
        <div className="border-b shrink-0">
          <div className="flex items-stretch">
            {/* Left: Live Feed (pills) */}
            <div className="flex-1 flex items-center gap-1.5 px-3 py-2 min-w-0 overflow-hidden border-r border-gray-100">
              <span className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider shrink-0 ${liveConnected ? 'text-green-600' : 'text-gray-400'}`}>
                <span className={`w-2 h-2 rounded-full ${liveConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                LIVE
              </span>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              <div ref={activityRef} className="flex items-center gap-2 overflow-x-auto min-w-0" style={{ scrollbarWidth: 'none' }}>
                {activities.length === 0 ? (
                  <span className="text-[11px] text-gray-400 italic">Pipeline standby — awaiting execution...</span>
                ) : (
                  activities.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center gap-1.5 text-[10px] whitespace-nowrap shrink-0 px-2 py-1 rounded-md border activity-enter" style={{
                      backgroundColor: a.severity === 'error' ? '#FEF2F2' : a.severity === 'warning' ? '#FFFBEB' : a.severity === 'success' ? '#F0FDF4' : '#EFF6FF',
                      borderColor: a.severity === 'error' ? '#FECACA' : a.severity === 'warning' ? '#FDE68A' : a.severity === 'success' ? '#BBF7D0' : '#BFDBFE',
                    }}>
                      <span className="font-medium truncate max-w-[140px]" style={{
                        color: a.severity === 'error' ? '#DC2626' : a.severity === 'warning' ? '#F59E0B' : a.severity === 'success' ? '#16A34A' : '#3B82F6',
                      }}>{a.action}</span>
                    </div>
                  ))
                )}
                {activities.length > 5 && <span className="text-[9px] text-gray-400 shrink-0">+{activities.length - 5}</span>}
              </div>
            </div>

            {/* Right: NOW box */}
            <div className="w-[340px] shrink-0 border-l-2 border-indigo-100 bg-indigo-50/20 px-3.5 py-2.5">
              <div className="flex items-start gap-2.5">
                <div className={`flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider shrink-0 ${activities.length > 0 ? 'text-indigo-700' : 'text-gray-400'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${activities.length > 0 ? 'bg-indigo-500 animate-pulse' : 'bg-gray-300'}`} />
                  NOW
                </div>
                <div className="flex-1 min-w-0">
                  {activities.length > 0 ? (
                    <>
                      <div className="text-[12px] font-semibold text-indigo-800 truncate activity-enter">{activities[0].action}</div>
                      <div className="text-[11px] text-indigo-600 line-clamp-2 leading-snug mt-0.5">{activities[0].detail}</div>
                    </>
                  ) : (
                    <div className="text-[11px] text-gray-500">
                      <div className="font-medium text-gray-700">Pipeline Orchestrator Standby</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Awaiting dispatch from Agent 00 — no agents currently executing.</div>
                    </div>
                  )}
                  {activities.length > 1 && (
                    <div className="text-[10px] text-gray-500 mt-1 pt-1 border-t border-indigo-100 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                      <span className="truncate">{activities[1].action} — {activities[1].detail.slice(0, 60)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 5 Phase Columns — Compact ═══ */}
        <div className="flex-1 min-h-0 px-2 py-1.5 overflow-hidden">
          <div className="grid grid-cols-5 gap-2 h-full">
            {displayPhases.map(phase => {
              const stats = phaseStats[phase] || { total: 0, done: 0, active: 0, awaiting: 0 };
              const agents = agentsByPhase[phase] || [];
              const color = PHASE_COLORS[phase] || '#6B7280';
              const label = PHASE_LABELS[phase] || phase;
              const isActive = stats.awaiting > 0 || stats.active > 0;
              const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

              return (
                <div key={phase} className={`flex flex-col rounded-lg border bg-white overflow-hidden ${isActive ? 'ring-1' : ''}`}
                  style={{ borderColor: color + '40', ...(isActive ? { boxShadow: `0 0 6px ${color}20` } : {}) }}>
                  {/* Phase Header */}
                  <div className="px-2.5 py-1.5 border-b flex items-center gap-1.5 shrink-0" style={{ borderBottomColor: color + '30' }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold leading-tight" style={{ color }}>{label}</div>
                    </div>
                    <span className="text-[10px] font-mono font-medium shrink-0 ml-1" style={{ color: pct === 100 ? '#16A34A' : color }}>
                      {stats.done}/{stats.total}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-gray-100 shrink-0">
                    <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#16A34A' : color }} />
                  </div>
                  {/* Agent cards */}
                  <div className="overflow-y-auto px-2 py-1.5 space-y-1" style={{ scrollbarWidth: 'none' }}>
                    {agents.map(a => (
                      <AgentMiniCard
                        key={a.agent_id}
                        agent={a}
                        flashing={flashAgentIds.has(a.agent_id)}
                        onClick={() => setSelectedFlyoutAgent(a.agent_id)}
                      />
                    ))}
                    {agents.length === 0 && <div className="text-[10px] text-gray-300 italic text-center py-3">No agents</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Bottom Attention Bar — shows ALL awaiting/failed agents ═══ */}
      {criticalAction && (
        <div className={`shrink-0 border-t-2 px-4 py-3 flex items-center gap-4 ${criticalAction.type === 'approve' ? 'bg-amber-50 border-amber-400' : 'bg-red-50 border-red-400'
          }`}>
          <div className="flex items-center gap-3">
            {criticalAction.type === 'approve'
              ? <AlertCircle size={20} className="text-amber-500 animate-pulse" />
              : <AlertTriangle size={20} className="text-red-500 animate-pulse" />
            }
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>Attention Required</span>
                {criticalAction.count && criticalAction.count > 1 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${criticalAction.type === 'approve' ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'
                    }`}>
                    {criticalAction.count} agents
                  </span>
                )}
              </div>
              <div className={`text-[11px] ${criticalAction.type === 'approve' ? 'text-amber-600' : 'text-red-600'}`}>
                {criticalAction.label}
              </div>
              {/* Show all awaiting/failed agent chips */}
              {criticalAction.allIds && criticalAction.allIds.length > 1 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {criticalAction.allIds.map(id => (
                    <button key={id} onClick={() => setSelectedFlyoutAgent(id)}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-white/60 hover:bg-white transition-colors cursor-pointer"
                      style={{
                        borderColor: criticalAction.type === 'approve' ? '#FCD34D' : '#FCA5A5',
                        color: criticalAction.type === 'approve' ? '#92400E' : '#991B1B',
                      }}>
                      {id.replace('_agent', '')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1" />
          <button onClick={() => setSelectedFlyoutAgent(criticalAction.agentId)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all active:scale-[0.97] shadow-sm ${criticalAction.type === 'approve' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-red-500 text-white hover:bg-red-600'
              }`}>
            {criticalAction.type === 'approve' ? 'Review & Approve' : 'Review Issue'}
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ═══ Flyout: Instrument Panel ═══ */}
      {selectedFlyoutAgent && (() => {
        const agent = agentStates[selectedFlyoutAgent];
        if (!agent) return null;
        const passed = agent.compliance_checklist?.filter(c => c.passed).length || 0;
        const total = agent.compliance_checklist?.length || 0;
        const awaiting = agent.status === 'awaiting_approval';
        const circuitTripped = agent.execution_count >= 3 || agent.status === 'blocked';
        const iconName = AGENT_ICONS_MAP[selectedFlyoutAgent] || 'Bot';
        const ICON_MAP: Record<string, React.ElementType> = { Shield, Bot, Activity, FileText, CheckCircle, Monitor: Monitor, Code: Code, Database: Database, Layers: Layers, Server: Server, Globe: Globe, BookOpen: BookOpen, UserCheck: UserCheck, Camera: Camera, Settings: Settings, Coins: Coins, Lock: Lock, Lightbulb: Lightbulb, Layout: Layout, Truck: Truck, GitMerge: GitMerge };
        const Icon = ICON_MAP[iconName] || Bot;
        const failedChecks = agent.compliance_checklist?.filter(c => !c.passed && c.required) || [];
        return (
          <>
            <div className="fixed inset-0 bg-black/20 z-50" onClick={() => setSelectedFlyoutAgent(null)} />
            <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto border-l">
              <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: PHASE_COLORS[agent.phase] + '15' }}>
                    <Icon size={16} style={{ color: PHASE_COLORS[agent.phase] }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{selectedFlyoutAgent}</h3>
                    <p className="text-[9px] text-gray-400">{agent.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-medium"
                    style={{ backgroundColor: PHASE_COLORS[agent.phase] + '12', color: PHASE_COLORS[agent.phase] }}>
                    <StatusDot status={agent.status} size={6} />
                    {(PHASE_LABELS[agent.phase] || agent.phase).split(':')[0]}
                  </div>
                  <button onClick={() => setSelectedFlyoutAgent(null)} className="text-gray-300 hover:text-gray-500"><X size={16} /></button>
                </div>
              </div>

              <div className="p-4 space-y-3.5">
                {/* ── Status Indicators ── */}
                <div>
                  <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Status Indicators</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {agent.compliance_checklist?.slice(0, 8).map((c: ComplianceCheck) => (
                      <div key={c.id} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[10px] border transition-all ${c.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`relative w-5 h-3 rounded-full transition-colors ${c.passed ? 'bg-green-400' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white shadow-sm transition-all ${c.passed ? 'left-2.5' : 'left-0.5'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-700 truncate">{c.check}</div>
                          <div className={`text-[8px] ${c.passed ? 'text-green-500' : 'text-red-400'}`}>{c.passed ? 'PASS' : 'FAIL'}</div>
                        </div>
                      </div>
                    ))}
                    {total === 0 && <div className="col-span-2 text-[9px] text-gray-400 italic p-2">No compliance checks defined</div>}
                  </div>
                </div>

                {/* ── Run Configuration ── */}
                <div>
                  <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Run Configuration</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-gray-50 rounded-lg px-2.5 py-2 border">
                      <div className="text-[8px] text-gray-400 uppercase tracking-wide mb-1">Executions</div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= agent.execution_count ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                        ))}
                        <span className="text-[10px] font-bold text-gray-600 ml-1">{agent.execution_count}/3</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-2 border">
                      <div className="text-[8px] text-gray-400 uppercase tracking-wide mb-1">Pool</div>
                      <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block ${agent.pool === 'sync_pool' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {agent.pool === 'sync_pool' ? 'Sync' : 'Async'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-2 border">
                      <div className="text-[8px] text-gray-400 uppercase tracking-wide mb-1">HITL Gate</div>
                      <div className={`relative w-7 h-3.5 rounded-full transition-colors ${agent.requires_human_approval ? 'bg-amber-400' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-all ${agent.requires_human_approval ? 'left-4' : 'left-0.5'}`} />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-2 border">
                      <div className="text-[8px] text-gray-400 uppercase tracking-wide mb-1">Circuit</div>
                      <div className={`relative w-7 h-3.5 rounded-full transition-colors ${circuitTripped ? 'bg-red-400' : 'bg-green-400'}`}>
                        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-all ${circuitTripped ? 'left-4' : 'left-0.5'}`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Alerts ── */}
                {(failedChecks.length > 0 || agent.last_error) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-[8px] font-semibold text-amber-600 uppercase tracking-widest mb-1.5">
                      <AlertTriangle size={10} className="inline mr-1" /> Attention Required
                    </p>
                    {failedChecks.slice(0, 3).map(c => (
                      <div key={c.id} className="flex items-start gap-1.5 text-[10px] text-amber-700">
                        <XCircle size={9} className="mt-0.5 shrink-0 text-red-400" />
                        <span>{c.check}</span>
                      </div>
                    ))}
                    {agent.last_error && (
                      <div className="flex items-start gap-1.5 text-[10px] text-red-600">
                        <AlertTriangle size={9} className="mt-0.5 shrink-0" />
                        <span className="italic">{agent.last_error}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Pending Inputs ── */}
                {(agent as any).pending_inputs?.length > 0 && agent.status === 'awaiting_input' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                    <p className="text-[8px] font-semibold text-purple-600 uppercase tracking-widest mb-2">
                      <Loader2 size={10} className="inline mr-1 animate-pulse" /> Input Required
                    </p>
                    <div className="space-y-2">
                      {(agent as any).pending_inputs.map((p: { key: string; description: string; secret?: boolean }, i: number) => (
                        <div key={p.key}>
                          <label className="text-[10px] font-medium text-purple-700 block mb-0.5">{p.description || p.key}</label>
                          <input
                            type={p.secret ? 'password' : 'text'}
                            value={flyoutInputs[`${selectedFlyoutAgent}-${i}`] || ''}
                            onChange={e => setFlyoutInputs(prev => ({ ...prev, [`${selectedFlyoutAgent}-${i}`]: e.target.value }))}
                            placeholder={p.secret ? '••••••••' : `Enter ${p.key}...`}
                            className="w-full border border-purple-200 rounded-lg px-3 py-1.5 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-purple-300" />
                        </div>
                      ))}
                      <button onClick={() => handleFlyoutAction('provide-input')}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all active:scale-[0.97] mt-2">
                        {flyoutActionLoading === 'provide-input' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={14} />} Submit Inputs
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Dependencies Strip ── */}
                {agent.dependencies?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] text-gray-400 uppercase tracking-wider mr-0.5">Deps:</span>
                    {agent.dependencies.map((depId: string) => {
                      const dep = agentStates[depId];
                      const met = dep?.status === 'approved' || dep?.status === 'completed';
                      return (
                        <button key={depId} onClick={() => setSelectedFlyoutAgent(depId)}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors ${met ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                            }`}>
                          <div className={`w-1 h-1 rounded-full ${met ? 'bg-green-500' : 'bg-amber-500'}`} />
                          {depId.split('_')[0]}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── Actions ── */}
                <div className="border-t pt-3 space-y-2">
                  {awaiting && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button onClick={() => handleFlyoutAction('approve')}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all active:scale-[0.97]">
                          {flyoutActionLoading === 'approve' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                        </button>
                        <button onClick={() => handleFlyoutAction('reject')}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-white border border-red-300 text-red-600 hover:bg-red-50 transition-all active:scale-[0.97]">
                          {flyoutActionLoading === 'reject' ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={14} />} Reject
                        </button>
                      </div>
                      <input type="text" value={flyoutInstruction} onChange={e => setFlyoutInstruction(e.target.value)}
                        placeholder="Add feedback note..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:bg-white" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => { router.push(`/agentic-console/agents/${selectedFlyoutAgent}`); setSelectedFlyoutAgent(null); }}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all active:scale-[0.97]">
                      <ExternalLink size={12} /> Full Details
                    </button>
                    <button onClick={() => handleFlyoutAction('rerun')}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.97]">
                      {flyoutActionLoading === 'rerun' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Rerun
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Send, FileText, MessageSquare, Server, Shield, Bot, Play, Clock,
  Radio, Download, Eye, BookOpen, Code, Terminal, Users, Activity,
  Database, ExternalLink, GitPullRequest, Bug,
} from 'lucide-react';
import { StatusBadge, fetchWithTimeout, PHASE_LABELS } from '../../shared';

function PassRateBar({ pct, height = 6 }: { pct: number; height?: number }) {
  const color = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="w-full bg-gray-200 rounded-full" style={{ height }}>
      <div className={`${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%`, height }} />
    </div>
  );
}

type TabId = 'overview' | 'prompts' | 'artifacts' | 'logs' | 'comm' | 'mcp' | 'product-qa';
const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'prompts', label: 'Prompts', icon: BookOpen },
  { id: 'artifacts', label: 'Artifacts', icon: FileText },
  { id: 'logs', label: 'Run Logs', icon: Terminal },
  { id: 'comm', label: 'Comm', icon: MessageSquare },
  { id: 'mcp', label: 'MCP Tools', icon: Server },
  { id: 'product-qa', label: 'Product QA', icon: Bug },
];

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [toast, setToast] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [instruction, setInstruction] = useState('');
  const [a2aTypeFilter, setA2aTypeFilter] = useState('all');
  const [composingA2aType, setComposingA2aType] = useState('');
  const [composingPayload, setComposingPayload] = useState('');
  const [a2aTo, setA2aTo] = useState('');
  const [memoryEntries, setMemoryEntries] = useState<any[]>([]);
  const [injectMemory, setInjectMemory] = useState(false);
  const [newMemory, setNewMemory] = useState('');
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [newVersion, setNewVersion] = useState('');
  const [versionCompatibility, setVersionCompatibility] = useState('backward-compatible');
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [codeReviews, setCodeReviews] = useState<any[]>([]);
  const [prLink, setPrLink] = useState<string | null>(null);
  const [codeReviewLoading, setCodeReviewLoading] = useState(true);
  const [showTrace, setShowTrace] = useState(false);
  const [traces, setTraces] = useState<any[]>([]);
  const [lifecycleData, setLifecycleData] = useState<any>(null);
  const [productQA, setProductQA] = useState<any>(null);
  const [productQLoading, setProductQLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [expandedIterations, setExpandedIterations] = useState<Set<string>>(new Set());

  const toggleStep = (id: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleIteration = (id: string) => {
    setExpandedIterations(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const loadTraces = useCallback(async () => {
    try {
      const r = await fetch(`/api/agentic-console/traces?agentId=${agentId}`);
      if (r.ok) { const d = await r.json(); setTraces(d.traces || []); }
    } catch {}
  }, [agentId]);

  const loadProductQA = useCallback(async () => {
    setProductQLoading(true);
    try {
      const res = await fetch('/api/qa/results?project=petemart');
      if (res.ok) {
        const json = await res.json();
        setProductQA(json);
      }
    } catch {}
    setProductQLoading(false);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!agentId) return;
    loadProductQA();
    const es = new EventSource('/api/agentic-console/events');
    const load = async () => {
      try {
        const [detailRes, msgRes] = await Promise.all([
          fetchWithTimeout(`/api/agentic-console/agent-detail?agentId=${agentId}`, 10000),
          fetch(`/api/agentic-console/agent-messages?agentId=${agentId}&a2aType=${a2aTypeFilter}`),
        ]);
        const detail = await detailRes.json();
        setData(detail);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData.messages || []);
        }
      } catch { showToast('Failed to load agent detail'); }
      setLoading(false);
    };
    load();

    const loadCodeReviews = async () => {
      try {
        const prRes = await fetch('/api/agentic-console/pull-requests');
        const prData = await prRes.json();
        const pr = (prData.pull_requests || []).find((p: any) => agentId && p.branch?.includes(agentId.replace(/_/g, '-')));
        if (pr) {
          setPrLink(pr.url);
          const reviewRes = await fetch(`/api/agentic-console/code-reviews?pr_number=${pr.number}`);
          const reviewData = await reviewRes.json();
          setCodeReviews(reviewData.reviews || []);
        }
      } catch { /* no code review data */ }
      setCodeReviewLoading(false);
    };
    loadCodeReviews();

    es.addEventListener('state_snapshot', (e: MessageEvent) => {
      const sd = JSON.parse(e.data);
      const updated = sd.stateMatrix?.agent_states?.[agentId];
      if (updated) setData((prev: any) => ({ ...prev, agentState: updated }));
    });
    es.addEventListener('state_update', (e: MessageEvent) => {
      const sd = JSON.parse(e.data);
      const updated = sd.stateMatrix?.agent_states?.[agentId];
      if (updated) setData((prev: any) => ({ ...prev, agentState: updated }));
    });

    return () => { es.close(); };
  }, [agentId]);

  // Fetch lifecycle data
  useEffect(() => {
    if (!agentId) return;
    let cancelled = false;
    const fetchLifecycle = async () => {
      try {
        const res = await fetch(`/api/agentic-console/agent-lifecycle?agentId=${agentId}`);
        if (res.ok && !cancelled) setLifecycleData(await res.json());
      } catch {}
    };
    fetchLifecycle();
    const iv = setInterval(fetchLifecycle, 3000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [agentId]);

  const agent = data?.agentState;
  const registry = data?.registryEntry;
  const systemPrompt = data?.systemPrompt || '';
  const artifactStatus = data?.artifactStatus || [];
  const consumedArtifacts = data?.consumedArtifacts || [];
  const agentMcpServers = data?.agentMcpServers || [];
  const lastError = data?.lastError;
  const agentStates: Record<string, any> = data?.stateMatrix?.agent_states || {};

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      const isPipelineAction = action === 'rerun' || action === 'cancel';
      const endpoint = isPipelineAction ? '/api/agentic-console/pipeline' : '/api/agentic-console/approve';
      const body = isPipelineAction
        ? JSON.stringify({ action: action === 'rerun' ? 'rerun_agent' : 'cancel_agent', agentId })
        : JSON.stringify({ agentId, action, feedback: instruction || `${action} via Agent Detail` });
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (res.ok) {
        showToast(`${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : action === 'cancel' ? 'Cancelled' : 'Queued'} ${agentId}`);
        setInstruction('');
        if (action === 'rerun' || action === 'cancel') setTimeout(() => window.location.reload(), 1000);
      }
    } catch { showToast('Action failed'); }
    setActionLoading(null);
  };

  const sendMessage = async () => {
    if (!instruction.trim()) return;
    try {
      const res = await fetch('/api/agentic-console/agent-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_agent: 'human_gatekeeper', to_agent: agentId, subject: 'Instruction from Console', body: instruction }),
      });
      // Also append to agent's user_instruction in state
      await fetch('/api/agentic-console/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, action: 'add_instruction', feedback: instruction }),
      });
      if (res.ok) {
        showToast('Instruction sent and attached to agent');
        setInstruction('');
      }
    } catch { showToast('Failed to send'); }
  };

  const sendA2aMessage = async () => {
    if (!a2aTo || !composingA2aType || !instruction.trim()) return;
    try {
      let payload: any = {};
      try { payload = composingPayload ? JSON.parse(composingPayload) : {}; } catch { payload = { body: composingPayload }; }
      const res = await fetch('/api/agentic-console/agent-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_agent: agentId,
          to_agent: a2aTo,
          subject: instruction,
          body: composingPayload,
          a2a_type: composingA2aType,
          a2a_payload: payload,
        }),
      });
      if (res.ok) {
        showToast(`A2A ${composingA2aType} sent to ${a2aTo}`);
        setInstruction(''); setComposingPayload(''); setComposingA2aType(''); setA2aTo('');
        const msgRes = await fetch(`/api/agentic-console/agent-messages?agentId=${agentId}&a2aType=${a2aTypeFilter}`);
        if (msgRes.ok) { const d = await msgRes.json(); setMessages(d.messages || []); }
      }
    } catch { showToast('Failed to send A2A message'); }
  };

  const loadMemory = useCallback(async () => {
    try {
      const r = await fetch(`/api/agentic-console/agent-memory?agentId=${agentId}`);
      if (r.ok) { const d = await r.json(); setMemoryEntries(d.entries || []); }
    } catch {}
  }, [agentId]);

  const addMemory = async () => {
    if (!newMemory.trim()) return;
    try {
      const r = await fetch('/api/agentic-console/agent-memory', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, content: newMemory, source: 'human_gatekeeper' }),
      });
      if (r.ok) { setNewMemory(''); loadMemory(); showToast('Memory added'); }
    } catch { showToast('Failed to add memory'); }
  };

  useEffect(() => { if (agentId) loadMemory(); }, [agentId, loadMemory]);

  const loadVersion = useCallback(async () => {
    try {
      const r = await fetch(`/api/agentic-console/agent-version?agentId=${agentId}`);
      if (r.ok) setVersionInfo(await r.json());
    } catch {}
  }, [agentId]);

  const updateVersion = async () => {
    if (!newVersion.trim()) return;
    try {
      const r = await fetch('/api/agentic-console/agent-version', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, output_version: parseInt(newVersion) || newVersion, compatibility: versionCompatibility }),
      });
      if (r.ok) { showToast(`Version updated`); setNewVersion(''); loadVersion(); }
    } catch { showToast('Failed to update version'); }
  };

  useEffect(() => { if (agentId) loadVersion(); }, [agentId, loadVersion]);

  const loadSnapshots = useCallback(async () => {
    try {
      const r = await fetch(`/api/agentic-console/prompt-snapshots?agentId=${agentId}`);
      if (r.ok) { const d = await r.json(); setSnapshots(d.snapshots || []); }
    } catch {}
  }, [agentId]);

  const saveSnapshot = async () => {
    try {
      await fetch('/api/agentic-console/prompt-snapshots', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, system_prompt: systemPrompt, config: { role: agent?.role, pool: agent?.pool, phase: agent?.phase } }),
      });
      showToast('Snapshot saved');
      loadSnapshots();
    } catch { showToast('Failed to save snapshot'); }
  };

  useEffect(() => { if (agentId) loadSnapshots(); }, [agentId, loadSnapshots]);

  if (loading) {
    return <div className="text-center py-20"><Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-4" /><p className="text-gray-500">Loading agent detail...</p></div>;
  }

  if (!agent) {
    return <div className="text-center py-20"><AlertTriangle size={32} className="text-red-400 mx-auto mb-4" /><p className="text-gray-500">Agent not found</p></div>;
  }

  const passedCompliance = agent.compliance_checklist?.filter((c: any) => c.passed).length || 0;
  const totalCompliance = agent.compliance_checklist?.length || 0;
  const allArtifactsExist = artifactStatus.filter((a: any) => a.exists).length;
  const totalArtifacts = artifactStatus.length;

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white text-xs px-4 py-2 rounded-lg shadow-lg">{toast}</div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-5 py-3">
          <button onClick={() => router.push('/agentic-console/agents')}
            className="text-indigo-200 hover:text-white text-xs flex items-center gap-1 mb-2">
            <ArrowLeft size={12} /> Back to Agents
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">{agentId}</h1>
              <p className="text-indigo-200 text-xs">{agent.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={agent.status} />
              <span className="text-[10px] text-indigo-200 px-2 py-0.5 rounded-full bg-white/10">
                v{agent.execution_count}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-px bg-gray-100">
          {[
            { label: 'Phase', value: PHASE_LABELS[agent.phase]?.split(':')[0] || agent.phase },
            { label: 'Pool', value: agent.pool === 'sync_pool' ? 'Sync' : 'Async' },
            { label: 'Executions', value: String(agent.execution_count) },
            { label: 'Compliance', value: `${passedCompliance}/${totalCompliance}` },
            { label: 'Artifacts', value: `${allArtifactsExist}/${totalArtifacts}` },
            { label: 'HITL', value: agent.requires_human_approval ? 'Yes' : 'No' },
          ].map((stat, i) => (
            <div key={i} className="bg-white px-4 py-2 text-center">
              <div className="text-[18px] font-bold text-gray-700">{stat.value}</div>
              <div className="text-[9px] text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Error Banner */}
      {lastError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <div className="text-xs text-red-700">{lastError}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                  active ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Dependencies */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Users size={12} /> Dependencies
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(agent.dependencies || []).length > 0 ? agent.dependencies.map((d: string) => {
                    const depState = data?.consumedArtifacts?.find((c: any) => c.depId === d);
                    const status = depState?.status || 'unknown';
                    const met = status === 'approved' || status === 'completed';
                    return (
                      <div key={d} className={`border rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 ${
                        met ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <span className="font-mono text-[10px]">{d}</span>
                        <span className={`text-[9px] ${met ? 'text-green-600' : 'text-amber-600'}`}>
                          {met ? '✓' : '⏳'} {status}
                        </span>
                      </div>
                    );
                  }) : <span className="text-xs text-gray-400">Root agent — no dependencies</span>}
                </div>
              </div>

              {/* Compliance Checklist */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Shield size={12} /> Compliance ({passedCompliance}/{totalCompliance})
                </h3>
                <div className="space-y-0.5 max-h-80 overflow-y-auto">
                  {agent.compliance_checklist?.map((c: any) => (
                    <div key={c.id} className={`flex items-start gap-2 px-2.5 py-1.5 rounded text-xs ${
                      c.passed ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {c.passed
                        ? <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                        : <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono text-gray-400">{c.id}</span>
                          {c.required && <span className="text-[8px] text-gray-400 px-1 rounded bg-gray-100">required</span>}
                        </div>
                        <p className="text-[11px] text-gray-700 mt-0.5">{c.check}</p>
                        {c.compliance_audit_note && (
                          <p className="text-[9px] text-gray-500 italic mt-0.5">{c.compliance_audit_note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expert Reviewer */}
              {agent.expert_reviewer && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                    <Activity size={12} /> Expert Reviewer
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{agent.expert_reviewer.role_title}</span>
                      <StatusBadge status={agent.expert_reviewer.review_status} />
                    </div>
                    {agent.expert_reviewer.reviewed_by && (
                      <p className="text-[10px] text-gray-500">By: {agent.expert_reviewer.reviewed_by}</p>
                    )}
                    {agent.expert_reviewer.review_feedback?.length > 0 && (
                      <div className="space-y-1 mt-1">
                        {agent.expert_reviewer.review_feedback.map((f: string, i: number) => (
                          <p key={i} className="text-[10px] text-gray-600 italic border-l-2 border-indigo-300 pl-2">&ldquo;{f}&rdquo;</p>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[9px] text-gray-400">
                      <span>Sign-off: {agent.expert_reviewer.sign_off_required ? 'Required' : 'Not required'}</span>
                      <span>·</span>
                      <span>Granted: {agent.expert_reviewer.sign_off_granted ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Guardrails */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Shield size={12} /> Guardrails & Controls
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Execution Count', value: `${agent.execution_count}/3 max` },
                    { label: 'Pool Type', value: agent.pool === 'sync_pool' ? 'Synchronous (sequential)' : 'Asynchronous (parallel)' },
                    { label: 'HITL Required', value: agent.requires_human_approval ? 'Yes' : 'No' },
                    { label: 'Last Activity', value: agent.last_activity_timestamp ? new Date(agent.last_activity_timestamp).toLocaleString() : 'Never' },
                  ].map((g, i) => (
                    <div key={i} className="border rounded-lg px-3 py-2 text-xs">
                      <div className="text-[9px] text-gray-400">{g.label}</div>
                      <div className="font-medium text-gray-700 text-[11px]">{g.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent Memory */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Database size={12} /> Agent Memory
                  <label className="ml-auto flex items-center gap-1 text-[9px] text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={injectMemory} onChange={e => setInjectMemory(e.target.checked)} className="w-3 h-3" />
                    Inject into prompt
                  </label>
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-1.5 flex items-center gap-2 border-b">
                    <span className="text-[10px] text-gray-500">{memoryEntries.length} entries</span>
                    <button onClick={loadMemory} className="ml-auto text-[9px] text-indigo-600 hover:underline">Refresh</button>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y">
                    {memoryEntries.length === 0 ? (
                      <p className="text-[10px] text-gray-400 text-center py-4">No memory entries yet.</p>
                    ) : memoryEntries.map((e: any) => (
                      <div key={e.id} className="px-3 py-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Database size={10} className="text-gray-400" />
                          <span className="text-[9px] font-medium text-gray-600">{e.source}</span>
                          <span className="text-[8px] text-gray-400 ml-auto">{new Date(e.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-gray-700">{e.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t flex gap-1 p-2">
                    <input type="text" className="border rounded text-[10px] px-2 py-1 flex-1" placeholder="Add memory entry..." value={newMemory} onChange={e => setNewMemory(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addMemory(); }} />
                    <button onClick={addMemory} className="text-[10px] px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Add</button>
                  </div>
                </div>
              </div>

              {/* Output Versions */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Clock size={12} /> Output Versions
                  <span className="ml-2 text-[9px] text-gray-400">v{versionInfo?.output_version ?? agent.execution_count ?? 0}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${versionInfo?.compatibility === 'breaking' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {versionInfo?.compatibility || 'backward-compatible'}
                  </span>
                </h3>
                <details className="border rounded-lg">
                  <summary className="px-3 py-2 text-xs font-medium cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                    <Play size={10} className="text-gray-400" />
                    Version History ({(versionInfo?.cascade_history || []).length})
                  </summary>
                  <div className="px-3 pb-2 space-y-1.5">
                    {(versionInfo?.cascade_history || []).length === 0 ? (
                      <p className="text-[10px] text-gray-400 py-1">No version changes recorded.</p>
                    ) : (versionInfo?.cascade_history || []).map((h: any, i: number) => (
                      <div key={i} className="border rounded p-2 text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">v{h.version}</span>
                          <span className={`text-[9px] px-1 rounded ${h.compatibility === 'breaking' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{h.compatibility}</span>
                          <span className="text-gray-400 ml-auto">{new Date(h.timestamp).toLocaleString()}</span>
                        </div>
                        {h.cascaded?.length > 0 && (
                          <div className="mt-1 text-[9px] text-gray-500">
                            Cascaded: {h.cascaded.map((c: any) => `${c.agentId} (${c.action})`).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-1 pt-1">
                      <input type="text" className="border rounded text-[10px] px-2 py-1 w-16" placeholder="v" value={newVersion} onChange={e => setNewVersion(e.target.value)} />
                      <select className="border rounded text-[10px] px-2 py-1" value={versionCompatibility} onChange={e => setVersionCompatibility(e.target.value)}>
                        <option value="backward-compatible">Backward Compatible</option>
                        <option value="breaking">Breaking Change</option>
                      </select>
                      <button onClick={updateVersion} className="text-[10px] px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Set Version</button>
                    </div>
                  </div>
                </details>
              </div>

              {/* Code Review */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <GitPullRequest size={12} /> Code Review
                </h3>
                <details className="border rounded-lg">
                  <summary className="px-3 py-2 text-xs font-medium cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                    <Radio size={10} className="text-gray-400" />
                    {codeReviewLoading ? 'Loading...' : prLink ? `${codeReviews.length} review${codeReviews.length !== 1 ? 's' : ''}` : 'No code review data'}
                  </summary>
                  <div className="px-3 pb-2 space-y-1.5">
                    {codeReviewLoading ? (
                      <div className="flex items-center gap-2 py-2 text-[10px] text-gray-400">
                        <Loader2 size={10} className="animate-spin" /> Loading code review data...
                      </div>
                    ) : !prLink ? (
                      <p className="text-[10px] text-gray-400 py-1">No code review data</p>
                    ) : (
                      <>
                        {prLink && (
                          <a href={prLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-indigo-600 hover:underline mb-2">
                            <ExternalLink size={10} /> View Pull Request
                          </a>
                        )}
                        {codeReviews.length === 0 ? (
                          <p className="text-[10px] text-gray-400 py-1">No reviews submitted yet.</p>
                        ) : codeReviews.map((r: any, i: number) => (
                          <div key={i} className="border rounded p-2 text-[10px]">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{r.reviewer}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${r.state === 'APPROVED' ? 'bg-green-100 text-green-700' : r.state === 'CHANGES_REQUESTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.state}</span>
                              {r.submitted_at && <span className="text-gray-400 ml-auto">{new Date(r.submitted_at).toLocaleDateString()}</span>}
                            </div>
                            {r.body && <p className="text-[9px] text-gray-600 mt-1 whitespace-pre-wrap">{r.body}</p>}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </details>
              </div>

              {/* Notes */}
              {agent.notes && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 mb-1">Notes</h3>
                  <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 whitespace-pre-wrap">{agent.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ PROMPTS TAB ═══ */}
          {activeTab === 'prompts' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                  <BookOpen size={12} /> System Prompt
                </h3>
                <button onClick={saveSnapshot} className="ml-auto text-[9px] px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Snapshot Current</button>
              </div>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-3 text-[11px] font-mono whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                {systemPrompt || 'No system prompt found in registry.'}
              </div>

              {/* User Instruction */}
              {agent.user_instruction && (
                <div>
                  <h3 className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
                    <MessageSquare size={12} /> User Instruction <span className="text-[9px] text-amber-400 font-normal">(appended at runtime)</span>
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed text-amber-900">
                    {agent.user_instruction}
                  </div>
                </div>
              )}

              {/* Prompt Snapshots */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Code size={12} /> Prompt Snapshots ({snapshots.length})
                </h3>

                {/* Side-by-side compare */}
                {snapshots.length >= 2 && (
                  <div className="flex items-center gap-2 mb-2">
                    <select className="border rounded text-[10px] px-2 py-1 flex-1" value={compareA} onChange={e => setCompareA(e.target.value)}>
                      <option value="">Compare A</option>
                      {snapshots.map((s, i) => <option key={s.id} value={i}>{new Date(s.timestamp).toLocaleDateString()} #{snapshots.length - i}</option>)}
                    </select>
                    <span className="text-[9px] text-gray-400">vs</span>
                    <select className="border rounded text-[10px] px-2 py-1 flex-1" value={compareB} onChange={e => setCompareB(e.target.value)}>
                      <option value="">Compare B</option>
                      {snapshots.map((s, i) => <option key={s.id} value={i}>{new Date(s.timestamp).toLocaleDateString()} #{snapshots.length - i}</option>)}
                    </select>
                  </div>
                )}

                {compareA !== '' && compareB !== '' && compareA !== compareB && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-gray-50 rounded p-2 text-[9px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border">
                      <div className="text-[8px] text-gray-400 mb-1">Snapshot #{snapshots.length - parseInt(compareA)}</div>
                      {snapshots[parseInt(compareA)]?.system_prompt || '(empty)'}
                    </div>
                    <div className="bg-gray-50 rounded p-2 text-[9px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border">
                      <div className="text-[8px] text-gray-400 mb-1">Snapshot #{snapshots.length - parseInt(compareB)}</div>
                      {snapshots[parseInt(compareB)]?.system_prompt || '(empty)'}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {snapshots.length === 0 ? (
                    <p className="text-[10px] text-gray-400">No snapshots yet. Click 'Snapshot Current' to save one.</p>
                  ) : snapshots.map((s, i) => (
                    <details key={s.id} className="border rounded-lg" open={i === 0}>
                      <summary className="px-3 py-2 text-xs font-medium cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                        <Clock size={10} className="text-gray-400" />
                        #{snapshots.length - i} — {new Date(s.timestamp).toLocaleString()}
                      </summary>
                      <div className="px-3 pb-2 space-y-1.5">
                        <div className="bg-gray-50 rounded p-2 text-[10px] text-gray-600 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {s.system_prompt || '(empty)'}
                        </div>
                        {s.config && Object.keys(s.config).length > 0 && (
                          <div className="text-[9px] text-gray-400">Config: {JSON.stringify(s.config)}</div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ ARTIFACTS TAB ═══ */}
          {activeTab === 'artifacts' && (
            <div className="space-y-5">
              {/* Produced Artifacts */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <FileText size={12} /> Produced Artifacts ({artifactStatus.length})
                </h3>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {artifactStatus.map((a: any, i: number) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs ${
                      a.exists ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {a.exists
                        ? <CheckCircle size={11} className="text-green-500 shrink-0" />
                        : <XCircle size={11} className="text-red-400 shrink-0" />
                      }
                      <span className="flex-1 truncate text-[10px] font-mono text-gray-700">{a.file}</span>
                      {a.exists && (
                        <span className="text-[9px] text-gray-400">
                          {a.size > 1024 ? `${(a.size / 1024).toFixed(1)} KB` : `${a.size} B`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Consumed/Upstream Artifacts */}
              {consumedArtifacts.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                    <Download size={12} /> Consumed From Upstream
                  </h3>
                  {consumedArtifacts.map((dep: any) => (
                    <div key={dep.depId} className="mb-2 border rounded-lg overflow-hidden">
                      <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-mono text-gray-600 flex items-center gap-2">
                        <Users size={10} />
                        {dep.depId}
                        <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded ${
                          dep.status === 'approved' || dep.status === 'completed'
                            ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>{dep.status}</span>
                      </div>
                      <div className="px-3 py-1.5 space-y-0.5">
                        {dep.files.map((file: string, fi: number) => (
                          <div key={fi} className="text-[9px] font-mono text-gray-500 truncate flex items-center gap-1.5">
                            <FileText size={9} className="shrink-0" />
                            {file}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ PROMPTS TAB ═══ */}
          {activeTab === 'prompts' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <BookOpen size={12} /> System Prompt
              </h3>
              {systemPrompt ? (
                <div className="bg-gray-50 border rounded-xl p-4 max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <pre className="text-[10px] text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{systemPrompt}</pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No system prompt found in registry.</p>
                  <p className="text-[9px] text-gray-400 mt-1">Agent prompts are stored in <code className="bg-gray-100 px-1 rounded">00_state_ledger/AGENT_REGISTRY.json</code></p>
                </div>
              )}
              {systemPrompt && (
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <Code size={10} />
                  <span className="font-mono">system_prompt</span>
                  <span className="ml-auto">{systemPrompt.length.toLocaleString()} chars</span>
                </div>
              )}

              {/* User Instruction */}
              {agent.user_instruction && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                    <MessageSquare size={12} /> User Instruction <span className="text-[9px] text-amber-400 font-normal">(appended at runtime)</span>
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <pre className="text-[10px] text-amber-900 whitespace-pre-wrap font-sans leading-relaxed">{agent.user_instruction}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ ARTIFACTS TAB ═══ */}
          {activeTab === 'artifacts' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <FileText size={12} /> Artifact Status
              </h3>
              {artifactStatus.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No artifacts emitted yet.</p>
              ) : (
                <div className="space-y-1">
                  {artifactStatus.map((a: any, i: number) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] ${
                      a.exists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      {a.exists ? <CheckCircle size={12} className="text-green-500 shrink-0" /> : <XCircle size={12} className="text-red-500 shrink-0" />}
                      <span className="font-mono text-[10px] truncate flex-1">{a.file}</span>
                      <span className={`text-[9px] ${a.exists ? 'text-green-600' : 'text-red-500'}`}>
                        {a.exists ? `${a.size > 1024 ? `${(a.size / 1024).toFixed(1)} KB` : `${a.size} B`}` : 'MISSING'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ RUN LOGS TAB ═══ */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                  <Terminal size={12} /> Execution Timeline
                </h3>
                {(lifecycleData?.runs?.length > 0 || lifecycleData?.supervisor_events?.length > 0) && (
                  <span className="text-[9px] text-gray-400">
                    {lifecycleData.runs.length} run(s) &middot; {lifecycleData.supervisor_events.length} supervisor events
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto text-[10px]">
                {/* Agent status summary */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                  <div className={`w-2 h-2 rounded-full ${lifecycleData?.is_running ? 'bg-green-500 animate-pulse' : agent?.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <span className="font-semibold text-gray-700">{agentId}</span>
                  <StatusBadge status={agent?.status} />
                  <span className="text-gray-400">{agent?.step_label && ` &middot; ${agent.step_label}`}</span>
                  {lifecycleData?.is_running && <span className="flex items-center gap-1 ml-auto text-green-700"><Loader2 size={9} className="animate-spin" /> Running</span>}
                  {!lifecycleData?.is_running && agent?.last_activity_timestamp && (
                    <span className="ml-auto text-gray-400">{new Date(agent.last_activity_timestamp).toLocaleString()}</span>
                  )}
                  {agent?.last_error && (
                    <div className="text-red-500 flex items-center gap-1 mt-0.5">
                      <AlertTriangle size={9} /> {agent.last_error}
                    </div>
                  )}
                </div>

                {/* Supervisor Events */}
                {lifecycleData?.supervisor_events?.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <button onClick={() => toggleStep('supervisor')}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-800 text-[9px] font-medium hover:bg-amber-100 transition-colors">
                      <span className={`text-[8px] transition-transform ${expandedSteps.has('supervisor') ? 'rotate-90' : ''}`}>&#9656;</span>
                      Supervisor Events ({lifecycleData.supervisor_events.length})
                    </button>
                    {expandedSteps.has('supervisor') && (
                      <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                        {lifecycleData.supervisor_events.map((ev: string, i: number) => {
                          const m = ev.match(/^\[([^\]]+)\]\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.+)/);
                          const ts = m?.[1] || ''; const comp = m?.[2] || ''; const agentTag = m?.[3] || ''; const msg = m?.[4] || ev;
                          return (
                            <div key={i} className="px-2.5 py-1.5 text-[9px] font-mono text-gray-600 hover:bg-gray-50">
                              <span className="text-gray-400">{ts}</span>
                              {' '}<span className={`px-1 rounded text-[8px] ${comp === 'DAEMON' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>{comp}</span>
                              {' '}{msg}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Pipeline Events */}
                {lifecycleData?.pipeline_events?.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <button onClick={() => toggleStep('pipeline_events')}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-800 text-[9px] font-medium hover:bg-indigo-100 transition-colors">
                      <span className={`text-[8px] transition-transform ${expandedSteps.has('pipeline_events') ? 'rotate-90' : ''}`}>&#9656;</span>
                      Pipeline Events ({lifecycleData.pipeline_events.length})
                    </button>
                    {expandedSteps.has('pipeline_events') && (
                      <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                        {lifecycleData.pipeline_events.map((ev: any, i: number) => (
                          <div key={i} className="px-2.5 py-1.5 text-[9px] text-gray-600 hover:bg-gray-50">
                            <span className="text-gray-400">{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : ''}</span>
                            {' '}<span className="font-semibold">{ev.type}</span>
                            {ev.agent_id && <span className="text-gray-400"> &middot; {ev.agent_id}</span>}
                            {ev.label && <span> &middot; {ev.label}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Current State Summary */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-gray-500">Executed {agent?.execution_count || 0} time(s)</span>
                  {agent?.compliance_checklist?.length > 0 && <span className="text-gray-400">&middot; {agent.compliance_checklist.filter((c: any) => typeof c === 'string' ? c.startsWith('✅') : true).length}/{agent.compliance_checklist.length} compliance checks</span>}
                </div>

                {/* Run Steps (Expandable Tree) */}
                {lifecycleData?.runs?.length > 0 && lifecycleData.runs.map((run: any, ri: number) => (
                  <div key={ri} className="border rounded-lg overflow-hidden">
                    {/* Run header */}
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-100 text-gray-700 text-[9px] font-medium">
                      <span className="font-semibold">Run #{ri + 1}</span>
                      <span className="text-gray-400">&middot;</span>
                      <span className={run.status === 'failed' ? 'text-red-600' : run.status === 'running' ? 'text-green-600' : 'text-gray-600'}>{run.status}</span>
                      {run.total_duration_ms > 0 && <span className="text-gray-400">&middot; {run.total_duration_ms}ms</span>}
                      {run.started_at && <span className="text-gray-400 ml-auto">{new Date(run.started_at).toLocaleTimeString()}</span>}
                      {run.ended_at && <span className="text-gray-400"> &rarr; {new Date(run.ended_at).toLocaleTimeString()}</span>}
                    </div>

                    {/* Steps */}
                    {run.steps?.length > 0 && (
                      <div className="divide-y divide-gray-100">
                        {run.steps.map((step: any, si: number) => {
                          const stepKey = `r${ri}-s${si}`;
                          const stepIcon = step.id === 'llm' ? '🧠' : step.id === 'writing' ? '💾' : step.id === 'processing' ? '✓' : step.id === 'initializing' ? '⚙' : step.id === 'gather_deps' ? '⬇' : step.id === 'checkpoint' ? '◇' : '○';
                          const hasExpandable = (step.iterations?.length > 0) || (step.details?.length > 0);

                          return (
                            <div key={stepKey}>
                              {/* Step header - clickable if expandable */}
                              <button
                                onClick={() => hasExpandable && toggleStep(stepKey)}
                                className={`w-full flex items-center gap-2 px-2.5 py-2 text-left transition-colors ${hasExpandable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}>
                                {hasExpandable ? (
                                  <span className={`text-[8px] text-gray-400 transition-transform shrink-0 ${expandedSteps.has(stepKey) ? 'rotate-90' : ''}`}>&#9656;</span>
                                ) : (
                                  <span className="w-[8px] shrink-0" />
                                )}
                                <span>{stepIcon}</span>
                                <span className="font-medium text-gray-700">{step.label}</span>
                                <span className="text-gray-400 text-[9px]">{step.duration_ms > 0 ? `${step.duration_ms}ms` : ''}</span>
                                {step.started_at && <span className="text-gray-400 text-[8px]">{new Date(step.started_at).toLocaleTimeString()}</span>}
                                {step.iterations && (
                                  <span className="text-[9px] text-gray-400 ml-auto">
                                    {step.iterations_success || 0}/{step.iterations_total || step.iterations.length} iters
                                    {step.llm_duration_ms > 0 && ` · ${step.llm_duration_ms}ms LLM`}
                                  </span>
                                )}
                                {step.details?.length > 0 && !step.iterations && (
                                  <span className="text-[9px] text-gray-400 ml-auto">{step.details.length} event(s)</span>
                                )}
                              </button>

                              {/* Expanded content: iterations + details */}
                              {expandedSteps.has(stepKey) && (
                                <div className="border-t border-gray-100 bg-gray-50/50">
                                  {/* LLM Iterations */}
                                  {step.iterations?.map((iter: any, ii: number) => {
                                    const iterKey = `${stepKey}-iter${ii}`;
                                    return (
                                      <div key={iterKey} className="border-b border-gray-100 last:border-b-0">
                                        <button
                                          onClick={() => toggleIteration(iterKey)}
                                          className="w-full flex items-center gap-2 px-4 py-1.5 text-left hover:bg-gray-100 transition-colors">
                                          <span className={`text-[7px] text-gray-400 transition-transform ${expandedIterations.has(iterKey) ? 'rotate-90' : ''}`}>&#9656;</span>
                                          <span className={`w-1.5 h-1.5 rounded-full ${iter.type === 'error' ? 'bg-red-400' : iter.type === 'done' ? 'bg-green-400' : 'bg-blue-400'}`} />
                                          <span className="font-mono text-[9px] text-gray-700">Iter {iter.number}/{iter.total}</span>
                                          {iter.started_at && <span className="text-gray-400 text-[8px]">{new Date(iter.started_at).toLocaleTimeString()}</span>}
                                          {iter.checkpoint && <span className="text-[8px] text-purple-600 bg-purple-50 px-1 rounded">cp {iter.checkpoint}</span>}
                                          {iter.duration_ms > 0 && <span className="text-gray-400 text-[9px]">{iter.duration_ms}ms</span>}
                                          {iter.tokens_input && <span className="text-gray-400 text-[8px]">in:{iter.tokens_input}</span>}
                                          {iter.tokens_output && <span className="text-gray-400 text-[8px]">out:{iter.tokens_output}</span>}
                                          {iter.tool_count > 0 && (
                                            <span className="text-amber-700 bg-amber-50 text-[8px] px-1 rounded ml-auto">{iter.tool_count} tool(s)</span>
                                          )}
                                          {iter.error && <span className="text-red-500 text-[8px] ml-auto">Error</span>}
                                        </button>
                                        {expandedIterations.has(iterKey) && (
                                          <div className="px-6 pb-1.5 space-y-0.5">
                                            {iter.error && (
                                              <div className="text-[8px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">{iter.error}</div>
                                            )}
                                            {iter.tool_names?.length > 0 && (
                                              <div className="flex flex-wrap gap-1">
                                                {iter.tool_names.map((tn: string, ti: number) => (
                                                  <span key={ti} className="text-[8px] bg-gray-100 text-gray-600 px-1 rounded">{tn}</span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* Details (checkpoints, events, raw msgs) */}
                                  {step.details?.map((d: any, di: number) => (
                                    <div key={di} className="px-4 py-1 text-[8px] text-gray-500 border-b border-gray-100 last:border-b-0 font-mono flex items-start gap-1.5">
                                      {d.is_checkpoint && <span className="text-purple-500 shrink-0">◇</span>}
                                      {d.is_transition && <span className="text-amber-500 shrink-0">↻</span>}
                                      {!d.is_checkpoint && !d.is_transition && <span className="text-gray-300 shrink-0">·</span>}
                                      <span>
                                        {typeof d === 'string' ? d : d.text || JSON.stringify(d)}
                                        {d.duration_ms != null && <span className="text-gray-400 ml-1">({d.duration_ms}ms)</span>}
                                        {d.artifacts != null && <span className="text-green-500 ml-1">{d.artifacts} artifacts</span>}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Run error */}
                    {run.error && (
                      <div className="px-2.5 py-1.5 bg-red-50 border-t border-red-100 text-[9px] text-red-600 flex items-center gap-1">
                        <AlertTriangle size={9} /> {run.error}
                      </div>
                    )}
                  </div>
                ))}

                {/* No data fallback */}
                {(!lifecycleData?.runs?.length && !lifecycleData?.supervisor_events?.length) && (
                  <div className="text-center py-6">
                    <Terminal size={20} className="text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">No execution history yet.</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Agent will populate here when it runs.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ COMMUNICATION TAB ═══ */}
          {activeTab === 'comm' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                  <MessageSquare size={12} /> Agent-to-Agent Messages
                </h3>
                <select className="ml-auto border rounded text-[10px] px-2 py-1" value={a2aTypeFilter} onChange={e => setA2aTypeFilter(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="DelegateSubTask">Delegate Subtask</option>
                  <option value="SubTaskResult">Subtask Result</option>
                  <option value="RequestClarification">Request Clarification</option>
                </select>
              </div>

              {/* Message List */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No messages yet.</p>
                ) : messages.map((msg: any) => {
                  const a2aType = msg.a2a_type || null;
                  const typeColor = a2aType === 'DelegateSubTask' ? 'bg-blue-100 text-blue-700' :
                    a2aType === 'SubTaskResult' ? 'bg-green-100 text-green-700' :
                    a2aType === 'RequestClarification' ? 'bg-amber-100 text-amber-700' : '';
                  return (
                  <div key={msg.message_id} className={`border rounded-lg p-3 text-xs ${
                    msg.from_agent === agentId ? 'bg-blue-50 border-blue-200' :
                    msg.to_agent === agentId ? 'bg-green-50 border-green-200' : ''
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {a2aType && <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${typeColor}`}>{a2aType}</span>}
                      <span className="font-mono text-[10px] font-semibold text-gray-700">{msg.from_agent}</span>
                      <span className="text-gray-400 text-[9px]">&rarr;</span>
                      <span className="font-mono text-[10px] font-semibold text-gray-700">{msg.to_agent}</span>
                      <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded ${
                        msg.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>{msg.status}</span>
                    </div>
                    <p className="font-medium text-[11px] text-gray-800 mb-0.5">{msg.subject}</p>
                    <p className="text-[10px] text-gray-600">{msg.body}</p>
                    {msg.a2a_payload && Object.keys(msg.a2a_payload).length > 0 && (
                      <pre className="mt-1 text-[8px] text-gray-500 bg-gray-50 p-1.5 rounded overflow-x-auto">{JSON.stringify(msg.a2a_payload, null, 2)}</pre>
                    )}
                    {msg.artifact_ref && (
                      <div className="mt-1 flex items-center gap-1 text-[9px] text-indigo-600">
                        <FileText size={9} />
                        {msg.artifact_ref}
                      </div>
                    )}
                    <p className="text-[8px] text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                  </div>
                )})}
              </div>

              {/* Send A2A Message Form */}
              <div className="border rounded-lg p-3 space-y-2">
                <h4 className="text-[10px] font-semibold text-gray-500">Send A2A Message</h4>
                <div className="flex gap-2">
                  <select className="border rounded text-[10px] px-2 py-1 flex-1" value={a2aTo} onChange={e => setA2aTo(e.target.value)}>
                    <option value="">To agent...</option>
                    {Object.keys(agentStates).filter(id => id !== agentId).map(id => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                  <select className="border rounded text-[10px] px-2 py-1" value={composingA2aType} onChange={e => setComposingA2aType(e.target.value)}>
                    <option value="">Type</option>
                    <option value="DelegateSubTask">Delegate Subtask</option>
                    <option value="SubTaskResult">Subtask Result</option>
                    <option value="RequestClarification">Clarification</option>
                  </select>
                </div>
                <input type="text" className="border rounded text-[10px] px-2 py-1 w-full" placeholder="Subject" value={instruction} onChange={e => setInstruction(e.target.value)} />
                <textarea className="border rounded text-[10px] px-2 py-1 w-full" rows={2} placeholder="Body or payload JSON" value={composingPayload} onChange={e => setComposingPayload(e.target.value)} />
                <button onClick={sendA2aMessage} disabled={!a2aTo || !composingA2aType || !instruction}
                  className="text-[10px] px-2.5 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1">
                  <Send size={10} /> Send {composingA2aType}
                </button>
              </div>

              {/* Debug: Show raw message format if empty */}
              {messages.length === 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[9px] text-gray-500 mb-1">Messages are stored in <code className="bg-gray-200 px-1 rounded">00_state_ledger/AGENT_MESSAGES.jsonl</code></p>
                  <p className="text-[9px] text-gray-400">Messages are exchanged between agents when upstream dependencies produce artifacts that downstream agents consume.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ MCP TOOLS TAB ═══ */}
          {activeTab === 'mcp' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <Server size={12} /> MCP Servers & Tools for {agentId}
              </h3>

              {agentMcpServers.length === 0 ? (
                <div className="text-center py-6">
                  <Server size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No MCP servers mapped for this agent.</p>
                  <p className="text-[9px] text-gray-400 mt-1">MCP mapping defined in <code className="bg-gray-100 px-1 rounded">00_state_ledger/MCP_SERVERS.json</code></p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {agentMcpServers.map((server: any) => (
                    <div key={server.id} className="border rounded-lg overflow-hidden">
                      <div className={`px-3 py-2 text-xs font-medium flex items-center gap-2 ${
                        server.status === 'available' ? 'bg-green-50 text-green-700' :
                        server.status === 'configured' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          server.status === 'available' ? 'bg-green-500' :
                          server.status === 'configured' ? 'bg-blue-500' : 'bg-gray-400'
                        }`} />
                        {server.name}
                        <span className="text-[9px] uppercase ml-auto">{server.type}</span>
                      </div>
                      <div className="p-3 space-y-1">
                        {server.tools?.map((tool: any, ti: number) => (
                          <div key={ti} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                            <Code size={9} className="mt-0.5 shrink-0 text-gray-400" />
                            <div>
                              <span className="font-mono text-[9px] text-gray-800">{tool.name}</span>
                              <p className="text-[9px] text-gray-400">{tool.description}</p>
                            </div>
                          </div>
                        ))}
                        {!server.tools?.length && (
                          <p className="text-[9px] text-gray-400 italic">No tools listed</p>
                        )}
                      </div>
                      {server.docs_url && (
                        <div className="px-3 py-1.5 bg-gray-50 border-t text-[9px] text-indigo-600">
                          <a href={server.docs_url} target="_blank" rel="noopener noreferrer" className="hover:underline">{server.docs_url}</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Non-MCP tools available in the framework */}
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Shield size={12} /> Framework Tools Available
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { name: 'Read', desc: 'Read file contents (offset/limit)' },
                    { name: 'Write', desc: 'Write content to files' },
                    { name: 'Edit', desc: 'Exact string replacements' },
                    { name: 'Grep', desc: 'Regex content search' },
                    { name: 'Glob', desc: 'Pattern-based file search' },
                    { name: 'Bash', desc: 'Shell command execution' },
                    { name: 'WebSearch', desc: 'Search web for current info' },
                    { name: 'WebFetch', desc: 'Fetch URL content' },
                    { name: 'Task', desc: 'Subagent delegation' },
                  ].map((tool, i) => (
                    <div key={i} className="border rounded px-2 py-1.5 text-[10px]">
                      <span className="font-mono text-[9px] text-indigo-600">{tool.name}</span>
                      <p className="text-[8px] text-gray-400">{tool.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ PRODUCT QA TAB ═══ */}
      {activeTab === 'product-qa' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Bug size={12} /> Product QA (PeteMart)
            </h3>
            <button onClick={loadProductQA} disabled={productQLoading}
              className="text-[9px] px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              {productQLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {productQLoading && (
            <div className="text-center py-8">
              <Loader2 size={24} className="animate-spin text-indigo-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Loading product QA results...</p>
            </div>
          )}

          {productQA && (
            <div className="space-y-4">
              {/* Summary Cards */}
              {productQA.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-blue-500 font-medium">Total Tests</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{productQA.summary.totalTests}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="text-xs font-medium mb-1">Pass Rate</div>
                    <div className="text-2xl font-bold text-green-700">{productQA.summary.passRate}%</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="text-xs font-medium mb-1">Test Types</div>
                    <div className="text-2xl font-bold text-purple-700">{productQA.summary.testTypesImplemented}/{productQA.summary.testTypesTotal}</div>
                  </div>
                  <div className={`${productQA.summary.openDefects > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} rounded-lg p-3`}>
                    <div className="text-xs font-medium mb-1">Open Defects</div>
                    <div className={`${productQA.summary.openDefects > 0 ? 'text-red-600' : 'text-green-600'} text-2xl font-bold`}>{productQA.summary.openDefects}</div>
                  </div>
                </div>
              )}

              {/* Test Types */}
              {productQA.testTypes && productQA.testTypes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500">Test Types</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {productQA.testTypes.map((tt: any) => {
                      const runPct = tt.total > 0 ? Math.round((tt.passed / tt.total) * 100) : 0;
                      const statusColor = runPct >= 90 ? 'border-green-300' : runPct >= 70 ? 'border-amber-300' : 'border-red-300';
                      return (
                        <div key={tt.id} className={`border rounded-lg p-3 ${statusColor} hover:shadow-md transition-shadow`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-sm truncate">{tt.name}</span>
                            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full
                              {tt.status === 'implemented' ? 'bg-green-100 text-green-700' :
                               tt.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                               'bg-gray-100 text-gray-500'}">
                              {tt.status === 'implemented' ? '✓' : tt.status === 'partial' ? '~' : '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                            <span><span className="font-bold text-gray-700">{tt.passed}</span> / {tt.total} passed</span>
                            {tt.failed > 0 && <span className="text-red-500 font-bold">{tt.failed} failed</span>}
                          </div>
                          <PassRateBar pct={runPct} height={4} />
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs font-mono">{runPct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quality Gates */}
              {productQA.qualityGates && productQA.qualityGates.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500">Quality Gates</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {productQA.qualityGates.map((g: any) => (
                      <div key={g.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                        <div className="mt-0.5 shrink-0">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            g.status === 'pass' ? 'bg-green-100 text-green-700' :
                            g.status === 'fail' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {g.status === 'pass' ? 'PASS' : g.status === 'fail' ? 'FAIL' : 'N/E'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-gray-700">{g.name}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{g.description}</div>
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5 inline-block">{g.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Defects */}
              {productQA.defects && productQA.defects.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500">Open Defects ({productQA.defects.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 pr-2 font-medium">ID</th>
                          <th className="pb-2 pr-3 font-medium">Title</th>
                          <th className="pb-2 pr-2 font-medium">Severity</th>
                          <th className="pb-2 pr-2 font-medium">Status</th>
                          <th className="pb-2 pr-3 font-medium">Test File</th>
                          <th className="pb-2 font-medium">Found</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productQA.defects.map((d: any) => (
                          <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-2 pr-2">
                              <a href={`#defect-${d.id}`} className="font-mono text-indigo-600 hover:underline font-medium text-xs">
                                {d.id}
                              </a>
                            </td>
                            <td className="py-2 pr-3 text-gray-700 max-w-[250px] truncate" title={d.title}>{d.title}</td>
                            <td className="py-2 pr-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                d.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                                d.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                d.severity === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                'bg-green-100 text-green-700 border-green-200'
                              }`}>
                                {d.severity.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2 pr-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                d.status === 'open' ? 'bg-red-100 text-red-700 border-red-200' :
                                d.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                d.status === 'fixed' ? 'bg-green-100 text-green-700 border-green-200' :
                                'bg-gray-100 text-gray-500 border-gray-200'
                              }`}>
                                {d.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-gray-500 max-w-[180px] truncate font-mono text-[10px]" title={d.testFile}>{d.testFile || '-'}</td>
                            <td className="py-2 text-gray-400 text-[10px]">{new Date(d.foundAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!productQA.summary && !productQA.testTypes?.length && !productQA.qualityGates?.length && !productQA.defects?.length && (
                <div className="text-center py-8">
                  <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No test results available for PeteMart yet.</p>
                  <p className="text-xs text-gray-500 mt-1">Run tests from the product app to populate this view.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Bar — sticky bottom */}
      <div className="bg-white border rounded-xl shadow-sm p-4 sticky bottom-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <input type="text" value={instruction} onChange={e => setInstruction(e.target.value)}
              placeholder="Send instruction to agent, e.g., 'Approve with exceptions' or 'Rerun with updated deps'"
              className="flex-1 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
              onKeyDown={e => { if (e.key === 'Enter' && instruction.trim()) { if (e.shiftKey) { sendMessage(); } else { handleAction('approve'); } } }}
            />
            <button onClick={sendMessage} disabled={!instruction.trim()}
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <Send size={12} /> Send
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {agent.status === 'awaiting_approval' && (
              <>
                <button onClick={() => handleAction('approve')}
                  className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                  {actionLoading === 'approve' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  Approve
                </button>
                <button onClick={() => handleAction('reject')}
                  className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                  {actionLoading === 'reject' ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  Reject
                </button>
              </>
            )}
            <button onClick={() => handleAction('rerun')}
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              {actionLoading === 'rerun' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Rerun
            </button>
            <button onClick={() => handleAction('cancel')}
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
              {actionLoading === 'cancel' ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
              Cancel
            </button>
          </div>
        </div>
        <p className="text-[8px] text-gray-400 mt-1.5">Enter to approve · Shift+Enter to send as message</p>
      </div>
    </div>
  );
}

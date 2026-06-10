'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Send, FileText, MessageSquare, Server, Shield, Bot, Play, Clock,
  Radio, Download, Eye, BookOpen, Code, Terminal, Users, Activity,
} from 'lucide-react';
import { StatusBadge, fetchWithTimeout, PHASE_LABELS } from '../../shared';

type TabId = 'overview' | 'prompts' | 'artifacts' | 'logs' | 'comm' | 'mcp';
const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'prompts', label: 'Prompts', icon: BookOpen },
  { id: 'artifacts', label: 'Artifacts', icon: FileText },
  { id: 'logs', label: 'Run Logs', icon: Terminal },
  { id: 'comm', label: 'Comm', icon: MessageSquare },
  { id: 'mcp', label: 'MCP Tools', icon: Server },
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

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!agentId) return;
    const es = new EventSource('/api/agentic-console/events');
    const load = async () => {
      try {
        const [detailRes, msgRes] = await Promise.all([
          fetchWithTimeout(`/api/agentic-console/agent-detail?agentId=${agentId}`, 10000),
          fetch(`/api/agentic-console/agent-messages?agentId=${agentId}`),
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

  const agent = data?.agentState;
  const registry = data?.registryEntry;
  const systemPrompt = data?.systemPrompt || '';
  const artifactStatus = data?.artifactStatus || [];
  const consumedArtifacts = data?.consumedArtifacts || [];
  const agentMcpServers = data?.agentMcpServers || [];
  const lastError = data?.lastError;

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      const endpoint = action === 'rerun' ? '/api/agentic-console/pipeline' : '/api/agentic-console/approve';
      const body = action === 'rerun'
        ? JSON.stringify({ action: 'rerun_agent', agentId })
        : JSON.stringify({ agentId, action, feedback: instruction || `${action} via Agent Detail` });
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (res.ok) {
        showToast(`${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Queued'} ${agentId}`);
        setInstruction('');
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
      if (res.ok) {
        showToast('Instruction sent');
        setInstruction('');
      }
    } catch { showToast('Failed to send'); }
  };

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
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <BookOpen size={12} /> System Prompt
                </h3>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-3 text-[11px] font-mono whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                  {systemPrompt || 'No system prompt found in registry.'}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Code size={12} /> Prompt History
                </h3>
                <div className="space-y-2">
                  {[...Array(Math.max(1, agent.execution_count))].map((_, i) => (
                    <details key={i} className="border rounded-lg" open={i === agent.execution_count - 1}>
                      <summary className="px-3 py-2 text-xs font-medium cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                        <Play size={10} className="text-gray-400" />
                        Execution #{i + 1} — {agent.last_activity_timestamp ? new Date(agent.last_activity_timestamp).toLocaleDateString() : 'N/A'}
                      </summary>
                      <div className="px-3 pb-2">
                        <div className="bg-gray-50 rounded p-2.5 text-[10px] text-gray-600 font-mono whitespace-pre-wrap">
                          Act as an {agent.role}. {systemPrompt ? systemPrompt.substring(0, 200) + '...' : 'See system prompt above.'}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[9px] text-gray-400">
                          <span>Execution #{i + 1}</span>
                          <span>·</span>
                          <span>Status: {agent.status}</span>
                          <span>·</span>
                          <span>Artifacts: {agent.artifacts_emitted?.length || 0}</span>
                        </div>
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

          {/* ═══ RUN LOGS TAB ═══ */}
          {activeTab === 'logs' && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <Terminal size={12} /> Execution Timeline
              </h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {/* Show agent state changes from events */}
                {agent.execution_count === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No execution history yet.</p>
                ) : (
                  <div className="space-y-1">
                    {/* Current state card */}
                    <div className="flex gap-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <div className="w-0.5 flex-1 bg-blue-200" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono font-bold text-blue-700">Current State</span>
                          <StatusBadge status={agent.status} />
                        </div>
                        <p className="text-[10px] text-gray-500">
                          Executed {agent.execution_count} time(s) · Last active: {agent.last_activity_timestamp ? new Date(agent.last_activity_timestamp).toLocaleString() : 'Never'}
                        </p>
                        {agent.last_error && (
                          <p className="text-[9px] text-red-500 mt-1 flex items-center gap-1">
                            <AlertTriangle size={9} /> {agent.last_error}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Artifact timeline */}
                    {artifactStatus.filter((a: any) => a.exists).map((a: any, i: number) => (
                      <div key={i} className="flex gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          {i < artifactStatus.filter((x: any) => x.exists).length - 1 && <div className="w-0.5 flex-1 bg-gray-100" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] font-mono text-gray-700 truncate">{a.file}</div>
                          <div className="text-[8px] text-gray-400">Created during execution · {a.size > 1024 ? `${(a.size / 1024).toFixed(1)} KB` : `${a.size} B`}</div>
                        </div>
                      </div>
                    ))}

                    {/* Initial state */}
                    <div className="flex gap-3 px-3 py-2 rounded-lg bg-gray-50">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-mono text-gray-500">Initial state</div>
                        <div className="text-[8px] text-gray-400">Agent registered with {agent.compliance_checklist?.length || 0} compliance checks</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ COMMUNICATION TAB ═══ */}
          {activeTab === 'comm' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <MessageSquare size={12} /> Agent-to-Agent Messages
              </h3>

              {/* Message List */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No messages yet.</p>
                ) : messages.map((msg: any) => (
                  <div key={msg.message_id} className={`border rounded-lg p-3 text-xs ${
                    msg.from_agent === agentId ? 'bg-blue-50 border-blue-200' :
                    msg.to_agent === agentId ? 'bg-green-50 border-green-200' : ''
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-semibold text-gray-700">{msg.from_agent}</span>
                      <span className="text-gray-400 text-[9px]">→</span>
                      <span className="font-mono text-[10px] font-semibold text-gray-700">{msg.to_agent}</span>
                      <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded ${
                        msg.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>{msg.status}</span>
                    </div>
                    <p className="font-medium text-[11px] text-gray-800 mb-0.5">{msg.subject}</p>
                    <p className="text-[10px] text-gray-600">{msg.body}</p>
                    {msg.artifact_ref && (
                      <div className="mt-1 flex items-center gap-1 text-[9px] text-indigo-600">
                        <FileText size={9} />
                        {msg.artifact_ref}
                      </div>
                    )}
                    <p className="text-[8px] text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                  </div>
                ))}
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
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50">
              {actionLoading === 'rerun' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Rerun
            </button>
          </div>
        </div>
        <p className="text-[8px] text-gray-400 mt-1.5">Enter to approve · Shift+Enter to send as message</p>
      </div>
    </div>
  );
}

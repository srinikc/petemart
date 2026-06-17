'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Bot, FileText, Loader2, Shield, Layout, Server, Monitor, Code, Database, Layers,
    Activity as ActivityIcon, Globe, BookOpen, UserCheck, Camera, Settings, Coins, Lock,
    Lightbulb, GitMerge, Truck, ArrowLeft, ExternalLink, Plus, X,
} from 'lucide-react';
import {
    AgentState, StatusBadge, PageTOC, fetchWithTimeout, timeAgo,
    PHASE_ORDER, PHASE_COLORS, PHASE_LABELS, PHASE_DESCRIPTIONS,
} from '../shared';

const AGENTS_TOC = [
    { id: 'phase-one', label: 'Phase 1' },
    { id: 'phase-two', label: 'Phase 2' },
    { id: 'phase-three', label: 'Phase 3' },
    { id: 'phase-four', label: 'Phase 4' },
    { id: 'phase-five', label: 'Phase 5' },
    { id: 'notes', label: 'Agent Notes' },
];

const AGENT_ICONS: Record<string, React.ElementType> = {
    '00_supervisor_agent': Shield, '01_ideation_agent': Lightbulb, '02_requirement_agent': FileText,
    '03_architect_agent': Layout, '04_prototype_agent': Truck, '05_program_mgmt_agent': GitMerge,
    '06_infra_devops_agent': Server, '07a_ui_agent': Monitor, '07b_api_agent': Code,
    '07c_backend_db_agent': Database, '07d_integration_agent': Layers, '08_qa_agent': ActivityIcon,
    '09_production_agent': Globe, '10_tech_pub_agent': BookOpen, '11_customer_onboarding_agent': UserCheck,
    '12_marketing_agent': Camera, '13_maintenance_agent': Settings, '14_finops_agent': Coins,
    '15_secrets_compliance_agent': Lock,
};

export default function AgentsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [state, setState] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [agentName, setAgentName] = useState('');
    const [deps, setDeps] = useState<string[]>([]);
    const [inputArtifacts, setInputArtifacts] = useState<string[]>(['']);
    const [outputArtifacts, setOutputArtifacts] = useState<string[]>(['']);
    const [creating, setCreating] = useState(false);
    const [createResult, setCreateResult] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    useEffect(() => {
        const project = searchParams?.get('project') || '';
        const url = project ? `/api/agentic-console/state?project=${encodeURIComponent(project)}` : '/api/agentic-console/state';
        fetchWithTimeout(url)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setState(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const agentStates: Record<string, AgentState> = state?.stateMatrix?.agent_states || {};

    const sortedAgentEntries = useMemo(() =>
        Object.entries(agentStates).map(([k, v]) => ({ ...v, agent_id: k })).sort((a, b) => {
            const pi = PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase);
            return pi !== 0 ? pi : a.agent_id.localeCompare(b.agent_id);
        }), [agentStates]);

    const filteredAgents = useMemo(() =>
        sortedAgentEntries.filter(a => {
            if (filterStatus !== 'all' && a.status !== filterStatus) return false;
            if (searchQuery && !a.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) && !a.role.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        }), [sortedAgentEntries, filterStatus, searchQuery]);

    const agentsByPhase = useMemo(() => {
        const grouped: Record<string, AgentState[]> = {};
        PHASE_ORDER.forEach(phase => (grouped[phase] = []));
        filteredAgents.forEach(a => grouped[a.phase]?.push(a));
        return grouped;
    }, [filteredAgents]);

    const agentNotes = useMemo(() => sortedAgentEntries.filter(a => a.notes), [sortedAgentEntries]);

    const openAddModal = useCallback(async () => {
        setShowAddModal(true); setCreateResult(null);
        try {
            const r = await fetch('/api/agentic-console/agents');
            if (r.ok) { const d = await r.json(); setTemplates(d.templates || []); }
        } catch { setTemplates([]); }
    }, []);

    const handleCreate = useCallback(async () => {
        if (!selectedTemplate) return;
        setCreating(true); setCreateResult(null);
        try {
            const r = await fetch('/api/agentic-console/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_id: selectedTemplate,
                    agent_name: agentName || undefined,
                    dependencies: deps,
                    input_artifacts: inputArtifacts.filter(Boolean),
                    output_artifacts: outputArtifacts.filter(Boolean),
                }),
            });
            const d = await r.json();
            if (r.ok) {
                setCreateResult(`✅ Created: ${d.agent_id}`);
                setTimeout(() => { setShowAddModal(false); window.location.reload(); }, 1500);
            } else {
                setCreateResult(`❌ ${d.error}`);
            }
        } catch (e: unknown) {
            setCreateResult(`❌ ${e instanceof Error ? e.message : 'Request failed'}`);
        } finally { setCreating(false); }
    }, [selectedTemplate, agentName, deps, inputArtifacts, outputArtifacts]);

    const handleQuickApprove = useCallback(async (agentId: string, action: string) => {
        try {
            const res = await fetch('/api/agentic-console/approve', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, action, feedback: `${action} via inline button` }),
            });
            if (res.ok) { window.location.reload(); }
        } catch { showToast('Action failed'); }
    }, []);

    const handleBulkAction = useCallback(async (action: string) => {
        for (const id of selectedIds) {
            await fetch('/api/agentic-console/approve', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: id, action, feedback: `${action} via bulk action` }),
            });
        }
        setSelectedIds([]);
        window.location.reload();
    }, [selectedIds]);

    if (loading) {
        return <div className="text-center py-20"><Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-4" /><p>Loading...</p></div>;
    }

    return (
        <div className="space-y-6">
            {/* Page TOC */}
            <div className="bg-white rounded-xl shadow-sm border p-2.5 sticky top-16 z-40 flex items-center gap-2 flex-wrap">
                <button onClick={() => router.push('/agentic-console')} className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 mr-2">
                    <ArrowLeft size={12} /> Dashboard
                </button>
                <span className="text-[10px] font-semibold text-gray-500">Agents:</span>
                <PageTOC sections={AGENTS_TOC} currentPage="agents" />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <input type="text" placeholder="Search agents..." className="border rounded-lg text-xs px-2.5 py-1.5 w-36"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                    {['all','approved','completed','awaiting_approval','pending','failed','active'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${filterStatus === s ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                            {s === 'all' ? 'All' : s === 'awaiting_approval' ? 'Awaiting' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
                <button onClick={openAddModal} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">
                    <Plus size={12} /> Add Agent
                </button>
                <span className="text-[10px] text-gray-400 ml-auto">{filteredAgents.length}/{sortedAgentEntries.length} agents</span>
            </div>

            {/* Bulk action bar */}
            {selectedIds.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="text-[10px] font-medium text-indigo-700">{selectedIds.length} selected</span>
                    <button onClick={() => handleBulkAction('approve')} className="text-[10px] px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700">Approve All</button>
                    <button onClick={() => handleBulkAction('reject')} className="text-[10px] px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600">Reject All</button>
                    <button onClick={() => setSelectedIds([])} className="text-[10px] px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 ml-auto">Clear</button>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white text-xs px-4 py-2 rounded-lg shadow-lg">{toast}</div>
            )}

            {/* Phase frames */}
            {PHASE_ORDER.filter(p => p !== 'system').map(phase => {
                const agents = agentsByPhase[phase] || [];
                if (agents.length === 0) return null;
                const completed = agents.filter(a => a.status === 'approved' || a.status === 'completed').length;
                const sectionId = `phase-${phase.replace('phase_', '')}`;
                return (
                    <section key={phase} id={sectionId} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: PHASE_COLORS[phase] + '12' }}>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase] }} />
                                <h3 className="font-bold text-sm" style={{ color: PHASE_COLORS[phase] }}>{PHASE_LABELS[phase]}</h3>
                                <span className="text-[10px] text-gray-500 ml-2">{PHASE_DESCRIPTIONS[phase]}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">{completed}/{agents.length} done</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
                            {agents.map(a => {
                                const passed = a.compliance_checklist?.filter(c => c.passed).length || 0;
                                const total = a.compliance_checklist?.length || 0;
                                const AgentIcon = AGENT_ICONS[a.agent_id] || Bot;
                                const isSelected = selectedIds.includes(a.agent_id);
                                return (
                                    <div key={a.agent_id}
                                        className={`border rounded-lg hover:shadow-md transition-shadow bg-white ${a.status === 'awaiting_approval' ? 'border-amber-300 ring-1 ring-amber-200' : a.status === 'failed' ? 'border-red-300' : ''} ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}>
                                        <div className="p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <input type="checkbox" checked={isSelected}
                                                    onChange={e => { e.stopPropagation(); setSelectedIds(prev => isSelected ? prev.filter(id => id !== a.agent_id) : [...prev, a.agent_id]); }}
                                                    className="w-3 h-3 rounded border-gray-300 text-indigo-600" onClick={e => e.stopPropagation()} />
                                                <AgentIcon size={15} className="text-gray-500 shrink-0" />
                                                <span className="font-medium text-[11px] cursor-pointer" onClick={() => setSelectedAgent(a)}>{a.agent_id}</span>
                                            </div>
                                            <p className="text-[9px] text-gray-500 line-clamp-1 mb-1.5 cursor-pointer" onClick={() => setSelectedAgent(a)}>{a.role}</p>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <StatusBadge status={a.status} />
                                                {total > 0 && (
                                                    <span className={`text-[9px] ${passed === total ? 'text-green-500' : 'text-amber-500'}`}>
                                                        {passed}/{total} ✓
                                                    </span>
                                                )}
                                            </div>
                                            {a.requires_human_approval && a.status === 'awaiting_approval' && (
                                                <div className="mt-1.5 flex items-center gap-1">
                                                    <button onClick={e => { e.stopPropagation(); handleQuickApprove(a.agent_id, 'approve'); }}
                                                        className="text-[9px] px-1.5 py-0.5 rounded bg-green-600 text-white hover:bg-green-700">Approve</button>
                                                    <button onClick={e => { e.stopPropagation(); handleQuickApprove(a.agent_id, 'reject'); }}
                                                        className="text-[9px] px-1.5 py-0.5 rounded bg-red-500 text-white hover:bg-red-600">Reject</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}

            {/* Agent Notes */}
            <section id="notes" className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-bold mb-3">Agent Notes</h2>
                {agentNotes.length > 0 ? (
                    <div className="space-y-1.5">
                        {agentNotes.map(a => (
                            <details key={a.agent_id} className="border rounded-lg">
                                <summary className="px-3 py-2 cursor-pointer text-xs font-medium hover:bg-gray-50 flex items-center gap-2">
                                    <FileText size={13} className="text-gray-400" />
                                    {a.agent_id}
                                    {a.status === 'awaiting_approval' && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">PENDING</span>}
                                    {a.status === 'failed' && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">FAILED</span>}
                                </summary>
                                <div className="px-3 pb-2 text-xs text-gray-600 whitespace-pre-wrap">{a.notes}</div>
                            </details>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400">No agent-specific notes.</p>
                )}
            </section>

            {/* Agent Detail Modal */}
            {selectedAgent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSelectedAgent(null)}>
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold">{selectedAgent.agent_id}</h2>
                                <p className="text-xs text-gray-500">{selectedAgent.role}</p>
                            </div>
                            <button onClick={() => setSelectedAgent(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div><span className="text-gray-400">Phase:</span> <span className="font-medium">{PHASE_LABELS[selectedAgent.phase]}</span></div>
                                <div><span className="text-gray-400">Status:</span> <StatusBadge status={selectedAgent.status} /></div>
                                <div><span className="text-gray-400">Pool:</span> <span className="font-medium capitalize">{selectedAgent.pool}</span></div>
                                <div><span className="text-gray-400">Executions:</span> {selectedAgent.execution_count}</div>
                                <div><span className="text-gray-400">HITL:</span> {selectedAgent.requires_human_approval ? 'Yes' : 'No'}</div>
                                <div><span className="text-gray-400">Last Active:</span> {selectedAgent.last_activity_timestamp ? new Date(selectedAgent.last_activity_timestamp).toLocaleDateString() : 'Never'}</div>
                            </div>
                            {selectedAgent.status === 'awaiting_approval' && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                                    <h3 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Pre-Approval Summary</h3>
                                    <div className="space-y-1 text-[9px]">
                                        <div className="flex justify-between"><span className="text-gray-500">Status:</span><span className="font-medium text-amber-700">Awaiting Human Review</span></div>
                                        {selectedAgent.last_activity_timestamp && (<div className="flex justify-between"><span className="text-gray-500">Last Activity:</span><span className="font-medium">{timeAgo(selectedAgent.last_activity_timestamp)}</span></div>)}
                                        <div className="flex justify-between"><span className="text-gray-500">Compliance:</span><span className={selectedAgent.compliance_checklist.filter(c => c.passed).length === selectedAgent.compliance_checklist.length ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>{selectedAgent.compliance_checklist.filter(c => c.passed).length}/{selectedAgent.compliance_checklist.length} passed</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Executions:</span><span className="font-medium">{selectedAgent.execution_count}/3</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Artifacts:</span><span className="font-medium">{selectedAgent.artifacts_emitted.length} files</span></div>
                                        {selectedAgent.execution_count > 1 && (<div className="mt-1 pt-1 border-t border-amber-200 text-amber-600"><span className="font-medium">&#x23E4; Re-run #{selectedAgent.execution_count}</span></div>)}
                                    </div>
                                </div>
                            )}
                            <div>
                                <h3 className="text-xs font-semibold mb-1.5">Compliance ({selectedAgent.compliance_checklist.filter(c => c.passed).length}/{selectedAgent.compliance_checklist.length})</h3>
                                <div className="max-h-40 overflow-y-auto space-y-0.5 text-xs">
                                    {selectedAgent.compliance_checklist.map(c => (
                                        <div key={c.id} className="flex items-start gap-1.5 p-1 rounded hover:bg-gray-50">
                                            {c.passed ? <span className="text-green-500 text-[10px]">&#x2713;</span> : <span className="text-red-400 text-[10px]">&#x2717;</span>}
                                            <span className="text-[9px] text-gray-400 font-mono">{c.id}</span>
                                            <span className="text-[9px]">{c.check.split('—')[0].trim()}</span>
                                            {c.passed_at && <span className="text-[8px] text-gray-400 ml-auto">{timeAgo(c.passed_at)}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {selectedAgent.artifacts_emitted.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold mb-1">Artifacts ({selectedAgent.artifacts_emitted.length})</h3>
                                    <div className="max-h-24 overflow-y-auto text-[9px] text-gray-500 space-y-0.5">{selectedAgent.artifacts_emitted.map((a, i) => <div key={i} className="truncate">{a}</div>)}</div>
                                </div>
                            )}
                            {selectedAgent.expert_reviewer && (<div className="bg-gray-50 rounded p-2.5 text-[10px]"><span className="text-gray-400">Reviewer:</span> {selectedAgent.expert_reviewer.role_title} &middot; {selectedAgent.expert_reviewer.review_status}</div>)}
                            {selectedAgent.last_error && (<div className="text-red-600 bg-red-50 p-2.5 rounded text-xs">{selectedAgent.last_error}</div>)}
                            <div className="pt-2 border-t flex gap-2">
                                <button onClick={() => { router.push(`/agentic-console/agents/${selectedAgent.agent_id}`); setSelectedAgent(null); }} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700"><ExternalLink size={12} /> Full Details</button>
                                <button onClick={() => setSelectedAgent(null)} className="text-xs px-3 py-1.5 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 ml-auto">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Agent Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between">
                            <h2 className="text-base font-bold">Add Agent</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Template picker */}
                            <div>
                                <label className="text-xs font-semibold mb-1 block">Template</label>
                                <select className="border rounded-lg text-xs px-2.5 py-2 w-full" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                                    <option value="">-- Select template --</option>
                                    {templates.map((t: { id: string; name: string; description: string }) => (
                                        <option key={t.id} value={t.id}>{t.name} — {t.description}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Agent name */}
                            <div>
                                <label className="text-xs font-semibold mb-1 block">Agent Name (optional)</label>
                                <input type="text" className="border rounded-lg text-xs px-2.5 py-2 w-full" placeholder="Leave blank for default" value={agentName} onChange={e => setAgentName(e.target.value)} />
                            </div>
                            {/* Dependencies */}
                            <div>
                                <label className="text-xs font-semibold mb-1 block">Dependencies (existing agent IDs)</label>
                                <div className="flex flex-wrap gap-1 mb-1">
                                    {sortedAgentEntries.filter(a => a.status === 'approved' || a.status === 'completed').map(a => (
                                        <button key={a.agent_id}
                                            className={`text-[9px] px-1.5 py-0.5 rounded border ${deps.includes(a.agent_id) ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                            onClick={() => setDeps(prev => prev.includes(a.agent_id) ? prev.filter(d => d !== a.agent_id) : [...prev, a.agent_id])}>
                                            {a.agent_id}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Input artifacts */}
                            <div>
                                <label className="text-xs font-semibold mb-1 block">Input Artifacts (file paths)</label>
                                {inputArtifacts.map((val, i) => (
                                    <div key={i} className="flex gap-1 mb-1">
                                        <input type="text" className="border rounded text-[10px] px-2 py-1 w-full" placeholder="e.g., relative/path/to/file.json" value={val} onChange={e => { const next = [...inputArtifacts]; next[i] = e.target.value; setInputArtifacts(next); }} />
                                        <button onClick={() => setInputArtifacts(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                                    </div>
                                ))}
                                <button onClick={() => setInputArtifacts(prev => [...prev, ''])} className="text-[10px] text-indigo-600 hover:underline">+ Add input</button>
                            </div>
                            {/* Output artifacts */}
                            <div>
                                <label className="text-xs font-semibold mb-1 block">Output Artifacts (file paths)</label>
                                {outputArtifacts.map((val, i) => (
                                    <div key={i} className="flex gap-1 mb-1">
                                        <input type="text" className="border rounded text-[10px] px-2 py-1 w-full" placeholder="e.g., agents/custom/output.json" value={val} onChange={e => { const next = [...outputArtifacts]; next[i] = e.target.value; setOutputArtifacts(next); }} />
                                        <button onClick={() => setOutputArtifacts(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                                    </div>
                                ))}
                                <button onClick={() => setOutputArtifacts(prev => [...prev, ''])} className="text-[10px] text-indigo-600 hover:underline">+ Add output</button>
                            </div>
                            {/* Result */}
                            {createResult && (
                                <div className={`text-xs p-2 rounded ${createResult.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {createResult}
                                </div>
                            )}
                            {/* Submit */}
                            <div className="pt-2 border-t flex gap-2">
                                <button onClick={handleCreate} disabled={!selectedTemplate || creating}
                                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                                    {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                    {creating ? 'Creating...' : 'Create Agent'}
                                </button>
                                <button onClick={() => setShowAddModal(false)} className="text-xs px-3 py-1.5 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 ml-auto">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
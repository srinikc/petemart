'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bot, FileText, Loader2, Shield, Layout, Server, Monitor, Code, Database, Layers,
    Activity as ActivityIcon, Globe, BookOpen, UserCheck, Camera, Settings, Coins, Lock,
    Lightbulb, GitMerge, Truck, ArrowLeft, ExternalLink,
} from 'lucide-react';
import {
    AgentState, StatusBadge, PageTOC, fetchWithTimeout,
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
    const [state, setState] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchWithTimeout('/api/agentic-console/state')
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
                <select className="border rounded-lg text-xs px-2 py-1.5" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="awaiting_approval">Awaiting</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="active">Active</option>
                </select>
                <span className="text-[10px] text-gray-400 ml-auto">{filteredAgents.length}/{sortedAgentEntries.length} agents</span>
            </div>

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
                                return (
                                    <div key={a.agent_id}
                                        className={`border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white ${a.status === 'awaiting_approval' ? 'border-amber-300 ring-1 ring-amber-200' : a.status === 'failed' ? 'border-red-300' : ''}`}
                                        onClick={() => setSelectedAgent(a)}>
                                        <div className="p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AgentIcon size={15} className="text-gray-500 shrink-0" />
                                                <span className="font-medium text-[11px]">{a.agent_id}</span>
                                            </div>
                                            <p className="text-[9px] text-gray-500 line-clamp-1 mb-1.5">{a.role}</p>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <StatusBadge status={a.status} />
                                                {total > 0 && (
                                                    <span className={`text-[9px] ${passed === total ? 'text-green-500' : 'text-amber-500'}`}>
                                                        {passed}/{total} ✓
                                                    </span>
                                                )}
                                            </div>
                                            {a.requires_human_approval && a.status === 'awaiting_approval' && (
                                                <span className="mt-1 inline-block bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[8px] font-medium">HITL</span>
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
                            <div>
                                <h3 className="text-xs font-semibold mb-1.5">Compliance ({selectedAgent.compliance_checklist.filter(c => c.passed).length}/{selectedAgent.compliance_checklist.length})</h3>
                                <div className="max-h-40 overflow-y-auto space-y-0.5 text-xs">
                                    {selectedAgent.compliance_checklist.map(c => (
                                        <div key={c.id} className="flex items-start gap-1.5 p-1 rounded hover:bg-gray-50">
                                            {c.passed ? <span className="text-green-500 text-[10px]">✓</span> : <span className="text-red-400 text-[10px]">✗</span>}
                                            <span className="text-[9px] text-gray-400 font-mono">{c.id}</span>
                                            <span className="text-[9px]">{c.check.split('—')[0].trim()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {selectedAgent.artifacts_emitted.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold mb-1">Artifacts ({selectedAgent.artifacts_emitted.length})</h3>
                                    <div className="max-h-24 overflow-y-auto text-[9px] text-gray-500 space-y-0.5">
                                        {selectedAgent.artifacts_emitted.map((a, i) => <div key={i} className="truncate">{a}</div>)}
                                    </div>
                                </div>
                            )}
                            {selectedAgent.expert_reviewer && (
                                <div className="bg-gray-50 rounded p-2.5 text-[10px]">
                                    <span className="text-gray-400">Reviewer:</span> {selectedAgent.expert_reviewer.role_title} · {selectedAgent.expert_reviewer.review_status}
                                </div>
                            )}
                            {selectedAgent.last_error && (
                                <div className="text-red-600 bg-red-50 p-2.5 rounded text-xs">{selectedAgent.last_error}</div>
                            )}

                            <div className="pt-2 border-t flex gap-2">
                                <button onClick={() => { router.push(`/agentic-console/agents/${selectedAgent.agent_id}`); setSelectedAgent(null); }}
                                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">
                                    <ExternalLink size={12} /> Full Details
                                </button>
                                <button onClick={() => setSelectedAgent(null)}
                                    className="text-xs px-3 py-1.5 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 ml-auto">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
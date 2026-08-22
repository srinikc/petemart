'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Folder, Plus, Trash2, Loader2, Globe, ExternalLink, Pencil, AlertTriangle,
} from 'lucide-react';
import { ProjectInfo, ProjectsIndex, fetchProjectsIndex, deleteProject } from '../shared';
import ProjectConfigModal from '../ProjectConfigModal';

export default function ProjectsPage() {
    const searchParams = useSearchParams();
    const [index, setIndex] = useState<ProjectsIndex | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ProjectInfo | null>(null);
    const [editingConfig, setEditingConfig] = useState<any>(null);
    const [configLoading, setConfigLoading] = useState(false);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const reload = useCallback(async () => {
        const idx = await fetchProjectsIndex();
        setIndex(idx);
        setLoading(false);
    }, []);

    useEffect(() => { reload(); }, [reload]);

    useEffect(() => {
        if (searchParams?.get('new') === '1') {
            setEditing(null); setEditingConfig(null); setModalOpen(true);
            window.history.replaceState({}, '', '/agentic-console/projects');
        }
    }, [searchParams]);

    const openCreate = () => { setEditing(null); setEditingConfig(null); setModalOpen(true); };

    const openEdit = async (p: ProjectInfo) => {
        setConfigLoading(true);
        setModalOpen(true);
        setEditing(p); setEditingConfig(null);
        try {
            const res = await fetch(`/api/agentic-console/projects?id=${encodeURIComponent(p.id)}`);
            if (res.ok) {
                const json = await res.json();
                setEditingConfig(json.project_config || null);
            }
        } catch {}
        setConfigLoading(false);
    };

    const handleDelete = async (id: string) => {
        const ok = await deleteProject(id);
        if (ok) { showToast('Project deleted'); setConfirmDelete(null); await reload(); }
        else showToast('Failed to delete project');
    };

    const projects = index?.projects || {};
    const entries = Object.values(projects);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Folder size={20} className="text-indigo-600" />
                <h1 className="text-lg font-bold">Projects</h1>
                <span className="text-[11px] text-gray-400 ml-auto">{entries.length} project(s)</span>
                <button onClick={openCreate}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                    <Plus size={13} /> New Project
                </button>
            </div>

            {loading ? (
                <div className="text-center py-16 text-gray-400"><Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-2" /><p className="text-sm">Loading projects...</p></div>
            ) : entries.length === 0 ? (
                <div className="text-center py-16 text-gray-400 border rounded-xl bg-white">
                    <Globe size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No projects found.</p>
                    <button onClick={openCreate} className="mt-3 text-xs px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                        Create your first project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {entries.map(p => (
                        <div key={p.id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md hover:border-indigo-300 transition-all">
                            <div className="flex items-start justify-between mb-2">
                                <div className="min-w-0 flex items-center gap-2">
                                    {p.logo_path ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={`/${p.logo_path}`} alt={p.name} className="w-8 h-8 rounded-lg object-contain border bg-white shrink-0" />
                                    ) : (
                                        <Folder size={16} className="text-indigo-500 shrink-0" />
                                    )}
                                    <span className="text-sm font-bold truncate">{p.name}</span>
                                </div>
                                {index?.default_project === p.id && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold shrink-0">DEFAULT</span>}
                            </div>
                            <p className="text-[11px] text-gray-500 line-clamp-2 min-h-[28px]">{p.description || <span className="italic">No description</span>}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {(p.platforms || []).map(pl => (
                                    <span key={pl} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{pl}</span>
                                ))}
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{p.agent_count || 0} agents</span>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${p.completed_pct || 0}%`, backgroundColor: (p.completed_pct || 0) >= 80 ? '#16A34A' : (p.completed_pct || 0) >= 50 ? '#F59E0B' : '#DC2626' }} />
                                </div>
                                <span className="text-xs font-mono font-bold">{p.completed_pct || 0}%</span>
                            </div>
                            <div className="mt-3 space-y-1 text-[11px] text-gray-500 font-mono">
                                <div className="truncate"><span className="text-gray-400">id:</span> {p.id}</div>
                                {p.llm_override?.provider && <div className="truncate"><span className="text-gray-400">llm:</span> {p.llm_override.provider}/{p.llm_override.model}</div>}
                                <div className="truncate"><span className="text-gray-400">created:</span> {new Date(p.created_at).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
                                <a href={`/agentic-console?project=${encodeURIComponent(p.id)}`}
                                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium">
                                    <ExternalLink size={11} /> Open
                                </a>
                                <button onClick={() => openEdit(p)}
                                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium">
                                    <Pencil size={11} /> Configure
                                </button>
                                <button onClick={() => setConfirmDelete(p.id)}
                                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 font-medium ml-auto">
                                    <Trash2 size={11} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ProjectConfigModal
                open={modalOpen}
                editing={editing}
                initialConfig={editingConfig}
                onClose={() => { setModalOpen(false); setEditing(null); setEditingConfig(null); }}
                onSaved={() => reload()}
            />

            {configLoading && (
                <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
                    <div className="bg-white rounded-xl px-5 py-4 flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin text-indigo-500" /> Loading configuration...</div>
                </div>
            )}

            {confirmDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-3 text-red-600">
                            <AlertTriangle size={18} />
                            <h3 className="font-bold text-sm">Delete project?</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">Delete <span className="font-bold text-gray-700">{projects[confirmDelete]?.name}</span>? This removes it from the index and its state + workspace folders.</p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setConfirmDelete(null)} className="text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</button>
                            <button onClick={() => handleDelete(confirmDelete)} className="text-xs px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-4 py-2 rounded-lg shadow-lg z-[60]">
                    {toast}
                </div>
            )}
        </div>
    );
}
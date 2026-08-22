'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Users as UsersIcon, Plus, X, Loader2, Trash2, Key, CheckCircle, AlertTriangle, UserCheck, UserX,
} from 'lucide-react';
import { fetchProjectsIndex, ProjectInfo } from '../shared';

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-50 text-red-700 border-red-200',
    gatekeeper: 'bg-amber-50 text-amber-700 border-amber-200',
    viewer: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function UsersPage() {
    const [users, setUsers] = useState<Record<string, any> | null>(null);
    const [meta, setMeta] = useState<{ userCount: number; activeSessions: number; roles: Record<string, any> } | null>(null);
    const [projects, setProjects] = useState<Record<string, ProjectInfo>>({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [sessions, setSessions] = useState<any[] | null>(null);
    const [showSessions, setShowSessions] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const [userId, setUserId] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('viewer');
    const [selectedProjects, setSelectedProjects] = useState<string[]>(['petemart']);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const reload = useCallback(async () => {
        try {
            const [rbacRes, projectsRes] = await Promise.all([
                fetch('/api/agentic-console/rbac'),
                fetch('/api/agentic-console/projects'),
            ]);
            if (rbacRes.ok) {
                const rbac = await rbacRes.json();
                setUsers(rbac.users || {});
                setMeta({ userCount: rbac.userCount || 0, activeSessions: rbac.activeSessions || 0, roles: rbac.roles || {} });
            }
            if (projectsRes.ok) {
                const idx = await projectsRes.json();
                setProjects(idx.projects || {});
            }
        } catch {}
        setLoading(false);
    }, []);

    useEffect(() => { reload(); }, [reload]);

    const api = async (body: any) => {
        try {
            const res = await fetch('/api/agentic-console/rbac', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            return await res.json();
        } catch { return null; }
    };

    const handleAdd = async () => {
        if (!userId.trim() || !role) { showToast('User ID and role required'); return; }
        const result = await api({ action: 'add_user', user_id: userId, role, display_name: displayName || userId, email, projects: selectedProjects });
        if (result?.success) { showToast(`Added user "${userId}"`); setShowAdd(false); setUserId(''); setDisplayName(''); setEmail(''); await reload(); }
        else showToast(result?.error || 'Failed to add user');
    };

    const handleSetRole = async (target_user_id: string, newRole: string) => {
        const result = await api({ action: 'set_role', target_user_id, role: newRole });
        if (result?.success) { showToast(`Role updated for "${target_user_id}"`); await reload(); }
        else showToast(result?.error || 'Failed to update role');
    };

    const handleSetProjectAccess = async (target_user_id: string, projIds: string[]) => {
        const result = await api({ action: 'set_project_access', target_user_id, projects: projIds });
        if (result?.success) { showToast(`Project access updated for "${target_user_id}"`); await reload(); }
        else showToast(result?.error || 'Failed to update project access');
    };

    const handleDelete = async (target_user_id: string) => {
        const result = await api({ action: 'delete_user', target_user_id });
        if (result?.success) { showToast(`Deleted user "${target_user_id}"`); setConfirmDelete(null); await reload(); }
        else showToast(result?.error || 'Failed to delete user');
    };

    const handleListSessions = async () => {
        const result = await api({ action: 'list_sessions' });
        if (result?.sessions) { setSessions(result.sessions); setShowSessions(true); }
        else showToast('Failed to load sessions');
    };

    const projectList = Object.values(projects);
    const userEntries = users ? Object.entries(users) : [];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <UsersIcon size={20} className="text-indigo-600" />
                <h1 className="text-lg font-bold">Users</h1>
                <span className="text-[11px] text-gray-400 ml-auto">{meta?.userCount || 0} user(s) · {meta?.activeSessions || 0} active session(s)</span>
                <button onClick={handleListSessions}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                    <Key size={13} /> Sessions
                </button>
                <button onClick={() => setShowAdd(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                    <Plus size={13} /> Add User
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {Object.entries(meta?.roles || {}).map(([rid, r]: [string, any]) => (
                    <div key={rid} className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${ROLE_COLORS[rid] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {r.label || rid} — {r.description?.split('.')[0]}
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-16 text-gray-400"><Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-2" /><p className="text-sm">Loading users...</p></div>
            ) : userEntries.length === 0 ? (
                <div className="text-center py-16 text-gray-400 border rounded-xl bg-white">
                    <UserX size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No users found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-[10px] uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-2.5">User</th>
                                <th className="px-4 py-2.5">Role</th>
                                <th className="px-4 py-2.5">Project Access</th>
                                <th className="px-4 py-2.5">Last Login</th>
                                <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {userEntries.map(([id, u]) => (
                                <tr key={id} className="hover:bg-gray-50/60">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                {(u.display_name || id).slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold truncate">{u.display_name || id}</div>
                                                <div className="text-[10px] text-gray-400 font-mono truncate">{id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <select value={u.role} onChange={e => handleSetRole(id, e.target.value)}
                                            className={`text-[11px] font-medium px-2 py-1 rounded-lg border cursor-pointer ${ROLE_COLORS[u.role] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                            {Object.keys(meta?.roles || { admin: 1, gatekeeper: 1, viewer: 1 }).map(r => (
                                                <option key={r} value={r} className="text-gray-700">{r}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap items-center gap-1 max-w-[260px]">
                                            {(u.projects || []).map((p: string) => (
                                                <button key={p} onClick={() => handleSetProjectAccess(id, (u.projects || []).filter((x: string) => x !== p))}
                                                    title={`Remove ${p}`} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 font-medium">
                                                    {p} ×
                                                </button>
                                            ))}
                                            <select
                                                value=""
                                                onChange={e => { if (e.target.value) handleSetProjectAccess(id, [...new Set([...(u.projects || []), e.target.value])]); }}
                                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 cursor-pointer">
                                                <option value="">+ add</option>
                                                {projectList.filter(p => !(u.projects || []).includes(p.id)).map(p => (
                                                    <option key={p.id} value={p.id}>{p.id}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[11px] text-gray-500">{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => setConfirmDelete(id)} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 font-medium">
                                            <Trash2 size={11} /> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showAdd && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold">Add User</h2>
                            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">User ID *</label>
                                <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="e.g., john.doe"
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Display Name</label>
                                    <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Email</label>
                                    <input value={email} onChange={e => setEmail(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Role</label>
                                <select value={role} onChange={e => setRole(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                                    {Object.keys(meta?.roles || { admin: 1, gatekeeper: 1, viewer: 1 }).map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Project Access</label>
                                <div className="flex flex-wrap gap-1.5 border rounded-lg p-2">
                                    {projectList.map(p => (
                                        <button key={p.id} type="button" onClick={() => setSelectedProjects(prev =>
                                            prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                                        )}
                                            className={`text-[10px] px-2 py-1 rounded-full border font-medium transition-colors ${selectedProjects.includes(p.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                                            {p.id}
                                        </button>
                                    ))}
                                    {projectList.length === 0 && <span className="text-[10px] text-gray-400">No projects available</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-5">
                            <button onClick={() => setShowAdd(false)} className="text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</button>
                            <button onClick={handleAdd} className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                                <UserCheck size={13} /> Add User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSessions && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSessions(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold">Active Sessions</h2>
                            <button onClick={() => setShowSessions(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        {!sessions || sessions.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">No sessions found.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left text-[10px] uppercase tracking-wider text-gray-500">
                                    <tr>
                                        <th className="px-3 py-2">Token</th>
                                        <th className="px-3 py-2">User</th>
                                        <th className="px-3 py-2">Role</th>
                                        <th className="px-3 py-2">Expires</th>
                                        <th className="px-3 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sessions.map((s, i) => (
                                        <tr key={i}>
                                            <td className="px-3 py-2 font-mono text-[10px] text-gray-500 truncate max-w-[160px]">{s.token ? s.token.slice(0, 24) + '…' : s.user_id}</td>
                                            <td className="px-3 py-2 text-xs font-semibold">{s.user_id}</td>
                                            <td className="px-3 py-2"><span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[s.role] || 'bg-gray-50'}`}>{s.role}</span></td>
                                            <td className="px-3 py-2 text-[11px] text-gray-500">{new Date(s.expires_at).toLocaleString()}</td>
                                            <td className="px-3 py-2">
                                                <span className={`flex items-center gap-1 text-[10px] font-semibold ${s.active ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                                    {s.active ? 'ACTIVE' : 'EXPIRED'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {confirmDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-3 text-red-600">
                            <AlertTriangle size={18} />
                            <h3 className="font-bold text-sm">Delete user?</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">Delete <span className="font-bold text-gray-700">{confirmDelete}</span>? Their sessions will be revoked.</p>
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
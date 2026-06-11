'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Shield, Menu, X, Activity, Bot, Settings, Server, ChevronDown, Globe } from 'lucide-react';
import { GLOBAL_NAV_ITEMS, fetchProjectsIndex, ProjectInfo, withProject } from './shared';

const ICON_MAP: Record<string, React.ElementType> = {
    Activity, Bot, Shield, Settings, Server,
};

function isActivePath(pathname: string, href: string) {
    if (href === '/agentic-console') return pathname === '/agentic-console';
    return pathname.startsWith(href);
}

export default function AgenticConsoleLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [projects, setProjects] = useState<Record<string, ProjectInfo>>({});
    const [activeProject, setActiveProject] = useState<string>(
        searchParams?.get('project') || ''
    );
    const [showProjectMenu, setShowProjectMenu] = useState(false);

    useEffect(() => {
        fetchProjectsIndex().then(idx => {
            if (idx) {
                setProjects(idx.projects);
                if (!searchParams?.get('project')) {
                    setActiveProject(idx.default_project || '');
                }
            }
        });
    }, []);

    useEffect(() => {
        setActiveProject(searchParams?.get('project') || '');
    }, [searchParams]);

    const currentProjectName = activeProject && projects[activeProject]
        ? projects[activeProject].name
        : 'All Projects';

    const navHref = (base: string) => {
        if (activeProject) return `${base}?project=${encodeURIComponent(activeProject)}`;
        return base;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Global Sticky Navigation ── */}
            <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield size={22} className="text-indigo-600" />
                        <div>
                            <h1 className="text-base font-bold">Central Agentic AI Console</h1>
                            <p className="text-[10px] text-gray-400">Multi-project pipeline management</p>
                        </div>
                    </div>

                    {/* Project selector */}
                    <div className="relative hidden sm:block">
                        <button onClick={() => setShowProjectMenu(!showProjectMenu)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border bg-white hover:bg-gray-50 transition-colors">
                            <Globe size={14} className="text-indigo-500" />
                            <span className="font-medium text-gray-700 max-w-[180px] truncate">{currentProjectName}</span>
                            <ChevronDown size={12} className="text-gray-400" />
                        </button>
                        {showProjectMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowProjectMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 w-64 bg-white border rounded-lg shadow-lg z-20 py-1">
                                    <button onClick={() => {
                                        router.push('/agentic-console');
                                        setShowProjectMenu(false);
                                    }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 ${!activeProject ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600'}`}>
                                        <Globe size={14} />
                                        All Projects
                                    </button>
                                    <div className="border-t my-1" />
                                    {Object.values(projects).map(p => (
                                        <button key={p.id} onClick={() => {
                                            router.push(`/agentic-console?project=${encodeURIComponent(p.id)}`);
                                            setShowProjectMenu(false);
                                        }}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 ${activeProject === p.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600'}`}>
                                            <Shield size={14} />
                                            <div className="min-w-0">
                                                <div className="truncate font-medium">{p.name}</div>
                                                {p.completed_pct !== undefined && (
                                                    <div className="text-[10px] text-gray-400">{p.completed_pct}% complete</div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Desktop global nav */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {GLOBAL_NAV_ITEMS.map(item => {
                            const Icon = ICON_MAP[item.icon] || Activity;
                            const href = navHref(item.href);
                            const active = isActivePath(pathname, item.href);
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => { router.push(href); setMobileOpen(false); }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${active
                                            ? 'bg-indigo-100 text-indigo-700 font-medium'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                        }`}
                                >
                                    <Icon size={14} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-gray-500 hover:text-gray-700">
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile nav */}
                {mobileOpen && (
                    <div className="lg:hidden border-t bg-white px-4 py-2">
                        <div className="flex flex-col gap-1 mb-2 pb-2 border-b">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase px-3">Project</span>
                            {Object.values(projects).map(p => (
                                <button key={p.id} onClick={() => {
                                    router.push(`/agentic-console?project=${encodeURIComponent(p.id)}`);
                                    setMobileOpen(false);
                                }}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md ${activeProject === p.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-500'}`}>
                                    <Shield size={16} />
                                    {p.name}
                                </button>
                            ))}
                        </div>
                        {GLOBAL_NAV_ITEMS.map(item => {
                            const Icon = ICON_MAP[item.icon] || Activity;
                            const href = navHref(item.href);
                            const active = isActivePath(pathname, item.href);
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => { router.push(href); setMobileOpen(false); }}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md w-full text-left transition-colors ${active
                                            ? 'bg-indigo-100 text-indigo-700 font-medium'
                                            : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </header>

            {/* Page content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {children}
            </div>
        </div>
    );
}
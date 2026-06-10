'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Menu, X, Activity, Bot, Settings, Server } from 'lucide-react';
import { GLOBAL_NAV_ITEMS } from './shared';

const ICON_MAP: Record<string, React.ElementType> = {
    Activity, Bot, Shield, Settings, Server,
};

// Simple route guard: if path matches exactly or starts with href
function isActivePath(pathname: string, href: string) {
    if (href === '/agentic-console') return pathname === '/agentic-console';
    return pathname.startsWith(href);
}

export default function AgenticConsoleLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Global Sticky Navigation ── */}
            <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield size={22} className="text-indigo-600" />
                        <div>
                            <h1 className="text-base font-bold">PeteMart Agentic Console</h1>
                            <p className="text-[10px] text-gray-400">Multi-page dashboard v2.0</p>
                        </div>
                    </div>

                    {/* Desktop global nav */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {GLOBAL_NAV_ITEMS.map(item => {
                            const Icon = ICON_MAP[item.icon] || Activity;
                            const active = isActivePath(pathname, item.href);
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => { router.push(item.href); setMobileOpen(false); }}
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
                        <div className="flex flex-col gap-1">
                            {GLOBAL_NAV_ITEMS.map(item => {
                                const Icon = ICON_MAP[item.icon] || Activity;
                                const active = isActivePath(pathname, item.href);
                                return (
                                    <button
                                        key={item.href}
                                        onClick={() => { router.push(item.href); setMobileOpen(false); }}
                                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${active
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
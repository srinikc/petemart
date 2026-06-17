'use client';

import React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

const PAGE_LABELS: Record<string, string> = {
    'agentic-console': 'Dashboard',
    'agents': 'Agent Pipeline',
    'quality': 'Quality',
    'health': 'Health',
    'operations': 'Operations',
    'tools': 'Tools',
    'mcp': 'MCP Servers',
};

export default function Breadcrumbs() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (!pathname || pathname === '/agentic-console') return null;

    const segments = pathname.split('/').filter(Boolean);
    const project = searchParams?.get('project');

    const crumbs: { label: string; href: string }[] = [
        { label: 'Console', href: '/agentic-console' + (project ? `?project=${project}` : '') },
    ];

    for (let i = 1; i < segments.length; i++) {
        const seg = segments[i];
        const href = '/' + segments.slice(0, i + 1).join('/') + (project ? `?project=${project}` : '');
        const label = PAGE_LABELS[seg] || seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        crumbs.push({ label, href });
    }

    return (
        <nav className="flex items-center gap-1 text-[10px] text-gray-400 mb-3 px-0.5" aria-label="Breadcrumb">
            {crumbs.map((crumb, i) => (
                <React.Fragment key={crumb.href}>
                    {i > 0 && <ChevronRight size={10} className="text-gray-300" />}
                    {i < crumbs.length - 1 ? (
                        <Link href={crumb.href} className="hover:text-indigo-600 transition-colors truncate max-w-[120px]">
                            {crumb.label}
                        </Link>
                    ) : (
                        <span className="text-gray-600 font-medium truncate max-w-[160px]">{crumb.label}</span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}
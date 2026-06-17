'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Server, Search, ArrowLeft, ExternalLink, Loader2, Bot, CheckCircle, XCircle, Radio } from 'lucide-react';
import { fetchWithTimeout } from '../shared';

export default function ToolsRegistryPage() {
  const router = useRouter(); const searchParams = useSearchParams();
  const [tools, setTools] = useState<any[]>([]); const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const project = searchParams?.get('project') || '';
  const qs = project ? `?project=${encodeURIComponent(project)}` : '';

  useEffect(() => {
    Promise.all([
      fetchWithTimeout('/api/agentic-console/tools').then(r => r.json()),
      fetchWithTimeout('/api/agentic-console/mcp-servers').then(r => r.json()),
    ]).then(([tData, mData]) => {
      if (tData?.tools) setTools(tData.tools);
      if (mData?.servers) setServers(mData.servers);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = tools.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.server_id?.toLowerCase().includes(search.toLowerCase()) ||
    t.server_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-20"><Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" /><p className="text-sm text-gray-500">Loading Tools Registry...</p></div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center gap-3 flex-wrap sticky top-16 z-40">
        <button onClick={() => router.push(`/agentic-console${qs ? `?${qs}` : ''}`)} className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium"><ArrowLeft size={14} /> Dashboard</button>
        <span className="text-xs font-semibold text-gray-500">Tools Registry</span>
        <span className="text-[10px] text-gray-400 font-mono">{tools.length} tools across {servers.length} servers</span>
        <div className="relative ml-auto max-w-xs"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tools..." className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        <a href={`/agentic-console/mcp${qs ? '?' + qs : ''}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"><Server size={14} /> MCP Servers</a>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-gray-500 text-[11px]"><th className="pb-2 pr-3 pt-3 pl-4 font-medium">Tool</th><th className="pb-2 pr-3 pt-3 font-medium">Server</th><th className="pb-2 pr-3 pt-3 font-medium">Description</th><th className="pb-2 pr-3 pt-3 font-medium text-right">Type</th><th className="pb-2 pr-3 pt-3 font-medium">Status</th><th className="pb-2 pr-3 pt-3 font-medium text-right">Agents</th></tr></thead>
          <tbody>{filtered.map(t => (
            <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50"><td className="py-2 pr-3 pl-4 font-mono text-xs">{t.name}</td>
              <td className="py-2 pr-3"><a href={`/agentic-console/mcp${qs ? '?' + qs : ''}`} className="text-indigo-600 hover:underline text-xs">{t.server_name}</a></td>
              <td className="py-2 pr-3 text-xs text-gray-500 max-w-xs truncate">{t.description || '-'}</td>
              <td className="py-2 pr-3 text-right"><span className={`text-[10px] px-1.5 py-0.5 rounded ${t.type === 'local' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>{t.type}</span></td>
              <td className="py-2 pr-3">{t.status === 'available' ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-400" />}</td>
              <td className="py-2 pr-3 text-right"><span className="text-[10px] text-gray-400">{t.agents?.length || 0}</span></td>
            </tr>
          ))}</tbody></table></div>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400"><Server size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No tools match your search.</p></div>}
      </div>
    </div>
  );
}

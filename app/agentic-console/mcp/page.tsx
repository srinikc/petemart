'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Server, Bot, Radio, Search, Code, Globe, Shield, CheckCircle, XCircle,
  ExternalLink, ArrowLeft, Loader2, BookOpen, Layers,
} from 'lucide-react';
import { fetchWithTimeout } from '../shared';

const STATUS_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  available: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  configured: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  unavailable: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
};

const TYPE_COLORS: Record<string, string> = {
  local: 'bg-gray-100 text-gray-600',
  remote: 'bg-blue-100 text-blue-600',
  'built-in': 'bg-purple-100 text-purple-600',
};

export default function McpRegistryPage() {
  const router = useRouter();
  const [servers, setServers] = useState<any[]>([]);
  const [agentMapping, setAgentMapping] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [liveConnected, setLiveConnected] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithTimeout('/api/agentic-console/mcp-servers');
        const data = await res.json();
        setServers(data.servers || []);
        setAgentMapping(data.agentToMcpMapping || {});
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const filteredServers = servers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const toolCount = servers.reduce((sum, s) => sum + (s.tools?.length || 0), 0);
  const agentsUsingMcp = Object.keys(agentMapping).length;

  if (loading) {
    return <div className="text-center py-20"><Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-4" /><p className="text-gray-500">Loading MCP registry...</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <button onClick={() => router.push('/agentic-console')}
          className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 mb-2">
          <ArrowLeft size={12} /> Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Server size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold">MCP Servers & Tools Registry</h1>
            <p className="text-xs text-gray-500">
              {servers.length} MCP servers · {toolCount} tools · {agentsUsingMcp} agents mapped
              <span className="ml-2 text-[10px] text-gray-400">
                — Model Context Protocol servers available to agents in the pipeline
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'MCP Servers', value: String(servers.length), icon: Server, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Available Tools', value: String(toolCount), icon: Code, color: 'text-green-600 bg-green-50' },
          { label: 'Mapped Agents', value: String(agentsUsingMcp), icon: Bot, color: 'text-blue-600 bg-blue-50' },
          { label: 'Server Types', value: `${servers.filter(s => s.type === 'local').length} local · ${servers.filter(s => s.type === 'remote').length} remote`, icon: Globe, color: 'text-purple-600 bg-purple-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="border rounded-lg p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center`}>
                <Icon size={16} />
              </div>
              <div>
                <div className="text-sm font-bold">{stat.value}</div>
                <div className="text-[9px] text-gray-500">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search MCP servers by name or ID..." className="w-full border rounded-lg pl-8 pr-3 py-2 text-xs"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Server Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredServers.map(server => (
          <div key={server.id}
            className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedServer(server)}>
            {/* Server header */}
            <div className={`px-4 py-2.5 flex items-center gap-2 ${STATUS_COLORS[server.status]?.bg || 'bg-gray-50'}`}>
              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[server.status]?.dot || 'bg-gray-400'}`} />
              <h3 className="font-semibold text-sm flex-1">{server.name}</h3>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[server.type] || 'bg-gray-100 text-gray-500'}`}>
                {server.type}
              </span>
              <span className={`text-[9px] font-medium ${STATUS_COLORS[server.status]?.text || 'text-gray-500'}`}>
                {server.status}
              </span>
            </div>

            {/* Tools */}
            <div className="p-4">
              <div className="flex items-center gap-1 mb-2">
                <Code size={11} className="text-gray-400" />
                <span className="text-[9px] font-semibold text-gray-500">{server.tools?.length || 0} tools</span>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                {(server.tools || []).slice(0, 6).map((tool: any, ti: number) => (
                  <div key={ti} className="flex items-start gap-1.5 text-[9px] text-gray-600">
                    <div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-mono text-[8px] text-gray-800">{tool.name}</span>
                      <p className="text-[8px] text-gray-400 line-clamp-1">{tool.description}</p>
                    </div>
                  </div>
                ))}
                {(server.tools?.length || 0) > 6 && (
                  <p className="text-[8px] text-indigo-500 mt-1">+{server.tools.length - 6} more tools</p>
                )}
              </div>
            </div>

            {/* Agent mapping */}
            <div className="px-4 py-2 border-t bg-gray-50">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Bot size={10} className="text-gray-400" />
                {server.used_by?.includes('all') ? (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600">All agents</span>
                ) : (
                  (server.used_by || server.id).slice(0, 4).map((aid: string) => (
                    <span key={aid} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{aid}</span>
                  ))
                )}
                {server.used_by?.length > 4 && (
                  <span className="text-[8px] text-gray-400">+{server.used_by.length - 4}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServers.length === 0 && (
        <div className="text-center py-10">
          <Server size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No MCP servers matching "{search}"</p>
        </div>
      )}

      {/* Agent-to-MCP Mapping Table */}
      <section className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={18} className="text-indigo-600" />
          <h2 className="text-base font-bold">Agent-to-MCP Mapping</h2>
          <span className="text-[10px] text-gray-400 ml-auto">{agentsUsingMcp} agents have MCP server access</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Each agent is assigned MCP servers based on its role. Mapping defined in <code className="bg-gray-100 px-1 rounded text-[10px]">00_state_ledger/MCP_SERVERS.json</code>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-[9px] text-gray-500 uppercase">
                <th className="text-left py-2 pr-3 font-medium">Agent</th>
                <th className="text-left py-2 pr-3 font-medium">Role</th>
                <th className="text-left py-2 font-medium">MCP Servers</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(agentMapping).map(([agentId, serverIds]) => {
                const serverNames = serverIds.map(sid => servers.find(s => s.id === sid)?.name || sid).join(', ');
                return (
                  <tr key={agentId} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-3 font-mono text-[10px] text-indigo-600">{agentId}</td>
                    <td className="py-2 pr-3 text-[10px] text-gray-500">
                      {agentId === '00_supervisor_agent' ? 'Orchestrator' :
                       agentId.startsWith('07') ? 'Execution' :
                       agentId.startsWith('08') ? 'QA' :
                       agentId.startsWith('0') ? 'Front-Office' : 'Back-Office'}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {serverIds.map(sid => (
                          <span key={sid} className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-mono">{sid}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Server Detail Modal */}
      {selectedServer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSelectedServer(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[selectedServer.status]?.dot || 'bg-gray-400'}`} />
                <h2 className="text-base font-bold">{selectedServer.name}</h2>
              </div>
              <button onClick={() => setSelectedServer(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-gray-400">ID:</span> <span className="font-mono text-[10px]">{selectedServer.id}</span></div>
                <div><span className="text-gray-400">Type:</span> <span className="font-medium capitalize">{selectedServer.type}</span></div>
                <div><span className="text-gray-400">Status:</span> <span className={STATUS_COLORS[selectedServer.status]?.text}>{selectedServer.status}</span></div>
                {selectedServer.url && <div><span className="text-gray-400">URL:</span> <span className="text-[10px]">{selectedServer.url}</span></div>}
              </div>

              <div>
                <h3 className="text-xs font-semibold mb-2">Tools ({selectedServer.tools?.length || 0})</h3>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {(selectedServer.tools || []).map((tool: any, i: number) => (
                    <div key={i} className="border rounded-lg p-2.5">
                      <div className="flex items-start gap-1.5">
                        <Code size={11} className="text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-mono text-[10px] font-medium text-gray-800">{tool.name}</span>
                          <p className="text-[9px] text-gray-500 mt-0.5">{tool.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold mb-1.5">Used by {selectedServer.used_by?.length || 0} agent(s)</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedServer.used_by?.includes('all') ? (
                    <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">All agents</span>
                  ) : (
                    (selectedServer.used_by || []).map((aid: string) => (
                      <span key={aid} className="text-[9px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">{aid}</span>
                    ))
                  )}
                </div>
              </div>

              {selectedServer.docs_url && (
                <div className="text-xs">
                  <a href={selectedServer.docs_url} target="_blank" rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-1">
                    <ExternalLink size={12} /> {selectedServer.docs_url}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

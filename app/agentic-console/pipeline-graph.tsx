'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, X, ExternalLink, CheckCircle, XCircle, Loader2, AlertTriangle, Users, FileText, Shield } from 'lucide-react';
import { AgentState, StatusBadge, PHASE_ORDER, PHASE_COLORS, PHASE_LABELS, PHASE_DESCRIPTIONS } from './shared';

const AGENT_SHORT: Record<string, string> = {
  '00_supervisor_agent': '00', '01_ideation_agent': '01', '02_requirement_agent': '02',
  '03_architect_agent': '03', '04_prototype_agent': '04', '05_program_mgmt_agent': '05',
  '06_infra_devops_agent': '06', '07a_ui_agent': '07a', '07b_api_agent': '07b',
  '07c_backend_db_agent': '07c', '07d_integration_agent': '07d', '08_qa_agent': '08',
  '09_production_agent': '09', '10_tech_pub_agent': '10', '11_customer_onboarding_agent': '11',
  '12_marketing_agent': '12', '13_maintenance_agent': '13', '14_finops_agent': '14',
  '15_secrets_compliance_agent': '15',
};

const STATUS_DOT: Record<string, string> = {
  approved: '#16A34A', completed: '#16A34A', awaiting_approval: '#F59E0B',
  active: '#3B82F6', in_progress: '#3B82F6', pending: '#9CA3AF', idle: '#9CA3AF',
  failed: '#DC2626', blocked: '#DC2626',
};

const STATUS_PULSE: Record<string, boolean> = {
  active: true, in_progress: true, awaiting_approval: false, failed: false, approved: false, completed: false, pending: false,
};

function DotIcon({ status, size = 10 }: { status: string; size?: number }) {
  const color = STATUS_DOT[status] || '#9CA3AF';
  const pulse = STATUS_PULSE[status];
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <span className={`absolute inset-0 rounded-full ${pulse ? 'animate-ping' : ''}`} style={{ backgroundColor: color, opacity: pulse ? 0.3 : 0 }} />
      <span className="absolute inset-0 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

function calculateLayout(agentStates: Record<string, AgentState>) {
  const entries = Object.entries(agentStates).map(([k, v]) => ({ ...v, agent_id: k }));
  const phases = PHASE_ORDER.filter(p => p !== 'system');

  const COL_GAP = 220;
  const ROW_GAP = 100;
  const NODE_W = 200;
  const NODE_H = 130;

  const phaseCols: { phase: string; agents: typeof entries; x: number }[] = [];
  let xOffset = 0;

  for (const phase of phases) {
    const agents = entries.filter(a => a.phase === phase);
    if (agents.length === 0) continue;
    phaseCols.push({ phase, agents, x: xOffset });
    xOffset += COL_GAP;
  }

  const positions: Record<string, { x: number; y: number }> = {};
  for (const col of phaseCols) {
    const colHeight = col.agents.length * ROW_GAP;
    const startY = -colHeight / 2 + ROW_GAP / 2;
    col.agents.forEach((a, i) => {
      positions[a.agent_id] = { x: col.x, y: startY + i * ROW_GAP };
    });
  }

  // Supervisor at top
  positions['00_supervisor_agent'] = { x: phaseCols[0]?.x || 0, y: -ROW_GAP * 2 };

  // Store per-phase Y ranges for edge routing
  const phaseYRange: Record<string, { min: number; max: number }> = {};
  for (const col of phaseCols) {
    const ys = col.agents.map(a => positions[a.agent_id]?.y || 0);
    phaseYRange[col.phase] = { min: Math.min(...ys), max: Math.max(...ys) };
  }

  // Build edges between dependencies
  const edges: { from: string; to: string; path: string }[] = [];
  for (const [id, pos] of Object.entries(positions)) {
    if (id === '00_supervisor_agent') continue;
    const agent = agentStates[id];
    if (!agent?.dependencies) continue;
    for (const depId of agent.dependencies) {
      const fromPos = positions[depId];
      if (!fromPos) continue;
      const x1 = fromPos.x + NODE_W;
      const y1 = fromPos.y + NODE_H / 2;
      const x2 = pos.x;
      const y2 = pos.y + NODE_H / 2;
      const cx1 = x1 + (x2 - x1) * 0.4;
      const cx2 = x2 - (x2 - x1) * 0.4;
      edges.push({ from: depId, to: id, path: `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}` });
    }
  }

  return { positions, edges, phaseCols, NODE_W, NODE_H, ROW_GAP, COL_GAP };
}

function NodeCard({
  agent, position, NODE_W, NODE_H, phaseColor, phaseLabel, onClick,
}: {
  agent: AgentState & { agent_id: string };
  position: { x: number; y: number };
  NODE_W: number; NODE_H: number;
  phaseColor: string; phaseLabel: string;
  onClick: () => void;
}) {
  const passed = agent.compliance_checklist?.filter(c => c.passed).length || 0;
  const total = agent.compliance_checklist?.length || 0;
  const pct = total > 0 ? (passed / total) * 100 : 0;
  const status = agent.status;
  const dotColor = STATUS_DOT[status] || '#9CA3AF';
  const pulse = STATUS_PULSE[status];
  const awaiting = status === 'awaiting_approval';

  return (
    <div
      className="absolute rounded-xl border bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer group"
      style={{
        left: position.x, top: position.y,
        width: NODE_W, height: NODE_H,
        borderColor: awaiting ? '#FCD34D' : phaseColor + '40',
        borderWidth: awaiting ? 2 : 1,
      }}
      onClick={onClick}
    >
      {/* Phase color top bar */}
      <div className="h-1 rounded-t-xl" style={{ backgroundColor: phaseColor }} />

      <div className="p-2.5 space-y-1">
        {/* Row 1: Dot + Name + Status */}
        <div className="flex items-center gap-1.5">
          <DotIcon status={status} size={8} />
          <span className="text-[11px] font-semibold text-gray-800 truncate flex-1">
            {AGENT_SHORT[agent.agent_id] || agent.agent_id}
          </span>
          <span className={`text-[8px] font-medium px-1 py-0.5 rounded ${awaiting ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
            {status.replace('_', ' ')}
          </span>
        </div>

        {/* Row 2: Role */}
        <div className="text-[9px] text-gray-400 truncate">{agent.role}</div>

        {/* Phase context */}
        <div className="text-[8px] text-gray-300 truncate">{phaseLabel}</div>

        {/* Compliance mini-bar */}
        {total > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#16A34A' : pct >= 50 ? '#F59E0B' : '#DC2626' }} />
            </div>
            <span className="text-[8px] font-medium text-gray-400">{passed}/{total}</span>
          </div>
        )}

        {/* Dep count */}
        <div className="flex items-center gap-2 text-[8px] text-gray-300">
          <Users size={8} /> {agent.dependencies?.length || 0} deps
          <FileText size={8} /> {agent.artifacts_emitted?.length || 0} artifacts
        </div>
      </div>
    </div>
  );
}

export default function PipelineGraph({
  agentStates, onAgentClick, className,
}: {
  agentStates: Record<string, AgentState>;
  onAgentClick: (agentId: string) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { positions, edges, phaseCols, NODE_W, NODE_H, ROW_GAP, COL_GAP } = useMemo(
    () => calculateLayout(agentStates),
    [agentStates],
  );

  const entries = useMemo(
    () => Object.entries(agentStates).map(([k, v]) => ({ ...v, agent_id: k })),
    [agentStates],
  );

  // Calculate SVG viewport
  const allX = Object.values(positions).map(p => p.x);
  const allY = Object.values(positions).map(p => p.y);
  const minX = Math.min(...allX) - 20;
  const maxX = Math.max(...allX) + NODE_W + 20;
  const minY = Math.min(...allY) - 40;
  const maxY = Math.max(...allY) + NODE_H + 20;
  const svgW = maxX - minX;
  const svgH = maxY - minY;

  // Phase header positions
  const phaseHeaders = phaseCols.map(col => ({
    phase: col.phase,
    label: PHASE_LABELS[col.phase],
    description: PHASE_DESCRIPTIONS[col.phase],
    x: col.x,
    y: minY + 10,
    color: PHASE_COLORS[col.phase] || '#6B7280',
    width: COL_GAP - 20,
  }));

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className || ''}`}>
      <svg width={svgW} height={svgH} className="block" style={{ minWidth: svgW }}>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#9CA3AF" />
          </marker>
          {phaseHeaders.map(h => (
            <pattern key={h.phase} id={`dots-${h.phase}`} width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.5" fill={h.color} opacity="0.08" />
            </pattern>
          ))}
        </defs>

        {/* Phase background columns */}
        {phaseHeaders.map(h => (
          <rect key={h.phase} x={h.x - 10} y={minY} width={COL_GAP - 10} height={svgH - 20}
            fill={`url(#dots-${h.phase})`} rx={8} opacity={0.5} />
        ))}

        {/* Dependency edges (arrows) */}
        {edges.map((e, i) => (
          <path key={i} d={e.path} fill="none" stroke="#D1D5DB" strokeWidth="1.5" markerEnd="url(#arrowhead)"
            className="hover:stroke-indigo-400 transition-colors" />
        ))}

        {/* Phase headers */}
        {phaseHeaders.map(h => (
          <g key={h.phase}>
            <rect x={h.x - 8} y={h.y - 4} width={h.width} height={36} rx={6} fill={h.color} opacity={0.1} />
            <text x={h.x + h.width / 2 - 8} y={h.y + 12} fill={h.color} fontSize="11" fontWeight="700" fontFamily="system-ui">
              {h.label}
            </text>
            <text x={h.x + h.width / 2 - 8} y={h.y + 24} fill="#9CA3AF" fontSize="8" fontFamily="system-ui">
              {h.description}
            </text>
          </g>
        ))}
      </svg>

      {/* Agent nodes (HTML overlay on SVG) */}
      <div className="absolute inset-0" style={{ left: 0, top: 0 }}>
        {entries.map(a => {
          const pos = positions[a.agent_id];
          if (!pos) return null;
          const phase = a.phase;
          const phaseColor = PHASE_COLORS[phase] || '#6B7280';
          const phaseLabel = PHASE_LABELS[phase] || phase;
          return (
            <NodeCard key={a.agent_id}
              agent={a}
              position={{ x: pos.x - minX, y: pos.y - minY + 40 }}
              NODE_W={NODE_W}
              NODE_H={NODE_H}
              phaseColor={phaseColor}
              phaseLabel={phaseLabel.split(':')[1]?.trim() || phaseLabel}
              onClick={() => onAgentClick(a.agent_id)}
            />
          );
        })}
      </div>
    </div>
  );
}

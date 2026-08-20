'use client';

import React from 'react';
import { 
  Plus, LayoutGrid, List, Search, Filter, 
  MoreVertical, ExternalLink, Clock, CheckCircle2, 
  AlertCircle, ShieldCheck, CreditCard, Activity, Sparkles
} from 'lucide-react';
import { Button } from "@productforge/ui";
import { Card, CardContent } from "@productforge/ui";
import Link from 'next/link';
import { getPlatformConfig } from "@/lib/platform-config";

const platform = getPlatformConfig();

export default function ProjectPortfolioMockup() {
  const projects = [
    { 
      id: 'silk-road', 
      name: 'Silk Road Marketplace', 
      status: 'Active', 
      progress: 65, 
      agents: '12/16', 
      lastUpdate: '2 mins ago',
      type: 'E-commerce'
    },
    { 
      id: 'petemart-mobile', 
      name: `${platform.appName} Mobile`, 
      status: 'Paused', 
      progress: 28, 
      agents: '4/16', 
      lastUpdate: '1 day ago',
      type: 'Mobile'
    },
    { 
      id: 'inventory-sync', 
      name: 'Global Inventory Sync', 
      status: 'Completed', 
      progress: 100, 
      agents: '16/16', 
      lastUpdate: '3 days ago',
      type: 'Backend'
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header & License Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="flex items-center space-x-4">
             <div className="bg-gradient-to-br from-indigo-500 to-fuchsia-500 p-2 rounded-xl">
               <Sparkles className="w-6 h-6 text-white" />
             </div>
             <div>
               <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Product Portfolio</h1>
               <p className="text-slate-500 font-medium">Enterprise License: Professional Edition</p>
             </div>
          </div>
          
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-500 p-2 rounded-lg text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">User ID</span>
                <span className="text-sm font-black text-white">SRINIKC_01</span>
              </div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Project Usage</span>
              <span className="text-sm font-black text-white">3 / 5 <span className="text-slate-600 font-normal ml-1">Active</span></span>
            </div>
            <Button variant="ghost" className="text-xs text-indigo-400 font-bold hover:bg-indigo-500/10 h-auto py-2">
              <CreditCard className="w-4 h-4 mr-2" /> Upgrade
            </Button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search portfolio..." 
                className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
              />
            </div>
            <Button variant="outline" className="border-white/5 bg-slate-900/50 rounded-xl h-auto py-3 px-5 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>

          <Link href="/agentic-console/onboarding">
            <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-8 py-6 font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(99,102,241,0.2)] h-auto">
              <Plus className="w-5 h-5 mr-2" /> Create New Product
            </Button>
          </Link>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Card key={project.id} className="bg-slate-900/20 border-white/5 rounded-[2rem] hover:border-indigo-500/30 transition-all group overflow-hidden shadow-xl">
              <CardContent className="p-0">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          project.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                          project.status === 'Paused' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-500'
                        }`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{project.status}</span>
                      </div>
                      <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase italic tracking-tighter">{project.name}</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:text-white rounded-xl">
                      <MoreVertical className="w-6 h-6" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Current Progress</span>
                      <div className="text-xl font-black text-white">{project.progress}%</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Active Agents</span>
                      <div className="text-xl font-black text-white">{project.agents}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        project.status === 'Active' ? 'bg-indigo-500' : 
                        project.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-700'
                      }`} 
                      style={{ width: `${project.progress}%` }} 
                    />
                  </div>
                </div>

                {/* Footer Link */}
                <Link href="/agentic-console/onboarding" className="flex items-center justify-between px-8 py-5 bg-white/5 hover:bg-white/10 transition-colors border-t border-white/5">
                  <div className="flex items-center text-xs text-slate-500 font-medium">
                    <Clock className="w-4 h-4 mr-2" />
                    Last sync: {project.lastUpdate}
                  </div>
                  <div className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center group-hover:translate-x-1 transition-transform">
                    Enter Cockpit <ExternalLink className="w-4 h-4 ml-2" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}

          {/* Add Project Placeholder */}
          <Link href="/agentic-console/onboarding" className="group">
            <div className="h-full min-h-[300px] border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center space-y-4 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 transition-all duration-500 shadow-xl group-hover:shadow-indigo-500/20">
                <Plus className="w-8 h-8 text-slate-500 group-hover:text-white" />
              </div>
              <span className="text-sm font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400">Add New Product</span>
            </div>
          </Link>
        </div>

        {/* Global Stats Footer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-12 border-t border-white/5">
           <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.3em] flex items-center italic">
                <Activity className="w-4 h-4 mr-2" /> Active System Alerts
              </h3>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-5">
                  <div className="bg-amber-500/10 p-3 rounded-2xl"><AlertCircle className="w-6 h-6 text-amber-500" /></div>
                  <div className="space-y-1">
                    <p className="text-white font-black uppercase text-sm italic tracking-tight">Silk Road Marketplace</p>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">HITL Approval Required: Phase 1 Compliance</p>
                  </div>
                </div>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-black rounded-xl text-[10px] uppercase tracking-widest px-6 py-4 h-auto">Review</Button>
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.3em] flex items-center italic">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Latest Delivery
              </h3>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex items-center space-x-5">
                 <div className="bg-emerald-500/10 p-3 rounded-2xl"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
                 <div className="space-y-1">
                    <p className="text-white font-black uppercase text-sm italic tracking-tight">Global Inventory Sync</p>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">BOM Hand-off Package Generated • Ready for Download</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

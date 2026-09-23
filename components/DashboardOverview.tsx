'use client';

import React, { useMemo } from 'react';
import { RecordItem, AuditLog, RecordCategory } from '@/types';
import TacticalMap from './TacticalMap';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Calendar,
  Filter,
  Flame,
  ArrowUpRight,
  Shield,
  Zap,
  MapPin,
  FileText,
  Users,
  Building2,
  CheckSquare,
  Wrench,
  FolderLock,
  Radio,
} from 'lucide-react';

interface DashboardOverviewProps {
  records: RecordItem[];
  auditLogs: AuditLog[];
  onSelectRecord: (record: RecordItem) => void;
  onNavigateCategory: (category: RecordCategory) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onRefresh?: () => Promise<void> | void;
}

export default function DashboardOverview({
  records,
  auditLogs,
  onSelectRecord,
  onNavigateCategory,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onRefresh,
}: DashboardOverviewProps) {
  // Compute Key Metrics
  const total = records.length;
  const active = records.filter((r) => r.status === 'active').length;
  const pending = records.filter((r) => r.status === 'pending').length;
  const closed = records.filter((r) => r.status === 'closed' || r.status === 'archived').length;
  const criticalAlerts = records.filter((r) => r.priority === 'critical' || (r.priority === 'high' && r.status === 'active'));

  // Exclude PIAGs from Command Overview tactical map feed
  const mapRecords = useMemo(() => {
    return records.filter((r) => {
      const isPiag =
        r.metadata?.is_piag === true ||
        r.metadata?.cmo_type === 'piag' ||
        (r.code && String(r.code).startsWith('PIAG-')) ||
        (r.title && String(r.title).startsWith('[PIAG]'));
      return !isPiag;
    });
  }, [records]);

  // Category items with tailored icons
  const categories: { id: RecordCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'personnel', label: 'Personnel', icon: Users },
    { id: 'units', label: 'Units', icon: Shield },
    { id: 'locations', label: 'Locations', icon: Building2 },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'equipment', label: 'Equipment', icon: Wrench },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FolderLock },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Metric Stat HUD Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 relative overflow-hidden shadow-tactical-card group hover:border-cyan-500/60 hover:shadow-glow-cyan transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">Total Records</span>
            <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-sans text-slate-100 tracking-tight">{total}</span>
            <span className="text-xs text-slate-400 font-sans">across 8 modules</span>
          </div>
          <div className="mt-2.5 text-[11px] text-cyan-400/90 font-sans flex items-center font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2 animate-pulse" />
            Database synchronized
          </div>
        </div>

        {/* Active Operations */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 relative overflow-hidden shadow-tactical-card group hover:border-emerald-500/60 hover:shadow-glow-emerald transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">Active Operations</span>
            <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-sans text-emerald-400 tracking-tight">{active}</span>
            <span className="text-xs text-slate-400 font-sans">
              ({total > 0 ? Math.round((active / total) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-emerald-400/90 font-sans flex items-center font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-radar-dot" />
            Live Theater Execution
          </div>
        </div>

        {/* Pending Approval / Queued */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 relative overflow-hidden shadow-tactical-card group hover:border-amber-500/60 hover:shadow-glow-amber transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">Pending / Queued</span>
            <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-800/60 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-sans text-amber-400 tracking-tight">{pending}</span>
            <span className="text-xs text-slate-400 font-sans">awaiting dispatch</span>
          </div>
          <div className="mt-2.5 text-[11px] text-amber-400/90 font-sans flex items-center font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2" />
            Action Required
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 relative overflow-hidden shadow-tactical-card group hover:border-rose-500/60 hover:shadow-glow-rose transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">Critical Alerts</span>
            <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-800/60 text-rose-400 group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-sans text-rose-400 tracking-tight">{criticalAlerts.length}</span>
            <span className="text-xs text-slate-400 font-sans">priority items</span>
          </div>
          <div className="mt-2.5 text-[11px] text-rose-400/90 font-sans flex items-center font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-2 animate-red-beacon" />
            Priority Triage Active
          </div>
        </div>
      </div>

      {/* 2. Tactical Map & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Leaflet Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-sans font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm shadow-glow-cyan" />
              <span>Geographical Command Grid (Google Terrain)</span>
            </h3>
            <span className="text-xs font-sans text-slate-400 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Click marker to inspect</span>
            </span>
          </div>
          <TacticalMap
            records={mapRecords}
            onSelectRecord={onSelectRecord}
            isLive={true}
            onRefresh={onRefresh}
            className="h-[430px] w-full"
          />
        </div>

        {/* Right 1 Col: Urgent Operational Alerts & Schedule Preview */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 shadow-tactical-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h4 className="text-xs font-sans font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Priority Alert Queue</span>
              </h4>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 font-bold">
                {criticalAlerts.length} Active
              </span>
            </div>

            <div className="space-y-2 max-h-[195px] overflow-y-auto pr-1">
              {criticalAlerts.length === 0 ? (
                <div className="text-xs text-slate-400 font-sans py-6 text-center border border-dashed border-slate-200 rounded-lg">
                  No critical alerts currently flagged.
                </div>
              ) : (
                criticalAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => onSelectRecord(alert)}
                    className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 hover:border-rose-500/50 hover:bg-slate-200 cursor-pointer transition-all space-y-1 group shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-sans text-cyan-300 font-bold group-hover:text-cyan-200">{alert.code || 'ALERT'}</span>
                      <span className="text-[10px] font-sans uppercase px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                        {alert.priority}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-200 truncate group-hover:text-white">{alert.title}</div>
                    <div className="text-[10px] text-slate-400 truncate flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{alert.location_name || 'Field coordinate'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Operational Calendar / Schedule preview */}
          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 shadow-tactical-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h4 className="text-xs font-sans font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Operational Calendar</span>
              </h4>
              <span className="text-[10px] font-sans text-slate-400 font-medium">Next 7 Days</span>
            </div>
            <div className="space-y-2 text-xs font-sans">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 hover:border-cyan-500/40 transition-colors">
                <div className="space-y-0.5">
                  <div className="text-slate-200 font-medium">Radar Frequency Sync</div>
                  <div className="text-[10px] text-slate-400">Target: Twin Peaks Antenna</div>
                </div>
                <span className="text-[10px] text-amber-300 bg-amber-950/80 border border-amber-800/70 px-2 py-0.5 rounded font-bold">
                  Sep 20
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 hover:border-cyan-500/40 transition-colors">
                <div className="space-y-0.5">
                  <div className="text-slate-200 font-medium">Perimeter Patrol Shift Alpha</div>
                  <div className="text-[10px] text-slate-400">Echo Recon Platoon</div>
                </div>
                <span className="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-800/70 px-2 py-0.5 rounded font-bold">
                  Daily 0600
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Module Distribution & Recent Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Module Breakdown */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-tactical-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h4 className="text-xs font-sans font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Modules Quick Access</span>
            </h4>
            <span className="text-[10px] font-sans text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800">
              8 Modules
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const count = records.filter((r) => r.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => onNavigateCategory(cat.id)}
                  className="p-3 rounded-lg bg-slate-50/80 border border-slate-200 hover:border-cyan-500/50 hover:bg-slate-200/60 text-left transition-all group"
                >
                  <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 group-hover:text-cyan-300">
                    <div className="flex items-center space-x-1.5 truncate">
                      <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-cyan-400" />
                      <span className="truncate">{cat.label}</span>
                    </div>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                  </div>
                  <div className="text-xl font-extrabold font-sans text-slate-100 mt-1.5">{count}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Live Recent Activity / Audit Feed */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-tactical-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h4 className="text-xs font-sans font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Audit Trail & Activities</span>
            </h4>
            <span className="text-[10px] font-sans font-bold text-emerald-400 flex items-center px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              LIVE LOGS
            </span>
          </div>

          <div className="space-y-2 max-h-[225px] overflow-y-auto pr-1">
            {auditLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 flex items-center justify-between text-xs font-sans hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-3 truncate">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                      log.action === 'CREATE'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : log.action === 'UPDATE'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : log.action === 'DELETE'
                        ? 'bg-rose-950 text-rose-400 border-rose-800'
                        : 'bg-cyan-950 text-cyan-400 border-cyan-800'
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="text-slate-200 font-medium truncate">{log.record_title || 'System Operation'}</span>
                  <span className="text-slate-400 text-[11px] truncate hidden sm:inline font-sans">by {log.actor_email}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

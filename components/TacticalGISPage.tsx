'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RecordItem } from '@/types';
import TacticalMap from '@/components/TacticalMap';
import {
  MapPin,
  RefreshCw,
  Plus,
  Search,
  X,
  GitBranch,
  ChevronDown,
  ChevronUp,
  List,
  Wifi,
  Filter,
  Layers,
  Compass,
  Zap,
} from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'ALL' },
  { key: 'incidents', label: 'INCIDENTS' },
  { key: 'units', label: 'UNITS' },
  { key: 'locations', label: 'LOCATIONS' },
  { key: 'tasks', label: 'TASKS' },
  { key: 'equipment', label: 'EQUIPMENT' },
  { key: 'personnel', label: 'PERSONNEL' },
  { key: 'reports', label: 'REPORTS' },
  { key: 'documents', label: 'DOCUMENTS' },
];

const PRIORITIES = [
  { key: 'all', label: 'ALL' },
  { key: 'critical', label: 'CRITICAL' },
  { key: 'high', label: 'HIGH' },
  { key: 'medium', label: 'MEDIUM' },
  { key: 'low', label: 'LOW' },
];

const STATUSES = [
  { key: 'all', label: 'ALL' },
  { key: 'active', label: 'ACTIVE' },
  { key: 'pending', label: 'PENDING' },
  { key: 'closed', label: 'CLOSED' },
];

const CATEGORY_COLORS: Record<string, string> = {
  incidents: '#f43f5e',
  units: '#22d3ee',
  locations: '#a855f7',
  tasks: '#f59e0b',
  equipment: '#84cc16',
  personnel: '#10b981',
  reports: '#3b82f6',
  documents: '#94a3b8',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#f43f5e',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#10b981',
};

function hasValidCoords(r: RecordItem): boolean {
  const lat = Number(r.lat);
  const lng = Number(r.lng);
  return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
}

interface Props {
  records: RecordItem[];
  isSnapshotting: boolean;
  onOpenSnapshot: () => void;
  onSelectRecord: (rec: RecordItem) => void;
  onOpenCreate: () => void;
  onRefresh: () => Promise<void>;
  isSupabase: boolean;
}

export default function TacticalGISPage({
  records,
  isSnapshotting,
  onOpenSnapshot,
  onSelectRecord,
  onOpenCreate,
  onRefresh,
  isSupabase,
}: Props) {
  const [catFilter, setCatFilter] = useState('all');
  const [prioFilter, setPrioFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(true);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    if (isSupabase) {
      setIsRefreshing(true);
      onRefresh().finally(() => setIsRefreshing(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  }, [onRefresh]);

  const filtered = records.filter((r) => {
    if (catFilter !== 'all' && r.category !== catFilter) return false;
    if (prioFilter !== 'all' && r.priority !== prioFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const hit =
        r.title.toLowerCase().includes(q) ||
        (r.code && r.code.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.location_name && r.location_name.toLowerCase().includes(q));
      if (!hit) return false;
    }
    return true;
  });

  const mappedCount = filtered.filter(hasValidCoords).length;
  const unmappedCount = filtered.length - mappedCount;

  const Chip = ({
    label,
    active,
    color,
    onClick,
  }: {
    label: string;
    active: boolean;
    color?: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-[10px] font-sans font-bold border transition-all ${
        active
          ? 'bg-slate-50 border-cyan-500/70 text-cyan-300 shadow-sm'
          : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-200 hover:border-slate-200'
      }`}
      style={active && color ? { borderColor: color + 'aa', color: color } : {}}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-50/80 border border-slate-200 shadow-tactical-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center space-x-2.5 mb-1">
              <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
              <h2 className="text-base sm:text-lg font-sans font-bold text-slate-100 uppercase tracking-wider">
                Tactical GIS Geolocation Map
              </h2>
              {isSupabase && (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/70 text-[10px] font-sans font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-radar-dot" />
                  <Wifi className="w-3 h-3" />
                  <span>LIVE AUTO-SYNC</span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-sans text-slate-400">
              <span>
                Mapped Coordinates:{' '}
                <strong className="text-emerald-400 font-bold font-sans">{mappedCount}</strong>
              </span>
              <span>•</span>
              <span>
                Total Records:{' '}
                <strong className="text-slate-200 font-sans">{records.length}</strong>
              </span>
              {unmappedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-400/90 font-medium">
                    {unmappedCount} without coordinates
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-300 hover:text-white hover:border-cyan-500/50 text-xs font-sans transition-all active:scale-95 disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={onOpenCreate}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-sans font-bold transition-all shadow-glow-cyan active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>

            <button
              onClick={onOpenSnapshot}
              disabled={isSnapshotting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-cyan-500/60 text-cyan-400 text-xs font-sans font-semibold transition-all active:scale-95 disabled:opacity-50"
              title="GitHub Snapshot Pipeline"
            >
              <GitBranch className={`w-3.5 h-3.5 ${isSnapshotting ? 'animate-spin' : ''}`} />
              <span>{isSnapshotting ? 'Syncing...' : 'GH Snapshot'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-200 space-y-2.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, code, description, or location..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-xs font-sans text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-sans">
            {/* Category Chips */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-slate-400 uppercase text-[10px] font-bold mr-1">Category:</span>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.key}
                  label={c.label}
                  active={catFilter === c.key}
                  color={c.key !== 'all' ? CATEGORY_COLORS[c.key] : undefined}
                  onClick={() => setCatFilter(c.key)}
                />
              ))}
            </div>

            {/* Priority Chips */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-slate-400 uppercase text-[10px] font-bold mr-1">Priority:</span>
              {PRIORITIES.map((p) => (
                <Chip
                  key={p.key}
                  label={p.label}
                  active={prioFilter === p.key}
                  color={p.key !== 'all' ? PRIORITY_COLORS[p.key] : undefined}
                  onClick={() => setPrioFilter(p.key)}
                />
              ))}
            </div>

            {/* Status Chips */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-slate-400 uppercase text-[10px] font-bold mr-1">Status:</span>
              {STATUSES.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  active={statusFilter === s.key}
                  onClick={() => setStatusFilter(s.key)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-2xl relative">
        <TacticalMap
          records={filtered}
          onSelectRecord={onSelectRecord}
          className="h-[520px] w-full"
          focusedRecordId={focusedId}
          isLive={true}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Coordinate Ledger Drawer */}
      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-tactical-card space-y-3">
        <div
          onClick={() => setLedgerOpen(!ledgerOpen)}
          className="flex items-center justify-between cursor-pointer text-xs font-sans font-bold text-slate-200 select-none"
        >
          <div className="flex items-center space-x-2">
            <List className="w-4 h-4 text-cyan-400" />
            <span className="uppercase tracking-wider">
              Field Coordinate Ledger ({mappedCount} Geocoded Pins)
            </span>
          </div>
          {ledgerOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>

        {ledgerOpen && (
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3">Coordinates</th>
                  <th className="py-2 px-3">Location Name</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-command-800/60">
                {filtered.map((r) => {
                  const hasCoord = hasValidCoords(r);
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-200/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectRecord(r)}
                    >
                      <td className="py-2.5 px-3 font-bold text-cyan-400">{r.code || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-200 font-semibold group-hover:text-cyan-300">
                        {r.title}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[10px] text-slate-400 font-medium">
                        {r.category}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            r.priority === 'critical'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : r.priority === 'high'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}
                        >
                          {r.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {hasCoord ? (
                          <span className="text-emerald-400 font-medium">
                            {Number(r.lat).toFixed(4)}, {Number(r.lng).toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No GPS Data</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 truncate max-w-xs font-sans">
                        {r.location_name || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRecord(r);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-200 text-slate-200 hover:text-white text-[11px] font-semibold border border-slate-200 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

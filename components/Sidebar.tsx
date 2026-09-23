'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Users,
  ShieldAlert,
  Building2,
  AlertTriangle,
  CheckSquare,
  Wrench,
  FileText,
  FolderLock,
  History,
  Database,
  Calendar,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Layers,
  Crosshair,
  Eye,
  Globe,
  Flame,
  Radio,
  Cpu,
  Truck,
  Activity,
  UserCheck,
  Lock,
} from 'lucide-react';
import { RecordCategory, OperationalCellType } from '@/types';

export type NavView =
  | 'overview'
  | 'map'
  | 'audit'
  | 'calendar'
  | 'users'
  | RecordCategory
  | OperationalCellType;

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  counts: Record<string, number>;
  onOpenSnapshot?: () => void;
  isSnapshotting?: boolean;
}

export default function Sidebar({
  currentView,
  onSelectView,
  counts,
  onOpenSnapshot,
  isSnapshotting = false,
}: SidebarProps) {
  const mainNav = [
    { id: 'overview', label: 'COMMAND OVERVIEW', icon: LayoutDashboard },
  ];

  const crudModules: { id: RecordCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'incidents', label: 'Events & Incidents', icon: AlertTriangle },
    { id: 'personnel', label: 'Personnel & Agents', icon: Users },
    { id: 'units', label: 'Units & Squads', icon: ShieldAlert },
    { id: 'locations', label: 'Locations & Facilities', icon: Building2 },
    { id: 'tasks', label: 'Tasks & Missions', icon: CheckSquare },
    { id: 'equipment', label: 'Equipment & Logistics', icon: Wrench },
    { id: 'reports', label: 'Intelligence Reports', icon: FileText },
    { id: 'documents', label: 'Secure Documents', icon: FolderLock },
  ];

  const operationalCells: { id: OperationalCellType; label: string; code: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'operation_cell', label: 'Operation Cell', code: 'G3', icon: Crosshair },
    { id: 'intelligence_cell', label: 'Intelligence Cell', code: 'G2', icon: Eye },
    { id: 'cmo_cell', label: 'CMO Cell', code: 'G7', icon: Globe },
    { id: 'personnel_cell', label: 'Personnel Cell', code: 'G1', icon: Users },
    { id: 'fire_support_cell', label: 'Fire Support Cell', code: 'FS', icon: Flame },
    { id: 'io_cell', label: 'IO Cell', code: 'IO', icon: Radio },
    { id: 'c4s_cell', label: 'C4S Cell', code: 'C4S', icon: Cpu },
    { id: 'logistics_cell', label: 'Logistics Cell', code: 'G4', icon: Truck },
  ];

  const isCrudActive = crudModules.some((m) => m.id === currentView);
  const isCellActive = operationalCells.some((c) => c.id === currentView);

  const [isStaffOpen, setIsStaffOpen] = useState(true);
  const [isOperationalCellOpen, setIsOperationalCellOpen] = useState(true);

  useEffect(() => {
    if (isCrudActive) setIsStaffOpen(true);
    if (isCellActive) setIsOperationalCellOpen(true);
  }, [currentView, isCrudActive, isCellActive]);

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 select-none shadow-sm">
      <div className="p-3 space-y-5 overflow-y-auto">
        {/* Primary Views */}
        <div>
         
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id as NavView)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1 rounded-md ${isActive ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Operational Cell Dropdown */}
        <div>
          <button
            onClick={() => setIsOperationalCellOpen(!isOperationalCellOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded bg-blue-50 border border-blue-200 text-blue-600">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-sans uppercase tracking-wider font-bold">
                Operational Cells
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                8 Cells
              </span>
              {isOperationalCellOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 transition-transform" />
              )}
            </div>
          </button>

          {isOperationalCellOpen && (
            <nav className="space-y-1 mt-1.5 pl-1">
              {operationalCells.map((cell) => {
                const Icon = cell.icon;
                const isActive = currentView === cell.id;
                return (
                  <button
                    key={cell.id}
                    onClick={() => onSelectView(cell.id as NavView)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-sans transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="truncate">{cell.label}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-bold ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {cell.code}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Staff Modules Dropdown */}
      
        {/* Governance & Additional Operations */}
        <div>
          <div className="text-[11px] font-sans uppercase tracking-wider text-slate-400 px-3 mb-2 font-bold flex items-center justify-between">
            <span>Governance & Tracking</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onSelectView('audit')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans transition-all ${
                currentView === 'audit'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <History className={`w-4 h-4 ${currentView === 'audit' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Audit & Activity Logs</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-sans">
                {counts.audit || 0}
              </span>
            </button>

            <button
              onClick={() => onSelectView('calendar')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans transition-all ${
                currentView === 'calendar'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Calendar className={`w-4 h-4 ${currentView === 'calendar' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Google Calendar</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-sans font-bold">
                LIVE
              </span>
            </button>

            <button
              onClick={() => onSelectView('map')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans transition-all ${
                currentView === 'map'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <MapPin className={`w-4 h-4 ${currentView === 'map' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Tactical GIS Map</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-sans font-bold">
                {counts.map ?? 'GIS'}
              </span>
            </button>

            <button
              onClick={() => onSelectView('users')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans transition-all ${
                currentView === 'users'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <UserCheck className={`w-4 h-4 ${currentView === 'users' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Users & Operators</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-sans font-bold">
                {counts.users ?? 'AUTH'}
              </span>
            </button>

            <button
              onClick={onOpenSnapshot}
              disabled={isSnapshotting}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans transition-all text-slate-600 hover:text-blue-600 hover:bg-slate-50 group active:scale-95"
              title="GitHub JSON Snapshot Pipeline"
            >
              <div className="flex items-center space-x-2.5">
                <GitBranch className={`w-4 h-4 text-slate-400 group-hover:text-blue-600 ${isSnapshotting ? 'animate-spin text-blue-600' : ''}`} />
                <span>GH Snapshot</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-sans font-bold">
                {isSnapshotting ? 'SYNC' : 'READY'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Status Box */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] font-sans space-y-2">
        <div className="flex items-center justify-between text-slate-700">
          <span className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-slate-900">RLS Enforcement</span>
          </span>
          <span className="text-blue-700 font-bold text-[10px] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
            ACTIVE
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-500 leading-relaxed shadow-sm">
          <span>Row Level Security active on PostgreSQL database for classified mission records.</span>
        </div>
      </div>
    </aside>
  );
}

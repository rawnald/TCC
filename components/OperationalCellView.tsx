'use client';

import React, { useState, useMemo } from 'react';
import { RecordItem, RecordCategory, OperationalCellType } from '@/types';
import {
  Crosshair,
  Eye,
  Globe,
  Users,
  Flame,
  Radio,
  Cpu,
  Truck,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronDown,
  Plus,
  Search,
  Filter,
  FileText,
  Activity,
  Send,
  Sparkles,
  ExternalLink,
  Zap,
} from 'lucide-react';
import TacticalMap from './TacticalMap';
import OperationCellWorkspace from './OperationCellWorkspace';
import IntelligenceCellWorkspace from './IntelligenceCellWorkspace';
import PersonnelCellWorkspace from './PersonnelCellWorkspace';
import CMOCellWorkspace from './CMOCellWorkspace';

interface OperationalCellConfig {
  id: OperationalCellType;
  name: string;
  code: string;
  icon: React.ComponentType<{ className?: string }>;
  roleDescription: string;
  doctrine: string;
  dutyOfficer: string;
  callsign: string;
  readiness: string;
  primaryCategories: RecordCategory[];
  accentColor: string;
}

export const OPERATIONAL_CELL_CONFIGS: Record<OperationalCellType, OperationalCellConfig> = {
  operation_cell: {
    id: 'operation_cell',
    name: 'Operation Cell',
    code: 'G3 // OPS',
    icon: Crosshair,
    roleDescription: 'Current Operations, Incident Command & Mission Tasking, Force Status',
    doctrine: 'Monitors real-time theater incidents, dispatches tactical intervention teams, tracks mission milestones, and coordinates field assets.',
    dutyOfficer: 'Maj. Marcus Vance',
    callsign: 'OVERLORD-ACTUAL',
    readiness: '98.5% Combat Effective',
    primaryCategories: ['incidents', 'tasks'],
    accentColor: 'text-blue-700 border-blue-200 bg-blue-50',
  },
  intelligence_cell: {
    id: 'intelligence_cell',
    name: 'Intelligence Cell',
    code: 'G2 // INTEL',
    icon: Eye,
    roleDescription: 'Reconnaissance, Threat Assessment & Intelligence Reports',
    doctrine: 'Synthesizes electronic telemetry, surveillance reports, hostile movements, and produces actionable threat estimates for commanders.',
    dutyOfficer: 'Capt. Elena Rostova',
    callsign: 'ORACLE-LEAD',
    readiness: '100% Sensor Grid Active',
    primaryCategories: ['reports', 'incidents'],
    accentColor: 'text-blue-700 border-blue-200 bg-blue-50',
  },
  cmo_cell: {
    id: 'cmo_cell',
    name: 'CMO Cell',
    code: 'G7 // CIVIL',
    icon: Globe,
    roleDescription: 'Civil-Military Operations & Inter-Agency Coordination',
    doctrine: 'Liaises with civilian authorities, manages non-governmental agency coordination, secures municipal infrastructure, and coordinates humanitarian corridors.',
    dutyOfficer: 'Lt. Carlos Delgado',
    callsign: 'HARMONY-01',
    readiness: '94.0% Infrastructure Secure',
    primaryCategories: ['locations', 'reports'],
    accentColor: 'text-blue-700 border-blue-200 bg-blue-50',
  },
  personnel_cell: {
    id: 'personnel_cell',
    name: 'Personnel Cell',
    code: 'G1 // PERS',
    icon: Users,
    roleDescription: 'Force Strength, Operator Deployment & Manning Rosters',
    doctrine: 'Maintains unit manning records, security clearance levels, casualty assessments, agent rotation schedules, and tactical assignments.',
    dutyOfficer: 'Capt. Rebecca Chen',
    callsign: 'SENTINEL-HQ',
    readiness: '100% Accountability Verified',
    primaryCategories: ['personnel', 'units'],
    accentColor: 'text-blue-700 border-blue-200 bg-blue-50',
  },
  fire_support_cell: {
    id: 'fire_support_cell',
    name: 'Fire Support Cell',
    code: 'FS // FIRES',
    icon: Flame,
    roleDescription: 'Joint Fire Coordination, Trajectory Tracking & Strike Missions',
    doctrine: 'Directs joint kinetic assets, close air support (CAS), indirect artillery coordination, and designated strike envelope deconfliction.',
    dutyOfficer: 'Maj. Dennis Miller',
    callsign: 'HAMMER-LEAD',
    readiness: 'Condition Amber // Armed',
    primaryCategories: ['tasks', 'incidents'],
    accentColor: 'text-blue-700 border-blue-200 bg-blue-50',
  },
  io_cell: {
    id: 'io_cell',
    name: 'IO Cell',
    code: 'IO // INFO',
    icon: Radio,
    roleDescription: 'Information Operations, Cyber Warfare & Public Affairs',
    doctrine: 'Executes psychological operations (PSYOPS), counters adversarial misinformation, sanitizes classified bulletins, and controls operational narratives.',
    dutyOfficer: 'Capt. Sarah Thorne',
    callsign: 'GHOST-NET',
    readiness: 'Cyber Shield Active // 100%',
    primaryCategories: ['documents', 'reports'],
    accentColor: 'text-blue-700 border-blue-200 bg-blue-50',
  },
  c4s_cell: {
    id: 'c4s_cell',
    name: 'C4S Cell',
    code: 'C4S // COMM',
    icon: Cpu,
    roleDescription: 'Command, Control, Comms, Computers & Security Systems',
    doctrine: 'Maintains cryptographic mesh networks, satellite uplinks, secure communications hardware, hardware logistics, and firewall integrity.',
    dutyOfficer: 'Chief Tech A. Perez',
    callsign: 'SPECTRUM-01',
    readiness: '99.98% Uplink Uptime',
    primaryCategories: ['equipment', 'documents'],
    accentColor: 'text-blue-700 border-blue-200 bg-blue-50',
  },
  logistics_cell: {
    id: 'logistics_cell',
    name: 'Logistics Cell',
    code: 'G4 // LOG',
    icon: Truck,
    roleDescription: 'Supply Chain, Munitions Sustainment & Maintenance Fleet',
    doctrine: 'Guarantees munitions availability, equipment repairs, fuel delivery, supply convoy security, and forward operational depot stockpiles.',
    dutyOfficer: 'Maj. Boris Kowalski',
    callsign: 'ANVIL-BASE',
    readiness: '100% Sustainment Flowing',
    primaryCategories: ['equipment', 'locations'],
    accentColor: 'text-blue-700 border-blue-200 bg-blue-50',
  },
};

interface OperationalCellViewProps {
  cellId: OperationalCellType;
  onSelectCell: (cellId: OperationalCellType) => void;
  records: RecordItem[];
  onSelectRecord: (record: RecordItem) => void;
  onOpenCreate: (defaultCategory?: RecordCategory) => void;
  onSaveRecord?: (record: Partial<RecordItem>) => Promise<void> | void;
  onDeleteRecord?: (id: string) => Promise<void> | void;
  onRefreshData?: () => Promise<void> | void;
}

export default function OperationalCellView({
  cellId,
  onSelectCell,
  records,
  onSelectRecord,
  onOpenCreate,
  onSaveRecord,
  onDeleteRecord,
  onRefreshData,
}: OperationalCellViewProps) {
  const config = OPERATIONAL_CELL_CONFIGS[cellId] || OPERATIONAL_CELL_CONFIGS.operation_cell;
  const CellIcon = config.icon;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'closed'>('all');
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [sitrepText, setSitrepText] = useState('');
  const [sitrepLogs, setSitrepLogs] = useState<Array<{ id: string; time: string; text: string; author: string }>>([
    {
      id: '1',
      time: '10 mins ago',
      text: `${config.name} operational synchronization complete. All watches manned.`,
      author: config.dutyOfficer,
    },
  ]);

  // Filter records tied to this cell
  const cellRecords = useMemo(() => {
    return records.filter((r) => {
      // Exclude PIAGs from Operation Cell
      const isPiag =
        r.metadata?.is_piag === true ||
        r.metadata?.cmo_type === 'piag' ||
        (r.code && String(r.code).startsWith('PIAG-')) ||
        (r.title && String(r.title).startsWith('[PIAG]'));
      if (cellId === 'operation_cell' && isPiag) return false;

      const matchesCell = showAllRecords || config.primaryCategories.includes(r.category);
      const matchesSearch =
        !searchQuery ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.code && r.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.location_name && r.location_name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesCell && matchesSearch && matchesStatus;
    });
  }, [records, config, showAllRecords, searchQuery, statusFilter, cellId]);

  const criticalCount = useMemo(() => {
    return cellRecords.filter((r) => r.priority === 'critical' || r.priority === 'high').length;
  }, [cellRecords]);

  const activeCount = useMemo(() => {
    return cellRecords.filter((r) => r.status === 'active').length;
  }, [cellRecords]);

  const handlePostSitrep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sitrepText.trim()) return;
    const newEntry = {
      id: String(Date.now()),
      time: 'Just now',
      text: sitrepText.trim(),
      author: config.dutyOfficer,
    };
    setSitrepLogs((prev) => [newEntry, ...prev]);
    setSitrepText('');
  };

  return (
    <div className="space-y-6">
      {/* Top Cell Command Header */}
     
      {cellId === 'operation_cell' ? (
        <OperationCellWorkspace
          records={records}
          onSelectRecord={onSelectRecord}
          onOpenCreate={onOpenCreate}
          onSaveRecord={onSaveRecord}
          onDeleteRecord={onDeleteRecord}
          onRefreshData={onRefreshData}
          dutyOfficer={config.dutyOfficer}
          callsign={config.callsign}
        />
      ) : cellId === 'intelligence_cell' ? (
        <IntelligenceCellWorkspace
          records={records}
          onSelectRecord={onSelectRecord}
          onOpenCreate={onOpenCreate}
          onSaveRecord={onSaveRecord}
          onDeleteRecord={onDeleteRecord}
          onRefreshData={onRefreshData}
          dutyOfficer={config.dutyOfficer}
          callsign={config.callsign}
        />
      ) : cellId === 'personnel_cell' ? (
        <PersonnelCellWorkspace
          records={records}
          onSelectRecord={onSelectRecord}
          onOpenCreate={onOpenCreate}
          onSaveRecord={onSaveRecord}
          onDeleteRecord={onDeleteRecord}
          onRefreshData={onRefreshData}
          dutyOfficer={config.dutyOfficer}
          callsign={config.callsign}
        />
      ) : cellId === 'cmo_cell' ? (
        <CMOCellWorkspace
          records={records}
          onSelectRecord={onSelectRecord}
          onOpenCreate={onOpenCreate}
          onSaveRecord={onSaveRecord}
          onDeleteRecord={onDeleteRecord}
          onRefreshData={onRefreshData}
          dutyOfficer={config.dutyOfficer}
          callsign={config.callsign}
        />
      ) : (
        <>
          {/* 4 Cell Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 font-sans">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wider">Assigned Cell Records</div>
              <div className="text-2xl font-sans font-extrabold text-slate-900 mt-1">{cellRecords.length}</div>
              <div className="text-xs font-sans text-blue-700 mt-0.5 font-medium">
                Scope: {config.primaryCategories.join(' & ')}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wider">Active Status Items</div>
              <div className="text-2xl font-sans font-extrabold text-blue-600 mt-1">{activeCount}</div>
              <div className="text-xs font-sans text-slate-500 mt-0.5">Live execution underway</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wider">High / Critical Priority</div>
              <div className="text-2xl font-sans font-extrabold text-slate-900 mt-1">{criticalCount}</div>
              <div className="text-xs font-sans text-slate-500 mt-0.5">Requires immediate oversight</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wider">Cell Watch Status</div>
              <div className="text-sm font-sans font-bold text-blue-700 mt-2 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>AUTHENTICATED</span>
              </div>
              <div className="text-xs font-sans text-slate-500 mt-0.5">{config.readiness}</div>
            </div>
          </div>

          {/* Main Workspace Grid: Records Table + Tactical GIS & SitRep Dispatch */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans">
            {/* Left 2 Cols: Filterable Cell Records */}
            <div className="xl:col-span-2 space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span>{config.name} Operations Roster</span>
                    </h2>
                    <p className="text-xs font-sans text-slate-500 mt-0.5">
                      Tracking {cellRecords.length} records mapped to {config.primaryCategories.join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowAllRecords(!showAllRecords)}
                      className={`px-3 py-1 rounded-lg text-xs font-sans border transition-all ${
                        showAllRecords
                          ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {showAllRecords ? 'Showing All Records' : 'Filter by Cell Scope'}
                    </button>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder={`Search ${config.name} records...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5 w-full sm:w-auto">
                    {(['all', 'active', 'pending', 'closed'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-sans uppercase transition-all ${
                          statusFilter === st
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                            : 'text-slate-500 hover:text-slate-800 bg-white border border-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Records List Table */}
                <div className="mt-3 overflow-x-auto">
                  {cellRecords.length === 0 ? (
                    <div className="p-8 text-center text-xs font-sans text-slate-500 border border-dashed border-slate-200 rounded-xl my-2">
                      No records found matching current {config.name} filters.
                      <div className="mt-2">
                        <button
                          onClick={() => onOpenCreate(config.primaryCategories[0])}
                          className="text-blue-600 hover:underline font-bold"
                        >
                          + Create new record for this cell
                        </button>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold bg-slate-50">
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3">Title & Summary</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Priority</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {cellRecords.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50 transition-colors group cursor-pointer"
                            onClick={() => onSelectRecord(item)}
                          >
                            <td className="py-2.5 px-3 font-bold text-blue-600">{item.code}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900 group-hover:text-blue-600">
                                {item.title}
                              </div>
                              {item.location_name && (
                                <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{item.location_name}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 uppercase text-[11px] text-slate-500 font-medium">
                              {item.category}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                                  item.status === 'active'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : item.status === 'pending'
                                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                                  item.priority === 'critical'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                                    : item.priority === 'high'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {item.priority}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectRecord(item);
                                }}
                                className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Tactical Mini-GIS & Cell SitRep Dispatch */}
            <div className="space-y-4">
              {/* Cell GIS Geolocation Radar */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-sans font-bold text-slate-800 uppercase flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{config.name} Field Coordinates</span>
                  </h3>
                  <span className="text-[11px] font-sans text-slate-500 font-medium">
                    {cellRecords.filter((r) => r.lat !== undefined && r.lng !== undefined).length} Pins
                  </span>
                </div>

                <TacticalMap
                  records={cellRecords}
                  onSelectRecord={onSelectRecord}
                  isLive={true}
                  className="h-[240px] w-full rounded-lg border border-slate-200"
                />
              </div>

              {/* Cell SitRep Dispatch Log */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-sans font-bold text-slate-800 uppercase flex items-center space-x-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>{config.name} SitRep Log</span>
                  </h3>
                  <span className="text-[10px] font-sans text-blue-700 font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                    SECURE DISPATCH
                  </span>
                </div>

                <form onSubmit={handlePostSitrep} className="space-y-2">
                  <textarea
                    value={sitrepText}
                    onChange={(e) => setSitrepText(e.target.value)}
                    placeholder={`Dispatch note to ${config.name}...`}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white h-16 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!sitrepText.trim()}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95"
                    >
                      <Send className="w-3 h-3" />
                      <span>Dispatch SitRep</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sitrepLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-sans space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="text-blue-700 font-semibold">{log.author}</span>
                        <span>{log.time}</span>
                      </div>
                      <div className="text-slate-800 text-xs leading-relaxed">{log.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { RecordItem, RecordCategory, RecordStatus, RecordPriority } from '@/types';
import { useAuth } from '@/lib/authContext';
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface RecordListProps {
  category: RecordCategory;
  records: RecordItem[];
  onOpenCreate: () => void;
  onOpenEdit: (record: RecordItem) => void;
  onDeleteRecord: (id: string) => void;
  onViewRecord: (record: RecordItem) => void;
  onFocusOnMap: (record: RecordItem) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export default function RecordList({
  category,
  records,
  onOpenCreate,
  onOpenEdit,
  onDeleteRecord,
  onViewRecord,
  onFocusOnMap,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}: RecordListProps) {
  const { canEdit, canDelete, role } = useAuth();

  const getCategoryTitle = (cat: RecordCategory) => {
    switch (cat) {
      case 'personnel':
        return 'Personnel & Agents Registry';
      case 'units':
        return 'Units & Tactical Squads';
      case 'locations':
        return 'Locations & Critical Facilities';
      case 'incidents':
        return 'Events & Incidents Log';
      case 'tasks':
        return 'Tasks & Tactical Missions';
      case 'equipment':
        return 'Equipment & Logistics Inventory';
      case 'reports':
        return 'Intelligence & Field Reports';
      case 'documents':
        return 'Classified Documents & Protocols';
    }
  };

  const getPriorityStyle = (p: RecordPriority) => {
    switch (p) {
      case 'critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/80';
      case 'high':
        return 'bg-orange-950/80 text-orange-300 border-orange-700/80';
      case 'medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/80';
      case 'low':
        return 'bg-slate-900 text-slate-400 border-slate-700/80';
    }
  };

  const getStatusStyle = (s: RecordStatus) => {
    switch (s) {
      case 'active':
        return 'bg-emerald-950 text-emerald-400 border-emerald-700/80';
      case 'pending':
        return 'bg-amber-950 text-amber-400 border-amber-700/80';
      case 'closed':
      case 'archived':
        return 'bg-slate-900 text-slate-400 border-slate-700/80';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-tactical-card">
        <div>
          <h2 className="text-base font-sans font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm shadow-glow-cyan" />
            <span>{getCategoryTitle(category)}</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Managing operational records with Row Level Security ({records.length} records found)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {canEdit ? (
            <button
              onClick={onOpenCreate}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-sans font-bold transition-all shadow-glow-cyan active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-sans text-slate-400 font-medium">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Viewer Role (Read-Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200 text-xs font-sans">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records, code, location..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-slate-400 text-[11px] uppercase mr-1 font-bold">Status:</span>
          {['all', 'active', 'pending', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-md text-[11px] uppercase transition-all font-semibold ${
                statusFilter === status
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'bg-slate-50 text-slate-400 hover:text-slate-200 border border-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table / Card Grid */}
      {records.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-50/40 border border-dashed border-slate-200 space-y-3">
          <Layers className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="text-sm font-sans text-slate-300">No records found matching your filters.</div>
          {canEdit && (
            <button
              onClick={onOpenCreate}
              className="px-3.5 py-2 rounded-lg bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 text-xs font-sans font-bold hover:bg-cyan-600/50 transition-all inline-flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Record</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-cyan-500/50 hover:bg-slate-200/80 transition-all shadow-tactical-card space-y-3 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-sans text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {record.code || record.category.toUpperCase()}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-200 transition-colors">
                    {record.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-sans uppercase px-2 py-0.5 rounded font-bold border ${getStatusStyle(
                      record.status
                    )}`}
                  >
                    {record.status}
                  </span>
                  <span
                    className={`text-[10px] font-sans uppercase px-2 py-0.5 rounded font-bold border ${getPriorityStyle(
                      record.priority
                    )}`}
                  >
                    {record.priority}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed font-sans">{record.description}</div>

              {/* Coordinates and Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-sans text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  {record.location_name && (
                    <div className="flex items-center space-x-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{record.location_name}</span>
                    </div>
                  )}

                  {typeof record.lat === 'number' && typeof record.lng === 'number' && (
                    <button
                      onClick={() => onFocusOnMap(record)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-cyan-500/60 text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold transition-all shadow-sm"
                      title="View on Map"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>
                        {record.lat.toFixed(4)}, {record.lng.toFixed(4)}
                      </span>
                    </button>
                  )}

                  {/* Dynamic Metadata previews */}
                  {record.metadata &&
                    Object.entries(record.metadata)
                      .slice(0, 2)
                      .map(([k, v]) => (
                        <div key={k} className="px-2 py-0.5 rounded bg-slate-50/80 border border-slate-200 text-[10px] text-slate-400">
                          <span className="text-slate-500 uppercase font-semibold">{k}:</span> {String(v)}
                        </div>
                      ))}
                </div>

                {/* Actions: Edit, Delete, View */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onViewRecord(record)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-200 transition-all"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {canEdit && (
                    <button
                      onClick={() => onOpenEdit(record)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-cyan-400 hover:text-cyan-300 transition-all"
                      title="Edit Record"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => onDeleteRecord(record.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-all"
                      title="Delete Record (Admin Only)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

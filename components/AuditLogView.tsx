'use client';

import React, { useState } from 'react';
import { AuditLog } from '@/types';
import { History, Shield, Filter, Search, ChevronDown, ChevronRight, FileJson, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export default function AuditLogView({ logs }: AuditLogViewProps) {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesSearch =
      !search ||
      log.actor_email.toLowerCase().includes(search.toLowerCase()) ||
      (log.record_title && log.record_title.toLowerCase().includes(search.toLowerCase())) ||
      (log.category && log.category.toLowerCase().includes(search.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800 shadow-sm shadow-emerald-950/40';
      case 'UPDATE':
        return 'bg-amber-950 text-amber-400 border-amber-800 shadow-sm shadow-amber-950/40';
      case 'DELETE':
        return 'bg-rose-950 text-rose-400 border-rose-800 shadow-sm shadow-rose-950/40';
      case 'SNAPSHOT_EXPORT':
        return 'bg-cyan-950 text-cyan-400 border-cyan-800 shadow-sm shadow-cyan-950/40';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-tactical-card">
        <div>
          <h2 className="text-base font-sans font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2.5">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Operational Audit & Activity Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Immutable log of all create, update, delete, and automated GitHub snapshot operations
          </p>
        </div>

        <div className="text-xs font-sans font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-3.5 py-1.5 rounded-lg flex items-center space-x-2 shadow-sm">
          <History className="w-4 h-4" />
          <span>{filteredLogs.length} Events Logged</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200 text-xs font-sans">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by operator email or record title..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-slate-400 text-[11px] uppercase mr-1 font-bold">Action:</span>
          {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'SNAPSHOT_EXPORT'].map((act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-3 py-1 rounded-md text-[11px] uppercase transition-all font-semibold ${
                filterAction === act
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'bg-slate-50 text-slate-400 hover:text-slate-200 border border-slate-200'
              }`}
            >
              {act}
            </button>
          ))}
        </div>
      </div>

      {/* Log Entries */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50/40 border border-dashed border-slate-200 text-xs font-sans text-slate-400">
            No audit records found matching criteria.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                className="rounded-xl bg-slate-50/80 border border-slate-200 overflow-hidden text-xs font-sans transition-all shadow-sm hover:border-slate-200"
              >
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-200/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 truncate">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-slate-200 font-medium truncate">
                      {log.record_title || 'System Operation'}
                    </span>
                    <span className="text-slate-400 text-[11px] truncate hidden md:inline font-sans">
                      by <span className="text-cyan-300 font-sans font-medium">{log.actor_email}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 text-slate-400 text-[11px]">
                    {log.category && (
                      <span className="hidden sm:inline px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-200 uppercase text-[10px] font-semibold">
                        {log.category}
                      </span>
                    )}
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-slate-50/90 border-t border-slate-200 space-y-2">
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2 font-bold uppercase">
                      <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Payload Snapshot & Context:</span>
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-50/90 border border-slate-200 text-[11px] text-cyan-300 overflow-x-auto leading-relaxed shadow-inner">
                      {JSON.stringify(log.details || log, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

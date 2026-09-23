'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CheckSquare, X, Save, Loader2, Compass, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { ForceUnit } from './ForceUnitModal';
import { parseMGRSToCoords, cleanMGRS } from '@/lib/mgrsUtils';

export interface UnitTasking {
  id: string;
  assigned_unit_id: string;
  assigned_unit_label: string;
  directive_details: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  mgrs: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  task_date: string;
  created_at: string;
  updated_at: string;
}

export interface UnitOption {
  id: string;
  label: string;
}

interface UnitTaskingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tasking: UnitTasking) => Promise<void>;
  editingTasking?: UnitTasking | null;
  forceUnits?: ForceUnit[];
  unitOptions?: UnitOption[];
}

const EMPTY_FORM = {
  assigned_unit_id: '',
  assigned_unit_label: '',
  directive_details: '',
  priority: 'medium' as UnitTasking['priority'],
  mgrs: '',
  status: 'pending' as UnitTasking['status'],
  task_date: new Date().toISOString().slice(0, 10),
};

const PRIORITY_OPTIONS: { value: UnitTasking['priority']; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'text-blue-600 bg-rose-950 border-rose-800' },
  { value: 'high',     label: 'High',     color: 'text-blue-600 bg-amber-950 border-amber-800' },
  { value: 'medium',   label: 'Medium',   color: 'text-blue-600 bg-cyan-950 border-cyan-800' },
  { value: 'low',      label: 'Low',      color: 'text-slate-700 bg-slate-900 border-slate-700' },
];

const STATUS_OPTIONS: { value: UnitTasking['status']; label: string; color: string }[] = [
  { value: 'pending',   label: 'Pending',   color: 'text-blue-600 bg-amber-950 border-amber-800' },
  { value: 'active',    label: 'Active',    color: 'text-emerald-400 bg-emerald-950 border-emerald-800' },
  { value: 'completed', label: 'Completed', color: 'text-blue-400 bg-blue-950 border-blue-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-slate-500 bg-slate-900 border-slate-700' },
];

export default function UnitTaskingModal({
  isOpen,
  onClose,
  onSave,
  editingTasking,
  forceUnits = [],
  unitOptions = [],
}: UnitTaskingModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Combine unitOptions and forceUnits into a unified list
  const allUnits = React.useMemo(() => {
    const list: UnitOption[] = [];
    const seen = new Set<string>();

    if (unitOptions) {
      for (const u of unitOptions) {
        if (u && u.id && !seen.has(u.id)) {
          seen.add(u.id);
          list.push(u);
        }
      }
    }
    if (forceUnits) {
      for (const u of forceUnits) {
        if (u && u.id && !seen.has(u.id)) {
          seen.add(u.id);
          list.push({
            id: u.id,
            label: `${u.battalion} / ${u.brigade}${u.area ? ` — ${u.area}` : ''}`,
          });
        }
      }
    }
    return list;
  }, [unitOptions, forceUnits]);

  const decodedCoords = useMemo(() => {
    return form.mgrs.trim() ? parseMGRSToCoords(form.mgrs.trim()) : null;
  }, [form.mgrs]);

  useEffect(() => {
    if (editingTasking) {
      setForm({
        assigned_unit_id:    editingTasking.assigned_unit_id,
        assigned_unit_label: editingTasking.assigned_unit_label,
        directive_details:   editingTasking.directive_details,
        priority:            editingTasking.priority,
        mgrs:                editingTasking.mgrs,
        status:              editingTasking.status,
        task_date:           editingTasking.task_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      });
    } else {
      setForm({ ...EMPTY_FORM, task_date: new Date().toISOString().slice(0, 10) });
    }
  }, [editingTasking, isOpen]);

  if (!isOpen) return null;

  const set = (field: string, val: string) => setForm((f) => ({ ...f, [field]: val }));

  const handleUnitChange = (id: string) => {
    const unit = allUnits.find((u) => u.id === id);
    setForm((f) => ({
      ...f,
      assigned_unit_id: id,
      assigned_unit_label: unit ? unit.label : '',
    }));
  };

  const handleSubmit = async () => {
    if (!form.assigned_unit_id) { alert('Please select an Assigned Unit.'); return; }
    if (!form.directive_details.trim()) { alert('Directive Details are required.'); return; }
    setIsSaving(true);
    const now = new Date().toISOString();
    const cleanM = cleanMGRS(form.mgrs);
    const tasking: UnitTasking = {
      id: editingTasking?.id || crypto.randomUUID(),
      ...form,
      mgrs: cleanM,
      created_at: editingTasking?.created_at || now,
      updated_at: now,
    };
    await onSave(tasking);
    setIsSaving(false);
    onClose();
  };

  const isEdit = Boolean(editingTasking);
  const priorityColor = PRIORITY_OPTIONS.find((p) => p.value === form.priority)?.color || '';
  const statusColor   = STATUS_OPTIONS.find((s) => s.value === form.status)?.color || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xl font-sans">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {isEdit ? 'Edit Unit Tasking' : 'Add Unit Tasking'}
              </h2>
              <p className="text-[10px] text-slate-500">Tactical Directive — Order of Battle Assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Assigned Unit */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Assigned Unit <span className="text-blue-600">*</span>
            </label>
            {allUnits.length === 0 ? (
              <div className="px-3 py-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-blue-600 text-xs">
                ⚠ No units registered yet. Go to <strong>Forces Status</strong> tab or <strong>Units</strong> module to add units first.
              </div>
            ) : (
              <select
                value={form.assigned_unit_id}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="">— Select Unit —</option>
                {allUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Directive Details */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Directive Details <span className="text-blue-600">*</span>
            </label>
            <textarea
              rows={4}
              value={form.directive_details}
              onChange={(e) => set('directive_details', e.target.value)}
              placeholder="Enter tactical directive, mission objectives, rules of engagement, or special instructions..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-amber-500 transition-colors placeholder-slate-600 resize-none leading-relaxed"
            />
          </div>

          {/* Priority / Urgency + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Priority / Urgency</label>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('priority', opt.value)}
                    className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase border transition-all ${
                      form.priority === opt.value
                        ? opt.color
                        : 'bg-slate-50 border-slate-300 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('status', opt.value)}
                    className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase border transition-all ${
                      form.status === opt.value
                        ? opt.color
                        : 'bg-slate-50 border-slate-300 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MGRS + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  <span>MGRS Grid Reference</span>
                </label>
                <span className="text-[9px] font-sans text-blue-600 uppercase bg-cyan-950/70 border border-cyan-800/80 px-1.5 py-0.5 rounded">
                  Direct MGRS (No Lat/Long)
                </span>
              </div>
              <input
                type="text"
                value={form.mgrs}
                onChange={(e) => set('mgrs', e.target.value.toUpperCase())}
                placeholder="e.g. 51P XQ 12345 67890"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-amber-300 text-xs font-sans focus:outline-none focus:border-amber-500 transition-colors placeholder-slate-600 tracking-wider"
              />
              {form.mgrs.trim() && (
                <div className="mt-1.5 flex items-center space-x-1.5 text-[10px] font-sans">
                  {decodedCoords ? (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Valid MGRS Grid ({decodedCoords[0].toFixed(4)}°N, {decodedCoords[1].toFixed(4)}°E)</span>
                    </span>
                  ) : (
                    <span className="text-blue-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>Custom MGRS / Grid Reference (saved to Supabase)</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tasking Date</label>
              <input
                type="date"
                value={form.task_date}
                onChange={(e) => set('task_date', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Preview badge strip */}
          {form.assigned_unit_id && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-500 uppercase font-bold">Preview:</span>
              <span className="px-2 py-0.5 rounded font-bold text-cyan-300 bg-cyan-950 border border-cyan-800">{form.assigned_unit_label}</span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase border ${priorityColor}`}>{form.priority}</span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase border ${statusColor}`}>{form.status}</span>
              {form.mgrs && <span className="px-2 py-0.5 rounded font-bold text-amber-300 bg-amber-950 border border-amber-800">{form.mgrs}</span>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between sticky bottom-0">
          <p className="text-[10px] font-sans text-slate-500">
            <span className="text-blue-600">*</span> Required — saved to Supabase &amp; localStorage
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-sans font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs font-sans font-bold transition-all shadow-md active:scale-95 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Saving...' : isEdit ? 'Update Tasking' : 'Save Tasking'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

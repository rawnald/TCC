'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plane, Anchor, X, Save, Loader2, Navigation, AlertCircle } from 'lucide-react';

export type MovementMode = 'Air' | 'Land' | 'Sea';
export type MovementPriority = 'critical' | 'high' | 'medium' | 'low';
export type MovementStatus = 'active' | 'in_transit' | 'pending' | 'completed' | 'cancelled';

export interface MovementDeployment {
  id: string;
  unit_people: string;
  directive_details: string;
  priority: MovementPriority;
  location_from: string;
  location_to: string;
  status: MovementStatus;
  movement_date: string;
  mode_of_movement: MovementMode;
  created_at: string;
  updated_at: string;
}

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (movement: MovementDeployment) => Promise<void>;
  editingMovement?: MovementDeployment | null;
  unitSuggestions?: string[];
}

const EMPTY_FORM = {
  unit_people: '',
  directive_details: '',
  priority: 'medium' as MovementPriority,
  location_from: '',
  location_to: '',
  status: 'in_transit' as MovementStatus,
  movement_date: new Date().toISOString().slice(0, 10),
  mode_of_movement: 'Land' as MovementMode,
};

const MODE_OPTIONS: { value: MovementMode; label: string; icon: typeof Truck; color: string }[] = [
  { value: 'Land', label: 'Land Transport', icon: Truck, color: 'text-blue-600 bg-amber-950/80 border-amber-700' },
  { value: 'Air',  label: 'Air Mobility',   icon: Plane, color: 'text-sky-400 bg-sky-950/80 border-sky-700' },
  { value: 'Sea',  label: 'Sea / Naval',    icon: Anchor, color: 'text-blue-600 bg-cyan-950/80 border-cyan-700' },
];

const PRIORITY_OPTIONS: { value: MovementPriority; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'text-blue-600 bg-rose-950 border-rose-800' },
  { value: 'high',     label: 'High',     color: 'text-blue-600 bg-amber-950 border-amber-800' },
  { value: 'medium',   label: 'Medium',   color: 'text-blue-600 bg-cyan-950 border-cyan-800' },
  { value: 'low',      label: 'Low',      color: 'text-slate-700 bg-slate-900 border-slate-700' },
];

const STATUS_OPTIONS: { value: MovementStatus; label: string; color: string }[] = [
  { value: 'in_transit', label: 'In Transit',  color: 'text-amber-300 bg-amber-950 border-amber-800' },
  { value: 'active',     label: 'Active / En Route', color: 'text-emerald-400 bg-emerald-950 border-emerald-800' },
  { value: 'pending',    label: 'Pending / Staging', color: 'text-slate-700 bg-slate-900 border-slate-700' },
  { value: 'completed',  label: 'Arrived / Done', color: 'text-blue-400 bg-blue-950 border-blue-800' },
  { value: 'cancelled',  label: 'Cancelled',   color: 'text-blue-600 bg-rose-950/60 border-rose-900' },
];

export default function MovementModal({
  isOpen,
  onClose,
  onSave,
  editingMovement,
  unitSuggestions = [],
}: MovementModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingMovement) {
      setForm({
        unit_people:       editingMovement.unit_people,
        directive_details: editingMovement.directive_details,
        priority:          editingMovement.priority,
        location_from:     editingMovement.location_from,
        location_to:       editingMovement.location_to,
        status:            editingMovement.status,
        movement_date:     editingMovement.movement_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        mode_of_movement:  editingMovement.mode_of_movement,
      });
    } else {
      setForm({ ...EMPTY_FORM, movement_date: new Date().toISOString().slice(0, 10) });
    }
  }, [editingMovement, isOpen]);

  if (!isOpen) return null;

  const set = (field: string, val: string) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async () => {
    if (!form.unit_people.trim()) { alert('Unit / People is required.'); return; }
    if (!form.location_from.trim()) { alert('Location From is required.'); return; }
    if (!form.location_to.trim()) { alert('Location To is required.'); return; }
    if (!form.directive_details.trim()) { alert('Directive Details are required.'); return; }

    setIsSaving(true);
    const now = new Date().toISOString();
    const movement: MovementDeployment = {
      id: editingMovement?.id || crypto.randomUUID(),
      ...form,
      created_at: editingMovement?.created_at || now,
      updated_at: now,
    };
    await onSave(movement);
    setIsSaving(false);
    onClose();
  };

  const isEdit = Boolean(editingMovement);
  const currentMode = MODE_OPTIONS.find((m) => m.value === form.mode_of_movement);
  const ModeIcon = currentMode?.icon || Truck;
  const priorityColor = PRIORITY_OPTIONS.find((p) => p.value === form.priority)?.color || '';
  const statusColor   = STATUS_OPTIONS.find((s) => s.value === form.status)?.color || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              <ModeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {isEdit ? 'Edit Movement / Deployment' : 'Add Movement / Deployment'}
              </h2>
              <p className="text-[10px] text-slate-500">Transit Order & Tactical Logistics Tracking</p>
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
          
          {/* Mode of Movement Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
              Mode of Movement <span className="text-blue-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {MODE_OPTIONS.map((mode) => {
                const Icon = mode.icon;
                const isSelected = form.mode_of_movement === mode.value;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => set('mode_of_movement', mode.value)}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-lg border text-xs font-bold transition-all ${
                      isSelected
                        ? mode.color + ' ring-1 ring-cyan-500/50 shadow-md scale-[1.02]'
                        : 'bg-slate-50 border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-100/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit / People */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Unit / People <span className="text-blue-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list="unit-people-suggestions"
                value={form.unit_people}
                onChange={(e) => set('unit_people', e.target.value)}
                placeholder="e.g. 3rd Infantry Bn / Alpha Platoon (24 Pax, 4 WAVs)"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600"
              />
              {unitSuggestions.length > 0 && (
                <datalist id="unit-people-suggestions">
                  {unitSuggestions.map((s, idx) => (
                    <option key={idx} value={s} />
                  ))}
                </datalist>
              )}
            </div>
            {unitSuggestions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                <span>Quick Pick:</span>
                {unitSuggestions.slice(0, 4).map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => set('unit_people', s)}
                    className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:text-cyan-300 hover:border-cyan-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location From & Location To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Location From <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                value={form.location_from}
                onChange={(e) => set('location_from', e.target.value)}
                placeholder="e.g. Forward Operating Base Alpha"
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Location To <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                value={form.location_to}
                onChange={(e) => set('location_to', e.target.value)}
                placeholder="e.g. Substation Sector 4 Perimeter"
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600"
              />
            </div>
          </div>

          {/* Directive Details */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Directive Details <span className="text-blue-600">*</span>
            </label>
            <textarea
              rows={3}
              value={form.directive_details}
              onChange={(e) => set('directive_details', e.target.value)}
              placeholder="Convoy order, tactical objective, escort requirements, security protocol, or cargo inventory..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600 resize-none leading-relaxed"
            />
          </div>

          {/* Priority / Urgency + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Priority / Urgency
              </label>
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
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as MovementStatus)}
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Movement Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Movement Date
            </label>
            <input
              type="date"
              value={form.movement_date}
              onChange={(e) => set('movement_date', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Real-Time Preview Badge */}
          {form.unit_people && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-500 uppercase font-bold">Route Preview:</span>
              <span className="font-bold text-cyan-300">{form.unit_people}</span>
              <span className="text-slate-500">[{form.mode_of_movement}]</span>
              {form.location_from && form.location_to && (
                <span className="text-amber-300 flex items-center space-x-1">
                  <span>{form.location_from}</span>
                  <span>➔</span>
                  <span>{form.location_to}</span>
                </span>
              )}
              <span className={`px-2 py-0.5 rounded font-bold uppercase border ${priorityColor}`}>{form.priority}</span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase border ${statusColor}`}>{form.status}</span>
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
              <span>{isSaving ? 'Saving...' : isEdit ? 'Update Movement' : 'Save Movement'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

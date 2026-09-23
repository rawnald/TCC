'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  X,
  Save,
  Loader2,
  Upload,
  File,
  Trash2,
  Paperclip,
  CheckCircle2,
  Calendar,
  MapPin,
  Shield,
  AlertTriangle,
  Send,
  Building2,
} from 'lucide-react';

export interface OperationalDirective {
  id: string;
  directive_number: string;
  title: string;
  directive_type: 'OPORD' | 'FRAGO' | 'WARNORD' | 'Command Directive' | 'Special Order' | 'ROE';
  issuing_authority: string;
  target_units: string;
  priority: 'critical' | 'high' | 'medium' | 'routine';
  classification: 'TOP SECRET' | 'SECRET' | 'CONFIDENTIAL' | 'RESTRICTED' | 'UNCLASSIFIED';
  effective_date: string;
  location_aor: string;
  narrative: string;
  status: 'active' | 'in_execution' | 'acknowledged' | 'completed' | 'superseded';
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_data?: string; // base64 Data URL
  created_at: string;
  updated_at: string;
}

interface DirectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (directive: OperationalDirective) => Promise<void>;
  editingDirective?: OperationalDirective | null;
  unitSuggestions?: string[];
  dutyOfficer?: string;
}

const EMPTY_FORM: Omit<OperationalDirective, 'id' | 'created_at' | 'updated_at'> = {
  directive_number: '',
  title: '',
  directive_type: 'Command Directive',
  issuing_authority: 'JTF Central / G3 Operations',
  target_units: '',
  priority: 'high',
  classification: 'SECRET',
  effective_date: new Date().toISOString().slice(0, 10),
  location_aor: '',
  narrative: '',
  status: 'active',
  file_name: '',
  file_size: 0,
  file_type: '',
  file_data: '',
};

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function DirectiveModal({
  isOpen,
  onClose,
  onSave,
  editingDirective,
  unitSuggestions = [],
  dutyOfficer = 'G3 Operations',
}: DirectiveModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingDirective) {
      setForm({
        directive_number: editingDirective.directive_number || '',
        title:             editingDirective.title || '',
        directive_type:    editingDirective.directive_type || 'Command Directive',
        issuing_authority: editingDirective.issuing_authority || 'JTF Central / G3 Operations',
        target_units:      editingDirective.target_units || '',
        priority:          editingDirective.priority || 'high',
        classification:    editingDirective.classification || 'SECRET',
        effective_date:    editingDirective.effective_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        location_aor:      editingDirective.location_aor || '',
        narrative:         editingDirective.narrative || '',
        status:            editingDirective.status || 'active',
        file_name:         editingDirective.file_name || '',
        file_size:         editingDirective.file_size || 0,
        file_type:         editingDirective.file_type || '',
        file_data:         editingDirective.file_data || '',
      });
    } else {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '').slice(2);
      const rand = Math.floor(100 + Math.random() * 900);
      setForm({
        ...EMPTY_FORM,
        directive_number: `DIR-${dateStr}-${rand}`,
        issuing_authority: dutyOfficer ? `${dutyOfficer} / G3 Ops` : 'JTF Central / G3 Operations',
        effective_date: now.toISOString().slice(0, 10),
      });
    }
    setFileError(null);
  }, [editingDirective, isOpen, dutyOfficer]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds 10MB limit.');
      return;
    }

    setFileError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_data: reader.result as string,
      }));
    };
    reader.onerror = () => {
      setFileError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setForm((prev) => ({
      ...prev,
      file_name: '',
      file_size: 0,
      file_type: '',
      file_data: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.narrative.trim()) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const record: OperationalDirective = {
        id: editingDirective?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `dir-${Date.now()}`),
        ...form,
        created_at: editingDirective?.created_at || now,
        updated_at: now,
      };

      await onSave(record);
      onClose();
    } catch (err) {
      console.error('Failed to save directive:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-800 max-w-2xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wide">
                {editingDirective ? 'Edit Operational Directive' : 'Issue Operational Directive'}
              </h2>
              <p className="text-[11px] font-sans text-blue-600/80">
                Operational Cell // Command Directives, Task Orders & ROE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 font-sans text-xs">
          {/* Top Row: Directive Number, Type, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Directive ID / Ref *</label>
              <input
                type="text"
                value={form.directive_number}
                onChange={(e) => setForm({ ...form, directive_number: e.target.value })}
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Order Type *</label>
              <select
                value={form.directive_type}
                onChange={(e) => setForm({ ...form, directive_type: e.target.value as any })}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-cyan-500"
              >
                <option value="Command Directive">Command Directive</option>
                <option value="OPORD">Operation Order (OPORD)</option>
                <option value="FRAGO">Fragmentary Order (FRAGO)</option>
                <option value="WARNORD">Warning Order (WARNORD)</option>
                <option value="Special Order">Special Order</option>
                <option value="ROE">Rules of Engagement (ROE)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Priority *</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className={`w-full bg-slate-50 border rounded px-2.5 py-1.5 font-bold focus:outline-none ${
                  form.priority === 'critical'
                    ? 'text-blue-600 border-rose-700'
                    : form.priority === 'high'
                    ? 'text-blue-600 border-amber-700'
                    : 'text-blue-600 border-cyan-700'
                }`}
              >
                <option value="critical">Critical (FLASH)</option>
                <option value="high">High (IMMEDIATE)</option>
                <option value="medium">Medium (PRIORITY)</option>
                <option value="routine">Routine</option>
              </select>
            </div>
          </div>

          {/* Title / Subject */}
          <div>
            <label className="block text-[10px] text-slate-500 uppercase mb-1">Directive Subject / Mission Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. OP RED DAWN — Immediate Checkpoint Reinforcement & Area Interdiction"
              required
              className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Issuing Authority & Assigned Units */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Issuing Authority / Officer *</label>
              <input
                type="text"
                value={form.issuing_authority}
                onChange={(e) => setForm({ ...form, issuing_authority: e.target.value })}
                placeholder="e.g. JTF Commander / G3 Operations"
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Target / Assigned Units *</label>
              <input
                type="text"
                value={form.target_units}
                onChange={(e) => setForm({ ...form, target_units: e.target.value })}
                placeholder="e.g. 1st Scout Ranger Bn, 601st Brigade, Alpha Coy"
                list="unit-suggestions-directive"
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
              <datalist id="unit-suggestions-directive">
                {unitSuggestions.map((u, i) => (
                  <option key={i} value={u} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Effective Date, Location/AOR, Classification, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Effective Date *</label>
              <input
                type="date"
                value={form.effective_date}
                onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Classification</label>
              <select
                value={form.classification}
                onChange={(e) => setForm({ ...form, classification: e.target.value as any })}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1.5 text-blue-600 font-bold focus:outline-none"
              >
                <option value="SECRET">SECRET</option>
                <option value="TOP SECRET">TOP SECRET</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="RESTRICTED">RESTRICTED</option>
                <option value="UNCLASSIFIED">UNCLASSIFIED</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">AOR / MGRS Grid</label>
              <input
                type="text"
                value={form.location_aor}
                onChange={(e) => setForm({ ...form, location_aor: e.target.value })}
                placeholder="e.g. Sector 4 / 51NXH..."
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1.5 text-slate-800 font-semibold focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="in_execution">In Execution</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="completed">Completed</option>
                <option value="superseded">Superseded</option>
              </select>
            </div>
          </div>

          {/* Directive Instructions / Execution Narrative */}
          <div>
            <label className="block text-[10px] text-slate-500 uppercase mb-1">
              Directive Instructions &amp; Execution Narrative *
            </label>
            <textarea
              rows={5}
              value={form.narrative}
              onChange={(e) => setForm({ ...form, narrative: e.target.value })}
              placeholder="1. SITUATION: Hostile movements reported in sector...&#10;2. MISSION: Execute cordon and search...&#10;3. EXECUTION: Phase 1 establish blockades by 0600H...&#10;4. COORDINATING INSTRUCTIONS: Rules of Engagement active..."
              required
              className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded p-2.5 text-slate-900 focus:outline-none focus:border-cyan-500 leading-relaxed placeholder-slate-600"
            />
          </div>

          {/* Document / Annex Attachment */}
          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center space-x-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                <span>Attach Directive Document / Annex (PDF, Word, Image)</span>
              </label>
              <span className="text-[10px] text-slate-500">Max 10MB</span>
            </div>

            {form.file_name ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                <div className="flex items-center space-x-2 truncate">
                  <File className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs text-slate-800 font-semibold truncate">{form.file_name}</div>
                    <div className="text-[10px] text-slate-500">{formatBytes(form.file_size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-rose-950/50 transition-colors"
                  title="Remove attachment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  className="hidden"
                  id="directive-file-input"
                />
                <label
                  htmlFor="directive-file-input"
                  className="flex items-center justify-center space-x-2 p-3 rounded-lg border border-dashed border-slate-300 hover:border-cyan-500 bg-white/40 hover:bg-white/80 cursor-pointer transition-all text-slate-500 hover:text-cyan-300"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-xs">Select directive document, signed order, or annex file</span>
                </label>
              </div>
            )}

            {fileError && <p className="text-[11px] text-blue-600 font-semibold">{fileError}</p>}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{editingDirective ? 'Update Directive' : 'Issue Directive'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

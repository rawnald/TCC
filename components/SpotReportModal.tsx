'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileWarning,
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
  FileText,
} from 'lucide-react';

export interface SpotReport {
  id: string;
  event: string;
  incident_date: string;
  location: string;
  unit_involved: string;
  narrative: string;
  results: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_data?: string; // base64 Data URL
  created_at: string;
  updated_at: string;
}

interface SpotReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: SpotReport) => Promise<void>;
  editingReport?: SpotReport | null;
  unitSuggestions?: string[];
}

const EMPTY_FORM = {
  event: '',
  incident_date: new Date().toISOString().slice(0, 10),
  location: '',
  unit_involved: '',
  narrative: '',
  results: '',
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

export default function SpotReportModal({
  isOpen,
  onClose,
  onSave,
  editingReport,
  unitSuggestions = [],
}: SpotReportModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingReport) {
      setForm({
        event:         editingReport.event || '',
        incident_date: editingReport.incident_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        location:      editingReport.location || '',
        unit_involved: editingReport.unit_involved || '',
        narrative:     editingReport.narrative || '',
        results:       editingReport.results || '',
        file_name:     editingReport.file_name || '',
        file_size:     editingReport.file_size || 0,
        file_type:     editingReport.file_type || '',
        file_data:     editingReport.file_data || '',
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        incident_date: new Date().toISOString().slice(0, 10),
      });
    }
    setFileError(null);
  }, [editingReport, isOpen]);

  if (!isOpen) return null;

  const set = (field: string, val: any) => setForm((f) => ({ ...f, [field]: val }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setForm((f) => ({
        ...f,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_data: resultStr,
      }));
    };
    reader.onerror = () => {
      setFileError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setForm((f) => ({
      ...f,
      file_name: '',
      file_size: 0,
      file_type: '',
      file_data: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!form.event.trim()) { alert('Event is required.'); return; }
    if (!form.incident_date) { alert('Date of Incident is required.'); return; }
    if (!form.location.trim()) { alert('Location is required.'); return; }
    if (!form.unit_involved.trim()) { alert('Unit Involved is required.'); return; }
    if (!form.narrative.trim()) { alert('Narrative is required.'); return; }
    if (!form.results.trim()) { alert('Results are required.'); return; }

    setIsSaving(true);
    const now = new Date().toISOString();
    const report: SpotReport = {
      id: editingReport?.id || crypto.randomUUID(),
      ...form,
      created_at: editingReport?.created_at || now,
      updated_at: now,
    };
    await onSave(report);
    setIsSaving(false);
    onClose();
  };

  const isEdit = Boolean(editingReport);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              <FileWarning className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {isEdit ? 'Edit Tactical Spot Report' : 'Add Tactical Spot Report'}
              </h2>
              <p className="text-[10px] text-slate-500">Rapid Intelligence & Fleeting Contact Transmission</p>
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
        <div className="p-6 space-y-4">
          
          {/* Event */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Event <span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              value={form.event}
              onChange={(e) => set('event', e.target.value)}
              placeholder="e.g. Armed Encounter / IED Discovery / Unauthorized Drone Sighting"
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-rose-500 transition-colors placeholder-slate-600 font-semibold"
            />
          </div>

          {/* Date of Incident & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Date of Incident <span className="text-blue-600">*</span>
              </label>
              <input
                type="date"
                value={form.incident_date}
                onChange={(e) => set('incident_date', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Location <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="e.g. Sector 3 Eastern Ridge / Patikul, Sulu"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-rose-500 transition-colors placeholder-slate-600"
              />
            </div>
          </div>

          {/* Unit Involved */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Unit Involved <span className="text-blue-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list="unit-involved-suggestions"
                value={form.unit_involved}
                onChange={(e) => set('unit_involved', e.target.value)}
                placeholder="e.g. 3rd Scout Ranger Bn / Alpha Team"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-rose-500 transition-colors placeholder-slate-600"
              />
              {unitSuggestions.length > 0 && (
                <datalist id="unit-involved-suggestions">
                  {unitSuggestions.map((s, idx) => (
                    <option key={idx} value={s} />
                  ))}
                </datalist>
              )}
            </div>
            {unitSuggestions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                <span>Suggestions:</span>
                {unitSuggestions.slice(0, 4).map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => set('unit_involved', s)}
                    className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-300 hover:border-rose-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Narrative */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Narrative <span className="text-blue-600">*</span>
            </label>
            <textarea
              rows={4}
              value={form.narrative}
              onChange={(e) => set('narrative', e.target.value)}
              placeholder="Detailed description of the tactical incident, enemy activity, sequence of events, tactical maneuvers observed..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-rose-500 transition-colors placeholder-slate-600 resize-none leading-relaxed"
            />
          </div>

          {/* Results */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Results <span className="text-blue-600">*</span>
            </label>
            <textarea
              rows={2}
              value={form.results}
              onChange={(e) => set('results', e.target.value)}
              placeholder="e.g. 1 Hostile KIA, 2 High-Powered Firearms seized, 0 Friendly Casualties, Area cordoned off"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-rose-500 transition-colors placeholder-slate-600 resize-none leading-relaxed"
            />
          </div>

          {/* File Upload (optional) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center justify-between">
              <span>File Upload (Optional)</span>
              <span className="text-slate-500 font-normal">PDF, DOC, DOCX, TXT, Images up to 10MB</span>
            </label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              className="hidden"
            />

            {form.file_name ? (
              <div className="p-3 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded bg-rose-950/60 border border-rose-800/80 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="overflow-hidden text-xs">
                    <div className="text-slate-800 font-bold truncate max-w-xs">{form.file_name}</div>
                    <div className="text-[10px] text-slate-500">{formatBytes(form.file_size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg bg-white hover:bg-rose-950 border border-slate-200 hover:border-rose-700 text-slate-500 hover:text-rose-300 transition-colors"
                  title="Remove File"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-lg bg-slate-50/70 border border-dashed border-slate-300 hover:border-rose-500/80 cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
              >
                <Upload className="w-6 h-6 text-slate-500 group-hover:text-blue-600 transition-colors mb-1" />
                <div className="text-xs font-semibold text-slate-700 group-hover:text-white">
                  Click to select and attach report file
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Attach mission photos, field sketch, post-operation document, or scanned report
                </div>
              </div>
            )}

            {fileError && (
              <p className="text-[10px] text-blue-600 mt-1">{fileError}</p>
            )}
          </div>

          {/* Real-time Summary Chip */}
          {form.event && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-500 uppercase font-bold">Spotrep Preview:</span>
              <span className="font-bold text-rose-300">[{form.event}]</span>
              {form.location && (
                <span className="text-slate-500">@ {form.location}</span>
              )}
              {form.unit_involved && (
                <span className="px-2 py-0.5 rounded bg-white text-cyan-300 border border-slate-300">
                  {form.unit_involved}
                </span>
              )}
              {form.file_name && (
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] flex items-center space-x-1">
                  <Paperclip className="w-3 h-3" />
                  <span>{form.file_name}</span>
                </span>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between sticky bottom-0">
          <p className="text-[10px] font-sans text-slate-500">
            <span className="text-blue-600">*</span> Required — saved automatically to Supabase &amp; localStorage
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
              <span>{isSaving ? 'Saving...' : isEdit ? 'Update Report' : 'Save Spot Report'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

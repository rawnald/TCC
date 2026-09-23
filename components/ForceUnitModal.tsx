'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield,
  X,
  Save,
  Loader2,
  Compass,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  Link2,
} from 'lucide-react';
import { toMGRS, parseMGRSToCoords, PRESET_AREA_COORDS, cleanMGRS } from '@/lib/mgrsUtils';

export interface ForceUnit {
  id: string;
  battalion: string;
  brigade: string;
  area: string;
  mgrs?: string;
  logo_url?: string;
  afp_officers: number;
  afp_enlisted: number;
  caa: number;
  wavs_tavs: number;
  air_assets: number;
  vehicle: number;
  naval_assets: number;
  isr_asset: number;
  artillery_asset: number;
  created_at: string;
  updated_at: string;
}

interface ForceUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unit: ForceUnit) => Promise<void>;
  editingUnit?: ForceUnit | null;
}

const EMPTY_FORM = {
  battalion: '',
  brigade: '',
  area: '',
  mgrs: '',
  logo_url: '',
  afp_officers: 0,
  afp_enlisted: 0,
  caa: 0,
  wavs_tavs: 0,
  air_assets: 0,
  vehicle: 0,
  naval_assets: 0,
  isr_asset: 0,
  artillery_asset: 0,
};

// Philippine Provinces grouped by island group
const PRESET_AREAS = [
  // ── LUZON ──
  'Abra',
  'Agusan del Norte',
  'Agusan del Sur',
  'Aklan',
  'Albay',
  'Antique',
  'Apayao',
  'Aurora',
  'Basilan',
  'Bataan',
  'Batanes',
  'Batangas',
  'Benguet',
  'Biliran',
  'Bohol',
  'Bukidnon',
  'Bulacan',
  'Cagayan',
  'Camarines Norte',
  'Camarines Sur',
  'Camiguin',
  'Capiz',
  'Catanduanes',
  'Cavite',
  'Cebu',
  'Cotabato',
  'Davao de Oro',
  'Davao del Norte',
  'Davao del Sur',
  'Davao Occidental',
  'Davao Oriental',
  'Dinagat Islands',
  'Eastern Samar',
  'Guimaras',
  'Ifugao',
  'Ilocos Norte',
  'Ilocos Sur',
  'Iloilo',
  'Isabela',
  'Kalinga',
  'La Union',
  'Laguna',
  'Lanao del Norte',
  'Lanao del Sur',
  'Leyte',
  'Maguindanao del Norte',
  'Maguindanao del Sur',
  'Marinduque',
  'Masbate',
  'Metro Manila (NCR)',
  'Misamis Occidental',
  'Misamis Oriental',
  'Mountain Province',
  'Negros Occidental',
  'Negros Oriental',
  'Northern Samar',
  'Nueva Ecija',
  'Nueva Vizcaya',
  'Occidental Mindoro',
  'Oriental Mindoro',
  'Palawan',
  'Pampanga',
  'Pangasinan',
  'Quezon',
  'Quirino',
  'Rizal',
  'Romblon',
  'Samar',
  'Sarangani',
  'Siquijor',
  'Sorsogon',
  'South Cotabato',
  'Southern Leyte',
  'Sultan Kudarat',
  'Sulu',
  'Surigao del Norte',
  'Surigao del Sur',
  'Tarlac',
  'Tawi-Tawi',
  'Zambales',
  'Zamboanga del Norte',
  'Zamboanga del Sur',
  'Zamboanga Sibugay',
];

function NumField({
  label, field, value, onChange,
}: {
  label: string;
  field: string;
  value: number;
  onChange: (field: string, val: number) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase mb-1">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(field, Math.max(0, parseInt(e.target.value) || 0))}
        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-cyan-500 transition-colors"
      />
    </div>
  );
}

export default function ForceUnitModal({ isOpen, onClose, onSave, editingUnit }: ForceUnitModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingUnit) {
      setForm({
        battalion: editingUnit.battalion,
        brigade: editingUnit.brigade,
        area: editingUnit.area,
        mgrs: editingUnit.mgrs || (editingUnit.area && PRESET_AREA_COORDS[editingUnit.area] ? toMGRS(PRESET_AREA_COORDS[editingUnit.area][0], PRESET_AREA_COORDS[editingUnit.area][1]) : ''),
        logo_url: editingUnit.logo_url || '',
        afp_officers: editingUnit.afp_officers,
        afp_enlisted: editingUnit.afp_enlisted,
        caa: editingUnit.caa,
        wavs_tavs: editingUnit.wavs_tavs,
        air_assets: editingUnit.air_assets,
        vehicle: editingUnit.vehicle,
        naval_assets: editingUnit.naval_assets,
        isr_asset: editingUnit.isr_asset,
        artillery_asset: editingUnit.artillery_asset,
      });
      setUrlInput(editingUnit.logo_url && !editingUnit.logo_url.startsWith('data:') ? editingUnit.logo_url : '');
    } else {
      setForm(EMPTY_FORM);
      setUrlInput('');
    }
  }, [editingUnit, isOpen]);

  // Decode MGRS to validate coordinate format live
  const decodedCoords = useMemo(() => {
    if (!form.mgrs || !form.mgrs.trim()) return null;
    return parseMGRSToCoords(form.mgrs.trim());
  }, [form.mgrs]);

  if (!isOpen) return null;

  const setField = (field: string, val: string | number) => setForm((f) => ({ ...f, [field]: val }));

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Unit insignia image size exceeds 10MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      // Keep SVGs as-is
      if (file.type === 'image/svg+xml') {
        setField('logo_url', rawDataUrl);
        return;
      }

      // Optimize/compress image via canvas to 180x180 max and WebP/PNG (<15KB)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 180;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          let compressed = canvas.toDataURL('image/webp', 0.8);
          if (!compressed.startsWith('data:image/webp')) {
            compressed = canvas.toDataURL('image/png');
          }
          setField('logo_url', compressed);
        } else {
          setField('logo_url', rawDataUrl);
        }
      };
      img.onerror = () => {
        setField('logo_url', rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveLogo = () => {
    setField('logo_url', '');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setField('logo_url', urlInput.trim());
    }
  };

  const handleProvinceChange = (province: string) => {
    setForm((prev) => {
      let nextMgrs = prev.mgrs;
      if (province && PRESET_AREA_COORDS[province]) {
        const coords = PRESET_AREA_COORDS[province];
        nextMgrs = toMGRS(coords[0], coords[1]);
      }
      return {
        ...prev,
        area: province,
        mgrs: nextMgrs,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.battalion.trim()) {
      alert('Battalion / Unit Designation is required.');
      return;
    }
    if (!form.brigade.trim()) {
      alert('Parent Brigade is required.');
      return;
    }
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const cleanM = cleanMGRS(form.mgrs);
      const unit: ForceUnit = {
        id: editingUnit?.id || crypto.randomUUID(),
        ...form,
        mgrs: cleanM,
        created_at: editingUnit?.created_at || now,
        updated_at: now,
      };
      await onSave(unit);
    } catch (err) {
      console.warn('Unit save notice:', err);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  const isEdit = Boolean(editingUnit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xl font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {isEdit ? 'Edit Tactical Unit' : 'Add Tactical Unit'}
              </h2>
              <p className="text-[10px] text-slate-500">Order of Battle — Force Strength Entry</p>
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
        <div className="p-6 space-y-6">
          {/* ── Unit Identification ── */}
          <div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center space-x-2">
              <span className="w-4 h-px bg-cyan-700" />
              <span>Unit Identification</span>
              <span className="flex-1 h-px bg-cyan-900" />
            </div>

            {/* ── Unit Insignia / Official Crest Attachment ── */}
            <div className="mb-4 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-sans font-bold text-slate-700 uppercase flex items-center space-x-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attach Unit Logo / Insignia / Patch</span>
                </label>
                {form.logo_url && (
                  <span className="text-[9px] font-sans text-emerald-400 uppercase bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Logo Attached</span>
                  </span>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {form.logo_url ? (
                /* Logo Preview & Action buttons */
                <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4 p-3 rounded-lg bg-white border border-cyan-800/60">
                  <div className="relative w-20 h-20 rounded-lg bg-slate-50 border-2 border-cyan-500/60 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    <img
                      src={form.logo_url}
                      alt="Unit Insignia Preview"
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between space-y-2 text-center sm:text-left">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {form.battalion ? `${form.battalion} Official Logo` : 'Unit Insignia / Crest'}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Saved automatically to Supabase. Displayed on tactical roster, COP map, and force ledgers.
                      </p>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-cyan-950 border border-slate-300 hover:border-cyan-600 text-cyan-300 text-[11px] font-semibold transition-all active:scale-95"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Change Logo</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-rose-950 border border-slate-300 hover:border-rose-700 text-blue-600 text-[11px] font-semibold transition-all active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Upload Dropzone / Mode Switch */
                <div className="space-y-2">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                      dragOver
                        ? 'border-cyan-400 bg-cyan-950/40'
                        : 'border-slate-300 hover:border-cyan-600 bg-white/40 hover:bg-white/80'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-950/80 border border-cyan-800 text-blue-600 flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Click to Browse or Drag & Drop Unit Logo / Crest
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      PNG, JPG, SVG, WebP (Max 5MB) — Saved directly to Supabase
                    </p>
                  </div>

                  {/* Optional URL input fallback */}
                  <div className="flex items-center space-x-2 pt-1">
                    <div className="relative flex-1">
                      <Link2 className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Or paste direct image URL (e.g. https://.../insignia.png)"
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                      />
                    </div>
                    {urlInput.trim() && (
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs font-bold transition-all shrink-0 active:scale-95"
                      >
                        Attach URL
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase mb-1">
                  Battalion <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.battalion}
                  onChange={(e) => setField('battalion', e.target.value)}
                  placeholder="e.g. 3rd Infantry Bn"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase mb-1">
                  Brigade <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.brigade}
                  onChange={(e) => setField('brigade', e.target.value)}
                  placeholder="e.g. 1st Light Reaction Bde"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600"
                />
              </div>
            </div>

            {/* Province & MGRS Grid Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase mb-1">Province</label>
                <select
                  value={form.area}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 text-xs font-sans focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="">— Select Province —</option>
                  {PRESET_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* MGRS Tactical Grid input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-sans font-bold text-slate-500 uppercase flex items-center space-x-1">
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    <span>MGRS Tactical Grid</span>
                  </label>
                  <span className="text-[9px] font-sans text-blue-600 uppercase bg-cyan-950/70 border border-cyan-800/80 px-1.5 py-0.5 rounded">
                    Auto / Manual
                  </span>
                </div>
                <input
                  type="text"
                  value={form.mgrs}
                  onChange={(e) => setField('mgrs', e.target.value.toUpperCase())}
                  placeholder="e.g. 51N WF 24640 72236"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-amber-300 text-xs font-sans focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600 tracking-wider"
                />
                {form.mgrs.trim() && (
                  <div className="mt-1 flex items-center space-x-1.5 text-[10px] font-sans">
                    {decodedCoords ? (
                      <span className="text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Valid Grid ({decodedCoords[0].toFixed(4)}°N, {decodedCoords[1].toFixed(4)}°E)</span>
                      </span>
                    ) : (
                      <span className="text-blue-600 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>Tactical Grid Reference</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Personnel Strength ── */}
          <div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center space-x-2">
              <span className="w-4 h-px bg-emerald-700" />
              <span>Personnel Strength</span>
              <span className="flex-1 h-px bg-emerald-900" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <NumField label="AFP Officers" field="afp_officers" value={form.afp_officers} onChange={setField} />
              <NumField label="AFP Enlisted" field="afp_enlisted" value={form.afp_enlisted} onChange={setField} />
              <NumField label="CAA (Civil Affairs)" field="caa" value={form.caa} onChange={setField} />
            </div>
          </div>

          {/* ── Asset Inventory ── */}
          <div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center space-x-2">
              <span className="w-4 h-px bg-amber-700" />
              <span>Asset Inventory</span>
              <span className="flex-1 h-px bg-amber-900" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <NumField label="WAVs / TAVs" field="wavs_tavs" value={form.wavs_tavs} onChange={setField} />
              <NumField label="Air Assets" field="air_assets" value={form.air_assets} onChange={setField} />
              <NumField label="Vehicles (General)" field="vehicle" value={form.vehicle} onChange={setField} />
              <NumField label="Naval Assets" field="naval_assets" value={form.naval_assets} onChange={setField} />
              <NumField label="ISR Assets" field="isr_asset" value={form.isr_asset} onChange={setField} />
              <NumField label="Artillery Assets" field="artillery_asset" value={form.artillery_asset} onChange={setField} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between sticky bottom-0">
          <p className="text-[10px] font-sans text-slate-500">
            <span className="text-blue-600">*</span> Required fields — data saved to Supabase
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
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Saving...' : isEdit ? 'Update Unit' : 'Save Unit'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

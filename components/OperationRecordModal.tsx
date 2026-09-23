'use client';

import React, { useState, useEffect } from 'react';
import { RecordItem, RecordPriority, RecordStatus } from '@/types';
import {
  X,
  MapPin,
  Calendar,
  Compass,
  AlertTriangle,
  Shield,
  Save,
  CheckCircle2,
  Clock,
  Radio,
  Crosshair,
  FileText,
  HelpCircle,
  Database,
  Copy,
  Check,
  Code,
  Table,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { parseMGRSToCoords, cleanMGRS } from '@/lib/mgrsUtils';

interface OperationRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<RecordItem>) => Promise<void> | void;
  initialRecord?: RecordItem | null;
  defaultArea?: string;
}

const COMMON_OPERATION_TYPES = [
  'Armed Clash',
  'Combat / Hostile Fire',
  'IED / Explosive Hazard',
  'Armed Reconnaissance / Patrol',
  'Perimeter Breach / Incursion',
  'Civil Disturbance / Riot',
  'Hostile Drone / Surveillance',
  'Checkpoint Security Incident',
  'Direct Action / Tactical Raid',
  'CASEVAC / Medical Emergency',
  'Logistics Convoy Interdiction',
  'Special Reconnaissance (SR)',
  'Suspected Enemy Staging',
  'Custom Type (Write-in)',
];

// Helper to generate standard RFC 4122 UUID v4 for Supabase
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function OperationRecordModal({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  defaultArea = '',
}: OperationRecordModalProps) {
  // Primary 5 Requested Fields
  const [mgrs, setMgrs] = useState('');
  const [area, setArea] = useState(defaultArea);
  const [date, setDate] = useState('');
  const [type, setType] = useState(COMMON_OPERATION_TYPES[0]);
  const [customType, setCustomType] = useState('');
  const [narrative, setNarrative] = useState('');

  // Tactical Controls
  const [code, setCode] = useState('');
  const [priority, setPriority] = useState<RecordPriority>('medium');
  const [status, setStatus] = useState<RecordStatus>('active');
  const [lat, setLat] = useState<number>(37.7749);
  const [lng, setLng] = useState<number>(-122.4194);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Status & Validation
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const SQL_TABLE_SCHEMA = `-- Standalone Dedicated Incidents Table in Supabase (Separate from unified records)
-- 1. Drop view if previously created as a view on records
DROP VIEW IF EXISTS public.incidents CASCADE;

-- 2. Create standalone incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT,
  title TEXT NOT NULL,
  operation_type TEXT,
  area TEXT,
  location_name TEXT,
  mgrs TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  narrative TEXT,
  description TEXT,
  dtg TEXT,
  incident_date TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (RLS) & Universal Policy
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on incidents" ON public.incidents;
CREATE POLICY "Allow all operations on incidents" ON public.incidents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Enable Realtime Replication
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
  END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;`;

  useEffect(() => {
    if (isOpen) {
      if (initialRecord) {
        // Edit existing record
        setCode(initialRecord.code || `OPS-${Math.floor(100 + Math.random() * 900)}`);
        setMgrs(initialRecord.metadata?.mgrs || initialRecord.metadata?.grid_ref || '');
        
        const rawArea =
          initialRecord.location_name ||
          initialRecord.metadata?.area ||
          (initialRecord.title && initialRecord.title.includes('—') ? initialRecord.title.split('—')[1]?.trim() : '') ||
          defaultArea;
        setArea(rawArea);
        
        // Date parsing
        const initialDate = initialRecord.metadata?.operation_date || initialRecord.created_at;
        if (initialDate) {
          try {
            setDate(new Date(initialDate).toISOString().slice(0, 16));
          } catch {
            setDate(new Date().toISOString().slice(0, 16));
          }
        } else {
          setDate(new Date().toISOString().slice(0, 16));
        }

        const initialType = initialRecord.metadata?.operation_type || initialRecord.title?.split('—')[0]?.trim();
        if (initialType && COMMON_OPERATION_TYPES.includes(initialType)) {
          setType(initialType);
          setCustomType('');
        } else if (initialType) {
          setType('Custom Type (Write-in)');
          setCustomType(initialType);
        } else {
          setType(COMMON_OPERATION_TYPES[0]);
          setCustomType('');
        }

        setNarrative(initialRecord.description || initialRecord.metadata?.result || initialRecord.metadata?.narrative || '');
        setPriority(initialRecord.priority || 'medium');
        setStatus(initialRecord.status || 'active');
        setLat(Number(initialRecord.lat) || 37.7749);
        setLng(Number(initialRecord.lng) || -122.4194);
      } else {
        // Create new record
        setCode(`OPS-${Math.floor(100 + Math.random() * 900)}`);
        setMgrs('');
        setArea(defaultArea);
        setDate(new Date().toISOString().slice(0, 16));
        setType(COMMON_OPERATION_TYPES[0]);
        setCustomType('');
        setNarrative('');
        setPriority('medium');
        setStatus('active');
        setLat(37.7749);
        setLng(-122.4194);
      }
      setError(null);
      setSyncStatus(null);
      setShowSqlSchema(false);
    }
  }, [isOpen, initialRecord, defaultArea]);

  if (!isOpen) return null;

  const resolvedType = type === 'Custom Type (Write-in)' ? customType.trim() || 'Custom Operation' : type;

  // Format DTG string (e.g. 140830Z SEP 26)
  const formatDTG = (dateStr: string) => {
    try {
      const d = dateStr ? new Date(dateStr) : new Date();
      const day = String(d.getUTCDate()).padStart(2, '0');
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const mins = String(d.getUTCMinutes()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[d.getUTCMonth()];
      const year = String(d.getUTCFullYear()).slice(-2);
      return `${day}${hours}${mins}Z ${month} ${year}`;
    } catch {
      return 'DTG INVALID';
    }
  };

  const handleUseCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(Number(position.coords.latitude.toFixed(6)));
          setLng(Number(position.coords.longitude.toFixed(6)));
          setSyncStatus('GPS coordinates captured from browser');
        },
        () => {
          setError('Could not access current browser GPS. Default theater coordinates kept.');
        }
      );
    }
  };

  const handleSetNow = () => {
    setDate(new Date().toISOString().slice(0, 16));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!area.trim()) {
      setError('Area / Operational Sector is required.');
      return;
    }
    if (!resolvedType.trim()) {
      setError('Operation / Incident Type is required.');
      return;
    }
    if (!narrative.trim()) {
      setError('Result / Narrative description is required.');
      return;
    }

    setIsSaving(true);
    setSyncStatus('Saving record to Supabase SQL table...');

    try {
      const recordId = initialRecord?.id || generateUUID();
      const isoDate = date ? new Date(date).toISOString() : new Date().toISOString();

      // Convert MGRS string to [longitude, latitude] before saving to Supabase
      let finalLat = lat;
      let finalLng = lng;
      const cleanM = cleanMGRS(mgrs);
      if (cleanM) {
        const decoded = parseMGRSToCoords(cleanM);
        if (decoded) {
          finalLat = decoded[0];
          finalLng = decoded[1];
        }
      }

      const operationRecord: Partial<RecordItem> = {
        id: recordId,
        code: code.trim() || `OPS-${Math.floor(100 + Math.random() * 900)}`,
        title: `${resolvedType} — ${area.trim()}`,
        category: 'incidents',
        description: narrative.trim(),
        status,
        priority,
        lat: finalLat,
        lng: finalLng,
        location_name: area.trim(),
        metadata: {
          ...(initialRecord?.metadata || {}),
          mgrs: cleanM || null,
          grid_ref: cleanM || null,
          area: area.trim(),
          operation_date: isoDate,
          operation_type: resolvedType,
          result: narrative.trim(),
          narrative: narrative.trim(),
          dtg: formatDTG(date),
        },
        created_at: isoDate,
        updated_at: new Date().toISOString(),
      };

      // 1. Direct Supabase Cloud Save: Exclusively to dedicated 'incidents' table (NOT unified records table)
      if (isSupabaseConfigured() && supabase) {
        try {
          const incidentPayload = {
            id: recordId,
            code: operationRecord.code,
            title: operationRecord.title,
            operation_type: resolvedType,
            area: area.trim(),
            location_name: area.trim(),
            mgrs: cleanM || null,
            priority: operationRecord.priority,
            status: operationRecord.status,
            lat: finalLat,
            lng: finalLng,
            narrative: narrative.trim(),
            description: narrative.trim(),
            dtg: formatDTG(date),
            incident_date: isoDate,
            metadata: {
              mgrs: cleanM || null,
              grid_ref: cleanM || null,
              area: area.trim(),
              operation_date: isoDate,
              operation_type: resolvedType,
              result: narrative.trim(),
              narrative: narrative.trim(),
              dtg: formatDTG(date),
            },
            created_at: operationRecord.created_at,
            updated_at: operationRecord.updated_at,
          };

          const { error: incError } = await supabase.from('incidents').upsert([incidentPayload]);
          if (incError) {
            console.warn('Dedicated incidents table upsert notice:', incError.message);
          } else {
            setSyncStatus('Saved to dedicated incidents table in Supabase');
          }
        } catch (dbErr: any) {
          console.error('Supabase direct communication notice:', dbErr);
        }
      }

      // Save to localStorage key 'operational_incidents'
      try {
        const stored = localStorage.getItem('operational_incidents');
        const list = stored ? JSON.parse(stored) : [];
        const isEdit = list.some((i: any) => i.id === recordId);
        const updated = isEdit
          ? list.map((i: any) => (i.id === recordId ? operationRecord : i))
          : [operationRecord, ...list];
        localStorage.setItem('operational_incidents', JSON.stringify(updated));
      } catch { /* silent */ }

      // 2. Trigger parent save handler (updates application state, audit trail & GitHub snapshot)
      await onSave(operationRecord);

      setIsSaving(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to save operation record:', err);
      setError(err?.message || 'Failed to save operation record. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-blue-600">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900">
                  {initialRecord ? 'Edit Operation Record' : 'Create Operation Record'}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  OPERATION CELL (G3)
                </span>
              </div>
            
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowSqlSchema(!showSqlSchema)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-cyan-950 border border-slate-300 hover:border-cyan-500 text-cyan-300 text-[11px] font-sans font-semibold transition-all shadow-sm"
              title="View Supabase incidents SQL Table Schema"
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQL Table</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Collapsible SQL Table Schema Drawer */}
        {showSqlSchema && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-sans text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-bold text-blue-600 flex items-center space-x-1.5">
                <Table className="w-4 h-4" />
                <span>Supabase SQL Table Schema (`incidents`)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SQL_TABLE_SCHEMA);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2500);
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-[11px] font-semibold transition-all active:scale-95"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Run this in your Supabase SQL Editor to create the dedicated <code className="text-amber-300 font-bold">incidents</code> table. Saving this modal automatically upserts to this table!
            </p>
            <pre className="p-2.5 rounded bg-black/60 border border-slate-200 text-[10px] text-cyan-200/90 overflow-x-auto max-h-36 leading-relaxed">
              {SQL_TABLE_SCHEMA}
            </pre>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto font-sans text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

         

          {/* FIELD 1: MRGS / MGRS Grid Reference (Optional) */}
          <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 uppercase text-[11px] font-bold flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>MRGS / MGRS Grid Reference</span>
                
              </label>
              
            </div>
            <input
              type="text"
              value={mgrs}
              onChange={(e) => setMgrs(e.target.value)}
              placeholder="e.g. 51PTS1234567890"
              className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg p-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs font-sans"
            />
            <p className="text-[10px] text-slate-500">
              If Incident or Events has no MGRS provided, Just Input Estimated MGRS to display the Map.
            </p>
          </div>

          {/* FIELD 2: Area (Required) */}
          <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 uppercase text-[11px] font-bold flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Area / Operational Sector</span>
                <span className="text-blue-600 font-bold">*</span>
              </label>
              <span className="text-[10px] text-slate-500">AOR / Location</span>
            </div>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Enter area, outpost, or location..."
              required
              className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg p-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-sans"
            />
          </div>

          {/* ROW: Date & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FIELD 3: Date (Required) */}
            <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 uppercase text-[11px] font-bold flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Date / DTG</span>
                  <span className="text-blue-600 font-bold">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetNow}
                  className="text-[10px] text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <Clock className="w-3 h-3" />
                  <span>Set to Now</span>
                </button>
              </div>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 text-xs font-sans"
              />
              <div className="text-[10px] text-slate-500 font-sans flex items-center justify-between">
                <span>ZULU DTG:</span>
                <span className="text-emerald-400 font-bold">{formatDTG(date)}</span>
              </div>
            </div>

            {/* FIELD 4: Type (Required) */}
            <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 uppercase text-[11px] font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Operation / Incident Type</span>
                  <span className="text-blue-600 font-bold">*</span>
                </label>
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-amber-500 text-xs font-sans cursor-pointer"
              >
                {COMMON_OPERATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {type === 'Custom Type (Write-in)' && (
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="Specify custom incident type..."
                  required
                  className="w-full bg-white border border-amber-500/50 rounded-lg p-2 text-slate-900 placeholder-slate-500 text-xs font-sans mt-2"
                />
              )}
            </div>
          </div>

          {/* FIELD 5: Result / Narrative (Required) */}
          <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 uppercase text-[11px] font-bold flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Result / Narrative</span>
                <span className="text-blue-600 font-bold">*</span>
              </label>
              <span className="text-[10px] text-slate-500">After-Action Summary</span>
            </div>
            <textarea
              rows={4}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              required
              placeholder="Describe the tactical engagement, enemy elements encountered, friendly units involved, actions taken, immediate result, and current disposition..."
              className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg p-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-sans leading-relaxed"
            />
          </div>

          {/* Tactical Parameters Row: Priority, Status, Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50/80 border border-slate-200/80">
            {/* Priority */}
            <div>
              <label className="block text-slate-500 uppercase text-[10px] mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RecordPriority)}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded p-1.5 text-xs text-slate-800"
              >
                <option value="critical">CRITICAL (Red)</option>
                <option value="high">HIGH (Amber)</option>
                <option value="medium">MEDIUM (Cyan)</option>
                <option value="low">LOW (Gray)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-slate-500 uppercase text-[10px] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RecordStatus)}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded p-1.5 text-xs text-slate-800"
              >
                <option value="active">Active (Ongoing)</option>
                <option value="pending">Pending Review</option>
                <option value="closed">Resolved / Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Tactical Code */}
            <div>
              <label className="block text-slate-500 uppercase text-[10px] mb-1">Tactical Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded p-1.5 text-xs text-cyan-300 font-bold"
              />
            </div>
          </div>

          {/* Toggle Advanced Coordinates */}
          
          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Direct Supabase Auto-Save Armed</span>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{isSaving ? 'Saving to Supabase...' : 'Save Operation Record'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

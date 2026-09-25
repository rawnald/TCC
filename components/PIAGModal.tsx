'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Crosshair,
  Users,
  MapPin,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Save,
  Loader2,
  ShieldAlert,
  Database,
  Tag,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { PIAGLocationRecord } from '@/types/cmo';
import { RecordItem } from '@/types';
import { toMGRS, parseMGRSToCoords, cleanMGRS } from '@/lib/mgrsUtils';
import { PH_PROVINCES } from '@/lib/phLocationData';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface PIAGModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PIAGLocationRecord) => Promise<void> | void;
  initialData?: PIAGLocationRecord | null;
}

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

const PIAG_GROUP_OPTIONS = [
  { id: 'MILF', label: 'MILF — Moro Islamic Liberation Front' },
  { id: 'MNLF', label: 'MNLF — Moro National Liberation Front' },
  { id: 'BIFF', label: 'BIFF — Bangsamoro Islamic Freedom Fighters' },
  { id: 'PAG', label: 'PAG — Private Armed Group / Paramilitary Element' },
  { id: 'Other', label: 'Other / Custom Group Designation' },
] as const;

type GroupOptionType = (typeof PIAG_GROUP_OPTIONS)[number]['id'];

export default function PIAGModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: PIAGModalProps) {
  // ── Form State ─────────────────────────────────────────────────────────────
  const [groupDropdown, setGroupDropdown] = useState<GroupOptionType>('MILF');
  const [subElement, setSubElement] = useState('');
  const [customGroupName, setCustomGroupName] = useState('');

  const [commanderLeader, setCommanderLeader] = useState('');
  const [affiliatedPolitician, setAffiliatedPolitician] = useState('');
  const [estimatedStrength, setEstimatedStrength] = useState('');
  const [firearmsInventory, setFirearmsInventory] = useState(''); // Total Est Firearms
  const [notes, setNotes] = useState(''); // Operational Notes & Remarks

  // Location & Coordinates
  const [province, setProvince] = useState('Maguindanao del Sur');
  const [customProvince, setCustomProvince] = useState('');
  const [municipality, setMunicipality] = useState('Datu Piang (Dulawan)');
  const [customMunicipality, setCustomMunicipality] = useState('');
  const [barangay, setBarangay] = useState('Poblacion');
  const [customBarangay, setCustomBarangay] = useState('');
  const [purokSitio, setPurokSitio] = useState('');
  const [mgrsInput, setMgrsInput] = useState('51NXH6659745322');
  const [lat, setLat] = useState<number>(6.9536);
  const [lng, setLng] = useState<number>(124.4756);
  const [mgrsValid, setMgrsValid] = useState<boolean>(true);

  // Status & Threat
  const [status, setStatus] = useState<'Active' | 'Monitored' | 'Disbanded' | 'Dormant'>('Active');
  const [threatLevel, setThreatLevel] = useState<'critical' | 'high' | 'medium' | 'low'>('high');

  // UI / Async State
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null);

  // Derived effective group name
  const effectiveGroupName = useMemo(() => {
    if (groupDropdown === 'Other') {
      return customGroupName.trim();
    }
    if (subElement.trim()) {
      return `${groupDropdown} — ${subElement.trim()}`;
    }
    return groupDropdown;
  }, [groupDropdown, subElement, customGroupName]);

  // Province / Municipality data
  const provinceNames = useMemo(() => Object.keys(PH_PROVINCES), []);
  const municipalities = useMemo(() => {
    const prov = PH_PROVINCES[province];
    return prov ? prov.municipalities : [];
  }, [province]);
  const barangays = useMemo(() => {
    const muni = municipalities.find((m) => m.name === municipality);
    return muni ? muni.barangays : [];
  }, [municipalities, municipality]);

  // ── Populate on Open ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const rawName = (initialData.group_name || '').trim();
      if (/^MILF\b/i.test(rawName)) {
        setGroupDropdown('MILF');
        setSubElement(rawName.replace(/^MILF(\s*[-—]\s*|\s+)/i, '').trim());
      } else if (/^MNLF\b/i.test(rawName)) {
        setGroupDropdown('MNLF');
        setSubElement(rawName.replace(/^MNLF(\s*[-—]\s*|\s+)/i, '').trim());
      } else if (/^BIFF\b/i.test(rawName)) {
        setGroupDropdown('BIFF');
        setSubElement(rawName.replace(/^BIFF(\s*[-—]\s*|\s+)/i, '').trim());
      } else if (/^PAG\b/i.test(rawName)) {
        setGroupDropdown('PAG');
        setSubElement(rawName.replace(/^PAG(\s*[-—]\s*|\s+)/i, '').trim());
      } else {
        setGroupDropdown('Other');
        setCustomGroupName(rawName);
        setSubElement('');
      }

      setCommanderLeader(initialData.commander_leader || '');
      setAffiliatedPolitician(initialData.affiliated_politician_faction || '');
      setEstimatedStrength(initialData.estimated_strength || '');
      setFirearmsInventory(initialData.total_est_firearms || initialData.firearms_inventory || '');
      if (initialData.province && PH_PROVINCES[initialData.province]) {
        setProvince(initialData.province);
        setCustomProvince('');
      } else if (initialData.province) {
        setProvince('Custom');
        setCustomProvince(initialData.province);
      } else {
        setProvince('Maguindanao del Sur');
        setCustomProvince('');
      }

      const activeMunis = PH_PROVINCES[initialData.province || 'Maguindanao del Sur']?.municipalities || [];
      if (initialData.municipality && activeMunis.some((m) => m.name === initialData.municipality)) {
        setMunicipality(initialData.municipality);
        setCustomMunicipality('');
      } else if (initialData.municipality) {
        setMunicipality('Custom');
        setCustomMunicipality(initialData.municipality);
      } else {
        setMunicipality(activeMunis[0]?.name || 'Datu Piang (Dulawan)');
        setCustomMunicipality('');
      }

      const activeBrgys = activeMunis.find((m) => m.name === initialData.municipality)?.barangays || [];
      if (initialData.barangay && activeBrgys.includes(initialData.barangay)) {
        setBarangay(initialData.barangay);
        setCustomBarangay('');
      } else if (initialData.barangay) {
        setBarangay('Custom');
        setCustomBarangay(initialData.barangay);
      } else {
        setBarangay(activeBrgys[0] || 'Poblacion');
        setCustomBarangay('');
      }

      setPurokSitio(initialData.purok_sitio || '');
      setMgrsInput(initialData.mgrs || '');
      setLat(Number(initialData.lat) || 6.9536);
      setLng(Number(initialData.lng) || 124.4756);
      setStatus(initialData.status || 'Active');
      setThreatLevel(initialData.threat_level || 'high');
      setNotes(initialData.remarks || initialData.notes || '');
      setMgrsValid(true);
      setError(null);
      setSupabaseStatus(null);
    } else {
      setGroupDropdown('MILF');
      setSubElement('105th Base Command');
      setCustomGroupName('');
      setCommanderLeader('');
      setAffiliatedPolitician('');
      setEstimatedStrength('15-20 armed combatants');
      setFirearmsInventory('12 (8x M16, 2x M14, 1x M203, 1x Cal .45)');
      setProvince('Maguindanao del Sur');
      setCustomProvince('');
      setMunicipality('Datu Piang (Dulawan)');
      setCustomMunicipality('');
      setBarangay('Poblacion');
      setCustomBarangay('');
      setPurokSitio('');
      const defaultCoords = PH_PROVINCES['Maguindanao del Sur']?.municipalities[1]?.coords || [6.9536, 124.4756];
      setLat(defaultCoords[0]);
      setLng(defaultCoords[1]);
      setMgrsInput(toMGRS(defaultCoords[0], defaultCoords[1]));
      setStatus('Active');
      setThreatLevel('high');
      setNotes('');
      setMgrsValid(true);
      setError(null);
      setSupabaseStatus(null);
    }
  }, [isOpen, initialData]);

  // ── Province & Municipality handlers ───────────────────────────────────────
  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    if (newProv === 'Custom') {
      setCustomProvince('');
      setMunicipality('Custom');
      setCustomMunicipality('');
      setBarangay('Custom');
      setCustomBarangay('');
      return;
    }
    setCustomProvince('');
    const provInfo = PH_PROVINCES[newProv];
    if (provInfo && provInfo.municipalities.length > 0) {
      const firstMuni = provInfo.municipalities[0];
      setMunicipality(firstMuni.name);
      setCustomMunicipality('');
      setBarangay(firstMuni.barangays[0] || 'Poblacion');
      setCustomBarangay('');
      setLat(firstMuni.coords[0]);
      setLng(firstMuni.coords[1]);
      setMgrsInput(toMGRS(firstMuni.coords[0], firstMuni.coords[1]));
      setMgrsValid(true);
    }
  };

  const handleMunicipalityChange = (newMuni: string) => {
    setMunicipality(newMuni);
    if (newMuni === 'Custom') {
      setCustomMunicipality('');
      setBarangay('Custom');
      setCustomBarangay('');
      return;
    }
    setCustomMunicipality('');
    const found = municipalities.find((m) => m.name === newMuni);
    if (found) {
      setBarangay(found.barangays[0] || 'Poblacion');
      setCustomBarangay('');
      setLat(found.coords[0]);
      setLng(found.coords[1]);
      setMgrsInput(toMGRS(found.coords[0], found.coords[1]));
      setMgrsValid(true);
    }
  };

  // ── MGRS Real-time Geocoding ──────────────────────────────────────────────
  const handleMGRSChange = (val: string) => {
    const clean = val.replace(/\s+/g, '').toUpperCase();
    setMgrsInput(clean);

    if (clean.length >= 8) {
      const parsed = parseMGRSToCoords(clean);
      if (parsed) {
        setLat(parsed[0]);
        setLng(parsed[1]);
        setMgrsValid(true);
        return;
      }
    }
    setMgrsValid(false);
  };

  if (!isOpen) return null;

  // ── Form Submission with Direct Supabase Save ─────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalGroupName = effectiveGroupName;
    if (!finalGroupName) {
      setError('Please select or specify the PIAG Group / Element Name.');
      return;
    }

    if (!commanderLeader.trim()) {
      setError('Commander Name / Key Leader is required.');
      return;
    }

    if (!mgrsInput.trim()) {
      setError('MGRS Grid Coordinate is required.');
      return;
    }

    const cleanM = cleanMGRS(mgrsInput);
    let finalLat = lat;
    let finalLng = lng;
    if (cleanM) {
      const parsed = parseMGRSToCoords(cleanM);
      if (parsed) {
        finalLat = parsed[0];
        finalLng = parsed[1];
      }
    }

    const finalProvince = province === 'Custom' ? customProvince.trim() || 'Province' : province;
    const finalMunicipality = municipality === 'Custom' ? customMunicipality.trim() || 'Municipality' : municipality;
    const finalBarangay = barangay === 'Custom' ? customBarangay.trim() || 'Barangay' : barangay;
    const fullAddr = [purokSitio.trim(), finalBarangay, finalMunicipality, finalProvince].filter(Boolean).join(', ');

    const recordId = initialData?.id || generateUUID();
    const record: PIAGLocationRecord = {
      id: recordId,
      group_name: finalGroupName,
      commander_leader: commanderLeader.trim(),
      affiliated_politician_faction: affiliatedPolitician.trim() || undefined,
      estimated_strength: estimatedStrength.trim() || 'Unspecified',
      firearms_inventory: firearmsInventory.trim() || undefined,
      total_est_firearms: firearmsInventory.trim() || undefined,
      province: finalProvince,
      municipality: finalMunicipality,
      barangay: finalBarangay,
      purok_sitio: purokSitio.trim() || undefined,
      address: fullAddr,
      mgrs: cleanM || toMGRS(finalLat, finalLng),
      lat: finalLat,
      lng: finalLng,
      status,
      threat_level: threatLevel,
      notes: notes.trim() || undefined,
      remarks: notes.trim() || undefined,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setIsSaving(true);
    setSupabaseStatus('Saving to Supabase table...');

    try {
      // 1. Automatic direct save to Supabase
      if (isSupabaseConfigured() && supabase) {
        // A. Attempt upsert to dedicated cmo_piags table if present
        try {
          await supabase.from('cmo_piags').upsert([record]);
        } catch (dbErr) {
          console.warn('cmo_piags table upsert notice:', dbErr);
        }

        // B. Upsert into records table with unit category & cmo_type: 'piag' metadata
        try {
          const mirror: Partial<RecordItem> = {
            id: record.id,
            code: `PIAG-${finalGroupName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'ELEM'}`,
            title: `[PIAG] ${finalGroupName}`,
            category: 'units',
            description: notes.trim() || `Leader: ${commanderLeader.trim()} | Strength: ${estimatedStrength.trim()} | Firearms: ${firearmsInventory.trim()} | Status: ${status}`,
            status: status === 'Disbanded' ? 'closed' : 'active',
            priority: threatLevel || 'high',
            lat: finalLat,
            lng: finalLng,
            location_name: fullAddr,
            metadata: {
              cmo_type: 'piag',
              is_piag: true,
              group_name: finalGroupName,
              commander_leader: commanderLeader.trim(),
              affiliated_politician_faction: affiliatedPolitician.trim() || null,
              estimated_strength: estimatedStrength.trim(),
              firearms_inventory: firearmsInventory.trim(),
              total_est_firearms: firearmsInventory.trim(),
              mgrs: record.mgrs,
              province,
              municipality,
              barangay: finalBarangay,
              purok_sitio: purokSitio.trim() || null,
              address: fullAddr,
              status,
              threat_level: threatLevel,
              notes: notes.trim(),
              remarks: notes.trim(),
            },
            updated_at: new Date().toISOString(),
          };

          const { error: recError } = await supabase.from('records').upsert([mirror]);
          if (recError) {
            console.warn('Supabase records mirror notification:', recError.message);
          }
        } catch (mirrorErr) {
          console.warn('Supabase records mirror exception:', mirrorErr);
        }
      }

      // 2. Invoke parent save handler to update workspace state and local cache
      await onSave(record);
      onClose();
    } catch (err: any) {
      console.error('Save PIAG Exception:', err);
      setError(err?.message || 'Error saving PIAG location record to Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-800">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm font-bold">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wider">
                  {initialData ? 'Edit PIAG Location Record' : 'Add PIAG Location (Private Armed Group)'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1">
                  <Database className="w-3 h-3 text-blue-600" />
                  <span>SUPABASE AUTO-SAVE</span>
                </span>
              </div>
              <p className="text-xs font-sans text-slate-500 mt-0.5">
                Private Armed Groups Geolocation, Leadership &amp; Armed Capabilities Registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
          {/* ── Section 1: PIAG Identification & Leadership ─────────────────── */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase">
                <Users className="w-4 h-4 text-blue-600" />
                <span>1. PIAG Element Identification &amp; Leadership</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">MILF / MNLF / Armed Elements</span>
            </div>

            {/* Piag Group / Element Name dropdown(MILF, MNLF) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  PIAG Group / Element Name <span className="text-blue-600">*</span>
                </label>
                <select
                  value={groupDropdown}
                  onChange={(e) => setGroupDropdown(e.target.value as GroupOptionType)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  {PIAG_GROUP_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                {groupDropdown === 'Other' ? (
                  <div>
                    <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                      Custom Group / Element Name <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customGroupName}
                      onChange={(e) => setCustomGroupName(e.target.value)}
                      placeholder="e.g. Sinsuat Armed Contingent / Paglas Force"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                      Sub-element / Force Designation <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={subElement}
                      onChange={(e) => setSubElement(e.target.value)}
                      placeholder="e.g. 105th Base Command / 118BC / Lupah Sug"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Live Name Preview */}
            <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Full Element Identifier:</span>
              </span>
              <span className="font-bold text-blue-700 font-mono">
                {effectiveGroupName || '<Designate Group>'}
              </span>
            </div>

            {/* Commander Name / Key Leader & Affiliated Politician */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Commander Name / Key Leader <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={commanderLeader}
                  onChange={(e) => setCommanderLeader(e.target.value)}
                  placeholder="e.g. Commander Jack / Ting Sinsuat / Ebrahim Usman @Bords"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Affiliated Politician / Political Faction
                </label>
                <input
                  type="text"
                  value={affiliatedPolitician}
                  onChange={(e) => setAffiliatedPolitician(e.target.value)}
                  placeholder="e.g. Former Mayoralty candidate / Municipal Boss / Tayuan Faction"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>

            {/* Estimated Armed Strength & Total Est Firearms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Estimated Armed Strength
                </label>
                <input
                  type="text"
                  value={estimatedStrength}
                  onChange={(e) => setEstimatedStrength(e.target.value)}
                  placeholder="e.g. 15-20 combatants / MOL 25 armed personnel"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
                {/* Strength quick presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['10-15 personnel', '15-20 combatants', '25-30 elements', 'Platoon size (30+)'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEstimatedStrength(preset)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors border border-slate-200"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Total Est Firearms
                </label>
                <input
                  type="text"
                  value={firearmsInventory}
                  onChange={(e) => setFirearmsInventory(e.target.value)}
                  placeholder="e.g. 15 (8x M16, 4x M14, 2x Cal .45, 1x M203)"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter estimated total firearms count and known weapon calibers
                </p>
              </div>
            </div>
          </div>

          {/* ── Section 2: Staging Location & MGRS Coordinates ──────────────── */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>2. Staging Area / Location &amp; MGRS Grid Coordinates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Province *</label>
                <select
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  {provinceNames.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="Custom">+ Other (Write-in Province)</option>
                </select>
                {province === 'Custom' && (
                  <input
                    type="text"
                    required
                    value={customProvince}
                    onChange={(e) => setCustomProvince(e.target.value)}
                    placeholder="Enter custom province"
                    className="w-full mt-1.5 bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Municipality *</label>
                <select
                  value={municipality}
                  onChange={(e) => handleMunicipalityChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  {municipalities.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                  <option value="Custom">+ Other (Write-in Municipality)</option>
                </select>
                {municipality === 'Custom' && (
                  <input
                    type="text"
                    required
                    value={customMunicipality}
                    onChange={(e) => setCustomMunicipality(e.target.value)}
                    placeholder="Enter custom municipality"
                    className="w-full mt-1.5 bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Barangay *</label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  {barangays.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Custom">+ Other (Write-in Barangay)</option>
                </select>
                {barangay === 'Custom' && (
                  <input
                    type="text"
                    required
                    value={customBarangay}
                    onChange={(e) => setCustomBarangay(e.target.value)}
                    placeholder="Enter custom barangay"
                    className="w-full mt-1.5 bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Sitio / Specific Area <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={purokSitio}
                  onChange={(e) => setPurokSitio(e.target.value)}
                  placeholder="e.g. Sitio Manguda, compound near highway / riverbank"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-700 font-semibold">
                    MGRS Grid Ref <span className="text-blue-600">*</span>
                  </label>
                  <span className={`text-[10px] font-semibold flex items-center space-x-1 ${mgrsValid ? 'text-blue-600' : 'text-rose-600'}`}>
                    {mgrsValid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        <span>Valid ({lat.toFixed(4)}, {lng.toFixed(4)})</span>
                      </>
                    ) : (
                      <span>Invalid Grid</span>
                    )}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={mgrsInput}
                    onChange={(e) => handleMGRSChange(e.target.value)}
                    placeholder="e.g. 51NXH6659745322"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-600 shadow-sm uppercase"
                  />
                  <Compass className="w-4 h-4 text-blue-500 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: Operational Status, Threat Level & Notes ─────────── */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>3. Operational Status, Threat Level &amp; Remarks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Current Tracking Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-bold shadow-sm"
                >
                  <option value="Active">Active / Mobilized</option>
                  <option value="Monitored">Monitored / Under Surveillance</option>
                  <option value="Dormant">Dormant / Low Activity</option>
                  <option value="Disbanded">Disbanded / Neutralized</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Assessed Threat Level *
                </label>
                <select
                  value={threatLevel}
                  onChange={(e) => setThreatLevel(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-bold shadow-sm"
                >
                  <option value="critical">Critical (Imminent election / armed conflict threat)</option>
                  <option value="high">High (Armed harassment capability)</option>
                  <option value="medium">Medium (Defensive posture / localized threat)</option>
                  <option value="low">Low (Dispersed elements)</option>
                </select>
              </div>
            </div>

            {/* Operational Notes & Remarks */}
            <div>
              <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                Operational Notes &amp; Remarks
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tactical sightings, patrol reports, intelligence observations, and historical affiliations..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
              />
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>{supabaseStatus || 'Direct Supabase table persistence enabled'}</span>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Saving to Supabase...' : initialData ? 'Update & Save to Supabase' : 'Save to Supabase Table'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

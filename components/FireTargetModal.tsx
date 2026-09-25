'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Target, MapPin, X, Shield, AlertTriangle, Crosshair, Sparkles } from 'lucide-react';
import { PH_PROVINCES, COMMON_PUROKS } from '@/lib/phLocationData';
import { toMGRS, parseMGRSToCoords, cleanMGRS } from '@/lib/mgrsUtils';

export interface FireTargetRecord {
  id: string;
  target_number: string;
  description: string;
  category:
    | 'Encampment / Base'
    | 'Bunker / Hardened Point'
    | 'Weapons / Ammo Cache'
    | 'Mortar Pit / Firing Position'
    | 'Convoy / Staging Route'
    | 'Command & Control Node'
    | 'HVI Sanctuary';
  province: string;
  municipality: string;
  barangay: string;
  purok_sitio?: string;
  address: string;
  mgrs: string;
  lat: number;
  lng: number;
  priority: 'Priority 1 (Urgent)' | 'Priority 2 (Planned)' | 'Priority 3 (On-Call)';
  status: 'Active / Unengaged' | 'Targeted / Scheduled' | 'Suppressed' | 'Neutralized';
  assigned_battery?: string;
  recommended_munition?: string;
  collateral_damage_estimate?: 'Low (Open Field / Forest)' | 'Moderate (Proximity to Farmland)' | 'High (Near Civilians / Structures)';
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export const TARGET_CATEGORIES = [
  'Encampment / Base',
  'Bunker / Hardened Point',
  'Weapons / Ammo Cache',
  'Mortar Pit / Firing Position',
  'Convoy / Staging Route',
  'Command & Control Node',
  'HVI Sanctuary',
] as const;

export const TARGET_PRIORITIES = [
  'Priority 1 (Urgent)',
  'Priority 2 (Planned)',
  'Priority 3 (On-Call)',
] as const;

export const TARGET_STATUSES = [
  'Active / Unengaged',
  'Targeted / Scheduled',
  'Suppressed',
  'Neutralized',
] as const;

interface FireTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (target: FireTargetRecord) => Promise<void> | void;
  initialData?: FireTargetRecord | null;
  availableBatteries?: string[];
}

export default function FireTargetModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableBatteries = [],
}: FireTargetModalProps) {
  const [targetNumber, setTargetNumber] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FireTargetRecord['category']>('Encampment / Base');
  const [priority, setPriority] = useState<FireTargetRecord['priority']>('Priority 1 (Urgent)');
  const [status, setStatus] = useState<FireTargetRecord['status']>('Active / Unengaged');
  const [assignedBattery, setAssignedBattery] = useState('');
  const [recommendedMunition, setRecommendedMunition] = useState('HE Point Detonating');
  const [collateralEstimate, setCollateralEstimate] = useState<FireTargetRecord['collateral_damage_estimate']>('Low (Open Field / Forest)');
  const [remarks, setRemarks] = useState('');

  // Location Cascading
  const [province, setProvince] = useState('Maguindanao del Sur');
  const [customProvince, setCustomProvince] = useState('');
  const [municipality, setMunicipality] = useState('Datu Piang (Dulawan)');
  const [customMunicipality, setCustomMunicipality] = useState('');
  const [barangay, setBarangay] = useState('Masigay');
  const [customBarangay, setCustomBarangay] = useState('');
  const [purokSitio, setPurokSitio] = useState('');

  // Coordinates
  const [mgrsInput, setMgrsInput] = useState('51NXH6659745322');
  const [lat, setLat] = useState<number>(6.9536);
  const [lng, setLng] = useState<number>(124.4756);
  const [mgrsValid, setMgrsValid] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available provinces
  const provinceNames = useMemo(() => Object.keys(PH_PROVINCES), []);

  // Municipalities for selected province
  const municipalities = useMemo(() => {
    const prov = PH_PROVINCES[province];
    return prov ? prov.municipalities : [];
  }, [province]);

  // Barangays for selected municipality
  const barangays = useMemo(() => {
    const muni = municipalities.find((m) => m.name === municipality);
    return muni ? muni.barangays : [];
  }, [municipalities, municipality]);

  // Address calculation
  const calculatedAddress = useMemo(() => {
    const finalProv = province === 'Custom' ? customProvince.trim() : province;
    const finalMuni = municipality === 'Custom' ? customMunicipality.trim() : municipality;
    const finalBrgy = barangay === 'Custom' ? customBarangay.trim() : barangay;
    return [purokSitio.trim(), finalBrgy, finalMuni, finalProv].filter(Boolean).join(', ');
  }, [purokSitio, barangay, customBarangay, municipality, customMunicipality, province, customProvince]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTargetNumber(initialData.target_number || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'Encampment / Base');
      setPriority(initialData.priority || 'Priority 1 (Urgent)');
      setStatus(initialData.status || 'Active / Unengaged');
      setAssignedBattery(initialData.assigned_battery || '');
      setRecommendedMunition(initialData.recommended_munition || 'HE Point Detonating');
      setCollateralEstimate(initialData.collateral_damage_estimate || 'Low (Open Field / Forest)');
      setRemarks(initialData.remarks || '');

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
      setMgrsValid(true);
      setError(null);
    } else {
      const randomTgt = `JTFC-TGT-${Math.floor(100 + Math.random() * 900)}`;
      setTargetNumber(randomTgt);
      setDescription('');
      setCategory('Encampment / Base');
      setPriority('Priority 1 (Urgent)');
      setStatus('Active / Unengaged');
      setAssignedBattery(availableBatteries[0] || 'Alpha Battery, 6th FAB (105mm)');
      setRecommendedMunition('HE Point Detonating');
      setCollateralEstimate('Low (Open Field / Forest)');
      setRemarks('');

      setProvince('Maguindanao del Sur');
      setCustomProvince('');
      setMunicipality('Datu Piang (Dulawan)');
      setCustomMunicipality('');
      setBarangay('Masigay');
      setCustomBarangay('');
      setPurokSitio('Sitio Manguda');

      const defaultCoords = [6.9536, 124.4756];
      setLat(defaultCoords[0]);
      setLng(defaultCoords[1]);
      setMgrsInput(toMGRS(defaultCoords[0], defaultCoords[1]));
      setMgrsValid(true);
      setError(null);
    }
  }, [isOpen, initialData, availableBatteries]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetNumber.trim()) {
      setError('Target Number / Code is required.');
      return;
    }
    if (!description.trim()) {
      setError('Target Description is required.');
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

    const record: FireTargetRecord = {
      id: initialData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tgt-${Date.now()}`),
      target_number: targetNumber.trim().toUpperCase(),
      description: description.trim(),
      category,
      province: finalProvince,
      municipality: finalMunicipality,
      barangay: finalBarangay,
      purok_sitio: purokSitio.trim() || undefined,
      address: calculatedAddress,
      mgrs: cleanM || toMGRS(finalLat, finalLng),
      lat: finalLat,
      lng: finalLng,
      priority,
      status,
      assigned_battery: assignedBattery.trim() || undefined,
      recommended_munition: recommendedMunition.trim() || undefined,
      collateral_damage_estimate: collateralEstimate,
      remarks: remarks.trim() || undefined,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onSave(record);
      onClose();
    } catch (err: any) {
      console.error('Save target error:', err);
      setError(err?.message || 'Error saving target record.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-800 max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wide">
                {initialData ? 'Edit Target Record' : 'Add Target to Joint Fire Deck'}
              </h2>
              <p className="text-xs font-sans text-slate-500">
                Joint Task Force Central Target Acquisition &amp; Tactical Addressing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
          {/* Section 1: Identification & Designation */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-rose-700 uppercase pb-2 border-b border-slate-200">
              <Target className="w-4 h-4 text-rose-600" />
              <span>1. Target Identification &amp; Category</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Target Number / Reference Code <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. JTFC-TGT-001"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-rose-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Target Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-600 shadow-sm"
                >
                  {TARGET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                Target Name &amp; Description <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. BIFF Staging Camp with 3 fortified bunkers and suspected mortar pit east of marshland..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-600 shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Priority Level *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-600 shadow-sm"
                >
                  {TARGET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Engagement Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-600 shadow-sm"
                >
                  {TARGET_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Tactical Addressing & MGRS */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>2. Target Location &amp; 10-Digit MGRS Grid</span>
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
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="Custom">+ Other (Write-in Province)</option>
                </select>
                {province === 'Custom' && (
                  <input
                    type="text"
                    required
                    value={customProvince}
                    onChange={(e) => setCustomProvince(e.target.value)}
                    placeholder="Enter province"
                    className="w-full mt-1.5 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
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
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                  <option value="Custom">+ Other (Write-in Municipality)</option>
                </select>
                {municipality === 'Custom' && (
                  <input
                    type="text"
                    required
                    value={customMunicipality}
                    onChange={(e) => setCustomMunicipality(e.target.value)}
                    placeholder="Enter municipality"
                    className="w-full mt-1.5 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
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
                    <option key={b} value={b}>{b}</option>
                  ))}
                  <option value="Custom">+ Other (Write-in Barangay)</option>
                </select>
                {barangay === 'Custom' && (
                  <input
                    type="text"
                    required
                    value={customBarangay}
                    onChange={(e) => setCustomBarangay(e.target.value)}
                    placeholder="Enter barangay"
                    className="w-full mt-1.5 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
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
                  placeholder="e.g. Sitio Manguda near riverbank"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  10-Digit MGRS Grid Coordinate <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mgrsInput}
                  onChange={(e) => handleMGRSChange(e.target.value)}
                  placeholder="e.g. 51NXH6659745322"
                  className={`w-full bg-white border rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none shadow-sm ${
                    mgrsValid ? 'border-slate-300 focus:border-blue-600' : 'border-rose-400 focus:border-rose-600 text-rose-700'
                  }`}
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>Lat: {lat.toFixed(5)}°, Lng: {lng.toFixed(5)}°</span>
                  <span className={mgrsValid ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
                    {mgrsValid ? '✓ Valid Grid' : '⚠ Invalid Grid'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 flex items-center justify-between">
              <div>
                <span className="font-semibold text-blue-800 uppercase tracking-wide mr-1">Generated Target Address:</span>
                <span className="font-medium text-slate-700">{calculatedAddress || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Weapon Assignment & Collateral Estimate */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase pb-2 border-b border-slate-200">
              <Shield className="w-4 h-4 text-slate-600" />
              <span>3. Assigned Weapon System &amp; Safety Estimate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Assigned Firing Battery / Unit</label>
                <input
                  type="text"
                  value={assignedBattery}
                  onChange={(e) => setAssignedBattery(e.target.value)}
                  placeholder="e.g. Alpha Battery, 6th FAB (105mm M101A1)"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Recommended Munition</label>
                <select
                  value={recommendedMunition}
                  onChange={(e) => setRecommendedMunition(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  <option value="HE Point Detonating">HE Point Detonating (Direct Impact)</option>
                  <option value="HE Variable Time / Airburst">HE Airburst (Troops in Open / Trenches)</option>
                  <option value="White Phosphorus (WP)">White Phosphorus (Screening / Incendiary)</option>
                  <option value="Illumination Flare">Illumination Flare (Night Observation)</option>
                  <option value="Laser-Guided Precision Round">Laser-Guided Precision Round (Hardened Point)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Collateral Damage Estimate (CDA)</label>
                <select
                  value={collateralEstimate}
                  onChange={(e) => setCollateralEstimate(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  <option value="Low (Open Field / Forest)">Low (Isolated Open Field / Forest / Marsh)</option>
                  <option value="Moderate (Proximity to Farmland)">Moderate (Proximity to Farmland / Trail)</option>
                  <option value="High (Near Civilians / Structures)">High (Near Civilian Population / Evacuation Corridors)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Observer &amp; Target Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Confirmed by Forward Observer Hammer-03 via thermal drone ISR"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center space-x-2"
            >
              <Target className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Target...' : initialData ? 'Update Target' : 'Save to Target Deck'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Flame, MapPin, X, Shield, AlertTriangle, Radio } from 'lucide-react';
import { PH_PROVINCES } from '@/lib/phLocationData';
import { toMGRS, parseMGRSToCoords, cleanMGRS } from '@/lib/mgrsUtils';

export interface FiresDeploymentRecord {
  id: string;
  unit_name: string;
  callsign: string;
  weapon_type:
    | '105mm M101A1 Towed Howitzer'
    | '155mm M-71 / Soltam Howitzer'
    | '120mm Heavy Mortar'
    | '81mm M29 Medium Mortar'
    | '60mm Commando Mortar'
    | 'A-29B Super Tucano CAS'
    | 'FA-50PH Golden Eagle'
    | 'T129 ATAK Attack Helicopter';
  tube_count: number;
  base_location: string;
  province: string;
  municipality: string;
  barangay: string;
  purok_sitio?: string;
  address: string;
  mgrs: string;
  lat: number;
  lng: number;
  max_range_km: number;
  min_range_km: number;
  azimuth_coverage: string;
  status: 'Ready / In-Battery' | 'Mission Active / Firing' | 'Displacing / Road March' | 'Maintenance / Standby';
  rounds_he: number;
  rounds_smoke: number;
  rounds_illum: number;
  frequency: string;
  commander: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export const WEAPON_SYSTEMS = [
  '105mm M101A1 Towed Howitzer',
  '155mm M-71 / Soltam Howitzer',
  '120mm Heavy Mortar',
  '81mm M29 Medium Mortar',
  '60mm Commando Mortar',
  'A-29B Super Tucano CAS',
  'FA-50PH Golden Eagle',
  'T129 ATAK Attack Helicopter',
] as const;

export const DEPLOYMENT_STATUSES = [
  'Ready / In-Battery',
  'Mission Active / Firing',
  'Displacing / Road March',
  'Maintenance / Standby',
] as const;

interface FiresDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deployment: FiresDeploymentRecord) => Promise<void> | void;
  initialData?: FiresDeploymentRecord | null;
}

export default function FiresDeploymentModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: FiresDeploymentModalProps) {
  const [unitName, setUnitName] = useState('');
  const [callsign, setCallsign] = useState('');
  const [commander, setCommander] = useState('');
  const [weaponType, setWeaponType] = useState<FiresDeploymentRecord['weapon_type']>('105mm M101A1 Towed Howitzer');
  const [tubeCount, setTubeCount] = useState<number>(4);
  const [baseLocation, setBaseLocation] = useState('');
  const [maxRangeKm, setMaxRangeKm] = useState<number>(11.5);
  const [minRangeKm, setMinRangeKm] = useState<number>(1.5);
  const [azimuthCoverage, setAzimuthCoverage] = useState('045° - 210° (Primary Maguindanao Sector)');
  const [status, setStatus] = useState<FiresDeploymentRecord['status']>('Ready / In-Battery');
  const [roundsHe, setRoundsHe] = useState<number>(240);
  const [roundsSmoke, setRoundsSmoke] = useState<number>(60);
  const [roundsIllum, setRoundsIllum] = useState<number>(45);
  const [frequency, setFrequency] = useState('FM 46.20 MHz (JTFC Fires Net)');
  const [remarks, setRemarks] = useState('');

  // Location Cascading
  const [province, setProvince] = useState('Maguindanao del Sur');
  const [customProvince, setCustomProvince] = useState('');
  const [municipality, setMunicipality] = useState('Shariff Aguak (Maganoy)');
  const [customMunicipality, setCustomMunicipality] = useState('');
  const [barangay, setBarangay] = useState('Poblacion');
  const [customBarangay, setCustomBarangay] = useState('');
  const [purokSitio, setPurokSitio] = useState('');

  // Coordinates
  const [mgrsInput, setMgrsInput] = useState('51NXH6389140221');
  const [lat, setLat] = useState<number>(6.8622);
  const [lng, setLng] = useState<number>(124.4419);
  const [mgrsValid, setMgrsValid] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provinceNames = useMemo(() => Object.keys(PH_PROVINCES), []);
  const municipalities = useMemo(() => {
    const prov = PH_PROVINCES[province];
    return prov ? prov.municipalities : [];
  }, [province]);
  const barangays = useMemo(() => {
    const muni = municipalities.find((m) => m.name === municipality);
    return muni ? muni.barangays : [];
  }, [municipalities, municipality]);

  const calculatedAddress = useMemo(() => {
    const finalProv = province === 'Custom' ? customProvince.trim() : province;
    const finalMuni = municipality === 'Custom' ? customMunicipality.trim() : municipality;
    const finalBrgy = barangay === 'Custom' ? customBarangay.trim() : barangay;
    return [purokSitio.trim(), finalBrgy, finalMuni, finalProv].filter(Boolean).join(', ');
  }, [purokSitio, barangay, customBarangay, municipality, customMunicipality, province, customProvince]);

  // Adjust defaults when weapon type changes
  const handleWeaponTypeChange = (wt: FiresDeploymentRecord['weapon_type']) => {
    setWeaponType(wt);
    if (wt.includes('155mm')) {
      setMaxRangeKm(24.0);
      setMinRangeKm(3.0);
    } else if (wt.includes('105mm')) {
      setMaxRangeKm(11.5);
      setMinRangeKm(1.5);
    } else if (wt.includes('120mm')) {
      setMaxRangeKm(7.2);
      setMinRangeKm(0.8);
    } else if (wt.includes('81mm')) {
      setMaxRangeKm(5.6);
      setMinRangeKm(0.3);
    } else if (wt.includes('60mm')) {
      setMaxRangeKm(3.5);
      setMinRangeKm(0.1);
    } else {
      setMaxRangeKm(150.0);
      setMinRangeKm(5.0);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setUnitName(initialData.unit_name || '');
      setCallsign(initialData.callsign || '');
      setCommander(initialData.commander || '');
      setWeaponType(initialData.weapon_type || '105mm M101A1 Towed Howitzer');
      setTubeCount(Number(initialData.tube_count) || 4);
      setBaseLocation(initialData.base_location || '');
      setMaxRangeKm(Number(initialData.max_range_km) || 11.5);
      setMinRangeKm(Number(initialData.min_range_km) || 1.5);
      setAzimuthCoverage(initialData.azimuth_coverage || '');
      setStatus(initialData.status || 'Ready / In-Battery');
      setRoundsHe(Number(initialData.rounds_he) || 0);
      setRoundsSmoke(Number(initialData.rounds_smoke) || 0);
      setRoundsIllum(Number(initialData.rounds_illum) || 0);
      setFrequency(initialData.frequency || '');
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
        setMunicipality(activeMunis[0]?.name || 'Shariff Aguak (Maganoy)');
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
      setLat(Number(initialData.lat) || 6.8622);
      setLng(Number(initialData.lng) || 124.4419);
      setMgrsValid(true);
      setError(null);
    } else {
      setUnitName('Bravo Battery, 6th Field Artillery Battalion');
      setCallsign('HAMMER-BRAVO');
      setCommander('Capt. Jonathan Perez');
      setWeaponType('105mm M101A1 Towed Howitzer');
      setTubeCount(4);
      setBaseLocation('Datu Piang Forward Artillery Firebase');
      setMaxRangeKm(11.5);
      setMinRangeKm(1.5);
      setAzimuthCoverage('060° - 240° (SPMS & Marshland Corridor)');
      setStatus('Ready / In-Battery');
      setRoundsHe(280);
      setRoundsSmoke(50);
      setRoundsIllum(40);
      setFrequency('FM 46.20 MHz (JTFC Fires Net)');
      setRemarks('Emplaced with direct line-of-sight communications to TACP and FDC');

      setProvince('Maguindanao del Sur');
      setCustomProvince('');
      setMunicipality('Datu Piang (Dulawan)');
      setCustomMunicipality('');
      setBarangay('Poblacion');
      setCustomBarangay('');
      setPurokSitio('Firebase Compound');

      const defaultCoords = [6.9536, 124.4756];
      setLat(defaultCoords[0]);
      setLng(defaultCoords[1]);
      setMgrsInput(toMGRS(defaultCoords[0], defaultCoords[1]));
      setMgrsValid(true);
      setError(null);
    }
  }, [isOpen, initialData]);

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

    if (!unitName.trim()) {
      setError('Unit Name is required.');
      return;
    }
    if (!callsign.trim()) {
      setError('Tactical Callsign is required.');
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

    const record: FiresDeploymentRecord = {
      id: initialData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `dep-${Date.now()}`),
      unit_name: unitName.trim(),
      callsign: callsign.trim().toUpperCase(),
      weapon_type: weaponType,
      tube_count: Number(tubeCount) || 1,
      base_location: baseLocation.trim() || `${finalBarangay}, ${finalMunicipality}`,
      province: finalProvince,
      municipality: finalMunicipality,
      barangay: finalBarangay,
      purok_sitio: purokSitio.trim() || undefined,
      address: calculatedAddress,
      mgrs: cleanM || toMGRS(finalLat, finalLng),
      lat: finalLat,
      lng: finalLng,
      max_range_km: Number(maxRangeKm) || 10,
      min_range_km: Number(minRangeKm) || 1,
      azimuth_coverage: azimuthCoverage.trim(),
      status,
      rounds_he: Number(roundsHe) || 0,
      rounds_smoke: Number(roundsSmoke) || 0,
      rounds_illum: Number(roundsIllum) || 0,
      frequency: frequency.trim(),
      commander: commander.trim(),
      remarks: remarks.trim() || undefined,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onSave(record);
      onClose();
    } catch (err: any) {
      console.error('Save deployment unit error:', err);
      setError(err?.message || 'Error saving deployment record.');
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
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wide">
                {initialData ? 'Edit Firing Battery Deployment' : 'Deploy Firing Battery / Unit'}
              </h2>
              <p className="text-xs font-sans text-slate-500">
                Gun line emplacement, weapon envelope &amp; ready munitions inventory
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
          {/* Section 1: Unit & Weapon System */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>1. Unit Designation &amp; Weapon System</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Unit / Battery Name <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g. Alpha Battery, 6th Field Artillery Battalion"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Tactical Callsign <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                  placeholder="e.g. HAMMER-ALPHA"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Weapon System Caliber *</label>
                <select
                  value={weaponType}
                  onChange={(e) => handleWeaponTypeChange(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm font-semibold"
                >
                  {WEAPON_SYSTEMS.map((ws) => (
                    <option key={ws} value={ws}>{ws}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Available Tubes / Guns</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={tubeCount}
                  onChange={(e) => setTubeCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Battery Commander / Officer-in-Charge</label>
                <input
                  type="text"
                  value={commander}
                  onChange={(e) => setCommander(e.target.value)}
                  placeholder="e.g. Capt. Noel Soriano (G3 Air/Fires)"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Battery Operational Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm font-semibold"
                >
                  {DEPLOYMENT_STATUSES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Firing Position & MGRS */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>2. Gun Line Base &amp; Emplacement Coordinates</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                Firebase / Tactical Position Name <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                required
                value={baseLocation}
                onChange={(e) => setBaseLocation(e.target.value)}
                placeholder="e.g. Shariff Aguak Advance Artillery Base / Hill 120 Gun Pit"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm font-semibold"
              />
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
                  Sitio / Compound Area <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={purokSitio}
                  onChange={(e) => setPurokSitio(e.target.value)}
                  placeholder="e.g. Firebase perimeter near Battalion HQ"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  10-Digit MGRS Grid Coordinate <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mgrsInput}
                  onChange={(e) => handleMGRSChange(e.target.value)}
                  placeholder="e.g. 51NXH6389140221"
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
          </div>

          {/* Section 3: Ballistic Capabilities & Ammunition */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase pb-2 border-b border-slate-200">
              <Radio className="w-4 h-4 text-slate-600" />
              <span>3. Ballistic Envelopes, Range &amp; Ready Munitions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Max Range (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={maxRangeKm}
                  onChange={(e) => setMaxRangeKm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Min Range (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={minRangeKm}
                  onChange={(e) => setMinRangeKm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Tactical Frequency / Radio Net</label>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="FM 46.20 MHz"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Azimuth Firing Coverage</label>
              <input
                type="text"
                value={azimuthCoverage}
                onChange={(e) => setAzimuthCoverage(e.target.value)}
                placeholder="e.g. 045° - 210° (Primary Maguindanao Sector) or 360° All-Around"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
              />
            </div>

            {/* Munitions on hand */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">HE Shells (High Explosive)</label>
                <input
                  type="number"
                  min={0}
                  value={roundsHe}
                  onChange={(e) => setRoundsHe(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Smoke / WP Shells</label>
                <input
                  type="number"
                  min={0}
                  value={roundsSmoke}
                  onChange={(e) => setRoundsSmoke(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Illumination Shells</label>
                <input
                  type="number"
                  min={0}
                  value={roundsIllum}
                  onChange={(e) => setRoundsIllum(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Remarks &amp; Emplacement Notes</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Registered onto Datu Piang base defensive targets DT-01 through DT-04"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
              />
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
              className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center space-x-2"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Battery...' : initialData ? 'Update Deployment' : 'Deploy Firing Unit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

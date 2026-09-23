'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, FileText, CheckCircle2, AlertTriangle, MapPin, Send, Crosshair, Sparkles } from 'lucide-react';
import { toZuluDTG, toMGRS, parseMGRSToCoords } from '@/lib/mgrsUtils';
import { PH_PROVINCES, COMMON_PUROKS } from '@/lib/phLocationData';

export type ThreatGroupType =
  | 'PIAGs'
  | 'DIHG'
  | 'PAGs'
  | 'BIFF'
  | 'CRIMINALITY'
  | 'Armed Lawless Element'
  | 'Others';

export type MotiveType =
  | 'Personal Grudge'
  | 'Land Conflict'
  | 'Rido'
  | 'Drug Related'
  | 'Robbery'
  | 'Carnapping'
  | 'Family Feud'
  | 'Undetermined';

export type DIBType = 'Violent' | 'Non-Violent';

export interface DIBRecord {
  id: string;
  dib_id: string;
  activity: string;
  details?: string;
  datetime: string;
  mgrs: string;
  threat_group: ThreatGroupType;
  threat_group_other?: string;
  personality_victim: string;
  motive: MotiveType;
  source_evaluation: string;
  type: DIBType;
  address: string;
  province: string;
  municipality: string;
  barangay: string;
  purok_sitio: string;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at?: string;
}

interface DIBModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bulletin: DIBRecord) => void;
  initialData?: DIBRecord | null;
  dutyOfficer?: string;
  callsign?: string;
}

export default function DIBModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: DIBModalProps) {
  // Form States
  const [dibId, setDibId] = useState('');
  const [activity, setActivity] = useState('');
  const [details, setDetails] = useState('');
  const [datetime, setDatetime] = useState('');
  const [mgrsInput, setMgrsInput] = useState('');
  const [threatGroup, setThreatGroup] = useState<ThreatGroupType>('BIFF');
  const [threatGroupOther, setThreatGroupOther] = useState('');
  const [personalityVictim, setPersonalityVictim] = useState('');
  const [motive, setMotive] = useState<MotiveType>('Personal Grudge');
  const [sourceEvaluation, setSourceEvaluation] = useState('A1 - Confirmed Technical ISR');
  const [typeVal, setTypeVal] = useState<DIBType>('Violent');

  // Address Cascading States
  const [province, setProvince] = useState('Maguindanao del Sur');
  const [municipality, setMunicipality] = useState('Datu Piang (Dulawan)');
  const [barangay, setBarangay] = useState('Poblacion');
  const [customBarangay, setCustomBarangay] = useState('');
  const [purokSitio, setPurokSitio] = useState('Purok 1');
  const [customPurok, setCustomPurok] = useState('');

  // Coordinates & Validation
  const [lat, setLat] = useState<number>(6.9536);
  const [lng, setLng] = useState<number>(124.4756);
  const [mgrsValid, setMgrsValid] = useState<boolean>(true);

  // Available provinces list
  const provinceNames = useMemo(() => Object.keys(PH_PROVINCES), []);

  // Available municipalities for the selected province
  const municipalities = useMemo(() => {
    const provInfo = PH_PROVINCES[province];
    return provInfo ? provInfo.municipalities : [];
  }, [province]);

  // Available barangays for the selected municipality
  const barangays = useMemo(() => {
    const found = municipalities.find((m) => m.name === municipality);
    return found ? found.barangays : [];
  }, [municipalities, municipality]);

  // Combined Address automatically produced from dropdowns
  const producedAddress = useMemo(() => {
    const activePurok = purokSitio === 'Custom' ? customPurok.trim() : purokSitio.trim();
    const activeBrgy = barangay === 'Custom' ? customBarangay.trim() : barangay.trim();
    const parts = [activePurok, activeBrgy, municipality, province].filter(Boolean);
    return parts.join(', ');
  }, [purokSitio, customPurok, barangay, customBarangay, municipality, province]);

  // Reset or initialize on modal open
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDibId(initialData.dib_id || '');
        setActivity(initialData.activity || '');
        setDetails(initialData.details || '');
        setDatetime(initialData.datetime || '');
        setMgrsInput(initialData.mgrs || '');
        setThreatGroup(initialData.threat_group || 'BIFF');
        setThreatGroupOther(initialData.threat_group_other || '');
        setPersonalityVictim(initialData.personality_victim || '');
        setMotive(initialData.motive || 'Personal Grudge');
        setSourceEvaluation(initialData.source_evaluation || 'A1 - Confirmed Technical ISR');
        setTypeVal(initialData.type || 'Violent');

        setProvince(initialData.province || 'Maguindanao del Sur');
        setMunicipality(initialData.municipality || 'Datu Piang (Dulawan)');

        if (initialData.barangay && barangays.includes(initialData.barangay)) {
          setBarangay(initialData.barangay);
          setCustomBarangay('');
        } else if (initialData.barangay) {
          setBarangay('Custom');
          setCustomBarangay(initialData.barangay);
        } else {
          setBarangay(barangays[0] || 'Poblacion');
          setCustomBarangay('');
        }

        if (initialData.purok_sitio && COMMON_PUROKS.includes(initialData.purok_sitio)) {
          setPurokSitio(initialData.purok_sitio);
          setCustomPurok('');
        } else if (initialData.purok_sitio) {
          setPurokSitio('Custom');
          setCustomPurok(initialData.purok_sitio);
        } else {
          setPurokSitio('Purok 1');
          setCustomPurok('');
        }

        setLat(initialData.lat || 6.9536);
        setLng(initialData.lng || 124.4756);
        setMgrsValid(true);
      } else {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(100 + Math.random() * 900);
        setDibId(`DIB-${dateStr}-${randomNum}`);
        setActivity('');
        setDetails('');
        setDatetime(toZuluDTG(now.toISOString()));

        // Default location: Maguindanao del Sur -> Datu Piang -> Poblacion
        const defaultProv = 'Maguindanao del Sur';
        const defaultMuni = 'Datu Piang (Dulawan)';
        const defaultMuniInfo = PH_PROVINCES[defaultProv]?.municipalities.find((m) => m.name === defaultMuni);
        const defaultCoords = defaultMuniInfo ? defaultMuniInfo.coords : [6.9536, 124.4756];
        const defaultMGRS = toMGRS(defaultCoords[0], defaultCoords[1]);

        setProvince(defaultProv);
        setMunicipality(defaultMuni);
        setBarangay('Poblacion');
        setCustomBarangay('');
        setPurokSitio('Purok 1');
        setCustomPurok('');

        setLat(defaultCoords[0]);
        setLng(defaultCoords[1]);
        setMgrsInput(defaultMGRS);
        setMgrsValid(true);

        setThreatGroup('BIFF');
        setThreatGroupOther('');
        setPersonalityVictim('');
        setMotive('Personal Grudge');
        setSourceEvaluation('A1 - Confirmed Technical ISR');
        setTypeVal('Violent');
      }
    }
  }, [isOpen, initialData]);

  // When province changes, update municipality and coordinates
  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const provInfo = PH_PROVINCES[newProv];
    if (provInfo && provInfo.municipalities.length > 0) {
      const firstMuni = provInfo.municipalities[0];
      setMunicipality(firstMuni.name);
      setBarangay(firstMuni.barangays[0] || 'Poblacion');
      setCustomBarangay('');
      setLat(firstMuni.coords[0]);
      setLng(firstMuni.coords[1]);
      const newMGRS = toMGRS(firstMuni.coords[0], firstMuni.coords[1]);
      setMgrsInput(newMGRS);
      setMgrsValid(true);
    }
  };

  // When municipality changes, update barangay and coordinates
  const handleMunicipalityChange = (newMuni: string) => {
    setMunicipality(newMuni);
    const found = municipalities.find((m) => m.name === newMuni);
    if (found) {
      setBarangay(found.barangays[0] || 'Poblacion');
      setCustomBarangay('');
      setLat(found.coords[0]);
      setLng(found.coords[1]);
      const newMGRS = toMGRS(found.coords[0], found.coords[1]);
      setMgrsInput(newMGRS);
      setMgrsValid(true);
    }
  };

  // MGRS input handler
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalLat = lat;
    let finalLng = lng;
    let finalMgrs = mgrsInput.trim().toUpperCase();

    if (finalMgrs) {
      const parsed = parseMGRSToCoords(finalMgrs);
      if (parsed) {
        finalLat = parsed[0];
        finalLng = parsed[1];
      }
    } else if (finalLat && finalLng) {
      finalMgrs = toMGRS(finalLat, finalLng);
    }

    const finalBarangay = barangay === 'Custom' ? customBarangay.trim() || 'Barangay' : barangay;
    const finalPurok = purokSitio === 'Custom' ? customPurok.trim() || 'Purok' : purokSitio;

    const record: DIBRecord = {
      id: initialData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `dib-${Date.now()}`),
      dib_id: dibId.trim() || `DIB-${Date.now()}`,
      activity: activity.trim() || 'Unspecified intelligence activity',
      details: details.trim(),
      datetime: datetime.trim() || toZuluDTG(),
      mgrs: finalMgrs,
      threat_group: threatGroup,
      threat_group_other: threatGroup === 'Others' ? threatGroupOther.trim() : undefined,
      personality_victim: personalityVictim.trim() || 'N/A',
      motive,
      source_evaluation: sourceEvaluation.trim(),
      type: typeVal,
      address: producedAddress,
      province,
      municipality,
      barangay: finalBarangay,
      purok_sitio: finalPurok,
      lat: finalLat,
      lng: finalLng,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-800 max-w-3xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wide">
                {initialData ? 'Edit Daily Intelligence Bulletin (DIB)' : 'Generate Daily Intelligence Bulletin (DIB)'}
              </h2>
              <p className="text-[11px] font-sans text-blue-600/80">
                G2 Intelligence Cell // Automated Supabase Ingestion & Tactical Record
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
          {/* Top Row: DIB ID, Date & Time, Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">DIB ID *</label>
              <input
                type="text"
                value={dibId}
                onChange={(e) => setDibId(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-blue-600 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Date & Time *</label>
              <input
                type="text"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                placeholder="e.g. 161800Z SEP 26"
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Type *</label>
              <select
                value={typeVal}
                onChange={(e) => setTypeVal(e.target.value as DIBType)}
                className={`w-full bg-slate-50 border rounded px-2.5 py-1.5 font-bold focus:outline-none focus:border-cyan-500 ${
                  typeVal === 'Violent'
                    ? 'text-blue-600 border-rose-700/60'
                    : 'text-emerald-400 border-emerald-700/60'
                }`}
              >
                <option value="Violent">Violent</option>
                <option value="Non-Violent">Non-Violent</option>
              </select>
            </div>
          </div>

          {/* Activity & Details Input (Side-by-side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">
                Activity *
              </label>
              <textarea
                rows={3}
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="e.g., Harassment, Extortion, Ambush, IED Sighting, Mass Assembly..."
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded p-2.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">
                Details
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Specific operational narrative, weapons observed, casualties, damages, withdrawal direction..."
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded p-2.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Threat Groups & Personality Involved / Victim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Threat Group *</label>
              <select
                value={threatGroup}
                onChange={(e) => setThreatGroup(e.target.value as ThreatGroupType)}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-cyan-500"
              >
                <option value="PIAGs">PIAGs (Private/Potential Illegal Armed Groups)</option>
                <option value="DIHG">DIHG (Dawlah Islamiyah Hostile Group)</option>
                <option value="PAGs">PAGs (Private Armed Groups)</option>
                <option value="BIFF">BIFF (Bangsamoro Islamic Freedom Fighters)</option>
                <option value="CRIMINALITY">CRIMINALITY</option>
                <option value="Armed Lawless Element">Armed Lawless Element</option>
                <option value="Others">Others</option>
              </select>
              {threatGroup === 'Others' && (
                <input
                  type="text"
                  value={threatGroupOther}
                  onChange={(e) => setThreatGroupOther(e.target.value)}
                  placeholder="Specify other threat element"
                  required
                  className="w-full mt-2 bg-slate-50 border border-cyan-700/60 rounded px-2.5 py-1.5 text-slate-800"
                />
              )}
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">
                Personality Involved or Victim *
              </label>
              <input
                type="text"
                value={personalityVictim}
                onChange={(e) => setPersonalityVictim(e.target.value)}
                placeholder="e.g., Kumander Karialan / Brgy. Kagawad Pedro Cruz (Victim)"
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Motive & Source/Evaluation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Motive *</label>
              <select
                value={motive}
                onChange={(e) => setMotive(e.target.value as MotiveType)}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="Personal Grudge">Personal Grudge</option>
                <option value="Land Conflict">Land Conflict</option>
                <option value="Rido">Rido (Clan Conflict)</option>
                <option value="Drug Related">Drug Related</option>
                <option value="Robbery">Robbery</option>
                <option value="Carnapping">Carnapping</option>
                <option value="Family Feud">Family Feud</option>
                <option value="Undetermined">Undetermined</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Source / Evaluation *</label>
              <input
                type="text"
                value={sourceEvaluation}
                onChange={(e) => setSourceEvaluation(e.target.value)}
                placeholder="e.g. A1 - Confirmed Technical ISR / B2 - Informant"
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* ── AUTOMATED ADDRESS CASCADE (PROVINCE, MUNICIPALITY, BARANGAY, PUROK/SITIO) ── */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-cyan-800/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-[11px] font-bold text-blue-600 uppercase flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Address Generator (Dropdown Cascade)
              </span>
              <span className="text-[10px] text-slate-500">Auto-derives Full Address & MGRS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Province */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Province *</label>
                <select
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500 text-[11px]"
                >
                  {provinceNames.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Municipality */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Municipality *</label>
                <select
                  value={municipality}
                  onChange={(e) => handleMunicipalityChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500 text-[11px]"
                >
                  {municipalities.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Barangay */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Barangay *</label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500 text-[11px]"
                >
                  {barangays.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Custom">Custom / Other</option>
                </select>
                {barangay === 'Custom' && (
                  <input
                    type="text"
                    value={customBarangay}
                    onChange={(e) => setCustomBarangay(e.target.value)}
                    placeholder="Type barangay name"
                    className="w-full mt-1.5 bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 text-slate-800 text-[11px]"
                  />
                )}
              </div>

              {/* Purok / Sitio */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Purok / Sitio</label>
                <select
                  value={purokSitio}
                  onChange={(e) => setPurokSitio(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500 text-[11px]"
                >
                  {COMMON_PUROKS.map((pk) => (
                    <option key={pk} value={pk}>
                      {pk}
                    </option>
                  ))}
                  <option value="Custom">Custom / Other</option>
                </select>
                {purokSitio === 'Custom' && (
                  <input
                    type="text"
                    value={customPurok}
                    onChange={(e) => setCustomPurok(e.target.value)}
                    placeholder="Type Purok or Sitio"
                    className="w-full mt-1.5 bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1 text-slate-800 text-[11px]"
                  />
                )}
              </div>
            </div>

            {/* Automatically Produced Address Preview */}
            <div className="p-2.5 rounded-lg bg-white/90 border border-slate-300 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase">
                  Automatically Produced Address:
                </div>
                <div className="text-xs font-bold text-cyan-300 mt-0.5">{producedAddress}</div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-blue-600 border border-cyan-800 shrink-0">
                PRODUCED
              </span>
            </div>
          </div>

          {/* MGRS Coordinate Box */}
          <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center space-x-1">
                <Crosshair className="w-3 h-3 text-blue-600" />
                <span>10-Digit MGRS Coordinate *</span>
              </label>
              {mgrsValid ? (
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> VALID
                </span>
              ) : (
                <span className="text-[9px] text-blue-600 font-bold flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" /> CHECK FORMAT
                </span>
              )}
            </div>
            <input
              type="text"
              value={mgrsInput}
              onChange={(e) => handleMGRSChange(e.target.value)}
              placeholder="e.g., 51PTS12345678"
              required
              className="w-full bg-white border border-cyan-700/60 rounded px-2.5 py-1.5 text-blue-600 font-sans font-bold focus:outline-none focus:border-cyan-400"
            />
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
              <span>Lat: {lat.toFixed(5)}</span>
              <span>Lng: {lng.toFixed(5)}</span>
              <span className="text-blue-600/80">Auto-synced with Philippine GIS Grid</span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold font-bold transition-colors shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{initialData ? 'Update & Save to Supabase' : 'Save to Supabase & Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

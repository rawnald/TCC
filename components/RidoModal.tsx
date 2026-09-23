'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  Users,
  MapPin,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  Building2,
  Scale,
  Sparkles,
  Save,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { RidoRecord, RidoStatus } from '@/types/cmo';
import { toMGRS, parseMGRSToCoords, cleanMGRS } from '@/lib/mgrsUtils';
import { PH_PROVINCES } from '@/lib/phLocationData';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface RidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: RidoRecord) => Promise<void> | void;
  initialData?: RidoRecord | null;
}

const ROOT_CAUSES = [
  'Land Dispute & Boundary Conflict',
  'Political Rivalry & Election Feud',
  'Accidental Shooting / Murder & Retaliation',
  'Family Honor, Marital & Domestic Feud',
  'Livestock, Property Theft & Robbery',
  'Drug-Related & Illicit Enterprise Conflict',
  'Territory / Influence Dominance',
  'Others (Specify Custom Cause)',
];

const RIDO_STATUS_LIST: { value: RidoStatus; label: string; desc: string }[] = [
  { value: 'Active', label: 'Active / Escalated', desc: 'Active armed clashes or immediate threat of violence' },
  { value: 'High Tension', label: 'High Tension', desc: 'Volatile situation, combatants mobilized on stand-off' },
  { value: 'Under Mediation', label: 'Under Mediation', desc: 'Ceasefire observed while negotiations / dialogues are ongoing' },
  { value: 'Settled / Reconciled', label: 'Settled / Reconciled', desc: 'Formal peace pact (Kasunduan) executed & concluded' },
  { value: 'Dormant', label: 'Dormant / Cold', desc: 'Inactive for extended period without formal settlement' },
];

const MEDIATING_AGENCIES = [
  '601st Infantry Brigade (6ID, PA)',
  '602nd Infantry Brigade (6ID, PA)',
  '603rd Infantry Brigade (6ID, PA)',
  'Joint Task Force Central (JTFC)',
  'Municipal Peace and Order Council (MPOC)',
  'Provincial Peace and Order Council (PPOC)',
  'Council of Elders / Traditional Leaders (Ulama)',
  'MILF Coordinating Committee on Cessation of Hostilities (CCCH)',
  'Philippine National Police (PNP Provincial Command)',
  'LGU Mayor / Barangay Conflict Resolution Committee',
  'Joint AFP-PNP-LGU Inter-Agency Task Group',
  'Others / Community Neutral Mediators',
];

const DEFAULT_PIAG_AFFILIATIONS = [
  'Independent / No Affiliation',
  'MILF — 105th Base Command',
  'MILF — 118th Base Command',
  'MILF — 106th Base Command',
  'MNLF — Lupah Sug Force',
  'MNLF — Paglas Defense Contingent',
  'MNLF — Central Committee Elements',
  'BIFF — Karialan Faction',
  'BIFF — Bungos Faction',
  'PAG — Municipal Executive Security Element',
  'Others (Write-in)',
];

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

export default function RidoModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: RidoModalProps) {
  // ── Form States ────────────────────────────────────────────────────────────
  const [caseCode, setCaseCode] = useState('');

  // 2-Column: Party A
  const [partyA, setPartyA] = useState('');
  const [partyAPersonalities, setPartyAPersonalities] = useState('');
  const [partyAAffiliationDropdown, setPartyAAffiliationDropdown] = useState('Independent / No Affiliation');
  const [partyAAffiliationCustom, setPartyAAffiliationCustom] = useState('');
  const [partyAMgrs, setPartyAMgrs] = useState('');

  // 2-Column: Party B
  const [partyB, setPartyB] = useState('');
  const [partyBPersonalities, setPartyBPersonalities] = useState('');
  const [partyBAffiliationDropdown, setPartyBAffiliationDropdown] = useState('Independent / No Affiliation');
  const [partyBAffiliationCustom, setPartyBAffiliationCustom] = useState('');
  const [partyBMgrs, setPartyBMgrs] = useState('');

  // Conflict Scene Location Cascading States
  const [province, setProvince] = useState('Maguindanao del Sur');
  const [municipality, setMunicipality] = useState('Datu Piang (Dulawan)');
  const [barangay, setBarangay] = useState('Poblacion');
  const [customBarangay, setCustomBarangay] = useState('');
  const [purokSitio, setPurokSitio] = useState('');
  const [mgrsInput, setMgrsInput] = useState('51NXH6659745322');
  const [lat, setLat] = useState<number>(6.9536);
  const [lng, setLng] = useState<number>(124.4756);
  const [mgrsValid, setMgrsValid] = useState<boolean>(true);

  // Cause & Status
  const [rootCause, setRootCause] = useState(ROOT_CAUSES[0]);
  const [rootCauseOther, setRootCauseOther] = useState('');
  const [status, setStatus] = useState<RidoStatus>('Active');

  // Mediation & Casualties
  const [mediatingAgency, setMediatingAgency] = useState(MEDIATING_AGENCIES[0]);
  const [leadMediator, setLeadMediator] = useState('');
  const [fatalitiesCount, setFatalitiesCount] = useState<number>(0);
  const [woundedCount, setWoundedCount] = useState<number>(0);
  const [displacedFamilies, setDisplacedFamilies] = useState<number>(0);
  const [narrativeHistory, setNarrativeHistory] = useState('');
  const [settlementTerms, setSettlementTerms] = useState('');

  // Dynamic Supabase PIAG Options
  const [piagOptions, setPiagOptions] = useState<string[]>(DEFAULT_PIAG_AFFILIATIONS);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available provinces list
  const provinceNames = useMemo(() => Object.keys(PH_PROVINCES), []);

  // Available municipalities for selected province
  const municipalities = useMemo(() => {
    const prov = PH_PROVINCES[province];
    return prov ? prov.municipalities : [];
  }, [province]);

  // Available barangays for selected municipality
  const barangays = useMemo(() => {
    const muni = municipalities.find((m) => m.name === municipality);
    return muni ? muni.barangays : [];
  }, [municipalities, municipality]);

  // Auto-calculated full address
  const fullAddress = useMemo(() => {
    const parts = [
      purokSitio.trim(),
      barangay === 'Custom' ? customBarangay.trim() : barangay,
      municipality,
      province,
    ].filter(Boolean);
    return parts.join(', ');
  }, [purokSitio, barangay, customBarangay, municipality, province]);

  // Fetch PIAGs from Supabase cmo_piags table for dropdown
  useEffect(() => {
    if (!isOpen) return;

    const fetchPiagsForDropdown = async () => {
      try {
        let fetchedNames: string[] = [];

        if (isSupabaseConfigured() && supabase) {
          const { data, error: sbErr } = await supabase
            .from('cmo_piags')
            .select('group_name')
            .order('group_name', { ascending: true });

          if (data && !sbErr && data.length > 0) {
            fetchedNames = data
              .map((d: any) => d.group_name)
              .filter((n: string) => Boolean(n && n.trim()));
          }
        }

        // Merge with local storage cache if available
        try {
          const localPiags = localStorage.getItem('cmo_piags_records');
          if (localPiags) {
            const parsed = JSON.parse(localPiags);
            if (Array.isArray(parsed)) {
              for (const p of parsed) {
                if (p.group_name && !fetchedNames.includes(p.group_name)) {
                  fetchedNames.push(p.group_name);
                }
              }
            }
          }
        } catch {}

        // Combine with defaults ensuring no duplicates
        const mergedSet = new Set<string>([
          'Independent / No Affiliation',
          ...fetchedNames,
          ...DEFAULT_PIAG_AFFILIATIONS.filter((d) => d !== 'Others (Write-in)'),
        ]);

        const combinedList = Array.from(mergedSet);
        combinedList.push('Others (Write-in)');
        setPiagOptions(combinedList);
      } catch (err) {
        console.warn('Error fetching PIAG affiliations for dropdown:', err);
      }
    };

    fetchPiagsForDropdown();
  }, [isOpen]);

  // Load initial data or reset
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setCaseCode(initialData.case_code || '');

      // Party A
      setPartyA(initialData.party_a || '');
      setPartyAPersonalities(initialData.party_a_personalities || '');
      const rawAffA = initialData.party_a_affiliation || '';
      if (rawAffA) {
        if (DEFAULT_PIAG_AFFILIATIONS.includes(rawAffA)) {
          setPartyAAffiliationDropdown(rawAffA);
          setPartyAAffiliationCustom('');
        } else {
          setPartyAAffiliationDropdown('Others (Write-in)');
          setPartyAAffiliationCustom(rawAffA);
        }
      } else {
        setPartyAAffiliationDropdown('Independent / No Affiliation');
        setPartyAAffiliationCustom('');
      }
      setPartyAMgrs(initialData.party_a_mgrs || initialData.mgrs || '');

      // Party B
      setPartyB(initialData.party_b || '');
      setPartyBPersonalities(initialData.party_b_personalities || '');
      const rawAffB = initialData.party_b_affiliation || '';
      if (rawAffB) {
        if (DEFAULT_PIAG_AFFILIATIONS.includes(rawAffB)) {
          setPartyBAffiliationDropdown(rawAffB);
          setPartyBAffiliationCustom('');
        } else {
          setPartyBAffiliationDropdown('Others (Write-in)');
          setPartyBAffiliationCustom(rawAffB);
        }
      } else {
        setPartyBAffiliationDropdown('Independent / No Affiliation');
        setPartyBAffiliationCustom('');
      }
      setPartyBMgrs(initialData.party_b_mgrs || '');

      // Scene Location
      setProvince(initialData.province || 'Maguindanao del Sur');
      setMunicipality(initialData.municipality || 'Datu Piang (Dulawan)');
      setBarangay(initialData.barangay || 'Poblacion');
      setPurokSitio(initialData.purok_sitio || '');
      setMgrsInput(initialData.mgrs || '');
      setLat(Number(initialData.lat) || 6.9536);
      setLng(Number(initialData.lng) || 124.4756);

      // Root Cause & Status
      setRootCause(initialData.root_cause || ROOT_CAUSES[0]);
      setRootCauseOther(initialData.root_cause_other || '');
      setStatus(initialData.status || 'Active');

      // Mediation & Casualties
      setMediatingAgency(initialData.mediating_agency || MEDIATING_AGENCIES[0]);
      setLeadMediator(initialData.lead_mediator || '');
      setFatalitiesCount(Number(initialData.fatalities_count) || 0);
      setWoundedCount(Number(initialData.wounded_count) || 0);
      setDisplacedFamilies(Number(initialData.displaced_families) || 0);
      setNarrativeHistory(initialData.narrative_history || '');
      setSettlementTerms(initialData.settlement_terms || '');
      setMgrsValid(true);
      setError(null);
    } else {
      const codeRandom = `RIDO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setCaseCode(codeRandom);

      // Party A
      setPartyA('');
      setPartyAPersonalities('');
      setPartyAAffiliationDropdown('Independent / No Affiliation');
      setPartyAAffiliationCustom('');
      setPartyAMgrs('51NXH6659745322');

      // Party B
      setPartyB('');
      setPartyBPersonalities('');
      setPartyBAffiliationDropdown('Independent / No Affiliation');
      setPartyBAffiliationCustom('');
      setPartyBMgrs('51NXH6771379711');

      // Location
      setProvince('Maguindanao del Sur');
      setMunicipality('Datu Piang (Dulawan)');
      setBarangay('Poblacion');
      setCustomBarangay('');
      setPurokSitio('');
      const defaultCoords = PH_PROVINCES['Maguindanao del Sur']?.municipalities[1]?.coords || [6.9536, 124.4756];
      setLat(defaultCoords[0]);
      setLng(defaultCoords[1]);
      setMgrsInput(toMGRS(defaultCoords[0], defaultCoords[1]));

      // Root Cause & Status
      setRootCause(ROOT_CAUSES[0]);
      setRootCauseOther('');
      setStatus('Active');

      // Mediation
      setMediatingAgency(MEDIATING_AGENCIES[0]);
      setLeadMediator('');
      setFatalitiesCount(0);
      setWoundedCount(0);
      setDisplacedFamilies(0);
      setNarrativeHistory('');
      setSettlementTerms('');
      setMgrsValid(true);
      setError(null);
    }
  }, [isOpen, initialData]);

  // Province change handler
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

  // Municipality change handler
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!partyA.trim() || !partyB.trim()) {
      setError('Both Feuding Parties (Party A Clan and Party B Clan) are required.');
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

    // Determine final affiliations
    const finalAffA =
      partyAAffiliationDropdown === 'Others (Write-in)'
        ? partyAAffiliationCustom.trim() || 'Custom Group'
        : partyAAffiliationDropdown;

    const finalAffB =
      partyBAffiliationDropdown === 'Others (Write-in)'
        ? partyBAffiliationCustom.trim() || 'Custom Group'
        : partyBAffiliationDropdown;

    // Determine coords for Party A and Party B MGRS
    let partyALat: number | undefined = undefined;
    let partyALng: number | undefined = undefined;
    const cleanMA = cleanMGRS(partyAMgrs);
    if (cleanMA) {
      const pA = parseMGRSToCoords(cleanMA);
      if (pA) {
        partyALat = pA[0];
        partyALng = pA[1];
      }
    }

    let partyBLat: number | undefined = undefined;
    let partyBLng: number | undefined = undefined;
    const cleanMB = cleanMGRS(partyBMgrs);
    if (cleanMB) {
      const pB = parseMGRSToCoords(cleanMB);
      if (pB) {
        partyBLat = pB[0];
        partyBLng = pB[1];
      }
    }

    const finalBarangay = barangay === 'Custom' ? customBarangay.trim() || 'Barangay' : barangay;
    const feudingPartiesSummary = `${partyA.trim()} vs. ${partyB.trim()}`;

    // Compile comprehensive personalities overview
    const compiledPersonalities = [
      partyAPersonalities.trim() ? `Party A (${partyA.trim()}): ${partyAPersonalities.trim()}` : null,
      partyBPersonalities.trim() ? `Party B (${partyB.trim()}): ${partyBPersonalities.trim()}` : null,
    ]
      .filter(Boolean)
      .join(' | ') || `${partyA.trim()} and ${partyB.trim()} Key Personnel`;

    const ridoRecord: RidoRecord = {
      id: initialData?.id || generateUUID(),
      case_code: caseCode.trim() || `RIDO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      feuding_parties: feudingPartiesSummary,
      party_a: partyA.trim(),
      party_a_personalities: partyAPersonalities.trim() || undefined,
      party_a_affiliation: finalAffA,
      party_a_mgrs: cleanMA || undefined,
      party_a_lat: partyALat,
      party_a_lng: partyALng,

      party_b: partyB.trim(),
      party_b_personalities: partyBPersonalities.trim() || undefined,
      party_b_affiliation: finalAffB,
      party_b_mgrs: cleanMB || undefined,
      party_b_lat: partyBLat,
      party_b_lng: partyBLng,

      personalities_involved: compiledPersonalities,
      province,
      municipality,
      barangay: finalBarangay,
      purok_sitio: purokSitio.trim() || undefined,
      address: fullAddress,
      mgrs: cleanM || toMGRS(finalLat, finalLng),
      lat: finalLat,
      lng: finalLng,
      root_cause: rootCause === 'Others (Specify Custom Cause)' ? (rootCauseOther.trim() || 'Others') : rootCause,
      root_cause_other: rootCause === 'Others (Specify Custom Cause)' ? rootCauseOther.trim() : undefined,
      status,
      mediating_agency: mediatingAgency,
      lead_mediator: leadMediator.trim() || undefined,
      fatalities_count: Number(fatalitiesCount) || 0,
      wounded_count: Number(woundedCount) || 0,
      displaced_families: Number(displacedFamilies) || 0,
      narrative_history: narrativeHistory.trim() || undefined,
      settlement_terms: settlementTerms.trim() || undefined,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      // 1. Direct Save to public.cmo_rido table in Supabase
      if (isSupabaseConfigured() && supabase) {
        try {
          const { error: sbErr } = await supabase.from('cmo_rido').upsert([ridoRecord]);
          if (sbErr) {
            console.warn('Direct cmo_rido upsert in modal notice:', sbErr.message);
          }
        } catch (dbErr) {
          console.warn('cmo_rido write notice:', dbErr);
        }
      }

      // 2. Bubble up to parent workspace handler (triggers local state & mirror updates)
      await onSave(ridoRecord);
      onClose();
    } catch (err: any) {
      console.error('Save Rido Exception:', err);
      setError(err?.message || 'Error saving Rido record to Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-800">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wider">
                  {initialData ? 'Edit Rido Personality & Location' : 'Add Rido Personality & Location'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  CMO G7 // 2-COLUMN CLAN TRACKER
                </span>
              </div>
              <p className="text-xs font-sans text-slate-500 mt-0.5">
                Two-Column Feuding Clan Matrix, PIAG Affiliations, and MGRS Tactical Coordinates (Auto-saved to Supabase)
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

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
          {/* Case Code & General Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-200">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                Case Tracking Code:
              </span>
              <input
                type="text"
                required
                value={caseCode}
                onChange={(e) => setCaseCode(e.target.value)}
                className="bg-white border border-blue-300 rounded px-2.5 py-1 text-xs font-bold text-blue-700 w-44 focus:outline-none focus:border-blue-600 shadow-sm"
              />
            </div>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Feud Identification: <strong>{partyA || 'Clan A'}</strong> vs. <strong>{partyB || 'Clan B'}</strong>
            </span>
          </div>

          {/* ── SECTION 1: TWO-COLUMN FEUDING CLANS MATRIX ── */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase">
              <Users className="w-4 h-4 text-blue-600" />
              <span>1. Feuding Clans (Two-Column Matrix)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ── COLUMN 1: PARTY A (FAMILY CLAN A) ── */}
              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-3 relative">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-blue-700 text-xs uppercase flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>Party A (Family Clan A)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    CLAN 1
                  </span>
                </div>

                {/* Clan / Family Name */}
                <div>
                  <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                    Party A (Family Clan A) Name <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={partyA}
                    onChange={(e) => setPartyA(e.target.value)}
                    placeholder="e.g. Sula Family / Datu Odin Clan"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>

                {/* Key Personalities Involved */}
                <div>
                  <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                    Key Personalities Involved (Party A)
                  </label>
                  <textarea
                    rows={2}
                    value={partyAPersonalities}
                    onChange={(e) => setPartyAPersonalities(e.target.value)}
                    placeholder="e.g. Datu Norodin Sula (Clan Patriarch), Mike Sula (Armed enforcer), Kagawad Teng Sula..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>

                {/* Affiliation / Associate Dropdown (Fetched from Supabase CMO Piags) */}
                <div>
                  <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                    Affiliation / Associate (Fetched from CMO PIAGs)
                  </label>
                  <select
                    value={partyAAffiliationDropdown}
                    onChange={(e) => setPartyAAffiliationDropdown(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 shadow-sm"
                  >
                    {piagOptions.map((opt) => (
                      <option key={`a-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  {/* Input Others if not in the dropdown */}
                  {partyAAffiliationDropdown === 'Others (Write-in)' && (
                    <input
                      type="text"
                      required
                      placeholder="Specify custom affiliation / armed group..."
                      value={partyAAffiliationCustom}
                      onChange={(e) => setPartyAAffiliationCustom(e.target.value)}
                      className="w-full bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 mt-2 focus:outline-none focus:border-blue-600"
                    />
                  )}
                </div>

                {/* MGRS for Party A Staging / Compound Location */}
                <div>
                  <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                    MGRS for Party A Base / Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={partyAMgrs}
                      onChange={(e) => setPartyAMgrs(e.target.value.toUpperCase())}
                      placeholder="e.g. 51NXH6659745322"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-600 shadow-sm"
                    />
                    <Compass className="w-3.5 h-3.5 text-blue-500 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* ── COLUMN 2: PARTY B (FAMILY CLAN B) ── */}
              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-3 relative">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 text-xs uppercase flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span>Party B (Family Clan B)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    CLAN 2
                  </span>
                </div>

                {/* Clan / Family Name */}
                <div>
                  <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                    Party B (Family Clan B) Name <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={partyB}
                    onChange={(e) => setPartyB(e.target.value)}
                    placeholder="e.g. Pendatun Clan / Commander Falcon Elements"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>

                {/* Key Personalities Involved */}
                <div>
                  <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                    Key Personalities Involved (Party B)
                  </label>
                  <textarea
                    rows={2}
                    value={partyBPersonalities}
                    onChange={(e) => setPartyBPersonalities(e.target.value)}
                    placeholder="e.g. Kumander Abdul Pendatun, Barok Karim (Sub-leader), Nasser Pendatun..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>

                {/* Affiliation / Associate Dropdown (Fetched from Supabase CMO Piags) */}
                <div>
                  <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                    Affiliation / Associate (Fetched from CMO PIAGs)
                  </label>
                  <select
                    value={partyBAffiliationDropdown}
                    onChange={(e) => setPartyBAffiliationDropdown(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 shadow-sm"
                  >
                    {piagOptions.map((opt) => (
                      <option key={`b-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  {/* Input Others if not in the dropdown */}
                  {partyBAffiliationDropdown === 'Others (Write-in)' && (
                    <input
                      type="text"
                      required
                      placeholder="Specify custom affiliation / armed group..."
                      value={partyBAffiliationCustom}
                      onChange={(e) => setPartyBAffiliationCustom(e.target.value)}
                      className="w-full bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 mt-2 focus:outline-none focus:border-blue-600"
                    />
                  )}
                </div>

                {/* MGRS for Party B Staging / Compound Location */}
                <div>
                  <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                    MGRS for Party B Base / Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={partyBMgrs}
                      onChange={(e) => setPartyBMgrs(e.target.value.toUpperCase())}
                      placeholder="e.g. 51NXH6771379711"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-xs font-mono font-bold text-rose-700 focus:outline-none focus:border-blue-600 shadow-sm"
                    />
                    <Compass className="w-3.5 h-3.5 text-rose-500 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: CLASH SCENE LOCATION & MGRS COORDINATES ── */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>2. Conflict Scene Location &amp; Primary MGRS Grid</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Province */}
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Province <span className="text-blue-600">*</span>
                </label>
                <select
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium shadow-sm"
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
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Municipality / City <span className="text-blue-600">*</span>
                </label>
                <select
                  value={municipality}
                  onChange={(e) => handleMunicipalityChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium shadow-sm"
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
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Barangay <span className="text-blue-600">*</span>
                </label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium shadow-sm"
                >
                  {barangays.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Custom">+ Write-in Custom Barangay</option>
                </select>
                {barangay === 'Custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom barangay..."
                    value={customBarangay}
                    onChange={(e) => setCustomBarangay(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 mt-2 focus:outline-none focus:border-blue-600"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Sitio / Purok */}
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Sitio / Purok / Specific Landmark
                </label>
                <input
                  type="text"
                  value={purokSitio}
                  onChange={(e) => setPurokSitio(e.target.value)}
                  placeholder="e.g. Sitio Sambulawan, Purok 3 near Marshland Perimeter"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              {/* 10-Digit MGRS for Conflict Scene */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-700 font-semibold">
                    Primary Clash Scene MGRS Grid Ref <span className="text-blue-600">*</span>
                  </label>
                  <span className={`text-[10px] font-semibold ${mgrsValid ? 'text-blue-600' : 'text-rose-600'}`}>
                    {mgrsValid ? 'Valid MGRS Grid' : 'Invalid Format'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={mgrsInput}
                    onChange={(e) => handleMGRSChange(e.target.value)}
                    placeholder="51NXH6659745322"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 pr-9 text-xs font-bold text-blue-700 tracking-wider focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                  <Compass className="w-4 h-4 text-blue-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Address summary banner */}
            <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-200 flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center space-x-2 truncate">
                <span className="font-bold text-blue-700 shrink-0">Derived Conflict Address:</span>
                <span className="truncate">{fullAddress || 'No address specified'}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium shrink-0 ml-2">
                Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* ── SECTION 3: ROOT CAUSE & CURRENT STATUS DROPDOWNS ── */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <span>3. Root Cause &amp; Current Status of Rido</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Root Cause Dropdown */}
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Root Cause / Conflict Trigger <span className="text-blue-600">*</span>
                </label>
                <select
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium shadow-sm"
                >
                  {ROOT_CAUSES.map((rc) => (
                    <option key={rc} value={rc}>
                      {rc}
                    </option>
                  ))}
                </select>
                {rootCause === 'Others (Specify Custom Cause)' && (
                  <input
                    type="text"
                    required
                    placeholder="Specify other root cause..."
                    value={rootCauseOther}
                    onChange={(e) => setRootCauseOther(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 mt-2 focus:outline-none focus:border-blue-600"
                  />
                )}
              </div>

              {/* Status Dropdown */}
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Current Status of Rido Dropdown <span className="text-blue-600">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RidoStatus)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  {RIDO_STATUS_LIST.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label} — {st.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Casualties & Impact Counters */}
            <div className="pt-2">
              <label className="text-[11px] text-slate-700 block mb-2 font-semibold">
                Casualties &amp; Displacement Impact
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Fatalities (KIA)</span>
                  <input
                    type="number"
                    min="0"
                    value={fatalitiesCount}
                    onChange={(e) => setFatalitiesCount(parseInt(e.target.value) || 0)}
                    className="w-full text-base font-bold text-slate-900 border-b border-slate-300 focus:outline-none focus:border-blue-600 pt-1"
                  />
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Wounded (WIA)</span>
                  <input
                    type="number"
                    min="0"
                    value={woundedCount}
                    onChange={(e) => setWoundedCount(parseInt(e.target.value) || 0)}
                    className="w-full text-base font-bold text-slate-900 border-b border-slate-300 focus:outline-none focus:border-blue-600 pt-1"
                  />
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Displaced Families (IDPs)</span>
                  <input
                    type="number"
                    min="0"
                    value={displacedFamilies}
                    onChange={(e) => setDisplacedFamilies(parseInt(e.target.value) || 0)}
                    className="w-full text-base font-bold text-slate-900 border-b border-slate-300 focus:outline-none focus:border-blue-600 pt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: NARRATIVE HISTORY & SETTLEMENT TERMS ── */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>4. Narrative History, Settlement Terms &amp; Mediation Progress</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Lead Mediating Agency / Force Unit <span className="text-blue-600">*</span>
                </label>
                <select
                  value={mediatingAgency}
                  onChange={(e) => setMediatingAgency(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium shadow-sm"
                >
                  {MEDIATING_AGENCIES.map((ma) => (
                    <option key={ma} value={ma}>
                      {ma}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Lead Mediator / Point of Contact
                </label>
                <input
                  type="text"
                  value={leadMediator}
                  onChange={(e) => setLeadMediator(e.target.value)}
                  placeholder="e.g. BGen. Olaso / Mayor Montawal / Ustadz Karim"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Narrative History / Clashes Summary
                </label>
                <textarea
                  rows={3}
                  value={narrativeHistory}
                  onChange={(e) => setNarrativeHistory(e.target.value)}
                  placeholder="Summarize origin of clan conflict, key skirmishes, trigger events, and background of hostilities..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Settlement Term &amp; Progress (Kasunduan)
                </label>
                <textarea
                  rows={3}
                  value={settlementTerms}
                  onChange={(e) => setSettlementTerms(e.target.value)}
                  placeholder="Details of peace covenants, blood money (Diya), disarmament covenants, mediation dialogues, or current stage of resolution..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Automatically saves to Supabase (cmo_rido table)</span>
            </div>

            <div className="flex items-center space-x-2.5">
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
                <span>{isSaving ? 'Saving to Supabase...' : initialData ? 'Update Rido Case' : 'Save Rido Record'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

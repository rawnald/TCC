'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Skull,
  User,
  ShieldAlert,
  Shield,
  MapPin,
  Compass,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { toMGRS, parseMGRSToCoords, cleanMGRS } from '@/lib/mgrsUtils';
import { PH_PROVINCES, COMMON_PUROKS } from '@/lib/phLocationData';

export type ThreatGroupType =
  | 'PIAGs'
  | 'DIHG'
  | 'PAGs'
  | 'BIFF'
  | 'CRIMINALITY'
  | 'Armed Lawless Element'
  | 'Others';

export const THREAT_GROUPS: ThreatGroupType[] = [
  'PIAGs',
  'DIHG',
  'PAGs',
  'BIFF',
  'CRIMINALITY',
  'Armed Lawless Element',
  'Others',
];

export type EnemyValueType = 'HVI' | 'Non-HVI';

export interface EnemyProfileRecord {
  id: string;
  true_name: string;
  alias?: string;
  threat_group: ThreatGroupType;
  threat_group_other?: string;
  position_role?: string;
  address: string;
  province?: string;
  municipality?: string;
  barangay?: string;
  purok_sitio?: string;
  picture_url?: string;
  value: EnemyValueType;
  psr?: string;
  latest_location_mgrs?: string;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at?: string;
}

interface EnemyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: EnemyProfileRecord) => Promise<void> | void;
  initialData?: EnemyProfileRecord | null;
}

export default function EnemyProfileModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: EnemyProfileModalProps) {
  // ── Core Inputs ────────────────────────────────────────────────────────────
  const [trueName, setTrueName] = useState('');
  const [alias, setAlias] = useState('');
  const [threatGroup, setThreatGroup] = useState<ThreatGroupType>('BIFF');
  const [threatGroupOther, setThreatGroupOther] = useState('');
  const [positionRole, setPositionRole] = useState('');
  const [value, setValue] = useState<EnemyValueType>('HVI');
  const [psr, setPsr] = useState('');
  const [mgrsInput, setMgrsInput] = useState('');

  // ── Address Cascading States (from DIB modal) ──────────────────────────────
  const [province, setProvince] = useState('Maguindanao del Sur');
  const [customProvince, setCustomProvince] = useState('');
  const [municipality, setMunicipality] = useState('Datu Piang (Dulawan)');
  const [customMunicipality, setCustomMunicipality] = useState('');
  const [barangay, setBarangay] = useState('Poblacion');
  const [customBarangay, setCustomBarangay] = useState('');
  const [purokSitio, setPurokSitio] = useState('Purok 1');
  const [customPurok, setCustomPurok] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [useManualAddress, setUseManualAddress] = useState(false);

  // ── Picture Upload State ───────────────────────────────────────────────────
  const [pictureUrl, setPictureUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Coordinates & Validation ───────────────────────────────────────────────
  const [lat, setLat] = useState<number>(6.9536);
  const [lng, setLng] = useState<number>(124.4756);
  const [mgrsValid, setMgrsValid] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Combined Address automatically produced from cascading dropdowns
  const producedAddress = useMemo(() => {
    const activePurok = purokSitio === 'Custom' ? customPurok.trim() : purokSitio.trim();
    const activeBrgy = barangay === 'Custom' ? customBarangay.trim() : barangay.trim();
    const activeMuni = municipality === 'Custom' ? customMunicipality.trim() : municipality.trim();
    const activeProv = province === 'Custom' ? customProvince.trim() : province.trim();
    const parts = [activePurok, activeBrgy, activeMuni, activeProv].filter(Boolean);
    return parts.join(', ');
  }, [purokSitio, customPurok, barangay, customBarangay, municipality, customMunicipality, province, customProvince]);

  // Effective address
  const effectiveAddress = useManualAddress ? manualAddress : producedAddress;

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTrueName(initialData.true_name || '');
        setAlias(initialData.alias || '');
        setThreatGroup(initialData.threat_group || 'BIFF');
        setThreatGroupOther(initialData.threat_group_other || '');
        setPositionRole(initialData.position_role || '');
        setValue(initialData.value || 'HVI');
        setPsr(initialData.psr || '');
        setPictureUrl(initialData.picture_url || '');
        setUrlInput(
          initialData.picture_url && !initialData.picture_url.startsWith('data:')
            ? initialData.picture_url
            : ''
        );
        setMgrsInput(initialData.latest_location_mgrs || '');

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

        setPurokSitio(initialData.purok_sitio || 'Purok 1');
        setCustomPurok('');
        setManualAddress(initialData.address || '');
        setUseManualAddress(Boolean(initialData.address && !initialData.province));

        if (initialData.lat && initialData.lng) {
          setLat(initialData.lat);
          setLng(initialData.lng);
        } else if (initialData.latest_location_mgrs) {
          const parsed = parseMGRSToCoords(cleanMGRS(initialData.latest_location_mgrs));
          if (parsed) {
            setLat(parsed[0]);
            setLng(parsed[1]);
          }
        }
      } else {
        // Defaults for New Enemy Profile
        setTrueName('');
        setAlias('');
        setThreatGroup('BIFF');
        setThreatGroupOther('');
        setPositionRole('Combatant / Sub-Leader');
        setValue('HVI');
        setPsr('Target Deck Priority 1');
        setPictureUrl('');
        setUrlInput('');
        setProvince('Maguindanao del Sur');
        setCustomProvince('');
        setMunicipality('Datu Piang (Dulawan)');
        setCustomMunicipality('');
        setBarangay('Poblacion');
        setCustomBarangay('');
        setPurokSitio('Purok 1');
        setCustomPurok('');
        setManualAddress('');
        setUseManualAddress(false);

        // Default theater coords & MGRS
        const defLat = 6.9536;
        const defLng = 124.4756;
        setLat(defLat);
        setLng(defLng);
        setMgrsInput(toMGRS(defLat, defLng));
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  // When province changes, reset municipality to first in list
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
    const munList = PH_PROVINCES[newProv]?.municipalities || [];
    const firstMun = munList[0]?.name || '';
    setMunicipality(firstMun);
    setCustomMunicipality('');
    const firstBrgy = munList[0]?.barangays[0] || '';
    setBarangay(firstBrgy);
    setCustomBarangay('');
    if (munList[0]?.coords) {
      setLat(munList[0].coords[0]);
      setLng(munList[0].coords[1]);
      setMgrsInput(toMGRS(munList[0].coords[0], munList[0].coords[1]));
      setMgrsValid(true);
    }
  };

  // When municipality changes, reset barangay
  const handleMunicipalityChange = (newMun: string) => {
    setMunicipality(newMun);
    if (newMun === 'Custom') {
      setCustomMunicipality('');
      setBarangay('Custom');
      setCustomBarangay('');
      return;
    }
    setCustomMunicipality('');
    const found = municipalities.find((m) => m.name === newMun);
    const firstBrgy = found?.barangays[0] || 'Poblacion';
    setBarangay(firstBrgy);
    setCustomBarangay('');
    if (found?.coords) {
      setLat(found.coords[0]);
      setLng(found.coords[1]);
      setMgrsInput(toMGRS(found.coords[0], found.coords[1]));
      setMgrsValid(true);
    }
  };

  // MGRS live input parser
  const handleMgrsChange = (val: string) => {
    setMgrsInput(val);
    const clean = cleanMGRS(val);
    if (!clean) {
      setMgrsValid(true);
      return;
    }
    const coords = parseMGRSToCoords(clean);
    if (coords) {
      setLat(coords[0]);
      setLng(coords[1]);
      setMgrsValid(true);
    } else {
      setMgrsValid(false);
    }
  };

  // Client-side image compression via HTML5 Canvas
  const processImageFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('Picture size exceeds 10MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      if (file.type === 'image/svg+xml') {
        setPictureUrl(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 200; // Ultra compact size (~10KB-18KB)
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
          setPictureUrl(compressed);
        } else {
          setPictureUrl(rawDataUrl);
        }
      };
      img.onerror = () => {
        setPictureUrl(rawDataUrl);
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

  const handleRemovePicture = () => {
    setPictureUrl('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setPictureUrl(urlInput.trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!trueName.trim()) {
      setError('True Name is required.');
      return;
    }

    if (threatGroup === 'Others' && !threatGroupOther.trim()) {
      setError('Please specify the Threat Group under "Others".');
      return;
    }

    const cleanM = cleanMGRS(mgrsInput);
    let finalLat = lat;
    let finalLng = lng;
    if (cleanM) {
      const decoded = parseMGRSToCoords(cleanM);
      if (decoded) {
        finalLat = decoded[0];
        finalLng = decoded[1];
      }
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const record: EnemyProfileRecord = {
        id:
          initialData?.id ||
          (typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `ep-${Date.now()}`),
        true_name: trueName.trim(),
        alias: alias.trim() || undefined,
        threat_group: threatGroup,
        threat_group_other: threatGroup === 'Others' ? threatGroupOther.trim() : undefined,
        position_role: positionRole.trim() || undefined,
        address: effectiveAddress.trim() || producedAddress.trim(),
        province: useManualAddress
          ? undefined
          : province === 'Custom'
          ? customProvince.trim() || 'Province'
          : province,
        municipality: useManualAddress
          ? undefined
          : municipality === 'Custom'
          ? customMunicipality.trim() || 'Municipality'
          : municipality,
        barangay:
          useManualAddress
            ? undefined
            : barangay === 'Custom'
            ? customBarangay.trim()
            : barangay,
        purok_sitio:
          useManualAddress
            ? undefined
            : purokSitio === 'Custom'
            ? customPurok.trim()
            : purokSitio,
        picture_url: pictureUrl.trim() || undefined,
        value,
        psr: psr.trim() || undefined,
        latest_location_mgrs: cleanM || undefined,
        lat: finalLat,
        lng: finalLng,
        created_at: initialData?.created_at || now,
        updated_at: now,
      };

      await onSave(record);
      onClose();
    } catch (err: any) {
      console.error('Enemy Profile Save Exception:', err);
      setError(err?.message || 'Failed to save enemy profile. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm backdrop-blur-sm overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-800 max-w-3xl w-full my-6 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm shadow-md">
              <Skull className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <span>{initialData ? 'Edit Enemy Profile' : 'Create Enemy Profile'}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    value === 'HVI'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {value} TARGET
                </span>
              </h2>
              <p className="text-[10px] text-slate-500">
                G2 Intelligence Cell // Target Deck & Hostile Individual Dossier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Identity & Value */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Target Identity & Threat Status</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* True Name */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">
                  True Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abdulrakman Sandigan / Juan Dela Cruz"
                  value={trueName}
                  onChange={(e) => setTrueName(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Value Dropdown */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">
                  Target Value *
                </label>
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value as EnemyValueType)}
                  className={`w-full bg-white border rounded-lg px-3 py-2 text-xs font-bold focus:outline-none ${
                    value === 'HVI'
                      ? 'text-blue-600 border-rose-700/80'
                      : 'text-cyan-300 border-cyan-700/80'
                  }`}
                >
                  <option value="HVI">HVI (High Value Individual)</option>
                  <option value="Non-HVI">Non-HVI (Regular Combatant)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Alias */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">
                  Alias / Callsign
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kumander Mike, Abu Jamil, Ka Dindo"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-purple-300 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Position / Role */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">
                  Position / Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sub-Leader, Gunner, Logistics Officer"
                  value={positionRole}
                  onChange={(e) => setPositionRole(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Threat Groups Dropdown (from DIB modal) */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">
                  Threat Groups (DIB Standard) *
                </label>
                <select
                  value={threatGroup}
                  onChange={(e) => setThreatGroup(e.target.value as ThreatGroupType)}
                  className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-amber-300 text-xs font-bold focus:outline-none focus:border-purple-500"
                >
                  {THREAT_GROUPS.map((tg) => (
                    <option key={tg} value={tg}>
                      {tg}
                    </option>
                  ))}
                </select>
                {threatGroup === 'Others' && (
                  <input
                    type="text"
                    required
                    placeholder="Specify other threat group name..."
                    value={threatGroupOther}
                    onChange={(e) => setThreatGroupOther(e.target.value)}
                    className="w-full bg-white border border-amber-600 rounded-lg px-3 py-1.5 text-xs text-amber-200 mt-2 focus:outline-none"
                  />
                )}
              </div>

              {/* PSR Input */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">
                  PSR (Periodic Status Report)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PSR 2026-Q1 Listed / Active Warrant"
                  value={psr}
                  onChange={(e) => setPsr(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Enemy Picture Upload */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Enemy Picture / Dossier Photo</span>
              </div>
              <div className="flex items-center space-x-1 bg-white rounded-md p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all ${
                    imageTab === 'upload' ? 'bg-purple-600 text-white' : 'text-slate-500'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all ${
                    imageTab === 'url' ? 'bg-purple-600 text-white' : 'text-slate-500'
                  }`}
                >
                  Direct URL
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Picture Preview Thumbnail */}
              <div className="relative w-24 h-24 rounded-xl border-2 border-purple-500/70 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg group">
                {pictureUrl ? (
                  <>
                    <img
                      src={pictureUrl}
                      alt={trueName || 'Enemy Target'}
                      className="w-full h-full object-contain bg-black/50 p-1"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePicture}
                      className="absolute top-1 right-1 p-1 rounded bg-rose-900/90 hover:bg-rose-700 text-white transition-all shadow"
                      title="Remove Picture"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 p-2 text-center">
                    <User className="w-8 h-8 text-slate-600 mb-1" />
                    <span className="text-[9px] uppercase tracking-wider">No Photo</span>
                  </div>
                )}
              </div>

              {/* Upload Dropzone / URL Input */}
              <div className="flex-1 w-full">
                {imageTab === 'upload' ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-purple-400 bg-purple-950/40'
                        : 'border-slate-300 hover:border-purple-500/80 bg-white/60'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload or drag photo here
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      JPG, PNG, WebP up to 10MB (Auto-compressed to ~15KB)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="url"
                        placeholder="https://example.com/photos/target.jpg"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs font-bold transition-all shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Enter direct external image link for target dossier
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Address & Location (MGRS) */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Address & Tactical Coordinates (MGRS)</span>
              </div>
              <button
                type="button"
                onClick={() => setUseManualAddress(!useManualAddress)}
                className="text-[10px] text-slate-500 hover:text-purple-300 underline"
              >
                {useManualAddress ? 'Switch to Cascading Dropdowns' : 'Manual Address Input'}
              </button>
            </div>

            {/* Address Cascading Selector (matching DIB modal) */}
            {!useManualAddress ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Province */}
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1">
                      Province
                    </label>
                    <select
                      value={province}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                    >
                      {provinceNames.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                      <option value="Custom">+ Other (Write-in Province)</option>
                    </select>
                    {province === 'Custom' && (
                      <input
                        type="text"
                        required
                        placeholder="Enter province..."
                        value={customProvince}
                        onChange={(e) => setCustomProvince(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-1.5 text-xs text-slate-800 mt-1.5 focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Municipality */}
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1">
                      Municipality / City
                    </label>
                    <select
                      value={municipality}
                      onChange={(e) => handleMunicipalityChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
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
                        placeholder="Enter municipality..."
                        value={customMunicipality}
                        onChange={(e) => setCustomMunicipality(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-1.5 text-xs text-slate-800 mt-1.5 focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Barangay */}
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1">
                      Barangay
                    </label>
                    <select
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                    >
                      {barangays.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                      <option value="Custom">Custom Barangay (Write-in)</option>
                    </select>
                    {barangay === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Enter barangay name..."
                        value={customBarangay}
                        onChange={(e) => setCustomBarangay(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-1.5 text-xs text-slate-800 mt-1.5 focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Purok / Sitio */}
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1">
                      Purok / Sitio
                    </label>
                    <select
                      value={purokSitio}
                      onChange={(e) => setPurokSitio(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                    >
                      {COMMON_PUROKS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                      <option value="Custom">Custom Sitio/Purok</option>
                    </select>
                    {purokSitio === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Enter purok or sitio..."
                        value={customPurok}
                        onChange={(e) => setCustomPurok(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-1.5 text-xs text-slate-800 mt-1.5 focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* Auto-produced address preview */}
                <div className="p-2 rounded bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-600 text-[11px] text-slate-700 flex items-center space-x-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Address:</span>
                  <span className="text-emerald-400 font-semibold">{producedAddress}</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">
                  Full Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Purok 4, Brgy. Kitango, Datu Saudi Ampatuan, Maguindanao del Sur"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            )}

            {/* Latest Location (MGRS) */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] text-slate-500 uppercase font-bold">
                  Latest Location (MGRS) *
                </label>
                <div className="flex items-center space-x-2 text-[10px]">
                  <span className={mgrsValid ? 'text-emerald-400' : 'text-blue-600'}>
                    {mgrsValid ? 'Valid MGRS Format' : 'Invalid MGRS Format'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          const userLat = pos.coords.latitude;
                          const userLng = pos.coords.longitude;
                          setLat(userLat);
                          setLng(userLng);
                          setMgrsInput(toMGRS(userLat, userLng));
                        });
                      }
                    }}
                    className="text-blue-600 hover:text-purple-300 underline"
                  >
                    Use GPS Coords
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 51NWX1234567890"
                    value={mgrsInput}
                    onChange={(e) => handleMgrsChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-amber-300 font-bold text-xs focus:outline-none focus:border-purple-500 tracking-wider uppercase font-sans"
                  />
                  <Compass className="w-4 h-4 text-blue-600 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-1.5 font-sans">
                <span>LAT: {lat.toFixed(5)}</span>
                <span>•</span>
                <span>LNG: {lng.toFixed(5)}</span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <Skull className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Supabase...' : initialData ? 'Update Profile' : 'Save Enemy Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

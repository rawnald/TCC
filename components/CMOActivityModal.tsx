'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  HeartHandshake,
  Users,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Save,
  Loader2,
  Building2,
  Sparkles,
} from 'lucide-react';
import { CMOActivityRecord } from '@/types/cmo';
import { PH_PROVINCES } from '@/lib/phLocationData';
import { toMGRS } from '@/lib/mgrsUtils';

interface CMOActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: CMOActivityRecord) => Promise<void> | void;
  initialData?: CMOActivityRecord | null;
}

const ACTIVITY_TYPES = [
  'Medical & Dental Outreach Mission',
  'Youth Leadership Summit (YLS)',
  'Community Peace Dialogue & Consultation',
  'Humanitarian Relief & Food Distribution',
  'School Building & Educational Support',
  'Tree Planting & Environmental Action',
  'Livelihood & Skills Training (Balik-Baril)',
  'Multi-Sectoral Stakeholders Forum',
  'Civilian Infrastructure Assistance',
  'Others (Specify Custom Activity)',
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

export default function CMOActivityModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CMOActivityModalProps) {
  const [activityTitle, setActivityTitle] = useState('');
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
  const [activityTypeCustom, setActivityTypeCustom] = useState('');
  const [targetCommunity, setTargetCommunity] = useState('');

  // Location
  const [province, setProvince] = useState('Maguindanao del Sur');
  const [customProvince, setCustomProvince] = useState('');
  const [municipality, setMunicipality] = useState('Datu Piang (Dulawan)');
  const [customMunicipality, setCustomMunicipality] = useState('');
  const [barangay, setBarangay] = useState('Poblacion');
  const [customBarangay, setCustomBarangay] = useState('');

  const [implementingUnit, setImplementingUnit] = useState('6th Civil-Military Operations Battalion (6CMOBn)');
  const [stakeholdersPartners, setStakeholdersPartners] = useState('');
  const [beneficiariesCount, setBeneficiariesCount] = useState<number>(150);
  const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'Planned' | 'Ongoing' | 'Completed'>('Planned');
  const [remarks, setRemarks] = useState('');

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

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setActivityTitle(initialData.activity_title || '');
      setActivityType(initialData.activity_type || ACTIVITY_TYPES[0]);
      setTargetCommunity(initialData.target_community || '');
      
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

      setImplementingUnit(initialData.implementing_unit || '6th Civil-Military Operations Battalion (6CMOBn)');
      setStakeholdersPartners(initialData.stakeholders_partners || '');
      setBeneficiariesCount(Number(initialData.beneficiaries_count) || 0);
      setActivityDate(initialData.activity_date || new Date().toISOString().slice(0, 10));
      setStatus(initialData.status || 'Planned');
      setRemarks(initialData.remarks || '');
      setError(null);
    } else {
      setActivityTitle('');
      setActivityType(ACTIVITY_TYPES[0]);
      setActivityTypeCustom('');
      setTargetCommunity('');
      setProvince('Maguindanao del Sur');
      setCustomProvince('');
      setMunicipality('Datu Piang (Dulawan)');
      setCustomMunicipality('');
      setBarangay('Poblacion');
      setCustomBarangay('');
      setImplementingUnit('6th Civil-Military Operations Battalion (6CMOBn)');
      setStakeholdersPartners('LGU, DSWD, Provincial Health Office');
      setBeneficiariesCount(150);
      setActivityDate(new Date().toISOString().slice(0, 10));
      setStatus('Planned');
      setRemarks('');
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
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!activityTitle.trim()) {
      setError('Activity Title is required.');
      return;
    }

    const finalType = activityType === 'Others (Specify Custom Activity)'
      ? (activityTypeCustom.trim() || 'Custom Activity')
      : activityType;

    const finalProvince = province === 'Custom' ? customProvince.trim() || 'Province' : province;
    const finalMunicipality = municipality === 'Custom' ? customMunicipality.trim() || 'Municipality' : municipality;
    const finalBarangay = barangay === 'Custom' ? customBarangay.trim() || 'Barangay' : barangay;

    const provInfo = PH_PROVINCES[province];
    const muniInfo = provInfo?.municipalities.find((m) => m.name === municipality);
    const coords = muniInfo?.coords || [6.9536, 124.4756];

    const record: CMOActivityRecord = {
      id: initialData?.id || generateUUID(),
      activity_title: activityTitle.trim(),
      activity_type: finalType,
      target_community: targetCommunity.trim() || `${finalBarangay}, ${finalMunicipality}`,
      province: finalProvince,
      municipality: finalMunicipality,
      barangay: finalBarangay,
      address: `${finalBarangay}, ${finalMunicipality}, ${finalProvince}`,
      mgrs: toMGRS(coords[0], coords[1]),
      lat: coords[0],
      lng: coords[1],
      implementing_unit: implementingUnit.trim(),
      stakeholders_partners: stakeholdersPartners.trim() || undefined,
      beneficiaries_count: Number(beneficiariesCount) || 0,
      activity_date: activityDate,
      status,
      remarks: remarks.trim() || undefined,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onSave(record);
      onClose();
    } catch (err: any) {
      console.error('Save CMO Activity Exception:', err);
      setError(err?.message || 'Error saving CMO activity record.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-800">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wider">
                  {initialData ? 'Edit CMO Activity' : 'Log Civil-Military Operations (CMO) Activity'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  CMO // OUTREACH & PEACE
                </span>
              </div>
              <p className="text-xs font-sans text-slate-500 mt-0.5">
                Community Immersion, Inter-Agency Outreach, & Peacebuilding Program Entry
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
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>1. Activity Details & Program Type</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                Activity Title / Operation Name <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                required
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                placeholder="e.g. Oplan Tabang Dulawan: Medical & Relief Mission"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Activity Type <span className="text-blue-600">*</span>
                </label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Schedule Date <span className="text-blue-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>2. Target Community & Location</span>
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
                    placeholder="Enter custom province"
                    className="w-full mt-1.5 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
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
                    placeholder="Enter custom municipality"
                    className="w-full mt-1.5 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
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
                    placeholder="Enter custom barangay"
                    className="w-full mt-1.5 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                Target Community / School / Beneficiary Group
              </label>
              <input
                type="text"
                value={targetCommunity}
                onChange={(e) => setTargetCommunity(e.target.value)}
                placeholder="e.g. Barangay Central Elementary School / Indigenous Community Sitio Balas"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>3. Implementing Unit, Partners & Beneficiaries</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Implementing Unit <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={implementingUnit}
                  onChange={(e) => setImplementingUnit(e.target.value)}
                  placeholder="e.g. 6CMOBn / 601st Bde CMO Section"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Target Beneficiaries Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={beneficiariesCount}
                  onChange={(e) => setBeneficiariesCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Stakeholders & Partner Agencies
                </label>
                <input
                  type="text"
                  value={stakeholdersPartners}
                  onChange={(e) => setStakeholdersPartners(e.target.value)}
                  placeholder="e.g. DOH, DSWD, LGU, Rotary Club, Red Cross"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Execution Status <span className="text-blue-600">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-bold shadow-sm"
                >
                  <option value="Planned">Planned / Scheduled</option>
                  <option value="Ongoing">Ongoing Execution</option>
                  <option value="Completed">Completed / Mission Accomplished</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                Impact Assessment & Accomplishment Remarks
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Log supplies distributed, community sentiment, peace quotient feedback..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2.5">
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
              <span>{isSaving ? 'Saving...' : initialData ? 'Update Activity' : 'Save CMO Activity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


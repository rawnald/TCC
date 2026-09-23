'use client';

import React, { useState, useEffect } from 'react';
import {
  MilitaryProfile,
  MilitaryRank,
  AFPOSBranch,
  PersonnelStatus,
  PersonnelRemarks,
  UploadedDocumentFile,
} from '@/types/personnel';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  X,
  User,
  Shield,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Building2,
  FileCheck,
} from 'lucide-react';

interface PersonnelProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: MilitaryProfile) => Promise<void> | void;
  initialProfile?: MilitaryProfile | null;
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

const RANKS: { value: MilitaryRank; label: string }[] = [
  { value: 'PVT', label: 'PVT — Private' },
  { value: 'PFC', label: 'PFC — Private First Class' },
  { value: 'CPL', label: 'CPL — Corporal' },
  { value: 'SGT', label: 'SGT — Sergeant' },
  { value: 'SSG', label: 'SSG — Staff Sergeant' },
  { value: 'TSg', label: 'TSg — Technical Sergeant' },
  { value: 'MSgt', label: 'MSgt — Master Sergeant' },
  { value: 'SMSgt', label: 'SMSgt — Senior Master Sergeant' },
  { value: 'CMSgt', label: 'CMSgt — Chief Master Sergeant' },
  { value: '1SG', label: '1SG — First Sergeant' },
  { value: 'SGM', label: 'SGM — Sergeant Major' },
  { value: 'CSM', label: 'CSM — Command Sergeant Major' },
  { value: '2LT', label: '2LT — Second Lieutenant' },
  { value: '1LT', label: '1LT — First Lieutenant' },
  { value: 'CPT', label: 'CPT — Captain' },
  { value: 'MAJ', label: 'MAJ — Major' },
  { value: 'LTC', label: 'LTC — Lieutenant Colonel' },
  { value: 'COL', label: 'COL — Colonel' },
  { value: 'BGEN', label: 'BGEN — Brigadier General' },
  { value: 'MGEN', label: 'MGEN — Major General' },
  { value: 'LTGEN', label: 'LTGEN — Lieutenant General' },
  { value: 'GEN', label: 'GEN — General' },
  { value: 'Chr', label: 'Chr — Chaplain' },
];

const AFPOS_OPTIONS: { value: AFPOSBranch; label: string }[] = [
  { value: 'INF', label: 'INF — Infantry' },
  { value: 'FA', label: 'FA — Field Artillery' },
  { value: 'CAV', label: 'CAV — Armor / Cavalry' },
  { value: 'CE', label: 'CE — Combat Engineers' },
  { value: 'MI', label: 'MI — Military Intelligence' },
  { value: 'SC', label: 'SC — Signal Corps' },
  { value: 'FS', label: 'FS — Fire Support' },
  { value: 'OS', label: 'OS — Ordnance Service' },
  { value: 'QMS', label: 'QMS — Quartermaster Service' },
  { value: 'AGS', label: 'AGS — Adjutant General Service' },
  { value: 'CMO', label: 'CMO — Civil-Military Operations' },
  { value: 'N/A', label: 'N/A — Non-Branch / Unassigned' },
];

const STATUS_OPTIONS: { value: PersonnelStatus; label: string }[] = [
  { value: 'MWB', label: 'MWB — Morale & Welfare Break' },
  { value: 'Passes', label: 'Passes — Authorized Pass' },
  { value: 'Mission', label: 'Mission — Operational Deployment' },
  { value: 'Schooling', label: 'Schooling — Career / Military Course' },
  { value: 'RRST', label: 'RRST — Rest & Recuperation Standby' },
  { value: 'DS', label: 'DS — Detached Service' },
  { value: 'On Duty', label: 'On Duty' },
  { value: 'Others', label: 'Others (Specify Custom Status)' },
];

const REMARKS_OPTIONS: { value: PersonnelRemarks; label: string }[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Discharge', label: 'Discharge' },
  { value: 'AWOL', label: 'AWOL (Absent Without Leave)' },
  { value: 'Honorable Discharge', label: 'Honorable Discharge' },
  { value: 'Others', label: 'Others (Specify Custom Remarks)' },
];

export default function PersonnelProfileModal({
  isOpen,
  onClose,
  onSave,
  initialProfile,
}: PersonnelProfileModalProps) {
  // Unit / Office from force_units
  const [unitList, setUnitList] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [customUnit, setCustomUnit] = useState<string>('');
  const [isCustomUnit, setIsCustomUnit] = useState<boolean>(false);

  // Form Fields
  const [rank, setRank] = useState<MilitaryRank>('SGT');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [afpos, setAfpos] = useState<AFPOSBranch>('INF');
  const [designation, setDesignation] = useState('');
  const [address, setAddress] = useState('');

  // Status & Remarks
  const [status, setStatus] = useState<PersonnelStatus>('MWB');
  const [customStatus, setCustomStatus] = useState('');
  const [remarks, setRemarks] = useState<PersonnelRemarks>('Active');
  const [customRemarks, setCustomRemarks] = useState('');

  // File Uploads
  const [clearanceFile, setClearanceFile] = useState<UploadedDocumentFile | null>(null);
  const [soiFile, setSoiFile] = useState<UploadedDocumentFile | null>(null);

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load Force Units from Supabase on mount
  useEffect(() => {
    async function fetchUnits() {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('force_units')
            .select('battalion, brigade')
            .order('battalion', { ascending: true });

          if (data && !error && data.length > 0) {
            const units = Array.from(
              new Set(
                data
                  .map((u) => u.battalion?.trim())
                  .filter((b): b is string => !!b && b.length > 0)
              )
            );
            setUnitList(units);
            return;
          }
        } catch {
          // fallback to defaults
        }
      }
      // Default fallbacks if empty or offline
      setUnitList([
        '1st Battalion, 7th SFG (A)',
        '1st Battalion, 8th Cavalry Regiment',
        '204th Brigade Support Battalion',
        '205th Military Intelligence Battalion',
        '1st Battalion, 321st Field Artillery',
        'Alpha Co, 54th Expeditionary Signal Bn',
        'Joint Task Force Headquarters',
        '101st Infantry Battalion',
        '52nd Engineer Brigade',
      ]);
    }
    fetchUnits();
  }, []);

  // Sync Form State on initialProfile change
  useEffect(() => {
    if (initialProfile) {
      const u = initialProfile.unit_office || initialProfile.assigned_unit || '';
      if (unitList.includes(u)) {
        setSelectedUnit(u);
        setIsCustomUnit(false);
        setCustomUnit('');
      } else if (u) {
        setSelectedUnit('Others');
        setIsCustomUnit(true);
        setCustomUnit(u);
      } else {
        setSelectedUnit(unitList[0] || '1st Battalion, 7th SFG (A)');
        setIsCustomUnit(false);
        setCustomUnit('');
      }

      setRank(initialProfile.rank || 'SGT');
      setLastName(initialProfile.last_name || '');
      setFirstName(initialProfile.first_name || '');
      setMiddleName(initialProfile.middle_name || '');
      setSerialNumber(initialProfile.serial_number || '');
      setAfpos(initialProfile.afpos || 'INF');
      setDesignation(initialProfile.designation || initialProfile.position_role || '');
      setAddress(initialProfile.address || initialProfile.current_location || '');

      // Status
      const st = initialProfile.status || 'MWB';
      const isKnownStatus = ['MWB', 'Passes', 'Mission', 'Schooling', 'RRST', 'DS'].includes(st);
      if (isKnownStatus) {
        setStatus(st as PersonnelStatus);
        setCustomStatus('');
      } else {
        setStatus('Others');
        setCustomStatus(st);
      }

      // Remarks
      const rem = initialProfile.remarks || 'Active';
      const isKnownRem = ['Active', 'Inactive', 'Discharge', 'AWOL', 'Honorable Discharge'].includes(rem);
      if (isKnownRem) {
        setRemarks(rem as PersonnelRemarks);
        setCustomRemarks('');
      } else {
        setRemarks('Others');
        setCustomRemarks(rem);
      }

      setClearanceFile(initialProfile.security_clearance_file || null);
      setSoiFile(initialProfile.soi_file || null);
      setSaveError(null);
    } else {
      // Default new profile
      const defaultU = unitList[0] || '1st Battalion, 7th SFG (A)';
      setSelectedUnit(defaultU);
      setIsCustomUnit(false);
      setCustomUnit('');
      setRank('SGT');
      setLastName('');
      setFirstName('');
      setMiddleName('');
      setSerialNumber('RA-' + Math.floor(10000000 + Math.random() * 90000000));
      setAfpos('INF');
      setDesignation('');
      setAddress('');
      setStatus('MWB');
      setCustomStatus('');
      setRemarks('Active');
      setCustomRemarks('');
      setClearanceFile(null);
      setSoiFile(null);
      setSaveError(null);
    }
  }, [initialProfile, unitList, isOpen]);

  if (!isOpen) return null;

  // File Upload Handlers (converts file to base64 Data URL)
  const handleClearanceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setClearanceFile({
        file_name: file.name,
        file_type: file.type || 'application/pdf',
        file_size_kb: Math.round(file.size / 1024),
        file_data: reader.result as string,
        upload_date: new Date().toISOString().split('T')[0],
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSoiFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Summary of Information (SOI) must be a PDF file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSoiFile({
        file_name: file.name,
        file_type: 'application/pdf',
        file_size_kb: Math.round(file.size / 1024),
        file_data: reader.result as string,
        upload_date: new Date().toISOString().split('T')[0],
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUnitChange = (val: string) => {
    setSelectedUnit(val);
    if (val === 'Others') {
      setIsCustomUnit(true);
    } else {
      setIsCustomUnit(false);
      setCustomUnit('');
    }
  };

  // Submit & Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    const finalUnit = isCustomUnit ? customUnit.trim() : selectedUnit.trim();
    if (!finalUnit) {
      setSaveError('Unit / Office is required.');
      return;
    }
    if (!lastName.trim() || !firstName.trim()) {
      setSaveError('Last Name and First Name are required.');
      return;
    }
    if (!serialNumber.trim()) {
      setSaveError('Serial Number is required.');
      return;
    }

    const finalStatus = status === 'Others' ? customStatus.trim() || 'Others' : status;
    const finalRemarks = remarks === 'Others' ? customRemarks.trim() || 'Others' : remarks;

    const profilePayload: MilitaryProfile = {
      id: initialProfile?.id || generateUUID(),
      unit_office: finalUnit,
      rank,
      last_name: lastName.trim(),
      first_name: firstName.trim(),
      middle_name: middleName.trim() || undefined,
      serial_number: serialNumber.trim(),
      afpos,
      designation: designation.trim(),
      address: address.trim() || undefined,
      status: finalStatus,
      status_other: status === 'Others' ? customStatus.trim() : undefined,
      remarks: finalRemarks,
      remarks_other: remarks === 'Others' ? customRemarks.trim() : undefined,
      security_clearance_file: clearanceFile,
      soi_file: soiFile,
      created_at: initialProfile?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Legacy compat
      full_name: `${lastName.trim()}, ${firstName.trim()} ${middleName.trim()}`.trim(),
      assigned_unit: finalUnit,
      duty_status: finalStatus.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    };

    setIsSaving(true);

    try {
      await onSave(profilePayload);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setSaveError(err.message || 'Error saving personnel profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-fadeIn font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-800">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm font-bold font-sans">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>{initialProfile ? 'Edit Personnel Profile Record' : 'Add New Personnel Profile'}</span>
                
              </h2>
             
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert if any */}
        {saveError && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-sans flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* SECTION 1: UNIT / OFFICE & MILITARY RANK */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-sans font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>1. Unit / Office & Rank Identification</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unit / Office Dropdown */}
              <div>
                <label className="text-[11px] font-sans text-slate-700 block mb-1 font-semibold">
                  Unit / Office (Battalion Roster) <span className="text-blue-600">*</span>
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium shadow-sm"
                >
                  {unitList.map((u, idx) => (
                    <option key={idx} value={u}>
                      {u}
                    </option>
                  ))}
                  <option value="Others">Others (Input Custom Unit)</option>
                </select>

                {/* If "Others" is selected, input custom unit */}
                {isCustomUnit && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      placeholder="Type custom Unit / Office name..."
                      className="w-full bg-white border border-blue-400 rounded-lg px-3 py-1.5 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
                    />
                    <span className="text-[10px] font-sans text-slate-500 mt-0.5 block">
                      Custom unit entered here will be saved to this personnel profile.
                    </span>
                  </div>
                )}
              </div>

              {/* Rank Dropdown */}
              <div>
                <label className="text-[11px] font-sans text-slate-700 block mb-1 font-semibold">
                  Military Rank <span className="text-blue-600">*</span>
                </label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value as MilitaryRank)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold shadow-sm"
                >
                  {RANKS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: SOLDIER NAME & SERIAL NUMBER */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-sans font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <User className="w-4 h-4 text-blue-600" />
              <span>2. Personal Identification & Serial #</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-sans text-slate-700 block mb-1 font-semibold">
                  Last Name <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Hayes"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-sans text-slate-700 block mb-1 font-semibold">
                  First Name <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Nathaniel"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-sans text-slate-700 block mb-1 font-semibold">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="e.g. R."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-sans text-slate-700 block mb-1 font-semibold">
                  Serial # <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. RA-89214402"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold tracking-wide shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: AFPOS, DESIGNATION & ADDRESS */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-sans font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>3. AFPOS Branch, Duty Designation & Address</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-sans text-slate-700 block mb-1 font-semibold">
                  AFPOS Branch Rating <span className="text-blue-600">*</span>
                </label>
                <select
                  value={afpos}
                  onChange={(e) => setAfpos(e.target.value as AFPOSBranch)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold shadow-sm"
                >
                  {AFPOS_OPTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-sans text-slate-700 block mb-1 font-semibold">
                  Designation / Billet Duty Position <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Detachment Commander / Section Chief / Team Lead"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-sans text-slate-700 block mb-1 font-semibold">
                Complete Address / Station Location
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Camp Bravo Sector 4, Forward Operating Base, Zamboanga City"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
              />
            </div>
          </div>

          {/* SECTION 4: STATUS & REMARKS */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-sans font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>4. Duty Status & Administrative Remarks</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="text-[11px] font-sans text-slate-700 block mb-1 font-semibold">
                  Personnel Duty Status <span className="text-blue-600">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PersonnelStatus)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold shadow-sm"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>

                {status === 'Others' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value)}
                      placeholder="Specify custom status (e.g. Hospitalized, TAD)..."
                      className="w-full bg-white border border-blue-400 rounded-lg px-3 py-1.5 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium shadow-sm"
                    />
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[11px] font-sans text-slate-700 block mb-1 font-semibold">
                  Administrative Remarks <span className="text-blue-600">*</span>
                </label>
                <select
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value as PersonnelRemarks)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold shadow-sm"
                >
                  {REMARKS_OPTIONS.map((rem) => (
                    <option key={rem.value} value={rem.value}>
                      {rem.label}
                    </option>
                  ))}
                </select>

                {remarks === 'Others' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      value={customRemarks}
                      onChange={(e) => setCustomRemarks(e.target.value)}
                      placeholder="Specify custom remarks (e.g. On Extended Medical Board)..."
                      className="w-full bg-white border border-blue-400 rounded-lg px-3 py-1.5 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 5: SECURITY CLEARANCE & SOI FILE UPLOADS */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-sans font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>5. Classified Attachments (Security Clearance & Summary of Information)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Security Clearance (PDF or Picture) */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-sans text-slate-800 font-bold flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Security Clearance (PDF or Image)</span>
                  </label>
                  {clearanceFile && (
                    <button
                      type="button"
                      onClick={() => setClearanceFile(null)}
                      className="text-slate-500 hover:text-slate-800 text-[10px] font-sans font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {clearanceFile ? (
                  <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-7 h-7 rounded bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                        {clearanceFile.file_type.includes('image') ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-sans font-bold text-blue-900 truncate">{clearanceFile.file_name}</div>
                        <div className="text-[10px] font-sans text-slate-500">{clearanceFile.file_size_kb} KB • Uploaded</div>
                      </div>
                    </div>
                    {clearanceFile.file_data && (
                      <a
                        href={clearanceFile.file_data}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-sans font-semibold shrink-0 shadow-sm"
                      >
                        Preview
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-lg p-4 text-center bg-slate-50/50 cursor-pointer transition-colors group">
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleClearanceFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-xs font-sans text-slate-700 font-semibold">
                        Choose PDF or Picture File
                      </span>
                      <span className="text-[10px] font-sans text-slate-400">
                        Accepts PDF, PNG, JPG up to 10MB
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SOI (PDF File Upload) */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-sans text-slate-800 font-bold flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Summary of Information / SOI (PDF)</span>
                  </label>
                  {soiFile && (
                    <button
                      type="button"
                      onClick={() => setSoiFile(null)}
                      className="text-slate-500 hover:text-slate-800 text-[10px] font-sans font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {soiFile ? (
                  <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-7 h-7 rounded bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-sans font-bold text-blue-900 truncate">{soiFile.file_name}</div>
                        <div className="text-[10px] font-sans text-slate-500">{soiFile.file_size_kb} KB • Uploaded</div>
                      </div>
                    </div>
                    {soiFile.file_data && (
                      <a
                        href={soiFile.file_data}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-sans font-semibold shrink-0 shadow-sm"
                      >
                        Preview
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-lg p-4 text-center bg-slate-50/50 cursor-pointer transition-colors group">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleSoiFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-xs font-sans text-slate-700 font-semibold">
                        Choose SOI PDF Document
                      </span>
                      <span className="text-[10px] font-sans text-slate-400">
                        Summary of Information (.pdf)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-sans font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{initialProfile ? 'Update Personnel Profile' : 'Save to Supabase & Roster'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

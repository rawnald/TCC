'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  X,
  Save,
  Loader2,
  MapPin,
  Users,
  AlertCircle,
  Phone,
  Calendar,
  Building2,
  Star,
} from 'lucide-react';
import { DLTRecord, DLTStatus, BranchOfService, isUUID, generateUUID } from '@/types/personnel';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface ForceUnitOption {
  id: string;
  battalion: string;
}

interface DLTRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: DLTRecord) => Promise<void>;
  editingRecord?: DLTRecord | null;
}

const RANK_OPTIONS = [
  'PVT', 'PFC', 'CPL', 'SGT', 'SSG', 'TSg', 'MSgt', 'SMSgt', 'CMSgt',
  '1SG', 'SGM', 'CSM',
  '2LT', '1LT', 'CPT', 'MAJ', 'LTC', 'COL', 'BGEN', 'MGEN', 'LTGEN', 'GEN', 'Chr',
];

const AFPOS_OPTIONS = ['INF', 'FA', 'CAV', 'CE', 'MI', 'SC', 'FS', 'OS', 'QMS', 'AGS', 'CMO', 'Others'];

const BRANCH_OPTIONS: BranchOfService[] = ['PA', 'PAF', 'PN', 'PN(M)'];

const DLT_STATUS_OPTIONS: DLTStatus[] = ['Organic', 'Opcon'];

export default function DLTRecordModal({
  isOpen,
  onClose,
  onSave,
  editingRecord,
}: DLTRecordModalProps) {
  // Commander Name fields
  const [rank, setRank] = useState('MAJ');
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [afpos, setAfpos] = useState('INF');
  const [customAfpos, setCustomAfpos] = useState('');
  const [branchOfService, setBranchOfService] = useState<BranchOfService>('PA');

  // Other fields
  const [designation, setDesignation] = useState('');
  const [unitId, setUnitId] = useState('');
  const [unitName, setUnitName] = useState('');
  const [location, setLocation] = useState('');
  const [mgrs, setMgrs] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Strength
  const [officersCount, setOfficersCount] = useState<number>(0);
  const [epCount, setEpCount] = useState<number>(0);
  const [caaCount, setCaaCount] = useState<number>(0);
  const [ceCount, setCeCount] = useState<number>(0);

  // Date & Status
  const [dateAssumption, setDateAssumption] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<DLTStatus>('Organic');

  // Force Units dropdown
  const [forceUnits, setForceUnits] = useState<ForceUnitOption[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load force units from Supabase
  useEffect(() => {
    if (!isOpen) return;
    const fetchForceUnits = async () => {
      setLoadingUnits(true);
      try {
        // Try Supabase first
        if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase
            .from('force_units')
            .select('id, battalion')
            .order('battalion', { ascending: true });
          if (data && !error) {
            setForceUnits(data as ForceUnitOption[]);
            setLoadingUnits(false);
            return;
          }
        }
        // Fallback: localStorage cache
        const cached = localStorage.getItem('force_units');
        if (cached) {
          const parsed = JSON.parse(cached);
          setForceUnits(
            (parsed as any[]).map((u) => ({ id: u.id, battalion: u.battalion })).sort((a, b) =>
              a.battalion.localeCompare(b.battalion)
            )
          );
        }
      } catch {
        // silent
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchForceUnits();
  }, [isOpen]);

  // Populate fields when editing
  useEffect(() => {
    if (editingRecord) {
      setRank(editingRecord.rank || 'MAJ');
      setName(editingRecord.name || '');
      setSerialNumber(editingRecord.serial_number || '');
      const af = editingRecord.afpos || 'INF';
      const isKnownAf = ['INF', 'FA', 'CAV', 'CE', 'MI', 'SC', 'FS', 'OS', 'QMS', 'AGS', 'CMO'].includes(af);
      if (isKnownAf) {
        setAfpos(af);
        setCustomAfpos('');
      } else {
        setAfpos('Others');
        setCustomAfpos(af === 'N/A' || af === 'Others' ? '' : af);
      }
      setBranchOfService((editingRecord.branch_of_service as BranchOfService) || 'PA');
      setDesignation(editingRecord.designation || '');
      // If record has a real unit_id, use it; otherwise show "Other" with the unit_name
      if (editingRecord.unit_id) {
        setUnitId(editingRecord.unit_id);
      } else if (editingRecord.unit_name) {
        setUnitId('__other__');
      } else {
        setUnitId('');
      }
      setUnitName(editingRecord.unit_name || '');
      setLocation(editingRecord.location || '');
      setMgrs(editingRecord.mgrs || '');
      setContactNumber(editingRecord.contact_number || '');
      setOfficersCount(editingRecord.officers_count || 0);
      setEpCount(editingRecord.ep_count || 0);
      setCaaCount(editingRecord.caa_count || 0);
      setCeCount(editingRecord.ce_count || 0);
      setDateAssumption(editingRecord.date_assumption || new Date().toISOString().slice(0, 10));
      setStatus((editingRecord.status as DLTStatus) || 'Organic');
    } else {
      setRank('MAJ');
      setName('');
      setSerialNumber('');
      setAfpos('INF');
      setCustomAfpos('');
      setBranchOfService('PA');
      setDesignation('');
      setUnitId('');
      setUnitName('');
      setLocation('');
      setMgrs('');
      setContactNumber('');
      setOfficersCount(0);
      setEpCount(0);
      setCaaCount(0);
      setCeCount(0);
      setDateAssumption(new Date().toISOString().slice(0, 10));
      setStatus('Organic');
    }
    setErrorMessage(null);
  }, [editingRecord, isOpen]);

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setUnitId(selectedId);
    if (selectedId === '__other__') {
      // User chose "Other" — clear unitName so they can type their own
      setUnitName('');
    } else {
      const found = forceUnits.find((u) => u.id === selectedId);
      setUnitName(found ? found.battalion : '');
    }
  };

  const totalStrength =
    (Number(officersCount) || 0) +
    (Number(epCount) || 0) +
    (Number(caaCount) || 0) +
    (Number(ceCount) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter the Commander Name.');
      return;
    }
    if (!designation.trim()) {
      setErrorMessage('Please enter the Designation.');
      return;
    }
    if (!unitName.trim()) {
      setErrorMessage('Please select or enter a Unit.');
      return;
    }
    if (!location.trim()) {
      setErrorMessage('Please enter the Location.');
      return;
    }

    if (afpos === 'Others' && !customAfpos.trim()) {
      setErrorMessage('Please specify the custom AFPOS.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const finalAfpos = afpos === 'Others' ? customAfpos.trim() || 'Others' : afpos.trim();

    const recordToSave: DLTRecord = {
      id: editingRecord?.id && isUUID(editingRecord.id) ? editingRecord.id : generateUUID(),
      rank: rank.trim(),
      name: name.trim(),
      serial_number: serialNumber.trim(),
      afpos: finalAfpos,
      branch_of_service: branchOfService,
      designation: designation.trim(),
      unit_id: (unitId && unitId !== '__other__') ? unitId : undefined,
      unit_name: unitName.trim(),
      location: location.trim(),
      mgrs: mgrs.trim(),
      contact_number: contactNumber.trim(),
      officers_count: Number(officersCount) || 0,
      ep_count: Number(epCount) || 0,
      caa_count: Number(caaCount) || 0,
      ce_count: Number(ceCount) || 0,
      date_assumption: dateAssumption,
      status,
      created_at: editingRecord?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await onSave(recordToSave);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save DLT record.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white';
  const labelCls = 'block text-[11px] font-semibold text-slate-700 mb-1';
  const sectionHeaderCls =
    'text-[11px] font-bold uppercase tracking-wider text-blue-700 border-b border-blue-100 pb-1 flex items-center space-x-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wide">
                {editingRecord ? 'Edit DLT Record' : 'Add DLT Record'}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Commander Name */}
          <div className="space-y-3">
            <h3 className={sectionHeaderCls}>
              <Star className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Commander Name</span>
            </h3>

            {/* Row 1: Rank + Name */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>
                  Rank <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  className={inputCls}
                >
                  {RANK_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className={labelCls}>
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan dela Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Row 2: Serial #, AFPOS, Branch of Service */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Serial #</label>
                <input
                  type="text"
                  placeholder="e.g. 0-123456"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>AFPOS</label>
                <select
                  value={afpos}
                  onChange={(e) => setAfpos(e.target.value)}
                  className={inputCls}
                >
                  {AFPOS_OPTIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                {afpos === 'Others' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Specify custom AFPOS (e.g. JAGS, NC, CHS)..."
                      value={customAfpos}
                      onChange={(e) => setCustomAfpos(e.target.value)}
                      className={`${inputCls} border-blue-400 bg-blue-50 focus:border-blue-600`}
                      autoFocus
                    />
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Branch of Service</label>
                <select
                  value={branchOfService}
                  onChange={(e) => setBranchOfService(e.target.value as BranchOfService)}
                  className={inputCls}
                >
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Designation & Unit */}
          <div className="space-y-3 pt-1">
            <h3 className={sectionHeaderCls}>
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Designation &amp; Unit</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  Designation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Battalion Commander, CO Alpha Coy"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  Unit <span className="text-rose-500">*</span>
                </label>
                 {loadingUnits ? (
                  <div className="flex items-center space-x-2 text-slate-500 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs">Loading units...</span>
                  </div>
                ) : forceUnits.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={unitId}
                      onChange={handleUnitChange}
                      className={inputCls}
                    >
                      <option value="">— Select Unit —</option>
                      {forceUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.battalion}
                        </option>
                      ))}
                      <option value="__other__">Other / Not in list…</option>
                    </select>
                    {/* Manual input shown when "Other" is selected or dropdown is empty */}
                    {(unitId === '__other__' || (!unitId && unitName)) && (
                      <input
                        type="text"
                        placeholder="Type unit name manually…"
                        value={unitId === '__other__' ? unitName : unitName}
                        onChange={(e) => setUnitName(e.target.value)}
                        className={`${inputCls} border-blue-300 bg-blue-50 focus:border-blue-600`}
                        autoFocus
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. 6th Infantry Battalion"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    className={inputCls}
                  />
                )}

              </div>
            </div>
          </div>

          {/* Section 3: Location */}
          <div className="space-y-3 pt-1">
            <h3 className={sectionHeaderCls}>
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Location</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Camp Datu Piang, Maguindanao del Sur"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>MGRS</label>
                <input
                  type="text"
                  placeholder="e.g. 51NXH66597"
                  value={mgrs}
                  onChange={(e) => setMgrs(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Contact #</label>
                <input
                  type="text"
                  placeholder="e.g. 0917-123-4567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Strength */}
          <div className="space-y-3 pt-1">
            <h3 className={sectionHeaderCls}>
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>4. Strength</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className={labelCls}>Officer</label>
                <input
                  type="number"
                  min="0"
                  value={officersCount}
                  onChange={(e) => setOfficersCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`${inputCls} font-bold`}
                />
              </div>
              <div>
                <label className={labelCls}>EP</label>
                <input
                  type="number"
                  min="0"
                  value={epCount}
                  onChange={(e) => setEpCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`${inputCls} font-bold`}
                />
              </div>
              <div>
                <label className={labelCls}>CAA</label>
                <input
                  type="number"
                  min="0"
                  value={caaCount}
                  onChange={(e) => setCaaCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`${inputCls} font-bold`}
                />
              </div>
              <div>
                <label className={labelCls}>CE</label>
                <input
                  type="number"
                  min="0"
                  value={ceCount}
                  onChange={(e) => setCeCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`${inputCls} font-bold`}
                />
              </div>
              <div>
                <label className={labelCls}>Total</label>
                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 font-bold">
                  {totalStrength}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Date Assumption & Status */}
          <div className="space-y-3 pt-1">
            <h3 className={sectionHeaderCls}>
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>5. Command &amp; Status</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  Date Assumption of Command <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateAssumption}
                  onChange={(e) => setDateAssumption(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DLTStatus)}
                  className={inputCls}
                >
                  {DLT_STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{editingRecord ? 'Update DLT Record' : 'Save DLT Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

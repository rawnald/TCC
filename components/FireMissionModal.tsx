'use client';

import React, { useState, useEffect } from 'react';
import { Target, X, AlertTriangle, Crosshair, CheckCircle2, Flame, Clock } from 'lucide-react';
import { toZuluDTG } from '@/lib/mgrsUtils';
import { FireTargetRecord } from './FireTargetModal';
import { FiresDeploymentRecord } from './FiresDeploymentModal';

export interface FireMissionRecord {
  id: string;
  mission_code: string;
  target_id?: string;
  target_number: string;
  target_description: string;
  target_mgrs: string;
  firing_unit_id?: string;
  firing_unit: string;
  mission_type:
    | 'Immediate Suppression'
    | 'Counter-Battery Fire'
    | 'Harassing & Interdiction'
    | 'Preparation Fire'
    | 'Smoke Screen / Obscuration'
    | 'Illumination Mission'
    | 'Close Air Support (CAS) Strike';
  munition_type: string;
  rounds_ordered: number;
  rounds_expended: number;
  observer_callsign: string;
  status: 'In Progress / Firing' | 'Completed / Rounds Expended' | 'Cease Fire / Suspended' | 'Cancelled';
  bda_result?: 'Target Neutralized' | 'Target Suppressed / Forces Dispersed' | 'Re-engagement Recommended' | 'Pending Ground Assessment';
  start_time: string;
  completed_time?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export const MISSION_TYPES = [
  'Immediate Suppression',
  'Counter-Battery Fire',
  'Harassing & Interdiction',
  'Preparation Fire',
  'Smoke Screen / Obscuration',
  'Illumination Mission',
  'Close Air Support (CAS) Strike',
] as const;

export const MISSION_STATUSES = [
  'In Progress / Firing',
  'Completed / Rounds Expended',
  'Cease Fire / Suspended',
  'Cancelled',
] as const;

export const BDA_RESULTS = [
  'Target Neutralized',
  'Target Suppressed / Forces Dispersed',
  'Re-engagement Recommended',
  'Pending Ground Assessment',
] as const;

interface FireMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mission: FireMissionRecord) => Promise<void> | void;
  initialData?: FireMissionRecord | null;
  targets?: FireTargetRecord[];
  batteries?: FiresDeploymentRecord[];
}

export default function FireMissionModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  targets = [],
  batteries = [],
}: FireMissionModalProps) {
  const [missionCode, setMissionCode] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [targetNumber, setTargetNumber] = useState('');
  const [targetDescription, setTargetDescription] = useState('');
  const [targetMgrs, setTargetMgrs] = useState('');

  const [selectedBatteryId, setSelectedBatteryId] = useState('');
  const [firingUnit, setFiringUnit] = useState('');

  const [missionType, setMissionType] = useState<FireMissionRecord['mission_type']>('Immediate Suppression');
  const [munitionType, setMunitionType] = useState('HE Point Detonating');
  const [roundsOrdered, setRoundsOrdered] = useState<number>(12);
  const [roundsExpended, setRoundsExpended] = useState<number>(12);
  const [observerCallsign, setObserverCallsign] = useState('OBSERVER-EAGLE 01 (Forward Air Controller)');
  const [status, setStatus] = useState<FireMissionRecord['status']>('Completed / Rounds Expended');
  const [bdaResult, setBdaResult] = useState<FireMissionRecord['bda_result']>('Target Neutralized');
  const [remarks, setRemarks] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync target selection
  const handleTargetSelect = (tgtId: string) => {
    setSelectedTargetId(tgtId);
    const tgt = targets.find((t) => t.id === tgtId);
    if (tgt) {
      setTargetNumber(tgt.target_number);
      setTargetDescription(tgt.description);
      setTargetMgrs(tgt.mgrs);
      if (tgt.assigned_battery) {
        setFiringUnit(tgt.assigned_battery);
      }
    }
  };

  // Sync battery selection
  const handleBatterySelect = (batId: string) => {
    setSelectedBatteryId(batId);
    const bat = batteries.find((b) => b.id === batId);
    if (bat) {
      setFiringUnit(`${bat.unit_name} (${bat.callsign})`);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setMissionCode(initialData.mission_code || '');
      setSelectedTargetId(initialData.target_id || '');
      setTargetNumber(initialData.target_number || '');
      setTargetDescription(initialData.target_description || '');
      setTargetMgrs(initialData.target_mgrs || '');
      setSelectedBatteryId(initialData.firing_unit_id || '');
      setFiringUnit(initialData.firing_unit || '');
      setMissionType(initialData.mission_type || 'Immediate Suppression');
      setMunitionType(initialData.munition_type || 'HE Point Detonating');
      setRoundsOrdered(Number(initialData.rounds_ordered) || 12);
      setRoundsExpended(Number(initialData.rounds_expended) || 12);
      setObserverCallsign(initialData.observer_callsign || '');
      setStatus(initialData.status || 'Completed / Rounds Expended');
      setBdaResult(initialData.bda_result || 'Target Neutralized');
      setRemarks(initialData.remarks || '');
      setError(null);
    } else {
      const codeRandom = `FM-2026-${Math.floor(100 + Math.random() * 900)}`;
      setMissionCode(codeRandom);

      if (targets.length > 0) {
        setSelectedTargetId(targets[0].id);
        setTargetNumber(targets[0].target_number);
        setTargetDescription(targets[0].description);
        setTargetMgrs(targets[0].mgrs);
      } else {
        setSelectedTargetId('');
        setTargetNumber('JTFC-TGT-001');
        setTargetDescription('BIFF Encampment & Hardened Bunker Complex');
        setTargetMgrs('51NXH6659745322');
      }

      if (batteries.length > 0) {
        setSelectedBatteryId(batteries[0].id);
        setFiringUnit(`${batteries[0].unit_name} (${batteries[0].callsign})`);
      } else {
        setSelectedBatteryId('');
        setFiringUnit('Alpha Battery, 6th FAB (HAMMER-ALPHA)');
      }

      setMissionType('Immediate Suppression');
      setMunitionType('HE Point Detonating');
      setRoundsOrdered(12);
      setRoundsExpended(12);
      setObserverCallsign('OBSERVER-EAGLE 01 (Forward Air Controller)');
      setStatus('Completed / Rounds Expended');
      setBdaResult('Target Neutralized');
      setRemarks('Direct impacts on compound perimeter; hostile combatants dispersed');
      setError(null);
    }
  }, [isOpen, initialData, targets, batteries]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetNumber.trim()) {
      setError('Target designation is required.');
      return;
    }
    if (!firingUnit.trim()) {
      setError('Firing Unit / Battery is required.');
      return;
    }

    const record: FireMissionRecord = {
      id: initialData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fm-${Date.now()}`),
      mission_code: missionCode.trim().toUpperCase(),
      target_id: selectedTargetId || undefined,
      target_number: targetNumber.trim().toUpperCase(),
      target_description: targetDescription.trim(),
      target_mgrs: targetMgrs.trim(),
      firing_unit_id: selectedBatteryId || undefined,
      firing_unit: firingUnit.trim(),
      mission_type: missionType,
      munition_type: munitionType.trim(),
      rounds_ordered: Number(roundsOrdered) || 0,
      rounds_expended: Number(roundsExpended) || 0,
      observer_callsign: observerCallsign.trim(),
      status,
      bda_result: bdaResult,
      start_time: initialData?.start_time || toZuluDTG(),
      completed_time: status.includes('Completed') ? toZuluDTG() : undefined,
      remarks: remarks.trim() || undefined,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onSave(record);
      onClose();
    } catch (err: any) {
      console.error('Save fire mission error:', err);
      setError(err?.message || 'Error saving fire mission record.');
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
                {initialData ? 'Edit Fire Mission' : 'Initiate / Log Tactical Fire Mission'}
              </h2>
              <p className="text-xs font-sans text-slate-500">
                Fire Direction Center Tasking, Rounds Expenditure &amp; Battle Damage Assessment
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
          {/* Section 1: Mission Code & Target Details */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-rose-700 uppercase pb-2 border-b border-slate-200">
              <Target className="w-4 h-4 text-rose-600" />
              <span>1. Mission Order &amp; Target Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Fire Mission Code <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={missionCode}
                  onChange={(e) => setMissionCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FM-2026-101"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-rose-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Select Existing Target (Optional)
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => handleTargetSelect(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-600 shadow-sm"
                >
                  <option value="">-- Choose from Target Deck or enter manually --</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.target_number} - {t.description.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Target Designation *</label>
                <input
                  type="text"
                  required
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. JTFC-TGT-001"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-rose-600 shadow-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Target Grid Coordinate (MGRS) *</label>
                <input
                  type="text"
                  required
                  value={targetMgrs}
                  onChange={(e) => setTargetMgrs(e.target.value.toUpperCase())}
                  placeholder="e.g. 51NXH6659745322"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-rose-600 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Target Narrative / Details</label>
              <input
                type="text"
                value={targetDescription}
                onChange={(e) => setTargetDescription(e.target.value)}
                placeholder="e.g. Hostile mortar position harassing friendly patrol base"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-600 shadow-sm"
              />
            </div>
          </div>

          {/* Section 2: Firing Unit & Fire Parameters */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase pb-2 border-b border-slate-200">
              <Flame className="w-4 h-4 text-blue-600" />
              <span>2. Firing Battery &amp; Mission Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Select Deployed Battery
                </label>
                <select
                  value={selectedBatteryId}
                  onChange={(e) => handleBatterySelect(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  <option value="">-- Choose from deployed batteries or type below --</option>
                  {batteries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.callsign} - {b.unit_name} ({b.weapon_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">
                  Firing Unit / Call Sign <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firingUnit}
                  onChange={(e) => setFiringUnit(e.target.value)}
                  placeholder="e.g. Alpha Battery, 6th FAB (HAMMER-ALPHA)"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Mission Type *</label>
                <select
                  value={missionType}
                  onChange={(e) => setMissionType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm font-semibold"
                >
                  {MISSION_TYPES.map((mt) => (
                    <option key={mt} value={mt}>{mt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Munition Type</label>
                <select
                  value={munitionType}
                  onChange={(e) => setMunitionType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  <option value="HE Point Detonating">HE Point Detonating</option>
                  <option value="HE Variable Time / Airburst">HE Airburst</option>
                  <option value="White Phosphorus (WP)">White Phosphorus (WP)</option>
                  <option value="Illumination Flare">Illumination Flare</option>
                  <option value="Laser-Guided Precision Shell">Laser-Guided Precision Shell</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Rounds Ordered</label>
                <input
                  type="number"
                  min={1}
                  value={roundsOrdered}
                  onChange={(e) => setRoundsOrdered(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Rounds Expended</label>
                <input
                  type="number"
                  min={0}
                  value={roundsExpended}
                  onChange={(e) => setRoundsExpended(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Observer / Requester</label>
                <input
                  type="text"
                  value={observerCallsign}
                  onChange={(e) => setObserverCallsign(e.target.value)}
                  placeholder="e.g. OBSERVER-EAGLE 01"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Status & Battle Damage Assessment */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase pb-2 border-b border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>3. Mission Status &amp; Battle Damage Assessment (BDA)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Mission Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 shadow-sm"
                >
                  {MISSION_STATUSES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 block mb-1 font-semibold">BDA Assessment</label>
                <select
                  value={bdaResult}
                  onChange={(e) => setBdaResult(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 shadow-sm"
                >
                  {BDA_RESULTS.map((bda) => (
                    <option key={bda} value={bda}>{bda}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Mission Remarks / Post-Strike Report</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Forward observer confirms smoke on target; enemy secondary explosions noted"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 shadow-sm"
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
              className="px-5 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center space-x-2"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Logging Mission...' : initialData ? 'Update Mission' : 'Record Fire Mission'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

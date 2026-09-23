'use client';

import React, { useState, useEffect } from 'react';
import { X, Target, MapPin, Crosshair, AlertTriangle, CheckCircle2, ShieldAlert, Navigation, Send } from 'lucide-react';
import { toZuluDTG, toMGRS, parseMGRSToCoords, PRESET_AREA_COORDS } from '@/lib/mgrsUtils';

export interface EnemyLocationRecord {
  id: string;
  hostile_element: string;
  group_affiliation: string;
  sighting_dtg: string;
  province_area: string;
  mgrs: string;
  lat: number;
  lng: number;
  strength: string;
  weapons: string;
  activity: string;
  movement_vector: string;
  confidence: 'Confirmed' | 'Probable' | 'Possible' | 'Unconfirmed';
  threat_level: 'critical' | 'high' | 'medium' | 'low';
  status: 'active_tracking' | 'lost_contact' | 'engaged' | 'neutralized' | 'cleared';
  notes?: string;
  reported_by?: string;
  created_at: string;
  updated_at?: string;
}

interface EnemyLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: EnemyLocationRecord) => void;
  initialData?: EnemyLocationRecord | null;
  dutyOfficer?: string;
}

export default function EnemyLocationModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  dutyOfficer = 'Capt. Elena Rostova',
}: EnemyLocationModalProps) {
  const [hostileElement, setHostileElement] = useState('');
  const [groupAffiliation, setGroupAffiliation] = useState('Bangsamoro Islamic Freedom Fighters (BIFF)');
  const [sightingDtg, setSightingDtg] = useState('');
  const [provinceArea, setProvinceArea] = useState('Cotabato');
  const [customArea, setCustomArea] = useState('');
  const [mgrsInput, setMgrsInput] = useState('');
  const [lat, setLat] = useState<number>(7.2236);
  const [lng, setLng] = useState<number>(124.2464);
  const [strength, setStrength] = useState('8-12 armed elements');
  const [weapons, setWeapons] = useState('M16A1, 1x RPG-2, improvised explosive components');
  const [activity, setActivity] = useState('Establishing temporary harborage on ridge overlooking valley');
  const [movementVector, setMovementVector] = useState('Stationary / Camouflaged');
  const [confidence, setConfidence] = useState<'Confirmed' | 'Probable' | 'Possible' | 'Unconfirmed'>('Confirmed');
  const [threatLevel, setThreatLevel] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
  const [status, setStatus] = useState<'active_tracking' | 'lost_contact' | 'engaged' | 'neutralized' | 'cleared'>('active_tracking');
  const [notes, setNotes] = useState('');
  const [mgrsValid, setMgrsValid] = useState<boolean>(true);

  // Initialize or reset form state
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setHostileElement(initialData.hostile_element);
        setGroupAffiliation(initialData.group_affiliation || 'Bangsamoro Islamic Freedom Fighters (BIFF)');
        setSightingDtg(initialData.sighting_dtg);
        setProvinceArea(initialData.province_area);
        setCustomArea('');
        setMgrsInput(initialData.mgrs);
        setLat(initialData.lat);
        setLng(initialData.lng);
        setStrength(initialData.strength);
        setWeapons(initialData.weapons);
        setActivity(initialData.activity);
        setMovementVector(initialData.movement_vector);
        setConfidence(initialData.confidence);
        setThreatLevel(initialData.threat_level);
        setStatus(initialData.status);
        setNotes(initialData.notes || '');
        setMgrsValid(true);
      } else {
        const now = new Date();
        const baseCoords = PRESET_AREA_COORDS['Cotabato'] || [7.2236, 124.2464];
        const defaultMGRS = toMGRS(baseCoords[0], baseCoords[1]);
        setHostileElement('');
        setGroupAffiliation('Bangsamoro Islamic Freedom Fighters (BIFF)');
        setSightingDtg(toZuluDTG(now.toISOString()));
        setProvinceArea('Cotabato');
        setCustomArea('');
        setMgrsInput(defaultMGRS);
        setLat(baseCoords[0]);
        setLng(baseCoords[1]);
        setStrength('8-12 armed elements');
        setWeapons('M16A1, 1x RPG-2, improvised explosive components');
        setActivity('Establishing temporary harborage on ridge overlooking valley');
        setMovementVector('Stationary / Camouflaged');
        setConfidence('Confirmed');
        setThreatLevel('high');
        setStatus('active_tracking');
        setNotes('');
        setMgrsValid(true);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Handle MGRS input changes with auto-conversion & validation
  const handleMGRSChange = (val: string) => {
    // Strip spaces and convert to uppercase
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

  // When province changes, update default coordinates & MGRS if not manually customized
  const handleProvinceChange = (area: string) => {
    setProvinceArea(area);
    if (PRESET_AREA_COORDS[area]) {
      const [newLat, newLng] = PRESET_AREA_COORDS[area];
      setLat(newLat);
      setLng(newLng);
      const newMgrs = toMGRS(newLat, newLng);
      setMgrsInput(newMgrs);
      setMgrsValid(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalArea = provinceArea === 'Custom' ? customArea.trim() || 'Unassigned Sector' : provinceArea;

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

    const record: EnemyLocationRecord = {
      id: initialData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `eel-${Date.now()}`),
      hostile_element: hostileElement.trim() || 'Unidentified Hostile Element',
      group_affiliation: groupAffiliation,
      sighting_dtg: sightingDtg.trim() || toZuluDTG(),
      province_area: finalArea,
      mgrs: finalMgrs,
      lat: finalLat,
      lng: finalLng,
      strength: strength.trim(),
      weapons: weapons.trim(),
      activity: activity.trim(),
      movement_vector: movementVector.trim(),
      confidence,
      threat_level: threatLevel,
      status,
      notes: notes.trim(),
      reported_by: dutyOfficer,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(record);
    onClose();
  };

  const presetAors = Object.keys(PRESET_AREA_COORDS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-800 max-w-2xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                <span>{initialData ? 'Edit Enemy Location Sighting' : 'Log Latest Enemy Location / Sighting'}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  HOSTILE TRACK
                </span>
              </h2>
              <p className="text-[11px] font-sans text-slate-500">
                G2 Intelligence // GIS Tactical Geolocation & Sighting Log
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
          {/* Hostile Element Name */}
          <div>
            <label className="block text-[10px] text-slate-500 uppercase mb-1">
              Hostile Element / Contact Designation *
            </label>
            <input
              type="text"
              value={hostileElement}
              onChange={(e) => setHostileElement(e.target.value)}
              placeholder="e.g., BIFF Karialan Faction Sighting / Armed Squad Charlie"
              required
              className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-3 py-2 text-rose-200 focus:outline-none focus:border-rose-500 text-sm font-bold placeholder-slate-600"
            />
          </div>

          {/* Group Affiliation & Sighting DTG */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Group / Faction Affiliation</label>
              <select
                value={groupAffiliation}
                onChange={(e) => setGroupAffiliation(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="Bangsamoro Islamic Freedom Fighters (BIFF)">Bangsamoro Islamic Freedom Fighters (BIFF)</option>
                <option value="New People's Army (NPA / CTG)">New People's Army (NPA / CTG)</option>
                <option value="Dawlah Islamiyah (DI / Maute)">Dawlah Islamiyah (DI / Maute)</option>
                <option value="Abu Sayyaf Group (ASG)">Abu Sayyaf Group (ASG)</option>
                <option value="Private Armed Group (PAG)">Private Armed Group (PAG)</option>
                <option value="Piracy / Maritime Militia">Piracy / Maritime Militia</option>
                <option value="Unidentified Hostile Armed Group">Unidentified Hostile Armed Group</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Sighting DTG (Zulu / Military)</label>
              <input
                type="text"
                value={sightingDtg}
                onChange={(e) => setSightingDtg(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500 font-bold text-blue-600"
              />
            </div>
          </div>

          {/* Area / Province & MGRS Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/80 border border-slate-200 rounded-lg">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Province / Sector AOR</label>
              <select
                value={provinceArea}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              >
                {presetAors.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
                <option value="Custom">Custom Province</option>
              </select>
              {provinceArea === 'Custom' && (
                <input
                  type="text"
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  placeholder="Type sector or province name"
                  className="w-full mt-2 bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800"
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-blue-600" />
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
                className="w-full bg-white border border-rose-700/60 rounded px-2.5 py-1.5 text-rose-300 font-sans font-bold focus:outline-none focus:border-rose-400"
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>Lat: {lat.toFixed(5)}</span>
                <span>Lng: {lng.toFixed(5)}</span>
              </div>
            </div>
          </div>

          {/* Estimated Strength & Weapons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Estimated Manpower / Strength</label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g., 10-15 combatants"
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Observed Weapons & Gear</label>
              <input
                type="text"
                value={weapons}
                onChange={(e) => setWeapons(e.target.value)}
                placeholder="e.g., M16A1, 1x RPG-2, radio equipment"
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Activity & Movement Vector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Observed Hostile Activity *</label>
              <textarea
                rows={2}
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="e.g., Moving in single file along riverbank; setting up observation post"
                required
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded p-2 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Movement Vector / Heading</label>
              <textarea
                rows={2}
                value={movementVector}
                onChange={(e) => setMovementVector(e.target.value)}
                placeholder="e.g., Heading SSE towards marshland; est speed 3 km/h"
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded p-2 text-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Confidence, Threat Level & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Intel Confidence</label>
              <select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as any)}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="Confirmed">Confirmed (Direct ISR)</option>
                <option value="Probable">Probable (SIGINT/Technical)</option>
                <option value="Possible">Possible (HUMINT Informant)</option>
                <option value="Unconfirmed">Unconfirmed / Field Tip</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Threat Level</label>
              <select
                value={threatLevel}
                onChange={(e) => setThreatLevel(e.target.value as any)}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="critical">CRITICAL (Imminent Hazard)</option>
                <option value="high">HIGH (Armed & Hostile)</option>
                <option value="medium">MEDIUM (Surveillance Only)</option>
                <option value="low">LOW (Minor Presence)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Tracking Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="active_tracking">ACTIVE TRACKING</option>
                <option value="lost_contact">LOST CONTACT</option>
                <option value="engaged">TROOPS IN CONTACT</option>
                <option value="neutralized">NEUTRALIZED</option>
                <option value="cleared">AREA CLEARED</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] text-slate-500 uppercase mb-1">
              Remarks & Dispatched Taskings (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., UAV ScanEagle tasked; nearby Patrol Team Alpha alerted"
              className="w-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500"
            />
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
              <span>{initialData ? 'Update Hostile Location' : 'Commit Hostile Track'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

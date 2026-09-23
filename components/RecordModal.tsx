'use client';

import React, { useState, useEffect } from 'react';
import { RecordItem, RecordCategory, RecordStatus, RecordPriority } from '@/types';
import { X, MapPin, Navigation, Save, Crosshair, AlertCircle, Plus, Trash2, Tag, Layers } from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<RecordItem>) => void;
  initialRecord?: RecordItem | null;
  defaultCategory?: RecordCategory;
}

export default function RecordModal({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  defaultCategory = 'incidents',
}: RecordModalProps) {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<RecordCategory>(defaultCategory);
  const [status, setStatus] = useState<RecordStatus>('active');
  const [priority, setPriority] = useState<RecordPriority>('medium');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [mgrs, setMgrs] = useState('');
  const [lat, setLat] = useState<number | string>(37.7749);
  const [lng, setLng] = useState<number | string>(-122.4194);
  const [metaKey, setMetaKey] = useState('');
  const [metaValue, setMetaValue] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRecord) {
      setTitle(initialRecord.title || '');
      setCode(initialRecord.code || '');
      setCategory(initialRecord.category || defaultCategory);
      setStatus(initialRecord.status || 'active');
      setPriority(initialRecord.priority || 'medium');
      setDescription(initialRecord.description || '');
      setLocationName(initialRecord.location_name || '');
      setMgrs(initialRecord.metadata?.mgrs || initialRecord.metadata?.grid_ref || '');
      setLat(initialRecord.lat ?? 37.7749);
      setLng(initialRecord.lng ?? -122.4194);
      setMetadata(initialRecord.metadata || {});
    } else {
      // New record defaults
      setTitle('');
      setCode(`${defaultCategory.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
      setCategory(defaultCategory);
      setStatus('active');
      setPriority('medium');
      setDescription('');
      setLocationName('');
      setMgrs('');
      setLat(37.7749);
      setLng(-122.4194);
      setMetadata({});
    }
    setError(null);
  }, [initialRecord, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(Number(position.coords.latitude.toFixed(6)));
          setLng(Number(position.coords.longitude.toFixed(6)));
          setLocationName((prev) => prev || 'Current GPS Position');
        },
        () => {
          setError('Could not access current browser GPS. You can enter coordinates manually.');
        }
      );
    }
  };

  const handleAddMetadataPair = () => {
    if (!metaKey.trim()) return;
    setMetadata({ ...metadata, [metaKey.trim()]: metaValue.trim() });
    setMetaKey('');
    setMetaValue('');
  };

  const handleRemoveMetadataPair = (key: string) => {
    const updated = { ...metadata };
    delete updated[key];
    setMetadata(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const parsedLat = typeof lat === 'number' ? lat : parseFloat(lat as string);
    const parsedLng = typeof lng === 'number' ? lng : parseFloat(lng as string);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setError('Please provide valid numerical coordinates for Latitude and Longitude');
      return;
    }

    onSave({
      ...(initialRecord?.id ? { id: initialRecord.id } : {}),
      title: title.trim(),
      code: code.trim() || `${category.slice(0, 3).toUpperCase()}-99`,
      category,
      status,
      priority,
      description: description.trim(),
      location_name: locationName.trim(),
      lat: parsedLat,
      lng: parsedLng,
      metadata: {
        ...metadata,
        ...(mgrs.trim() ? { mgrs: mgrs.trim(), grid_ref: mgrs.trim() } : {}),
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm sm:text-base uppercase tracking-wider text-slate-100">
                {initialRecord ? 'Edit Operational Record' : 'Create Operational Record'}
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Encrypted database entry with field telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto font-sans text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 text-[10px] uppercase mb-1 font-bold">
                Record Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Sector 7 Radar Installation"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[10px] uppercase mb-1 font-bold">
                Callsign / Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="INC-101"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-sans font-semibold text-cyan-300"
              />
            </div>
          </div>

          {/* Category, Status, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 text-[10px] uppercase mb-1 font-bold">
                Module Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RecordCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-semibold"
              >
                <option value="incidents">Events & Incidents</option>
                <option value="personnel">Personnel & Agents</option>
                <option value="units">Units & Squads</option>
                <option value="locations">Locations & Facilities</option>
                <option value="tasks">Tasks & Missions</option>
                <option value="equipment">Equipment & Logistics</option>
                <option value="reports">Intelligence Reports</option>
                <option value="documents">Secure Documents</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase mb-1 font-bold">
                Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RecordStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-semibold"
              >
                <option value="active">Active (Ongoing)</option>
                <option value="pending">Pending (Queued)</option>
                <option value="closed">Closed (Resolved)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase mb-1 font-bold">
                Priority Tier
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RecordPriority)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-semibold"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical (Immediate Action)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-400 text-[10px] uppercase mb-1 font-bold">
              Situation Summary & Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide tactical context, operational parameters, or mission requirements..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-sans leading-relaxed resize-none"
            />
          </div>

          {/* Geolocation Section */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-200 uppercase flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Geographical Coordinates</span>
              </span>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 hover:border-cyan-500 text-cyan-400 text-[10px] transition-all active:scale-95"
              >
                <Navigation className="w-3 h-3" />
                <span>Use Browser GPS</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1 font-bold">
                  Location Name
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Subic Bay Outpost"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1 font-bold">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="14.5995"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-sans text-cyan-300"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1 font-bold">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="120.9842"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-sans text-cyan-300"
                />
              </div>
            </div>
          </div>

          {/* Key-Value Metadata Section */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-slate-300 text-[11px] font-bold uppercase">
              <span className="flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Custom Attributes & Metadata</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Key (e.g., callsign)"
                value={metaKey}
                onChange={(e) => setMetaKey(e.target.value)}
                className="w-1/3 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Value (e.g., BRAVO-2)"
                value={metaValue}
                onChange={(e) => setMetaValue(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleAddMetadataPair}
                className="px-3 py-1 bg-slate-50 hover:bg-slate-200 text-cyan-400 border border-slate-200 rounded font-bold transition-all text-xs"
              >
                + Add
              </button>
            </div>

            {Object.keys(metadata).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(metadata).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-200"
                  >
                    <span className="text-cyan-400 font-semibold">{k}:</span>
                    <span>{String(v)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMetadataPair(k)}
                      className="text-slate-500 hover:text-rose-400 ml-1"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end space-x-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-200 text-slate-300 transition-all text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-glow-cyan active:scale-95 text-xs"
            >
              <Save className="w-4 h-4" />
              <span>{initialRecord ? 'Update Record' : 'Save Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

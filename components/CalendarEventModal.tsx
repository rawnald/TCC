'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  X,
  AlertTriangle,
  Users,
  FileText,
  ExternalLink,
  Save,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PH_PROVINCES } from '@/lib/phLocationData';

export interface CalendarEventRecord {
  id: string;
  title: string;
  description?: string;
  start_date: string; // e.g. '2026-09-26T08:00'
  end_date: string;   // e.g. '2026-09-26T10:00'
  category:
    | 'Operational Mission'
    | 'Command Briefing'
    | 'Field Training'
    | 'CMO Activity'
    | 'Intel Debrief'
    | 'Logistics / Supply'
    | 'Maintenance'
    | 'General Event';
  location_name?: string;
  province?: string;
  municipality?: string;
  barangay?: string;
  address?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  organizer_email: string;
  attendees?: string;
  google_calendar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const EVENT_CATEGORIES = [
  'Operational Mission',
  'Command Briefing',
  'Field Training',
  'CMO Activity',
  'Intel Debrief',
  'Logistics / Supply',
  'Maintenance',
  'General Event',
] as const;

export const EVENT_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export const EVENT_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEventRecord) => Promise<void> | void;
  initialData?: CalendarEventRecord | null;
  currentUserEmail?: string;
}

// Convert YYYY-MM-DDTHH:mm to Google Calendar format (YYYYMMDDTHHmm00Z)
function formatGoogleDates(startStr: string, endStr: string): string {
  try {
    const s = new Date(startStr);
    const e = new Date(endStr || startStr);
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return `${fmt(s)}/${fmt(e)}`;
  } catch {
    return '';
  }
}

export default function CalendarEventModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentUserEmail = '',
}: CalendarEventModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CalendarEventRecord['category']>('Command Briefing');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<CalendarEventRecord['priority']>('medium');
  const [status, setStatus] = useState<CalendarEventRecord['status']>('scheduled');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [attendees, setAttendees] = useState('');

  // Location Cascade
  const [province, setProvince] = useState('Maguindanao del Sur');
  const [municipality, setMunicipality] = useState('Datu Piang (Dulawan)');
  const [barangay, setBarangay] = useState('Poblacion');
  const [venue, setVenue] = useState('JTFC Tactical Operations Center');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available provinces
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
      setTitle(initialData.title || '');
      setCategory(initialData.category || 'Command Briefing');
      setStartDate(initialData.start_date || '');
      setEndDate(initialData.end_date || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'medium');
      setStatus(initialData.status || 'scheduled');
      setOrganizerEmail(initialData.organizer_email || currentUserEmail || '');
      setAttendees(initialData.attendees || '');
      setVenue(initialData.location_name || '');
      if (initialData.province) setProvince(initialData.province);
      if (initialData.municipality) setMunicipality(initialData.municipality);
      if (initialData.barangay) setBarangay(initialData.barangay);
    } else {
      // Default dates: today at 09:00 and 10:30
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      setStartDate(`${datePart}T09:00`);
      setEndDate(`${datePart}T10:30`);
      setTitle('');
      setCategory('Command Briefing');
      setDescription('');
      setPriority('high');
      setStatus('scheduled');
      setOrganizerEmail(currentUserEmail || '');
      setAttendees('Command Staff, Duty Officers');
      setVenue('JTFC Tactical Operations Center');
      setProvince('Maguindanao del Sur');
      setMunicipality('Datu Piang (Dulawan)');
      setBarangay('Poblacion');
    }
    setError(null);
  }, [isOpen, initialData, currentUserEmail]);

  if (!isOpen) return null;

  // Construct Google Calendar Link
  const fullAddress = [venue, barangay, municipality, province].filter(Boolean).join(', ');
  const googleDates = formatGoogleDates(startDate, endDate);
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title || 'Command Mission Event'
  )}&dates=${googleDates}&details=${encodeURIComponent(
    description || ''
  )}&location=${encodeURIComponent(fullAddress)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an event title or mission codename.');
      return;
    }
    if (!startDate) {
      setError('Please select a start date and time.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const record: CalendarEventRecord = {
      id: initialData?.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      description: description.trim(),
      category,
      start_date: startDate,
      end_date: endDate || startDate,
      location_name: venue.trim(),
      province,
      municipality,
      barangay,
      address: fullAddress,
      priority,
      status,
      organizer_email: (organizerEmail.trim() || currentUserEmail || 'operator@tactical.gov').toLowerCase(),
      attendees: attendees.trim(),
      google_calendar_url: googleCalUrl,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await onSave(record);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error saving event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 font-sans text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                {initialData ? 'Edit Mission / Calendar Event' : 'Add New Operational Event'}
              </h2>
              <p className="text-[11px] text-blue-200/80">
                Saves directly to your dashboard calendar display &amp; cloud database with email sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-700">
                Event Title / Mission Codename <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Joint Intelligence & Operations Briefing"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-700">
                Event Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CalendarEventRecord['category'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start and End Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-700 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Start Date &amp; Time</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-700 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>End Date &amp; Time</span>
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Location & Cascade */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold uppercase text-slate-800 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>Event Location &amp; Venue</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Province</label>
                <select
                  value={province}
                  onChange={(e) => {
                    const p = e.target.value;
                    setProvince(p);
                    const munis = PH_PROVINCES[p]?.municipalities || [];
                    const defaultMuni = munis[0]?.name || '';
                    setMunicipality(defaultMuni);
                    const brgys = munis[0]?.barangays || [];
                    setBarangay(brgys[0] || '');
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  {provinceNames.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Municipality / City</label>
                <select
                  value={municipality}
                  onChange={(e) => {
                    const m = e.target.value;
                    setMunicipality(m);
                    const muniObj = municipalities.find((x) => x.name === m);
                    const brgys = muniObj ? muniObj.barangays : [];
                    setBarangay(brgys[0] || '');
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  {municipalities.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Barangay</label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  {barangays.map((b: string) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Specific Venue / Building / Room</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. 6ID Conference Room / Camp Siongco TOC"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Sync Email & Attendees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-700">
                Organizer Email (Sync Account) <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={organizerEmail}
                onChange={(e) => setOrganizerEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400">
                Events linked to this email will sync across all your devices automatically.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-700">
                Units / Attendees Involved
              </label>
              <input
                type="text"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="e.g. 6ID TOC, 601st Bde, 33IB, CMO Cell"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-700">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CalendarEventRecord['priority'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical / Urgent Mission</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-700">Execution Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CalendarEventRecord['status'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Description & Agenda */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-slate-700">
              Operational Notes, Agenda &amp; Directives
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline mission objectives, briefing topics, coordinating instructions, and radio frequencies..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
            />
          </div>

          {/* Google Calendar 1-Click Sync Banner */}
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block text-[11px]">
                  Sync with your Google Calendar Apps:
                </span>
                <span className="text-[10px] text-slate-600">
                  Open this event directly in Google Calendar on your phone or desktop with one click.
                </span>
              </div>
            </div>

            {title && startDate ? (
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 font-bold text-xs shadow-sm transition-all shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Save to Google App</span>
              </a>
            ) : (
              <span className="text-[10px] text-slate-400 italic">Enter title &amp; date to preview Google link</span>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Directly to Calendar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

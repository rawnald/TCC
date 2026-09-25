'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/authContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { RecordItem } from '@/types';
import CalendarEventModal, {
  CalendarEventRecord,
  EVENT_CATEGORIES,
} from './CalendarEventModal';
import {
  Calendar as CalendarIcon,
  ExternalLink,
  Plus,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mail,
  Clock,
  Globe,
  Radio,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Users,
  Edit,
  Trash2,
  Layers,
  Sparkles,
  Info,
  Check,
  Copy,
  LayoutGrid,
  List,
} from 'lucide-react';

// ─── INITIAL CALENDAR SEED EVENTS ─────────────────────────────────────────────
const generateSeedEvents = (userEmail: string): CalendarEventRecord[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');

  const todayStr = `${year}-${month}-${day}`;
  const tomorrow = new Date(now.getTime() + 86400000);
  const tomorrowStr = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;
  const dayAfter = new Date(now.getTime() + 86400000 * 3);
  const dayAfterStr = `${dayAfter.getFullYear()}-${(dayAfter.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${dayAfter.getDate().toString().padStart(2, '0')}`;

  const email = userEmail || 'commander@tactical.gov';

  return [
    {
      id: 'evt-seed-001',
      title: 'JTFC Daily Operations & Intelligence Briefing',
      description: 'Review of current security posture, PIAG staging movements, and fire support status in Maguindanao del Sur.',
      category: 'Command Briefing',
      start_date: `${todayStr}T08:30`,
      end_date: `${todayStr}T09:45`,
      location_name: 'Camp Siongco Main TOC',
      province: 'Maguindanao del Norte',
      municipality: 'Datu Odin Sinsuat (Dinaig)',
      barangay: 'Awang',
      address: 'Camp Siongco Main TOC, Awang, Datu Odin Sinsuat, Maguindanao del Norte',
      priority: 'high',
      status: 'scheduled',
      organizer_email: email,
      attendees: 'General Staff, G2, G3, FSCC Lead, CMO Officer',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'evt-seed-002',
      title: 'Joint Fires Safety & Airspace Deconfliction Review',
      description: 'Review of Restrictive Fire Lines (RFL) along Pulangi River and Airspace Coordination Areas with 15th Strike Wing.',
      category: 'Operational Mission',
      start_date: `${todayStr}T14:00`,
      end_date: `${todayStr}T15:30`,
      location_name: 'Joint Fires Coordination Center (JFCC)',
      province: 'Maguindanao del Sur',
      municipality: 'Datu Piang (Dulawan)',
      barangay: 'Poblacion',
      address: 'Joint Fires Coordination Center (JFCC), Poblacion, Datu Piang, Maguindanao del Sur',
      priority: 'critical',
      status: 'scheduled',
      organizer_email: email,
      attendees: 'Maj. Dennis Miller, JTAC Officers, Battery Commanders',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'evt-seed-003',
      title: 'Local Peace Stakeholder Dialogue & Kasunduan Follow-up',
      description: 'Mediation follow-up with municipal peace councils and MILF/MNLF joint committee representatives.',
      category: 'CMO Activity',
      start_date: `${tomorrowStr}T10:00`,
      end_date: `${tomorrowStr}T12:00`,
      location_name: 'Municipal Hall Peace Center',
      province: 'Maguindanao del Sur',
      municipality: 'Datu Saudi-Ampatuan',
      barangay: 'Salbu',
      address: 'Municipal Hall Peace Center, Salbu, Datu Saudi-Ampatuan, Maguindanao del Sur',
      priority: 'medium',
      status: 'scheduled',
      organizer_email: email,
      attendees: 'CMO Cell, Local Chief Executives, Religious Leaders',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'evt-seed-004',
      title: 'Indirect Artillery Calibration & FDC System Check',
      description: 'Digital ballistic computer maintenance and tube bore sighting verification for 6th FAB and 10th FAB.',
      category: 'Maintenance',
      start_date: `${dayAfterStr}T07:00`,
      end_date: `${dayAfterStr}T11:00`,
      location_name: 'Camp Siongco Gun Line Cantonment',
      province: 'Maguindanao del Norte',
      municipality: 'Datu Odin Sinsuat (Dinaig)',
      barangay: 'Awang',
      address: 'Camp Siongco Gun Line Cantonment, Awang, Datu Odin Sinsuat, Maguindanao del Norte',
      priority: 'medium',
      status: 'scheduled',
      organizer_email: email,
      attendees: 'Artillery Maintenance Team, Battery FDCs',
      created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
};

export default function GoogleCalendarView() {
  const { user } = useAuth();

  // ─── TABS & DISPLAY MODES ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'schedule' | 'embed' | 'split'>('schedule');
  const [scheduleView, setScheduleView] = useState<'month' | 'agenda'>('month');

  // ─── CALENDAR EVENTS STATE ─────────────────────────────────────────────────
  const [events, setEvents] = useState<CalendarEventRecord[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventRecord | null>(null);

  // ─── FILTER & SEARCH ───────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterMyEventsOnly, setFilterMyEventsOnly] = useState(false);

  // ─── CURRENT CALENDAR MONTH NAV ────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // ─── GOOGLE CALENDAR EMBED & SETTINGS ───────────────────────────────────────
  const [calendarEmail, setCalendarEmail] = useState<string>('');
  const [calendarId, setCalendarId] = useState<string>('');
  const [embedUrlOverride, setEmbedUrlOverride] = useState<string>('');
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'AGENDA'>('MONTH');
  const [timeZone, setTimeZone] = useState('Asia/Manila');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSyncGuide, setShowSyncGuide] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form states in settings
  const [inputEmail, setInputEmail] = useState('');
  const [inputCalendarId, setInputCalendarId] = useState('');
  const [inputEmbedUrl, setInputEmbedUrl] = useState('');
  const [inputTimezone, setInputTimezone] = useState('Asia/Manila');

  // ─── LOAD ON MOUNT & AUTH CHANGE ───────────────────────────────────────────
  useEffect(() => {
    // Detect system timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        setTimeZone(tz);
        setInputTimezone(tz);
      }
    } catch {}

    loadSavedSettings();
    loadAllCalendarEvents();
  }, [user]);

  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('tactical_google_calendar_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.calendarEmail) setCalendarEmail(parsed.calendarEmail);
        if (parsed.calendarId) setCalendarId(parsed.calendarId);
        if (parsed.embedUrlOverride) setEmbedUrlOverride(parsed.embedUrlOverride);
        if (parsed.timeZone) setTimeZone(parsed.timeZone);
        if (parsed.viewMode) setViewMode(parsed.viewMode);

        setInputEmail(parsed.calendarEmail || user?.email || '');
        setInputCalendarId(parsed.calendarId || '');
        setInputEmbedUrl(parsed.embedUrlOverride || '');
        setInputTimezone(parsed.timeZone || 'Asia/Manila');
      } else {
        const initialEmail = user?.email || '';
        setCalendarEmail(initialEmail);
        setInputEmail(initialEmail);
      }
    } catch (e) {
      console.warn('Error loading calendar settings:', e);
    }
  };

  const loadAllCalendarEvents = async () => {
    setIsRefreshing(true);
    let loadedEvents: CalendarEventRecord[] = [];

    // 1. Try LocalStorage
    try {
      const saved = localStorage.getItem('tactical_calendar_events');
      if (saved) {
        loadedEvents = JSON.parse(saved);
      }
    } catch {}

    // If empty, generate seed events with user's email
    if (loadedEvents.length === 0) {
      loadedEvents = generateSeedEvents(user?.email || '');
      try {
        localStorage.setItem('tactical_calendar_events', JSON.stringify(loadedEvents));
      } catch {}
    }

    // 2. Try Supabase cloud sync
    if (isSupabaseConfigured() && supabase) {
      try {
        // A. Try dedicated calendar_events table
        const { data: dbEvents, error: dbErr } = await supabase
          .from('calendar_events')
          .select('*')
          .order('start_date', { ascending: true });

        if (!dbErr && dbEvents && dbEvents.length > 0) {
          // Merge deduplicating by ID
          const map = new Map<string, CalendarEventRecord>();
          loadedEvents.forEach((ev) => map.set(ev.id, ev));
          dbEvents.forEach((ev) => map.set(ev.id, ev));
          loadedEvents = Array.from(map.values());
        }

        // B. Also search records table for mirrored calendar events created with email
        const { data: recData } = await supabase
          .from('records')
          .select('*')
          .eq('category', 'tasks')
          .order('created_at', { ascending: false });

        if (recData && recData.length > 0) {
          recData.forEach((rec) => {
            if (rec.metadata?.is_calendar_event && rec.metadata?.start_date) {
              if (!loadedEvents.some((ev) => ev.id === rec.id)) {
                loadedEvents.push({
                  id: rec.id,
                  title: rec.title.replace(/^\[Event\]\s*/i, ''),
                  description: rec.description,
                  start_date: rec.metadata.start_date,
                  end_date: rec.metadata.end_date || rec.metadata.start_date,
                  category: rec.metadata.category || 'Command Briefing',
                  location_name: rec.location_name,
                  province: rec.metadata.province,
                  municipality: rec.metadata.municipality,
                  barangay: rec.metadata.barangay,
                  address: rec.location_name,
                  priority: rec.priority || 'medium',
                  status: rec.status === 'closed' ? 'completed' : 'scheduled',
                  organizer_email: rec.created_by_email || user?.email || '',
                  attendees: rec.metadata.attendees || '',
                  created_at: rec.created_at,
                  updated_at: rec.updated_at,
                });
              }
            }
          });
        }
      } catch (err) {
        console.warn('Supabase calendar events sync notice:', err);
      }
    }

    setEvents(loadedEvents);
    setIsRefreshing(false);
  };

  // ─── SAVE EVENT HANDLER (SYNC TO LOCAL, STATE & SUPABASE) ──────────────────
  const handleSaveEvent = async (event: CalendarEventRecord) => {
    const existingIndex = events.findIndex((e) => e.id === event.id);
    let updated: CalendarEventRecord[];
    if (existingIndex >= 0) {
      updated = [...events];
      updated[existingIndex] = event;
    } else {
      updated = [event, ...events];
    }

    setEvents(updated);
    try {
      localStorage.setItem('tactical_calendar_events', JSON.stringify(updated));
    } catch {}

    // Save to Supabase Cloud
    if (isSupabaseConfigured() && supabase) {
      // 1. Try dedicated calendar_events table
      try {
        await supabase.from('calendar_events').upsert([event]);
      } catch (err) {
        console.warn('calendar_events table notice:', err);
      }

      // 2. Mirror into records table tagged with organizer email so it's queryable everywhere
      try {
        const mirror: Partial<RecordItem> = {
          id: event.id,
          title: `[Event] ${event.title}`,
          code: `EVT-${event.id.slice(-6).toUpperCase()}`,
          category: 'tasks',
          description: event.description || '',
          status: event.status === 'completed' ? 'closed' : 'active',
          priority: event.priority,
          location_name: event.address || event.location_name || '',
          created_by_email: event.organizer_email || user?.email || '',
          metadata: {
            is_calendar_event: true,
            category: event.category,
            start_date: event.start_date,
            end_date: event.end_date,
            attendees: event.attendees,
            location_name: event.location_name,
            province: event.province,
            municipality: event.municipality,
            barangay: event.barangay,
            google_calendar_url: event.google_calendar_url,
          },
          updated_at: new Date().toISOString(),
        };
        await supabase.from('records').upsert([mirror]);
      } catch (recErr) {
        console.warn('Records mirror error:', recErr);
      }
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to remove this event from the calendar?')) return;
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    try {
      localStorage.setItem('tactical_calendar_events', JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('calendar_events').delete().eq('id', id);
        await supabase.from('records').delete().eq('id', id);
      } catch {}
    }
  };

  // ─── SAVE SETTINGS HANDLER ────────────────────────────────────────────────
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inputEmail.trim();
    const cleanCalId = inputCalendarId.trim();
    const cleanEmbed = inputEmbedUrl.trim();
    const cleanTz = inputTimezone.trim() || 'Asia/Manila';

    setCalendarEmail(cleanEmail);
    setCalendarId(cleanCalId);
    setEmbedUrlOverride(cleanEmbed);
    setTimeZone(cleanTz);

    const settingsObj = {
      calendarEmail: cleanEmail,
      calendarId: cleanCalId,
      embedUrlOverride: cleanEmbed,
      timeZone: cleanTz,
      viewMode,
      updated_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem('tactical_google_calendar_settings', JSON.stringify(settingsObj));
      localStorage.setItem('tactical_google_calendar_email', cleanEmail);
    } catch {}

    // Save to Supabase user profile or records settings
    if (isSupabaseConfigured() && supabase && user?.id) {
      try {
        await supabase.from('records').upsert([
          {
            id: `settings-cal-${user.id}`,
            code: 'CONFIG-CALENDAR',
            title: `Google Calendar Settings: ${cleanEmail}`,
            category: 'documents',
            status: 'active',
            priority: 'low',
            location_name: cleanTz,
            created_by_email: user.email || cleanEmail,
            metadata: settingsObj,
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.warn('Save calendar settings error:', err);
      }
    }

    setIsSettingsOpen(false);
  };

  // ─── GOOGLE EMBED URL COMPUTATION ──────────────────────────────────────────
  const embedUrl = useMemo(() => {
    if (embedUrlOverride) {
      return embedUrlOverride;
    }
    const targetSrc = calendarId || calendarEmail;
    if (!targetSrc) return '';

    return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
      targetSrc
    )}&ctz=${encodeURIComponent(timeZone)}&mode=${viewMode}&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=1&bgcolor=%23ffffff`;
  }, [embedUrlOverride, calendarId, calendarEmail, timeZone, viewMode]);

  // ─── FILTERED EVENTS ───────────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedCategory !== 'all' && ev.category !== selectedCategory) return false;
      if (filterMyEventsOnly) {
        const uEmail = (user?.email || calendarEmail || '').toLowerCase();
        if (ev.organizer_email.toLowerCase() !== uEmail) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          ev.title.toLowerCase().includes(q) ||
          (ev.description && ev.description.toLowerCase().includes(q)) ||
          (ev.location_name && ev.location_name.toLowerCase().includes(q)) ||
          (ev.address && ev.address.toLowerCase().includes(q)) ||
          (ev.attendees && ev.attendees.toLowerCase().includes(q)) ||
          ev.organizer_email.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [events, selectedCategory, filterMyEventsOnly, searchQuery, user, calendarEmail]);

  // ─── MONTHLY CALENDAR GRID BUILDER ─────────────────────────────────────────
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const totalDays = lastDayOfMonth.getDate();

    const monthName = firstDayOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Days grid
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; events: CalendarEventRecord[] }[] = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dNum);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dStr = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}-${pad(dNum)}`;
      days.push({
        dateStr: dStr,
        dayNum: dNum,
        isCurrentMonth: false,
        events: filteredEvents.filter((ev) => ev.start_date.startsWith(dStr)),
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dStr = `${year}-${pad(month + 1)}-${pad(i)}`;
      days.push({
        dateStr: dStr,
        dayNum: i,
        isCurrentMonth: true,
        events: filteredEvents.filter((ev) => ev.start_date.startsWith(dStr)),
      });
    }

    // Next month filler to fill complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dStr = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(i)}`;
      days.push({
        dateStr: dStr,
        dayNum: i,
        isCurrentMonth: false,
        events: filteredEvents.filter((ev) => ev.start_date.startsWith(dStr)),
      });
    }

    return {
      monthName,
      days,
    };
  }, [currentDate, filteredEvents]);

  // Category Badge Colors
  const getCategoryColor = (cat: CalendarEventRecord['category']) => {
    switch (cat) {
      case 'Operational Mission':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Command Briefing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CMO Activity':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Intel Debrief':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Field Training':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Logistics / Supply':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'Maintenance':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const activeSyncEmail = calendarEmail || user?.email || 'No email configured';

  return (
    <div className="space-y-4 font-sans text-slate-900 pb-12">
      {/* ── TOP CONTROL & STATUS BANNER ────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1">
              <CalendarIcon className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
              <span>Operations Calendar &amp; Schedule</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block mr-1" />
              <span>SYNC ACTIVE</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center space-x-2">
            <span>Command Schedule &amp; Google Calendar Hub</span>
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>
              Synchronized Account:{' '}
              <strong className="text-blue-700 font-mono">{activeSyncEmail}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Timezone: <strong className="text-slate-700">{timeZone}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Total Events: <strong className="text-slate-900">{events.length}</strong>
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            title="Create and save a new event directly to this calendar display"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>

          <button
            onClick={loadAllCalendarEvents}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm transition-all"
            title="Sync all calendar data from cloud and account"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm transition-all"
            title="Google Calendar Account Settings & Sync Configuration"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Settings</span>
          </button>

          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm transition-all"
            title="Open Google Calendar App in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Google App</span>
          </a>
        </div>
      </div>

      {/* ── SYNC GUIDANCE NOTIFICATION BANNER ───────────────────────────────── */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start sm:items-center space-x-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-slate-700">
            <span className="font-bold text-slate-900">Direct Cloud Synchronization:</span> Any event you add via{' '}
            <strong className="text-blue-700">Add Event</strong> is saved directly into this dashboard display and
            synced to Supabase under your email (<strong>{activeSyncEmail}</strong>).
          </div>
        </div>

        <button
          onClick={() => setShowSyncGuide(!showSyncGuide)}
          className="text-xs font-bold text-blue-700 hover:text-blue-900 underline shrink-0 whitespace-nowrap"
        >
          {showSyncGuide ? 'Hide Sync Walkthrough' : 'Desktop Google App Sync Notice'}
        </button>
      </div>

      {/* ── DESKTOP SYNC WALKTHROUGH ACCORDION ──────────────────────────────── */}
      {showSyncGuide && (
        <div className="p-4 rounded-xl bg-white border border-blue-300 shadow-sm text-xs space-y-3 animate-in fade-in duration-200">
          <div className="font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Why events created on your desktop computer need public permission to embed</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-600">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">1. Google Security Policy</span>
              <p>
                Google embeds block private calendar events in web iframes unless the calendar is set to{' '}
                <strong>&quot;Make available to public&quot;</strong>.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">2. How to enable desktop sync</span>
              <p>
                On your desktop at <code className="bg-slate-200 px-1 rounded">calendar.google.com</code>, click your
                calendar &gt; <strong>Settings and sharing</strong> &gt; check{' '}
                <strong>&quot;Make available to public&quot;</strong>.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">3. Paste your Calendar ID</span>
              <p>
                In <strong>Settings</strong> above, enter your Calendar ID or Embed URL to display your full Google
                events stream alongside this operations schedule.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DISPLAY MODE SWITCHER TABS ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-all ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Operations Calendar ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-all ${
              activeTab === 'embed'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Google Calendar Live
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-all ${
              activeTab === 'split'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dual Split View
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {EVENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterMyEventsOnly(!filterMyEventsOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filterMyEventsOnly
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Filter only events created with your active email"
          >
            My Email Only
          </button>

          {activeTab === 'schedule' && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setScheduleView('month')}
                className={`p-1.5 rounded ${scheduleView === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                title="Month View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setScheduleView('agenda')}
                className={`p-1.5 rounded ${scheduleView === 'agenda' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                title="Agenda / List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── TAB 1 & COMBINED: OPERATIONS CALENDAR DISPLAY ───────────────────── */}
      {(activeTab === 'schedule' || activeTab === 'split') && (
        <div
          className={`${
            activeTab === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'
          }`}
        >
          {/* Calendar Display Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
            {/* Month Navigation Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">{monthData.monthName}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {filteredEvents.length} Events Scheduled
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                >
                  Today
                </button>
                <button
                  onClick={() =>
                    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
                  }
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 border border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
                  }
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 border border-slate-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Monthly Calendar Grid View */}
            {scheduleView === 'month' ? (
              <div className="space-y-2">
                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 text-center font-bold text-[11px] uppercase text-slate-400 py-1 border-b border-slate-100">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Day Cells Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {monthData.days.map((d, idx) => {
                    const isToday =
                      new Date().toISOString().slice(0, 10) === d.dateStr;
                    return (
                      <div
                        key={idx}
                        className={`min-h-[95px] p-1.5 rounded-xl border flex flex-col justify-between transition-colors ${
                          d.isCurrentMonth
                            ? isToday
                              ? 'bg-blue-50/50 border-blue-300'
                              : 'bg-white border-slate-200 hover:border-blue-200'
                            : 'bg-slate-50/60 border-slate-100 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full font-bold ${
                              isToday
                                ? 'bg-blue-600 text-white'
                                : d.isCurrentMonth
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {d.dayNum}
                          </span>
                          {d.events.length > 0 && (
                            <span className="text-[9px] font-bold text-blue-700 bg-blue-100/70 px-1 rounded">
                              {d.events.length}
                            </span>
                          )}
                        </div>

                        {/* Events in cell */}
                        <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[70px]">
                          {d.events.map((ev) => (
                            <button
                              key={ev.id}
                              onClick={() => {
                                setEditingEvent(ev);
                                setIsEventModalOpen(true);
                              }}
                              className={`w-full text-left p-1 rounded text-[10px] font-semibold border truncate block shadow-2xs ${getCategoryColor(
                                ev.category
                              )}`}
                              title={`${ev.title} (${ev.start_date.slice(11, 16)}) - ${ev.address || ev.location_name}`}
                            >
                              <span className="font-mono text-[9px] mr-1 opacity-75">
                                {ev.start_date.slice(11, 16)}
                              </span>
                              <span>{ev.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Agenda / List View */
              <div className="divide-y divide-slate-100">
                {filteredEvents.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No scheduled events found matching your criteria.
                  </div>
                ) : (
                  filteredEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition-colors group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryColor(
                              ev.category
                            )}`}
                          >
                            {ev.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-blue-700">
                            {ev.start_date.replace('T', ' at ')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                          {ev.address && (
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-rose-500" />
                              <span>{ev.address}</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-blue-500" />
                            <span>{ev.organizer_email}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                        {ev.google_calendar_url && (
                          <a
                            href={ev.google_calendar_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center space-x-1"
                            title="Add to Google Calendar"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Google</span>
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setEditingEvent(ev);
                            setIsEventModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                          title="Edit Event"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right column in Split View: Google Calendar Live */}
          {activeTab === 'split' && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col min-h-[580px]">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 uppercase flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Google Calendar Live Sync Embed</span>
                </span>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-blue-600 hover:underline font-semibold text-[11px]"
                >
                  Configure Account
                </button>
              </div>

              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full flex-1 border-0"
                  title="Google Calendar Split Embed"
                  loading="lazy"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <CalendarIcon className="w-8 h-8 text-slate-400" />
                  <p className="text-xs text-slate-500 max-w-xs">
                    Connect your Google Calendar in Settings to view the live embed side-by-side.
                  </p>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs"
                  >
                    Open Settings
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: GOOGLE CALENDAR EMBED FULL VIEW ───────────────────────────── */}
      {activeTab === 'embed' && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm relative min-h-[680px]">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-[75vh] min-h-[680px] border-0 rounded-2xl"
              title="Google Calendar Full Embed"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[650px] p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
                <CalendarIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                  No Google Calendar Connected Yet
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Enter your Google Account email address or Calendar ID to display your Google Calendar live.
                </p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Connect Google Calendar
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ADD / EDIT EVENT MODAL ─────────────────────────────────────────── */}
      <CalendarEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        initialData={editingEvent}
        currentUserEmail={calendarEmail || user?.email || ''}
      />

      {/* ── SETTINGS MODAL ─────────────────────────────────────────────────── */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 uppercase tracking-wider">
                  Google Calendar &amp; Sync Settings
                </span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <p className="text-xs text-slate-600">
                These settings configure your Google Calendar connection, synchronization email, and time zone across
                all devices. Settings are saved to cloud database and local storage.
              </p>

              {/* Connected Google Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">
                  Google Account Email (Sync ID)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  Used for authenticating events and syncing actions created with your email.
                </span>
              </div>

              {/* Specific Calendar ID */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">
                  Calendar ID (Optional, for Shared / Group Calendars)
                </label>
                <input
                  type="text"
                  value={inputCalendarId}
                  onChange={(e) => setInputCalendarId(e.target.value)}
                  placeholder="e.g. c_xxxxxxxx@group.calendar.google.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
                <span className="text-[10px] text-slate-400">
                  Found in your Google Calendar Settings &gt; Integrate calendar &gt; Calendar ID.
                </span>
              </div>

              {/* Custom Embed URL Override */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">
                  Custom Embed URL / Public iCal Link (Optional)
                </label>
                <input
                  type="text"
                  value={inputEmbedUrl}
                  onChange={(e) => setInputEmbedUrl(e.target.value)}
                  placeholder="https://calendar.google.com/calendar/embed?src=..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
                <span className="text-[10px] text-slate-400">
                  If you have a customized Google Calendar embed link, paste it directly here.
                </span>
              </div>

              {/* Timezone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-700 block">
                  Operational Timezone
                </label>
                <select
                  value={inputTimezone}
                  onChange={(e) => setInputTimezone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="Asia/Manila">Asia/Manila (UTC+8 Philippine Standard Time)</option>
                  <option value="UTC">UTC (Zulu Time)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                  <option value="America/New_York">America/New_York (EST / EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
                </select>
              </div>

              {/* Google Apps Desktop Sync Guidance Box */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-1.5 text-slate-700">
                <span className="font-bold text-slate-900 block text-[11px]">
                  📌 How to verify events from your desktop Google Calendar appear here:
                </span>
                <p className="text-[10px] leading-relaxed text-slate-600">
                  1. In your desktop Google Calendar, open <strong>Settings &gt; Settings for my calendars</strong>.
                  <br />
                  2. Under <strong>Access permissions for events</strong>, ensure{' '}
                  <strong>&quot;Make available to public&quot;</strong> is checked.
                  <br />
                  3. Any events created on your phone or desktop will now render in the Google Calendar Live tab!
                </p>
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md active:scale-95"
                >
                  Save Settings &amp; Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

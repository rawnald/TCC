'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
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
} from 'lucide-react';

export default function GoogleCalendarView() {
  const { user } = useAuth();

  // Connected calendar ID or email (defaults to user email if available, otherwise saved in localStorage)
  const [calendarEmail, setCalendarEmail] = useState<string>('');
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'AGENDA'>('MONTH');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [timeZone, setTimeZone] = useState('UTC');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Detect system timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimeZone(tz);
    } catch {
      setTimeZone('UTC');
    }

    // Load saved calendar email or default to user email
    const saved = localStorage.getItem('tactical_google_calendar_email');
    if (saved) {
      setCalendarEmail(saved);
      setInputEmail(saved);
    } else if (user?.email) {
      setCalendarEmail(user.email);
      setInputEmail(user.email);
    } else {
      setCalendarEmail('');
      setInputEmail('');
    }
  }, [user]);

  const handleSaveCalendarEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputEmail.trim();
    setCalendarEmail(clean);
    localStorage.setItem('tactical_google_calendar_email', clean);
    setIsSettingsOpen(false);
  };

  // Google Calendar Embed URL builder
  const embedUrl = calendarEmail
    ? `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
        calendarEmail
      )}&ctz=${encodeURIComponent(timeZone)}&mode=${viewMode}&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=1&bgcolor=%2306090e`
    : '';

  return (
    <div className="space-y-4">
      {/* Top Header & Tactical Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-tactical-card">
        <div>
          <h2 className="text-base font-sans font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2.5">
            <CalendarIcon className="w-5 h-5 text-cyan-400" />
            <span>Google Calendar Operations Hub</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Synchronized live with your Google account schedule & missions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-sans">
            {(['MONTH', 'WEEK', 'AGENDA'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === mode
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'MONTH' ? 'Month' : mode === 'WEEK' ? 'Week' : 'Agenda'}
              </button>
            ))}
          </div>

          {/* Quick Create Event */}
          <a
            href="https://calendar.google.com/calendar/r/eventedit"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-sans font-bold transition-all shadow-glow-cyan active:scale-95"
            title="Create Event on Google Calendar"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Event</span>
          </a>

          {/* Open Directly in Google */}
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-200 text-slate-300 hover:text-white transition-all text-xs"
            title="Open Google Calendar in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-200 text-slate-300 hover:text-white transition-all text-xs"
            title="Calendar Settings / Change Account"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Account Status Banner */}
      <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
        <div className="flex items-center space-x-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-radar-dot" />
          <span className="text-slate-400">Connected Account:</span>
          <span className="text-cyan-300 font-bold">
            {calendarEmail || 'No Google Account Connected'}
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline flex items-center space-x-1">
            <Globe className="w-3 h-3 text-slate-500" />
            <span>{timeZone}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showHelp ? 'Hide Guidance' : 'How does sync work?'}</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-cyan-500/50 text-cyan-400 text-[11px] font-bold transition-all shadow-sm"
          >
            Change Account
          </button>
        </div>
      </div>

      {/* Help / Guidance Card */}
      {showHelp && (
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/80 text-xs font-sans space-y-2 text-slate-300 shadow-tactical-card">
          <div className="font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Google Account Calendar Sync Guide</span>
          </div>
          <p className="leading-relaxed text-slate-300">
            • <strong>Automatic Sync:</strong> Because Google Calendar embeds directly into this command dashboard, any event added from your phone, laptop, or Google Calendar app displays here automatically in real time.
          </p>
          <p className="leading-relaxed text-slate-300">
            • <strong>Viewing Events:</strong> If you are logged into your Google account in this browser, you will see all your events immediately.
          </p>
          <p className="leading-relaxed text-slate-300">
            • <strong>Sharing with Team:</strong> To display a shared organizational or mission calendar, enter the <strong>Calendar ID</strong> (found in your Google Calendar Settings &gt; Integrate calendar) using the "Change Account" button above.
          </p>
        </div>
      )}

      {/* Calendar IFrame Container */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-2xl relative min-h-[650px]">
        {calendarEmail ? (
          <iframe
            src={embedUrl}
            className="w-full h-[75vh] border-0 rounded-2xl"
            title="Google Calendar"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[650px] p-6 text-center space-y-4 font-sans">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                No Google Calendar Connected Yet
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md font-sans">
                Enter your Google Account email address to connect and view your personal or operational schedule.
              </p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-glow-cyan active:scale-95 transition-all"
            >
              Connect Google Account
            </button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl overflow-hidden font-sans text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <CalendarIcon className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-100 uppercase tracking-wider">
                  Google Calendar Connection
                </span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCalendarEmail} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-400 text-[11px] uppercase mb-1 font-bold">
                  Google Account Email or Calendar ID
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="your-name@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  You can enter your personal Gmail address or any public Google Calendar ID.
                </p>
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-glow-cyan active:scale-95"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

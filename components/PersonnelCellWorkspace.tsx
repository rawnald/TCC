'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RecordItem, RecordCategory } from '@/types';
import {
  MilitaryProfile,
  MilitaryRank,
  AFPOSBranch,
  PersonnelStatus,
  PersonnelRemarks,
} from '@/types/personnel';
import { INITIAL_MILITARY_PROFILES } from '@/lib/personnelMockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import PersonnelProfileModal from './PersonnelProfileModal';
import {
  Users,
  UserCheck,
  Shield,
  ShieldAlert,
  Activity,
  FileText,
  Search,
  Filter,
  Plus,
  Crosshair,
  Award,
  Heart,
  Clock,
  Printer,
  Copy,
  Check,
  MapPin,
  Flame,
  Star,
  Download,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Layers,
  LayoutGrid,
  Table,
  RefreshCw,
  Building2,
  Image as ImageIcon,
  ExternalLink,
  Database,
} from 'lucide-react';

interface PersonnelCellWorkspaceProps {
  records?: RecordItem[];
  onSelectRecord?: (record: RecordItem) => void;
  onOpenCreate?: (category?: RecordCategory) => void;
  onSaveRecord?: (record: Partial<RecordItem>) => Promise<void> | void;
  onDeleteRecord?: (id: string) => Promise<void> | void;
  onRefreshData?: () => Promise<void> | void;
  dutyOfficer?: string;
  callsign?: string;
}

/**
 * Helper to identify enemy/HVT/threat profile records and strictly
 * prevent them from appearing in friendly Personnel Cell rosters.
 */
export function isEnemyProfileRecord(item: any): boolean {
  if (!item) return false;
  // Threat group or enemy flag properties
  if (item.threat_group || item.threat_group_other) return true;
  if (item.is_enemy_profile === true || item.is_hostile === true) return true;
  if (item.intel_type === 'enemy_profile') return true;
  if (item.true_name && !item.last_name) return true;
  // Metadata check
  const meta = item.metadata;
  if (meta) {
    if (meta.threat_group || meta.threat_group_other) return true;
    if (meta.is_enemy_profile === true || meta.is_hostile === true) return true;
    if (meta.intel_type === 'enemy_profile') return true;
    if (meta.psr !== undefined && meta.value !== undefined) return true;
    if (meta.latest_location_mgrs !== undefined && !meta.unit_office) return true;
  }
  // Code / ID prefix check
  const code = typeof item.code === 'string' ? item.code.toUpperCase() : '';
  if (code.startsWith('HVT-') || code.startsWith('DIB-') || code.startsWith('THREAT-')) return true;
  const id = typeof item.id === 'string' ? item.id.toLowerCase() : '';
  if (id.startsWith('hvt-') || id.startsWith('enemy-') || id.startsWith('threat-')) return true;
  return false;
}

export type PersonnelTab = 'roster' | 'perstat';

export default function PersonnelCellWorkspace({
  records = [],
  onSelectRecord,
  onOpenCreate,
  onSaveRecord,
  onDeleteRecord,
  onRefreshData,
  dutyOfficer = 'Capt. Rebecca Chen',
  callsign = 'SENTINEL-HQ',
}: PersonnelCellWorkspaceProps) {
  // Display ONLY profiles fetched from Supabase. Default to empty array.
  const [profiles, setProfiles] = useState<MilitaryProfile[]>([]);

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [rlsNotice, setRlsNotice] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');
  const [afposFilter, setAfposFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [remarksFilter, setRemarksFilter] = useState('all');

  // Modals state — Only PersonnelProfileModal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<MilitaryProfile | null>(null);

  // Load from Supabase on mount & purge any legacy localStorage cache
  useEffect(() => {
    try {
      localStorage.removeItem('personnel_profiles');
    } catch {}
    loadPersonnelProfiles();
  }, []);

  // Realtime Supabase Auto-Refresh: listen for postgres_changes on public.personnel_profiles and public.records
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const profileChannel = supabase
      .channel('personnel-profiles-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personnel_profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as MilitaryProfile;
            if (isEnemyProfileRecord(newRow)) return;

            setProfiles((prev) => {
              if (prev.some((p) => p.id === newRow.id)) {
                return prev.map((p) => (p.id === newRow.id ? newRow : p));
              }
              return [newRow, ...prev].filter((p) => !isEnemyProfileRecord(p));
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as MilitaryProfile;
            if (isEnemyProfileRecord(updated)) {
              setProfiles((prev) => prev.filter((p) => p.id !== updated.id));
              return;
            }

            setProfiles((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p)).filter((p) => !isEnemyProfileRecord(p))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setProfiles((prev) => prev.filter((p) => p.id !== deletedId));
          }
        }
      )
    // Refetch when the user returns to the dashboard tab instead of aggressive 10s polling
    const handleFocus = () => {
      loadPersonnelProfiles();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      supabase?.removeChannel(profileChannel);
    };
  }, []);

  const loadPersonnelProfiles = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setProfiles([]);
      setIsRefreshing(false);
      return;
    }

    setIsRefreshing(true);
    try {
      // 1. Query dedicated 'personnel_profiles' table in Supabase
      const { data: directData, error: directErr } = await supabase
        .from('personnel_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (directErr && (directErr.message?.includes('row-level security') || directErr.code === '42501')) {
        setRlsNotice(
          'Row-Level Security (RLS) policy is blocking access on public.personnel_profiles. Click "Copy Supabase SQL Fix" below and run it in your Supabase SQL Editor.'
        );
      }

      if (directData && !directErr && directData.length > 0) {
        // Exclude enemy profiles, keep strictly friendly military profiles
        const cleanProfiles = (directData as MilitaryProfile[]).filter((p) => !isEnemyProfileRecord(p));
        setProfiles(cleanProfiles);
        setSyncStatus('Connected to public.personnel_profiles');
        setRlsNotice(null);
        setIsRefreshing(false);
        return;
      }

      // 2. If dedicated table is empty or blocked by RLS, check 'records' table mirror (category='personnel')
      const { data: recData, error: recErr } = await supabase
        .from('records')
        .select('*')
        .eq('category', 'personnel')
        .order('created_at', { ascending: false });

      if (recData && !recErr && recData.length > 0) {
        // Strictly filter out enemy / HVT records
        const friendlyRecords = recData.filter((r: any) => !isEnemyProfileRecord(r));

        if (friendlyRecords.length > 0) {
          const mapped: MilitaryProfile[] = friendlyRecords.map((r: any) => {
            const meta = r.metadata || {};
            return {
              id: r.id,
              unit_office: meta.unit_office || r.location_name || '',
              rank: meta.rank || 'SGT',
              last_name: meta.last_name || r.title?.split(' ')[1] || r.title || '',
              first_name: meta.first_name || r.title?.split(' ')[2] || '',
              middle_name: meta.middle_name || '',
              serial_number: meta.serial_number || r.code || '',
              afpos: meta.afpos || 'INF',
              designation: meta.designation || r.description || '',
              address: meta.address || r.location_name || '',
              status: meta.status || (r.status === 'active' ? 'MWB' : 'Passes'),
              status_other: meta.status_other,
              remarks: meta.remarks || 'Active',
              remarks_other: meta.remarks_other,
              security_clearance_file: meta.security_clearance_file || null,
              soi_file: meta.soi_file || null,
              created_at: r.created_at,
              updated_at: r.updated_at,
            };
          });

          setProfiles(mapped);
          setSyncStatus('Synced via Supabase records table');
          setIsRefreshing(false);
          return;
        }
      }

      // 3. If no data exists in Supabase, strictly empty the table!
      setProfiles([]);
    } catch (err: any) {
      console.warn('Error loading personnel profiles from Supabase:', err);
      setProfiles([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Profile Save / Update Handler
  const handleSaveProfile = async (profileData: MilitaryProfile) => {
    // 1. Update React state immediately
    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === profileData.id);
      return exists
        ? prev.map((p) => (p.id === profileData.id ? profileData : p))
        : [profileData, ...prev];
    });

    // 2. Persist to Supabase
    if (isSupabaseConfigured() && supabase) {
      // A. Try inserting into dedicated 'personnel_profiles' table
      try {
        const { error: sbErr } = await supabase.from('personnel_profiles').upsert({
          id: profileData.id,
          unit_office: profileData.unit_office,
          rank: profileData.rank,
          last_name: profileData.last_name,
          first_name: profileData.first_name,
          middle_name: profileData.middle_name || '',
          serial_number: profileData.serial_number,
          afpos: profileData.afpos,
          designation: profileData.designation,
          address: profileData.address || '',
          status: profileData.status,
          remarks: profileData.remarks,
          security_clearance_file: profileData.security_clearance_file || null,
          soi_file: profileData.soi_file || null,
          created_at: profileData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (sbErr) {
          console.warn('Direct personnel_profiles upsert note:', sbErr.message);
          if (sbErr.message?.includes('row-level security') || sbErr.code === '42501') {
            setRlsNotice(
              'Row-Level Security (RLS) is blocking writes on public.personnel_profiles in Supabase. Click "Copy Supabase SQL Fix" below and run it in your Supabase SQL Editor to enable full access.'
            );
          }
        } else {
          setRlsNotice(null);
        }
      } catch (err: any) {
        console.warn('Direct personnel_profiles write notice:', err);
      }

      // B. ALSO mirror to standard 'records' table (category: 'personnel')
      // This ensures 100% persistence regardless of table structure!
      try {
        const recordMirror: RecordItem = {
          id: profileData.id,
          code: profileData.serial_number || `SN-${profileData.id.slice(0, 6)}`,
          title: `${profileData.rank} ${profileData.last_name}, ${profileData.first_name} ${profileData.middle_name || ''}`.trim(),
          category: 'personnel',
          description: `${profileData.designation} (${profileData.afpos}) — ${profileData.unit_office}`,
          status: profileData.remarks === 'Active' ? 'active' : 'closed',
          priority: profileData.status === 'Mission' ? 'high' : 'medium',
          lat: 7.22,
          lng: 124.24,
          location_name: profileData.address || profileData.unit_office,
          metadata: {
            ...profileData,
            intel_type: 'personnel_profile',
            is_enemy_profile: false,
            is_hostile: false,
          },
          created_at: profileData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await supabase.from('records').upsert([recordMirror]);
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.warn('Records mirror write notice:', err);
      }
    }
  };

  // Delete Profile
  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this military personnel record?')) return;

    setProfiles((prev) => prev.filter((p) => p.id !== id));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('personnel_profiles').delete().eq('id', id);
      } catch {}

      try {
        await supabase.from('records').delete().eq('id', id);
        if (onRefreshData) onRefreshData();
      } catch {}
    }
  };

  // Safe friendly military profiles only
  const friendlyProfiles = useMemo(() => {
    return profiles.filter((p) => !isEnemyProfileRecord(p));
  }, [profiles]);

  // Filter Options
  const unitOptions = useMemo(() => {
    const set = new Set<string>();
    friendlyProfiles.forEach((p) => {
      const u = p.unit_office || p.assigned_unit;
      if (u) set.add(u);
    });
    return Array.from(set);
  }, [friendlyProfiles]);

  // Filtered Profiles
  const filteredProfiles = useMemo(() => {
    return friendlyProfiles.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const u = p.unit_office || p.assigned_unit || '';
      const fullName = `${p.last_name || ''} ${p.first_name || ''} ${p.middle_name || ''} ${p.full_name || ''}`;

      const matchesSearch =
        !q ||
        fullName.toLowerCase().includes(q) ||
        p.serial_number.toLowerCase().includes(q) ||
        u.toLowerCase().includes(q) ||
        (p.afpos && p.afpos.toLowerCase().includes(q)) ||
        (p.designation && p.designation.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        (p.status && p.status.toLowerCase().includes(q)) ||
        (p.remarks && p.remarks.toLowerCase().includes(q));

      const matchesUnit = unitFilter === 'all' || u === unitFilter;
      const matchesRank = rankFilter === 'all' || p.rank === rankFilter;
      const matchesAfpos = afposFilter === 'all' || p.afpos === afposFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesRemarks = remarksFilter === 'all' || p.remarks === remarksFilter;

      return matchesSearch && matchesUnit && matchesRank && matchesAfpos && matchesStatus && matchesRemarks;
    });
  }, [friendlyProfiles, searchQuery, unitFilter, rankFilter, afposFilter, statusFilter, remarksFilter]);

  // Status Metrics
  const statusMetrics = useMemo(() => {
    const total = friendlyProfiles.length;
    const activeCount = friendlyProfiles.filter((p) => (p.remarks || 'Active').toLowerCase() === 'active').length;
    const mwbCount = friendlyProfiles.filter((p) => p.status === 'MWB').length;
    const missionCount = friendlyProfiles.filter((p) => p.status === 'Mission').length;
    const passesCount = friendlyProfiles.filter((p) => p.status === 'Passes').length;
    const schoolingCount = friendlyProfiles.filter((p) => p.status === 'Schooling').length;
    const rrstCount = friendlyProfiles.filter((p) => p.status === 'RRST').length;
    const dsCount = friendlyProfiles.filter((p) => p.status === 'DS').length;

    return {
      total,
      activeCount,
      mwbCount,
      missionCount,
      passesCount,
      schoolingCount,
      rrstCount,
      dsCount,
    };
  }, [friendlyProfiles]);

  // Status Badge Helper (Zoom Blue / Blue-Gray / Slate)
  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Mission':
        return { label: 'MISSION', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
      case 'MWB':
        return { label: 'MWB', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' };
      case 'Passes':
        return { label: 'PASSES', color: 'text-blue-800', bg: 'bg-blue-50/80 border-blue-200' };
      case 'Schooling':
        return { label: 'SCHOOLING', color: 'text-slate-800', bg: 'bg-slate-100 border-slate-300' };
      case 'RRST':
        return { label: 'RRST', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
      case 'DS':
        return { label: 'DS (DETACHED)', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' };
      default:
        return { label: st || 'MWB', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' };
    }
  };

  // Remarks Badge Helper (Zoom Blue / Blue-Gray / Slate)
  const getRemarksBadge = (rem: string) => {
    switch (rem) {
      case 'Active':
        return { label: 'Active', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200 font-semibold' };
      case 'Inactive':
        return { label: 'Inactive', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200' };
      case 'AWOL':
        return { label: 'AWOL', color: 'text-slate-900', bg: 'bg-slate-200 border-slate-300 font-bold' };
      case 'Discharge':
        return { label: 'Discharge', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' };
      case 'Honorable Discharge':
        return { label: 'Honorable Disch.', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200' };
      default:
        return { label: rem || 'Active', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' };
    }
  };

  return (
    <div className="space-y-4">
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── HEADER BANNER: G1 FORCE ACCOUNTABILITY & COMMAND STATS ──────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-sans font-bold text-slate-900 uppercase tracking-wide">
                  Personnel Cell (G1 / Admin)
                </h1>
               
              </div>
             
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditingProfile(null);
                setIsProfileModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Personnel Profile</span>
            </button>
            <button
              onClick={loadPersonnelProfiles}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors border border-slate-200 text-xs font-sans font-medium shadow-sm"
              title="Refresh from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Supabase'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors border border-slate-200 shadow-sm"
              title="Print Personnel Roster"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Supabase Row-Level Security (RLS) Warning Banner */}
      {rlsNotice && (
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-start space-x-2.5 text-slate-800">
            <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Supabase RLS Notice: </span>
              <span className="text-slate-600">{rlsNotice}</span>
            </div>
          </div>
          <button
            onClick={() => {
              const sql = `-- Run this in your Supabase SQL Editor to enable full client access:
ALTER TABLE public.personnel_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on personnel_profiles" ON public.personnel_profiles;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.personnel_profiles;

CREATE POLICY "Allow all operations on personnel_profiles"
ON public.personnel_profiles
FOR ALL
TO anon, authenticated, public
USING (true)
WITH CHECK (true);

DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.personnel_profiles; 
  END IF; 
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

NOTIFY pgrst, 'reload schema';`;
              navigator.clipboard.writeText(sql);
              setCopiedKey('sql-rls');
              setTimeout(() => setCopiedKey(null), 3000);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shrink-0 active:scale-95 shadow-sm"
          >
            {copiedKey === 'sql-rls' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'sql-rls' ? 'SQL Copied!' : 'Copy Supabase SQL Fix'}</span>
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── 4 FORCE STATUS METRIC TILES ─────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── 4 FORCE STATUS METRIC TILES ─────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">Total Personnel Records</div>
          <div className="text-2xl font-sans font-bold text-blue-600 mt-1">{statusMetrics.total}</div>
          <div className="text-xs font-sans text-slate-400 mt-0.5">Cataloged in Supabase</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">Operational Deployments</div>
          <div className="text-2xl font-sans font-bold text-blue-700 mt-1">{statusMetrics.missionCount}</div>
          <div className="text-xs font-sans text-slate-400 mt-0.5">Active Field Missions</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">MWB / Passes / RRST</div>
          <div className="text-2xl font-sans font-bold text-slate-800 mt-1">
            {statusMetrics.mwbCount + statusMetrics.passesCount + statusMetrics.rrstCount}
          </div>
          <div className="text-xs font-sans text-slate-400 mt-0.5">
            {statusMetrics.mwbCount} MWB • {statusMetrics.passesCount} Passes • {statusMetrics.rrstCount} RRST
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">Schooling / Detached Service</div>
          <div className="text-2xl font-sans font-bold text-slate-800 mt-1">
            {statusMetrics.schoolingCount + statusMetrics.dsCount}
          </div>
          <div className="text-xs font-sans text-slate-400 mt-0.5">
            {statusMetrics.schoolingCount} Schooling • {statusMetrics.dsCount} DS
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── SEARCH & MULTI-CRITERIA FILTER BAR ──────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search soldier name, serial #, unit, AFPOS, designation, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          {/* Unit / Office Filter */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white"
          >
            <option value="all">All Units / Offices</option>
            {unitOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          {/* Rank Filter */}
          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white"
          >
            <option value="all">All Ranks</option>
            {['PVT', 'PFC', 'CPL', 'SGT', 'SSG', 'TSg', 'MSgt', '1SG', 'SGM', 'CSM', '2LT', '1LT', 'CPT', 'MAJ', 'LTC', 'COL', 'BGEN', 'MGEN', 'LTGEN', 'GEN', 'Chr'].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* AFPOS Filter */}
          <select
            value={afposFilter}
            onChange={(e) => setAfposFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white"
          >
            <option value="all">All AFPOS</option>
            {['INF', 'FA', 'CAV', 'CE', 'MI', 'SC', 'FS', 'OS', 'QMS', 'AGS', 'CMO', 'N/A'].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white"
          >
            <option value="all">All Statuses</option>
            {['MWB', 'Passes', 'Mission', 'Schooling', 'RRST', 'DS'].map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Remarks Filter */}
          <select
            value={remarksFilter}
            onChange={(e) => setRemarksFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white"
          >
            <option value="all">All Remarks</option>
            {['Active', 'Inactive', 'Discharge', 'AWOL', 'Honorable Discharge'].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded text-xs font-sans transition-colors ${
              viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Data Table View"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded text-xs font-sans transition-colors ${
              viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── PERSONNEL DATA TABLE (WITH EDIT & DELETE BUTTONS ON RIGHT) ──────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold bg-slate-50">
                <th className="py-3 px-3">Rank & Full Name</th>
                <th className="py-3 px-3">Serial #</th>
                <th className="py-3 px-3">Unit / Office</th>
                <th className="py-3 px-3">AFPOS</th>
                <th className="py-3 px-3">Designation</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Remarks</th>
                <th className="py-3 px-3">Address</th>
                <th className="py-3 px-3 text-center">Files Attached</th>
                <th className="py-3 px-3 text-right sticky right-0 bg-slate-50 shadow-[-4px_0_6px_rgba(0,0,0,0.04)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400 font-sans text-xs">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-9 h-9 text-slate-300 mb-1" />
                      <p className="text-sm text-slate-700 font-bold">No personnel records found in Supabase.</p>
                      <p className="text-xs text-slate-400">The table is empty. Click &quot;+ Add Personnel Profile&quot; above to add personnel records to Supabase.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const statusBadge = getStatusBadge(p.status);
                  const remarksBadge = getRemarksBadge(p.remarks);
                  const hasClearance = !!p.security_clearance_file;
                  const hasSoi = !!p.soi_file;
                  const displayName = p.last_name
                    ? `${p.last_name}, ${p.first_name} ${p.middle_name || ''}`.trim()
                    : p.full_name || '—';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Rank & Full Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            {p.rank}
                          </span>
                          <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {displayName}
                          </span>
                        </div>
                      </td>

                      {/* Serial # */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1 font-semibold text-slate-700">
                          <span>{p.serial_number}</span>
                          <button
                            onClick={() => handleCopy(p.serial_number, `sn-${p.id}`)}
                            className="text-slate-400 hover:text-slate-600"
                            title="Copy Serial #"
                          >
                            {copiedKey === `sn-${p.id}` ? (
                              <Check className="w-3 h-3 text-blue-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Unit / Office */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium truncate max-w-[180px]">
                          {p.unit_office || p.assigned_unit || '—'}
                        </div>
                      </td>

                      {/* AFPOS */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.afpos || 'N/A'}
                        </span>
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[160px]">
                        {p.designation || p.position_role || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge.bg} ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${remarksBadge.bg} ${remarksBadge.color}`}>
                          {remarksBadge.label}
                        </span>
                      </td>

                      {/* Address */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] truncate max-w-[160px]">
                        {p.address || p.current_location || '—'}
                      </td>

                      {/* Files Attached (Security Clearance & SOI) */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {hasClearance && (
                            <a
                              href={p.security_clearance_file?.file_data || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                              title={`Security Clearance: ${p.security_clearance_file?.file_name}`}
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {hasSoi && (
                            <a
                              href={p.soi_file?.file_data || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                              title={`Summary of Information (SOI): ${p.soi_file?.file_name}`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {!hasClearance && !hasSoi && (
                            <span className="text-[11px] text-slate-400">None</span>
                          )}
                        </div>
                      </td>

                      {/* Right Portion Action Buttons (Edit & Delete) */}
                      <td className="py-3 px-3 text-right sticky right-0 bg-white shadow-[-4px_0_6px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingProfile(p);
                              setIsProfileModalOpen(true);
                            }}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
                            title="Edit Profile"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProfile(p.id)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-white space-y-3 shadow-sm">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-sans text-slate-500">No personnel records found in Supabase.</p>
          <button
            onClick={() => {
              setEditingProfile(null);
              setIsProfileModalOpen(true);
            }}
            className="text-xs font-sans text-blue-600 hover:underline font-bold"
          >
            + Add New Personnel Profile
          </button>
        </div>
      ) : (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProfiles.map((p) => {
            const statusBadge = getStatusBadge(p.status);
            const remarksBadge = getRemarksBadge(p.remarks);
            const displayName = p.last_name
              ? `${p.last_name}, ${p.first_name} ${p.middle_name || ''}`.trim()
              : p.full_name || '—';

            return (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-sm space-y-3 group"
              >
                {/* Header: Rank + Name + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-sans font-bold text-xs shrink-0 shadow-sm">
                      {p.rank}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-sans font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {p.rank} {displayName}
                      </div>
                      <div className="text-[11px] font-sans text-slate-500 font-medium mt-0.5">
                        SN: {p.serial_number}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border shrink-0 ${statusBadge.bg} ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                </div>

                {/* Unit & Designation */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs font-sans">
                  <div className="text-slate-800 font-medium truncate flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.unit_office || p.assigned_unit || '—'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="truncate">{p.designation || 'Operator'}</span>
                    <span className="text-blue-700 font-semibold shrink-0">{p.afpos || 'N/A'}</span>
                  </div>
                </div>

                {/* Remarks & Attached Files */}
                <div className="flex items-center justify-between text-[11px] font-sans">
                  <span className={`px-2 py-0.5 rounded border font-semibold ${remarksBadge.bg} ${remarksBadge.color}`}>
                    {remarksBadge.label}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {p.security_clearance_file && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                        Clearance
                      </span>
                    )}
                    {p.soi_file && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold">
                        SOI PDF
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-sans text-slate-500 truncate max-w-[150px]">
                    {p.address || 'Garrison HQ'}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        setEditingProfile(p);
                        setIsProfileModalOpen(true);
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-sans font-semibold transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(p.id)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── MODALS: ONLY PERSONNEL PROFILE MODAL ────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <PersonnelProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        initialProfile={editingProfile}
      />
    </div>
  );
}

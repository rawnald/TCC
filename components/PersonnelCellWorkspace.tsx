'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RecordItem, RecordCategory } from '@/types';
import {
  PersonnelTab,
  MilitaryProfile,
  MilitaryRank,
  AFPOSBranch,
  PersonnelStatus,
  PersonnelRemarks,
  UploadedDocumentFile,
  DLTRecord,
  DLTStatus,
  isUUID,
  generateUUID,
} from '@/types/personnel';
import { INITIAL_MILITARY_PROFILES } from '@/lib/personnelMockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import PersonnelProfileModal from './PersonnelProfileModal';
import DocumentViewerModal from './DocumentViewerModal';
import DLTRecordModal from './DLTRecordModal';
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
  Phone,
  Compass,
  Radio,
  Calendar,
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
 * Default fallback — empty for new DLT schema.
 * Records are added via the "Add DLT Record" modal and saved to Supabase.
 */
export const DEFAULT_DLT_RECORDS: DLTRecord[] = [];


/**
 * Helper to identify enemy/HVT/threat profile records and strictly
 * prevent them from appearing in friendly Personnel Cell rosters.
 */
export function isEnemyProfileRecord(item: any): boolean {
  if (!item) return false;
  if (item.threat_group || item.threat_group_other) return true;
  if (item.is_enemy_profile === true || item.is_hostile === true) return true;
  if (item.intel_type === 'enemy_profile') return true;
  if (item.true_name && !item.last_name) return true;
  const meta = item.metadata;
  if (meta) {
    if (meta.threat_group || meta.threat_group_other) return true;
    if (meta.is_enemy_profile === true || meta.is_hostile === true) return true;
    if (meta.intel_type === 'enemy_profile') return true;
    if (meta.psr !== undefined && meta.value !== undefined) return true;
    if (meta.latest_location_mgrs !== undefined && !meta.unit_office) return true;
  }
  const code = typeof item.code === 'string' ? item.code.toUpperCase() : '';
  if (code.startsWith('HVT-') || code.startsWith('DIB-') || code.startsWith('THREAT-')) return true;
  const id = typeof item.id === 'string' ? item.id.toLowerCase() : '';
  if (id.startsWith('hvt-') || id.startsWith('enemy-') || id.startsWith('threat-')) return true;
  return false;
}

/**
 * Helper to identify commissioned officers (2LT to General).
 * Personnel with ranks 2LT to General have their full name formatted in uppercase.
 */
export function isOfficerRank(rank: string): boolean {
  if (!rank) return false;
  const normalized = rank.trim().toUpperCase();
  const officerRanks = new Set([
    '2LT',
    '1LT',
    'CPT',
    'MAJ',
    'LTC',
    'COL',
    'BGEN',
    'MGEN',
    'LTGEN',
    'GEN',
    'SECOND LIEUTENANT',
    'FIRST LIEUTENANT',
    'CAPTAIN',
    'MAJOR',
    'LIEUTENANT COLONEL',
    'COLONEL',
    'BRIGADIER GENERAL',
    'MAJOR GENERAL',
    'LIEUTENANT GENERAL',
    'GENERAL',
  ]);
  return officerRanks.has(normalized);
}

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
  // ── Primary Workspace Tab: 'dlt' | 'personnel_profile' ──────────────────────
  const [activeTab, setActiveTab] = useState<PersonnelTab>('dlt');

  // ── Common States ──────────────────────────────────────────────────────────
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [rlsNotice, setRlsNotice] = useState<string | null>(null);

  // ── Dedicated DLT (Disposition & Location of Troops) States ────────────────
  const [dltRecords, setDltRecords] = useState<DLTRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('personnel_dlt_records');
      const parsed: DLTRecord[] = stored ? JSON.parse(stored) : [];
      if (parsed && parsed.length > 0) return parsed;
      return DEFAULT_DLT_RECORDS;
    } catch {
      return DEFAULT_DLT_RECORDS;
    }
  });

  const [dltViewMode, setDltViewMode] = useState<'table' | 'cards'>('table');
  const [dltSearchQuery, setDltSearchQuery] = useState('');
  const [dltStatusFilter, setDltStatusFilter] = useState('all');
  const [isDltModalOpen, setIsDltModalOpen] = useState(false);
  const [editingDltRecord, setEditingDltRecord] = useState<DLTRecord | null>(null);


  // ── Personnel Profiles States ──────────────────────────────────────────────
  const [profiles, setProfiles] = useState<MilitaryProfile[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');
  const [afposFilter, setAfposFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [remarksFilter, setRemarksFilter] = useState('all');

  // Modals state for Personnel Profiles
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<MilitaryProfile | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{
    file: UploadedDocumentFile;
    title: string;
    categoryLabel: string;
  } | null>(null);

  // Safe localStorage helper
  const safeLocalStorageSet = (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] QuotaExceededError writing key "${key}". Running recovery...`);
    }
  };

  // ── Load All Data on Mount ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.removeItem('personnel_profiles');
    } catch {}
    loadAllData();
  }, []);

  // ── Realtime Subscriptions for public.personnel_profiles & public.personnel_dlt
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    // 1. Profiles Realtime
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
      .subscribe();

    // 2. DLT Realtime (public.personnel_dlt)
    const dltChannel = supabase
      .channel('personnel-dlt-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personnel_dlt' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as DLTRecord;
            setDltRecords((prev) => {
              if (prev.some((d) => d.id === newRow.id)) {
                return prev.map((d) => (d.id === newRow.id ? newRow : d));
              }
              return [newRow, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as DLTRecord;
            setDltRecords((prev) =>
              prev.map((d) => (d.id === updated.id ? updated : d))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setDltRecords((prev) => prev.filter((d) => d.id !== deletedId));
          }
        }
      )
      .subscribe();

    const handleFocus = () => {
      loadAllData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      supabase?.removeChannel(profileChannel);
      supabase?.removeChannel(dltChannel);
    };
  }, []);

  const loadAllData = async () => {
    setIsRefreshing(true);
    await Promise.all([loadPersonnelProfiles(), loadDltRecords()]);
    setIsRefreshing(false);
  };

  // ── Load Personnel Profiles ────────────────────────────────────────────────
  const loadPersonnelProfiles = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setProfiles([]);
      return;
    }

    try {
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
        const cleanProfiles = (directData as any[])
          .filter((p) => !isEnemyProfileRecord(p))
          .map((p) => ({
            ...p,
            contact_number: p.contact_number || p.mobile_number || '',
            mobile_number: p.mobile_number || p.contact_number || '',
            status_other: p.status_other || '',
            remarks_other: p.remarks_other || '',
            picture_url: p.picture_url || '',
          }));
        setProfiles(cleanProfiles);
        setSyncStatus('Connected to Supabase');
        setRlsNotice(null);
        return;
      }

      setProfiles([]);
    } catch (err: any) {
      console.warn('Error loading personnel profiles from Supabase:', err);
      setProfiles([]);
    }
  };

  // ── Load Dedicated DLT Records (public.personnel_dlt) ──────────────────────
  const loadDltRecords = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      try {
        const stored = localStorage.getItem('personnel_dlt_records');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.length > 0) {
            setDltRecords(parsed);
            return;
          }
        }
      } catch {}
      setDltRecords(DEFAULT_DLT_RECORDS);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('personnel_dlt')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase personnel_dlt table query notice:', error.message);
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setRlsNotice(
            'Table "public.personnel_dlt" does not exist yet in Supabase. Click "Copy Supabase SQL Fix" below to copy the schema migration and run it in your Supabase SQL Editor.'
          );
        }
      }

      if (data && !error && data.length > 0) {
        setDltRecords(data as DLTRecord[]);
        safeLocalStorageSet('personnel_dlt_records', JSON.stringify(data));
      } else {
        const stored = localStorage.getItem('personnel_dlt_records');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.length > 0) setDltRecords(parsed);
          else setDltRecords(DEFAULT_DLT_RECORDS);
        } else {
          setDltRecords(DEFAULT_DLT_RECORDS);
        }
      }
    } catch (err) {
      console.warn('Error loading personnel_dlt from Supabase:', err);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── DLT Record Save / Update Handler ───────────────────────────────────────
  const handleSaveDltRecord = async (record: DLTRecord) => {
    const isEdit = dltRecords.some((d) => d.id === record.id);
    const updated = isEdit
      ? dltRecords.map((d) => (d.id === record.id ? record : d))
      : [record, ...dltRecords];
    setDltRecords(updated);
    safeLocalStorageSet('personnel_dlt_records', JSON.stringify(updated));

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('personnel_dlt').upsert([record]);
        if (error) {
          console.warn('Supabase personnel_dlt upsert notice:', error.message);
        }
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.warn('Supabase personnel_dlt sync exception:', err);
      }
    }
  };

  // ── DLT Record Delete Handler ──────────────────────────────────────────────
  const handleDeleteDltRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this troop disposition record?')) return;
    const updated = dltRecords.filter((d) => d.id !== id);
    setDltRecords(updated);
    safeLocalStorageSet('personnel_dlt_records', JSON.stringify(updated));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('personnel_dlt').delete().eq('id', id);
        if (onRefreshData) onRefreshData();
      } catch {}
    }
  };

  // ── Profile Save / Update Handler ──────────────────────────────────────────
  const handleSaveProfile = async (profileData: MilitaryProfile) => {
    const validId = profileData.id && isUUID(profileData.id) ? profileData.id : generateUUID();
    const updatedProfile = { ...profileData, id: validId };

    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === validId || p.id === profileData.id);
      return exists
        ? prev.map((p) => (p.id === validId || p.id === profileData.id ? updatedProfile : p))
        : [updatedProfile, ...prev];
    });

    if (isSupabaseConfigured() && supabase) {
      const dbPayload = {
        id: validId,
        unit_office: profileData.unit_office,
        rank: profileData.rank,
        last_name: profileData.last_name,
        first_name: profileData.first_name,
        middle_name: profileData.middle_name || '',
        serial_number: profileData.serial_number,
        afpos: profileData.afpos,
        designation: profileData.designation,
        address: profileData.address || '',
        contact_number: profileData.contact_number || profileData.mobile_number || '',
        mobile_number: profileData.mobile_number || profileData.contact_number || '',
        status: profileData.status,
        status_other: profileData.status_other || '',
        remarks: profileData.remarks,
        remarks_other: profileData.remarks_other || '',
        security_clearance_file: profileData.security_clearance_file || null,
        soi_file: profileData.soi_file || null,
        picture_url: profileData.picture_url || '',
        created_at: profileData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const { error: sbErr } = await supabase.from('personnel_profiles').upsert(dbPayload);

        if (sbErr) {
          console.error('Direct personnel_profiles upsert note:', sbErr.message);
          if (sbErr.message?.includes('row-level security') || sbErr.code === '42501') {
            setRlsNotice(
              'Row-Level Security (RLS) is blocking writes on public.personnel_profiles in Supabase. Click "Copy Supabase SQL Fix" below and run it in your Supabase SQL Editor to enable full access.'
            );
          }
        } else {
          setRlsNotice(null);
        }

        try {
          await supabase.from('records').delete().or(`id.eq.${validId},code.eq.${profileData.serial_number}`);
          if (profileData.id && profileData.id !== validId) {
            await supabase.from('records').delete().eq('id', profileData.id);
          }
          if (onRefreshData) onRefreshData();
        } catch (cleanErr) {
          console.warn('Historical records cleanup notice:', cleanErr);
        }
      } catch (err: any) {
        console.error('Direct personnel_profiles write notice:', err);
      }
    }
  };

  // ── Profile Delete Handler ─────────────────────────────────────────────────
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

  // Profile counts linked to each unit/battalion
  const profileCountByUnit = useMemo(() => {
    const map: Record<string, number> = {};
    friendlyProfiles.forEach((p) => {
      const u = (p.unit_office || p.assigned_unit || '').trim();
      if (u) {
        map[u] = (map[u] || 0) + 1;
      }
    });
    return map;
  }, [friendlyProfiles]);

  // ── DLT Filter Options & Filtered Records ───────────────────────────────────
  const filteredDltRecords = useMemo(() => {
    return dltRecords.filter((d) => {
      const q = dltSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.rank && d.rank.toLowerCase().includes(q)) ||
        (d.serial_number && d.serial_number.toLowerCase().includes(q)) ||
        (d.afpos && d.afpos.toLowerCase().includes(q)) ||
        (d.branch_of_service && d.branch_of_service.toLowerCase().includes(q)) ||
        (d.designation && d.designation.toLowerCase().includes(q)) ||
        (d.unit_name && d.unit_name.toLowerCase().includes(q)) ||
        (d.location && d.location.toLowerCase().includes(q)) ||
        (d.mgrs && d.mgrs.toLowerCase().includes(q)) ||
        (d.contact_number && d.contact_number.toLowerCase().includes(q)) ||
        (d.status && d.status.toLowerCase().includes(q));

      const matchesStatus = dltStatusFilter === 'all' || d.status === dltStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [dltRecords, dltSearchQuery, dltStatusFilter]);

  // ── DLT Reactive Summary (based on filteredDltRecords) ───────────────────
  const dltSummary = useMemo(() => {
    const totalOfficers = filteredDltRecords.reduce((s, d) => s + (d.officers_count || 0), 0);
    const totalEP = filteredDltRecords.reduce((s, d) => s + (d.ep_count || 0), 0);
    const totalCAA = filteredDltRecords.reduce((s, d) => s + (d.caa_count || 0), 0);
    const totalCE = filteredDltRecords.reduce((s, d) => s + (d.ce_count || 0), 0);
    const totalStrength = totalOfficers + totalEP + totalCAA + totalCE;

    const organicRecords = filteredDltRecords.filter((d) => d.status === 'Organic');
    const opconRecords = filteredDltRecords.filter((d) => d.status === 'Opcon');

    const totalOrganicStrength = organicRecords.reduce(
      (s, d) => s + (d.officers_count || 0) + (d.ep_count || 0) + (d.caa_count || 0) + (d.ce_count || 0),
      0
    );
    const totalOpconStrength = opconRecords.reduce(
      (s, d) => s + (d.officers_count || 0) + (d.ep_count || 0) + (d.caa_count || 0) + (d.ce_count || 0),
      0
    );

    return {
      totalOfficers,
      totalEP,
      totalCAA,
      totalCE,
      totalStrength,
      totalOrganicUnits: organicRecords.length,
      totalOpconUnits: opconRecords.length,
      totalOrganicStrength,
      totalOpconStrength,
    };
  }, [filteredDltRecords]);

  // DLT Status Badge Helper
  const getDltStatusBadge = (st: string) => {
    switch (st) {
      case 'Organic':
        return { label: 'ORGANIC', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
      case 'Opcon':
        return { label: 'OPCON', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
      default:
        return { label: st || '—', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' };
    }
  };



  // ── Personnel Profiles Filter Options ──────────────────────────────────────
  const unitOptions = useMemo(() => {
    const set = new Set<string>();
    dltRecords.forEach((d) => {
      if (d.unit_name) set.add(d.unit_name.trim());
    });
    friendlyProfiles.forEach((p) => {
      const u = p.unit_office || p.assigned_unit;
      if (u) set.add(u.trim());
    });
    return Array.from(set).sort();
  }, [dltRecords, friendlyProfiles]);

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
        (p.contact_number && p.contact_number.toLowerCase().includes(q)) ||
        (p.mobile_number && p.mobile_number.toLowerCase().includes(q)) ||
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

  // Personnel Profiles Status Metrics
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

  const getRemarksBadge = (rem: string) => {
    switch (rem) {
      case 'Active':
        return { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
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
      {/* ── HEADER BANNER ───────────────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              {activeTab === 'dlt' ? <Shield className="w-6 h-6" /> : <Users className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-sans font-bold text-slate-900 uppercase tracking-wide">
                  {activeTab === 'dlt'
                    ? 'Disposition and Location of Troops (DLT)'
                    : 'Personnel Profiles & Military Roster'}
                </h1>
               
              </div>
             
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'dlt' ? (
              <button
                onClick={() => {
                  setEditingDltRecord(null);
                  setIsDltModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Troop Disposition (DLT)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingProfile(null);
                  setIsProfileModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Personnel Profile</span>
              </button>
            )}

            <button
              onClick={loadAllData}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors border border-slate-200 text-xs font-sans font-medium shadow-sm cursor-pointer"
              title="Refresh from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Supabase'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors border border-slate-200 shadow-sm cursor-pointer"
              title="Print Current Roster"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── PERSONNEL WORKSPACE TABS: DLT & PERSONNEL PROFILE ───────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {/* Tab 1: DLT (Disposition & Location of Troops) */}
        <button
          onClick={() => setActiveTab('dlt')}
          className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer ${
            activeTab === 'dlt'
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Shield className={`w-4 h-4 ${activeTab === 'dlt' ? 'text-white' : 'text-blue-600'}`} />
          <span className="uppercase font-bold tracking-wide">DLT (Disposition & Location of Troops)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold ${
              activeTab === 'dlt'
                ? 'bg-blue-700/90 text-white'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {dltRecords.length} Stations
          </span>
        </button>

        {/* Tab 2: Personnel Profile */}
        <button
          onClick={() => setActiveTab('personnel_profile')}
          className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer ${
            activeTab === 'personnel_profile'
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'personnel_profile' ? 'text-white' : 'text-blue-600'}`} />
          <span className="uppercase font-bold tracking-wide">Personnel Profiles</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold ${
              activeTab === 'personnel_profile'
                ? 'bg-blue-700/90 text-white'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {friendlyProfiles.length} Profiles
          </span>
        </button>
      </div>

      {/* Supabase Notice Banner / SQL Setup Helper */}
      {rlsNotice && (
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-start space-x-2.5 text-slate-800">
            <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Supabase Notice: </span>
              <span className="text-slate-600">{rlsNotice}</span>
            </div>
          </div>
          <button
            onClick={() => {
              const sql = `-- Run this in your Supabase SQL Editor (new DLT schema):
CREATE TABLE IF NOT EXISTS public.personnel_dlt (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank               TEXT NOT NULL DEFAULT 'MAJ',
  name               TEXT NOT NULL,
  serial_number      TEXT NOT NULL DEFAULT '',
  afpos              TEXT NOT NULL DEFAULT 'INF',
  branch_of_service  TEXT NOT NULL DEFAULT 'PA',
  designation        TEXT NOT NULL DEFAULT '',
  unit_id            TEXT DEFAULT NULL,
  unit_name          TEXT NOT NULL DEFAULT '',
  location           TEXT NOT NULL DEFAULT '',
  mgrs               TEXT DEFAULT '',
  contact_number     TEXT DEFAULT '',
  officers_count     INTEGER NOT NULL DEFAULT 0,
  ep_count           INTEGER NOT NULL DEFAULT 0,
  caa_count          INTEGER NOT NULL DEFAULT 0,
  ce_count           INTEGER NOT NULL DEFAULT 0,
  date_assumption    DATE NOT NULL DEFAULT CURRENT_DATE,
  status             TEXT NOT NULL DEFAULT 'Organic',
  created_at         TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at         TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.personnel_dlt ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on personnel_dlt" ON public.personnel_dlt;
CREATE POLICY "Allow all operations on personnel_dlt" ON public.personnel_dlt FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.personnel_dlt; END IF; EXCEPTION WHEN duplicate_object THEN null; END $$;

NOTIFY pgrst, 'reload schema';`;
              navigator.clipboard.writeText(sql);
              setCopiedKey('sql-dlt');
              setTimeout(() => setCopiedKey(null), 3000);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shrink-0 active:scale-95 shadow-sm cursor-pointer"
          >
            {copiedKey === 'sql-dlt' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'sql-dlt' ? 'SQL Copied!' : 'Copy DLT Supabase SQL'}</span>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: DLT (DISPOSITION & LOCATION OF TROOPS) WORKSPACE ─────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dlt' && (
        <div className="space-y-4">

          {/* ── DLT Reactive Summary Tiles (update with every search/filter) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Tile 1: Total Strength Breakdown */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm col-span-2 lg:col-span-2">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Total Troops Strength
              </div>
              <div className="flex items-end space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-sans font-bold text-blue-700">{dltSummary.totalStrength.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Total</div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-center px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-sm font-bold text-blue-700">{dltSummary.totalOfficers}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Officer</div>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-sm font-bold text-slate-700">{dltSummary.totalEP}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">EP</div>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="text-sm font-bold text-amber-700">{dltSummary.totalCAA}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">CAA</div>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="text-sm font-bold text-purple-700">{dltSummary.totalCE}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">CE</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tile 2: Organic */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                Organic Units
              </div>
              <div className="text-2xl font-sans font-bold text-emerald-700 mt-1">
                {dltSummary.totalOrganicUnits}
              </div>
              <div className="text-xs font-sans text-slate-500 mt-0.5">
                Strength: {dltSummary.totalOrganicStrength.toLocaleString()}
              </div>
            </div>

            {/* Tile 3: Opcon */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                Opcon Units
              </div>
              <div className="text-2xl font-sans font-bold text-blue-600 mt-1">
                {dltSummary.totalOpconUnits}
              </div>
              <div className="text-xs font-sans text-slate-500 mt-0.5">
                Strength: {dltSummary.totalOpconStrength.toLocaleString()}
              </div>
            </div>
          </div>

          {/* DLT Search & Filter Toolbar */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name, rank, serial #, unit, location, MGRS, designation..."
                  value={dltSearchQuery}
                  onChange={(e) => setDltSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={dltStatusFilter}
                onChange={(e) => setDltStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="Organic">Organic</option>
                <option value="Opcon">Opcon</option>
              </select>

              {(dltSearchQuery || dltStatusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setDltSearchQuery('');
                    setDltStatusFilter('all');
                  }}
                  className="text-xs font-sans text-blue-600 hover:text-blue-800 font-medium px-2 py-1 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
              <button
                onClick={() => setDltViewMode('table')}
                className={`p-1.5 rounded text-xs font-sans transition-colors cursor-pointer ${
                  dltViewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDltViewMode('cards')}
                className={`p-1.5 rounded text-xs font-sans transition-colors cursor-pointer ${
                  dltViewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* DLT Table View */}
          {dltViewMode === 'table' ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold bg-slate-50">
                    <th className="py-3 px-3 whitespace-nowrap">Commander</th>
                    <th className="py-3 px-3 whitespace-nowrap">Serial # / AFPOS</th>
                    <th className="py-3 px-3 whitespace-nowrap">Branch</th>
                    <th className="py-3 px-3 whitespace-nowrap">Designation</th>
                    <th className="py-3 px-3 whitespace-nowrap">Unit</th>
                    <th className="py-3 px-3 whitespace-nowrap">Location / MGRS</th>
                    <th className="py-3 px-3 whitespace-nowrap">Contact #</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">Offr</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">EP</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">CAA</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">CE</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                    <th className="py-3 px-3 whitespace-nowrap">Date Assumption</th>
                    <th className="py-3 px-3 text-right sticky right-0 bg-slate-50 shadow-[-4px_0_6px_rgba(0,0,0,0.04)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredDltRecords.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-16 text-center text-slate-400 font-sans text-xs">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Shield className="w-9 h-9 text-slate-300 mb-1" />
                          <p className="text-sm text-slate-700 font-bold">No DLT records found.</p>
                          <p className="text-xs text-slate-400">
                            Click &quot;+ Add DLT Record&quot; above to add records.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDltRecords.map((d) => {
                      const statusBadge = getDltStatusBadge(d.status);
                      const rowTotal = (d.officers_count || 0) + (d.ep_count || 0) + (d.caa_count || 0) + (d.ce_count || 0);

                      return (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Commander */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 rounded-md border border-blue-200 bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                <Shield className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {d.rank} {d.name}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Serial # / AFPOS */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-mono text-slate-700">{d.serial_number || '—'}</div>
                            <div className="text-[11px] text-blue-600 font-semibold">{d.afpos}</div>
                          </td>

                          {/* Branch */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded border text-[10px] font-bold bg-slate-100 border-slate-200 text-slate-700">
                              {d.branch_of_service}
                            </span>
                          </td>

                          {/* Designation */}
                          <td className="py-3 px-3 text-slate-700 max-w-[140px] truncate" title={d.designation}>
                            {d.designation || '—'}
                          </td>

                          {/* Unit */}
                          <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                            {d.unit_name || '—'}
                          </td>

                          {/* Location / MGRS */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="text-slate-700 font-medium max-w-[160px] truncate" title={d.location}>
                              {d.location || '—'}
                            </div>
                            {d.mgrs && (
                              <div className="flex items-center space-x-1 mt-0.5">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-mono font-semibold">
                                  {d.mgrs}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(d.mgrs!, `dlt-mgrs-${d.id}`)}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors cursor-pointer"
                                  title="Copy MGRS"
                                >
                                  {copiedKey === `dlt-mgrs-${d.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Contact # */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                            {d.contact_number || '—'}
                          </td>

                          {/* Strength columns */}
                          <td className="py-3 px-3 text-right font-bold text-blue-600">{d.officers_count}</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-700">{d.ep_count}</td>
                          <td className="py-3 px-3 text-right text-amber-700 font-bold">{d.caa_count}</td>
                          <td className="py-3 px-3 text-right text-purple-700 font-bold">{d.ce_count}</td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap text-center">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                          </td>

                          {/* Date Assumption */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                            {d.date_assumption || '—'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right whitespace-nowrap sticky right-0 bg-white shadow-[-4px_0_6px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => {
                                  setEditingDltRecord(d);
                                  setIsDltModalOpen(true);
                                }}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-sans font-semibold transition-colors cursor-pointer"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteDltRecord(d.id)}
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                                title="Delete DLT Record"
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

                {/* Footer totals */}
                {filteredDltRecords.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 text-[11px] font-bold">
                      <td className="py-3 px-3 text-slate-700 uppercase tracking-wider" colSpan={7}>
                        TOTAL ({filteredDltRecords.length} Records)
                      </td>
                      <td className="py-3 px-3 text-right text-blue-600 font-bold">{dltSummary.totalOfficers}</td>
                      <td className="py-3 px-3 text-right text-slate-700 font-bold">{dltSummary.totalEP}</td>
                      <td className="py-3 px-3 text-right text-amber-700 font-bold">{dltSummary.totalCAA}</td>
                      <td className="py-3 px-3 text-right text-purple-700 font-bold">{dltSummary.totalCE}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : (
            /* DLT Cards Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDltRecords.map((d) => {
                const statusBadge = getDltStatusBadge(d.status);
                const rowTotal = (d.officers_count || 0) + (d.ep_count || 0) + (d.caa_count || 0) + (d.ce_count || 0);

                return (
                  <div
                    key={d.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition-all space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg border border-blue-200 bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-xs font-sans font-bold text-slate-900 leading-tight">
                            {d.rank} {d.name}
                          </h4>
                          <span className="text-[11px] font-sans text-slate-500 font-medium">{d.designation}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-sans font-semibold ${statusBadge.bg} ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-sans bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Serial #:</span>
                        <span className="font-mono font-semibold text-slate-800">{d.serial_number || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Branch:</span>
                        <span className="font-bold text-slate-700">{d.branch_of_service} / {d.afpos}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Unit:</span>
                        <span className="text-slate-800 font-medium truncate max-w-[160px]">{d.unit_name || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Location:</span>
                        <span className="text-slate-700 font-medium truncate max-w-[160px]">{d.location || '—'}</span>
                      </div>
                      {d.mgrs && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">MGRS:</span>
                          <span className="font-mono text-slate-800 font-semibold">{d.mgrs}</span>
                        </div>
                      )}
                      {d.contact_number && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Contact:</span>
                          <span className="font-mono text-slate-700">{d.contact_number}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Date Assumption:</span>
                        <span className="font-mono text-slate-700">{d.date_assumption || '—'}</span>
                      </div>
                    </div>

                    {/* Strength breakdown */}
                    <div className="grid grid-cols-5 gap-1 text-center text-xs font-sans">
                      <div className="p-1.5 rounded bg-blue-50 border border-blue-100">
                        <span className="text-[10px] text-slate-500 block">Offr</span>
                        <span className="text-xs font-bold text-blue-700">{d.officers_count}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">EP</span>
                        <span className="text-xs font-bold text-slate-800">{d.ep_count}</span>
                      </div>
                      <div className="p-1.5 rounded bg-amber-50 border border-amber-100">
                        <span className="text-[10px] text-slate-500 block">CAA</span>
                        <span className="text-xs font-bold text-amber-700">{d.caa_count}</span>
                      </div>
                      <div className="p-1.5 rounded bg-purple-50 border border-purple-100">
                        <span className="text-[10px] text-slate-500 block">CE</span>
                        <span className="text-xs font-bold text-purple-700">{d.ce_count}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-100 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Total</span>
                        <span className="text-xs font-bold text-slate-900">{rowTotal}</span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingDltRecord(d);
                          setIsDltModalOpen(true);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-sans font-semibold transition-colors cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDltRecord(d.id)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                        title="Delete DLT Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}



      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: PERSONNEL PROFILES WORKSPACE (ORIGINAL PERSONNEL CELL) ───── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'personnel_profile' && (
        <div className="space-y-4">
          {/* 4 Force Status Metric Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                Total Personnel Records
              </div>
              <div className="text-2xl font-sans font-bold text-blue-600 mt-1">{statusMetrics.total}</div>
              <div className="text-xs font-sans text-slate-400 mt-0.5">Cataloged in Supabase</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                Operational Deployments
              </div>
              <div className="text-2xl font-sans font-bold text-blue-700 mt-1">{statusMetrics.missionCount}</div>
              <div className="text-xs font-sans text-slate-400 mt-0.5">Active Field Missions</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                MWB / Passes / RRST
              </div>
              <div className="text-2xl font-sans font-bold text-slate-800 mt-1">
                {statusMetrics.mwbCount + statusMetrics.passesCount + statusMetrics.rrstCount}
              </div>
              <div className="text-xs font-sans text-slate-400 mt-0.5">
                {statusMetrics.mwbCount} MWB • {statusMetrics.passesCount} Passes • {statusMetrics.rrstCount} RRST
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                Schooling / Detached Service
              </div>
              <div className="text-2xl font-sans font-bold text-slate-800 mt-1">
                {statusMetrics.schoolingCount + statusMetrics.dsCount}
              </div>
              <div className="text-xs font-sans text-slate-400 mt-0.5">
                {statusMetrics.schoolingCount} Schooling • {statusMetrics.dsCount} DS
              </div>
            </div>
          </div>

          {/* Search & Multi-Criteria Filter Bar */}
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
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
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
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
              >
                <option value="all">All Ranks</option>
                {[
                  'PVT',
                  'PFC',
                  'CPL',
                  'SGT',
                  'SSG',
                  'TSg',
                  'MSgt',
                  '1SG',
                  'SGM',
                  'CSM',
                  '2LT',
                  '1LT',
                  'CPT',
                  'MAJ',
                  'LTC',
                  'COL',
                  'BGEN',
                  'MGEN',
                  'LTGEN',
                  'GEN',
                  'Chr',
                ].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {/* AFPOS Filter */}
              <select
                value={afposFilter}
                onChange={(e) => setAfposFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
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
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
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
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
              >
                <option value="all">All Remarks</option>
                {['Active', 'Inactive', 'Discharge', 'AWOL', 'Honorable Discharge'].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {(searchQuery || unitFilter !== 'all' || rankFilter !== 'all' || afposFilter !== 'all' || statusFilter !== 'all' || remarksFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setUnitFilter('all');
                    setRankFilter('all');
                    setAfposFilter('all');
                    setStatusFilter('all');
                    setRemarksFilter('all');
                  }}
                  className="text-xs font-sans text-blue-600 hover:text-blue-800 font-medium px-2 py-1 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs font-sans transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Data Table View"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded text-xs font-sans transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Personnel Profile Table View */}
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
                    <th className="py-3 px-3">Contact # / Mobile</th>
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
                      <td colSpan={11} className="py-16 text-center text-slate-400 font-sans text-xs">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="w-9 h-9 text-slate-300 mb-1" />
                          <p className="text-sm text-slate-700 font-bold">No personnel records found in Supabase.</p>
                          <p className="text-xs text-slate-400">
                            The table is empty. Click &quot;+ Add Personnel Profile&quot; above to add personnel records.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => {
                      const isOfficer = isOfficerRank(p.rank);
                      const fullNameRaw = `${p.last_name}, ${p.first_name} ${p.middle_name ? `${p.middle_name}.` : ''}`.trim();
                      const displayName = isOfficer ? fullNameRaw.toUpperCase() : fullNameRaw;
                      const statusBadge = getStatusBadge(p.status);
                      const remarksBadge = getRemarksBadge(p.remarks);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Rank & Full Name */}
                          <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                            <div className="flex items-center space-x-2.5">
                              {p.picture_url ? (
                                <img
                                  src={p.picture_url}
                                  alt={displayName}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                                  {p.first_name ? p.first_name.charAt(0) : 'P'}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-blue-600">{p.rank}</span>
                                  <span className={isOfficer ? 'font-bold uppercase tracking-wide text-slate-900' : 'text-slate-800'}>
                                    {displayName}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Serial # */}
                          <td className="py-3 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <span>{p.serial_number}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(p.serial_number, `sn-${p.id}`)}
                                className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors cursor-pointer"
                                title="Copy Serial Number"
                              >
                                {copiedKey === `sn-${p.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Unit / Office */}
                          <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-medium">
                            {p.unit_office || p.assigned_unit || '—'}
                          </td>

                          {/* AFPOS */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-[11px]">
                              {p.afpos || 'N/A'}
                            </span>
                          </td>

                          {/* Designation */}
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{p.designation || '—'}</td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${statusBadge.bg} ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                          </td>

                          {/* Remarks */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${remarksBadge.bg} ${remarksBadge.color}`}>
                              {remarksBadge.label}
                            </span>
                          </td>

                          {/* Contact # / Mobile */}
                          <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {p.mobile_number || p.contact_number || '—'}
                          </td>

                          {/* Address */}
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap max-w-[180px] truncate" title={p.address}>
                            {p.address || '—'}
                          </td>

                          {/* Attached Files (Clearance & SOI) */}
                          <td className="py-3 px-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {p.security_clearance_file && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDocument({
                                      file: p.security_clearance_file!,
                                      title: `Security Clearance — ${p.rank} ${p.last_name}, ${p.first_name}`,
                                      categoryLabel: 'Security Clearance',
                                    })
                                  }
                                  className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold hover:bg-blue-100 transition-colors flex items-center space-x-1 cursor-pointer"
                                  title={`View Security Clearance: ${p.security_clearance_file.file_name}`}
                                >
                                  <Shield className="w-3 h-3" />
                                  <span>Clearance</span>
                                </button>
                              )}
                              {p.soi_file && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDocument({
                                      file: p.soi_file!,
                                      title: `Summary of Information (SOI) — ${p.rank} ${p.last_name}, ${p.first_name}`,
                                      categoryLabel: 'Summary of Information (SOI)',
                                    })
                                  }
                                  className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold hover:bg-slate-200 transition-colors flex items-center space-x-1 cursor-pointer"
                                  title={`View Summary of Information (SOI): ${p.soi_file.file_name}`}
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>SOI PDF</span>
                                </button>
                              )}
                              {!p.security_clearance_file && !p.soi_file && (
                                <span className="text-slate-300 text-[10px]">—</span>
                              )}
                            </div>
                          </td>

                          {/* Actions: Edit & Delete */}
                          <td className="py-3 px-3 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/80 shadow-[-4px_0_6px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => {
                                  setEditingProfile(p);
                                  setIsProfileModalOpen(true);
                                }}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-sans font-semibold transition-colors cursor-pointer"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProfile(p.id)}
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                                title="Delete Record"
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
          ) : (
            /* Personnel Profile Card Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles.map((p) => {
                const isOfficer = isOfficerRank(p.rank);
                const fullNameRaw = `${p.last_name}, ${p.first_name} ${p.middle_name ? `${p.middle_name}.` : ''}`.trim();
                const displayName = isOfficer ? fullNameRaw.toUpperCase() : fullNameRaw;
                const statusBadge = getStatusBadge(p.status);
                const remarksBadge = getRemarksBadge(p.remarks);

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition-all space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        {p.picture_url ? (
                          <img
                            src={p.picture_url}
                            alt={displayName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                            {p.first_name ? p.first_name.charAt(0) : 'P'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-blue-600 text-xs font-sans">{p.rank}</span>
                            <span className={`text-xs font-sans ${isOfficer ? 'font-bold uppercase tracking-wide text-slate-900' : 'font-semibold text-slate-800'}`}>
                              {displayName}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 font-semibold block mt-0.5">
                            SN: {p.serial_number}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-sans font-semibold ${statusBadge.bg} ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-sans border-t border-slate-100 pt-2.5">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">Unit / Office:</span>
                        <span className="font-medium text-slate-800 truncate max-w-[170px]">{p.unit_office || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">AFPOS / Branch:</span>
                        <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                          {p.afpos || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">Designation:</span>
                        <span className="font-medium text-slate-800 truncate max-w-[170px]">{p.designation || '—'}</span>
                      </div>
                    </div>

                    {(p.mobile_number || p.contact_number) && (
                      <div className="flex items-center space-x-1.5 text-[11px] font-sans text-slate-600 bg-slate-50/60 px-2 py-1 rounded border border-slate-100">
                        <Phone className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="font-mono font-medium">{p.mobile_number || p.contact_number}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-sans">
                      <span className={`px-2 py-0.5 rounded border font-semibold ${remarksBadge.bg} ${remarksBadge.color}`}>
                        {remarksBadge.label}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        {p.security_clearance_file && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDocument({
                                file: p.security_clearance_file!,
                                title: `Security Clearance — ${p.rank} ${p.last_name}, ${p.first_name}`,
                                categoryLabel: 'Security Clearance',
                              })
                            }
                            className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold hover:bg-blue-100 transition-colors flex items-center space-x-1 cursor-pointer"
                            title={`View Security Clearance: ${p.security_clearance_file.file_name}`}
                          >
                            <Shield className="w-3 h-3" />
                            <span>Clearance</span>
                          </button>
                        )}
                        {p.soi_file && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDocument({
                                file: p.soi_file!,
                                title: `Summary of Information (SOI) — ${p.rank} ${p.last_name}, ${p.first_name}`,
                                categoryLabel: 'Summary of Information (SOI)',
                              })
                            }
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold hover:bg-slate-200 transition-colors flex items-center space-x-1 cursor-pointer"
                            title={`View Summary of Information (SOI): ${p.soi_file.file_name}`}
                          >
                            <FileText className="w-3 h-3" />
                            <span>SOI PDF</span>
                          </button>
                        )}
                      </div>
                    </div>

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
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-sans font-semibold transition-colors cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(p.id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── MODALS: DLT RECORD MODAL & PERSONNEL PROFILE & DOC VIEWER ───────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <DLTRecordModal
        isOpen={isDltModalOpen}
        onClose={() => setIsDltModalOpen(false)}
        onSave={handleSaveDltRecord}
        editingRecord={editingDltRecord}
      />

      <PersonnelProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        initialProfile={editingProfile}
      />

      <DocumentViewerModal
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        file={previewDocument?.file || null}
        title={previewDocument?.title}
        categoryLabel={previewDocument?.categoryLabel}
      />
    </div>
  );
}

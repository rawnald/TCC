'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RecordItem, RecordCategory, RecordStatus, RecordPriority } from '@/types';
import {
  PersonnelTab,
  MilitaryProfile,
  MilitaryRank,
  AFPOSBranch,
  PersonnelStatus,
  PersonnelRemarks,
  UploadedDocumentFile,
  isUUID,
  generateUUID,
} from '@/types/personnel';
import { INITIAL_MILITARY_PROFILES } from '@/lib/personnelMockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import PersonnelProfileModal from './PersonnelProfileModal';
import DocumentViewerModal from './DocumentViewerModal';
import ForceUnitModal, { ForceUnit } from './ForceUnitModal';
import TacticalMap from './TacticalMap';
import { toMGRS, parseMGRSToCoords, PRESET_AREA_COORDS } from '@/lib/mgrsUtils';
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
  ChevronUp,
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
  Navigation,
  Truck,
  Plane,
  Anchor,
  Radio,
  Map,
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
 * Initial fallback tactical force units for Central Mindanao / 6ID AOR.
 * Populated if neither Supabase nor localStorage contains force units yet.
 */
export const DEFAULT_DLT_FORCE_UNITS: ForceUnit[] = [
  {
    id: 'fu-601st-bde',
    battalion: '601st Infantry (Unifier) Brigade HQ',
    brigade: '6th Infantry Division',
    area: 'Sultan Kudarat',
    mgrs: '51NXH7821034500',
    logo_url: '',
    afp_officers: 28,
    afp_enlisted: 185,
    caa: 45,
    wavs_tavs: 4,
    air_assets: 0,
    vehicle: 18,
    naval_assets: 0,
    isr_asset: 2,
    artillery_asset: 0,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fu-602nd-bde',
    battalion: '602nd Infantry (Liberator) Brigade HQ',
    brigade: '6th Infantry Division',
    area: 'Cotabato',
    mgrs: '51NXH9120054300',
    logo_url: '',
    afp_officers: 24,
    afp_enlisted: 170,
    caa: 50,
    wavs_tavs: 4,
    air_assets: 0,
    vehicle: 16,
    naval_assets: 0,
    isr_asset: 1,
    artillery_asset: 0,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fu-603rd-bde',
    battalion: '603rd Infantry (Radical) Brigade HQ',
    brigade: '6th Infantry Division',
    area: 'Maguindanao del Norte',
    mgrs: '51NXH6543087650',
    logo_url: '',
    afp_officers: 26,
    afp_enlisted: 190,
    caa: 60,
    wavs_tavs: 6,
    air_assets: 0,
    vehicle: 20,
    naval_assets: 1,
    isr_asset: 2,
    artillery_asset: 0,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fu-6th-ib',
    battalion: '6th Infantry (Redskin) Battalion',
    brigade: '601st Infantry Brigade',
    area: 'Maguindanao del Sur',
    mgrs: '51NXH6659745322',
    logo_url: '',
    afp_officers: 32,
    afp_enlisted: 410,
    caa: 120,
    wavs_tavs: 8,
    air_assets: 0,
    vehicle: 24,
    naval_assets: 0,
    isr_asset: 1,
    artillery_asset: 2,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fu-7th-ib',
    battalion: '7th Infantry (Tapat) Battalion',
    brigade: '602nd Infantry Brigade',
    area: 'Cotabato',
    mgrs: '51NXH8234065430',
    logo_url: '',
    afp_officers: 30,
    afp_enlisted: 395,
    caa: 110,
    wavs_tavs: 6,
    air_assets: 0,
    vehicle: 22,
    naval_assets: 0,
    isr_asset: 1,
    artillery_asset: 2,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fu-33rd-ib',
    battalion: '33rd Infantry (Makabayan) Battalion',
    brigade: '601st Infantry Brigade',
    area: 'Sultan Kudarat',
    mgrs: '51NXH7432029870',
    logo_url: '',
    afp_officers: 31,
    afp_enlisted: 405,
    caa: 115,
    wavs_tavs: 6,
    air_assets: 0,
    vehicle: 25,
    naval_assets: 0,
    isr_asset: 1,
    artillery_asset: 0,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fu-6th-fab',
    battalion: '6th Field Artillery Battalion',
    brigade: '6th Infantry Division',
    area: 'Maguindanao del Norte',
    mgrs: '51NXH6432098760',
    logo_url: '',
    afp_officers: 22,
    afp_enlisted: 280,
    caa: 40,
    wavs_tavs: 4,
    air_assets: 0,
    vehicle: 28,
    naval_assets: 0,
    isr_asset: 1,
    artillery_asset: 18,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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

  // ── DLT (Disposition & Location of Troops) States ───────────────────────────
  const [forceUnits, setForceUnits] = useState<ForceUnit[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('force_units');
      const parsed: ForceUnit[] = stored ? JSON.parse(stored) : [];
      const logoCache = JSON.parse(localStorage.getItem('tactical_unit_logos') || '{}');
      if (parsed && parsed.length > 0) {
        return parsed.map((u) => ({
          ...u,
          logo_url: u.logo_url || logoCache[u.id] || (u.battalion ? logoCache[u.battalion] : '') || '',
        }));
      }
      return DEFAULT_DLT_FORCE_UNITS;
    } catch {
      return DEFAULT_DLT_FORCE_UNITS;
    }
  });

  const [dltViewMode, setDltViewMode] = useState<'table' | 'cards'>('table');
  const [dltSearchQuery, setDltSearchQuery] = useState('');
  const [dltBrigadeFilter, setDltBrigadeFilter] = useState('all');
  const [dltAreaFilter, setDltAreaFilter] = useState('all');
  const [showTacticalMap, setShowTacticalMap] = useState(true);
  const [isForceModalOpen, setIsForceModalOpen] = useState(false);
  const [editingForceUnit, setEditingForceUnit] = useState<ForceUnit | null>(null);

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
      try {
        if (key === 'force_units') {
          const parsed = JSON.parse(value);
          const slim = parsed.map((u: any) => ({
            ...u,
            logo_url: typeof u.logo_url === 'string' && u.logo_url.startsWith('data:') ? '' : u.logo_url,
          }));
          localStorage.setItem(key, JSON.stringify(slim));
        }
      } catch {}
    }
  };

  // ── Load All Data on Mount ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.removeItem('personnel_profiles');
    } catch {}
    loadAllData();
  }, []);

  // ── Realtime Subscriptions for public.personnel_profiles and public.force_units
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

    // 2. Force Units (DLT) Realtime
    const forceUnitChannel = supabase
      .channel('dlt-force-units-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'force_units' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as ForceUnit;
            setForceUnits((prev) => {
              if (prev.some((u) => u.id === newRow.id)) {
                return prev.map((u) => (u.id === newRow.id ? newRow : u));
              }
              return [newRow, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ForceUnit;
            setForceUnits((prev) =>
              prev.map((u) => (u.id === updated.id ? updated : u))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setForceUnits((prev) => prev.filter((u) => u.id !== deletedId));
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
      supabase?.removeChannel(forceUnitChannel);
    };
  }, []);

  const loadAllData = async () => {
    setIsRefreshing(true);
    await Promise.all([loadPersonnelProfiles(), loadForceUnits()]);
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
        setSyncStatus('Connected to public.personnel_profiles');
        setRlsNotice(null);
        return;
      }

      setProfiles([]);
    } catch (err: any) {
      console.warn('Error loading personnel profiles from Supabase:', err);
      setProfiles([]);
    }
  };

  // ── Load Force Units (DLT) ─────────────────────────────────────────────────
  const loadForceUnits = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      try {
        const stored = localStorage.getItem('force_units');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.length > 0) {
            setForceUnits(parsed);
            return;
          }
        }
      } catch {}
      setForceUnits(DEFAULT_DLT_FORCE_UNITS);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('force_units')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error && data.length > 0) {
        const logoCache = JSON.parse(localStorage.getItem('tactical_unit_logos') || '{}');
        const enriched: ForceUnit[] = data.map((u: any) => ({
          ...u,
          logo_url: u.logo_url || logoCache[u.id] || (u.battalion ? logoCache[u.battalion] : '') || '',
        }));
        setForceUnits(enriched);
        safeLocalStorageSet('force_units', JSON.stringify(enriched));
      } else {
        const stored = localStorage.getItem('force_units');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.length > 0) setForceUnits(parsed);
          else setForceUnits(DEFAULT_DLT_FORCE_UNITS);
        } else {
          setForceUnits(DEFAULT_DLT_FORCE_UNITS);
        }
      }
    } catch (err) {
      console.warn('Error loading force_units from Supabase:', err);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── DLT Unit Save / Update Handler ─────────────────────────────────────────
  const handleSaveForceUnit = async (unit: ForceUnit) => {
    const isEdit = forceUnits.some((u) => u.id === unit.id);
    const updated = isEdit
      ? forceUnits.map((u) => (u.id === unit.id ? unit : u))
      : [unit, ...forceUnits];
    setForceUnits(updated);
    safeLocalStorageSet('force_units', JSON.stringify(updated));

    if (unit.logo_url) {
      try {
        const rawCache = localStorage.getItem('tactical_unit_logos');
        const logoCache = rawCache ? JSON.parse(rawCache) : {};
        logoCache[unit.id] = unit.logo_url;
        if (unit.battalion && unit.battalion !== unit.id) {
          logoCache[unit.battalion] = unit.id;
        }
        safeLocalStorageSet('tactical_unit_logos', JSON.stringify(logoCache));
      } catch {}
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('force_units').upsert([unit]);
        if (error) {
          const { logo_url, ...cleanUnit } = unit;
          await supabase.from('force_units').upsert([cleanUnit]);
        }
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.warn('Supabase force_units sync exception:', err);
      }
    }
  };

  // ── DLT Unit Delete Handler ────────────────────────────────────────────────
  const handleDeleteForceUnit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this troop unit disposition?')) return;
    const updated = forceUnits.filter((u) => u.id !== id);
    setForceUnits(updated);
    safeLocalStorageSet('force_units', JSON.stringify(updated));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('force_units').delete().eq('id', id);
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

  // ── Computed Safe friendly military profiles only ──────────────────────────
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

  // ── DLT Computed Metrics ───────────────────────────────────────────────────
  const dltMetrics = useMemo(() => {
    const totalUnits = forceUnits.length;
    const officers = forceUnits.reduce((s, u) => s + (u.afp_officers || 0), 0);
    const enlisted = forceUnits.reduce((s, u) => s + (u.afp_enlisted || 0), 0);
    const caa = forceUnits.reduce((s, u) => s + (u.caa || 0), 0);
    const totalTroops = officers + enlisted + caa;
    const regularTroops = officers + enlisted;
    const wavsTavs = forceUnits.reduce((s, u) => s + (u.wavs_tavs || 0), 0);
    const vehicles = forceUnits.reduce((s, u) => s + (u.vehicle || 0), 0);
    const air = forceUnits.reduce((s, u) => s + (u.air_assets || 0), 0);
    const naval = forceUnits.reduce((s, u) => s + (u.naval_assets || 0), 0);
    const isr = forceUnits.reduce((s, u) => s + (u.isr_asset || 0), 0);
    const artillery = forceUnits.reduce((s, u) => s + (u.artillery_asset || 0), 0);
    const totalAssets = wavsTavs + vehicles + air + naval + isr + artillery;

    return {
      totalUnits,
      officers,
      enlisted,
      caa,
      totalTroops,
      regularTroops,
      wavsTavs,
      vehicles,
      air,
      naval,
      isr,
      artillery,
      totalAssets,
    };
  }, [forceUnits]);

  // ── DLT Filter Options ─────────────────────────────────────────────────────
  const dltBrigadeOptions = useMemo(() => {
    const set = new Set<string>();
    forceUnits.forEach((u) => {
      if (u.brigade) set.add(u.brigade.trim());
    });
    return Array.from(set).sort();
  }, [forceUnits]);

  const dltAreaOptions = useMemo(() => {
    const set = new Set<string>();
    forceUnits.forEach((u) => {
      if (u.area) set.add(u.area.trim());
    });
    return Array.from(set).sort();
  }, [forceUnits]);

  const filteredForceUnits = useMemo(() => {
    return forceUnits.filter((u) => {
      const q = dltSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.battalion && u.battalion.toLowerCase().includes(q)) ||
        (u.brigade && u.brigade.toLowerCase().includes(q)) ||
        (u.area && u.area.toLowerCase().includes(q)) ||
        (u.mgrs && u.mgrs.toLowerCase().includes(q));

      const matchesBrigade = dltBrigadeFilter === 'all' || u.brigade === dltBrigadeFilter;
      const matchesArea = dltAreaFilter === 'all' || u.area === dltAreaFilter;

      return matchesSearch && matchesBrigade && matchesArea;
    });
  }, [forceUnits, dltSearchQuery, dltBrigadeFilter, dltAreaFilter]);

  // ── DLT Tactical Map Records ───────────────────────────────────────────────
  const dltMapRecords: RecordItem[] = useMemo(() => {
    return filteredForceUnits.map((u) => {
      let lat = 7.0167;
      let lng = 124.5;
      if (u.mgrs) {
        const coords = parseMGRSToCoords(u.mgrs);
        if (coords) {
          lat = coords[0];
          lng = coords[1];
        }
      } else if (u.area && PRESET_AREA_COORDS[u.area]) {
        lat = PRESET_AREA_COORDS[u.area][0];
        lng = PRESET_AREA_COORDS[u.area][1];
      }

      const totalTroops = (u.afp_officers || 0) + (u.afp_enlisted || 0) + (u.caa || 0);

      return {
        id: `fu-${u.id}`,
        code: u.battalion || 'UNIT',
        title: `${u.battalion} (${u.brigade})`,
        category: 'units' as RecordCategory,
        status: 'active' as RecordStatus,
        priority: 'medium' as RecordPriority,
        lat,
        lng,
        location_name: u.area || 'AOR Station',
        description: `Force Disposition: ${u.battalion} / ${u.brigade}. Total Troops: ${totalTroops} (Officers: ${u.afp_officers || 0}, Enlisted: ${u.afp_enlisted || 0}, CAA: ${u.caa || 0}). Mobility/Assets: WAVs/TAVs: ${u.wavs_tavs || 0}, Vehicles: ${u.vehicle || 0}, Artillery: ${u.artillery_asset || 0}, ISR: ${u.isr_asset || 0}`,
        metadata: {
          mgrs: u.mgrs || (u.area && PRESET_AREA_COORDS[u.area] ? toMGRS(PRESET_AREA_COORDS[u.area][0], PRESET_AREA_COORDS[u.area][1]) : ''),
          is_force_unit: true,
          battalion: u.battalion,
          brigade: u.brigade,
          area: u.area,
          afp_officers: u.afp_officers,
          afp_enlisted: u.afp_enlisted,
          caa: u.caa,
          logo_url: u.logo_url,
        },
        created_at: u.created_at || new Date().toISOString(),
        updated_at: u.updated_at || new Date().toISOString(),
      };
    });
  }, [filteredForceUnits]);

  // ── Personnel Profiles Filter Options ──────────────────────────────────────
  const unitOptions = useMemo(() => {
    const set = new Set<string>();
    forceUnits.forEach((u) => {
      if (u.battalion) set.add(u.battalion.trim());
    });
    friendlyProfiles.forEach((p) => {
      const u = p.unit_office || p.assigned_unit;
      if (u) set.add(u.trim());
    });
    return Array.from(set).sort();
  }, [forceUnits, friendlyProfiles]);

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
                <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  G1 PERSONNEL
                </span>
              </div>
              <p className="text-xs font-sans text-slate-500 mt-0.5">
                {activeTab === 'dlt'
                  ? 'Battalion stations, brigade hierarchy, MGRS grid coordinates, troop strength breakdown & organic mobility assets.'
                  : 'Individual service member accountability, assigned billets, AFPOS branches, duty status & security clearances.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'dlt' ? (
              <button
                onClick={() => {
                  setEditingForceUnit(null);
                  setIsForceModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Unit / Troop Disposition</span>
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
            {forceUnits.length} Units
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

ALTER TABLE public.force_units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on force_units" ON public.force_units;
CREATE POLICY "Allow all operations on force_units"
ON public.force_units FOR ALL TO anon, authenticated, public
USING (true) WITH CHECK (true);

DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.personnel_profiles; 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.force_units; 
  END IF; 
EXCEPTION WHEN duplicate_object THEN null; 
END $$;

NOTIFY pgrst, 'reload schema';`;
              navigator.clipboard.writeText(sql);
              setCopiedKey('sql-rls');
              setTimeout(() => setCopiedKey(null), 3000);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shrink-0 active:scale-95 shadow-sm cursor-pointer"
          >
            {copiedKey === 'sql-rls' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'sql-rls' ? 'SQL Copied!' : 'Copy Supabase SQL Fix'}</span>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: DLT (DISPOSITION & LOCATION OF TROOPS) WORKSPACE ─────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dlt' && (
        <div className="space-y-4">
          {/* DLT Force Status Metric Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                Total Troop Strength
              </div>
              <div className="text-2xl font-sans font-bold text-blue-600 mt-1">
                {dltMetrics.totalTroops.toLocaleString()}
              </div>
              <div className="text-xs font-sans text-slate-500 mt-0.5">
                {dltMetrics.regularTroops.toLocaleString()} Regulars • {dltMetrics.caa.toLocaleString()} CAA
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                AFP Regular Forces
              </div>
              <div className="text-2xl font-sans font-bold text-blue-700 mt-1">
                {dltMetrics.regularTroops.toLocaleString()}
              </div>
              <div className="text-xs font-sans text-slate-500 mt-0.5">
                {dltMetrics.officers.toLocaleString()} Officers • {dltMetrics.enlisted.toLocaleString()} Enlisted
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                CAFGU Auxiliary (CAA)
              </div>
              <div className="text-2xl font-sans font-bold text-slate-800 mt-1">
                {dltMetrics.caa.toLocaleString()}
              </div>
              <div className="text-xs font-sans text-slate-500 mt-0.5">
                Active Force Multipliers in AOR
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                Organic Assets & Mobility
              </div>
              <div className="text-2xl font-sans font-bold text-slate-800 mt-1">
                {dltMetrics.totalAssets.toLocaleString()}
              </div>
              <div className="text-xs font-sans text-slate-500 mt-0.5">
                {dltMetrics.wavsTavs} WAVs/TAVs • {dltMetrics.vehicles} Veh • {dltMetrics.artillery} Art
              </div>
            </div>
          </div>

          {/* DLT Tactical Geolocation & Interactive Map Banner */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-sans font-bold text-slate-900 uppercase tracking-wide">
                  DLT Tactical Geolocation & Unit Stations (COP Map)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {dltMapRecords.length} Unit Stations Mapped
                </span>
              </div>
              <button
                onClick={() => setShowTacticalMap(!showTacticalMap)}
                className="flex items-center space-x-1 text-xs font-sans font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <span>{showTacticalMap ? 'Collapse Map' : 'Expand Map'}</span>
                {showTacticalMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showTacticalMap && (
              <div className="rounded-lg overflow-hidden border border-slate-200">
                <TacticalMap
                  records={dltMapRecords}
                  onSelectRecord={onSelectRecord}
                  isLive={true}
                  className="h-[280px] w-full"
                />
              </div>
            )}
          </div>

          {/* DLT Search & Filters Toolbar */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search battalion, brigade, station province, or MGRS grid..."
                  value={dltSearchQuery}
                  onChange={(e) => setDltSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Brigade Filter */}
              <select
                value={dltBrigadeFilter}
                onChange={(e) => setDltBrigadeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
              >
                <option value="all">All Brigades</option>
                {dltBrigadeOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Area / Province Filter */}
              <select
                value={dltAreaFilter}
                onChange={(e) => setDltAreaFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
              >
                <option value="all">All Provinces / Areas</option>
                {dltAreaOptions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              {(dltSearchQuery || dltBrigadeFilter !== 'all' || dltAreaFilter !== 'all') && (
                <button
                  onClick={() => {
                    setDltSearchQuery('');
                    setDltBrigadeFilter('all');
                    setDltAreaFilter('all');
                  }}
                  className="text-xs font-sans text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
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
                title="Data Table View"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDltViewMode('cards')}
                className={`p-1.5 rounded text-xs font-sans transition-colors cursor-pointer ${
                  dltViewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* DLT Units Data Table View */}
          {dltViewMode === 'table' ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold bg-slate-50">
                    <th className="py-3 px-3">Battalion / Unit</th>
                    <th className="py-3 px-3">Brigade / HQ</th>
                    <th className="py-3 px-3">Province / Area</th>
                    <th className="py-3 px-3">MGRS Grid</th>
                    <th className="py-3 px-3 text-right">Officers</th>
                    <th className="py-3 px-3 text-right">Enlisted</th>
                    <th className="py-3 px-3 text-right">CAA</th>
                    <th className="py-3 px-3 text-right font-bold text-blue-700">Total Troops</th>
                    <th className="py-3 px-3 text-center">Mobility</th>
                    <th className="py-3 px-3 text-center">Heavy Assets</th>
                    <th className="py-3 px-3 text-center">Assigned Profiles</th>
                    <th className="py-3 px-3 text-right sticky right-0 bg-slate-50 shadow-[-4px_0_6px_rgba(0,0,0,0.04)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredForceUnits.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-16 text-center text-slate-400 font-sans text-xs">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Shield className="w-9 h-9 text-slate-300 mb-1" />
                          <p className="text-sm text-slate-700 font-bold">No Troop Units found matching criteria.</p>
                          <p className="text-xs text-slate-400">
                            Click &quot;+ Add Unit / Troop Disposition&quot; above to register tactical units.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredForceUnits.map((u) => {
                      const totalTroops = (u.afp_officers || 0) + (u.afp_enlisted || 0) + (u.caa || 0);
                      const unitMgrs =
                        u.mgrs ||
                        (u.area && PRESET_AREA_COORDS[u.area]
                          ? toMGRS(PRESET_AREA_COORDS[u.area][0], PRESET_AREA_COORDS[u.area][1])
                          : '—');
                      const profileCount = profileCountByUnit[u.battalion] || 0;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Battalion / Unit */}
                          <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                            <div className="flex items-center space-x-2.5">
                              {u.logo_url ? (
                                <img
                                  src={u.logo_url}
                                  alt={u.battalion}
                                  className="w-8 h-8 rounded-md object-contain border border-slate-200 bg-slate-50 p-0.5 shrink-0 shadow-sm"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-md border border-blue-200 bg-blue-50/80 flex items-center justify-center text-blue-600 shrink-0">
                                  <Shield className="w-4 h-4 text-blue-600" />
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-slate-900 block">{u.battalion}</span>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {u.id.slice(0, 10)}</span>
                              </div>
                            </div>
                          </td>

                          {/* Brigade */}
                          <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-medium">{u.brigade}</td>

                          {/* Province / Area */}
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>{u.area || '—'}</span>
                            </div>
                          </td>

                          {/* MGRS Grid */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono">
                            <div className="flex items-center space-x-1.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-semibold">
                                {unitMgrs}
                              </span>
                              {unitMgrs !== '—' && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(unitMgrs, `mgrs-${u.id}`)}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                                  title="Copy MGRS"
                                >
                                  {copiedKey === `mgrs-${u.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Officers */}
                          <td className="py-3 px-3 text-right font-bold text-blue-600">{u.afp_officers}</td>

                          {/* Enlisted */}
                          <td className="py-3 px-3 text-right font-bold text-slate-700">{u.afp_enlisted}</td>

                          {/* CAA */}
                          <td className="py-3 px-3 text-right text-slate-700">{u.caa}</td>

                          {/* Total Troops */}
                          <td className="py-3 px-3 text-right font-bold text-blue-700 bg-blue-50/40">
                            {totalTroops.toLocaleString()}
                          </td>

                          {/* Mobility */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium">
                              {u.wavs_tavs || 0} WAV • {u.vehicle || 0} Veh
                            </span>
                          </td>

                          {/* Heavy Assets */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium">
                              {u.artillery_asset || 0} Art • {u.isr_asset || 0} ISR
                            </span>
                          </td>

                          {/* Assigned Profiles */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setUnitFilter(u.battalion);
                                setActiveTab('personnel_profile');
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold transition-colors cursor-pointer"
                              title={`View ${profileCount} personnel assigned to ${u.battalion}`}
                            >
                              <Users className="w-3 h-3" />
                              <span>{profileCount} Profiles</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/80 shadow-[-4px_0_6px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => {
                                  setEditingForceUnit(u);
                                  setIsForceModalOpen(true);
                                }}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-sans font-semibold transition-colors cursor-pointer"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteForceUnit(u.id)}
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                                title="Delete Unit Disposition"
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

                {/* Column Totals Footer */}
                {filteredForceUnits.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 text-[11px] font-bold">
                      <td className="py-3 px-3 text-slate-700 uppercase tracking-wider" colSpan={4}>
                        AOR TOTALS ({filteredForceUnits.length} Units)
                      </td>
                      <td className="py-3 px-3 text-right text-blue-600 font-bold">
                        {filteredForceUnits.reduce((s, u) => s + (u.afp_officers || 0), 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-bold">
                        {filteredForceUnits.reduce((s, u) => s + (u.afp_enlisted || 0), 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-bold">
                        {filteredForceUnits.reduce((s, u) => s + (u.caa || 0), 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-blue-700 font-bold bg-blue-100/40">
                        {filteredForceUnits
                          .reduce(
                            (s, u) => s + (u.afp_officers || 0) + (u.afp_enlisted || 0) + (u.caa || 0),
                            0
                          )
                          .toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700">
                        {filteredForceUnits.reduce((s, u) => s + (u.wavs_tavs || 0) + (u.vehicle || 0), 0)} Mob
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700">
                        {filteredForceUnits.reduce((s, u) => s + (u.artillery_asset || 0) + (u.isr_asset || 0), 0)} Hvy
                      </td>
                      <td className="py-3 px-3 text-center text-blue-700">
                        {friendlyProfiles.length} Total
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : (
            /* DLT Cards Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredForceUnits.map((u) => {
                const totalTroops = (u.afp_officers || 0) + (u.afp_enlisted || 0) + (u.caa || 0);
                const unitMgrs =
                  u.mgrs ||
                  (u.area && PRESET_AREA_COORDS[u.area]
                    ? toMGRS(PRESET_AREA_COORDS[u.area][0], PRESET_AREA_COORDS[u.area][1])
                    : '—');
                const profileCount = profileCountByUnit[u.battalion] || 0;

                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition-all space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        {u.logo_url ? (
                          <img
                            src={u.logo_url}
                            alt={u.battalion}
                            className="w-10 h-10 rounded-lg object-contain border border-slate-200 bg-slate-50 p-1 shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-blue-200 bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <Shield className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-sans font-bold text-slate-900 leading-tight">{u.battalion}</h4>
                          <span className="text-[11px] font-sans text-slate-500 font-medium">{u.brigade}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {totalTroops.toLocaleString()} Troops
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-sans bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Station / AOR</span>
                        <div className="flex items-center space-x-1 mt-0.5 text-slate-700 font-medium">
                          <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{u.area || 'Central Mindanao'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">MGRS Grid</span>
                        <div className="flex items-center space-x-1 mt-0.5 text-slate-800 font-mono text-[11px]">
                          <span>{unitMgrs}</span>
                        </div>
                      </div>
                    </div>

                    {/* Troop Strength Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-sans">
                      <div className="p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Officers</span>
                        <span className="text-sm font-bold text-blue-600">{u.afp_officers}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Enlisted</span>
                        <span className="text-sm font-bold text-slate-800">{u.afp_enlisted}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">CAA Aux</span>
                        <span className="text-sm font-bold text-slate-700">{u.caa}</span>
                      </div>
                    </div>

                    {/* Organic Equipment / Assets Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-sans text-slate-600">
                      {u.wavs_tavs > 0 && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px]">
                          🛡️ {u.wavs_tavs} WAV/TAV
                        </span>
                      )}
                      {u.vehicle > 0 && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px]">
                          🚛 {u.vehicle} Vehicles
                        </span>
                      )}
                      {u.artillery_asset > 0 && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold">
                          💥 {u.artillery_asset} Artillery
                        </span>
                      )}
                      {u.isr_asset > 0 && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold">
                          📡 {u.isr_asset} ISR
                        </span>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setUnitFilter(u.battalion);
                          setActiveTab('personnel_profile');
                        }}
                        className="text-xs font-sans text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{profileCount} Profiles Linked</span>
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            setEditingForceUnit(u);
                            setIsForceModalOpen(true);
                          }}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-sans font-semibold transition-colors cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteForceUnit(u.id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                          title="Delete Unit"
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
                  className="text-xs font-sans text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
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
                                className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
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
      {/* ── MODALS: FORCE UNIT (DLT) & PERSONNEL PROFILE & DOC VIEWER ───────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <ForceUnitModal
        isOpen={isForceModalOpen}
        onClose={() => setIsForceModalOpen(false)}
        onSave={handleSaveForceUnit}
        editingUnit={editingForceUnit}
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
